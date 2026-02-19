# Manual User Insert Data for Supabase

## Users to Insert

### User 1: Budget Traveler
**Clerk User ID:** `user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9`

**Users Table:**
```sql
INSERT INTO users (clerk_user_id, created_at) 
VALUES ('user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9', NOW())
ON CONFLICT (clerk_user_id) DO NOTHING;
```

**Profiles Table:**
```sql
INSERT INTO profiles (
  user_id,
  username,
  name,
  age,
  gender,
  personality,
  interests,
  location,
  religion,
  smoking,
  drinking,
  job,
  languages,
  nationality,
  food_preference,
  deleted
)
SELECT 
  u.id,
  'user_traveler_001',
  'Budget Traveler',
  28,
  'Male',
  'ambivert',
  ARRAY['budget travel', 'backpacking', 'street food', 'adventure'],
  'Mumbai',
  'hindu',
  'No',
  'socially',
  'student',
  ARRAY['english', 'hindi'],
  'Indian',
  'veg',
  false
FROM users u
WHERE u.clerk_user_id = 'user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9'
ON CONFLICT (user_id) DO UPDATE SET
  age = EXCLUDED.age,
  personality = EXCLUDED.personality,
  interests = EXCLUDED.interests,
  name = EXCLUDED.name;
```

---

### User 2: Mid-Range Traveler
**Clerk User ID:** `user_2zghYyxAutjzjAGehuA2xjI1XxQ`

**Users Table:**
```sql
INSERT INTO users (clerk_user_id, created_at) 
VALUES ('user_2zghYyxAutjzjAGehuA2xjI1XxQ', NOW())
ON CONFLICT (clerk_user_id) DO NOTHING;
```

**Profiles Table:**
```sql
INSERT INTO profiles (
  user_id,
  username,
  name,
  age,
  gender,
  personality,
  interests,
  location,
  religion,
  smoking,
  drinking,
  job,
  languages,
  nationality,
  food_preference,
  deleted
)
SELECT 
  u.id,
  'user_traveler_002',
  'Mid-Range Traveler',
  32,
  'Female',
  'extrovert',
  ARRAY['photography', 'culture', 'food', 'music'],
  'Mumbai',
  'hindu',
  'No',
  'socially',
  'designer',
  ARRAY['english', 'hindi'],
  'Indian',
  'veg',
  false
FROM users u
WHERE u.clerk_user_id = 'user_2zghYyxAutjzjAGehuA2xjI1XxQ'
ON CONFLICT (user_id) DO UPDATE SET
  age = EXCLUDED.age,
  personality = EXCLUDED.personality,
  interests = EXCLUDED.interests,
  name = EXCLUDED.name;
```

---

### User 3: Adventure Seeker
**Clerk User ID:** `user_36Z05CDtB7mzL7rJBwAVfblep2k`

**Users Table:**
```sql
INSERT INTO users (clerk_user_id, created_at) 
VALUES ('user_36Z05CDtB7mzL7rJBwAVfblep2k', NOW())
ON CONFLICT (clerk_user_id) DO NOTHING;
```

**Profiles Table:**
```sql
INSERT INTO profiles (
  user_id,
  username,
  name,
  age,
  gender,
  personality,
  interests,
  location,
  religion,
  smoking,
  drinking,
  job,
  languages,
  nationality,
  food_preference,
  deleted
)
SELECT 
  u.id,
  'user_traveler_003',
  'Adventure Seeker',
  25,
  'Male',
  'introvert',
  ARRAY['adventure', 'hiking', 'nature', 'photography'],
  'Mumbai',
  'agnostic',
  'No',
  'No',
  'software_engineer',
  ARRAY['english'],
  'Indian',
  'veg',
  false
FROM users u
WHERE u.clerk_user_id = 'user_36Z05CDtB7mzL7rJBwAVfblep2k'
ON CONFLICT (user_id) DO UPDATE SET
  age = EXCLUDED.age,
  personality = EXCLUDED.personality,
  interests = EXCLUDED.interests,
  name = EXCLUDED.name;
```

---

## Quick Reference: All Data in One Place

### Users Table Data
| clerk_user_id | created_at |
|---------------|-------------|
| user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9 | NOW() |
| user_2zghYyxAutjzjAGehuA2xjI1XxQ | NOW() |
| user_36Z05CDtB7mzL7rJBwAVfblep2k | NOW() |

### Profiles Table Data

**User 1 (user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9):**
- username: `user_traveler_001`
- name: `Budget Traveler`
- age: `28`
- gender: `Male`
- personality: `ambivert`
- interests: `['budget travel', 'backpacking', 'street food', 'adventure']`
- location: `Mumbai`
- religion: `hindu`
- smoking: `No`
- drinking: `socially`
- job: `student`
- languages: `['english', 'hindi']`
- nationality: `Indian`
- food_preference: `veg`

**User 2 (user_2zghYyxAutjzjAGehuA2xjI1XxQ):**
- username: `user_traveler_002`
- name: `Mid-Range Traveler`
- age: `32`
- gender: `Female`
- personality: `extrovert`
- interests: `['photography', 'culture', 'food', 'music']`
- location: `Mumbai`
- religion: `hindu`
- smoking: `No`
- drinking: `socially`
- job: `designer`
- languages: `['english', 'hindi']`
- nationality: `Indian`
- food_preference: `veg`

**User 3 (user_36Z05CDtB7mzL7rJBwAVfblep2k):**
- username: `user_traveler_003`
- name: `Adventure Seeker`
- age: `25`
- gender: `Male`
- personality: `introvert`
- interests: `['adventure', 'hiking', 'nature', 'photography']`
- location: `Mumbai`
- religion: `agnostic`
- smoking: `No`
- drinking: `No`
- job: `software_engineer`
- languages: `['english']`
- nationality: `Indian`
- food_preference: `veg`

---

## Verification Query

After inserting, run this to verify:

```sql
SELECT 
  u.clerk_user_id,
  u.id as user_uuid,
  p.username,
  p.age,
  p.personality,
  p.interests,
  p.name
FROM users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.clerk_user_id IN (
  'user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9',
  'user_2zghYyxAutjzjAGehuA2xjI1XxQ',
  'user_36Z05CDtB7mzL7rJBwAVfblep2k'
);
```

**Expected Result:** 3 rows with complete user and profile data.

---

## Notes

1. **Order matters:** Insert into `users` table first, then `profiles` table
2. **Foreign key:** `profiles.user_id` must reference `users.id`
3. **Unique constraints:** 
   - `users.clerk_user_id` is unique
   - `profiles.user_id` is unique
4. **Required fields:** All NOT NULL fields must be provided (username, location, religion, smoking, drinking, personality, food_preference, interests, deleted)
5. **RLS Policies:** If you get permission errors, you may need to use the service role key or adjust RLS policies
