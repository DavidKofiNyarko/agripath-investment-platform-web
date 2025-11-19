"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
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

  // Use ref to track if fetch is in progress to prevent duplicate calls
  const isFetchingRef = useRef(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedProfileIdRef = useRef<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!profile?.id) return;

    // Prevent duplicate concurrent calls
    if (isFetchingRef.current) {
      fetchTimeoutRef.current = null;
    }

    isFetchingRef.current = true;
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
        return;
      }

      if (!notifications || notifications.length === 0) {
        setNotifications([]);
        return;
      }

      // Fetch user's read status for these notifications
      const notificationIds = notifications.map((n) => n.id);
      const { data: userNotifications, error: userNotificationsError } =
        await supabase
          .from("users_notifications")
          .select("notifications_id, read_at, clicked_at")
          .eq("user_id", profile.id)
          .in("notifications_id", notificationIds);

      if (userNotificationsError) {
        // If error fetching read status, treat all as unread
        const transformedNotifications: Notification[] = notifications.map(
          (notification) => ({
            id: notification.id,
            title: notification.title,
            body: notification.body,
            type: (notification.type || "Email") as "Email" | "SMS",
            status: "unread" as const,
            created_at: notification.published_at || notification.created_at,
          })
        );
        setNotifications(transformedNotifications);
        return;
      }

      // Create a map of notification IDs to read status
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
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [profile?.id]);

  const markAsRead = async (notificationId: string) => {
    try {
      if (!profile?.id) {
        return;
      }

      const supabase = createClient();
      const now = new Date().toISOString();

      // First, get the notification to get its type
      const { data: notification, error: notificationError } = await supabase
        .from("notifications")
        .select("type")
        .eq("id", notificationId)
        .single();

      if (notificationError || !notification) {
        return;
      }

      // Check if record exists
      const { data: existing, error: checkError } = await supabase
        .from("users_notifications")
        .select("id")
        .eq("notifications_id", notificationId)
        .eq("user_id", profile.id)
        .maybeSingle();

      let error;

      if (existing && !checkError) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("users_notifications")
          .update({
            read_at: now,
            updated_at: now,
          })
          .eq("notifications_id", notificationId)
          .eq("user_id", profile.id);
        error = updateError;
      } else {
        // Insert new record with required type field
        const { error: insertError } = await supabase
          .from("users_notifications")
          .insert({
            notifications_id: notificationId,
            user_id: profile.id,
            type: notification.type || "Email",
            read_at: now,
            updated_at: now,
          });
        error = insertError;
      }

      if (error) {
        return;
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, status: "read" as const, read_at: n.read_at || now }
            : n
        )
      );

      // unreadCount is automatically computed from notifications, no need to update it manually
    } catch (err) {
      // Error marking notification as read
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!profile?.id) {
        return;
      }

      const unreadNotifications = notifications.filter(
        (n) => n.status === "unread"
      );

      if (unreadNotifications.length === 0) {
        return;
      }

      const supabase = createClient();
      const now = new Date().toISOString();
      const notificationIds = unreadNotifications.map((n) => n.id);

      // First, fetch all notification types in one query
      const { data: notificationsData, error: notificationsError } =
        await supabase
          .from("notifications")
          .select("id, type")
          .in("id", notificationIds);

      if (notificationsError) {
        return;
      }

      // Create a map of notification IDs to types
      const notificationTypeMap = new Map(
        (notificationsData || []).map((n) => [n.id, n.type || "Email"])
      );

      // Process each notification individually to handle insert/update
      for (const notificationId of notificationIds) {
        // Check if record exists
        const { data: existing, error: checkError } = await supabase
          .from("users_notifications")
          .select("id")
          .eq("notifications_id", notificationId)
          .eq("user_id", profile.id)
          .maybeSingle();

        const notificationType =
          notificationTypeMap.get(notificationId) || "Email";

        if (existing && !checkError) {
          // Update existing record
          await supabase
            .from("users_notifications")
            .update({
              read_at: now,
              updated_at: now,
            })
            .eq("notifications_id", notificationId)
            .eq("user_id", profile.id);
        } else {
          // Insert new record with required type field
          await supabase.from("users_notifications").insert({
            notifications_id: notificationId,
            user_id: profile.id,
            type: notificationType,
            read_at: now,
            updated_at: now,
          });
        }
      }

      // Update local state after successful database update
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          status: "read" as const,
          read_at: n.read_at || now,
        }))
      );

      // unreadCount is automatically computed from notifications, no need to update it manually
    } catch (err) {
      // Error marking all notifications as read
    }
  };

  const updatePreferences = async (
    newPreferences: Partial<NotificationPreferences>
  ) => {
    try {
      setPreferences((prev) => ({ ...prev, ...newPreferences }));
      // TODO: Save preferences to database if needed
    } catch (error) {
      // Error updating preferences
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
      } else {
        // Handle error
      }
    } catch (error) {
      // Error sending test notification
    }
  };

  const navigateToUpdates = (notificationId: string) => {
    // Mark as read first
    markAsRead(notificationId);

    // Navigate to updates page using Next.js router
    router.push("/updates");
  };

  // Fetch notifications when profile is available (only once per profile)
  useEffect(() => {
    if (
      profile?.id &&
      lastFetchedProfileIdRef.current !== profile.id &&
      !isFetchingRef.current
    ) {
      lastFetchedProfileIdRef.current = profile.id;
      fetchNotifications();
    }
  }, [profile?.id, fetchNotifications]);

  // Real-time subscription for notifications - update state directly from payload (no API calls)
  useEffect(() => {
    if (!profile?.id) return;

    const supabase = createClient();
    let channel: any = null;

    try {
      // Listen to notifications table for new published notifications
      channel = supabase
        .channel(`notifications-changes-${profile.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT", // Listen to new notifications
            schema: "public",
            table: "notifications",
            filter: `status=eq.Published`, // Only published notifications
          },
          (payload) => {
            if (payload.new) {
              const newNotification = payload.new as any;
              setNotifications((prev) => [
                {
                  id: newNotification.id,
                  title: newNotification.title,
                  body: newNotification.body,
                  type: (newNotification.type || "Email") as "Email" | "SMS",
                  status: "unread" as const,
                  created_at:
                    newNotification.published_at || newNotification.created_at,
                },
                ...prev,
              ]);
            }
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
            if (payload.new) {
              const updatedNotification = payload.new as any;
              setNotifications((prev) =>
                prev.map((n) =>
                  n.id === updatedNotification.id
                    ? {
                        ...n,
                        title: updatedNotification.title,
                        body: updatedNotification.body,
                        type: (updatedNotification.type || "Email") as
                          | "Email"
                          | "SMS",
                      }
                    : n
                )
              );
            }
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
            if (payload.new) {
              const userNotification = payload.new as any;
              setNotifications((prev) =>
                prev.map((n) =>
                  n.id === userNotification.notifications_id
                    ? {
                        ...n,
                        status: userNotification.read_at
                          ? ("read" as const)
                          : ("unread" as const),
                        read_at: userNotification.read_at,
                        clicked_at: userNotification.clicked_at,
                      }
                    : n
                )
              );
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            // Successfully subscribed
          } else if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            // Handle channel errors
          }
        });

      return () => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
    } catch (error) {
      // Error setting up real-time subscription
    }
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
