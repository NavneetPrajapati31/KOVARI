# Generate Synthetic ML Training Data - Alternative Approach

**Problem:** Manual interaction logging is time-consuming and error-prone.

**Solution:** Automatically generate synthetic match events from existing seed users and sessions.

---

## Overview

Instead of manually clicking through the app to generate events, this approach:

1. **Fetches existing seed users** from Supabase
2. **Fetches existing Redis sessions** for those users
3. **Pairs users together** (or users with groups)
4. **Extracts compatibility features** using the same logic as production
5. **Generates realistic outcomes** (accept/ignore) based on compatibility scores
6. **Writes events directly to JSONL** format

**Benefits:**
- ✅ **Fast:** Generate 500+ events in seconds
- ✅ **Consistent:** Uses actual feature extraction logic
- ✅ **Realistic:** Outcomes based on compatibility scores
- ✅ **No manual work:** Fully automated

---

## Prerequisites

1. **Seed users created and synced:**
   ```powershell
   node src/lib/ai/datasets/sync-seed-users-to-database.js
   ```

2. **Redis sessions created:**
   ```powershell
   node src/lib/ai/datasets/create-seed-user-sessions.js
   ```

3. **Environment variables set** in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `REDIS_URL`

---

## Step 0: Run Prerequisites Test (CRITICAL)

**⚠️ IMPORTANT:** Always run the test suite before generating synthetic data to avoid errors.

```powershell
node src/lib/ai/datasets/test-synthetic-data-prerequisites.js
```

**What it tests:**
- ✅ Environment variables are set
- ✅ Supabase connection works
- ✅ Redis connection works
- ✅ Seed users exist in database
- ✅ Redis sessions exist
- ✅ Feature extraction logic works
- ✅ Event generation logic works
- ✅ File system permissions
- ✅ Groups exist (optional)

**Expected Output:**
```
✅ PASS: NEXT_PUBLIC_SUPABASE_URL is set
✅ PASS: Supabase connection successful
✅ PASS: Redis connection successful
✅ PASS: Found 6 users with actual Clerk IDs
✅ PASS: Found 6 sessions
...
✅ All critical tests passed!
You can now run: node src/lib/ai/datasets/generate-synthetic-match-events.js
```

**If tests fail:**
- Fix the issues shown in the error messages
- Re-run the test until all critical tests pass
- Only proceed to Step 1 after all tests pass

---

## Step 1: Generate Synthetic Events

### Basic Usage

```powershell
node src/lib/ai/datasets/generate-synthetic-match-events.js
```

**Default behavior:**
- Generates 300 events (70% solo, 30% group)
- Output: `match_events_synthetic.jsonl`
- Preset: `balanced`

### Custom Options

```powershell
# Generate 500 events
node src/lib/ai/datasets/generate-synthetic-match-events.js --count 500

# Generate only solo events
node src/lib/ai/datasets/generate-synthetic-match-events.js --match-type solo --count 200

# Generate only group events
node src/lib/ai/datasets/generate-synthetic-match-events.js --match-type group --count 100

# Custom output file
node src/lib/ai/datasets/generate-synthetic-match-events.js --output my_events.jsonl

# Different preset
node src/lib/ai/datasets/generate-synthetic-match-events.js --preset strict
```

### Expected Output

```
🚀 Starting Synthetic Match Event Generation

📊 Configuration:
   Output file: match_events_synthetic.jsonl
   Event count: 300
   Match type: both
   Preset: balanced

🔌 Connecting to Redis...
✅ Connected to Redis

📋 Fetching user sessions...
✅ Found 6 sessions

📊 Found 6 valid sessions

👤 Fetching user profiles...
✅ Found 6 users

📝 Generating 210 solo match events...
   Generated 210 events...
✅ Generated 210 solo match events

👥 Fetching groups...
✅ Found 4 groups

📝 Generating 90 group match events...
   Generated 90 events...
✅ Generated 90 group match events

💾 Writing 300 events to match_events_synthetic.jsonl...
✅ Events written to C:\Users\user\KOVARI\match_events_synthetic.jsonl

📊 Summary:
   Total events: 300
   Solo events: 210
   Group events: 90
   Accepts: 145
   Ignores: 155

✅ Synthetic event generation complete!

Next steps:
   1. Review the generated events: Get-Content match_events_synthetic.jsonl | Select-Object -First 5
   2. Build training dataset: python src/lib/ai/datasets/build_training_set.py match_events_synthetic.jsonl
```

---

## Step 2: Verify Generated Events

### Quick Check

```powershell
# Count events
(Get-Content match_events_synthetic.jsonl | Measure-Object -Line).Lines

# View sample events
Get-Content match_events_synthetic.jsonl | Select-Object -First 3

# Check event breakdown
$events = Get-Content match_events_synthetic.jsonl | ForEach-Object { $_ | ConvertFrom-Json }
$events | Group-Object matchType | Format-Table Name, Count
$events | Group-Object outcome | Format-Table Name, Count
```

### Expected Event Structure

```json
{
  "matchType": "user_user",
  "features": {
    "matchType": "user_user",
    "distanceScore": 1.0,
    "dateOverlapScore": 0.9,
    "budgetScore": 0.8,
    "interestScore": 0.6,
    "ageScore": 0.7,
    "languageScore": 0.8,
    "lifestyleScore": 0.8,
    "backgroundScore": 0.6
  },
  "outcome": "accept",
  "label": 1,
  "preset": "balanced",
  "timestamp": 1704123456789,
  "source": "rule-based"
}
```

---

## Step 3: Build Training Dataset

```powershell
python src/lib/ai/datasets/build_training_set.py match_events_synthetic.jsonl
```

**Expected Output:**
```
🔍 Parsing log file...
✅ Parsed 300 events
📊 Building dataset...
✅ Dataset created with 300 samples and 52 features
✂️  Performing time-based split...
💾 Saving datasets...
✅ Training set saved: datasets/train.csv (240 samples)
✅ Validation set saved: datasets/val.csv (60 samples)
```

---

## Step 4: Verify Dataset Quality

```powershell
python src/lib/ai/datasets/verify_dataset.py datasets/train.csv datasets/val.csv
```

**Checks:**
- ✅ No PII columns
- ✅ All feature columns ∈ [0,1]
- ✅ Both match types present
- ✅ Labels include both 0 and 1
- ✅ Time-based split respected

---

## How It Works

### 1. Feature Extraction

The script uses **simplified versions** of the actual feature extraction functions:

- **Date Overlap:** Calculates overlap between travel dates
- **Budget Compatibility:** Compares budget differences
- **Interest Similarity:** Jaccard similarity between interest arrays
- **Age Compatibility:** Age difference scoring
- **Lifestyle Compatibility:** Smoking/drinking preferences
- **Background Compatibility:** Nationality/religion matching

**Note:** For production-quality features, you'd need to call the actual TypeScript feature extraction functions. The simplified version generates realistic synthetic data but may not match production exactly.

### 2. Outcome Generation

Outcomes are generated based on **compatibility scores**:

- **High compatibility (≥0.7):** 80% accept, 20% ignore
- **Medium compatibility (0.5-0.7):** 50% accept, 50% ignore
- **Low compatibility (0.3-0.5):** 20% accept, 80% ignore
- **Very low compatibility (<0.3):** 5% accept, 95% ignore

This creates a **realistic distribution** where better matches are more likely to be accepted.

### 3. Event Generation

- **Solo Events:** Pairs all users with each other (both directions)
- **Group Events:** Pairs all users with all active groups
- **Shuffling:** Randomly selects pairs to avoid bias
- **Timestamps:** Spreads timestamps to enable time-based splitting

---

## Combining with Real Events

You can combine synthetic events with real logged events:

```powershell
# Extract real events from app.log
Select-String -Pattern "\[ML_MATCH_EVENT\]" app.log | ForEach-Object {
    $_.Line -replace '.*\[ML_MATCH_EVENT\]\s*', ''
} | Out-File -FilePath match_events_real.jsonl -Encoding utf8

# Combine both
Get-Content match_events_real.jsonl, match_events_synthetic.jsonl | Out-File match_events_combined.jsonl -Encoding utf8

# Build dataset from combined events
python src/lib/ai/datasets/build_training_set.py match_events_combined.jsonl
```

---

## Troubleshooting

### No Sessions Found

**Error:** `❌ No sessions found. Please create sessions first`

**Solution:**
```powershell
node src/lib/ai/datasets/create-seed-user-sessions.js
```

### No Users Found

**Error:** `❌ Error fetching users`

**Solution:**
```powershell
node src/lib/ai/datasets/sync-seed-users-to-database.js
```

### Missing Features

**Problem:** Some events have `null` features

**Solution:**
- Ensure all users have complete profiles (age, interests, etc.)
- Ensure all sessions have destination, dates, budget
- Check Redis connection

### Low Event Count

**Problem:** Generated fewer events than requested

**Solution:**
- Check how many users you have (need at least 2 for solo, 1 for group)
- Check how many groups you have (for group events)
- Increase user/group count or reduce `--count` parameter

---

## Advantages Over Manual Logging

| Aspect | Manual Logging | Synthetic Generation |
|--------|----------------|---------------------|
| **Time** | Hours/Days | Seconds |
| **Consistency** | Variable | Consistent |
| **Scale** | Limited | Unlimited |
| **Error Rate** | High | Low |
| **Reproducibility** | No | Yes |
| **Feature Quality** | Production | Simplified* |

*Can be improved by calling actual TypeScript functions

---

## Next Steps

1. **Generate synthetic events** (this guide)
2. **Build training dataset** (`build_training_set.py`)
3. **Verify dataset quality** (`verify_dataset.py`)
4. **Train ML model** (Phase 4)

---

## Summary

This synthetic generation approach is **much faster and more reliable** than manual logging. It's perfect for:

- ✅ Initial dataset creation
- ✅ Testing the ML pipeline
- ✅ Generating large datasets quickly
- ✅ Creating balanced datasets (equal accept/ignore ratios)

For production, you can combine synthetic data with real user interactions for the best of both worlds.
