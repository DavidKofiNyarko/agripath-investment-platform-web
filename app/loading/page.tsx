'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

const LoadingPage = () => {
  const router = useRouter();
  const { user, loading } = useUser();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/signin');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      {/* Background Image */}
      <img
        src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1920&h=1080&fit=crop&crop=center"
        alt="Beautiful farm landscape"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/80 to-green-700/60" />
      
      {/* Loading Spinner */}
      <div className="relative z-10 text-center">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
        
        {/* AgriPath logo in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-green-600 font-bold text-xs">A</span>
          </div>
        </div>
        
        {/* Loading text */}
        <div className="mt-8 text-white">
          <h2 className="text-xl font-semibold mb-2">Loading AgriPath</h2>
          <p className="text-white/80">Please wait while we set up your experience...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;
