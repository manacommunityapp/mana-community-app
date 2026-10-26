import { apiClient } from "../common/apiClient";
import type {
  CricHeroesPlayerProfile,
  CricHeroesLinkRequest,
  CricHeroesLinkResponse,
  PlayerRating,
  PlayerComparison,
  TeamComposition,
  FormatScope,
} from "../../types/sportsCricheroes";

export const sportsCricHeroesService = {
  /** POST /api/cricheroes/link — link a CricHeroes profile to an auction player */
  async linkProfile(data: CricHeroesLinkRequest): Promise<CricHeroesLinkResponse> {
    return apiClient.post<CricHeroesLinkResponse>("/cricheroes/link", data);
  },

  /** DELETE /api/cricheroes/link/{playerId} — unlink CricHeroes from player */
  async unlinkProfile(playerId: number): Promise<void> {
    return apiClient.delete(`/cricheroes/link/${playerId}`);
  },

  /** GET /api/cricheroes/profile/{playerId} — cached CricHeroes profile for a player */
  async getProfile(playerId: number): Promise<CricHeroesPlayerProfile> {
    return apiClient.get<CricHeroesPlayerProfile>(`/cricheroes/profile/${playerId}`);
  },

  /** GET /api/cricheroes/profile/{playerId}/refresh — force re-fetch from CricHeroes */
  async refreshProfile(playerId: number): Promise<CricHeroesPlayerProfile> {
    return apiClient.get<CricHeroesPlayerProfile>(`/cricheroes/profile/${playerId}/refresh`, { bypassCache: true });
  },

  /** POST /api/cricheroes/resolve — resolve a CricHeroes share URL to a player ID */
  async resolveUrl(url: string): Promise<{ cricheroesId: string; resolvedUrl: string }> {
    return apiClient.post("/cricheroes/resolve", { url });
  },

  /** GET /api/cricheroes/preview?url={url} — preview a CricHeroes profile before linking */
  async previewProfile(url: string): Promise<CricHeroesPlayerProfile> {
    return apiClient.get<CricHeroesPlayerProfile>(`/cricheroes/preview?url=${encodeURIComponent(url)}`);
  },

  /** GET /api/cricheroes/rating/{playerId} — computed player rating & tier */
  async getPlayerRating(playerId: number): Promise<PlayerRating> {
    return apiClient.get<PlayerRating>(`/cricheroes/rating/${playerId}`);
  },

  /** GET /api/cricheroes/compare?playerA={}&playerB={} — head-to-head comparison */
  async comparePlayers(playerAId: number, playerBId: number): Promise<PlayerComparison> {
    return apiClient.get<PlayerComparison>(`/cricheroes/compare?playerA=${playerAId}&playerB=${playerBId}`);
  },

  /** GET /api/cricheroes/team-composition/{configId}/{teamId} — team balance analytics */
  async getTeamComposition(configId: number, teamId: number): Promise<TeamComposition> {
    return apiClient.get<TeamComposition>(`/cricheroes/team-composition/${configId}/${teamId}`);
  },

  /** GET /api/cricheroes/profiles/{configId} — all linked profiles for an auction config */
  async getLinkedProfiles(configId: number): Promise<Record<number, CricHeroesPlayerProfile>> {
    return apiClient.get<Record<number, CricHeroesPlayerProfile>>(`/cricheroes/profiles/${configId}`);
  },

  /** POST /api/cricheroes/bulk-link/{configId} — bulk-link players by matching names */
  async bulkLink(configId: number, formatScope?: FormatScope): Promise<{ linked: number; failed: number; errors: string[] }> {
    const query = formatScope ? `?formatScope=${formatScope}` : "";
    return apiClient.post(`/cricheroes/bulk-link/${configId}${query}`);
  },
};
