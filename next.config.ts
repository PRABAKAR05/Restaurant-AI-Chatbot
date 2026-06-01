import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // pdf-parse and xenova need to run in Node.js server environment (not edge)
  serverExternalPackages: ['pdf-parse', '@xenova/transformers', 'onnxruntime-node'],
};

export default nextConfig;
