import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma and the authorization guards so this tests the restore
// semantics (append-only: current content is snapshotted, selected
// version becomes current) rather than the auth layer.
const lifePlanFindUnique = vi.fn();
const lifePlanUpsert = vi.fn();
const lifePlanVersionFindUnique = vi.fn();
const lifePlanVersionCreate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    lifePlan: {
      findUnique: (...args: unknown[]) => lifePlanFindUnique(...args),
      upsert: (...args: unknown[]) => lifePlanUpsert(...args),
    },
    lifePlanVersion: {
      findUnique: (...args: unknown[]) => lifePlanVersionFindUnique(...args),
      create: (...args: unknown[]) => lifePlanVersionCreate(...args),
    },
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        lifePlan: {
          findUnique: (...args: unknown[]) => lifePlanFindUnique(...args),
          upsert: (...args: unknown[]) => lifePlanUpsert(...args),
        },
        lifePlanVersion: {
          create: (...args: unknown[]) => lifePlanVersionCreate(...args),
        },
      }),
  },
}));

const assertUserAccess = vi.fn();
const assertUserOwnerMock = vi.fn();

vi.mock("@/lib/wepacker/guards", () => ({
  assertUserAccess: (...args: unknown[]) => assertUserAccess(...args),
  assertUserOwner: (...args: unknown[]) => assertUserOwnerMock(...args),
  assertMentorOfUser: vi.fn(),
}));

import { restoreLifePlanVersion } from "@/lib/wepacker/actions/plan";

beforeEach(() => {
  lifePlanFindUnique.mockReset();
  lifePlanUpsert.mockReset();
  lifePlanVersionFindUnique.mockReset();
  lifePlanVersionCreate.mockReset();
  assertUserAccess.mockReset();
  assertUserAccess.mockResolvedValue({
    actor: { id: "user-1", role: "member" },
    ownerUserId: "user-1",
  });
  assertUserOwnerMock.mockReset();
  assertUserOwnerMock.mockResolvedValue({
    actor: { id: "user-1", role: "member" },
    ownerUserId: "user-1",
  });
});

describe("restoreLifePlanVersion", () => {
  it("enforces owner-only access via assertUserOwner", async () => {
    lifePlanVersionFindUnique.mockResolvedValue({
      id: "v1",
      userId: "user-1",
      whoIAm: "a",
      whereIAm: "b",
      whereIGo: "c",
      whyIDo: "d",
      commitments: "e",
    });
    lifePlanFindUnique.mockResolvedValue(null);
    lifePlanUpsert.mockResolvedValue({ id: "lp-1" });

    await restoreLifePlanVersion("user-1", "v1");

    expect(assertUserOwnerMock).toHaveBeenCalledWith("user-1");
    expect(assertUserAccess).not.toHaveBeenCalled();
  });

  it("throws when the version does not exist", async () => {
    lifePlanVersionFindUnique.mockResolvedValue(null);

    await expect(restoreLifePlanVersion("user-1", "missing")).rejects.toThrow(
      "Versão não encontrada."
    );
    expect(lifePlanUpsert).not.toHaveBeenCalled();
  });

  it("throws when the version belongs to a different user", async () => {
    lifePlanVersionFindUnique.mockResolvedValue({
      id: "v1",
      userId: "other-user",
      whoIAm: "",
      whereIAm: "",
      whereIGo: "",
      whyIDo: "",
      commitments: "",
    });

    await expect(restoreLifePlanVersion("user-1", "v1")).rejects.toThrow(
      "Versão não encontrada."
    );
    expect(lifePlanUpsert).not.toHaveBeenCalled();
  });

  it("snapshots the current life plan into history before applying the restored content", async () => {
    const version = {
      id: "v1",
      userId: "user-1",
      whoIAm: "old-who",
      whereIAm: "old-where",
      whereIGo: "old-go",
      whyIDo: "old-why",
      commitments: "old-commit",
    };
    const current = {
      userId: "user-1",
      whoIAm: "current-who",
      whereIAm: "current-where",
      whereIGo: "current-go",
      whyIDo: "current-why",
      commitments: "current-commit",
    };
    lifePlanVersionFindUnique.mockResolvedValue(version);
    lifePlanFindUnique.mockResolvedValue(current);
    lifePlanUpsert.mockResolvedValue({ ...version, id: "lp-1" });

    await restoreLifePlanVersion("user-1", "v1");

    expect(lifePlanVersionCreate).toHaveBeenCalledTimes(1);
    expect(lifePlanVersionCreate.mock.calls[0][0].data).toEqual({
      userId: "user-1",
      whoIAm: "current-who",
      whereIAm: "current-where",
      whereIGo: "current-go",
      whyIDo: "current-why",
      commitments: "current-commit",
    });

    expect(lifePlanUpsert).toHaveBeenCalledTimes(1);
    const upsertArg = lifePlanUpsert.mock.calls[0][0];
    expect(upsertArg.where).toEqual({ userId: "user-1" });
    expect(upsertArg.update).toEqual({
      whoIAm: "old-who",
      whereIAm: "old-where",
      whereIGo: "old-go",
      whyIDo: "old-why",
      commitments: "old-commit",
    });
  });

  it("does not snapshot anything when there is no current life plan yet", async () => {
    const version = {
      id: "v1",
      userId: "user-1",
      whoIAm: "old-who",
      whereIAm: "old-where",
      whereIGo: "old-go",
      whyIDo: "old-why",
      commitments: "old-commit",
    };
    lifePlanVersionFindUnique.mockResolvedValue(version);
    lifePlanFindUnique.mockResolvedValue(null);
    lifePlanUpsert.mockResolvedValue({ ...version, id: "lp-1" });

    await restoreLifePlanVersion("user-1", "v1");

    expect(lifePlanVersionCreate).not.toHaveBeenCalled();
    expect(lifePlanUpsert).toHaveBeenCalledTimes(1);
  });
});
