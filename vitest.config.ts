import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    server: {
      deps: {
        inline: ["next-auth"],
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "next/server": fileURLToPath(
        new URL("./node_modules/next/server.js", import.meta.url),
      ),
    },
  },
});
