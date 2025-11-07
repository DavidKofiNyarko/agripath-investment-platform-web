"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import KycVerification from "@/components/kyc-verification";

const KycVerificationContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("edit") === "true";

  const handleComplete = () => {
    router.push("/investments");
  };

  const handleSkip = () => {
    router.push("/investments");
  };

  return (
    <KycVerification
      onComplete={handleComplete}
      onSkip={handleSkip}
      isEditMode={isEditMode}
    />
  );
};

const KycVerificationPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Loading...
              </h2>
              <p className="text-gray-600">
                Please wait while we load the KYC verification page...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <KycVerificationContent />
    </Suspense>
  );
};

export default KycVerificationPage;
