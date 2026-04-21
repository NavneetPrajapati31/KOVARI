import { v2 as cloudinary } from "cloudinary";
import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { formatStandardResponse, formatErrorResponse } from "@/lib/api/responseHelpers";
import { ApiErrorCode } from "@/types/api";
import { generateRequestId } from "@/lib/api/requestId";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Simple in-memory token bucket/rate limit per Vercel instance
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const LIMIT = 20; // 20 requests per minute
const WINDOW_MS = 60 * 1000;

export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = generateRequestId();

  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return formatErrorResponse("Authentication required", ApiErrorCode.UNAUTHORIZED, requestId, 401);
    }

    const userId = authUser.id;

    const now = Date.now();
    const userRate = rateLimitMap.get(userId) || { count: 0, timestamp: now };
    
    if (now - userRate.timestamp > WINDOW_MS) {
      userRate.count = 1;
      userRate.timestamp = now;
    } else {
      userRate.count++;
      if (userRate.count > LIMIT) {
        return formatErrorResponse("Rate limit exceeded", ApiErrorCode.RATE_LIMIT_EXCEEDED, requestId, 429);
      }
    }
    rateLimitMap.set(userId, userRate);

    const body = await request.json();
    const folder = body.folder || "kovari-uploads";
    
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET!
    );

    const latencyMs = Date.now() - start;

    return formatStandardResponse(
      { 
        timestamp, 
        signature, 
        folder,
        api_key: process.env.CLOUDINARY_API_KEY,
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      },
      {},
      { requestId, latencyMs }
    );
  } catch (error) {
    console.error("Error generating Cloudinary signature:", error);
    return formatErrorResponse(
      "Internal server error", 
      ApiErrorCode.INTERNAL_SERVER_ERROR, 
      requestId, 
      500
    );
  }
}

