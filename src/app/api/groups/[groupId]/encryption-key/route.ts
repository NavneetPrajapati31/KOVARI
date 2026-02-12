import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import {
  generateGroupKey,
  generateKeyFingerprint,
} from "@/shared/utils/encryption";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;
  if (!groupId) {
    return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  // Map Clerk -> internal UUID
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", userId)
    .eq("isDeleted", false)
    .single();

  if (userError || !userRow) {
    console.error("[encryption-key] user lookup failed", {
      code: userError?.code,
      message: userError?.message,
    });
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Group existence + basic access rules
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
  if (group.status === "pending" && !isCreator) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (!isCreator) {
    const { data: membership } = await supabase
      .from("group_memberships")
      .select("status")
      .eq("group_id", groupId)
      .eq("user_id", userRow.id)
      .maybeSingle();

    if (membership?.status !== "accepted") {
      return NextResponse.json(
        { error: "Not a member of this group" },
        { status: 403 },
      );
    }
  }

  // Fetch existing shared key for this group (if any)
  const { data: existingKey, error: existingErr } = await supabase
    .from("group_encryption_keys")
    .select("group_id, encryption_key, key_fingerprint, created_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingErr) {
    console.error("[encryption-key] fetch existing failed", {
      code: existingErr.code,
      message: existingErr.message,
    });
    return NextResponse.json(
      { error: "Failed to fetch encryption key" },
      { status: 500 },
    );
  }

  if (existingKey) {
    return NextResponse.json(
      {
        groupId: existingKey.group_id,
        key: existingKey.encryption_key,
        fingerprint: existingKey.key_fingerprint,
        createdAt: existingKey.created_at,
      },
      { status: 200 },
    );
  }

  // Create a new shared key for the group
  const newKeyData = generateGroupKey();
  const fingerprint = generateKeyFingerprint(newKeyData.key);

  const insertPayload = {
    group_id: groupId,
    user_id: userRow.id,
    encryption_key: newKeyData.key,
    key_fingerprint: fingerprint,
    created_at: newKeyData.createdAt,
  };

  const { data: inserted, error: insertErr } = await supabase
    .from("group_encryption_keys")
    .insert(insertPayload)
    .select("group_id, encryption_key, key_fingerprint, created_at")
    .single();

  if (insertErr || !inserted) {
    // If another member created it concurrently, refetch.
    console.error("[encryption-key] insert failed", {
      code: insertErr?.code,
      message: insertErr?.message,
    });

    const { data: retryKey } = await supabase
      .from("group_encryption_keys")
      .select("group_id, encryption_key, key_fingerprint, created_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (retryKey) {
      return NextResponse.json(
        {
          groupId: retryKey.group_id,
          key: retryKey.encryption_key,
          fingerprint: retryKey.key_fingerprint,
          createdAt: retryKey.created_at,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create encryption key" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      groupId: inserted.group_id,
      key: inserted.encryption_key,
      fingerprint: inserted.key_fingerprint,
      createdAt: inserted.created_at,
    },
    { status: 200 },
  );
}
