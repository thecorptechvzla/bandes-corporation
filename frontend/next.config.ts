import type { NextConfig } from "next";

const NEXT_PUBLIC_API_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3001'
  : 'https://bandes-corporation-mgkl.vercel.app/';

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'https://bandes-corporation-mgkl.vercel.app',
  ],
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path((?!blob/).*)',
        destination: `${NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
