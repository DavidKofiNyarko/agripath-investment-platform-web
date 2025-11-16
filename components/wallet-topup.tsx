"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/contexts/UserContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useProjects } from "@/contexts/ProjectsContext";
import { useWallet } from "@/contexts/WalletContext";
import { ArrowDownLeft, Loader2, CreditCard, Lock, Calendar, Info } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import KycRequiredModal from "@/components/kyc-required-modal";

interface TopupFormData {
  amount: string;
  channel: "card" | "momo";
  description: string;
  // Card fields
  pan: string;
  exp_month: string;
  exp_year: string;
  cvv: string;
  card_holder: string;
  user_email: string;
  // Momo fields - removed, handled by Paystack
}

const WalletTopup: React.FC = () => {
  const { user } = useUser();
  const { profile } = useProfile();
  const { projects } = useProjects();
  const { processWalletTopup } = useWallet();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");
  const [showKycModal, setShowKycModal] = useState(false);

  const [formData, setFormData] = useState<TopupFormData>({
    amount: "",
    channel: "card",
    description: "",
    pan: "",
    exp_month: "",
    exp_year: "",
    cvv: "",
    card_holder: "",
    user_email: "",
  });

  // Update user_email when user changes
  React.useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({ ...prev, user_email: user.email || "" }));
    }
  }, [user?.email]);

  const handleInputChange = (field: keyof TopupFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
    setSuccess("");
    setPending("");
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    // Check amount first
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      return false;
    }

    if (formData.channel === "card") {
      return !!(
        formData.pan?.trim() &&
        formData.exp_month?.trim() &&
        formData.exp_year?.trim() &&
        formData.cvv?.trim() &&
        formData.card_holder?.trim() &&
        formData.user_email?.trim()
      );
    } else if (formData.channel === "momo") {
      // MoMo validation - no fields required, Paystack handles it
      return true;
    }

    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id || !profile?.id) {
      setError("User not authenticated");
      return;
    }

    if (!projects || projects.length === 0) {
      setError("No projects available");
      return;
    }

    // Validate required fields based on channel
    if (formData.channel === "card") {
      if (
        !formData.pan ||
        !formData.exp_month ||
        !formData.exp_year ||
        !formData.cvv ||
        !formData.card_holder ||
        !formData.user_email
      ) {
        setError("All card fields are required");
        return;
      }
    } else if (formData.channel === "momo") {
      // MoMo validation - no fields required, Paystack handles it
      // User will enter phone number and network on Paystack page
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setPending("");

    try {
      const topupData = {
        amount: parseFloat(formData.amount),
        channel: formData.channel,
        description:
          formData.description || `Wallet topup - ${formData.channel}`,
        user_email: formData.user_email || user?.email || "", // Always include user_email
        ...(formData.channel === "card"
          ? {
              pan: formData.pan,
              exp_month: formData.exp_month,
              exp_year: formData.exp_year,
              cvv: formData.cvv,
              card_holder: formData.card_holder,
            }
          : {
              // MoMo fields removed - Paystack handles phone number and network
            }),
      };

      const result = await processWalletTopup(topupData);

      if (result.success) {
        setSuccess(
          "Topup request submitted successfully! Please complete the payment verification to add funds to your wallet."
        );

        // Reset form
        setFormData({
          amount: "",
          channel: "card",
          description: "",
          pan: "",
          exp_month: "",
          exp_year: "",
          cvv: "",
          card_holder: "",
          user_email: user?.email || "",
        });
      } else if (result.redirect_url) {
        // For mobile money payments, redirect directly to Paystack
        // Paystack will handle phone number and network input
        const redirectUrl = result.redirect_url;
        // Handle payment verification redirect
        window.open(redirectUrl, "_blank");
        setPending(
          "Payment verification required. Please complete the payment in the popup window. Your wallet will be updated once payment is confirmed."
        );
      } else if (result.error?.includes("KYC verification required")) {
        // Show KYC modal instead of error message
        setShowKycModal(true);
      } else {
        setError(result.error || "Topup failed. Please try again.");
      }
    } catch (err) {
      console.error("Topup error:", err);
      setError(
        err instanceof Error ? err.message : "Topup failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDownLeft className="w-5 h-5 text-blue-600" />
          Wallet Topup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div className="space-y-3">
            <Label
              htmlFor="amount"
              className="text-sm font-semibold text-gray-800 flex items-center gap-2"
            >
              <span className="text-green-600">GH₵</span>
              Amount
            </Label>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                placeholder="0.00"
                required
                className="
                  relative z-10 w-full px-4 py-4 text-lg font-medium text-gray-900 
                  placeholder:text-gray-400 bg-gray-50/80 border border-gray-200 
                  rounded-xl shadow-sm transition-all duration-300 ease-in-out
                  hover:bg-white hover:border-green-300 hover:shadow-md
                  focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100
                  focus:outline-none focus-visible:ring-4 focus-visible:ring-green-100
                "
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 pointer-events-none">
                GHS
              </div>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-1 h-1 bg-green-500 rounded-full"></span>
              Minimum amount: GH₵ 1.00
            </p>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700">
              Payment Method
            </Label>
            <RadioGroup
              value={formData.channel}
              onValueChange={(value: "card" | "momo") =>
                handleInputChange("channel", value)
              }
            >
              {/* Bank Card Option */}
              <div
                className={`w-full rounded-xl border transition-all duration-200 ${
                  formData.channel === "card"
                    ? "border-green-500 bg-green-50/30"
                    : "border-gray-200"
                }`}
              >
                {/* Header Row */}
                <div className="flex h-[100px] sm:h-[110px] p-6 sm:p-8 items-center gap-4 sm:gap-6 w-full">
                  <RadioGroupItem
                    value="card"
                    id="card"
                    className="w-6 h-6 sm:w-7 sm:h-7"
                  />
                  <Label
                    htmlFor="card"
                    className="flex-1 cursor-pointer"
                  >
                    <span className="text-base sm:text-lg font-medium">
                      Bank Card
                    </span>
                  </Label>
                  <CreditCard className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                </div>

                {/* Expanded Form Fields */}
                {formData.channel === "card" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-green-200"
                  >
                    <div className="p-6 space-y-8">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Cardholder Name
                        </Label>
                        <Input
                          id="card_holder"
                          value={formData.card_holder}
                          onChange={(e) =>
                            handleInputChange("card_holder", e.target.value)
                          }
                          placeholder="Amanda"
                          className="mt-1 border-0 outline-none focus:ring-0 focus:border-0 transition-all duration-200"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Card number
                        </Label>
                        <div className="relative mt-1">
                          <Input
                            id="pan"
                            placeholder="0000 0000 0000 0000"
                            value={formData.pan}
                            onChange={(e) => handleInputChange("pan", e.target.value)}
                            maxLength={19}
                            inputMode="numeric"
                            className="pr-20 border-0 outline-none focus:ring-0 focus:border-0 transition-all duration-200"
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                            <Lock className="h-4 w-4 text-gray-400" />
                            <div className="w-8 h-5 bg-red-500 rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                MC
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Expiry Date
                          </Label>
                          <div className="relative mt-1">
                            <div className="flex gap-2">
                              <Select
                                value={formData.exp_month}
                                onValueChange={(value) =>
                                  handleInputChange("exp_month", value)
                                }
                              >
                                <SelectTrigger className="flex-1 border-0 outline-none focus:ring-0 focus:border-0">
                                  <SelectValue placeholder="MM" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem
                                      key={i + 1}
                                      value={String(i + 1).padStart(2, "0")}
                                    >
                                      {String(i + 1).padStart(2, "0")}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={formData.exp_year}
                                onValueChange={(value) =>
                                  handleInputChange("exp_year", value)
                                }
                              >
                                <SelectTrigger className="flex-1 border-0 outline-none focus:ring-0 focus:border-0">
                                  <SelectValue placeholder="YY" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 10 }, (_, i) => {
                                    const year = new Date().getFullYear() + i;
                                    return (
                                      <SelectItem
                                        key={year}
                                        value={String(year).slice(-2)}
                                      >
                                        {String(year).slice(-2)}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                            <Calendar className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            CVC/CVV
                          </Label>
                          <div className="relative mt-1">
                            <Input
                              id="cvv"
                              type="password"
                              placeholder="000"
                              value={formData.cvv}
                              onChange={(e) => handleInputChange("cvv", e.target.value)}
                              maxLength={4}
                              inputMode="numeric"
                              className="pr-8 text-sm sm:text-base border-0 outline-none focus:ring-0 focus:border-0 transition-all duration-200"
                            />
                            <Info className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="saveCard"
                          className="text-sm text-gray-600"
                        >
                          Save this payment method
                        </Label>
                        <Switch
                          id="saveCard"
                          checked={savePaymentMethod}
                          onCheckedChange={setSavePaymentMethod}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Mobile Money Option */}
              <div
                className={`w-full rounded-xl border transition-all duration-200 ${
                  formData.channel === "momo"
                    ? "border-green-500 bg-green-50/30"
                    : "border-gray-200"
                }`}
              >
                <div className="flex h-[100px] sm:h-[110px] p-6 sm:p-8 items-center gap-4 sm:gap-6 w-full">
                  <RadioGroupItem
                    value="momo"
                    id="momo"
                    className="w-6 h-6 sm:w-7 sm:h-7"
                  />
                  <Label
                    htmlFor="momo"
                    className="flex-1 cursor-pointer"
                  >
                    <span className="text-base sm:text-lg font-medium">
                      Mobile Money
                    </span>
                  </Label>
                  <ArrowDownLeft className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                </div>
                {formData.channel === "momo" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-green-200"
                  >
                    <div className="p-6">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          You will be redirected to Paystack to enter your mobile
                          number and network provider.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </RadioGroup>
          </div>

          {/* Email Field - Only show for card payments */}
          {formData.channel === "card" && (
            <div className="space-y-2">
              <Label
                htmlFor="user_email"
                className="text-sm font-medium text-gray-700"
              >
                Email
              </Label>
              <Input
                id="user_email"
                type="email"
                value={formData.user_email}
                onChange={(e) =>
                  handleInputChange("user_email", e.target.value)
                }
                placeholder="david@test.com"
                required
                className="!w-full !px-4 !py-3 !bg-gray-50 !border-0 !rounded-xl !text-gray-900 placeholder:!text-gray-400 focus:!bg-white focus:!ring-0 focus:!border-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!border-0 focus-visible:!outline-none !transition-all !duration-200 !shadow-sm hover:!bg-gray-100"
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-sm font-medium text-gray-700"
            >
              Description (Optional)
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Add a description for this topup"
              className="!w-full !px-4 !py-3 !bg-gray-50 !border-0 !rounded-xl !text-gray-900 placeholder:!text-gray-400 focus:!bg-white focus:!ring-0 focus:!border-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!border-0 focus-visible:!outline-none !transition-all !duration-200 !shadow-sm hover:!bg-gray-100"
            />
          </div>

          {/* Error/Success/Pending Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {pending && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-700">{pending}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !isFormValid()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-base shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Topup...
              </>
            ) : (
              "Submit Topup Request"
            )}
          </Button>
        </form>
      </CardContent>

      {/* KYC Required Modal */}
      <KycRequiredModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        onCompleteKyc={() => {
          setShowKycModal(false);
          // Navigate to profile setup or KYC page
          window.location.href = "/profile-setup";
        }}
        transactionType="topup"
      />
    </Card>
  );
};

export default WalletTopup;
