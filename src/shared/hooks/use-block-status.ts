import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface UseBlockStatusResult {
  isBlocked: boolean;
  loading: boolean;
}

export const useBlockStatus = (
  currentUserUuid: string,
  partnerUuid: string
): UseBlockStatusResult => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!currentUserUuid || !partnerUuid) {
      setIsBlocked(false);
      setLoading(false);
      return;
    }
    const checkBlocked = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("blocked_users")
        .select("id")
        .or(
          `blocker_id.eq.${currentUserUuid},blocked_id.eq.${partnerUuid}` +
            "," +
            `blocker_id.eq.${partnerUuid},blocked_id.eq.${currentUserUuid}`
        );
      if (!error && data && data.length > 0) {
        setIsBlocked(true);
      } else {
        setIsBlocked(false);
      }
      setLoading(false);
    };
    checkBlocked();
  }, [currentUserUuid, partnerUuid, supabase]);

  return { isBlocked, loading };
};
