import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint:{
    ignoreDuringBuilds: true,
  },
  
  // Exclude Supabase Edge Functions from Next.js compilation
  webpack: (config, { isServer }) => {
    // Ignore Supabase functions directory
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/supabase/functions/**'],
    };
    return config;
  },
  
  /* config options here */
  images: {
    domains: [
      'images.unsplash.com',
      'gbeqqboxlflpgehyqlld.supabase.co'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'gbeqqboxlflpgehyqlld.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
