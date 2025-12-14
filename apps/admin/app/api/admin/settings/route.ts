import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/admin-lib/adminAuth";
import { supabaseAdmin } from "@/admin-lib/supabaseAdmin";
import { logAdminAction } from "@/admin-lib/logAdminAction";

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();

    // Fetch all three settings
    const { data, error } = await supabaseAdmin
      .from("system_settings")
      .select("key, value")
      .in("key", ["maintenance_mode", "matching_preset", "session_ttl_hours"]);

    if (error) {
      console.error("Settings fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch settings" },
        { status: 500 }
      );
    }

    // Parse settings from the database format
    const settingsMap = new Map(
      data?.map((item) => [item.key, item.value]) || []
    );

    // Extract values with defaults
    const maintenanceValue = settingsMap.get("maintenance_mode") as
      | { enabled: boolean }
      | undefined;
    const presetValue = settingsMap.get("matching_preset") as
      | { mode: string }
      | undefined;
    const ttlValue = settingsMap.get("session_ttl_hours") as
      | { hours: number }
      | undefined;

    return NextResponse.json({
      session_ttl_hours: ttlValue?.hours ?? 168, // Default: 7 days
      maintenance_mode: maintenanceValue?.enabled ?? false,
      matching_preset: (presetValue?.mode ?? "BALANCED").toUpperCase(),
    });
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

    // Fetch current settings to capture old values for audit logging
    const { data: currentSettings, error: fetchError } = await supabaseAdmin
      .from("system_settings")
      .select("key, value")
      .in("key", ["maintenance_mode", "matching_preset", "session_ttl_hours"]);

    if (fetchError) {
      console.error("Error fetching current settings:", fetchError);
    }

    const settingsMap = new Map(
      currentSettings?.map((item) => [item.key, item.value]) || []
    );

    // Extract old values
    const oldMaintenanceValue = settingsMap.get("maintenance_mode") as
      | { enabled: boolean }
      | undefined;
    const oldPresetValue = settingsMap.get("matching_preset") as
      | { mode: string }
      | undefined;
    const oldTtlValue = settingsMap.get("session_ttl_hours") as
      | { hours: number }
      | undefined;

    const oldValue = {
      session_ttl_hours: oldTtlValue?.hours ?? 168,
      maintenance_mode: oldMaintenanceValue?.enabled ?? false,
      matching_preset: (oldPresetValue?.mode ?? "balanced").toUpperCase(),
    };

    const sessionTtlHours = Number(body.sessionTtlHours ?? 168);
    const maintenanceMode = !!body.maintenanceMode;
    const matchingPreset = (body.matchingPreset || "BALANCED").toUpperCase();

    if (
      Number.isNaN(sessionTtlHours) ||
      sessionTtlHours < 1 ||
      sessionTtlHours > 168
    ) {
      return NextResponse.json(
        { error: "sessionTtlHours must be between 1 and 168 (7 days)" },
        { status: 400 }
      );
    }

    const validPresets = ["SAFE", "BALANCED", "STRICT"];
    if (!validPresets.includes(matchingPreset)) {
      return NextResponse.json(
        { error: "matchingPreset must be one of: SAFE, BALANCED, STRICT" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update each setting as a separate row in system_settings
    const updates = [
      {
        key: "maintenance_mode",
        value: { enabled: maintenanceMode },
        updated_by: adminId,
        updated_at: now,
      },
      {
        key: "matching_preset",
        value: { mode: matchingPreset.toLowerCase() },
        updated_by: adminId,
        updated_at: now,
      },
      {
        key: "session_ttl_hours",
        value: { hours: sessionTtlHours },
        updated_by: adminId,
        updated_at: now,
      },
    ];

    // Upsert all settings
    const { error } = await supabaseAdmin
      .from("system_settings")
      .upsert(updates, { onConflict: "key" });

    if (error) {
      console.error("Settings update error:", error);
      return NextResponse.json(
        { error: "Failed to update settings" },
        { status: 500 }
      );
    }

    const newValue = {
      session_ttl_hours: sessionTtlHours,
      maintenance_mode: maintenanceMode,
      matching_preset: matchingPreset,
    };

    // Log admin action with old and new values
    await logAdminAction({
      adminId,
      targetType: "settings",
      targetId: null,
      action: "UPDATE_SETTINGS",
      reason: body.reason ?? null,
      metadata: {
        oldValue,
        newValue,
      },
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
