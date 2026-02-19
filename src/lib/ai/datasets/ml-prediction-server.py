#!/usr/bin/env python3
"""
Persistent ML Model Prediction Server

This server keeps the model loaded in memory to avoid reloading on every prediction.
Much faster than spawning a new Python process for each prediction.
"""

import sys
import json
import io
from pathlib import Path
import time

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

try:
    import joblib
    import numpy as np
    import pandas as pd
except ImportError as e:
    print(json.dumps({"error": f"Missing required library: {e}"}), file=sys.stderr)
    sys.exit(1)

# Global model cache
_model_cache = None
_feature_names_cache = None
_model_dir_cache = None


def load_model(model_dir: str = "models"):
    """Load the trained model and feature names (cached)."""
    global _model_cache, _feature_names_cache, _model_dir_cache
    
    # Return cached model if already loaded for this directory
    if _model_cache is not None and _model_dir_cache == model_dir:
        return _model_cache, _feature_names_cache
    
    model_path = Path(model_dir) / "match_compatibility_model.pkl"
    features_path = Path(model_dir) / "model_features.json"
    
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")
    if not features_path.exists():
        raise FileNotFoundError(f"Features file not found: {features_path}")
    
    print(f"[ML Server] Loading model from {model_path}...", file=sys.stderr)
    start_time = time.time()
    _model_cache = joblib.load(model_path)
    load_time = time.time() - start_time
    print(f"[ML Server] Model loaded in {load_time:.2f}s", file=sys.stderr)
    
    with open(features_path, 'r', encoding='utf-8') as f:
        feature_data = json.load(f)
    
    # Handle both list and dict formats
    if isinstance(feature_data, list):
        _feature_names_cache = feature_data
    elif isinstance(feature_data, dict) and 'features' in feature_data:
        _feature_names_cache = feature_data['features']
    elif isinstance(feature_data, dict) and 'value' in feature_data:
        _feature_names_cache = feature_data['value']
    else:
        raise ValueError(f"Unexpected feature names format: {type(feature_data)}")
    
    _model_dir_cache = model_dir
    return _model_cache, _feature_names_cache


def prepare_features(features_dict: dict, feature_names: list) -> pd.DataFrame:
    """Prepare features for prediction."""
    # Handle matchType encoding
    if 'matchType' in features_dict:
        match_type = features_dict.pop('matchType')
        features_dict['matchType_encoded'] = 0 if match_type == 'user_user' else 1
    
    # Create DataFrame with all features
    df = pd.DataFrame([features_dict])
    
    # Ensure all expected features are present, fill missing with 0
    for feature in feature_names:
        if feature not in df.columns:
            df[feature] = 0
    
    # Reorder columns to match training order
    df = df[feature_names]
    
    # Fill any NaN values with 0
    df = df.fillna(0)
    
    return df


def predict(features_dict: dict, model_dir: str = "models"):
    """Make a prediction using the cached model."""
    try:
        # Load model (cached after first call)
        model, feature_names = load_model(model_dir)
        
        # Prepare features
        features_df = prepare_features(features_dict.copy(), feature_names)
        
        # Make prediction
        probability = model.predict_proba(features_df)[0, 1]
        prediction = model.predict(features_df)[0]
        
        return {
            "success": True,
            "probability": float(probability),
            "prediction": int(prediction),
            "score": float(probability)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def main():
    """Main entry point - reads from stdin, writes to stdout."""
    try:
        # Read model directory from first argument or use default
        model_dir = sys.argv[1] if len(sys.argv) > 1 else "models"
        
        # Pre-load model on startup
        print("[ML Server] Starting ML prediction server...", file=sys.stderr)
        load_model(model_dir)
        print("[ML Server] Ready for predictions", file=sys.stderr)
        
        # Read features from stdin
        features_json = sys.stdin.read().strip()
        
        if not features_json:
            result = {
                "success": False,
                "error": "No features provided"
            }
            print(json.dumps(result))
            sys.exit(1)
        
        try:
            features_dict = json.loads(features_json)
        except json.JSONDecodeError as e:
            result = {
                "success": False,
                "error": f"Invalid JSON: {e}"
            }
            print(json.dumps(result))
            sys.exit(1)
        
        # Make prediction
        result = predict(features_dict, model_dir)
        
        # Output result as JSON
        print(json.dumps(result))
        
        # Exit with error code if prediction failed
        if not result.get("success", False):
            sys.exit(1)
            
    except Exception as e:
        result = {
            "success": False,
            "error": f"Unexpected error: {str(e)}"
        }
        print(json.dumps(result))
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
