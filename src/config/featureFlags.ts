/**
 * Central feature flags.
 *
 * AI_AGENT_CHATBOT_ENABLED — when true, the floating chat bot uses the new
 * "Mana AI Assistant" (ManaChat, /api/v1/chat). When false (current default),
 * it falls back to the earlier AppFlowChatbot that answers application/how-to
 * questions. Flip to true once the AI agent backend is ready.
 */
export const AI_AGENT_CHATBOT_ENABLED = false;

/**
 * Per-community module gating for pilots.
 *
 * `enabledModules === null` means the server has not restricted modules for
 * this community, so every module stays enabled (default, backwards compatible).
 * Otherwise only listed module keys (case-insensitive) are enabled.
 */
export function isModuleEnabled(
  moduleKey: string,
  config: { enabledModules: string[] | null },
): boolean {
  if (config.enabledModules === null) return true;
  const key = moduleKey.toLowerCase();
  return config.enabledModules.some((m) => m.toLowerCase() === key);
}

import { apiClient } from "../services/common/apiClient";

export function deterministicTenantBucket(flagKey: string, communityId: number): number {
  const str = `${flagKey}:${communityId}`;
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 10_000;
}

export function isRushHourWindow(hour: number, minute: number): boolean {
  const mins = hour * 60 + minute;
  return (mins >= 7 * 60 + 30 && mins < 10 * 60 + 30) || (mins >= 17 * 60 + 30 && mins < 20 * 60 + 30);
}

export const releaseSafetyService = {
  async evaluateTenantFlag(flagKey: string, communityId: number): Promise<any> {
    return apiClient.get<any>(`/v1/release/flags/evaluate?flagKey=${encodeURIComponent(flagKey)}&communityId=${communityId}`);
  },

  async reportCanaryTelemetry(flagKey: string, p99LatencyMs: number, errorRateBps: number): Promise<any> {
    return apiClient.post<any>(`/v1/release/flags/${encodeURIComponent(flagKey)}/telemetry`, {
      p99LatencyMs,
      errorRateBps,
    });
  },

  async startChaosGameDay(experimentCode: string, communityId: number, faultType: "REDIS_EVICTION" | "KAFKA_LAG" | "FCM_THROTTLE", maxDurationSec = 600): Promise<any> {
    return apiClient.post<any>("/v1/release/chaos/start", {
      experimentCode,
      communityId,
      faultType,
      maxDurationSec,
    });
  },

  async verifyChaosGateInvariants(experimentId: number, payload: {
    offlineCacheFallbackServed?: boolean;
    outboxQueuedWithoutGateBlock?: boolean;
    smsFallbackAndPriorityLaneActive?: boolean;
    sosProbeHealthy?: boolean;
  }): Promise<any> {
    return apiClient.post<any>(`/v1/release/chaos/${experimentId}/verify-gate`, payload);
  },

  async abortChaosGameDay(experimentId: number, reason?: string): Promise<any> {
    return apiClient.post<any>(`/v1/release/chaos/${experimentId}/abort`, { reason });
  },
};
