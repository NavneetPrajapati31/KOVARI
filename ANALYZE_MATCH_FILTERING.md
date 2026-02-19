# Match Filtering Analysis

## Current Situation

**User 1 (user_36Z05CDtB7mzL7rJBwAVfblep2k):**
- ✅ **Passed** - Blended Score: **0.771** (above 0.25 threshold)
- ML Score: 0.753 (high - good match)
- Rule-based: 0.814
- Interest: 0.343 (some shared interests)
- destination_interest: 0.343

**User 2 (user_2zghYyxAutjzjAGehuA2xjI1XxQ):**
- ❌ **Filtered** - Blended Score: **0.241** (below 0.25 threshold)
- ML Score: 0.031 (very low - poor match)
- Rule-based: 0.730 (still high)
- Interest: **0.000** (NO shared interests!) ⚠️
- destination_interest: 0.000

## Why User 2 Was Filtered

The ML model correctly identified that **User 2 has NO shared interests** (`interest=0.000`), which is a strong negative signal. The model was trained to recognize this as a poor match.

**Blended Score Calculation:**
```
Blended = 70% ML + 30% Rule-based
Blended = 0.7 × 0.031 + 0.3 × 0.730
Blended = 0.0217 + 0.219
Blended = 0.241
```

Since 0.241 < 0.25 (threshold), the match was filtered out.

## The Issue

The ML model is working correctly - it's identifying that User 2 is a poor match due to:
- **Zero shared interests** (interest=0.000)
- This creates a very low ML score (0.031)

However, the rule-based score is still high (0.730), which suggests:
1. Rule-based scoring might not penalize missing interests enough
2. The 70/30 ML/rule-based blend might be too aggressive

## Solutions

### Option 1: Lower the Threshold (Quick Fix)
Change the minimum score threshold from 0.25 to 0.20 or 0.22:

**File:** `src/lib/matching/config.ts` or wherever `presetConfig.minScore` is defined

**Impact:** More matches will pass, but may include lower-quality matches

### Option 2: Adjust Blending Ratio (Better Solution)
Change from 70% ML / 30% Rule-based to 60% ML / 40% Rule-based:

**File:** `src/lib/matching/solo.ts` (line 454)

**Current:**
```typescript
finalScore = mlResult * 0.7 + ruleBasedScore * 0.3;
```

**Change to:**
```typescript
finalScore = mlResult * 0.6 + ruleBasedScore * 0.4;
```

**Impact:** Rule-based score has more influence, reducing the penalty from low ML scores

**Recalculation for User 2:**
```
Blended = 0.6 × 0.031 + 0.4 × 0.730
Blended = 0.0186 + 0.292
Blended = 0.311 ✅ (above 0.25 threshold)
```

### Option 3: Investigate Why Interest is 0.000 (Best Solution)
Check if the interests arrays actually overlap:

**Possible causes:**
1. Interests are stored differently (case sensitivity, formatting)
2. Interests arrays are empty or missing
3. Interests don't actually overlap (genuine mismatch)

**Debug:**
- Check the actual interests in the database
- Verify interest extraction logic
- Check if interests are being normalized correctly

### Option 4: Make Interest Score More Lenient (Not Recommended)
This would reduce the model's ability to identify poor matches.

## Recommendation

**Best approach:** Use **Option 2** (adjust blending ratio to 60/40) + **Option 3** (investigate why interest is 0.000)

This will:
- ✅ Give rule-based scoring more influence (smoother transition)
- ✅ Still respect ML model's insights
- ✅ Help identify if there's a data issue with interests

## Current Blending Logic

**Location:** `src/lib/matching/solo.ts:454`

```typescript
// Blend ML score with rule-based score (70% ML, 30% rule-based)
finalScore = mlResult * 0.7 + ruleBasedScore * 0.3;
```

## Threshold Configuration

**Location:** Matching preset configuration (likely in `src/lib/matching/config.ts`)

**Current:** `minScore: 0.25` (balanced preset)

## Next Steps

1. **Check interests overlap:**
   - User 1: `['budget travel', 'backpacking', 'street food', 'adventure']`
   - User 2: `['photography', 'culture', 'food', 'music']`
   - Searching user: `['budget travel', 'backpacking', 'street food', 'adventure']`
   
   **Analysis:** User 1 has 4/4 interests matching → interest=0.343 (some overlap)
   **Analysis:** User 2 has 0/4 interests matching → interest=0.000 (no overlap)

2. **Decide on approach:**
   - If User 2 genuinely has no shared interests → ML model is correct, keep filtering
   - If interests should overlap but don't → Fix interest extraction/matching logic
   - If you want more matches → Adjust blending ratio or threshold

## Summary

The ML model is working correctly - it's identifying that User 2 has no shared interests and giving a low score. The filtering is working as designed. If you want more matches to pass, consider:

1. ✅ Adjusting blending ratio (60/40 instead of 70/30)
2. ✅ Lowering threshold (0.20-0.22 instead of 0.25)
3. ✅ Investigating why interests don't overlap (if they should)
