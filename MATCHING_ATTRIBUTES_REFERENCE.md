# Matching Algorithm Attributes Reference
## Complete List of Attributes Used in Solo and Group Matching

**Last Updated:** October 14, 2025  
**Purpose:** Comprehensive reference for all attributes used in matching algorithms

---

## 📋 Table of Contents
1. [Solo Matching Attributes](#solo-matching-attributes)
2. [Group Matching Attributes](#group-matching-attributes)
3. [Attribute Comparison Matrix](#attribute-comparison-matrix)
4. [Data Types & Structures](#data-types--structures)
5. [Hard Filters vs Soft Scoring](#hard-filters-vs-soft-scoring)

---

## Solo Matching Attributes

### **Core Travel Attributes** (Cannot be boosted)

| Attribute | Type | Weight | Hard Filter | Description |
|-----------|------|--------|-------------|-------------|
| **destination** | `{ lat: number, lon: number }` | 0.25 (25%) | ✅ Yes (200km) | Travel destination coordinates |
| **startDate** | `string` (ISO) | 0.20 (20%) | ✅ Yes (1-day min) | Trip start date |
| **endDate** | `string` (ISO) | 0.20 (20%) | ✅ Yes (1-day min) | Trip end date |
| **budget** | `number` | 0.20 (20%) | ❌ No | Total trip budget (₹) |

**Total Core Weight:** 85%

---

### **User Preference Attributes** (Can be boosted 1.5x)

| Attribute | Type | Weight | Boostable | Description |
|-----------|------|--------|-----------|-------------|
| **interests** | `string[]` | 0.10 (10%) | ✅ Yes | Array of user interests |
| **age** | `number` | 0.10 (10%) | ✅ Yes | User age in years |
| **personality** | `string` | 0.05 (5%) | ✅ Yes | 'introvert', 'ambivert', 'extrovert' |
| **location** (origin) | `{ lat: number, lon: number }` | 0.05 (5%) | ❌ No | Home/origin location |
| **lifestyle** | Combined | 0.03 (3%) | ✅ Yes | Smoking + Drinking habits |
| **religion** | `string` | 0.02 (2%) | ✅ Yes | Religious preference |

**Total Preference Weight:** 35%

---

### **Lifestyle Sub-attributes**

| Sub-attribute | Type | Scoring Method |
|---------------|------|----------------|
| **smoking** | `'yes' \| 'no' \| 'occasionally'` | Exact match scoring |
| **drinking** | `'yes' \| 'no' \| 'occasionally'` | Exact match scoring |

**Lifestyle Score Formula:** `(smokingMatch + drinkingMatch) / 2`

---

### **Static Attributes** (from `static_attributes` object)

All user preference attributes are stored in the `static_attributes` object:

```typescript
interface StaticAttributes {
  age: number;
  gender: string;
  personality: 'introvert' | 'ambivert' | 'extrovert';
  interests: string[];
  location: { lat: number, lon: number };
  smoking: 'yes' | 'no' | 'occasionally';
  drinking: 'yes' | 'no' | 'occasionally';
  religion: string;
  nationality?: string;
  profession?: string;
}
```

---

### **Solo Matching Session Structure**

```typescript
interface SoloSession {
  userId: string;
  destination: { lat: number, lon: number };
  budget: number;
  startDate: string;  // ISO format
  endDate: string;    // ISO format
  static_attributes: StaticAttributes;
  createdAt: string;  // ISO timestamp
}
```

---

## Group Matching Attributes

### **Core Travel Attributes**

| Attribute | Type | Weight | Hard Filter | Description |
|-----------|------|--------|-------------|-------------|
| **destination** | `{ lat: number, lon: number }` | Implicit | ✅ Yes (200km) | Group destination |
| **averageBudget** | `number` | 0.20 (20%) | ❌ No | Average budget of group members |
| **startDate** | `string` (ISO) | 0.20 (20%) | ❌ No | Group trip start date |
| **endDate** | `string` (ISO) | 0.20 (20%) | ❌ No | Group trip end date |

**Total Core Weight:** 60%

---

### **Group Demographic Attributes**

| Attribute | Type | Weight | Description |
|-----------|------|--------|-------------|
| **topInterests** | `string[]` | 0.15 (15%) | Most common interests in group |
| **averageAge** | `number` | 0.15 (15%) | Average age of group members |
| **dominantLanguages** | `string[]` | 0.10 (10%) | Primary languages spoken in group |
| **lifestyle** | Combined | 0.10 (10%) | Smoking + Drinking policies |
| **dominantNationalities** | `string[]` | 0.10 (10%) | Primary nationalities in group |

**Total Demographic Weight:** 60%

---

### **Lifestyle Policy Attributes**

| Policy Attribute | Type | Values | Scoring Method |
|------------------|------|--------|----------------|
| **smokingPolicy** | `string` | 'Smokers Welcome', 'Mixed', 'Non-Smoking' | Policy compatibility |
| **drinkingPolicy** | `string` | 'Drinkers Welcome', 'Mixed', 'Non-Drinking' | Policy compatibility |

**Policy Scoring:**
- Perfect Match: 1.0 (user aligns with policy)
- Mixed Policy: 0.6 (neutral)
- Mismatch: 0.0 (user conflicts with policy)

---

### **Group Profile Structure**

```typescript
interface GroupProfile {
  groupId: string;
  name: string;
  destination: { lat: number, lon: number };
  averageBudget: number;
  startDate: string;
  endDate: string;
  averageAge: number;
  dominantLanguages: string[];
  topInterests: string[];
  smokingPolicy: 'Smokers Welcome' | 'Mixed' | 'Non-Smoking';
  drinkingPolicy: 'Drinkers Welcome' | 'Mixed' | 'Non-Drinking';
  dominantNationalities: string[];
}
```

---

## Attribute Comparison Matrix

### **Attributes Used in Both Algorithms**

| Attribute | Solo Weight | Group Weight | Notes |
|-----------|-------------|--------------|-------|
| **Destination** | 0.25 (25%) | Hard Filter | Both use 200km hard filter |
| **Date Overlap** | 0.20 (20%) | 0.20 (20%) | Solo: 1-day min hard filter |
| **Budget** | 0.20 (20%) | 0.20 (20%) | Solo: individual, Group: average |
| **Interests** | 0.10 (10%) | 0.15 (15%) | Jaccard similarity in both |
| **Age** | 0.10 (10%) | 0.15 (15%) | Solo: individual, Group: average |
| **Lifestyle** | 0.03 (3%) | 0.10 (10%) | Solo: exact match, Group: policy |

---

### **Solo-Only Attributes**

| Attribute | Weight | Reason |
|-----------|--------|--------|
| **Personality** | 0.05 (5%) | Individual trait, not aggregated in groups |
| **Location Origin** | 0.05 (5%) | Home city compatibility |
| **Religion** | 0.02 (2%) | Personal preference, low weight |

---

### **Group-Only Attributes**

| Attribute | Weight | Reason |
|-----------|--------|--------|
| **Languages** | 0.10 (10%) | Communication compatibility |
| **Nationality** | 0.10 (10%) | Cultural background compatibility |

---

## Data Types & Structures

### **Shared Data Types**

```typescript
// Location (used in both)
interface Location {
  lat: number;
  lon: number;
}

// Date format (both use ISO strings)
type DateString = string; // YYYY-MM-DD

// Interests (both use string arrays)
type Interests = string[];
```

---

### **Solo-Specific Types**

```typescript
// Personality types
type Personality = 'introvert' | 'ambivert' | 'extrovert';

// Lifestyle choices
type LifestyleChoice = 'yes' | 'no' | 'occasionally';

// Filter boost configuration (1.5x multiplier)
interface FilterBoost {
  age?: { min: number; max: number; boost: number };
  gender?: { value: string; boost: number };
  personality?: { value: string; boost: number };
  interests?: { values: string[]; boost: number };
  religion?: { value: string; boost: number };
  smoking?: { value: string; boost: number };
  drinking?: { value: string; boost: number };
}
```

---

### **Group-Specific Types**

```typescript
// Lifestyle policies
type SmokingPolicy = 'Smokers Welcome' | 'Mixed' | 'Non-Smoking';
type DrinkingPolicy = 'Drinkers Welcome' | 'Mixed' | 'Non-Drinking';

// Nationality array
type Nationalities = string[];

// Language array
type Languages = string[];
```

---

## Hard Filters vs Soft Scoring

### **Hard Filters** (Must Pass)

#### Solo Matching Hard Filters:
1. ✅ **200km Distance Filter** - Destinations must be within 200km
2. ✅ **1-Day Minimum Overlap** - At least 1 day of date overlap required
3. ✅ **Source ≠ Destination** - Cannot travel to own city (25km threshold)
4. ✅ **Valid Destinations** - Both users must have destination coordinates

**Result:** If ANY hard filter fails → **No Match** (excluded from results)

---

#### Group Matching Hard Filters:
1. ✅ **200km Distance Filter** - User destination must be within 200km of group destination

**Result:** If hard filter fails → **No Match** (excluded from results)

---

### **Soft Scoring** (Ranked by Score)

All other attributes use soft scoring (0.0 to 1.0) with weighted contributions.

#### **Scoring Methods:**

| Method | Attributes | Formula |
|--------|------------|---------|
| **Haversine Distance** | Destination, Location Origin | Tiered scoring based on km |
| **Date Overlap Ratio** | Date Overlap | `overlapDays / userTripDays` |
| **Budget Difference** | Budget | `1 - (|diff| / max)` with tiers |
| **Jaccard Similarity** | Interests, Languages | `intersection / union + bonus` |
| **Age Difference** | Age | Tiered scoring based on age gap |
| **Personality Matrix** | Personality | Pre-defined compatibility map |
| **Exact Match** | Lifestyle (Solo) | `(smokingMatch + drinkingMatch) / 2` |
| **Policy Match** | Lifestyle (Group) | Policy alignment scoring |
| **Religion Match** | Religion | Exact or neutral scoring |
| **Nationality Match** | Nationality | Binary (in group or not) |

---

## Scoring Tiers & Ranges

### **Destination Scoring (Solo)**
- 0-25km: 1.0 (same city)
- 26-50km: 0.95 (same metro)
- 51-100km: 0.85 (same region)
- 101-150km: 0.75 (same state)
- 151-200km: 0.6 (max allowed)
- >200km: 0.0 (hard filter)

### **Date Overlap Scoring (Solo)**
- ≥80% overlap: 1.0
- ≥50% overlap: 0.9
- ≥30% overlap: 0.8
- ≥20% overlap: 0.6
- ≥10% overlap: 0.3
- <10% (but ≥1 day): 0.1
- <1 day: 0.0 (hard filter)

### **Budget Scoring (Both)**
- ≤10% difference: 1.0
- ≤25% difference: 0.8
- ≤50% difference: 0.6
- ≤100% difference: 0.4
- ≤200% difference: 0.2
- >200% difference: 0.1

### **Age Scoring (Solo)**
- ≤2 years diff: 1.0
- ≤5 years diff: 0.9
- ≤10 years diff: 0.7
- ≤15 years diff: 0.5
- ≤25 years diff: 0.3
- ≤40 years diff: 0.1
- >40 years diff: 0.05

### **Age Scoring (Group)**
- Formula: `max(0, 1 - |userAge - groupAvgAge| / 20)`
- 0 diff: 1.0
- 10 years diff: 0.5
- ≥20 years diff: 0.0

### **Personality Compatibility Matrix**
|           | Introvert | Ambivert | Extrovert |
|-----------|-----------|----------|-----------|
| Introvert | 1.0       | 0.7      | 0.4       |
| Ambivert  | 0.7       | 1.0      | 0.7       |
| Extrovert | 0.4       | 0.7      | 1.0       |

### **Interest Scoring (Jaccard + Bonus)**
- Formula: `intersection / union`
- Bonus: +0.2 if any common interests
- Max: 1.0 (capped)
- No interests: 0.3 (neutral fallback)

---

## Weight Distribution Summary

### **Solo Matching (Total = 100%)**

```
Core Travel (85%):
├─ Destination:     25%
├─ Date Overlap:    20%
├─ Budget:          20%
└─ Interests:       10% (hybrid)

User Preferences (35%):
├─ Age:             10%
├─ Personality:     5%
├─ Location Origin: 5%
├─ Lifestyle:       3%
└─ Religion:        2%
```

### **Group Matching (Total = 100%)**

```
Core Travel (60%):
├─ Budget:          20%
├─ Date Overlap:    20%
└─ Destination:     Hard Filter (not weighted)

Demographics (60%):
├─ Interests:       15%
├─ Age:             15%
├─ Languages:       10%
├─ Lifestyle:       10%
└─ Nationalities:   10%
```

---

## Dynamic Weight Boosting (Solo Only)

When users select preference filters, those filters receive a **1.5x boost**.

### **Boostable Attributes:**
- Age
- Gender (affects personality weight)
- Personality
- Interests
- Religion
- Smoking
- Drinking

### **Non-Boostable Attributes:**
- Destination (core requirement)
- Date Overlap (core requirement)
- Budget (core requirement)
- Location Origin (derived attribute)

**Example Boost:**
```typescript
Base Weight: age = 0.10
With Boost:  age = 0.15 (0.10 × 1.5)
```

Weights are then normalized to maintain 100% total.

---

## Fallback Values & Missing Data

### **Solo Matching Fallbacks:**
| Attribute | Missing Value | Fallback Score |
|-----------|---------------|----------------|
| Destination | `null/undefined` | 0.3 (neutral) |
| Interests | Empty array | 0.3 (neutral) |
| Personality | Missing | 0.5 (neutral) |
| Religion | Missing | 0.5 (neutral) |
| Location Origin | Missing | 0.5 (neutral) |
| Age | Missing | Default to 25 |
| Lifestyle | Missing | Default to 'no' |

### **Group Matching Fallbacks:**
| Attribute | Missing Value | Behavior |
|-----------|---------------|----------|
| Average Age | `0` or `null` | Return 0 score |
| Languages | Empty array | 0 score (Jaccard) |
| Interests | Empty array | 0 score (Jaccard) |

---

## Redis Session Attributes

### **Solo Session Storage:**
```typescript
{
  userId: string,
  destination: { lat: number, lon: number },
  budget: number,
  startDate: string,
  endDate: string,
  static_attributes: {
    age, gender, personality, interests,
    location, smoking, drinking, religion,
    nationality, profession
  },
  createdAt: string,
  TTL: 86400 seconds (24 hours)
}
```

### **Storage Key Format:**
- Solo: `session:{userId}`
- TTL: 24 hours (86400 seconds)

---

## Attribute Sources

### **User Input (Required):**
- Destination
- Budget
- Start Date
- End Date

### **User Profile (Static):**
- Age
- Gender
- Personality
- Interests
- Location (Home)
- Smoking
- Drinking
- Religion
- Nationality
- Profession

### **Calculated (Group):**
- Average Budget (from members)
- Average Age (from members)
- Dominant Languages (from members)
- Top Interests (from members)
- Dominant Nationalities (from members)
- Smoking/Drinking Policies (from group settings)

---

## Validation Rules

### **Required Attributes (Solo):**
- ✅ userId
- ✅ destination (lat, lon)
- ✅ budget (> 0)
- ✅ startDate (valid ISO)
- ✅ endDate (valid ISO, >= startDate)

### **Required Attributes (Group):**
- ✅ groupId
- ✅ name
- ✅ destination (lat, lon)
- ✅ averageBudget (> 0)
- ✅ startDate (valid ISO)
- ✅ endDate (valid ISO, >= startDate)
- ✅ smokingPolicy (valid enum)
- ✅ drinkingPolicy (valid enum)

### **Optional Attributes:**
- nationality, profession, languages (can be empty)
- static_attributes (defaults applied if missing)

---

## Summary Statistics

### **Solo Matching:**
- **Total Attributes:** 9
- **Hard Filters:** 4 (destination distance, date overlap, source≠dest, valid coords)
- **Weighted Attributes:** 9
- **Boostable Attributes:** 7
- **Total Weight:** 100% (1.0)

### **Group Matching:**
- **Total Attributes:** 7
- **Hard Filters:** 1 (destination distance)
- **Weighted Attributes:** 6 (destination not weighted)
- **Total Weight:** 100% (1.0)

---

## Implementation Notes

### **Scoring Order (Solo):**
1. Hard filters first (destination, dates, source≠dest)
2. Calculate individual scores (9 components)
3. Apply dynamic weights (if filters selected)
4. Sum weighted scores
5. Rank by final score (descending)

### **Scoring Order (Group):**
1. Hard filter (200km distance)
2. Calculate individual scores (6 components)
3. Apply weights
4. Sum weighted scores
5. Rank by final score (descending)

---

## Performance Considerations

### **Attribute Computation Cost:**
| Attribute | Computation | Cost |
|-----------|-------------|------|
| Haversine Distance | Trigonometric | Medium |
| Date Overlap | Timestamp math | Low |
| Jaccard Similarity | Set operations | Low-Medium |
| Budget/Age Difference | Arithmetic | Very Low |
| Personality Matrix | Lookup | Very Low |
| Exact Match | Comparison | Very Low |

### **Optimization Strategy:**
- Pre-calculate static attributes once
- Use batch Redis operations (mGet)
- Apply hard filters before scoring
- Cache frequently accessed data

---

**Prepared by:** AI Agent  
**Last Reviewed:** October 14, 2025  
**Version:** 1.0

