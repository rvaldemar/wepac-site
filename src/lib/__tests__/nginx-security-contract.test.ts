import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS } from "@/lib/security-headers";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const templates = [
  "deploy/nginx.conf",
  "deploy/wepac-ssl-setup.sh",
  "deploy/DNS_SETUP_PROMPT.md",
];

describe("nginx security contract", () => {
  it.each(templates)("keeps %s aligned with the application headers", async (path) => {
    const source = await readFile(`${root}/${path}`, "utf8");

    for (const { key, value } of SECURITY_HEADERS) {
      expect(source, `${path} is missing ${key}`).toContain(
        `add_header ${key} ${value.includes('"') ? `'${value}'` : `"${value}"`} always;`,
      );
    }
    expect(source).not.toContain("X-XSS-Protection");
  });

  it("keeps bearer credentials out of the deployable nginx logs", async () => {
    const source = await readFile(`${root}/deploy/nginx.conf`, "utf8");
    const logFormat = source.match(/log_format wepac_safe[\s\S]*?;/)?.[0] ?? "";

    expect(logFormat).not.toMatch(/\$(?:request|request_uri|args|http_referer|http_authorization)\b/);
    expect(source.match(/error_log \/dev\/null crit;/g)).toHaveLength(3);
    expect(source).toContain("proxy_set_header Host wepac.pt;");
  });
});
