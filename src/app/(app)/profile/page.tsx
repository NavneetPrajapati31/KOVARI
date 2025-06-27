import { UserProfile } from "@/features/profile/components/user-profile";
import type { UserProfile as UserProfileType } from "@/features/profile/components/user-profile";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";

// Fetch current user's profile from the API route (SSR)
const fetchCurrentUserProfile = async (): Promise<UserProfileType | null> => {
  try {
    const { userId } = await auth();
    if (!userId) {
      redirect("/sign-in");
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

    // Get user UUID from Clerk userId
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .single();

    if (userError || !userRow) {
      console.error("Error finding user:", userError);
      return null;
    }

    // Use absolute URL for SSR fetch
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/profile/${userRow.id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();

    // Defensive: ensure all fields are present
    return {
      name: data.name || "",
      username: data.username || "",
      age: data.age || "",
      gender: data.gender || "",
      nationality: data.nationality || "",
      profession: data.profession || "",
      interests: Array.isArray(data.interests) ? data.interests : [],
      languages: Array.isArray(data.languages) ? data.languages : [],
      bio: data.bio || "",
      followers: data.followers || "0",
      following: data.following || "0",
      likes: data.likes || "0",
      coverImage: "", // Not in DB, leave blank
      profileImage: data.profileImage || "",
      posts: Array.isArray(data.posts) ? data.posts : [],
      isFollowing: data.isFollowing || false,
      isOwnProfile: data.isOwnProfile || false,
      userId: data.userId || "",
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
};

export default async function ProfilePage() {
  const profile = await fetchCurrentUserProfile();

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
        <p className="text-muted-foreground">
          Unable to load your profile. Please try again.
        </p>
      </div>
    );
  }

  // Add userId to the profile object (we need to get it from the API response)
  const profileWithUserId = {
    ...profile,
    userId: profile.userId || "", // This will be set by the API
    isOwnProfile: true, // Force true for own profile page
  };

  // Debug log
  console.log("[DEBUG] ProfilePage - profileWithUserId:", profileWithUserId);

  return <UserProfile profile={profileWithUserId} />;
}
