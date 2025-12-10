// apps/admin/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/admin-lib/supabaseAdmin";
import { requireAdmin } from "@/admin-lib/adminAuth";

interface Params {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const profileId = params.id;

    // Get profile + banned state
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select(
        `
        id,
        user_id,
        name,
        email,
        age,
        gender,
        nationality,
        bio,
        languages,
        profile_photo,
        verified,
        deleted,
        smoking,
        drinking,
        religion,
        personality,
        interests,
        users!profiles_user_id_fkey(
          banned,
          ban_reason,
          ban_expires_at
        )
      `
      )
      .eq("id", profileId)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch user" },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch flags
    const { data: flags, error: flagsError } = await supabaseAdmin
      .from("user_flags")
      .select("*")
      .eq("user_id", profile.user_id)
      .order("created_at", { ascending: false });

    if (flagsError) {
      console.error("Error fetching user flags:", flagsError);
    }

    return NextResponse.json({
      profile,
      flags: flags ?? [],
    });
  } catch (err: unknown) {
    console.error("Admin user detail error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
