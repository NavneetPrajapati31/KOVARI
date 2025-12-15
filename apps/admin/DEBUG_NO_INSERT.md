# Debugging: No Entry in Database After Report Submission

## Problem
Reports are being submitted but no entry is appearing in the `user_flags` table.

## Debugging Steps Added

### 1. Enhanced Logging
Added comprehensive logging throughout the flow:

**In `/api/flags` route:**
- Logs when API is called
- Logs request body and parsed values
- Logs insert payload before attempting insert
- Logs insert result (data and error)
- Logs verification query after insert
- Logs final response

**In `ReportDialog` component:**
- Logs request payload before sending
- Logs response status and data
- Logs errors with full details

### 2. Verification Query
After a successful insert, the code now queries the database to verify the flag actually exists.

## How to Debug

### Step 1: Check Server Logs
When you submit a report, look at your **terminal where Next.js is running**. You should see:

```
=== FLAG API CALLED ===
=== FLAG INSERT DEBUG ===
=== INSERT RESULT ===
✅ SUCCESS: User flag created successfully!
✅ VERIFIED: Flag exists in database
```

### Step 2: Check Browser Console
Open **DevTools → Console** and look for:

```
=== SUBMITTING REPORT ===
=== REPORT SUBMISSION RESPONSE ===
```

### Step 3: Common Issues to Check

#### Issue 1: Insert Error Not Caught
- Look for `❌ ERROR creating user flag` in server logs
- Check error code (23503 = foreign key, 42501 = RLS blocking)

#### Issue 2: Response Success But No Insert
- If you see `✅ SUCCESS` but `⚠️ WARNING: Could not verify flag was inserted`
- This means the insert returned success but the row doesn't exist
- Possible causes:
  - Transaction rollback
  - RLS policy blocking SELECT after INSERT
  - Database trigger deleting the row

#### Issue 3: Silent Failure
- If you don't see any logs, the API might not be called
- Check network tab in browser DevTools
- Verify the request is actually being sent

#### Issue 4: RLS Policy Blocking
- Error code `42501` = Permission denied
- Check Supabase dashboard → Authentication → Policies
- Ensure there's a policy allowing INSERT on `user_flags`

## Next Steps

1. **Submit a report** and immediately check:
   - Server terminal logs
   - Browser console logs
   - Network tab (check the `/api/flags` request)

2. **Share the logs** - Copy and paste:
   - All console.log output from server terminal
   - The response from the Network tab
   - Any error messages

3. **Check database directly:**
   ```sql
   SELECT * FROM user_flags 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

---

**Status: ⚠️ Enhanced Logging Added - Ready for Debugging**
