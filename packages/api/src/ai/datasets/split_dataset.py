#!/usr/bin/env python3
"""
Split ML Training Dataset into Train/Validation Sets

Time-based split to prevent future data leakage
"""

import sys
import pandas as pd
from pathlib import Path
import io

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

INPUT_FILE = Path("datasets/ml_training_dataset.csv")
TRAIN_FILE = Path("datasets/train.csv")
VAL_FILE = Path("datasets/val.csv")
TRAIN_RATIO = 0.8

def main():
    print("=" * 80)
    print("SPLIT DATASET INTO TRAIN/VAL")
    print("=" * 80)
    
    if not INPUT_FILE.exists():
        print(f"❌ Input file not found: {INPUT_FILE}")
        print(f"   Run: python src/lib/ai/datasets/build_ml_training_dataset.py")
        sys.exit(1)
    
    # Load dataset
    print(f"\n📂 Loading dataset from {INPUT_FILE}...")
    df = pd.read_csv(INPUT_FILE)
    print(f"   Loaded {len(df):,} samples")
    
    # Shuffle to randomize (since we don't have timestamps in generated data)
    # In real scenario, would use time-based split
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Split
    split_idx = int(len(df) * TRAIN_RATIO)
    train_df = df[:split_idx]
    val_df = df[split_idx:]
    
    print(f"\n📊 Split Results:")
    print(f"   Training set: {len(train_df):,} samples ({TRAIN_RATIO*100:.0f}%)")
    print(f"   Validation set: {len(val_df):,} samples ({(1-TRAIN_RATIO)*100:.0f}%)")
    
    # Check class balance
    train_pos = (train_df['label'] == 1).sum() / len(train_df) * 100
    val_pos = (val_df['label'] == 1).sum() / len(val_df) * 100
    
    print(f"\n📈 Class Balance:")
    print(f"   Train: {train_pos:.1f}% positive")
    print(f"   Val: {val_pos:.1f}% positive")
    
    # Save
    print(f"\n💾 Saving splits...")
    train_df.to_csv(TRAIN_FILE, index=False)
    val_df.to_csv(VAL_FILE, index=False)
    
    print(f"   ✅ Training set: {TRAIN_FILE}")
    print(f"   ✅ Validation set: {VAL_FILE}")
    print("\n✅ Split complete!")
    print("=" * 80)

if __name__ == "__main__":
    main()
