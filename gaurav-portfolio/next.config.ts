/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["avatars.githubusercontent.com", "media.graphassets.com"],
  },
  eslint: {
    // Skip ESLint during builds (e.g., on Vercel)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip type errors during builds (useful while debugging)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
