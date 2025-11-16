"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import UserHeader from "@/components/user-header";
import { useUser } from "@/contexts/UserContext";
import { useProfile } from "@/contexts/ProfileContext";
import KycModal from "@/components/kyc-modal";
import PinChangeModal from "@/components/pin-change-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Search,
  Filter,
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  X,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Shield,
  Bell,
  CreditCard,
  Trash2,
  CheckCircle,
  PartyPopper,
} from "lucide-react";
import { logoutAllDevices } from "@/lib/authService";
import NotificationPreferencesComponent from "@/components/notification-preferences";
import { createClient } from "@/app/utils/supabase/client";
import { countries } from "@/lib/countries";
import { Upload } from "lucide-react";

function SettingsPage() {
  const router = useRouter();
  const { user } = useUser();
  const { profile, updateProfile, refreshProfile } = useProfile();
  const [activeTab, setActiveTab] = useState("profile");
  const [activeSubTab, setActiveSubTab] = useState("personal");
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isProfileSuccessOpen, setIsProfileSuccessOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    country: "",
    phone_number: "",
  });
  const supabase = createClient();

  // Populate form with profile data when profile loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        country: profile.country || "",
        phone_number: profile.phone_number || "",
      });
    }
  }, [profile]);

  // Check if form has been modified
  const isFormModified = () => {
    if (!profile) return false;
    return (
      profileForm.first_name !== (profile.first_name || "") ||
      profileForm.last_name !== (profile.last_name || "") ||
      profileForm.phone_number !== (profile.phone_number || "") ||
      profileForm.country !== (profile.country || "")
    );
  };

  // Handle profile picture upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (file.size > maxSize) {
      setUploadError("File size must be less than 5MB");
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setUploadError("Only JPEG, PNG, and WebP files are allowed");
      return;
    }

    setIsUploadingAvatar(true);
    setUploadError(null);

    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Create a unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("project-images") // Using existing bucket, or create a new 'avatars' bucket
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true, // Allow overwriting
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("project-images").getPublicUrl(uploadData.path);

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: publicUrl });

      // Refresh profile to show new avatar
      await refreshProfile();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload profile picture"
      );
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    switch (tabId) {
      case "profile":
        setActiveSubTab("personal");
        break;
      case "security":
        setActiveSubTab("password");
        break;
      case "notifications":
        setActiveSubTab("notifications");
        break;
      default:
        setActiveSubTab("personal");
    }
  };

  // const [showCurrentPin, setShowCurrentPin] = useState(false); // Unused
  // const [showNewPin, setShowNewPin] = useState(false); // Unused
  // const [showConfirmPin, setShowConfirmPin] = useState(false); // Unused

  const handleProfileUpdate = async () => {
    setIsUpdatingProfile(true);
    try {
      // Exclude email from updates since it's read-only
      const { email, ...updateData } = profileForm;
      await updateProfile(updateData);
      setIsProfileSuccessOpen(true);
      // Reset form to show updated values
      if (profile) {
        setProfileForm({
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          email: profile.email || "",
          country: profile.country || "",
          phone_number: profile.phone_number || "",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      // You could add error state here to show user feedback
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const settingsTabs = [
    { id: "profile", label: "Profile & KYC", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  const notificationSettings = [
    {
      id: "email",
      title: "Email Notifications",
      description: "Get notified about important updates via email",
      enabled: true,
    },
    {
      id: "sms",
      title: "SMS Notifications",
      description: "Receive SMS alerts for critical account activities",
      enabled: false,
    },
    {
      id: "push",
      title: "Push Notifications",
      description: "Get real-time notifications on your device",
      enabled: true,
    },
    {
      id: "investment",
      title: "Investment Updates",
      description: "Notifications about your investment portfolio",
      enabled: true,
    },
    {
      id: "market",
      title: "Market Updates",
      description: "Stay informed about market trends and opportunities",
      enabled: false,
    },
    {
      id: "security",
      title: "Security Alerts",
      description: "Immediate alerts for security-related activities",
      enabled: true,
    },
  ];

  const handleLogoutAllDevices = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await logoutAllDevices();
      // The logoutAllDevices function handles the redirect
    } catch (error) {
      console.error("Logout all devices failed:", error);
      setLogoutError("Failed to logout from all devices. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <UserHeader title="Settings" />

        {/* Settings Tabs */}
        <div className="flex sm:flex-row space-x-1 bg-gray-100 p-1 rounded-lg">
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-1 sm:space-x-2 py-3 px-3 sm:px-4 rounded-md transition-colors text-sm sm:text-base ${
                activeTab === tab.id
                  ? "bg-white text-green-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <tab.icon className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="font-medium truncate hidden sm:inline">
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Personal Information */}
            {activeSubTab === "personal" && (
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Picture Display */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative group">
                      {profile?.avatar_url ||
                      user?.user_metadata?.picture ||
                      user?.user_metadata?.avatar_url ? (
                        <img
                          src={
                            profile?.avatar_url ||
                            user?.user_metadata?.picture ||
                            user?.user_metadata?.avatar_url
                          }
                          alt="Profile Picture"
                          className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 shadow-lg"
                          onError={(e) => {
                            // If image fails to load, show placeholder
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove(
                              "hidden"
                            );
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center border-4 border-gray-200 shadow-lg ${
                          profile?.avatar_url ||
                          user?.user_metadata?.picture ||
                          user?.user_metadata?.avatar_url
                            ? "hidden"
                            : ""
                        }`}
                      >
                        <User className="h-12 w-12 text-white" />
                      </div>
                      {/* Upload Overlay */}
                      <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <label
                          htmlFor="avatar-upload"
                          className="cursor-pointer flex items-center justify-center w-full h-full"
                        >
                          {isUploadingAvatar ? (
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                          ) : (
                            <Upload className="h-6 w-6 text-white" />
                          )}
                        </label>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={isUploadingAvatar}
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {profileForm.first_name && profileForm.last_name
                          ? `${profileForm.first_name} ${profileForm.last_name}`
                          : "Profile Picture"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {profile?.avatar_url ||
                        user?.user_metadata?.picture ||
                        user?.user_metadata?.avatar_url
                          ? "Click to change profile picture"
                          : "No profile picture set"}
                      </p>
                      {uploadError && (
                        <p className="text-sm text-red-600 mt-1">{uploadError}</p>
                      )}
                    </div>
                    {/* Upload Button (Alternative) */}
                    <label
                      htmlFor="avatar-upload-button"
                      className="cursor-pointer"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingAvatar}
                        className="flex items-center space-x-2"
                      >
                        {isUploadingAvatar ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            <span>
                              {profile?.avatar_url ||
                              user?.user_metadata?.picture ||
                              user?.user_metadata?.avatar_url
                                ? "Change Picture"
                                : "Upload Picture"}
                            </span>
                          </>
                        )}
                      </Button>
                      <input
                        id="avatar-upload-button"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={isUploadingAvatar}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profileForm.first_name}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            first_name: e.target.value,
                          })
                        }
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profileForm.last_name}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            last_name: e.target.value,
                          })
                        }
                        placeholder="Enter your last name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        readOnly
                        className="bg-gray-50 text-gray-600 cursor-not-allowed"
                        placeholder="Email address cannot be changed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Select
                        value={profileForm.country || undefined}
                        onValueChange={(value) =>
                          setProfileForm({ ...profileForm, country: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {countries.map((country) => (
                            <SelectItem key={country.value} value={country.value}>
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        value={profileForm.phone_number}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            phone_number: e.target.value,
                          })
                        }
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleProfileUpdate}
                    disabled={isUpdatingProfile || !isFormModified()}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating Profile...
                      </>
                    ) : !isFormModified() ? (
                      "No Changes Made"
                    ) : (
                      "Update Profile"
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* KYC Status */}
            <Card>
              <CardHeader>
                <CardTitle>KYC Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      Identity Verification
                    </h3>
                    <p className="text-sm text-gray-600">
                      {profile?.kyc_status === "verified"
                        ? "Your identity has been verified"
                        : "Complete your identity verification"}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium text-center ${
                        profile?.kyc_status === "verified"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {profile?.kyc_status === "verified"
                        ? "Verified"
                        : "Pending"}
                    </div>
                    <Button
                      onClick={() => {
                        if (profile?.kyc_status === "verified") {
                          setIsKycModalOpen(true);
                        } else {
                          // Navigate to KYC verification page
                          router.push("/kyc-verification");
                        }
                      }}
                      variant={
                        profile?.kyc_status === "verified"
                          ? "outline"
                          : "default"
                      }
                      className={`w-full sm:w-auto ${
                        profile?.kyc_status === "verified"
                          ? ""
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {profile?.kyc_status === "verified"
                        ? "View Details"
                        : "Complete KYC"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Transaction PIN
                    </h3>
                    <p className="text-sm text-gray-600">
                      {profile?.pin
                        ? "Secure your transactions with a 4-digit PIN"
                        : "Set up a 4-digit PIN to secure your transactions"}
                    </p>
                    <div className="flex items-center mt-2">
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          profile?.pin
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {profile?.pin ? "PIN Set" : "No PIN Set"}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsPinModalOpen(true)}
                    variant="outline"
                  >
                    {profile?.pin ? "Change PIN" : "Set PIN"}
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Logout All Devices
                    </h3>
                    <p className="text-sm text-gray-600">
                      Sign out from all devices and sessions
                    </p>
                  </div>
                  <Button
                    onClick={handleLogoutAllDevices}
                    disabled={isLoggingOut}
                    variant="destructive"
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Logging Out...
                      </>
                    ) : (
                      "Logout All Devices"
                    )}
                  </Button>
                </div>

                {logoutError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                      <p className="text-sm text-red-800">{logoutError}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <NotificationPreferencesComponent />
          </div>
        )}

        {/* Modals */}
        <KycModal
          isOpen={isKycModalOpen}
          onClose={() => setIsKycModalOpen(false)}
          onCompleteKyc={() => {
            setIsKycModalOpen(false);
            // Navigate to KYC verification page
            router.push("/kyc-verification");
          }}
          onEditKyc={() => {
            setIsKycModalOpen(false);
            router.push("/kyc-verification?edit=true");
          }}
        />

        <PinChangeModal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          onSuccess={() => {
            setIsPinModalOpen(false);
            // Handle PIN change success
          }}
        />

        {/* Profile Success Modal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isProfileSuccessOpen ? 1 : 0 }}
          exit={{ opacity: 0 }}
        >
          {isProfileSuccessOpen && (
            <div className="fixed inset-0 bg-gray-800/80 bg-opacity-50 flex items-center justify-center z-50">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 max-w-md mx-4"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                      duration: 0.6,
                    }}
                    className="mb-4"
                  >
                    <PartyPopper className="h-16 w-16 text-green-600 mx-auto" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Profile Updated Successfully!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Your profile information has been updated and saved.
                  </p>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setIsProfileSuccessOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default SettingsPage;
