import type {
  SportsFeedPost,
  FeedComment,
  MatchmakingProfile,
  MatchmakingResult,
  MatchmakingSkillLevel,
  SportsConversation,
  SportsMessage,
} from "../../types/sportsSocial";

const STORAGE_FEED = "mana_sports_feed_v1";
const STORAGE_COMMENTS = "mana_sports_feed_comments_v1";
const STORAGE_MATCHMAKING = "mana_sports_matchmaking_v1";
const STORAGE_CONVERSATIONS = "mana_sports_conversations_v1";
const STORAGE_MESSAGES = "mana_sports_messages_v1";

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveJson<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}
function genId(p: string) {
  return `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const SEED_FEED: SportsFeedPost[] = [
  {
    id: "fp-1",
    type: "SCORECARD",
    authorId: "p-1",
    authorName: "Ravi Kumar",
    sport: "CRICKET",
    title: "Weekend Box Cricket Result",
    content: "What a nail-biter! Whitefield Warriors defend 142 against Sarjapur Strikers by just 3 runs. Deepak Nair's 4-wicket haul was the turning point.",
    scorecard: {
      teamA: "Whitefield Warriors",
      teamB: "Sarjapur Strikers",
      scoreA: "142/6 (20 ov)",
      scoreB: "139/8 (20 ov)",
      result: "Whitefield Warriors won by 3 runs",
      venue: "SmashZone Arena, Whitefield",
      date: "2026-10-28",
      playerOfMatch: "Deepak Nair",
    },
    likes: 24,
    comments: 8,
    shares: 5,
    likedByMe: false,
    tags: ["cricket", "whitefield", "box-cricket"],
    createdAt: "2026-10-28T20:30:00Z",
  },
  {
    id: "fp-2",
    type: "MILESTONE",
    authorId: "p-6",
    authorName: "Deepak Nair",
    sport: "CRICKET",
    title: "100 Wickets Milestone!",
    content: "Completed 100 wickets in community cricket today! Started 2 years ago as a batsman who could bowl a bit. Thanks to everyone who believed in me.",
    likes: 56,
    comments: 15,
    shares: 12,
    likedByMe: true,
    tags: ["cricket", "milestone", "100-wickets"],
    createdAt: "2026-10-28T21:00:00Z",
  },
  {
    id: "fp-3",
    type: "MATCH_RESULT",
    authorId: "p-4",
    authorName: "Vikram Singh",
    sport: "FOOTBALL",
    title: "HSR FC 3 - 1 Koramangala United",
    content: "Dominant display from HSR FC! Vikram with a brace and Karthik sealing it in stoppage time. We move to the semis!",
    scorecard: {
      teamA: "HSR FC",
      teamB: "Koramangala United",
      scoreA: "3",
      scoreB: "1",
      result: "HSR FC won 3-1",
      venue: "HSR Sports Ground",
      date: "2026-10-27",
    },
    likes: 18,
    comments: 6,
    shares: 3,
    likedByMe: false,
    tags: ["football", "hsr", "semis"],
    createdAt: "2026-10-27T19:00:00Z",
  },
  {
    id: "fp-4",
    type: "TOURNAMENT_UPDATE",
    authorId: "p-admin",
    authorName: "Mana Sports Admin",
    sport: "BADMINTON",
    title: "Whitefield Premier Badminton League - Registrations Open!",
    content: "16-team tournament starting Nov 15. Entry fee ₹4,500 per team. Prize pool ₹35,000. Register your team before Nov 10!",
    tournamentId: "t-301",
    likes: 32,
    comments: 11,
    shares: 22,
    likedByMe: false,
    tags: ["badminton", "tournament", "whitefield", "registration"],
    createdAt: "2026-10-26T10:00:00Z",
  },
  {
    id: "fp-5",
    type: "DISCUSSION",
    authorId: "p-3",
    authorName: "Anitha Reddy",
    sport: "CRICKET",
    title: "Best venues for night cricket in Bangalore?",
    content: "Looking for floodlit cricket grounds near Whitefield/Sarjapur that are available after 7 PM on weekdays. Any recommendations from the community?",
    likes: 9,
    comments: 14,
    shares: 2,
    likedByMe: false,
    tags: ["cricket", "venues", "bangalore", "night-cricket"],
    createdAt: "2026-10-25T18:30:00Z",
  },
  {
    id: "fp-6",
    type: "PHOTO",
    authorId: "p-7",
    authorName: "Karthik M",
    sport: "FOOTBALL",
    title: "Team photo after the semi-final win!",
    content: "HSR FC celebrating after clinching the semi-final spot. Next stop: finals! Big thanks to everyone who came out to support.",
    likes: 41,
    comments: 7,
    shares: 8,
    likedByMe: true,
    tags: ["football", "team-photo", "celebration"],
    createdAt: "2026-10-27T20:00:00Z",
  },
  {
    id: "fp-7",
    type: "HIGHLIGHT",
    authorId: "p-2",
    authorName: "Suresh Babu",
    sport: "CRICKET",
    title: "Six over long-on to win the match!",
    content: "Last ball, 6 needed, and Ravi Kumar launched it over long-on! The crowd went absolutely crazy. This is why we play weekend cricket.",
    matchId: "m-101",
    likes: 67,
    comments: 19,
    shares: 15,
    likedByMe: false,
    tags: ["cricket", "highlight", "last-ball", "six"],
    createdAt: "2026-10-28T20:45:00Z",
  },
];

const SEED_COMMENTS: FeedComment[] = [
  { id: "fc-1", postId: "fp-1", authorId: "p-2", authorName: "Suresh Babu", content: "What a game! Deepak was unplayable today.", createdAt: "2026-10-28T20:35:00Z" },
  { id: "fc-2", postId: "fp-1", authorId: "p-5", authorName: "Priya Sharma", content: "That last over was heart-stopping!", createdAt: "2026-10-28T20:40:00Z" },
  { id: "fc-3", postId: "fp-2", authorId: "p-1", authorName: "Ravi Kumar", content: "Congrats Deepak! Well deserved milestone.", createdAt: "2026-10-28T21:05:00Z" },
  { id: "fc-4", postId: "fp-5", authorId: "p-9", authorName: "Mohammed Irfan", content: "Try SmashZone Arena, they have floodlights and late slots.", createdAt: "2026-10-25T19:00:00Z" },
  { id: "fc-5", postId: "fp-5", authorId: "p-11", authorName: "Arun Prasad", content: "Apex Sports Arena in Sarjapur is open till 11 PM.", createdAt: "2026-10-25T19:30:00Z" },
  { id: "fc-6", postId: "fp-7", authorId: "p-6", authorName: "Deepak Nair", content: "I was bowling that over. Still can't believe he hit it that far 😂", createdAt: "2026-10-28T20:50:00Z" },
];

const SEED_MATCHMAKING: MatchmakingProfile[] = [
  {
    playerId: "mm-1",
    playerName: "Arjun Desai",
    sports: [
      { sport: "CRICKET", skillLevel: "ADVANCED", yearsPlaying: 8, preferredPosition: "All-rounder" },
      { sport: "BADMINTON", skillLevel: "INTERMEDIATE", yearsPlaying: 3 },
    ],
    location: "Whitefield, Bangalore",
    locationCoords: { lat: 12.9698, lng: 77.7500 },
    bio: "Weekend warrior. Love competitive cricket and casual badminton.",
    matchesPlayed: 89,
    rating: 4.5,
    availability: ["Saturday", "Sunday"],
    preferredTime: "MORNING",
    lastActive: "2026-10-31T08:00:00Z",
  },
  {
    playerId: "mm-2",
    playerName: "Nisha Patel",
    sports: [
      { sport: "BADMINTON", skillLevel: "ADVANCED", yearsPlaying: 6, preferredPosition: "Singles" },
      { sport: "TABLE_TENNIS", skillLevel: "INTERMEDIATE", yearsPlaying: 4 },
    ],
    location: "Marathahalli, Bangalore",
    locationCoords: { lat: 12.9591, lng: 77.6974 },
    bio: "State-level badminton player turned community coach. Always up for a game.",
    matchesPlayed: 124,
    rating: 4.8,
    availability: ["Monday", "Wednesday", "Friday", "Saturday"],
    preferredTime: "EVENING",
    lastActive: "2026-10-31T18:00:00Z",
  },
  {
    playerId: "mm-3",
    playerName: "Rohit Menon",
    sports: [
      { sport: "FOOTBALL", skillLevel: "INTERMEDIATE", yearsPlaying: 5, preferredPosition: "Midfielder" },
      { sport: "CRICKET", skillLevel: "BEGINNER", yearsPlaying: 1 },
    ],
    location: "HSR Layout, Bangalore",
    locationCoords: { lat: 12.9116, lng: 77.6389 },
    bio: "Football first, everything else second. Looking for regular pickup games.",
    matchesPlayed: 65,
    rating: 4.2,
    availability: ["Saturday", "Sunday"],
    preferredTime: "AFTERNOON",
    lastActive: "2026-10-30T14:00:00Z",
  },
  {
    playerId: "mm-4",
    playerName: "Kavya Sundaram",
    sports: [
      { sport: "CRICKET", skillLevel: "INTERMEDIATE", yearsPlaying: 4, preferredPosition: "Batter" },
      { sport: "VOLLEYBALL", skillLevel: "ADVANCED", yearsPlaying: 7 },
    ],
    location: "Sarjapur Road, Bangalore",
    locationCoords: { lat: 12.9100, lng: 77.6800 },
    bio: "Captain of our apartment volleyball team. Getting into cricket now.",
    matchesPlayed: 42,
    rating: 4.3,
    availability: ["Wednesday", "Saturday", "Sunday"],
    preferredTime: "MORNING",
    lastActive: "2026-10-31T07:00:00Z",
  },
  {
    playerId: "mm-5",
    playerName: "Tarun Reddy",
    sports: [
      { sport: "CRICKET", skillLevel: "PRO", yearsPlaying: 15, preferredPosition: "Fast bowler" },
    ],
    location: "Whitefield, Bangalore",
    locationCoords: { lat: 12.9698, lng: 77.7500 },
    bio: "Former district-level fast bowler. Now coaching and playing community tournaments.",
    matchesPlayed: 210,
    rating: 4.9,
    availability: ["Saturday", "Sunday"],
    preferredTime: "MORNING",
    lastActive: "2026-10-31T06:30:00Z",
  },
  {
    playerId: "mm-6",
    playerName: "Sneha Gowda",
    sports: [
      { sport: "BADMINTON", skillLevel: "BEGINNER", yearsPlaying: 1 },
      { sport: "SWIMMING", skillLevel: "ADVANCED", yearsPlaying: 10 },
    ],
    location: "Bellandur, Bangalore",
    locationCoords: { lat: 12.9260, lng: 77.6762 },
    bio: "Swimmer by training, picking up racquet sports. Looking for patient practice partners!",
    matchesPlayed: 12,
    rating: 4.0,
    availability: ["Monday", "Thursday", "Saturday"],
    preferredTime: "EVENING",
    lastActive: "2026-10-30T19:00:00Z",
  },
  {
    playerId: "mm-7",
    playerName: "Imran Khan",
    sports: [
      { sport: "FOOTBALL", skillLevel: "ADVANCED", yearsPlaying: 10, preferredPosition: "Striker" },
      { sport: "CRICKET", skillLevel: "INTERMEDIATE", yearsPlaying: 6, preferredPosition: "Wicketkeeper" },
    ],
    location: "Koramangala, Bangalore",
    locationCoords: { lat: 12.9352, lng: 77.6245 },
    bio: "Play both football and cricket at competitive level. Up for any challenge.",
    matchesPlayed: 156,
    rating: 4.6,
    availability: ["Tuesday", "Thursday", "Saturday", "Sunday"],
    preferredTime: "FLEXIBLE",
    lastActive: "2026-10-31T12:00:00Z",
  },
  {
    playerId: "mm-8",
    playerName: "Lakshmi Narayan",
    sports: [
      { sport: "TABLE_TENNIS", skillLevel: "PRO", yearsPlaying: 12 },
      { sport: "CHESS", skillLevel: "ADVANCED", yearsPlaying: 8 },
    ],
    location: "Indiranagar, Bangalore",
    locationCoords: { lat: 12.9784, lng: 77.6408 },
    bio: "State TT champion. Also serious about chess. Looking for skilled opponents.",
    matchesPlayed: 198,
    rating: 4.9,
    availability: ["Monday", "Wednesday", "Friday"],
    preferredTime: "EVENING",
    lastActive: "2026-10-31T20:00:00Z",
  },
];

const SEED_CONVERSATIONS: SportsConversation[] = [
  {
    id: "conv-1",
    participantIds: ["me", "p-1"],
    participants: [
      { playerId: "me", playerName: "You", isOnline: true },
      { playerId: "p-1", playerName: "Ravi Kumar", isOnline: true },
    ],
    lastMessage: "Sure, see you at 7 AM at SmashZone!",
    lastMessageAt: "2026-10-31T22:15:00Z",
    unreadCount: 1,
    type: "DM",
  },
  {
    id: "conv-2",
    participantIds: ["me", "p-6"],
    participants: [
      { playerId: "me", playerName: "You", isOnline: true },
      { playerId: "p-6", playerName: "Deepak Nair", isOnline: false },
    ],
    lastMessage: "Congrats on the 100 wickets! 🎉",
    lastMessageAt: "2026-10-28T21:30:00Z",
    unreadCount: 0,
    type: "DM",
  },
  {
    id: "conv-3",
    participantIds: ["me", "p-1", "p-2", "p-4", "p-6", "p-7"],
    participants: [
      { playerId: "me", playerName: "You", isOnline: true },
      { playerId: "p-1", playerName: "Ravi Kumar", isOnline: true },
      { playerId: "p-2", playerName: "Suresh Babu", isOnline: false },
      { playerId: "p-4", playerName: "Vikram Singh", isOnline: true },
      { playerId: "p-6", playerName: "Deepak Nair", isOnline: false },
      { playerId: "p-7", playerName: "Karthik M", isOnline: true },
    ],
    lastMessage: "Match fee collected from everyone. We're all set for Saturday!",
    lastMessageAt: "2026-10-31T14:00:00Z",
    unreadCount: 3,
    type: "GROUP",
    groupName: "Whitefield Warriors Cricket",
    matchId: "m-110",
  },
  {
    id: "conv-4",
    participantIds: ["me", "p-3"],
    participants: [
      { playerId: "me", playerName: "You", isOnline: true },
      { playerId: "p-3", playerName: "Anitha Reddy", isOnline: false },
    ],
    lastMessage: "Found a great venue near Sarjapur. Want to check it out this weekend?",
    lastMessageAt: "2026-10-30T16:00:00Z",
    unreadCount: 0,
    type: "DM",
  },
];

const SEED_MESSAGES: SportsMessage[] = [
  { id: "msg-1", conversationId: "conv-1", senderId: "me", senderName: "You", content: "Hey Ravi, are we on for cricket this Saturday?", type: "TEXT", readBy: ["me", "p-1"], createdAt: "2026-10-31T22:00:00Z" },
  { id: "msg-2", conversationId: "conv-1", senderId: "p-1", senderName: "Ravi Kumar", content: "Yes! I've booked SmashZone for 7-9 AM.", type: "TEXT", readBy: ["p-1"], createdAt: "2026-10-31T22:05:00Z" },
  { id: "msg-3", conversationId: "conv-1", senderId: "me", senderName: "You", content: "Perfect. How many players confirmed?", type: "TEXT", readBy: ["me", "p-1"], createdAt: "2026-10-31T22:10:00Z" },
  { id: "msg-4", conversationId: "conv-1", senderId: "p-1", senderName: "Ravi Kumar", content: "Sure, see you at 7 AM at SmashZone!", type: "TEXT", readBy: ["p-1"], createdAt: "2026-10-31T22:15:00Z" },
  { id: "msg-5", conversationId: "conv-2", senderId: "me", senderName: "You", content: "Congrats on the 100 wickets! 🎉", type: "TEXT", readBy: ["me", "p-6"], createdAt: "2026-10-28T21:30:00Z" },
  { id: "msg-6", conversationId: "conv-2", senderId: "p-6", senderName: "Deepak Nair", content: "Thanks! Couldn't have done it without the team.", type: "TEXT", readBy: ["me", "p-6"], createdAt: "2026-10-28T21:35:00Z" },
  { id: "msg-7", conversationId: "conv-3", senderId: "p-1", senderName: "Ravi Kumar", content: "Team, Saturday match confirmed. Venue booked.", type: "TEXT", readBy: ["me", "p-1", "p-2", "p-4"], createdAt: "2026-10-31T10:00:00Z" },
  { id: "msg-8", conversationId: "conv-3", senderId: "p-4", senderName: "Vikram Singh", content: "I'll bring the kit bag this time.", type: "TEXT", readBy: ["p-4", "p-1"], createdAt: "2026-10-31T10:30:00Z" },
  { id: "msg-9", conversationId: "conv-3", senderId: "p-7", senderName: "Karthik M", content: "Match fee collected from everyone. We're all set for Saturday!", type: "TEXT", readBy: ["p-7"], createdAt: "2026-10-31T14:00:00Z" },
];

export const sportsSocialService = {
  // ── Feed ──
  getFeed(sport?: string): SportsFeedPost[] {
    const posts = loadJson(STORAGE_FEED, SEED_FEED);
    if (!sport || sport === "ALL") return posts;
    return posts.filter((p) => p.sport === sport);
  },

  likePost(postId: string): SportsFeedPost | undefined {
    const posts = loadJson(STORAGE_FEED, SEED_FEED);
    const post = posts.find((p) => p.id === postId);
    if (!post) return undefined;
    if (post.likedByMe) {
      post.likes--;
      post.likedByMe = false;
    } else {
      post.likes++;
      post.likedByMe = true;
    }
    saveJson(STORAGE_FEED, posts);
    return post;
  },

  sharePost(postId: string): SportsFeedPost | undefined {
    const posts = loadJson(STORAGE_FEED, SEED_FEED);
    const post = posts.find((p) => p.id === postId);
    if (!post) return undefined;
    post.shares++;
    saveJson(STORAGE_FEED, posts);
    return post;
  },

  createPost(data: Omit<SportsFeedPost, "id" | "likes" | "comments" | "shares" | "likedByMe" | "createdAt">): SportsFeedPost {
    const posts = loadJson(STORAGE_FEED, SEED_FEED);
    const post: SportsFeedPost = {
      ...data,
      id: genId("fp"),
      likes: 0,
      comments: 0,
      shares: 0,
      likedByMe: false,
      createdAt: new Date().toISOString(),
    };
    posts.unshift(post);
    saveJson(STORAGE_FEED, posts);
    return post;
  },

  getComments(postId: string): FeedComment[] {
    return loadJson(STORAGE_COMMENTS, SEED_COMMENTS).filter((c: FeedComment) => c.postId === postId);
  },

  addComment(postId: string, authorId: string, authorName: string, content: string): FeedComment {
    const comments = loadJson(STORAGE_COMMENTS, SEED_COMMENTS);
    const comment: FeedComment = { id: genId("fc"), postId, authorId, authorName, content, createdAt: new Date().toISOString() };
    comments.push(comment);
    saveJson(STORAGE_COMMENTS, comments);
    const posts = loadJson(STORAGE_FEED, SEED_FEED);
    const post = posts.find((p: SportsFeedPost) => p.id === postId);
    if (post) {
      post.comments++;
      saveJson(STORAGE_FEED, posts);
    }
    return comment;
  },

  // ── Matchmaking ──
  getProfiles(filters?: { sport?: string; skillLevel?: MatchmakingSkillLevel; preferredTime?: string }): MatchmakingProfile[] {
    const profiles = loadJson(STORAGE_MATCHMAKING, SEED_MATCHMAKING);
    if (!filters) return profiles;
    return profiles.filter((p: MatchmakingProfile) => {
      if (filters.sport && !p.sports.some((s) => s.sport === filters.sport)) return false;
      if (filters.skillLevel && !p.sports.some((s) => s.skillLevel === filters.skillLevel)) return false;
      if (filters.preferredTime && p.preferredTime !== filters.preferredTime && p.preferredTime !== "FLEXIBLE") return false;
      return true;
    });
  },

  findMatches(mySport: string, mySkillLevel: MatchmakingSkillLevel): MatchmakingResult[] {
    const profiles = loadJson(STORAGE_MATCHMAKING, SEED_MATCHMAKING);
    return profiles
      .filter((p: MatchmakingProfile) => p.sports.some((s) => s.sport === mySport))
      .map((p: MatchmakingProfile) => {
        const sportMatch = p.sports.find((s) => s.sport === mySport)!;
        const skillLevels: MatchmakingSkillLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "PRO"];
        const myIdx = skillLevels.indexOf(mySkillLevel);
        const theirIdx = skillLevels.indexOf(sportMatch.skillLevel);
        const skillDiff = Math.abs(myIdx - theirIdx);
        const skillScore = skillDiff === 0 ? 100 : skillDiff === 1 ? 75 : skillDiff === 2 ? 40 : 20;
        const ratingScore = p.rating * 20;
        const activeScore = (Date.now() - new Date(p.lastActive).getTime()) < 86400000 * 2 ? 20 : 5;
        const matchScore = Math.round(skillScore * 0.5 + ratingScore * 0.3 + activeScore * 0.2);
        const reasons: string[] = [];
        if (skillDiff === 0) reasons.push("Same skill level");
        else if (skillDiff === 1) reasons.push("Close skill level");
        if (p.rating >= 4.5) reasons.push("Highly rated");
        if (activeScore > 10) reasons.push("Recently active");
        if (p.availability.includes("Saturday") || p.availability.includes("Sunday")) reasons.push("Weekend available");
        return { player: p, matchScore, matchReasons: reasons, distanceKm: Math.round(Math.random() * 12 + 1) };
      })
      .sort((a: MatchmakingResult, b: MatchmakingResult) => b.matchScore - a.matchScore);
  },

  // ── Messaging ──
  getConversations(): SportsConversation[] {
    return loadJson(STORAGE_CONVERSATIONS, SEED_CONVERSATIONS);
  },

  getMessages(conversationId: string): SportsMessage[] {
    return loadJson(STORAGE_MESSAGES, SEED_MESSAGES).filter((m: SportsMessage) => m.conversationId === conversationId);
  },

  sendMessage(conversationId: string, content: string): SportsMessage {
    const messages = loadJson(STORAGE_MESSAGES, SEED_MESSAGES);
    const msg: SportsMessage = {
      id: genId("msg"),
      conversationId,
      senderId: "me",
      senderName: "You",
      content,
      type: "TEXT",
      readBy: ["me"],
      createdAt: new Date().toISOString(),
    };
    messages.push(msg);
    saveJson(STORAGE_MESSAGES, messages);
    const convs = loadJson(STORAGE_CONVERSATIONS, SEED_CONVERSATIONS);
    const conv = convs.find((c: SportsConversation) => c.id === conversationId);
    if (conv) {
      conv.lastMessage = content;
      conv.lastMessageAt = msg.createdAt;
      saveJson(STORAGE_CONVERSATIONS, convs);
    }
    return msg;
  },

  markRead(conversationId: string) {
    const convs = loadJson(STORAGE_CONVERSATIONS, SEED_CONVERSATIONS);
    const conv = convs.find((c: SportsConversation) => c.id === conversationId);
    if (conv) {
      conv.unreadCount = 0;
      saveJson(STORAGE_CONVERSATIONS, convs);
    }
  },
};
