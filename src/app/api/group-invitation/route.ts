import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { randomBytes } from "crypto";

// Helper to generate a random token
const generateToken = (length = 24) =>
  randomBytes(length).toString("base64url");

const INVITE_BASE_URL =
  process.env.NEXT_PUBLIC_INVITE_BASE_URL || "localhost:3000/invite";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    if (!groupId) {
      return new Response(JSON.stringify({ error: "Missing groupId" }), {
        status: 400,
      });
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
    // Check for existing link
    const { data: linkRow, error: linkError } = await supabase
      .from("group_invite_links")
      .select("token")
      .eq("group_id", groupId)
      .maybeSingle();
    if (linkError) {
      console.error("Error fetching invite link:", linkError);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
      });
    }
    let token = linkRow?.token;
    if (!token) {
      // Generate and insert new token
      token = generateToken();
      const { error: insertError } = await supabase
        .from("group_invite_links")
        .insert({ group_id: groupId, token });
      if (insertError) {
        console.error("Error creating invite link:", insertError);
        return new Response(JSON.stringify({ error: "Database error" }), {
          status: 500,
        });
      }
    }
    return new Response(
      JSON.stringify({ link: `${INVITE_BASE_URL}/${token}` }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in GET group invitation API:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }
    const { groupId, invites } = await req.json();
    if (!groupId || !Array.isArray(invites) || invites.length === 0) {
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
    // For each invite, find user by email or username
    for (const invite of invites) {
      let userRow = null;
      if (invite.email) {
        // Find user by email (join users->profiles)
        const { data, error } = await supabase
          .from("users")
          .select("id, profiles!inner(email)")
          .eq("profiles.email", invite.email)
          .maybeSingle();
        if (error) {
          console.error("Error looking up user by email:", error);
          continue;
        }
        userRow = data;
      } else if (invite.username) {
        // Find user by username (profiles)
        const { data, error } = await supabase
          .from("profiles")
          .select("user_id")
          .ilike("username", invite.username)
          .maybeSingle();
        if (error) {
          console.error("Error looking up user by username:", error);
          continue;
        }
        if (data) userRow = { id: data.user_id };
      }
      if (userRow && userRow.id) {
        // Add to group_memberships as pending (if not already a member)
        const { data: existing, error: existError } = await supabase
          .from("group_memberships")
          .select("id")
          .eq("group_id", groupId)
          .eq("user_id", userRow.id)
          .maybeSingle();
        if (!existing) {
          const { error: insertError } = await supabase
            .from("group_memberships")
            .insert({
              group_id: groupId,
              user_id: userRow.id,
              status: "pending",
              joined_at: new Date().toISOString(),
            });
          if (insertError) {
            console.error("Error inviting user:", insertError);
          }
        }
      } else {
        // User not found, optionally handle external invites (e.g., send email)
        // Not implemented: you may want to store pending invites for non-users
        console.warn("User not found for invite:", invite);
      }
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST group invitation API:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
