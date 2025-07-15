import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { uploadToCloudinary } from "@/lib/cloudinary";

function getGroupIdFromUrl(request: NextRequest): string | null {
  const match = request.nextUrl.pathname.match(/groups\/([^/]+)\/media/);
  return match ? match[1] : null;
}

export async function GET(request: NextRequest) {
  try {
    const groupId = getGroupIdFromUrl(request);
    if (!groupId) {
      console.error("[MEDIA][GET] Missing groupId");
      return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
    }
    const supabase = createRouteHandlerSupabaseClient();
    const { data, error } = await supabase
      .from("group_media")
      .select("id, url, type, uploaded_by, created_at, cloudinary_public_id")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[MEDIA][GET] DB error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("[MEDIA][GET] Unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const groupId = getGroupIdFromUrl(request);
    if (!groupId) {
      console.error("[MEDIA][POST] Missing groupId");
      return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
    }
    const supabase = createRouteHandlerSupabaseClient();

    // Parse multipart form
    const formData = await request.formData();
    const file = formData.get("file");
    const uploadedBy = formData.get("uploaded_by");
    if (!uploadedBy) {
      console.error("[MEDIA][POST] No uploaded_by (userId) provided");
      return NextResponse.json(
        { error: "No uploaded_by (userId) provided" },
        { status: 400 }
      );
    }
    if (!file || !(file instanceof Blob)) {
      console.error("[MEDIA][POST] No file uploaded");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    const type = file.type.startsWith("video")
      ? "video"
      : file.type.startsWith("image")
        ? "image"
        : null;
    if (!type) {
      console.error("[MEDIA][POST] Invalid file type:", file.type);
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Upload to Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await uploadToCloudinary(buffer, {
      folder: `kovari-groups/${groupId}`,
      resource_type: type === "video" ? "video" : "image",
      public_id: `${uuidv4()}`,
    });

    console.log(`[MEDIA][POST] Uploaded to Cloudinary: ${uploadResult.url}`);
    const url = uploadResult.secure_url;

    // Insert into group_media table
    const { data: insertData, error: insertError } = await supabase
      .from("group_media")
      .insert({
        group_id: groupId,
        url,
        type,
        uploaded_by: uploadedBy,
        cloudinary_public_id: uploadResult.public_id, // Store Cloudinary public ID for future deletion
      })
      .select("id, url, type, uploaded_by, created_at, cloudinary_public_id")
      .single();
    if (insertError) {
      console.error("[MEDIA][POST] DB insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    console.log("[MEDIA][POST] DB insert result:", insertData);
    return NextResponse.json(insertData, { status: 201 });
  } catch (err) {
    console.error("[MEDIA][POST] Unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
