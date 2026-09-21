import { safeStorage, STORAGE_KEYS, clearUserStorage } from "../../utils/storage";
import { createLogger, setCorrelationId } from "../../utils/logger";
import { canAccessEndpoint } from "../../utils/permissionUtils";

const BASE_URL = "/api";
const log = createLogger("ApiClient");

function generateId(): string {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const TOKEN_KEY = STORAGE_KEYS.TOKEN;
const REFRESH_TOKEN_KEY = STORAGE_KEYS.REFRESH_TOKEN;
const USER_KEY = STORAGE_KEYS.USER;

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
  clearUserStorage();
}

export interface StoredUser {
  userId: string;
  communityId?: number;
  communityName?: string;
  roleId?: number;
  role?: string;
  /** All assigned roles as an array (backend may return multi-role users). */
  roles?: string[];
  fullName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  flatNo?: string;
  flatNumber?: string;
  block?: string;
  tower?: string;
  status?: string;
  profilePicUrl?: string;
  profilePic?: string;
  permissions?: string[];
  enabledModules?: string[];
  menuPermissions?: import("../../types/api").MenuRolePermissionResponse[];
  occupancyStatus?: string;
  residentType?: string;
  userType?: string;
  bio?: string;
  skills?: string[];
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

/**
 * Strips Java package names, nested exception traces, and technical exception class prefixes
 * so that clean backend messages (e.g. "A User with that email already exists.") are presented directly to users.
 */
export function stripExceptionPrefix(msg?: string): string {
  if (!msg) return "";
  let clean = msg.trim();

  // Remove wrapping quotes if present
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }

  // Strip nested exception wrapping prefixes
  clean = clean.replace(/^(?:(?:NestedServletException|nested exception is|Request processing failed[;:]?)\s*)+/gi, "");

  // Strip class name patterns like "com.manacommunity.api.exception.DuplicateResourceException: "
  // or "org.springframework.dao.DataIntegrityViolationException: " or "DuplicateResourceException: "
  const exceptionRegex = /(?:[a-zA-Z0-9_$]+\.)*([a-zA-Z0-9_$]+(?:Exception|Error)):\s*/g;
  clean = clean.replace(exceptionRegex, "");

  // Clean any leading colons, dashes or whitespace
  clean = clean.replace(/^[:\s-]+/, "").trim();

  return clean || msg.trim();
}

function sanitizeErrorMessage(status: number, rawText?: string): string {
  const text = (rawText || "").trim();
  const lower = text.toLowerCase();

  // Check for 502 / 503 / 504 / 520 / 521 / 522 / 524
  if (status === 502 || status === 503 || status === 504 || status === 520 || status === 521 || status === 522 || status === 524) {
    return "Our servers are temporarily unreachable or undergoing maintenance. Please try again in a few moments.";
  }

  // Check for HTML or nginx error pages
  if (
    lower.includes("<html") ||
    lower.includes("<!doctype") ||
    lower.includes("502 bad gateway") ||
    lower.includes("503 service") ||
    lower.includes("504 gateway") ||
    lower.includes("nginx") ||
    lower.includes("cloudflare") ||
    lower.includes("bad gateway") ||
    lower.includes("gateway time-out")
  ) {
    return "Unable to connect to the server right now. Please check your network or try again shortly.";
  }

  // Try parsing JSON error response
  if (text.startsWith("{") || text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        // 1. Check if backend returned fieldErrors array
        if (Array.isArray(parsed.fieldErrors) && parsed.fieldErrors.length > 0) {
          const fieldMsgs = parsed.fieldErrors
            .map((fe: any) => stripExceptionPrefix(fe?.message || fe?.error || String(fe)))
            .filter(Boolean);
          if (fieldMsgs.length > 0) {
            return fieldMsgs.join(". ");
          }
        }

        // 2. Check message field
        if (typeof parsed.message === "string" && parsed.message.trim()) {
          const m = stripExceptionPrefix(parsed.message);
          if (m && !m.toLowerCase().includes("<html") && !m.toLowerCase().includes("502 bad")) {
            return m;
          }
        }

        // 3. Check detail or details field
        if (typeof parsed.detail === "string" && parsed.detail.trim()) {
          const d = stripExceptionPrefix(parsed.detail);
          if (d && !d.toLowerCase().includes("<html")) {
            return d;
          }
        }

        // 4. Check error description / error message
        if (typeof parsed.error_description === "string" && parsed.error_description.trim()) {
          const ed = stripExceptionPrefix(parsed.error_description);
          if (ed && !ed.toLowerCase().includes("<html")) {
            return ed;
          }
        }

        if (typeof parsed.error === "string" && parsed.error.trim()) {
          const e = stripExceptionPrefix(parsed.error);
          if (e && !e.toLowerCase().includes("<html") && e !== "INTERNAL_SERVER_ERROR") {
            return e;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // If text is a raw string from backend (e.g. "com.manacommunity...DuplicateResourceException: A User with that email already exists.")
  if (text && !text.includes("<") && !text.includes(">")) {
    const clean = stripExceptionPrefix(text);
    if (clean && clean.length < 500) {
      return clean;
    }
  }

  if (status === 401) {
    return "Invalid email/mobile or password. Please verify your credentials and try again.";
  }

  if (status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (status === 404) {
    return "The requested service or resource was not found.";
  }

  if (status === 409) {
    return "A resource with these details already exists.";
  }

  if (status >= 500) {
    return "A server error occurred. Please try again in a few moments.";
  }

  return `Request failed (${status}). Please try again later.`;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let rawText = "";
    try {
      rawText = await res.text();
    } catch {
      // ignore
    }
    const message = sanitizeErrorMessage(res.status, rawText);
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

  // Pre-flight permission and module access check before sending the request
  const access = canAccessEndpoint(path, init.method, getStoredUser());
  if (!access.allowed) {
    log.warn(`Pre-flight Access Check blocked ${init.method} ${path}: ${access.reason} - ${access.message}`, { correlationId });
    throw new Error(access.message || "You do not have permission to perform this action.");
  }

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
    throw new Error("Unable to connect to the server. Please check your internet connection or try again shortly.");
  }

  const duration = Math.round(performance.now() - start);
  if (res.ok) {
    log.debug(`${init.method} ${path} ${res.status} (${duration}ms)`);
  } else {
    log.warn(`${init.method} ${path} ${res.status} (${duration}ms)`, undefined);
  }

  const isAuthEndpoint =
    path === "/auth/login" ||
    path === "/auth/register" ||
    path === "/auth/refresh" ||
    path.startsWith("/auth/") ||
    path.startsWith("/api/auth/");

  if (res.status === 401 && !isRetry && !isAuthEndpoint) {
    const refreshed = await ensureRefreshed();
    if (refreshed) {
      return request<T>(path, init, true);
    }
    forceLogout();
    throw new Error("Session expired — please log in again.");
  }

  if (res.status === 401 && !isAuthEndpoint) {
    forceLogout();
    throw new Error("Unauthorized — please log in again.");
  }

  return handleResponse<T>(res);
}

// Cached & In-flight GET requests, keyed by path. Coalesces concurrent and rapid repeated
// requests for the same resource (e.g. React StrictMode's double effect invocation, multi-component
// mounting, or rapid re-renders) into a single network call.
interface GetCacheEntry {
  promise: Promise<unknown>;
  expiresAt: number;
}

const getCache = new Map<string, GetCacheEntry>();
const DEDUPE_TTL_MS = 1000; // 1 second coalescing window for identical GET requests

export interface RequestOptions {
  bypassCache?: boolean;
}

export const apiClient = {
  /**
   * Fetch a GET resource with automatic 1-second deduplication and concurrent call coalescing.
   * If `options.bypassCache` is true, forces a fresh network call.
   */
  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    const now = Date.now();
    const existing = getCache.get(path);

    if (!options?.bypassCache && existing && existing.expiresAt > now) {
      return existing.promise as Promise<T>;
    }

    const promise = request<T>(path, { method: "GET" }).catch((err) => {
      // Remove immediately on error so failed requests aren't cached or blocking retries
      getCache.delete(path);
      throw err;
    });

    getCache.set(path, {
      promise,
      expiresAt: now + DEDUPE_TTL_MS,
    });

    return promise;
  },

  /** Clear all cached GET promises immediately. */
  clearCache(): void {
    getCache.clear();
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    getCache.clear();
    return request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  async put<T>(path: string, body?: unknown): Promise<T> {
    getCache.clear();
    return request<T>(path, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  async patch<T>(path: string, body?: unknown): Promise<T> {
    getCache.clear();
    return request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  async delete<T>(path: string): Promise<T> {
    getCache.clear();
    return request<T>(path, { method: "DELETE" });
  },

  async postForm<T>(path: string, formData: FormData): Promise<T> {
    getCache.clear();
    return request<T>(path, { method: "POST", body: formData, form: true });
  },
};

export { BASE_URL };

