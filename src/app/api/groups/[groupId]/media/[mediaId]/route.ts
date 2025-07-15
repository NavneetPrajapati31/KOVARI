import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
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

    const supabase = createRouteHandlerSupabaseClient();

    // Get the media record first
    const { data: mediaData, error: fetchError } = await supabase
      .from("group_media")
      .select("id, url, cloudinary_public_id")
      .eq("id", mediaId)
      .eq("group_id", groupId)
      .single();

    if (fetchError || !mediaData) {
      console.error("[MEDIA][DELETE] Media not found:", fetchError);
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
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
