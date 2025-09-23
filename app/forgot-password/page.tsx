'use client';

import React, { useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { useRouter } from 'next/navigation';

const ForgotPasswordPage = () => {
  const [formData, setFormData] = useState({
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');
      
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/secure-account`
      });

      if (error) {
        setError(error.message);
        return;
      }

      setIsEmailSent(true);
    } catch (error) {
      console.error('Error sending reset email:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white">
        <div className="w-full max-w-md space-y-4 sm:space-y-6">
          {/* Back Button */}
          <a href="/signin" className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Sign In
          </a>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Forgot your password?</h1>
            <p className="text-sm sm:text-base text-gray-600">
              {isEmailSent 
                ? "Check your email for password reset instructions." 
                : "Enter your email address and we'll send you a link to reset your password."
              }
            </p>
          </div>

          {isEmailSent ? (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Reset email sent!
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>We've sent a password reset link to <strong>{formData.email}</strong></p>
                      <p className="mt-1">Check your email and click the link to reset your password.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => router.push('/signin')}
                className="w-full bg-green-600 text-white py-2 sm:py-3 px-4 rounded-md hover:bg-green-700 transition duration-200 font-medium text-sm sm:text-base"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  required
                  className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Send Reset Email Button */}
              <button
                type="submit"
                disabled={isLoading || !formData.email}
                className={`w-full py-2 sm:py-3 px-4 rounded-md font-medium transition duration-200 text-sm sm:text-base ${
                  isLoading || !formData.email
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isLoading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Right side - Image */}
      <div className="flex-1 relative hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&h=1200&fit=crop&crop=center"
          alt="Vibrant cassava field with blue sky"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-green-800/30" />
        
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
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
