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
            // Allow embedding in Farcaster frames
            key: 'X-Frame-Options',
            value: 'ALLOWALL'
          },
          {
            // Required for Farcaster Mini App embedding
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.farcaster.xyz https://warpcast.com"
          }
        ],
      },
    ]
  },
};

export default nextConfig;