"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { createClient } from "@/app/utils/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { hashPin, verifyPin, isValidPinFormat } from "@/lib/pin-security";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  country: string | null;
  phone_number: string | null;
  pin: string | null;
  kyc_status: "pending" | "verified" | "rejected" | "complete" | null; // Updated to include 'complete'
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
  isProfileComplete: boolean;
  isProfileCompletionRequired: boolean;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  createProfile: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  verifyUserPin: (pin: string) => Promise<boolean>;
  updateUserPin: (newPin: string) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};

export const ProfileProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const supabase = createClient();

  // Check if profile is complete
  const isProfileComplete = useCallback((profile: Profile | null): boolean => {
    if (!profile) return false;

    // Check if all required fields are filled
    const hasBasicInfo = !!(
      profile.first_name &&
      profile.last_name &&
      profile.email &&
      profile.phone_number
    );

    // Check if PIN is set
    const hasPin = !!profile.pin;

    // Check if KYC is submitted (pending, verified, or complete)
    const hasKyc =
      profile.kyc_status === "verified" ||
      profile.kyc_status === "pending" ||
      profile.kyc_status === "complete";

    return hasBasicInfo && hasPin && hasKyc;
  }, []);

  // Check if profile completion is required (missing essential fields)
  const isProfileCompletionRequired = useCallback(
    (profile: Profile | null): boolean => {
      if (!profile) return true;

      // Check if essential fields are missing
      const missingEssentialFields = !(
        profile.first_name &&
        profile.last_name &&
        profile.email &&
        profile.phone_number &&
        profile.pin
      );

      return missingEssentialFields;
    },
    []
  );

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // First try to find profile by user_id
      const { data, error } = await supabase
        .from("profile")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        // If profile not found by user_id, try to find by id
        const { data: dataById, error: errorById } = await supabase
          .from("profile")
          .select("*")
          .eq("id", user.id)
          .single();

        if (errorById) {
          // Profile doesn't exist, create it
          try {
            const { data: newProfile, error: createError } = await supabase
              .from("profile")
              .insert({
                id: user.id,
                user_id: user.id,
                email: user.email || "",
              })
              .select()
              .single();

            if (createError) {
              setProfile(null);
              setLoading(false);
              return;
            }

            setProfile(newProfile);
            setLoading(false);
            return;
          } catch (createErr) {
            setProfile(null);
            setLoading(false);
            return;
          }
        } else {
          // Found by id, update user_id if needed
          if (dataById && !dataById.user_id) {
            const { error: updateError } = await supabase
              .from("profile")
              .update({ user_id: user.id })
              .eq("id", user.id);

            if (updateError) {
              setProfile(dataById);
              setLoading(false);
              return;
            }
          }
          setProfile(dataById);
          setLoading(false);
          return;
        }
      }

      setProfile(data);
      setLoading(false);
    } catch (error) {
      setProfile(null);
      setLoading(false);
    }
  }, [user, supabase]);

  const createProfile = useCallback(async () => {
    if (!user) return;

    try {
      // First check if profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profile")
        .select("*")
        .eq("id", user.id)
        .single();

      if (existingProfile) {
        // Profile exists, update it to link user_id
        const { data, error } = await supabase
          .from("profile")
          .update({
            user_id: user.id,
            first_name:
              user.user_metadata?.full_name?.split(" ")[0] ||
              user.user_metadata?.first_name ||
              existingProfile.first_name,
            last_name:
              user.user_metadata?.full_name?.split(" ").slice(1).join(" ") ||
              user.user_metadata?.last_name ||
              existingProfile.last_name,
            email: user.email || existingProfile.email,
            avatar_url:
              user.user_metadata?.picture ||
              user.user_metadata?.avatar_url ||
              existingProfile.avatar_url,
            country:
              user.user_metadata?.country || existingProfile.country || "Ghana",
            phone_number:
              user.user_metadata?.phone_number || existingProfile.phone_number,
          })
          .eq("id", user.id)
          .select()
          .single();

        if (error) {
          console.error("Error updating profile:", error);
          return;
        }

        if (data) {
          setProfile(data);
        }
      } else {
        // Profile doesn't exist, create new one
        const { data, error } = await supabase
          .from("profile")
          .insert({
            id: user.id,
            first_name:
              user.user_metadata?.full_name?.split(" ")[0] ||
              user.user_metadata?.first_name ||
              "",
            last_name:
              user.user_metadata?.full_name?.split(" ").slice(1).join(" ") ||
              user.user_metadata?.last_name ||
              "",
            email: user.email || "",
            avatar_url:
              user.user_metadata?.picture ||
              user.user_metadata?.avatar_url ||
              "",
            country: user.user_metadata?.country || "Ghana",
            phone_number: user.user_metadata?.phone_number || "",
            user_id: user.id,
          })
          .select()
          .single();

        if (error) {
          return;
        }

        if (data) {
          setProfile(data);
        }
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      // Error creating profile
    }
  }, [user, supabase]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return;

    try {
      // Hash PIN if it's being updated
      const processedUpdates = { ...updates };
      if (updates.pin && isValidPinFormat(updates.pin)) {
        processedUpdates.pin = await hashPin(updates.pin);
      }

      const { data, error } = await supabase
        .from("profile")
        .update(processedUpdates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      // Error updating profile
    }
    await fetchProfile();
  };

  const verifyUserPin = async (pin: string): Promise<boolean> => {
    if (!profile?.pin) return false;
    return await verifyPin(pin, profile.pin);
  };

  const updateUserPin = async (newPin: string): Promise<void> => {
    if (!isValidPinFormat(newPin)) {
      throw new Error("PIN must be a 4-digit number");
    }

    const hashedPin = await hashPin(newPin);
    await updateProfile({ pin: hashedPin });
  };

  useEffect(() => {
    fetchProfile();
  }, [user, fetchProfile]); // Added fetchProfile dependency

  const value = {
    profile,
    loading,
    isProfileComplete: isProfileComplete(profile),
    isProfileCompletionRequired: isProfileCompletionRequired(profile),
    updateProfile,
    createProfile,
    refreshProfile,
    verifyUserPin,
    updateUserPin,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};
