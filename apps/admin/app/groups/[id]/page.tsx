import { requireAdmin } from "@/admin-lib/adminAuth";
import { supabaseAdmin } from "@/admin-lib/supabaseAdmin";
import { GroupDetail } from "../../../components/GroupDetail";
import Link from "next/link";
import { notFound } from "next/navigation";

interface GroupData {
  group: {
    id: string;
    name: string;
    destination: string | null;
    description: string | null;
    notes: string | null;
    status: string;
    flag_count: number;
    created_at: string;
    start_date: string | null;
    end_date: string | null;
    is_public: boolean | null;
    budget: number;
    cover_image: string | null;
    creator_id: string | null;
    members_count: number;
    dominant_languages: string[] | null;
    top_interests: string[] | null;
    non_smokers: boolean | null;
    non_drinkers: boolean | null;
    average_age: number | null;
    destination_lat: number | null;
    destination_lon: number | null;
    removed_reason: string | null;
    removed_at: string | null;
  };
  organizer: {
    id: string;
    name: string;
    email: string;
    verified: boolean;
    profile_photo: string | null;
  } | null;
  members_count: number;
  images: Array<{
    id: string;
    url: string;
    type: string;
    uploaded_by: string | null;
    created_at: string;
  }>;
  flags: Array<{
    id: string;
    group_id: string;
    reporter_id: string | null;
    reason: string | null;
    evidence_url: string | null;
    status: string;
    created_at: string;
  }>;
  admin_actions: Array<{
    id: string;
    action: string;
    reason: string | null;
    created_at: string;
    metadata: Record<string, unknown> | null;
    admins: {
      id: string;
      email: string;
    } | null;
  }>;
}

async function getGroupDetail(id: string): Promise<GroupData | null> {
  try {
    const groupId = id;

    // Get group metadata
    const { data: group, error: groupError } = await supabaseAdmin
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .maybeSingle();

    if (groupError) {
      console.error("Error fetching group:", groupError);
      return null;
    }

    if (!group) {
      return null;
    }

    // Get organizer profile
    let organizer = null;
    if (group.creator_id) {
      // First try to get profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, name, email, verified, profile_photo")
        .eq("user_id", group.creator_id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching organizer profile:", profileError);
      }

      if (profile) {
        organizer = {
          id: profile.id,
          name: profile.name || "Unknown User",
          email: profile.email || "No email",
          verified: profile.verified || false,
          profile_photo: profile.profile_photo,
        };
      } else {
        // If profile not found, try to get user info directly
        // This handles cases where profile was deleted or never created
        const { data: user, error: userError } = await supabaseAdmin
          .from("users")
          .select("id, clerk_user_id")
          .eq("id", group.creator_id)
          .maybeSingle();

        if (userError) {
          console.error(
            `Error fetching organizer user (ID: ${group.creator_id}):`,
            userError
          );
        }

        // Create a fallback organizer entry if user exists
        // Use user.id as profile id for the link (will need to handle this in UI)
        if (user) {
          organizer = {
            id: user.id, // Use user.id - UI will need to handle this case
            name: "User (Profile Missing)",
            email: "No email available",
            verified: false,
            profile_photo: null,
          };
        } else {
          console.warn(
            `Organizer user not found for creator_id: ${group.creator_id}`
          );
        }
      }
    }

    // Get members count (actual count from group_memberships)
    const { count: membersCount, error: membersCountError } =
      await supabaseAdmin
        .from("group_memberships")
        .select("*", { count: "exact", head: true })
        .eq("group_id", groupId)
        .eq("status", "accepted");

    if (membersCountError) {
      console.error("Error fetching members count:", membersCountError);
    }

    // Get uploaded images from group_media table
    const { data: media, error: mediaError } = await supabaseAdmin
      .from("group_media")
      .select("id, url, type, uploaded_by, created_at")
      .eq("group_id", groupId)
      .eq("type", "image")
      .order("created_at", { ascending: false });

    if (mediaError) {
      console.error("Error fetching group media:", mediaError);
    }

    // Combine cover_image with uploaded images
    const images = [];
    if (group.cover_image) {
      images.push({
        id: "cover",
        url: group.cover_image,
        type: "cover",
        uploaded_by: group.creator_id,
        created_at: group.created_at,
      });
    }
    if (media) {
      images.push(...media);
    }

    // Get flags from group_flags table
    const { data: flags, error: flagsError } = await supabaseAdmin
      .from("group_flags")
      .select(
        `
        id,
        group_id,
        reporter_id,
        reason,
        evidence_url,
        status,
        created_at
      `
      )
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    if (flagsError) {
      console.error("Error fetching group flags:", flagsError);
    }

    // Get previous admin actions for this group
    const { data: adminActions, error: adminActionsError } = await supabaseAdmin
      .from("admin_actions")
      .select(
        `
          id,
          action,
          reason,
          metadata,
          created_at,
          admins:admins!admin_actions_admin_id_fkey(
            id,
            email
          )
        `
      )
      .eq("target_type", "group")
      .eq("target_id", groupId)
      .order("created_at", { ascending: false });

    if (adminActionsError) {
      console.error("Error fetching admin actions:", adminActionsError);
    }

    // Format admin actions
    const formattedAdminActions = (adminActions || []).map(
      (action: {
        id: string;
        action: string;
        reason: string | null;
        metadata: Record<string, unknown> | null;
        created_at: string;
        admins?:
          | Array<{ id: string; email: string }>
          | { id: string; email: string };
      }) => {
        const admin =
          Array.isArray(action.admins) && action.admins.length > 0
            ? action.admins[0]
            : !Array.isArray(action.admins) && action.admins
              ? action.admins
              : undefined;

        return {
          id: String(action.id),
          action: String(action.action),
          reason: action.reason ? String(action.reason) : null,
          metadata: action.metadata || null,
          created_at: String(action.created_at),
          admins: admin
            ? { id: String(admin.id), email: String(admin.email) }
            : null,
        };
      }
    );

    return {
      group: {
        id: group.id,
        name: group.name,
        destination: group.destination,
        description: group.description,
        notes: group.notes,
        status: group.status,
        flag_count: group.flag_count || 0,
        created_at: group.created_at,
        start_date: group.start_date,
        end_date: group.end_date,
        is_public: group.is_public,
        budget: group.budget,
        cover_image: group.cover_image,
        creator_id: group.creator_id,
        members_count: group.members_count,
        dominant_languages: group.dominant_languages,
        top_interests: group.top_interests,
        non_smokers: group.non_smokers,
        non_drinkers: group.non_drinkers,
        average_age: group.average_age,
        destination_lat: group.destination_lat,
        destination_lon: group.destination_lon,
        removed_reason: group.removed_reason,
        removed_at: group.removed_at,
      },
      organizer,
      members_count: membersCount || group.members_count || 0,
      images,
      flags: flags || [],
      admin_actions: formattedAdminActions,
    };
  } catch (error) {
    console.error("Error fetching group:", error);
    return null;
  }
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const groupData = await getGroupDetail(id);

  if (!groupData) {
    notFound();
  }

  return (
    <main className="p-8 space-y-6">
      <div>
        <Link
          href="/groups"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          ← Back to Groups
        </Link>
      </div>

      <GroupDetail
        group={groupData.group}
        organizer={groupData.organizer}
        membersCount={groupData.members_count}
        images={groupData.images}
        flags={groupData.flags}
        adminActions={groupData.admin_actions}
      />
    </main>
  );
}
