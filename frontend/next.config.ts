import type { NextConfig } from "next";

function getBackendUrl(): string {
  if (process.env.NODE_ENV === 'development') {
    return process.env.BACKEND_URL || 'http://127.0.0.1:3001';
  }
  if (!process.env.BACKEND_URL) {
    throw new Error(
      'BACKEND_URL no está definido. '
      + 'Créalo en Vercel Dashboard → Settings → Environment Variables → '
      + 'BACKEND_URL = https://<tu-backend>.vercel.app  (sin /api)',
    );
  }
  return process.env.BACKEND_URL;
}

const BACKEND = getBackendUrl();

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
  ],
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path((?!blob/).*)',
        destination: `${BACKEND}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
