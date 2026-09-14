import { apiClient } from "../common/apiClient";
import type { SportsPlayerRanking, SportsPlayerRankingRequest } from "../../types/api";

export const sportsRankingService = {
  async list(sportId: number, communityId: number, season = "CURRENT"): Promise<SportsPlayerRanking[]> {
    return apiClient.get<SportsPlayerRanking[]>(
      `/sports/rankings?sportId=${sportId}&communityId=${communityId}&season=${season}`
    );
  },

  async listForUser(userId: number, communityId: number, season = "CURRENT"): Promise<SportsPlayerRanking[]> {
    return apiClient.get<SportsPlayerRanking[]>(
      `/sports/rankings/user/${userId}?communityId=${communityId}&season=${season}`
    );
  },

  async upsert(request: SportsPlayerRankingRequest): Promise<SportsPlayerRanking> {
    return apiClient.post<SportsPlayerRanking>("/sports/rankings", request);
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete(`/sports/rankings/${id}`);
  },

  async setRegistrationSeed(registrationId: number, seed: number | null): Promise<void> {
    const params = seed != null ? `?seed=${seed}` : "";
    return apiClient.patch(`/sports/registrations/${registrationId}/seed${params}`);
  },
};
