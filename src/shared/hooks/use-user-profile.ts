import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export interface UserProfile {
  name?: string;
  username?: string;
  profile_photo?: string;
  deleted?: boolean;
}

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
      const { data, error } = await supabase
        .from("profiles")
        .select("name, username, profile_photo, deleted")
        .eq("user_id", userId)
        .single();
      if (error || !data) {
        setProfile(null);
        setIsDeleted(true);
      } else {
        setProfile(data);
        setIsDeleted(!!data.deleted);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [userId, supabase]);

  return { profile, isDeleted, loading };
};
