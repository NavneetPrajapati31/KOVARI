import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { createAdminSupabaseClient } from "@kovari/api";
import { isAfter, isBefore, parseISO } from "date-fns";

/**
 * GET /api/mobile/home
 * Consolidated dashboard data for mobile home screen.
 * Replicates the logic from apps/web dashboard while remaining lightweight.
 */
export async function GET(req: NextRequest) {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authUser.id; // internal Supabase UUID
    const supabase = createAdminSupabaseClient();

    try {
        // 1. Check user status (banned/deleted)
        const { data: userStatus, error: statusError } = await supabase
            .from("users")
            .select("isDeleted, banned")
            .eq("id", userId)
            .single();

        if (statusError || !userStatus) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (userStatus.isDeleted || userStatus.banned) {
            return NextResponse.json({ error: "Account inactive" }, { status: 403 });
        }

        // 2. Parallel Data Fetching
        const [
            profileRes,
            membershipsRes,
            unreadNotificationsRes,
            pendingInvitesRes,
            recentNotificationsRes,
            travelPreferencesRes,
        ] = await Promise.all([
            // Profile
            supabase
                .from("profiles")
                .select("name, username, profile_photo")
                .eq("user_id", userId)
                .single(),

            // Accepted Memberships & Group Details
            supabase
                .from("group_memberships")
                .select(`
          role,
          status,
          group:groups(
            id,
            name,
            destination,
            start_date,
            end_date,
            cover_image,
            members_count,
            status
          )
        `)
                .eq("user_id", userId)
                .eq("status", "accepted"),

            // Unread Notifications Count
            supabase
                .from("notifications")
                .select("id", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("is_read", false),

            // Pending Invitations Count
            supabase
                .from("group_memberships")
                .select("id", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("status", "pending"),

            // Recent Notifications (Top 5)
            supabase
                .from("notifications")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .range(0, 4),

            // Travel Preferences
            supabase
                .from("travel_preferences")
                .select("destinations, trip_focus, frequency")
                .eq("user_id", userId)
                .maybeSingle(),
        ]);

        // Handle generic errors
        if (membershipsRes.error) throw membershipsRes.error;

        const profile = profileRes.data;
        const allMemberships = membershipsRes.data || [];
        const unreadNotificationCount = unreadNotificationsRes.count || 0;
        const pendingInvitesCount = pendingInvitesRes.count || 0;
        const notifications = recentNotificationsRes.data || [];
        const travelPreferences = travelPreferencesRes.data || null;

        // 3. Stats Calculation (Blueprint aligned)
        const now = new Date();
        const activeGroups = allMemberships
            .filter(m => m.group && (m.group as any).status !== 'removed')
            .map(m => {
                const g = m.group as any;
                return {
                    id: g.id,
                    name: g.name,
                    role: m.role,
                    members: g.members_count,
                    destination: g.destination,
                    startDate: g.start_date,
                    endDate: g.end_date,
                    coverImage: g.cover_image,
                };
            });

        const upcomingGroups = activeGroups.filter(g => g.startDate && isAfter(parseISO(g.startDate), now));
        const pastGroups = activeGroups.filter(g => g.startDate && isBefore(parseISO(g.startDate), now));

        const stats = {
            totalTrips: activeGroups.length,
            upcomingTripsCount: upcomingGroups.length,
            pastTripsCount: pastGroups.length,
        };

        // 4. Identify Featured Trip & Fetch Itinerary Summary
        const featuredTripBase = upcomingGroups.sort((a, b) =>
            parseISO(a.startDate!).getTime() - parseISO(b.startDate!).getTime()
        )[0] || pastGroups.sort((a, b) =>
            parseISO(b.startDate!).getTime() - parseISO(a.startDate!).getTime()
        )[0] || null;

        let featuredTrip = null;
        if (featuredTripBase) {
            const { data: itineraryItems } = await supabase
                .from("itinerary_items")
                .select("id, title, description, datetime, duration")
                .eq("group_id", featuredTripBase.id)
                .eq("is_archived", false)
                .order("datetime", { ascending: true })
                .range(0, 2); // Next 2-3 items

            featuredTrip = {
                ...featuredTripBase,
                itinerary: itineraryItems || []
            };
        }

        // 5. Enrich Notifications (Matching web/api/notifications logic)
        const userIdsToFetch = new Set<string>();
        const groupIdsToFetch = new Set<string>();

        notifications.forEach((n) => {
            if (!n.entity_id) return;
            if (n.entity_type === "match" || n.entity_type === "chat") {
                userIdsToFetch.add(n.entity_id);
            } else if (n.entity_type === "group") {
                groupIdsToFetch.add(n.entity_id);
            }
        });

        const [profilesResult, groupsResult] = await Promise.all([
            userIdsToFetch.size > 0
                ? supabase
                    .from("profiles")
                    .select("user_id, profile_photo")
                    .in("user_id", Array.from(userIdsToFetch))
                : Promise.resolve({ data: [] }),
            groupIdsToFetch.size > 0
                ? supabase
                    .from("groups")
                    .select("id, cover_image, status")
                    .in("id", Array.from(groupIdsToFetch))
                : Promise.resolve({ data: [] }),
        ]);

        const profileMap = new Map();
        profilesResult.data?.forEach((p: any) => profileMap.set(p.user_id, p.profile_photo));

        const groupMap = new Map();
        groupsResult.data?.forEach((g: any) => {
            if (g?.status !== "removed") groupMap.set(g.id, g.cover_image);
        });

        const enrichedNotifications = notifications.map((n) => ({
            ...n,
            image_url: (n.entity_type === "match" || n.entity_type === "chat")
                ? profileMap.get(n.entity_id)
                : groupMap.get(n.entity_id)
        }));

        // 6. Final Response
        return NextResponse.json({
            profile: {
                name: profile?.name || "",
                username: profile?.username || "",
                avatar: profile?.profile_photo || "",
            },
            stats,
            featuredTrip,
            recentNotifications: enrichedNotifications,
            unreadNotificationCount,
            activeGroups,
            pendingInvitesCount,
            travelPreferences
        });

    } catch (error: any) {
        console.error("Critical error in GET /api/mobile/home:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
