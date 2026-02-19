# Generate ML Training Data - Step-by-Step Guide

**Current Status:** No `[ML_MATCH_EVENT]` entries found in `app.log`. We need to generate interactions.

---

## Prerequisites Checklist

Before generating interactions, verify:

- [ ] **App is running with logging enabled**
  ```powershell
  npm.cmd run dev > app.log 2>&1
  ```

- [ ] **Seed users exist in Clerk** (already done ✅)
- [ ] **Seed users synced to database** (run if needed):
  ```powershell
  node src/lib/ai/datasets/sync-seed-users-to-database.js
  ```

- [ ] **Redis sessions created for seed users** (run if needed):
  ```powershell
  node src/lib/ai/datasets/create-seed-user-sessions.js
  ```

---

## Step 1: Verify Seed User Sessions Have Overlapping Destinations

The matching algorithm requires users to have:
- **Same destination** (e.g., both searching for "Goa")
- **Overlapping travel dates**
- **Compatible preferences** (budget, interests, etc.)

### Quick Check: Verify Redis Sessions

```powershell
node -e "require('dotenv').config({path: '.env.local'}); const redis = require('redis'); const client = redis.createClient({url: process.env.REDIS_URL}); client.connect().then(() => client.keys('session:*')).then(keys => Promise.all(keys.map(k => client.get(k).then(v => ({key: k, data: v ? JSON.parse(v) : null}))))).then(sessions => { sessions.forEach(s => { if(s.data) { const userId = s.key.split(':')[1]?.substring(0, 20) || 'unknown'; console.log(userId + '...'); console.log('  Dest:', s.data.destination?.name || s.data.destination); console.log('  Dates:', s.data.startDate + ' to ' + s.data.endDate); console.log('  Budget: ₹' + s.data.budget); console.log(''); } }); }).finally(() => client.quit());"
```

**Expected:** You should see multiple users with the same destination and overlapping dates.

**If sessions don't overlap:**
- Edit `src/lib/ai/datasets/create-seed-user-sessions.js` to ensure overlapping destinations/dates
- Re-run the script to recreate sessions

---

## Step 2: Start App with Logging (If Not Already Running)

Open a **new terminal** and run:

```powershell
npm.cmd run dev > app.log 2>&1
```

**Keep this terminal running** - all console logs will be captured.

---

## Step 3: Create Sessions Through App (If Needed)

**Important:** If Redis sessions were created with placeholder Clerk IDs, you need to create sessions using your actual logged-in Clerk IDs.

### Option A: Create Sessions via Dashboard (Recommended)

1. **Login as a seed user** (e.g., `budget.traveler@example.com`)
2. **Navigate to `/dashboard`**
3. **Fill in travel preferences:**
   - Destination (e.g., "Goa")
   - Travel dates (make sure they overlap with other users)
   - Budget
   - Interests
4. **Submit** - This creates a Redis session with your actual Clerk ID
5. **Repeat for other seed users** with **overlapping destinations and dates**

### Option B: Re-run Session Script After Syncing Clerk IDs

1. **Sync actual Clerk IDs to database:**
   ```powershell
   node src/lib/ai/datasets/sync-seed-users-to-database.js
   ```

2. **Recreate Redis sessions:**
   ```powershell
   node src/lib/ai/datasets/create-seed-user-sessions.js
   ```

---

## Step 4: Generate Interactions

### Login Credentials

**Password for ALL users:** `SeedUser123!`

**Email Addresses:**
1. `budget.traveler@example.com`
2. `luxury.traveler@example.com`
3. `solo.introvert@example.com`
4. `extrovert.group@example.com`
5. `short.trip@example.com`
6. `long.trip@example.com`

### Interaction Flow

#### A. Solo Match Interactions (User ↔ User)

**Location:** `/explore` page

1. **Login as User 1** (e.g., `budget.traveler@example.com`)
   - Navigate to `/explore`
   - Search for a destination (e.g., "Goa")
   - You should see solo match cards

2. **Perform Actions:**
   - **Skip/Ignore** (logs `"outcome": "ignore"`):
     - Click "Skip" or "Pass" button on a match card
     - This calls `/api/matching/skip` → logs ML event
   
   - **Interested** (logs `"outcome": "accept"` + `"outcome": "chat"`):
     - Click "Interested" button on a match card
     - This creates an interest record
     - When the other user accepts, it logs "accept"
     - When chat is initiated, it logs "chat"

3. **Login as User 2** (e.g., `luxury.traveler@example.com`)
   - Navigate to `/requests` (if User 1 sent interest)
   - **Accept** the interest → logs `"outcome": "accept"` and `"outcome": "chat"`

#### B. Group Match Interactions (User ↔ Group)

**Location:** `/explore` page → Switch to "Groups" tab

1. **Login as any user**
2. **Skip a group**:
   - Click "Skip" on a group match card
   - This logs `"outcome": "ignore"`, `"matchType": "user_group"`

### Quick Interaction Strategy

**Aim for ~200-500 total events:**

1. **Use multiple browsers/incognito windows** to login as different users simultaneously
2. **Mix of actions:**
   - ~40-50% accepts (positive labels)
   - ~30-40% ignores (negative labels)
   - ~10-20% chats (positive labels)

3. **Both match types:**
   - User-user matches (accept, chat, ignore)
   - User-group matches (ignore)

---

## Step 5: Monitor Events in Real-Time

While performing actions, check if events are being logged:

```powershell
# Count events so far
(Select-String -Pattern "\[ML_MATCH_EVENT\]" app.log).Count

# View recent events
Select-String -Pattern "\[ML_MATCH_EVENT\]" app.log | Select-Object -Last 5
```

**Expected output:**
```
[ML_MATCH_EVENT] {"matchType":"user_user","features":{...},"outcome":"ignore","label":0,"preset":"balanced","timestamp":1704123456789,"source":"rule-based"}
```

---

## Step 6: Extract Events to JSONL

Once you have enough interactions (aim for 200-500 events), stop the app (Ctrl+C) and extract:

```powershell
.\src\lib\ai\datasets\extract-events.ps1 app.log match_events.jsonl
```

Or manually:

```powershell
Select-String -Pattern "\[ML_MATCH_EVENT\]" app.log | ForEach-Object {
    $_.Line -replace '.*\[ML_MATCH_EVENT\]\s*', ''
} | Out-File -FilePath match_events.jsonl -Encoding utf8
```

**Verify extraction:**
```powershell
# Count events
(Get-Content match_events.jsonl | Measure-Object -Line).Lines

# View sample
Get-Content match_events.jsonl | Select-Object -First 3
```

---

## Step 7: Build Training Dataset

```powershell
python src/lib/ai/datasets/build_training_set.py match_events.jsonl
```

**Expected output:**
```
🔍 Parsing log file...
✅ Parsed 250 events
📊 Building dataset...
✅ Dataset created with 250 samples and 45 features
✂️  Performing time-based split...
💾 Saving datasets...
✅ Training set saved: datasets/train.csv (200 samples)
✅ Validation set saved: datasets/val.csv (50 samples)
```

---

## Step 8: Verify Dataset Quality

### Quick PowerShell Check

```powershell
$train = Import-Csv datasets/train.csv
$val = Import-Csv datasets/val.csv

Write-Host "📊 Basic Statistics:"
Write-Host "  Train samples: $($train.Count)"
Write-Host "  Val samples: $($val.Count)"

Write-Host "`n📈 Match Types:"
$train | Group-Object matchType | ForEach-Object {
    Write-Host "  Train $($_.Name): $($_.Count)"
}

Write-Host "`n📊 Labels:"
$train | Group-Object label | ForEach-Object {
    Write-Host "  Train label $($_.Name): $($_.Count)"
}
```

### Detailed Python Verification

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

## Troubleshooting

### No Matches Showing Up

**Problem:** Explore page shows "No matches found" or 0 matches

**Solutions:**
1. **Check Redis sessions:**
   - Verify users have active sessions with same destination
   - Verify dates overlap
   - Re-run `create-seed-user-sessions.js` if needed

2. **Check matching preset:**
   - Default is "balanced" (minScore: 0.25, maxDistance: 200km)
   - Users might be too far apart or incompatible

3. **Check debug logs:**
   - Look for "Found 0 compatible matches" in `app.log`
   - Check why matches are being filtered

### No Events in Logs

**Problem:** `[ML_MATCH_EVENT]` not appearing in `app.log`

**Solutions:**
1. **Verify logging is enabled:**
   - App must be running with `> app.log 2>&1`
   - Check that `app.log` is being written to

2. **Verify actions are being performed:**
   - Skip/Ignore: Click "Skip" on match cards
   - Accept: Accept interests in `/requests` page
   - Chat: Automatically logged when accepting

3. **Check for errors:**
   - Look for API errors in `app.log`
   - Verify feature extraction is working

### Feature Extraction Errors

**Problem:** Events logged but features are null/missing

**Solutions:**
1. **Check Redis sessions exist:**
   - Verify `session:{clerkUserId}` keys exist in Redis

2. **Check database records:**
   - Verify users and profiles exist in Supabase
   - Verify groups exist (for group matches)

3. **Check destination IDs:**
   - Verify destination IDs are valid UUIDs

---

## Summary Checklist

Before marking as complete:

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

**Next Steps:** Once dataset is verified, you can proceed to ML model training (Phase 4).
