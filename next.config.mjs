/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_MQTT_WS: process.env.NEXT_PUBLIC_MQTT_WS || 'ws://localhost:9001',
  },
};

export default nextConfig;
