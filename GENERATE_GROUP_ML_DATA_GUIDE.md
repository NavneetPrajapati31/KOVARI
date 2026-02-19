# Generate Group Matching ML Training Data - Complete Guide

**Purpose:** Generate ML training data specifically for **User ↔ Group** matching interactions.

**Target:** 200-500 total group match events (can be combined with solo events for a complete dataset).

---

## Step 0: Prerequisites & Initial Setup

### 0.1 Environment Variables

Ensure your `.env.local` file contains:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Clerk
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Redis
REDIS_URL=your_redis_url

# Node Environment
NODE_ENV=development
```

### 0.2 Verify Dependencies

```powershell
# Check Node.js version (should be 18+)
node --version

# Check if Python is installed (for dataset building)
python --version

# Verify npm packages are installed
npm list --depth=0
```

### 0.3 Database Schema Verification

Ensure these tables exist in Supabase:
- `users` - User accounts
- `profiles` - User profile data
- `groups` - Group data
- `group_memberships` - User-group relationships
- `match_interests` - Interest records (for both solo and group)
- `match_skips` - Skip records

---

## Step 1: Create Seed Groups in Database

### 1.1 Run Seed Data Script

The seed groups are created via the `seed-training-data.js` script:

```powershell
cd C:\Users\user\KOVARI
node src/lib/ai/datasets/seed-training-data.js
```

**Expected Output:**
```
🌱 Starting seed data creation for ML training...
👤 Creating seed users...
✅ Created user: seed_budget_traveler_001 (ID: ...)
...
👥 Creating seed groups...
✅ Created group: Small Backpacker Group (ID: ...)
✅ Created group: Large International Group (ID: ...)
✅ Created group: Low-Budget Travel Group (ID: ...)
✅ Created group: Adventure Activity Group (ID: ...)
✅ Created 4/4 groups
```

### 1.2 Seed Groups Details

The script creates **4 seed groups** with the following characteristics:

| Group Name | Destination | Budget | Dates | Members | Interests |
|------------|-------------|--------|-------|---------|-----------|
| Small Backpacker Group | Goa | ₹15,000 | 2025-06-01 to 2025-06-07 | 4 | backpacking, beaches, budget travel |
| Large International Group | Mumbai | ₹50,000 | 2025-07-15 to 2025-07-25 | 8 | culture, food, history, photography |
| Low-Budget Travel Group | Delhi | ₹10,000 | 2025-08-01 to 2025-08-05 | 5 | budget travel, street food, local culture |
| Adventure Activity Group | Manali | ₹35,000 | 2025-09-10 to 2025-09-17 | 6 | adventure, trekking, outdoor activities, mountains |

### 1.3 Verify Groups Created

```powershell
# Quick check via Supabase dashboard or run:
node -e "require('dotenv').config({path: '.env.local'}); const {createClient} = require('@supabase/supabase-js'); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); supabase.from('groups').select('name, destination, start_date, end_date, budget, members_count').then(({data}) => { console.log('Groups:', JSON.stringify(data, null, 2)); });"
```

---

## Step 2: Create Seed Users (If Not Already Done)

### 2.1 Create Clerk Users

```powershell
node src/lib/ai/datasets/create-clerk-seed-users.js
```

**Seed User Emails (Password: `SeedUser123!`):**
1. `budget.traveler@example.com`
2. `luxury.traveler@example.com`
3. `solo.introvert@example.com`
4. `extrovert.group@example.com`
5. `short.trip@example.com`
6. `long.trip@example.com`

### 2.2 Sync Users to Database

```powershell
node src/lib/ai/datasets/sync-seed-users-to-database.js
```

This ensures:
- Users exist in Supabase `users` table
- Profiles exist in `profiles` table with all required fields
- Location is set (required for session creation)

### 2.3 Verify Users Created

Check that all 6 seed users have:
- ✅ Clerk account created
- ✅ Supabase user record
- ✅ Profile with location set

---

## Step 3: Create User Sessions (Redis)

### 3.1 Understanding Session Requirements

For group matching to work, users need **active Redis sessions** with:
- **Destination** matching a group's destination (or nearby)
- **Travel dates** overlapping with group dates
- **Budget** compatible with group budget

### 3.2 Create Sessions via Dashboard (Recommended)

**Why:** This ensures sessions use actual Clerk IDs (not placeholders).

1. **Login as seed user** (e.g., `budget.traveler@example.com`)
2. **Navigate to `/dashboard`**
3. **Fill in travel preferences:**
   - **Destination:** Choose one that matches a seed group (e.g., "Goa" for Small Backpacker Group)
   - **Start Date:** Overlap with group dates (e.g., 2025-06-02 for Goa group)
   - **End Date:** Overlap with group dates (e.g., 2025-06-06 for Goa group)
   - **Budget:** Compatible with group (e.g., ₹15,000 for Goa group)
   - **Interests:** Select relevant interests
4. **Submit** - Creates Redis session with actual Clerk ID
5. **Repeat for other users** with **overlapping destinations and dates**

### 3.3 Session Overlap Strategy

**Goal:** Ensure users can see and interact with groups.

**Example Overlap Plan:**

| User | Destination | Dates | Matches Group |
|------|-------------|-------|---------------|
| budget.traveler | Goa | 2025-06-02 to 2025-06-06 | Small Backpacker Group |
| extrovert.group | Mumbai | 2025-07-16 to 2025-07-24 | Large International Group |
| short.trip | Delhi | 2025-08-02 to 2025-08-04 | Low-Budget Travel Group |
| luxury.traveler | Manali | 2025-09-11 to 2025-09-16 | Adventure Activity Group |

### 3.4 Verify Sessions Created

```powershell
# Check Redis sessions
node -e "require('dotenv').config({path: '.env.local'}); const redis = require('redis'); const client = redis.createClient({url: process.env.REDIS_URL}); client.connect().then(() => client.keys('session:*')).then(keys => Promise.all(keys.map(k => client.get(k).then(v => ({key: k, data: v ? JSON.parse(v) : null}))))).then(sessions => { sessions.filter(s => s.data).forEach(s => { const userId = s.key.split(':')[1]?.substring(0, 20) || 'unknown'; console.log(userId + '...'); console.log('  Dest:', s.data.destination?.name || s.data.destination); console.log('  Dates:', s.data.startDate + ' to ' + s.data.endDate); console.log('  Budget: ₹' + s.data.budget); console.log(''); }); }).finally(() => client.quit());"
```

**Expected:** Multiple sessions with destinations matching seed groups.

---

## Step 4: Start App with Logging

### 4.1 Start Development Server

Open a **new terminal** and run:

```powershell
cd C:\Users\user\KOVARI
npm.cmd run dev > app.log 2>&1
```

**Important:**
- Keep this terminal running
- All console logs (including `[ML_MATCH_EVENT]`) will be captured in `app.log`
- Do NOT close this terminal until you're done generating interactions

### 4.2 Verify Logging is Working

Wait 10-15 seconds for the app to start, then check:

```powershell
# Check if app.log is being written
Get-Content app.log -Tail 10
```

You should see Next.js compilation and startup messages.

---

## Step 5: Generate Group Match Interactions

### 5.1 Login Credentials

**Password for ALL users:** `SeedUser123!`

**Email Addresses:**
1. `budget.traveler@example.com`
2. `luxury.traveler@example.com`
3. `solo.introvert@example.com`
4. `extrovert.group@example.com`
5. `short.trip@example.com`
6. `long.trip@example.com`

### 5.2 Interaction Flow: User ↔ Group

**Location:** `/explore` page → **Switch to "Groups" tab**

#### A. Skip/Ignore Group (Logs `"outcome": "ignore"`)

1. **Login as any seed user** (e.g., `budget.traveler@example.com`)
2. **Navigate to `/explore`**
3. **Click "Groups" tab** (if not already selected)
4. **Search for a destination** (e.g., "Goa")
5. **You should see group match cards** (e.g., "Small Backpacker Group")
6. **Click "Skip" or "Pass"** on a group card
7. **This calls `/api/matching/skip`** with `type: "group"` → logs ML event

**Expected Log Entry:**
```
[ML_MATCH_EVENT] {"matchType":"user_group","features":{...},"outcome":"ignore","label":0,"preset":"balanced","timestamp":...,"source":"rule-based"}
```

#### B. Express Interest in Group (Logs `"outcome": "accept"`)

**Note:** Currently, group interest actions do NOT automatically log ML events. You may need to add logging to `/api/groups/interest/route.ts` similar to solo interest logging.

1. **Login as any seed user**
2. **Navigate to `/explore` → Groups tab**
3. **Search for a destination**
4. **Click "Interested"** on a group card
5. **This calls `/api/groups/interest`** → creates `group_memberships` record with `status: "pending_request"`

**To Enable ML Logging for Group Interest:**

Add ML event logging to `src/app/api/groups/interest/route.ts`:

```typescript
// After successful membership creation (around line 109)
import { logMatchEvent, createMatchEventLog } from "@/lib/ai/logging/logMatchEvent";
import { extractFeaturesForGroupMatch } from "@/lib/ai/logging/extract-features-for-logging";
import { getSetting } from "@/lib/settings";

// ... existing code ...

// After membershipData is created successfully
try {
  const presetSetting = await getSetting("matching_preset");
  const presetMode = (presetSetting as { mode: string } | null)?.mode || "balanced";

  // Get user's Clerk ID
  const { data: userData } = await supabaseAdmin
    .from("users")
    .select("clerk_user_id")
    .eq("id", userUuid)
    .single();

  if (userData?.clerk_user_id) {
    const features = await extractFeaturesForGroupMatch(
      userData.clerk_user_id,
      groupId,
      destinationId
    );

    if (features) {
      logMatchEvent(
        createMatchEventLog(
          "user_group",
          features,
          "accept", // Log as 'accept' when interest is expressed
          presetMode.toLowerCase()
        )
      );
    }
  }
} catch (logError) {
  console.error("Error logging group interest event:", logError);
  // Don't fail the request if logging fails
}
```

#### C. Accept Group Join Request (Organizer Action)

**Note:** This is when a group organizer accepts a user's join request. Currently, this may not log ML events. Check `/api/group-invitation/route.ts` or group membership accept endpoints.

### 5.3 Quick Interaction Strategy

**Aim for ~200-500 total group events:**

1. **Use multiple browsers/incognito windows** to login as different users simultaneously
2. **Mix of actions:**
   - ~40-50% accepts (positive labels) - when user clicks "Interested"
   - ~50-60% ignores (negative labels) - when user clicks "Skip"
3. **Cover all seed groups:**
   - Interact with "Small Backpacker Group" (Goa)
   - Interact with "Large International Group" (Mumbai)
   - Interact with "Low-Budget Travel Group" (Delhi)
   - Interact with "Adventure Activity Group" (Manali)
4. **Use different users for variety:**
   - Some users skip all groups (negative examples)
   - Some users express interest in compatible groups (positive examples)

### 5.4 Interaction Checklist

- [ ] Login as `budget.traveler@example.com` → Search "Goa" → Skip "Small Backpacker Group"
- [ ] Login as `budget.traveler@example.com` → Search "Goa" → Interested in "Small Backpacker Group"
- [ ] Login as `extrovert.group@example.com` → Search "Mumbai" → Skip "Large International Group"
- [ ] Login as `extrovert.group@example.com` → Search "Mumbai" → Interested in "Large International Group"
- [ ] Login as `short.trip@example.com` → Search "Delhi" → Skip "Low-Budget Travel Group"
- [ ] Login as `short.trip@example.com` → Search "Delhi" → Interested in "Low-Budget Travel Group"
- [ ] Login as `luxury.traveler@example.com` → Search "Manali" → Skip "Adventure Activity Group"
- [ ] Login as `luxury.traveler@example.com` → Search "Manali" → Interested in "Adventure Activity Group"
- [ ] Repeat with other users and mix of actions

---

## Step 6: Monitor Events in Real-Time

### 6.1 Check Event Count

While performing actions, periodically check:

```powershell
# Count group match events
(Select-String -Pattern '\[ML_MATCH_EVENT\].*"matchType":"user_group"' app.log).Count

# Count all ML events (solo + group)
(Select-String -Pattern "\[ML_MATCH_EVENT\]" app.log).Count
```

### 6.2 View Recent Events

```powershell
# View last 5 group events
Select-String -Pattern '\[ML_MATCH_EVENT\].*"matchType":"user_group"' app.log | Select-Object -Last 5

# View all recent ML events
Select-String -Pattern "\[ML_MATCH_EVENT\]" app.log | Select-Object -Last 10
```

### 6.3 Event Breakdown

```powershell
# Quick breakdown script
$groupEvents = Select-String -Pattern '\[ML_MATCH_EVENT\].*"matchType":"user_group"' app.log
$accepts = ($groupEvents | Select-String -Pattern '"outcome":"accept"').Count
$ignores = ($groupEvents | Select-String -Pattern '"outcome":"ignore"').Count

Write-Host "📊 Group Match Events:" -ForegroundColor Cyan
Write-Host "  Total: $($groupEvents.Count)" -ForegroundColor Yellow
Write-Host "  Accepts: $accepts" -ForegroundColor Green
Write-Host "  Ignores: $ignores" -ForegroundColor Yellow
```

**Expected Output:**
```
📊 Group Match Events:
  Total: 45
  Accepts: 20
  Ignores: 25
```

---

## Step 7: Extract Events to JSONL

### 7.1 Stop the App

Once you have enough interactions (aim for 200-500 total events, including both solo and group):

1. **Stop the development server** (Ctrl+C in the terminal running `npm.cmd run dev`)
2. **Wait a few seconds** for logs to flush

### 7.2 Extract Group Events Only (Optional)

If you want to extract only group events:

```powershell
Select-String -Pattern '\[ML_MATCH_EVENT\].*"matchType":"user_group"' app.log | ForEach-Object {
    $_.Line -replace '.*\[ML_MATCH_EVENT\]\s*', ''
} | Out-File -FilePath match_events_group.jsonl -Encoding utf8
```

### 7.3 Extract All Events (Recommended)

Extract all ML events (both solo and group) to a single file:

```powershell
Select-String -Pattern "\[ML_MATCH_EVENT\]" app.log | ForEach-Object {
    $_.Line -replace '.*\[ML_MATCH_EVENT\]\s*', ''
} | Out-File -FilePath match_events.jsonl -Encoding utf8
```

### 7.4 Verify Extraction

```powershell
# Count events in JSONL file
(Get-Content match_events.jsonl | Measure-Object -Line).Lines

# Count group events
(Select-String -Pattern '"matchType":"user_group"' match_events.jsonl).Count

# View sample events
Get-Content match_events.jsonl | Select-Object -First 3
```

**Expected Output:**
```
# Total events
250

# Group events
45

# Sample event
{"matchType":"user_group","features":{"matchType":"user_group","distanceScore":1,"dateOverlapScore":0.9,"budgetScore":0.8,"interestScore":0.6,"ageScore":0.7,"languageScore":0.5,"lifestyleScore":0.8,"backgroundScore":0.6},"outcome":"accept","label":1,"preset":"balanced","timestamp":1704123456789,"source":"rule-based"}
```

---

## Step 8: Build Training Dataset

### 8.1 Run Dataset Builder

```powershell
python src/lib/ai/datasets/build_training_set.py match_events.jsonl
```

**Expected Output:**
```
🔍 Parsing log file...
✅ Parsed 250 events
📊 Building dataset...
✅ Dataset created with 250 samples and 52 features
✂️  Performing time-based split...
💾 Saving datasets...
✅ Training set saved: datasets/train.csv (200 samples)
✅ Validation set saved: datasets/val.csv (50 samples)
```

### 8.2 Verify Output Files

```powershell
# Check files exist
Test-Path datasets/train.csv
Test-Path datasets/val.csv

# Check row counts
(Import-Csv datasets/train.csv).Count
(Import-Csv datasets/val.csv).Count
```

---

## Step 9: Verify Dataset Quality

### 9.1 Quick PowerShell Check

```powershell
$train = Import-Csv datasets/train.csv
$val = Import-Csv datasets/val.csv

Write-Host "📊 Basic Statistics:" -ForegroundColor Cyan
Write-Host "  Train samples: $($train.Count)" -ForegroundColor Yellow
Write-Host "  Val samples: $($val.Count)" -ForegroundColor Yellow

Write-Host "`n📈 Match Types:" -ForegroundColor Cyan
$train | Group-Object matchType | ForEach-Object {
    Write-Host "  Train $($_.Name): $($_.Count)" -ForegroundColor Green
}
$val | Group-Object matchType | ForEach-Object {
    Write-Host "  Val $($_.Name): $($_.Count)" -ForegroundColor Green
}

Write-Host "`n📊 Labels:" -ForegroundColor Cyan
$train | Group-Object label | ForEach-Object {
    Write-Host "  Train label $($_.Name): $($_.Count)" -ForegroundColor Green
}
$val | Group-Object label | ForEach-Object {
    Write-Host "  Val label $($_.Name): $($_.Count)" -ForegroundColor Green
}

Write-Host "`n✅ Group Events:" -ForegroundColor Cyan
$trainGroup = ($train | Where-Object { $_.matchType -eq "user_group" }).Count
$valGroup = ($val | Where-Object { $_.matchType -eq "user_group" }).Count
Write-Host "  Train user_group: $trainGroup" -ForegroundColor Green
Write-Host "  Val user_group: $valGroup" -ForegroundColor Green
```

### 9.2 Detailed Python Verification

```powershell
python src/lib/ai/datasets/verify_dataset.py datasets/train.csv datasets/val.csv
```

**Checks Performed:**
- ✅ No PII columns (no emails, names, IDs)
- ✅ All feature columns ∈ [0,1] (normalized)
- ✅ Both match types present (`user_user` and `user_group`)
- ✅ Labels include both 0 and 1
- ✅ Time-based split respected (no future leakage)

### 9.3 Manual Verification Checklist

- [ ] **No PII:** Check that columns don't contain emails, names, or user IDs
- [ ] **Feature Normalization:** All feature columns should be between 0 and 1
- [ ] **Match Types:** Both `user_user` and `user_group` present in train and val
- [ ] **Labels:** Both 0 (ignore) and 1 (accept) present in train and val
- [ ] **Time Split:** Validation set should have later timestamps than training set
- [ ] **Group Events:** At least some `user_group` events in both train and val

---

## Step 10: Troubleshooting

### 10.1 No Group Matches Showing Up

**Problem:** Explore page shows "No groups found" or 0 group matches

**Solutions:**
1. **Check Redis sessions:**
   - Verify users have active sessions with destinations matching groups
   - Verify dates overlap with group dates
   - Re-create sessions via dashboard if needed

2. **Check group status:**
   - Groups must have `status: 'active'` in database
   - Groups must have valid `destination`, `start_date`, `end_date`

3. **Check matching preset:**
   - Default is "balanced" (minScore: 0.25, maxDistance: 200km)
   - User-group compatibility might be too low
   - Check debug logs in `app.log` for filtering reasons

4. **Check geocoding:**
   - Group destinations must be geocodable (e.g., "Goa", "Mumbai")
   - Check `destination_lat` and `destination_lon` in groups table

### 10.2 No Events in Logs

**Problem:** `[ML_MATCH_EVENT]` with `"matchType":"user_group"` not appearing in `app.log`

**Solutions:**
1. **Verify logging is enabled:**
   - App must be running with `> app.log 2>&1`
   - Check that `app.log` is being written to

2. **Verify actions are being performed:**
   - Skip: Click "Skip" on group match cards
   - Interested: Click "Interested" (may need ML logging added - see Step 5.2.B)

3. **Check for errors:**
   - Look for API errors in `app.log`
   - Verify feature extraction is working
   - Check that groups exist in database

4. **Verify ML logging is implemented:**
   - Group skip: Should log in `/api/matching/skip/route.ts` (lines 189-203)
   - Group interest: May need to add logging to `/api/groups/interest/route.ts`

### 10.3 Feature Extraction Errors

**Problem:** Events logged but features are null/missing

**Solutions:**
1. **Check Redis sessions exist:**
   - Verify `session:{clerkUserId}` keys exist in Redis
   - Verify session has `destination`, `startDate`, `endDate`, `budget`

2. **Check database records:**
   - Verify users and profiles exist in Supabase
   - Verify groups exist with all required fields
   - Verify `destination_id` is a valid UUID

3. **Check geocoding:**
   - Group destinations must be geocodable
   - Check `getCoordinatesForLocation` is working

### 10.4 Groups Not Appearing in Explore

**Problem:** Groups exist in database but don't show in explore page

**Solutions:**
1. **Check group status:**
   ```sql
   SELECT id, name, status, destination FROM groups WHERE status = 'active';
   ```

2. **Check group dates:**
   - Groups with past `end_date` might be filtered
   - Ensure `start_date` and `end_date` are in the future

3. **Check group visibility:**
   - `is_public` should be `true` for groups to appear in explore

4. **Check API response:**
   - Open browser DevTools → Network tab
   - Check `/api/match-groups` response
   - Look for errors or empty results

### 10.5 Session Creation Fails

**Problem:** "User profile not found" or "Profile location invalid" when creating session

**Solutions:**
1. **Run sync script:**
   ```powershell
   node src/lib/ai/datasets/sync-seed-users-to-database.js
   ```

2. **Check profile location:**
   - Profile must have `location` field set
   - Location should be a string (e.g., "Mumbai") or object with `lat`/`lon`

3. **Update profile location if missing:**
   - Use Supabase dashboard or run update query

---

## Step 11: Summary Checklist

Before marking as complete:

- [ ] **Seed groups created** (4 groups in database)
- [ ] **Seed users created and synced** (6 users with profiles)
- [ ] **User sessions created** (Redis sessions with overlapping destinations/dates)
- [ ] **App running with logging** (`npm.cmd run dev > app.log 2>&1`)
- [ ] **200-500 total events** captured (can include both solo and group)
- [ ] **Group events present** (`"matchType":"user_group"` in logs)
- [ ] **Mixed outcomes** (accept, ignore)
- [ ] **match_events.jsonl** extracted successfully
- [ ] **train.csv and val.csv** generated successfully
- [ ] **No PII columns** in dataset
- [ ] **All feature columns ∈ [0,1]** (normalized)
- [ ] **Both match types present** (`user_user` and `user_group`)
- [ ] **Labels include both 0 and 1** in train and val
- [ ] **Time-based split respected** (no future leakage)

---

## Step 12: Next Steps

Once dataset is verified:

1. **Combine with Solo Dataset (Optional):**
   - If you have separate solo and group datasets, combine them:
   ```powershell
   Get-Content match_events_solo.jsonl, match_events_group.jsonl | Out-File match_events_combined.jsonl -Encoding utf8
   ```

2. **Proceed to ML Model Training (Phase 4):**
   - Use `train.csv` and `val.csv` for model training
   - Ensure both `user_user` and `user_group` events are included

3. **Documentation:**
   - Update dataset documentation with group event counts
   - Note any issues or edge cases encountered

---

## Appendix A: Group Matching Feature Extraction

Group matching uses the following features (from `extractFeaturesForGroupMatch`):

- **distanceScore:** Distance between user destination and group destination
- **dateOverlapScore:** Overlap between user travel dates and group dates
- **budgetScore:** Compatibility between user budget and group average budget
- **interestScore:** Jaccard similarity between user interests and group top interests
- **ageScore:** Compatibility between user age and group average age
- **languageScore:** Jaccard similarity between user languages and group dominant languages
- **lifestyleScore:** Compatibility for smoking/drinking preferences
- **backgroundScore:** Compatibility for profession and nationality

All features are normalized to [0,1] range.

---

## Appendix B: Group Match Event Schema

```json
{
  "matchType": "user_group",
  "features": {
    "matchType": "user_group",
    "distanceScore": 1.0,
    "dateOverlapScore": 0.9,
    "budgetScore": 0.8,
    "interestScore": 0.6,
    "ageScore": 0.7,
    "languageScore": 0.5,
    "lifestyleScore": 0.8,
    "backgroundScore": 0.6
  },
  "outcome": "accept" | "ignore",
  "label": 1 | 0,
  "preset": "balanced" | "strict" | "loose",
  "timestamp": 1704123456789,
  "source": "rule-based"
}
```

---

## Appendix C: Quick Reference Commands

```powershell
# Start app with logging
npm.cmd run dev > app.log 2>&1

# Check event count
(Select-String -Pattern "\[ML_MATCH_EVENT\]" app.log).Count

# Extract events
Select-String -Pattern "\[ML_MATCH_EVENT\]" app.log | ForEach-Object { $_.Line -replace '.*\[ML_MATCH_EVENT\]\s*', '' } | Out-File match_events.jsonl -Encoding utf8

# Build dataset
python src/lib/ai/datasets/build_training_set.py match_events.jsonl

# Verify dataset
python src/lib/ai/datasets/verify_dataset.py datasets/train.csv datasets/val.csv
```

---

**End of Guide**

For questions or issues, refer to:
- `GENERATE_ML_DATA_GUIDE.md` (Solo matching guide)
- `DAY2_FINAL_STEPS.md` (General dataset generation)
- `LOGIN_TROUBLESHOOTING.md` (Login issues)
