export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth/get-user-id";
import { createAdminSupabaseClient } from "@kovari/api";
import { generateRequestId } from "@/lib/api/requestId";
import { formatStandardResponse, formatErrorResponse } from "@/lib/api/responseHelpers";
import { ApiErrorCode } from "@/types/api";

type AccessContext =
  | {
      ok: true;
      userId: string; // internal uuid
      group: {
        id: string;
        status: "active" | "pending" | "removed" | string;
        creator_id: string | null;
        is_public?: boolean | null;
      };
      isCreator: boolean;
      membershipRole?: "admin" | "member" | string | null;
    }
  | { ok: false; status: number; error: string };

async function getAccessContext(req: NextRequest, groupId: string): Promise<AccessContext> {
  const userId = await getAuthUserId(req);
  if (!userId) return { ok: false, status: 401, error: "Unauthorized" };

  const supabase = createAdminSupabaseClient();

  const userQuery = supabase
    .from("users")
    .select("id")
    .eq("isDeleted", false);
  
  if (userId.startsWith("user_")) {
    userQuery.eq("clerk_user_id", userId);
  } else {
    userQuery.eq("id", userId);
  }

  const { data: userRow, error: userError } = await userQuery.single();

  if (userError || !userRow) {
    return { ok: false, status: 404, error: "User not found" };
  }

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, status, creator_id, is_public")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    return { ok: false, status: 404, error: "Group not found" };
  }

  if (group.status === "removed") {
    return { ok: false, status: 404, error: "Group not found" };
  }

  const isCreator = group.creator_id === userRow.id;

  // Pending groups should be hidden from non-creators
  if (group.status === "pending" && !isCreator) {
    return { ok: false, status: 404, error: "Group not found" };
  }

  const { data: memberships } = await supabase
    .from("group_memberships")
    .select("role, status")
    .eq("group_id", groupId)
    .eq("user_id", userRow.id)
    .eq("status", "accepted")
    .limit(1);
    
  const membership = memberships?.[0] || null;

  return {
    ok: true,
    userId: userRow.id,
    group,
    isCreator,
    membershipRole: membership?.role ?? null,
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const start = Date.now();
  const requestId = generateRequestId();

  try {
    const { groupId } = await params;

    if (!groupId) {
      return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
    }

    const ctx = await getAccessContext(req, groupId);
    if (!ctx.ok) {
      if (req.headers.get("x-kovari-client") === "mobile") {
        return formatErrorResponse(ctx.error, ctx.status === 401 ? ApiErrorCode.UNAUTHORIZED : ApiErrorCode.FORBIDDEN, requestId, ctx.status);
      }
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }

    const supabase = createAdminSupabaseClient();

    // Only active public groups can accept join requests
    if (ctx.group.status !== "active") {
      return NextResponse.json(
        { error: "This group is not available for joining" },
        { status: 403 },
      );
    }

    if (!ctx.group.is_public) {
      return NextResponse.json(
        { error: "Group is not public" },
        { status: 403 },
      );
    }

    // Check if user already has a membership
    const { data: existingMembership, error: membershipError } = await supabase
      .from("group_memberships")
      .select("id, status")
      .eq("group_id", groupId)
      .eq("user_id", ctx.userId)
      .maybeSingle();

    if (membershipError) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Handle different existing membership statuses
    if (existingMembership) {
      if (existingMembership.status === "accepted") {
        console.log("[JOIN_REQUEST_POST] Already a member of this group");
        return NextResponse.json(
          { error: "Already a member of this group" },
          { status: 400 },
        );
      }
      if (existingMembership.status === "pending_request") {
        console.log("[JOIN_REQUEST_POST] Join request already pending");
        return NextResponse.json(
          { error: "Join request already pending" },
          { status: 400 },
        );
      }
      if (existingMembership.status === "pending") {
        console.log("[JOIN_REQUEST_POST] Already have a pending invitation");
        return NextResponse.json(
          { error: "Already have a pending invitation" },
          { status: 400 },
        );
      }
      if (existingMembership.status === "declined") {
        // Update declined membership to pending_request
        const { error: updateError } = await supabase
          .from("group_memberships")
          .update({
            status: "pending_request",
            joined_at: new Date().toISOString(),
          })
          .eq("id", existingMembership.id);

        if (updateError) {
          return NextResponse.json(
            { error: "Failed to update membership" },
            { status: 500 },
          );
        }

        return NextResponse.json({
          success: true,
          message: "Join request sent",
        });
      }
    }

    // Check if group is full
    const { count, error: countError } = await supabase
      .from("group_memberships")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("status", "accepted");

    if (countError) {
      return NextResponse.json(
        { error: "Failed to check member count" },
        { status: 500 },
      );
    }

    if (count != null && count >= 10) {
      return NextResponse.json(
        { error: "Group is full (maximum 10 members)" },
        { status: 400 },
      );
    }

    // Create new membership with pending_request status
    const { error: insertError } = await supabase
      .from("group_memberships")
      .insert({
        group_id: groupId,
        user_id: ctx.userId,
        status: "pending_request",
        role: "member",
        joined_at: new Date().toISOString(),
      });

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to create join request" },
        { status: 500 },
      );
    }

    if (req.headers.get("x-kovari-client") === "mobile") {
      return formatStandardResponse({ success: true, message: "Join request sent" }, {}, { requestId, latencyMs: Date.now() - start });
    }
    return NextResponse.json({ success: true, message: "Join request sent" });
  } catch (error) {
    console.error("[JOIN_REQUEST_POST] Uncaught error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const start = Date.now();
  const requestId = generateRequestId();

  try {
    const { groupId } = await params;
    if (!groupId) {
      return new NextResponse("Missing groupId", { status: 400 });
    }

    const ctx = await getAccessContext(req, groupId);
    if (!ctx.ok) {
      if (req.headers.get("x-kovari-client") === "mobile") {
        return formatErrorResponse(ctx.error, ctx.status === 401 ? ApiErrorCode.UNAUTHORIZED : ApiErrorCode.FORBIDDEN, requestId, ctx.status);
      }
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }

    // Only members can view join requests
    if (!ctx.isCreator && !ctx.membershipRole) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = createAdminSupabaseClient();

    // Fetch all pending join requests for the group, with user details
    const { data, error } = await supabase
      .from("group_memberships")
      .select(
        "id, user_id, joined_at, users!inner(clerk_user_id, profiles!inner(name, profile_photo, username))",
      )
      .eq("group_id", groupId)
      .eq("status", "pending_request");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log(`[JOIN_REQUEST_GET] Raw Data from Supabase: ${JSON.stringify(data)}`);
    
    // Map to expected structure
    const joinRequests = (data || []).map((m: any) => {
      const user = Array.isArray(m.users) ? m.users[0] : m.users;
      const profile = user?.profiles ? (Array.isArray(user.profiles) ? user.profiles[0] : user.profiles) : null;
      
      return {
        id: m.id,
        userId: user?.clerk_user_id || m.user_id, // Fallback to internal UUID if Clerk ID is missing
        name: profile?.name || "Unknown",
        avatar: profile?.profile_photo || "",
        username: profile?.username || "unknown",
        requestedAt: m.joined_at,
      };
    });
    
    console.log(`[JOIN_REQUEST_GET] Final Mapped Requests: ${JSON.stringify(joinRequests)}`);
    if (req.headers.get("x-kovari-client") === "mobile") {
      return formatStandardResponse({ joinRequests }, {}, { requestId, latencyMs: Date.now() - start });
    }
    return NextResponse.json({ joinRequests });
  } catch (error) {
    console.error("[JOIN_REQUEST_GET]", error);
    if (req.headers.get("x-kovari-client") === "mobile") {
      return formatErrorResponse("Internal Server Error", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const start = Date.now();
  const apiRequestId = generateRequestId();

  try {
    const { groupId } = await params;
    if (!groupId) {
      return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
    }

    const ctx = await getAccessContext(req, groupId);
    if (!ctx.ok) {
      if (req.headers.get("x-kovari-client") === "mobile") {
        return formatErrorResponse(ctx.error, ctx.status === 401 ? ApiErrorCode.UNAUTHORIZED : ApiErrorCode.FORBIDDEN, apiRequestId, ctx.status);
      }
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }
    const isAdmin = ctx.membershipRole === "admin";
    if (!ctx.isCreator && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let requestId: string | undefined;
    try {
      const body = await req.json();
      requestId = body.requestId;
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }
    if (!requestId) {
      return NextResponse.json(
        { error: "requestId is required" },
        { status: 400 },
      );
    }

    const supabase = createAdminSupabaseClient();

    // Only delete if status is pending_request
    const { data: deleted, error } = await supabase
      .from("group_memberships")
      .delete()
      .eq("id", requestId)
      .eq("group_id", groupId)
      .eq("status", "pending_request")
      .select("id");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If nothing was deleted, treat as not found
    if (Array.isArray(deleted) && deleted.length === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (req.headers.get("x-kovari-client") === "mobile") {
      return formatStandardResponse({ success: true }, {}, { requestId: apiRequestId, latencyMs: Date.now() - start });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[JOIN_REQUEST_DELETE]", error);
    if (req.headers.get("x-kovari-client") === "mobile") {
      return formatErrorResponse("Internal Server Error", ApiErrorCode.INTERNAL_SERVER_ERROR, apiRequestId, 500);
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
