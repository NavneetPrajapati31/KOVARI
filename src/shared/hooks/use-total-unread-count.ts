import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getUserUuidByClerkId } from "@/shared/utils/getUserUuidByClerkId";
import { createClient } from "@/lib/supabase";
import { useDirectInbox } from "@/shared/hooks/use-direct-inbox";

const useTotalUnreadCount = (): number => {
  const { user } = useUser();
  const [currentUserUuid, setCurrentUserUuid] = useState<string>("");
  const [totalUnread, setTotalUnread] = useState(0);
  const inbox = useDirectInbox(currentUserUuid);

  useEffect(() => {
    if (!user?.id) return;
    getUserUuidByClerkId(user.id).then((uuid) =>
      setCurrentUserUuid(uuid || "")
    );
  }, [user?.id]);

  useEffect(() => {
    // Calculate total unread count
    const total = inbox.conversations.reduce(
      (sum, conv) => sum + (conv.unreadCount || 0),
      0
    );
    setTotalUnread(total);
  }, [inbox.conversations]);

  useEffect(() => {
    // Listen for real-time updates (same as Inbox)
    const handler = (e: any) => {
      // Just trigger a state update to re-calc unread
      setTotalUnread((prev) => prev); // force rerender
    };
    window.addEventListener("inbox-message-update", handler);
    return () => window.removeEventListener("inbox-message-update", handler);
  }, []);

  return totalUnread;
};

export default useTotalUnreadCount;
