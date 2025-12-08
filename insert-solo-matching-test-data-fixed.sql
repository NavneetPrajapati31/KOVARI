-- =====================================================
-- SOLO MATCHING TEST DATA INSERTION SCRIPT (FIXED)
-- =====================================================
-- This script inserts comprehensive test data for solo matching functionality
-- Based on the KOVARI application schema
-- FIXED: Handles the handle_new_user() trigger function issue

-- =====================================================
-- 1. TEMPORARILY DISABLE THE TRIGGER
-- =====================================================

-- Disable the trigger temporarily to avoid conflicts
ALTER TABLE public.users DISABLE TRIGGER on_new_user_created;

-- =====================================================
-- 2. INSERT USERS (Clerk Integration)
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
-- 3. INSERT PROFILES (with valid number field)
-- =====================================================

INSERT INTO public.profiles (
    id, user_id, name, age, gender, nationality, bio, languages, 
    profile_photo, job, verified, birthday, username, location, 
    religion, smoking, drinking, personality, food_prefrence, 
    number, email
) VALUES 
-- John - Extrovert, Mumbai, Software Engineer
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 
 'John Smith', 25, 'male', 'Indian', 'Adventure seeker and tech enthusiast. Love exploring new places and meeting people from different cultures.', 
 ARRAY['English', 'Hindi'], 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 
 'Software Engineer', true, '1999-03-15', 'johnsmith', 'Mumbai', 
 'hindu', 'No', 'Socially', 'extrovert', 'veg', 
 '+91-9876543210', 'john.smith@email.com'),

-- Sarah - Ambivert, Delhi, Designer
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 
 'Sarah Johnson', 28, 'female', 'Indian', 'Creative designer who loves photography and cultural experiences. Always up for new adventures!', 
 ARRAY['English', 'Hindi', 'French'], 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400', 
 'UI/UX Designer', true, '1996-07-22', 'sarahjohnson', 'Delhi', 
 'christian', 'No', 'Socially', 'ambivert', 'non-veg', 
 '+91-9876543211', 'sarah.johnson@email.com'),

-- Mike - Introvert, Bangalore, Teacher
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 
 'Mike Wilson', 30, 'male', 'Indian', 'History teacher passionate about ancient cultures and quiet exploration. Prefer meaningful conversations over large groups.', 
 ARRAY['English', 'Hindi', 'Sanskrit'], 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400', 
 'History Teacher', true, '1994-11-08', 'mikewilson', 'Bangalore', 
 'hindu', 'No', 'No', 'introvert', 'veg', 
 '+91-9876543212', 'mike.wilson@email.com'),

-- Emma - Extrovert, Chennai, Marketing Manager
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 
 'Emma Davis', 26, 'female', 'Indian', 'Marketing professional who loves networking and discovering hidden gems in every city. Foodie and culture enthusiast!', 
 ARRAY['English', 'Hindi', 'Tamil'], 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', 
 'Marketing Manager', true, '1998-05-12', 'emmadavis', 'Chennai', 
 'hindu', 'No', 'Socially', 'extrovert', 'non-veg', 
 '+91-9876543213', 'emma.davis@email.com'),

-- Alex - Ambivert, Hyderabad, Developer
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 
 'Alex Brown', 27, 'male', 'Indian', 'Full-stack developer with a passion for hiking and photography. Love both solo adventures and group activities.', 
 ARRAY['English', 'Hindi', 'Telugu'], 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 
 'Full-Stack Developer', true, '1997-09-30', 'alexbrown', 'Hyderabad', 
 'agnostic', 'No', 'Socially', 'ambivert', 'veg', 
 '+91-9876543214', 'alex.brown@email.com'),

-- Lisa - Introvert, Pune, Architect
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 
 'Lisa Garcia', 29, 'female', 'Indian', 'Architect who finds beauty in both modern cities and ancient ruins. Prefer intimate travel experiences.', 
 ARRAY['English', 'Hindi', 'Marathi'], 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', 
 'Architect', true, '1995-12-03', 'lisagarcia', 'Pune', 
 'christian', 'No', 'No', 'introvert', 'veg', 
 '+91-9876543215', 'lisa.garcia@email.com'),

-- David - Extrovert, Kolkata, Musician
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', 
 'David Lee', 24, 'male', 'Indian', 'Musician and music producer. Love exploring local music scenes and meeting fellow artists around the world.', 
 ARRAY['English', 'Hindi', 'Bengali'], 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 
 'Music Producer', true, '2000-02-18', 'davidlee', 'Kolkata', 
 'hindu', 'Yes', 'Yes', 'extrovert', 'non-veg', 
 '+91-9876543216', 'david.lee@email.com'),

-- Maria - Ambivert, Ahmedabad, Doctor
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', 
 'Maria Rodriguez', 31, 'female', 'Indian', 'Medical professional with a love for wellness tourism and cultural medicine. Balance between adventure and relaxation.', 
 ARRAY['English', 'Hindi', 'Gujarati'], 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400', 
 'Medical Doctor', true, '1993-08-25', 'mariarodriguez', 'Ahmedabad', 
 'hindu', 'No', 'Socially', 'ambivert', 'veg', 
 '+91-9876543217', 'maria.rodriguez@email.com');

-- =====================================================
-- 4. INSERT TRAVEL PREFERENCES
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
-- 5. INSERT USER FOLLOWS (Optional - for relationship testing)
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
-- 6. RE-ENABLE THE TRIGGER
-- =====================================================

-- Re-enable the trigger after data insertion
ALTER TABLE public.users ENABLE TRIGGER on_new_user_created;

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

-- =====================================================
-- NOTES FOR TESTING
-- =====================================================
/*
This script creates 8 test users with diverse characteristics:

PERSONALITY TYPES:
- Extrovert: John, Emma, David
- Ambivert: Sarah, Alex, Maria  
- Introvert: Mike, Lisa

LOCATIONS:
- Mumbai: John
- Delhi: Sarah
- Bangalore: Mike
- Chennai: Emma
- Hyderabad: Alex
- Pune: Lisa
- Kolkata: David
- Ahmedabad: Maria

RELIGIONS:
- Hindu: John, Mike, Emma, Lisa, David, Maria
- Christian: Sarah, Lisa
- Agnostic: Alex

LIFESTYLE:
- Smoking: Only David (Yes)
- Drinking: David (Yes), Others (Socially/No)

INTERESTS COVERAGE:
- Adventure: John, Alex
- Culture: Sarah, Mike, Lisa
- Food: Emma
- Nature: Alex
- Music: David
- Wellness: Maria
- Photography: John, Sarah, Alex
- History: Mike, Lisa
- Architecture: Lisa
- Entertainment: Emma, David

DESTINATIONS:
- Various Indian cities and tourist spots
- Mix of urban and nature destinations
- Different regions of India

To test solo matching:
1. Use any of the clerk_user_id values in your session creation
2. Test with different destinations from the travel preferences
3. Verify compatibility scoring works with real data
*/
