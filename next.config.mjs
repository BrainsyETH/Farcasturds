/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix for 'fs' module not found in browser bundle when using server-side image processing libraries
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        // Exclude the 'fs' module from the client-side bundle
        fs: false, 
        // Add other Node.js modules if similar errors appear (e.g., 'path')
        // path: false,
      };
    }

    return config;
  },

  // Ensure images from our domain are optimized
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow external images (if any)
      },
      {
        protocol: 'http',
        hostname: 'localhost', // For local development
      },
    ],
  },
};

export default nextConfig;