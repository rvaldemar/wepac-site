import { describe, expect, it } from "vitest";
import { EMAIL_RE, maskEmail, normalizeEmail } from "../email-mask";

describe("maskEmail", () => {
  it("keeps only the first character of the local part", () => {
    expect(maskEmail("rui.santos@gmail.com")).toBe("r••••••••@gmail.com");
    expect(maskEmail("ab@x.pt")).toBe("a••@x.pt");
    expect(maskEmail("bad")).toBe("•••");
  });
});

describe("normalizeEmail / EMAIL_RE", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail("  Rui@Example.PT ")).toBe("rui@example.pt");
  });
  it("rejects obvious junk", () => {
    expect(EMAIL_RE.test("a@b")).toBe(false);
    expect(EMAIL_RE.test("a b@c.pt")).toBe(false);
    expect(EMAIL_RE.test("rui@wepac.pt")).toBe(true);
  });
});
