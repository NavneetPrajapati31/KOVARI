import { UserProfile } from "@/features/profile/components/user-profile";
import type { UserProfile as UserProfileType } from "@/features/profile/components/user-profile";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { CardContent } from "@/shared/components/ui/card";
import { Card, Skeleton } from "@heroui/react";

// Loading component specific to profile page
const ProfileLoading = () => {
  return (
    <>
      {/* Mobile/Tablet Layout */}
      <div className="min-h-screen bg-transparent md:hidden">
        <Card className="w-full h-full mx-auto bg-transparent border-none rounded-none gap-3 shadow-none p-3">
          {/* Profile Information Section */}
          <Card className="rounded-none border-none shadow-none bg-transparent p-0">
            <CardContent className="p-0">
              <div className="flex flex-row items-stretch gap-4">
                <Card className="flex rounded-3xl bg-transparent border border-border shadow-none p-4 items-start justify-start flex-1 min-w-0">
                  <div className="flex flex-row items-center gap-x-6 w-full mb-4 mt-3">
                    <div className="flex flex-row justify-start items-center flex-1 min-w-0 gap-x-4">
                      <div className="flex flex-col">
                        <Skeleton className="h-[70px] w-[70px] rounded-full" />
                      </div>
                      <div className="flex flex-col">
                        <Skeleton className="h-3 w-24 rounded-full mb-2" />
                        <Skeleton className="h-3 w-20 rounded-full mb-2" />
                      </div>
                    </div>
                  </div>

                  <Skeleton className="h-3 w-1/3 rounded-full mb-2" />
                  <Skeleton className="h-3 w-1/2 rounded-full mb-2" />
                  <Skeleton className="h-3 w-full rounded-full mb-2" />
                  <Skeleton className="h-3 w-full rounded-full mb-2" />

                  <div className="flex flex-row justify-start items-center flex-1 gap-x-1.5 mt-4 w-full">
                    <Skeleton className="h-8 w-1/2 rounded-lg" />
                    <Skeleton className="h-8 w-1/2 rounded-lg" />
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card
            aria-label="User details"
            className="w-full h-full rounded-3xl bg-transparent shadow-none p-4 flex flex-col gap-6 border border-border mx-auto"
          >
            <Skeleton className="w-1/5 rounded-full h-3 mt-2 mb-1"></Skeleton>

            <Card className="rounded-none border-none shadow-none bg-transparent p-0">
              <CardContent className="p-0">
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 9 }).map((post, index) => (
                    <div
                      key={index}
                      className="aspect-[4/5] bg-muted rounded-none overflow-hidden flex items-center justify-center shadow-sm"
                    >
                      <Skeleton className="w-full h-full object-cover rounded-none"></Skeleton>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Card>
        </Card>
      </div>

      {/* Desktop Layout */}
      <div className="min-h-screen bg-transparent hidden md:block">
        <Card className="w-full h-full mx-auto bg-transparent border-none rounded-none gap-4 shadow-none p-5">
          {/* Profile Information Section */}
          <Card className="rounded-none border-none shadow-none bg-transparent p-0">
            <CardContent className="p-0">
              <div className="flex flex-row items-stretch gap-4">
                {/* Profile Avatar Overlay - Stretches to match second card height */}
                <Skeleton className="rounded-3xl w-[230px] h-[230px] min-[840px]:h-[210px] min-[840px]:w-[210px] flex-shrink-0"></Skeleton>

                <Card className="flex rounded-3xl bg-transparent border border-border h-[230px] min-[840px]:h-[210px] shadow-none p-6 py-5 items-start justify-start flex-1 min-w-0">
                  <Skeleton className="h-4 w-1/5 rounded-full mb-2 mt-6" />
                  <Skeleton className="h-4 w-1/6 rounded-full mb-5" />
                  <Skeleton className="h-4 w-full rounded-full mb-2" />
                  <Skeleton className="h-4 w-full rounded-full mb-2" />
                  <Skeleton className="h-4 w-full rounded-full mb-2" />
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card
            aria-label="User details"
            className="w-full h-full rounded-3xl bg-transparent shadow-none p-6 flex flex-col gap-6 border border-border mx-auto"
          >
            <Skeleton className="w-1/6 rounded-full h-4 mt-2 mb-1"></Skeleton>

            <Card className="rounded-none border-none shadow-none bg-transparent p-0">
              <CardContent className="p-0">
                <div className="grid grid-cols-3 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((post, index) => (
                    <div
                      key={index}
                      className="aspect-[4/5] bg-muted rounded-lg overflow-hidden flex items-center justify-center shadow-sm"
                    >
                      <Skeleton className="w-full h-full object-cover"></Skeleton>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Card>
        </Card>
      </div>
    </>
  );
};

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
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileContent />
    </Suspense>
  );
}

// Separate component for the actual profile content
async function ProfileContent() {
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
