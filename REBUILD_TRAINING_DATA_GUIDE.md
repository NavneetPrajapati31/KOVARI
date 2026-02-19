# Rebuild Training Data - Step-by-Step Guide

**Why:** Current training data has 51.3% duplicate feature vectors, causing identical ML predictions  
**Goal:** Generate diverse training data with complete user profiles

---

## ✅ Pre-Flight Checklist

Before rebuilding, verify:

- [ ] Seed users exist in Supabase with complete profiles
- [ ] Redis sessions exist for seed users
- [ ] Python dependencies installed (`pip install -r src/lib/ai/datasets/requirements.txt`)
- [ ] Previous training data backed up (optional)

---

## 🔧 Step 1: Verify Seed Users Have Complete Profiles

**Purpose:** Ensure seed users have age, interests, and personality before generating data

```bash
# Check a few seed users
node check-user-in-database.js seed_budget_traveler_001
node check-user-in-database.js seed_luxury_traveler_002
```

**What to look for:**
- ✅ Age is set (not null/undefined)
- ✅ Interests array has values (not empty)
- ✅ Personality is set (introvert/ambivert/extrovert)

**If profiles are incomplete:**
```bash
# Regenerate seed users with complete profiles
node src/lib/ai/datasets/seed-training-data.js
```

---

## 🔧 Step 2: Verify Redis Sessions Exist

**Purpose:** Synthetic data generation needs Redis sessions

```bash
# Check active sessions
node check-redis-sessions.js
```

**Expected:** At least 5-10 active sessions

**If no sessions:**
```bash
# Create sessions for seed users (if script exists)
# Or create sessions manually through the app
```

---

## 🔧 Step 3: Generate New Synthetic Data

**Purpose:** Create diverse match events with complete feature data

```bash
# Generate 500-1000 events (more = better diversity)
node src/lib/ai/datasets/generate-synthetic-match-events.js --count 1000 --match-type solo
```

**What happens:**
- Fetches all seed users and their profiles
- Pairs users and extracts compatibility features
- Generates realistic outcomes based on compatibility
- Writes events to `match_events_synthetic.jsonl`

**Watch for warnings:**
- ⚠️ `Skipping pair: missing profiles` → Seed users need complete profiles
- ⚠️ `Skipping pair: missing sessions` → Need Redis sessions

---

## 🔧 Step 4: Combine with Real Data (Optional)

**Purpose:** Mix synthetic data with real user interactions for better model

```bash
# If you have real interaction data
# Combine synthetic + real data
cat match_events.jsonl match_events_synthetic.jsonl > match_events_combined.jsonl
```

**Or use only synthetic:**
```bash
cp match_events_synthetic.jsonl match_events_combined.jsonl
```

---

## 🔧 Step 5: Build Training Dataset

**Purpose:** Convert events to CSV format for ML training

```bash
python src/lib/ai/datasets/build_training_set.py match_events_combined.jsonl
```

**Output:**
- `datasets/train.csv` - Training set (80%)
- `datasets/val.csv` - Validation set (20%)

---

## 🔧 Step 6: Verify Training Data Quality

**Purpose:** Ensure new data is diverse and has few duplicates

```bash
python analyze-training-data.py
```

**What to check:**

✅ **Good Signs:**
- Duplicate feature vectors: <10%
- `interestScore`: Many unique values, mean not 0.5
- `ageScore`: Many unique values, mean not 0.5
- `personalityScore`: Many unique values, mean not 0.5
- Feature diversity: Each feature has 10+ unique values

❌ **Bad Signs:**
- Duplicate feature vectors: >20%
- Many features defaulting to 0.5
- Low feature diversity (<5 unique values per feature)

**If data quality is still poor:**
- Go back to Step 1: Ensure seed users have complete profiles
- Check Step 3: Verify synthetic data generation is using real profile data

---

## 🔧 Step 7: Retrain Model

**Purpose:** Train model on new, diverse data

```bash
python src/lib/ai/datasets/train_model.py
```

**Output:**
- `models/match_compatibility_model.pkl` - Trained model
- `models/model_features.json` - Feature names
- `models/model_metadata.json` - Training metrics

**Check metrics:**
- ROC-AUC should be >0.65 (ideally >0.70)
- Accuracy should be >0.55
- Model should show learning (not just predicting same value)

---

## 🔧 Step 8: Verify Model Performance

**Purpose:** Test that model now predicts diverse scores

```bash
# Test direct prediction
node test-ml-prediction-direct.js

# Test via API
# Make API requests and check server logs
# ML scores should now vary (not all 0.485-0.486)
```

**Expected:**
- ML scores vary between matches (e.g., 0.42, 0.51, 0.48, 0.55)
- Scores reflect actual match compatibility
- No more identical predictions

---

## 📊 Quality Metrics to Target

### Training Data Quality

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Duplicate feature vectors | 51.3% | <10% | ❌ Need fix |
| interestScore unique values | 6 | >20 | ❌ Need fix |
| ageScore unique values | 9 | >20 | ❌ Need fix |
| personalityScore unique values | 5 | >10 | ❌ Need fix |
| Features defaulting to 0.5 | Many | <5% | ❌ Need fix |

### Model Performance

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| ROC-AUC | 0.66 | >0.70 | ⚠️ Could improve |
| Prediction diversity | Low | High | ❌ Need fix |
| Score range | 0.485-0.486 | 0.30-0.70 | ❌ Need fix |

---

## 🐛 Troubleshooting

### Issue: Still getting many duplicates

**Cause:** Seed users don't have diverse profiles  
**Fix:**
1. Check seed user profiles have different:
   - Ages (e.g., 22, 28, 35, 42)
   - Interests (different combinations)
   - Personalities (introvert, ambivert, extrovert)
2. Regenerate seed users if needed
3. Regenerate synthetic data

### Issue: Features still defaulting to 0.5

**Cause:** Profile data not being used correctly  
**Fix:**
1. Verify `extractSoloMatchFeatures()` in synthetic script uses real profile data
2. Check that profiles have complete data (age, interests, personality)
3. Add validation to skip pairs with incomplete profiles

### Issue: Model still predicts similar scores

**Cause:** Training data still has issues OR production data has defaults  
**Fix:**
1. Verify training data quality (Step 6)
2. Check production data: `node debug-ml-features.js <user_id>`
3. Ensure production users have complete profiles

---

## ✅ Success Criteria

After rebuilding, you should see:

1. **Training Data:**
   - ✅ <10% duplicate feature vectors
   - ✅ Diverse features (20+ unique values per feature)
   - ✅ <5% features defaulting to 0.5

2. **Model Performance:**
   - ✅ ROC-AUC >0.70
   - ✅ Predictions vary between matches
   - ✅ Scores reflect actual compatibility

3. **Production:**
   - ✅ ML scores vary (not all 0.485-0.486)
   - ✅ Scores make sense (better matches = higher scores)

---

## 🚀 Quick Start (All Steps)

```bash
# 1. Verify seed users
node check-user-in-database.js seed_budget_traveler_001

# 2. Generate new synthetic data
node src/lib/ai/datasets/generate-synthetic-match-events.js --count 1000 --match-type solo

# 3. Build training set
python src/lib/ai/datasets/build_training_set.py match_events_synthetic.jsonl

# 4. Verify quality
python analyze-training-data.py

# 5. Retrain model
python src/lib/ai/datasets/train_model.py

# 6. Test
node test-ml-prediction-direct.js
```

---

## 📝 Notes

- **More data = better:** Generate 1000+ events for better diversity
- **Quality > Quantity:** Better to have 500 diverse samples than 2000 identical ones
- **Verify at each step:** Don't proceed if data quality is poor
- **Backup old model:** Keep previous model in case new one is worse

---

**Ready to rebuild? Start with Step 1!** 🚀
