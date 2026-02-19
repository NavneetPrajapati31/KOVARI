#!/usr/bin/env python3
"""
ML Model Training Script for Match Compatibility Prediction

This script:
- Loads training and validation datasets
- Trains an XGBoost classifier for binary match prediction
- Evaluates model performance
- Saves the trained model for deployment
"""

import pandas as pd
import numpy as np
import argparse
from pathlib import Path
import sys
import io
import json
from datetime import datetime

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

try:
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score, 
        f1_score, roc_auc_score, classification_report, confusion_matrix
    )
    from sklearn.preprocessing import LabelEncoder
    import xgboost as xgb
    import joblib
except ImportError as e:
    print(f"❌ Missing required library: {e}")
    print("📦 Please install dependencies: pip install -r requirements.txt")
    sys.exit(1)


def load_datasets(train_path: str, val_path: str) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Load training and validation datasets."""
    print("📂 Loading datasets...")
    
    train_df = pd.read_csv(train_path)
    val_df = pd.read_csv(val_path)
    
    print(f"✅ Training set: {len(train_df)} samples")
    print(f"✅ Validation set: {len(val_df)} samples")
    
    return train_df, val_df


def prepare_features(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """
    Prepare features and labels from dataset.
    
    Returns:
        features_df: DataFrame with feature columns
        labels: Series with binary labels
    """
    # Remove duplicate matchType column if exists
    if 'matchType.1' in df.columns:
        df = df.drop(columns=['matchType.1'])
    
    # Separate features and labels
    # Exclude metadata columns and derived/computed columns from features
    # In production, we only have raw features, not compatibility/probability
    metadata_cols = ['matchType', 'preset', 'timestamp', 'label']
    derived_cols = ['compatibility', 'probability']  # Exclude - these are computed, not available in production
    exclude_cols = metadata_cols + derived_cols
    feature_cols = [col for col in df.columns if col not in exclude_cols]
    
    # Handle matchType as categorical feature
    if 'matchType' in df.columns:
        le = LabelEncoder()
        df['matchType_encoded'] = le.fit_transform(df['matchType'])
        feature_cols.append('matchType_encoded')
    
    features = df[feature_cols].copy()
    labels = df['label'].copy()
    
    # Fill any remaining NaN values with 0
    features = features.fillna(0)
    
    return features, labels


def train_model(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_val: pd.DataFrame,
    y_val: pd.Series,
    output_dir: str = "models"
) -> xgb.XGBClassifier:
    """
    Train XGBoost classifier for match compatibility prediction.
    
    Args:
        X_train: Training features
        y_train: Training labels
        X_val: Validation features
        y_val: Validation labels
        output_dir: Directory to save model
        
    Returns:
        Trained XGBoost model
    """
    print("\n🤖 Training XGBoost classifier...")
    
    # XGBoost parameters optimized for binary classification
    params = {
        'objective': 'binary:logistic',
        'eval_metric': 'auc',
        'max_depth': 6,
        'learning_rate': 0.1,
        'n_estimators': 100,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'random_state': 42,
        'n_jobs': -1,
        'verbosity': 0
    }
    
    # Create and train model
    model = xgb.XGBClassifier(**params)
    
    # Train with early stopping on validation set
    # Note: In XGBoost 2.0+, early_stopping_rounds is passed in __init__
    model.set_params(early_stopping_rounds=10)
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )
    
    print("✅ Model training complete!")
    
    return model


def evaluate_model(
    model: xgb.XGBClassifier,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_val: pd.DataFrame,
    y_val: pd.Series
):
    """Evaluate model performance on training and validation sets."""
    print("\n📊 Evaluating model performance...\n")
    
    # Predictions
    y_train_pred = model.predict(X_train)
    y_val_pred = model.predict(X_val)
    
    # Probabilities for ROC-AUC
    y_train_proba = model.predict_proba(X_train)[:, 1]
    y_val_proba = model.predict_proba(X_val)[:, 1]
    
    # Calculate metrics
    train_metrics = {
        'accuracy': accuracy_score(y_train, y_train_pred),
        'precision': precision_score(y_train, y_train_pred),
        'recall': recall_score(y_train, y_train_pred),
        'f1': f1_score(y_train, y_train_pred),
        'roc_auc': roc_auc_score(y_train, y_train_proba)
    }
    
    val_metrics = {
        'accuracy': accuracy_score(y_val, y_val_pred),
        'precision': precision_score(y_val, y_val_pred),
        'recall': recall_score(y_val, y_val_pred),
        'f1': f1_score(y_val, y_val_pred),
        'roc_auc': roc_auc_score(y_val, y_val_proba)
    }
    
    # Print metrics
    print("=" * 60)
    print("📈 Training Set Metrics:")
    print("=" * 60)
    print(f"  Accuracy:  {train_metrics['accuracy']:.4f}")
    print(f"  Precision: {train_metrics['precision']:.4f}")
    print(f"  Recall:    {train_metrics['recall']:.4f}")
    print(f"  F1 Score:  {train_metrics['f1']:.4f}")
    print(f"  ROC-AUC:   {train_metrics['roc_auc']:.4f}")
    
    print("\n" + "=" * 60)
    print("📈 Validation Set Metrics:")
    print("=" * 60)
    print(f"  Accuracy:  {val_metrics['accuracy']:.4f}")
    print(f"  Precision: {val_metrics['precision']:.4f}")
    print(f"  Recall:    {val_metrics['recall']:.4f}")
    print(f"  F1 Score:  {val_metrics['f1']:.4f}")
    print(f"  ROC-AUC:   {val_metrics['roc_auc']:.4f}")
    
    # Confusion matrix
    print("\n" + "=" * 60)
    print("📊 Validation Confusion Matrix:")
    print("=" * 60)
    cm = confusion_matrix(y_val, y_val_pred)
    print(f"                Predicted")
    print(f"              Negative  Positive")
    print(f"Actual Negative   {cm[0,0]:4d}      {cm[0,1]:4d}")
    print(f"        Positive   {cm[1,0]:4d}      {cm[1,1]:4d}")
    
    # Classification report
    print("\n" + "=" * 60)
    print("📋 Classification Report (Validation):")
    print("=" * 60)
    print(classification_report(y_val, y_val_pred, target_names=['Ignore', 'Accept']))
    
    # Feature importance
    print("\n" + "=" * 60)
    print("🔝 Top 10 Most Important Features:")
    print("=" * 60)
    feature_importance = pd.DataFrame({
        'feature': X_train.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    for idx, row in feature_importance.head(10).iterrows():
        print(f"  {row['feature']:25s} {row['importance']:.4f}")
    
    return train_metrics, val_metrics


def save_model(
    model: xgb.XGBClassifier,
    feature_names: list,
    output_dir: str = "models",
    metrics: dict = None
):
    """Save trained model and metadata."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Save model
    model_path = output_path / "match_compatibility_model.pkl"
    joblib.dump(model, model_path)
    print(f"\n💾 Model saved: {model_path}")
    
    # Save feature names
    features_path = output_path / "model_features.json"
    with open(features_path, 'w') as f:
        json.dump(feature_names, f, indent=2)
    print(f"💾 Feature names saved: {features_path}")
    
    # Save metadata
    if metrics:
        metadata = {
            'trained_at': datetime.now().isoformat(),
            'model_type': 'XGBoost',
            'metrics': metrics,
            'feature_count': len(feature_names)
        }
        metadata_path = output_path / "model_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"💾 Metadata saved: {metadata_path}")


def main():
    """Main entry point for model training."""
    parser = argparse.ArgumentParser(
        description="Train ML model for match compatibility prediction"
    )
    parser.add_argument(
        "--train-csv",
        type=str,
        default="datasets/train.csv",
        help="Path to training CSV file (default: datasets/train.csv)"
    )
    parser.add_argument(
        "--val-csv",
        type=str,
        default="datasets/val.csv",
        help="Path to validation CSV file (default: datasets/val.csv)"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="models",
        help="Output directory for saved model (default: models)"
    )
    
    args = parser.parse_args()
    
    # Validate input files
    if not Path(args.train_csv).exists():
        print(f"❌ Error: Training CSV not found: {args.train_csv}")
        sys.exit(1)
    
    if not Path(args.val_csv).exists():
        print(f"❌ Error: Validation CSV not found: {args.val_csv}")
        sys.exit(1)
    
    try:
        # Load datasets
        train_df, val_df = load_datasets(args.train_csv, args.val_csv)
        
        # Prepare features and labels
        print("\n🔧 Preparing features...")
        X_train, y_train = prepare_features(train_df)
        X_val, y_val = prepare_features(val_df)
        
        print(f"✅ Features prepared: {len(X_train.columns)} features")
        print(f"   Training samples: {len(X_train)}")
        print(f"   Validation samples: {len(X_val)}")
        
        # Train model
        model = train_model(X_train, y_train, X_val, y_val, args.output_dir)
        
        # Evaluate model
        train_metrics, val_metrics = evaluate_model(
            model, X_train, y_train, X_val, y_val
        )
        
        # Save model
        save_model(
            model,
            list(X_train.columns),
            args.output_dir,
            {'train': train_metrics, 'validation': val_metrics}
        )
        
        print("\n" + "=" * 60)
        print("✅ Model training completed successfully!")
        print("=" * 60)
        print(f"\n📁 Model files saved to: {args.output_dir}/")
        print("   - match_compatibility_model.pkl (trained model)")
        print("   - model_features.json (feature names)")
        print("   - model_metadata.json (training metadata)")
        
    except Exception as e:
        print(f"\n❌ Error during training: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
