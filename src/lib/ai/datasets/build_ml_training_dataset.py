#!/usr/bin/env python3
"""
Build ML Training Dataset - Strict Specification Implementation

Objective: Generate realistic match interaction events for binary classification
Target: Predict probability of acceptance (1) vs ignore/unmatch (0)

Strictly follows the specified methodology:
- Flat table schema (no nested JSON)
- Realistic feature distributions
- Hierarchical compatibility function
- Hard rejection logic
- Sigmoid probability conversion
- Data cleaning and validation
"""

import sys
import json
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta
import io

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# ============================================================================
# CONFIGURATION
# ============================================================================

TARGET_SAMPLES = 20000  # Between 15,000-30,000
OUTPUT_DIR = Path("datasets")
OUTPUT_FILE = OUTPUT_DIR / "ml_training_dataset.csv"

# Feature weights (hierarchical compatibility function)
# Updated: Primary = 75%, Secondary = 25% (increased secondary influence)
WEIGHTS = {
    'destinationScore': 0.35,      # PRIMARY (75% total)
    'dateOverlapScore': 0.25,
    'budgetScore': 0.15,
    'interestScore': 0.12,          # SECONDARY (25% total)
    'personalityScore': 0.08,
    'ageScore': 0.05,
}

# Interaction feature weights (amplify when primary constraints are good)
INTERACTION_WEIGHTS = {
    'destination_interest': 0.10,  # Amplifies when both destination and interest are high
    'date_budget': 0.08,            # Amplifies when both date overlap and budget are good
}

# Sigmoid parameters
# Increased steepness from 9 to 12 for better separation
SIGMOID_STEEPNESS = 12.0
SIGMOID_CENTER = 0.55  # Adjusted to achieve 40-55% positive class balance

# ============================================================================
# 1. FEATURE GENERATION FUNCTIONS
# ============================================================================

def generate_destination_score():
    """
    PRIMARY FEATURE: Destination Score (Hard Constraint)
    
    Distribution:
    - 40% same destination (1.0)
    - 20% nearby city (0.7)
    - 20% same country different region (0.3)
    - 20% different country (0.0)
    """
    rand = np.random.random()
    if rand < 0.40:
        return 1.0
    elif rand < 0.60:
        return 0.7
    elif rand < 0.80:
        return 0.3
    else:
        return 0.0


def generate_date_overlap_score():
    """
    PRIMARY FEATURE: Date Overlap Score (Hard Feasibility)
    
    Distribution:
    - 25% → 0 (no overlap)
    - 25% → 0.1-0.3
    - 30% → 0.3-0.7
    - 20% → 0.7-1.0
    """
    rand = np.random.random()
    if rand < 0.25:
        return 0.0
    elif rand < 0.50:
        return np.random.uniform(0.1, 0.3)
    elif rand < 0.80:
        return np.random.uniform(0.3, 0.7)
    else:
        return np.random.uniform(0.7, 1.0)


def generate_budget_score():
    """
    PRIMARY FEATURE: Budget Score (Soft but Important)
    
    Natural spread across 0-1, no default 0.5
    """
    # Generate realistic budget difference
    budget_diff_ratio = np.random.beta(2, 3)  # Skewed towards smaller differences
    budget_score = max(0.0, 1.0 - budget_diff_ratio)
    return round(budget_score, 3)


def generate_interest_score():
    """
    SECONDARY FEATURE: Interest Score
    Use Beta distribution to avoid flat uniform
    """
    return round(np.random.beta(2, 2), 3)


def generate_personality_score():
    """
    SECONDARY FEATURE: Personality Score
    Use Beta distribution
    """
    return round(np.random.beta(2, 2), 3)


def generate_age_score():
    """
    SECONDARY FEATURE: Age Score
    Use Beta distribution (slightly skewed towards compatibility)
    """
    return round(np.random.beta(3, 2), 3)


# ============================================================================
# 2. COMPATIBILITY CALCULATION
# ============================================================================

def calculate_compatibility(features):
    """
    Hierarchical Compatibility Function with Interaction Features
    
    Primary features (75%): destination, dateOverlap, budget
    Secondary features (25%): interest, personality, age
    Interaction features: Amplify when primary constraints are good
    """
    # Base compatibility from individual features
    compatibility = (
        WEIGHTS['destinationScore'] * features['destinationScore'] +
        WEIGHTS['dateOverlapScore'] * features['dateOverlapScore'] +
        WEIGHTS['budgetScore'] * features['budgetScore'] +
        WEIGHTS['interestScore'] * features['interestScore'] +
        WEIGHTS['personalityScore'] * features['personalityScore'] +
        WEIGHTS['ageScore'] * features['ageScore']
    )
    
    # Add interaction features (nonlinear effects)
    # destination_interest: High when both destination and interest match well
    destination_interest = features.get('destination_interest', 
        features['destinationScore'] * features['interestScore'])
    compatibility += INTERACTION_WEIGHTS['destination_interest'] * destination_interest
    
    # date_budget: High when both date overlap and budget are compatible
    date_budget = features.get('date_budget',
        features['dateOverlapScore'] * features['budgetScore'])
    compatibility += INTERACTION_WEIGHTS['date_budget'] * date_budget
    
    # Hard Rejection Logic
    # If destination or dateOverlap is 0, heavily penalize
    if features['destinationScore'] == 0 or features['dateOverlapScore'] == 0:
        compatibility = compatibility * 0.25
    
    return round(compatibility, 4)


def compatibility_to_probability(compatibility):
    """
    Convert Compatibility → Probability using steep sigmoid
    
    prob = 1 / (1 + exp(-9*(compatibility - 0.6)))
    
    Why: Strong gradient, prevents clustering near 0.5
    """
    prob = 1.0 / (1.0 + np.exp(-SIGMOID_STEEPNESS * (compatibility - SIGMOID_CENTER)))
    return round(prob, 4)


def generate_label(probability):
    """
    Generate label using Bernoulli distribution
    
    No hard threshold - gives realistic uncertainty
    """
    return 1 if np.random.random() < probability else 0


# ============================================================================
# 3. DATA GENERATION
# ============================================================================

def generate_match_event():
    """
    Generate a single match interaction event with interaction features
    """
    # Generate base features
    destination_score = generate_destination_score()
    date_overlap_score = generate_date_overlap_score()
    budget_score = generate_budget_score()
    interest_score = generate_interest_score()
    personality_score = generate_personality_score()
    age_score = generate_age_score()
    
    # Generate interaction features (nonlinear combinations)
    destination_interest = destination_score * interest_score
    date_budget = date_overlap_score * budget_score
    
    features = {
        'destinationScore': destination_score,
        'dateOverlapScore': date_overlap_score,
        'budgetScore': budget_score,
        'interestScore': interest_score,
        'personalityScore': personality_score,
        'ageScore': age_score,
        'destination_interest': destination_interest,  # Interaction feature
        'date_budget': date_budget,                    # Interaction feature
    }
    
    # Calculate compatibility
    compatibility = calculate_compatibility(features)
    
    # Convert to probability
    probability = compatibility_to_probability(compatibility)
    
    # Generate label
    label = generate_label(probability)
    
    # Return flat row (no nested structures)
    row = {
        **features,
        'compatibility': compatibility,
        'probability': probability,
        'label': label,
    }
    
    return row


def generate_dataset(n_samples):
    """
    Generate complete dataset
    """
    print(f"🔄 Generating {n_samples:,} match interaction events...")
    print("=" * 80)
    
    rows = []
    for i in range(n_samples):
        row = generate_match_event()
        rows.append(row)
        
        if (i + 1) % 1000 == 0:
            print(f"   Generated {i + 1:,} / {n_samples:,} events...")
    
    print(f"✅ Generated {len(rows):,} events")
    
    # Convert to DataFrame
    df = pd.DataFrame(rows)
    
    return df


# ============================================================================
# 4. DATA CLEANING
# ============================================================================

def clean_dataset(df):
    """
    Data Cleaning Phase
    
    1. Remove duplicates
    2. Remove constant columns
    3. Check missing values
    """
    print("\n🧹 Data Cleaning Phase")
    print("=" * 80)
    
    original_size = len(df)
    
    # 1. Remove duplicates (based on feature columns only)
    feature_cols = ['destinationScore', 'dateOverlapScore', 'budgetScore', 
                    'interestScore', 'personalityScore', 'ageScore',
                    'destination_interest', 'date_budget']  # Include interaction features
    duplicates = df.duplicated(subset=feature_cols).sum()
    
    if duplicates > 0:
        print(f"   Found {duplicates} duplicate feature rows")
        df = df.drop_duplicates(subset=feature_cols, keep='first')
        print(f"   Removed duplicates: {original_size} → {len(df)} rows")
    else:
        print(f"   ✅ No duplicate feature rows found")
    
    # 2. Remove constant columns
    constant_cols = []
    for col in df.columns:
        if df[col].std() < 1e-6:  # Near-zero standard deviation
            constant_cols.append(col)
    
    if constant_cols:
        print(f"   ⚠️  Found constant columns: {constant_cols}")
        df = df.drop(columns=constant_cols)
        print(f"   Removed constant columns")
    else:
        print(f"   ✅ No constant columns found")
    
    # 3. Check missing values
    missing = df.isnull().sum().sum()
    if missing > 0:
        print(f"   ⚠️  Found {missing} missing values")
        df = df.dropna()
        print(f"   Removed rows with missing values: {len(df)} rows remaining")
    else:
        print(f"   ✅ No missing values")
    
    print(f"\n   Final dataset size: {len(df):,} rows")
    
    return df


# ============================================================================
# 5. VALIDATION
# ============================================================================

def validate_dataset(df):
    """
    Validate Dataset Quality
    
    A. Class Balance (40-55% positive)
    B. Correlation Check
    C. Distribution Check
    """
    print("\n📊 Dataset Quality Validation")
    print("=" * 80)
    
    # A. Class Balance
    label_counts = df['label'].value_counts()
    positive_pct = (label_counts.get(1, 0) / len(df)) * 100
    
    print(f"\nA. Class Balance:")
    print(f"   Label 0 (Ignore/Unmatch): {label_counts.get(0, 0):,} ({100-positive_pct:.1f}%)")
    print(f"   Label 1 (Accept/Chat): {label_counts.get(1, 0):,} ({positive_pct:.1f}%)")
    
    if 40 <= positive_pct <= 55:
        print(f"   ✅ Class balance is good (40-55% positive)")
    else:
        print(f"   ⚠️  Class balance outside target range (40-55%)")
        if positive_pct > 55:
            print(f"      Suggestion: Increase sigmoid center to 0.65")
        else:
            print(f"      Suggestion: Decrease sigmoid center to 0.55")
    
    # B. Correlation Check
    print(f"\nB. Feature-Label Correlations:")
    feature_cols = ['destinationScore', 'dateOverlapScore', 'budgetScore',
                    'interestScore', 'personalityScore', 'ageScore',
                    'destination_interest', 'date_budget']  # Include interaction features
    
    correlations = {}
    for col in feature_cols:
        if col in df.columns:
            corr = df[col].corr(df['label'])
            correlations[col] = corr
            strength = "Strong" if abs(corr) > 0.3 else "Moderate" if abs(corr) > 0.15 else "Weak"
            print(f"   {col:25s} | {corr:7.4f} | {strength}")
    
    # Check if primary features have stronger correlation
    primary_corrs = [correlations.get('destinationScore', 0),
                     correlations.get('dateOverlapScore', 0),
                     correlations.get('budgetScore', 0)]
    secondary_corrs = [correlations.get('interestScore', 0),
                       correlations.get('personalityScore', 0),
                       correlations.get('ageScore', 0)]
    
    avg_primary = np.mean([abs(c) for c in primary_corrs])
    avg_secondary = np.mean([abs(c) for c in secondary_corrs])
    
    if avg_primary > avg_secondary:
        print(f"   ✅ Primary features have stronger correlation (correct)")
    else:
        print(f"   ⚠️  Secondary features > primary (weights may need adjustment)")
    
    # C. Distribution Check
    print(f"\nC. Probability Distribution:")
    prob_min = df['probability'].min()
    prob_max = df['probability'].max()
    prob_mean = df['probability'].mean()
    prob_std = df['probability'].std()
    
    print(f"   Min: {prob_min:.3f}")
    print(f"   Max: {prob_max:.3f}")
    print(f"   Mean: {prob_mean:.3f}")
    print(f"   Std: {prob_std:.3f}")
    
    # Check if clustered around 0.5
    near_05 = ((df['probability'] > 0.45) & (df['probability'] < 0.55)).sum()
    near_05_pct = (near_05 / len(df)) * 100
    
    if near_05_pct < 20:
        print(f"   ✅ Good spread (only {near_05_pct:.1f}% clustered near 0.5)")
    else:
        print(f"   ⚠️  Too many clustered near 0.5 ({near_05_pct:.1f}%)")
    
    # Check span
    if prob_min < 0.1 and prob_max > 0.9:
        print(f"   ✅ Good span (0.05 → 0.95 range)")
    else:
        print(f"   ⚠️  Limited span (should be 0.05 → 0.95)")
    
    # Feature statistics
    print(f"\nD. Feature Statistics:")
    print(f"{'Feature':<25s} | {'Min':<8s} | {'Max':<8s} | {'Mean':<8s} | {'Std':<8s} | {'Unique':<8s}")
    print("-" * 80)
    
    for col in feature_cols:
        if col in df.columns:
            min_val = df[col].min()
            max_val = df[col].max()
            mean_val = df[col].mean()
            std_val = df[col].std()
            unique_val = df[col].nunique()
            print(f"{col:<25s} | {min_val:8.3f} | {max_val:8.3f} | {mean_val:8.3f} | {std_val:8.3f} | {unique_val:8d}")
    
    # Check for duplicates
    feature_df = df[feature_cols]
    duplicates = feature_df.duplicated().sum()
    duplicate_pct = (duplicates / len(df)) * 100
    
    print(f"\nE. Duplicate Check:")
    print(f"   Duplicate feature vectors: {duplicates:,} ({duplicate_pct:.1f}%)")
    if duplicate_pct < 10:
        print(f"   ✅ Low duplicate rate (target: <10%)")
    else:
        print(f"   ⚠️  High duplicate rate (target: <10%)")
    
    return {
        'class_balance': positive_pct,
        'correlations': correlations,
        'prob_range': (prob_min, prob_max),
        'duplicate_rate': duplicate_pct,
    }


# ============================================================================
# 6. MAIN EXECUTION
# ============================================================================

def main():
    """
    Main execution: Generate, clean, validate, and save dataset
    """
    print("=" * 80)
    print("ML TRAINING DATASET BUILDER")
    print("Strict Specification Implementation")
    print("=" * 80)
    print(f"\nTarget: {TARGET_SAMPLES:,} match interaction events")
    print(f"Output: {OUTPUT_FILE}")
    print()
    
    # Create output directory
    OUTPUT_DIR.mkdir(exist_ok=True)
    
    # Generate dataset
    df = generate_dataset(TARGET_SAMPLES)
    
    # Clean dataset
    df = clean_dataset(df)
    
    # Validate dataset
    validation_results = validate_dataset(df)
    
    # Save dataset
    print(f"\n💾 Saving dataset to {OUTPUT_FILE}...")
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"✅ Dataset saved: {len(df):,} rows, {len(df.columns)} columns")
    
    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"✅ Generated: {len(df):,} match interaction events")
    print(f"✅ Class balance: {validation_results['class_balance']:.1f}% positive")
    print(f"✅ Probability range: {validation_results['prob_range'][0]:.3f} - {validation_results['prob_range'][1]:.3f}")
    print(f"✅ Duplicate rate: {validation_results['duplicate_rate']:.1f}%")
    print(f"✅ Output file: {OUTPUT_FILE}")
    print("\nNext steps:")
    print(f"  1. Review dataset: pandas.read_csv('{OUTPUT_FILE}')")
    print(f"  2. Split into train/val: python src/lib/ai/datasets/split_dataset.py")
    print(f"  3. Train model: python src/lib/ai/datasets/train_model.py")
    print("=" * 80)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
