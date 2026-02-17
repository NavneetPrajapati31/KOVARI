import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { sendWaitlistConfirmation } from "@/lib/send-waitlist-confirmation";

const MAX_PER_RUN = 50;
/** Only retry entries older than this (gives initial send time to complete) */
const MIN_AGE_MINUTES = 10;
/** Only process entries from last 7 days (avoids duplicate emails for pre-migration rows) */
const MAX_AGE_DAYS = 7;

/**
 * GET /api/cron/send-waitlist-emails
 * Processes waitlist entries that haven't received a confirmation email.
 * Call from Vercel Cron or external scheduler. Secure with CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();

  const now = Date.now();
  const minCreated = new Date(now - MIN_AGE_MINUTES * 60 * 1000).toISOString();
  const maxCreated = new Date(now - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // confirmation_email_sent_at is null, created at least MIN_AGE_MINUTES ago, and within last MAX_AGE_DAYS
  const { data: pending, error } = await supabase
    .from("waitlist")
    .select("id, email")
    .is("confirmation_email_sent_at", null)
    .lt("created_at", minCreated)
    .gt("created_at", maxCreated)
    .order("created_at", { ascending: true })
    .limit(MAX_PER_RUN);

  if (error) {
    console.error("[cron/send-waitlist-emails] Query error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending emails", details: error.message },
      { status: 500 }
    );
  }

  if (!pending?.length) {
    return NextResponse.json({ ok: true, processed: 0, message: "No pending emails" });
  }

  let sent = 0;
  for (const row of pending) {
    const ok = await sendWaitlistConfirmation({
      to: row.email,
      waitlistId: row.id,
    });
    if (ok) sent++;
  }

  return NextResponse.json({
    ok: true,
    processed: pending.length,
    sent,
    failed: pending.length - sent,
  });
}
