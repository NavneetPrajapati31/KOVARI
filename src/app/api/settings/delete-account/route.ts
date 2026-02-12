import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";

/**
 * We soft delete in our database (Supabase) because:
 * - It preserves referential integrity for related data (matches, groups, chats, reports, etc.)
 * - It prevents breaking foreign keys and historical analytics
 * - It keeps history for analytics and audits
 *
 * We hard delete in Clerk because:
 * - It immediately prevents further authentication with the old account
 * - It enables clean re-signup with the same email/OAuth account
 *
 * IMPORTANT:
 * - We never hard delete our DB user row and we never cascade delete related records.
 * - We also clear unique fields on `profiles` (email/username/number) so re-signup
 *   doesn't conflict with unique constraints, while keeping the rest of the profile
 *   for history/analytics.
 */
export async function POST(_req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
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

    // 1) Find DB user row
    const { data: userRow, error: userRowError } = await supabaseAdmin
      .from("users")
      .select('id, "isDeleted", "deletedAt"')
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();

    if (userRowError) {
      console.error("Delete account: failed to fetch DB user row", userRowError);
      Sentry.captureException(userRowError, {
        tags: { endpoint: "/api/settings/delete-account", op: "fetchUserRow" },
      });
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 },
      );
    }

    if (!userRow?.id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2) Fetch profile row (for rollback + to clear unique fields for re-signup)
    const { data: profileRow, error: profileRowError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, username, email, number, deleted")
      .eq("user_id", userRow.id)
      .maybeSingle();

    if (profileRowError) {
      console.error(
        "Delete account: failed to fetch profile row",
        profileRowError,
      );
      Sentry.captureException(profileRowError, {
        tags: { endpoint: "/api/settings/delete-account", op: "fetchProfileRow" },
      });
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 },
      );
    }

    // 3) Soft delete in DB (users + profiles adjustments)
    const previousUserState = {
      isDeleted: (userRow as any).isDeleted === true,
      deletedAt: (userRow as any).deletedAt ?? null,
    };
    const previousProfileState = profileRow
      ? {
          deleted: profileRow.deleted === true,
          username: profileRow.username,
          email: profileRow.email,
          number: profileRow.number,
        }
      : null;

    const deletedUsername = `deleted_${userRow.id.replace(/-/g, "").slice(0, 20)}`.slice(
      0,
      32,
    );

    const { error: dbUpdateUserError } = await supabaseAdmin
      .from("users")
      .update({
        isDeleted: true,
        deletedAt: now.toISOString(),
      })
      .eq("id", userRow.id);

    if (dbUpdateUserError) {
      console.error("Delete account: failed to soft delete DB user", dbUpdateUserError);
      Sentry.captureException(dbUpdateUserError, {
        tags: { endpoint: "/api/settings/delete-account", op: "softDeleteUser" },
      });
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 },
      );
    }

    if (profileRow?.user_id) {
      const { error: dbUpdateProfileError } = await supabaseAdmin
        .from("profiles")
        .update({
          deleted: true,
          // Clear unique fields so a user can re-sign up with the same email/username/phone.
          // We keep other profile fields for analytics/history.
          email: null,
          number: null,
          username: deletedUsername,
        })
        .eq("user_id", userRow.id);

      if (dbUpdateProfileError) {
        console.error(
          "Delete account: failed to update profile for deletion",
          dbUpdateProfileError,
        );
        Sentry.captureException(dbUpdateProfileError, {
          tags: {
            endpoint: "/api/settings/delete-account",
            op: "softDeleteProfile",
          },
        });
        // Roll back user soft delete since we couldn't safely adjust uniques.
        await supabaseAdmin
          .from("users")
          .update({
            isDeleted: previousUserState.isDeleted,
            deletedAt: previousUserState.deletedAt,
          })
          .eq("id", userRow.id);
        return NextResponse.json(
          { error: "Failed to delete account" },
          { status: 500 },
        );
      }
    }

    // 4) Hard delete Clerk user (prevents login + enables clean re-signup)
    try {
      const client = await clerkClient();
      await client.users.deleteUser(clerkUserId);
    } catch (clerkErr) {
      console.error("Delete account: failed to delete Clerk user", clerkErr);
      Sentry.captureException(clerkErr, {
        tags: { endpoint: "/api/settings/delete-account", op: "deleteClerkUser" },
      });

      // 5) Roll back DB changes if Clerk deletion fails
      try {
        await supabaseAdmin
          .from("users")
          .update({
            isDeleted: previousUserState.isDeleted,
            deletedAt: previousUserState.deletedAt,
          })
          .eq("id", userRow.id);

        if (previousProfileState) {
          await supabaseAdmin
            .from("profiles")
            .update({
              deleted: previousProfileState.deleted,
              username: previousProfileState.username,
              email: previousProfileState.email,
              number: previousProfileState.number,
            })
            .eq("user_id", userRow.id);
        }
      } catch (rollbackErr) {
        console.error("Delete account: rollback failed", rollbackErr);
        Sentry.captureException(rollbackErr, {
          tags: {
            endpoint: "/api/settings/delete-account",
            op: "rollback",
          },
        });
      }

      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 },
      );
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

