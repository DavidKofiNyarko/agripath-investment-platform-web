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
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useProfile } from "@/contexts/ProfileContext";
import PinResetModal from "./pin-reset-modal";

interface PinChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PinChangeModal: React.FC<PinChangeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { profile, updateUserPin, verifyUserPin } = useProfile();
  const [currentStep, setCurrentStep] = useState<
    "current" | "new" | "confirm" | "success"
  >("current");
  const [currentPin, setCurrentPin] = useState(["", "", "", ""]);
  const [newPin, setNewPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showPinResetModal, setShowPinResetModal] = useState(false);

  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const maxAttempts = 3;

  useEffect(() => {
    if (isOpen) {
      // If user doesn't have a PIN set, start with 'new' step
      setCurrentStep(profile?.pin ? "current" : "new");
      setCurrentPin(["", "", "", ""]);
      setNewPin(["", "", "", ""]);
      setConfirmPin(["", "", "", ""]);
      setError("");
      setAttempts(0);
      setIsShaking(false);
      // Focus first input
      setTimeout(() => {
        pinRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen, profile?.pin]);

  const handlePinChange = (
    index: number,
    value: string,
    pinType: "current" | "new" | "confirm"
  ) => {
    // Only allow numeric input
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) return;

    const newPinArray = [
      ...(pinType === "current"
        ? currentPin
        : pinType === "new"
        ? newPin
        : confirmPin),
    ];
    newPinArray[index] = value;

    if (pinType === "current") {
      setCurrentPin(newPinArray);
    } else if (pinType === "new") {
      setNewPin(newPinArray);
    } else {
      setConfirmPin(newPinArray);
    }

    setError(""); // Clear error when user types

    // Auto-focus next input
    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      const currentPinArray =
        currentStep === "current"
          ? currentPin
          : currentStep === "new"
          ? newPin
          : confirmPin;
      if (!currentPinArray[index] && index > 0) {
        pinRefs.current[index - 1]?.focus();
      }
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const validateCurrentPin = async () => {
    const pinValue = currentPin.join("");

    if (pinValue.length !== 4) {
      setError("Please enter a 4-digit PIN");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Validate current PIN using verifyUserPin which handles hashing
      const isValid = await verifyUserPin(pinValue);
      
      if (isValid) {
        setError("");
        setIsLoading(false);
        setCurrentStep("new");
        setTimeout(() => {
          pinRefs.current[0]?.focus();
        }, 100);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setIsLoading(false);

        if (newAttempts >= maxAttempts) {
          setError("Too many incorrect attempts. Please try again later or reset your PIN.");
          setTimeout(() => {
            onClose();
          }, 3000);
        } else {
          setError(
            `Incorrect PIN. ${maxAttempts - newAttempts} attempts remaining.`
          );
          triggerShake();
          setCurrentPin(["", "", "", ""]);
          pinRefs.current[0]?.focus();
        }
      }
    } catch (error) {
      setIsLoading(false);
      setError("Failed to validate PIN. Please try again.");
    }
  };

  const validateNewPin = () => {
    const pinValue = newPin.join("");

    if (pinValue.length !== 4) {
      setError("Please enter a 4-digit PIN");
      return;
    }

    if (profile?.pin && pinValue === currentPin.join("")) {
      setError("New PIN must be different from current PIN");
      triggerShake();
      return;
    }

    setError("");
    setCurrentStep("confirm");
    setTimeout(() => {
      pinRefs.current[0]?.focus();
    }, 100);
  };

  const confirmNewPin = async () => {
    const newPinValue = newPin.join("");
    const confirmPinValue = confirmPin.join("");

    if (confirmPinValue.length !== 4) {
      setError("Please confirm your new PIN");
      return;
    }

    if (newPinValue !== confirmPinValue) {
      setError("PINs do not match. Please try again.");
      triggerShake();
      setConfirmPin(["", "", "", ""]);
      pinRefs.current[0]?.focus();
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Update PIN using updateUserPin which handles hashing
      await updateUserPin(newPinValue);

      setIsLoading(false);
      setCurrentStep("success");

      // Auto close after success
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      setError("Failed to update PIN. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep === "current") {
      await validateCurrentPin();
    } else if (currentStep === "new") {
      validateNewPin();
    } else if (currentStep === "confirm") {
      await confirmNewPin();
    }
  };

  const getCurrentPinArray = () => {
    switch (currentStep) {
      case "current":
        return currentPin;
      case "new":
        return newPin;
      case "confirm":
        return confirmPin;
      default:
        return [];
    }
  };

  const getCurrentShowPin = () => {
    switch (currentStep) {
      case "current":
        return showCurrentPin;
      case "new":
        return showNewPin;
      case "confirm":
        return showConfirmPin;
      default:
        return false;
    }
  };

  const setCurrentShowPin = (show: boolean) => {
    switch (currentStep) {
      case "current":
        setShowCurrentPin(show);
        break;
      case "new":
        setShowNewPin(show);
        break;
      case "confirm":
        setShowConfirmPin(show);
        break;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "current":
        return "Enter Current PIN";
      case "new":
        return profile?.pin ? "Enter New PIN" : "Set Your PIN";
      case "confirm":
        return "Confirm New PIN";
      case "success":
        return profile?.pin
          ? "PIN Updated Successfully"
          : "PIN Set Successfully";
      default:
        return profile?.pin ? "Change PIN" : "Set PIN";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case "current":
        return "Please enter your current 4-digit PIN to continue";
      case "new":
        return profile?.pin
          ? "Enter your new 4-digit PIN"
          : "Create a secure 4-digit PIN for your transactions";
      case "confirm":
        return "Please confirm your new PIN";
      case "success":
        return profile?.pin
          ? "Your PIN has been successfully updated"
          : "Your PIN has been successfully set";
      default:
        return "";
    }
  };

  const getActionButtonText = () => {
    switch (currentStep) {
      case "current":
        return "Continue";
      case "new":
        return "Continue";
      case "confirm":
        return isLoading ? "Updating..." : "Update PIN";
      case "success":
        return "Done";
      default:
        return "Continue";
    }
  };

  const isFormValid = () => {
    const currentPinArray = getCurrentPinArray();
    return (
      currentPinArray.every((digit) => digit !== "") &&
      currentPinArray.length === 4
    );
  };

  const handleBack = () => {
    if (currentStep === "new") {
      setCurrentStep("current");
      setNewPin(["", "", "", ""]);
      setTimeout(() => {
        pinRefs.current[0]?.focus();
      }, 100);
    } else if (currentStep === "confirm") {
      setCurrentStep("new");
      setConfirmPin(["", "", "", ""]);
      setTimeout(() => {
        pinRefs.current[0]?.focus();
      }, 100);
    }
  };

  if (currentStep === "success") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold text-gray-900 flex items-center justify-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              {getStepTitle()}
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600 mt-2">
              {getStepDescription()}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mb-4"
            >
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            </motion.div>
            <p className="text-gray-600">
              Your PIN has been successfully updated and is now active.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold text-gray-900 flex items-center justify-center gap-2">
            <Shield className="w-6 h-6 text-green-600" />
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 mt-2">
            {getStepDescription()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* PIN Input */}
          <motion.div
            animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div>
              <label className="text-center block text-sm font-medium text-gray-700 mb-4">
                Enter your 4-digit PIN
              </label>
              <div className="flex justify-center items-center gap-2 sm:gap-3">
                {getCurrentPinArray().map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      pinRefs.current[index] = el;
                    }}
                    type={getCurrentShowPin() ? "text" : "password"}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={digit}
                    onChange={(e) =>
                      handlePinChange(index, e.target.value, currentStep)
                    }
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 sm:w-14 sm:h-14 text-center text-lg sm:text-xl font-mono border-2 focus:border-green-500 focus:ring-green-500 rounded-lg"
                    maxLength={1}
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            {/* Show/Hide PIN Button */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCurrentShowPin(!getCurrentShowPin())}
                disabled={isLoading}
                className="text-gray-500 hover:text-gray-700"
              >
                {getCurrentShowPin() ? (
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
            </div>
          </motion.div>

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

          {/* Forgot PIN Link - Only show when entering current PIN */}
          {currentStep === "current" && profile?.pin && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setShowPinResetModal(true);
                  onClose();
                }}
                className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded px-2 py-1"
              >
                Forgot your PIN? Reset it here
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {(currentStep === "new" || currentStep === "confirm") && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className={currentStep === "current" ? "flex-1" : "flex-1"}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {currentStep === "confirm" ? "Updating..." : "Verifying..."}
                </>
              ) : (
                getActionButtonText()
              )}
            </Button>
          </div>

          {/* Security Notice */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Your PIN is encrypted and stored securely.
            </p>
          </div>
        </form>

        {/* PIN Reset Modal */}
        <PinResetModal
          isOpen={showPinResetModal}
          onClose={() => setShowPinResetModal(false)}
          onSuccess={() => {
            setShowPinResetModal(false);
            // Optionally refresh profile or show success message
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PinChangeModal;
