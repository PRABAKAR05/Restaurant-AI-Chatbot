import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config, { isServer }) => {
    // Exclude Xenova from Vercel build to prevent 50MB limit errors
    if (process.env.VERCEL === "1") {
      config.resolve.alias['@xenova/transformers'] = false;
    }
    return config;
  },
  serverExternalPackages: ['pdf-parse', '@xenova/transformers', 'onnxruntime-node'],
};

export default nextConfig;
