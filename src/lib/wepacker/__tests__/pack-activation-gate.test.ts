import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma and the admin guard so these units test the gate logic
// itself, not the auth layer or DB round-trip.
const packCreate = vi.fn();
const packFindUnique = vi.fn();
const packUpdate = vi.fn();
const cohortFindUnique = vi.fn();
const cohortUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    pack: {
      create: (...args: unknown[]) => packCreate(...args),
      findUnique: (...args: unknown[]) => packFindUnique(...args),
      update: (...args: unknown[]) => packUpdate(...args),
    },
    cohort: {
      findUnique: (...args: unknown[]) => cohortFindUnique(...args),
      update: (...args: unknown[]) => cohortUpdate(...args),
    },
  },
}));

vi.mock("@/lib/wepacker/guards", () => ({
  requireAdmin: vi.fn(async () => ({ id: "admin-1", role: "admin" })),
  requireRole: vi.fn(async () => ({ id: "admin-1", role: "admin" })),
  requireUser: vi.fn(async () => ({ id: "admin-1", role: "admin" })),
  getMentoredCohortIds: vi.fn(async () => []),
}));

vi.mock("@/lib/email", () => ({
  sendInviteEmail: vi.fn(async () => undefined),
}));

import { createPack, updatePack, updateCohortStatus } from "@/lib/wepacker/actions/admin";
import { hasDedicatedIndicators } from "@/lib/wepacker/types";

beforeEach(() => {
  packCreate.mockReset();
  packFindUnique.mockReset();
  packUpdate.mockReset();
  cohortFindUnique.mockReset();
  cohortUpdate.mockReset();
});

describe("hasDedicatedIndicators", () => {
  it("is true for the artist pack", () => {
    expect(hasDedicatedIndicators("artist")).toBe(true);
  });

  it("is false for packs without a dedicated set", () => {
    expect(hasDedicatedIndicators("sport")).toBe(false);
    expect(hasDedicatedIndicators("anything-else")).toBe(false);
  });
});

describe("createPack", () => {
  it("always creates the pack with active: false, overriding the schema default", async () => {
    packCreate.mockResolvedValue({ id: "pack-new" });

    await createPack({ slug: "sport", name: "Pack Sport" });

    expect(packCreate).toHaveBeenCalledTimes(1);
    const arg = packCreate.mock.calls[0][0];
    expect(arg.data.active).toBe(false);
  });
});

describe("updatePack", () => {
  it("rejects activation for a pack without dedicated indicators, without writing to the DB", async () => {
    packFindUnique.mockResolvedValue({ slug: "sport" });

    await expect(updatePack("pack-1", { active: true })).rejects.toThrow(
      /indicadores de avaliação próprios/
    );
    expect(packUpdate).not.toHaveBeenCalled();
  });

  it("allows activation for the artist pack", async () => {
    packFindUnique.mockResolvedValue({ slug: "artist" });
    packUpdate.mockResolvedValue({ id: "pack-1", active: true });

    await updatePack("pack-1", { active: true });

    expect(packUpdate).toHaveBeenCalledTimes(1);
  });

  it("does not gate non-activating updates (name/tagline edits, deactivation)", async () => {
    packUpdate.mockResolvedValue({ id: "pack-1" });

    await updatePack("pack-1", { name: "Novo nome" });
    await updatePack("pack-1", { active: false });

    expect(packFindUnique).not.toHaveBeenCalled();
    expect(packUpdate).toHaveBeenCalledTimes(2);
  });
});

describe("updateCohortStatus", () => {
  it("rejects activating a cohort whose pack lacks dedicated indicators, without writing to the DB", async () => {
    cohortFindUnique.mockResolvedValue({ pack: { slug: "sport", name: "Pack Sport" } });

    await expect(updateCohortStatus("cohort-1", "active")).rejects.toThrow(
      /Pack Sport/
    );
    expect(cohortUpdate).not.toHaveBeenCalled();
  });

  it("allows activating a cohort of the artist pack", async () => {
    cohortFindUnique.mockResolvedValue({ pack: { slug: "artist", name: "Pack Artista" } });
    cohortUpdate.mockResolvedValue({ id: "cohort-1", status: "active" });

    await updateCohortStatus("cohort-1", "active");

    expect(cohortUpdate).toHaveBeenCalledTimes(1);
  });

  it("never gates transitions to draft/completed/archived", async () => {
    cohortUpdate.mockResolvedValue({ id: "cohort-1" });

    await updateCohortStatus("cohort-1", "draft");
    await updateCohortStatus("cohort-1", "completed");
    await updateCohortStatus("cohort-1", "archived");

    expect(cohortFindUnique).not.toHaveBeenCalled();
    expect(cohortUpdate).toHaveBeenCalledTimes(3);
  });
});
