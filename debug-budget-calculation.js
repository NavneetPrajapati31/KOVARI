const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function debugBudgetCalculation() {
    console.log('🔍 Debugging Budget Calculation...\n');
    
    // Step 1: Create a session with 20k budget (user's search) using existing user ID
    console.log('1. Creating session with 20k budget...');
    try {
        const sessionResponse = await fetch(`${BASE_URL}/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'user_2yjEnOfpwIeQxWnR9fEvS7sRUrX',
                destinationName: 'Mumbai',
                budget: 20000,
                startDate: '2025-08-04',
                endDate: '2025-08-11'
            })
        });
        
        console.log(`Session creation status: ${sessionResponse.status}`);
        const sessionResult = await sessionResponse.json();
        console.log('Session result:', sessionResult);
        
    } catch (error) {
        console.error('Session creation failed:', error.message);
        return;
    }
    
    // Step 2: Create a few test sessions with different budgets
    console.log('\n2. Creating test sessions with different budgets...');
    const testSessions = [
        {
            userId: 'user_10k_budget',
            destinationName: 'Mumbai',
            budget: 10000,
            startDate: '2025-08-05',
            endDate: '2025-08-10'
        },
        {
            userId: 'user_15k_budget',
            destinationName: 'Mumbai',
            budget: 15000,
            startDate: '2025-08-05',
            endDate: '2025-08-10'
        },
        {
            userId: 'user_25k_budget',
            destinationName: 'Mumbai',
            budget: 25000,
            startDate: '2025-08-05',
            endDate: '2025-08-10'
        }
    ];
    
    for (const session of testSessions) {
        try {
            const response = await fetch(`${BASE_URL}/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(session)
            });
            
            console.log(`✅ Created session for ${session.userId}: ${session.budget} budget`);
        } catch (error) {
            console.error(`❌ Failed to create session for ${session.userId}:`, error.message);
        }
    }
    
    // Step 3: Test matching and check budget calculations
    console.log('\n3. Testing matching with budget calculations...');
    try {
        const matchResponse = await fetch(`${BASE_URL}/match-solo?userId=user_2yjEnOfpwIeQxWnR9fEvS7sRUrX`);
        console.log(`Match request status: ${matchResponse.status}`);
        
        if (matchResponse.ok) {
            const matches = await matchResponse.json();
            console.log(`✅ Found ${matches.length} matches`);
            
            if (matches.length > 0) {
                console.log('\n📊 Budget Calculation Details:');
                matches.forEach((match, index) => {
                    console.log(`\n${index + 1}. Match with ${match.user.userId}`);
                    console.log(`   User Budget: ${match.user.budget}`);
                    console.log(`   Budget Difference: ${match.budgetDifference}`);
                    console.log(`   Score: ${(match.score * 100).toFixed(1)}%`);
                    
                    // Manual calculation verification
                    const userBudget = 20000;
                    const matchBudget = match.user.budget;
                    const calculatedDiff = matchBudget - userBudget;
                    console.log(`   Manual calculation: ${matchBudget} - ${userBudget} = ${calculatedDiff}`);
                });
            } else {
                console.log('❌ No matches found');
            }
        } else {
            const error = await matchResponse.text();
            console.log('❌ Matching failed:', error);
        }
    } catch (error) {
        console.error('❌ Matching error:', error.message);
    }
}

debugBudgetCalculation().catch(console.error); 