'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, RefreshCw } from 'lucide-react';

const NotFoundPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100 px-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* 404 Number */}
        <div className="relative mb-8">
          <h1 className="text-9xl md:text-[12rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-green-500 to-green-600">
            404
          </h1>
        </div>

        {/* Title */}
        <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Oops! Page Not Found
        </h2>

        {/* Subtitle */}
        <p className="text-xl text-gray-600 mb-8">
          The page you&apos;re looking for seems to have wandered off to greener pastures! 🌱
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="group flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-full font-semibold text-lg hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Home className="w-5 h-5" />
            Go Home
          </button>

          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 px-8 py-4 bg-white text-green-600 border-2 border-green-600 rounded-full font-semibold text-lg hover:bg-green-50 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>

          <button
            onClick={() => window.location.reload()}
            className="group flex items-center gap-2 px-8 py-4 bg-gray-100 text-gray-700 rounded-full font-semibold text-lg hover:bg-gray-200 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>

        {/* Fun Message */}
        <div className="mt-12 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-green-100">
          <p className="text-gray-700 text-lg">
            While you&apos;re here, why not explore our amazing farm investments?
            <span className="text-green-600 font-semibold"> Your next great harvest awaits!</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
