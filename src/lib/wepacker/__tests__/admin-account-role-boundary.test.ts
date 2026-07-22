import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const userFindMany = vi.fn();
const userFindUnique = vi.fn();
const userCreate = vi.fn();
const betaSignupUpdate = vi.fn();
const sendInviteEmail = vi.fn();

vi.mock("@/lib/wepacker/guards", () => ({
  requireAdmin: (...args: unknown[]) => requireAdmin(...args),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findMany: (...args: unknown[]) => userFindMany(...args),
      findUnique: (...args: unknown[]) => userFindUnique(...args),
      create: (...args: unknown[]) => userCreate(...args),
    },
    betaSignup: {
      update: (...args: unknown[]) => betaSignupUpdate(...args),
    },
  },
}));

vi.mock("@/lib/email", () => ({
  sendInviteEmail: (...args: unknown[]) => sendInviteEmail(...args),
}));

import { createInvite, getAllUsers } from "@/lib/wepacker/actions/admin";

describe("Admin account access boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("APP_URL", "https://wepac.example.test");
    requireAdmin.mockResolvedValue({ id: "admin-1", role: "admin" });
    userFindUnique.mockResolvedValue(null);
    userFindMany.mockResolvedValue([]);
    userCreate.mockResolvedValue({ id: "person-1" });
    sendInviteEmail.mockResolvedValue(undefined);
  });

  afterEach(() => vi.unstubAllEnvs());

  it.each(["member", "admin"] as const)(
    "allows the explicit %s account capability",
    async (role) => {
      await expect(
        createInvite({
          name: "Alex Person",
          email: "alex@example.test",
          role,
        }),
      ).resolves.toEqual(
        expect.objectContaining({
          userId: "person-1",
          inviteUrl: expect.stringContaining(
            "https://wepac.example.test/wepacker/invite/",
          ),
        }),
      );
      expect(userCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role }),
        }),
      );
    },
  );

  it.each(["mentor", "owner", ""])(
    "rejects untrusted serialized account access %j before any lookup",
    async (role) => {
      await expect(
        createInvite({
          name: "Alex Person",
          email: "alex@example.test",
          role,
        } as unknown as Parameters<typeof createInvite>[0]),
      ).rejects.toThrow("Invalid account access.");
      expect(requireAdmin).toHaveBeenCalledOnce();
      expect(userFindUnique).not.toHaveBeenCalled();
      expect(userCreate).not.toHaveBeenCalled();
    },
  );

  it("contains no global Mentor option, statistic, filter, or label", () => {
    const source = readFileSync(
      "src/app/wepacker/(platform)/admin/users/page-client.tsx",
      "utf8",
    );

    expect(source).not.toContain('<option value="mentor">');
    expect(source).not.toContain('label: "Mentors"');
    expect(source).not.toContain('["all", "member", "mentor", "admin"]');
    expect(source).not.toContain('mentor: "Mentor workspace"');
    expect(source).toContain('["all", "member", "admin"]');
  });

  it("never projects stored bearer credentials into the People list", async () => {
    userFindMany.mockResolvedValue([
      {
        id: "person-1",
        name: "Alex Person",
        email: "alex@example.test",
        role: "member",
        onboarded: false,
        phone: null,
        createdAt: new Date("2026-07-22T12:00:00.000Z"),
        inviteToken: "invite-bearer-must-not-cross-boundary",
        passwordHash: "password-hash-must-not-cross-boundary",
      },
    ]);

    await expect(getAllUsers()).resolves.toEqual([
      {
        id: "person-1",
        name: "Alex Person",
        email: "alex@example.test",
        role: "member",
        onboarded: false,
        phone: null,
        createdAt: "2026-07-22T12:00:00.000Z",
      },
    ]);

    const query = userFindMany.mock.calls[0]?.[0];
    expect(query.select).not.toHaveProperty("inviteToken");
    expect(query.select).not.toHaveProperty("passwordHash");

    const clientSource = readFileSync(
      "src/app/wepacker/(platform)/admin/users/page-client.tsx",
      "utf8",
    );
    expect(clientSource).not.toContain("user.inviteToken");
    expect(clientSource).not.toContain("inviteToken:");
  });
});
