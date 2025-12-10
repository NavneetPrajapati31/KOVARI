// apps/admin/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/adminAuth";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  try {
    await requireAdmin(); // 🔐 gate

    // Example query:
    const supabaseAdmin = createRouteHandlerSupabaseClient();
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, email, display_name, verified, banned")
      .limit(50);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "DB_ERROR" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown admin auth error";
    console.error("Admin auth error:", message);
    // You can also distinguish error types: UNAUTHENTICATED / NOT_ADMIN / ...
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
}
