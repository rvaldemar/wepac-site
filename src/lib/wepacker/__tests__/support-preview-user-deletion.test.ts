import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const txQueryRaw = vi.fn();
const txUserFindUnique = vi.fn();
const txUserCount = vi.fn();
const userDelete = vi.fn();
const anonymizeSupportPreviewForUser = vi.fn();
const tx = {
  $queryRaw: (...args: unknown[]) => txQueryRaw(...args),
  user: {
    findUnique: (...args: unknown[]) => txUserFindUnique(...args),
    count: (...args: unknown[]) => txUserCount(...args),
    delete: userDelete,
  },
};
const transaction = vi.fn(
  async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
);

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: (callback: (client: typeof tx) => Promise<unknown>) =>
      transaction(callback),
  },
}));

vi.mock("@/lib/wepacker/guards", () => ({
  requireAdmin: (...args: unknown[]) => requireAdmin(...args),
}));

vi.mock("@/lib/wepacker/support-preview-retention", () => ({
  anonymizeSupportPreviewForUser: (...args: unknown[]) =>
    anonymizeSupportPreviewForUser(...args),
}));

vi.mock("@/lib/email", () => ({ sendInviteEmail: vi.fn() }));

import { deleteUser } from "@/lib/wepacker/actions/admin";

describe("Admin Person deletion with Support Preview history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdmin.mockResolvedValue({ id: "admin-1", role: "admin" });
    txQueryRaw.mockResolvedValue([]);
    txUserFindUnique.mockImplementation(
      ({ where }: { where: { id: string } }) =>
        where.id === "admin-1" ? { role: "admin" } : { role: "member" },
    );
    txUserCount.mockResolvedValue(2);
    userDelete.mockResolvedValue({ id: "person-1" });
    anonymizeSupportPreviewForUser.mockResolvedValue({
      anonymizedEvents: 2,
      removedGrants: 1,
    });
  });

  it("anonymizes support references in the deletion transaction", async () => {
    await deleteUser("person-1");
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(txQueryRaw).toHaveBeenCalledOnce();
    expect(anonymizeSupportPreviewForUser).toHaveBeenCalledWith(tx, "person-1");
    expect(userDelete).toHaveBeenCalledWith({ where: { id: "person-1" } });
    expect(
      anonymizeSupportPreviewForUser.mock.invocationCallOrder[0],
    ).toBeLessThan(userDelete.mock.invocationCallOrder[0]);
  });

  it("fails atomically when anonymization fails", async () => {
    anonymizeSupportPreviewForUser.mockRejectedValue(
      new Error("retention maintenance denied"),
    );
    await expect(deleteUser("person-1")).rejects.toThrow(
      "retention maintenance denied",
    );
    expect(userDelete).not.toHaveBeenCalled();
  });

  it("still rejects deleting the current Admin", async () => {
    await expect(deleteUser("admin-1")).rejects.toThrow(
      "Não podes eliminar a tua própria conta",
    );
    expect(transaction).not.toHaveBeenCalled();
  });

  it("serializes and refuses deletion of the last remaining Admin", async () => {
    txUserFindUnique.mockResolvedValue({ role: "admin" });
    txUserCount.mockResolvedValue(1);

    await expect(deleteUser("admin-2")).rejects.toThrow(
      "Não é possível eliminar o último admin",
    );
    expect(txQueryRaw).toHaveBeenCalledOnce();
    expect(userDelete).not.toHaveBeenCalled();
  });

  it("rechecks the actor's current Admin capability under the lock", async () => {
    txUserFindUnique.mockResolvedValueOnce({ role: "member" });

    await expect(deleteUser("person-1")).rejects.toThrow("Sem permissão.");
    expect(userDelete).not.toHaveBeenCalled();
  });
});
