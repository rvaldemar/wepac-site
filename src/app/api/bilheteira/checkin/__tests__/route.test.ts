import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// Mock prisma so these tests exercise the check-in route's own guard logic,
// never a real DB.
const ticketFindUnique = vi.fn();
const ticketUpdate = vi.fn();
const ticketCheckLogCreate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    ticket: {
      findUnique: (...args: unknown[]) => ticketFindUnique(...args),
      update: (...args: unknown[]) => ticketUpdate(...args),
    },
    ticketCheckLog: {
      create: (...args: unknown[]) => ticketCheckLogCreate(...args),
    },
  },
}));

const getSessionAdmin = vi.fn();
vi.mock("@/lib/bilheteira/session", () => ({
  getSessionAdmin: (...args: unknown[]) => getSessionAdmin(...args),
}));

import { POST } from "@/app/api/bilheteira/checkin/route";

function req(body: unknown): NextRequest {
  return {
    json: async () => body,
  } as unknown as NextRequest;
}

const baseTicket = {
  id: "ticket-1",
  serial: 1,
  buyerName: "Ana",
  seats: 2,
  status: "pending",
  checkedInAt: null,
  tier: { name: "Geral" },
  event: { id: "evt-1", title: "Concerto" },
};

beforeEach(() => {
  ticketFindUnique.mockReset();
  ticketUpdate.mockReset();
  ticketCheckLogCreate.mockReset();
  getSessionAdmin.mockReset();
  getSessionAdmin.mockResolvedValue({ id: "admin-1", email: "admin@wepac.pt" });
});

describe("POST /api/bilheteira/checkin — cancelled tickets", () => {
  it("rejects check-in of a cancelled ticket with a clear PT-PT error and does not log an entry", async () => {
    ticketFindUnique.mockResolvedValue({ ...baseTicket, status: "cancelled" });

    const res = await POST(req({ ticketId: "ticket-1", action: "checkin" }));
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toBe("Bilhete cancelado — pagamento não concluído");
    expect(ticketUpdate).not.toHaveBeenCalled();
    expect(ticketCheckLogCreate).not.toHaveBeenCalled();
  });

  it("rejects check-out of a cancelled ticket the same way", async () => {
    ticketFindUnique.mockResolvedValue({ ...baseTicket, status: "cancelled" });

    const res = await POST(req({ ticketId: "ticket-1", action: "checkout" }));
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toBe("Bilhete cancelado — pagamento não concluído");
    expect(ticketUpdate).not.toHaveBeenCalled();
    expect(ticketCheckLogCreate).not.toHaveBeenCalled();
  });

  it("still allows check-in of a pending ticket", async () => {
    ticketFindUnique
      .mockResolvedValueOnce({ ...baseTicket, status: "pending" })
      .mockResolvedValueOnce({ ...baseTicket, status: "checked_in", checkLogs: [] });
    ticketUpdate.mockResolvedValue({ ...baseTicket, status: "checked_in" });
    ticketCheckLogCreate.mockResolvedValue({});

    const res = await POST(req({ ticketId: "ticket-1", action: "checkin" }));

    expect(res.status).toBe(200);
    expect(ticketUpdate).toHaveBeenCalledWith({
      where: { id: "ticket-1" },
      data: { checkedInAt: expect.any(Date), status: "checked_in" },
    });
    expect(ticketCheckLogCreate).toHaveBeenCalledTimes(1);
  });

  it("still allows check-out of an already checked_in ticket", async () => {
    ticketFindUnique
      .mockResolvedValueOnce({ ...baseTicket, status: "checked_in" })
      .mockResolvedValueOnce({ ...baseTicket, status: "pending", checkLogs: [] });
    ticketUpdate.mockResolvedValue({ ...baseTicket, status: "pending" });
    ticketCheckLogCreate.mockResolvedValue({});

    const res = await POST(req({ ticketId: "ticket-1", action: "checkout" }));

    expect(res.status).toBe(200);
    expect(ticketUpdate).toHaveBeenCalledWith({
      where: { id: "ticket-1" },
      data: { checkedInAt: null, status: "pending" },
    });
    expect(ticketCheckLogCreate).toHaveBeenCalledTimes(1);
  });
});
