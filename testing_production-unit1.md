================================================================================
PRODUCTION ALGORITHM UNIT TESTS
================================================================================


TEST: TEST SUITE 1: Destination Scoring
✓ Same location (0km): 1.000 ≈ 1.000
✓ Within 150km (~118km): 0.750 ≈ 0.750
✓ Beyond 200km (~465km): 0.000 ≈ 0.000
✓ Far beyond 200km (~1400km): 0.000 ≈ 0.000
✓ Missing destination 1: 0.300 ≈ 0.300
✓ Missing destination 2: 0.300 ≈ 0.300
✓ Both destinations missing: 0.300 ≈ 0.300

TEST: TEST SUITE 2: Date Overlap Scoring
✓ 1-day overlap (1/5 days = 20%): 0.600 ≈ 0.600
✓ No overlap (0 days): 0.000 ≈ 0.000
✓ 50% overlap (5/10 days): 0.900 ≈ 0.900
✓ 100% overlap (identical dates): 1.000 ≈ 1.000
✓ 90% overlap (9/10 days): 1.000 ≈ 1.000
✓ 20% overlap (2/10 days): 0.600 ≈ 0.600
✓ Invalid date format: 0.000 ≈ 0.000

TEST: TEST SUITE 3: Budget Scoring
✓ Identical budgets (0% diff): 1.000 ≈ 1.000
✓ 5% difference: 1.000 ≈ 1.000
✓ 10% difference (boundary): 1.000 ≈ 1.000
✓ 20% difference: 0.800 ≈ 0.800
✓ 25% difference (boundary): 0.800 ≈ 0.800
✓ 50% difference (boundary): 0.600 ≈ 0.600
✓ 100% difference: 0.600 ≈ 0.600
✓ 200% difference: 0.400 ≈ 0.400
✓ Beyond 200% difference: 0.400 ≈ 0.400
✓ Both budgets zero: 1.000 ≈ 1.000
✓ Extreme difference (100x): 0.400 ≈ 0.400

TEST: TEST SUITE 4: Interests Scoring (Jaccard Similarity)
✓ Identical interests (100% overlap): 1.000 ≈ 1.000
✓ No common interests (0% overlap): PASS
✓ Partial overlap (1/5 Jaccard + bonus): PASS
✓ Empty interest array (fallback): 0.300 ≈ 0.300
✓ Both arrays empty (fallback to neutral): 0.300 ≈ 0.300

TEST: TEST SUITE 5: Age Scoring
✓ Same age (0 years diff): 1.000 ≈ 1.000
✓ 2 years difference (boundary): 1.000 ≈ 1.000
✓ 5 years difference (boundary): 0.900 ≈ 0.900
✓ 10 years difference (boundary): 0.700 ≈ 0.700
✓ 15 years difference (boundary): 0.500 ≈ 0.500
✓ 25 years difference (boundary): 0.300 ≈ 0.300
✓ 40 years difference (boundary): 0.100 ≈ 0.100
✓ Beyond 40 years difference: 0.050 ≈ 0.050
✓ Both ages zero: 1.000 ≈ 1.000

TEST: TEST SUITE 6: Personality Compatibility
✓ Introvert + Introvert: 1.000 ≈ 1.000
✓ Introvert + Ambivert: 0.700 ≈ 0.700
✓ Introvert + Extrovert: 0.400 ≈ 0.400
✓ Ambivert + Ambivert: 1.000 ≈ 1.000
✓ Ambivert + Extrovert: 0.700 ≈ 0.700
✓ Extrovert + Extrovert: 1.000 ≈ 1.000
✓ Missing personality 1: 0.500 ≈ 0.500
✓ Missing personality 2: 0.500 ≈ 0.500
✓ Unknown personality type: 0.000 ≈ 0.000

TEST: TEST SUITE 7: Location Origin Scoring
✓ Same city (0km): 1.000 ≈ 1.000
✓ Same metro (~30km): 0.800 ≈ 0.800
✓ Same state (~280km): 0.400 ≈ 0.400
✓ Different regions (~1400km): 0.100 ≈ 0.100
✓ Missing location 1: 0.500 ≈ 0.500
✓ Missing location 2: 0.500 ≈ 0.500

TEST: TEST SUITE 8: Lifestyle Scoring
✓ Perfect lifestyle match (both non-smoker, non-drinker): 1.000 ≈ 1.000
✓ Perfect lifestyle match (both smoker, drinker): 1.000 ≈ 1.000
✓ Complete lifestyle mismatch: 0.000 ≈ 0.000
✓ Partial lifestyle match (1/2 match): 0.500 ≈ 0.500

TEST: TEST SUITE 9: Religion Scoring
✓ Same religion: 1.000 ≈ 1.000
✓ Different religions: 0.000 ≈ 0.000
✓ Religion + Agnostic: 0.500 ≈ 0.500
✓ Both neutral: 0.500 ≈ 0.500
✓ Missing religion: 0.500 ≈ 0.500

TEST: TEST SUITE 10: Hard Filters (Critical Compatibility Checks)
✓ Should match: within 200km + date overlap: PASS
✓ Should NOT match: beyond 200km: PASS
✓ Should NOT match: traveling to own city: PASS
✓ Should NOT match: no date overlap: PASS
✓ Should NOT match: missing destination: PASS

TEST: TEST SUITE 11: Edge Cases & Boundary Conditions
✓ Invalid coordinates return Infinity: PASS
✓ Extreme budget difference (1000x): 0.400 ≈ 0.400
✓ Single-day trip with perfect overlap: 1.000 ≈ 1.000
ℹ Distance test: ~200km = 265.65km
✓ 1-day overlap should pass (boundary condition): PASS
✓ Less than 1-day overlap should fail: PASS

TEST: TEST SUITE 12: Weight Distribution Validation
✓ Total weights should equal 1.0: 1.000 ≈ 1.000
ℹ Weight distribution:
ℹ   destination: 25.0%
ℹ   dateOverlap: 20.0%
ℹ   budget: 20.0%
ℹ   interests: 10.0%
ℹ   age: 10.0%
ℹ   personality: 5.0%
ℹ   locationOrigin: 5.0%
ℹ   lifestyle: 3.0%
ℹ   religion: 2.0%

================================================================================
TEST SUMMARY
================================================================================
✓ Passed: 74
✗ Failed: 0
Total Tests: 74

Pass Rate: 100.0%

🎉 ALL TESTS PASSED! Algorithm is production-ready.