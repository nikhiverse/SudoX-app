import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    reactCompiler: true,
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && config.cache && typeof config.cache === 'object') {
      config.cache.cacheDirectory = `/tmp/sudox-next-webpack/${isServer ? 'server' : 'client'}`;
    }
    return config;
  },
};

export default nextConfig;

