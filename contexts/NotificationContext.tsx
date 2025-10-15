'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/utils/supabase/client';
import { useProfile } from './ProfileContext';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'Email' | 'SMS';
  status: 'unread' | 'read';
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
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  sendTestNotification: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const defaultPreferences: NotificationPreferences = {
  email_notifications: true,
  sms_notifications: false,
  push_notifications: true,
  investment_updates: true,
  market_updates: false,
  security_alerts: true,
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useProfile();
  const router = useRouter();

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const fetchNotifications = async () => {
    if (!profile?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch real notifications from users_notifications table
      const supabase = createClient();
      const { data: notifications, error } = await supabase
        .from('users_notifications')
        .select(`
          id,
          title,
          body,
          type,
          status,
          created_at,
          read_at
        `)
        .eq('user_id', profile.id)
        .eq('status', 'Published')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        setError('Failed to fetch notifications');
        return;
      }

      // Transform the data to match our Notification interface
      const transformedNotifications: Notification[] = notifications?.map(notification => ({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        type: notification.type as 'Email' | 'SMS',
        status: notification.read_at ? 'read' : 'unread',
        created_at: notification.created_at,
        read_at: notification.read_at
      })) || [];

      setNotifications(transformedNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Update local state immediately for better UX
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, status: 'read' as const, read_at: new Date().toISOString() }
            : n
        )
      );

      // Update in database using Supabase
      if (profile?.id) {
        const supabase = createClient();
        const { error } = await supabase
          .from('users_notifications')
          .update({ 
            read_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', notificationId)
          .eq('user_id', profile.id);

        if (error) {
          console.error('Failed to mark notification as read in database:', error);
        }
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Update local state immediately
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read' as const, read_at: new Date().toISOString() }))
      );

      // Update all unread notifications in database using Supabase
      if (profile?.id) {
        const unreadNotifications = notifications.filter(n => n.status === 'unread');
        
        if (unreadNotifications.length > 0) {
          const supabase = createClient();
          const { error } = await supabase
            .from('users_notifications')
            .update({ 
              read_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', profile.id)
            .eq('status', 'Published')
            .is('read_at', null);

          if (error) {
            console.error('Failed to mark all notifications as read:', error);
          }
        }
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!profile?.id) return;
    
    try {
      // For now, update local state since we can't modify the database
      setPreferences(prev => ({ ...prev, ...newPreferences }));
      console.log('Notification preferences updated:', newPreferences);
    } catch (err) {
      console.error('Error updating notification preferences:', err);
    }
  };

  const sendTestNotification = async () => {
    try {
      const response = await fetch('https://infra.agripath.co/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: "Agripath live email test",
          body: "This is to test if All type works by sending live email to all users in the profile",
          created_by: profile?.id || "d551d5e5-2e6b-4dd4-baf1-95efa6b66fc9",
          type: "Email",
          target_audience: "All"
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Test notification sent successfully:', result);
        
        // Refresh notifications after sending
        await fetchNotifications();
      } else {
        console.error('Failed to send test notification:', response.statusText);
      }
    } catch (err) {
      console.error('Error sending test notification:', err);
    }
  };

  const navigateToUpdates = (notificationId: string) => {
    // Mark as read first
    markAsRead(notificationId);
    
    // Navigate to updates page using Next.js router
    router.push('/updates');
  };

  // Fetch notifications when profile is available
  useEffect(() => {
    if (profile?.id) {
      fetchNotifications();
    }
  }, [profile?.id]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!profile?.id) return;
    
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
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
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
