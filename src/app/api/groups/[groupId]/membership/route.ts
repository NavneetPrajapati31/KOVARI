import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { userId } = await auth();
    const { groupId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!groupId) {
      return new NextResponse("Missing groupId", { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.delete(name);
          },
        },
      }
    );

    // Get user UUID from Clerk userId
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .single();

    if (userError || !user) {
      console.error("Error finding user:", userError);
      return new NextResponse("User not found", { status: 404 });
    }

    // Get group info to check if user is creator
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, creator_id")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return new NextResponse("Group not found", { status: 404 });
    }

    // Get user's membership info
    const { data: membership, error: membershipError } = await supabase
      .from("group_memberships")
      .select("id, role, status, joined_at")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    const isCreator = group.creator_id === user.id;
    const isMember = membership && membership.status === "accepted";
    const isAdmin = membership && membership.role === "admin";

    return NextResponse.json({
      isCreator,
      isMember,
      isAdmin,
      membership: membership || null,
    });
  } catch (error) {
    console.error("[MEMBERSHIP_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
