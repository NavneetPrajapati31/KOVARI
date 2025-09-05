-- =====================================================
-- SOLO MATCHING TEST DATA INSERTION SCRIPT (CORRECTED)
-- =====================================================
-- This script inserts comprehensive test data for solo matching functionality
-- Based on the KOVARI application schema
-- Run this directly in your Supabase SQL editor

-- =====================================================
-- 1. INSERT USERS (Clerk Integration) - Handle existing users
-- =====================================================

-- First, let's check what users already exist
SELECT 'Existing users:' as info, COUNT(*) as count FROM users;

-- Insert users only if they don't exist (using ON CONFLICT)
INSERT INTO users (id, clerk_user_id, created_at) VALUES 
-- Test User 1 - John (Male, 25, Extrovert)
('550e8400-e29b-41d4-a716-446655440001', 'clerk_user_john_001', NOW() - INTERVAL '30 days'),

-- Test User 2 - Sarah (Female, 28, Ambivert) 
('550e8400-e29b-41d4-a716-446655440002', 'clerk_user_sarah_002', NOW() - INTERVAL '25 days'),

-- Test User 3 - Mike (Male, 30, Introvert)
('550e8400-e29b-41d4-a716-446655440003', 'clerk_user_mike_003', NOW() - INTERVAL '20 days'),

-- Test User 4 - Emma (Female, 26, Extrovert)
('550e8400-e29b-41d4-a716-446655440004', 'clerk_user_emma_004', NOW() - INTERVAL '15 days'),

-- Test User 5 - Alex (Male, 27, Ambivert)
('550e8400-e29b-41d4-a716-446655440005', 'clerk_user_alex_005', NOW() - INTERVAL '10 days'),

-- Test User 6 - Lisa (Female, 29, Introvert)
('550e8400-e29b-41d4-a716-446655440006', 'clerk_user_lisa_006', NOW() - INTERVAL '5 days'),

-- Test User 7 - David (Male, 24, Extrovert)
('550e8400-e29b-41d4-a716-446655440007', 'clerk_user_david_007', NOW() - INTERVAL '3 days'),

-- Test User 8 - Maria (Female, 31, Ambivert)
('550e8400-e29b-41d4-a716-446655440008', 'clerk_user_maria_008', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. UPDATE PROFILES (created by trigger) with complete data
-- =====================================================

-- Update profiles only if they exist, otherwise insert them
INSERT INTO profiles (user_id, name, age, gender, nationality, bio, languages, profile_photo, job, verified, birthday, username, location, religion, smoking, drinking, personality, food_prefrence, number, email, created_at) VALUES
-- John's profile
('550e8400-e29b-41d4-a716-446655440001', 'John Smith', 25, 'male', 'Indian', 'Adventure seeker and tech enthusiast. Love exploring new places and meeting people from different cultures.', ARRAY['English', 'Hindi'], 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'Software Engineer', true, '1999-03-15', 'johnsmith', 'Mumbai', 'hindu', 'No', 'Socially', 'extrovert', 'veg', '+91-9876543210', 'john.smith@email.com', NOW() - INTERVAL '30 days'),

-- Sarah's profile
('550e8400-e29b-41d4-a716-446655440002', 'Sarah Johnson', 28, 'female', 'Indian', 'Creative designer who loves photography and cultural experiences. Always up for new adventures!', ARRAY['English', 'Hindi', 'French'], 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400', 'UI/UX Designer', true, '1996-07-22', 'sarahjohnson', 'Delhi', 'christian', 'No', 'Socially', 'ambivert', 'non-veg', '+91-9876543211', 'sarah.johnson@email.com', NOW() - INTERVAL '25 days'),

-- Mike's profile
('550e8400-e29b-41d4-a716-446655440003', 'Mike Wilson', 30, 'male', 'Indian', 'History teacher passionate about ancient cultures and quiet exploration. Prefer meaningful conversations over large groups.', ARRAY['English', 'Hindi', 'Sanskrit'], 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400', 'History Teacher', true, '1994-11-08', 'mikewilson', 'Bangalore', 'hindu', 'No', 'No', 'introvert', 'veg', '+91-9876543212', 'mike.wilson@email.com', NOW() - INTERVAL '20 days'),

-- Emma's profile
('550e8400-e29b-41d4-a716-446655440004', 'Emma Davis', 26, 'female', 'Indian', 'Marketing professional who loves networking and discovering hidden gems in every city. Foodie and culture enthusiast!', ARRAY['English', 'Hindi', 'Tamil'], 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', 'Marketing Manager', true, '1998-05-12', 'emmadavis', 'Chennai', 'hindu', 'No', 'Socially', 'extrovert', 'non-veg', '+91-9876543213', 'emma.davis@email.com', NOW() - INTERVAL '15 days'),

-- Alex's profile
('550e8400-e29b-41d4-a716-446655440005', 'Alex Brown', 27, 'male', 'Indian', 'Full-stack developer with a passion for hiking and photography. Love both solo adventures and group activities.', ARRAY['English', 'Hindi', 'Telugu'], 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'Full-Stack Developer', true, '1997-09-30', 'alexbrown', 'Hyderabad', 'agnostic', 'No', 'Socially', 'ambivert', 'veg', '+91-9876543214', 'alex.brown@email.com', NOW() - INTERVAL '10 days'),

-- Lisa's profile
('550e8400-e29b-41d4-a716-446655440006', 'Lisa Garcia', 29, 'female', 'Indian', 'Architect who finds beauty in both modern cities and ancient ruins. Prefer intimate travel experiences.', ARRAY['English', 'Hindi', 'Marathi'], 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', 'Architect', true, '1995-12-03', 'lisagarcia', 'Pune', 'christian', 'No', 'No', 'introvert', 'veg', '+91-9876543215', 'lisa.garcia@email.com', NOW() - INTERVAL '5 days'),

-- David's profile
('550e8400-e29b-41d4-a716-446655440007', 'David Lee', 24, 'male', 'Indian', 'Musician and music producer. Love exploring local music scenes and meeting fellow artists around the world.', ARRAY['English', 'Hindi', 'Bengali'], 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'Music Producer', true, '2000-02-18', 'davidlee', 'Kolkata', 'hindu', 'Yes', 'Yes', 'extrovert', 'non-veg', '+91-9876543216', 'david.lee@email.com', NOW() - INTERVAL '3 days'),

-- Maria's profile
('550e8400-e29b-41d4-a716-446655440008', 'Maria Rodriguez', 31, 'female', 'Indian', 'Medical professional with a love for wellness tourism and cultural medicine. Balance between adventure and relaxation.', ARRAY['English', 'Hindi', 'Gujarati'], 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400', 'Medical Doctor', true, '1993-08-25', 'mariarodriguez', 'Ahmedabad', 'hindu', 'No', 'Socially', 'ambivert', 'veg', '+91-9876543217', 'maria.rodriguez@email.com', NOW() - INTERVAL '1 day')
ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    age = EXCLUDED.age,
    gender = EXCLUDED.gender,
    nationality = EXCLUDED.nationality,
    bio = EXCLUDED.bio,
    languages = EXCLUDED.languages,
    profile_photo = EXCLUDED.profile_photo,
    job = EXCLUDED.job,
    verified = EXCLUDED.verified,
    birthday = EXCLUDED.birthday,
    username = EXCLUDED.username,
    location = EXCLUDED.location,
    religion = EXCLUDED.religion,
    smoking = EXCLUDED.smoking,
    drinking = EXCLUDED.drinking,
    personality = EXCLUDED.personality,
    food_prefrence = EXCLUDED.food_prefrence,
    number = EXCLUDED.number,
    email = EXCLUDED.email;

-- =====================================================
-- 3. INSERT TRAVEL PREFERENCES (Handle existing)
-- =====================================================

-- Clear existing travel preferences for our test users
DELETE FROM travel_preferences WHERE user_id IN (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440008'
);

INSERT INTO travel_preferences (id, user_id, destinations, interests, created_at) VALUES 
-- John's preferences - Adventure & Tech
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 
 ARRAY['Mumbai', 'Goa', 'Rishikesh', 'Manali'], 
 ARRAY['adventure', 'technology', 'photography', 'trekking', 'water_sports'], 
 NOW() - INTERVAL '25 days'),

-- Sarah's preferences - Culture & Photography
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 
 ARRAY['Delhi', 'Jaipur', 'Varanasi', 'Agra'], 
 ARRAY['culture', 'photography', 'art', 'history', 'architecture'], 
 NOW() - INTERVAL '20 days'),

-- Mike's preferences - History & Culture
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 
 ARRAY['Bangalore', 'Mysore', 'Hampi', 'Badami'], 
 ARRAY['history', 'culture', 'architecture', 'museums', 'temples'], 
 NOW() - INTERVAL '15 days'),

-- Emma's preferences - Food & Nightlife
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 
 ARRAY['Chennai', 'Mumbai', 'Delhi', 'Kolkata'], 
 ARRAY['food', 'nightlife', 'shopping', 'entertainment', 'music'], 
 NOW() - INTERVAL '10 days'),

-- Alex's preferences - Nature & Photography
('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 
 ARRAY['Hyderabad', 'Ooty', 'Munnar', 'Coorg'], 
 ARRAY['nature', 'photography', 'hiking', 'wildlife', 'landscapes'], 
 NOW() - INTERVAL '8 days'),

-- Lisa's preferences - Architecture & Art
('770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 
 ARRAY['Pune', 'Aurangabad', 'Ellora', 'Ajanta'], 
 ARRAY['architecture', 'art', 'design', 'heritage', 'sculpture'], 
 NOW() - INTERVAL '5 days'),

-- David's preferences - Music & Entertainment
('770e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', 
 ARRAY['Kolkata', 'Mumbai', 'Delhi', 'Goa'], 
 ARRAY['music', 'entertainment', 'festivals', 'concerts', 'dance'], 
 NOW() - INTERVAL '3 days'),

-- Maria's preferences - Wellness & Relaxation
('770e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', 
 ARRAY['Ahmedabad', 'Rishikesh', 'Varkala', 'Kerala'], 
 ARRAY['wellness', 'yoga', 'meditation', 'spa', 'relaxation'], 
 NOW() - INTERVAL '1 day');

-- =====================================================
-- 4. INSERT SOLO TRAVEL SESSIONS (for matching algorithm)
-- =====================================================

-- Create a sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    destination_name VARCHAR(255) NOT NULL,
    budget INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    static_attributes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clear existing sessions for our test users
DELETE FROM sessions WHERE user_id IN (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440008'
);

-- Insert solo travel sessions with overlapping dates for August 2025
INSERT INTO sessions (user_id, destination_name, budget, start_date, end_date, static_attributes) VALUES
-- John - Mumbai trip Aug 15-19 (5 days)
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Mumbai',
    20000,
    '2025-08-15',
    '2025-08-19',
    '{
        "age": 25,
        "gender": "male",
        "personality": "extrovert",
        "location": {"lat": 19.0760, "lon": 72.8777},
        "smoking": "No",
        "drinking": "Socially",
        "religion": "hindu",
        "interests": ["adventure", "technology", "photography"],
        "language": "english",
        "nationality": "indian",
        "profession": "software_engineer"
    }'::jsonb
),

-- Sarah - Mumbai trip Aug 16-20 (5 days) - overlaps with John
(
    '550e8400-e29b-41d4-a716-446655440002',
    'Mumbai',
    25000,
    '2025-08-16',
    '2025-08-20',
    '{
        "age": 28,
        "gender": "female",
        "personality": "ambivert",
        "location": {"lat": 19.0760, "lon": 72.8777},
        "smoking": "No",
        "drinking": "Socially",
        "religion": "christian",
        "interests": ["culture", "photography", "art"],
        "language": "english",
        "nationality": "indian",
        "profession": "ui_ux_designer"
    }'::jsonb
),

-- Mike - Mumbai trip Aug 17-21 (5 days) - overlaps with both John and Sarah
(
    '550e8400-e29b-41d4-a716-446655440003',
    'Mumbai',
    18000,
    '2025-08-17',
    '2025-08-21',
    '{
        "age": 30,
        "gender": "male",
        "personality": "introvert",
        "location": {"lat": 19.0760, "lon": 72.8777},
        "smoking": "No",
        "drinking": "No",
        "religion": "hindu",
        "interests": ["history", "culture", "architecture"],
        "language": "english",
        "nationality": "indian",
        "profession": "history_teacher"
    }'::jsonb
),

-- Emma - Mumbai trip Aug 18-22 (5 days) - overlaps with Sarah and Mike
(
    '550e8400-e29b-41d4-a716-446655440004',
    'Mumbai',
    30000,
    '2025-08-18',
    '2025-08-22',
    '{
        "age": 26,
        "gender": "female",
        "personality": "extrovert",
        "location": {"lat": 19.0760, "lon": 72.8777},
        "smoking": "No",
        "drinking": "Socially",
        "religion": "hindu",
        "interests": ["food", "nightlife", "shopping"],
        "language": "english",
        "nationality": "indian",
        "profession": "marketing_manager"
    }'::jsonb
),

-- Alex - Mumbai trip Aug 19-23 (5 days) - overlaps with Mike and Emma
(
    '550e8400-e29b-41d4-a716-446655440005',
    'Mumbai',
    22000,
    '2025-08-19',
    '2025-08-23',
    '{
        "age": 27,
        "gender": "male",
        "personality": "ambivert",
        "location": {"lat": 19.0760, "lon": 72.8777},
        "smoking": "No",
        "drinking": "Socially",
        "religion": "agnostic",
        "interests": ["nature", "photography", "hiking"],
        "language": "english",
        "nationality": "indian",
        "profession": "full_stack_developer"
    }'::jsonb
),

-- Lisa - Mumbai trip Aug 20-24 (5 days) - overlaps with Emma and Alex
(
    '550e8400-e29b-41d4-a716-446655440006',
    'Mumbai',
    28000,
    '2025-08-20',
    '2025-08-24',
    '{
        "age": 29,
        "gender": "female",
        "personality": "introvert",
        "location": {"lat": 19.0760, "lon": 72.8777},
        "smoking": "No",
        "drinking": "No",
        "religion": "christian",
        "interests": ["architecture", "art", "design"],
        "language": "english",
        "nationality": "indian",
        "profession": "architect"
    }'::jsonb
),

-- David - Mumbai trip Aug 21-25 (5 days) - overlaps with Alex and Lisa
(
    '550e8400-e29b-41d4-a716-446655440007',
    'Mumbai',
    24000,
    '2025-08-21',
    '2025-08-25',
    '{
        "age": 24,
        "gender": "male",
        "personality": "extrovert",
        "location": {"lat": 19.0760, "lon": 72.8777},
        "smoking": "Yes",
        "drinking": "Yes",
        "religion": "hindu",
        "interests": ["music", "entertainment", "festivals"],
        "language": "english",
        "nationality": "indian",
        "profession": "music_producer"
    }'::jsonb
),

-- Maria - Mumbai trip Aug 22-26 (5 days) - overlaps with Lisa and David
(
    '550e8400-e29b-41d4-a716-446655440008',
    'Mumbai',
    26000,
    '2025-08-22',
    '2025-08-26',
    '{
        "age": 31,
        "gender": "female",
        "personality": "ambivert",
        "location": {"lat": 19.0760, "lon": 72.8777},
        "smoking": "No",
        "drinking": "Socially",
        "religion": "hindu",
        "interests": ["wellness", "yoga", "meditation"],
        "language": "english",
        "nationality": "indian",
        "profession": "medical_doctor"
    }'::jsonb
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check inserted data
SELECT 'Users inserted:' as info, COUNT(*) as count FROM users
UNION ALL
SELECT 'Profiles inserted:', COUNT(*) FROM profiles
UNION ALL
SELECT 'Travel preferences inserted:', COUNT(*) FROM travel_preferences
UNION ALL
SELECT 'Solo sessions inserted:', COUNT(*) FROM sessions;

-- Show date overlap analysis for Mumbai trips
SELECT 
    s1.user_id as user1,
    s1.start_date as start1,
    s1.end_date as end1,
    s2.user_id as user2,
    s2.start_date as start2,
    s2.end_date as end2,
    CASE 
        WHEN s1.start_date <= s2.end_date AND s1.end_date >= s2.start_date 
        THEN 'OVERLAPS'
        ELSE 'NO OVERLAP'
    END as overlap_status,
    CASE 
        WHEN s1.start_date <= s2.end_date AND s1.end_date >= s2.start_date 
        THEN GREATEST(0, LEAST(s1.end_date, s2.end_date) - GREATEST(s1.start_date, s2.start_date) + 1)
        ELSE 0
    END as overlap_days
FROM sessions s1
JOIN sessions s2 ON s1.user_id < s2.user_id
WHERE s1.destination_name = 'Mumbai' 
    AND s2.destination_name = 'Mumbai'
    AND s1.start_date <= s2.end_date 
    AND s1.end_date >= s2.start_date
ORDER BY s1.start_date, s2.start_date;

-- Summary of what was created
SELECT 
    COUNT(*) as total_users,
    COUNT(DISTINCT destination_name) as destinations,
    MIN(start_date) as earliest_trip,
    MAX(end_date) as latest_trip,
    AVG(budget) as avg_budget
FROM sessions;

-- Sample profile data with travel preferences
SELECT 
    p.name,
    p.age,
    p.gender,
    p.personality,
    p.location,
    p.religion,
    p.smoking,
    p.drinking,
    tp.destinations,
    tp.interests
FROM profiles p
LEFT JOIN travel_preferences tp ON p.user_id = tp.user_id
ORDER BY p.created_at DESC
LIMIT 5;
