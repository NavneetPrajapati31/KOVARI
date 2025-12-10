// apps/admin/app/api/admin/groups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/admin-lib/supabaseAdmin";
import { requireAdmin } from "@/admin-lib/adminAuth";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status"); // optional
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let base = supabaseAdmin
      .from("groups")
      .select(
        `
        id,
        name,
        destination,
        start_date,
        end_date,
        is_public,
        members_count,
        budget,
        status,
        flag_count,
        creator_id
      `
      )
      .order("created_at", { ascending: false });

    if (status) {
      base = base.eq("status", status);
    }

    const { data, error } = await base.range(from, to);

    if (error) {
      console.error("Groups list error:", error);
      return NextResponse.json(
        { error: "Failed to fetch groups" },
        { status: 500 }
      );
    }

    return NextResponse.json({ page, limit, groups: data });
  } catch (err: unknown) {
    console.error("Admin groups GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
