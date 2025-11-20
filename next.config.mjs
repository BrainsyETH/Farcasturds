/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            // Allow embedding in Farcaster frames and other contexts
            key: 'X-Frame-Options',
            value: 'ALLOWALL'
          }
        ],
      },
    ]
  },
};

export default nextConfig;