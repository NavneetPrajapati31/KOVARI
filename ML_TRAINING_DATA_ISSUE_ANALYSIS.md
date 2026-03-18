# ML Training Data Issue Analysis

**Problem:** ML model predicts identical scores (0.485-0.486)  
**Root Cause:** Training data has **51.3% duplicate feature vectors** and many features defaulting to 0.5

---

## 🔍 Training Data Analysis Results

### Critical Findings

1. **51.3% Duplicate Feature Vectors** (119 out of 232 samples)
   - This means over half the training data has identical features
   - Model learns that these identical features → same prediction
   - **This is why production predictions are identical!**

2. **Low Feature Diversity:**
   - `interestScore`: Only 6 unique values, mean=0.201 (many defaulting to 0.5)
   - `personalityScore`: Only 5 unique values, mean=0.051 (mostly 0.0 or 1.0)
   - `languageScore`: Only 3 unique values, mostly 0.0
   - `lifestyleScore`: Only 5 unique values
   - `backgroundScore`: Only 5 unique values

3. **Sample Data Shows Defaults:**
   ```
   Row 0: interestScore=0.5, languageScore=0.0, lifestyleScore=0.0, backgroundScore=0.0
   Row 1: interestScore=0.5, languageScore=0.0, lifestyleScore=0.0, backgroundScore=0.0
   Row 2: interestScore=0.5, languageScore=0.0, lifestyleScore=0.0, backgroundScore=0.0
   ```
   Many rows have `interestScore=0.5` (default value)

---

## 🐛 Why This Happened

### Issue 1: Synthetic Data Generation Used Default Values

Looking at `generate-synthetic-match-events.js`:

1. **It DOES fetch profiles from Supabase** (lines 327-328)
2. **BUT** if profiles are missing or incomplete, features default to:
   - `interestScore = 0.5` (if interests missing)
   - `ageScore = 0.5` (if age missing)
   - `personalityScore = 0.5` (if personality missing)

3. **Many seed users may not have complete profiles:**
   - Seed users created in `seed-training-data.js` have profiles
   - BUT if those profiles weren't fully populated, features default to 0.5
   - OR if the feature extraction logic differs between synthetic and production

### Issue 2: Feature Extraction Differences

**Synthetic Data Generation:**
- Uses simplified feature extraction (lines 231-294)
- `calculateInterestSimilarity()` returns `0.3` if interests missing (line 233)
- `calculateAgeCompatibility()` returns `0.5` if age missing (line 246)

**Production Code:**
- Uses `extractCompatibilityFeatures()` from `compatibility-features.ts`
- `jaccard()` returns `NEUTRAL_SCORE` (0.5) if interests missing
- `ageScore()` returns `NEUTRAL_SCORE` (0.5) if age missing

**Result:** Both default to 0.5, but the extraction logic might differ slightly, causing inconsistencies.

---

## 🔧 The Real Problem

### Training Data Quality Issues

1. **Too Many Default Values:**
   - 51.3% of samples have identical features
   - Many features defaulting to 0.5
   - Model learns: "Most matches have interestScore=0.5, ageScore=0.5, personalityScore=0.5"

2. **Model Learned the Wrong Pattern:**
   - Model sees: `[distance=1.0, dateOverlap=0.9, budget=1.0, interest=0.5, age=0.5, personality=0.5]` → predicts 0.485
   - Model sees: `[distance=1.0, dateOverlap=0.9, budget=0.6, interest=0.5, age=0.5, personality=0.5]` → predicts 0.485
   - **Same prediction because most features are identical!**

3. **Production Matches Have Same Issue:**
   - Production users also missing `static_attributes`
   - Production features also default to 0.5
   - **Same feature vectors → same predictions!**

---

## ✅ Solution: Fix Both Training Data AND Production Data

### Step 1: Regenerate Training Data with Complete Profiles

**Problem:** Training data has too many defaults  
**Fix:** Ensure all seed users have complete profiles before generating synthetic data

```bash
# 1. Verify seed users have complete profiles
node check-user-in-database.js seed_budget_traveler_001

# 2. If profiles incomplete, update them or regenerate seed data
node src/lib/ai/datasets/seed-training-data.js

# 3. Regenerate synthetic data with complete profiles
node src/lib/ai/datasets/generate-synthetic-match-events.js --count 500

# 4. Rebuild training set
python src/lib/ai/datasets/build_training_set.py match_events_combined.jsonl

# 5. Retrain model
python src/lib/ai/datasets/train_model.py
```

### Step 2: Fix Production Feature Extraction

**Problem:** Production users missing `static_attributes`  
**Fix:** Already implemented! The code fetches from Supabase (lines 356-455 in `match-solo/route.ts`)

**But verify it's working:**
```bash
# Check if static_attributes are being fetched
node debug-ml-features.js <user_id>
```

### Step 3: Improve Synthetic Data Generation

**Problem:** Synthetic script might not be using real profile data correctly  
**Fix:** Update `generate-synthetic-match-events.js` to:

1. **Verify profiles are complete before generating:**
   ```javascript
   if (!profile1.age || !profile1.interests?.length || !profile1.personality) {
     console.warn(`⚠️  Skipping: incomplete profile for ${user1.clerk_user_id}`);
     continue;
   }
   ```

2. **Use same feature extraction as production:**
   - Import or replicate `extractCompatibilityFeatures()` logic
   - Ensure consistency between training and production

3. **Add validation:**
   ```javascript
   // After feature extraction
   if (features.interestScore === 0.5 && features.ageScore === 0.5) {
     console.warn(`⚠️  Warning: Features defaulting to 0.5 for pair`);
   }
   ```

---

## 📊 Expected vs Actual Training Data

### Expected (Good Training Data)

- **Diverse features:** interestScore ranges from 0.0 to 1.0
- **Few duplicates:** <10% duplicate feature vectors
- **Complete profiles:** All users have age, interests, personality
- **Model learns:** Different features → different predictions

### Actual (Current Training Data)

- **Limited diversity:** interestScore only 6 unique values, many 0.5
- **Many duplicates:** 51.3% duplicate feature vectors
- **Incomplete profiles:** Many features defaulting to 0.5
- **Model learned:** Most matches have same features → same prediction

---

## 🎯 Action Plan

### Immediate Fix (Quick)

1. **Verify production data:**
   ```bash
   node debug-ml-features.js <user_id>
   ```
   - Check if `static_attributes` are being fetched
   - Verify features are diverse

2. **If production data is good but predictions are still identical:**
   - The model was trained on bad data
   - Need to retrain with better data

### Long-term Fix (Proper)

1. **Regenerate training data:**
   - Ensure all seed users have complete profiles
   - Verify synthetic data generation uses real profile data
   - Generate more diverse synthetic data

2. **Retrain model:**
   - Use new training data with diverse features
   - Verify training data has <10% duplicates
   - Check model metrics improve

3. **Verify production:**
   - Ensure production users have complete profiles
   - Verify feature extraction is consistent
   - Test that ML scores now vary

---

## 💡 Key Insight

**The problem is BOTH:**
1. **Training data** has too many defaults (51.3% duplicates)
2. **Production data** also has defaults (missing `static_attributes`)

**The fix requires BOTH:**
1. **Retrain model** with better, more diverse training data
2. **Ensure production** users have complete profiles

**Even if you fix production data, the model will still predict similar scores because it was trained on data where most features were 0.5!**

---

## 📝 Summary

**Root Cause:**
- Training data has 51.3% duplicate feature vectors
- Many features defaulting to 0.5 in training data
- Model learned that most matches have identical features
- Production data also has defaults, reinforcing the pattern

**Solution:**
1. Regenerate training data with complete user profiles
2. Retrain model with diverse training data
3. Ensure production users have complete profiles
4. Verify ML scores now vary

**Next Steps:**
1. Run `debug-ml-features.js` to check production data
2. If production data is good → retrain model with better data
3. If production data is bad → fix both training and production
