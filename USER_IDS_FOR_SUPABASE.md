# User IDs to Add to Supabase

**Purpose:** List of user IDs from Redis sessions that need to be added to Supabase for ML model testing

---

## 📋 User IDs List

### Active Users (3 total)

1. **user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9**
   - Destination: Mumbai, MH, India
   - Dates: 2026-02-18 to 2026-02-22
   - Budget: ₹20,000

2. **user_2zghYyxAutjzjAGehuA2xjI1XxQ**
   - Destination: Mumbai, MH, India
   - Dates: 2026-02-16 to 2026-02-20
   - Budget: ₹35,000

3. **user_36Z05CDtB7mzL7rJBwAVfblep2k**
   - Destination: Mumbai, MH, India
   - Dates: 2026-02-16 to 2026-02-20
   - Budget: ₹20,000

---

## 🚀 Quick Add to Supabase

### Option 1: Use SQL Script (Recommended)

Run the complete SQL script:

```bash
# View the SQL file
cat add-users-to-supabase.sql
```

Then copy and paste into **Supabase SQL Editor** and execute.

**What it does:**
- ✅ Adds 3 users to `users` table
- ✅ Creates profiles with diverse attributes:
  - Different ages (28, 32, 25)
  - Different personalities (ambivert, extrovert, introvert)
  - Different interests (travel, photography, adventure, etc.)
- ✅ Uses `ON CONFLICT` to avoid duplicates

### Option 2: Manual SQL

**Step 1: Add users**
```sql
INSERT INTO users (clerk_user_id, created_at) VALUES
  ('user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9', NOW()),
  ('user_2zghYyxAutjzjAGehuA2xjI1XxQ', NOW()),
  ('user_36Z05CDtB7mzL7rJBwAVfblep2k', NOW())
ON CONFLICT (clerk_user_id) DO NOTHING;
```

**Step 2: Add profiles** (see `add-users-to-supabase.sql` for complete profiles)

---

## ✅ Verification

After adding, verify with:

```sql
SELECT 
  u.clerk_user_id,
  p.age,
  p.personality,
  p.interests
FROM users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.clerk_user_id IN (
  'user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9',
  'user_2zghYyxAutjzjAGehuA2xjI1XxQ',
  'user_36Z05CDtB7mzL7rJBwAVfblep2k'
);
```

**Expected:** 3 rows with age, personality, and interests populated

---

## 🧪 Test After Adding

1. **Check users exist:**
   ```bash
   node check-user-in-database.js user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9
   ```

2. **Test ML predictions:**
   ```bash
   # Make API request
   curl http://localhost:3000/api/match-solo?userId=user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9
   ```

3. **Verify features are diverse:**
   - Check server logs for: `✅ Fetched static_attributes for...`
   - ML scores should now vary more (not all 0.127-0.129)
   - Features should show real values (not all 0.5)

---

## 📝 Quick Reference

**User IDs (comma-separated):**
```
user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9, user_2zghYyxAutjzjAGehuA2xjI1XxQ, user_36Z05CDtB7mzL7rJBwAVfblep2k
```

**Files:**
- `list-users-for-supabase.js` - Lists user IDs from Redis
- `add-users-to-supabase.sql` - Complete SQL script to add users
- `check-user-in-database.js` - Verify users exist

---

**Ready to add? Run the SQL script in Supabase!** 🚀
