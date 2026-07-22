import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePageUser = vi.fn();
const getMyContext = vi.fn();
const getMyActions = vi.fn();
const getLifeMap = vi.fn();
const getStrategicPlan = vi.fn();
const getNextSession = vi.fn();
const getMySessions = vi.fn();
const getMyConversations = vi.fn();
const getTrails = vi.fn();

vi.mock("@/lib/wepacker/page-guards", () => ({
  requirePageUser: (...args: unknown[]) => requirePageUser(...args),
}));

vi.mock("@/lib/wepacker/actions/user", () => ({
  getMyContext: (...args: unknown[]) => getMyContext(...args),
}));

vi.mock("@/lib/wepacker/actions/action", () => ({
  getMyActions: (...args: unknown[]) => getMyActions(...args),
}));

vi.mock("@/lib/wepacker/actions/plan", () => ({
  getLifeMap: (...args: unknown[]) => getLifeMap(...args),
  getStrategicPlan: (...args: unknown[]) => getStrategicPlan(...args),
}));

vi.mock("@/lib/wepacker/actions/session", () => ({
  getNextSession: (...args: unknown[]) => getNextSession(...args),
  getMySessions: (...args: unknown[]) => getMySessions(...args),
}));

vi.mock("@/lib/wepacker/actions/message", () => ({
  getMyConversations: (...args: unknown[]) => getMyConversations(...args),
}));

vi.mock("@/lib/wepacker/actions/trail", () => ({
  getTrails: (...args: unknown[]) => getTrails(...args),
}));

vi.mock("@/app/wepacker/(platform)/dashboard/page-client", () => ({
  default: vi.fn(() => null),
}));

import BasecampPage from "@/app/wepacker/(platform)/basecamp/page";
import DashboardPage from "@/app/wepacker/(platform)/dashboard/page";

describe("My Journey and Basecamp belong directly to the Person", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requirePageUser.mockResolvedValue({
      id: "person-1",
      name: "Alexandre Florindo",
      email: "alex@example.test",
      role: "member",
      onboarded: true,
    });
    getMyContext.mockResolvedValue({
      user: { id: "person-1", name: "Alexandre Florindo" },
      stage: null,
    });
    getMyActions.mockResolvedValue([]);
    getLifeMap.mockResolvedValue(null);
    getStrategicPlan.mockResolvedValue(null);
    getNextSession.mockResolvedValue(null);
    getMySessions.mockResolvedValue([]);
    getMyConversations.mockResolvedValue([]);
    getTrails.mockResolvedValue([]);
  });

  it("loads My Journey from Person-owned records", async () => {
    const page = await DashboardPage();

    expect(requirePageUser).toHaveBeenCalledOnce();
    expect(getMyActions).toHaveBeenCalledOnce();
    expect(getNextSession).toHaveBeenCalledOnce();
    expect(getMySessions).toHaveBeenCalledOnce();
    expect(getMyConversations).toHaveBeenCalledOnce();
    expect(getTrails).toHaveBeenCalledWith("person-1");
    expect(page).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({
          stage: null,
          activeActions: [],
          sessions: [],
          activeTrails: [],
        }),
      }),
    );
  });

  it("loads Basecamp from Person-owned Life Map, Goals and Trails", async () => {
    const page = await BasecampPage();

    expect(requirePageUser).toHaveBeenCalledOnce();
    expect(getLifeMap).toHaveBeenCalledWith("person-1");
    expect(getStrategicPlan).toHaveBeenCalledWith("person-1");
    expect(getTrails).toHaveBeenCalledWith("person-1");
    expect(page).toEqual(expect.objectContaining({ type: "div" }));
  });
});
