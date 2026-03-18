#!/usr/bin/env python3
"""
FastAPI ML Prediction Server

Persistent server that loads the model once at startup.
Supports both single and batch predictions via HTTP API.

Start with: uvicorn ml_server_fastapi:app --host 0.0.0.0 --port 8001
"""

import sys
import json
import io
from pathlib import Path
from typing import List, Dict, Any
import time

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    import joblib
    import numpy as np
    import pandas as pd
    import uvicorn
except ImportError as e:
    print(f"❌ Missing required library: {e}", file=sys.stderr)
    print("📦 Install with: pip install fastapi uvicorn pydantic", file=sys.stderr)
    sys.exit(1)

# Global model cache (loaded once at startup)
_model_cache = None
_feature_names_cache = None
_model_dir_cache = None
_load_time = None

app = FastAPI(title="ML Match Compatibility Server", version="1.0.0")

# Enable CORS for Next.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your Next.js domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictionRequest(BaseModel):
    """Single prediction request."""
    features: Dict[str, Any]
    model_dir: str = "models"


class BatchPredictionRequest(BaseModel):
    """Batch prediction request (multiple candidates)."""
    features_list: List[Dict[str, Any]]
    model_dir: str = "models"


class PredictionResponse(BaseModel):
    """Prediction response."""
    success: bool
    probability: float = None
    prediction: int = None
    score: float = None
    error: str = None


class BatchPredictionResponse(BaseModel):
    """Batch prediction response."""
    success: bool
    results: List[PredictionResponse] = None
    error: str = None


def load_model(model_dir: str = "models"):
    """Load the trained model and feature names (cached globally)."""
    global _model_cache, _feature_names_cache, _model_dir_cache, _load_time
    
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
    _load_time = time.time() - start_time
    print(f"[ML Server] Model loaded in {_load_time:.2f}s", file=sys.stderr)
    
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
    print(f"[ML Server] Ready for predictions (model cached)", file=sys.stderr)
    return _model_cache, _feature_names_cache


def prepare_features(features_dict: dict, feature_names: list) -> pd.DataFrame:
    """Prepare features for prediction."""
    # Handle matchType encoding
    features_copy = features_dict.copy()
    if 'matchType' in features_copy:
        match_type = features_copy.pop('matchType')
        features_copy['matchType_encoded'] = 0 if match_type == 'user_user' else 1
    
    # Create DataFrame with all features
    df = pd.DataFrame([features_copy])
    
    # Ensure all expected features are present, fill missing with 0
    for feature in feature_names:
        if feature not in df.columns:
            df[feature] = 0
    
    # Reorder columns to match training order
    df = df[feature_names]
    
    # Fill any NaN values with 0
    df = df.fillna(0)
    
    return df


def predict_single(features_dict: dict, model_dir: str = "models") -> PredictionResponse:
    """Make a single prediction."""
    try:
        # Load model (cached after first call)
        model, feature_names = load_model(model_dir)
        
        # Prepare features
        features_df = prepare_features(features_dict, feature_names)
        
        # Make prediction
        probability = model.predict_proba(features_df)[0, 1]
        prediction = model.predict(features_df)[0]
        
        return PredictionResponse(
            success=True,
            probability=float(probability),
            prediction=int(prediction),
            score=float(probability)
        )
    except Exception as e:
        return PredictionResponse(
            success=False,
            error=str(e)
        )


@app.on_event("startup")
async def startup_event():
    """Load model at server startup."""
    print("[ML Server] FastAPI server starting...", file=sys.stderr)
    try:
        # Pre-load model with default directory
        load_model("models")
        print("[ML Server] ✅ Server ready", file=sys.stderr)
    except Exception as e:
        print(f"[ML Server] ⚠️  Warning: Could not pre-load model: {e}", file=sys.stderr)
        print("[ML Server] Model will be loaded on first request", file=sys.stderr)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_loaded": _model_cache is not None,
        "load_time_seconds": _load_time
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """Single prediction endpoint."""
    return predict_single(request.features, request.model_dir)


@app.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch(request: BatchPredictionRequest):
    """Batch prediction endpoint - process multiple candidates at once."""
    try:
        # Load model (cached after first call)
        model, feature_names = load_model(request.model_dir)
        
        # Prepare all features
        features_list = []
        for features_dict in request.features_list:
            features_df = prepare_features(features_dict, feature_names)
            features_list.append(features_df)
        
        # Combine into single DataFrame for batch prediction
        batch_df = pd.concat(features_list, ignore_index=True)
        
        # Batch prediction (much faster than individual calls)
        probabilities = model.predict_proba(batch_df)[:, 1]
        predictions = model.predict(batch_df)
        
        # Format results
        results = [
            PredictionResponse(
                success=True,
                probability=float(prob),
                prediction=int(pred),
                score=float(prob)
            )
            for prob, pred in zip(probabilities, predictions)
        ]
        
        return BatchPredictionResponse(
            success=True,
            results=results
        )
    except Exception as e:
        return BatchPredictionResponse(
            success=False,
            error=str(e)
        )


if __name__ == "__main__":
    # Run with: python ml_server_fastapi.py
    uvicorn.run(app, host="0.0.0.0", port=8001)
