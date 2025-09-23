'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Image from 'next/image';

const ErrorPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      {/* Enhanced Background image and overlay for mobile/small screens */}
      <div
        className="absolute inset-0 block lg:hidden z-0"
        aria-hidden="true"
      >
        <img
          src="/bg-1.jpg"
          alt="Golden wheat field at sunset"
          className="w-full h-full object-cover"
        />
        {/* Multi-layer overlay for better contrast and visual depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/85 via-red-800/80 to-orange-900/75" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
        {/* Subtle pattern overlay for texture */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      </div>

      {/* Left side - Content with enhanced mobile styling */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white/95 backdrop-blur-sm lg:bg-opacity-100 relative z-10">
        <div className="w-full max-w-md space-y-6 text-center">
          {/* Mobile header with logo */}
          <div className="block lg:hidden mb-6">
            <Image src="/y-logo.png" alt="AgriPath" width={60} height={60} className="mx-auto mb-4" />
            <div className="text-white/90 text-sm">
              {new Date().toLocaleString('en-GB', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'GMT',
                timeZoneName: 'short'
              }).replace('GMT', 'GMT')}
            </div>
          </div>

          {/* Error Icon */}
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
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
              onClick={() => window.location.reload()}
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

          {/* Mobile footer */}
          <div className="block lg:hidden text-center mt-8">
            <h2 className="text-lg font-bold text-white/90 mb-2">Invest in Real Farms. From Anywhere.</h2>
            <p className="text-sm text-white/70 mb-4">
              Invest in real farms growing food crops like cassava, tomatoes, and maize — all from your phone.
            </p>
            <div className="flex justify-center space-x-2">
              <div className="w-6 h-1 bg-white/60 rounded"></div>
              <div className="w-1 h-1 bg-white/40 rounded"></div>
              <div className="w-1 h-1 bg-white/40 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Image (Desktop only) */}
      <div className="flex-1 relative hidden lg:block">
        <img
          src="/bg-1.jpg"
          alt="Golden wheat field at sunset"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/60 to-orange-500/40" />
        
        {/* Date/Time Badge */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
          <div className="bg-black bg-opacity-50 text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm">
            {new Date().toLocaleString('en-GB', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
              timeZone: 'GMT',
              timeZoneName: 'short'
            }).replace('GMT', 'GMT')}
          </div>
        </div>

        {/* Logo */}
        <div className="absolute top-6 right-6 z-10">
          <Image src="/y-logo.png" alt="AgriPath" width={60} height={60} className="sm:w-20 sm:h-20" />
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-8 left-8 right-8 text-white">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Invest in Real Farms. From Anywhere.</h2>
          <p className="text-sm sm:text-base lg:text-lg mb-4">
            Invest in real farms growing food crops like cassava, tomatoes, and maize — all from your phone.
          </p>
          <div className="flex space-x-2">
            <div className="w-8 h-1 bg-white rounded"></div>
            <div className="w-1 h-1 bg-white bg-opacity-50 rounded"></div>
            <div className="w-1 h-1 bg-white bg-opacity-50 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
