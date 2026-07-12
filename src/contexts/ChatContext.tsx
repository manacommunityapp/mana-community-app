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
import { stompClient } from "../services/stompClient";
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
  ChatConversationEvent,
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
  /**
   * Fetch the conversation list + contacts. Called when the chat is opened
   * (the launcher button / the full Chat page) rather than eagerly on mount,
   * so the two GETs only fire when the user actually opens chat.
   */
  loadChatData: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

/**
 * Safety-net polling cadence. Real-time updates arrive over STOMP (see the
 * subscription effects below); this slow poll only covers a dropped socket.
 */
const POLL_INTERVAL_MS = 20000;

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
  // No eager mount fetch — data loads when chat is opened (see loadChatData).
  const [loading, setLoading] = useState(false);

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

  // On-demand load: conversations + contacts. Triggered when the user opens
  // chat (launcher button or full Chat page), not eagerly on mount.
  const loadChatData = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      await Promise.all([
        refreshConversations(),
        chatService
          .getContacts()
          .then((contacts) => setAvailableContacts(contacts.map(mapContact)))
          .catch(() => {
            // ignore — contacts are non-critical
          }),
      ]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, refreshConversations]);

  // Fallback poll — only does anything while the socket is DOWN. When STOMP is
  // connected this fires and immediately returns, so steady-state idle traffic
  // is zero; if the socket drops it recovers state within one interval.
  useEffect(() => {
    if (!currentUserId) return;
    const timer = setInterval(() => {
      if (stompClient.connected) return;
      refreshConversations();
      const active = activeConvRef.current;
      if (active) loadMessages(active);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [currentUserId, refreshConversations, loadMessages]);

  // On every (re)connect, fetch once to catch up on anything missed while the
  // socket was establishing or briefly down. Costs one GET per connect (rare).
  useEffect(() => {
    if (!currentUserId) return;
    const unsub = stompClient.onConnect(() => {
      refreshConversations();
      const active = activeConvRef.current;
      if (active) loadMessages(active);
    });
    return unsub;
  }, [currentUserId, refreshConversations, loadMessages]);

  // Append a message into a thread, de-duplicating by id. Both the optimistic
  // local echo and the STOMP broadcast of the same message flow through here.
  const appendMessage = useCallback((convId: string, msg: Message) => {
    setMessages((prev) => {
      const existing = prev[convId] ?? [];
      if (existing.some((m) => m.id === msg.id)) return prev;
      return { ...prev, [convId]: [...existing, msg] };
    });
  }, []);

  const clearUnread = useCallback((id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
    chatService.markRead(Number(id)).catch(() => {});
  }, []);

  // ── Real-time: update the conversation list in place on any new message. ──
  // No HTTP — the event carries last message + sender. Only a message in a
  // thread we don't have yet triggers a one-off refetch to materialise it.
  useEffect(() => {
    if (!currentUserId) return;
    const unsub = stompClient.subscribe(
      `/topic/chat-user/${currentUserId}`,
      (body) => {
        const evt = body as ChatConversationEvent;
        if (!evt || evt.conversationId == null) return;
        const convId = String(evt.conversationId);
        const fromSelf = String(evt.senderId) === currentUserId;

        setConversations((prev) => {
          if (!prev.some((c) => c.id === convId)) {
            refreshConversations(); // brand-new thread — fetch it once
            return prev;
          }
          const updated = prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  lastMessage: evt.lastMessage ?? c.lastMessage,
                  lastMessageTime: formatTime(evt.lastMessageAt),
                  unreadCount:
                    fromSelf || activeConvRef.current === convId
                      ? 0
                      : c.unreadCount + 1,
                }
              : c
          );
          // Float the just-updated thread to the top (matches server ordering).
          const idx = updated.findIndex((c) => c.id === convId);
          if (idx > 0) {
            const [row] = updated.splice(idx, 1);
            updated.unshift(row);
          }
          return updated;
        });
      }
    );
    return unsub;
  }, [currentUserId, refreshConversations]);

  // ── Real-time: stream messages for the conversation currently open. ──
  // Appends locally (deduped); unread is reset by the list handler above.
  useEffect(() => {
    if (!currentUserId || !activeConvId) return;
    const unsub = stompClient.subscribe(
      `/topic/conversation/${activeConvId}`,
      (body) => {
        const dto = body as ChatMessageDto;
        if (!dto || dto.id == null) return;
        appendMessage(activeConvId, mapMessage(dto, currentUserId));
        // Persist the read watermark while this thread is the active view.
        if (String(dto.senderId) !== currentUserId) {
          chatService.markRead(Number(activeConvId)).catch(() => {});
        }
      }
    );
    return unsub;
  }, [currentUserId, activeConvId, appendMessage]);

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
        appendMessage(convId, msg);
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
    [currentUserId, appendMessage]
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
        loadChatData,
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
