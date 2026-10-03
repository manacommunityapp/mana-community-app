// ── CricHeroes Integration Types ──────────────────────────────────────────

export type FormatScope = 'TENNIS' | 'LEATHER' | 'OVERALL';

export type BattingStyle = 'Right Hand Bat' | 'Left Hand Bat';

export type PrimaryRole = 'Batter' | 'Bowler' | 'All-Rounder' | 'Wicket Keeper';

export type PlayerTier = 'Icon' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze';

export type AutoBadge =
  | 'POWER_HITTER'
  | 'STRIKE_BOWLER'
  | 'ALL_ROUNDER'
  | 'ANCHOR'
  | 'ECONOMICAL'
  | 'WICKET_TAKER'
  | 'CONSISTENT';

export interface CricHeroesBio {
  fullName: string;
  avatarUrl?: string;
  battingStyle: BattingStyle | string;
  bowlingStyle: string;
  primaryRole: PrimaryRole;
}

export interface CricHeroesBatting {
  matches: number;
  innings: number;
  runs: number;
  highestScore: string;
  average: number;
  strikeRate: number;
  fifties: number;
  hundreds: number;
  fours: number;
  sixes: number;
  boundaryPercentage?: number;
  dotBallsFaced?: number;
}

export interface CricHeroesBowling {
  matches: number;
  innings: number;
  overs: number;
  wickets: number;
  economy: number;
  average: number;
  strikeRate: number;
  bestFigures: string;
  dotBallPercentage?: number;
  maidens: number;
  threeWickets: number;
  fiveWickets: number;
}

export interface CricHeroesFielding {
  catches: number;
  stumpings: number;
  runOuts: number;
}

export interface RecentInning {
  matchDate: string;
  runs?: number;
  balls?: number;
  wickets?: number;
  runsConceded?: number;
  overs?: number;
  opponent?: string;
  format?: string;
}

export interface CricHeroesPlayerProfile {
  cricheroesId: string;
  shareUrl: string;
  resolvedUrl?: string;
  verifiedAt: string;
  formatScope: FormatScope;
  bio: CricHeroesBio;
  batting: CricHeroesBatting;
  bowling: CricHeroesBowling;
  fielding: CricHeroesFielding;
  recentForm: RecentInning[];
  mvpPoints?: number;
  rating?: number;
}

export interface CricHeroesLinkRequest {
  playerId: number;
  cricHeroesUrl: string;
  formatScope?: FormatScope;
}

export interface CricHeroesLinkResponse {
  playerId: number;
  cricheroesId: string;
  resolvedUrl: string;
  profile: CricHeroesPlayerProfile;
  linkedAt: string;
}

export interface PlayerRating {
  overall: number;
  tier: PlayerTier;
  badges: AutoBadge[];
  suggestedBasePrice: number;
  breakdown: {
    batting: number;
    bowling: number;
    fielding: number;
    form: number;
    experience: number;
  };
}

export interface PlayerComparison {
  playerA: CricHeroesPlayerProfile;
  playerB: CricHeroesPlayerProfile;
  ratingA: PlayerRating;
  ratingB: PlayerRating;
}

export interface TeamComposition {
  teamId: number;
  totalPlayers: number;
  batters: number;
  bowlers: number;
  allRounders: number;
  wicketKeepers: number;
  leftHandBats: number;
  rightHandBats: number;
  pacers: number;
  spinners: number;
  totalRuns: number;
  totalWickets: number;
  avgBattingAverage: number;
  avgBowlingEconomy: number;
  avgStrikeRate: number;
  budgetSpent: number;
  budgetRemaining: number;
}

// ── Utility constants ─────────────────────────────────────────────────────

export const TIER_CONFIG: Record<PlayerTier, { min: number; color: string; label: string }> = {
  Icon:     { min: 8.5, color: '#e11d48', label: 'Icon Player' },
  Platinum: { min: 7.0, color: '#8b5cf6', label: 'Platinum' },
  Gold:     { min: 5.5, color: '#d4a017', label: 'Gold' },
  Silver:   { min: 4.0, color: '#94a3b8', label: 'Silver' },
  Bronze:   { min: 0,   color: '#b45309', label: 'Bronze' },
};

export const BADGE_CONFIG: Record<AutoBadge, { label: string; emoji: string; description: string }> = {
  POWER_HITTER:  { label: 'Power Hitter',  emoji: '💥', description: 'Strike Rate > 140' },
  STRIKE_BOWLER: { label: 'Strike Bowler',  emoji: '🎯', description: 'Bowling Avg < 15' },
  ALL_ROUNDER:   { label: 'All-Rounder',    emoji: '🌟', description: 'Runs > 300 & Wickets > 15' },
  ANCHOR:        { label: 'Anchor',         emoji: '⚓', description: 'Batting Avg > 35' },
  ECONOMICAL:    { label: 'Economical',     emoji: '🛡️', description: 'Economy < 5.0' },
  WICKET_TAKER:  { label: 'Wicket Taker',   emoji: '🔥', description: '3W+ hauls frequently' },
  CONSISTENT:    { label: 'Consistent',     emoji: '📊', description: 'Avg > 25 in last 10 innings' },
};
