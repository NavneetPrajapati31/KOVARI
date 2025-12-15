// apps/admin/app/api/admin/audit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/admin-lib/supabaseAdmin";
import { requireAdmin } from "@/admin-lib/adminAuth";
import { toCsv } from "@/admin-lib/toCsv";
import * as Sentry from "@sentry/nextjs";

export async function GET(req: NextRequest) {
  try {
    const { adminId, email } = await requireAdmin();
    Sentry.setUser({
      id: adminId,
      email: email,
    });

    const { searchParams } = new URL(req.url);

    const format = searchParams.get("format") || "json";
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "50");
    const from = searchParams.get("from"); // ISO date string
    const to = searchParams.get("to");
    const filterAdminId = searchParams.get("adminId");
    const targetType = searchParams.get("targetType");
    const action = searchParams.get("action");

    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseAdmin
      .from("admin_actions")
      .select(
        `
        id,
        admin_id,
        target_type,
        target_id,
        action,
        reason,
        metadata,
        created_at,
        admins:admin_id (
          id,
          email
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);
    if (filterAdminId) query = query.eq("admin_id", filterAdminId);
    if (targetType) query = query.eq("target_type", targetType);
    if (action) {
      // Case-insensitive action matching using ilike
      query = query.ilike("action", action);
    }

    // For CSV we usually want "all" in range, not just paged.
    // MVP: use same pagination – you can change later.
    const { data, error, count } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) {
      console.error("Audit log fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch audit log" },
        { status: 500 }
      );
    }

    // JSON mode (default)
    if (format !== "csv") {
      return NextResponse.json({
        page,
        limit,
        total: count ?? 0,
        actions: data,
      });
    }

    // CSV mode
    const headers = [
      "timestamp",
      "admin_email",
      "target_type",
      "target_id",
      "action",
      "reason",
      "metadata_json",
    ];

    const rows =
      data?.map(
        (row: {
          created_at: string;
          admins?:
            | { id: string; email: string }
            | { id: string; email: string }[]
            | null;
          target_type: string;
          target_id: string;
          action: string;
          reason?: string;
          metadata?: Record<string, unknown>;
        }) => {
          const admin = Array.isArray(row.admins) ? row.admins[0] : row.admins;
          return [
            row.created_at,
            admin?.email ?? "",
            row.target_type,
            row.target_id,
            row.action ?? "",
            row.reason ?? "",
            row.metadata ? JSON.stringify(row.metadata) : "",
          ];
        }
      ) ?? ([] as string[][]);

    const csvString = toCsv(headers, rows as string[][]);

    const filename = `kovari-audit-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    return new Response(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        scope: "admin-api",
        route: "GET /api/admin/audit",
      },
    });
    throw error;
  }
}
