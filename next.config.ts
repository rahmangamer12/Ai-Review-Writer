import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Enable strict mode
  reactStrictMode: true,

  // Optimize images
  images: {
    // Add image formats for better optimization
    formats: ['image/avif', 'image/webp'],
    // Cache images for 1 year
    minimumCacheTTL: 31536000,
  },

  // Configure output directory
  distDir: '.next',

  // Disable source maps in production to reduce build size
  productionBrowserSourceMaps: false,

  // Enable compression
  compress: true,

  // Configure trailing slash behavior
  trailingSlash: false,

  // Experimental optimizations
  experimental: {
    // Optimize package imports for faster builds
    optimizePackageImports: [
      'framer-motion',
      'lucide-react',
      '@react-three/fiber',
      '@react-three/drei',
      'three',
      'zustand',
    ],
  },

  // Webpack optimization
  webpack: (config, { isServer }) => {
    // Optimize Three.js bundle size
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Use smaller Three.js build
        'three': 'three',
      };
    }

    // Split chunks for better caching
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          three: {
            test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
            name: 'three',
            chunks: 'all',
            priority: 20,
          },
          framer: {
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            name: 'framer',
            chunks: 'all',
            priority: 20,
          },
        },
      },
    };

    return config;
  },

  // Configure redirects if needed
  async redirects() {
    return [
      // Add any necessary redirects here
    ];
  },

  // Configure headers for security and PWA
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'no-referrer-when-downgrade',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // TODO: Replace 'unsafe-inline' with nonces/hashes once all third-party scripts support it.
              "script-src 'self' 'unsafe-inline' https://clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.longcat.chat https://*.supabase.co https://clerk.com https://*.clerk.accounts.dev https://api.lemonsqueezy.com https://*.sentry.io https://generativelanguage.googleapis.com wss://*.supabase.co",
              "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev",
              "worker-src 'self' blob:",
              "manifest-src 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              "plugin-types 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(self)',
          },
        ],
      },
      // PWA Service Worker
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      // PWA Manifest
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
    ];
  },
};

const uploadSentrySourceMaps = process.env.SENTRY_UPLOAD_SOURCE_MAPS === "true";

// Sentry wrapper. Source-map upload is opt-in to keep Vercel builds quiet unless
// SENTRY_AUTH_TOKEN is configured for a real Sentry release upload.
export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "ai-review-writer",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  sourcemaps: {
    disable: !uploadSentrySourceMaps,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
