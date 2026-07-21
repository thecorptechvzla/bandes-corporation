import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://localhost:3000", "http://localhost:3001", "http://controlmining.vercel.app"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
