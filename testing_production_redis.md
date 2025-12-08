[dotenv@17.2.1] injecting env (29) from .env.local -- tip: ⚙️  write to custom object with { processEnv: myObject }
================================================================================
PRODUCTION REDIS INTEGRATION TESTS
================================================================================

ℹ Connecting to Redis...
ℹ Redis connected successfully ✓


TEST: TEST SUITE 1: Redis Connection & Health
✓ Redis PING successful: PASS
✓ Basic SET/GET works: PASS
ℹ Redis connection healthy ✓

TEST: TEST SUITE 2: Session Creation & Storage
ℹ Cleaned up 4 existing test sessions
✓ Created session for prod_test_user_1
✓ Created session for prod_test_user_2
✓ Created session for prod_test_user_3
✓ Created session for prod_test_user_4
✓ Created session for prod_test_user_5
✓ All 5 sessions created: PASS

TEST: TEST SUITE 3: Session Retrieval & Validation
✓ Session exists for prod_test_user_1: PASS
✓ User ID matches for prod_test_user_1: PASS
✓ Destination exists for prod_test_user_1: PASS
✓ Static attributes exist for prod_test_user_1: PASS
✓ TTL is valid for prod_test_user_1 (86399s): PASS
✓ Session exists for prod_test_user_2: PASS
✓ User ID matches for prod_test_user_2: PASS
✓ Destination exists for prod_test_user_2: PASS
✓ Static attributes exist for prod_test_user_2: PASS
✓ TTL is valid for prod_test_user_2 (86399s): PASS
✓ Session exists for prod_test_user_3: PASS
✓ User ID matches for prod_test_user_3: PASS
✓ Destination exists for prod_test_user_3: PASS
✓ Static attributes exist for prod_test_user_3: PASS
✓ TTL is valid for prod_test_user_3 (86399s): PASS
✓ Session exists for prod_test_user_4: PASS
✓ User ID matches for prod_test_user_4: PASS
✓ Destination exists for prod_test_user_4: PASS
✓ Static attributes exist for prod_test_user_4: PASS
✓ TTL is valid for prod_test_user_4 (86399s): PASS
✓ Session exists for prod_test_user_5: PASS
✓ User ID matches for prod_test_user_5: PASS
✓ Destination exists for prod_test_user_5: PASS
✓ Static attributes exist for prod_test_user_5: PASS
✓ TTL is valid for prod_test_user_5 (86399s): PASS

TEST: TEST SUITE 4: Matching Logic with Real Redis Data
ℹ ✓ Match found: prod_test_user_2 (distance: 0.0km, overlap: 5 days)
ℹ ✓ Match found: prod_test_user_5 (distance: 120.2km, overlap: 6 days)
✓ User 1 has 2 matches within 200km: PASS
✓ User 1 has 2 matches with date overlap: PASS
✓ User 3 (Goa) has no matches beyond 200km (expected 0, got 0): PASS

TEST: TEST SUITE 5: Session Expiry & Cleanup
✓ Short-lived session created: PASS
ℹ Waiting 3 seconds for session to expire...
✓ Session expired correctly: PASS
ℹ 
Cleaning up test sessions...
ℹ Deleted 5 test sessions

================================================================================
TEST SUMMARY
================================================================================
✓ Passed: 38
✗ Failed: 0
Total Tests: 38

Pass Rate: 100.0%

🎉 ALL INTEGRATION TESTS PASSED! Redis is production-ready.