# ML Problem Definition: Matching Algorithm Enhancement

**Date:** January 2025  
**Status:** Day 1 - Problem Definition & Data Contracts  
**Branch:** `feature/ai-ml-core`

---

## 🎯 Objective

Enhance the KOVARI travel companion matching algorithm by integrating machine learning to improve match quality, user satisfaction, and engagement rates. The ML system will learn from historical match outcomes (acceptances, chat initiations, successful trips) to optimize compatibility scoring beyond the current rule-based approach.

### Primary Goals
1. **Improve Match Quality**: Increase the percentage of matches that result in user connections (chat initiation) by 20-30%
2. **Adaptive Learning**: Continuously improve matching accuracy based on user behavior and feedback
3. **Personalization**: Learn user-specific preferences that may not be explicitly stated in profiles
4. **Predictive Accuracy**: Better predict which matches will lead to successful travel partnerships

### Success Criteria
- **Match Acceptance Rate**: Increase from baseline by ≥15%
- **Chat Initiation Rate**: Increase from baseline by ≥20%
- **User Satisfaction**: Maintain or improve user ratings of match quality
- **Response Time**: ML scoring must complete within <100ms (non-blocking)
- **Fallback Reliability**: 100% uptime via rule-based fallback

---

## 🤖 ML vs Rule-Based Difference

### Current Rule-Based System

**Location:** `src/lib/matching/solo.ts`

**How it works:**
- Fixed attribute weights (e.g., destination: 25%, dateOverlap: 20%, budget: 20%)
- Deterministic scoring functions (Haversine distance, Jaccard similarity, tiered scoring)
- Static compatibility matrices (personality matching, age scoring)
- No learning from outcomes
- Same weights for all users regardless of behavior patterns

**Limitations:**
1. **Fixed Weights**: Cannot adapt to user preferences or changing patterns
2. **No Historical Learning**: Ignores which matches actually led to successful connections
3. **One-Size-Fits-All**: Same scoring logic for all user types
4. **Missing Patterns**: Cannot discover non-obvious compatibility factors
5. **Static Thresholds**: Tiered scoring (e.g., 0-25km = 1.0) doesn't learn optimal boundaries

**Example:**
```typescript
// Current: Fixed weights
const weights = {
  destination: 0.25,
  dateOverlap: 0.20,
  budget: 0.20,
  interests: 0.10,
  // ... fixed for all users
};

// Current: Deterministic scoring
const distanceScore = calculateHaversineDistance(userDest, matchDest);
// Returns 1.0 if <25km, 0.95 if 26-50km, etc. (fixed tiers)
```

### ML-Enhanced System

**How it works:**
- **Learned Weights**: ML model learns optimal attribute weights from successful matches
- **Feature Engineering**: Combines rule-based features with learned patterns
- **Outcome-Based Learning**: Trains on actual user behavior (who connected, who chatted, who traveled together)
- **Personalization**: Can learn user-specific preferences (e.g., some users prioritize interests over budget)
- **Non-Linear Patterns**: Discovers complex interactions between attributes

**Advantages:**
1. **Adaptive**: Continuously improves as more data is collected
2. **Data-Driven**: Learns from actual user behavior, not assumptions
3. **Personalized**: Can adapt to different user segments
4. **Pattern Discovery**: Finds non-obvious compatibility factors
5. **Optimization**: Automatically finds optimal thresholds and weights

**Example:**
```typescript
// ML: Learned weights from successful matches
const mlWeights = await learnOptimalWeights(historicalMatches);
// Example output: { destination: 0.28, dateOverlap: 0.18, budget: 0.22, ... }
// Different weights learned from actual successful connections

// ML: Enhanced scoring with learned patterns
const mlScore = await calculateMLCompatibilityScore(features, mlModel);
// Considers non-linear interactions: e.g., "high interest overlap + similar age = strong signal"
```

### Key Differences Summary

| Aspect | Rule-Based | ML-Enhanced |
|--------|-----------|-------------|
| **Weights** | Fixed (hardcoded) | Learned (from data) |
| **Learning** | None | Continuous |
| **Personalization** | None | User/segment-specific |
| **Pattern Discovery** | Manual | Automatic |
| **Adaptation** | Static | Dynamic |
| **Data Usage** | None | Historical outcomes |
| **Complexity** | Linear combinations | Non-linear interactions |

---

## 📊 Success Metrics

### Primary Metrics

1. **Match Acceptance Rate**
   - **Definition**: Percentage of matches that users accept/view positively
   - **Current Baseline**: [To be measured from production data]
   - **Target**: +15% improvement over baseline
   - **Measurement**: Track user interactions with matches (swipe right, view profile, initiate chat)

2. **Chat Initiation Rate**
   - **Definition**: Percentage of matches that result in at least one message exchange
   - **Current Baseline**: [To be measured from production data]
   - **Target**: +20% improvement over baseline
   - **Measurement**: Track first message sent within 7 days of match

3. **Match Quality Score**
   - **Definition**: User-reported satisfaction with matches (1-5 scale)
   - **Current Baseline**: [To be measured from user feedback]
   - **Target**: Maintain or improve average rating
   - **Measurement**: Post-match survey or implicit feedback (continued engagement)

### Secondary Metrics

4. **Response Time**
   - **Target**: ML scoring completes in <100ms (p95)
   - **Measurement**: Monitor API latency for ML inference calls

5. **Model Accuracy**
   - **Definition**: Prediction accuracy on test set (binary: connection vs no connection)
   - **Target**: ≥75% accuracy on held-out test set
   - **Measurement**: A/B test ML vs rule-based on 50/50 split

6. **Coverage**
   - **Definition**: Percentage of matches that use ML scoring (vs fallback)
   - **Target**: ≥95% of matches use ML (fallback only on errors)
   - **Measurement**: Track fallback usage rate

### Monitoring & Evaluation

- **A/B Testing**: 50% of users get ML-enhanced matches, 50% get rule-based (baseline)
- **Tracking Period**: Minimum 4 weeks to collect statistical significance
- **Success Threshold**: ML variant must show statistically significant improvement (p < 0.05) on primary metrics
- **Rollback Criteria**: If ML variant performs worse or causes errors, automatic fallback to rule-based

---

## 🔄 Fallback Behavior

### Fallback Strategy

The ML system **must never block** the matching process. If ML inference fails, times out, or returns invalid results, the system automatically falls back to the existing rule-based algorithm.

#### Cold Start Handling

**New User Strategy:**
- New users default to rule-based scoring (no ML inference)
- ML scoring enabled after minimum N interactions (e.g., 5+ matches viewed/acted upon)
- Prevents biased predictions on sparse data
- Ensures reliable matching for users without sufficient behavioral history

**Rationale:**
- ML models require sufficient data to make accurate predictions
- New users have no historical interaction data
- Rule-based scoring provides consistent, reliable baseline
- Gradual transition to ML as user data accumulates

### Fallback Triggers

1. **ML Service Unavailable**
   - ML API timeout (>100ms)
   - ML service returns 5xx error
   - Network connectivity issues

2. **Invalid ML Response**
   - ML score outside valid range [0, 1]
   - ML confidence outside valid range [0, 1]
   - Missing required fields in ML response

3. **Insufficient Data**
   - New user with no historical data (cold start)
   - Insufficient training data for model
   - Feature extraction fails

4. **Model Errors**
   - Model prediction throws exception
   - Model version mismatch
   - Model file corruption

### Fallback Implementation

```typescript
async function calculateCompatibilityScore(
  userSession: SoloSession,
  matchSession: SoloSession
): Promise<{ score: number; source: 'ml' | 'rule-based' }> {
  try {
    // Attempt ML scoring
    const mlResult = await calculateMLCompatibilityScore(userSession, matchSession);
    
    // Validate ML response
    if (isValidMLResult(mlResult)) {
      return { score: mlResult.score, source: 'ml' };
    }
  } catch (error) {
    // Log error for monitoring
    console.error('ML scoring failed, falling back to rule-based:', error);
  }
  
  // Fallback to rule-based (existing implementation)
  const ruleBasedResult = calculateFinalCompatibilityScore(userSession, matchSession);
  return { score: ruleBasedResult.score, source: 'rule-based' };
}
```

### Fallback Guarantees

1. **100% Uptime**: Matching always works, even if ML is down
2. **No Performance Degradation**: Fallback uses existing optimized rule-based code
3. **Transparent Logging**: All fallback events logged for monitoring
4. **Graceful Degradation**: Users experience no difference (same score format)

### Monitoring Fallback

- **Fallback Rate**: Track percentage of matches using fallback
- **Fallback Reasons**: Categorize fallback triggers (timeout, error, invalid response)
- **Alert Threshold**: Alert if fallback rate >5% (indicates ML service issues)

---

## 📋 Data Contracts

### Input Features (MatchFeatures)

All features are **normalized to [0, 1]** range:

```typescript
export type MatchFeatures = {
  distanceScore: number;        // 0-1: Normalized distance score (0 = far, 1 = close)
  dateOverlapScore: number;      // 0-1: Normalized date overlap ratio
  budgetScore: number;          // 0-1: Normalized budget compatibility
  interestScore: number;        // 0-1: Normalized interest similarity (Jaccard)
  ageScore: number;             // 0-1: Normalized age compatibility
  personalityScore: number;    // 0-1: Normalized personality match
};
```

**Feature Ownership & Source of Truth:**

| Feature | Source | Computation Owner |
|---------|--------|-------------------|
| `distanceScore` | `src/lib/matching/solo.ts` | Rule-based preprocessor |
| `dateOverlapScore` | `src/lib/matching/solo.ts` | Rule-based preprocessor |
| `budgetScore` | `src/lib/matching/solo.ts` | Rule-based preprocessor |
| `interestScore` | `src/lib/matching/solo.ts` | Rule-based preprocessor |
| `ageScore` | `src/lib/matching/solo.ts` | Rule-based preprocessor |
| `personalityScore` | `src/lib/matching/solo.ts` | Rule-based preprocessor |

**Key Separation:**
- **Feature Engineering** (rule-based): Computes normalized scores from raw user data
- **ML Inference**: Consumes pre-computed features, learns optimal weights and patterns
- This separation ensures feature computation is deterministic and testable independently of ML

**Feature Normalization:**
- All features must be in [0, 1] range before ML inference
- Normalization functions ensure no feature exceeds bounds
- Missing values default to 0.5 (neutral)

### Output Contract (MLMatchResult)

```typescript
export type MLMatchResult = {
  score: number;        // 0-1: Final compatibility score (bounded)
  confidence: number;   // 0-1: Model confidence in prediction (bounded)
};
```

**Output Guarantees:**
- `score` is always in [0, 1] range
- `confidence` is always in [0, 1] range
- Both values are bounded and validated before use

**Confidence Definition:**
- Confidence represents the model's certainty in the prediction
- Computed as: distance from decision boundary (logistic regression) or probability calibration score (gradient boosting)
- Used only for ranking and UI explanation, not blocking decisions
- Higher confidence (closer to 1.0) indicates the model has seen similar patterns in training data
- Lower confidence (closer to 0.0) indicates unusual patterns or sparse training data

### Privacy & PII

**No PII Leakage:**
- ML features contain **no personally identifiable information**
- No names, emails, phone numbers, or exact locations
- Only normalized scores and aggregated attributes
- User IDs are hashed before model training
- All data is anonymized in training datasets

**Example Safe Features:**
```typescript
// ✅ Safe: Normalized scores
distanceScore: 0.85  // Not "25.3 km from user's home"

// ❌ Unsafe: PII
userEmail: "user@example.com"  // NEVER included
userName: "John Doe"           // NEVER included
exactLocation: { lat: 40.7128, lon: -74.0060 }  // NEVER included
```

---

## ✅ Verification Checklist

- [x] **All features normalized (0-1)**: MatchFeatures type enforces [0, 1] range
- [x] **Output bounded**: MLMatchResult score and confidence are [0, 1]
- [x] **No PII leakage**: Features contain only normalized scores, no personal data
- [x] **Fallback defined**: Comprehensive fallback strategy documented
- [x] **Success metrics defined**: Clear, measurable targets established
- [x] **ML vs rule-based difference**: Clear explanation of advantages
- [x] **Confidence definition**: Clear explanation of what confidence represents
- [x] **Cold start handling**: Formalized strategy for new users
- [x] **Feature ownership**: Clear source of truth for each feature
- [x] **Model versioning**: Versioning strategy defined

---

## 🔄 Model Versioning & Lifecycle

### Versioning Strategy

**Semantic Versioning:**
- Each trained model has a semantic version (e.g., `v1.0.0`, `v1.1.0`, `v2.0.0`)
- Format: `MAJOR.MINOR.PATCH`
  - **MAJOR**: Breaking changes (incompatible feature changes)
  - **MINOR**: New features (backward compatible)
  - **PATCH**: Bug fixes (backward compatible)

**Version Management:**
- Model versions stored in model registry/metadata
- Backend validates model version compatibility before inference
- Version mismatch triggers fallback to rule-based scoring
- Version information logged for all ML predictions

### Upgrade Safety

**Rollback Support:**
- Previous model versions retained for rollback capability
- Config flag controls active model version (e.g., `ML_MODEL_VERSION=v1.0.0`)
- Instant rollback via configuration change (no code deployment needed)
- A/B testing support: Run multiple model versions simultaneously

**Deployment Process:**
1. Train new model version
2. Validate on held-out test set
3. Deploy to staging environment
4. A/B test against current production model
5. Gradual rollout (10% → 50% → 100% traffic)
6. Monitor metrics for 48 hours before full rollout

**Safety Guarantees:**
- Automatic fallback if new model version fails validation
- Version compatibility checks prevent runtime errors
- Rollback within seconds via configuration update
- No downtime during model upgrades

---

## 🚀 Next Steps

1. **Data Collection**: Set up tracking for match outcomes (acceptances, chats, trips)
2. **Feature Pipeline**: Implement feature extraction from user sessions
3. **Model Training**: Train initial ML model on historical data
4. **A/B Testing**: Deploy ML model to 50% of users, compare with baseline
5. **Iteration**: Continuously improve model based on results

---

**Last Updated:** January 2025  
**Owner:** AI/ML Team  
**Review Status:** Ready for Implementation

