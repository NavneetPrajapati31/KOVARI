// apps/admin/app/api/admin/groups/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/admin-lib/supabaseAdmin";
import { requireAdmin } from "@/admin-lib/adminAuth";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const groupId = id;

    // Get group metadata
    const { data: group, error: groupError } = await supabaseAdmin
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .maybeSingle();

    if (groupError) {
      console.error("Error fetching group:", groupError);
      return NextResponse.json(
        { error: "Failed to fetch group" },
        { status: 500 }
      );
    }

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
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

    return NextResponse.json({
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
      admin_actions: adminActions || [],
    });
  } catch (err: unknown) {
    console.error("Admin group detail error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
