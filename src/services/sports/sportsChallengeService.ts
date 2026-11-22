import { apiClient } from "../common/apiClient";

export type SportType =
  | "BADMINTON"
  | "CRICKET"
  | "TABLE_TENNIS"
  | "TENNIS"
  | "FOOTBALL"
  | "BASKETBALL"
  | "VOLLEYBALL"
  | "SQUASH"
  | "CHESS"
  | "OTHER";

export type SportsChallengeStatus = "OPEN" | "ACCEPTED" | "COMPLETED" | "CANCELLED";

export interface SportsChallengeDto {
  id: number;
  title: string;
  sport: SportType;
  creatorId: number;
  creatorName: string;
  creatorFlat?: string;
  format: string; // e.g. "1v1 Friendly", "2v2 Doubles", "6v6 Box"
  venue?: string; // e.g. "Clubhouse Court 1"
  scheduledTime?: string; // e.g. "Today 6:30 PM", "Tomorrow 7:00 AM"
  status: SportsChallengeStatus;
  challengerName?: string;
  challengerFlat?: string;
  emoji?: string;
  color?: string;
  bg?: string;
}

export interface CreateSportsChallengeRequest {
  title: string;
  sport: SportType;
  format: string;
  venue?: string;
  scheduledTime?: string;
  notes?: string;
}

const DEFAULT_CHALLENGES: SportsChallengeDto[] = [
  {
    id: 1,
    title: "Badminton Men's Singles 1v1",
    sport: "BADMINTON",
    creatorId: 10,
    creatorName: "Vikram Mehta",
    creatorFlat: "Tower B - 804",
    format: "1v1 Friendly (Best of 3)",
    venue: "Clubhouse Court 1 (Indoor Wooden)",
    scheduledTime: "Today · 06:30 PM",
    status: "OPEN",
    emoji: "🏸",
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
  {
    id: 2,
    title: "Table Tennis Fast-Paced Rally",
    sport: "TABLE_TENNIS",
    creatorId: 11,
    creatorName: "Sneha Nair",
    creatorFlat: "Tower A - 302",
    format: "1v1 Casual 21-Points",
    venue: "TT Room Table 2",
    scheduledTime: "Tomorrow · 07:00 AM",
    status: "OPEN",
    emoji: "🏓",
    color: "#4F46E5",
    bg: "#EEF2FF",
  },
  {
    id: 3,
    title: "Box Cricket 6-a-side Friendly",
    sport: "CRICKET",
    creatorId: 12,
    creatorName: "Rahul Sharma",
    creatorFlat: "Tower D - 1201",
    format: "6v6 Box Cricket (8 Overs)",
    venue: "Sports Arena Turf Ground",
    scheduledTime: "Sunday · 08:00 AM",
    status: "ACCEPTED",
    challengerName: "Karthik Rajan",
    challengerFlat: "Tower C - 402",
    emoji: "🏏",
    color: "#2563EB",
    bg: "#EFF6FF",
  },
  {
    id: 4,
    title: "Lawn Tennis Evening Sets",
    sport: "TENNIS",
    creatorId: 13,
    creatorName: "Anil Kulkarni",
    creatorFlat: "Tower A - 1104",
    format: "1v1 Matchplay",
    venue: "Outdoor Tennis Court 1",
    scheduledTime: "Saturday · 05:30 PM",
    status: "OPEN",
    emoji: "🎾",
    color: "#059669",
    bg: "#ECFDF5",
  },
];

let sessionChallenges: SportsChallengeDto[] = [...DEFAULT_CHALLENGES];

export const sportsChallengeService = {
  async getChallenges(sport?: SportType): Promise<SportsChallengeDto[]> {
    try {
      const res = await apiClient.get<SportsChallengeDto[]>("/sports/challenges");
      if (Array.isArray(res) && res.length > 0) {
        return sport ? res.filter((c) => c.sport === sport) : res;
      }
    } catch {
      // Backend fallback
    }
    return sport
      ? sessionChallenges.filter((c) => c.sport === sport)
      : [...sessionChallenges];
  },

  async createChallenge(req: CreateSportsChallengeRequest): Promise<SportsChallengeDto> {
    const emojiMap: Record<string, { emoji: string; color: string; bg: string }> = {
      BADMINTON: { emoji: "🏸", color: "#7C3AED", bg: "#F5F3FF" },
      CRICKET: { emoji: "🏏", color: "#2563EB", bg: "#EFF6FF" },
      TABLE_TENNIS: { emoji: "🏓", color: "#4F46E5", bg: "#EEF2FF" },
      TENNIS: { emoji: "🎾", color: "#059669", bg: "#ECFDF5" },
      FOOTBALL: { emoji: "⚽", color: "#EA580C", bg: "#FFF7ED" },
      BASKETBALL: { emoji: "🏀", color: "#D97706", bg: "#FFFBEB" },
      VOLLEYBALL: { emoji: "🏐", color: "#0891B2", bg: "#ECFEFF" },
      SQUASH: { emoji: "🏸", color: "#0D9488", bg: "#F0FDFA" },
      CHESS: { emoji: "♟️", color: "#475569", bg: "#F8FAFC" },
    };

    const style = emojiMap[req.sport] || { emoji: "🏅", color: "#4F46E5", bg: "#EEF2FF" };

    const newChallenge: SportsChallengeDto = {
      id: Date.now(),
      title: req.title,
      sport: req.sport,
      creatorId: 1,
      creatorName: "You (Resident)",
      creatorFlat: "My Flat",
      format: req.format,
      venue: req.venue || "Clubhouse Arena",
      scheduledTime: req.scheduledTime || "Scheduled",
      status: "OPEN",
      emoji: style.emoji,
      color: style.color,
      bg: style.bg,
    };

    try {
      const res = await apiClient.post<SportsChallengeDto>("/sports/challenges", req);
      if (res && res.id) {
        sessionChallenges.unshift(res);
        return res;
      }
    } catch {
      // fallback
    }

    sessionChallenges.unshift(newChallenge);
    return newChallenge;
  },

  async acceptChallenge(
    id: number,
    challengerName: string,
    challengerFlat = "Resident"
  ): Promise<SportsChallengeDto> {
    try {
      const res = await apiClient.post<SportsChallengeDto>(`/sports/challenges/${id}/accept`, {
        challengerName,
        challengerFlat,
      });
      if (res && res.id) return res;
    } catch {
      // fallback
    }

    const idx = sessionChallenges.findIndex((c) => c.id === id);
    if (idx !== -1) {
      sessionChallenges[idx] = {
        ...sessionChallenges[idx],
        status: "ACCEPTED",
        challengerName,
        challengerFlat,
      };
      return sessionChallenges[idx];
    }
    throw new Error("Challenge not found");
  },
};
