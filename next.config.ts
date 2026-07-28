import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "prisma"],
  async redirects() {
    return [
      {
        source: "/academia",
        destination: "/academy",
        permanent: true,
      },
      {
        source: "/projetos/wessex",
        destination: "/wessex",
        permanent: true,
      },
      {
        source: "/projetos/arte-a-capela",
        destination: "/arte-a-capela",
        permanent: true,
      },
    ];
  },
  experimental: {
    serverActions: {
      // Bilheteira cover uploads validate up to 5MB; default Next limit is 1MB.
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
