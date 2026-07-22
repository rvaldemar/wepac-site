import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const userFindUnique = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: (...args: unknown[]) => auth(...args) }));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => userFindUnique(...args) },
  },
}));

import {
  getSessionUser,
  requireAuthenticatedUser,
  requireRole,
  requireUser,
} from "@/lib/wepacker/guards";

describe("WEPACKER guard authorization freshness", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.mockResolvedValue({
      user: {
        id: "person-1",
        name: "Stale JWT Name",
        email: "stale@example.test",
        role: "admin",
        onboarded: true,
        sessionVersion: 1,
      },
    });
  });

  it("rejects a still-valid JWT after its account has been deleted", async () => {
    userFindUnique.mockResolvedValue(null);

    await expect(getSessionUser()).resolves.toBeNull();
    await expect(requireUser()).rejects.toThrow("Não autenticado.");
    expect(userFindUnique).toHaveBeenCalledWith({
      where: { id: "person-1" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        onboarded: true,
        sessionVersion: true,
      },
    });
  });

  it("uses the current database role instead of a stale admin JWT", async () => {
    userFindUnique.mockResolvedValue({
      id: "person-1",
      name: "Current Person",
      email: "current@example.test",
      role: "member",
      onboarded: true,
      sessionVersion: 1,
    });

    await expect(requireRole(["admin"])).rejects.toThrow("Sem permissão.");
    await expect(requireRole(["member"])).resolves.toEqual({
      id: "person-1",
      name: "Current Person",
      email: "current@example.test",
      role: "member",
      onboarded: true,
      sessionVersion: 1,
    });
  });

  it("rejects protected capabilities after onboarding is revoked in the database", async () => {
    userFindUnique.mockResolvedValue({
      id: "person-1",
      name: "Current Person",
      email: "current@example.test",
      role: "member",
      onboarded: false,
      sessionVersion: 1,
    });

    await expect(requireUser()).rejects.toThrow("Onboarding incompleto.");
    await expect(requireRole(["member"])).rejects.toThrow(
      "Onboarding incompleto.",
    );
    await expect(requireAuthenticatedUser()).resolves.toMatchObject({
      id: "person-1",
      onboarded: false,
    });
  });

  it("does not query the database without an authenticated JWT identity", async () => {
    auth.mockResolvedValue(null);

    await expect(getSessionUser()).resolves.toBeNull();
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it("rejects a stolen JWT after a password change increments the session version", async () => {
    userFindUnique.mockResolvedValue({
      id: "person-1",
      name: "Current Person",
      email: "current@example.test",
      role: "member",
      onboarded: true,
      sessionVersion: 2,
    });

    await expect(getSessionUser()).resolves.toBeNull();
  });
});
