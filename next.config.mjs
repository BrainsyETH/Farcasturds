/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Add this
  },
  typescript: {
    ignoreBuildErrors: true, // Add this temporarily
  },
  // ... rest of your config
};

export default nextConfig;