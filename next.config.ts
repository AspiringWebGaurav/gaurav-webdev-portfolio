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

  // 🔇 Reduce development logging noise
  logging: {
    fetches: {
      fullUrl: false, // Don't log full URLs in development
    },
  },

  // 🔕 Webpack optimizations and warning suppressions
  webpack: (config: any, { dev, isServer }: any) => {
    // Suppress OpenTelemetry/Sentry instrumentation warnings
    config.ignoreWarnings = [
      // Suppress critical dependency warnings from OpenTelemetry instrumentation
      /Critical dependency: the request of a dependency is an expression/,
      
      // Specific OpenTelemetry modules that cause warnings
      /@opentelemetry\/instrumentation-connect/,
      /@opentelemetry\/instrumentation-express/,
      /@opentelemetry\/instrumentation-generic-pool/,
      /@opentelemetry\/instrumentation-hapi/,
      /@opentelemetry\/instrumentation-ioredis/,
      /@opentelemetry\/instrumentation-knex/,
      /@opentelemetry\/instrumentation-lru-memoizer/,
      /@opentelemetry\/instrumentation-mongoose/,
      /@opentelemetry\/instrumentation-mysql2/,
      /@opentelemetry\/instrumentation-redis-4/,
      /@opentelemetry\/instrumentation-undici/,
      
      // Sentry instrumentation warnings
      /@sentry\/node/,
      /@sentry\/nextjs/,
    ];

    // Improve module resolution for Firebase imports
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/lib/firebase$': require('path').resolve('./lib/firebase.ts'),
      };
    }

    // Development-specific optimizations
    if (dev) {
      config.infrastructureLogging = {
        level: 'error', // Only show errors in development
      };
    }

    return config;
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
