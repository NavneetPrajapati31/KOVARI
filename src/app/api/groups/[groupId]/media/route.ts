import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { v4 as uuidv4 } from "uuid";
import { uploadToCloudinary } from "@/lib/cloudinary";

function getGroupIdFromUrl(request: NextRequest): string | null {
  const match = request.nextUrl.pathname.match(/groups\/([^/]+)\/media/);
  return match ? match[1] : null;
}

async function getMediaAccessContext(groupId: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  const supabase = createAdminSupabaseClient();

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .eq("isDeleted", false)
    .single();
  if (userError || !userRow) {
    return { ok: false as const, status: 404, error: "User not found" };
  }

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, status, creator_id")
    .eq("id", groupId)
    .single();
  if (groupError || !group) {
    return { ok: false as const, status: 404, error: "Group not found" };
  }
  if (group.status === "removed") {
    return { ok: false as const, status: 404, error: "Group not found" };
  }

  const isCreator = group.creator_id === userRow.id;
  if (group.status === "pending" && !isCreator) {
    return { ok: false as const, status: 404, error: "Group not found" };
  }

  let isAcceptedMember = false;
  let role: string | null = null;
  if (!isCreator) {
    const { data: membership } = await supabase
      .from("group_memberships")
      .select("status, role")
      .eq("group_id", groupId)
      .eq("user_id", userRow.id)
      .maybeSingle();
    isAcceptedMember = membership?.status === "accepted";
    role = membership?.role ?? null;
    if (!isAcceptedMember) {
      return {
        ok: false as const,
        status: 403,
        error: "Not a member of this group",
      };
    }
  } else {
    isAcceptedMember = true;
    role = "admin";
  }

  return {
    ok: true as const,
    supabase,
    userId: userRow.id,
    isCreator,
    isAcceptedMember,
    role,
  };
}

export async function GET(request: NextRequest) {
  try {
    const groupId = getGroupIdFromUrl(request);
    if (!groupId) {
      console.error("[MEDIA][GET] Missing groupId");
      return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
    }
    const ctx = await getMediaAccessContext(groupId);
    if (!ctx.ok) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }
    const supabase = ctx.supabase;
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
    const ctx = await getMediaAccessContext(groupId);
    if (!ctx.ok) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }
    const supabase = ctx.supabase;

    // Parse multipart form
    const formData = await request.formData();
    const file = formData.get("file");
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
        uploaded_by: ctx.userId,
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
