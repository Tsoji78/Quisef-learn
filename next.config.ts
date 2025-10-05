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
      allowedOrigins: ['localhost:3000'],
    },
  },
  
  // Rewrites for handling client-side routing
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        {
          source: '/:courseId/learn',
          destination: '/:courseId/learn',
        },
        {
          source: '/courses/',
          destination: '/courses/',
        },
        {
          source: '/:courseId',
          destination: '/:courseId',
        },
      ],
      fallback: [],
    };
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
  
  // Redirects for common routing patterns
  async redirects() {
    return [
      // Add any specific redirects here if needed
      // Example:
      // {
      //   source: '/old-route',
      //   destination: '/new-route',
      //   permanent: true,
      // },
    ];
  },
  
  // Webpack configuration for better client-side bundle
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Fixes for client-side modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
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