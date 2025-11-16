"use client";

import React, { useState } from "react";
import { createClient } from "@/app/utils/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";

const ForgotPasswordPage = () => {
  const [formData, setFormData] = useState({
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError("");

      const { error } = await supabase.auth.resetPasswordForEmail(
        formData.email,
        {
          redirectTo: `${window.location.origin}/secure-account`,
        }
      );

      if (error) {
        setError(error.message);
        return;
      }

      setIsEmailSent(true);
    } catch (error) {
      console.error("Error sending reset email:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile Layout - Centered Dark Design */}
      <div className="lg:hidden w-full min-h-screen bg-[#f3f3f3f3] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Logo - Smaller for mobile */}
          <div className="flex justify-start px-4">
            <Image
              src="/y-logo.svg"
              alt="AgriPath Logo"
              width={200}
              height={200}
              className="h-20 w-auto"
            />
          </div>

          {/* Hero Text */}
          <div className="space-y-2 text-start px-4">
            <h1 className="font-anthropic text-4xl font-bold text-black leading-tight">
              Reset.
            </h1>
            <h1 className="font-anthropic text-4xl font-bold text-black leading-tight">
              Recover.
            </h1>
            <p className="text-black/80 text-base mt-4">
              Get back to your agricultural investments.
            </p>
          </div>

          {/* Form Container - Dark Card */}
          <div className="bg-[#191919f3] rounded-2xl p-6 space-y-5">
            {isEmailSent ? (
              <div className="space-y-5">
                <div className="bg-green-50/10 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-green-400 mb-1">
                        Reset email sent!
                      </h3>
                      <p className="text-xs text-white/70">
                        We&apos;ve sent a password reset link to{" "}
                        <strong className="text-white">{formData.email}</strong>
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        Check your email and click the link to reset your
                        password.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push("/signin")}
                  className="w-full bg-white text-gray-900 py-3.5 px-4 rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all duration-200 font-medium"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                {/* Back Button */}
                <a
                  href="/signin"
                  className="flex items-center text-white/60 hover:text-white transition-colors text-sm mb-2"
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
                  Back to Sign In
                </a>

                <div className="space-y-2 pb-2">
                  <h2 className="text-2xl font-bold text-white">
                    Forgot your password?
                  </h2>
                  <p className="text-sm text-white/60">
                    Enter your email address and we&apos;ll send you a link to
                    reset your password.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3.5 bg-[#1A1A1A] border border-white/10 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all duration-200"
                    required
                  />

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || !formData.email}
                    className="w-full bg-white text-gray-900 py-3.5 px-4 rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isLoading ? "Sending..." : "Send Reset Email"}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Privacy Policy */}
          <p className="text-xs text-white/50 text-center">
            By continuing, you acknowledge AgriPath&apos;s{" "}
            <a
              href="/legal?tab=privacy"
              className="text-white/70 hover:text-white underline underline-offset-2"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>

      {/* Desktop Layout - Left side with form (2/3 width) */}
      <div className="hidden lg:flex lg:w-2/3 bg-[#f3f3f3f3] items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-lg space-y-8">
          {/* Logo */}
          <div className="flex justify-start">
            <Image
              src="/y-logo.svg"
              alt="AgriPath Logo"
              width={400}
              height={400}
              className="h-40 w-auto"
            />
          </div>

          {/* Hero Text */}
          <div className="space-y-2">
            <h1 className="font-anthropic text-5xl lg:text-6xl font-bold text-black leading-tight">
              Reset.
            </h1>
            <h1 className="font-anthropic text-5xl lg:text-6xl font-bold text-black leading-tight">
              Recover.
            </h1>
            <p className="text-black/80 text-lg mt-4">
              Get back to your agricultural investments.
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-[#091506f3] rounded-3xl p-8 lg:p-10 space-y-6 shadow-2xl border border-white/5">
            {isEmailSent ? (
              <div className="space-y-6">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <svg
                      className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <h3 className="text-base font-medium text-green-400 mb-2">
                        Reset email sent!
                      </h3>
                      <p className="text-sm text-white/70 mb-1">
                        We&apos;ve sent a password reset link to{" "}
                        <strong className="text-white">{formData.email}</strong>
                      </p>
                      <p className="text-sm text-white/60">
                        Check your email and click the link to reset your
                        password.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push("/signin")}
                  className="w-full bg-white text-gray-900 py-3.5 px-4 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                {/* Back Button */}
                <a
                  href="/signin"
                  className="flex items-center text-white/60 hover:text-white transition-colors text-sm mb-2"
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
                  Back to Sign In
                </a>

                <div className="space-y-2 pb-2">
                  <h2 className="text-2xl font-bold text-white">
                    Forgot your password?
                  </h2>
                  <p className="text-sm text-white/60">
                    Enter your email address and we&apos;ll send you a link to
                    reset your password.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="space-y-1">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-200 hover:border-white/15"
                      required
                    />
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || !formData.email}
                    className="w-full bg-white text-gray-900 py-3.5 px-4 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md"
                  >
                    {isLoading ? "Sending..." : "Send Reset Email"}
                  </button>
                </form>
              </>
            )}

            {/* Sign In Link */}
            <div className="pt-2 border-t border-white/10">
              <p className="text-center text-sm text-white/60">
                Remember your password?{" "}
                <a
                  href="/signin"
                  className="text-white hover:text-white/90 font-medium transition-colors underline underline-offset-2"
                >
                  Sign in
                </a>
              </p>
            </div>
          </div>

          {/* Privacy Policy */}
          <p className="text-xs text-black/50 text-center">
            By continuing, you acknowledge AgriPath&apos;s{" "}
            <a
              href="/legal?tab=privacy"
              className="text-black/70 hover:text-black underline underline-offset-2"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>

      {/* Right side - Dark background with image (1/3 width) */}
      <div className="hidden lg:flex lg:w-3/4 relative bg-[#050505f3] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
          alt="Agricultural investment"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
