import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { createAdminSupabaseClient } from "@kovari/api";

export const dynamic = "force-dynamic";

/** GET /api/settings/accept-policies
 *  Returns the stored policy acceptance info for the current user.
 */
export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      "terms_accepted_at, privacy_accepted_at, guidelines_accepted_at, terms_version, privacy_version, guidelines_version"
    )
    .eq("id", authUser.id)
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
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  const supabase = createAdminSupabaseClient();

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
    .eq("id", authUser.id);

  if (error) {
    console.error("accept-policies POST error:", error);
    return NextResponse.json({ error: "Failed to save policy acceptance" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

