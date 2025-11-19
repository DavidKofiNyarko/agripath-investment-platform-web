"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Lock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { useProfile } from "@/contexts/ProfileContext";

interface PinResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PinResetModal: React.FC<PinResetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { profile } = useProfile();
  const [step, setStep] = useState<"otp" | "newPin" | "success">("otp");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPin, setNewPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [error, setError] = useState("");
  const [resetToken, setResetToken] = useState("");

  const otpRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const pinRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Automatically send OTP when modal opens
  useEffect(() => {
    if (isOpen && step === "otp" && profile?.email) {
      handleSendOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSendOtp = async () => {
    if (!profile?.email) {
      setError("Email not found. Please ensure you are logged in.");
      return;
    }

    setSendingOtp(true);
    setError("");

    try {
      const response = await fetch("/api/pin-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // No email needed - will be taken from session
      });

      const data = await response.json();

      if (response.ok) {
        setError("");
        // Focus first OTP input after a short delay
        setTimeout(() => {
          otpRefs.current[0]?.focus();
        }, 100);
      } else {
        setError(data.error || "Failed to send reset code");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handlePinChange = (
    index: number,
    value: string,
    type: "pin" | "confirm" = "pin"
  ) => {
    if (value.length > 1) return;

    if (type === "pin") {
      const newPinArray = [...newPin];
      newPinArray[index] = value;
      setNewPin(newPinArray);

      if (value && index < 3) {
        pinRefs.current[index + 1]?.focus();
      }
    } else {
      const newConfirmPinArray = [...confirmPin];
      newConfirmPinArray[index] = value;
      setConfirmPin(newConfirmPinArray);

      if (value && index < 3) {
        confirmPinRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent,
    type: "pin" | "confirm" = "pin"
  ) => {
    if (
      e.key === "Backspace" &&
      !(type === "pin" ? newPin[index] : confirmPin[index]) &&
      index > 0
    ) {
      (type === "pin"
        ? pinRefs.current[index - 1]
        : confirmPinRefs.current[index - 1]
      )?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!profile?.email) {
      setError("Email not found. Please ensure you are logged in.");
      return;
    }

    setResendingOtp(true);
    setError("");

    try {
      const response = await fetch("/api/pin-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // No email needed - will be taken from session
      });

      const data = await response.json();

      if (response.ok) {
        setError("");
      } else {
        setError(data.error || "Failed to resend code");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setResendingOtp(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/pin-reset/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otp: otpString,
        }), // Email will be taken from session
      });

      const data = await response.json();

      if (response.ok) {
        setResetToken(data.resetToken);
        setStep("newPin");
        setError("");
      } else {
        setError(data.error || "Invalid OTP code. Please try again.");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pinString = newPin.join("");
    const confirmPinString = confirmPin.join("");

    if (pinString !== confirmPinString) {
      setError("PINs do not match");
      return;
    }

    if (pinString.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/pin-reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken,
          newPin: pinString,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep("success");
      } else {
        setError(data.error || "Failed to reset PIN");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("otp");
    setOtp(["", "", "", "", "", ""]);
    setNewPin(["", "", "", ""]);
    setConfirmPin(["", "", "", ""]);
    setError("");
    setResetToken("");
    onClose();
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
                {step === "otp" && <Lock className="h-8 w-8 text-green-600" />}
                {step === "newPin" && (
                  <Lock className="h-8 w-8 text-green-600" />
                )}
                {step === "success" && (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                )}
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                {step === "otp" && "Verify OTP Code"}
                {step === "newPin" && "Set New PIN"}
                {step === "success" && "PIN Reset Successfully"}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                {step === "otp" &&
                  `Enter the 6-digit code sent to ${
                    profile?.email || "your email"
                  }`}
                {step === "newPin" && "Enter your new 4-digit PIN"}
                {step === "success" && "Your PIN has been updated successfully"}
              </p>
            </CardHeader>

            <CardContent>
              {step === "otp" && (
                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  <div>
                    <Label>Enter 6-digit OTP Code</Label>
                    <div className="flex gap-2 justify-center mt-2">
                      {otp.map((digit, index) => (
                        <Input
                          key={index}
                          ref={(el) => {
                            otpRefs.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          value={digit}
                          onChange={(e) =>
                            handleOtpChange(index, e.target.value)
                          }
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className="w-12 h-12 text-center text-lg font-mono"
                          maxLength={1}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Check your email for the verification code
                    </p>
                    {(sendingOtp || resendingOtp) && (
                      <div className="text-center mt-2">
                        <p className="text-xs text-gray-500">
                          {sendingOtp ? "Sending code..." : "Resending code..."}
                        </p>
                      </div>
                    )}
                    <div className="text-center mt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleResendOtp}
                        disabled={resendingOtp || sendingOtp}
                        className="text-xs text-green-600 hover:text-green-700"
                      >
                        {resendingOtp ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            Sending...
                          </>
                        ) : (
                          "Didn't receive code? Resend"
                        )}
                      </Button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || otp.some((d) => !d)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Verifying...
                        </>
                      ) : (
                        "Verify Code"
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {step === "newPin" && (
                <form onSubmit={handlePinSubmit} className="space-y-4">
                  <div>
                    <Label>New PIN</Label>
                    <div className="flex gap-2 justify-center mt-2">
                      {newPin.map((digit, index) => (
                        <Input
                          key={index}
                          ref={(el) => {
                            pinRefs.current[index] = el;
                          }}
                          type={showPin ? "text" : "password"}
                          value={digit}
                          onChange={(e) =>
                            handlePinChange(index, e.target.value, "pin")
                          }
                          onKeyDown={(e) => handleKeyDown(index, e, "pin")}
                          className="w-12 h-12 text-center text-lg font-mono"
                          maxLength={1}
                        />
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPin(!showPin)}
                      className="mt-2"
                    >
                      {showPin ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      {showPin ? "Hide" : "Show"}
                    </Button>
                  </div>

                  <div>
                    <Label>Confirm PIN</Label>
                    <div className="flex gap-2 justify-center mt-2">
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
                          className="w-12 h-12 text-center text-lg font-mono"
                          maxLength={1}
                        />
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConfirmPin(!showConfirmPin)}
                      className="mt-2"
                    >
                      {showConfirmPin ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      {showConfirmPin ? "Hide" : "Show"}
                    </Button>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("otp")}
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        loading ||
                        newPin.some((d) => !d) ||
                        confirmPin.some((d) => !d)
                      }
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Resetting...
                        </>
                      ) : (
                        "Reset PIN"
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {step === "success" && (
                <div className="text-center space-y-4">
                  <div className="text-green-600">
                    <CheckCircle className="h-16 w-16 mx-auto" />
                  </div>
                  <p className="text-gray-600">
                    Your PIN has been successfully reset. You can now use your
                    new PIN to access your account.
                  </p>
                  <Button
                    onClick={() => {
                      onSuccess();
                      handleClose();
                    }}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Continue
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PinResetModal;
