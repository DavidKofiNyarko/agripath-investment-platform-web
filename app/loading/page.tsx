"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import Loading from "@/components/ui/loading";

const LoadingPage = () => {
  const router = useRouter();
  const { user, loading } = useUser();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/signin");
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

      {/* Unified Loading Component */}
      <div className="relative z-10">
        <Loading size="lg" className="text-white" />
      </div>
    </div>
  );
};

export default LoadingPage;
