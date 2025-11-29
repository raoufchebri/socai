import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.devographics.com',
      },
      {
        protocol: 'https',
        hostname: 'devographics.github.io',
      },
    ],
  },
};

export default nextConfig;
