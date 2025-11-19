"use client";

import React, { useState } from "react";
import { createClient } from "@/app/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import Image from "next/image";
import Loading from "@/components/ui/loading";
import { countries } from "@/lib/countries";

const SignupPage = () => {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    country: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const supabase = createClient();
  const router = useRouter();

  // Country code mapping
  const getCountryCode = (country: string): { code: string; flag: string } => {
    // Normalize country name (handle hyphens and spaces)
    const countryLower = country.toLowerCase().replace(/-/g, " ");
    const countryMap: Record<string, { code: string; flag: string }> = {
      "ghana": { code: "+233", flag: "🇬🇭" },
      "nigeria": { code: "+234", flag: "🇳🇬" },
      "kenya": { code: "+254", flag: "🇰🇪" },
      "uganda": { code: "+256", flag: "🇺🇬" },
      "south africa": { code: "+27", flag: "🇿🇦" },
      "south-africa": { code: "+27", flag: "🇿🇦" },
      "tanzania": { code: "+255", flag: "🇹🇿" },
      "ethiopia": { code: "+251", flag: "🇪🇹" },
      "egypt": { code: "+20", flag: "🇪🇬" },
      "morocco": { code: "+212", flag: "🇲🇦" },
      "algeria": { code: "+213", flag: "🇩🇿" },
      "tunisia": { code: "+216", flag: "🇹🇳" },
      "libya": { code: "+218", flag: "🇱🇾" },
      "sudan": { code: "+249", flag: "🇸🇩" },
      "cameroon": { code: "+237", flag: "🇨🇲" },
      "ivory coast": { code: "+225", flag: "🇨🇮" },
      "ivory-coast": { code: "+225", flag: "🇨🇮" },
      "senegal": { code: "+221", flag: "🇸🇳" },
      "zimbabwe": { code: "+263", flag: "🇿🇼" },
      "zambia": { code: "+260", flag: "🇿🇲" },
      "mozambique": { code: "+258", flag: "🇲🇿" },
      "madagascar": { code: "+261", flag: "🇲🇬" },
      "angola": { code: "+244", flag: "🇦🇴" },
      "mali": { code: "+223", flag: "🇲🇱" },
      "burkina faso": { code: "+226", flag: "🇧🇫" },
      "burkina-faso": { code: "+226", flag: "🇧🇫" },
      "niger": { code: "+227", flag: "🇳🇪" },
      "rwanda": { code: "+250", flag: "🇷🇼" },
      "benin": { code: "+229", flag: "🇧🇯" },
      "guinea": { code: "+224", flag: "🇬🇳" },
      "burundi": { code: "+257", flag: "🇧🇮" },
      "togo": { code: "+228", flag: "🇹🇬" },
      "sierra leone": { code: "+232", flag: "🇸🇱" },
      "sierra-leone": { code: "+232", flag: "🇸🇱" },
      "liberia": { code: "+231", flag: "🇱🇷" },
      "chad": { code: "+235", flag: "🇹🇩" },
      "central african republic": { code: "+236", flag: "🇨🇫" },
      "central-african-republic": { code: "+236", flag: "🇨🇫" },
      "mauritania": { code: "+222", flag: "🇲🇷" },
      "eritrea": { code: "+291", flag: "🇪🇷" },
      "gambia": { code: "+220", flag: "🇬🇲" },
      "botswana": { code: "+267", flag: "🇧🇼" },
      "namibia": { code: "+264", flag: "🇳🇦" },
      "gabon": { code: "+241", flag: "🇬🇦" },
      "lesotho": { code: "+266", flag: "🇱🇸" },
      "guinea-bissau": { code: "+245", flag: "🇬🇼" },
      "guinea bissau": { code: "+245", flag: "🇬🇼" },
      "equatorial guinea": { code: "+240", flag: "🇬🇶" },
      "equatorial-guinea": { code: "+240", flag: "🇬🇶" },
      "mauritius": { code: "+230", flag: "🇲🇺" },
      "eswatini": { code: "+268", flag: "🇸🇿" },
      "djibouti": { code: "+253", flag: "🇩🇯" },
      "comoros": { code: "+269", flag: "🇰🇲" },
      "cape verde": { code: "+238", flag: "🇨🇻" },
      "cabo verde": { code: "+238", flag: "🇨🇻" },
      "sao tome and principe": { code: "+239", flag: "🇸🇹" },
      "sao-tome-and-principe": { code: "+239", flag: "🇸🇹" },
      "seychelles": { code: "+248", flag: "🇸🇨" },
    };

    return countryMap[countryLower] || { code: "+1", flag: "🌍" };
  };

  // Get current country code
  const currentCountryCode = formData.country ? getCountryCode(formData.country) : { code: "+233", flag: "🇬🇭" };

  // Phone number validation by country
  const validatePhoneNumber = (phone: string, country: string): boolean => {
    const cleanedPhone = phone.replace(/\s/g, "");
    
    switch (country.toLowerCase()) {
      case "ghana":
        // Ghana: 0[2-9][0-9]{8} (10 digits starting with 0, second digit 2-9)
        return /^0[2-9][0-9]{8}$/.test(cleanedPhone);
      case "nigeria":
        // Nigeria: 0[7-9][0-9]{9} (11 digits starting with 0, second digit 7-9)
        return /^0[7-9][0-9]{9}$/.test(cleanedPhone);
      case "kenya":
        // Kenya: 0[7][0-9]{8} (10 digits starting with 07)
        return /^0[7][0-9]{8}$/.test(cleanedPhone);
      case "uganda":
        // Uganda: 0[7][0-9]{8} (10 digits starting with 07)
        return /^0[7][0-9]{8}$/.test(cleanedPhone);
      default:
        // Default: at least 9 digits
        return /^[0-9]{9,15}$/.test(cleanedPhone);
    }
  };

  React.useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [user, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = {
      ...prev,
      [name]: value,
      };
      
      // Validate phone number when it changes
      if (name === "phoneNumber" || name === "country") {
        if (newData.phoneNumber && newData.country) {
          const isValid = validatePhoneNumber(newData.phoneNumber, newData.country);
          if (newData.phoneNumber.trim() && !isValid) {
            setPhoneError("Please enter a valid phone number for the selected country");
          } else {
            setPhoneError("");
          }
        } else {
          setPhoneError("");
        }
      }
      
      return newData;
    });
  };

  const handleOAuthSignUp = async (provider: "google" | "apple" | "github") => {
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
      }
    } catch (error) {
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
  const passwordsMatch =
    formData.password === formData.confirmPassword &&
    formData.confirmPassword !== "";

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      alert("Please create a stronger password");
      return;
    }

    if (!passwordsMatch) {
      alert("Passwords do not match");
      return;
    }

    // Validate phone number
    if (formData.phoneNumber && formData.country) {
      const isValid = validatePhoneNumber(formData.phoneNumber, formData.country);
      if (!isValid) {
        setPhoneError("Please enter a valid phone number for the selected country");
        return;
      }
    }

    if (phoneError) {
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (error) {
        console.error("Sign up error:", error.message);
        alert(error.message || "Failed to create account. Please try again.");
        setIsLoading(false);
      } else if (data?.user) {
        // Store email in localStorage for verify-email page
        localStorage.setItem("pendingVerificationEmail", formData.email);
        // Success - redirect to verify email page with email as query param
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      }
    } catch (error) {
      console.error("Sign up error:", error);
      alert("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  if (user) {
    return <Loading size="lg" className="min-h-screen bg-gray-50" />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile Layout - Centered Dark Design */}
      <div className="lg:hidden w-full min-h-screen bg-[#f3f3f3f3] flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 py-8">
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
            {/* Google Sign Up Button */}
            <button
              type="button"
              onClick={() => handleOAuthSignUp("google")}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 py-3.5 px-4 rounded-xl hover:bg-white/5 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium lg:bg-white lg:text-gray-900 lg:hover:bg-gray-50 lg:shadow-sm lg:hover:shadow-md"
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
                <span className="px-4 bg-[#2C2C2C] text-white/60 lg:bg-[#091506f3] lg:text-white/50 lg:font-medium">
                  OR
                </span>
              </div>
            </div>

            {/* Email Form */}
            <form
              onSubmit={handleEmailSignUp}
              className="space-y-4 lg:space-y-5"
            >
              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="First name"
                  className="w-full px-4 py-3.5 placeholder:text-white   bg-[#1A1A1A] border border-white/10 rounded-xl text-white  focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all duration-200 lg:bg-white/5 lg:backdrop-blur-sm lg:placeholder:text-white/40 lg:focus:ring-white/30 lg:focus:border-white/30 lg:hover:border-white/15"
                  required
                />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last name"
                  className="w-full px-4 py-3.5 bg-[#1A1A1A] border border-white/10 rounded-xl text-white placeholder:text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all duration-200 lg:bg-white/5 lg:backdrop-blur-sm lg:placeholder:text-white/40 lg:focus:ring-white/30 lg:focus:border-white/30 lg:hover:border-white/15"
                  required
                />
              </div>

              {/* Email */}
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="w-full px-4 py-3.5 bg-[#1A1A1A] border border-white/10 rounded-xl text-white placeholder:text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all duration-200 lg:bg-white/5 lg:backdrop-blur-sm lg:placeholder:text-white/40 lg:focus:ring-white/30 lg:focus:border-white/30 lg:hover:border-white/15"
                required
              />

              {/* Country */}
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full px-4 py-3.5 bg-[#1A1A1A] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all duration-200 appearance-none lg:bg-white/5 lg:backdrop-blur-sm lg:focus:ring-white/30 lg:focus:border-white/30 lg:hover:border-white/15"
                required
              >
                <option value="" className="bg-[#1A1A1A] lg:bg-[#091506f3]">
                  Select Country
                </option>
                {countries.map((country) => (
                <option
                    key={country.value}
                    value={country.value}
                  className="bg-[#1A1A1A] lg:bg-[#091506f3]"
                >
                    {country.label}
                </option>
                ))}
              </select>

              {/* Phone Number */}
              <div>
              <div className="flex">
                <div className="flex items-center px-3 border border-r-0 border-white/10 rounded-l-xl bg-[#1A1A1A] text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all duration-200 lg:bg-white/5 lg:backdrop-blur-sm lg:placeholder:text-white/40 lg:focus:ring-white/30 lg:focus:border-white/30 lg:hover:border-white/15">
                    <span className="text-sm">{currentCountryCode.flag}</span>
                    <span className="ml-1 text-sm">{currentCountryCode.code}</span>
                </div>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="000 000 000"
                    className={`flex-1 px-4 py-3.5 bg-[#1A1A1A] border rounded-r-xl text-white placeholder:text-white focus:outline-none focus:ring-2 transition-all duration-200 lg:bg-white/5 lg:backdrop-blur-sm lg:placeholder:text-white/40 lg:focus:ring-white/30 lg:focus:border-white/30 lg:hover:border-white/15 ${
                      phoneError
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-white/10 focus:ring-white/20 focus:border-white/20"
                    }`}
                  required
                />
                </div>
                {phoneError && (
                  <p className="mt-1 text-xs text-red-400">{phoneError}</p>
                )}
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a strong password"
                  className={`w-full px-4 py-3.5 pr-12 bg-[#1A1A1A] border rounded-xl text-white placeholder:text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all duration-200 lg:bg-white/5 lg:backdrop-blur-sm lg:placeholder:text-white/40 lg:focus:ring-white/30 lg:focus:border-white/30 lg:hover:border-white/15 ${
                    formData.password && !isPasswordValid
                      ? "border-red-500/50"
                      : "border-white/10"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:opacity-80 transition-opacity"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5 text-white"
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
                      className="w-5 h-5 text-white"
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
              {formData.password && !isPasswordValid && (
                <p className="text-xs text-red-400">
                  Password must be 8+ characters with uppercase, lowercase,
                  number, and symbol
                </p>
              )}

              {/* Confirm Password */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm password"
                  className={`w-full px-4 py-3.5 pr-12 bg-[#1A1A1A] border rounded-xl text-white placeholder:text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all duration-200 lg:bg-white/5 lg:backdrop-blur-sm lg:placeholder:text-white/40 lg:focus:ring-white/30 lg:focus:border-white/30 lg:hover:border-white/15 ${
                    formData.confirmPassword && !passwordsMatch
                      ? "border-red-500/50"
                      : passwordsMatch
                      ? "border-green-500/50"
                      : "border-white/10"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:opacity-80 transition-opacity"
                >
                  {showConfirmPassword ? (
                    <svg
                      className="w-5 h-5 text-white"
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
                      className="w-5 h-5 text-white"
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
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-400">Passwords do not match</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !isPasswordValid || !passwordsMatch}
                className={`w-full py-3.5 px-4 rounded-xl font-medium transition-all duration-200 ${
                  isLoading || !isPasswordValid || !passwordsMatch
                    ? "bg-white/20 text-white/50 cursor-not-allowed"
                    : "bg-white text-gray-900 hover:bg-gray-50 active:scale-[0.98] shadow-sm hover:shadow-md"
                }`}
              >
                {isLoading ? "Creating Account..." : "Continue with email"}
              </button>
            </form>

            {/* Sign In Link */}
            <div className="pt-2 border-t border-white/10">
              <p className="text-center text-sm text-white/60">
                Already have an account?{" "}
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
          <p className="text-xs text-white/50 text-center lg:text-black/50">
            By continuing, you acknowledge AgriPath&apos;s{" "}
            <a
              href="/legal?tab=privacy"
              className="text-white/70 hover:text-white underline underline-offset-2 lg:text-black/70 lg:hover:text-black"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>

      {/* Desktop Layout - Left side with form (2/3 width) */}
      <div className="hidden lg:flex lg:w-2/3 bg-[#f3f3f3f3] items-center justify-center p-8 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-lg space-y-8 py-8">
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
            {/* Google Sign Up Button */}
            <button
              type="button"
              onClick={() => handleOAuthSignUp("google")}
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
            <form onSubmit={handleEmailSignUp} className="space-y-5">
              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="First name"
                  className="w-full px-4 py-3.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-200 hover:border-white/15"
                  required
                />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last name"
                  className="w-full px-4 py-3.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-200 hover:border-white/15"
                  required
                />
              </div>

              {/* Email */}
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="w-full px-4 py-3.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-200 hover:border-white/15"
                required
              />

              {/* Country */}
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full px-4 py-3.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-200 hover:border-white/15 appearance-none"
                required
              >
                <option value="" className="bg-[#091506f3]">
                  Select Country
                </option>
                {countries.map((country) => (
                  <option
                    key={country.value}
                    value={country.value}
                    className="bg-[#091506f3]"
                  >
                    {country.label}
                </option>
                ))}
              </select>

              {/* Phone Number */}
              <div>
              <div className="flex">
                <div className="flex items-center px-3 border border-r-0 border-white/10 rounded-l-xl bg-white/5 backdrop-blur-sm text-white/80">
                    <span className="text-sm">{currentCountryCode.flag}</span>
                    <span className="ml-1 text-sm">{currentCountryCode.code}</span>
                </div>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="000 000 000"
                    className={`flex-1 px-4 py-3.5 bg-white/5 backdrop-blur-sm border rounded-r-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 transition-all duration-200 hover:border-white/15 ${
                      phoneError
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-white/10 focus:ring-white/30 focus:border-white/30"
                    }`}
                  required
                />
                </div>
                {phoneError && (
                  <p className="mt-1 text-xs text-red-400">{phoneError}</p>
                )}
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a strong password"
                  className={`w-full px-4 py-3.5 pr-12 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-200 hover:border-white/15 ${
                    formData.password && !isPasswordValid
                      ? "border-red-500/50"
                      : "border-white/10"
                  }`}
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
              {formData.password && !isPasswordValid && (
                <p className="text-xs text-red-400">
                  Password must be 8+ characters with uppercase, lowercase,
                  number, and symbol
                </p>
              )}

              {/* Confirm Password */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm password"
                  className={`w-full px-4 py-3.5 pr-12 bg-white/5 backdrop-blur-sm border rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-200 hover:border-white/15 ${
                    formData.confirmPassword && !passwordsMatch
                      ? "border-red-500/50"
                      : passwordsMatch
                      ? "border-green-500/50"
                      : "border-white/10"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:opacity-80 transition-opacity"
                >
                  {showConfirmPassword ? (
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
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-400">Passwords do not match</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !isPasswordValid || !passwordsMatch}
                className={`w-full py-3.5 px-4 rounded-xl font-medium transition-all duration-200 ${
                  isLoading || !isPasswordValid || !passwordsMatch
                    ? "bg-white/20 text-white/50 cursor-not-allowed"
                    : "bg-white text-gray-900 hover:bg-gray-50 active:scale-[0.98] shadow-sm hover:shadow-md"
                }`}
              >
                {isLoading ? "Creating Account..." : "Continue with email"}
              </button>
            </form>

            {/* Sign In Link */}
            <div className="pt-2 border-t border-white/10">
              <p className="text-center text-sm text-white/60">
                Already have an account?{" "}
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

      {/* Right side - Dark background with image (3/4 width) */}
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

export default SignupPage;
