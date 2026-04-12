import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { resolveUser } from "@/lib/auth/resolveUser";
import { createAdminSupabaseClient } from "@kovari/api";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;
  const supabase = createAdminSupabaseClient();

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
      `name, username, age, gender, nationality, bio, languages, profile_photo, job, interests`,
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

  if (profileError || !profileData) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Count followers (exclude soft-deleted users)
  // We do NOT delete follow rows for history/analytics, so we must filter counts here.
  const { data: followerRows, error: followerRowsError } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("following_id", targetInternalUserId);

  if (followerRowsError) {
    console.error("Error fetching follower ids:", followerRowsError);
    return new Response(JSON.stringify({ error: "Failed to fetch profile" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const followerIds = (followerRows || []).map((r: any) => r.follower_id);
  let followersCount = 0;
  if (followerIds.length > 0) {
    const { count, error: countError } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .in("id", followerIds)
      .eq("isDeleted", false);
    if (countError) {
      console.error("Error counting followers:", countError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch profile" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    followersCount = count ?? 0;
  }

  // 5. Count following (exclude soft-deleted users)
  const { data: followingRows, error: followingRowsError } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", targetInternalUserId);

  if (followingRowsError) {
    console.error("Error fetching following ids:", followingRowsError);
    return new Response(JSON.stringify({ error: "Failed to fetch profile" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const followingIds = (followingRows || []).map((r: any) => r.following_id);
  let followingCount = 0;
  if (followingIds.length > 0) {
    const { count, error: countError } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .in("id", followingIds)
      .eq("isDeleted", false);
    if (countError) {
      console.error("Error counting following:", countError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch profile" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    followingCount = count ?? 0;
  }

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
    const authResult = await resolveUser(req, { mode: 'optional' });
    
    if (authResult.ok && authResult.user) {
      const currentUserId = authResult.user.userId;
      isOwnProfile = currentUserId === targetInternalUserId;
      
      if (!isOwnProfile) {
        const { data: followData } = await supabase
          .from("user_follows")
          .select("id")
          .eq("follower_id", currentUserId)
          .eq("following_id", targetInternalUserId)
          .maybeSingle();
        
        isFollowing = !!followData;
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
