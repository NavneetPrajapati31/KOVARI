import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { userId } = await auth();
    const { groupId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!groupId) {
      return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

    // Get user UUID from Clerk userId
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .eq("isDeleted", false)
      .single();

    if (userError || !user) {
      console.error("Error finding user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if group exists and get creator info
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, creator_id, name, status")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Block access to removed groups (they're already removed, no need to delete again)
    if (group.status === "removed") {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check if user is the creator of the group
    if (group.creator_id !== user.id) {
      return NextResponse.json(
        { error: "Only the group creator can delete the group" },
        { status: 403 }
      );
    }

    // Delete all related data in a transaction-like manner
    // Start with dependent tables first

    // Delete group media
    const { error: mediaError } = await supabase
      .from("group_media")
      .delete()
      .eq("group_id", groupId);

    if (mediaError) {
      console.error("Error deleting group media:", mediaError);
      return NextResponse.json(
        { error: "Failed to delete group data" },
        { status: 500 },
      );
    }

    // Delete group messages
    const { error: messagesError } = await supabase
      .from("group_messages")
      .delete()
      .eq("group_id", groupId);

    if (messagesError) {
      console.error("Error deleting group messages:", messagesError);
      return NextResponse.json(
        { error: "Failed to delete group data" },
        { status: 500 },
      );
    }

    // Delete group encryption keys
    const { error: encryptionKeysError } = await supabase
      .from("group_encryption_keys")
      .delete()
      .eq("group_id", groupId);

    if (encryptionKeysError) {
      console.error("Error deleting group encryption keys:", encryptionKeysError);
      return NextResponse.json(
        { error: "Failed to delete group data" },
        { status: 500 },
      );
    }

    // Delete group email invitations
    const { error: emailInviteError } = await supabase
      .from("group_email_invitations")
      .delete()
      .eq("group_id", groupId);

    if (emailInviteError) {
      console.error("Error deleting email invitations:", emailInviteError);
      return NextResponse.json(
        { error: "Failed to delete group data" },
        { status: 500 }
      );
    }

    // Delete itinerary items
    const { error: itineraryError } = await supabase
      .from("itinerary_items")
      .delete()
      .eq("group_id", groupId);

    if (itineraryError) {
      console.error("Error deleting itinerary items:", itineraryError);
      return NextResponse.json(
        { error: "Failed to delete group data" },
        { status: 500 }
      );
    }

    // Delete group memberships
    const { error: membershipError } = await supabase
      .from("group_memberships")
      .delete()
      .eq("group_id", groupId);

    if (membershipError) {
      console.error("Error deleting group memberships:", membershipError);
      return NextResponse.json(
        { error: "Failed to delete group data" },
        { status: 500 }
      );
    }

    // Finally, delete the group itself
    const { error: groupDeleteError } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId);

    if (groupDeleteError) {
      console.error("Error deleting group:", groupDeleteError);
      return NextResponse.json(
        { error: "Failed to delete group" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Group "${group.name}" has been permanently deleted`,
    });
  } catch (error) {
    console.error("[DELETE_GROUP_DELETE]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
