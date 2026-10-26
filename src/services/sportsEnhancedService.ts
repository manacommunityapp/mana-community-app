import axios from 'axios';
import type {
  CricketScorecard, PlayerProfile, LeaderboardEntry,
  LeaderboardCategory, LeaderboardPeriod, SportType,
  MatchPhoto, MatchRatingSummary, Badge,
} from '../types/sports-enhanced';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8082/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const sportsEnhancedService = {
  // ── Cricket Scorecard ──────────────────────────────────────────
  async getScorecard(matchId: number): Promise<CricketScorecard> {
    const { data } = await api.get(`/sports/matches/${matchId}/scorecard`);
    return data;
  },

  async saveScorecard(matchId: number, payload: Partial<CricketScorecard>): Promise<CricketScorecard> {
    const { data } = await api.put(`/sports/matches/${matchId}/scorecard`, payload);
    return data;
  },

  // ── Player Profile ─────────────────────────────────────────────
  async getPlayerProfile(userId: number): Promise<PlayerProfile> {
    const { data } = await api.get(`/sports/players/${userId}`);
    return data;
  },

  async getMyProfile(): Promise<PlayerProfile> {
    const { data } = await api.get('/sports/players/me');
    return data;
  },

  // ── Leaderboard ────────────────────────────────────────────────
  async getLeaderboard(
    sport: SportType | 'ALL',
    category: LeaderboardCategory,
    period: LeaderboardPeriod,
  ): Promise<LeaderboardEntry[]> {
    const { data } = await api.get('/sports/leaderboard', {
      params: {
        sport:    sport === 'ALL' ? undefined : sport,
        category,
        period,
      },
    });
    return data;
  },

  // ── Badges ────────────────────────────────────────────────────
  async getAllBadges(): Promise<Badge[]> {
    const { data } = await api.get('/sports/badges');
    return data;
  },

  // ── Match Photos ───────────────────────────────────────────────
  async getMatchPhotos(matchId: number): Promise<MatchPhoto[]> {
    const { data } = await api.get(`/sports/matches/${matchId}/photos`);
    return data;
  },

  async uploadMatchPhoto(matchId: number, file: File, caption?: string): Promise<MatchPhoto> {
    const form = new FormData();
    form.append('file', file);
    if (caption) form.append('caption', caption);
    const { data } = await api.post(`/sports/matches/${matchId}/photos`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async togglePhotoLike(matchId: number, photoId: number): Promise<void> {
    await api.post(`/sports/matches/${matchId}/photos/${photoId}/like`);
  },

  async deleteMatchPhoto(matchId: number, photoId: number): Promise<void> {
    await api.delete(`/sports/matches/${matchId}/photos/${photoId}`);
  },

  // ── Peer Ratings ───────────────────────────────────────────────
  async getMatchRatings(matchId: number): Promise<MatchRatingSummary> {
    const { data } = await api.get(`/sports/matches/${matchId}/ratings`);
    return data;
  },

  async submitRatings(
    matchId: number,
    ratings: { playerId: number; stars: number; reaction?: string; isManOfMatch: boolean }[],
  ): Promise<void> {
    await api.post(`/sports/matches/${matchId}/ratings`, { ratings });
  },
};
