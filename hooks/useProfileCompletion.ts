'use client';

import { useMemo } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { useUser } from '@/contexts/UserContext';

export const useProfileCompletion = () => {
  const { profile, loading: profileLoading } = useProfile();
  const { user, loading: userLoading } = useUser();

  const isProfileComplete = useMemo(() => {
    if (profileLoading || userLoading || !profile || !user) {
      return false;
    }

    // Check if all required fields are present
    const hasFirstName = profile.first_name && profile.first_name.trim() !== '';
    const hasLastName = profile.last_name && profile.last_name.trim() !== '';
    const hasEmail = profile.email && profile.email.trim() !== '' && profile.email.includes('@');
    const hasPin = profile.pin && profile.pin.trim() !== '';

    return hasFirstName && hasLastName && hasEmail && hasPin;
  }, [profile, user, profileLoading, userLoading]);

  const missingFields = useMemo(() => {
    if (!profile) return [];

    const missing = [];
    
    if (!profile.first_name || profile.first_name.trim() === '') {
      missing.push('First Name');
    }
    if (!profile.last_name || profile.last_name.trim() === '') {
      missing.push('Last Name');
    }
    if (!profile.email || profile.email.trim() === '' || !profile.email.includes('@')) {
      missing.push('Email Address');
    }
    if (!profile.pin || profile.pin.trim() === '') {
      missing.push('Transaction PIN');
    }

    return missing;
  }, [profile]);

  const needsProfileSetup = useMemo(() => {
    return !isProfileComplete && !profileLoading && !userLoading && profile !== null;
  }, [isProfileComplete, profileLoading, userLoading, profile]);

  return {
    isProfileComplete,
    missingFields,
    needsProfileSetup,
    isLoading: profileLoading || userLoading
  };
};
