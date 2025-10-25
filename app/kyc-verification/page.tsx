"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import KycVerification from "@/components/kyc-verification";

const KycVerificationPage = () => {
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

export default KycVerificationPage;
