import { useState, useRef, useEffect } from "react";
import {
  Phone,
  Video,
  Info,
  Paperclip,
  Image,
  Smile,
  Send,
  CheckCheck,
  Check,
  ShieldCheck,
  CalendarCheck,
  MapPin,
  ClipboardList,
  ArrowLeft,
} from "lucide-react";
import type { Message, Conversation } from "./chatData";

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  onToggleDetails: () => void;
  onBack?: () => void;
  onSendMessage?: (text: string) => void;
  forceShowBack?: boolean;
  isTyping?: boolean;
}

/** Maps system card icon names to Lucide components */
function SystemIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    CalendarCheck: <CalendarCheck className="h-5 w-5" />,
    MapPin: <MapPin className="h-5 w-5" />,
    ClipboardList: <ClipboardList className="h-5 w-5" />,
  };
  return <>{icons[name] ?? <CalendarCheck className="h-5 w-5" />}</>;
}

export function ChatWindow({
  conversation,
  messages,
  onToggleDetails,
  onBack,
  onSendMessage,
  forceShowBack,
  isTyping,
}: ChatWindowProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
    onSendMessage?.(text);
    setInputValue("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Empty state
  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background/50 text-muted-foreground">
        <div
          className="h-20 w-20 rounded-2xl flex items-center justify-center mb-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%)",
            border: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          <Send className="h-8 w-8 text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Your Messages
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs text-center">
          Select a conversation to start chatting with your community members.
        </p>
      </div>
    );
  }

  const { contact } = conversation;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background/30">
      {/* ── Chat Header ── */}
      <header className="h-16 flex items-center justify-between px-4 chat-glass-header z-10 shrink-0">
        <div className="flex items-center gap-3">
          {/* Back button for mobile */}
          {onBack && (
            <button
              onClick={onBack}
              className={`${
                forceShowBack ? "" : "md:hidden"
              } p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors`}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          <div className="relative">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: contact.avatarColor }}
            >
              {contact.avatarInitials}
            </div>
            {contact.isOnline && (
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-400 rounded-full border-2 border-[#16163a] online-dot" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-semibold text-foreground">
                {contact.name}
              </h4>
              {contact.isVerified && (
                <ShieldCheck className="h-4 w-4 text-indigo-400" />
              )}
            </div>
            <p
              className={`text-[11px] font-medium ${
                contact.isOnline ? "text-emerald-400" : "text-muted-foreground"
              }`}
            >
              {contact.isOnline ? "Online now" : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            disabled 
            className="p-2 text-muted-foreground/40 cursor-not-allowed rounded-xl transition-all"
            title="Voice call is currently disabled"
          >
            <Phone className="h-4.5 w-4.5" />
          </button>
          <button 
            disabled 
            className="p-2 text-muted-foreground/40 cursor-not-allowed rounded-xl transition-all"
            title="Video call is currently disabled"
          >
            <Video className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={onToggleDetails}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-xl transition-all"
          >
            <Info className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 lg:px-6 lg:pb-6 lg:pt-3 space-y-4 chat-scrollbar">
        {/* Date divider */}
        <div className="flex justify-center -mt-1 lg:-mt-1.5">
          <span
            className="px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider text-muted-foreground/80 uppercase"
            style={{
              background: "var(--chat-divider-bg)",
              border: "1px solid var(--chat-divider-border)",
            }}
          >
            TODAY
          </span>
        </div>

        {messages.map((msg) => {
          if (msg.type === "system" && msg.systemCard) {
            return (
              <div key={msg.id} className="flex justify-center msg-system">
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl max-w-md w-full"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)",
                    border: "1px solid rgba(99,102,241,0.2)",
                  }}
                >
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-indigo-300 shrink-0"
                    style={{ background: "rgba(99,102,241,0.15)" }}
                  >
                    <SystemIcon name={msg.systemCard.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {msg.systemCard.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {msg.systemCard.subtitle}
                    </p>
                  </div>
                  <button
                    className="text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 transition-all hover:scale-105 active:scale-95"
                    style={{
                      color: "#818cf8",
                      background: "rgba(99,102,241,0.12)",
                      border: "1px solid rgba(99,102,241,0.25)",
                    }}
                  >
                    {msg.systemCard.actionLabel}
                  </button>
                </div>
              </div>
            );
          }

          if (msg.type === "received") {
            return (
              <div
                key={msg.id}
                className="flex gap-2.5 max-w-[80%] msg-received"
              >
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold self-end shrink-0"
                  style={{ background: contact.avatarColor }}
                >
                  {contact.avatarInitials}
                </div>
                <div
                  className="msg-bubble px-3.5 py-2.5 rounded-2xl rounded-bl-none"
                  style={{
                    background: "var(--chat-bubble-received-bg)",
                    border: "1px solid var(--chat-bubble-received-border)",
                  }}
                >
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {msg.content}
                  </p>
                  <span className="text-[10px] text-muted-foreground/60 mt-1 block text-right">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          }

          // Sent message
          return (
            <div
              key={msg.id}
              className="flex flex-row-reverse gap-2.5 max-w-[80%] ml-auto msg-sent"
            >
              <div
                className="msg-bubble px-3.5 py-2.5 rounded-2xl rounded-br-none shadow-lg"
                style={{
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
                  boxShadow: "0 4px 15px rgba(99,102,241,0.25)",
                }}
              >
                <p className="text-sm text-white leading-relaxed">
                  {msg.content}
                </p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] text-white/60">
                    {msg.timestamp}
                  </span>
                  {msg.isRead ? (
                    <CheckCheck className="h-3.5 w-3.5 text-cyan-300" />
                  ) : (
                    <Check className="h-3.5 w-3.5 text-white/50" />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-2.5 max-w-[80%] msg-received animate-pulse">
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold self-end shrink-0"
              style={{ background: contact.avatarColor }}
            >
              {contact.avatarInitials}
            </div>
            <div
              className="msg-bubble px-3.5 py-3 rounded-2xl rounded-bl-none flex items-center gap-1"
              style={{
                background: "var(--chat-bubble-received-bg)",
                border: "1px solid var(--chat-bubble-received-border)",
              }}
            >
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Area ── */}
      <footer className="p-3 shrink-0 border-t border-border" style={{ background: "var(--chat-header-bg)" }}>
        <div
          className="flex items-center gap-2 rounded-2xl px-2 py-1.5 chat-input-bar transition-all"
          style={{
            background: "var(--chat-input-bg)",
            border: "1px solid var(--chat-input-border)",
          }}
        >
          <button className="p-2 text-muted-foreground hover:text-indigo-400 transition-colors rounded-lg hover:bg-muted/20">
            <Paperclip className="h-4.5 w-4.5" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-indigo-400 transition-colors rounded-lg hover:bg-muted/20">
            <Image className="h-4.5 w-4.5" />
          </button>

          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/50 py-1.5"
          />

          <button className="p-2 text-muted-foreground hover:text-indigo-400 transition-colors rounded-lg hover:bg-muted/20">
            <Smile className="h-4.5 w-4.5" />
          </button>

          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100"
            style={{
              background: inputValue.trim()
                ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                : "rgba(99,102,241,0.3)",
              boxShadow: inputValue.trim()
                ? "0 4px 15px rgba(99,102,241,0.35)"
                : "none",
            }}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
