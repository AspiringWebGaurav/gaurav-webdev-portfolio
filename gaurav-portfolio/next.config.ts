/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Disable linting during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
