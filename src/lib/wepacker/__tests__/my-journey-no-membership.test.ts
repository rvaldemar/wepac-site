import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePageUser = vi.fn();
const getMyContext = vi.fn();
const getEvaluations = vi.fn();
const computeAreaScores = vi.fn();
const getIndicatorScores = vi.fn();
const getStrategicMapScores = vi.fn();
const getLifePlan = vi.fn();
const getStrategicPlan = vi.fn();
const getMyTasks = vi.fn();
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

vi.mock("@/lib/wepacker/actions/evaluation", () => ({
  getEvaluations: (...args: unknown[]) => getEvaluations(...args),
  computeAreaScores: (...args: unknown[]) => computeAreaScores(...args),
  getIndicatorScores: (...args: unknown[]) => getIndicatorScores(...args),
}));

vi.mock("@/lib/wepacker/actions/plan", () => ({
  getStrategicMapScores: (...args: unknown[]) =>
    getStrategicMapScores(...args),
  getLifePlan: (...args: unknown[]) => getLifePlan(...args),
  getStrategicPlan: (...args: unknown[]) => getStrategicPlan(...args),
}));

vi.mock("@/lib/wepacker/actions/task", () => ({
  getMyTasks: (...args: unknown[]) => getMyTasks(...args),
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

describe("My Journey and Basecamp — person-level access", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    requirePageUser.mockResolvedValue({
      id: "person-without-membership",
      name: "Alexandre Florindo",
      email: "alex@example.test",
      role: "member",
      onboarded: true,
    });
    getMyContext.mockResolvedValue({
      user: { id: "person-without-membership", name: "Alexandre Florindo" },
      membership: null,
    });
    getEvaluations.mockResolvedValue([]);
    computeAreaScores.mockResolvedValue({});
    getIndicatorScores.mockResolvedValue({});
    getStrategicMapScores.mockResolvedValue([]);
    getLifePlan.mockResolvedValue(null);
    getStrategicPlan.mockResolvedValue(null);
    getNextSession.mockResolvedValue(null);
    getMySessions.mockResolvedValue([]);
    getMyConversations.mockResolvedValue([]);
    getTrails.mockResolvedValue([]);
  });

  it("loads My Journey data without requiring a legacy membership", async () => {
    const page = await DashboardPage();

    expect(requirePageUser).toHaveBeenCalledOnce();
    expect(getMyTasks).not.toHaveBeenCalled();
    expect(getEvaluations).toHaveBeenCalledWith("person-without-membership");
    expect(computeAreaScores).toHaveBeenCalledWith(
      "person-without-membership",
      "entry"
    );
    expect(getIndicatorScores).toHaveBeenCalledWith(
      "person-without-membership",
      "entry"
    );
    expect(getStrategicMapScores).toHaveBeenCalledWith(
      "person-without-membership"
    );
    expect(getNextSession).toHaveBeenCalledOnce();
    expect(getMySessions).toHaveBeenCalledOnce();
    expect(getMyConversations).toHaveBeenCalledOnce();
    expect(getTrails).toHaveBeenCalledWith("person-without-membership");
    expect(page).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({
          membership: null,
          pendingTasks: [],
          sessions: [],
          activeTrails: [],
        }),
      })
    );
  });

  it("loads Basecamp person-level artefacts without looking up a membership", async () => {
    const page = await BasecampPage();

    expect(requirePageUser).toHaveBeenCalledOnce();
    expect(getLifePlan).toHaveBeenCalledWith("person-without-membership");
    expect(getStrategicPlan).toHaveBeenCalledWith(
      "person-without-membership"
    );
    expect(getTrails).toHaveBeenCalledWith("person-without-membership");
    expect(getMyContext).not.toHaveBeenCalled();
    expect(page).toEqual(expect.objectContaining({ type: "div" }));
  });
});
