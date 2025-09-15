import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ✅ Disable build blocking on type errors
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Ignore ESLint errors during builds (for Netlify/Vercel)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 🔒 Security: Remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'] // Keep only error and warn logs
    } : false,
  },

  // 🔒 Security: Disable development features in production
  ...(process.env.NODE_ENV === 'production' && {
    poweredByHeader: false,
    generateEtags: false,
  }),

  // ✅ Experimental features for Next.js 15
  experimental: {
    serverActions: {
      // Allow dynamic origins for Vercel deployment
      allowedOrigins: [
        "localhost:3000",
        "localhost:3001",
        // Add Vercel deployment URLs dynamically
        "*.vercel.app",
        // Add your custom domain if you have one
        // "yourdomain.com"
      ],
    },
  },

  // 🔒 Security headers
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
    ];
  },
};

export default nextConfig;
