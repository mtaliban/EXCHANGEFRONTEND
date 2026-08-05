/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_AUTH_API: process.env.NEXT_PUBLIC_AUTH_API || 'http://localhost:8001',
    NEXT_PUBLIC_USER_API: process.env.NEXT_PUBLIC_USER_API || 'http://localhost:8002',
    NEXT_PUBLIC_LOCATION_API: process.env.NEXT_PUBLIC_LOCATION_API || 'http://localhost:8003',
    NEXT_PUBLIC_MATCH_API: process.env.NEXT_PUBLIC_MATCH_API || 'http://localhost:8004',
  },
};

export default nextConfig;
