import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[api/supabase/sync-user] Missing server env", {
      hasUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
    });
    return NextResponse.json(
      { error: "Server not configured" },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  try {
    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          clerk_user_id: userId,
        },
        { onConflict: "clerk_user_id" },
      )
      .select('id, "isDeleted"')
      .single();

    if (error) {
      console.error("[api/supabase/sync-user] Upsert failed", {
        clerkUserId: userId,
        code: error.code,
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
      });
      Sentry.captureException(error, {
        tags: { endpoint: "/api/supabase/sync-user", action: "upsert_user" },
        extra: { clerkUserId: userId },
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if ((data as any)?.isDeleted === true) {
      return NextResponse.json(
        { error: "Account has been deleted" },
        { status: 403 },
      );
    }

    return NextResponse.json({ ok: true, userId: data.id }, { status: 200 });
  } catch (e) {
    console.error("[api/supabase/sync-user] Unexpected error", e);
    Sentry.captureException(e, {
      tags: { endpoint: "/api/supabase/sync-user", action: "handler_error" },
      extra: { clerkUserId: userId },
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

