#!/usr/bin/env node

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000/api';

// Helper function to get future dates relative to today
function getFutureDate(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
}

// Helper function to get date range
function getDateRange(startDaysFromNow, durationDays) {
    const startDate = getFutureDate(startDaysFromNow);
    const endDate = getFutureDate(startDaysFromNow + durationDays);
    return { startDate, endDate };
}

// Generate test users with overlapping trips in the future
function generateTestUsers() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    
    // Calculate next month and year
    let nextMonth = currentMonth + 1;
    let nextYear = currentYear;
    if (nextMonth > 12) {
        nextMonth = 1;
        nextYear++;
    }
    
    // Format month with leading zero
    const formatMonth = (month) => month.toString().padStart(2, '0');
    
    const testUsers = [
        // Mumbai trips with overlapping dates
        {
            userId: 'user_mumbai_1',
            destinationName: 'Mumbai',
            budget: 25000,
            ...getDateRange(30, 5) // 30 days from now, 5 day trip
        },
        {
            userId: 'user_mumbai_2',
            destinationName: 'Mumbai',
            budget: 18000,
            ...getDateRange(33, 7) // 33 days from now, 7 day trip (overlaps)
        },
        {
            userId: 'user_mumbai_3',
            destinationName: 'Mumbai',
            budget: 30000,
            ...getDateRange(35, 8) // 35 days from now, 8 day trip (overlaps)
        },
        {
            userId: 'user_mumbai_4',
            destinationName: 'Mumbai',
            budget: 22000,
            ...getDateRange(37, 8) // 37 days from now, 8 day trip (overlaps)
        },
        {
            userId: 'user_mumbai_5',
            destinationName: 'Mumbai',
            budget: 28000,
            ...getDateRange(40, 6) // 40 days from now, 6 day trip (overlaps)
        },
        
        // Different destinations for variety
        {
            userId: 'user_goa_1',
            destinationName: 'Goa',
            budget: 35000,
            ...getDateRange(45, 5) // 45 days from now, 5 day trip
        },
        {
            userId: 'user_delhi_1',
            destinationName: 'Delhi',
            budget: 20000,
            ...getDateRange(50, 7) // 50 days from now, 7 day trip
        },
        {
            userId: 'user_bangalore_1',
            destinationName: 'Bangalore',
            budget: 15000,
            ...getDateRange(55, 7) // 55 days from now, 7 day trip
        },
        {
            userId: 'user_chennai_1',
            destinationName: 'Chennai',
            budget: 18000,
            ...getDateRange(60, 6) // 60 days from now, 6 day trip
        },
        {
            userId: 'user_hyderabad_1',
            destinationName: 'Hyderabad',
            budget: 22000,
            ...getDateRange(65, 5) // 65 days from now, 5 day trip
        }
    ];
    
    return testUsers;
}

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

// Create test sessions
async function createTestSessions() {
    const testUsers = generateTestUsers();
    
    console.log('🚀 Creating fresh test data with future dates...\n');
    
    // Display the generated test data
    console.log('📅 Generated Test Data:');
    console.log('========================');
    testUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.userId}: ${user.destinationName}`);
        console.log(`   📍 Destination: ${user.destinationName}`);
        console.log(`   💰 Budget: ₹${user.budget.toLocaleString()}`);
        console.log(`   📅 Dates: ${user.startDate} to ${user.endDate}`);
        console.log(`   🕐 Trip Length: ${Math.ceil((new Date(user.endDate) - new Date(user.startDate)) / (1000 * 60 * 60 * 24))} days`);
        console.log('');
    });
    
    console.log('🎯 Search Suggestions:');
    console.log('=====================');
    console.log('• Search for "Mumbai" with dates around:', getFutureDate(33), 'to', getFutureDate(40));
    console.log('• Search for "Goa" with dates around:', getFutureDate(45), 'to', getFutureDate(50));
    console.log('• Search for "Delhi" with dates around:', getFutureDate(50), 'to', getFutureDate(57));
    console.log('');
    
    try {
        // Create sessions for each test user
        for (const user of testUsers) {
            const sessionData = {
                userId: user.userId,
                destinationName: user.destinationName,
                budget: user.budget,
                startDate: user.startDate,
                endDate: user.endDate,
                isSoloMatch: true
            };
            
            console.log(`Creating session for ${user.userId}...`);
            
            const response = await makeRequest(`${BASE_URL}/sessions`, {
                method: 'POST',
                body: JSON.stringify(sessionData)
            });
            
            if (response.ok) {
                console.log(`✅ Session created for ${user.userId}`);
            } else {
                console.log(`❌ Failed to create session for ${user.userId}: ${response.status}`);
            }
        }
        
        console.log('\n🎉 Test data creation completed!');
        console.log('You can now search for these destinations with the suggested dates.');
        
    } catch (error) {
        console.error('❌ Error creating test sessions:', error.message);
        console.log('\n💡 Make sure your development server is running on localhost:3000');
    }
}

// Run the script
if (require.main === module) {
    createTestSessions().catch(console.error);
}

module.exports = { generateTestUsers, createTestSessions };
