-- ============================================================================
-- Add Users to Supabase
-- 
-- This SQL script adds the 3 users from Redis sessions to Supabase
-- with complete profiles for ML model testing
-- 
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Insert users into users table
INSERT INTO users (clerk_user_id, created_at) VALUES
  ('user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9', NOW()),
  ('user_2zghYyxAutjzjAGehuA2xjI1XxQ', NOW()),
  ('user_36Z05CDtB7mzL7rJBwAVfblep2k', NOW())
ON CONFLICT (clerk_user_id) DO NOTHING;

-- Step 2: Insert profiles for User 1
-- User: user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9
-- Budget: ₹20,000 (budget traveler)
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

-- Step 3: Insert profiles for User 2
-- User: user_2zghYyxAutjzjAGehuA2xjI1XxQ
-- Budget: ₹35,000 (mid-range traveler)
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

-- Step 4: Insert profiles for User 3
-- User: user_36Z05CDtB7mzL7rJBwAVfblep2k
-- Budget: ₹20,000 (budget traveler, different personality)
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

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify users and profiles were created:

SELECT 
  u.clerk_user_id,
  u.id as user_uuid,
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

-- ============================================================================
-- Expected Result:
-- ============================================================================
-- 3 rows with:
-- - clerk_user_id
-- - user_uuid (internal UUID)
-- - age (28, 32, 25)
-- - personality (ambivert, extrovert, introvert)
-- - interests (arrays with different values)
-- - name
