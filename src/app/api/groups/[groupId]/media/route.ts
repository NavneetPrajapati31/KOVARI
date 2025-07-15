import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "groups");

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
      .select("id, url, type, uploaded_by, created_at")
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

    // Save file to local uploads directory
    const ext = file.type.split("/")[1] || "bin";
    const filename = `${uuidv4()}.${ext}`;
    const groupDir = path.join(UPLOADS_DIR, groupId);
    await fs.mkdir(groupDir, { recursive: true });
    const filePath = path.join(groupDir, filename);
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));
    console.log(`[MEDIA][POST] Saved file to: ${filePath}`);
    // Confirm file exists
    try {
      await fs.access(filePath);
      console.log(`[MEDIA][POST] File confirmed at: ${filePath}`);
    } catch (err) {
      console.error(`[MEDIA][POST] File not found after write: ${filePath}`);
    }
    // Public URL for the file (dynamic API route)
    const url = `/api/uploads/groups/${groupId}/${filename}`;
    console.log(`[MEDIA][POST] File URL: ${url}`);

    // Insert into group_media table
    const { data: insertData, error: insertError } = await supabase
      .from("group_media")
      .insert({
        group_id: groupId,
        url,
        type,
        uploaded_by: uploadedBy,
      })
      .select("id, url, type, uploaded_by, created_at")
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
