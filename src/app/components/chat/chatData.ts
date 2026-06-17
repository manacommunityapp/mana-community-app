// ─── Chat Mock Data & TypeScript Interfaces ────────────────────────────────

export interface Contact {
  id: string;
  name: string;
  role: string;
  avatarInitials: string;
  avatarColor: string;
  isOnline: boolean;
  isVerified: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  type: "sent" | "received" | "system";
  content: string;
  timestamp: string;
  isRead?: boolean;
  /** For system messages — an embedded card */
  systemCard?: {
    icon: string;
    title: string;
    subtitle: string;
    actionLabel: string;
  };
}

export interface Conversation {
  id: string;
  contact: Contact;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  /** Icon name (lucide) for group/non-person chats */
  icon?: string;
  isGroup?: boolean;
}

// ─── Contacts ───────────────────────────────────────────────────────────────

export const contacts: Record<string, Contact> = {
  jordan: {
    id: "jordan",
    name: "Jordan Miller",
    role: "High-Performance Athlete",
    avatarInitials: "JM",
    avatarColor: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    isOnline: true,
    isVerified: true,
  },
  marketplace: {
    id: "marketplace",
    name: "Marketplace: Mac Pro M2",
    role: "Marketplace Listing",
    avatarInitials: "MP",
    avatarColor: "linear-gradient(135deg, #06b6d4, #0891b2)",
    isOnline: false,
    isVerified: false,
  },
  sarah: {
    id: "sarah",
    name: "Sarah Thompson",
    role: "Community Organizer",
    avatarInitials: "ST",
    avatarColor: "linear-gradient(135deg, #f59e0b, #d97706)",
    isOnline: false,
    isVerified: true,
  },
  sportsHub: {
    id: "sportsHub",
    name: "Elite Sports Hub",
    role: "Sports Channel",
    avatarInitials: "ES",
    avatarColor: "linear-gradient(135deg, #10b981, #059669)",
    isOnline: true,
    isVerified: true,
  },
  priya: {
    id: "priya",
    name: "Priya Sharma",
    role: "Fitness Trainer",
    avatarInitials: "PS",
    avatarColor: "linear-gradient(135deg, #ec4899, #db2777)",
    isOnline: true,
    isVerified: false,
  },
  alex: {
    id: "alex",
    name: "Alex Chen",
    role: "Team Captain",
    avatarInitials: "AC",
    avatarColor: "linear-gradient(135deg, #f97316, #ea580c)",
    isOnline: false,
    isVerified: true,
  },
};

// ─── Conversations ──────────────────────────────────────────────────────────

export const conversations: Conversation[] = [];

// ─── Messages per Conversation ──────────────────────────────────────────────

export const messages: Record<string, Message[]> = {};


// ─── Shared Media (placeholder thumbnails) ──────────────────────────────────

export const sharedMedia = [
  { id: "media1", color: "from-indigo-600 to-purple-700" },
  { id: "media2", color: "from-cyan-600 to-blue-700" },
  { id: "media3", color: "from-emerald-600 to-teal-700" },
  { id: "media4", color: "from-amber-600 to-orange-700" },
  { id: "media5", color: "from-pink-600 to-rose-700" },
  { id: "media6", color: "from-violet-600 to-fuchsia-700" },
];
