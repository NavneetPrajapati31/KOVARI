import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { groupId, action } = await req.json();

    if (!groupId || !action || !["accept", "decline"].includes(action)) {
      return new Response("Invalid request", { status: 400 });
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
          remove: (name, options) => {
            cookieStore.delete(name);
          },
        },
      }
    );

    // Get the internal Supabase user_id from the clerk_user_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user:", userError);
      return new Response("User not found", { status: 404 });
    }

    const internalUserId = userData.id;

    if (action === "accept") {
      // Update membership status to accepted
      const { error: updateError } = await supabase
        .from("group_memberships")
        .update({
          status: "accepted",
          joined_at: new Date().toISOString(),
        })
        .eq("group_id", groupId)
        .eq("user_id", internalUserId)
        .eq("status", "pending");

      if (updateError) {
        console.error("Error accepting invitation:", updateError);
        return new Response("Database error", { status: 500 });
      }
    } else if (action === "decline") {
      // Update membership status to declined
      const { error: updateError } = await supabase
        .from("group_memberships")
        .update({
          status: "declined",
        })
        .eq("group_id", groupId)
        .eq("user_id", internalUserId)
        .eq("status", "pending");

      if (updateError) {
        console.error("Error declining invitation:", updateError);
        return new Response("Database error", { status: 500 });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in group invitation API:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
