import { describe, expect, it } from "vitest";
import { postLoginPath, safeInternalCallbackUrl } from "@/lib/wepacker/post-login";

describe("post-login destination", () => {
  it("uses role-specific defaults without inferring relationship roles", () => {
    expect(postLoginPath("admin", null)).toBe("/wepacker/admin/users");
    expect(postLoginPath("member", null)).toBe("/wepacker/dashboard");
  });

  it("preserves an internal WEPACKER deep link for either account role", () => {
    const callback = "/wepacker/messages?conversation=one#latest";
    expect(postLoginPath("member", callback)).toBe(callback);
    expect(postLoginPath("admin", callback)).toBe(callback);
    expect(safeInternalCallbackUrl("/wepacker")).toBe("/wepacker");
  });

  it.each([
    "https://evil.example/wepacker/messages",
    "//evil.example/wepacker/messages",
    "/bilheteira",
    "/wepacker/login",
    "not-a-path",
  ])("rejects unsafe callback %s", (callback) => {
    expect(safeInternalCallbackUrl(callback)).toBeNull();
  });
});
