-- SQL Script to insert test data for solo matching with overlapping dates
-- Run this directly in your Supabase SQL editor

-- First, let's check if the sessions table exists and create it if needed
-- (Uncomment if you need to create the table)

/*
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
*/

-- Clear existing test data (optional - uncomment if you want to start fresh)
-- DELETE FROM sessions WHERE user_id LIKE 'user_mumbai_%';

-- Insert test data with overlapping dates for August 2025
-- All users are traveling to Mumbai with overlapping dates to ensure matches

INSERT INTO sessions (user_id, destination_name, budget, start_date, end_date, static_attributes) VALUES
-- User 1: Mumbai trip Aug 15-19 (5 days)
(
    'user_mumbai_1',
    'Mumbai',
    20000,
    '2025-08-15',
    '2025-08-19',
    '{
        "age": 25,
        "gender": "female",
        "personality": "extrovert",
        "location": {"lat": 19.0760, "lon": 72.8777},
        "smoking": "no",
        "drinking": "socially",
        "religion": "hindu",
        "interests": ["travel", "photography", "food", "nightlife"],
        "language": "english",
        "nationality": "indian",
        "profession": "software_engineer"
    }'::jsonb
),

-- User 2: Mumbai trip Aug 16-20 (5 days) - overlaps with User 1
(
    'user_mumbai_2',
    'Mumbai',
    25000,
    '2025-08-16',
    '2025-08-20',
    '{
        "age": 28,
        "gender": "male",
        "personality": "ambivert",
        "location": {"lat": 19.0760, "lon": 72.8777},
        "smoking": "no",
        "drinking": "socially",
        "religion": "agnostic",
        "interests": ["travel", "photography", "adventure", "culture"],
        "language": "english",
        "nationality": "indian",
        "profession": "designer"
    }'::jsonb
),

-- User 3: Mumbai trip Aug 17-21 (5 days) - overlaps with both User 1 and 2
(
    'user_mumbai_3',
    'Mumbai',
    18000,
    '2025-08-17',
    '2025-08-21',
    '{
        "age": 24,
        "gender": "female",
        "personality": "introvert",
        "location": {"lat": 19.0760, "lon": 72.8777},
        "smoking": "no",
        "drinking": "no",
        "religion": "christian",
        "interests": ["travel", "culture", "history", "museums"],
        "language": "english",
        "nationality": "indian",
        "profession": "teacher"
    }'::jsonb
),

-- User 4: Mumbai trip Aug 18-22 (5 days) - overlaps with User 2 and 3
(
    'user_mumbai_4',
    'Mumbai',
    30000,
    '2025-08-18',
    '2025-08-22',
    '{
        "age": 30,
        "gender": "male",
        "personality": "extrovert",
        "location": {"lat": 19.0760, "lon": 72.8777},
        "smoking": "no",
        "drinking": "socially",
        "religion": "hindu",
        "interests": ["travel", "adventure", "sports", "nightlife"],
        "language": "english",
        "nationality": "indian",
        "profession": "marketing"
    }'::jsonb
),

-- User 5: Mumbai trip Aug 19-23 (5 days) - overlaps with User 3 and 4
(
    'user_mumbai_5',
    'Mumbai',
    22000,
    '2025-08-19',
    '2025-08-23',
    '{
        "age": 26,
        "gender": "female",
        "personality": "ambivert",
        "location": {"lat": 19.0760, "lon": 72.8777},
        "smoking": "no",
        "drinking": "socially",
        "religion": "hindu",
        "interests": ["travel", "shopping", "food", "photography"],
        "language": "english",
        "nationality": "indian",
        "profession": "architect"
    }'::jsonb
),

-- User 6: Mumbai trip Aug 20-24 (5 days) - overlaps with User 4 and 5
(
    'user_mumbai_6',
    'Mumbai',
    28000,
    '2025-08-20',
    '2025-08-24',
    '{
        "age": 29,
        "gender": "male",
        "personality": "extrovert",
        "location": {"lat": 19.0760, "lon": 72.8777},
        "smoking": "no",
        "drinking": "socially",
        "religion": "muslim",
        "interests": ["travel", "adventure", "culture", "food"],
        "language": "english",
        "nationality": "indian",
        "profession": "doctor"
    }'::jsonb
),

-- User 7: Mumbai trip Aug 21-25 (5 days) - overlaps with User 5 and 6
(
    'user_mumbai_7',
    'Mumbai',
    24000,
    '2025-08-21',
    '2025-08-25',
    '{
        "age": 27,
        "gender": "female",
        "personality": "introvert",
        "location": {"lat": 19.0760, "lon": 72.8777},
        "smoking": "no",
        "drinking": "no",
        "religion": "hindu",
        "interests": ["travel", "yoga", "wellness", "nature"],
        "language": "english",
        "nationality": "indian",
        "profession": "yoga_instructor"
    }'::jsonb
),

-- User 8: Mumbai trip Aug 22-26 (5 days) - overlaps with User 6 and 7
(
    'user_mumbai_8',
    'Mumbai',
    26000,
    '2025-08-22',
    '2025-08-26',
    '{
        "age": 31,
        "gender": "male",
        "personality": "ambivert",
        "location": {"lat": 19.0760, "lon": 72.8777},
        "smoking": "no",
        "drinking": "socially",
        "religion": "hindu",
        "interests": ["travel", "technology", "startups", "networking"],
        "language": "english",
        "nationality": "indian",
        "profession": "entrepreneur"
    }'::jsonb
),

-- User 9: Mumbai trip Aug 23-27 (5 days) - overlaps with User 7 and 8
(
    'user_mumbai_9',
    'Mumbai',
    20000,
    '2025-08-23',
    '2025-08-27',
    '{
        "age": 25,
        "gender": "female",
        "personality": "extrovert",
        "location": {"lat": 19.0760, "lon": 72.8777},
        "smoking": "no",
        "drinking": "socially",
        "religion": "christian",
        "interests": ["travel", "dancing", "music", "socializing"],
        "language": "english",
        "nationality": "indian",
        "profession": "dance_instructor"
    }'::jsonb
),

-- User 10: Mumbai trip Aug 24-28 (5 days) - overlaps with User 8 and 9
(
    'user_mumbai_10',
    'Mumbai',
    32000,
    '2025-08-24',
    '2025-08-28',
    '{
        "age": 33,
        "gender": "male",
        "personality": "extrovert",
        "location": {"lat": 19.0760, "lon": 72.8777},
        "smoking": "no",
        "drinking": "socially",
        "religion": "hindu",
        "interests": ["travel", "business", "luxury", "fine_dining"],
        "language": "english",
        "nationality": "indian",
        "profession": "business_executive"
    }'::jsonb
);

-- Verify the data was inserted
SELECT 
    user_id,
    destination_name,
    budget,
    start_date,
    end_date,
    static_attributes->>'age' as age,
    static_attributes->>'gender' as gender,
    static_attributes->>'personality' as personality,
    static_attributes->>'profession' as profession
FROM sessions 
WHERE user_id LIKE 'user_mumbai_%'
ORDER BY start_date;

-- Show date overlap analysis
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
WHERE s1.user_id LIKE 'user_mumbai_%' 
    AND s2.user_id LIKE 'user_mumbai_%'
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
FROM sessions 
WHERE user_id LIKE 'user_mumbai_%';
