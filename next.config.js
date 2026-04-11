/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  
  // Environment variables configuration
  env: {
    // NEXT_PUBLIC_BASE_URL is auto-detected:
    // - Development: http://localhost:3000 (or custom port)
    // - Production: uses VERCEL_URL or NEXT_PUBLIC_BASE_URL from env
    // No hardcoded URLs - fully dynamic
    ...(process.env.NEXT_PUBLIC_BASE_URL && {
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    }),
  },
  
  images: {
    // Next.js handles all images directly (no custom loader needed)
    // Firebase Storage images load with public read access (no auth needed)
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
    formats: ['image/webp'],
  },
  transpilePackages: ["next-themes"],

  // Optimize chunk loading and prevent errors
  experimental: {
    // Temporarily disable optimizePackageImports due to Turbopack issue
    // optimizePackageImports: ["lucide-react", "react-icons", "motion"],
    
    // Enable proxy for request interception (server-side ban detection)
    proxyTimeout: 30000,
  },
  
  // Production optimizations
  ...(process.env.NODE_ENV === "production" && {
    compress: true,
    poweredByHeader: false,
    generateEtags: true,
  }),

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
    ];
  },
};

export default nextConfig;
