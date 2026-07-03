import { safeStorage } from "../utils/storage";
import { createLogger, setCorrelationId } from "../utils/logger";

const BASE_URL = "/api";
const log = createLogger("ApiClient");

function generateId(): string {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const TOKEN_KEY = "mana_token";
const REFRESH_TOKEN_KEY = "mana_refresh_token";
const USER_KEY = "mana_user";

export function getToken(): string | null {
  return safeStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  safeStorage.setItem(TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  return safeStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  safeStorage.setItem(REFRESH_TOKEN_KEY, token);
}

/** Store both the access and (optional) refresh token in one call. */
export function setTokens(token: string, refreshToken?: string | null): void {
  setToken(token);
  if (refreshToken) setRefreshToken(refreshToken);
}

export function removeToken(): void {
  safeStorage.removeItem(TOKEN_KEY);
  safeStorage.removeItem(REFRESH_TOKEN_KEY);
  safeStorage.removeItem(USER_KEY);
  safeStorage.removeItem("mana_last_activity");
}

export interface StoredUser {
  userId: string;
  communityId?: number;
  roleId?: number;
  role?: string;
  fullName?: string;
  email?: string;
  dateOfBirth?: string;
  permissions?: string[];
}

export function getStoredUser(): StoredUser | null {
  const raw = safeStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function storeUser(user: StoredUser): void {
  safeStorage.setItem(USER_KEY, JSON.stringify(user));
}

function buildHeaders(contentType = "application/json"): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": contentType,
  };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// ─── Stateless refresh-token handling ─────────────────────────────────────────
// A single shared refresh is in flight at a time, so a burst of concurrent 401s
// triggers exactly one /auth/refresh call. Subsequent callers await the same
// promise and then retry their original request with the new access token.

let refreshPromise: Promise<boolean> | null = null;

function ensureRefreshed(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function doRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    // Raw fetch — must NOT go through the interceptor (avoids recursion).
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { token?: string; refreshToken?: string };
    if (data?.token) {
      setTokens(data.token, data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Clears the session and bounces to /login. Exposed so the auth layer can reuse it. */
export function forceLogout(): void {
  removeToken();
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const text = await res.text();
      if (text) message = text;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  // 204 No Content
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    // If it's not valid JSON (e.g., a plain string message), return the raw text
    return text as unknown as T;
  }
}

interface RequestInitLike {
  method: string;
  body?: BodyInit;
  /** When true, skip the JSON Content-Type header (used for FormData uploads). */
  form?: boolean;
}

/**
 * Core request runner with transparent access-token refresh.
 *
 * On a 401 the access token has (probably) expired: we attempt a single refresh
 * and retry the request once with the new token. A 403 (authorized endpoint,
 * insufficient role) or a failed refresh ends the session and redirects to login.
 */
async function request<T>(path: string, init: RequestInitLike, isRetry = false): Promise<T> {
  const correlationId = generateId();
  setCorrelationId(correlationId);

  const headers: Record<string, string> = {
    "X-Correlation-Id": correlationId,
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!init.form) headers["Content-Type"] = "application/json";

  const start = performance.now();
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: init.method,
      headers,
      body: init.body,
    });
  } catch (err) {
    log.error(`Network error: ${init.method} ${path}`, err, { correlationId });
    throw err;
  }

  const duration = Math.round(performance.now() - start);
  if (res.ok) {
    log.debug(`${init.method} ${path} ${res.status} (${duration}ms)`);
  } else {
    log.warn(`${init.method} ${path} ${res.status} (${duration}ms)`, undefined);
  }

  if (res.status === 401 && !isRetry && path !== "/auth/refresh") {
    const refreshed = await ensureRefreshed();
    if (refreshed) {
      return request<T>(path, init, true);
    }
    forceLogout();
    throw new Error("Session expired — please log in again.");
  }

  if (res.status === 401 || res.status === 403) {
    forceLogout();
    throw new Error(res.status === 401 ? "Unauthorized" : "Forbidden — please log in again");
  }

  return handleResponse<T>(res);
}

// In-flight GET requests, keyed by path. Coalesces concurrent requests for the
// same resource (e.g. React StrictMode's double effect invocation, or two
// components mounting at once) into a single network call.
const inFlightGets = new Map<string, Promise<unknown>>();

export const apiClient = {
  async get<T>(path: string): Promise<T> {
    const existing = inFlightGets.get(path);
    if (existing) return existing as Promise<T>;

    const promise = request<T>(path, { method: "GET" });
    inFlightGets.set(path, promise);
    try {
      return await promise;
    } finally {
      inFlightGets.delete(path);
    }
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  async put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  async delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" });
  },

  async postForm<T>(path: string, formData: FormData): Promise<T> {
    return request<T>(path, { method: "POST", body: formData, form: true });
  },
};

export { BASE_URL };
