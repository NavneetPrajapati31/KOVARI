const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function testSoloMatchingFixes() {
    console.log('🔍 Testing Solo Matching Fixes\n');
    console.log('================================\n');

    // Test 1: Create sessions with overlapping dates (1-day minimum)
    console.log('1. Creating test sessions with overlapping dates...');
    
    const testSessions = [
        {
            userId: 'user_test_fix_1',
            destinationName: 'Mumbai',
            budget: 5000,
            startDate: '2024-03-15',
            endDate: '2024-03-20'
        },
        {
            userId: 'user_test_fix_2', 
            destinationName: 'Mumbai',
            budget: 6000,
            startDate: '2024-03-16', // 1-day overlap
            endDate: '2024-03-21'
        },
        {
            userId: 'user_test_fix_3',
            destinationName: 'Delhi',
            budget: 7000,
            startDate: '2024-03-15',
            endDate: '2024-03-20'
        }
    ];

    for (const session of testSessions) {
        try {
            const response = await fetch(`${BASE_URL}/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(session)
            });
            
            if (response.ok) {
                console.log(`✅ Session created for ${session.userId}`);
            } else {
                console.log(`❌ Failed to create session for ${session.userId}`);
            }
        } catch (error) {
            console.log(`❌ Error creating session for ${session.userId}:`, error.message);
        }
    }

    // Test 2: Test matching with the first user
    console.log('\n2. Testing solo matching for user_test_fix_1...');
    try {
        const matchResponse = await fetch(`${BASE_URL}/match-solo?userId=user_test_fix_1`);
        
        if (matchResponse.ok) {
            const matches = await matchResponse.json();
            console.log(`✅ Found ${matches.length} matches for user_test_fix_1`);
            
            if (matches.length > 0) {
                console.log('\n📊 Match Details:');
                matches.forEach((match, index) => {
                    console.log(`\n${index + 1}. Match with ${match.user.userId}`);
                    console.log(`   Score: ${(match.score * 100).toFixed(1)}%`);
                    console.log(`   Destination: ${match.destination}`);
                    console.log(`   Budget Difference: ${match.budgetDifference}`);
                    console.log(`   Breakdown:`);
                    console.log(`     - Destination: ${(match.breakdown.destinationScore * 100).toFixed(1)}%`);
                    console.log(`     - Date Overlap: ${(match.breakdown.dateOverlapScore * 100).toFixed(1)}%`);
                    console.log(`     - Budget: ${(match.breakdown.budgetScore * 100).toFixed(1)}%`);
                });
            } else {
                console.log('⚠️ No matches found (this might indicate an issue)');
            }
        } else {
            const errorText = await matchResponse.text();
            console.log('❌ Match request failed:', errorText);
        }
    } catch (error) {
        console.log('❌ Match request error:', error.message);
    }

    // Test 3: Test matching with different destination
    console.log('\n3. Testing solo matching for user_test_fix_3 (Delhi)...');
    try {
        const matchResponse = await fetch(`${BASE_URL}/match-solo?userId=user_test_fix_3`);
        
        if (matchResponse.ok) {
            const matches = await matchResponse.json();
            console.log(`✅ Found ${matches.length} matches for user_test_fix_3`);
            
            if (matches.length > 0) {
                console.log('\n📊 Match Details:');
                matches.forEach((match, index) => {
                    console.log(`\n${index + 1}. Match with ${match.user.userId}`);
                    console.log(`   Score: ${(match.score * 100).toFixed(1)}%`);
                    console.log(`   Destination: ${match.destination}`);
                });
            } else {
                console.log('ℹ️ No matches found (expected since different destination)');
            }
        } else {
            const errorText = await matchResponse.text();
            console.log('❌ Match request failed:', errorText);
        }
    } catch (error) {
        console.log('❌ Match request error:', error.message);
    }

    // Test 4: Test with no date overlap (should find 0 matches)
    console.log('\n4. Creating session with no date overlap...');
    try {
        const noOverlapSession = {
            userId: 'user_test_no_overlap',
            destinationName: 'Mumbai',
            budget: 5000,
            startDate: '2024-04-01', // Different month
            endDate: '2024-04-05'
        };

        const response = await fetch(`${BASE_URL}/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(noOverlapSession)
        });
        
        if (response.ok) {
            console.log('✅ Session created for user_test_no_overlap');
            
            // Test matching
            const matchResponse = await fetch(`${BASE_URL}/match-solo?userId=user_test_no_overlap`);
            if (matchResponse.ok) {
                const matches = await matchResponse.json();
                console.log(`✅ Found ${matches.length} matches for user_test_no_overlap`);
                
                if (matches.length === 0) {
                    console.log('✅ Correctly found 0 matches (no date overlap)');
                } else {
                    console.log('⚠️ Unexpected matches found despite no date overlap');
                }
            }
        } else {
            console.log('❌ Failed to create session for user_test_no_overlap');
        }
    } catch (error) {
        console.log('❌ Error in no-overlap test:', error.message);
    }

    console.log('\n================================');
    console.log('🎯 Solo Matching Fixes Test Complete!');
    console.log('\nExpected Results:');
    console.log('- User 1 should find matches with User 2 (same destination, 1-day overlap)');
    console.log('- User 3 should find fewer/no matches (different destination)');
    console.log('- User with no date overlap should find 0 matches');
}

testSoloMatchingFixes();
