export interface QueuedRequest {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body: unknown;
  headers: Record<string, string>;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  tags?: string[];
}

type EnqueueInput = Omit<QueuedRequest, 'id' | 'retryCount' | 'createdAt'>;

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

const DB_NAME = 'mana-request-queue';
const STORE = 'requests';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetAll(): Promise<QueuedRequest[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result as QueuedRequest[]);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return lsGetAll();
  }
}

async function idbPut(entry: QueuedRequest): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const req = tx.objectStore(STORE).put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    lsPut(entry);
  }
}

async function idbDelete(id: string): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const req = tx.objectStore(STORE).delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    lsDelete(id);
  }
}

async function idbClear(): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const req = tx.objectStore(STORE).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    localStorage.removeItem(DB_NAME);
  }
}

// ─── localStorage fallback ────────────────────────────────────────────────────

function lsGetAll(): QueuedRequest[] {
  try {
    return JSON.parse(localStorage.getItem(DB_NAME) ?? '[]') as QueuedRequest[];
  } catch {
    return [];
  }
}

function lsPut(entry: QueuedRequest): void {
  try {
    const all = lsGetAll().filter(r => r.id !== entry.id);
    localStorage.setItem(DB_NAME, JSON.stringify([...all, entry]));
  } catch { /* quota exceeded — drop silently */ }
}

function lsDelete(id: string): void {
  try {
    localStorage.setItem(DB_NAME, JSON.stringify(lsGetAll().filter(r => r.id !== id)));
  } catch { /* ignore */ }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const requestQueue = {
  async enqueue(input: EnqueueInput): Promise<string> {
    const entry: QueuedRequest = {
      ...input,
      id: crypto.randomUUID(),
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    await idbPut(entry);
    return entry.id;
  },

  async processQueue(executor: (req: QueuedRequest) => Promise<void>): Promise<void> {
    const all = await idbGetAll();
    for (const req of all) {
      try {
        await executor(req);
        await idbDelete(req.id);
      } catch {
        const updated = { ...req, retryCount: req.retryCount + 1 };
        if (updated.retryCount >= updated.maxRetries) {
          await idbDelete(req.id);
        } else {
          await idbPut(updated);
        }
      }
    }
  },

  async remove(id: string): Promise<void> {
    await idbDelete(id);
  },

  async getAll(): Promise<QueuedRequest[]> {
    return idbGetAll();
  },

  async clear(): Promise<void> {
    await idbClear();
  },
};

// ─── Reconnect sync ───────────────────────────────────────────────────────────

type Executor = (req: QueuedRequest) => Promise<void>;
let _executor: Executor | null = null;

export function initRequestQueueSync(executor: Executor): void {
  _executor = executor;
  window.addEventListener('online', () => {
    if (_executor) requestQueue.processQueue(_executor).catch(() => {});
  });
}
