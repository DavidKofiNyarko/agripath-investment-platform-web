'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import KycVerification from '@/components/kyc-verification';

const KycVerificationPage = () => {
  const router = useRouter();

  const handleComplete = () => {
    router.push('/investments');
  };

  const handleSkip = () => {
    router.push('/investments');
  };

  return (
    <KycVerification 
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
};

export default KycVerificationPage;