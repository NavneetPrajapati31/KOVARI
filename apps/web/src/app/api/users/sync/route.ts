import { NextRequest, NextResponse } from "next/server";
import { resolveUser } from "@/lib/auth/resolveUser";

export async function POST(request: NextRequest) {
  try {
    // resolveUser handles:
    // 1. Validation (Clerk session + Verified Email)
    // 2. Find (Check existing DB record)
    // 3. Provision (Atomic User + Profile creation)
    const result = await resolveUser(request, { mode: 'protected' });

    if (!result.ok) {
      const status = result.reason === 'IDENTITY_CONFLICT' ? 409 : 401;
      return NextResponse.json(
        { error: result.message, reason: result.reason },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      userId: result.user.userId,
      provider: result.user.provider
    });

  } catch (error) {
    console.error("Error in /api/users/sync:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}


