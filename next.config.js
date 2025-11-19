/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  transpilePackages: ["next-themes"],

  // Optimize chunk loading and prevent errors
  experimental: {
    // Optimize package imports to reduce chunk size
    optimizePackageImports: ["lucide-react", "react-icons", "motion"],
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
