import { apiClient } from "../common/apiClient";

export interface PilotConfig {
  /** True when this community is part of the pilot programme. */
  pilot: boolean;
  /** Cohort label, e.g. "pilot-1", used to segment KPIs. */
  cohort: string | null;
  /**
   * Module keys enabled for this community. `null` means the server has not
   * restricted modules (everything stays enabled, preserving current behaviour).
   */
  enabledModules: string[] | null;
}

export const DEFAULT_PILOT_CONFIG: PilotConfig = {
  pilot: false,
  cohort: null,
  enabledModules: null,
};

export const pilotConfigService = {
  async getConfig(communityId: number): Promise<PilotConfig> {
    const res = await apiClient.get<Partial<PilotConfig>>(
      `/v1/communities/${communityId}/pilot-config`,
    );
    return {
      pilot: res?.pilot ?? false,
      cohort: res?.cohort ?? null,
      enabledModules: Array.isArray(res?.enabledModules) ? res.enabledModules : null,
    };
  },
};
