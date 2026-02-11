import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";

/**
 * Soft delete (not hard delete) is used for accounts because:
 * - It preserves referential integrity for related data (matches, groups, chats, reports, etc.)
 * - It prevents breaking foreign keys and historical analytics
 * - It allows potential future account recovery/audit workflows
 *
 * IMPORTANT: This endpoint never removes rows; it only marks the user as deleted.
 */
export async function POST(_req: NextRequest) {
  try {
    const { userId, sessionId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      // We intentionally require service role here to ensure the soft-delete works
      // even when RLS would otherwise block updates to the `users` table.
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const now = new Date();

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        isDeleted: true,
        deletedAt: now.toISOString(),
      })
      .eq("clerk_user_id", userId)
      .eq("isDeleted", false)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("Soft delete update error:", updateError);
      Sentry.captureException(updateError, {
        tags: { endpoint: "/api/settings/delete-account" },
      });
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 }
      );
    }

    // If the user was already deleted or not found, treat as success (idempotent).
    // We still attempt to revoke the session below.
    if (!updatedUser) {
      console.warn("Delete account: user not updated (already deleted?)", {
        clerk_user_id: userId,
      });
    }

    // Invalidate current session so the user is logged out immediately.
    // (UI should handle navigation; backend guarantees the session is revoked.)
    if (sessionId) {
      try {
        const client = await clerkClient();
        await client.sessions.revokeSession(sessionId);
      } catch (err) {
        // Soft delete succeeded; session revocation failure should not block response.
        console.warn("Failed to revoke session during delete-account:", err);
        Sentry.captureException(err, {
          tags: { endpoint: "/api/settings/delete-account", op: "revokeSession" },
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete account error:", error);
    Sentry.captureException(error, {
      tags: { endpoint: "/api/settings/delete-account" },
    });
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}

