import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const userUpdate = vi.fn();

vi.mock("@/lib/wepacker/guards", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { update: (...args: unknown[]) => userUpdate(...args) },
  },
}));

import { updateMyProfile } from "@/lib/wepacker/actions/user";

describe("Profile Server Action input boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUser.mockResolvedValue({ id: "person-1", role: "member" });
    userUpdate.mockResolvedValue({ id: "person-1" });
  });

  it("derives ownership from the fresh actor and normalizes exact fields", async () => {
    await updateMyProfile({
      name: "  Alex Person  ",
      bio: "  Learning in public.  ",
      phone: "   ",
    });

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "person-1" },
      data: {
        name: "Alex Person",
        bio: "Learning in public.",
        phone: null,
      },
    });
  });

  it.each([
    [{ name: "Alex", userId: "person-2" }, "unsupported field"],
    [{ name: "Alex", role: "admin" }, "unsupported field"],
    [{ name: "Alex", bio: 42 }, "bio inválido"],
    [{ name: "Alex", phone: false }, "phone inválido"],
    [{ name: " " }, "Nome obrigatório"],
    [{ name: "x".repeat(201) }, "Nome não pode exceder"],
    [{ name: "Alex", bio: "x".repeat(10_001) }, "bio não pode exceder"],
    [{ name: "Alex", phone: "1".repeat(65) }, "phone não pode exceder"],
  ])("rejects hostile or oversized input %#", async (input, message) => {
    await expect(updateMyProfile(input)).rejects.toThrow(message as string);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("rejects custom prototypes, accessors and symbol keys", async () => {
    const custom = Object.create({ inherited: true });
    custom.name = "Alex";
    await expect(updateMyProfile(custom)).rejects.toThrow("invalid prototype");

    const accessor: Record<string, unknown> = {};
    Object.defineProperty(accessor, "name", { get: () => "Alex" });
    await expect(updateMyProfile(accessor)).rejects.toThrow("invalid field");

    await expect(
      updateMyProfile({ name: "Alex", [Symbol("owner")]: "person-2" }),
    ).rejects.toThrow("unsupported field");
    expect(userUpdate).not.toHaveBeenCalled();
  });
});
