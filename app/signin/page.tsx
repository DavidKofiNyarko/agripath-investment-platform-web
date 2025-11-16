"use client";

import React, { useState } from "react";
import { createClient } from "@/app/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import Image from "next/image";
import Loading from "@/components/ui/loading";

const SignInPage = () => {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  // Redirect if already signed in with delay
  React.useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOAuthSignIn = async (provider: "google" | "apple" | "github") => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: provider === "google" ? {
            access_type: "offline",
            prompt: "consent",
          } : undefined,
          // Customize OAuth branding
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error(`Error signing in with ${provider}:`, error);
        alert(`Error signing in with ${provider}: ${error.message}`);
      }
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
      alert(`Error signing in with ${provider}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error("Error signing in:", error);
        alert("Error signing in: " + error.message);
      } else {
        console.log("Sign in successful");
      }
    } catch (error) {
      console.error("Error signing in:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return <Loading size="lg" className="min-h-screen bg-gray-50" />;
  }

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
              Grow.
            </h1>
            <h1 className="font-anthropic text-4xl font-bold text-black leading-tight">
              Harvest.
            </h1>
            <p className="text-black/80 text-base mt-4">
              The platform for smart agricultural investments.
            </p>
          </div>

          {/* Form Container - Dark Card */}
          <div className="bg-[#191919f3] rounded-2xl p-6 space-y-5">
            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={() => handleOAuthSignIn("google")}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 py-3.5 px-4 rounded-xl hover:bg-white/5 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#2C2C2C] text-white/60">OR</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="w-full px-4 py-3.5 bg-[#1A1A1A] border border-white/10 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all duration-200"
                required
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3.5 pr-12 bg-[#1A1A1A] border border-white/10 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:opacity-80 transition-opacity"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5 text-white/50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-white/50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-gray-900 py-3.5 px-4 rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? "Signing in..." : "Continue with email"}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="pt-2 border-t border-white/10">
              <p className="text-center text-sm text-white/60">
                Don&apos;t have an account?{" "}
                <a
                  href="/signup"
                  className="text-white hover:text-white/90 font-medium transition-colors underline underline-offset-2"
                >
                  Sign up
                </a>
              </p>
            </div>
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
              Grow.
            </h1>
            <h1 className="font-anthropic text-5xl lg:text-6xl font-bold text-black leading-tight">
              Harvest.
            </h1>
            <p className="text-black/80 text-lg mt-4">
              The platform for smart agricultural investments.
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-[#091506f3] rounded-3xl p-8 lg:p-10 space-y-6 shadow-2xl border border-white/5">
            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={() => handleOAuthSignIn("google")}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 py-3.5 px-4 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#091506f3] text-white/50 font-medium">
                  OR
                </span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-5">
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
              <div className="relative space-y-1">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3.5 pr-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-200 hover:border-white/15"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:opacity-80 transition-opacity"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5 text-white/50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-white/50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-gray-900 py-3.5 px-4 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md"
              >
                {isLoading ? "Signing in..." : "Continue with email"}
              </button>
              <div className="text-center pt-1">
                <a
                  href="/forgot-password"
                  className="text-sm text-white/60 hover:text-white transition-colors underline underline-offset-2"
                >
                  Forgot your password?
                </a>
              </div>
            </form>

            {/* Sign Up Link */}
            <div className="pt-2 border-t border-white/10">
              <p className="text-center text-sm text-white/60">
                Don&apos;t have an account?{" "}
                <a
                  href="/signup"
                  className="text-white hover:text-white/90 font-medium transition-colors underline underline-offset-2"
                >
                  Sign up
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

      {/* Right side - Orange background with image (1/3 width) */}
      <div className="hidden lg:flex lg:w-3/4 relative bg-[#050505f3] overflow-hidden">
        <img
          src="/bg-3.jpg"
          alt="Agricultural investment"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
      </div>
    </div>
  );
};

export default SignInPage;
