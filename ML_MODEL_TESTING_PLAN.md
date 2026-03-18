# ML Model Testing Plan

**Purpose:** Comprehensive testing plan to validate ML model performance, accuracy, and integration in the KOVARI matching system.

**Status:** Ready for execution  
**Last Updated:** January 2025

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Test Categories](#test-categories)
3. [Test Execution Order](#test-execution-order)
4. [Detailed Test Procedures](#detailed-test-procedures)
5. [Success Criteria](#success-criteria)
6. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

Before starting tests, ensure:

- [ ] **Server is running**: `npm run dev` (or `npm.cmd run dev` on Windows)
- [ ] **Python environment**: Python 3.8+ installed with dependencies
  ```bash
  cd src/lib/ai/datasets
  pip install -r requirements.txt
  ```
- [ ] **Model files exist**:
  - `models/match_compatibility_model.pkl`
  - `models/model_features.json`
  - `models/model_metadata.json`
- [ ] **Redis is running**: Active Redis connection with test sessions
- [ ] **Test data available**: At least 5-10 active user sessions in Redis
- [ ] **Supabase connection**: Valid credentials in `.env.local`

---

## 🧪 Test Categories

### 1. **Unit Tests** (Direct ML Prediction)
- Test ML model directly without API
- Validate feature extraction
- Check model loading and prediction

### 2. **Integration Tests** (API Endpoints)
- Test `/api/match-solo` with ML integration
- Test `/api/match-groups` with ML integration
- Verify ML scores in API responses

### 3. **Performance Tests** (Latency & Throughput)
- Measure prediction time
- Test concurrent requests
- Check queue behavior

### 4. **Accuracy Tests** (ML vs Rule-Based)
- Compare ML scores with rule-based scores
- Analyze score differences
- Validate blended scoring (70% ML + 30% rule-based)

### 5. **Edge Case Tests**
- Missing features
- Invalid data
- Timeout scenarios
- Fallback behavior

### 6. **End-to-End Tests** (Full Workflow)
- Complete matching flow
- Multiple users
- Real-world scenarios

---

## 📊 Test Execution Order

**Recommended sequence:**

1. **Phase 1: Unit Tests** (5-10 min)
   - Verify model loads correctly
   - Test direct predictions
   - Validate feature extraction

2. **Phase 2: Integration Tests** (10-15 min)
   - Test API endpoints
   - Verify ML scores in responses
   - Check server logs

3. **Phase 3: Performance Tests** (10-15 min)
   - Measure latency
   - Test concurrent requests
   - Validate queue behavior

4. **Phase 4: Accuracy Tests** (15-20 min)
   - Compare ML vs rule-based
   - Analyze score distributions
   - Validate improvements

5. **Phase 5: Edge Case Tests** (10-15 min)
   - Test error scenarios
   - Verify fallback behavior
   - Check data validation

6. **Phase 6: End-to-End Tests** (15-20 min)
   - Full workflow testing
   - Multiple user scenarios
   - Real-world validation

**Total Estimated Time:** 65-95 minutes

---

## 🔬 Detailed Test Procedures

### Phase 1: Unit Tests

#### Test 1.1: Direct ML Prediction
**Purpose:** Verify ML model loads and predicts correctly

**Steps:**
```bash
node test-ml-prediction-direct.js
```

**Expected Results:**
- ✅ Python process starts successfully
- ✅ Model loads without errors
- ✅ Prediction returns valid score (0.0 - 1.0)
- ✅ JSON response includes: `success: true`, `score`, `probability`, `prediction`

**Success Criteria:**
- Exit code: 0
- Score range: 0.0 - 1.0
- No Python errors

**What to Check:**
- Model file path is correct
- Python dependencies installed
- Feature format matches model expectations

---

#### Test 1.2: Feature Extraction Validation
**Purpose:** Verify features are extracted correctly from sessions

**Steps:**
1. Check active Redis sessions:
   ```bash
   node check-redis-sessions.js
   ```

2. Review feature extraction in code:
   - `src/lib/ai/features/compatibility-features.ts`
   - Verify all required features are extracted

**Expected Results:**
- ✅ All sessions have required fields (destination, dates, budget)
- ✅ `static_attributes` are fetched from Supabase if missing
- ✅ Features normalized to [0, 1] range

**Success Criteria:**
- No missing features
- All scores in valid range
- `static_attributes` present for test users

---

### Phase 2: Integration Tests

#### Test 2.1: Solo Matching API with ML
**Purpose:** Verify ML integration in `/api/match-solo` endpoint

**Steps:**
1. Start server (if not running):
   ```bash
   npm run dev
   # or on Windows PowerShell:
   npm.cmd run dev
   ```

2. Get a test user ID from Redis:
   ```bash
   node check-redis-sessions.js
   ```

3. Make API request:
   ```bash
   # Replace USER_ID with actual user ID
   curl http://localhost:3000/api/match-solo?userId=USER_ID
   ```

   Or use browser:
   ```
   http://localhost:3000/api/match-solo?userId=USER_ID
   ```

4. **Watch server logs** for ML scoring output:
   ```
   🤖 ML Scoring: Rule-based=0.625, ML=0.470, Blended=0.519 (-0.106, -17.0%)
   ```

**Expected Results:**
- ✅ API returns 200 status
- ✅ Response includes `matches` array
- ✅ Each match has `mlScore` field
- ✅ Server logs show ML scoring messages
- ✅ Scores vary between matches (not all identical)

**Success Criteria:**
- ML scores present in response
- Logs show ML vs rule-based comparison
- No timeout errors
- Scores are diverse (not all 0.486)

**What to Check:**
- Server terminal for ML logs
- API response JSON structure
- `mlScore` values in matches

---

#### Test 2.2: Group Matching API with ML
**Purpose:** Verify ML integration in `/api/match-groups` endpoint

**Steps:**
1. Ensure server is running

2. Get a test user ID with group preferences

3. Make POST request:
   ```bash
   curl -X POST http://localhost:3000/api/match-groups \
     -H "Content-Type: application/json" \
     -d '{"userId": "USER_ID"}'
   ```

4. **Watch server logs** for ML scoring

**Expected Results:**
- ✅ API returns 200 status
- ✅ Response includes `groups` array
- ✅ ML scores calculated for group matches
- ✅ Server logs show ML scoring

**Success Criteria:**
- ML integration working for groups
- Scores calculated correctly
- No errors in logs

---

### Phase 3: Performance Tests

#### Test 3.1: Prediction Latency
**Purpose:** Measure ML prediction time

**Steps:**
1. Run direct prediction test multiple times:
   ```bash
   node test-ml-prediction-direct.js
   ```

2. Measure time from feature input to prediction output

3. Check server logs for timing information

**Expected Results:**
- ✅ First prediction: 8-12 seconds (model loading)
- ✅ Subsequent predictions: <2 seconds (cached model)
- ✅ Queue prevents parallel timeouts

**Success Criteria:**
- Initial load: <15 seconds
- Subsequent predictions: <3 seconds
- No timeout errors

**Performance Targets:**
- Model load time: <15s
- Prediction time: <3s
- Total API response: <5s (including matching logic)

---

#### Test 3.2: Concurrent Requests
**Purpose:** Test ML model under load

**Steps:**
1. Create test script to make 5-10 concurrent API requests

2. Monitor server logs for:
   - Queue behavior
   - Timeout handling
   - Error rates

**Expected Results:**
- ✅ Requests queued properly
- ✅ No parallel model loading
- ✅ Predictions complete successfully
- ✅ Fallback works if ML fails

**Success Criteria:**
- All requests complete
- Queue prevents timeouts
- No memory leaks

---

### Phase 4: Accuracy Tests

#### Test 4.1: ML vs Rule-Based Comparison
**Purpose:** Compare ML scores with rule-based scores

**Steps:**
```bash
node test-ml-vs-rule-based.js
```

**Expected Results:**
- ✅ Report generated showing:
  - Rule-based scores
  - ML scores
  - Blended scores
  - Differences and % changes
- ✅ ML scores differ from rule-based (not identical)
- ✅ Score distribution makes sense

**Success Criteria:**
- ML scores vary (not all identical)
- Average difference > 0.01 (ML has impact)
- Blended scores calculated correctly
- Report saved to `ml-performance-report.json`

**What to Analyze:**
- Average score differences
- % of matches improved by ML
- Score distribution patterns
- Correlation with match quality

---

#### Test 4.2: Score Diversity Analysis
**Purpose:** Verify ML scores are diverse and meaningful

**Steps:**
1. Run multiple API requests with different users

2. Collect ML scores from responses

3. Analyze score distribution:
   - Min, max, average
   - Standard deviation
   - Score range

**Expected Results:**
- ✅ Scores vary across matches
- ✅ Score range: 0.3 - 0.7 (typical)
- ✅ Standard deviation > 0.05
- ✅ No clustering at single value

**Success Criteria:**
- Diverse scores (not all 0.486)
- Scores reflect match quality
- Higher scores for better matches

---

### Phase 5: Edge Case Tests

#### Test 5.1: Missing Features
**Purpose:** Verify fallback when features are missing

**Steps:**
1. Create test session with missing `static_attributes`

2. Make API request

3. Verify:
   - `static_attributes` fetched from Supabase
   - ML prediction still works
   - No errors in logs

**Expected Results:**
- ✅ System fetches missing attributes
- ✅ ML prediction succeeds
- ✅ Logs show attribute fetching

**Success Criteria:**
- Graceful handling of missing data
- Automatic attribute fetching
- No prediction errors

---

#### Test 5.2: Invalid Data
**Purpose:** Test error handling for invalid inputs

**Steps:**
1. Test with:
   - Invalid user ID
   - Missing destination
   - Invalid dates
   - Null values

**Expected Results:**
- ✅ Appropriate error messages
- ✅ Fallback to rule-based if ML fails
- ✅ No crashes or unhandled errors

**Success Criteria:**
- Errors handled gracefully
- Fallback works correctly
- System remains stable

---

#### Test 5.3: Timeout Scenarios
**Purpose:** Verify timeout handling

**Steps:**
1. Simulate slow Python process

2. Test prediction timeout (25 seconds)

3. Verify fallback behavior

**Expected Results:**
- ✅ Timeout handled gracefully
- ✅ Fallback to rule-based
- ✅ No hanging requests

**Success Criteria:**
- Timeout < 30 seconds
- Fallback works
- System recovers

---

### Phase 6: End-to-End Tests

#### Test 6.1: Complete Matching Flow
**Purpose:** Test full matching workflow with ML

**Steps:**
1. Create multiple user sessions with diverse profiles

2. Run matching for each user:
   ```bash
   node test-ml-performance-api.js
   ```

3. Verify:
   - Matches found
   - ML scores calculated
   - Results ranked correctly
   - Blended scores used

**Expected Results:**
- ✅ Complete workflow executes
- ✅ ML scores in all matches
- ✅ Results ranked by blended score
- ✅ Top matches are high quality

**Success Criteria:**
- End-to-end flow works
- ML integrated throughout
- Results make sense

---

#### Test 6.2: Multiple User Scenarios
**Purpose:** Test with various user profiles

**Steps:**
1. Test with different:
   - Age ranges
   - Destinations
   - Budget levels
   - Interests
   - Personalities

2. Verify ML scores adapt to different profiles

**Expected Results:**
- ✅ ML scores vary by profile
- ✅ Better matches get higher scores
- ✅ Diverse results for different users

**Success Criteria:**
- ML adapts to user profiles
- Scores reflect compatibility
- Results are personalized

---

## ✅ Success Criteria

### Overall ML Model Testing Success

**Must Have:**
- ✅ ML model loads successfully
- ✅ Predictions complete without errors
- ✅ ML scores integrated in API responses
- ✅ Scores are diverse (not all identical)
- ✅ Fallback works when ML fails
- ✅ Performance acceptable (<5s total)

**Should Have:**
- ✅ ML scores improve match quality
- ✅ Score differences > 0.01 on average
- ✅ >80% prediction success rate
- ✅ Logs show ML vs rule-based comparison

**Nice to Have:**
- ✅ ML scores correlate with user engagement
- ✅ Prediction time <2s after initial load
- ✅ Comprehensive test coverage
- ✅ Automated test suite

---

## 🔧 Troubleshooting

### Issue: ML Scores All Identical (0.486)

**Symptoms:**
- All matches have same ML score
- No variation in predictions

**Root Cause:**
- Missing `static_attributes` in Redis sessions
- Features defaulting to neutral values

**Solution:**
1. Verify `static_attributes` are fetched from Supabase
2. Check server logs for: `✅ Fetched static_attributes for...`
3. Ensure feature extraction uses real data, not defaults

**Verification:**
```bash
# Check if attributes are being fetched
# Look in server logs for attribute fetching messages
```

---

### Issue: ML Prediction Timeout

**Symptoms:**
- Predictions timeout (>25 seconds)
- Python process hangs

**Root Cause:**
- Parallel model loading
- Python process not ready

**Solution:**
1. Verify prediction queue is working
2. Check `isProcessingQueue` flag
3. Ensure Python process starts correctly
4. Consider using persistent ML server

**Verification:**
```bash
# Check server logs for queue messages
# Verify only one prediction at a time
```

---

### Issue: ML Prediction Fails

**Symptoms:**
- `mlScore: null` in responses
- Fallback to rule-based only

**Root Cause:**
- Python script errors
- Model file missing
- Feature mismatch

**Solution:**
1. Test direct prediction:
   ```bash
   node test-ml-prediction-direct.js
   ```
2. Check Python dependencies:
   ```bash
   pip install -r src/lib/ai/datasets/requirements.txt
   ```
3. Verify model files exist
4. Check feature format matches model

**Verification:**
- Direct prediction test should work
- Check Python stderr for errors

---

### Issue: No ML Scores in API Response

**Symptoms:**
- API returns matches but no `mlScore` field
- Server logs show no ML messages

**Root Cause:**
- ML integration not active
- Feature extraction failing
- ML disabled in config

**Solution:**
1. Verify ML integration in `solo.ts` and `group.ts`
2. Check `calculateMLCompatibilityScore` is called
3. Verify feature extraction works
4. Check server logs for errors

**Verification:**
- Check `src/lib/matching/solo.ts` for ML calls
- Verify `ml-scoring.ts` is imported

---

### Issue: Server Crashes on ML Prediction

**Symptoms:**
- Server crashes when making matches
- Unhandled promise rejections

**Root Cause:**
- Unhandled errors in ML prediction
- Python process errors not caught

**Solution:**
1. Check error handling in `ml-scoring.ts`
2. Verify all promises are caught
3. Add try-catch blocks
4. Check Python script error handling

**Verification:**
- Review error handling code
- Test with invalid inputs
- Check server logs for stack traces

---

## 📈 Performance Benchmarks

### Target Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Model Load Time | <15s | ~8-12s |
| Prediction Time | <3s | ~1-2s |
| API Response Time | <5s | ~3-4s |
| ML Success Rate | >80% | TBD |
| Score Diversity (std dev) | >0.05 | TBD |
| Average Score Difference | >0.01 | TBD |

---

## 📝 Test Report Template

After completing tests, document results:

```markdown
## ML Model Test Report

**Date:** [Date]
**Tester:** [Name]
**Environment:** [Dev/Staging/Prod]

### Test Results Summary

- Unit Tests: [Pass/Fail] - [Notes]
- Integration Tests: [Pass/Fail] - [Notes]
- Performance Tests: [Pass/Fail] - [Notes]
- Accuracy Tests: [Pass/Fail] - [Notes]
- Edge Case Tests: [Pass/Fail] - [Notes]
- E2E Tests: [Pass/Fail] - [Notes]

### Key Findings

- ML Model Status: [Working/Broken/Needs Fix]
- Performance: [Acceptable/Needs Improvement]
- Accuracy: [Good/Poor/Needs More Data]
- Issues Found: [List]
- Recommendations: [List]

### Next Steps

- [ ] Fix identified issues
- [ ] Retrain model with more data
- [ ] Optimize performance
- [ ] Deploy to production
```

---

## 🚀 Quick Start Testing

**For quick validation (10 minutes):**

1. **Test direct prediction:**
   ```bash
   node test-ml-prediction-direct.js
   ```

2. **Test via API:**
   - Start server
   - Make API request
   - Check server logs for ML scores

3. **Verify scores are diverse:**
   - Make 3-5 API requests
   - Check ML scores vary (not all identical)

**If all pass → ML model is working!**

---

## 📚 Additional Resources

- `ML_PERFORMANCE_TESTING_GUIDE.md` - Detailed performance testing
- `ML_IDENTICAL_SCORES_ROOT_CAUSE.md` - Troubleshooting identical scores
- `test-ml-prediction-direct.js` - Direct prediction test
- `test-ml-vs-rule-based.js` - Comparison test
- `test-ml-performance-api.js` - API performance test

---

**Ready to test? Start with Phase 1 and work through each phase systematically!**
