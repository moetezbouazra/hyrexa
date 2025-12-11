#!/usr/bin/env python3
"""
Script to download and export YOLOv8n model to ONNX format
"""

try:
    from ultralytics import YOLO
    import os
    
    print("Downloading YOLOv11n model...")
    model = YOLO('yolo11n.pt')
    
    print("Exporting to ONNX format...")
    model.export(format='onnx', imgsz=640, simplify=True)
    
    # Check if export was successful
    if os.path.exists('yolo11n.onnx'):
        print("✓ Model exported successfully to yolo11n.onnx")
        print(f"✓ Model size: {os.path.getsize('yolo11n.onnx') / (1024*1024):.1f} MB")
    else:
        print("✗ Export failed - yolo11n.onnx not found")
        
except ImportError:
    print("Error: ultralytics package not installed")
    print("Please install it with: pip install ultralytics")
    exit(1)
except Exception as e:
    print(f"Error: {e}")
    exit(1)
