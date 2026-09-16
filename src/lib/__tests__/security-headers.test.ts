import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS } from "@/lib/security-headers";

const headers = Object.fromEntries(
  SECURITY_HEADERS.map(({ key, value }) => [key.toLowerCase(), value]),
);

describe("security header contract", () => {
  it("enforces transport and browser capability boundaries", () => {
    expect(headers["strict-transport-security"]).toBe(
      "max-age=31536000; includeSubDomains",
    );
    expect(headers["permissions-policy"]).toContain("camera=(self)");
    expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-xss-protection"]).toBeUndefined();
  });

  it("keeps CSP in report-only while covering framing and Stripe", () => {
    const csp = headers["content-security-policy-report-only"];

    expect(headers["content-security-policy"]).toBeUndefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("https://checkout.stripe.com");
  });
});
