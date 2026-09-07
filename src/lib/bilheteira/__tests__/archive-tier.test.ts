import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma so these tests exercise the archive/blocking logic only —
// never a real DB. The production incident this covers: ticketTier.delete()
// violating payments_tierId_fkey (RESTRICT) when a tier already has payments.
const tierUpdateMany = vi.fn();
const tierFindUnique = vi.fn();
const ticketCount = vi.fn();
const ticketCreate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    ticketTier: {
      updateMany: (...a: unknown[]) => tierUpdateMany(...a),
      findUnique: (...a: unknown[]) => tierFindUnique(...a),
      // delete intentionally absent: the archive path must never call it.
    },
    ticket: {
      count: (...a: unknown[]) => ticketCount(...a),
      create: (...a: unknown[]) => ticketCreate(...a),
    },
  },
}));

vi.mock("@/lib/bilheteira/session", () => ({
  getSessionAdmin: async () => ({ id: "admin-1", email: "admin@test" }),
}));

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

class RedirectSignal extends Error {
  constructor(public url: string) {
    super(`NEXT_REDIRECT:${url}`);
  }
}
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new RedirectSignal(url);
  },
}));

import {
  archiveTierAction,
  createManualTicketAction,
} from "@/lib/bilheteira/event-actions";

function formData(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

async function runExpectingRedirect(p: Promise<void>): Promise<string> {
  try {
    await p;
  } catch (e) {
    if (e instanceof RedirectSignal) return e.url;
    throw e;
  }
  throw new Error("expected a redirect");
}

beforeEach(() => {
  vi.clearAllMocks();
  tierUpdateMany.mockResolvedValue({ count: 1 });
});

describe("archiveTierAction", () => {
  it("archives by setting archivedAt scoped to tier+event, never deleting", async () => {
    const url = await runExpectingRedirect(
      archiveTierAction(formData({ id: "tier-1", eventId: "evt-1" }))
    );
    expect(url).toBe("/bilheteira/admin/events/evt-1");
    expect(tierUpdateMany).toHaveBeenCalledTimes(1);
    const arg = tierUpdateMany.mock.calls[0][0] as {
      where: { id: string; eventId: string; archivedAt: null };
      data: { archivedAt: Date };
    };
    expect(arg.where).toEqual({
      id: "tier-1",
      eventId: "evt-1",
      archivedAt: null,
    });
    expect(arg.data.archivedAt).toBeInstanceOf(Date);
  });

  it("is a no-op redirect when the tier is already archived (repeat submit)", async () => {
    tierUpdateMany.mockResolvedValue({ count: 0 });
    const url = await runExpectingRedirect(
      archiveTierAction(formData({ id: "tier-1", eventId: "evt-1" }))
    );
    expect(url).toBe("/bilheteira/admin/events/evt-1");
  });

  it("rejects a missing tier id without touching the DB", async () => {
    const url = await runExpectingRedirect(
      archiveTierAction(formData({ eventId: "evt-1" }))
    );
    expect(url).toContain("error=");
    expect(tierUpdateMany).not.toHaveBeenCalled();
  });

  it("cannot archive another event's tier (eventId pins the scope)", async () => {
    await runExpectingRedirect(
      archiveTierAction(formData({ id: "tier-1", eventId: "evt-OTHER" }))
    );
    const arg = tierUpdateMany.mock.calls[0][0] as {
      where: { eventId: string };
    };
    expect(arg.where.eventId).toBe("evt-OTHER");
  });
});

describe("createManualTicketAction vs archived tiers", () => {
  const manualForm = () =>
    formData({
      eventId: "evt-1",
      tierId: "tier-1",
      buyerName: "Ana",
      seats: "1",
    });

  it("refuses to issue a manual ticket on an archived tier", async () => {
    tierFindUnique.mockResolvedValue({
      id: "tier-1",
      priceCents: 1000,
      archivedAt: new Date("2026-09-07T09:00:00Z"),
    });
    const url = await runExpectingRedirect(
      createManualTicketAction(manualForm())
    );
    expect(url).toContain("error=");
    expect(ticketCreate).not.toHaveBeenCalled();
  });

  it("still issues manual tickets on active tiers", async () => {
    tierFindUnique.mockResolvedValue({
      id: "tier-1",
      priceCents: 1000,
      archivedAt: null,
    });
    ticketCreate.mockResolvedValue({ id: "tkt-1" });
    const url = await runExpectingRedirect(
      createManualTicketAction(manualForm())
    );
    expect(url).toBe("/bilheteira/admin/events/evt-1");
    expect(ticketCreate).toHaveBeenCalledTimes(1);
  });
});
