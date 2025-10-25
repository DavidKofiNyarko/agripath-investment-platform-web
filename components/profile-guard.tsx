"use client";

import React, { useState, useEffect } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { useUser } from "@/contexts/UserContext";
import ProfileCompletionModal from "@/components/profile-completion-modal";
import Loading from "@/components/ui/loading";

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
    return <Loading size="md" className="min-h-screen" />;
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
