import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cards.scryfall.io",
      },
      {
        protocol: "https",
        hostname: "**.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "c1.scryfall.com",
      },
      {
        protocol: "https",
        hostname: "c2.scryfall.com",
      },
    ],
  },
};

export default nextConfig;
