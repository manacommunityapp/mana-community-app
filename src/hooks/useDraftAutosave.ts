import { useState, useEffect, useMemo, useRef, useCallback } from "react";

const DB_NAME = "mana_erp_drafts_v1";
const DB_VERSION = 1;
const STORE_NAME = "drafts";

export interface DraftEnvelope<T> {
  draftKey: string;
  updatedAt: string;
  data: T;
}

export interface FieldChangeEntry {
  field: string;
  before: unknown;
  after: unknown;
}

/**
 * Computes shallow + line-count structural diffs between baseline snapshot and
 * current form values so ERP audit logs record exact modified fields.
 */
export function computeObjectDiff<T extends Record<string, unknown>>(
  baseline: T,
  current: T
): FieldChangeEntry[] {
  const changes: FieldChangeEntry[] = [];
  const keys = new Set([...Object.keys(baseline), ...Object.keys(current)]);

  for (const key of keys) {
    const prev = baseline[key];
    const next = current[key];
    if (Object.is(prev, next)) continue;

    if (typeof prev === "object" || typeof next === "object") {
      try {
        if (JSON.stringify(prev) === JSON.stringify(next)) continue;
      } catch {
        // treat unserializable difference as changed
      }
    }
    changes.push({ field: key, before: prev, after: next });
  }
  return changes;
}

function openDraftDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "draftKey" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB unavailable"));
  });
}

export async function readDraftFromStore<T>(draftKey: string): Promise<DraftEnvelope<T> | null> {
  if (typeof indexedDB !== "undefined") {
    try {
      const db = await openDraftDb();
      try {
        return await new Promise<DraftEnvelope<T> | null>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readonly");
          const req = tx.objectStore(STORE_NAME).get(draftKey);
          req.onsuccess = () => resolve((req.result as DraftEnvelope<T>) ?? null);
          req.onerror = () => reject(req.error);
        });
      } finally {
        db.close();
      }
    } catch {
      // fall through to localStorage
    }
  }
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(`mana_draft_${draftKey}`);
      return raw ? (JSON.parse(raw) as DraftEnvelope<T>) : null;
    } catch {
      return null;
    }
  }
  return null;
}

export async function writeDraftToStore<T>(draftKey: string, data: T): Promise<DraftEnvelope<T>> {
  const envelope: DraftEnvelope<T> = {
    draftKey,
    updatedAt: new Date().toISOString(),
    data,
  };
  if (typeof indexedDB !== "undefined") {
    try {
      const db = await openDraftDb();
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readwrite");
          tx.objectStore(STORE_NAME).put(envelope);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        return envelope;
      } finally {
        db.close();
      }
    } catch {
      // fall through
    }
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(`mana_draft_${draftKey}`, JSON.stringify(envelope));
  }
  return envelope;
}

export async function deleteDraftFromStore(draftKey: string): Promise<void> {
  if (typeof indexedDB !== "undefined") {
    try {
      const db = await openDraftDb();
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readwrite");
          tx.objectStore(STORE_NAME).delete(draftKey);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } finally {
        db.close();
      }
    } catch {
      // ignore
    }
  }
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(`mana_draft_${draftKey}`);
  }
}

export interface UseDraftAutosaveOptions<T extends Record<string, unknown>> {
  draftKey: string;
  value: T;
  baseline: T;
  debounceMs?: number;
  enabled?: boolean;
}

export function useDraftAutosave<T extends Record<string, unknown>>({
  draftKey,
  value,
  baseline,
  debounceMs = 800,
  enabled = true,
}: UseDraftAutosaveOptions<T>) {
  const [restorableDraft, setRestorableDraft] = useState<DraftEnvelope<T> | null>(null);
  const [lastAutosavedAt, setLastAutosavedAt] = useState<string | null>(null);
  const loadedKeyRef = useRef<string | null>(null);

  const changedFields = useMemo(() => computeObjectDiff(baseline, value), [baseline, value]);
  const isDirty = changedFields.length > 0;

  // Load saved draft once per draftKey
  useEffect(() => {
    if (!enabled || loadedKeyRef.current === draftKey) return;
    loadedKeyRef.current = draftKey;
    void readDraftFromStore<T>(draftKey).then((found) => {
      if (found) setRestorableDraft(found);
    });
  }, [draftKey, enabled]);

  // Debounced autosave to IndexedDB whenever dirty
  useEffect(() => {
    if (!enabled || !isDirty) return;
    const timer = setTimeout(() => {
      void writeDraftToStore(draftKey, value).then((env) => {
        setLastAutosavedAt(env.updatedAt);
      });
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [draftKey, value, isDirty, debounceMs, enabled]);

  // Guard against accidental tab close with unsaved invoice changes
  useEffect(() => {
    if (!enabled || !isDirty || typeof window === "undefined") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled, isDirty]);

  const dismissRestorableDraft = useCallback(() => {
    setRestorableDraft(null);
    void deleteDraftFromStore(draftKey);
  }, [draftKey]);

  const clearDraft = useCallback(() => {
    setRestorableDraft(null);
    setLastAutosavedAt(null);
    void deleteDraftFromStore(draftKey);
  }, [draftKey]);

  return {
    restorableDraft,
    lastAutosavedAt,
    changedFields,
    isDirty,
    dismissRestorableDraft,
    clearDraft,
  };
}
