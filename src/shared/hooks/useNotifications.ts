"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase";
import { Notification } from "@/shared/types/notifications";

interface UseNotificationsOptions {
  limit?: number;
  unreadOnly?: boolean;
  realtime?: boolean;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { limit = 50, unreadOnly = false, realtime = true } = options;
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

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
      setNotifications(data.notifications || []);
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
        // Refetch on error
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
      // Refetch on error
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [fetchNotifications, fetchUnreadCount]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user || !realtime) return;

    const supabase = createClient();

    // Get user UUID for subscription
    const setupRealtime = async () => {
      const { data: userRow } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (!userRow) return;

      const userId = userRow.id;

      // Subscribe to new notifications
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
            // Update unread count if status changed
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
