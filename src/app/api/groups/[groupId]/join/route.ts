import { auth } from "@clerk/nextjs/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    const { groupId } = await params;

    if (!clerkUserId) {
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
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set(name, value, options);
          },
          remove(name: string) {
            cookieStore.delete(name);
          },
        },
      }
    );

    let targetClerkUserId = clerkUserId;
    let body: any = {};
    try {
      body = await req.json();
      if (
        body.userId &&
        typeof body.userId === "string" &&
        body.userId !== clerkUserId
      ) {
        // Check if current user is admin of the group
        const { data: adminMembership, error: adminError } = await supabase
          .from("group_memberships")
          .select("role")
          .eq("group_id", groupId)
          .eq("status", "accepted")
          .eq(
            "user_id",
            (
              await supabase
                .from("users")
                .select("id")
                .eq("clerk_user_id", clerkUserId)
                .single()
            ).data?.id
          )
          .maybeSingle();
        if (adminError) {
          return new NextResponse("Database error", { status: 500 });
        }
        if (adminMembership && adminMembership.role === "admin") {
          targetClerkUserId = body.userId;
        } else {
          return new NextResponse(
            "Only admins can approve join requests for others",
            { status: 403 }
          );
        }
      }
    } catch (e) {
      // ignore, fallback to default
    }

    // Get user UUID from Clerk userId (target)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", targetClerkUserId)
      .single();

    if (userError || !user) {
      console.error("Error finding user:", userError);
      return new NextResponse("User not found", { status: 404 });
    }

    const { error: upsertError } = await supabase
      .from("group_memberships")
      .upsert(
        {
          group_id: groupId,
          user_id: user.id,
          status: "accepted",
          role: "member",
          joined_at: new Date().toISOString(),
        },
        { onConflict: "group_id, user_id" }
      );

    if (upsertError) {
      console.error("Error joining group:", upsertError);
      return new NextResponse("Database error", { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[GROUP_JOIN_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
