export type FeedPostType = "SCORECARD" | "HIGHLIGHT" | "PHOTO" | "MILESTONE" | "DISCUSSION" | "MATCH_RESULT" | "TOURNAMENT_UPDATE";

export interface SportsFeedPost {
  id: string;
  type: FeedPostType;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  sport: string;
  title: string;
  content: string;
  mediaUrl?: string;
  matchId?: string;
  tournamentId?: string;
  scorecard?: FeedScorecard;
  likes: number;
  comments: number;
  shares: number;
  likedByMe: boolean;
  tags: string[];
  createdAt: string;
}

export interface FeedScorecard {
  teamA: string;
  teamB: string;
  scoreA: string;
  scoreB: string;
  result: string;
  venue: string;
  date: string;
  playerOfMatch?: string;
}

export interface FeedComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export type MatchmakingSkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PRO";

export interface MatchmakingProfile {
  playerId: string;
  playerName: string;
  avatar?: string;
  sports: MatchmakingSport[];
  location: string;
  locationCoords?: { lat: number; lng: number };
  bio?: string;
  matchesPlayed: number;
  rating: number;
  availability: string[];
  preferredTime: "MORNING" | "AFTERNOON" | "EVENING" | "FLEXIBLE";
  lastActive: string;
}

export interface MatchmakingSport {
  sport: string;
  skillLevel: MatchmakingSkillLevel;
  yearsPlaying: number;
  preferredPosition?: string;
}

export interface MatchmakingResult {
  player: MatchmakingProfile;
  matchScore: number;
  matchReasons: string[];
  distanceKm: number;
}

export interface SportsConversation {
  id: string;
  participantIds: string[];
  participants: ConversationParticipant[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  type: "DM" | "GROUP";
  groupName?: string;
  matchId?: string;
  tournamentId?: string;
}

export interface ConversationParticipant {
  playerId: string;
  playerName: string;
  avatar?: string;
  isOnline: boolean;
}

export interface SportsMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: "TEXT" | "SCORECARD" | "LOCATION" | "IMAGE";
  readBy: string[];
  createdAt: string;
}
