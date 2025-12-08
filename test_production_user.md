[dotenv@17.2.1] injecting env (29) from .env.local -- tip: ⚙️  enable debug logging with { debug: true }
================================================================================
PRODUCTION E2E TESTS - 35 DIVERSE USER PROFILES
================================================================================

ℹ Total test users: 35
ℹ Destinations covered: Mumbai, Pune, Goa, Delhi, Bangalore, Jaipur, Manali
ℹ Budget range: ₹5,000 - ₹50,000
ℹ Age range: 22 - 40 years

ℹ Connecting to Redis...
ℹ Redis connected ✓


TEST: TEST SUITE 1: Create Sessions for 35 Users
✓ Created 35/35 sessions

TEST: TEST SUITE 2: Mumbai Group Matching (8 users)
ℹ Testing 11 Mumbai users...
ℹ User 001 (Rahul) matches with 10 Mumbai users:
ℹ   → Priya (0.0km, 4 days overlap)
ℹ   → Amit (0.0km, 4 days overlap)
ℹ   → Sneha (0.0km, 2 days overlap)
ℹ   → Vikram (0.0km, 5 days overlap)
ℹ   → Anjali (0.0km, 3 days overlap)
ℹ   → Karan (0.0km, 5 days overlap)
ℹ   → Divya (0.0km, 1 days overlap)
ℹ   → Budget Traveler (0.0km, 3 days overlap)
ℹ   → Luxury Traveler (0.0km, 6 days overlap)
ℹ   → Short Trip (0.0km, 1 days overlap)
✓ User 001 has 10 matches (expected ≥3)

TEST: TEST SUITE 3: Pune-Mumbai Cross Matching (~118km)
ℹ User 009 (Pune) matches with 10 Mumbai users (distance ~118km)
✓ Pune-Mumbai cross-matching works (got 10 matches)

TEST: TEST SUITE 4: Goa Isolation Test (~465km from Mumbai)
✓ Goa users correctly isolated (0 invalid matches)

TEST: TEST SUITE 5: Budget Diversity Testing
ℹ Budget Traveler (₹5k): 7 matches
ℹ Mid-range (₹15k): 10 matches
ℹ Luxury (₹50k): 10 matches
✓ Budget diversity test completed

TEST: TEST SUITE 6: Date Overlap Variations
ℹ User 035 (1-day trip) has 5 matches with ≥1 day overlap
✓ 1-day trip can still find matches

TEST: TEST SUITE 7: Geographic Cluster Analysis
ℹ Geographic distribution:
ℹ   Mumbai: 11 users
ℹ   Pune: 4 users
ℹ   Goa: 5 users
ℹ   Delhi: 5 users
ℹ   Bangalore: 5 users
ℹ   Jaipur: 4 users
ℹ   Others: 1 users
✓ Mumbai cluster has 11 users
✓ Goa cluster has 5 users

TEST: TEST SUITE 8: Demographic Diversity
ℹ Age distribution:
ℹ   20-25: 6 users
ℹ   26-30: 21 users
ℹ   31-35: 7 users
ℹ   36+: 1 users
ℹ Gender distribution:
ℹ   male: 20 users
ℹ   female: 15 users
ℹ Personality distribution:
ℹ   introvert: 9 users
ℹ   ambivert: 13 users
ℹ   extrovert: 13 users
✓ Demographic diversity validated
ℹ 
Cleaning up test sessions...
ℹ Deleted 35 test sessions

================================================================================
TEST SUMMARY
================================================================================
✓ Passed: 9
✗ Failed: 0
Total Tests: 9
Total Users Tested: 35

Pass Rate: 100.0%

🎉 ALL E2E TESTS PASSED with 35 users!