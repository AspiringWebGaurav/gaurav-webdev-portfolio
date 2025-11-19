import type { NextConfig } from "next";
import { webpack } from "next/dist/compiled/webpack/webpack";

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
      hmrRefreshes: false, // Reduce HMR noise
    },
  },

  // Suppress development warnings
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },

  // Enterprise Webpack Configuration
  webpack: (config: any, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Development logging suppression
    if (dev) {
      config.infrastructureLogging = {
        level: 'error', // Only show errors
        debug: false,
      };
      // Suppress webpack performance warnings in development
      config.performance = {
        hints: false
      };
    }

    if (!dev && !isServer) {
      // Preserve Next.js default splitChunks but add optimizations
      const originalSplitChunks = config.optimization.splitChunks;
      
      config.optimization.splitChunks = {
        ...originalSplitChunks,
        cacheGroups: {
          ...originalSplitChunks.cacheGroups,
          // Optimize vendor chunks without breaking CSS
          vendors: {
            name: 'vendors',
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
            enforce: false // Don't force, let Next.js handle CSS
          },
          // Common chunks optimization
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: false
          }
        }
      };

      // Asset manifest generation
      config.plugins.push(
        new webpack.DefinePlugin({
          '__ASSET_MANIFEST__': JSON.stringify(generateAssetManifest(buildId))
        })
      );
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
        "www.gauravpatil.online",
        "gauravpatil.online"
      ],
    },
    // Optimize bundle analysis
    optimizeCss: false,
  },

  // Server-side external packages (moved from experimental)
  serverExternalPackages: ['sharp'],

  // Build output configuration
  output: 'standalone',
  
  // Asset optimization
  images: {
    formats: ['image/avif', 'image/webp']
  },

  // Production-grade headers with MIME type enforcement
  async headers() {
    return [
      // JS files
      {
        source: '/_next/static/chunks/:path*.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      },
      // CSS files
      {
        source: '/_next/static/css/:path*.css',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          }
        ]
      },
      // All other static assets
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          }
        ]
      },
      // Service Worker
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/'
          }
        ]
      },
      // Security headers for all pages
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

function generateAssetManifest(buildId: string) {
  return {
    buildId,
    criticalAssets: [
      `/_next/static/chunks/critical-${buildId}.js`,
      `/_next/static/css/critical-${buildId}.css`
    ],
    timestamp: Date.now()
  };
}

export default nextConfig;
