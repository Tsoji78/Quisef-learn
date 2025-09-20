/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  trailingSlash: false,
  
  // Ensure experimental features are enabled for App Router
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
  
  // Image optimization settings
  images: {
    domains: ['via.placeholder.com', 'placeholder.com'],
    unoptimized: false,
  },
  
  // Environment variables that should be available in the browser
  env: {
    CUSTOM_KEY: 'value',
  },
  
  // Headers for better caching and security
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
        ],
      },
    ];
  },
};

module.exports = nextConfig;