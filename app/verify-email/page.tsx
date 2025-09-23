'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

const VerifyEmailContent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  // Handle email verification on page load
  useEffect(() => {
    const handleEmailVerification = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      if (token && type === 'email') {
        await verifyEmailToken(token);
      }
    };

    handleEmailVerification();
  }, [searchParams]);

  const verifyEmailToken = async (token: string) => {
    try {
      setIsLoading(true);
      setError('');

      const { error } = await supabase.auth.verifyOtp({
        token,
        type: 'email',
        email: user?.email || ''
      });

      if (error) {
        setError(error.message);
        return;
      }

      setIsVerified(true);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error verifying email:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      setError('');
      setResendSuccess(false);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user?.email || ''
      });

      if (error) {
        setError(error.message);
        return;
      }

      setResendSuccess(true);
    } catch (error) {
      console.error('Error resending verification:', error);
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };


  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Verified!</h2>
          <p className="text-gray-600">Redirecting you to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white">
        <div className="w-full max-w-md space-y-4 sm:space-y-6">
          {/* Back Button */}
          <a href="/signup" className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Sign Up
          </a>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">Verify Your Email</h1>
            <p className="text-gray-600">
              We&apos;ve sent a verification link to <span className="font-medium">{user?.email || 'your email'}</span>. 
              {isLoading ? ' Checking verification...' : ' Click the link in your email to continue.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {resendSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-600">Verification email sent! Check your inbox.</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Email Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Instructions */}
            <div className="text-center space-y-2">
              <p className="text-gray-600">
                Check your email and click the verification link to activate your account.
              </p>
              <p className="text-sm text-gray-500">
                Didn&apos;t receive the email? Check your spam folder or resend it.
              </p>
            </div>

            {/* Resend Button */}
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="w-full py-3 px-4 rounded-md font-medium transition duration-200 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </button>

            {/* Back to Sign In */}
            <div className="text-center">
              <button
                onClick={() => router.push('/signin')}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="flex-1 relative">
        <img
          src="https://images.unsplash.com/photo-1548550023-4b5b4e0b0c0c?w=800&h=1200&fit=crop&crop=center"
          alt="Modern chicken farm with clean facilities"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 to-gray-800/40" />
        
        {/* Date/Time Badge */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
          <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
            Saturday, 10 May 2025 • 10:32 AM GMT
          </div>
        </div>

        {/* Logo */}
        <div className="absolute top-6 right-6">
          <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-lg">A</span>
          </div>
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-8 left-8 right-8 text-white">
          <h2 className="text-3xl font-bold mb-2">Invest in Real Farms. From Anywhere.</h2>
          <p className="text-lg mb-4">
            Invest in real farms growing food crops like cassava, tomatoes, and maize — all from your phone.
          </p>
          <div className="flex space-x-2">
            <div className="w-1 h-1 bg-white bg-opacity-50 rounded"></div>
            <div className="w-8 h-1 bg-white rounded"></div>
            <div className="w-1 h-1 bg-white bg-opacity-50 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const VerifyEmailPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
};

export default VerifyEmailPage;
