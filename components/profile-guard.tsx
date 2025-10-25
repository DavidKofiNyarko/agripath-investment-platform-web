"use client";

import React, { useState, useEffect } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { useUser } from "@/contexts/UserContext";
import ProfileCompletionModal from "@/components/profile-completion-modal";

interface ProfileGuardProps {
  children: React.ReactNode;
}

const ProfileGuard: React.FC<ProfileGuardProps> = ({ children }) => {
  const { user, loading: userLoading } = useUser();
  const {
    profile,
    loading: profileLoading,
    isProfileCompletionRequired,
  } = useProfile();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false);

  // Combined loading state
  const isLoading = userLoading || profileLoading;

  useEffect(() => {
    // Only check profile completion if user is authenticated and profile is loaded
    if (user && !isLoading && profile !== null) {
      setHasCheckedProfile(true);
      if (isProfileCompletionRequired) {
        setShowProfileModal(true);
      } else {
        setShowProfileModal(false);
      }
    } else if (!user) {
      // Reset state when user logs out
      setHasCheckedProfile(false);
      setShowProfileModal(false);
    }
  }, [user, isLoading, profile, isProfileCompletionRequired]);

  const handleProfileComplete = () => {
    setShowProfileModal(false);
  };

  // Show loading state while checking profile
  if (isLoading || (user && !hasCheckedProfile)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if profile completion is required
  if (user && hasCheckedProfile && isProfileCompletionRequired) {
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
