
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    const body = await request.json();
    const { interestId, action } = body;

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!interestId || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    const status = action === 'accept' ? 'accepted' : 'rejected';

    const { error } = await supabaseAdmin
      .from("match_interests")
      .update({ status })
      .eq("id", interestId);

    if (error) {
      console.error("Error updating interest:", error);
      return NextResponse.json(
        { error: "Failed to update interest" },
        { status: 500 }
      );
    }
    
    // If accepted, we might want to ensure a reciprocal match or chat creation here
    // But for this specific task of UI replication, updating status is sufficient.

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
