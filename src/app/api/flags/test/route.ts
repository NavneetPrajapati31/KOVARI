// src/app/api/flags/test/route.ts
// Temporary test endpoint to debug flags insert
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          },
          set: (name, value, options) => {
            cookieStore.set(name, value, options);
          },
          remove: (name, options) => {
            cookieStore.delete(name);
          },
        },
      }
    );

    // Get current user
    const { data: currentUserRow, error: currentUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .single();

    if (currentUserError || !currentUserRow) {
      return NextResponse.json({
        error: "Current user not found",
        details: currentUserError,
      });
    }

    // Check table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from("user_flags")
      .select("*")
      .limit(0);

    // Try to read existing flags
    const { data: existingFlags, error: readError } = await supabase
      .from("user_flags")
      .select("id, user_id, reporter_id, reason, status, created_at")
      .limit(5);

    // Test insert (dry run - check permissions)
    const testInsert = {
      user_id: currentUserRow.id,
      reporter_id: currentUserRow.id,
      reason: "TEST - DO NOT USE",
      type: "user",
      status: "pending",
    };

    return NextResponse.json({
      success: true,
      currentUser: currentUserRow.id,
      tableAccessible: !tableError,
      tableError: tableError?.message,
      canRead: !readError,
      readError: readError?.message,
      existingFlagsCount: existingFlags?.length || 0,
      testInsertPayload: testInsert,
      note: "This is a test endpoint. Check if you can read from user_flags table.",
    });
  } catch (error) {
    return NextResponse.json({
      error: "Test failed",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
