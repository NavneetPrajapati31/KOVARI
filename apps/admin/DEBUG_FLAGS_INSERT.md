# Debugging Flags Insert Issue

## Problem
The `user_flags` table is not getting updated when submitting a report.

## Possible Causes

### 1. Database Schema Mismatch
The code is trying to insert with `user_id` column, but the database might:
- Not have the `user_id` column
- Have different column names
- Have missing required columns

**Check:** Look at the actual database schema in Supabase dashboard.

### 2. Row Level Security (RLS) Policies
The `user_flags` table might have RLS enabled that blocks inserts from the anon key.

**Solution:** Check RLS policies in Supabase:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_flags';

-- Check existing policies
SELECT * FROM pg_policies 
WHERE tablename = 'user_flags';
```

**Fix:** Add a policy to allow authenticated users to insert:
```sql
CREATE POLICY "Allow authenticated users to insert flags"
ON user_flags
FOR INSERT
TO authenticated
WITH CHECK (true);
```

### 3. Missing Required Columns
The insert might be failing because of:
- Missing `type` column (if it's required)
- Missing `status` column (if it has constraints)
- Foreign key constraints on `user_id` or `reporter_id`

**Check:** Look at the error message in the API response or server logs.

### 4. Permission Issues
The anon key might not have INSERT permission on `user_flags`.

**Check:** Verify the anon key has proper permissions in Supabase dashboard.

## Debugging Steps

### Step 1: Check Server Logs
Look for error messages in:
- Browser console (Network tab)
- Server logs (terminal where Next.js is running)
- Supabase logs (dashboard)

### Step 2: Test API Directly
```bash
curl -X POST http://localhost:3000/api/flags \
  -H "Content-Type: application/json" \
  -H "Cookie: __clerk_db_jwt=..." \
  -d '{
    "targetType": "user",
    "targetId": "test-uuid",
    "reason": "Test reason"
  }'
```

### Step 3: Check Database Schema
Run in Supabase SQL Editor:
```sql
-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_flags'
ORDER BY ordinal_position;

-- Check constraints
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'user_flags'::regclass;
```

### Step 4: Test Insert Directly
```sql
-- Test insert (replace with actual UUIDs)
INSERT INTO user_flags (
  user_id,
  reporter_id,
  reason,
  type,
  status
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'Test reason',
  'user',
  'pending'
);
```

## Current Implementation

The code now:
- Uses `user_id` column for user flags
- Uses `group_flags` table for group flags (with fallback to `user_flags`)
- Includes detailed error logging
- Returns error details in API response

## Next Steps

1. Check browser console for error messages
2. Check server terminal for detailed error logs
3. Verify database schema matches the code
4. Check RLS policies
5. Test with a direct SQL insert

---

**Status: ⚠️ Debugging Required**
