// apps/admin/app/api/admin/flags/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/admin-lib/supabaseAdmin";
import { requireAdmin } from "@/admin-lib/adminAuth";
import * as Sentry from "@sentry/nextjs";
import { incrementErrorCounter } from "@/admin-lib/incrementErrorCounter";

export async function GET(req: NextRequest) {
  try {
    const { adminId, email } = await requireAdmin();
    Sentry.setUser({
      id: adminId,
      email: email,
    });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabaseAdmin
      .from("user_flags")
      .select(
        `
        id,
        user_id,
        reporter_id,
        type,
        reason,
        evidence_url,
        status,
        created_at,
        profiles:profiles!user_flags_user_id_fkey (id, name, email, profile_photo)
      `
      )
      .eq("status", status)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Flags list error:", error);
      return NextResponse.json(
        { error: "Failed to fetch flags" },
        { status: 500 }
      );
    }

    return NextResponse.json({ page, limit, flags: data });
  } catch (error) {
    await incrementErrorCounter();
    Sentry.captureException(error, {
      tags: {
        scope: "admin-api",
        route: "GET /api/admin/flags",
      },
    });
    throw error;
  }
}
