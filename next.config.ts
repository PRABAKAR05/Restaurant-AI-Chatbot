import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Allow pdf-parse and transformers to work in server environment
  serverExternalPackages: ['pdf-parse', 'onnxruntime-node', '@xenova/transformers'],
};

export default nextConfig;
