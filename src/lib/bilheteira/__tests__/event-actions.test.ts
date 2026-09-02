import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  eventCreate: vi.fn(),
  eventFindUnique: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/db", () => ({
  prisma: {
    event: {
      create: mocks.eventCreate,
      findUnique: mocks.eventFindUnique,
    },
  },
}));

vi.mock("../session", () => ({
  getSessionAdmin: vi.fn().mockResolvedValue({ id: "admin-1" }),
}));

import { createEventAction } from "../event-actions";

describe("createEventAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.eventFindUnique.mockResolvedValue(null);
    mocks.eventCreate.mockResolvedValue({ id: "event-1" });
  });

  it("passes each tier Stripe Price ID to Prisma", async () => {
    const formData = new FormData();
    formData.set("title", "Evento");
    formData.set("description", "Descricao");
    formData.set("departmentId", "department-1");
    formData.set("venue", "Sala");
    formData.set("startsAt", "2026-04-18T21:00");
    formData.append("tierName", "Geral");
    formData.append("tierPrice", "15");
    formData.append("tierDescription", "Entrada geral");
    formData.append("tierStripePriceId", "price_123");

    await expect(createEventAction(formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.eventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tiers: {
            create: [
              expect.objectContaining({ stripePriceId: "price_123" }),
            ],
          },
        }),
      })
    );
  });
});
