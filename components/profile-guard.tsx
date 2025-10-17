'use client';

import React, { useState, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { useUser } from '@/contexts/UserContext';
import ProfileCompletionModal from '@/components/profile-completion-modal';

interface ProfileGuardProps {
  children: React.ReactNode;
}

const ProfileGuard: React.FC<ProfileGuardProps> = ({ children }) => {
  const { user } = useUser();
  const { profile, loading, isProfileCompletionRequired } = useProfile();
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    // Only check profile completion if user is authenticated and profile is loaded
    if (user && !loading && profile !== null) {
      if (isProfileCompletionRequired) {
        setShowProfileModal(true);
      } else {
        setShowProfileModal(false);
      }
    }
  }, [user, loading, profile, isProfileCompletionRequired]);

  const handleProfileComplete = () => {
    setShowProfileModal(false);
  };

  // Don't render children if profile completion is required
  if (user && !loading && isProfileCompletionRequired) {
    return (
      <ProfileCompletionModal 
        isOpen={true} 
        onComplete={handleProfileComplete} 
      />
    );
  }

  // Render children normally if profile is complete or user is not authenticated
  return <>{children}</>;
};

export default ProfileGuard;
