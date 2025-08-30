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
  try {
    const client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6380'
    });
    
    await client.connect();
    await client.ping();
    await client.disconnect();
    
    return true;
  } catch (error) {
    return false;
  }
}

// Check if test data exists
async function checkTestData() {
  try {
    const client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6380'
    });
    
    await client.connect();
    const keys = await client.keys('*');
    await client.disconnect();
    
    // Check if we have some test data (adjust this based on your data structure)
    return keys.length > 5; // Assuming you have more than 5 keys for test data
  } catch (error) {
    return false;
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
    logWarning('Please run: node setup-dev.js');
    logWarning('Or manually start Redis with: docker-compose up -d redis');
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
