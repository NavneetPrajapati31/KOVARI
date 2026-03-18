# ML Identical Scores Fix Guide

**Problem:** ML model is predicting identical scores (0.485-0.486) for all matches  
**Root Cause:** Features are identical because `static_attributes` are missing or defaulting to neutral values  
**Status:** Diagnostic script created, fix steps outlined

---

## 🔍 Root Cause Analysis

### Why Scores Are Identical

The ML model receives **feature vectors** as input. If all feature vectors are identical, the model will predict identical scores.

**Feature Extraction Flow:**
1. `calculateMLCompatibilityScore()` extracts features using `extractCompatibilityFeatures()`
2. Features include: `distanceScore`, `dateOverlapScore`, `budgetScore`, `interestScore`, `ageScore`, `personalityScore`
3. If `static_attributes` are missing, features default to `NEUTRAL_SCORE` (0.5)

**Default Values:**
- `interestScore = 0.5` if interests are missing/empty
- `ageScore = 0.5` if age is undefined
- `personalityScore = 0.5` if personality is missing

**Result:** If all users have missing `static_attributes`, all features become identical → identical ML scores

---

## 🐛 Diagnostic Steps

### Step 1: Run Diagnostic Script

```bash
node debug-ml-features.js <user_id>
```

Example:
```bash
node debug-ml-features.js user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9
```

**What it checks:**
- ✅ Whether `static_attributes` exist in Redis sessions
- ✅ Whether `static_attributes` can be fetched from Supabase
- ✅ What features are extracted for each match
- ✅ Whether features are identical across matches
- ✅ Which features are defaulting to 0.5

**Expected Output:**
- Shows feature values for each match
- Identifies which features are defaulting
- Shows whether `static_attributes` are missing

---

### Step 2: Check Server Logs

Look for these log messages in your server output:

**Good Signs:**
```
✅ Fetched static_attributes for user_xxx: age=25, interests=3
```

**Bad Signs:**
```
⚠️ Could not fetch static_attributes for user_xxx
```

**Feature Logs:**
```
🔍 ML Features: {"matchType":"user_user","distance":"1.000","dateOverlap":"0.900","budget":"1.000","interest":"0.500","age":"0.500","personality":"0.500"}
```

If you see `interest: 0.500`, `age: 0.500`, `personality: 0.500` → These are defaults!

---

## 🔧 Fix Solutions

### Solution 1: Ensure Users Have Complete Profiles

**Problem:** Users haven't completed onboarding, so `static_attributes` are missing

**Fix:**
1. **Check if users exist in Supabase:**
   ```bash
   node check-user-in-database.js <user_id>
   ```

2. **Verify profiles are complete:**
   - Age should be set
   - Interests should be an array with values
   - Personality should be set (introvert/ambivert/extrovert)

3. **Complete onboarding for test users:**
   - Go through full profile setup
   - Ensure all fields are filled
   - Verify data is saved to Supabase

---

### Solution 2: Verify Static Attributes Fetching

**Problem:** `static_attributes` fetching code might not be working correctly

**Check:**
1. Look at `src/app/api/match-solo/route.ts` lines 356-455
2. Verify the Supabase query is correct
3. Check if profile data structure matches expectations

**Debug:**
Add more logging to see what's being fetched:
```typescript
console.log('Profile fetched:', JSON.stringify(profile, null, 2));
console.log('Static attributes set:', JSON.stringify(matchSession.static_attributes, null, 2));
```

---

### Solution 3: Verify Feature Extraction

**Problem:** Features might not be using `static_attributes` correctly

**Check:**
1. Look at `src/lib/ai/features/compatibility-features.ts`
2. Verify `jaccard()`, `ageScore()`, `personalityScore()` functions
3. Check if they're receiving the correct data

**Test:**
The diagnostic script (`debug-ml-features.js`) shows what features are extracted. Compare:
- What `static_attributes` are available
- What features are calculated
- Whether features match expectations

---

### Solution 4: Add Fallback Data

**Problem:** Even with fetching, some users might not have complete profiles

**Fix:** Add better defaults or skip ML for incomplete profiles

**Option A:** Skip ML if critical features are missing
```typescript
if (!userSession.static_attributes?.age || 
    !userSession.static_attributes?.interests?.length ||
    !userSession.static_attributes?.personality) {
  console.warn('⚠️  Skipping ML - incomplete static_attributes');
  return null; // Fall back to rule-based
}
```

**Option B:** Use session data as fallback
```typescript
const age = userSession.static_attributes?.age || 
            userSession.age || 
            25; // Default age
```

---

## 📊 Expected vs Actual

### Expected Behavior

**Different Users → Different Features → Different ML Scores**

Example:
- User A (age: 25, interests: ["travel", "food"], personality: "extrovert")
- User B (age: 30, interests: ["photography", "adventure"], personality: "introvert")
- User C (age: 28, interests: ["travel", "music"], personality: "ambivert")

**Features should vary:**
- `ageScore`: Different (based on age differences)
- `interestScore`: Different (based on interest overlap)
- `personalityScore`: Different (based on personality compatibility)

**ML Scores should vary:**
- Match 1: 0.486
- Match 2: 0.512
- Match 3: 0.498

### Actual Behavior (Current Issue)

**All Users → Same Features → Same ML Scores**

- All users have missing `static_attributes`
- All features default to 0.5
- All ML scores = 0.485-0.486

---

## ✅ Verification Steps

After applying fixes:

1. **Run diagnostic script:**
   ```bash
   node debug-ml-features.js <user_id>
   ```

2. **Check output:**
   - ✅ Features should vary between matches
   - ✅ `interestScore`, `ageScore`, `personalityScore` should NOT all be 0.5
   - ✅ `static_attributes` should be populated

3. **Test API:**
   ```bash
   curl http://localhost:3000/api/match-solo?userId=<user_id>
   ```

4. **Check server logs:**
   - ✅ Should see: `✅ Fetched static_attributes for...`
   - ✅ Features should show different values
   - ✅ ML scores should vary (not all 0.485-0.486)

---

## 🎯 Quick Fix Checklist

- [ ] Run `debug-ml-features.js` to identify the issue
- [ ] Check if users have complete profiles in Supabase
- [ ] Verify `static_attributes` are being fetched correctly
- [ ] Ensure feature extraction uses real data (not defaults)
- [ ] Test with users who have complete profiles
- [ ] Verify ML scores now vary between matches

---

## 📝 Code Locations

**Key Files:**
- `src/app/api/match-solo/route.ts` (lines 356-455) - Fetches `static_attributes`
- `src/lib/ai/matching/ml-scoring.ts` (lines 296-347) - Calls feature extraction
- `src/lib/ai/features/compatibility-features.ts` (lines 198-251) - Extracts features
- `debug-ml-features.js` - Diagnostic script

**Feature Extraction Functions:**
- `jaccard()` (line 144) - Interest similarity (defaults to 0.5)
- `ageScore()` (line 158) - Age compatibility (defaults to 0.5)
- `personalityScore()` (line 170) - Personality match (defaults to 0.5)

---

## 💡 Summary

**The Issue:**
- ML scores are identical because features are identical
- Features are identical because `static_attributes` are missing
- Missing `static_attributes` cause features to default to 0.5

**The Fix:**
1. Ensure users have complete profiles (age, interests, personality)
2. Verify `static_attributes` are fetched from Supabase
3. Check that feature extraction uses real data
4. Test with complete user profiles

**The Diagnostic:**
- Run `debug-ml-features.js` to identify the exact issue
- Check server logs for `static_attributes` fetching
- Verify features are different between matches

---

**Next Steps:**
1. Run the diagnostic script
2. Identify which users are missing `static_attributes`
3. Complete their profiles or fix the fetching logic
4. Verify ML scores now vary
