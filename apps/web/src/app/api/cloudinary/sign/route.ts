import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/get-user";

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
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = authUser.id; // Use our internal UUID for rate limiting

    const now = Date.now();
    const userRate = rateLimitMap.get(userId) || { count: 0, timestamp: now };
    
    if (now - userRate.timestamp > WINDOW_MS) {
      userRate.count = 1;
      userRate.timestamp = now;
    } else {
      userRate.count++;
      if (userRate.count > LIMIT) {
        return new NextResponse(
          JSON.stringify({ error: "Too many requests. Please try again later." }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    rateLimitMap.set(userId, userRate);

    const body = await request.json();
    const folder = body.folder || "kovari-uploads";
    
    // Add timestamp
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Securely generate the signature
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({ 
      timestamp, 
      signature, 
      folder,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    });
  } catch (error) {
    console.error("Error generating Cloudinary signature:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

