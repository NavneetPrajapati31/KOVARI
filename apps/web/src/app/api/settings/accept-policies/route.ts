import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** GET /api/settings/accept-policies
 *  Returns the stored policy acceptance info for the current user.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("users")
    .select(
      "terms_accepted_at, privacy_accepted_at, guidelines_accepted_at, terms_version, privacy_version, guidelines_version"
    )
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("accept-policies GET error:", error);
    return NextResponse.json({ error: "Failed to fetch policy data" }, { status: 500 });
  }

  return NextResponse.json(data ?? {});
}

/** POST /api/settings/accept-policies
 *  Body: { termsVersion, privacyVersion, guidelinesVersion }
 *  Writes acceptance timestamps + versions to the users row.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { termsVersion?: string; privacyVersion?: string; guidelinesVersion?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { termsVersion, privacyVersion, guidelinesVersion } = body;
  if (!termsVersion || !privacyVersion || !guidelinesVersion) {
    return NextResponse.json({ error: "Missing version fields" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const supabase = getAdminSupabase();

  const { error } = await supabase
    .from("users")
    .update({
      terms_accepted_at: now,
      privacy_accepted_at: now,
      guidelines_accepted_at: now,
      terms_version: termsVersion,
      privacy_version: privacyVersion,
      guidelines_version: guidelinesVersion,
    })
    .eq("clerk_user_id", userId);

  if (error) {
    console.error("accept-policies POST error:", error);
    return NextResponse.json({ error: "Failed to save policy acceptance" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

