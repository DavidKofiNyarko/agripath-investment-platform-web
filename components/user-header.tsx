'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/contexts/UserContext';
import { useProfile } from '@/contexts/ProfileContext';

interface UserHeaderProps {
  title?: string;
  showDate?: boolean;
  className?: string;
}

const UserHeader: React.FC<UserHeaderProps> = ({ 
  title, 
  showDate = true, 
  className = "" 
}) => {
  const { user } = useUser();
  const { profile } = useProfile();

  const getUserName = () => {
    return profile?.first_name || 
           user?.user_metadata?.full_name || 
           user?.user_metadata?.name || 
           "User";
  };

  const getUserAvatar = () => {
    return user?.user_metadata?.picture || 
           user?.user_metadata?.avatar_url || 
           profile?.avatar_url ||
           "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face";
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
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage 
            src={getUserAvatar()} 
            alt={getUserName()} 
          />
          <AvatarFallback>
            {getUserInitials()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {title || `Hi, ${getUserName()} 👋`}
          </h1>
          {showDate && (
            <p className="text-gray-600">
              {getGreeting()}
            </p>
          )}
        </div>
      </div>
      {showDate && (
        <div className="flex items-center gap-4">
          <div className="text-right text-sm text-gray-600">
            {getCurrentDate()} • {getCurrentTime()}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserHeader;
