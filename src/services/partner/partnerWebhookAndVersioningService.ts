import { apiClient } from "../common/apiClient";

export type PartnerKeyStatus = "ACTIVE" | "ROTATING_GRACE" | "REVOKED";

export interface PartnerWebhookKey {
  id: number;
  partnerId: string;
  keyId: string;
  secretHex: string;
  status: PartnerKeyStatus;
  graceUntil?: string | null;
  revokedReason?: string | null;
  createdAt: string;
}

export interface DeprecatedApiTelemetry {
  id: number;
  endpoint: string;
  apiVersion: string;
  controllerSerial: string;
  communityId?: number | null;
  firmwareVersion?: string | null;
  callCount: number;
  lastSeenAt: string;
}

export interface DeprecationHeaderInfo {
  deprecated: boolean;
  sunsetDate: string | null;
  successorUrl: string | null;
  apiVersion: string | null;
}

export interface V2HardwareSyncRequest {
  controllerSerial: string;
  communityId: number;
  firmwareVersion: string;
  sinceVersion: number;
  events?: Array<Record<string, unknown>>;
}

export interface V2HardwareSyncResponse {
  apiVersion: string;
  controllerSerial: string;
  cursorVersion: number;
  acceptedEventsCount: number;
  serverTimestamp: string;
  actions: Array<Record<string, unknown>>;
}

/**
 * Builds the canonical signing string shared across hardware controllers and Mygate webhook verifiers:
 * METHOD\nPATH\nTIMESTAMP\nNONCE\nRAW_BODY
 */
export function buildCanonicalWebhookString(
  method: string,
  path: string,
  timestampSec: number,
  nonce: string,
  rawBody: string,
): string {
  const normMethod = (method || "POST").trim().toUpperCase();
  const normPath = path || "/";
  return `${normMethod}\n${normPath}\n${timestampSec}\n${nonce}\n${rawBody ?? ""}`;
}

/**
 * Parses RFC 8594 / RFC 8288 Deprecation, Sunset, and Link headers returned by legacy API gateways.
 */
export function parseDeprecationHeaders(
  headers: Record<string, string | undefined> | Headers,
): DeprecationHeaderInfo {
  const get = (name: string): string | null => {
    if (typeof Headers !== "undefined" && headers instanceof Headers) {
      return headers.get(name);
    }
    const target = name.toLowerCase();
    for (const [k, v] of Object.entries(headers as Record<string, string | undefined>)) {
      if (k.toLowerCase() === target && v !== undefined) {
        return v;
      }
    }
    return null;
  };

  const depVal = get("Deprecation");
  const linkVal = get("Link");
  let successorUrl: string | null = null;
  if (linkVal) {
    const match = linkVal.match(/<([^>]+)>\s*;\s*rel=["']?successor-version["']?/i);
    if (match) {
      successorUrl = match[1];
    }
  }

  return {
    deprecated: depVal === "true" || depVal === "@true",
    sunsetDate: get("Sunset"),
    successorUrl,
    apiVersion: get("X-API-Version"),
  };
}

export const partnerWebhookAndVersioningService = {
  /** Rotate partner HMAC signing key with configurable zero-downtime grace overlap (default 168h). */
  rotatePartnerKey(partnerId: string, graceHours = 168): Promise<PartnerWebhookKey> {
    return apiClient.post<PartnerWebhookKey>("/v1/partners/keys/rotate", { partnerId, graceHours });
  },

  /** Immediately revoke a compromised controller/partner key across all gates. */
  revokePartnerKey(keyId: string, reason = "COMPROMISED_FIRMWARE_QUARANTINE"): Promise<PartnerWebhookKey> {
    return apiClient.post<PartnerWebhookKey>(`/v1/partners/keys/${encodeURIComponent(keyId)}/revoke`, { reason });
  },

  /** Canonical v2 hardware sync request. */
  syncHardwareV2(req: V2HardwareSyncRequest): Promise<V2HardwareSyncResponse> {
    return apiClient.post<V2HardwareSyncResponse>("/v2/hardware/sync", req);
  },

  /** Fetches physical controller laggards still invoking deprecated /v1/hardware/sync. */
  getDeprecatedLaggards(): Promise<DeprecatedApiTelemetry[]> {
    return apiClient.get<DeprecatedApiTelemetry[]>("/v1/partners/deprecation/laggards");
  },

  /** Enables or disables HTTP 410 Gone sunset enforcement for /api/v1/hardware/sync. */
  setV1SunsetEnabled(enabled: boolean): Promise<{ v1SunsetEnabled: boolean }> {
    return apiClient.put<{ v1SunsetEnabled: boolean }>("/v1/partners/deprecation/v1-sunset", { enabled });
  },
};
