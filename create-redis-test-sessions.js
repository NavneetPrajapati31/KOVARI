const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000/api';

// Test users with overlapping Mumbai trips in August 2025
const testUsers = [
    // User 1: Mumbai trip Aug 16-20 (overlaps with Aug 15-19)
    {
        userId: 'user_mumbai_1',
        destinationName: 'Mumbai',
        budget: 25000,
        startDate: '2025-08-21',
        endDate: '2025-08-25'
    },
    // User 2: Mumbai trip Aug 17-21 (overlaps with Aug 15-19)
    {
        userId: 'user_mumbai_2',
        destinationName: 'Mumbai',
        budget: 18000,
        startDate: '2025-08-21',
        endDate: '2025-08-29'
    },
    // User 3: Mumbai trip Aug 18-22 (overlaps with Aug 15-19)
    {
        userId: 'user_mumbai_3',
        destinationName: 'Mumbai',
        budget: 30000,
        startDate: '2025-08-21',
        endDate: '2025-08-29'
    },
    // User 4: Mumbai trip Aug 19-23 (overlaps with Aug 15-19)
    {
        userId: 'user_mumbai_4',
        destinationName: 'Mumbai',
        budget: 22000,
        startDate: '2025-08-24',
        endDate: '2025-08-29'
    },
    // User 5: Mumbai trip Aug 20-24 (overlaps with Aug 15-19)
    {
        userId: 'user_mumbai_5',
        destinationName: 'Mumbai',
        budget: 28000,
        startDate: '2025-08-20',
        endDate: '2025-08-24'
    }
];

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        if (options.body) {
            requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
        }

        const req = client.request(requestOptions, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        json: () => Promise.resolve(jsonData),
                        text: () => Promise.resolve(data)
                    });
                } catch (error) {
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        json: () => Promise.resolve({}),
                        text: () => Promise.resolve(data)
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

async function createSession(userData) {
    try {
        console.log(`🔍 Creating session for ${userData.userId}...`);
        
        const response = await makeRequest(`${BASE_URL}/session`, {
            method: 'POST',
            body: JSON.stringify({
                userId: userData.userId,
                destinationName: userData.destinationName,
                budget: userData.budget,
                startDate: userData.startDate,
                endDate: userData.endDate
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Session created for ${userData.userId}:`, result.message);
            return true;
        } else {
            const error = await response.text();
            console.log(`❌ Failed to create session for ${userData.userId}:`, error);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error creating session for ${userData.userId}:`, error.message);
        return false;
    }
}

async function checkRedisSessions() {
    try {
        console.log('\n🔍 Checking current Redis sessions...');
        const response = await makeRequest(`${BASE_URL}/redis/session`);
        
        if (response.ok) {
            const sessions = await response.json();
            console.log(`✅ Found ${sessions.length} active sessions in Redis`);
            sessions.forEach((session, index) => {
                console.log(`  ${index + 1}. ${session.userId} - ${session.destination?.name || 'Unknown'} (${session.startDate} to ${session.endDate})`);
            });
        } else {
            console.log('❌ Could not fetch Redis sessions');
        }
    } catch (error) {
        console.error('❌ Failed to check Redis sessions:', error.message);
    }
}

async function testMatching(userId) {
    try {
        console.log(`\n🔍 Testing matching for ${userId}...`);
        const response = await makeRequest(`${BASE_URL}/match-solo?userId=${userId}`);
        
        if (response.ok) {
            const matches = await response.json();
            console.log(`✅ Found ${matches.length} matches for ${userId}`);
            if (matches.length > 0) {
                matches.forEach((match, index) => {
                    console.log(`  Match ${index + 1}: ${match.userId} - ${match.destination?.name} (${match.startDate} to ${match.endDate})`);
                });
            }
        } else {
            const error = await response.text();
            console.log(`❌ Matching failed for ${userId}:`, error);
        }
    } catch (error) {
        console.error(`❌ Error testing matching for ${userId}:`, error.message);
    }
}

async function main() {
    console.log('🚀 Creating Test Redis Sessions for Solo Matching...\n');
    
    // Step 1: Check current Redis sessions
    await checkRedisSessions();
    
    // Step 2: Create test sessions
    console.log('\n📝 Creating test sessions...');
    let successCount = 0;
    for (const userData of testUsers) {
        const success = await createSession(userData);
        if (success) successCount++;
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n✅ Created ${successCount}/${testUsers.length} test sessions`);
    
    // Step 3: Check Redis sessions again
    await checkRedisSessions();
    
    // Step 4: Test matching for one user
    if (successCount > 0) {
        await testMatching('user_mumbai_1');
    }
    
    console.log('\n🎯 Test setup complete! Now try searching in your solo explore page.');
    console.log('Search for: Mumbai, Aug 15-19, ₹20,000');
    console.log('You should now see matches!');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testUsers, createSession, testMatching };
