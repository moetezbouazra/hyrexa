import { motion } from 'framer-motion';
import { Brain, CheckCircle, AlertTriangle, Package, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface AIDetection {
  class: string;
  confidence: number;
  bbox?: number[];
}

interface AIAnalysisData {
  detections?: AIDetection[];
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

interface VerificationData {
  beforeAnalysis?: AIAnalysisData;
  afterAnalysis?: AIAnalysisData;
  objectsRemoved?: number;
  confidence?: number;
  cleanupEffectiveness?: number;
  recommendation?: string;
}

interface AIAnalysisDisplayProps {
  aiData: AIAnalysisData | VerificationData | null;
  type: 'waste-report' | 'cleanup-verification';
}

export default function AIAnalysisDisplay({ aiData, type }: AIAnalysisDisplayProps) {
  // Debug: Log the data to see what we're receiving
  console.log('🔍 AIAnalysisDisplay - aiData:', aiData, 'type:', type);
  console.log('🔍 aiData type:', typeof aiData);
  console.log('🔍 aiData keys:', aiData ? Object.keys(aiData) : 'null');
  
  if (!aiData) {
    console.log('⚠️ aiData is null/undefined');
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm text-yellow-700">
            <Brain className="w-4 h-4" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-600">
            ⚠️ AI analysis not available for this report.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  if (typeof aiData === 'object' && Object.keys(aiData).length === 0) {
    console.log('⚠️ aiData is empty object');
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm text-yellow-700">
            <Brain className="w-4 h-4" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-600">
            ⚠️ AI analysis data is empty.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  console.log('✅ aiData exists, rendering analysis')

  if (type === 'waste-report') {
    return <WasteReportAnalysis aiData={aiData as AIAnalysisData} />;
  } else {
    return <CleanupVerificationAnalysis aiData={aiData as VerificationData} />;
  }
}

function WasteReportAnalysis({ aiData }: { aiData: AIAnalysisData }) {
  console.log('WasteReportAnalysis - received aiData:', aiData);
  
  const categoryColors: Record<string, string> = {
    plastic: 'bg-blue-500',
    paper: 'bg-amber-500',
    metal: 'bg-gray-500',
    glass: 'bg-cyan-500',
    organic: 'bg-green-500',
    hazardous: 'bg-red-500',
    electronics: 'bg-purple-500',
    other: 'bg-orange-500',
  };

  const categoryIcons: Record<string, string> = {
    plastic: '♻️',
    paper: '📄',
    metal: '🔩',
    glass: '🥃',
    organic: '🍂',
    hazardous: '☣️',
    electronics: '🔌',
    other: '📦',
  };

  const hasDetections = aiData.detections && aiData.detections.length > 0;
  const hasCategories = aiData.wasteCategories && Object.keys(aiData.wasteCategories).length > 0;
  
  // Show if we have any meaningful data
  const hasAnyData = aiData.totalObjects !== undefined || 
                     aiData.averageConfidence !== undefined || 
                     hasDetections || 
                     hasCategories;

  // If no meaningful data, show that AI analysis is pending
  if (!hasAnyData) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-yellow-800">
            <Brain className="w-5 h-5" />
            YOLO AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-700">
            ⏳ AI analysis is being processed or unavailable for this report.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-green-800">
          <Brain className="w-5 h-5" />
          YOLO AI Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
              <Package className="w-3 h-3" />
              Objects Detected
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {aiData.totalObjects || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
              <TrendingUp className="w-3 h-3" />
              Confidence
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {aiData.averageConfidence ? `${Math.round(aiData.averageConfidence * 100)}%` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Waste Categories */}
        {hasCategories && (
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Detected Waste Categories
            </h4>
            <div className="space-y-2">
              {Object.entries(aiData.wasteCategories!).map(([category, count]) => {
                if (count === 0) return null;
                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-lg">{categoryIcons[category] || '📦'}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium capitalize text-gray-700">
                          {category}
                        </span>
                        <span className="text-sm font-bold text-gray-900">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(count * 20, 100)}%` }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                          className={`h-full ${categoryColors[category] || 'bg-gray-400'}`}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Individual Detections */}
        {hasDetections && aiData.detections!.length > 0 && (
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Detection Details</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {aiData.detections!.slice(0, 10).map((detection, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                  <span className="font-medium text-gray-700 capitalize">
                    {detection.class.replace(/_/g, ' ')}
                  </span>
                  <span className="text-gray-600">
                    {Math.round(detection.confidence * 100)}% confident
                  </span>
                </div>
              ))}
              {aiData.detections!.length > 10 && (
                <p className="text-xs text-gray-500 pt-1">
                  + {aiData.detections!.length - 10} more detections
                </p>
              )}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        {aiData.suggestedSeverity !== undefined && (
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              AI Recommendation
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Suggested Severity:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-3 w-6 rounded ${
                      level <= aiData.suggestedSeverity! ? 'bg-red-500' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Model Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
          <span>Model: {aiData.modelVersion || 'YOLO11n'}</span>
          {aiData.processingTime && (
            <span>Processed in {aiData.processingTime}ms</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CleanupVerificationAnalysis({ aiData }: { aiData: VerificationData }) {
  const effectiveness = aiData.cleanupEffectiveness || 0;
  const confidence = aiData.confidence || 0;
  const objectsRemoved = aiData.objectsRemoved || 0;

  const getEffectivenessColor = (value: number) => {
    if (value >= 80) return 'text-green-600 bg-green-100';
    if (value >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getEffectivenessLabel = (value: number) => {
    if (value >= 80) return 'Excellent Cleanup';
    if (value >= 60) return 'Good Cleanup';
    if (value >= 40) return 'Partial Cleanup';
    return 'Minimal Cleanup';
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-blue-800">
          <Brain className="w-5 h-5" />
          YOLO AI Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 shadow-sm text-center">
            <div className="text-xs text-gray-600 mb-1">Objects Removed</div>
            <div className="text-2xl font-bold text-green-600">{objectsRemoved}</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm text-center">
            <div className="text-xs text-gray-600 mb-1">Confidence</div>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(confidence * 100)}%
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm text-center">
            <div className="text-xs text-gray-600 mb-1">Effectiveness</div>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(effectiveness)}%
            </div>
          </div>
        </div>

        {/* Effectiveness Badge */}
        <div className={`rounded-lg p-3 flex items-center gap-3 ${getEffectivenessColor(effectiveness)}`}>
          <CheckCircle className="w-6 h-6" />
          <div>
            <div className="font-bold text-sm">{getEffectivenessLabel(effectiveness)}</div>
            <div className="text-xs opacity-80">
              Based on before/after comparison
            </div>
          </div>
        </div>

        {/* Before/After Comparison */}
        {aiData.beforeAnalysis && aiData.afterAnalysis && (
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Before vs After Analysis</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">BEFORE</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Objects:</span>
                    <span className="text-sm font-bold text-red-600">
                      {aiData.beforeAnalysis.totalObjects || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Confidence:</span>
                    <span className="text-sm font-bold text-gray-700">
                      {aiData.beforeAnalysis.averageConfidence 
                        ? `${Math.round(aiData.beforeAnalysis.averageConfidence * 100)}%`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">AFTER</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Objects:</span>
                    <span className="text-sm font-bold text-green-600">
                      {aiData.afterAnalysis.totalObjects || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Confidence:</span>
                    <span className="text-sm font-bold text-gray-700">
                      {aiData.afterAnalysis.averageConfidence 
                        ? `${Math.round(aiData.afterAnalysis.averageConfidence * 100)}%`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Recommendation */}
        {aiData.recommendation && (
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              AI Recommendation
            </h4>
            <p className="text-sm text-gray-600">{aiData.recommendation}</p>
          </div>
        )}

        {/* Info Footer */}
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-200 text-center">
          Verified using YOLO11 object detection model
        </div>
      </CardContent>
    </Card>
  );
}
