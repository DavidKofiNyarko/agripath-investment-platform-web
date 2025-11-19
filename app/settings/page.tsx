"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

interface PaymentAccount {
  id: string;
  profile_id: string;
  type: "bank" | "momo";
  account_name: string | null;
  account_number?: string | null;
  account_bank?: string | null;
  recipient_number?: string | null;
  network?: string | null;
  is_preferred: boolean;
  created_at: string;
  updated_at: string;
}

// All banks in Ghana
const ghanaianBanks = [
  { code: "ABG", name: "ABSA Bank Ghana Limited" },
  { code: "ACB", name: "Access Bank Ghana Limited" },
  { code: "ADB", name: "Agricultural Development Bank" },
  { code: "APX", name: "ARB Apex Bank Limited" },
  { code: "BOA", name: "Bank of Africa Ghana" },
  { code: "BOG", name: "Bank of Ghana" },
  { code: "CAL", name: "CAL Bank Limited" },
  { code: "CBG", name: "Consolidated Bank Ghana" },
  { code: "DFL", name: "Dalex Finance and Leasing Company" },
  { code: "ECO", name: "Ecobank Ghana Limited" },
  { code: "FAB", name: "First Atlantic Bank" },
  { code: "FBO", name: "First Bank of Nigeria Ghana" },
  { code: "FDL", name: "Fidelity Bank Limited" },
  { code: "FNB", name: "First National Bank Ghana" },
  { code: "GCB", name: "GCB Bank Limited" },
  { code: "GHL", name: "GHL Bank Limited" },
  { code: "GMY", name: "G-Money" },
  { code: "GTB", name: "Guaranty Trust Bank Ghana" },
  { code: "NIB", name: "National Investment Bank" },
  { code: "SSB", name: "OmniBSIC Bank" },
  { code: "PRD", name: "Prudential Bank Limited" },
  { code: "RBL", name: "Republic Bank Ghana Limited" },
  { code: "SIS", name: "Services Integrity Savings & Loans" },
  { code: "SGG", name: "Societe Generale Ghana" },
  { code: "SCH", name: "Standard Chartered Bank Ghana" },
  { code: "STB", name: "Stanbic Bank Ghana" },
  { code: "UBA", name: "United Bank for Africa Ghana" },
  { code: "UMB", name: "Universal Merchant Bank" },
  { code: "UNL", name: "Unity Link" },
  { code: "ZEN", name: "Zenith Bank Ghana Limited" },
];

function SettingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { profile, updateProfile, refreshProfile } = useProfile();
  const [activeTab, setActiveTab] = useState("profile");
  const [activeSubTab, setActiveSubTab] = useState("personal");

  // Handle URL parameter for tab
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      ["profile", "accounts", "security", "notifications"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
      if (tabParam === "accounts") {
        // Small delay to ensure the component is mounted before opening the sheet
        setTimeout(() => {
          setIsAddAccountOpen(true);
        }, 100);
      }
    }
  }, [searchParams]);
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
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [accountForm, setAccountForm] = useState({
    type: "bank" as "bank" | "momo",
    account_name: "",
    account_number: "",
    account_bank: "",
    recipient_number: "",
    network: "MTN",
    is_preferred: false,
  });
  const [isSavingAccount, setIsSavingAccount] = useState(false);
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

  // Fetch user accounts
  const fetchAccounts = useCallback(async () => {
    if (!user || !profile) return;

    setIsLoadingAccounts(true);
    try {
      const { data, error } = await supabase
        .from("payment_accounts")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) {
        // If table doesn't exist, create it
        if (error.code === "42P01") {
          // Table doesn't exist - handle gracefully
        }
        setAccounts([]);
      } else {
        setAccounts(data || []);
      }
    } catch (error) {
      setAccounts([]);
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [user, profile, supabase]);

  // Load accounts when profile is available
  useEffect(() => {
    if (profile) {
      fetchAccounts();
    }
  }, [profile, fetchAccounts]);

  // Handle adding/updating account
  const handleSaveAccount = async () => {
    if (!user || !profile) return;

    // Validate form
    if (accountForm.type === "bank") {
      if (!accountForm.account_number || !accountForm.account_bank) {
        setUploadError("Please fill in all required bank account fields");
        return;
      }
    } else {
      if (!accountForm.recipient_number || !accountForm.network) {
        setUploadError("Please fill in all required mobile money fields");
        return;
      }
    }

    // Check if user already has an account of this type
    const existingAccountOfType = accounts.find(
      (acc) => acc.type === accountForm.type
    );
    if (existingAccountOfType) {
      setUploadError(
        `You already have a ${
          accountForm.type === "bank" ? "bank" : "mobile money"
        } account. You can only have one of each type.`
      );
      return;
    }

    setIsSavingAccount(true);
    setUploadError(null);

    try {
      // If this account is marked as preferred, unset other preferred accounts
      if (accountForm.is_preferred) {
        await supabase
          .from("payment_accounts")
          .update({ is_preferred: false })
          .eq("profile_id", profile.id)
          .eq("is_preferred", true);
      }

      const accountData: {
        profile_id: string;
        type: "bank" | "momo";
        account_name: string | null;
        account_number?: string;
        account_bank?: string;
        recipient_number?: string;
        network?: string;
        is_preferred: boolean;
      } = {
        profile_id: profile.id,
        type: accountForm.type,
        account_name: accountForm.account_name || null,
        is_preferred: accountForm.is_preferred,
      };

      if (accountForm.type === "bank") {
        accountData.account_number = accountForm.account_number;
        accountData.account_bank = accountForm.account_bank;
      } else {
        accountData.recipient_number = accountForm.recipient_number;
        accountData.network = accountForm.network;
      }

      const { error } = await supabase
        .from("payment_accounts")
        .insert(accountData);

      if (error) {
        // If table doesn't exist, we need to create it first
        if (error.code === "42P01") {
          setUploadError(
            "Please create the payment_accounts table first. Check the database setup."
          );
          return;
        }
        // Handle unique constraint violation (duplicate account type)
        if (error.code === "23505") {
          setUploadError(
            `You already have a ${
              accountForm.type === "bank" ? "bank" : "mobile money"
            } account. You can only have one of each type.`
          );
          return;
        }
        throw error;
      }

      // Reset form and close modal
      setAccountForm({
        type: "bank",
        account_name: "",
        account_number: "",
        account_bank: "",
        recipient_number: "",
        network: "MTN",
        is_preferred: false,
      });
      setIsAddAccountOpen(false);
      await fetchAccounts();
    } catch (error) {
    } finally {
      setIsSavingAccount(false);
    }
  };

  // Handle deleting account
  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;

    try {
      const { error } = await supabase
        .from("payment_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;

      await fetchAccounts();
    } catch (error) {}
  };

  // Handle setting preferred account
  const handleSetPreferred = async (accountId: string) => {
    if (!user || !profile) return;

    try {
      // First, unset all preferred accounts
      await supabase
        .from("payment_accounts")
        .update({ is_preferred: false })
        .eq("profile_id", profile.id)
        .eq("is_preferred", true);

      // Then set the selected account as preferred
      const { error } = await supabase
        .from("payment_accounts")
        .update({ is_preferred: true })
        .eq("id", accountId);

      if (error) throw error;

      await fetchAccounts();
    } catch (error) {}
  };

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
  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
    } catch (error) {}
  };

  const settingsTabs = [
    { id: "profile", label: "Profile & KYC", icon: User },
    { id: "accounts", label: "Payment Accounts", icon: CreditCard },
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
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Check if user has payment accounts
  const hasBankAccount = accounts.some((acc) => acc.type === "bank");
  const hasMomoAccount = accounts.some((acc) => acc.type === "momo");
  const hasAnyAccount = accounts.length > 0;

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

        {/* Accounts Tab */}
        {activeTab === "accounts" && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <CardTitle className="text-lg sm:text-xl">
                  Payment Accounts
                </CardTitle>
                <Button
                  onClick={() => setIsAddAccountOpen(true)}
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingAccounts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                  </div>
                ) : accounts.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      No payment accounts added yet
                    </p>
                    <Button
                      onClick={() => setIsAddAccountOpen(true)}
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Account
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                          account.is_preferred
                            ? "border-green-300 bg-green-50/30"
                            : "border-gray-200"
                        }`}
                      >
                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                            <h3 className="font-semibold text-sm sm:text-base truncate">
                              {account.account_name ||
                                (account.type === "bank"
                                  ? "Bank Account"
                                  : "Mobile Money")}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                                account.type === "bank"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {account.type === "bank" ? "Bank" : "MoMo"}
                            </span>
                            {account.is_preferred && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                                <CheckCircle className="h-3 w-3" />
                                Preferred
                              </span>
                            )}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 break-words">
                            {account.type === "bank" ? (
                              <>
                                <span className="font-medium">
                                  {account.account_number}
                                </span>
                                {account.account_bank && (
                                  <span className="ml-1 sm:ml-2">
                                    • {account.account_bank}
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="font-medium">
                                  {account.recipient_number}
                                </span>
                                {account.network && (
                                  <span className="ml-1 sm:ml-2">
                                    • {account.network}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200 sm:border-0">
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={`preferred-${account.id}`}
                              className="text-xs sm:text-sm text-gray-600 cursor-pointer whitespace-nowrap"
                            >
                              Preferred
                            </Label>
                            <Switch
                              id={`preferred-${account.id}`}
                              checked={account.is_preferred}
                              onCheckedChange={() =>
                                handleSetPreferred(account.id)
                              }
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAccount(account.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

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
                        <p className="text-sm text-red-600 mt-1">
                          {uploadError}
                        </p>
                      )}
                    </div>
                    {/* Upload Button (Alternative) */}
                    <label
                      htmlFor="avatar-upload-button"
                      className="cursor-pointer"
                    >
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
                            <SelectItem
                              key={country.value}
                              value={country.value}
                            >
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

        {/* Add Account Sheet */}
        <Sheet open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl p-0 sm:p-2 overflow-y-auto"
          >
            <SheetTitle className="sr-only">Add Payment Account</SheetTitle>
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Add Payment Account
                </h2>
              </div>

              {/* Content */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                <div className="space-y-6 sm:space-y-8">
                  {/* Account Type Selection */}
                  <div className="space-y-4">
                    <div className="w-full flex justify-start text-gray-900 text-base sm:text-lg font-extrabold leading-tight">
                      Select Account Type
                    </div>

                    <div className="w-full px-0 sm:px-4">
                      <RadioGroup
                        value={accountForm.type}
                        onValueChange={(value: "bank" | "momo") => {
                          // Prevent selecting disabled account types
                          if (
                            (value === "bank" && hasBankAccount) ||
                            (value === "momo" && hasMomoAccount)
                          ) {
                            return;
                          }
                          setAccountForm({ ...accountForm, type: value });
                        }}
                      >
                        <div className="w-full space-y-4">
                          {/* Bank Account Option */}
                          <div
                            className={`w-full rounded-xl border transition-all duration-200 ${
                              accountForm.type === "bank"
                                ? "border-green-500 bg-green-50/30"
                                : "border-gray-200"
                            } ${
                              hasBankAccount
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {/* Header Row */}
                            <div className="flex h-[80px] sm:h-[100px] md:h-[110px] p-4 sm:p-6 md:p-8 items-center gap-3 sm:gap-4 md:gap-6 w-full">
                              <RadioGroupItem
                                value="bank"
                                id="bank"
                                className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex-shrink-0"
                                disabled={hasBankAccount}
                              />
                              <Label
                                htmlFor="bank"
                                className={`flex-1 min-w-0 ${
                                  hasBankAccount
                                    ? "cursor-not-allowed"
                                    : "cursor-pointer"
                                }`}
                              >
                                <span className="text-sm sm:text-base md:text-lg font-medium">
                                  Bank Account
                                  {hasBankAccount && (
                                    <span className="ml-1 sm:ml-2 text-xs text-gray-500 font-normal block sm:inline">
                                      (Already added)
                                    </span>
                                  )}
                                </span>
                              </Label>
                              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-green-600 flex-shrink-0" />
                            </div>

                            {/* Expanded Form Fields */}
                            {accountForm.type === "bank" && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden border-t border-green-200"
                              >
                                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">
                                      Account Name
                                      <span className="text-gray-400 font-normal ml-1">
                                        (Optional)
                                      </span>
                                    </Label>
                                    <Input
                                      id="account_name"
                                      value={accountForm.account_name}
                                      onChange={(e) =>
                                        setAccountForm({
                                          ...accountForm,
                                          account_name: e.target.value,
                                        })
                                      }
                                      placeholder="e.g., My Main Account"
                                      className="mt-1 border-0 outline-none focus:ring-0 focus:border-0 transition-all duration-200"
                                    />
                                  </div>

                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">
                                      Account Number
                                      <span className="text-red-500 ml-1">
                                        *
                                      </span>
                                    </Label>
                                    <Input
                                      id="account_number"
                                      value={accountForm.account_number}
                                      onChange={(e) =>
                                        setAccountForm({
                                          ...accountForm,
                                          account_number: e.target.value,
                                        })
                                      }
                                      placeholder="Enter account number"
                                      required
                                      className="mt-1 border-0 outline-none focus:ring-0 focus:border-0 transition-all duration-200"
                                    />
                                  </div>

                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">
                                      Bank
                                      <span className="text-red-500 ml-1">
                                        *
                                      </span>
                                    </Label>
                                    <Select
                                      value={accountForm.account_bank}
                                      onValueChange={(value) =>
                                        setAccountForm({
                                          ...accountForm,
                                          account_bank: value,
                                        })
                                      }
                                    >
                                      <SelectTrigger className="mt-1 border-0 outline-none focus:ring-0 focus:border-0">
                                        <SelectValue placeholder="Select bank" />
                                      </SelectTrigger>
                                      <SelectContent className="max-h-60 overflow-y-auto">
                                        {ghanaianBanks.map((bank) => (
                                          <SelectItem
                                            key={bank.code}
                                            value={bank.code}
                                          >
                                            {bank.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </div>

                          {/* Mobile Money Option */}
                          <div
                            className={`w-full rounded-xl border transition-all duration-200 ${
                              accountForm.type === "momo"
                                ? "border-green-500 bg-green-50/30"
                                : "border-gray-200"
                            } ${
                              hasMomoAccount
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {/* Header Row */}
                            <div className="flex h-[80px] sm:h-[100px] md:h-[110px] p-4 sm:p-6 md:p-8 items-center gap-3 sm:gap-4 md:gap-6 w-full">
                              <RadioGroupItem
                                value="momo"
                                id="momo"
                                className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex-shrink-0"
                                disabled={hasMomoAccount}
                              />
                              <Label
                                htmlFor="momo"
                                className={`flex-1 min-w-0 ${
                                  hasMomoAccount
                                    ? "cursor-not-allowed"
                                    : "cursor-pointer"
                                }`}
                              >
                                <span className="text-sm sm:text-base md:text-lg font-medium">
                                  Mobile Money
                                  {hasMomoAccount && (
                                    <span className="ml-1 sm:ml-2 text-xs text-gray-500 font-normal block sm:inline">
                                      (Already added)
                                    </span>
                                  )}
                                </span>
                              </Label>
                            </div>

                            {/* Expanded Form Fields */}
                            {accountForm.type === "momo" && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden border-t border-green-200"
                              >
                                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">
                                      Account Name
                                      <span className="text-gray-400 font-normal ml-1">
                                        (Optional)
                                      </span>
                                    </Label>
                                    <Input
                                      id="account_name"
                                      value={accountForm.account_name}
                                      onChange={(e) =>
                                        setAccountForm({
                                          ...accountForm,
                                          account_name: e.target.value,
                                        })
                                      }
                                      placeholder="e.g., My Main Account"
                                      className="mt-1 border-0 outline-none focus:ring-0 focus:border-0 transition-all duration-200"
                                    />
                                  </div>

                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">
                                      Mobile Number
                                      <span className="text-red-500 ml-1">
                                        *
                                      </span>
                                    </Label>
                                    <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 transition-all mt-1">
                                      <div className="flex items-center px-4 py-3 bg-gray-50 border-r border-gray-300">
                                        <span className="text-lg mr-2">🇬🇭</span>
                                        <span className="text-sm font-semibold text-gray-700">
                                          +233
                                        </span>
                                      </div>
                                      <Input
                                        id="recipient_number"
                                        value={accountForm.recipient_number}
                                        onChange={(e) =>
                                          setAccountForm({
                                            ...accountForm,
                                            recipient_number: e.target.value,
                                          })
                                        }
                                        placeholder="024 567 8905"
                                        required
                                        className="flex-1 border-0 h-14 rounded-none focus:ring-0 focus:border-0 text-gray-900 placeholder-gray-500"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">
                                      Network Provider
                                      <span className="text-red-500 ml-1">
                                        *
                                      </span>
                                    </Label>
                                    <Select
                                      value={accountForm.network}
                                      onValueChange={(value) =>
                                        setAccountForm({
                                          ...accountForm,
                                          network: value,
                                        })
                                      }
                                    >
                                      <SelectTrigger className="mt-1 border-0 outline-none focus:ring-0 focus:border-0">
                                        <SelectValue placeholder="Select network provider" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="MTN">
                                          <div className="flex items-center space-x-3">
                                            <div className="w-4 h-4  rounded-full"></div>
                                            <span className="font-medium">
                                              MTN
                                            </span>
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="VOD">
                                          <div className="flex items-center space-x-3">
                                            <div className="w-4 h-4  rounded-full"></div>
                                            <span className="font-medium">
                                              Vodafone
                                            </span>
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="ATL">
                                          <div className="flex items-center space-x-3">
                                            <div className="w-4 h-4  rounded-full"></div>
                                            <span className="font-medium">
                                              AirtelTigo
                                            </span>
                                          </div>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  {/* Preferred Account Checkbox */}
                  <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-200">
                    <Label
                      htmlFor="is_preferred"
                      className="text-xs sm:text-sm text-gray-600 cursor-pointer"
                    >
                      Set as preferred account
                    </Label>
                    <Switch
                      id="is_preferred"
                      checked={accountForm.is_preferred}
                      onCheckedChange={(checked) =>
                        setAccountForm({
                          ...accountForm,
                          is_preferred: checked,
                        })
                      }
                    />
                  </div>

                  {/* Error Message */}
                  {uploadError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-50 border border-red-200 rounded-md"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-800">{uploadError}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-3 sm:pt-4">
                    <Button
                      onClick={handleSaveAccount}
                      disabled={isSavingAccount}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isSavingAccount ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving Account...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Save Account
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddAccountOpen(false);
                        setAccountForm({
                          type: "bank",
                          account_name: "",
                          account_number: "",
                          account_bank: "",
                          recipient_number: "",
                          network: "MTN",
                          is_preferred: false,
                        });
                        setUploadError(null);
                      }}
                      className="font-medium py-2.5 sm:py-3 text-sm sm:text-base"
                      disabled={isSavingAccount}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

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

function SettingsPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
              <p className="text-gray-600">Loading settings...</p>
            </div>
          </div>
        </DashboardLayout>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}

export default SettingsPage;
