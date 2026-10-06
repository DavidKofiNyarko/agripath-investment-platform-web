import type { NextConfig } from "next";

// Supabase Storage host used for image optimization.
// Priority: NEXT_PUBLIC_SUPABASE_STORAGE_HOST > host of NEXT_PUBLIC_SUPABASE_URL > production default
const storageHost =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_HOST ??
  (process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
    : "gbeqqboxlflpgehyqlld.supabase.co");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: storageHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
