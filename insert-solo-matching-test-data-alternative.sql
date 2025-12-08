-- =====================================================
-- SOLO MATCHING TEST DATA INSERTION SCRIPT (ALTERNATIVE)
-- =====================================================
-- This script inserts comprehensive test data for solo matching functionality
-- Based on the KOVARI application schema
-- ALTERNATIVE: Works with the existing trigger function

-- =====================================================
-- 1. INSERT USERS (Clerk Integration) - Let trigger handle profiles
-- =====================================================

INSERT INTO public.users (id, clerk_user_id, created_at) VALUES 
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
('550e8400-e29b-41d4-a716-446655440008', 'clerk_user_maria_008', NOW() - INTERVAL '1 day');

-- =====================================================
-- 2. UPDATE PROFILES (created by trigger) with complete data
-- =====================================================

UPDATE public.profiles SET 
    name = 'John Smith',
    age = 25,
    gender = 'male',
    nationality = 'Indian',
    bio = 'Adventure seeker and tech enthusiast. Love exploring new places and meeting people from different cultures.',
    languages = ARRAY['English', 'Hindi'],
    profile_photo = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    job = 'Software Engineer',
    verified = true,
    birthday = '1999-03-15',
    username = 'johnsmith',
    location = 'Mumbai',
    religion = 'hindu',
    smoking = 'No',
    drinking = 'Socially',
    personality = 'extrovert',
    food_prefrence = 'veg',
    number = '+91-9876543210',
    email = 'john.smith@email.com'
WHERE user_id = '550e8400-e29b-41d4-a716-446655440001';

UPDATE public.profiles SET 
    name = 'Sarah Johnson',
    age = 28,
    gender = 'female',
    nationality = 'Indian',
    bio = 'Creative designer who loves photography and cultural experiences. Always up for new adventures!',
    languages = ARRAY['English', 'Hindi', 'French'],
    profile_photo = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
    job = 'UI/UX Designer',
    verified = true,
    birthday = '1996-07-22',
    username = 'sarahjohnson',
    location = 'Delhi',
    religion = 'christian',
    smoking = 'No',
    drinking = 'Socially',
    personality = 'ambivert',
    food_prefrence = 'non-veg',
    number = '+91-9876543211',
    email = 'sarah.johnson@email.com'
WHERE user_id = '550e8400-e29b-41d4-a716-446655440002';

UPDATE public.profiles SET 
    name = 'Mike Wilson',
    age = 30,
    gender = 'male',
    nationality = 'Indian',
    bio = 'History teacher passionate about ancient cultures and quiet exploration. Prefer meaningful conversations over large groups.',
    languages = ARRAY['English', 'Hindi', 'Sanskrit'],
    profile_photo = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    job = 'History Teacher',
    verified = true,
    birthday = '1994-11-08',
    username = 'mikewilson',
    location = 'Bangalore',
    religion = 'hindu',
    smoking = 'No',
    drinking = 'No',
    personality = 'introvert',
    food_prefrence = 'veg',
    number = '+91-9876543212',
    email = 'mike.wilson@email.com'
WHERE user_id = '550e8400-e29b-41d4-a716-446655440003';

UPDATE public.profiles SET 
    name = 'Emma Davis',
    age = 26,
    gender = 'female',
    nationality = 'Indian',
    bio = 'Marketing professional who loves networking and discovering hidden gems in every city. Foodie and culture enthusiast!',
    languages = ARRAY['English', 'Hindi', 'Tamil'],
    profile_photo = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    job = 'Marketing Manager',
    verified = true,
    birthday = '1998-05-12',
    username = 'emmadavis',
    location = 'Chennai',
    religion = 'hindu',
    smoking = 'No',
    drinking = 'Socially',
    personality = 'extrovert',
    food_prefrence = 'non-veg',
    number = '+91-9876543213',
    email = 'emma.davis@email.com'
WHERE user_id = '550e8400-e29b-41d4-a716-446655440004';

UPDATE public.profiles SET 
    name = 'Alex Brown',
    age = 27,
    gender = 'male',
    nationality = 'Indian',
    bio = 'Full-stack developer with a passion for hiking and photography. Love both solo adventures and group activities.',
    languages = ARRAY['English', 'Hindi', 'Telugu'],
    profile_photo = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    job = 'Full-Stack Developer',
    verified = true,
    birthday = '1997-09-30',
    username = 'alexbrown',
    location = 'Hyderabad',
    religion = 'agnostic',
    smoking = 'No',
    drinking = 'Socially',
    personality = 'ambivert',
    food_prefrence = 'veg',
    number = '+91-9876543214',
    email = 'alex.brown@email.com'
WHERE user_id = '550e8400-e29b-41d4-a716-446655440005';

UPDATE public.profiles SET 
    name = 'Lisa Garcia',
    age = 29,
    gender = 'female',
    nationality = 'Indian',
    bio = 'Architect who finds beauty in both modern cities and ancient ruins. Prefer intimate travel experiences.',
    languages = ARRAY['English', 'Hindi', 'Marathi'],
    profile_photo = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    job = 'Architect',
    verified = true,
    birthday = '1995-12-03',
    username = 'lisagarcia',
    location = 'Pune',
    religion = 'christian',
    smoking = 'No',
    drinking = 'No',
    personality = 'introvert',
    food_prefrence = 'veg',
    number = '+91-9876543215',
    email = 'lisa.garcia@email.com'
WHERE user_id = '550e8400-e29b-41d4-a716-446655440006';

UPDATE public.profiles SET 
    name = 'David Lee',
    age = 24,
    gender = 'male',
    nationality = 'Indian',
    bio = 'Musician and music producer. Love exploring local music scenes and meeting fellow artists around the world.',
    languages = ARRAY['English', 'Hindi', 'Bengali'],
    profile_photo = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    job = 'Music Producer',
    verified = true,
    birthday = '2000-02-18',
    username = 'davidlee',
    location = 'Kolkata',
    religion = 'hindu',
    smoking = 'Yes',
    drinking = 'Yes',
    personality = 'extrovert',
    food_prefrence = 'non-veg',
    number = '+91-9876543216',
    email = 'david.lee@email.com'
WHERE user_id = '550e8400-e29b-41d4-a716-446655440007';

UPDATE public.profiles SET 
    name = 'Maria Rodriguez',
    age = 31,
    gender = 'female',
    nationality = 'Indian',
    bio = 'Medical professional with a love for wellness tourism and cultural medicine. Balance between adventure and relaxation.',
    languages = ARRAY['English', 'Hindi', 'Gujarati'],
    profile_photo = 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
    job = 'Medical Doctor',
    verified = true,
    birthday = '1993-08-25',
    username = 'mariarodriguez',
    location = 'Ahmedabad',
    religion = 'hindu',
    smoking = 'No',
    drinking = 'Socially',
    personality = 'ambivert',
    food_prefrence = 'veg',
    number = '+91-9876543217',
    email = 'maria.rodriguez@email.com'
WHERE user_id = '550e8400-e29b-41d4-a716-446655440008';

-- =====================================================
-- 3. INSERT TRAVEL PREFERENCES
-- =====================================================

INSERT INTO public.travel_preferences (id, user_id, destinations, interests, created_at) VALUES 
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
-- 4. INSERT USER FOLLOWS (Optional - for relationship testing)
-- =====================================================

INSERT INTO public.user_follows (follower_id, following_id, created_at) VALUES 
-- John follows Sarah and Emma
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '18 days'),

-- Sarah follows Mike and Alex
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', NOW() - INTERVAL '12 days'),

-- Mike follows Lisa and Maria
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440006', NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008', NOW() - INTERVAL '8 days'),

-- Emma follows David and John
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440007', NOW() - INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '5 days'),

-- Alex follows Sarah and Lisa
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '6 days'),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', NOW() - INTERVAL '4 days'),

-- Lisa follows Mike and Maria
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440008', NOW() - INTERVAL '2 days'),

-- David follows Emma and John
('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '1 day'),

-- Maria follows Lisa and Alex
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440006', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440005', NOW());

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check inserted data
SELECT 'Users inserted:' as info, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'Profiles inserted:', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'Travel preferences inserted:', COUNT(*) FROM public.travel_preferences
UNION ALL
SELECT 'User follows inserted:', COUNT(*) FROM public.user_follows;

-- Sample profile data
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
FROM public.profiles p
LEFT JOIN public.travel_preferences tp ON p.user_id = tp.user_id
ORDER BY p.created_at DESC
LIMIT 5;
