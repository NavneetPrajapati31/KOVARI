import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function GET(req: NextRequest) {
  try {
    console.log("Testing Redis connection...");
    
    // Test Redis connection
    const testKey = "test:redis:connection";
    const testValue = "test_value_" + Date.now();
    
    // Set a test value
    await redis.setEx(testKey, 60, testValue);
    console.log("Set test value in Redis");
    
    // Get the test value
    const retrievedValue = await redis.get(testKey);
    console.log("Retrieved value from Redis:", retrievedValue);
    
    // Clean up
    await redis.del(testKey);
    console.log("Cleaned up test key");
    
    if (retrievedValue === testValue) {
      return NextResponse.json({ 
        success: true,
        message: "Redis connection test passed",
        testValue,
        retrievedValue
      });
    } else {
      return NextResponse.json({ 
        success: false,
        message: "Redis connection test failed - values don't match",
        testValue,
        retrievedValue
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Redis test error:", err);
    return NextResponse.json({ 
      error: "Redis test failed", 
      details: err.message 
    }, { status: 500 });
  }
}
