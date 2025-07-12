import { auth } from "@clerk/nextjs/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    console.log("[JOIN_REQUEST_POST] Handler called");
    const { userId } = await auth();
    const { groupId } = await params;
    console.log("[JOIN_REQUEST_POST] userId:", userId, "groupId:", groupId);

    if (!userId) {
      console.log("[JOIN_REQUEST_POST] Unauthorized: No userId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!groupId) {
      console.log("[JOIN_REQUEST_POST] Missing groupId");
      return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete(name);
          },
        },
      }
    );

    // Get user UUID from Clerk userId or internal UUID
    let user;
    let userError;
    if (userId.length === 36) {
      // Looks like a UUID, search by id
      ({ data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .single());
      console.log("[JOIN_REQUEST_POST] user lookup by id:", user, userError);
    } else {
      // Looks like a Clerk user ID, search by clerk_user_id
      ({ data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", userId)
        .single());
      console.log(
        "[JOIN_REQUEST_POST] user lookup by clerk_user_id:",
        user,
        userError
      );
    }

    if (userError || !user) {
      console.error("[JOIN_REQUEST_POST] Error finding user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if group exists and is public
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, is_public")
      .eq("id", groupId)
      .single();
    console.log("[JOIN_REQUEST_POST] group lookup:", group, groupError);

    if (groupError || !group) {
      console.error("[JOIN_REQUEST_POST] Error finding group:", groupError);
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (!group.is_public) {
      console.log("[JOIN_REQUEST_POST] Group is not public");
      return NextResponse.json(
        { error: "Group is not public" },
        { status: 403 }
      );
    }

    // Check if user already has a membership
    const { data: existingMembership, error: membershipError } = await supabase
      .from("group_memberships")
      .select("id, status")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .maybeSingle();
    console.log(
      "[JOIN_REQUEST_POST] existingMembership:",
      existingMembership,
      membershipError
    );

    if (membershipError) {
      console.error(
        "[JOIN_REQUEST_POST] Error checking existing membership:",
        membershipError
      );
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Handle different existing membership statuses
    if (existingMembership) {
      if (existingMembership.status === "accepted") {
        console.log("[JOIN_REQUEST_POST] Already a member of this group");
        return NextResponse.json(
          { error: "Already a member of this group" },
          { status: 400 }
        );
      }
      if (existingMembership.status === "pending_request") {
        console.log("[JOIN_REQUEST_POST] Join request already pending");
        return NextResponse.json(
          { error: "Join request already pending" },
          { status: 400 }
        );
      }
      if (existingMembership.status === "pending") {
        console.log("[JOIN_REQUEST_POST] Already have a pending invitation");
        return NextResponse.json(
          { error: "Already have a pending invitation" },
          { status: 400 }
        );
      }
      if (existingMembership.status === "declined") {
        console.log(
          "[JOIN_REQUEST_POST] Updating declined membership to pending_request"
        );
        // Update declined membership to pending_request
        const { error: updateError } = await supabase
          .from("group_memberships")
          .update({
            status: "pending_request",
            joined_at: new Date().toISOString(),
          })
          .eq("id", existingMembership.id);

        if (updateError) {
          console.error(
            "[JOIN_REQUEST_POST] Error updating membership status:",
            updateError
          );
          return NextResponse.json(
            { error: "Failed to update membership" },
            { status: 500 }
          );
        }

        console.log("[JOIN_REQUEST_POST] Join request sent (declined updated)");
        return NextResponse.json({
          success: true,
          message: "Join request sent",
        });
      }
    }

    // Check if group is full
    const { data: memberCount, error: countError } = await supabase
      .from("group_memberships")
      .select("id", { count: "exact" })
      .eq("group_id", groupId)
      .eq("status", "accepted");
    console.log("[JOIN_REQUEST_POST] memberCount:", memberCount, countError);

    if (countError) {
      console.error(
        "[JOIN_REQUEST_POST] Error checking member count:",
        countError
      );
      return NextResponse.json(
        { error: "Failed to check member count" },
        { status: 500 }
      );
    }

    if (memberCount && memberCount.length >= 10) {
      console.log("[JOIN_REQUEST_POST] Group is full (maximum 10 members)");
      return NextResponse.json(
        { error: "Group is full (maximum 10 members)" },
        { status: 400 }
      );
    }

    // Create new membership with pending_request status
    console.log("[JOIN_REQUEST_POST] Inserting new pending_request membership");
    const { error: insertError } = await supabase
      .from("group_memberships")
      .insert({
        group_id: groupId,
        user_id: user.id,
        status: "pending_request",
        role: "member",
        joined_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error(
        "[JOIN_REQUEST_POST] Error creating join request:",
        insertError
      );
      return NextResponse.json(
        { error: "Failed to create join request" },
        { status: 500 }
      );
    }

    console.log("[JOIN_REQUEST_POST] Join request sent (new membership)");
    return NextResponse.json({ success: true, message: "Join request sent" });
  } catch (error) {
    console.error("[JOIN_REQUEST_POST] Uncaught error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    if (!groupId) {
      return new NextResponse("Missing groupId", { status: 400 });
    }
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete(name);
          },
        },
      }
    );
    // Fetch all pending join requests for the group, with user details
    const { data, error } = await supabase
      .from("group_memberships")
      .select(
        "id, user_id, joined_at, users!inner(clerk_user_id, profiles!inner(name, profile_photo, username))"
      )
      .eq("group_id", groupId)
      .eq("status", "pending_request");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Map to expected structure
    const joinRequests = (data || []).map((m: any) => ({
      id: m.id,
      userId: m.users.clerk_user_id,
      name: m.users.profiles.name,
      avatar: m.users.profiles.profile_photo,
      username: m.users.profiles.username,
      requestedAt: m.joined_at,
    }));
    return NextResponse.json({ joinRequests });
  } catch (error) {
    console.error("[JOIN_REQUEST_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    if (!groupId) {
      return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
    }
    let requestId: string | undefined;
    try {
      const body = await req.json();
      requestId = body.requestId;
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    if (!requestId) {
      return NextResponse.json(
        { error: "requestId is required" },
        { status: 400 }
      );
    }
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete(name);
          },
        },
      }
    );
    // Only delete if status is pending_request
    const { error } = await supabase
      .from("group_memberships")
      .delete()
      .eq("id", requestId)
      .eq("status", "pending_request");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[JOIN_REQUEST_DELETE]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
