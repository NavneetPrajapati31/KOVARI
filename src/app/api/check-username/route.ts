import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
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
