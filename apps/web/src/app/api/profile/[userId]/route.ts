import { NextRequest, NextResponse } from "next/server";
import { resolveUser } from "@/lib/auth/resolveUser";
import { createAdminSupabaseClient } from "@kovari/api";
import { generateRequestId } from "@/lib/api/requestId";
import { formatStandardResponse, formatErrorResponse } from "@/lib/api/responseHelpers";
import { ApiErrorCode } from "@/types/api";
import { z } from "zod";
import { logger } from "@/lib/api/logger";

/**
 * 🛡️ Public Profile Contract Schema
 */
const PublicProfileSchema = z.object({
  name: z.string().default(""),
  username: z.string().default(""),
  age: z.string().default(""),
  gender: z.string().default(""),
  nationality: z.string().default(""),
  profession: z.string().default(""),
  interests: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  bio: z.string().default(""),
  followers: z.string().default("0"),
  following: z.string().default("0"),
  likes: z.string().default("0"),
  coverImage: z.string().default(""),
  profileImage: z.string().default(""),
  posts: z.array(z.object({
    id: z.union([z.string(), z.number()]),
    image_url: z.string()
  })).default([]),
  isFollowing: z.boolean().default(false),
  isOwnProfile: z.boolean().default(false),
  hasActiveReport: z.boolean().default(false),
  location: z.string().default(""),
  religion: z.string().default(""),
  smoking: z.string().default(""),
  drinking: z.string().default(""),
  personality: z.string().default(""),
  foodPreference: z.string().default(""),
  userId: z.string()
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const start = Date.now();
  const requestId = generateRequestId();
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
    return formatErrorResponse("User not found", ApiErrorCode.NOT_FOUND, requestId, 404);
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
    return formatErrorResponse("User not found", ApiErrorCode.NOT_FOUND, requestId, 404);
  }

  // 4. Count followers (exclude soft-deleted users)
  // We do NOT delete follow rows for history/analytics, so we must filter counts here.
  const { data: followerRows, error: followerRowsError } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("following_id", targetInternalUserId);

    logger.error(requestId, "Error fetching follower ids", followerRowsError);
    return formatErrorResponse("Failed to fetch followers", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
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
      logger.error(requestId, "Error counting followers", countError);
      return formatErrorResponse("Failed to count followers", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
    }
    followersCount = count ?? 0;
  }

  // 5. Count following (exclude soft-deleted users)
  const { data: followingRows, error: followingRowsError } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", targetInternalUserId);

  if (followingRowsError) {
    logger.error(requestId, "Error fetching following ids", followingRowsError);
    return formatErrorResponse("Failed to fetch following", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
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
      logger.error(requestId, "Error counting following", countError);
      return formatErrorResponse("Failed to count following", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
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
    logger.error(requestId, "Error checking follow status", error);
    // Continue without follow status if there's an error
  }

  // 8. Map to Public Profile
  const rawProfile = {
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
    coverImage: "", 
    profileImage: profileData.profile_photo || "",
    posts,
    isFollowing,
    isOwnProfile,
    userId: targetInternalUserId,
    // Note: location etc might be missing in simplified profile fetch above, 
    // but the schema .parse will inject safe defaults.
  };

  try {
    const parsed = PublicProfileSchema.parse(rawProfile);
    return formatStandardResponse(
      parsed,
      { contractState: 'clean', degraded: false },
      { requestId, latencyMs: Date.now() - start }
    );
  } catch (err) {
    logger.error(requestId, "Profile Contract Failure", err);
    return formatErrorResponse("Profile contract violation", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
  }
}
