import { NextRequest } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  const supabase = createRouteHandlerSupabaseClient();

  // Resolve `userId` param (can be internal UUID or Clerk ID) and ensure the
  // account is not soft-deleted. Soft delete is used so we can preserve history
  // and relationships (matches/chats/groups/etc.) without breaking foreign keys.
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const isUuid = uuidRegex.test(userId);

  let targetInternalUserId: string | null = null;
  try {
    const { data: userRow, error: userRowError } = await supabase
      .from("users")
      .select("id")
      .eq(isUuid ? "id" : "clerk_user_id", userId)
      .eq("isDeleted", false)
      .maybeSingle();
    if (!userRowError && userRow?.id) {
      targetInternalUserId = userRow.id;
    }
  } catch {
    // ignore and fall through to 404 below
  }
  if (!targetInternalUserId) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 1. Fetch profile (include interests from profiles)
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select(
      `name, username, age, gender, nationality, bio, languages, profile_photo, job, interests`
    )
    .eq("user_id", targetInternalUserId)
    .single();

  const interests = profileData?.interests || [];

  // 3. Fetch posts from user_posts
  const { data: postsData } = await supabase
    .from("user_posts")
    .select("id, image_url")
    .eq("user_id", targetInternalUserId)
    .order("created_at", { ascending: false });

  const posts = Array.isArray(postsData) ? postsData : [];

  // Debugging output
  console.log("[DEBUG] userId:", userId);
  console.log("[DEBUG] profileData:", profileData);
  // removed travelPrefData debug
  console.log("[DEBUG] postsData:", postsData);
  console.error("[DEBUG] profileError:", profileError);

  if (profileError || !profileData) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Count followers
  const { count: followersCount } = await supabase
    .from("user_follows")
    .select("id", { count: "exact", head: true })
    .eq("following_id", targetInternalUserId);

  // 5. Count following
  const { count: followingCount } = await supabase
    .from("user_follows")
    .select("id", { count: "exact", head: true })
    .eq("follower_id", targetInternalUserId);

  // 6. Count posts and sum likes
  const { count: postsCount, data: postsLikesData } = await supabase
    .from("user_posts")
    .select("likes", { count: "exact" })
    .eq("user_id", targetInternalUserId);

  const likesSum =
    postsLikesData?.reduce((acc, post) => acc + (post.likes || 0), 0) || 0;

  // 7. Check if current user is following this user
  let isFollowing = false;
  let isOwnProfile = false;

  try {
    const { userId: clerkUserId } = await auth();
    console.log("[DEBUG] clerkUserId:", clerkUserId);

    if (clerkUserId) {
      const cookieStore = await cookies();
      const serverSupabase = createServerClient(
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

      // Get current user's internal UUID from Clerk userId
      const { data: currentUserRow, error: currentUserError } =
        await serverSupabase
          .from("users")
          .select("id")
          .eq("clerk_user_id", clerkUserId)
          .eq("isDeleted", false)
          .single();

      console.log("[DEBUG] currentUserRow.id (follower):", currentUserRow?.id);
      console.log("[DEBUG] currentUserError:", currentUserError);

      if (currentUserError || !currentUserRow) {
        console.error("Error finding current user:", currentUserError);
      } else {
        // Always map the target userId param to internal UUID
        let targetUserId = targetInternalUserId;
        if (userId.length !== 36) {
          // If not a UUID, assume it's a Clerk ID
          const { data: targetUserRow } = await serverSupabase
            .from("users")
            .select("id")
            .eq("clerk_user_id", userId)
            .eq("isDeleted", false)
            .single();
          if (targetUserRow?.id) targetUserId = targetUserRow.id;
        }
        console.log("[DEBUG] targetUserId (following):", targetUserId);

        // Debug log for currentUserRow.id and targetUserId
        console.log("[DEBUG] currentUserRow.id:", currentUserRow.id);
        console.log("[DEBUG] targetUserId:", targetUserId);

        isOwnProfile = currentUserRow.id === targetUserId;
        console.log("[DEBUG] isOwnProfile:", isOwnProfile);

        if (!isOwnProfile) {
          // Check if current user is following the target user
          const { data: followData } = await serverSupabase
            .from("user_follows")
            .select("id")
            .eq("follower_id", currentUserRow.id)
            .eq("following_id", targetUserId)
            .maybeSingle();
          console.log("[DEBUG] followData:", followData);

          isFollowing = !!followData;
        }
      }
    }
  } catch (error) {
    console.error("Error checking follow status:", error);
    // Continue without follow status if there's an error
  }

  // 8. Map to UserProfileType
  const profile = {
    name: profileData.name || "",
    username: profileData.username || "",
    age: profileData.age ? String(profileData.age) : "",
    gender: profileData.gender || "",
    nationality: profileData.nationality || "",
    profession: profileData.job || "",
    interests,
    languages: profileData.languages || [],
    bio: profileData.bio || "",
    followers: String(followersCount ?? 0),
    following: String(followingCount ?? 0),
    likes: String(likesSum),
    coverImage: "", // Not in schema, leave blank or fetch if you add it
    profileImage: profileData.profile_photo || "",
    posts,
    isFollowing,
    isOwnProfile,
    userId: targetInternalUserId,
  };

  return new Response(JSON.stringify(profile), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
