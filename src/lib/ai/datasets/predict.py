#!/usr/bin/env python3
"""
ML Model Prediction Service

This script loads the trained XGBoost model and makes predictions on compatibility features.
Can be called via command line (stdin/stdout) or HTTP API.
"""

import sys
import json
import argparse
from pathlib import Path
import io

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


def load_model(model_dir: str = "models"):
    """Load the trained model and feature names."""
    model_path = Path(model_dir) / "match_compatibility_model.pkl"
    features_path = Path(model_dir) / "model_features.json"
    
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")
    if not features_path.exists():
        raise FileNotFoundError(f"Features file not found: {features_path}")
    
    model = joblib.load(model_path)
    
    with open(features_path, 'r', encoding='utf-8') as f:
        feature_data = json.load(f)
    
    # Handle both list and dict formats
    if isinstance(feature_data, list):
        feature_names = feature_data
    elif isinstance(feature_data, dict) and 'features' in feature_data:
        feature_names = feature_data['features']
    elif isinstance(feature_data, dict) and 'value' in feature_data:
        feature_names = feature_data['value']
    else:
        raise ValueError(f"Unexpected feature names format: {type(feature_data)}")
    
    return model, feature_names


def prepare_features(features_dict: dict, feature_names: list) -> pd.DataFrame:
    """
    Prepare features for prediction.
    
    Args:
        features_dict: Dictionary with feature values
        feature_names: List of expected feature names in order
        
    Returns:
        DataFrame with features in the correct order
    """
    # Handle matchType encoding (0 for user_user, 1 for user_group)
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
    """
    Make a prediction using the trained model.
    
    Args:
        features_dict: Dictionary with compatibility features
        model_dir: Directory containing the model files
        
    Returns:
        Dictionary with prediction results
    """
    try:
        # Load model
        model, feature_names = load_model(model_dir)
        
        # Prepare features
        features_df = prepare_features(features_dict.copy(), feature_names)
        
        # Make prediction
        probability = model.predict_proba(features_df)[0, 1]  # Probability of class 1 (accept)
        prediction = model.predict(features_df)[0]  # Binary prediction
        
        return {
            "success": True,
            "probability": float(probability),
            "prediction": int(prediction),
            "score": float(probability)  # Use probability as compatibility score
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def main():
    """Main entry point for command-line usage."""
    try:
        parser = argparse.ArgumentParser(
            description="ML Model Prediction Service"
        )
        parser.add_argument(
            "--model-dir",
            type=str,
            default="models",
            help="Directory containing model files (default: models)"
        )
        parser.add_argument(
            "--features",
            type=str,
            help="JSON string with features (alternative to stdin)"
        )
        
        args = parser.parse_args()
        
        # Read features from stdin or --features argument
        if args.features:
            features_json = args.features
        else:
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
        result = predict(features_dict, args.model_dir)
        
        # Output result as JSON
        print(json.dumps(result))
        
        # Exit with error code if prediction failed
        if not result.get("success", False):
            sys.exit(1)
            
    except Exception as e:
        # Catch any unexpected errors
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
