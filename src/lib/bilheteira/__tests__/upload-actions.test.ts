import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  findUnique: vi.fn(), updateMany: vi.fn(), mkdir: vi.fn(), writeFile: vi.fn(), unlink: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ prisma: { event: { findUnique: m.findUnique, updateMany: m.updateMany } } }));
vi.mock("../session", () => ({ getSessionAdmin: vi.fn().mockResolvedValue({ id: "synthetic-admin" }) }));
vi.mock("node:fs/promises", () => ({ mkdir: m.mkdir, writeFile: m.writeFile, unlink: m.unlink }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(url); } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { uploadEventCoverAction, removeEventCoverAction } from "../upload-actions";
import { getSessionAdmin } from "../session";

function form() {
  const f = new FormData();
  f.set("eventId", "synthetic-event");
  f.set("file", new File(["synthetic-image"], "B.png", { type: "image/png" }));
  return f;
}
describe("safe cover replacement", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getSessionAdmin).mockResolvedValue({ id: "synthetic-admin" } as Awaited<ReturnType<typeof getSessionAdmin>>);
    m.findUnique.mockResolvedValue({ id: "synthetic-event", slug: "fixture", coverImage: "/api/bilheteira/uploads/A.png" });
    m.updateMany.mockResolvedValue({ count: 1 });
    m.mkdir.mockResolvedValue(undefined);
    m.writeFile.mockResolvedValue(undefined);
    m.unlink.mockResolvedValue(undefined);
  });
  it("replaces A with B while preserving A for existing emails", async () => {
    await expect(uploadEventCoverAction(form())).rejects.toThrow("saved=1");
    expect(m.writeFile).toHaveBeenCalledOnce();
    expect(m.updateMany).toHaveBeenCalledWith({
      where: { id: "synthetic-event", coverImage: "/api/bilheteira/uploads/A.png" },
      data: { coverImage: expect.stringMatching(/^\/api\/bilheteira\/uploads\/synthetic-event-.+\.png$/) },
    });
    expect(m.unlink).not.toHaveBeenCalled();
    expect(m.writeFile.mock.invocationCallOrder[0]).toBeLessThan(m.updateMany.mock.invocationCallOrder[0]);
  });
  it("retains A if database persistence fails; cleans only B", async () => {
    m.updateMany.mockRejectedValue(new Error("synthetic database failure"));
    await expect(uploadEventCoverAction(form())).rejects.toThrow("error=");
    expect(m.unlink).toHaveBeenCalledWith(expect.stringMatching(/synthetic-event-.+\.png$/));
    expect(m.unlink).not.toHaveBeenCalledWith(expect.stringContaining("A.png"));
  });
  it("rejects a concurrent replacement without deleting another event asset", async () => {
    m.updateMany.mockResolvedValue({ count: 0 });
    await expect(uploadEventCoverAction(form())).rejects.toThrow("error=");
    expect(m.unlink).toHaveBeenCalledTimes(1);
    expect(m.unlink).toHaveBeenCalledWith(expect.stringContaining("synthetic-event-"));
  });
  it("does not touch the database or A when writing B fails", async () => {
    m.writeFile.mockRejectedValue(new Error("synthetic disk failure"));
    await expect(uploadEventCoverAction(form())).rejects.toThrow("synthetic disk failure");
    expect(m.updateMany).not.toHaveBeenCalled();
    expect(m.unlink).not.toHaveBeenCalled();
  });
  it("requires explicit removal confirmation", async () => {
    await expect(removeEventCoverAction(form())).rejects.toThrow("error=");
    expect(m.updateMany).not.toHaveBeenCalled();
    expect(m.unlink).not.toHaveBeenCalled();
  });
  it("confirmed removal detaches but retains the file", async () => {
    const f = form(); f.set("confirmRemove", "yes");
    await expect(removeEventCoverAction(f)).rejects.toThrow("saved=1");
    expect(m.updateMany).toHaveBeenCalledWith({ where: { id: "synthetic-event", coverImage: "/api/bilheteira/uploads/A.png" }, data: { coverImage: null } });
    expect(m.unlink).not.toHaveBeenCalled();
  });
});
