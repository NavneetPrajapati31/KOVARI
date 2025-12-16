#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');
const redis = require('redis');

console.log('🚀 KOVARI Quick Start');
console.log('=====================\n');

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

// Check if Redis is running and accessible
async function checkRedis() {
  let client = null;
  try {
    // Check if REDIS_URL is set (cloud Redis)
    if (process.env.REDIS_URL) {
      logInfo('Using cloud Redis: ' + process.env.REDIS_URL.replace(/:[^@]*@/, ':***@'));
    } else {
      logWarning('No REDIS_URL found, falling back to local Redis');
    }
    
    client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6380'
    });
    
    // Handle error events to prevent unhandled errors
    client.on('error', (err) => {
      // Error events are handled here, but we'll also catch in the try-catch
      // This prevents unhandled error events from crashing the process
    });
    
    // Set a connection timeout
    const connectPromise = client.connect();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000);
    });
    
    await Promise.race([connectPromise, timeoutPromise]);
    await client.ping();
    
    return true;
  } catch (error) {
    logError('Redis connection failed: ' + error.message);
    if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
      logWarning('The Redis server closed the connection or is not accessible');
      logWarning('This could mean:');
      logWarning('  - The Redis server is down');
      logWarning('  - Network connectivity issues');
      logWarning('  - Incorrect REDIS_URL configuration');
      logWarning('  - Firewall blocking the connection');
    }
    return false;
  } finally {
    // Always try to disconnect, even if connection failed
    if (client) {
      try {
        if (client.isOpen) {
          await client.disconnect();
        }
      } catch (disconnectError) {
        // Ignore disconnect errors
      }
    }
  }
}

// Check if test data exists
async function checkTestData() {
  let client = null;
  try {
    client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6380'
    });
    
    // Handle error events
    client.on('error', () => {
      // Error events handled silently for this check
    });
    
    await client.connect();
    const keys = await client.keys('*');
    
    // Check if we have some test data (adjust this based on your data structure)
    return keys.length > 5; // Assuming you have more than 5 keys for test data
  } catch (error) {
    return false;
  } finally {
    if (client) {
      try {
        if (client.isOpen) {
          await client.disconnect();
        }
      } catch (disconnectError) {
        // Ignore disconnect errors
      }
    }
  }
}

// Create test data
function createTestData() {
  try {
    logInfo('Creating test data...');
    execSync('node create-simple-test-data.js', { stdio: 'inherit' });
    logSuccess('Test data created successfully!');
    return true;
  } catch (error) {
    logError('Failed to create test data');
    return false;
  }
}

// Main function
async function main() {
  logInfo('Checking Redis connection...');
  
  if (!(await checkRedis())) {
    logError('Redis is not accessible!');
    if (process.env.REDIS_URL) {
      logWarning('Cloud Redis connection failed. Please check your REDIS_URL in .env.local');
      logWarning('Make sure your cloud Redis instance is running and accessible');
    } else {
      logWarning('No REDIS_URL found. Please either:');
      logWarning('1. Set up cloud Redis and add REDIS_URL to .env.local');
      logWarning('2. Or run: node setup-dev.js for local Redis');
      logWarning('3. Or manually start Redis with: docker-compose up -d redis');
    }
    process.exit(1);
  }
  
  logSuccess('Redis is running and accessible!');
  
  logInfo('Checking test data...');
  
  if (!(await checkTestData())) {
    logWarning('No test data found. Creating test data...');
    if (createTestData()) {
      logSuccess('Ready to go! Run: npm run dev');
    } else {
      logError('Failed to create test data. Please run manually: node create-redis-test-sessions.js');
    }
  } else {
    logSuccess('Test data found! Ready to go!');
    logInfo('You can now run: npm run dev');
  }
}

// Run main function
main().catch(error => {
  logError('Unexpected error:');
  logError(error.message);
  process.exit(1);
});
