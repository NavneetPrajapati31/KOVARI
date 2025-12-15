# Schema Verification for user_flags Table

## Actual Database Schema

```sql
create table public.user_flags (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  reporter_id uuid null,
  type text null,
  reason text null,
  evidence_url text null,
  status text not null default 'pending'::text,
  created_at timestamp with time zone not null default now(),
  evidence_public_id text null,
  constraint user_flags_pkey primary key (id),
  constraint user_flags_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;
```

## Code Implementation

The code now correctly matches the schema:

### For User Flags:
```typescript
{
  user_id: targetId,        // ✅ NOT NULL, foreign key to users.id
  reporter_id: reporterId,  // ✅ nullable
  reason: reason.trim(),     // ✅ nullable
  evidence_url: evidenceUrl || null, // ✅ nullable
  type: "user",             // ✅ nullable (optional)
  status: "pending"         // ✅ NOT NULL, has default but explicitly set
}
```

## Potential Issues

### 1. Row Level Security (RLS)
If RLS is enabled on `user_flags`, it may block inserts. Check with:

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

### 2. Foreign Key Constraint
The `user_id` must exist in the `users` table. The code validates this before insert, but if validation passes and insert fails, it could be a race condition.

### 3. Missing Columns
All columns in the insert payload match the schema:
- ✅ `user_id` - required, has foreign key
- ✅ `reporter_id` - nullable
- ✅ `reason` - nullable
- ✅ `evidence_url` - nullable
- ✅ `type` - nullable
- ✅ `status` - required, has default

### 4. Permission Issues
The anon key might not have INSERT permission. Check in Supabase dashboard:
- Settings → API → Row Level Security
- Ensure `user_flags` table allows INSERT for authenticated users

## Error Codes to Check

The code now handles specific error codes:
- `23503` - Foreign key violation (user_id doesn't exist)
- `42501` - Permission denied (RLS blocking)
- Other codes - Generic database error

## Testing

1. **Test the insert directly:**
   ```sql
   -- Replace with actual UUIDs
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

2. **Check server logs** when submitting a report - detailed error messages are now logged

3. **Check browser console** - error details are returned in the API response

## Next Steps

1. ✅ Code matches schema
2. ⚠️ Check RLS policies
3. ⚠️ Verify anon key permissions
4. ⚠️ Test with actual data

---

**Status: Code Updated to Match Schema**
