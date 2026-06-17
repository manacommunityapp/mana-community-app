import { useState } from "react";
import { Search, MessageSquarePlus, Store, Trophy, Users, X } from "lucide-react";
import { type Conversation } from "./chatData";
import { useChat } from "../../../contexts/ChatContext";

interface ConversationsListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onBack?: () => void;
  onStartChat?: (contactId: string) => void;
}

/** Renders the icon for group / icon-based conversations */
function ConvIcon({ icon, color }: { icon?: string; color: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    Store: <Store className="h-5 w-5" />,
    Trophy: <Trophy className="h-5 w-5" />,
    Users: <Users className="h-5 w-5" />,
  };

  return (
    <div
      className="h-12 w-12 rounded-full flex items-center justify-center text-white shrink-0"
      style={{ background: color }}
    >
      {icon && iconMap[icon] ? iconMap[icon] : <Users className="h-5 w-5" />}
    </div>
  );
}

export function ConversationsList({
  conversations,
  activeId,
  onSelect,
  onStartChat,
}: ConversationsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const { availableContacts } = useChat();

  const filtered = conversations.filter((c) =>
    c.contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-card border-r border-border relative">
      {/* Start New Chat Modal Overlay */}
      {showNewChatModal && (
        <div className="absolute inset-0 bg-background/98 z-50 flex flex-col p-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
            <h3 className="text-base font-bold text-foreground">Start New Chat</h3>
            <button
              onClick={() => setShowNewChatModal(false)}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-all"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 chat-scrollbar">
            {availableContacts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No members available</p>
              </div>
            )}
            {availableContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => {
                  onStartChat?.(contact.id);
                  setShowNewChatModal(false);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-all text-left cursor-pointer"
              >
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: contact.avatarColor }}
                >
                  {contact.avatarInitials}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{contact.name}</h4>
                  <p className="text-[11px] text-muted-foreground">{contact.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 space-y-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            Messages
          </h2>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              boxShadow: "0 4px 15px rgba(99,102,241,0.35)",
            }}
            title="New conversation"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto chat-scrollbar">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No conversations found</p>
          </div>
        )}

        {filtered.map((conv) => {
          const isActive = conv.id === activeId;
          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-200 cursor-pointer group ${
                isActive
                  ? "conv-active"
                  : "hover:bg-muted/30"
              }`}
            >
              {/* Avatar */}
              {conv.icon ? (
                <ConvIcon icon={conv.icon} color={conv.contact.avatarColor} />
              ) : (
                <div className="relative shrink-0">
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: conv.contact.avatarColor }}
                  >
                    {conv.contact.avatarInitials}
                  </div>
                  {conv.contact.isOnline && (
                    <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-emerald-400 rounded-full border-[2.5px] border-card online-dot" />
                  )}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3
                    className={`text-sm font-semibold truncate ${
                      isActive ? "text-white" : "text-foreground"
                    }`}
                  >
                    {conv.contact.name}
                  </h3>
                  <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                    {conv.lastMessageTime}
                  </span>
                </div>
                <p
                  className={`text-xs truncate mt-0.5 ${
                    conv.unreadCount > 0
                      ? "text-indigo-300 font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {conv.lastMessage}
                </p>
              </div>

              {/* Unread badge */}
              {conv.unreadCount > 0 && (
                <div
                  className="h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  }}
                >
                  {conv.unreadCount}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
