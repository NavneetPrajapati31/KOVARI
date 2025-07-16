import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase";
import { getUserUuidByClerkId } from "@/shared/utils/getUserUuidByClerkId";

export async function POST(req: NextRequest) {
  try {
    const { image_url, title, content } = await req.json();

    // Get Clerk user ID from session
    const authResult = await auth();
    const userId = authResult.userId;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Map Clerk ID to your internal user UUID
    const user_id = await getUserUuidByClerkId(userId);
    if (!user_id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!image_url) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_posts")
      .insert([{ user_id, image_url, title: title ?? null, content }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
