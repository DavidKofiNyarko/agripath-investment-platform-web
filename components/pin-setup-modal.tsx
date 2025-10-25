"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Eye, EyeOff, AlertTriangle, Check, User } from "lucide-react"; // Mail unused
import { useProfile } from "@/contexts/ProfileContext";
import { useUser } from "@/contexts/UserContext";
import { createClient } from "@/app/utils/supabase/client";

interface PinSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const PinSetupModal: React.FC<PinSetupModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const {
    profile,
    updateProfile: _updateProfile,
    refreshProfile,
  } = useProfile(); // updateProfile unused
  const { user } = useUser();
  const supabase = createClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Profile details
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [email, setEmail] = useState(user?.email || "");

  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFirstName(profile?.first_name || "");
      setLastName(profile?.last_name || "");
      setEmail(user?.email || "");
      setPin(["", "", "", ""]);
      setConfirmPin(["", "", "", ""]);
      setError("");
      setSuccess("");
      setCurrentStep(1);
    }
  }, [isOpen, profile, user]);

  const handlePinChange = (index: number, value: string, isConfirm = false) => {
    // Only allow numeric input
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) return;

    if (isConfirm) {
      const newConfirmPin = [...confirmPin];
      newConfirmPin[index] = value;
      setConfirmPin(newConfirmPin);

      // Auto-focus next input
      if (value && index < 3) {
        confirmPinRefs.current[index + 1]?.focus();
      }
    } else {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);

      // Auto-focus next input
      if (value && index < 3) {
        pinRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent,
    isConfirm = false
  ) => {
    if (
      e.key === "Backspace" &&
      !(isConfirm ? confirmPin : pin)[index] &&
      index > 0
    ) {
      if (isConfirm) {
        confirmPinRefs.current[index - 1]?.focus();
      } else {
        pinRefs.current[index - 1]?.focus();
      }
    }
  };

  const validateProfile = () => {
    if (!firstName.trim()) {
      setError("Please enter your first name");
      return false;
    }
    if (!lastName.trim()) {
      setError("Please enter your last name");
      return false;
    }
    if (!email.trim()) {
      setError("Please enter your email address");
      return false;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const validatePin = () => {
    const pinValue = pin.join("");
    const confirmPinValue = confirmPin.join("");

    if (pinValue.length !== 4) {
      setError("Please enter a 4-digit PIN");
      return false;
    }
    if (confirmPinValue.length !== 4) {
      setError("Please confirm your 4-digit PIN");
      return false;
    }
    if (pinValue !== confirmPinValue) {
      setError("PINs do not match. Please try again.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateProfile()) return;
      setCurrentStep(2);
      setError("");
      // Focus first PIN input
      setTimeout(() => {
        pinRefs.current[0]?.focus();
      }, 100);
    }
  };

  const handleSubmit = async () => {
    if (!validatePin()) return;

    setIsLoading(true);
    setError("");

    try {
      const pinValue = pin.join("");

      // Update profile with all details
      const { error } = await supabase
        .from("profile")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          pin: pinValue,
        })
        .eq("user_id", profile?.user_id);

      if (error) {
        setError("Failed to save profile. Please try again.");
        return;
      }

      setSuccess("Profile completed successfully!");
      await refreshProfile();

      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      setError("Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    if (currentStep === 1) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <User className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Complete Your Profile
            </h3>
            <p className="text-gray-600">
              Please provide your personal information to continue
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <Shield className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Set Your Transaction PIN
          </h3>
          <p className="text-gray-600">
            Create a 4-digit PIN for secure transactions
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <Label className="text-center block text-sm font-medium text-gray-700 mb-4">
              Enter your 4-digit PIN
            </Label>
            <div className="flex justify-center space-x-3">
              {pin.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    pinRefs.current[index] = el;
                  }}
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl font-mono border-2 focus:border-green-500 focus:ring-green-500"
                  maxLength={1}
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

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
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value, true)}
                  onKeyDown={(e) => handleKeyDown(index, e, true)}
                  className="w-12 h-12 text-center text-xl font-mono border-2 focus:border-green-500 focus:ring-green-500"
                  maxLength={1}
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPin(!showPin)}
              disabled={isLoading}
              className="text-gray-500 hover:text-gray-700"
            >
              {showPin ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide PIN
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show PIN
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowConfirmPin(!showConfirmPin)}
              disabled={isLoading}
              className="text-gray-500 hover:text-gray-700"
            >
              {showConfirmPin ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Confirm
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Confirm
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold text-gray-900">
            {currentStep === 1
              ? "Complete Your Profile"
              : "Set Transaction PIN"}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 mt-2">
            {currentStep === 1
              ? "We need your personal information to get started"
              : "Create a secure PIN for your transactions"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Indicator */}
          <div className="flex justify-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                currentStep >= 1 ? "bg-green-600" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`w-3 h-3 rounded-full ${
                currentStep >= 2 ? "bg-green-600" : "bg-gray-300"
              }`}
            ></div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800 text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-green-800 text-sm">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {currentStep === 1 ? (
              <Button
                onClick={handleNext}
                disabled={
                  isLoading ||
                  !firstName.trim() ||
                  !lastName.trim() ||
                  !email.trim()
                }
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={
                  isLoading ||
                  pin.some((digit) => digit === "") ||
                  confirmPin.some((digit) => digit === "")
                }
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? "Saving..." : "Complete Setup"}
              </Button>
            )}
          </div>

          {/* Security Notice */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Your information is encrypted and stored securely.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PinSetupModal;
