import { UserProfile } from "@/features/profile/components/user-profile";
import type { UserProfile as UserProfileType } from "@/features/profile/components/user-profile";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";


interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

// Utility to map Clerk ID to internal UUID
const getInternalUserId = async (userId: string): Promise<string> => {
  console.log("[DEBUG] getInternalUserId input:", userId);
  if (userId.length === 36) {
    console.log("[DEBUG] getInternalUserId output (already UUID):", userId);
    return userId; // Already a UUID
  }
  const supabase = createAdminSupabaseClient();

  const { data: userRow } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();
  console.log("[DEBUG] getInternalUserId output (mapped):", userRow?.id);
  return userRow?.id || userId;
};

// Fetch user profile directly (SSR)
const fetchUserProfile = async (
  userId: string,
): Promise<UserProfileType | null> => {
  try {
    const supabase = createAdminSupabaseClient();


    // 1. Fetch profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select(
        `name, username, age, gender, nationality, bio, languages, profile_photo, job, location, religion, smoking, drinking, personality, food_preference, birthday, verified`,
      )
      .eq("user_id", userId)
      .single();

    if (profileError || !profileData) {
      console.error("[DEBUG] profileError:", profileError);
      return null;
    }

    // 2. Fetch travel preferences (for interests)
    const { data: travelPrefData } = await supabase
      .from("travel_preferences")
      .select("interests")
      .eq("user_id", userId)
      .single();

    const interests = travelPrefData?.interests || [];

    // 3. Fetch posts from user_posts
    // const { data: postsData } = await supabase
    //   .from("user_posts")
    //   .select("id, image_url")
    //   .eq("user_id", userId)
    //   .order("created_at", { ascending: false });

    const posts: any[] = [];

    // 4. Count followers/following (exclude soft-deleted users)
    // We keep follow rows for history/analytics, so counts must filter deleted accounts.
    const [
      { data: followerRows, error: followerErr },
      { data: followingRows, error: followingErr },
    ] = await Promise.all([
      supabase
        .from("user_follows")
        .select("follower_id")
        .eq("following_id", userId),
      supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", userId),
    ]);

    if (followerErr || followingErr) {
      console.error("Error fetching follow ids:", {
        followerErr,
        followingErr,
      });
      return null;
    }

    const followerIds = (followerRows || []).map((r: any) => r.follower_id);
    const followingIds = (followingRows || []).map((r: any) => r.following_id);

    const [{ count: followersCount }, { count: followingCount }] =
      await Promise.all([
        followerIds.length
          ? supabase
              .from("users")
              .select("id", { count: "exact", head: true })
              .in("id", followerIds)
              .eq("isDeleted", false)
          : Promise.resolve({ count: 0 } as any),
        followingIds.length
          ? supabase
              .from("users")
              .select("id", { count: "exact", head: true })
              .in("id", followingIds)
              .eq("isDeleted", false)
          : Promise.resolve({ count: 0 } as any),
      ]);

    // 6. Count posts and sum likes
    // const { count: postsCount, data: postsLikesData } = await supabase
    //   .from("user_posts")
    //   .select("likes", { count: "exact" })
    //   .eq("user_id", userId);

    const likesSum = 0;
    //   postsLikesData?.reduce((acc, post) => acc + (post.likes || 0), 0) || 0;

    // 7. Check if current user is following this user
    let isFollowing = false;
    let isOwnProfile = false;

    try {
      const { userId: clerkUserId } = await auth();
      console.log("[DEBUG] clerkUserId:", clerkUserId);

      if (clerkUserId) {
        // Get current user's internal UUID from Clerk userId
        const { data: currentUserRow, error: currentUserError } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_user_id", clerkUserId)
          .single();

        console.log(
          "[DEBUG] currentUserRow.id (follower):",
          currentUserRow?.id,
        );
        console.log("[DEBUG] currentUserError:", currentUserError);

        if (currentUserError || !currentUserRow) {
          console.error("Error finding current user:", currentUserError);
        } else {
          isOwnProfile = currentUserRow.id === userId;

          if (!isOwnProfile) {
            // Check if current user is following the target user
            const { data: followData } = await supabase
              .from("user_follows")
              .select("id")
              .eq("follower_id", currentUserRow.id)
              .eq("following_id", userId)
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
    return {
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
      location: profileData.location || "Surat",
      religion: profileData.religion || "Hindu",
      smoking: profileData.smoking || "No",
      drinking: profileData.drinking || "No",
      personality: profileData.personality || "Ambivert",
      foodPreference: profileData.food_preference || "Veg",
      userId,
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
};

export default async function ProfileUserPage({ params }: ProfilePageProps) {
  const resolvedParams = await params;
  let { userId } = resolvedParams;
  userId = await getInternalUserId(userId);
  console.log("[DEBUG] Final userId used for profile fetch:", userId);
  const profile = await fetchUserProfile(userId);

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
        <p className="text-muted-foreground">
          The profile you are looking for does not exist.
        </p>
      </div>
    );
  }

  // Add userId to the profile object
  const profileWithUserId = {
    ...profile,
    userId,
  };

  return <UserProfile profile={profileWithUserId} />;
}
