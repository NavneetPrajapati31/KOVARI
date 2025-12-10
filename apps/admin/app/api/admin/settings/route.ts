import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/admin-lib/adminAuth";
import { supabaseAdmin } from "@/admin-lib/supabaseAdmin";
import { logAdminAction } from "@/admin-lib/logAdminAction";

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();

    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("key, value")
      .eq("key", "matching")
      .maybeSingle();

    if (error) {
      console.error("Settings fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch settings" },
        { status: 500 }
      );
    }

    const value = data?.value || {
      session_ttl_hours: 24,
      maintenance_mode: false,
    };

    return NextResponse.json(value);
  } catch (err: unknown) {
    console.error("Admin settings GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { adminId } = await requireAdmin();
    const body = await req.json();

    const sessionTtlHours = Number(body.sessionTtlHours ?? 24);
    const maintenanceMode = !!body.maintenanceMode;

    if (
      Number.isNaN(sessionTtlHours) ||
      sessionTtlHours < 1 ||
      sessionTtlHours > 72
    ) {
      return NextResponse.json(
        { error: "sessionTtlHours must be between 1 and 72" },
        { status: 400 }
      );
    }

    const newValue = {
      session_ttl_hours: sessionTtlHours,
      maintenance_mode: maintenanceMode,
    };

    const { error } = await supabaseAdmin.from("settings").upsert(
      {
        key: "matching",
        value: newValue,
      },
      { onConflict: "key" }
    );

    if (error) {
      console.error("Settings update error:", error);
      return NextResponse.json(
        { error: "Failed to update settings" },
        { status: 500 }
      );
    }

    await logAdminAction({
      adminId,
      targetType: "settings",
      targetId: null,
      action: "update_matching_settings",
      reason: body.reason ?? null,
      metadata: newValue,
    });

    return NextResponse.json({ success: true, value: newValue });
  } catch (err: unknown) {
    console.error("Admin settings POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
