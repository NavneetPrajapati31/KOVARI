"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getUserUuidByClerkId } from "@/shared/utils/getUserUuidByClerkId";

const getUnreadMap = () => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("inboxUnreadMap") || "{}");
  } catch {
    return {};
  }
};
const setUnreadMap = (map: Record<string, number>) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("inboxUnreadMap", JSON.stringify(map));
};

export const DirectMessageListener = () => {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoaded || !user?.id) return;
    let currentUserUuid: string | null = null;
    let supabase: ReturnType<typeof createClient> | null = null;
    let channel: any = null;
    let unsubscribed = false;

    getUserUuidByClerkId(user.id).then((uuid) => {
      if (!uuid || unsubscribed) return;
      currentUserUuid = uuid;
      supabase = createClient();
      channel = supabase
        .channel("direct_messages_global_listener")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "direct_messages" },
          (payload) => {
            const msg = payload.new;
            if (!msg || !currentUserUuid) return;
            // Only process if the message is for the current user
            if (msg.receiver_id === currentUserUuid) {
              const partnerId = msg.sender_id;
              // If user is NOT currently viewing this conversation, increment unread
              // Assume chat route is /chat/[userId]
              const isViewing =
                pathname === `/chat/${partnerId}` ||
                pathname.startsWith(`/chat/${partnerId}/`);
              const unreadMap = getUnreadMap();
              if (!isViewing) {
                unreadMap[partnerId] = (unreadMap[partnerId] || 0) + 1;
                setUnreadMap(unreadMap);
                // Optionally, dispatch a custom event for other listeners
                window.dispatchEvent(
                  new StorageEvent("storage", {
                    key: "inboxUnreadMap",
                    newValue: JSON.stringify(unreadMap),
                  })
                );
              } else {
                // If viewing, reset unread count
                if (unreadMap[partnerId] !== 0) {
                  unreadMap[partnerId] = 0;
                  setUnreadMap(unreadMap);
                  window.dispatchEvent(
                    new StorageEvent("storage", {
                      key: "inboxUnreadMap",
                      newValue: JSON.stringify(unreadMap),
                    })
                  );
                }
              }
            }
          }
        )
        .subscribe();
    });
    return () => {
      unsubscribed = true;
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isLoaded, user?.id, pathname]);

  return null;
};

export default DirectMessageListener;
