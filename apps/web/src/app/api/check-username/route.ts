import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@kovari/api";
import { checkRateLimit } from "@kovari/api";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 10 attempts per minute per IP
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const ratelimit = await checkRateLimit(`rate_limit:username:${ip}`, 10, 60);

    if (!ratelimit.success) {
      return NextResponse.json(
        { available: false, error: "Too many attempts. Please wait." },
        { status: 429 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { available: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { username } = body;
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { available: false, error: "Invalid username" },
        { status: 400 }
      );
    }

    // 1. Check against Clerk users
    const client = await clerkClient();
    const clerkResult = await client.users.getUserList({ username: [username] });
    if (clerkResult.data.length > 0) {
      return NextResponse.json({ available: false });
    }

    // 2. Check against Supabase profiles table (using admin client to bypass RLS)
    // Using ilike for case-insensitive check
    const supabaseAdmin = createAdminSupabaseClient();
    const { data: existingProfile, error } = await supabaseAdmin
      .from("profiles")
      .select("username")
      .ilike("username", username)
      .maybeSingle();

    if (error) {
      console.error("Supabase username check error:", error);
      // Fail open or closed? Failing closed (unavailable) is safer to prevent conflicts, 
      // but returning error status might be better. 
      // User requested "robust", so let's log and return error status.
      return NextResponse.json(
        { available: false, error: "Database check failed" },
        { status: 500 }
      );
    }

    if (existingProfile) {
      return NextResponse.json({ available: false });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error("check-username error:", error);
    return NextResponse.json(
      { available: false, error: "Server error" },
      { status: 500 }
    );
  }
}


