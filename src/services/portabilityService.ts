import { apiClient } from './common/apiClient';

export interface ReputationScore {
  score: number;
  paymentScore?: number;
  participation?: number;
  tenureMonths: number;
  badges: { type: string; label: string; earnedAt: string }[];
  computedAt: string;
}

export interface PortabilityToken {
  id: number;
  tokenHash: string;
  expiresAt: string;
  claimedAt?: string;
  exportPayload: {
    name: string;
    verified: boolean;
    reputationScore: number;
    tenureMonths: number;
  };
}

export const portabilityService = {
  getMyScore: (): Promise<ReputationScore> =>
    apiClient.get<ReputationScore>('/identity/reputation/my'),

  getMyToken: (): Promise<PortabilityToken | null> =>
    apiClient.get<PortabilityToken | null>('/identity/portability/my-token'),

  generateToken: (): Promise<PortabilityToken> =>
    apiClient.post<PortabilityToken>('/identity/portability/generate', {}),

  importProfile: (tokenHash: string): Promise<{ success: boolean; message: string }> =>
    apiClient.post('/identity/portability/import', { tokenHash }),

  getFederatedCommunities: (communityId: number): Promise<any[]> =>
    apiClient.get<any[]>(`/identity/portability/federated?communityId=${communityId}`),
};
