const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  
  // Output configuration for deployment
  output: 'standalone',
  
  // Trailing slash configuration
  trailingSlash: false,
  
  // External packages for server components
  serverExternalPackages: ['firebase-admin'],
  
  // Image optimization settings
  images: {
    domains: ['via.placeholder.com', 'placeholder.com', 'firebasestorage.googleapis.com'],
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.googleapis.com',
      },
    ],
  },
  
  // Experimental features for better route handling
  experimental: {
    appDir: true,
    serverActions: {
      allowedOrigins: ['localhost:3000','learn.quietshelter.org','quietshelter.org'],
    },
  },
  
  // Headers for better caching, security, and routing
  async headers() {
    return [
      {
        source: '/:path*',
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
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  async redirects() {
    return [];
  },
  
  // Webpack configuration (only used when NOT using Turbopack)
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },

  // Turbopack configuration (used when running with --turbopack)
  turbo: {
    resolveAlias: {
      // Equivalent to webpack fallback for client-side
      fs: false,
      net: false,
      tls: false,
      underscore: 'lodash',
      mocha: 'mocha/browser-entry.js',
    },
    resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },
  
  // Page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Disable powered by header
  poweredByHeader: false,
};

module.exports = nextConfig;