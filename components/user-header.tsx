"use client";

import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useNotifications } from "@/contexts/NotificationContext";
import LogoSVG from "./logo-svg";

interface UserHeaderProps {
  title?: string;
  showDate?: boolean;
  className?: string;
}

const UserHeader: React.FC<UserHeaderProps> = ({
  title,
  showDate = true,
  className = "",
}) => {
  const { user } = useUser();
  const { profile } = useProfile();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    sendTestNotification,
    navigateToUpdates,
  } = useNotifications();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const getUserName = () => {
    return (
      profile?.first_name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      "User"
    );
  };

  const getUserAvatar = () => {
    return (
      user?.user_metadata?.picture ||
      user?.user_metadata?.avatar_url ||
      profile?.avatar_url ||
      null
    ); // Return null to use fallback avatar
  };

  const getUserInitials = () => {
    const name = getUserName();
    return name[0]?.toUpperCase() || "U";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getShortDate = () => {
    return new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  const getShortTime = () => {
    return new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleNotificationClick = async (notificationId: string) => {
    // Navigate to updates page and mark as read
    navigateToUpdates(notificationId);
    setIsNotificationOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleSendTestNotification = async () => {
    await sendTestNotification();
    setIsNotificationOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationOpen]);

  return (
    <div
      className={`flex items-center justify-between gap-2 sm:gap-4 ${className}`}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <Avatar className="h-9 w-9 sm:h-12 sm:w-12 flex-shrink-0">
          <AvatarImage src={getUserAvatar()} alt={getUserName()} />
          <AvatarFallback className="text-xs sm:text-base">
            {getUserInitials()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-xl font-semibold text-gray-900 truncate">
            {title || `Hi, ${getUserName()} 👋`}
          </h1>
          {showDate && (
            <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
              {getGreeting()}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="relative h-10 w-10 p-0 hover:bg-gray-100"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs font-medium text-white flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>

          {/* Notification Dropdown */}
          {isNotificationOpen && (
            <div className="absolute right-0 top-12 w-[calc(100vw-2rem)] sm:w-80 lg:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[70vh] overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-green-600 hover:text-green-700"
                      >
                        Mark all read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsNotificationOpen(false)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                        notification.status === "unread" ? "bg-blue-50/30" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                            notification.status === "unread"
                              ? "bg-blue-500"
                              : "bg-gray-300"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.body}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {new Date(
                                  notification.created_at
                                ).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500 capitalize">
                                {notification.type}
                              </span>
                            </div>
                            <span className="text-xs text-green-600 font-medium">
                              Click to view →
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {showDate && (
          <div className="text-left sm:text-right text-xs sm:text-sm text-gray-600 hidden sm:block">
            <div>
              {getCurrentDate()} • {getCurrentTime()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserHeader;
