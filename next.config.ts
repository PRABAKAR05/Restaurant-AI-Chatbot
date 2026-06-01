import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // pdf-parse must be here to prevent Vercel module load crash
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
