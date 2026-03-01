import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

/**
 * GET /api/reports/targets
 * Fetches users or groups for reporting.
 * If ?q= is provided, it searches by name.
 * If empty, it could return recent users/groups (currently just returns top 10).
 */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type"); // "user" | "group"
    const query = searchParams.get("q") || "";

    if (type !== "user" && type !== "group") {
      return NextResponse.json(
        { error: "Invalid target type" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Fetch internal user ID
    const { data: currentUserRow } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .single();
      
    const internalUserId = currentUserRow?.id;
    console.log(`[Search Targets] Request for type "${type}". internalUserId: ${internalUserId}, clerkUserId: ${clerkUserId}`);

    let data: any[] = [];

    if (type === "user") {
      if (query) {
        const { data: profilesData, error } = await supabase
          .from("profiles")
          .select("user_id, name, username, profile_photo, users!inner(clerk_user_id)")
          .neq("users.clerk_user_id", clerkUserId)
          .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
          .limit(20);

        if (error) throw error;
        data = profilesData.map((p: any) => ({
          id: p.user_id,
          name: p.name || p.username || "Unknown User",
          username: p.username,
          imageUrl: p.profile_photo,
        }));
      } else if (internalUserId) {
        console.log("[Search Targets] Fetching default user connections...");
        // Fetch connections (following or followers)
        const { data: followsData, error: followsError } = await supabase
          .from("user_follows")
          .select("follower_id, following_id")
          .or(`follower_id.eq.${internalUserId},following_id.eq.${internalUserId}`)
          .limit(50);
          
        if (followsError) {
           console.error("[Search Targets] Follows error:", followsError);
        }
          
        if (!followsError && followsData) {
          console.log(`[Search Targets] Found ${followsData.length} records in user_follows`);
          const connectedUserIds = new Set<string>();
          followsData.forEach(f => {
            if (f.follower_id !== internalUserId) connectedUserIds.add(f.follower_id);
            if (f.following_id !== internalUserId) connectedUserIds.add(f.following_id);
          });
          
          console.log("[Search Targets] Extracted Connected user IDs:", Array.from(connectedUserIds));
          
          if (connectedUserIds.size > 0) {
            const { data: connectionsData, error } = await supabase
              .from("profiles")
              .select("user_id, name, username, profile_photo")
              .in("user_id", Array.from(connectedUserIds));
              
            if (error) {
              console.error("[Search Targets] Connections Profiles error:", error);
            }
              
            if (!error && connectionsData) {
              console.log(`[Search Targets] Successfully resolved ${connectionsData.length} profiles from connections`);
              data = connectionsData.map((p: any) => ({
                id: p.user_id,
                name: p.name || p.username || "Unknown User",
                username: p.username,
                imageUrl: p.profile_photo,
              }));
            }
          }
        }
      }
    } else {
      if (query) {
        const { data: groupsData, error } = await supabase
          .from("groups")
          .select("id, name, cover_image")
          .eq("status", "active")
          .ilike("name", `%${query}%`)
          .limit(20);

        if (error) throw error;

        data = groupsData.map(g => ({
          id: g.id,
          name: g.name || "Unknown Group",
          imageUrl: g.cover_image,
        }));
      } else if (internalUserId) {
        console.log("[Search Targets] Fetching default group connections...");
        // Fetch groups the user is a member of or created
        const { data: createdGroups, error: createdError } = await supabase
           .from("groups")
           .select("id, name, cover_image, status")
           .eq("creator_id", internalUserId)
           .eq("status", "active");
           
        if (createdError) console.error("[Search Targets] Created Groups error:", createdError);
        console.log(`[Search Targets] Found ${createdGroups?.length || 0} active groups created by user`);

        const { data: membershipsData, error: membershipsError } = await supabase
          .from("group_memberships")
          .select("group_id, groups!inner(id, name, cover_image, status)")
          .eq("user_id", internalUserId)
          .eq("status", "accepted")
          .limit(50);
          
        if (membershipsError) console.error("[Search Targets] Group Memberships error:", membershipsError);
        console.log(`[Search Targets] Found ${membershipsData?.length || 0} accepted group memberships`);
          
        const uniqueGroups = new Map<string, any>();
        
        if (createdGroups) {
           createdGroups.forEach((g: any) => {
              uniqueGroups.set(g.id, {
                 id: g.id,
                 name: g.name || "Unknown Group",
                 imageUrl: g.cover_image,
              });
           });
        }

        if (membershipsData) {
           membershipsData
            .filter((m: any) => m.groups && m.groups.status === "active")
            .forEach((m: any) => {
               uniqueGroups.set(m.groups.id, {
                 id: m.groups.id,
                 name: m.groups.name || "Unknown Group",
                 imageUrl: m.groups.cover_image,
               });
            });
        }
        
        data = Array.from(uniqueGroups.values());
      }
    }

    return NextResponse.json({ targets: data });
  } catch (error) {
    console.error("Error in GET /api/reports/targets:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
