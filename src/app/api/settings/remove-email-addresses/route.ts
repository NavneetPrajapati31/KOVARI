import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * MVP NOTE:
 * This endpoint is intentionally a NO-OP.
 *
 * Why:
 * - We do NOT auto-delete secondary emails because they may be used for account
 *   recovery and user access (especially during OAuth-based sign-in flows).
 * - We do NOT attempt to unlink OAuth identities (Google/Apple/Facebook) because
 *   that can break login and lock users out of their accounts.
 *
 * Change-email MVP behavior: only set the newly verified email as primary.
 */
export async function POST(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      success: true,
      disabled: true,
      message:
        "MVP: Email removal/unlinking is disabled. Existing emails remain attached.",
    },
    { status: 200 },
  );
}
