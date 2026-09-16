"use client";

import { useCallback, useEffect, type RefObject } from "react";

export const FORM_DRAFT_RETENTION_MS = 24 * 60 * 60 * 1000;
export const FORM_DRAFT_KEY_PREFIX = "wepac:form-draft:v1";

type DraftValues = Record<string, string>;

type StoredDraft = {
  version: 1;
  savedAt: number;
  values: DraftValues;
};

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readFormDraft(
  storage: Pick<Storage, "getItem" | "removeItem"> | null,
  key: string,
  now = Date.now(),
  retentionMs = FORM_DRAFT_RETENTION_MS,
): DraftValues | null {
  if (!storage) return null;
  try {
    const parsed = JSON.parse(storage.getItem(key) ?? "null") as Partial<StoredDraft> | null;
    if (
      !parsed ||
      parsed.version !== 1 ||
      typeof parsed.savedAt !== "number" ||
      !parsed.values ||
      typeof parsed.values !== "object" ||
      now - parsed.savedAt > retentionMs
    ) {
      storage.removeItem(key);
      return null;
    }
    return Object.fromEntries(
      Object.entries(parsed.values).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  } catch {
    try {
      storage.removeItem(key);
    } catch {
      // Storage can be blocked independently for reads and writes.
    }
    return null;
  }
}

export function writeFormDraft(
  storage: Pick<Storage, "setItem"> | null,
  key: string,
  values: DraftValues,
  now = Date.now(),
): void {
  if (!storage) return;
  try {
    storage.setItem(
      key,
      JSON.stringify({ version: 1, savedAt: now, values } satisfies StoredDraft),
    );
  } catch {
    // Draft persistence is best-effort (private browsing and quotas can reject it).
  }
}

export function readBrowserFormDraft(key: string): DraftValues | null {
  return readFormDraft(browserStorage(), key);
}

export function writeBrowserFormDraft(key: string, values: DraftValues): void {
  writeFormDraft(browserStorage(), key, values);
}

export function clearBrowserFormDraft(key: string): void {
  try {
    browserStorage()?.removeItem(key);
  } catch {
    // Best-effort cleanup for unavailable storage.
  }
}

function captureFields(form: HTMLFormElement, fields: readonly string[]): DraftValues {
  const data = new FormData(form);
  return Object.fromEntries(
    fields.flatMap((name) => {
      const value = data.get(name);
      return typeof value === "string" ? [[name, value] as const] : [];
    }),
  );
}

function restoreFields(form: HTMLFormElement, values: DraftValues): void {
  for (const element of Array.from(form.elements)) {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) continue;
    const value = values[element.name];
    if (value === undefined) continue;
    if (element instanceof HTMLInputElement && (element.type === "checkbox" || element.type === "radio")) {
      element.checked = element.value === value;
    } else {
      element.value = value;
    }
  }
}

export function useLocalFormDraft({
  formRef,
  storageKey,
  fields,
  onRestore,
}: {
  formRef: RefObject<HTMLFormElement | null>;
  storageKey: string;
  fields: readonly string[];
  onRestore?: (values: DraftValues) => void;
}) {
  const saveDraft = useCallback(
    (form = formRef.current) => {
      if (form) writeFormDraft(browserStorage(), storageKey, captureFields(form, fields));
    },
    [fields, formRef, storageKey],
  );

  const clearDraft = useCallback(() => {
    clearBrowserFormDraft(storageKey);
  }, [storageKey]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const values = readFormDraft(browserStorage(), storageKey);
    if (values) {
      restoreFields(form, values);
      onRestore?.(values);
      requestAnimationFrame(() => {
        if (formRef.current) restoreFields(formRef.current, values);
      });
    }

    const persist = () => saveDraft(form);
    form.addEventListener("input", persist);
    form.addEventListener("change", persist);
    return () => {
      form.removeEventListener("input", persist);
      form.removeEventListener("change", persist);
    };
  }, [formRef, onRestore, saveDraft, storageKey]);

  return { saveDraft, clearDraft };
}
