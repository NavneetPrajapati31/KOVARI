# ML Matching Requirements (Solo & Group)

**Purpose:** Prerequisites for developing a single ML scoring model that serves both matching types (`user_user` and `user_group`) using the unified `CompatibilityFeatures` interface.

**Non-ML Hard Gates (must remain rule-based, never ML):**
- Distance hard cap (e.g., >200km) -> reject before ML
- No valid date overlap ( <1 day ) -> reject before ML
- Invalid/missing coords or dates -> reject before ML
- Preset `maxDistanceKm` and similar gates are enforced pre-ML

## 1) Matching Contexts & Current Logic
- Solo (`src/lib/matching/solo.ts`): destination/date/budget/interests/age/personality + locationOrigin/lifestyle/religion; dynamic filter boosts; distance <=200km hard filter; date overlap >=1 day; preset thresholds in `config.ts`.
- Group (`src/lib/matching/group.ts`): destination/date/budget/interests/age + language/lifestyle/background; distance <=200km hard filter; weighted sum with fixed weights; no dynamic boosts today.
- Presets (`src/lib/matching/config.ts`): minScore + maxDistanceKm; defaults to `balanced` (0.25, 200km).

## 2) Unified Feature Contract (from `src/lib/ai/utils/ml-types.ts`)
```
matchType: 'user_user' | 'user_group'
// Required (both)
distanceScore, dateOverlapScore, budgetScore, interestScore, ageScore, personalityScore
// Optional (group-only, defaulted)
groupSizeScore?, groupDiversityScore?
```
All features normalized [0,1]. Use `coerceCompatibilityFeaturesToNormalized()` and `NormalizedScore` branding to enforce bounds.

## 3) Feature Computation (pre-ML)
- **Solo**
  - distanceScore: Haversine tiers (same city->1.0, >200km->0)
  - dateOverlapScore: ratio with 1-day minimum
  - budgetScore: relative diff tiers (<=10%->1.0, >50%-><=0.0)
  - interestScore: Jaccard + bonus for overlap
  - ageScore: flexible tiered curve
  - personalityScore: compatibility matrix; neutral 0.5 if missing
  - locationOriginScore: region proximity (not in unified features; treat as engineered signal if needed)
  - lifestyleScore: smoking/drinking match
  - religionScore: match/neutral/zero (not in unified features; treat as engineered signal if needed)
- **Group**
  - distanceScore: user vs group destination; 200km hard cap
  - dateOverlapScore: overlapDays / userTripDays
  - budgetScore: user vs group average
  - interestScore: Jaccard (user vs topInterests)
  - ageScore: user vs group average
  - languageScore: Jaccard (user languages vs dominantLanguages) — not in unified contract; map into interestScore or add engineered feature
  - lifestyleScore: policy match (smoking/drinking)
  - backgroundScore: nationality match (binary) — map into groupDiversityScore or add engineered feature
  - groupSizeScore/groupDiversityScore: compute from group metadata (size buckets, nationality dispersion) and pass when `matchType='user_group'`

## 4) Labels & Outcomes
- Positive: match acceptance, chat initiation, sustained conversation (n messages), trip completion, post-trip rating.
- Negative: block/report soon after match, rapid unmatch, no engagement.
- Cold start: default to rule-based; collect interactions to enable ML.

## 5) Data Requirements
- Inputs: normalized features + matchType + timestamp + cohort (A/B bucket, preset used) + geo region.
- Targets: binary/graded success label from outcomes above; store time-to-first-message and thread retention.
- Filtering: exclude invalid sessions (missing destination/dates) via existing hard filters.

## 6) Inference Requirements
- Latency: <100ms p95; fallback to rule-based on timeout/error/invalid output.
- Validation: outputs in [0,1]; use `isValidCompatibilityFeatures` and sanitize helpers.
- Preset-aware: respect `maxDistanceKm` and `minScore` from `config.ts`; keep hard filters first.
- Determinism: log model version and matchType with each score.

## 7) Training & Evaluation
- Split by time; avoid leakage across users/groups.
- Metrics: AUC/PR for conversion to chat; uplift vs rule-based; calibration (Brier/NLL); latency & fallback rate.
- Segments: by matchType, region, age/gender buckets (fairness), group size buckets.
- A/B: 50/50 ML vs baseline; guardrails on fallback rate (<5%) and latency.

## 8) Feature Mapping Plan
- Required fields shared. For group-only signals:
  - Map languageScore into interestScore or add as engineered sub-feature feeding groupDiversityScore.
  - Map backgroundScore into groupDiversityScore or add as engineered input (extend contract if needed).
  - Add groupSizeScore from group metadata.
- For solo-only signals (locationOriginScore, religionScore), keep as engineered extras or extend contract if model benefits.

## 9) Fallback & Safety
- Hard filters remain rule-based (never ML): distance limit, min 1-day overlap, invalid coords/dates -> reject pre-ML.
- On inference failure/timeout/invalid output: use rule-based score; mark source='rule-based'.
- PII: never include raw PII; only normalized/aggregated scores.

## 10) Implementation Steps
1) Extract `CompatibilityFeatures` for both flows before ML call; set `matchType`.
2) Emit features + outcomes with model version and preset used.
3) Add ML client with validation + fallback to rule-based.
4) A/B and dashboards: acceptance, chats, fallback rate, latency, calibration.