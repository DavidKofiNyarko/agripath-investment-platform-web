'use client';

import React, { useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import Image from 'next/image';

const SignupPage = () => {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    country: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  // Redirect if already signed in with delay
  React.useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 1500); // 1.5 second delay
      
      return () => clearTimeout(timer);
    }
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      
      if (error) {
        console.error('Error signing up with Google:', error);
      }
    } catch (error) {
      console.error('Error signing up with Google:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const isPasswordValid = passwordStrength >= 4;
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== '';

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      alert('Please create a stronger password');
      return;
    }
    
    if (!passwordsMatch) {
      alert('Passwords do not match');
      return;
    }
    
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });
      
      if (error) {
        console.error('Error signing up:', error);
        alert('Error signing up: ' + error.message);
      } else {
        console.log('Sign up successful');
        // Redirect to verify email page
        router.push('/verify-email');
      }
    } catch (error) {
      console.error('Error signing up:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen if user is signed in (waiting for redirect)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome!</h2>
          <p className="text-gray-600">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      {/* Enhanced Background image and overlay for mobile/small screens */}
      <div
        className="absolute inset-0 block lg:hidden z-0"
        aria-hidden="true"
      >
        <img
          src="/bg-2.jpg"
          alt="Beautiful farm landscape with green fields"
          className="w-full h-full object-cover"
        />
        {/* Multi-layer overlay for better contrast and visual depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/85 via-emerald-800/80 to-green-700/75" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
        {/* Subtle pattern overlay for texture */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      </div>

      {/* Left side - Form with enhanced mobile styling */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white/95 backdrop-blur-sm lg:bg-opacity-100 relative z-10">
        <div className="w-full max-w-md space-y-4 sm:space-y-6">
          {/* Mobile header with logo */}
          <div className="block lg:hidden text-center mb-6">
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
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Create Your Account</h1>
            <p className="text-sm sm:text-base text-gray-600">Start your journey with AgriPath by entering your details.</p>
          </div>

          <form onSubmit={handleEmailSignUp} className="space-y-4">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter name"
                  className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter name"
                  className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>

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
                placeholder="Enter email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Country */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Select Country</option>
                  <option value="ghana">🇬🇭 Ghana</option>
                  <option value="nigeria">🇳🇬 Nigeria</option>
                  <option value="kenya">🇰🇪 Kenya</option>
                  <option value="uganda">🇺🇬 Uganda</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <div className="flex items-center px-3 border border-r-0 border-gray-300 rounded-l-md bg-gray-50">
                  <span className="text-sm">🇬🇭</span>
                  <span className="ml-1 text-sm text-gray-600">+233</span>
                  <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="000 000 000"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a strong password"
                  className="w-full px-3 py-2 sm:py-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                (8+ characters, Number, Symbol, Lowercase, Uppercase)
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter password"
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    formData.confirmPassword && !passwordsMatch
                      ? 'border-red-300 bg-red-50'
                      : passwordsMatch
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Continue Button */}
            <button
              type="submit"
              disabled={isLoading || !isPasswordValid || !passwordsMatch}
              className={`w-full py-2 sm:py-3 px-4 rounded-md font-medium transition duration-200 text-sm sm:text-base ${
                isLoading || !isPasswordValid || !passwordsMatch
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            {/* Google Sign Up */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2 sm:py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLoading ? 'Signing up...' : 'Sign up with Google'}
            </button>

            {/* Sign In Link */}
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/signin" className="text-green-600 hover:text-green-700 font-medium transition-colors">
                Sign in here
              </a>
            </p>

            {/* Legal Links */}
            <div className="text-center text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
              <p className="mb-2">
                By creating an account, you agree to our{' '}
                <a href="/legal?tab=service" className="text-green-600 hover:text-green-700 underline">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="/legal?tab=privacy" className="text-green-600 hover:text-green-700 underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </form>

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
      {/* Right side - Image */}
      <div className="flex-1 relative hidden lg:block">
        <img
          src="/bg-2.jpg"
          alt="Beautiful farm landscape with green fields"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/60 to-green-700/40" />
        
        {/* Date/Time Badge */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
          <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
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
         <Image src="/y-logo.png" alt="AgriPath" width={80} height={80} />
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-8 left-8 right-8 text-white">
          <h2 className="text-3xl font-bold mb-2">Invest in Real Farms. From Anywhere.</h2>
          <p className="text-lg mb-4">
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

export default SignupPage;
