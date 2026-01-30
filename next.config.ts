import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable strict mode
  reactStrictMode: true,

  // Optimize images
  images: {
    unoptimized: true,
  },

  // Configure output directory
  distDir: '.next',

  // Disable source maps in production to reduce build size
  productionBrowserSourceMaps: false,

  // Enable compression
  compress: true,

  // Configure trailing slash behavior
  trailingSlash: false,

  // Configure redirects if needed
  async redirects() {
    return [
      // Add any necessary redirects here
    ];
  },

  // Configure headers for security
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
        ],
      },
    ];
  },
};

export default nextConfig;
