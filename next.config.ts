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
      "connect-src 'self' blob: data: ws: wss: https://challenges.cloudflare.com https://*.cloudflare.com https://vercel.live https://*.vercel.live wss://ws-us3.pusher.com https://switchyy.eu.cc https://*.eu.cc https://vitals.vercel-insights.com https://*.vercel-insights.com https://vercel-insights.com https://va.vercel-scripts.com https://*.vercel-scripts.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com edge-extension: chrome-extension: ms-browser-extension: moz-extension: safari-extension:",
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
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
    optimizePackageImports: ["react-icons", "lucide-react"],
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
  outputFileTracingExcludes: {
    "*": [
      "public/**",
      "node_modules/@playwright/**",
      "node_modules/playwright-core/**",
      "node_modules/@esbuild/**",
      "node_modules/typescript/**",
      "node_modules/@swc/**",
      "node_modules/terser/**",
      "node_modules/eslint/**",
      "node_modules/eslint-config-next/**",
      "node_modules/tailwindcss/**",
      "node_modules/autoprefixer/**",
      "node_modules/@types/**",
      "node_modules/three/**",
      "node_modules/three-globe/**",
      "node_modules/@react-three/**",
      "node_modules/@mediapipe/**",
      "node_modules/lottie-web/**",
      "node_modules/lottie-react/**",
      "node_modules/hls.js/**",
      "node_modules/framer-motion/**",
      "node_modules/motion/**",
      "node_modules/@img/sharp*/**",
      "node_modules/sharp/**",
      "tests/**",
      "test-results/**",
      "playwright-report/**",
      "scratch/**",
      ".git/**",
    ],
    "/api/**": [
      "node_modules/react-icons/**",
      "node_modules/lucide-react/**",
    ],
  },
  turbopack: {
    resolveAlias: {},
  },
  // Allow cross-origin dev access from local network IPs (e.g. mobile devices)
  // @ts-ignore - Next.js 15 allowedDevOrigins option
  allowedDevOrigins: [
    "localhost:3000",
    "apps.localhost:3000",
    "apps.localhost",
    "services.localhost:3000",
    "services.localhost",
    "cp.apps.localhost:3000",
    "cp.apps.localhost",
    "downex.apps.localhost:3000",
    "downex.apps.localhost",
    "sm.apps.localhost:3000",
    "sm.apps.localhost",
    "gpn.apps.localhost:3000",
    "gpn.apps.localhost",
    "resume.services.localhost:3000",
    "resume.services.localhost",
    "talk.services.localhost:3000",
    "talk.services.localhost",
    "contact.services.localhost:3000",
    "contact.services.localhost",
    "*.apps.localhost:3000",
    "*.apps.localhost",
    "*.services.localhost:3000",
    "*.services.localhost",
    "talk.localhost:3000",
    "resume.localhost:3000",
    "contact.localhost:3000",
    "self.localhost:3000",
    "downex.localhost:3000",
    "127.0.0.1:3000",
    "192.168.0.154:3000",
    "192.168.0.154",
  ],

  async redirects() {
    return [
      { source: "/about", destination: "/", permanent: true },
      { source: "/testimonials", destination: "/", permanent: true },
      { source: "/experience", destination: "/", permanent: true },
      { source: "/approach", destination: "/", permanent: true },
      { source: "/contact", destination: "/", permanent: true },
      // Case study short-slug aliases (Edge-level 308 redirects, 0 serverless invocations)
      { source: "/projects/send2me", destination: "/projects/send2me-p2p-file-transfer", permanent: true },
      { source: "/projects/switchyy", destination: "/projects/switchyy-mode-control", permanent: true },
      { source: "/projects/daretosend", destination: "/projects/daretosend-anonymous-feedback", permanent: true },
      { source: "/projects/xurl", destination: "/projects/xurl-smart-url-shortener", permanent: true },
      { source: "/projects/gpmas", destination: "/projects/gpmas-mail-automation", permanent: true },
      { source: "/projects/gmp", destination: "/projects/gmp-enterprise-portal", permanent: true },
      { source: "/projects/gpdrive", destination: "/projects/gpdrive-cloud-storage", permanent: true },
      { source: "/projects/myfit", destination: "/projects/myfit-fitness-tracker", permanent: true },
      { source: "/projects/gpnotes", destination: "/projects/gpnotes-encrypted-notes", permanent: true },
      { source: "/projects/bgmiid", destination: "/projects/bgmiid-gaming-identity", permanent: true },
      { source: "/projects/gauravwork", destination: "/projects/gauravwork-developer-workspace", permanent: true },
      { source: "/projects/gauravbuilds", destination: "/projects/gauravbuilds-artifacts-hub", permanent: true },
      { source: "/projects/gauravwatch", destination: "/projects/gauravwatch-precision-chronograph", permanent: true },
      { source: "/projects/connectgaurav", destination: "/projects/connectgaurav-developer-hub", permanent: true },
      { source: "/projects/deggy-guard-tour-system", destination: "/projects/deggy", permanent: true },
    ];
  },

  async headers() {
    if (process.env.NODE_ENV !== "production") {
      return [];
    }

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // 1-Year Immutable Caching for Static Media, Images, Fonts, 3D Assets & Manifests
        source: "/:all*(ico|png|svg|jpg|jpeg|gif|webp|avif|woff|woff2|ttf|otf|eot|pdf|json|webmanifest|glb|gltf|mp4|webm)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // 1-Year Immutable Caching for Hashed Next.js Static Bundles
        source: "/_next/static/:path*",
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
