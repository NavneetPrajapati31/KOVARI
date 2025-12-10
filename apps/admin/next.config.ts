import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["redis"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
