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
import { ArrowDownLeft, Loader2 } from "lucide-react";
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
  // Momo fields
  subscriber_number: string;
  network: string;
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
    subscriber_number: "",
    network: "",
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
      // Check if phone number and network are provided
      if (!formData.subscriber_number?.trim() || !formData.network?.trim()) {
        return false;
      }

      // Validate phone number format (Ghana format)
      const phoneRegex = /^0[2-9][0-9]{8}$/;
      const cleanPhone = formData.subscriber_number.replace(/\s/g, "");
      return phoneRegex.test(cleanPhone);
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
      // More strict validation for mobile money
      if (
        !formData.subscriber_number ||
        formData.subscriber_number.trim() === ""
      ) {
        setError("Mobile number is required for mobile money");
        return;
      }
      if (!formData.network || formData.network.trim() === "") {
        setError("Network provider is required for mobile money");
        return;
      }
      // Validate phone number format (Ghana format)
      const phoneRegex = /^0[2-9][0-9]{8}$/;
      if (!phoneRegex.test(formData.subscriber_number.replace(/\s/g, ""))) {
        setError(
          "Please enter a valid Ghana mobile number (e.g., 024 567 8905)"
        );
        return;
      }
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
              subscriber_number: formData.subscriber_number,
              network: formData.network,
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
          subscriber_number: "",
          network: "",
        });
      } else if (result.redirect_url) {
        // Handle payment verification redirect
        window.open(result.redirect_url, "_blank");
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
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (GHS)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              placeholder="Enter amount to add"
              required
            />
          </div>

          {/* Channel Selection */}
          <div className="space-y-2">
            <Label htmlFor="channel">Payment Method</Label>
            <Select
              value={formData.channel}
              onValueChange={(value: "card" | "momo") =>
                handleInputChange("channel", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Card Payment</SelectItem>
                <SelectItem value="momo">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Card Payment Fields */}
          {formData.channel === "card" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="pan">Card Number</Label>
                <Input
                  id="pan"
                  value={formData.pan}
                  onChange={(e) => handleInputChange("pan", e.target.value)}
                  placeholder="5314455096498197"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exp_month">Expiry Month</Label>
                  <Select
                    value={formData.exp_month}
                    onValueChange={(value) =>
                      handleInputChange("exp_month", value)
                    }
                  >
                    <SelectTrigger>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp_year">Expiry Year</Label>
                  <Select
                    value={formData.exp_year}
                    onValueChange={(value) =>
                      handleInputChange("exp_year", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="YY" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() + i;
                        return (
                          <SelectItem key={year} value={String(year).slice(-2)}>
                            {String(year).slice(-2)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  type="password"
                  value={formData.cvv}
                  onChange={(e) => handleInputChange("cvv", e.target.value)}
                  placeholder="553"
                  maxLength={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card_holder">Card Holder Name</Label>
                <Input
                  id="card_holder"
                  value={formData.card_holder}
                  onChange={(e) =>
                    handleInputChange("card_holder", e.target.value)
                  }
                  placeholder="David"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user_email">Email</Label>
                <Input
                  id="user_email"
                  type="email"
                  value={formData.user_email}
                  onChange={(e) =>
                    handleInputChange("user_email", e.target.value)
                  }
                  placeholder="david@test.com"
                  required
                />
              </div>
            </>
          )}

          {/* Mobile Money Fields */}
          {formData.channel === "momo" && (
            <>
              <div className="space-y-2">
                <Label
                  htmlFor="subscriber_number"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Mobile Number
                </Label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500">
                  <div className="flex items-center px-3 py-3 bg-gray-50 border-r border-gray-300">
                    <span className="text-lg mr-2">🇬🇭</span>
                    <span className="text-sm font-medium text-gray-700">
                      +233
                    </span>
                  </div>
                  <Input
                    id="subscriber_number"
                    value={formData.subscriber_number}
                    onChange={(e) =>
                      handleInputChange("subscriber_number", e.target.value)
                    }
                    placeholder="024 567 8905"
                    required
                    className="flex-1 border-0 rounded-none focus:ring-0 focus:border-0 py-3 px-3 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="network">Network Provider *</Label>
                <Select
                  value={formData.network}
                  onValueChange={(value) => handleInputChange("network", value)}
                >
                  <SelectTrigger
                    className={
                      !formData.network
                        ? "border-red-300 focus:border-red-500"
                        : ""
                    }
                  >
                    <SelectValue placeholder="Select network provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MTN">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span>MTN</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="VDF">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Vodafone</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ATL">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Airtel</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="TGO">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span>Tigo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ZPY">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Zeepay</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="GMY">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span>G-money</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {!formData.network && (
                  <p className="text-sm text-red-600">
                    Please select a network provider
                  </p>
                )}
              </div>
            </>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Add a description for this topup"
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
