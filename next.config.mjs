/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  reactStrictMode: true,
  // KUONDOA output: 'standalone' — Vercel haihitaji hii. Standalone ni kwa
  // Docker/self-hosted deployments pekee. Kuweka hapa kunasababisha Vercel
  // WAF kuchanganyikiwa na ku-trigger Security Checkpoint ("We're verifying
  // your browser"). Vercel inatumia deployment model yake ya kipekee.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.16-171-23-21.sslip.io',
  },
  async headers() {
    return [
      {
        // Apply security headers kwa routes ZOTE
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
