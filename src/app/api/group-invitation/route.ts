import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { randomBytes } from "crypto";
// import { Resend } from "resend";

// Helper to generate a random token
const generateToken = (length = 24) =>
  randomBytes(length).toString("base64url");

const INVITE_BASE_URL =
  process.env.NEXT_PUBLIC_INVITE_BASE_URL || "localhost:3000/invite";

// Uncomment and install resend or use your own email provider
let resend: any = null;
try {
  // Dynamically import resend if available
  resend = require("resend");
} catch (e) {
  // Fallback: resend not installed
}

type SendInviteEmailFn = (args: {
  to: string;
  groupName: string;
  inviteLink: string;
}) => Promise<void>;
let sendInviteEmail: SendInviteEmailFn;
if (process.env.NODE_ENV === "development") {
  sendInviteEmail = require("@/lib/send-invite-email.dev").sendInviteEmail;
} else {
  sendInviteEmail = require("@/lib/send-invite-email").sendInviteEmail;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    if (!groupId) {
      return new Response(JSON.stringify({ error: "Missing groupId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
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
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const body = await req.json();
    const { groupId, action, invites } = body;
    if (!groupId) {
      return new Response(
        JSON.stringify({ error: "Invalid request: missing groupId" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
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

    // Map Clerk userId to internal UUID
    const { data: userRow, error: userLookupError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .maybeSingle();
    if (userLookupError) {
      console.error("Error looking up user UUID:", userLookupError);
      return new Response(
        JSON.stringify({ error: "Failed to look up user UUID" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    if (!userRow || !userRow.id) {
      return new Response(
        JSON.stringify({ error: "User not found in users table" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const userUuid = userRow.id;

    // Check if group exists and is not removed
    const { data: groupCheck, error: groupCheckError } = await supabase
      .from("groups")
      .select("id, status")
      .eq("id", groupId)
      .single();

    if (groupCheckError || !groupCheck) {
      return new Response(JSON.stringify({ error: "Group not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Block access to removed groups
    if (groupCheck.status === "removed") {
      return new Response(JSON.stringify({ error: "Group not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle accept/decline actions
    if (action === "accept") {
      // Check if group is full (10 members limit)
      const { data: memberCount, error: countError } = await supabase
        .from("group_memberships")
        .select("id", { count: "exact" })
        .eq("group_id", groupId)
        .eq("status", "accepted");

      if (countError) {
        console.error("Error checking member count:", countError);
        return new Response(
          JSON.stringify({ error: "Failed to check member count" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (memberCount && memberCount.length >= 10) {
        return new Response(
          JSON.stringify({ error: "Group is full (maximum 10 members)" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Update membership status to 'accepted' and role to 'member'
      const { error: updateError } = await supabase
        .from("group_memberships")
        .update({
          status: "accepted",
          role: "member",
          joined_at: new Date().toISOString(),
        })
        .eq("group_id", groupId)
        .eq("user_id", userUuid)
        .eq("status", "pending");
      if (updateError) {
        console.error("Error accepting invitation:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to accept invitation" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Create notification for user whose join request was approved
      const { createNotification } = await import(
        "@/lib/notifications/createNotification"
      );
      const { NotificationType } = await import("@/shared/types/notifications");

      // Get group name
      const { data: groupData } = await supabase
        .from("groups")
        .select("name")
        .eq("id", groupId)
        .single();

      const groupName = groupData?.name || "a group";

      await createNotification({
        userId: userUuid,
        type: NotificationType.GROUP_JOIN_APPROVED,
        title: "Request Approved",
        message: `You're now a member of ${groupName}`,
        entityType: "group",
        entityId: groupId,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (action === "decline") {
      // Update membership status to 'declined' (do not delete row)
      const { error: updateError } = await supabase
        .from("group_memberships")
        .update({ status: "declined" })
        .eq("group_id", groupId)
        .eq("user_id", userUuid)
        .eq("status", "pending");
      if (updateError) {
        console.error("Error declining invitation:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to decline invitation" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fallback: original invite logic
    if (!Array.isArray(invites) || invites.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid request: missing invites" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    // Get sender's name for notifications
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", userUuid)
      .single();
    const senderName = senderProfile?.name || "Someone";

    // For each invite, find user by email or username
    for (const invite of invites) {
      let userRow = null;
      if (invite.username) {
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
        if (userRow && userRow.id) {
          // Check for existing membership to prevent duplicate invites
          const { data: existing, error: existError } = await supabase
            .from("group_memberships")
            .select("id, status")
            .eq("group_id", groupId)
            .eq("user_id", userRow.id)
            .maybeSingle();

          if (existError) {
            console.error("Error checking existing membership:", existError);
            continue;
          }

          // If user is already a member or has a pending/declined status, skip
          if (existing) {
            if (existing.status === "accepted") {
              console.log(
                `User ${userRow.id} is already a member of group ${groupId}`
              );
              continue;
            }
            if (existing.status === "pending") {
              console.log(
                `User ${userRow.id} already has a pending invitation to group ${groupId}`
              );
              continue;
            }
            if (existing.status === "declined") {
              console.log(
                `User ${userRow.id} previously declined invitation to group ${groupId}`
              );
              continue;
            }
          }

          // Check if group is full before adding new member
          const { data: memberCount, error: countError } = await supabase
            .from("group_memberships")
            .select("id", { count: "exact" })
            .eq("group_id", groupId)
            .eq("status", "accepted");

          if (countError) {
            console.error("Error checking member count:", countError);
            continue;
          }

          if (memberCount && memberCount.length >= 10) {
            console.log(
              `Group ${groupId} is full, cannot invite user ${userRow.id}`
            );
            continue;
          }

          // Add to group_memberships as pending
          const { error: insertError } = await supabase
            .from("group_memberships")
            .insert({
              group_id: groupId,
              user_id: userRow.id,
              status: "pending",
              role: "member",
              joined_at: new Date().toISOString(),
            });
          if (insertError) {
            console.error("Error inviting user:", insertError);
          } else {
            // Create notification for invited user
            const { createNotification } = await import(
              "@/lib/notifications/createNotification"
            );
            const { NotificationType } = await import(
              "@/shared/types/notifications"
            );

            // Get group name
            const { data: groupData } = await supabase
              .from("groups")
              .select("name")
              .eq("id", groupId)
              .single();

            const groupName = groupData?.name || "a group";

            await createNotification({
              userId: userRow.id,
              type: NotificationType.GROUP_INVITE_RECEIVED,
              title: "Group invitation",
              message: `You've been invited to join ${groupName} by ${senderName}`,
              entityType: "group",
              entityId: groupId,
            });
          }
        }
      } else if (invite.email) {
        // Always create a pending email invite
        const token = generateToken();
        const { error: insertError } = await supabase
          .from("group_email_invitations")
          .insert({
            group_id: groupId,
            email: invite.email,
            token,
            status: "pending",
          });
        if (insertError) {
          console.error("Error inserting email invite:", insertError);
          continue;
        }
        // Fetch group name for the email
        let groupName = "a group";
        try {
          const { data: group } = await supabase
            .from("groups")
            .select("name")
            .eq("id", groupId)
            .maybeSingle();
          if (group?.name) groupName = group.name;
        } catch {}
        // Send invite email
        try {
          await sendInviteEmail({
            to: invite.email,
            groupName,
            inviteLink: `${INVITE_BASE_URL}/${token}`,
          });
        } catch (e) {
          console.error("Error sending invite email:", e);
        }
      }
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST group invitation API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
