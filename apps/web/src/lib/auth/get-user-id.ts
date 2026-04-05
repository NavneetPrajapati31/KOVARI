import { auth as clerkAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { verifyAccessToken } from "./jwt";

/**
 * Unified helper to get the authenticated user ID from either Clerk (Web) 
 * or Mobile JWT. 
 * 
 * Returns the clerk_user_id (for Clerk users) or the user_id (for Mobile JWT users).
 * Note: Our backend 'users' table holds both internally, with clerk_user_id 
 * being the one we usually filter by for auth.
 */
export async function getAuthUserId(req: NextRequest): Promise<string | null> {
  // 1. Try Clerk auth first (Standard for Web)
  try {
    const { userId } = await clerkAuth();
    if (userId) return userId;
  } catch (e) {
    // Standard error for non-Clerk requests when using our middleware hack
  }

  // 2. Try Mobile JWT (Standard for Mobile requests intercepted in middleware)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    // For mobile JWTs, the 'userId' in the payload is the internal UUID from 
    // the 'users' table (since they don't have a Clerk ID).
    // Our route handlers need to be aware of this.
    return payload?.userId || null;
  }

  return null;
}
