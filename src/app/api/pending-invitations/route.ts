import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
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

    // Get groups where user has pending status
    const { data: pendingMemberships, error: membershipError } = await supabase
      .from("group_memberships")
      .select(
        `
        group_id,
        joined_at
      `
      )
      .eq("user_id", internalUserId)
      .eq("status", "pending");

    if (membershipError) {
      console.error("Error fetching pending memberships:", membershipError);
      return new Response("Database error", { status: 500 });
    }

    if (!pendingMemberships || pendingMemberships.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const groupIds = pendingMemberships.map((m) => m.group_id);

    // Fetch the groups with creator information (only active groups)
    const { data: groupsData, error: groupsError } = await supabase
      .from("groups")
      .select(
        `
        id,
        name,
        destination,
        start_date,
        end_date,
        description,
        cover_image,
        creator_id,
        created_at
      `
      )
      .in("id", groupIds)
      .eq("status", "active") // Only show invitations for approved groups
      .order("created_at", { ascending: false });

    if (groupsError) {
      console.error("Error fetching groups:", groupsError);
      return new Response("Database error", { status: 500 });
    }

    if (!groupsData) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get creator profiles
    const creatorIds = [...new Set(groupsData.map((g) => g.creator_id))];
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, name, username, profile_photo")
      .in("user_id", creatorIds);

    if (profilesError) {
      console.error("Error fetching creator profiles:", profilesError);
    }

    // Get member counts and some member avatars for each group
    const { data: memberCountsData, error: countsError } = await supabase
      .from("group_memberships")
      .select("group_id")
      .in("group_id", groupIds)
      .eq("status", "accepted");

    if (countsError) {
      console.error("Error fetching member counts:", countsError);
    }

    // Get some member avatars for display
    const { data: memberAvatarsData, error: avatarsError } = await supabase
      .from("group_memberships")
      .select(
        `
        group_id,
        users!inner(
          id,
          profiles!inner(name, username, profile_photo)
        )
      `
      )
      .in("group_id", groupIds)
      .eq("status", "accepted")
      .limit(2);

    if (avatarsError) {
      console.error("Error fetching member avatars:", avatarsError);
    }

    // Create maps for easy lookup
    const profilesMap = (profilesData || []).reduce((acc: any, profile) => {
      acc[profile.user_id] = profile;
      return acc;
    }, {});

    const memberCountMap = (memberCountsData || []).reduce((acc: any, gm) => {
      acc[gm.group_id] = (acc[gm.group_id] || 0) + 1;
      return acc;
    }, {});

    const memberAvatarsMap = (memberAvatarsData || []).reduce(
      (acc: any, item) => {
        if (!acc[item.group_id]) {
          acc[item.group_id] = [];
        }
        const user = Array.isArray(item.users) ? item.users[0] : item.users;
        if (user && user.profiles) {
          const profile = Array.isArray(user.profiles)
            ? user.profiles[0]
            : user.profiles;
          if (profile) {
            acc[item.group_id].push(profile);
          }
        }
        return acc;
      },
      {}
    );

    // Map to the expected format for InvitationResults
    const invitations = groupsData.map((group) => {
      const creator = profilesMap[group.creator_id];
      const memberCount = memberCountMap[group.id] || 0;
      const memberAvatars = memberAvatarsMap[group.id] || [];

      // Calculate days until expiration (30 days from join date)
      const joinDate = pendingMemberships.find(
        (m) => m.group_id === group.id
      )?.joined_at;
      const expirationDate = joinDate ? new Date(joinDate) : new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      const expiresInDays = Math.max(
        0,
        Math.ceil(
          (expirationDate.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );

      // Format dates
      const formatDateRange = () => {
        if (!group.start_date) return undefined;
        const startDate = new Date(group.start_date).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
            year: "numeric",
          }
        );
        if (!group.end_date) return startDate;
        const endDate = new Date(group.end_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        return `${startDate} - ${endDate}`;
      };

      // Generate initials from name
      const getInitials = (name: string) => {
        return name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
      };

      // Color array for member avatars
      const colors = [
        "bg-blue-400",
        "bg-pink-400",
        "bg-green-400",
        "bg-yellow-400",
        "bg-purple-400",
        "bg-orange-400",
      ];

      return {
        id: group.id,
        groupName: group.name,
        groupCoverImage: group.cover_image,
        creator: {
          name: creator?.name || "Unknown",
          username: creator?.username || "unknown",
          avatar: creator?.profile_photo || "",
          initials: getInitials(creator?.name || "Unknown"),
        },
        destination: group.destination,
        dates: formatDateRange(),
        description: group.description || "Join us for an amazing adventure!",
        teamMembers: memberAvatars
          .slice(0, 2)
          .map((member: any, index: number) => ({
            avatar: member.profile_photo || "",
            initials: getInitials(member.name || "Unknown"),
            color: colors[index % colors.length],
          })),
        acceptedCount: memberCount,
        expiresInDays,
        inviteDate: joinDate || new Date().toISOString(),
      };
    });

    return new Response(JSON.stringify(invitations), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in pending invitations API:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
