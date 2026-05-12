import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@kovari/api";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const userIds = Array.isArray(body?.userIds)
      ? body.userIds.filter((v: unknown) => typeof v === "string")
      : [];

    if (userIds.length === 0) {
      return NextResponse.json({ profiles: [] });
    }

    const supabase = createAdminSupabaseClient();

    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .single();

    // Log if current user is missing in DB, but don't hard-block yet if it's a valid Clerk user.
    // This allows the profile lookup to proceed so the UI doesn't break during onboarding.
    if (currentUserError || !currentUser) {
      console.warn("[POST /api/direct-chat/profiles] Current user not in DB, proceeding with Clerk context:", clerkUserId);
    }

    // Resolve all input IDs (could be Clerk IDs or UUIDs)
    const profileResults = await Promise.all(
      userIds.map(async (id: string) => {
        let internalId = id;
        let clerkId = id.startsWith("user_") ? id : null;

        // 1. Resolve Clerk ID to UUID if necessary
        if (id.startsWith("user_")) {
          const { data } = await supabase
            .from("users")
            .select("id, clerk_user_id")
            .eq("clerk_user_id", id)
            .single();
          if (data) {
            internalId = data.id;
            clerkId = data.clerk_user_id;
          }
        } else {
          // If it's a UUID, try to get its Clerk ID
          const { data } = await supabase
            .from("users")
            .select("clerk_user_id")
            .eq("id", id)
            .single();
          if (data) {
            clerkId = data.clerk_user_id;
          }
        }

        // 2. Fetch the profile data
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, username, profile_photo, deleted")
          .eq("user_id", internalId)
          .single();

        // 3. Return a synthesized object
        if (profile || clerkId) {
          return {
            user_id: internalId,
            clerk_id: clerkId,
            name: profile?.name || "User",
            username: profile?.username || "user",
            profile_photo: profile?.profile_photo,
            deleted: profile?.deleted || false
          };
        }
        return null;
      })
    );

    const validProfiles = profileResults.filter(p => p !== null);
    return NextResponse.json({ profiles: validProfiles });
  } catch (error) {
    console.error("[POST /api/direct-chat/profiles] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}


