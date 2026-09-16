import { describe, expect, it } from "vitest";
import {
  FORM_DRAFT_RETENTION_MS,
  readFormDraft,
  writeFormDraft,
} from "../local-form-draft";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("local form drafts", () => {
  it("round-trips a versioned draft within its retention window", () => {
    const storage = memoryStorage();
    writeFormDraft(storage, "wepac:form-draft:v1:contact", { name: "Ana" }, 1_000);

    expect(readFormDraft(storage, "wepac:form-draft:v1:contact", 2_000)).toEqual({ name: "Ana" });
  });

  it("removes PII drafts after 24 hours", () => {
    const storage = memoryStorage();
    const key = "wepac:form-draft:v1:intake";
    writeFormDraft(storage, key, { email: "ana@example.test" }, 1_000);

    expect(readFormDraft(storage, key, 1_001 + FORM_DRAFT_RETENTION_MS)).toBeNull();
    expect(storage.getItem(key)).toBeNull();
  });

  it("ignores and cleans malformed storage", () => {
    const storage = memoryStorage();
    storage.setItem("draft", "not-json");
    expect(readFormDraft(storage, "draft")).toBeNull();
    expect(storage.getItem("draft")).toBeNull();
  });
});
