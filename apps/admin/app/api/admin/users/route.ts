// apps/admin/app/api/admin/users/route.ts
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
  } catch (error) {
    // requireAdmin throws NextResponse for unauthorized/forbidden
    if (error instanceof NextResponse) {
      return error;
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("query") || "").trim();
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let base = supabaseAdmin.from("profiles").select(
      `
        id,
        user_id,
        name,
        email,
        age,
        gender,
        nationality,
        verified,
        deleted,
        smoking,
        drinking,
        profile_photo,
        created_at,
        users!profiles_user_id_fkey(
          banned,
          ban_reason,
          ban_expires_at
        )
      `
    );

    if (query) {
      base = base.ilike("name", `%${query}%`);
    }

    const { data, error } = await base.range(from, to);

    if (error) {
      console.error("Error fetching profiles:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Fetch flag counts for each user
    const userIds = data?.map((user) => user.user_id).filter(Boolean) || [];
    const flagCounts: Record<string, number> = {};

    if (userIds.length > 0) {
      const { data: flagsData } = await supabaseAdmin
        .from("user_flags")
        .select("user_id")
        .in("user_id", userIds);

      if (flagsData) {
        flagsData.forEach((flag) => {
          flagCounts[flag.user_id] = (flagCounts[flag.user_id] || 0) + 1;
        });
      }
    }

    // Add flag_count to each user
    const usersWithFlags =
      data?.map((user) => ({
        ...user,
        flag_count: flagCounts[user.user_id] || 0,
      })) || [];

    return NextResponse.json({
      page,
      limit,
      users: usersWithFlags,
    });
  } catch (error) {
    await incrementErrorCounter();
    Sentry.captureException(error, {
      tags: {
        scope: "admin-api",
        route: "GET /api/admin/users",
      },
    });
    throw error;
  }
}
