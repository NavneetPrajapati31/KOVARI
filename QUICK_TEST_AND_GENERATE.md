# Quick Test & Generate Guide

**Fast track to generating synthetic ML training data with validation.**

---

## Step 1: Run Prerequisites Test

```powershell
node src/lib/ai/datasets/test-synthetic-data-prerequisites.js
```

**✅ If all tests pass:** Proceed to Step 2

**❌ If tests fail:** Fix the issues and re-run

---

## Step 2: Generate Synthetic Events

```powershell
# Basic (300 events)
node src/lib/ai/datasets/generate-synthetic-match-events.js

# Custom (500 events)
node src/lib/ai/datasets/generate-synthetic-match-events.js --count 500
```

---

## Step 3: Build Training Dataset

```powershell
python src/lib/ai/datasets/build_training_set.py match_events_synthetic.jsonl
```

---

## Step 4: Verify Dataset

```powershell
python src/lib/ai/datasets/verify_dataset.py datasets/train.csv datasets/val.csv
```

---

## Common Issues & Fixes

### Test Fails: "No Redis sessions found"
```powershell
node src/lib/ai/datasets/create-seed-user-sessions.js
```

### Test Fails: "No seed users found"
```powershell
node src/lib/ai/datasets/sync-seed-users-to-database.js
```

### Test Fails: "Supabase connection failed"
- Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### Test Fails: "Redis connection failed"
- Check `.env.local` has correct `REDIS_URL`

---

## Full Documentation

- **Test Details:** See `test-synthetic-data-prerequisites.js` for all test cases
- **Generation Details:** See `GENERATE_SYNTHETIC_ML_DATA_GUIDE.md` for full guide
- **Group Matching:** See `GENERATE_GROUP_ML_DATA_GUIDE.md` for group-specific guide
