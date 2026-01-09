/** @type {import('next').NextConfig} */
const nextConfig = {
  // Empty turbopack config to prevent warnings
  turbopack: {},
  
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  
  // Environment variables configuration
  env: process.env.NEXT_PUBLIC_BASE_URL ? {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  } : {},
  
  images: {
    // No custom loader - Next.js handles all images directly
    // Firebase Storage images load with public read access (no auth needed)
    // Local images (like /git.svg) use Next.js default loader
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Increase timeout and cache for Firebase Storage images
    minimumCacheTTL: 31536000, // Cache for 1 year
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Suppress upstream image errors (403s from Firebase Storage)
    unoptimized: false,
    formats: ['image/webp'],
  },
  transpilePackages: ["next-themes"],

  // Rewrites configuration
  rewrites: async () => [],

  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  compiler: {
    // Remove console.log in production (keep console.error and console.warn)
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Headers for better caching and security
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on"
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload"
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block"
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()"
          }
        ]
      }
    ];
  },
};

export default nextConfig;
