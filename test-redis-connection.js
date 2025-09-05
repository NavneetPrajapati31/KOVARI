#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const redis = require('redis');

console.log('🔍 Testing Redis Connection...\n');

// Check environment variable
console.log('Environment Check:');
console.log('REDIS_URL:', process.env.REDIS_URL ? '✅ Set' : '❌ Not set');
if (process.env.REDIS_URL) {
  console.log('URL format check:');
  console.log('  - Starts with redis://:', process.env.REDIS_URL.startsWith('redis://') ? '✅ Yes' : '❌ No');
  console.log('  - Contains hostname:', process.env.REDIS_URL.includes('red-') ? '✅ Yes' : '❌ No');
  console.log('  - Contains port:', process.env.REDIS_URL.includes(':6379') ? '✅ Yes' : '❌ No');
  
  // Show URL format (hide password for security)
  const maskedUrl = process.env.REDIS_URL.replace(/:[^@]*@/, ':***@');
  console.log('  - URL format:', maskedUrl);
}

console.log('\n🔌 Testing Connection...');

async function testConnection() {
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6380'
  });
  
  try {
    console.log('Attempting to connect...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    console.log('Testing ping...');
    const pong = await client.ping();
    console.log('✅ Ping response:', pong);
    
    console.log('Testing basic operations...');
    await client.set('test_key', 'test_value');
    const value = await client.get('test_key');
    console.log('✅ Set/Get test:', value);
    
    await client.del('test_key');
    console.log('✅ Delete test: successful');
    
  } catch (error) {
    console.log('❌ Connection failed:');
    console.log('Error message:', error.message);
    console.log('Error code:', error.code);
    console.log('Error stack:', error.stack);
  } finally {
    await client.disconnect();
    console.log('Connection closed.');
  }
}

testConnection(); 