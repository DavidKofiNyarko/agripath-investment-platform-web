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
      <>
        <ProfileCompletionModal 
          isOpen={showProfileModal} 
          onComplete={handleProfileComplete} 
        />
        {/* Render a loading state or empty div while profile completion is required */}
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-green-600 rounded-full"></div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Agripath</h3>
            <p className="text-gray-600">Please complete your profile to continue</p>
          </div>
        </div>
      </>
    );
  }

  // Render children normally if profile is complete or user is not authenticated
  return <>{children}</>;
};

export default ProfileGuard;
