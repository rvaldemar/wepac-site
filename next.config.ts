import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "prisma"],
  experimental: {
    serverActions: {
      // Bilheteira cover uploads validate up to 5MB; default Next limit is 1MB.
      bodySizeLimit: "5mb",
    },
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
