'use client';

import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // error parameter is required by Next.js but not used in this implementation
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        {/* Error Icon */}
        <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h1>

        {/* Subtitle */}
        <p className="text-gray-600 mb-8">
          We encountered an unexpected error. Don&apos;t worry, our team has been notified.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition duration-200 font-medium flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </button>

          <button
            onClick={reset}
            className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 transition duration-200 font-medium flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        </div>

        {/* Help Message */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            If this problem continues, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}
