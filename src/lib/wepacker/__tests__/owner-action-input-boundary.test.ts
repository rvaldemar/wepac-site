import { beforeEach, describe, expect, it, vi } from "vitest";

const assertUserAccess = vi.fn();
const assertUserOwner = vi.fn();
const requireUser = vi.fn();

const lifeMapFindUnique = vi.fn();
const lifeMapUpsert = vi.fn();
const lifeMapVersionCreate = vi.fn();
const strategicPlanFindFirst = vi.fn();
const strategicPlanCreate = vi.fn();
const strategicPlanUpdate = vi.fn();
const goalFindFirst = vi.fn();
const goalCreate = vi.fn();
const goalUpdate = vi.fn();
const trailFindMany = vi.fn();
const trailFindFirst = vi.fn();
const trailCreate = vi.fn();
const trailUpdate = vi.fn();

const transactionClient = {
  lifeMap: {
    findUnique: (...args: unknown[]) => lifeMapFindUnique(...args),
    upsert: (...args: unknown[]) => lifeMapUpsert(...args),
  },
  lifeMapVersion: {
    create: (...args: unknown[]) => lifeMapVersionCreate(...args),
  },
};

vi.mock("@/lib/wepacker/guards", () => ({
  assertUserAccess: (...args: unknown[]) => assertUserAccess(...args),
  assertUserOwner: (...args: unknown[]) => assertUserOwner(...args),
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    lifeMap: {
      findUnique: (...args: unknown[]) => lifeMapFindUnique(...args),
    },
    lifeMapVersion: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    strategicPlan: {
      findFirst: (...args: unknown[]) => strategicPlanFindFirst(...args),
      create: (...args: unknown[]) => strategicPlanCreate(...args),
      update: (...args: unknown[]) => strategicPlanUpdate(...args),
    },
    goal: {
      findFirst: (...args: unknown[]) => goalFindFirst(...args),
      create: (...args: unknown[]) => goalCreate(...args),
      update: (...args: unknown[]) => goalUpdate(...args),
    },
    trail: {
      findMany: (...args: unknown[]) => trailFindMany(...args),
      findFirst: (...args: unknown[]) => trailFindFirst(...args),
      create: (...args: unknown[]) => trailCreate(...args),
      update: (...args: unknown[]) => trailUpdate(...args),
    },
    $transaction: (callback: (tx: typeof transactionClient) => unknown) =>
      callback(transactionClient),
  },
}));

import {
  createGoal,
  updateGoalStatus,
  upsertLifeMap,
  upsertStrategicPlan,
} from "@/lib/wepacker/actions/plan";
import {
  createTrail,
  updateTrail,
  updateTrailStatus,
} from "@/lib/wepacker/actions/trail";

const validLifeMap = {
  whoIAm: "Who",
  whereIAm: "Where",
  whereIGo: "Direction",
  whyIDo: "Why",
  commitments: "Commitments",
};

const validStrategicPlan = {
  quarter: "2026-Q3",
  longTermVision: "Vision",
  positioning: "Positioning",
  focusAreas: ["physical", "social"],
  quarterlyReflection: "Reflection",
};

const validTrail = {
  title: "Build consistency",
  purpose: "Purpose",
  whyItMatters: "Why",
  destination: "Destination",
  areas: ["physical", "character"],
};

describe("owner-bound Server Action input validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertUserAccess.mockResolvedValue({
      actor: { id: "person-1", role: "member" },
      ownerUserId: "person-1",
    });
    assertUserOwner.mockResolvedValue({
      actor: { id: "person-1", role: "member" },
      ownerUserId: "person-1",
    });
    requireUser.mockResolvedValue({ id: "person-1", role: "member" });
    lifeMapFindUnique.mockResolvedValue(null);
    lifeMapUpsert.mockResolvedValue({ id: "map-1" });
    strategicPlanFindFirst.mockResolvedValue(null);
    strategicPlanCreate.mockResolvedValue({ id: "plan-1" });
    strategicPlanUpdate.mockResolvedValue({ id: "plan-1" });
    goalFindFirst.mockResolvedValue({ strategicPlanId: "plan-1" });
    goalCreate.mockResolvedValue({ id: "goal-1" });
    goalUpdate.mockResolvedValue({ id: "goal-1" });
    trailFindMany.mockResolvedValue([]);
    trailFindFirst.mockResolvedValue({ id: "trail-1" });
    trailCreate.mockResolvedValue({ id: "trail-1" });
    trailUpdate.mockResolvedValue({ id: "trail-1" });
  });

  it("rejects extra owner fields and custom prototypes before a Life Map write", async () => {
    await expect(
      upsertLifeMap("person-1", {
        ...validLifeMap,
        userId: "person-2",
      }),
    ).rejects.toThrow("unsupported field");

    const inheritedOwner = Object.assign(
      Object.create({ userId: "person-2" }),
      validLifeMap,
    );
    await expect(upsertLifeMap("person-1", inheritedOwner)).rejects.toThrow(
      "invalid prototype",
    );

    expect(assertUserOwner).not.toHaveBeenCalled();
    expect(lifeMapUpsert).not.toHaveBeenCalled();
  });

  it("writes the authenticated owner explicitly and preserves Life Map fields only", async () => {
    await upsertLifeMap("person-1", validLifeMap);

    expect(lifeMapUpsert).toHaveBeenCalledWith({
      where: { userId: "person-1" },
      update: validLifeMap,
      create: { ...validLifeMap, userId: "person-1" },
    });
  });

  it("rejects oversized Life Map and Strategic Plan values", async () => {
    await expect(
      upsertLifeMap("person-1", {
        ...validLifeMap,
        whoIAm: "x".repeat(10_001),
      }),
    ).rejects.toThrow("cannot exceed 10000 characters");

    await expect(
      upsertStrategicPlan("person-1", {
        ...validStrategicPlan,
        quarter: "q".repeat(201),
      }),
    ).rejects.toThrow("cannot exceed 200 characters");
    expect(strategicPlanCreate).not.toHaveBeenCalled();
  });

  it("rejects Strategic Plan owner overrides and invalid Pillar enums", async () => {
    await expect(
      upsertStrategicPlan("person-1", {
        ...validStrategicPlan,
        userId: "person-2",
      }),
    ).rejects.toThrow("unsupported field");
    await expect(
      upsertStrategicPlan("person-1", {
        ...validStrategicPlan,
        focusAreas: ["arts"],
      }),
    ).rejects.toThrow("invalid Pillar");
    expect(strategicPlanCreate).not.toHaveBeenCalled();
  });

  it("writes Plan and Trail ownership only from the authenticated guard", async () => {
    await upsertStrategicPlan("person-1", validStrategicPlan);
    await createTrail("person-1", validTrail);

    expect(strategicPlanCreate).toHaveBeenCalledWith({
      data: { ...validStrategicPlan, userId: "person-1" },
    });
    expect(trailCreate).toHaveBeenCalledWith({
      data: { ...validTrail, userId: "person-1" },
    });
  });

  it("rejects invalid Goal scope, status, owner fields and context IDs", async () => {
    const validGoal = {
      strategicPlanId: "plan-1",
      scope: "quarterly",
      title: "Goal",
      deadline: "2026-12-31",
    };

    await expect(
      createGoal({ ...validGoal, scope: "lifetime" }),
    ).rejects.toThrow("Invalid Goal scope");
    await expect(
      createGoal({ ...validGoal, userId: "person-2" }),
    ).rejects.toThrow("unsupported field");
    await expect(
      createGoal({ ...validGoal, strategicPlanId: 123 }),
    ).rejects.toThrow("Strategic Plan ID must be a string");
    await expect(updateGoalStatus("goal-1", "paused")).rejects.toThrow(
      "Invalid Goal status",
    );
    expect(goalCreate).not.toHaveBeenCalled();
    expect(goalUpdate).not.toHaveBeenCalled();
  });

  it("resolves Goal reads and writes through owner-scoped relationships", async () => {
    strategicPlanFindFirst.mockResolvedValueOnce({ id: "plan-1" });
    await createGoal({
      strategicPlanId: "plan-1",
      scope: "quarterly",
      title: "  Goal  ",
      description: "  Detail  ",
      successCriteria: "  Done  ",
      deadline: "  2026-12-31  ",
    });
    await updateGoalStatus("goal-1", "completed");

    expect(strategicPlanFindFirst).toHaveBeenCalledWith({
      where: { id: "plan-1", userId: "person-1" },
      select: { id: true },
    });
    expect(goalCreate).toHaveBeenCalledWith({
      data: {
        strategicPlanId: "plan-1",
        scope: "quarterly",
        title: "Goal",
        description: "Detail",
        successCriteria: "Done",
        deadline: "2026-12-31",
      },
    });
    expect(goalFindFirst).toHaveBeenCalledWith({
      where: { id: "goal-1", strategicPlan: { userId: "person-1" } },
      select: { strategicPlanId: true },
    });
    expect(goalUpdate).toHaveBeenCalledWith({
      where: { id: "goal-1" },
      data: { status: "completed" },
    });
  });

  it("does not expose foreign Plan, Goal or Trail resources", async () => {
    strategicPlanFindFirst.mockResolvedValueOnce(null);
    await expect(
      createGoal({
        strategicPlanId: "foreign-plan",
        scope: "annual",
        title: "Goal",
        deadline: "2026-12-31",
      }),
    ).rejects.toThrow("Strategic Plan unavailable");

    goalFindFirst.mockResolvedValueOnce(null);
    await expect(updateGoalStatus("foreign-goal", "completed")).rejects.toThrow(
      "Goal unavailable",
    );

    trailFindFirst.mockResolvedValueOnce(null);
    await expect(
      updateTrail("foreign-trail", { title: "No transfer" }),
    ).rejects.toThrow("Trail unavailable");

    expect(goalCreate).not.toHaveBeenCalled();
    expect(goalUpdate).not.toHaveBeenCalled();
    expect(trailUpdate).not.toHaveBeenCalled();
  });

  it("rejects Trail owner overrides, oversized values and invalid enums", async () => {
    await expect(
      createTrail("person-1", { ...validTrail, userId: "person-2" }),
    ).rejects.toThrow("unsupported field");
    await expect(
      createTrail("person-1", {
        ...validTrail,
        title: "x".repeat(201),
      }),
    ).rejects.toThrow("cannot exceed 200 characters");
    await expect(
      createTrail("person-1", { ...validTrail, areas: ["arts"] }),
    ).rejects.toThrow("invalid Pillar");
    await expect(updateTrailStatus("trail-1", "archived")).rejects.toThrow(
      "Invalid Trail status",
    );
    expect(trailCreate).not.toHaveBeenCalled();
    expect(trailUpdate).not.toHaveBeenCalled();
  });

  it("sanitizes Trail updates and never accepts an ownership transfer", async () => {
    await expect(
      updateTrail("trail-1", {
        title: "Transferred",
        userId: "person-2",
      }),
    ).rejects.toThrow("unsupported field");

    await updateTrail("trail-1", {
      title: "  Updated Trail  ",
      areas: ["social"],
    });
    expect(trailUpdate).toHaveBeenCalledWith({
      where: { id: "trail-1" },
      data: { title: "Updated Trail", areas: ["social"] },
    });
    expect(trailFindFirst).toHaveBeenCalledWith({
      where: { id: "trail-1", userId: "person-1" },
      select: { id: true },
    });
  });
});
