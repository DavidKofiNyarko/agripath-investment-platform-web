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
import { motion, AnimatePresence } from "framer-motion"; // Check unused
import { Shield, Eye, EyeOff, AlertTriangle, Loader2 } from "lucide-react"; // Check unused
import { useProfile } from "@/contexts/ProfileContext";

interface PinValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
  action?: string;
}

const PinValidationModal: React.FC<PinValidationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Enter Your PIN",
  description = "Please enter your 4-digit PIN to continue",
  action = "Continue",
}) => {
  const { profile, verifyUserPin } = useProfile();
  const [pin, setPin] = useState(["", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const maxAttempts = 3;

  useEffect(() => {
    if (isOpen) {
      setPin(["", "", "", ""]);
      setError("");
      setAttempts(0);
      setIsShaking(false);
      // Focus first input
      setTimeout(() => {
        pinRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handlePinChange = (index: number, value: string) => {
    // Only allow numeric input
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(""); // Clear error when user types

    // Auto-focus next input
    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (!pin[index] && index > 0) {
        pinRefs.current[index - 1]?.focus();
      }
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pinValue = pin.join("");

    if (pinValue.length !== 4) {
      setError("Please enter a 4-digit PIN");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Validate PIN using the secure verification function
      const isValid = await verifyUserPin(pinValue);

      if (isValid) {
        setError("");
        setIsLoading(false);
        onSuccess();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setIsLoading(false);

        if (newAttempts >= maxAttempts) {
          setError("Too many incorrect attempts. Please try again later.");
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          setError(
            `Incorrect PIN. ${maxAttempts - newAttempts} attempts remaining.`
          );
          triggerShake();
          setPin(["", "", "", ""]);
          pinRefs.current[0]?.focus();
        }
      }
    } catch (error) {
      console.error("PIN verification error:", error);
      setIsLoading(false);
      setError("An error occurred while verifying your PIN. Please try again.");
    }
  };

  const isFormValid = pin.every((digit) => digit !== "") && pin.length === 4;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-[90vw] max-w-md mx-auto"
        showCloseButton={false}
      >
        <DialogHeader className="pb-2 sm:pb-3">
          <DialogTitle className="text-center text-base sm:text-lg font-semibold text-gray-900 flex items-center justify-center gap-1 sm:gap-2">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 text-xs sm:text-sm mt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* PIN Input */}
          <motion.div
            animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="space-y-2 sm:space-y-3"
          >
            <div>
              <label className="text-center block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                Enter your 4-digit PIN
              </label>
              <div className="flex justify-center gap-1 sm:gap-2">
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
                    className="w-8 h-8 sm:w-10 sm:h-10 text-center text-sm sm:text-lg font-mono border-2 focus:border-green-500 focus:ring-green-500"
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
                onClick={() => setShowPin(!showPin)}
                disabled={isLoading}
                className="text-gray-500 hover:text-gray-700 text-xs h-6 sm:h-8 px-2 sm:px-3"
              >
                {showPin ? (
                  <>
                    <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Hide PIN
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
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
                className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 flex-shrink-0" />
                <p className="text-red-800 text-xs sm:text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-1 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 h-8 sm:h-10 text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="flex-1 bg-green-600 hover:bg-green-700 h-8 sm:h-10 text-xs sm:text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" />
                  Verifying...
                </>
              ) : (
                action
              )}
            </Button>
          </div>

          {/* Security Notice */}
          <div className="text-center pt-1">
            <p className="text-xs text-gray-500">
              Your PIN is encrypted and stored securely.
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PinValidationModal;
