import { expect, test } from "@playwright/test";

const PUBLIC_PATHS = ["/society", "/en/society", "/wessex"];

for (const path of PUBLIC_PATHS) {
  test(`${path} returns the browser security contract`, async ({ request }) => {
    const response = await request.get(path);
    const headers = response.headers();

    expect(response.ok()).toBe(true);
    expect(headers["strict-transport-security"]).toContain("max-age=31536000");
    expect(headers["content-security-policy-report-only"]).toContain(
      "frame-ancestors 'self'",
    );
    expect(headers["content-security-policy"]).toBeUndefined();
    expect(headers["permissions-policy"]).toContain("camera=(self)");
    expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-xss-protection"]).toBeUndefined();
  });
}
