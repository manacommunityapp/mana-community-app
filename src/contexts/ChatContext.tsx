import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { chatService } from "../services/chatService";
import { getStoredUser } from "../services/apiClient";
import {
  type Conversation,
  type Message,
  type Contact,
} from "../app/components/chat/chatData";
import type {
  ConversationDto,
  ChatMessageDto,
  ChatContactDto,
} from "../types/api";

interface ChatContextType {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  activeConvId: string | null;
  /** Community members the user can start a new chat with. */
  availableContacts: Contact[];
  /** Kept for API compatibility with the UI (server chat has no typing yet). */
  typingStates: Record<string, boolean>;
  loading: boolean;
  selectConversation: (id: string | null) => void;
  sendMessage: (text: string) => void;
  clearUnread: (id: string) => void;
  /** contactId is the backend user id (as a string). */
  startConversation: (contactId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

/** Live-refresh cadence for the conversations list + active thread. */
const POLL_INTERVAL_MS = 5000;

// ─── Mapping helpers (backend DTO → UI model) ──────────────────────────────

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #6366f1, #8b5cf6)",
  "linear-gradient(135deg, #06b6d4, #0891b2)",
  "linear-gradient(135deg, #f59e0b, #d97706)",
  "linear-gradient(135deg, #10b981, #059669)",
  "linear-gradient(135deg, #ec4899, #db2777)",
  "linear-gradient(135deg, #f97316, #ea580c)",
];

function colorFor(id: number): string {
  return AVATAR_GRADIENTS[Math.abs(id) % AVATAR_GRADIENTS.length];
}

function formatTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function mapContact(dto: ChatContactDto): Contact {
  return {
    id: String(dto.id),
    name: dto.name,
    role: dto.role,
    avatarInitials: dto.avatarInitials,
    avatarColor: colorFor(dto.id),
    isOnline: dto.isOnline,
    isVerified: dto.isVerified,
  };
}

function fallbackContact(dto: ConversationDto): Contact {
  const name = dto.title || "Group Chat";
  return {
    id: `conv-${dto.id}`,
    name,
    role: dto.isGroup ? "Group" : "",
    avatarInitials: name.slice(0, 2).toUpperCase(),
    avatarColor: colorFor(dto.id),
    isOnline: false,
    isVerified: false,
  };
}

function mapConversation(dto: ConversationDto): Conversation {
  return {
    id: String(dto.id),
    contact: dto.contact ? mapContact(dto.contact) : fallbackContact(dto),
    lastMessage: dto.lastMessage ?? "",
    lastMessageTime: formatTime(dto.lastMessageAt),
    unreadCount: dto.unreadCount ?? 0,
    isGroup: dto.isGroup,
  };
}

function mapMessage(dto: ChatMessageDto, currentUserId: string | null): Message {
  const type: Message["type"] =
    dto.type === "SYSTEM"
      ? "system"
      : String(dto.senderId) === currentUserId
        ? "sent"
        : "received";
  return {
    id: String(dto.id),
    conversationId: String(dto.conversationId),
    type,
    content: dto.content,
    timestamp: formatTime(dto.createdAt),
    isRead: true,
  };
}

// ─── Provider ──────────────────────────────────────────────────────────────

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUserId = getStoredUser()?.userId ?? null;
  // Track the active conversation inside callbacks/intervals without re-binding.
  const activeConvRef = useRef<string | null>(null);
  activeConvRef.current = activeConvId;

  const refreshConversations = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const data = await chatService.getConversations();
      setConversations(data.map(mapConversation));
    } catch {
      // transient — keep the last good list
    }
  }, [currentUserId]);

  const loadMessages = useCallback(
    async (convId: string) => {
      if (!currentUserId) return;
      try {
        const data = await chatService.getMessages(Number(convId));
        setMessages((prev) => ({
          ...prev,
          [convId]: data.map((m) => mapMessage(m, currentUserId)),
        }));
      } catch {
        // transient
      }
    },
    [currentUserId]
  );

  // Initial load: conversations + contacts.
  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      await refreshConversations();
      try {
        const contacts = await chatService.getContacts();
        if (!cancelled) setAvailableContacts(contacts.map(mapContact));
      } catch {
        // ignore
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUserId, refreshConversations]);

  // Lightweight polling for near-real-time updates.
  useEffect(() => {
    if (!currentUserId) return;
    const timer = setInterval(() => {
      refreshConversations();
      const active = activeConvRef.current;
      if (active) loadMessages(active);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [currentUserId, refreshConversations, loadMessages]);

  const clearUnread = useCallback((id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
    chatService.markRead(Number(id)).catch(() => {});
  }, []);

  const selectConversation = useCallback(
    (id: string | null) => {
      setActiveConvId(id);
      if (id) {
        loadMessages(id);
        clearUnread(id);
      }
    },
    [loadMessages, clearUnread]
  );

  const startConversation = useCallback(
    async (contactId: string) => {
      if (!currentUserId) return;
      try {
        const dto = await chatService.startDirect(Number(contactId));
        const conv = mapConversation(dto);
        setConversations((prev) =>
          prev.some((c) => c.id === conv.id) ? prev : [conv, ...prev]
        );
        setActiveConvId(conv.id);
        loadMessages(conv.id);
        clearUnread(conv.id);
      } catch {
        // ignore — could surface a toast here
      }
    },
    [currentUserId, loadMessages, clearUnread]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const convId = activeConvRef.current;
      if (!convId || !text.trim()) return;

      try {
        const dto = await chatService.sendMessage(Number(convId), text.trim());
        const msg = mapMessage(dto, currentUserId);
        setMessages((prev) => ({
          ...prev,
          [convId]: [...(prev[convId] ?? []), msg],
        }));
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? { ...c, lastMessage: msg.content, lastMessageTime: msg.timestamp }
              : c
          )
        );
      } catch {
        // ignore — message not sent
      }
    },
    [currentUserId]
  );

  return (
    <ChatContext.Provider
      value={{
        conversations,
        messages,
        activeConvId,
        availableContacts,
        typingStates: {},
        loading,
        selectConversation,
        sendMessage,
        clearUnread,
        startConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside a <ChatProvider>");
  return ctx;
}
