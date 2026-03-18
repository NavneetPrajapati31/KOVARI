# ML Identical Scores - Complete Root Cause Analysis

## Executive Summary

The ML model predicting identical scores (0.486) for all matches is caused by **THREE interconnected problems**:

1. **Training Data Quality Issue** (51% duplicate features)
2. **Production Data Issue** (Missing static_attributes)
3. **Model Performance Issue** (Moderate ROC-AUC: 0.66)

**The algorithm is NOT the problem** - it's the data quality at both training and inference time.

---

## Problem 1: Training Data Quality (CRITICAL)

### Findings from Analysis

```
Training Data Statistics:
- Total samples: 232
- Duplicate feature vectors: 119 (51.3%) ⚠️ CRITICAL
- Feature diversity issues:
  * interestScore: Only 6 unique values (min=0.0, max=0.575, mean=0.201)
  * personalityScore: Only 5 unique values (min=0.0, max=1.0, mean=0.051)
  * languageScore: Only 3 unique values (0.0, 0.8, or missing)
  * lifestyleScore: Only 5 unique values
  * backgroundScore: Only 5 unique values
```

### Why This Is a Problem

1. **51% of training samples are identical** - The model can't learn patterns when half the data is duplicates
2. **Low feature diversity** - Features have very few unique values, limiting what the model can learn
3. **Model can't differentiate** - When training data has identical features with different labels, the model learns to predict the average (0.486)

### Root Cause

The synthetic data generation likely:
- Used similar user profiles (same interests, ages, personalities)
- Generated features that cluster around similar values
- Didn't create enough diversity in user attributes

---

## Problem 2: Production Data Issue (CURRENT)

### What's Happening Now

When making predictions, all features are identical:

```json
{
  "distance": "1.000",      // Same (all going to same destination)
  "dateOverlap": "1.000",   // Same (similar dates)
  "budget": "1.000",        // Same (all ₹20,000)
  "interest": "0.500",      // ⚠️ NEUTRAL_SCORE (missing static_attributes!)
  "age": "0.500",           // ⚠️ NEUTRAL_SCORE (missing static_attributes!)
  "personality": "0.500"    // ⚠️ NEUTRAL_SCORE (missing static_attributes!)
}
```

### Why This Happens

1. **Redis sessions don't store `static_attributes`** - Only dynamic attributes (destination, dates, budget)
2. **Feature extraction defaults to 0.5** - When `static_attributes` are missing:
   - `jaccard()` → 0.5 if interests missing
   - `ageScore()` → 0.5 if age missing
   - `personalityScore()` → 0.5 if personality missing
3. **All matches get identical features** → Model predicts same score (0.486)

### Fix Applied

✅ **Fixed in `match-solo/route.ts`**: Now fetches `static_attributes` from Supabase BEFORE ML scoring

---

## Problem 3: Model Performance (MODERATE)

### Training Metrics

```
Validation Set Performance:
- Accuracy:  0.5345 (53.45% - barely better than random)
- Precision: 1.0000 (100% - but only because it rarely predicts positive)
- Recall:    0.1290 (12.9% - very low, missing most positive cases)
- F1 Score:  0.2286 (22.86% - poor balance)
- ROC-AUC:   0.6595 (65.95% - moderate, should be >0.7)
```

### Why Performance Is Moderate

1. **Training data has 51% duplicates** - Model can't learn meaningful patterns
2. **Low feature diversity** - Model doesn't have enough variation to learn from
3. **Class imbalance handling** - Model is conservative, rarely predicting positive (low recall)

### Is the Model Broken?

**No, the model is working correctly** - it's just learning from poor quality data:
- When features are identical, it predicts the average probability (0.486)
- This is mathematically correct behavior
- The problem is the input data, not the model

---

## Root Cause Summary

### Is the Algorithm the Problem?

**NO** - The algorithm is fine:
- ✅ Feature extraction logic is correct
- ✅ Model training process is correct
- ✅ Prediction pipeline is correct

### Is It the Attribute Values?

**PARTIALLY** - Missing `static_attributes` in production causes identical features:
- ❌ Redis sessions don't store `static_attributes`
- ❌ Feature extraction defaults to 0.5 when missing
- ✅ **FIXED**: Now fetches from Supabase before scoring

### Is It the Model Training?

**YES** - Training data quality is the main issue:
- ❌ 51% of training samples are duplicates
- ❌ Low feature diversity (only 3-6 unique values per feature)
- ❌ Model can't learn meaningful patterns
- ⚠️ Moderate ROC-AUC (0.66) suggests poor learning

### Is It the Data Generation?

**YES** - Synthetic data generation created poor diversity:
- ❌ Generated similar user profiles
- ❌ Features cluster around similar values
- ❌ Not enough variation in interests, ages, personalities

---

## Solutions

### Immediate Fix (Already Applied)

✅ **Fetch `static_attributes` from Supabase** before ML scoring
- This will fix the production issue
- ML scores will now vary based on actual user data

### Short-Term Fix (Required)

1. **Regenerate training data with more diversity**:
   - Create users with diverse ages (20-50)
   - Create users with diverse interests (10+ different interest sets)
   - Create users with diverse personalities (introvert, extrovert, ambivert)
   - Create users with diverse budgets (₹5,000 - ₹50,000)

2. **Improve synthetic data generation**:
   - Ensure feature diversity in generated events
   - Avoid generating duplicate feature vectors
   - Generate more samples (500+ instead of 232)

3. **Retrain the model**:
   - With diverse training data
   - Target ROC-AUC > 0.75
   - Better recall (should be > 0.5)

### Long-Term Fix

1. **Collect real user interaction data**:
   - Log actual accept/ignore actions
   - Use real user profiles and sessions
   - Build dataset from production usage

2. **Monitor model performance**:
   - Track prediction diversity
   - Alert if all scores become identical
   - Retrain periodically with new data

---

## Expected Behavior After Fixes

### After Production Fix (static_attributes)

- ✅ ML scores will vary (not all 0.486)
- ✅ Different matches get different scores
- ⚠️ But scores may still cluster if training data is poor

### After Training Data Fix

- ✅ Model will learn meaningful patterns
- ✅ Better differentiation between matches
- ✅ ROC-AUC should improve to >0.75
- ✅ Better recall (catch more positive cases)

---

## Conclusion

**The main reason for identical ML scores is:**

1. **Training data has 51% duplicates** → Model can't learn to differentiate
2. **Production data missing static_attributes** → All features default to 0.5
3. **Combined effect** → Model receives identical inputs, predicts identical outputs

**The algorithm is NOT the problem** - it's data quality at both training and inference time.

**Priority fixes:**
1. ✅ Production fix (fetch static_attributes) - DONE
2. ⚠️ Regenerate diverse training data - NEEDED
3. ⚠️ Retrain model with better data - NEEDED
