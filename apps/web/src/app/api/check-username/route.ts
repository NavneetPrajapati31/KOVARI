import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@kovari/api";
import { checkRateLimit } from "@kovari/api";
import { existsInFilter, addToFilter } from "@/lib/bloomFilter";

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

    // ⚡ INSTAGRAM-STYLE BLOOM FILTER LOOKUP
    const isPossiblyTaken = await existsInFilter(username);
    if (!isPossiblyTaken) {
      // If the Bloom Filter doesn't contain the username, it is DEFINITELY available!
      return NextResponse.json({ available: true });
    }

    // 1. Check against Clerk users (Fallback due to possible Bloom Filter false positive)
    const client = await clerkClient();
    const clerkResult = await client.users.getUserList({ username: [username] });
    if (clerkResult.data.length > 0) {
      await addToFilter(username);
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
      return NextResponse.json(
        { available: false, error: "Database check failed" },
        { status: 500 }
      );
    }

    if (existingProfile) {
      await addToFilter(username);
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


