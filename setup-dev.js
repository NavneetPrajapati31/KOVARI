#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 KOVARI Development Environment Setup');
console.log('=====================================\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step) {
  log(`\n${step}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Check if Docker is running
function checkDocker() {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if Docker Compose is available
function checkDockerCompose() {
  try {
    execSync('docker-compose --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Start Redis container
function startRedis() {
  logStep('Starting Redis container...');
  
  try {
    // Stop any existing container
    try {
      execSync('docker stop kovari-redis', { stdio: 'ignore' });
      execSync('docker rm kovari-redis', { stdio: 'ignore' });
    } catch (e) {
      // Container doesn't exist, that's fine
    }
    
    // Also stop any containers using port 6379
    try {
      execSync('docker stop $(docker ps -q --filter "publish=6379")', { stdio: 'ignore' });
    } catch (e) {
      // No containers using that port
    }
    
    // Start Redis using docker-compose
    execSync('docker-compose up -d redis', { stdio: 'inherit' });
    
    // Wait a bit for Redis to be ready
    logInfo('Waiting for Redis to be ready...');
    setTimeout(() => {
      logSuccess('Redis container started successfully!');
      createTestData();
    }, 3000);
    
  } catch (error) {
    logError('Failed to start Redis container');
    logError(error.message);
    process.exit(1);
  }
}

// Create test data
function createTestData() {
  logStep('Creating test data...');
  
  try {
    // Check if the test data script exists
    const testDataScript = path.join(__dirname, 'create-redis-test-sessions.js');
    if (!fs.existsSync(testDataScript)) {
      logWarning('Test data script not found, skipping test data creation');
      logSuccess('Setup completed! You can now run: npm run dev');
      return;
    }
    
    // Run the test data creation script
    logInfo('Running test data creation script...');
    execSync('node create-redis-test-sessions.js', { stdio: 'inherit' });
    
    logSuccess('Test data created successfully!');
    logSuccess('Setup completed! You can now run: npm run dev');
    
  } catch (error) {
    logError('Failed to create test data');
    logError(error.message);
    logWarning('Setup partially completed. You can manually run: node create-redis-test-sessions.js');
  }
}

// Main setup function
function main() {
  logStep('Checking prerequisites...');
  
  // Check Docker
  if (!checkDocker()) {
    logError('Docker is not running or not installed!');
    logError('Please start Docker Desktop and try again.');
    process.exit(1);
  }
  logSuccess('Docker is running');
  
  // Check Docker Compose
  if (!checkDockerCompose()) {
    logError('Docker Compose is not available!');
    logError('Please install Docker Compose and try again.');
    process.exit(1);
  }
  logSuccess('Docker Compose is available');
  
  // Start Redis
  startRedis();
}

// Handle process termination
process.on('SIGINT', () => {
  logWarning('\nSetup interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logWarning('\nSetup terminated');
  process.exit(0);
});

// Run setup
main();
