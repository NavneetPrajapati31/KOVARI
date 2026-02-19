# Next Steps After Retraining Model

**Status:** ✅ Model retrained with new data (ROC-AUC 0.90)  
**Goal:** Verify model works correctly and ML scores vary

---

## 🎯 Immediate Next Steps

### Step 1: Test Direct ML Prediction (2 minutes)

**Purpose:** Verify model loads and predicts correctly

```bash
node test-ml-prediction-direct.js
```

**Expected:**
- ✅ Model loads successfully
- ✅ Prediction returns valid score (0.0 - 1.0)
- ✅ Score is NOT 0.485 (should vary)

**If it works:** Proceed to Step 2  
**If it fails:** Check Python/model files

---

### Step 2: Test via API (5 minutes)

**Purpose:** Verify ML integration works in production

1. **Start server** (if not running):
   ```bash
   npm run dev
   # or: npm.cmd run dev
   ```

2. **Get a test user ID:**
   ```bash
   node check-redis-sessions.js
   ```

3. **Make API request:**
   ```bash
   curl http://localhost:3000/api/match-solo?userId=USER_ID
   ```

4. **Watch server logs** for:
   ```
   🤖 ML Scoring: Rule-based=X.XXX, ML=Y.YYY, Blended=Z.ZZZ
   ```

**Expected:**
- ✅ API returns 200 status
- ✅ Response includes `mlScore` field
- ✅ ML scores vary between matches (NOT all 0.485-0.486)
- ✅ Server logs show ML scoring messages

**If scores still identical:** Check `static_attributes` are being fetched

---

### Step 3: Verify Score Diversity (5 minutes)

**Purpose:** Confirm ML scores are diverse and meaningful

1. **Make 3-5 API requests** with different users
2. **Check ML scores** in responses
3. **Verify scores vary** (e.g., 0.42, 0.51, 0.48, 0.55)

**Expected:**
- ✅ Scores vary between matches
- ✅ Scores reflect match quality
- ✅ Better matches have higher scores

**If scores still identical:**
- Run: `node debug-ml-features.js <user_id>`
- Check if `static_attributes` are populated
- Verify features are diverse

---

## ✅ Success Criteria

After completing these steps, you should see:

1. **Direct prediction works:**
   - ✅ Model loads and predicts
   - ✅ Scores vary (not all 0.485)

2. **API integration works:**
   - ✅ ML scores in API responses
   - ✅ Server logs show ML scoring
   - ✅ No timeout errors

3. **Score diversity:**
   - ✅ ML scores vary between matches
   - ✅ Scores make sense (better matches = higher scores)

---

## 🐛 Troubleshooting

### Issue: ML scores still identical (0.485-0.486)

**Diagnosis:**
```bash
node debug-ml-features.js <user_id>
```

**Common causes:**
- `static_attributes` missing in Redis sessions
- Features defaulting to 0.5
- Users don't have complete profiles

**Fix:**
- Ensure users have complete profiles (age, interests, personality)
- Verify `static_attributes` are fetched from Supabase
- Check server logs for: `✅ Fetched static_attributes for...`

---

### Issue: ML prediction fails/timeout

**Check:**
1. Model files exist: `models/match_compatibility_model.pkl`
2. Python dependencies: `pip install -r src/lib/ai/datasets/requirements.txt`
3. Test direct: `node test-ml-prediction-direct.js`

---

### Issue: API returns error

**Check:**
1. Server is running
2. Redis is connected
3. User has active session
4. Check server logs for errors

---

## 📊 Expected Results

### Before (Old Model)
- ML scores: All 0.485-0.486 (identical)
- Feature diversity: Low (many defaults)
- Model performance: ROC-AUC 0.66

### After (New Model)
- ML scores: Vary (0.42, 0.51, 0.48, 0.55)
- Feature diversity: High (diverse features)
- Model performance: ROC-AUC 0.90

---

## 🚀 Quick Start

**Fastest way to verify everything works:**

```bash
# 1. Test direct prediction
node test-ml-prediction-direct.js

# 2. Test via API (if server running)
curl http://localhost:3000/api/match-solo?userId=YOUR_USER_ID

# 3. Check server logs for ML scores
# Should see: 🤖 ML Scoring: Rule-based=X.XXX, ML=Y.YYY, Blended=Z.ZZZ
```

---

## 📝 Summary

**What we've done:**
- ✅ Built new training data (20,000 samples, 0% duplicates)
- ✅ Retrained model (ROC-AUC 0.90, 6 features)
- ✅ Verified feature alignment

**What to do now:**
1. Test direct prediction
2. Test via API
3. Verify score diversity

**If all pass:** ML model is working correctly! 🎉

---

**Ready to test? Start with Step 1!** 🚀
