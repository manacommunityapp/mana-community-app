import { useState, useCallback } from "react";
import { sportsCricHeroesService } from "../services/sports/sportsCricHeroesService";
import type {
  CricHeroesPlayerProfile,
  PlayerRating,
  AutoBadge,
  PlayerTier,
} from "../types/sportsCricheroes";

interface UseSportsCricHeroesProfileResult {
  profile: CricHeroesPlayerProfile | null;
  rating: PlayerRating | null;
  loading: boolean;
  error: string | null;
  fetchProfile: (playerId: number) => Promise<void>;
  linkProfile: (playerId: number, url: string) => Promise<boolean>;
  previewUrl: (url: string) => Promise<CricHeroesPlayerProfile | null>;
  refreshProfile: (playerId: number) => Promise<void>;
  clearProfile: () => void;
}

export function useSportsCricHeroesProfile(): UseSportsCricHeroesProfileResult {
  const [profile, setProfile] = useState<CricHeroesPlayerProfile | null>(null);
  const [rating, setRating] = useState<PlayerRating | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (playerId: number) => {
    setLoading(true);
    setError(null);
    try {
      const [p, r] = await Promise.all([
        sportsCricHeroesService.getProfile(playerId),
        sportsCricHeroesService.getPlayerRating(playerId),
      ]);
      setProfile(p);
      setRating(r);
    } catch (err: any) {
      if (err?.message?.includes("404") || err?.message?.includes("not found")) {
        setProfile(null);
        setRating(null);
      } else {
        setError(err?.message || "Failed to load CricHeroes profile");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const linkProfile = useCallback(async (playerId: number, url: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await sportsCricHeroesService.linkProfile({ playerId, cricHeroesUrl: url });
      setProfile(result.profile);
      const r = await sportsCricHeroesService.getPlayerRating(playerId);
      setRating(r);
      return true;
    } catch (err: any) {
      setError(err?.message || "Failed to link profile");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const previewUrl = useCallback(async (url: string): Promise<CricHeroesPlayerProfile | null> => {
    setLoading(true);
    setError(null);
    try {
      return await sportsCricHeroesService.previewProfile(url);
    } catch (err: any) {
      setError(err?.message || "Invalid CricHeroes URL");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async (playerId: number) => {
    setLoading(true);
    setError(null);
    try {
      const p = await sportsCricHeroesService.refreshProfile(playerId);
      setProfile(p);
      const r = await sportsCricHeroesService.getPlayerRating(playerId);
      setRating(r);
    } catch (err: any) {
      setError(err?.message || "Failed to refresh profile");
    } finally {
      setLoading(false);
    }
  }, []);

  const clearProfile = useCallback(() => {
    setProfile(null);
    setRating(null);
    setError(null);
  }, []);

  return { profile, rating, loading, error, fetchProfile, linkProfile, previewUrl, refreshProfile, clearProfile };
}

export function computeLocalRating(profile: CricHeroesPlayerProfile): PlayerRating {
  const { batting, bowling, fielding, recentForm } = profile;

  let battingScore = 0;
  if (batting.matches > 0) {
    battingScore += Math.min(batting.average / 10, 3);
    battingScore += Math.min(batting.strikeRate / 50, 3);
    battingScore += Math.min(batting.runs / 500, 2);
    battingScore += (batting.fifties * 0.3 + batting.hundreds * 0.8);
  }
  battingScore = Math.min(battingScore, 10);

  let bowlingScore = 0;
  if (bowling.matches > 0) {
    bowlingScore += bowling.average > 0 ? Math.min(30 / bowling.average, 3) : 0;
    bowlingScore += bowling.economy > 0 ? Math.min(8 / bowling.economy, 3) : 0;
    bowlingScore += Math.min(bowling.wickets / 30, 2);
    bowlingScore += (bowling.threeWickets * 0.4 + bowling.fiveWickets * 1.0);
  }
  bowlingScore = Math.min(bowlingScore, 10);

  const fieldingScore = Math.min(
    (fielding.catches * 0.3 + fielding.stumpings * 0.5 + fielding.runOuts * 0.4),
    10
  );

  let formScore = 5;
  if (recentForm.length > 0) {
    const recentRuns = recentForm.filter(i => i.runs != null).map(i => i.runs!);
    if (recentRuns.length > 0) {
      const avg = recentRuns.reduce((a, b) => a + b, 0) / recentRuns.length;
      formScore = Math.min(avg / 8, 10);
    }
  }

  const totalMatches = Math.max(batting.matches, bowling.matches);
  const experienceScore = Math.min(totalMatches / 20, 10);

  const role = profile.bio.primaryRole;
  let overall: number;
  if (role === 'Batter') {
    overall = battingScore * 0.5 + bowlingScore * 0.1 + fieldingScore * 0.1 + formScore * 0.2 + experienceScore * 0.1;
  } else if (role === 'Bowler') {
    overall = battingScore * 0.1 + bowlingScore * 0.5 + fieldingScore * 0.1 + formScore * 0.2 + experienceScore * 0.1;
  } else if (role === 'All-Rounder') {
    overall = battingScore * 0.3 + bowlingScore * 0.3 + fieldingScore * 0.1 + formScore * 0.2 + experienceScore * 0.1;
  } else {
    overall = battingScore * 0.35 + bowlingScore * 0.1 + fieldingScore * 0.25 + formScore * 0.2 + experienceScore * 0.1;
  }
  overall = Math.round(overall * 10) / 10;

  const badges: AutoBadge[] = [];
  if (batting.strikeRate > 140) badges.push('POWER_HITTER');
  if (bowling.average > 0 && bowling.average < 15) badges.push('STRIKE_BOWLER');
  if (batting.runs > 300 && bowling.wickets > 15) badges.push('ALL_ROUNDER');
  if (batting.average > 35) badges.push('ANCHOR');
  if (bowling.economy > 0 && bowling.economy < 5) badges.push('ECONOMICAL');
  if (bowling.threeWickets >= 3) badges.push('WICKET_TAKER');

  let tier: PlayerTier;
  if (overall >= 8.5) tier = 'Icon';
  else if (overall >= 7.0) tier = 'Platinum';
  else if (overall >= 5.5) tier = 'Gold';
  else if (overall >= 4.0) tier = 'Silver';
  else tier = 'Bronze';

  const basePrices: Record<PlayerTier, number> = { Icon: 20000, Platinum: 15000, Gold: 10000, Silver: 5000, Bronze: 2000 };
  const suggestedBasePrice = basePrices[tier];

  return {
    overall,
    tier,
    badges,
    suggestedBasePrice,
    breakdown: {
      batting: Math.round(battingScore * 10) / 10,
      bowling: Math.round(bowlingScore * 10) / 10,
      fielding: Math.round(fieldingScore * 10) / 10,
      form: Math.round(formScore * 10) / 10,
      experience: Math.round(experienceScore * 10) / 10,
    },
  };
}
