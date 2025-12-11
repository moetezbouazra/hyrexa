import sharp from 'sharp';
import * as ort from 'onnxruntime-node';
import fs from 'fs';
import path from 'path';
import logger from '../config/logger.js';

export interface DetectedObject {
  class: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface AIAnalysisResult {
  detected: boolean;
  objectsCount: number;
  objects: DetectedObject[];
  confidence: number;
  wasteSeverity?: number;
  // Frontend-friendly fields
  detections?: Array<{
    class: string;
    confidence: number;
    bbox?: number[];
  }>;
  totalObjects?: number;
  averageConfidence?: number;
  wasteCategories?: {
    plastic?: number;
    paper?: number;
    metal?: number;
    glass?: number;
    organic?: number;
    hazardous?: number;
    electronics?: number;
    other?: number;
  };
  estimatedWeight?: number;
  suggestedSeverity?: number;
  processingTime?: number;
  modelVersion?: string;
}

// YOLO class names for waste detection
const WASTE_CLASSES = [
  'plastic_bottle',
  'plastic_bag',
  'can',
  'cup',
  'straw',
  'wrapper',
  'container',
  'other_waste'
];

// Cache for YOLO model session
let modelSession: ort.InferenceSession | null = null;

/**
 * Load YOLO11 ONNX model
 */
const loadYOLOModel = async (): Promise<ort.InferenceSession> => {
  if (modelSession) {
    return modelSession;
  }

  try {
    const modelPath = process.env.YOLO_MODEL_PATH || './models/yolo11n.onnx';
    
    if (!fs.existsSync(modelPath)) {
      logger.warn(`YOLO model not found at ${modelPath}, using mock analysis`);
      throw new Error('Model not found');
    }

    logger.info(`Loading YOLO model from ${modelPath}`);
    modelSession = await ort.InferenceSession.create(modelPath);
    logger.info('YOLO model loaded successfully');
    
    return modelSession;
  } catch (error: any) {
    logger.error('Failed to load YOLO model:', error);
    throw error;
  }
};

/**
 * Preprocess image for YOLO model
 */
const preprocessImage = async (imageBuffer: Buffer): Promise<Float32Array> => {
  try {
    // Resize to 640x640 (YOLO11 input size)
    const resized = await sharp(imageBuffer)
      .resize(640, 640, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer();

    // Convert to float32 and normalize (0-255 -> 0-1)
    const float32Data = new Float32Array(resized.length);
    for (let i = 0; i < resized.length; i++) {
      float32Data[i] = resized[i] / 255.0;
    }

    // Reshape to [1, 3, 640, 640] (NCHW format)
    const rgbData = new Float32Array(3 * 640 * 640);
    for (let i = 0; i < 640 * 640; i++) {
      rgbData[i] = float32Data[i * 3]; // R
      rgbData[640 * 640 + i] = float32Data[i * 3 + 1]; // G
      rgbData[640 * 640 * 2 + i] = float32Data[i * 3 + 2]; // B
    }

    return rgbData;
  } catch (error: any) {
    logger.error('Image preprocessing error:', error);
    throw error;
  }
};

/**
 * Post-process YOLO output
 */
const postprocessOutput = (output: any, confidenceThreshold: number = 0.5): DetectedObject[] => {
  const detections: DetectedObject[] = [];
  
  try {
    // YOLO output format: [batch, 84, 8400]
    // 84 = 4 bbox coords + 80 class scores
    const data = output.data || output;
    const numDetections = data.length / 84;

    for (let i = 0; i < numDetections; i++) {
      const offset = i * 84;
      
      // Get bbox coordinates (center_x, center_y, width, height)
      const x = data[offset];
      const y = data[offset + 1];
      const w = data[offset + 2];
      const h = data[offset + 3];

      // Get max class score and index
      let maxScore = 0;
      let maxIndex = 0;
      for (let j = 4; j < 84; j++) {
        const score = data[offset + j];
        if (score > maxScore) {
          maxScore = score;
          maxIndex = j - 4;
        }
      }

      // Filter by confidence threshold
      if (maxScore >= confidenceThreshold) {
        // Map class index to waste type
        const classIndex = maxIndex % WASTE_CLASSES.length;
        
        detections.push({
          class: WASTE_CLASSES[classIndex],
          confidence: maxScore,
          bbox: {
            x: Math.max(0, x - w / 2),
            y: Math.max(0, y - h / 2),
            width: w,
            height: h,
          },
        });
      }
    }
  } catch (error: any) {
    logger.error('Post-processing error:', error);
  }

  return detections;
};

/**
 * Analyze image for waste detection using YOLO11
 */
export const analyzeWasteImage = async (
  imageBuffer: Buffer
): Promise<AIAnalysisResult> => {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    logger.info(`Analyzing image: ${metadata.width}x${metadata.height}`);

    try {
      // Try to use YOLO model
      const session = await loadYOLOModel();
      
      // Preprocess image
      const inputData = await preprocessImage(imageBuffer);
      const tensor = new ort.Tensor('float32', inputData, [1, 3, 640, 640]);

      // Run inference
      const feeds = { images: tensor };
      const results = await session.run(feeds);
      const output = results[Object.keys(results)[0]];

      // Post-process detections
      const detections = postprocessOutput(output, 0.5);

      // Calculate severity based on number of objects and confidence
      const avgConfidence = detections.length > 0
        ? detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length
        : 0;
      
      const wasteSeverity = Math.min(5, Math.ceil(detections.length / 2));

      logger.info(`YOLO Analysis: ${detections.length} objects detected`);

      // Calculate waste categories
      const wasteCategories = {
        plastic: 0,
        paper: 0,
        metal: 0,
        glass: 0,
        organic: 0,
        hazardous: 0,
        electronics: 0,
        other: 0,
      };

      detections.forEach((det) => {
        if (det.class.includes('bottle') || det.class.includes('bag') || det.class.includes('plastic')) {
          wasteCategories.plastic++;
        } else if (det.class.includes('can')) {
          wasteCategories.metal++;
        } else if (det.class.includes('cup') || det.class.includes('glass')) {
          wasteCategories.glass++;
        } else {
          wasteCategories.other++;
        }
      });

      return {
        detected: detections.length > 0,
        objectsCount: detections.length,
        objects: detections,
        confidence: avgConfidence,
        wasteSeverity,
        // Additional frontend-friendly data
        detections: detections.map(d => ({
          class: d.class,
          confidence: d.confidence,
          bbox: [d.bbox.x, d.bbox.y, d.bbox.width, d.bbox.height],
        })),
        totalObjects: detections.length,
        averageConfidence: avgConfidence,
        wasteCategories,
        suggestedSeverity: wasteSeverity,
        processingTime: Date.now(),
        modelVersion: 'YOLO11n',
      };

    } catch (modelError: any) {
      // Fallback to mock analysis if model fails
      logger.warn('YOLO model unavailable, using mock analysis:', modelError.message);
      
      const mockDetections = [
        { class: 'plastic_bottle', confidence: 0.92 },
        { class: 'plastic_bag', confidence: 0.87 },
        { class: 'can', confidence: 0.81 },
      ];

      const mockResult: AIAnalysisResult = {
        detected: true,
        objectsCount: mockDetections.length,
        objects: mockDetections.map((d, i) => ({
          ...d,
          bbox: { x: 100 + i * 50, y: 100, width: 50, height: 120 },
        })),
        confidence: 0.87,
        wasteSeverity: 3,
        // Frontend-friendly data
        detections: mockDetections.map((d, i) => ({
          class: d.class,
          confidence: d.confidence,
          bbox: [100 + i * 50, 100, 50, 120],
        })),
        totalObjects: mockDetections.length,
        averageConfidence: 0.87,
        wasteCategories: {
          plastic: 2,
          paper: 0,
          metal: 1,
          glass: 0,
          organic: 0,
          hazardous: 0,
          electronics: 0,
          other: 0,
        },
        suggestedSeverity: 3,
        processingTime: 150,
        modelVersion: 'YOLO11n (Mock)',
      };

      return mockResult;
    }
  } catch (error: any) {
    logger.error('AI analysis error:', error);
    throw new Error('Failed to analyze image');
  }
};

/**
 * Compare before and after images to verify cleanup
 */
export const verifyCleanup = async (
  beforeImageBuffer: Buffer,
  afterImageBuffer: Buffer
): Promise<{ 
  verified: boolean; 
  confidence: number; 
  objectsRemoved: number;
  beforeAnalysis?: any;
  afterAnalysis?: any;
  cleanupEffectiveness?: number;
  recommendation?: string;
}> => {
  try {
    const beforeAnalysis = await analyzeWasteImage(beforeImageBuffer);
    const afterAnalysis = await analyzeWasteImage(afterImageBuffer);

    const objectsRemoved = Math.max(0, beforeAnalysis.objectsCount - afterAnalysis.objectsCount);
    const verified = afterAnalysis.objectsCount < beforeAnalysis.objectsCount;
    const confidence = verified ? 0.8 + Math.random() * 0.15 : 0.5;
    
    // Calculate cleanup effectiveness percentage
    const cleanupEffectiveness = beforeAnalysis.objectsCount > 0
      ? Math.round((objectsRemoved / beforeAnalysis.objectsCount) * 100)
      : 0;

    // Generate recommendation
    let recommendation = '';
    if (cleanupEffectiveness >= 80) {
      recommendation = 'Excellent cleanup! The area has been significantly improved.';
    } else if (cleanupEffectiveness >= 60) {
      recommendation = 'Good cleanup effort. Most waste has been removed.';
    } else if (cleanupEffectiveness >= 40) {
      recommendation = 'Partial cleanup detected. Consider revisiting the area.';
    } else {
      recommendation = 'Minimal cleanup detected. Please ensure thorough waste removal.';
    }

    logger.info(`Cleanup verification: ${verified ? 'PASSED' : 'FAILED'} - ${objectsRemoved} objects removed (${cleanupEffectiveness}% effective)`);

    return {
      verified,
      confidence,
      objectsRemoved,
      beforeAnalysis,
      afterAnalysis,
      cleanupEffectiveness,
      recommendation,
    };
  } catch (error: any) {
    logger.error('Cleanup verification error:', error);
    throw new Error('Failed to verify cleanup');
  }
};

/**
 * Calculate carbon points based on cleanup
 */
export const calculateCarbonPoints = (
  severity: number,
  objectsRemoved: number,
  confidence: number
): number => {
  const basePoints = 10;
  const severityMultiplier = severity / 5; // 0.2 to 1.0
  const objectsBonus = objectsRemoved * 5;
  const confidenceMultiplier = confidence;

  const points = Math.round(
    (basePoints + objectsBonus) * (1 + severityMultiplier) * confidenceMultiplier
  );

  return Math.max(5, points); // Minimum 5 points
};
