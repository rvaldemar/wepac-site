import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { deploymentBasePath } from "./src/lib/deployment-path";
import { SECURITY_HEADERS } from "./src/lib/security-headers";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: deploymentBasePath || undefined,
  serverExternalPackages: ["@prisma/client", "prisma"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...SECURITY_HEADERS,
          ...(deploymentBasePath
            ? [
                {
                  key: "X-Robots-Tag",
                  value: "noindex, nofollow, noarchive",
                },
              ]
            : []),
        ],
      },
    ];
  },
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
      {
        source: "/:locale(en|en-US|pt|pt-PT)/academia",
        destination: "/:locale/academy",
        permanent: true,
      },
      {
        source: "/:locale(en|en-US|pt|pt-PT)/projetos/wessex",
        destination: "/:locale/wessex",
        permanent: true,
      },
      {
        source: "/:locale(en|en-US|pt|pt-PT)/projetos/arte-a-capela",
        destination: "/:locale/arte-a-capela",
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

export default withNextIntl(nextConfig);
