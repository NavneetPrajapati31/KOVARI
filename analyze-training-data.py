#!/usr/bin/env python3
"""Analyze training data diversity and model performance"""

import pandas as pd
import json
import sys
import io
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

print("=" * 60)
print("TRAINING DATA ANALYSIS")
print("=" * 60)

# Load training data
train_path = Path("datasets/train.csv")
if not train_path.exists():
    print(f"❌ Training data not found: {train_path}")
    exit(1)

df = pd.read_csv(train_path)
print(f"\nLoaded {len(df)} training samples")

# Feature columns
metadata_cols = ['matchType', 'preset', 'timestamp', 'label']
feature_cols = [c for c in df.columns if c not in metadata_cols]
print(f"\nFeature columns ({len(feature_cols)}):")
for col in feature_cols:
    print(f"   - {col}")

# Feature statistics
print(f"\nFeature Statistics:")
print("-" * 60)
for col in feature_cols:
    if df[col].dtype in ['int64', 'float64']:
        min_val = df[col].min()
        max_val = df[col].max()
        mean_val = df[col].mean()
        std_val = df[col].std()
        unique_count = df[col].nunique()
        print(f"{col:25s} | min={min_val:6.3f} max={max_val:6.3f} mean={mean_val:6.3f} std={std_val:6.3f} unique={unique_count:4d}")

# Label distribution
print(f"\nLabel Distribution:")
print("-" * 60)
label_counts = df['label'].value_counts()
print(f"   Label 0 (Ignore): {label_counts.get(0, 0)} ({label_counts.get(0, 0)/len(df)*100:.1f}%)")
print(f"   Label 1 (Accept): {label_counts.get(1, 0)} ({label_counts.get(1, 0)/len(df)*100:.1f}%)")

# Check for identical feature vectors
print(f"\nChecking for Identical Feature Vectors:")
print("-" * 60)
feature_df = df[feature_cols]
duplicate_count = feature_df.duplicated().sum()
print(f"   Duplicate feature vectors: {duplicate_count} ({duplicate_count/len(df)*100:.1f}%)")

if duplicate_count > 0:
    print(f"   WARNING: {duplicate_count} samples have identical features!")
    print(f"   This could cause the model to predict similar scores.")

# Sample feature vectors
print(f"\nSample Feature Vectors (first 5 rows):")
print("-" * 60)
print(feature_df.head().to_string())

# Check model metadata
print("\n" + "=" * 60)
print("MODEL METADATA")
print("=" * 60)

model_metadata_path = Path("models/model_metadata.json")
if model_metadata_path.exists():
    with open(model_metadata_path, 'r') as f:
        metadata = json.load(f)
    
    print(f"\n✅ Model Type: {metadata.get('model_type', 'N/A')}")
    print(f"✅ Trained At: {metadata.get('trained_at', 'N/A')}")
    print(f"✅ Feature Count: {metadata.get('feature_count', 'N/A')}")
    
    if 'metrics' in metadata:
        print(f"\n📊 Training Metrics:")
        train_metrics = metadata['metrics'].get('train', {})
        val_metrics = metadata['metrics'].get('validation', {})
        
        print(f"\n   Training Set:")
        print(f"      Accuracy:  {train_metrics.get('accuracy', 0):.4f}")
        print(f"      Precision: {train_metrics.get('precision', 0):.4f}")
        print(f"      Recall:    {train_metrics.get('recall', 0):.4f}")
        print(f"      F1 Score:  {train_metrics.get('f1', 0):.4f}")
        print(f"      ROC-AUC:   {train_metrics.get('roc_auc', 0):.4f}")
        
        print(f"\n   Validation Set:")
        print(f"      Accuracy:  {val_metrics.get('accuracy', 0):.4f}")
        print(f"      Precision: {val_metrics.get('precision', 0):.4f}")
        print(f"      Recall:    {val_metrics.get('recall', 0):.4f}")
        print(f"      F1 Score:  {val_metrics.get('f1', 0):.4f}")
        print(f"      ROC-AUC:   {val_metrics.get('roc_auc', 0):.4f}")
        
        # Check if model is performing well
        val_auc = val_metrics.get('roc_auc', 0)
        if val_auc < 0.6:
            print(f"\n   WARNING: Low ROC-AUC ({val_auc:.4f}) suggests model may not be learning well!")
        elif val_auc < 0.7:
            print(f"\n   CAUTION: Moderate ROC-AUC ({val_auc:.4f}) - model performance could be better")
        else:
            print(f"\n   Good ROC-AUC ({val_auc:.4f}) - model is learning patterns")
else:
    print(f"\n❌ Model metadata not found: {model_metadata_path}")

print("\n" + "=" * 60)
print("Analysis Complete")
print("=" * 60)
