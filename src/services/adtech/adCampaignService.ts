import apiClient from '../apiClient';
import type {
  AdRequest,
  AdResponse,
  ImpressionEvent,
  AdCampaign,
  BudgetPacingState,
} from '../../types/adtech';

/**
 * AdCampaign Service
 * Handles ad selection, impression tracking, frequency cap queries, and budget pacing.
 * All endpoints go through the unified apiClient (BASE_URL = "/api").
 */

// --- Ad Selection ---

/**
 * Request an ad for the given resident + placement context.
 * Returns null if no eligible ad exists (204 No Content: frequency cap hit, budget exhausted, or no targeting match).
 */
export async function requestAd(req: AdRequest): Promise<AdResponse | null> {
  try {
    const res = await apiClient.post<AdResponse | undefined>('/adtech/ad-request', req);
    return res ?? null;
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'status' in err && (err as { status?: number }).status === 204) {
      return null;
    }
    throw err;
  }
}

/**
 * Fire an impression event for a rendered ad.
 * Uses the stable impressionId to deduplicate on the backend (idempotent).
 */
export async function fireImpression(event: Omit<ImpressionEvent, 'status'>): Promise<void> {
  await apiClient.post<void>('/adtech/impression', event);
}

/**
 * Record a click event on an ad.
 */
export async function fireClick(impressionId: string, campaignId: string): Promise<void> {
  await apiClient.post<void>('/adtech/click', { impressionId, campaignId });
}

// --- Budget & Pacing ---

/**
 * Get current budget pacing state for a campaign (admin/analytics use).
 */
export async function getCampaignBudgetState(campaignId: string): Promise<BudgetPacingState> {
  return apiClient.get<BudgetPacingState>(`/adtech/campaigns/${campaignId}/budget`);
}

/**
 * List all active campaigns (for admin dashboard).
 */
export async function listCampaigns(filters?: { status?: string; city?: string }): Promise<AdCampaign[]> {
  return apiClient.get<AdCampaign[]>('/adtech/campaigns', { params: filters });
}

export async function getCampaign(campaignId: string): Promise<AdCampaign> {
  return apiClient.get<AdCampaign>(`/adtech/campaigns/${campaignId}`);
}

export async function pauseCampaign(campaignId: string): Promise<void> {
  await apiClient.post<void>(`/adtech/campaigns/${campaignId}/pause`);
}

export async function resumeCampaign(campaignId: string): Promise<void> {
  await apiClient.post<void>(`/adtech/campaigns/${campaignId}/resume`);
}
