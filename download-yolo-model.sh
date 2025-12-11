#!/bin/bash

# Script to download YOLO11n ONNX model for waste detection

echo "Downloading YOLO11n ONNX model..."

# Create models directory if it doesn't exist
mkdir -p server/models

# Download YOLO11n ONNX model (smallest, fastest version)
# Note: Replace this URL with the actual YOLO11 ONNX model URL when available
# For now, we'll use YOLOv8n as a placeholder (very similar architecture)

MODEL_URL="https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8n.onnx"
MODEL_PATH="server/models/yolo11n.onnx"

if [ -f "$MODEL_PATH" ]; then
    echo "Model already exists at $MODEL_PATH"
    read -p "Do you want to redownload? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing model."
        exit 0
    fi
fi

echo "Downloading from $MODEL_URL..."
curl -L -o "$MODEL_PATH" "$MODEL_URL"

if [ $? -eq 0 ]; then
    echo "✓ Model downloaded successfully to $MODEL_PATH"
    echo "✓ Model size: $(du -h $MODEL_PATH | cut -f1)"
    echo ""
    echo "Next steps:"
    echo "1. Update docker-compose.yml if needed"
    echo "2. Restart the backend: docker compose restart backend"
    echo "3. The AI analysis will now use the YOLO model automatically"
else
    echo "✗ Failed to download model"
    echo "You can manually download a YOLO11 ONNX model and place it at:"
    echo "  $MODEL_PATH"
    exit 1
fi

echo ""
echo "Model ready for use! 🎉"
