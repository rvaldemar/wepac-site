import { describe, expect, it, vi } from "vitest";
import { VisitorRateLimiter } from "@/lib/wessex/rate-limit";
import { createWepackerCredentialsAuthorizer } from "@/lib/wepacker/credentials-auth";

function request(ip: string) {
  return { headers: new Headers({ "x-real-ip": ip }) };
}

function makeAuthorizer() {
  const findUserByEmail = vi.fn();
  const comparePassword = vi.fn();
  const authorize = createWepackerCredentialsAuthorizer({
    findUserByEmail,
    comparePassword,
    ipLimiter: new VisitorRateLimiter(),
    accountLimiter: new VisitorRateLimiter(),
    accountKeySecret: () => "unit-test-rate-limit-secret",
  });
  return { authorize, findUserByEmail, comparePassword };
}

describe("WEPACKER credentials authentication boundary", () => {
  it("normalizes the email and returns only the authenticated identity", async () => {
    const { authorize, findUserByEmail, comparePassword } = makeAuthorizer();
    findUserByEmail.mockResolvedValue({
      id: "user-1",
      name: "Alex",
      email: "alex@example.test",
      passwordHash: "stored-hash",
      role: "member",
      onboarded: true,
      sessionVersion: 7,
    });
    comparePassword.mockReturnValue(true);

    await expect(
      authorize(
        { email: "  ALEX@EXAMPLE.TEST ", password: "correct-password" },
        request("192.0.2.1"),
      ),
    ).resolves.toEqual({
      id: "user-1",
      name: "Alex",
      email: "alex@example.test",
      role: "member",
      onboarded: true,
      sessionVersion: 7,
    });
    expect(findUserByEmail).toHaveBeenCalledWith("alex@example.test");
    expect(comparePassword).toHaveBeenCalledWith(
      "correct-password",
      "stored-hash",
    );
  });

  it("performs a dummy bcrypt comparison when the account does not exist", async () => {
    const { authorize, findUserByEmail, comparePassword } = makeAuthorizer();
    findUserByEmail.mockResolvedValue(null);
    comparePassword.mockReturnValue(false);

    await expect(
      authorize(
        { email: "missing@example.test", password: "candidate" },
        request("192.0.2.2"),
      ),
    ).resolves.toBeNull();
    expect(comparePassword).toHaveBeenCalledOnce();
    expect(comparePassword.mock.calls[0][1]).toMatch(/^\$2b\$10\$/);
  });

  it("never queries an invalid email and never accepts a password over 72 bytes", async () => {
    const { authorize, findUserByEmail, comparePassword } = makeAuthorizer();
    comparePassword.mockReturnValue(true);

    await expect(
      authorize(
        { email: "not-an-email", password: "é".repeat(37) },
        request("192.0.2.3"),
      ),
    ).resolves.toBeNull();
    expect(findUserByEmail).not.toHaveBeenCalled();
    expect(comparePassword).toHaveBeenCalledWith(
      "wepac-invalid-credential",
      expect.any(String),
    );
  });

  it("rate-limits both trusted-IP and account attempts before database work", async () => {
    const { authorize, findUserByEmail, comparePassword } = makeAuthorizer();
    findUserByEmail.mockResolvedValue(null);
    comparePassword.mockReturnValue(false);
    const input = { email: "target@example.test", password: "candidate" };

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await expect(
        authorize(input, request("198.51.100.9")),
      ).resolves.toBeNull();
    }
    await expect(
      authorize(input, request("198.51.100.9")),
    ).resolves.toBeNull();
    expect(findUserByEmail).toHaveBeenCalledTimes(10);
    expect(comparePassword).toHaveBeenCalledTimes(10);
  });
});
