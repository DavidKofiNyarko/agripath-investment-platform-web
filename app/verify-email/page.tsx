"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { createClient } from "@/app/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import Image from "next/image";
import Link from "next/link";

const VerifyEmailContent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  const verifyEmailToken = useCallback(
    async (token: string, tokenHash?: string) => {
      try {
        setIsLoading(true);
        setError("");

        // Try to get email from multiple sources
        let email = searchParams.get("email") || undefined;
        
        if (!email) {
          email = localStorage.getItem("pendingVerificationEmail") || undefined;
        }

        if (!email) {
          email = user?.email;
        }

        if (!email) {
          const {
            data: { user: sessionUser },
          } = await supabase.auth.getUser();
          email = sessionUser?.email || undefined;
        }

        // If we have a token hash, use hash-based verification (more secure, doesn't require email)
        if (tokenHash) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "email",
          });

          if (error) {
            setError(error.message);
            return;
          }

          // Verify that session was created - wait a moment for cookies to be set
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check session again to ensure it's properly set
          const { data: { session: finalSession } } = await supabase.auth.getSession();
          
          if (data?.session || finalSession) {
            // Success - user is now authenticated
            setIsVerified(true);
            localStorage.removeItem("pendingVerificationEmail");
            // Force a refresh of the auth state
            await supabase.auth.getUser();
            // Redirect to dashboard
            router.push("/dashboard");
            return;
          } else {
            setError("Session creation failed. Please try again.");
            return;
          }
        }

        // Fallback to token-based verification (requires email)
        if (!email) {
          setError("Email address not found. Please sign up again.");
          return;
        }

        const { data, error } = await supabase.auth.verifyOtp({
          token,
          type: "email",
          email: email,
        });

        if (error) {
          setError(error.message);
          return;
        }

        // Wait a moment for cookies to be set
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check session again to ensure it's properly set
        const { data: { session: finalSession } } = await supabase.auth.getSession();
        
        if (data?.session || finalSession) {
          // Success - user is now authenticated
          setIsVerified(true);
          localStorage.removeItem("pendingVerificationEmail");
          // Force a refresh of the auth state
          await supabase.auth.getUser();
          // Redirect to dashboard
          router.push("/dashboard");
        } else {
          setError("Session creation failed. Please try again.");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setError("An error occurred during verification. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, user?.email, router, searchParams]
  );

  // Handle email verification on page load
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const handleEmailVerification = async () => {
      // First, check if user is already authenticated (Supabase may have verified server-side)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // User is already authenticated, just redirect
        setIsVerified(true);
        localStorage.removeItem("pendingVerificationEmail");
        router.push("/dashboard");
        return;
      }

      // Set up auth state listener to catch when session is created
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === "SIGNED_IN" && session?.user) {
            // Session was created, redirect to dashboard
            setIsVerified(true);
            localStorage.removeItem("pendingVerificationEmail");
            router.push("/dashboard");
          }
        }
      );
      subscription = authSubscription;

      // If not authenticated, check for verification tokens in URL
      const token = searchParams.get("token");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      // Supabase email links include both token and token_hash
      // token_hash is preferred as it's more secure and doesn't require email
      if (tokenHash && type === "email") {
        await verifyEmailToken(token || "", tokenHash);
      } else if (token && type === "email") {
        // Fallback to token-based verification
        await verifyEmailToken(token);
      }
    };

    handleEmailVerification();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [searchParams, verifyEmailToken, supabase.auth, router]);

  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      setError("");
      setResendSuccess(false);

      // Get email from multiple sources (priority order):
      // 1. URL query parameter
      // 2. localStorage (stored during signup)
      // 3. User context
      // 4. Session
      let email = searchParams.get("email") || undefined;

      if (!email) {
        email = localStorage.getItem("pendingVerificationEmail") || undefined;
      }

      if (!email) {
        email = user?.email;
      }

      if (!email) {
        const {
          data: { user: sessionUser },
        } = await supabase.auth.getUser();
        email = sessionUser?.email || undefined;
      }

      // Validate email exists
      if (!email) {
        setError("Email address not found. Please sign up again.");
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("Invalid email address format.");
        return;
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setResendSuccess(true);
      // Clear error after successful resend
      setTimeout(() => {
        setResendSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("Resend verification error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f3f3f3]">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Email Verified!
          </h2>
          <p className="text-gray-600">Redirecting you to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile Layout - Centered Dark Design */}
      <div className="lg:hidden w-full min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center items-center gap-2">
            <Image
              src="/y-logo.svg"
              alt="AgriPath Logo"
              width={100}
              height={100}
            />
          </div>

          {/* Hero Text */}
          <div className="text-center space-y-2">
            <h1 className="font-anthropic text-3xl font-bold text-white">
              Verify Your Email
            </h1>
            <p className="text-[#A0A0A0] text-sm">
              Check your inbox to continue
            </p>
          </div>

          {/* Form Container - Dark Card */}
          <div className="bg-[#2C2C2C] rounded-2xl p-6 space-y-5">
            {/* Back Button */}
            <Link
              href="/signup"
              className="flex items-center text-[#A0A0A0] hover:text-white mb-4 transition-colors text-sm"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Sign Up
            </Link>

            {/* Email Icon */}
            <div className="flex justify-center py-4">
              <div className="w-20 h-20 bg-[#16a34a]/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-[#16a34a]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            {/* Instructions */}
              <div className="text-center space-y-3">
                <p className="text-white text-sm">
                  We&apos;ve sent a verification link to{" "}
                  <span className="font-medium text-[#16a34a]">
                    {searchParams.get("email") || localStorage.getItem("pendingVerificationEmail") || user?.email || "your email"}
                  </span>
                  .
                </p>
              <p className="text-[#A0A0A0] text-xs">
                {isLoading
                  ? "Checking verification..."
                  : "Click the link in your email to continue."}
              </p>
              <p className="text-[#A0A0A0] text-xs">
                Didn&apos;t receive the email? Check your spam folder or resend
                it.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {resendSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <p className="text-sm text-green-400">
                  Verification email sent! Check your inbox.
                </p>
              </div>
            )}

            {/* Resend Button */}
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="w-full py-3.5 px-4 rounded-xl font-medium transition-all duration-200 bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? "Sending..." : "Resend Verification Email"}
            </button>

            {/* Back to Sign In */}
            <div className="text-center pt-2">
              <button
                onClick={() => router.push("/signin")}
                className="text-[#A0A0A0] hover:text-white text-sm font-medium transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Split Screen */}
      <div className="hidden lg:flex w-full min-h-screen">
        {/* Left Side - Light Gray Background */}
        <div className="flex-1 bg-[#f3f3f3f3] flex items-center justify-center p-12">
          <div className="w-full max-w-md space-y-8">
            {/* Logo */}
            <div className="flex justify-start items-center gap-2">
              <Image
                src="/y-logo.svg"
                alt="AgriPath Logo"
                width={100}
                height={100}
                className="w-20 h-20"
              />
            </div>

            {/* Hero Text */}
            <div className="space-y-3">
              <h1 className="font-anthropic text-5xl font-bold text-black leading-tight">
                Verify Your Email
              </h1>
              <p className="text-gray-600 text-lg">
                We&apos;ve sent a verification link to your email. Click the
                link in your email to continue.
              </p>
            </div>

            {/* Form Container - Dark Green Card */}
            <div className="bg-[#091506f3] rounded-3xl p-8 lg:p-10 space-y-6 shadow-2xl border border-white/5">
              {/* Back Button */}
              <Link
                href="/signup"
                className="flex items-center text-white/70 hover:text-white mb-4 transition-colors text-sm"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Sign Up
              </Link>

              {/* Email Icon */}
              <div className="flex justify-center py-4">
                <div className="w-24 h-24 bg-[#16a34a]/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-[#16a34a]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>

              {/* Instructions */}
              <div className="text-center space-y-3">
                <p className="text-white/90 text-sm">
                  We&apos;ve sent a verification link to{" "}
                  <span className="font-medium text-[#16a34a]">
                    {searchParams.get("email") || localStorage.getItem("pendingVerificationEmail") || user?.email || "your email"}
                  </span>
                  .
                </p>
                <p className="text-white/60 text-xs">
                  {isLoading
                    ? "Checking verification..."
                    : "Check your email and click the verification link to activate your account."}
                </p>
                <p className="text-white/60 text-xs">
                  Didn&apos;t receive the email? Check your spam folder or
                  resend it.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {resendSuccess && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <p className="text-sm text-green-400">
                    Verification email sent! Check your inbox.
                  </p>
                </div>
              )}

              {/* Resend Button */}
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full py-3.5 px-4 rounded-xl font-medium transition-all duration-200 bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {isResending ? "Sending..." : "Resend Verification Email"}
              </button>

              {/* Back to Sign In */}
              <div className="text-center pt-2">
                <button
                  onClick={() => router.push("/signin")}
                  className="text-white/70 hover:text-white text-sm font-medium transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Dark with Image */}
        <div className="flex-1 relative bg-[#1A1A1A]">
          <Image
            src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Agricultural investment"
            fill
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] via-[#1A1A1A]/95 to-[#1A1A1A]" />

          {/* Bottom Content */}
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <h2 className="font-anthropic text-4xl font-bold mb-3 text-white">
              Invest in Real Farms. From Anywhere.
            </h2>
            <p className="text-lg text-white/80 mb-4">
              Invest in real farms growing food crops like cassava, tomatoes,
              and maize — all from your phone.
            </p>
            <div className="flex space-x-2">
              <div className="w-1 h-1 bg-white/50 rounded"></div>
              <div className="w-8 h-1 bg-white rounded"></div>
              <div className="w-1 h-1 bg-white/50 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const VerifyEmailPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
};

export default VerifyEmailPage;
