// ── Cricket Scorecard ──────────────────────────────────────────────────────
export interface BattingEntry {
  id:         number;
  playerId:   number;
  playerName: string;
  runs:       number;
  balls:      number;
  fours:      number;
  sixes:      number;
  strikeRate: number;
  dismissal:  string;   // "c Smith b Jones" | "not out" | "run out"
  isNotOut:   boolean;
  position:   number;
}

export interface BowlingEntry {
  id:         number;
  playerId:   number;
  playerName: string;
  overs:      number;
  maidens:    number;
  runs:       number;
  wickets:    number;
  economy:    number;
  wides:      number;
  noBalls:    number;
}

export interface Innings {
  id:              number;
  inningsNumber:   1 | 2;
  battingTeamId:   number;
  battingTeamName: string;
  totalRuns:       number;
  wickets:         number;
  overs:           string;
  extras:          number;
  batting:         BattingEntry[];
  bowling:         BowlingEntry[];
}

export interface CricketScorecard {
  matchId:        number;
  matchTitle:     string;
  firstInnings:   Innings;
  secondInnings?: Innings;
  result?:        string;
  manOfMatch?:    { playerId: number; playerName: string; contribution: string };
}

// ── Player Profile ─────────────────────────────────────────────────────────
export type SportType =
  | 'CRICKET' | 'FOOTBALL' | 'BADMINTON' | 'TABLE_TENNIS'
  | 'BASKETBALL' | 'VOLLEYBALL' | 'CHESS' | 'CARROM';

export interface SportStat {
  sport:           SportType;
  matchesPlayed:   number;
  wins:            number;
  losses:          number;
  draws:           number;
  winRate:         number;
  tournaments:     number;
  trophies:        number;
  // Cricket
  totalRuns?:      number;
  highestScore?:   number;
  battingAverage?: number;
  totalWickets?:   number;
  bestBowling?:    string;
  // Football
  goals?:          number;
  assists?:        number;
}

export interface PlayerProfile {
  userId:          number;
  name:            string;
  flatNo?:         string;
  profilePicUrl?:  string;
  sportStats:      SportStat[];
  badges:          Badge[];
  communityRating: number;
  ratingCount:     number;
  totalMatches:    number;
  totalTrophies:   number;
  recentMatches:   { matchId: number; result: string; sport: SportType; date: string }[];
}

// ── Badges ─────────────────────────────────────────────────────────────────
export interface Badge {
  id:          string;
  name:        string;
  description: string;
  emoji:       string;
  category:    'achievement' | 'milestone' | 'participation';
  earnedAt?:   string;
  isEarned:    boolean;
  rarity:      'common' | 'rare' | 'epic' | 'legendary';
}

// ── Leaderboard ────────────────────────────────────────────────────────────
export type LeaderboardCategory =
  | 'WINS' | 'RUNS' | 'WICKETS' | 'GOALS' | 'MATCHES_PLAYED' | 'TROPHIES' | 'RATING';

export type LeaderboardPeriod = 'MONTH' | 'SEASON' | 'ALL_TIME';

export interface LeaderboardEntry {
  rank:          number;
  userId:        number;
  name:          string;
  flatNo?:       string;
  value:         number;
  displayValue:  string;
  topBadge?:     Badge;
  isCurrentUser: boolean;
}

// ── Match Photos ───────────────────────────────────────────────────────────
export interface MatchPhoto {
  id:           number;
  matchId:      number;
  uploadedById: number;
  uploaderName: string;
  imageUrl:     string;
  caption?:     string;
  likeCount:    number;
  isLiked:      boolean;
  createdAt:    string;
}

// ── Peer Ratings ───────────────────────────────────────────────────────────
export type PlayerReaction =
  | 'BEST_PLAYER' | 'CLUTCH' | 'TEAM_PLAYER' | 'GOOD_SPORT' | 'CONSISTENT';

export interface RatingPlayer {
  playerId:      number;
  playerName:    string;
  flatNo?:       string;
  averageRating: number;
  ratingCount:   number;
  topReaction?:  PlayerReaction;
  isManOfMatch:  boolean;
}

export interface MatchRatingSummary {
  matchId:     number;
  canRate:     boolean;
  hasRated:    boolean;
  players:     RatingPlayer[];
  manOfMatch?: { playerId: number; playerName: string; voteCount: number };
}
