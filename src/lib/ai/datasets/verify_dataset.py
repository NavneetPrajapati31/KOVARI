#!/usr/bin/env python3
"""
Dataset Verification Script
Verifies that generated datasets meet all quality requirements.

Usage:
    python verify_dataset.py [train_csv] [val_csv]
"""

import sys
import pandas as pd
from pathlib import Path
import io

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def check_feature_ranges(df, feature_cols):
    """Check that all feature columns are in [0,1] range."""
    issues = []
    for col in feature_cols:
        # Skip non-numeric columns
        if not pd.api.types.is_numeric_dtype(df[col]):
            continue
        min_val = df[col].min()
        max_val = df[col].max()
        if pd.isna(min_val) or pd.isna(max_val):
            issues.append(f"{col}: contains NaN values")
        elif min_val < 0 or max_val > 1:
            issues.append(f"{col}: range [{min_val:.4f}, {max_val:.4f}] outside [0,1]")
    return issues

def check_time_based_split(train_df, val_df):
    """Verify that validation timestamps are all after training timestamps."""
    max_train_time = train_df['timestamp'].max()
    min_val_time = val_df['timestamp'].min()
    return min_val_time >= max_train_time, max_train_time, min_val_time

def main():
    train_csv = sys.argv[1] if len(sys.argv) > 1 else "datasets/train.csv"
    val_csv = sys.argv[2] if len(sys.argv) > 2 else "datasets/val.csv"
    
    if not Path(train_csv).exists():
        print(f"❌ Error: Training CSV file '{train_csv}' not found!")
        sys.exit(1)
    
    if not Path(val_csv).exists():
        print(f"❌ Error: Validation CSV file '{val_csv}' not found!")
        sys.exit(1)
    
    print("🔍 Verifying dataset quality...\n")
    
    # Load datasets
    train_df = pd.read_csv(train_csv)
    val_df = pd.read_csv(val_csv)
    
    print(f"📊 Basic Statistics:")
    print(f"  Train samples: {len(train_df)}")
    print(f"  Val samples: {len(val_df)}")
    print(f"  Total samples: {len(train_df) + len(val_df)}\n")
    
    # Identify feature columns (exclude metadata)
    metadata_cols = ['matchType', 'preset', 'timestamp', 'label']
    feature_cols = [c for c in train_df.columns if c not in metadata_cols]
    
    print(f"📈 Dataset Columns:")
    print(f"  Feature columns: {len(feature_cols)}")
    print(f"  Metadata columns: {len(metadata_cols)}\n")
    
    # Check 1: Match types
    print("📈 Match Types:")
    train_types = train_df['matchType'].value_counts()
    val_types = val_df['matchType'].value_counts()
    
    for match_type in ['user_user', 'user_group']:
        train_count = train_types.get(match_type, 0)
        val_count = val_types.get(match_type, 0)
        print(f"  {match_type}: train={train_count}, val={val_count}")
    
    has_both_types = all(
        match_type in train_types.index and match_type in val_types.index
        for match_type in ['user_user', 'user_group']
    )
    if has_both_types:
        print("  ✅ Both match types present\n")
    else:
        print("  ❌ Missing match types (need both user_user and user_group)\n")
    
    # Check 2: Labels
    print("📊 Labels:")
    train_labels = train_df['label'].value_counts().sort_index()
    val_labels = val_df['label'].value_counts().sort_index()
    
    for label in [0, 1]:
        train_count = train_labels.get(label, 0)
        val_count = val_labels.get(label, 0)
        train_pct = (train_count / len(train_df) * 100) if len(train_df) > 0 else 0
        val_pct = (val_count / len(val_df) * 100) if len(val_df) > 0 else 0
        print(f"  Label {label}: train={train_count} ({train_pct:.1f}%), val={val_count} ({val_pct:.1f}%)")
    
    has_both_labels = all(
        label in train_labels.index and label in val_labels.index
        for label in [0, 1]
    )
    if has_both_labels:
        print("  ✅ Both labels (0 and 1) present\n")
    else:
        print("  ❌ Missing labels (need both 0 and 1)\n")
    
    # Check 3: Feature ranges
    print("🔍 Feature Ranges [0,1]:")
    train_issues = check_feature_ranges(train_df, feature_cols)
    val_issues = check_feature_ranges(val_df, feature_cols)
    
    if not train_issues and not val_issues:
        print("  ✅ All feature columns are in [0,1] range\n")
    else:
        print("  ❌ Feature range issues found:")
        if train_issues:
            print("    Training set:")
            for issue in train_issues[:10]:  # Show first 10
                print(f"      - {issue}")
            if len(train_issues) > 10:
                print(f"      ... and {len(train_issues) - 10} more")
        if val_issues:
            print("    Validation set:")
            for issue in val_issues[:10]:
                print(f"      - {issue}")
            if len(val_issues) > 10:
                print(f"      ... and {len(val_issues) - 10} more")
        print()
    
    # Check 4: Time-based split
    print("⏰ Time-Based Split:")
    split_ok, max_train_time, min_val_time = check_time_based_split(train_df, val_df)
    
    if split_ok:
        print(f"  ✅ Time-based split respected")
        print(f"     Train max: {max_train_time}")
        print(f"     Val min: {min_val_time}")
        print(f"     Val starts >= train ends\n")
    else:
        print(f"  ❌ Time-based split violated!")
        print(f"     Train max: {max_train_time}")
        print(f"     Val min: {min_val_time}")
        print(f"     Val starts < train ends (future leakage detected!)\n")
    
    # Check 5: PII columns (basic check)
    print("🔒 PII Check:")
    pii_keywords = ['email', 'name', 'phone', 'address', 'user_id', 'profile_id', 'group_id', 'clerk']
    pii_cols = [
        col for col in train_df.columns
        if any(keyword in col.lower() for keyword in pii_keywords)
        and col not in metadata_cols
    ]
    
    if not pii_cols:
        print("  ✅ No obvious PII columns found\n")
    else:
        print(f"  ⚠️  Potential PII columns found: {', '.join(pii_cols)}")
        print("     Review manually to ensure no PII is included\n")
    
    # Summary
    checks_passed = sum([
        has_both_types,
        has_both_labels,
        not train_issues and not val_issues,
        split_ok,
        not pii_cols
    ])
    checks_total = 5
    
    print("=" * 60)
    print(f"Summary: {checks_passed}/{checks_total} checks passed")
    
    if checks_passed == checks_total:
        print("\n✅ All verification checks passed!")
        print("🎉 Dataset is ready for ML training!")
        sys.exit(0)
    else:
        print("\n⚠️  Some checks failed. Review the output above.")
        sys.exit(1)

if __name__ == "__main__":
    sys.exit(main())

