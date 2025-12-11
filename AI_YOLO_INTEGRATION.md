# AI-Powered Waste Detection with YOLO11

## Overview

Hyrexa uses YOLO11 (You Only Look Once) deep learning model for automatic waste detection and cleanup verification. The AI analyzes photos to:

1. **Detect waste objects** in reported waste photos
2. **Calculate severity** based on the amount and type of waste
3. **Verify cleanup activities** by comparing before/after photos
4. **Award points** based on verified cleanup effectiveness

## Features

### ✅ Waste Report Analysis
- Automatically detects waste objects in submitted photos
- Identifies waste types: plastic bottles, bags, cans, cups, etc.
- Calculates severity score (1-5) based on waste amount
- Provides confidence scores for each detection
- Stores AI analysis data with each report

### ✅ Cleanup Verification
- Compares before and after photos
- Counts objects removed during cleanup
- Verifies cleanup effectiveness
- Calculates carbon points based on:
  - Waste severity
  - Number of objects removed
  - AI confidence level

### ✅ Fallback System
- If YOLO model is unavailable, uses mock analysis
- Ensures the app works even without the AI model
- No errors shown to users when model is missing

## Architecture

```
┌─────────────────┐
│  User uploads   │
│  waste photo    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  aiAnalysisService.ts       │
│  ┌───────────────────────┐  │
│  │ 1. Preprocess Image   │  │
│  │    - Resize to 640x640│  │
│  │    - Normalize pixels │  │
│  │    - Convert to tensor│  │
│  └──────────┬────────────┘  │
│             ▼               │
│  ┌───────────────────────┐  │
│  │ 2. YOLO11 Inference   │  │
│  │    - Run ONNX model   │  │
│  │    - Detect objects   │  │
│  └──────────┬────────────┘  │
│             ▼               │
│  ┌───────────────────────┐  │
│  │ 3. Post-process       │  │
│  │    - Filter by conf   │  │
│  │    - Extract bboxes   │  │
│  │    - Map classes      │  │
│  └──────────┬────────────┘  │
└─────────────┼───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Return Analysis Result     │
│  - Objects detected: 3      │
│  - Confidence: 0.87         │
│  - Severity: 3              │
│  - Bounding boxes           │
└─────────────────────────────┘
```

## Setup Instructions

### Option 1: Download Pre-trained Model (Recommended)

```bash
# Run the download script
./download-yolo-model.sh
```

This will:
- Create `server/models/` directory
- Download YOLOv8n ONNX model (~6MB)
- Verify the download

### Option 2: Use Your Own YOLO11 Model

1. Train or obtain a YOLO11 ONNX model
2. Place it at: `server/models/yolo11n.onnx`
3. Ensure the model:
   - Input: `[1, 3, 640, 640]` (batch, channels, height, width)
   - Output: `[1, 84, 8400]` (batch, bbox+classes, detections)

### Option 3: Custom Model Path

Set a custom path in your environment:

```bash
# In docker-compose.yml or .env
YOLO_MODEL_PATH=/path/to/your/model.onnx
```

## Configuration

### Environment Variables

**Backend** (`docker-compose.yml`):
```yaml
- YOLO_MODEL_PATH=./models/yolo11n.onnx  # Default path
```

### Detection Parameters

Edit `server/src/services/aiAnalysisService.ts`:

```typescript
// Adjust confidence threshold (default: 0.5)
const detections = postprocessOutput(output, 0.5);

// Modify waste classes
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
```

## How It Works

### 1. Waste Report Submission

```typescript
// User submits waste report with photos
POST /api/waste-reports
{
  photos: [...],
  location: {...},
  wasteType: "PLASTIC_BOTTLES"
}

// Backend automatically analyzes first photo
const aiAnalysis = await analyzeWasteImage(photoBuffer);

// Stores analysis with report
{
  detected: true,
  objectsCount: 3,
  objects: [
    {
      class: "plastic_bottle",
      confidence: 0.89,
      bbox: { x: 120, y: 100, width: 50, height: 120 }
    },
    // ... more detections
  ],
  confidence: 0.87,
  wasteSeverity: 3
}
```

### 2. Cleanup Verification

```typescript
// Admin approves cleanup
PATCH /api/cleanups/:id/approve

// Backend compares before/after photos
const verification = await verifyCleanup(
  beforePhotoBuffer,
  afterPhotoBuffer
);

// Calculates points based on verification
const points = calculateCarbonPoints(
  severity,           // Waste severity (1-5)
  objectsRemoved,     // Objects detected before - after
  confidence          // AI confidence level
);

// Awards points to user
user.carbonPoints += points;
```

### 3. Point Calculation Formula

```javascript
basePoints = 10
severityMultiplier = severity / 5  // 0.2 to 1.0
objectsBonus = objectsRemoved * 5
confidenceBonus = confidence * 10

totalPoints = Math.floor(
  (basePoints + objectsBonus) * 
  severityMultiplier * 
  (1 + confidenceBonus / 100)
)
```

## Model Details

### Input Requirements
- **Format**: RGB image
- **Size**: 640x640 pixels
- **Normalization**: 0-1 range (divide by 255)
- **Layout**: NCHW (batch, channels, height, width)

### Output Format
- **Shape**: `[1, 84, 8400]`
- **Content**: 
  - 4 bbox coordinates (center_x, center_y, width, height)
  - 80 class scores

### Performance
- **Inference time**: ~50-200ms (CPU)
- **Memory usage**: ~100MB
- **Model size**: ~6MB (YOLOv8n) to ~40MB (YOLOv8x)

## API Response Examples

### Waste Report with AI Analysis

```json
{
  "success": true,
  "data": {
    "wasteReport": {
      "id": "...",
      "latitude": 36.8065,
      "longitude": 10.1815,
      "wasteType": "PLASTIC_BOTTLES",
      "severity": 3,
      "aiAnalysisData": {
        "detected": true,
        "objectsCount": 4,
        "objects": [
          {
            "class": "plastic_bottle",
            "confidence": 0.89,
            "bbox": { "x": 120, "y": 100, "width": 50, "height": 120 }
          }
        ],
        "confidence": 0.87,
        "wasteSeverity": 3
      }
    }
  }
}
```

### Cleanup Verification

```json
{
  "success": true,
  "message": "Cleanup verified and approved",
  "data": {
    "cleanup": {
      "status": "APPROVED",
      "pointsAwarded": 45,
      "aiVerification": {
        "verified": true,
        "confidence": 0.82,
        "objectsRemoved": 4
      }
    }
  }
}
```

## Testing

### 1. Without YOLO Model (Mock Mode)
```bash
# Just start the backend - it will use mock analysis
docker compose up backend

# Submit a waste report - will work with random mock data
```

### 2. With YOLO Model
```bash
# Download model first
./download-yolo-model.sh

# Restart backend
docker compose restart backend

# Check logs to confirm model loaded
docker compose logs backend | grep "YOLO"
# Should see: "YOLO model loaded successfully"
```

### 3. Test API Endpoint
```bash
# Submit waste report with photo
curl -X POST http://localhost:5000/api/waste-reports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "latitude=36.8065" \
  -F "longitude=10.1815" \
  -F "wasteType=PLASTIC_BOTTLES" \
  -F "severity=3" \
  -F "photos[]=@test-image.jpg"
```

## Troubleshooting

### "YOLO model not found"
```
✗ Check: ls server/models/yolo11n.onnx
✓ Fix: Run ./download-yolo-model.sh
```

### "Failed to load YOLO model"
```
✗ Possible causes:
  - Model file corrupted
  - Wrong ONNX format
  - Incompatible ONNX Runtime version

✓ Fix: 
  1. Delete the model: rm server/models/yolo11n.onnx
  2. Re-download: ./download-yolo-model.sh
  3. Restart backend: docker compose restart backend
```

### "Model loaded but no detections"
```
✗ Check:
  - Confidence threshold too high
  - Image quality too low
  - Model not trained on waste objects

✓ Fix:
  1. Lower threshold in aiAnalysisService.ts
  2. Use better quality images for testing
  3. Consider fine-tuning model on waste dataset
```

### High Memory Usage
```
✗ ONNX Runtime using too much memory

✓ Fix:
  1. Use smaller model (yolo11n instead of yolo11x)
  2. Set memory limits in docker-compose.yml:
     deploy:
       resources:
         limits:
           memory: 2G
```

## Performance Optimization

### 1. Use GPU (Production)
```dockerfile
# In Dockerfile
RUN npm install onnxruntime-node-gpu

# In docker-compose.yml
services:
  backend:
    runtime: nvidia
    environment:
      - CUDA_VISIBLE_DEVICES=0
```

### 2. Batch Processing
```typescript
// Process multiple images in one inference
const tensor = new ort.Tensor('float32', batchData, [4, 3, 640, 640]);
```

### 3. Model Caching
Model is automatically cached after first load. No action needed.

## Future Improvements

- [ ] Fine-tune YOLO11 specifically on waste images
- [ ] Add more waste categories
- [ ] Implement waste classification (recyclable vs non-recyclable)
- [ ] Add image quality checks before analysis
- [ ] Batch processing for multiple reports
- [ ] GPU acceleration for faster inference
- [ ] Model quantization for smaller size
- [ ] Real-time video analysis

## References

- [YOLO11 Documentation](https://docs.ultralytics.com/)
- [ONNX Runtime Node.js](https://onnxruntime.ai/docs/get-started/with-javascript.html)
- [Ultralytics Models](https://github.com/ultralytics/ultralytics)

## Support

For issues or questions about AI integration:
1. Check logs: `docker compose logs backend | grep -i "yolo\|ai"`
2. Verify model exists: `ls -lh server/models/`
3. Test with mock mode first (no model)
4. Open an issue with error logs

---

**Note**: The app works perfectly fine without the YOLO model using mock analysis. The AI model is optional but provides better accuracy and verification.
