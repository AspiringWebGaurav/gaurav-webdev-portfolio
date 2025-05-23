/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ Disable TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
