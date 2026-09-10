import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: data: https://challenges.cloudflare.com https://*.cloudflare.com https://static.cloudflareinsights.com https://vercel.live https://*.vercel.live https://va.vercel-scripts.com https://*.vercel-scripts.com https://assets.vercel.com https://vercel.com https://*.vercel.com https://*.vercel.app https://switchyy.eu.cc https://*.eu.cc https://apis.google.com https://accounts.google.com https://*.firebaseapp.com https://*.googleapis.com edge-extension: chrome-extension: ms-browser-extension: moz-extension: safari-extension:",
      "script-src-elem 'self' 'unsafe-eval' 'unsafe-inline' blob: data: https://challenges.cloudflare.com https://*.cloudflare.com https://static.cloudflareinsights.com https://vercel.live https://*.vercel.live https://va.vercel-scripts.com https://*.vercel-scripts.com https://assets.vercel.com https://vercel.com https://*.vercel.com https://*.vercel.app https://switchyy.eu.cc https://*.eu.cc https://apis.google.com https://accounts.google.com https://*.firebaseapp.com https://*.googleapis.com edge-extension: chrome-extension: ms-browser-extension: moz-extension: safari-extension:",
      "style-src 'self' 'unsafe-inline' https://switchyy.eu.cc https://*.eu.cc https://fonts.googleapis.com https://vercel.live edge-extension: chrome-extension: ms-browser-extension: moz-extension: safari-extension:",
      "style-src-elem 'self' 'unsafe-inline' https://switchyy.eu.cc https://*.eu.cc https://fonts.googleapis.com https://vercel.live edge-extension: chrome-extension: ms-browser-extension: moz-extension: safari-extension:",
      "img-src 'self' blob: data: https: https://switchyy.eu.cc https://*.eu.cc https://*.googleusercontent.com https://vercel.live https://vercel.com https://assets.vercel.com edge-extension: chrome-extension: ms-browser-extension: moz-extension: safari-extension:",
      "font-src 'self' data: https://fonts.gstatic.com https://vercel.live https://assets.vercel.com",
      "connect-src 'self' blob: data: ws: wss: https://challenges.cloudflare.com https://*.cloudflare.com https://vercel.live https://*.vercel.live wss://ws-us3.pusher.com https://switchyy.eu.cc https://*.eu.cc https://vitals.vercel-insights.com https://va.vercel-scripts.com https://*.vercel-scripts.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com edge-extension: chrome-extension: ms-browser-extension: moz-extension: safari-extension:",
      "frame-src 'self' https://challenges.cloudflare.com https://accounts.google.com https://*.firebaseapp.com https://vercel.live https://*.vercel.live",
      "worker-src 'self' blob: https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  devIndicators: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  serverExternalPackages: ["firebase-admin", "otplib", "qrcode"],
  transpilePackages: ["three", "three-globe"],
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
  turbopack: {
    resolveAlias: {},
  },
  // Allow cross-origin dev access from local network IPs (e.g. mobile devices)
  // @ts-ignore - Next.js 15 allowedDevOrigins option
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "192.168.0.154:3000",
    "192.168.0.154",
  ],

  async redirects() {
    return [
      { source: "/about", destination: "/#about", permanent: true },
      { source: "/testimonials", destination: "/#testimonials", permanent: true },
      { source: "/experience", destination: "/#experience", permanent: true },
      { source: "/approach", destination: "/#approach", permanent: true },
      { source: "/contact", destination: "/#contact", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
