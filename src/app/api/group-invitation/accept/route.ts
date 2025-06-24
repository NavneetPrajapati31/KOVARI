import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  console.log("ACCEPT INVITE API CALLED");
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }
    const { token } = await req.json();
    if (!token) {
      return new Response("Missing token", { status: 400 });
    }
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          },
          set: (name, value, options) => {
            cookieStore.set(name, value, options);
          },
          remove: (name) => {
            cookieStore.delete(name);
          },
        },
      }
    );
    // Get invite by token
    const { data: invite, error: inviteError } = await supabase
      .from("group_email_invitations")
      .select("*")
      .eq("token", token)
      .maybeSingle();
    if (inviteError) {
      console.error("Error fetching invite:", inviteError);
      return new Response("Database error", { status: 500 });
    }
    if (!invite || invite.status !== "pending") {
      console.error("Invalid or expired invitation", { invite });
      return new Response("Invalid or expired invitation", { status: 400 });
    }
    // Get user UUID from Clerk userId
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .maybeSingle();
    if (userError || !userRow) {
      console.error("User not found", { userError, userRow });
      return new Response("User not found", { status: 404 });
    }

    // Check if group is full (10 members limit)
    const { data: memberCount, error: countError } = await supabase
      .from("group_memberships")
      .select("id", { count: "exact" })
      .eq("group_id", invite.group_id)
      .eq("status", "accepted");

    if (countError) {
      console.error("Error checking member count:", countError);
      return new Response("Failed to check member count", { status: 500 });
    }

    if (memberCount && memberCount.length >= 10) {
      return new Response("Group is full (maximum 10 members)", {
        status: 400,
      });
    }

    // Add user to group_memberships if not already a member
    const { data: existing, error: existError } = await supabase
      .from("group_memberships")
      .select("id")
      .eq("group_id", invite.group_id)
      .eq("user_id", userRow.id)
      .maybeSingle();
    if (!existing) {
      const { error: insertError } = await supabase
        .from("group_memberships")
        .insert({
          group_id: invite.group_id,
          user_id: userRow.id,
          status: "accepted",
          joined_at: new Date().toISOString(),
        });
      if (insertError) {
        console.error("Error adding user to group:", insertError);
        return new Response("Failed to join group", { status: 500 });
      }
    }
    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from("group_email_invitations")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("token", token);
    if (updateError) {
      console.error("Error updating invitation status:", updateError);
      return new Response("Failed to update invitation", { status: 500 });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[ACCEPT_INVITE_POST]", error);
    return new Response(
      error instanceof Error ? error.message : String(error),
      { status: 500 }
    );
  }
}
