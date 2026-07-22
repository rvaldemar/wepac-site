import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma and the authorization guards so this tests the restore
// semantics (append-only: current content is snapshotted, selected
// version becomes current) rather than the auth layer.
const lifeMapFindUnique = vi.fn();
const lifeMapUpsert = vi.fn();
const lifeMapVersionFindUnique = vi.fn();
const lifeMapVersionCreate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    lifeMap: {
      findUnique: (...args: unknown[]) => lifeMapFindUnique(...args),
      upsert: (...args: unknown[]) => lifeMapUpsert(...args),
    },
    lifeMapVersion: {
      findUnique: (...args: unknown[]) => lifeMapVersionFindUnique(...args),
      create: (...args: unknown[]) => lifeMapVersionCreate(...args),
    },
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        lifeMap: {
          findUnique: (...args: unknown[]) => lifeMapFindUnique(...args),
          upsert: (...args: unknown[]) => lifeMapUpsert(...args),
        },
        lifeMapVersion: {
          create: (...args: unknown[]) => lifeMapVersionCreate(...args),
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
  requireUser: vi.fn(),
}));

import { restoreLifeMapVersion } from "@/lib/wepacker/actions/plan";

beforeEach(() => {
  lifeMapFindUnique.mockReset();
  lifeMapUpsert.mockReset();
  lifeMapVersionFindUnique.mockReset();
  lifeMapVersionCreate.mockReset();
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

describe("restoreLifeMapVersion", () => {
  it("enforces owner-only access via assertUserOwner", async () => {
    lifeMapVersionFindUnique.mockResolvedValue({
      id: "v1",
      userId: "user-1",
      whoIAm: "a",
      whereIAm: "b",
      whereIGo: "c",
      whyIDo: "d",
      commitments: "e",
    });
    lifeMapFindUnique.mockResolvedValue(null);
    lifeMapUpsert.mockResolvedValue({ id: "map-1" });

    await restoreLifeMapVersion("user-1", "v1");

    expect(assertUserOwnerMock).toHaveBeenCalledWith("user-1");
    expect(assertUserAccess).not.toHaveBeenCalled();
  });

  it("throws when the version does not exist", async () => {
    lifeMapVersionFindUnique.mockResolvedValue(null);

    await expect(restoreLifeMapVersion("user-1", "missing")).rejects.toThrow(
      "Versão não encontrada.",
    );
    expect(lifeMapUpsert).not.toHaveBeenCalled();
  });

  it("throws when the version belongs to a different user", async () => {
    lifeMapVersionFindUnique.mockResolvedValue({
      id: "v1",
      userId: "other-user",
      whoIAm: "",
      whereIAm: "",
      whereIGo: "",
      whyIDo: "",
      commitments: "",
    });

    await expect(restoreLifeMapVersion("user-1", "v1")).rejects.toThrow(
      "Versão não encontrada.",
    );
    expect(lifeMapUpsert).not.toHaveBeenCalled();
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
    lifeMapVersionFindUnique.mockResolvedValue(version);
    lifeMapFindUnique.mockResolvedValue(current);
    lifeMapUpsert.mockResolvedValue({ ...version, id: "map-1" });

    await restoreLifeMapVersion("user-1", "v1");

    expect(lifeMapVersionCreate).toHaveBeenCalledTimes(1);
    expect(lifeMapVersionCreate.mock.calls[0][0].data).toEqual({
      userId: "user-1",
      whoIAm: "current-who",
      whereIAm: "current-where",
      whereIGo: "current-go",
      whyIDo: "current-why",
      commitments: "current-commit",
    });

    expect(lifeMapUpsert).toHaveBeenCalledTimes(1);
    const upsertArg = lifeMapUpsert.mock.calls[0][0];
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
    lifeMapVersionFindUnique.mockResolvedValue(version);
    lifeMapFindUnique.mockResolvedValue(null);
    lifeMapUpsert.mockResolvedValue({ ...version, id: "map-1" });

    await restoreLifeMapVersion("user-1", "v1");

    expect(lifeMapVersionCreate).not.toHaveBeenCalled();
    expect(lifeMapUpsert).toHaveBeenCalledTimes(1);
  });
});
