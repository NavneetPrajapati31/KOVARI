# ML Model Testing - Quick Reference

**Quick commands and steps to test the ML model**

---

## 🚀 Quick Start (5 minutes)

### 1. Test Direct ML Prediction
```bash
node test-ml-prediction-direct.js
```
**Expected:** ✅ Score returned (0.0 - 1.0), no errors

### 2. Test via API
```bash
# 1. Start server
npm run dev
# (or: npm.cmd run dev on Windows)

# 2. Get a user ID
node check-redis-sessions.js

# 3. Make API request (replace USER_ID)
curl http://localhost:3000/api/match-solo?userId=USER_ID
```

**Expected:** ✅ Response includes `mlScore` field, server logs show ML scoring

### 3. Verify Scores Are Diverse
- Make 3-5 API requests with different users
- Check that ML scores vary (not all 0.486)
- **If all identical → Check `static_attributes` fetching**

---

## 📋 Test Commands

### Unit Tests
```bash
# Direct ML prediction
node test-ml-prediction-direct.js

# Check Redis sessions
node check-redis-sessions.js
```

### Integration Tests
```bash
# Test ML vs rule-based comparison
node test-ml-vs-rule-based.js

# Test via API (shows test URLs)
node test-ml-performance-api.js
```

### Performance Tests
```bash
# Run direct prediction multiple times to measure latency
node test-ml-prediction-direct.js
```

---

## 🔍 What to Look For

### ✅ Good Signs
- Server logs show: `🤖 ML Scoring: Rule-based=X.XXX, ML=Y.YYY, Blended=Z.ZZZ`
- ML scores vary between matches
- API responses include `mlScore` field
- No timeout errors

### ⚠️ Warning Signs
- All ML scores identical (0.486) → Missing `static_attributes`
- `⚠️ ML scoring unavailable` → ML prediction failed
- Timeout errors → Check Python process
- No `mlScore` in response → ML not integrated

---

## 🐛 Common Issues & Fixes

### Issue: All Scores Identical
**Fix:** Check server logs for `✅ Fetched static_attributes for...`
- If missing, verify Supabase connection
- Check `src/app/api/match-solo/route.ts` attribute fetching logic

### Issue: ML Timeout
**Fix:** 
- Verify prediction queue is working
- Check Python dependencies: `pip install -r src/lib/ai/datasets/requirements.txt`
- Ensure model files exist: `models/match_compatibility_model.pkl`

### Issue: ML Not Working
**Fix:**
1. Test direct: `node test-ml-prediction-direct.js`
2. Check Python: `python --version`
3. Check model: `ls models/match_compatibility_model.pkl`
4. Restart server

---

## 📊 Expected Output

### Server Logs (Good)
```
🤖 ML Scoring: Rule-based=0.625, ML=0.470, Blended=0.519 (-0.106, -17.0%)
✅ Fetched static_attributes for user: user_123
```

### Server Logs (Bad)
```
⚠️ ML scoring unavailable, using rule-based: 0.625
⚠️ ML prediction error: [error message]
```

### API Response (Good)
```json
{
  "matches": [
    {
      "userId": "user_123",
      "mlScore": 0.470,
      "finalScore": 0.519,
      ...
    }
  ]
}
```

---

## 🎯 Success Checklist

- [ ] Direct prediction works (`test-ml-prediction-direct.js`)
- [ ] API returns `mlScore` field
- [ ] Server logs show ML scoring messages
- [ ] ML scores vary (not all identical)
- [ ] No timeout errors
- [ ] Fallback works if ML fails

**If all checked → ML model is working! ✅**

---

## 📚 Full Documentation

See `ML_MODEL_TESTING_PLAN.md` for comprehensive testing guide.

---

**Quick Test:** Run `node test-ml-prediction-direct.js` - if it works, ML is ready! 🚀
