import { describe, expect, it } from "vitest";
import { VOUCHER_CODE_RE, generateVoucherCode, normalizeVoucherCode } from "../voucher-code";

describe("generateVoucherCode", () => {
  it("produces AC-XXXX-XXXX without ambiguous characters", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateVoucherCode();
      expect(code).toMatch(VOUCHER_CODE_RE);
      expect(code).not.toMatch(/[01IO]/);
    }
  });
  it("is deterministic given the random source", () => {
    expect(generateVoucherCode(() => 0)).toBe("AC-AAAA-AAAA");
  });
});

describe("normalizeVoucherCode", () => {
  it("accepts human variations", () => {
    expect(normalizeVoucherCode("ac 7k3m q9zt")).toBe("AC-7K3M-Q9ZT");
    expect(normalizeVoucherCode("AC7K3MQ9ZT")).toBe("AC-7K3M-Q9ZT");
    expect(normalizeVoucherCode("7k3m-q9zt")).toBe("AC-7K3M-Q9ZT");
    expect(normalizeVoucherCode(" AC-7K3M-Q9ZT ")).toBe("AC-7K3M-Q9ZT");
  });
  it("leaves garbage recognisably invalid", () => {
    expect(normalizeVoucherCode("hello")).not.toMatch(VOUCHER_CODE_RE);
  });
});
