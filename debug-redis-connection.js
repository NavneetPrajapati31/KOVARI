#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const redis = require('redis');

console.log('🔍 Redis Connection Debug');
console.log('========================\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
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

function logDebug(message) {
  log(`🔍 ${message}`, 'cyan');
}

async function debugRedisConnection() {
  try {
    // Check environment variables
    logDebug('Checking environment variables...');
    logInfo(`REDIS_URL: ${process.env.REDIS_URL ? 'Set' : 'Not set'}`);
    
    if (!process.env.REDIS_URL) {
      logError('REDIS_URL not found in .env.local');
      logWarning('Please add REDIS_URL to your .env.local file');
      return;
    }

    // Parse and display URL info (safely)
    const url = process.env.REDIS_URL;
    const urlObj = new URL(url);
    
    logDebug('URL Analysis:');
    logInfo(`Protocol: ${urlObj.protocol}`);
    logInfo(`Hostname: ${urlObj.hostname}`);
    logInfo(`Port: ${urlObj.port}`);
    logInfo(`Username: ${urlObj.username}`);
    logInfo(`Password: ${urlObj.password ? '***' + urlObj.password.slice(-3) : 'Not set'}`);

    // Check if it's a Render URL
    if (urlObj.hostname.includes('render.com')) {
      logInfo('✅ Detected Render.com Redis URL');
      logWarning('Make sure your IP is in the allowlist!');
    }

    // Test connection with detailed error handling
    logDebug('Testing connection...');
    const client = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 10000,
        lazyConnect: true
      }
    });

    // Add event listeners for better debugging
    client.on('error', (err) => {
      logError(`Redis Error: ${err.message}`);
      
      if (err.message.includes('allowlist')) {
        logWarning('🔒 IP NOT ALLOWED - Add your IP to Redis allowlist');
        logInfo('1. Go to Render.com dashboard');
        logInfo('2. Find your Redis service');
        logInfo('3. Go to Settings/Security');
        logInfo('4. Add your current IP to allowlist');
        logInfo('5. Get your IP: curl ifconfig.me');
      } else if (err.message.includes('ENOTFOUND')) {
        logWarning('🌐 HOST NOT FOUND - Check your Redis URL');
      } else if (err.message.includes('authentication')) {
        logWarning('🔑 AUTH FAILED - Check your password');
      } else if (err.message.includes('ECONNREFUSED')) {
        logWarning('🚫 CONNECTION REFUSED - Redis might be down');
      }
    });

    client.on('connect', () => {
      logSuccess('Connected to Redis!');
    });

    // Attempt connection
    await client.connect();
    
    // Test ping
    const pong = await client.ping();
    logSuccess(`Ping successful: ${pong}`);
    
    // Test basic operations
    await client.set('debug_test', 'working');
    const value = await client.get('debug_test');
    await client.del('debug_test');
    
    if (value === 'working') {
      logSuccess('Basic operations working!');
    }
    
    await client.disconnect();
    logSuccess('🎉 Redis is working perfectly!');
    
  } catch (error) {
    logError('Debug failed:');
    logError(error.message);
    
    // Provide specific help based on error
    if (error.message.includes('allowlist')) {
      logWarning('\n🔧 SOLUTION: Add your IP to allowlist');
      logInfo('Run: curl ifconfig.me (to get your IP)');
      logInfo('Then add it to Render Redis allowlist');
    }
  }
}

// Run debug
debugRedisConnection();
