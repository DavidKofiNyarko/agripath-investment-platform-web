'use client';

import React from 'react';
import { X, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KycRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteKyc: () => void;
  transactionType: 'topup' | 'withdrawal';
}

const KycRequiredModal: React.FC<KycRequiredModalProps> = ({ 
  isOpen, 
  onClose, 
  onCompleteKyc, 
  transactionType 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-yellow-600" />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            KYC Verification Required
          </h2>
          <p className="text-gray-600 leading-relaxed">
            To {transactionType === 'topup' ? 'add money to' : 'withdraw from'} your wallet, 
            you need to complete your identity verification first. This helps us ensure 
            secure transactions and comply with financial regulations.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onCompleteKyc}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-base shadow-lg"
          >
            Complete KYC Verification
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 text-base"
          >
            Cancel
          </Button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 text-center">
            <strong>What you'll need:</strong> Valid ID document, proof of address, and a clear selfie photo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default KycRequiredModal;
