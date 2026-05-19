import { useEffect, useState } from "react";
import { createClient } from "@kovari/api/client";
import { UserProfile } from "@kovari/types";

interface UseUserProfileResult {
  profile: UserProfile | null;
  isDeleted: boolean;
  loading: boolean;
}

export const useUserProfile = (userId: string): UseUserProfileResult => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isDeleted, setIsDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setIsDeleted(true);
      setLoading(false);
      return;
    }
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/direct-chat/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: [userId] }),
        });

        if (!response.ok) throw new Error("Failed to fetch profile");

        const result = await response.json();
        const profileData = result.profiles?.[0];

        if (!profileData) {
          setProfile(null);
          setIsDeleted(true);
        } else {
          setProfile({
            id: profileData.user_id,
            name: profileData.name || "User",
            username: profileData.username || "user",
            profile_photo: profileData.profile_photo,
            deleted: profileData.deleted || false,
            clerk_id: profileData.clerk_id || profileData.clerk_user_id || (userId.startsWith("user_") ? userId : undefined),
          } as UserProfile);
          setIsDeleted(!!profileData.deleted);
        }
      } catch (error) {
        console.error("Error fetching profile via API:", error);
        setProfile(null);
        setIsDeleted(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId, supabase]);

  return { profile, isDeleted, loading };
};

