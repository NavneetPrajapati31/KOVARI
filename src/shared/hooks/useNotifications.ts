"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase";
import { Notification } from "@/shared/types/notifications";
import { getSocket } from "@/lib/socket";
import { registerServiceWorker, subscribeUserToPush } from "@/shared/utils/pushSubscription";

interface UseNotificationsOptions {
  limit?: number;
  unreadOnly?: boolean;
  realtime?: boolean;
  activeChatId?: string | null; // Added: Suppress notifications for active chat
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { limit = 50, unreadOnly = false, realtime = true, activeChatId = null } = options;
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Deduplication cache: stores notification IDs or hashes for socket-delivered alerts
  const processedIds = useRef<Set<string>>(new Set());
  const socketRef = useRef<any>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(unreadOnly && { unreadOnly: "true" }),
      });

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      const fetched = data.notifications || [];
      
      // Seed processedIds with initial notification IDs
      fetched.forEach((n: Notification) => processedIds.current.add(n.id));
      
      setNotifications(fetched);
    } catch (err: any) {
      setError(err.message || "Failed to load notifications");
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user, limit, unreadOnly]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/notifications/unread-count");
      if (!response.ok) {
        throw new Error("Failed to fetch unread count");
      }

      const data = await response.json();
      setUnreadCount(data.count || 0);
    } catch (err: any) {
      console.error("Error fetching unread count:", err);
    }
  }, [user]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: "PATCH",
        });

        if (!response.ok) {
          throw new Error("Failed to mark notification as read");
        }

        // Optimistically update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err: any) {
        console.error("Error marking notification as read:", err);
        fetchNotifications();
        fetchUnreadCount();
      }
    },
    [fetchNotifications, fetchUnreadCount]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }

      // Optimistically update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err: any) {
      console.error("Error marking all notifications as read:", err);
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [fetchNotifications, fetchUnreadCount]);

  // PHASE 4: Socket Integration
  useEffect(() => {
    if (!user) return;

    const socket = getSocket(user.id);
    socketRef.current = socket;

    socket.on("new_notification", (newNotif: any) => {
      // 1. Chat-Aware Logic: Ignore if user is in this active chat
      if (activeChatId && newNotif.chatId === activeChatId) {
        return;
      }

      // 2. Deduplication check: using a hash since instant notifications won't have DB IDs yet
      const notifHash = `${newNotif.chatId}-${newNotif.created_at}-${newNotif.title}`;
      if (processedIds.current.has(notifHash)) return;
      processedIds.current.add(notifHash);

      // 3. Add to local state (instant update)
      const mappedNotif: Notification = {
        id: `temp-${Date.now()}`,
        user_id: user.id,
        type: newNotif.type,
        title: newNotif.title,
        message: newNotif.message,
        entity_type: "chat",
        entity_id: newNotif.chatId,
        is_read: false,
        created_at: newNotif.created_at,
        image_url: newNotif.image_url,
      };

      setNotifications((prev) => [mappedNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    socket.on("unread_update", ({ count }: { count: number }) => {
      setUnreadCount(count);
    });

    return () => {
      socket.off("new_notification");
      socket.off("unread_update");
    };
  }, [user, activeChatId]);

  // PHASE 4: Web Push Registration
  useEffect(() => {
    if (!user) return;
    
    const initPush = async () => {
      await registerServiceWorker();
      await subscribeUserToPush();
    };

    initPush();
  }, [user]);

  // Existing Supabase Realtime Subscription
  useEffect(() => {
    if (!user || !realtime) return;

    const supabase = createClient();

    const setupRealtime = async () => {
      const { data: userRow } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (!userRow) return;

      const userId = userRow.id;

      const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            
            // Deduplication: if we already have a record for this transition (matching socket one)
            // or if we already added this specific DB ID from a fetch
            if (processedIds.current.has(newNotification.id)) return;
            processedIds.current.add(newNotification.id);

            setNotifications((prev) => [newNotification, ...prev]);
            if (!newNotification.is_read) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const updatedNotification = payload.new as Notification;
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === updatedNotification.id ? updatedNotification : n
              )
            );
            if (payload.old.is_read !== updatedNotification.is_read) {
              setUnreadCount((prev) =>
                updatedNotification.is_read ? Math.max(0, prev - 1) : prev + 1
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtime();

    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, [user, realtime]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
