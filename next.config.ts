import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow mobile device access
  allowedDevOrigins: ['192.168.1.137'],
  
  // Optimize for browser compatibility
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  
  // Add headers for CORS and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
  
  // Ensure proper transpilation
  transpilePackages: ['@supabase/supabase-js'],
};

export default nextConfig;
