# DAY-2 FINAL STEPS (VERIFICATION + DATA CAPTURE)

**Goal:** Generate real interaction logs and build ML-ready training dataset.

**Status:** 🟢 Ready to Execute

---

## Overview

You must now generate real interaction logs from your app to build the training dataset. This guide walks you through:

1. ✅ Running scripted/manual interactions (aim for ~200-500 events)
2. ✅ Capturing logs to `match_events.jsonl`
3. ✅ Building dataset (train.csv, val.csv)
4. ✅ Verifying dataset quality

---

## Prerequisites

- ✅ Seed users and groups created (you've already done this)
- ✅ **Redis sessions created for seed users** (run script below)
- ✅ App running in dev/staging environment
- ✅ Python 3 installed with pandas
- ✅ All logging infrastructure in place

### ⚠️ IMPORTANT: Setup Order for Seed Users

**You MUST run these scripts in order:**

1. **Create Clerk Users** (already done ✅)
   ```powershell
   node src/lib/ai/datasets/create-clerk-seed-users.js
   ```

2. **Sync Clerk Users to Database** (IMPORTANT - Run this!)
   ```powershell
   node src/lib/ai/datasets/sync-seed-users-to-database.js
   ```
   This creates database records (users + profiles) matching your Clerk users by email address.
   It automatically matches Clerk users to seed user profiles and creates the database records.
   
   **Alternative:** If you prefer using `seed-training-data.js`, you'll need to manually update the Clerk IDs in the database to match the actual Clerk user IDs from step 1.

3. **Create Redis Sessions**
   ```powershell
   node src/lib/ai/datasets/create-seed-user-sessions.js
   ```
   This creates Redis sessions with travel preferences so users can see matches.

**If you get "Could not resolve user identifiers to UUIDs" error:**
- Your seed users exist in Clerk but not in the database
- Run step 2 above to create database records
- You may need to manually update Clerk IDs in the database to match the actual Clerk user IDs from step 1

---

## Step 1: Start App with Logging

Open a terminal and start your app with logging redirected to a file:

### Option A: Use npm.cmd (Recommended - No Execution Policy Issues)

```powershell
# Windows (PowerShell) - Use npm.cmd to avoid execution policy issues
npm.cmd run dev > app.log 2>&1
```

### Option B: Use cmd instead of PowerShell

```cmd
# Open Command Prompt (cmd) instead of PowerShell
npm run dev > app.log 2>&1
```

### Option C: Change PowerShell Execution Policy (If needed)

If you prefer using PowerShell with `npm` directly, you can change the execution policy:

```powershell
# Temporary change (only for current session)
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# Or permanent change (for current user only - safer)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then run normally
npm run dev > app.log 2>&1
```

**Keep this terminal running** - all console logs will be captured to `app.log`.

**Note:** Option A (using `npm.cmd`) is the easiest and doesn't require changing system security policies.

---

## Step 2: Generate Interactions

You need to perform interactions in your app to generate ML event logs. 

### Seed User Login Credentials

All seed users use the same password. Here are the login credentials:

**Password for ALL users:** `SeedUser123!`

**Email Addresses:**
1. `budget.traveler@example.com`
2. `luxury.traveler@example.com`
3. `solo.introvert@example.com`
4. `extrovert.group@example.com`
5. `short.trip@example.com`
6. `long.trip@example.com`

**How to Login:**
1. Navigate to your app's sign-in page (typically `/sign-in`)
2. Enter one of the email addresses above
3. Enter password: `SeedUser123!`
4. Click Sign In
5. Note: Email verification is skipped for these test users, so you can login directly

**Quick Reference:**
- Keep this password handy: `SeedUser123!`
- Copy/paste emails from the list above
- Use different browsers or incognito windows to login as multiple users simultaneously

### Available Interactions (Currently Logged)

Based on the codebase, these interactions are **already logging ML events**:

#### User ↔ User Interactions
- ✅ **Accept** - User accepts a match interest
  - **Location:** `/requests` page → Accept an interest
  - **Logged as:** `"outcome": "accept"`, `"matchType": "user_user"`
  - **Label:** 1 (positive)

- ✅ **Chat** - User sends a message after accepting
  - **Location:** Chat interface after accepting
  - **Logged as:** `"outcome": "chat"`, `"matchType": "user_user"`
  - **Label:** 1 (positive)

- ✅ **Ignore** - User skips/dismisses a profile
  - **Location:** Explore page → Skip a solo match
  - **Logged as:** `"outcome": "ignore"`, `"matchType": "user_user"`
  - **Label:** 0 (negative)

#### User ↔ Group Interactions
- ✅ **Ignore** - User skips/dismisses a group
  - **Location:** Explore page → Skip a group match
  - **Logged as:** `"outcome": "ignore"`, `"matchType": "user_group"`
  - **Label:** 0 (negative)

### Interaction Strategy

**Aim for ~200-500 total events** with:

1. **Mixed outcomes:**
   - ~40-50% accepts (positive labels)
   - ~30-40% ignores (negative labels)
   - ~10-20% chats (positive labels)

2. **Both match types:**
   - User-user matches (accept, chat, ignore)
   - User-group matches (ignore)

3. **Diverse profiles:**
   - Use different seed users you created
   - Try different destinations
   - Vary your matching preset (if possible)

### Manual Steps (Recommended)

1. **Login as Seed User 1** (e.g., `budget.traveler@example.com`)
   - Browse explore page
   - Accept some matches, ignore others
   - Send chat messages to some accepted matches
   - Skip some group matches

2. **Login as Seed User 2** (e.g., `luxury.traveler@example.com`)
   - Repeat similar actions
   - Try different patterns (more accepts, more ignores, etc.)

3. **Continue with other seed users** to diversify the data

4. **Monitor `app.log`** periodically to check events are being logged:
   ```powershell
   Select-String -Pattern "\[ML_MATCH_EVENT\]" app.log | Measure-Object
   ```

### Quick Check: Verify Logging

While performing actions, you can check if events are being logged:

```powershell
# Count events so far
(Select-String -Pattern "\[ML_MATCH_EVENT\]" app.log).Count

# View recent events
Select-String -Pattern "\[ML_MATCH_EVENT\]" app.log | Select-Object -Last 5
```

---

## Step 3: Extract ML Events

Once you have enough interactions (aim for 200-500 events), stop the app (Ctrl+C) and extract the ML events:

### Option A: Use PowerShell Script (Recommended)

```powershell
.\src\lib\ai\datasets\extract-events.ps1 app.log match_events.jsonl
```

This script:
- Extracts all `[ML_MATCH_EVENT]` lines
- Cleans the format
- Saves to `match_events.jsonl`
- Shows statistics

### Option B: Manual Extraction (PowerShell)

```powershell
Select-String -Pattern "\[ML_MATCH_EVENT\]" app.log | ForEach-Object {
    $_.Line -replace '.*\[ML_MATCH_EVENT\]\s*', ''
} | Out-File -FilePath match_events.jsonl -Encoding utf8
```

### Verify Extraction

Check the extracted file:

```powershell
# Count events
(Get-Content match_events.jsonl | Measure-Object -Line).Lines

# View sample events
Get-Content match_events.jsonl | Select-Object -First 3
```

**Expected format:** Each line should be a valid JSON object:
```json
{"matchType":"user_user","features":{...},"outcome":"accept","label":1,"preset":"balanced","timestamp":1704123456789,"source":"rule-based"}
```

---

## Step 4: Build Training Dataset

Run the Python script to convert logs to training datasets:

```powershell
python src/lib/ai/datasets/build_training_set.py match_events.jsonl
```

This will:
- Parse the JSONL log file
- Create binary labels from outcomes
- Flatten nested feature structures
- Perform time-based train/val split (80/20)
- Save `train.csv` and `val.csv` to `datasets/` directory

### Custom Options

```powershell
# Specify output directory
python src/lib/ai/datasets/build_training_set.py match_events.jsonl -o my_datasets

# Adjust train/val ratio
python src/lib/ai/datasets/build_training_set.py match_events.jsonl --train-ratio 0.75

# Set minimum samples
python src/lib/ai/datasets/build_training_set.py match_events.jsonl --min-samples 50
```

### Expected Output

```
🔍 Parsing log file...
✅ Parsed 250 events
📊 Building dataset...
✅ Dataset created with 250 samples and 45 features
✂️  Performing time-based split...
💾 Saving datasets...
✅ Training set saved: datasets/train.csv (200 samples)
✅ Validation set saved: datasets/val.csv (50 samples)

📊 Dataset Summary:
  Total samples: 250
  Training samples: 200 (80.0%)
  Validation samples: 50 (20.0%)
  Positive labels (train): 120 (60.0%)
  Positive labels (val): 30 (60.0%)

✅ Dataset builder completed successfully!
```

---

## Step 5: Verify Dataset Quality

Run these checks to ensure your dataset is ready for ML training.

### Mandatory Checks

#### 1. No PII Columns ✅

Check that no personally identifiable information is included:

```powershell
# View column names
$headers = (Get-Content datasets/train.csv -First 1) -split ','
$headers | Where-Object { $_ -match 'email|name|phone|address|id' -and $_ -notmatch 'label|feature_id' }
```

**Expected:** No columns with PII should appear (except metadata like `matchType`, `preset`, `timestamp`, `label`)

#### 2. All Feature Columns ∈ [0,1] ✅

Verify all feature values are normalized:

```python
# Quick Python check
import pandas as pd
df = pd.read_csv('datasets/train.csv')
feature_cols = [c for c in df.columns if c not in ['matchType', 'preset', 'timestamp', 'label']]
for col in feature_cols:
    min_val = df[col].min()
    max_val = df[col].max()
    if min_val < 0 or max_val > 1:
        print(f"❌ {col}: range [{min_val}, {max_val}]")
    else:
        print(f"✅ {col}: range [{min_val}, {max_val}]")
```

**Expected:** All feature columns should have min ≥ 0 and max ≤ 1

#### 3. Both Match Types Present ✅

```powershell
# Check match types
Import-Csv datasets/train.csv | Group-Object matchType | Select-Object Name, Count
Import-Csv datasets/val.csv | Group-Object matchType | Select-Object Name, Count
```

**Expected:** Both `user_user` and `user_group` should appear in both train and val sets

#### 4. Labels Include Both 0 and 1 ✅

```powershell
# Check labels
Import-Csv datasets/train.csv | Group-Object label | Select-Object Name, Count
Import-Csv datasets/val.csv | Group-Object label | Select-Object Name, Count
```

**Expected:** Both `0` and `1` labels should appear in both sets

#### 5. Time-Based Split Respected ✅

Verify that validation set timestamps are all after training set timestamps:

```python
# Quick Python check
import pandas as pd
train = pd.read_csv('datasets/train.csv')
val = pd.read_csv('datasets/val.csv')
max_train_time = train['timestamp'].max()
min_val_time = val['timestamp'].min()
if min_val_time >= max_train_time:
    print(f"✅ Time-based split respected: val starts at {min_val_time} >= train ends at {max_train_time}")
else:
    print(f"❌ Time-based split violated: val starts at {min_val_time} < train ends at {max_train_time}")
```

**Expected:** All validation timestamps should be ≥ max training timestamp

### Quick Verification Script

You can create a simple verification script:

```powershell
# verify-dataset.ps1
Write-Host "🔍 Verifying dataset quality..." -ForegroundColor Cyan

$train = Import-Csv datasets/train.csv
$val = Import-Csv datasets/val.csv

Write-Host "`n📊 Basic Statistics:" -ForegroundColor Yellow
Write-Host "  Train samples: $($train.Count)"
Write-Host "  Val samples: $($val.Count)"

Write-Host "`n📈 Match Types:" -ForegroundColor Yellow
$train | Group-Object matchType | ForEach-Object {
    Write-Host "  Train $($_.Name): $($_.Count)"
}
$val | Group-Object matchType | ForEach-Object {
    Write-Host "  Val $($_.Name): $($_.Count)"
}

Write-Host "`n📊 Labels:" -ForegroundColor Yellow
$train | Group-Object label | ForEach-Object {
    Write-Host "  Train label $($_.Name): $($_.Count) ($([math]::Round($_.Count/$train.Count*100, 1))%)"
}
$val | Group-Object label | ForEach-Object {
    Write-Host "  Val label $($_.Name): $($_.Count) ($([math]::Round($_.Count/$val.Count*100, 1))%)"
}

Write-Host "`n✅ Basic checks complete! Run Python checks for feature ranges and time-based split." -ForegroundColor Green
```

Save as `src/lib/ai/datasets/verify-dataset.ps1` and run:
```powershell
.\src\lib\ai\datasets\verify-dataset.ps1
```

---

## Summary Checklist

Before marking Day-2 as complete, verify:

- [ ] **200-500 total events** captured in `match_events.jsonl`
- [ ] **Both user_user and user_group** match types present
- [ ] **Mixed outcomes** (accept, chat, ignore)
- [ ] **train.csv and val.csv** generated successfully
- [ ] **No PII columns** in dataset
- [ ] **All feature columns ∈ [0,1]** (normalized)
- [ ] **Both match types present** in train and val
- [ ] **Labels include both 0 and 1** in train and val
- [ ] **Time-based split respected** (no future leakage)

---

## Troubleshooting

### No Events in Logs

**Problem:** `app.log` has no `[ML_MATCH_EVENT]` entries

**Solutions:**
- Verify logging is working: check console output for `[ML_MATCH_EVENT]`
- Ensure you're performing actions that trigger logging (accept, chat, ignore)
- Check that seed users exist and have valid profiles
- Verify feature extraction is working (check for errors in logs)

### Build Script Fails

**Problem:** `build_training_set.py` throws errors

**Solutions:**
- Install pandas: `pip install pandas`
- Check JSONL format: each line should be valid JSON
- Verify file path is correct
- Check Python version: `python --version` (should be 3.7+)

### Dataset Verification Fails

**Problem:** Feature columns outside [0,1] range

**Solutions:**
- This is a feature extraction issue - check Day-1 implementation
- Verify compatibility features are being normalized correctly
- Check for data quality issues in source profiles/sessions

### Insufficient Data

**Problem:** Less than 200 events

**Solutions:**
- Continue generating interactions
- Use multiple seed users
- Try different destinations
- Mix different outcomes (more accepts, more ignores)
- You can append to existing log file (restart app and continue)

---

## Next Steps

Once Day-2 is complete:

1. ✅ Dataset is ready for ML training
2. ✅ Can proceed to Phase 4 (when requirements are defined)
3. ✅ Continue collecting data over time to improve dataset
4. ✅ Monitor dataset quality as app usage grows

---

## Notes

- **Source:** All logs include `"source": "rule-based"` (ML not active yet)
- **Preset:** Preset information is captured from system settings
- **Timestamp:** Events are timestamped for time-based splitting
- **Labels:** Automatically computed (accept/chat=1, ignore/unmatch=0)

---

**Status:** Ready to execute! 🚀

