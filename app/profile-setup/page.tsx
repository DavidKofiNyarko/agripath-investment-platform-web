"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { useProfile } from "@/contexts/ProfileContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Circle,
  User,
  Lock,
  Shield,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import PinSetupModal from "@/components/pin-setup-modal";
import KycVerification from "@/components/kyc-verification";
import { countries } from "@/lib/countries";

const ProfileSetupPage = () => {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const {
    profile,
    loading: profileLoading,
    isProfileComplete,
    updateProfile,
  } = useProfile();
  const [currentStep, setCurrentStep] = useState<"basic" | "pin" | "kyc">(
    "basic"
  );
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    country: "ghana",
  });

  // Redirect if already authenticated and profile complete
  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/signin");
    } else if (!profileLoading && user && isProfileComplete) {
      router.push("/dashboard");
    }
  }, [user, userLoading, profile, profileLoading, isProfileComplete, router]);

  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        email: profile.email || "",
        phoneNumber: profile.phone_number || "",
        country: profile.country || "ghana",
      });
    }
  }, [profile]);

  const handleBasicInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) return;

    try {
      await updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        country: formData.country,
      });

      setCurrentStep("pin");
    } catch (error) {
      // Handle error
    }
  };

  const handlePinComplete = () => {
    // Move to KYC step after PIN is set up
    setCurrentStep("kyc");
  };

  const handleKycComplete = () => {
    // Profile should now be complete, redirect to dashboard
    router.push("/dashboard");
  };

  const getStepStatus = (step: string) => {
    if (!profile) return "pending";

    switch (step) {
      case "basic":
        return profile.first_name &&
          profile.last_name &&
          profile.email &&
          profile.phone_number
          ? "complete"
          : "pending";
      case "pin":
        return profile.pin ? "complete" : "pending";
      case "kyc":
        return profile.kyc_status === "verified" ||
          profile.kyc_status === "complete"
          ? "complete"
          : "pending";
      default:
        return "pending";
    }
  };

  if (userLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        {/* <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">Set up your account to start investing in agricultural projects</p>
        </div> */}

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[
              { id: "basic", label: "Basic Info", icon: User },
              { id: "pin", label: "Security PIN", icon: Lock },
              { id: "kyc", label: "KYC Verification", icon: Shield },
            ].map((step, index) => {
              const Icon = step.icon;
              const status = getStepStatus(step.id);
              const isActive = currentStep === step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      status === "complete"
                        ? "bg-green-600 border-green-600 text-white"
                        : isActive
                        ? "bg-green-100 border-green-600 text-green-600"
                        : "bg-gray-100 border-gray-300 text-gray-400"
                    }`}
                  >
                    {status === "complete" ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-2">
                    <p
                      className={`text-sm font-medium ${
                        isActive
                          ? "text-green-600"
                          : status === "complete"
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                  {index < 2 && (
                    <div
                      className={`w-8 h-0.5 mx-4 ${
                        getStepStatus(["basic", "pin", "kyc"][index + 1]) ===
                        "complete"
                          ? "bg-green-600"
                          : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-2xl mx-auto">
          {currentStep === "basic" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstName: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phoneNumber: e.target.value,
                        })
                      }
                      placeholder="0247899866"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Select
                      value={formData.country}
                      onValueChange={(value) =>
                        setFormData({ ...formData, country: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
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

                  <Button type="submit" className="w-full">
                    Continue to Security Setup
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {currentStep === "pin" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security PIN Setup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <p className="text-gray-600">
                    Set up a 4-digit PIN to secure your account and authorize
                    transactions.
                  </p>
                  <PinSetupModal isOpen={true} onComplete={handlePinComplete} />
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === "kyc" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  KYC Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <p className="text-gray-600">
                    Complete your identity verification to comply with
                    regulations and unlock full account features.
                  </p>
                  <KycVerification onComplete={handleKycComplete} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
