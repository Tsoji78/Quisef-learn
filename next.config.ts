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
  output: 'standalone', // Optimized for deployment platforms
  
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
    // Enable app directory features
    serverActions: {
      allowedOrigins: ['localhost:3000','learn.quietshelter.org','quietshelter.org'],
    },
  },
  
  // REMOVED PROBLEMATIC REWRITES - App Router handles routing automatically
  // The rewrites were interfering with /courses/[courseId]/* routes
  
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
        // Cache static assets
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
  
  // Redirects - Only add if you need to redirect OLD routes to NEW routes
  async redirects() {
    return [
      // If you had old routes that need redirecting, add them here
      // For example, if you previously had /:courseId and want to redirect to /courses/:courseId:
      // {
      //   source: '/:courseId((?!courses|api|_next|static).*)',
      //   destination: '/courses/:courseId',
      //   permanent: false,
      // },
    ];
  },
  
  // Webpack configuration for better client-side bundle
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Fixes for client-side modules
    if (!isServer) {
      // ensure resolve and fallback objects exist before merging
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
  
  // Page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Disable powered by header
  poweredByHeader: false,
};

module.exports = nextConfig;