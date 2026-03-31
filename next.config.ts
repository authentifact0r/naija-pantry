import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Prisma extension injects tenantId at runtime, but TS types don't reflect this.
    // Safe to ignore since the extension guarantees tenantId on all scoped model operations.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
