"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/utils/supabase/client";
import { useProfile } from "./ProfileContext";
import { getApiBaseDomain } from "@/lib/apiConfig";

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: "Email" | "SMS";
  status: "unread" | "read";
  created_at: string;
  read_at?: string;
  clicked_at?: string;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  investment_updates: boolean;
  market_updates: boolean;
  security_alerts: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  updatePreferences: (
    preferences: Partial<NotificationPreferences>
  ) => Promise<void>;
  sendTestNotification: () => Promise<void>;
  navigateToUpdates: (notificationId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const defaultPreferences: NotificationPreferences = {
  email_notifications: true,
  sms_notifications: false,
  push_notifications: true,
  investment_updates: true,
  market_updates: false,
  security_alerts: true,
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useProfile();
  const router = useRouter();

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  const fetchNotifications = async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Fetch published notifications
      const { data: notifications, error: notificationsError } = await supabase
        .from("notifications")
        .select("id, title, body, type, status, created_at, published_at")
        .eq("status", "Published")
        .order("published_at", { ascending: false })
        .limit(50);

      if (notificationsError) {
        console.error("Error fetching notifications:", notificationsError);
        setError("Failed to fetch notifications");
        return;
      }

      if (!notifications || notifications.length === 0) {
        setNotifications([]);
        return;
      }

      // Fetch user's read status for these notifications
      const notificationIds = notifications.map((n) => n.id);
      const { data: userNotifications, error: userNotificationsError } = await supabase
        .from("users_notifications")
        .select("notifications_id, read_at, clicked_at")
        .eq("user_id", profile.id)
        .in("notifications_id", notificationIds);

      if (userNotificationsError) {
        console.error("Error fetching user notifications:", userNotificationsError);
        // Continue anyway, just won't have read status
      }

      // Create a map of notification_id -> read status
      const readStatusMap = new Map(
        (userNotifications || []).map((un) => [
          un.notifications_id,
          { read_at: un.read_at, clicked_at: un.clicked_at },
        ])
      );

      // Transform the data to match our Notification interface
      const transformedNotifications: Notification[] = notifications.map(
        (notification) => {
          const userNotification = readStatusMap.get(notification.id);
          
          return {
            id: notification.id,
            title: notification.title,
            body: notification.body,
            type: (notification.type || "Email") as "Email" | "SMS",
            status: userNotification?.read_at ? "read" : "unread",
            created_at: notification.published_at || notification.created_at,
            read_at: userNotification?.read_at,
            clicked_at: userNotification?.clicked_at,
          };
        }
      );

      setNotifications(transformedNotifications);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch notifications"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Update local state immediately for better UX
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? {
                ...n,
                status: "read" as const,
                read_at: new Date().toISOString(),
              }
            : n
        )
      );

      // Update or create entry in users_notifications table
      if (profile?.id) {
        const supabase = createClient();
        const now = new Date().toISOString();
        
        // First, check if entry exists
        const { data: existing } = await supabase
          .from("users_notifications")
          .select("id")
          .eq("notifications_id", notificationId)
          .eq("user_id", profile.id)
          .single();

        if (existing) {
          // Update existing entry
          const { error } = await supabase
            .from("users_notifications")
            .update({
              read_at: now,
              updated_at: now,
            })
            .eq("notifications_id", notificationId)
            .eq("user_id", profile.id);

          if (error) {
            console.error(
              "Failed to mark notification as read in database:",
              error
            );
          }
        } else {
          // Create new entry
          const { error } = await supabase
            .from("users_notifications")
            .insert({
              notifications_id: notificationId,
              user_id: profile.id,
              read_at: now,
            });

          if (error) {
            console.error(
              "Failed to create notification read entry:",
              error
            );
          }
        }
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Update local state immediately
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          status: "read" as const,
          read_at: new Date().toISOString(),
        }))
      );

      // Mark all unread notifications as read in database
      if (profile?.id) {
        const unreadNotifications = notifications.filter(
          (n) => n.status === "unread"
        );

        if (unreadNotifications.length > 0) {
          const supabase = createClient();
          const now = new Date().toISOString();
          const notificationIds = unreadNotifications.map((n) => n.id);

          // For each unread notification, upsert into users_notifications
          for (const notificationId of notificationIds) {
            // Check if entry exists
            const { data: existing } = await supabase
              .from("users_notifications")
              .select("id")
              .eq("notifications_id", notificationId)
              .eq("user_id", profile.id)
              .single();

            if (existing) {
              // Update existing
              await supabase
                .from("users_notifications")
                .update({
                  read_at: now,
                  updated_at: now,
                })
                .eq("notifications_id", notificationId)
                .eq("user_id", profile.id);
            } else {
              // Create new
              await supabase
                .from("users_notifications")
                .insert({
                  notifications_id: notificationId,
                  user_id: profile.id,
                  read_at: now,
                });
            }
          }
        }
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const updatePreferences = async (
    newPreferences: Partial<NotificationPreferences>
  ) => {
    if (!profile?.id) return;

    try {
      // For now, update local state since we can't modify the database
      setPreferences((prev) => ({ ...prev, ...newPreferences }));
      console.log("Notification preferences updated:", newPreferences);
    } catch (err) {
      console.error("Error updating notification preferences:", err);
    }
  };

  const sendTestNotification = async () => {
    try {
      const apiBaseUrl = getApiBaseDomain();

      const response = await fetch(`${apiBaseUrl}/api/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Agripath live email test",
          body: "This is to test if All type works by sending live email to all users in the profile",
          created_by: profile?.id || "d551d5e5-2e6b-4dd4-baf1-95efa6b66fc9",
          type: "Email",
          target_audience: "All",
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Test notification sent successfully:", result);

        // Refresh notifications after sending
        await fetchNotifications();
      } else {
        console.error("Failed to send test notification:", response.statusText);
      }
    } catch (err) {
      console.error("Error sending test notification:", err);
    }
  };

  const navigateToUpdates = (notificationId: string) => {
    // Mark as read first
    markAsRead(notificationId);

    // Navigate to updates page using Next.js router
    router.push("/updates");
  };

  // Fetch notifications when profile is available
  useEffect(() => {
    if (profile?.id) {
      fetchNotifications();
    }
  }, [profile?.id]);

  // Real-time subscription for notifications (replaces polling)
  useEffect(() => {
    if (!profile?.id) return;

    const supabase = createClient();
    let channel: any = null;

    try {
      // Listen to notifications table for new published notifications
      channel = supabase
        .channel("notifications-changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT", // Listen to new notifications
            schema: "public",
            table: "notifications",
            filter: `status=eq.Published`, // Only published notifications
          },
          (payload) => {
            console.log("New notification published:", payload);
            // Fetch notifications to get the new one
            fetchNotifications();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE", // Listen to updates (e.g., status changes)
            schema: "public",
            table: "notifications",
            filter: `status=eq.Published`, // Only published notifications
          },
          (payload) => {
            console.log("Notification updated:", payload);
            // Fetch notifications to get updated data
            fetchNotifications();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*", // Listen to read status changes
            schema: "public",
            table: "users_notifications",
            filter: `user_id=eq.${profile.id}`, // Only user's read status
          },
          (payload) => {
            console.log("Notification read status changed:", payload);
            // Refresh to update read status
            fetchNotifications();
          }
        )
        .subscribe((status) => {
          console.log("Real-time notifications subscription status:", status);
          if (status === "SUBSCRIBED") {
            console.log("✅ Successfully subscribed to notifications changes");
            console.log("🔄 Replaced polling with real-time updates");
          } else if (status === "CHANNEL_ERROR") {
            console.warn("❌ Real-time notifications subscription failed, falling back to polling");
            // Fallback to polling if realtime fails
            const interval = setInterval(() => {
              fetchNotifications();
            }, 30000);
            return () => clearInterval(interval);
          }
        });
    } catch (error) {
      console.error("Failed to set up real-time notifications subscription:", error);
      // Fallback to polling on error
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000);
      return () => clearInterval(interval);
    }

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [profile?.id]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    preferences,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    sendTestNotification,
    navigateToUpdates,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
