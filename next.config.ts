import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Standalone output for optimized Docker deployments
  // Bundles only the files needed to run, reducing image size significantly
  output: "standalone",
  experimental: {
    // Enable modern optimizations if needed
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
