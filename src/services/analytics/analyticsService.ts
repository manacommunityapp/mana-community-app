import { apiClient, getToken } from "../common/apiClient";
import { privacyService } from "../privacy/privacyService";

/**
 * First-party product analytics.
 *
 * - Batches events and posts them to /v1/analytics/events.
 * - Never throws; analytics must not break user flows.
 * - Strips obvious PII keys from props. Callers must still avoid passing PII.
 * - Honours a local opt-out flag (localStorage "analytics_opt_out" = "1").
 */

export type AnalyticsEventName =
  | "signup_started"
  | "signup_completed"
  | "otp_verified"
  | "profile_completed"
  | "unit_linked"
  | "first_key_action"
  | "booking_started"
  | "booking_created"
  | "booking_confirmed"
  | "booking_failed"
  | "payment_started"
  | "payment_succeeded"
  | "payment_failed"
  | "checkout_started"
  | "food_order_started"
  | "food_order_placed"
  | "food_order_completed"
  | "food_order_failed"
  | "sports_registration_started"
  | "sports_registration_completed"
  | "sports_registration_failed"
  | "sports_multi_registration_completed"
  | "sports_team_registration_started"
  | "sports_team_registered"
  | "sports_team_registration_failed"
  | "cultural_registration_started"
  | "cultural_registration_completed"
  | "cultural_registration_failed"
  | "cultural_checkin_completed"
  | "event_ticket_booked"
  | "event_registration_completed"
  | (string & {});

export interface AnalyticsContext {
  communityId?: number | null;
  userId?: string | null;
  cohort?: string | null;
}

interface QueuedEvent {
  event: string;
  props: Record<string, unknown>;
  ts: string;
  communityId: number | null;
  userHash: string | null;
  cohort: string | null;
  sessionId: string;
}

/**
 * DPDP policy switch. false = events flow unless the user has REVOKED the
 * ANALYTICS consent (opt-out model). true = require an explicit GRANTED record
 * (opt-in model). Events are aggregate/hashed, but confirm the policy with legal.
 */
export const ANALYTICS_REQUIRES_EXPLICIT_GRANT = false;

/** Events that count as a resident's first meaningful action (activation). */
const KEY_ACTIONS = new Set([
  "booking_created",
  "payment_succeeded",
  "food_order_completed",
  "sports_registration_completed",
  "sports_team_registered",
  "cultural_registration_completed",
  "event_ticket_booked",
  "event_registration_completed",
]);

const PII_KEYS = /(email|phone|mobile|name|address|aadhaar|pan|otp|password|token|dob)/i;
const FLUSH_INTERVAL_MS = 10_000;
const MAX_BATCH = 20;

let context: AnalyticsContext = {};
let queue: QueuedEvent[] = [];
let timer: ReturnType<typeof setInterval> | null = null;
const sessionId =
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2);

function isOptedOut(): boolean {
  try {
    return localStorage.getItem("analytics_opt_out") === "1";
  } catch {
    return false;
  }
}

/** Non-cryptographic stable hash so raw user ids are not sent in event payloads. */
function hashId(id: string): string {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function sanitizeProps(props: Record<string, unknown> = {}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (PII_KEYS.test(k)) continue;
    if (v !== null && typeof v === "object") continue; // flat, primitive props only
    out[k] = v;
  }
  return out;
}

let consentCheck: Promise<boolean> | null = null;

/** Resolves true when analytics may be sent. Cached per session; fails open unless explicit grant is required. */
function analyticsAllowed(): Promise<boolean> {
  if (!consentCheck) {
    consentCheck = privacyService
      .getConsents()
      .then((records) => {
        const r = records.find((x) => x.purpose === "ANALYTICS");
        if (r?.status === "REVOKED") return false;
        return ANALYTICS_REQUIRES_EXPLICIT_GRANT ? r?.status === "GRANTED" : true;
      })
      .catch(() => !ANALYTICS_REQUIRES_EXPLICIT_GRANT);
  }
  return consentCheck;
}

async function flush(): Promise<void> {
  if (queue.length === 0 || !getToken()) return;
  if (!(await analyticsAllowed())) {
    queue = [];
    return;
  }
  const batch = queue.splice(0, MAX_BATCH);
  try {
    await apiClient.post("/v1/analytics/events", { events: batch });
  } catch {
    // Drop on failure; bounded memory matters more than perfect delivery.
  }
}

function ensureTimer() {
  if (timer || typeof window === "undefined") return;
  timer = setInterval(() => void flush(), FLUSH_INTERVAL_MS);
  window.addEventListener("pagehide", () => void flush());
}

/** True only the first time for this browser+user; persisted so it is not re-sent each session. */
function markFirstKeyAction(): boolean {
  try {
    const key = `analytics_first_key_action_${context.userId ?? "anon"}`;
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, "1");
    return true;
  } catch {
    return false;
  }
}

export const analyticsService = {
  setContext(next: AnalyticsContext) {
    context = { ...context, ...next };
  },

  track(event: AnalyticsEventName, props?: Record<string, unknown>) {
    if (isOptedOut()) return;
    try {
      queue.push({
        event,
        props: sanitizeProps(props),
        ts: new Date().toISOString(),
        communityId: context.communityId ?? null,
        userHash: context.userId ? hashId(context.userId) : null,
        cohort: context.cohort ?? null,
        sessionId,
      });
      if (KEY_ACTIONS.has(event) && markFirstKeyAction()) {
        queue.push({
          event: "first_key_action",
          props: { via: event },
          ts: new Date().toISOString(),
          communityId: context.communityId ?? null,
          userHash: context.userId ? hashId(context.userId) : null,
          cohort: context.cohort ?? null,
          sessionId,
        });
      }
      if (queue.length > 200) queue = queue.slice(-200);
      ensureTimer();
      if (queue.length >= MAX_BATCH) void flush();
    } catch {
      /* never break callers */
    }
  },

  flush,

  /** Test helper. */
  _reset() {
    queue = [];
    context = {};
    consentCheck = null;
  },
  _queueLength: () => queue.length,
};
