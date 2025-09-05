import { NextResponse } from 'next/server';
import redis, { ensureRedisConnection } from '@/lib/redis';

export async function GET() {
  try {
    console.log('🧪 Testing Redis connection from API route...');
    console.log('  - REDIS_URL:', process.env.REDIS_URL ? '✅ Set' : '❌ Not set');
    console.log('  - NODE_ENV:', process.env.NODE_ENV);
    
    // Test Redis connection
    const redisClient = await ensureRedisConnection();
    
    console.log('✅ Redis connected successfully!');
    
    // Test ping
    const pong = await redisClient.ping();
    console.log('✅ Ping response:', pong);
    
    // Test basic operations
    await redisClient.set('test_api_key', 'test_api_value');
    const value = await redisClient.get('test_api_key');
    await redisClient.del('test_api_key');
    
    return NextResponse.json({
      success: true,
      message: 'Redis connection test successful',
      ping: pong,
      testOperation: value === 'test_api_value',
      environment: {
        REDIS_URL: process.env.REDIS_URL ? 'Set' : 'Not set',
        NODE_ENV: process.env.NODE_ENV,
        cwd: process.cwd()
      }
    });
    
  } catch (error: any) {
    console.error('❌ Redis test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      environment: {
        REDIS_URL: process.env.REDIS_URL ? 'Set' : 'Not set',
        NODE_ENV: process.env.NODE_ENV,
        cwd: process.cwd()
      }
    }, { status: 500 });
  }
}
