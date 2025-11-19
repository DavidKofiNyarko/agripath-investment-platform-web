"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  Check,
  X,
  ArrowRight,
  FileText,
  // User // Unused import
} from "lucide-react";
import { useProfile } from "@/contexts/ProfileContext";

interface KycModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteKyc: () => void;
  onEditKyc?: () => void;
}

const KycModal: React.FC<KycModalProps> = ({
  isOpen,
  onClose,
  onCompleteKyc,
  onEditKyc,
}) => {
  const { profile } = useProfile();

  const getKycStatusInfo = () => {
    switch (profile?.kyc_status) {
      case "verified":
        return {
          icon: Check,
          title: "KYC Verified",
          description:
            "Your identity has been verified. You can now make investments.",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          actionText: "Continue to Investment",
        };
      case "complete":
        return {
          icon: Check,
          title: "KYC Complete",
          description:
            "Your identity verification is complete. You can now make investments.",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          actionText: "Continue to Investment",
        };
      case "pending":
        return {
          icon: AlertTriangle,
          title: "KYC Under Review",
          description:
            "Your documents are being reviewed by our team. This usually takes 1-2 business days. You will be notified once verification is complete.",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          actionText: "View Status in Profile",
        };
      case "rejected":
        return {
          icon: X,
          title: "KYC Rejected",
          description:
            "Your documents were rejected. Please resubmit with clear, valid documents.",
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          actionText: "Resubmit Documents",
        };
      default:
        return {
          icon: Shield,
          title: "KYC Required",
          description:
            "Complete your identity verification to unlock investment access. Upload your National ID and take a selfie photo.",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          actionText: "Start Verification",
        };
    }
  };

  const statusInfo = getKycStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold text-gray-900">
            {statusInfo.title}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 mt-2">
            {statusInfo.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Icon */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className={`w-16 h-16 sm:w-20 sm:h-20 ${statusInfo.bgColor} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4`}
            >
              <StatusIcon
                className={`w-8 h-8 sm:w-10 sm:h-10 ${statusInfo.color}`}
              />
            </motion.div>
          </div>

          {/* KYC Requirements */}
          {profile?.kyc_status !== "verified" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 text-center">
                Required Documents
              </h3>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      profile?.kyc_documents?.id_front
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">
                      National ID Front
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {profile?.kyc_documents?.id_front
                        ? "Uploaded"
                        : "Not uploaded"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      profile?.kyc_documents?.id_back
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">
                      National ID Back
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {profile?.kyc_documents?.id_back
                        ? "Uploaded"
                        : "Not uploaded"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      profile?.kyc_documents?.selfie
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">
                      Selfie Photo
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {profile?.kyc_documents?.selfie
                        ? "Uploaded"
                        : "Not uploaded"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status-specific message */}
          <div
            className={`rounded-lg p-4 flex items-start ${statusInfo.bgColor} ${statusInfo.borderColor} border`}
          >
            <StatusIcon className={`h-5 w-5 mt-0.5 mr-3 ${statusInfo.color}`} />
            <div>
              <p
                className={`text-sm font-medium ${statusInfo.color
                  .replace("text-", "text-")
                  .replace("-600", "-800")}`}
              >
                {profile?.kyc_status === "verified"
                  ? "You can now make investments without restrictions."
                  : profile?.kyc_status === "pending"
                  ? "We are reviewing your documents. This usually takes 1-2 business days."
                  : profile?.kyc_status === "rejected"
                  ? "Please resubmit your documents with better quality images."
                  : "Complete your identity verification to unlock full access to investments."}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>

            {profile?.kyc_status === "verified" ? (
              <Button
                onClick={onClose}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {statusInfo.actionText}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : profile?.kyc_status === "pending" ? (
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                <Button
                  onClick={() => {
                    onClose();
                    window.location.href = "/settings?tab=profile&subtab=kyc";
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  View Status
                </Button>
                <Button
                  onClick={() => {
                    onClose();
                    if (onEditKyc) {
                      onEditKyc();
                    }
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Edit Documents
                </Button>
              </div>
            ) : profile?.kyc_status === "rejected" ? (
              <Button
                onClick={() => {
                  onClose();
                  if (onEditKyc) onEditKyc();
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                {statusInfo.actionText}
              </Button>
            ) : (
              <Button
                onClick={onCompleteKyc}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {statusInfo.actionText}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Security Notice */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Your documents are encrypted and stored securely.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KycModal;
