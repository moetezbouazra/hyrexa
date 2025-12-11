# YOLO AI Analysis UI Guide

## Overview
The Hyrexa platform now includes detailed AI analysis feedback using YOLO11 object detection model. Admins can see comprehensive AI analysis when reviewing waste reports and verifying cleanup activities.

## Features

### 1. Waste Report AI Analysis
When users submit waste reports, the first photo is automatically analyzed by the YOLO model. Admins see:

#### Display Components
- **Objects Detected**: Total count of waste items identified
- **Confidence Score**: Average confidence percentage across all detections
- **Waste Categories Breakdown**: Visual bars showing:
  - 🔵 Plastic (bottles, bags, containers)
  - 🟠 Paper (documents, cardboard)
  - ⚫ Metal (cans, foil)
  - 🔵 Glass (bottles, jars)
  - 🟢 Organic (food waste, leaves)
  - 🔴 Hazardous (chemicals, batteries)
  - 🟣 Electronics (devices, cables)
  - 🟠 Other (misc waste)

- **Detection Details**: List of individual detections with confidence scores
- **AI Recommendation**: Suggested severity level (1-5 scale)
- **Model Info**: YOLO version and processing time

#### Where to See It
**Admin Dashboard** → **Waste Reports Tab** → Click on any pending report

The AI analysis card appears between the photos and report details, showing a green-themed card with the YOLO brain icon.

---

### 2. Cleanup Verification AI Analysis
When users submit cleanup proof (before/after photos), the YOLO model:
1. Analyzes the "before" photo to count waste objects
2. Analyzes the "after" photo to count remaining objects
3. Compares the results to calculate cleanup effectiveness

#### Display Components
- **Objects Removed**: Number of waste items successfully cleaned
- **Confidence Score**: Model's certainty about the verification
- **Effectiveness Percentage**: Visual indicator showing cleanup quality:
  - 🟢 80%+ = Excellent Cleanup
  - 🟡 60-79% = Good Cleanup
  - 🟠 40-59% = Partial Cleanup
  - 🔴 <40% = Minimal Cleanup

- **Before vs After Comparison**:
  - Side-by-side stats showing object count reduction
  - Confidence scores for both analyses

- **AI Recommendation**: Textual feedback about the cleanup quality
- **Verification Badge**: Color-coded badge based on effectiveness

#### Where to See It
**Admin Dashboard** → **Cleanup Activities Tab** → Click on any pending cleanup

The AI verification card appears between the before/after photos and the points award section, showing a blue-themed card.

---

## Technical Details

### Data Flow

#### Waste Report Analysis
```
User uploads photos → Backend receives first photo
→ aiAnalysisService.analyzeWasteImage() called
→ YOLO model detects waste objects
→ Results stored in wasteReport.aiAnalysisData
→ Frontend displays in AIAnalysisDisplay component
```

#### Cleanup Verification
```
Admin clicks "Verify" → Backend fetches before/after photos
→ aiAnalysisService.verifyCleanup() called
→ YOLO analyzes both images
→ Calculates objects removed & effectiveness
→ Results stored in cleanupActivity.aiAnalysisData
→ Frontend displays comparison & recommendation
```

### API Response Format

#### Waste Report AI Data
```typescript
{
  "detections": [
    {
      "class": "plastic_bottle",
      "confidence": 0.92,
      "bbox": [100, 150, 50, 120]
    }
  ],
  "totalObjects": 3,
  "averageConfidence": 0.87,
  "wasteCategories": {
    "plastic": 2,
    "metal": 1,
    "other": 0
  },
  "suggestedSeverity": 3,
  "processingTime": 150,
  "modelVersion": "YOLO11n"
}
```

#### Cleanup Verification Data
```typescript
{
  "objectsRemoved": 5,
  "confidence": 0.89,
  "cleanupEffectiveness": 83,
  "recommendation": "Excellent cleanup! The area has been significantly improved.",
  "beforeAnalysis": {
    "totalObjects": 6,
    "averageConfidence": 0.85
  },
  "afterAnalysis": {
    "totalObjects": 1,
    "averageConfidence": 0.78
  }
}
```

---

## UI Components

### AIAnalysisDisplay Component
**Location**: `src/components/AIAnalysisDisplay.tsx`

**Props**:
- `aiData`: The AI analysis data object (can be waste report or verification data)
- `type`: Either `'waste-report'` or `'cleanup-verification'`

**Features**:
- Automatic detection of data type
- Graceful handling of missing data
- Animated progress bars for categories
- Color-coded effectiveness indicators
- Responsive grid layout

### Usage in Admin Dashboard
```tsx
// For waste reports
<AIAnalysisDisplay 
  aiData={report.aiAnalysisData || null} 
  type="waste-report" 
/>

// For cleanup verification
<AIAnalysisDisplay 
  aiData={cleanup.aiAnalysisData || null} 
  type="cleanup-verification" 
/>
```

---

## Model Information

### YOLO11n Configuration
- **Model File**: `server/models/yolo11n.onnx`
- **Input Size**: 640x640 pixels
- **Confidence Threshold**: 0.5 (50%)
- **Classes**: 8 waste categories
- **Backend**: ONNX Runtime Node.js

### Fallback Mode
If the YOLO model file is not available, the system uses **mock analysis** with realistic dummy data. This ensures the UI works even without the model file.

**Mock data includes**:
- 3 random detections (plastic bottle, plastic bag, can)
- Confidence scores: 80-95%
- Suggested severity: 3/5
- Model version shows: "YOLO11n (Mock)"

---

## Carbon Points Calculation

The AI analysis directly influences carbon points awarded:

```typescript
points = (basePoints + objectsBonus) × (1 + severityMultiplier) × confidenceMultiplier

Where:
- basePoints = 10
- objectsBonus = objectsRemoved × 5
- severityMultiplier = severity / 5
- confidenceMultiplier = AI confidence (0.0-1.0)
```

**Example**:
- Severity: 4/5
- Objects removed: 6
- AI confidence: 0.89

Points = (10 + 30) × (1 + 0.8) × 0.89 = **64 points**

---

## Testing the Feature

### 1. Test Waste Report Analysis
1. Log in as a regular user
2. Go to Map page
3. Click "Report Waste"
4. Upload a photo with waste
5. Submit the report
6. Log in as admin (admin/admin123)
7. Go to Admin Dashboard
8. Click on the pending report
9. **See the AI Analysis card** with detected objects

### 2. Test Cleanup Verification
1. As a user, find an approved waste report
2. Submit cleanup with before/after photos
3. Log in as admin
4. Go to Admin Dashboard → Cleanup Activities tab
5. Click on the pending cleanup
6. **See the AI Verification card** with effectiveness score
7. Notice the recommended points based on AI analysis

---

## Screenshots (Expected UI)

### Waste Report AI Analysis
```
┌────────────────────────────────────┐
│ 🧠 YOLO AI Analysis               │
├────────────────────────────────────┤
│  📦 Objects: 3    📊 Confidence: 87%│
│                                    │
│  ♻️ Plastic ████████░░ 2          │
│  🔩 Metal   ████░░░░░░ 1          │
│                                    │
│  Detection Details:                │
│  • Plastic Bottle (92% confident) │
│  • Plastic Bag (87% confident)    │
│  • Can (81% confident)            │
│                                    │
│  ⚠️ AI Recommendation              │
│  Suggested Severity: ▮▮▮░░        │
│                                    │
│  Model: YOLO11n • Processed in 150ms│
└────────────────────────────────────┘
```

### Cleanup Verification
```
┌────────────────────────────────────┐
│ 🧠 YOLO AI Verification           │
├────────────────────────────────────┤
│  Objects Removed: 5                │
│  Confidence: 89%                   │
│  Effectiveness: 83%                │
│                                    │
│  ✅ Excellent Cleanup              │
│  Based on before/after comparison  │
│                                    │
│  BEFORE vs AFTER                   │
│  ┌─────────┬─────────┐            │
│  │ BEFORE  │ AFTER   │            │
│  │ Obj: 6  │ Obj: 1  │            │
│  │ 85%     │ 78%     │            │
│  └─────────┴─────────┘            │
│                                    │
│  💡 AI Recommendation:             │
│  Excellent cleanup! The area has   │
│  been significantly improved.      │
│                                    │
│  Verified using YOLO11 model       │
└────────────────────────────────────┘
```

---

## Customization

### Adjust Confidence Threshold
Edit `server/src/services/aiAnalysisService.ts`:
```typescript
const detections = postprocessOutput(output, 0.5); // Change 0.5 to desired threshold
```

### Modify Category Colors
Edit `src/components/AIAnalysisDisplay.tsx`:
```typescript
const categoryColors: Record<string, string> = {
  plastic: 'bg-blue-500',  // Change to any Tailwind color
  // ...
};
```

### Adjust Points Formula
Edit `server/src/services/aiAnalysisService.ts`:
```typescript
export const calculateCarbonPoints = (severity, objectsRemoved, confidence) => {
  // Modify formula here
};
```

---

## Troubleshooting

### AI Analysis Not Showing
1. Check if `aiAnalysisData` field exists in database response
2. Verify the component is imported in AdminDashboard
3. Check browser console for errors
4. Ensure backend is returning JSON data (not null)

### Mock Data Instead of Real Analysis
- Model file not found at `server/models/yolo11n.onnx`
- Download YOLO11n ONNX model and place in models folder
- Check server logs for "YOLO model unavailable" message

### Points Not Calculating
- Verify AI analysis completed successfully
- Check `aiConfidenceScore` field in cleanup activity
- Review server logs for calculation errors

---

## Future Enhancements

- [ ] Show bounding boxes on photos
- [ ] Support multiple photo analysis
- [ ] Add waste weight estimation
- [ ] Real-time analysis progress indicator
- [ ] Historical accuracy tracking
- [ ] Admin override for AI suggestions
- [ ] Export AI analysis reports

---

## Related Files

**Frontend**:
- `src/components/AIAnalysisDisplay.tsx` - Main UI component
- `src/pages/AdminDashboard.tsx` - Integration point
- `src/types/index.ts` - TypeScript interfaces

**Backend**:
- `server/src/services/aiAnalysisService.ts` - YOLO integration
- `server/src/controllers/wasteReportController.ts` - Report analysis
- `server/src/controllers/cleanupController.ts` - Cleanup verification
- `server/prisma/schema.prisma` - Database schema

**Documentation**:
- `AI_YOLO_INTEGRATION.md` - Technical setup guide
- `AI_INTEGRATION_SUMMARY.md` - Overview document
