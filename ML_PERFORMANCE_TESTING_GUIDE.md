# ML Model Performance Testing Guide

## ✅ Current Status

- **ML Model**: ✅ Working (tested directly)
- **API Integration**: ✅ Integrated
- **Logging**: ✅ Added to show ML vs rule-based comparison

## 🧪 Test Results

### Direct ML Test
- **Status**: ✅ SUCCESS
- **Model Prediction**: 0.470 (47% probability)
- **Model File**: `models/match_compatibility_model.pkl` ✅

### API Tests
- **Tests Run**: 5
- **Matches Found**: 11
- **ML Scores**: Check server logs (may need server restart)

## 📋 How to Monitor ML Performance

### 1. Check Server Logs

When you make a search request, watch your **server terminal** (where `npm run dev` is running) for these log messages:

#### ✅ ML Scoring Active
```
🤖 ML Scoring: Rule-based=0.625, ML=0.470, Blended=0.519 (-0.106, -17.0%)
```

This shows:
- **Rule-based**: Traditional algorithm score
- **ML**: Pure ML model prediction
- **Blended**: Final score (70% ML + 30% rule-based)
- **Difference**: How much ML changed the score (+/-)
- **% Change**: Percentage change from rule-based

#### ⚠️ ML Fallback
```
⚠️  ML scoring unavailable, using rule-based: 0.625
```

This means ML failed and fell back to rule-based scoring.

#### ❌ ML Errors
```
⚠️  ML prediction error: [error message]
⚠️  ML prediction spawn error: [error message]
```

These indicate issues with the Python ML service.

### 2. Test via API

Use the test script:
```bash
node test-ml-via-api.js
```

Or make direct API calls:
```bash
# Example
curl http://localhost:3000/api/match-solo?userId=seed_luxury_traveler_002
```

### 3. Test Direct ML Prediction

Test the ML model directly:
```bash
node test-ml-prediction-direct.js
```

## 📊 What to Look For

### Good Signs ✅
- Logs show `🤖 ML Scoring:` messages
- ML scores are different from rule-based scores
- Blended scores are being calculated
- No error messages

### Warning Signs ⚠️
- Only seeing `⚠️  ML scoring unavailable` messages
- All scores are the same (ML not working)
- Python errors in logs
- Timeout errors

## 🔧 Troubleshooting

### If ML isn't working:

1. **Check Python is installed**
   ```bash
   python --version
   ```

2. **Check model file exists**
   ```bash
   ls models/match_compatibility_model.pkl
   ```

3. **Test ML directly**
   ```bash
   node test-ml-prediction-direct.js
   ```

4. **Restart server**
   - Stop the server (Ctrl+C)
   - Restart: `npm run dev`
   - Make a new search request

5. **Check server logs**
   - Look for Python errors
   - Look for path errors
   - Look for timeout errors

## 📈 Performance Metrics to Track

1. **ML Availability Rate**
   - How often ML succeeds vs falls back
   - Target: >80% success rate

2. **Score Differences**
   - Average difference between ML and rule-based
   - Positive = ML improves scores
   - Negative = ML decreases scores

3. **Match Quality**
   - Are ML-enhanced matches better?
   - User acceptance rates
   - Chat initiation rates

## 🎯 Expected Behavior

- **ML should run** for every compatible match
- **Logs should show** ML vs rule-based comparison
- **Scores should differ** when ML is active
- **Fallback should work** if ML fails (no errors)

## 💡 Tips

- **First time**: Restart server after ML integration
- **Monitoring**: Keep server logs open while testing
- **Comparison**: Note score differences to evaluate ML value
- **Data**: More training data = better ML performance
