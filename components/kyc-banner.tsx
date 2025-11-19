"use client";

import React from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { useRouter } from "next/navigation";
import { AlertTriangle, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const KycBanner: React.FC = () => {
  const { profile } = useProfile();
  const router = useRouter();
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Show banner if:
  // - KYC is complete (but not verified)
  // - KYC is pending
  // - KYC is rejected
  // - KYC is not verified (null, undefined, or any other status)
  // Do NOT show if KYC is verified
  const shouldShowBanner =
    !isDismissed &&
    profile &&
    profile.kyc_status !== "verified" &&
    (profile.kyc_status === "complete" ||
      profile.kyc_status === "pending" ||
      profile.kyc_status === "rejected" ||
      !profile.kyc_status);

  if (!shouldShowBanner) return null;

  const getBannerContent = () => {
    switch (profile.kyc_status) {
      case "complete":
        return {
          message:
            "Your KYC verification is complete and awaiting final verification. You can make investments while we complete the verification process.",
          buttonText: "View Status",
          variant: "warning" as const,
        };
      case "pending":
        return {
          message:
            "Your KYC verification is under review. This usually takes 1-2 business days.",
          buttonText: "View Status",
          variant: "warning" as const,
        };
      case "rejected":
        return {
          message:
            "Your KYC verification was rejected. Please resubmit your documents.",
          buttonText: "Resubmit KYC",
          variant: "error" as const,
        };
      default:
        return {
          message:
            "Complete your KYC verification to unlock full access to investments and transactions.",
          buttonText: "Complete KYC",
          variant: "info" as const,
        };
    }
  };

  const content = getBannerContent();

  const handleCompleteKyc = () => {
    if (
      profile?.kyc_status === "pending" ||
      profile?.kyc_status === "complete"
    ) {
      router.push("/settings?tab=profile");
    } else {
      router.push("/kyc-verification");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`sticky top-0 z-50 w-full ${
          content.variant === "error"
            ? "bg-red-50 border-b border-red-200"
            : content.variant === "warning"
            ? "bg-yellow-50 border-b border-yellow-200"
            : "bg-green-50 border-b border-green-200"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
              <AlertTriangle
                className={`h-5 w-5 flex-shrink-0 mt-0.5 sm:mt-0 ${
                  content.variant === "error"
                    ? "text-red-600"
                    : content.variant === "warning"
                    ? "text-yellow-600"
                    : "text-green-800"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    content.variant === "error"
                      ? "text-red-800"
                      : content.variant === "warning"
                      ? "text-yellow-800"
                      : "text-green-800"
                  }`}
                >
                  {content.message}
                </p>
              </div>
              <button
                onClick={() => setIsDismissed(true)}
                className={`p-1 rounded-md hover:bg-white/50 transition-colors flex-shrink-0 ${
                  content.variant === "error"
                    ? "text-red-600 hover:text-red-700"
                    : content.variant === "warning"
                    ? "text-yellow-600 hover:text-yellow-700"
                    : "text-green-800 hover:text-green-900"
                }`}
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-center sm:justify-end">
              <Button
                onClick={handleCompleteKyc}
                size="sm"
                className={`w-full sm:w-auto ${
                  content.variant === "error"
                    ? "bg-red-600 hover:bg-red-700"
                    : content.variant === "warning"
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-green-800 hover:bg-green-900"
                } text-white`}
              >
                {content.buttonText}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default KycBanner;
