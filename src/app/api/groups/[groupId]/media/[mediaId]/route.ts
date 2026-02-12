import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { deleteFromCloudinary } from "@/lib/cloudinary";

function getParamsFromUrl(request: NextRequest): {
  groupId: string | null;
  mediaId: string | null;
} {
  const match = request.nextUrl.pathname.match(
    /groups\/([^/]+)\/media\/([^/]+)/
  );
  return {
    groupId: match ? match[1] : null,
    mediaId: match ? match[2] : null,
  };
}

export async function DELETE(request: NextRequest) {
  try {
    const { groupId, mediaId } = getParamsFromUrl(request);
    if (!groupId || !mediaId) {
      console.error("[MEDIA][DELETE] Missing groupId or mediaId");
      return NextResponse.json(
        { error: "Missing groupId or mediaId" },
        { status: 400 }
      );
    }

    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();

    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .eq("isDeleted", false)
      .single();
    if (userError || !userRow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, status, creator_id")
      .eq("id", groupId)
      .single();
    if (groupError || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    if (group.status === "removed") {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const isCreator = group.creator_id === userRow.id;
    let isAdmin = isCreator;
    let isAcceptedMember = isCreator;
    if (!isCreator) {
      const { data: membership } = await supabase
        .from("group_memberships")
        .select("status, role")
        .eq("group_id", groupId)
        .eq("user_id", userRow.id)
        .maybeSingle();
      isAcceptedMember = membership?.status === "accepted";
      isAdmin = membership?.role === "admin";
      if (!isAcceptedMember) {
        return NextResponse.json(
          { error: "Not a member of this group" },
          { status: 403 },
        );
      }
    }

    // Get the media record first
    const { data: mediaData, error: fetchError } = await supabase
      .from("group_media")
      .select("id, url, cloudinary_public_id, uploaded_by")
      .eq("id", mediaId)
      .eq("group_id", groupId)
      .single();

    if (fetchError || !mediaData) {
      console.error("[MEDIA][DELETE] Media not found:", fetchError);
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Only uploader, group admin, or creator can delete media
    const isUploader = mediaData.uploaded_by === userRow.id;
    if (!isUploader && !isAdmin && !isCreator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete from Cloudinary if it's a Cloudinary URL
    if (mediaData.cloudinary_public_id) {
      try {
        await deleteFromCloudinary(mediaData.cloudinary_public_id);
        console.log(
          `[MEDIA][DELETE] Deleted from Cloudinary: ${mediaData.cloudinary_public_id}`
        );
      } catch (cloudinaryError) {
        console.error(
          "[MEDIA][DELETE] Cloudinary delete error:",
          cloudinaryError
        );
        // Continue with database deletion even if Cloudinary fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("group_media")
      .delete()
      .eq("id", mediaId)
      .eq("group_id", groupId);

    if (deleteError) {
      console.error("[MEDIA][DELETE] Database delete error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    console.log(`[MEDIA][DELETE] Successfully deleted media: ${mediaId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[MEDIA][DELETE] Unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
