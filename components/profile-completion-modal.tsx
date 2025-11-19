"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfile } from "@/contexts/ProfileContext";
import {
  Loader2,
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import PinResetModal from "./pin-reset-modal";
import { countries } from "@/lib/countries";

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const { profile, updateProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Helper to check if phone number is all zeros or empty
  const isValidPhoneNumber = (phone: string | null | undefined): boolean => {
    if (!phone) return false;
    const digitsOnly = phone.replace(/\D/g, "");
    return digitsOnly.length > 0 && !/^0+$/.test(digitsOnly);
  };

  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    email: profile?.email || "",
    phone_number: isValidPhoneNumber(profile?.phone_number)
      ? profile?.phone_number || ""
      : "",
    country: profile?.country || "ghana",
  });

  // PIN states
  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [showPinResetModal, setShowPinResetModal] = useState(false);

  const totalSteps = 3;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handlePinChange = (
    index: number,
    value: string,
    type: "pin" | "confirm" = "pin"
  ) => {
    if (value.length > 1) return; // Only allow single digit

    if (type === "pin") {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);

      // Auto-focus next input
      if (value && index < 3) {
        pinRefs.current[index + 1]?.focus();
      }
    } else {
      const newConfirmPin = [...confirmPin];
      newConfirmPin[index] = value;
      setConfirmPin(newConfirmPin);

      // Auto-focus next input
      if (value && index < 3) {
        confirmPinRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent,
    type: "pin" | "confirm" = "pin"
  ) => {
    if (
      e.key === "Backspace" &&
      !(type === "pin" ? pin[index] : confirmPin[index])
    ) {
      // Focus previous input on backspace
      if (index > 0) {
        if (type === "pin") {
          pinRefs.current[index - 1]?.focus();
        } else {
          confirmPinRefs.current[index - 1]?.focus();
        }
      }
    }
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.first_name.trim()) {
        newErrors.first_name = "First name is required";
      }
      if (!formData.last_name.trim()) {
        newErrors.last_name = "Last name is required";
      }
    }

    if (step === 2) {
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
      if (!formData.phone_number.trim()) {
        newErrors.phone_number = "Phone number is required";
      } else if (!/^[0-9+\-\s()]+$/.test(formData.phone_number)) {
        newErrors.phone_number = "Please enter a valid phone number";
      }
    }

    if (step === 3) {
      if (pin.some((digit) => digit === "")) {
        newErrors.pin = "Please enter a complete 4-digit PIN";
      }
      if (confirmPin.some((digit) => digit === "")) {
        newErrors.confirm_pin = "Please confirm your PIN";
      }
      if (pin.join("") !== confirmPin.join("")) {
        newErrors.confirm_pin = "PINs do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        pin: pin.join(""),
        country: formData.country,
      });

      onComplete();
    } catch (error) {
      setErrors({ submit: "Failed to update profile. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const getFieldStatus = (field: string) => {
    if (errors[field]) return "error";
    if (formData[field as keyof typeof formData]) return "success";
    return "default";
  };

  const getFieldIcon = (field: string) => {
    const status = getFieldStatus(field);
    if (status === "error")
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (status === "success")
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    return null;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <User className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Personal Information
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Let's start with your basic details
              </p>
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-sm font-medium">
                First Name *
              </Label>
              <div className="relative">
                <Input
                  id="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={(e) =>
                    handleInputChange("first_name", e.target.value)
                  }
                  placeholder="Enter your first name"
                  className={`pl-10 ${
                    errors.first_name ? "border-red-500" : ""
                  }`}
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                {getFieldIcon("first_name") && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getFieldIcon("first_name")}
                  </div>
                )}
              </div>
              {errors.first_name && (
                <p className="text-xs text-red-500">{errors.first_name}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-sm font-medium">
                Last Name *
              </Label>
              <div className="relative">
                <Input
                  id="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={(e) =>
                    handleInputChange("last_name", e.target.value)
                  }
                  placeholder="Enter your last name"
                  className={`pl-10 ${
                    errors.last_name ? "border-red-500" : ""
                  }`}
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                {getFieldIcon("last_name") && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getFieldIcon("last_name")}
                  </div>
                )}
              </div>
              {errors.last_name && (
                <p className="text-xs text-red-500">{errors.last_name}</p>
              )}
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium">
                Country
              </Label>
              <Select
                value={formData.country}
                onValueChange={(value) => handleInputChange("country", value)}
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
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <Mail className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Contact Information
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                How can we reach you?
              </p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address *
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email address"
                  className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                {getFieldIcon("email") && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getFieldIcon("email")}
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone_number" className="text-sm font-medium">
                Phone Number *
              </Label>
              <div className="relative">
                <Input
                  id="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) =>
                    handleInputChange("phone_number", e.target.value)
                  }
                  placeholder="Enter your phone number"
                  className={`pl-10 ${
                    errors.phone_number ? "border-red-500" : ""
                  }`}
                />
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                {getFieldIcon("phone_number") && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getFieldIcon("phone_number")}
                  </div>
                )}
              </div>
              {errors.phone_number && (
                <p className="text-xs text-red-500">{errors.phone_number}</p>
              )}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Security PIN
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Create a 4-digit PIN for secure transactions
              </p>
            </div>

            {/* PIN Input */}
            <div>
              <Label className="text-center block text-sm font-medium text-gray-700 mb-4">
                Enter your 4-digit PIN
              </Label>
              <div className="flex justify-center items-center gap-2 sm:gap-3">
                {pin.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      pinRefs.current[index] = el;
                    }}
                    type={showPin ? "text" : "password"}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 sm:w-14 sm:h-14 text-center text-lg sm:text-xl font-mono border-2 focus:border-green-500 focus:ring-green-500 rounded-lg"
                    maxLength={1}
                    disabled={loading}
                  />
                ))}
              </div>
              {errors.pin && (
                <p className="text-xs text-red-500 text-center mt-2">
                  {errors.pin}
                </p>
              )}
            </div>

            {/* Confirm PIN */}
            <div>
              <Label className="text-center block text-sm font-medium text-gray-700 mb-4">
                Confirm your 4-digit PIN
              </Label>
              <div className="flex justify-center space-x-3">
                {confirmPin.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      confirmPinRefs.current[index] = el;
                    }}
                    type={showConfirmPin ? "text" : "password"}
                    value={digit}
                    onChange={(e) =>
                      handlePinChange(index, e.target.value, "confirm")
                    }
                    onKeyDown={(e) => handleKeyDown(index, e, "confirm")}
                    className="w-12 h-12 text-center text-xl font-mono border-2 focus:border-green-500 focus:ring-green-500"
                    maxLength={1}
                    disabled={loading}
                  />
                ))}
              </div>
              {errors.confirm_pin && (
                <p className="text-xs text-red-500 text-center mt-2">
                  {errors.confirm_pin}
                </p>
              )}
            </div>

            {/* Show/Hide PIN Buttons */}
            <div className="flex justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPin(!showPin)}
                className="flex items-center gap-2"
              >
                {showPin ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {showPin ? "Hide PIN" : "Show PIN"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmPin(!showConfirmPin)}
                className="flex items-center gap-2"
              >
                {showConfirmPin ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {showConfirmPin ? "Hide Confirm" : "Show Confirm"}
              </Button>
            </div>

            {/* Forgot PIN Button */}
            <div className="text-center">
              {/* <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => setShowPinResetModal(true)}
                className="text-gray-500 hover:text-gray-700"
              >
                Forgot your PIN? Reset it here
              </Button> */}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="relative">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <User className="h-8 w-8 text-green-600" />
              </div>
              {/* <CardTitle className="text-xl font-semibold text-gray-900">
                Complete Your Profile
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Step {currentStep} of {totalSteps}
              </p> */}

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <motion.div
                  className="bg-green-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={(e) => e.preventDefault()}>
                <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md mt-4">
                    <p className="text-sm text-red-600">{errors.submit}</p>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  {currentStep < totalSteps ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Completing...
                        </>
                      ) : (
                        <>
                          Complete Profile
                          <CheckCircle className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* PIN Reset Modal */}
      <PinResetModal
        isOpen={showPinResetModal}
        onClose={() => setShowPinResetModal(false)}
        onSuccess={() => {
          setShowPinResetModal(false);
          // Refresh profile to get updated PIN
          window.location.reload();
        }}
      />
    </AnimatePresence>
  );
};

export default ProfileCompletionModal;
