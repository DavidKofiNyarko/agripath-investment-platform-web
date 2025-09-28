'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { useUser } from '@/contexts/UserContext';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  country: string | null;
  phone_number: string | null;
  pin: string | null;
  kyc_status: 'pending' | 'verified' | 'rejected' | null;
  kyc_documents: {
    id_front?: string;
    id_back?: string;
    selfie?: string;
  } | null;
  user_id: string | null;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const supabase = createClient();

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If profile doesn't exist, create one inline
        try {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              first_name: user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.first_name || '',
              last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || user.user_metadata?.last_name || '',
              email: user.email || '',
              country: user.user_metadata?.country || 'Ghana',
              phone_number: user.user_metadata?.phone_number || '',
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            return;
          }

          setProfile(newProfile);
        } catch (createError) {
          console.error('Error creating profile:', createError);
        }
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  const createProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          first_name: user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || user.user_metadata?.last_name || '',
          email: user.email || '',
          country: user.user_metadata?.country || 'Ghana',
          phone_number: user.user_metadata?.phone_number || '',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  }, [user, supabase]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const refreshProfile = async () => {
    setLoading(true);
    await fetchProfile();
  };

  useEffect(() => {
    fetchProfile();
  }, [user, fetchProfile]); // Added fetchProfile dependency

  const value = {
    profile,
    loading,
    updateProfile,
    refreshProfile
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
