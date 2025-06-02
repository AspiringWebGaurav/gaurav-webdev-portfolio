import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ Disable build blocking on type errors
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Ignore ESLint errors during builds (for Netlify/Vercel)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Explicitly opt-out of Edge runtime for middleware
  // So we can use Node.js-only libraries like `firebase-admin`
  experimental: {
    serverActions: true, // Optional: if you're using App Router features
  },

  // ✅ Ensures all middleware run in Node.js (required for firebase-admin)
  // Not needed for App Router, but good to be explicit
  middleware: {
    runtime: "nodejs",
  },
};

export default withSentryConfig(
  nextConfig,
  {
    org: "gauravs-services",
    project: "javascript-nextjs",
    silent: !process.env.CI,
    widenClientFileUpload: true,
    disableLogger: true,
    automaticVercelMonitors: true,
    // tunnelRoute: "/monitoring", // Optional: for ad-block safe error tracking
  }
);
