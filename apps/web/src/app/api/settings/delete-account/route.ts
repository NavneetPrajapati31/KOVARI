import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@kovari/api";
import * as Sentry from "@sentry/nextjs";
import { getAuthenticatedUser } from "@/lib/auth/get-user";

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
 * For Mobile users (non-Clerk):
 * - We invalidate all custom JWT refresh tokens.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = createAdminSupabaseClient();
    const now = new Date();

    // 1) Find DB user row (Safety check)
    const { data: userRow, error: userRowError } = await supabaseAdmin
      .from("users")
      .select('id, "isDeleted", "deletedAt"')
      .eq("id", user.id)
      .maybeSingle();

    if (userRowError || !userRow) {
      console.error("Delete account: user not found in DB", userRowError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2) Fetch profile row
    const { data: profileRow, error: profileRowError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, username, email, number, deleted")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileRowError) {
      console.error("Delete account: failed to fetch profile", profileRowError);
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }

    // 3) Prepare rollback state
    const previousUserState = {
      isDeleted: (userRow as any).isDeleted === true,
      deletedAt: (userRow as any).deletedAt ?? null,
    };
    const previousProfileState = profileRow ? { ...profileRow } : null;

    const deletedUsername = `deleted_${userRow.id.replace(/-/g, "").slice(0, 20)}`.slice(0, 32);

    // 4) Update DB (Soft Delete)
    const { error: dbUpdateUserError } = await supabaseAdmin
      .from("users")
      .update({
        isDeleted: true,
        deletedAt: now.toISOString(),
      })
      .eq("id", userRow.id);

    if (dbUpdateUserError) {
      console.error("Delete account: DB update failed", dbUpdateUserError);
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }

    if (profileRow) {
      const { error: dbUpdateProfileError } = await supabaseAdmin
        .from("profiles")
        .update({
          deleted: true,
          email: null,
          number: null,
          username: deletedUsername,
        })
        .eq("user_id", userRow.id);

      if (dbUpdateProfileError) {
        // Rollback user update
        await supabaseAdmin.from("users").update(previousUserState).eq("id", userRow.id);
        return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
      }
    }

    // 5) Handle Auth Platform Deletion / Session Invalidation
    if (user.clerkUserId) {
      // WEB: Hard delete Clerk user
      try {
        const client = await clerkClient();
        await client.users.deleteUser(user.clerkUserId);
      } catch (clerkErr) {
        console.error("Delete account: Clerk deletion failed", clerkErr);
        // Rollback DB
        await supabaseAdmin.from("users").update(previousUserState).eq("id", userRow.id);
        if (previousProfileState) {
          await supabaseAdmin.from("profiles").update({
            deleted: previousProfileState.deleted,
            email: previousProfileState.email,
            number: previousProfileState.number,
            username: previousProfileState.username,
          }).eq("user_id", userRow.id);
        }
        return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
      }
    } else {
      // MOBILE: Invalidate all refresh tokens
      const { error: tokenError } = await supabaseAdmin
        .from("refresh_tokens")
        .delete()
        .eq("user_id", user.id);
      
      if (tokenError) {
        console.error("Delete account: failed to clear tokens", tokenError);
        // We continue anyway as the user is soft-deleted, but log the error
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete account error:", error);
    Sentry.captureException(error, { tags: { endpoint: "/api/settings/delete-account" } });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



