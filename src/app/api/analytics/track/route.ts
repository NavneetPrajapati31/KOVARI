import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event_name, event_data, session_id } = body;

    if (!event_name) {
      return NextResponse.json({ error: "Event name is required" }, { status: 400 });
    }

    // Insert event into database
    // We don't await this to keep the response fast for the user (non-blocking)
    const logPromise = createAdminSupabaseClient()
      .from("analytics_events")
      .insert({
        event_name,
        event_data: event_data || {},
        session_id: session_id || null,
      });

    // In a real production app, we might use a queue or after() hook if supported
    // For now, we'll just fire and forget or await briefly
    await logPromise;

    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    console.error("Analytics tracking error:", error);
    return NextResponse.json({ error: "Failed to log event" }, { status: 500 });
  }
}
