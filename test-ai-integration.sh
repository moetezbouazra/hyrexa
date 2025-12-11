#!/bin/bash

# Quick test script for YOLO AI integration

echo "🧪 Testing YOLO AI Integration..."
echo ""

# Check if backend is running
echo "1. Checking if backend is running..."
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "   ✓ Backend is running"
else
    echo "   ✗ Backend is not running"
    echo "   Start it with: docker compose up backend"
    exit 1
fi

# Check if model exists
echo ""
echo "2. Checking for YOLO model..."
if [ -f "server/models/yolo11n.onnx" ]; then
    MODEL_SIZE=$(du -h server/models/yolo11n.onnx | cut -f1)
    echo "   ✓ Model found (size: $MODEL_SIZE)"
else
    echo "   ⚠ Model not found - using mock analysis"
    echo "   Download with: ./download-yolo-model.sh"
fi

# Check backend logs for YOLO
echo ""
echo "3. Checking backend logs..."
if docker compose logs backend 2>/dev/null | grep -q "YOLO"; then
    echo "   ✓ YOLO integration detected in logs"
    docker compose logs backend 2>/dev/null | grep "YOLO" | tail -3
else
    echo "   ℹ No YOLO logs found yet"
fi

# Check if onnxruntime-node is installed
echo ""
echo "4. Checking dependencies..."
if [ -d "server/node_modules/onnxruntime-node" ]; then
    echo "   ✓ onnxruntime-node is installed"
else
    echo "   ✗ onnxruntime-node not found"
    echo "   Install with: cd server && npm install"
fi

echo ""
echo "=================================="
echo "Summary:"
echo ""

if [ -f "server/models/yolo11n.onnx" ]; then
    echo "✓ YOLO AI is ready to use!"
    echo ""
    echo "The AI will automatically:"
    echo "  • Detect waste objects in photos"
    echo "  • Calculate severity scores"
    echo "  • Verify cleanup activities"
    echo "  • Award points based on AI analysis"
else
    echo "⚠ YOLO model not found - using mock mode"
    echo ""
    echo "The app works fine in mock mode, but for real AI:"
    echo "  Run: ./download-yolo-model.sh"
    echo "  Then: docker compose restart backend"
fi

echo ""
echo "Test a waste report:"
echo "  1. Login to http://localhost:5173"
echo "  2. Submit a waste report with photos"
echo "  3. Check the response for aiAnalysisData"
echo ""
