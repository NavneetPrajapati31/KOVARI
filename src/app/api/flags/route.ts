// src/app/api/flags/route.ts
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

/**
 * POST /api/flags
 * Public endpoint for creating flags (reports)
 * 
 * Payload:
 * {
 *   "targetType": "user" | "group",
 *   "targetId": "uuid",
 *   "reason": "Harassment / fake profile / unsafe behavior",
 *   "evidenceUrl": "https://cloudinary/..." (optional)
 * }
 */
export async function POST(req: NextRequest) {
  console.log("=== FLAG API CALLED ===");
  console.log("Timestamp:", new Date().toISOString());
  
  try {
    // Validate authentication
    const { userId: clerkUserId } = await auth();
    console.log("Clerk User ID:", clerkUserId);
    
    if (!clerkUserId) {
      console.error("❌ Unauthorized - no Clerk user ID");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    console.log("Request body:", JSON.stringify(body, null, 2));
    const { targetType, targetId, reason, evidenceUrl, evidencePublicId } = body;
    
    console.log("Parsed values:");
    console.log("- targetType:", targetType);
    console.log("- targetId:", targetId);
    console.log("- reason:", reason);
    console.log("- evidenceUrl:", evidenceUrl);
    console.log("- evidencePublicId:", evidencePublicId);

    // Validate required fields
    if (!targetType || !targetId || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: targetType, targetId, reason" },
        { status: 400 }
      );
    }

    // Validate targetType
    if (targetType !== "user" && targetType !== "group") {
      return NextResponse.json(
        { error: "targetType must be 'user' or 'group'" },
        { status: 400 }
      );
    }

    // Validate reason
    if (!reason.trim()) {
      return NextResponse.json(
        { error: "Reason cannot be empty" },
        { status: 400 }
      );
    }

    // Create Supabase client
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

    // Get current user's UUID from Clerk userId
    const { data: currentUserRow, error: currentUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .single();

    if (currentUserError || !currentUserRow) {
      console.error("Error finding current user:", currentUserError);
      return NextResponse.json(
        { error: "Current user not found" },
        { status: 404 }
      );
    }

    const reporterId = currentUserRow.id;

    // PHASE 7: Prevent self-reporting
    if (targetType === "user" && targetId === reporterId) {
      return NextResponse.json(
        { error: "Cannot report yourself" },
        { status: 400 }
      );
    }

    // PHASE 7: Rate limiting - Check if user has exceeded daily limit (3 flags/day)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartISO = todayStart.toISOString();

    const { count: todayFlagCount, error: rateLimitError } = await supabase
      .from("user_flags")
      .select("*", { count: "exact", head: true })
      .eq("reporter_id", reporterId)
      .gte("created_at", todayStartISO);

    if (rateLimitError) {
      console.error("Error checking rate limit:", rateLimitError);
    } else if (todayFlagCount && todayFlagCount >= 3) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          details: "You have reached the daily limit of 3 reports. Please try again tomorrow.",
          limit: 3,
          remaining: 0
        },
        { status: 429 }
      );
    }

    // Validate target exists
    if (targetType === "user") {
      const { data: targetUser, error: targetError } = await supabase
        .from("users")
        .select("id")
        .eq("id", targetId)
        .single();

      if (targetError || !targetUser) {
        return NextResponse.json(
          { error: "Target user not found" },
          { status: 404 }
        );
      }
    } else if (targetType === "group") {
      const { data: targetGroup, error: targetError } = await supabase
        .from("groups")
        .select("id")
        .eq("id", targetId)
        .single();

      if (targetError || !targetGroup) {
        return NextResponse.json(
          { error: "Target group not found" },
          { status: 404 }
        );
      }
    }

    // PHASE 7: Check for duplicate flag (same reporter, same target, within last 24 hours)
    // Prevents spam reporting of the same target
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    console.log("=== DUPLICATE CHECK ===");
    console.log("Checking for existing flags from:", oneDayAgo);
    console.log("Reporter ID:", reporterId);
    console.log("Target ID:", targetId);
    
    if (targetType === "user") {
      const { data: existingFlag, error: duplicateCheckError } = await supabase
        .from("user_flags")
        .select("id, created_at, status")
        .eq("user_id", targetId)
        .eq("reporter_id", reporterId)
        .gte("created_at", oneDayAgo)
        .maybeSingle();

      console.log("Duplicate check result:");
      console.log("- Existing flag:", existingFlag);
      console.log("- Check error:", duplicateCheckError);

      if (existingFlag) {
        console.log("⚠️ DUPLICATE FOUND: User already reported this user within 24 hours");
        console.log("Existing flag ID:", existingFlag.id);
        console.log("Existing flag created_at:", existingFlag.created_at);
        console.log("Existing flag status:", existingFlag.status);
        
        return NextResponse.json(
          { 
            error: "You have already reported this user recently",
            details: `You reported this user on ${new Date(existingFlag.created_at).toLocaleString()}. Please wait 24 hours before reporting again.`,
            existingFlagId: existingFlag.id
          },
          { status: 429 }
        );
      }
      
      console.log("✅ No duplicate found - proceeding with insert");
    } else {
      // For groups, check group_flags table if it exists, otherwise use user_flags with type
      const { data: existingFlag } = await supabase
        .from("group_flags")
        .select("id")
        .eq("group_id", targetId)
        .eq("reporter_id", reporterId)
        .gte("created_at", oneDayAgo)
        .maybeSingle();

      if (existingFlag) {
        return NextResponse.json(
          { error: "You have already reported this group recently" },
          { status: 429 }
        );
      }
    }

    // Insert flag into appropriate table based on target type
    let flagResult;
    if (targetType === "user") {
      // Insert into user_flags with user_id (matches schema)
      // Schema: user_id (NOT NULL), reporter_id (nullable), type (nullable), reason (nullable), evidence_url (nullable), evidence_public_id (nullable), status (NOT NULL, default 'pending')
      const insertPayload = {
        user_id: targetId,
        reporter_id: reporterId,
        reason: reason.trim(),
        evidence_url: evidenceUrl || null,
        evidence_public_id: evidencePublicId || null,
        type: "user", // Optional but useful for filtering
        status: "pending", // Explicitly set (though it has a default)
      };

      console.log("=== FLAG INSERT DEBUG ===");
      console.log("Inserting user flag with payload:", JSON.stringify(insertPayload, null, 2));
      console.log("Reporter ID:", reporterId);
      console.log("Target ID:", targetId);
      console.log("Evidence URL:", evidenceUrl);
      console.log("Evidence Public ID:", evidencePublicId);

      const { data, error: insertError } = await supabase
        .from("user_flags")
        .insert(insertPayload)
        .select("id")
        .single();

      console.log("=== INSERT RESULT ===");
      console.log("Data:", data);
      console.log("Error:", insertError);
      console.log("Error code:", insertError?.code);
      console.log("Error message:", insertError?.message);
      console.log("Error details:", JSON.stringify(insertError, null, 2));

      if (insertError) {
        console.error("❌ ERROR creating user flag:", insertError);
        console.error("Insert payload:", insertPayload);
        console.error("Full error:", JSON.stringify(insertError, null, 2));
        
        // Check for specific error types
        if (insertError.code === "23503") {
          // Foreign key violation - user_id doesn't exist
          return NextResponse.json(
            { 
              error: "Failed to create flag", 
              details: "The reported user does not exist in the database",
              code: insertError.code,
            },
            { status: 404 }
          );
        }
        
        if (insertError.code === "42501") {
          // Permission denied - RLS policy blocking
          return NextResponse.json(
            { 
              error: "Failed to create flag", 
              details: "Permission denied. Please check Row Level Security policies.",
              code: insertError.code,
              hint: "RLS policy may be blocking the insert. Check Supabase dashboard.",
            },
            { status: 403 }
          );
        }

        return NextResponse.json(
          { 
            error: "Failed to create flag", 
            details: insertError.message || "Database error occurred",
            code: insertError.code,
            hint: insertError.hint,
          },
          { status: 500 }
        );
      }

      flagResult = data;
      console.log("✅ SUCCESS: User flag created successfully!");
      console.log("Flag ID:", flagResult.id);
      console.log("Flag data:", JSON.stringify(flagResult, null, 2));
      
      // Verify the insert actually happened by querying the database
      const { data: verifyData, error: verifyError } = await supabase
        .from("user_flags")
        .select("*")
        .eq("id", flagResult.id)
        .single();
      
      if (verifyError) {
        console.error("⚠️ WARNING: Could not verify flag was inserted:", verifyError);
      } else {
        console.log("✅ VERIFIED: Flag exists in database:", JSON.stringify(verifyData, null, 2));
      }
    } else {
      // For groups, try group_flags table first, then fallback to user_flags
      // Note: group_flags table may not exist, so we'll use user_flags as fallback
      let insertError: any = null;
      let flagData: any = null;

      // Try group_flags first (if it exists)
      const { data: groupFlagData, error: groupFlagError } = await supabase
        .from("group_flags")
        .insert({
          group_id: targetId,
          reporter_id: reporterId,
          reason: reason.trim(),
          evidence_url: evidenceUrl || null,
          evidence_public_id: evidencePublicId || null,
          status: "pending",
        })
        .select("id")
        .single();

      if (!groupFlagError && groupFlagData) {
        // Success - group_flags table exists
        flagResult = groupFlagData;
        console.log("Group flag created successfully in group_flags:", flagResult.id);
      } else {
        // group_flags doesn't exist or error - use user_flags as fallback
        // Note: This is a workaround - user_flags.user_id has a foreign key to users table
        // So we can't use it for groups. This will fail if group_flags doesn't exist.
        console.warn("group_flags table not found, cannot create group flag");
        return NextResponse.json(
          { 
            error: "Failed to create flag", 
            details: "Group flags are not supported yet. Please contact support.",
            code: "NOT_IMPLEMENTED"
          },
          { status: 501 }
        );
      }
    }

    // Increment flag_count on target table (only for groups)
    // Note: flag_count for users is calculated dynamically in admin app
    if (targetType === "group") {
      const { data: groupData, error: groupFetchError } = await supabase
        .from("groups")
        .select("flag_count")
        .eq("id", targetId)
        .single();

      if (!groupFetchError && groupData) {
        const currentFlagCount = groupData.flag_count || 0;
        const { error: updateError } = await supabase
          .from("groups")
          .update({ flag_count: currentFlagCount + 1 })
          .eq("id", targetId);

        if (updateError) {
          console.warn("Could not increment group flag_count:", updateError);
          // Continue - flag was created successfully, just couldn't update count
        } else {
          console.log("Group flag_count incremented to:", currentFlagCount + 1);
        }
      }
    }

    // Log to Sentry (optional, for monitoring)
    Sentry.captureMessage("Flag created", {
      level: "info",
      tags: {
        targetType,
        reporterId,
        targetId,
      },
      extra: {
        hasEvidence: !!evidenceUrl,
      },
    });

    console.log("=== FINAL SUCCESS RESPONSE ===");
    console.log("Flag ID:", flagResult.id);
    
    // PHASE 6: Do not expose evidence URLs in public API response
    // Evidence URLs should only be accessible via admin API with signed URLs
    const response = {
      success: true,
      flagId: flagResult.id,
      message: `Report submitted successfully. Thank you for helping keep our community safe.`,
      // Do not include evidenceUrl or evidencePublicId in response
    };
    
    console.log("Returning response:", JSON.stringify(response, null, 2));
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("=== ❌ CATCH BLOCK ERROR ===");
    console.error("[FLAGS_ERROR]", error);
    console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    Sentry.captureException(error, {
      tags: {
        scope: "public-api",
        route: "POST /api/flags",
      },
    });
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
