#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const redis = require('redis');

console.log('🧪 Testing Cloud Redis Connection');
console.log('==================================\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function testCloudRedis() {
  try {
    // Check if REDIS_URL is set
    if (!process.env.REDIS_URL) {
      logError('REDIS_URL not found in environment variables');
      logWarning('Please create a .env.local file with your cloud Redis URL');
      logWarning('Example: REDIS_URL=rediss://default:password@instance.render.com:6379');
      process.exit(1);
    }

    logInfo('REDIS_URL: ' + process.env.REDIS_URL.replace(/:[^@]*@/, ':***@'));
    
    // Create Redis client
    const client = redis.createClient({
      url: process.env.REDIS_URL
    });

    // Connect to Redis
    logInfo('Connecting to cloud Redis...');
    await client.connect();
    logSuccess('Connected successfully!');

    // Test ping
    logInfo('Testing ping...');
    const pong = await client.ping();
    logSuccess(`Ping response: ${pong}`);

    // Test basic operations
    logInfo('Testing basic operations...');
    await client.set('test_key', 'test_value');
    const value = await client.get('test_key');
    await client.del('test_key');
    
    if (value === 'test_value') {
      logSuccess('Basic operations working correctly!');
    } else {
      logError('Basic operations failed!');
    }

    // Test keys command
    logInfo('Testing keys command...');
    const keys = await client.keys('*');
    logSuccess(`Found ${keys.length} keys in Redis`);

    // Disconnect
    await client.disconnect();
    logSuccess('Disconnected successfully!');
    
    logSuccess('\n🎉 Cloud Redis is working perfectly!');
    logInfo('You can now run: npm run dev');
    
  } catch (error) {
    logError('Cloud Redis test failed:');
    logError(error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      logWarning('Connection refused. Check if your Redis instance is running.');
    } else if (error.message.includes('ENOTFOUND')) {
      logWarning('Host not found. Check your Redis URL.');
    } else if (error.message.includes('authentication')) {
      logWarning('Authentication failed. Check your password.');
    }
    
    process.exit(1);
  }
}

// Run the test
testCloudRedis();
