import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const NGINX_CONFIG_SURFACES = [
  "deploy/nginx.conf",
  "deploy/wepac-ssl-setup.sh",
  "deploy/DNS_SETUP_PROMPT.md",
  "deploy/server_setup.sh",
] as const;

const FORBIDDEN_LOG_VARIABLE =
  /\$(?:request|request_uri|uri|args|query_string|http_referer|http_authorization)\b/;

describe("WEPAC nginx log credential boundary", () => {
  it.each(NGINX_CONFIG_SURFACES)(
    "%s uses the target-free safe format in every server block",
    (path) => {
      const source = readFileSync(path, "utf8");
      const format = source.match(
        /log_format\s+wepac_safe\s+([\s\S]*?);/,
      )?.[1];
      expect(format, `${path} must define wepac_safe`).toBeDefined();
      expect(format).toContain("$request_method");
      expect(format).not.toMatch(FORBIDDEN_LOG_VARIABLE);

      const serverCount = source.match(/^\s*server\s*\{/gm)?.length ?? 0;
      const accessLogs = [
        ...source.matchAll(/^\s*access_log\s+([^;]+);/gm),
      ].map((match) => match[1].trim());

      expect(serverCount).toBeGreaterThan(0);
      expect(accessLogs).toHaveLength(serverCount);
      expect(accessLogs).toEqual(
        Array(serverCount).fill(
          "/var/log/nginx/wepac_access.log wepac_safe",
        ),
      );

      // Nginx error logs have no custom/redacted format and commonly include
      // the full request URI. This vhost has four bearer URL families, so it
      // suppresses its error stream and relies on safe access telemetry plus
      // the application journal.
      const errorLogs = [
        ...source.matchAll(/^\s*error_log\s+([^;]+);/gm),
      ].map((match) => match[1].trim());
      expect(errorLogs).toHaveLength(serverCount);
      expect(errorLogs).toEqual(Array(serverCount).fill("/dev/null crit"));
      expect(source).not.toContain("/var/log/nginx/wepac_error.log");

      const upstreamHosts = [
        ...source.matchAll(/^\s*proxy_set_header\s+Host\s+([^;]+);/gm),
      ].map((match) => match[1].trim());
      expect(upstreamHosts.length).toBeGreaterThan(0);
      for (const host of upstreamHosts) {
        expect(["wepac.pt", "${DOMAIN}"]).toContain(host);
      }
      expect(upstreamHosts).not.toContain("$host");
    },
  );
});
