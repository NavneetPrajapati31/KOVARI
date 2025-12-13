import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { userId } = await auth();
    const { groupId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

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
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.delete(name);
          },
        },
      }
    );

    // Get user UUID from Clerk userId
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .single();

    if (userError || !user) {
      console.error("Error finding user:", userError);
      return new NextResponse("User not found", { status: 404 });
    }

    // Check if group exists and is not removed
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, status")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return new NextResponse("Group not found", { status: 404 });
    }

    // Block access to removed groups
    if (group.status === "removed") {
      return new NextResponse("Group not found", { status: 404 });
    }

    // Check if user is a member of the group
    const { data: membership, error: membershipError } = await supabase
      .from("group_memberships")
      .select("id, role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .eq("status", "accepted")
      .single();

    if (membershipError || !membership) {
      return new NextResponse("You are not a member of this group", {
        status: 404,
      });
    }

    // Check if user is the creator/admin and if there are other members
    if (membership.role === "admin") {
      const { data: otherMembers, error: countError } = await supabase
        .from("group_memberships")
        .select("id")
        .eq("group_id", groupId)
        .eq("status", "accepted")
        .neq("user_id", user.id);

      if (countError) {
        console.error("Error checking other members:", countError);
        return new NextResponse("Database error", { status: 500 });
      }

      if (otherMembers && otherMembers.length > 0) {
        return new NextResponse(
          "Cannot leave group as admin when other members exist. Please transfer admin role or delete the group.",
          { status: 400 }
        );
      }
    }

    // Remove the membership
    const { error: deleteError } = await supabase
      .from("group_memberships")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error leaving group:", deleteError);
      return new NextResponse("Failed to leave group", { status: 500 });
    }

    // If this was the last member and user was admin, delete the group
    if (membership.role === "admin") {
      const { error: groupDeleteError } = await supabase
        .from("groups")
        .delete()
        .eq("id", groupId);

      if (groupDeleteError) {
        console.error("Error deleting empty group:", groupDeleteError);
        // Don't fail the request if group deletion fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Successfully left the group",
    });
  } catch (error) {
    console.error("[LEAVE_GROUP_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
