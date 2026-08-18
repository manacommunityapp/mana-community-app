import { useState, useRef, useEffect, useCallback } from "react";
import { getToken } from "../../../services/common/apiClient";

// ─── TYPES ──────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatApiResponse {
  conversationId: number | null;
  reply: string;
  timestamp: string;
}

interface ManaChatProps {
  /** Closes the surrounding panel (rendered as the header ✕). */
  onClose?: () => void;
  /** Auction context the assistant answers within. */
  auctionConfigId?: number;
}

// ─── CONFIG ─────────────────────────────────────────────────────────
const API_BASE = "/api/v1/chat";
const SUGGESTED_PROMPTS = [
  { icon: "🏏", text: "Show available bowlers", full: "Show me all available bowlers in the current auction" },
  { icon: "💰", text: "Check my budget", full: "What's my team's remaining budget?" },
  { icon: "📊", text: "Compare players", full: "Compare the top 3 all-rounders by stats" },
  { icon: "🏆", text: "Tournament overview", full: "Give me an overview of the current tournament — events, teams, and match schedule" },
];

/**
 * Mana AI auction assistant — embeddable chat content (no launcher/panel of its
 * own; it fills its parent container, e.g. the FloatingChatBot panel).
 */
export default function ManaChat({ onClose, auctionConfigId = 1 }: ManaChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  const authHeaders = (): HeadersInit => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken() ?? ""}`,
  });

  // ─── SEND MESSAGE (STREAMING with non-streaming fallback) ───────────
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };
    const assistantId = `assistant-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsLoading(true);

    const body = JSON.stringify({ message: text.trim(), conversationId, auctionConfigId });

    try {
      const response = await fetch(`${API_BASE}/stream`, { method: "POST", headers: authHeaders(), body });

      if (!response.ok || !response.body) {
        // Fallback to non-streaming
        const fallback = await fetch(API_BASE, { method: "POST", headers: authHeaders(), body });
        const data: ChatApiResponse = await fallback.json();
        if (data.conversationId) setConversationId(data.conversationId);
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: data.reply, isStreaming: false } : m))
        );
        return;
      }

      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: fullText } : m))
        );
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "I'm having trouble connecting. Please try again.", isStreaming: false }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, conversationId, auctionConfigId]);

  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ─── RENDER ─────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .mana-chat, .mana-chat * { box-sizing: border-box; }
        .mana-chat {
          height: 100%; width: 100%;
          display: flex; flex-direction: column;
          background: #F8F9FC;
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;
        }

        .mana-header {
          padding: 13px 16px;
          background: linear-gradient(135deg, #4F46E5, #6366F1 60%, #7C3AED);
          color: white;
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .mana-header-left { display: flex; align-items: center; gap: 10px; }
        .mana-header-avatar {
          width: 36px; height: 36px; border-radius: 12px;
          background: rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; box-shadow: 0 2px 8px rgba(0,0,0,0.2), 0 0 0 2px rgba(255,255,255,0.15);
          overflow: hidden; padding: 0;
        }
        .mana-header-info h3 { font-size: 14.5px; font-weight: 700; margin: 0; letter-spacing: -0.01em; }
        .mana-header-info .mana-status {
          font-size: 11px; opacity: 0.9; display: flex; align-items: center; gap: 5px; margin-top: 2px;
        }
        .mana-status-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #4ade80;
          box-shadow: 0 0 6px #4ade80; display: inline-block; flex-shrink: 0;
        }
        .mana-header-actions { display: flex; gap: 6px; }
        .mana-header-btn {
          background: rgba(255,255,255,0.15); border: none; color: white;
          width: 32px; height: 32px; border-radius: 9px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
        }
        .mana-header-btn:hover { background: rgba(255,255,255,0.28); }
        .mana-header-btn:active { transform: scale(0.93); }

        .mana-body {
          flex: 1; overflow-y: auto; padding: 14px 12px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .mana-body::-webkit-scrollbar { width: 4px; }
        .mana-body::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }

        .mana-welcome {
          text-align: center; padding: 16px 8px; margin: auto 0;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        .mana-welcome h4 { font-size: 16px; font-weight: 700; color: #1F2937; margin: 0; letter-spacing: -0.01em; }
        .mana-welcome p { font-size: 12.5px; color: #6B7280; line-height: 1.5; max-width: 270px; margin: 0; }

        .mana-prompts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; max-width: 340px; }
        .mana-prompt-btn {
          background: white; border: 1px solid #E5E7EB; border-radius: 12px; padding: 10px 11px;
          cursor: pointer; text-align: left; transition: all 0.2s; font-size: 12px; color: #374151;
          display: flex; align-items: center; gap: 8px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05); font-weight: 500;
        }
        .mana-prompt-btn:hover { border-color: #4F46E5; background: #EEF2FF; color: #4338CA; }
        .mana-prompt-btn:active { transform: scale(0.97); }
        .mana-prompt-btn > span { font-size: 15px; flex-shrink: 0; }

        .mana-msg { display: flex; gap: 7px; max-width: 92%; animation: manaMsgIn 0.25s ease; }
        .mana-msg.user { align-self: flex-end; flex-direction: row-reverse; }
        @keyframes manaMsgIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

        .mana-msg-avatar {
          width: 27px; height: 27px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 13px; margin-top: 2px;
        }
        .mana-msg.assistant .mana-msg-avatar { background: #EEF2FF; border: 1px solid #E0E7FF; }
        .mana-msg.user .mana-msg-avatar { background: #DBEAFE; border: 1px solid #BFDBFE; }

        .mana-msg-bubble {
          padding: 10px 13px; border-radius: 16px; font-size: 13.5px; line-height: 1.55;
          white-space: pre-wrap; word-break: break-word;
        }
        .mana-msg.assistant .mana-msg-bubble {
          background: white; color: #1F2937;
          border: 1px solid #E5E7EB; border-bottom-left-radius: 4px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .mana-msg.user .mana-msg-bubble {
          background: linear-gradient(135deg, #4F46E5, #6366F1); color: white;
          border-bottom-right-radius: 4px;
          box-shadow: 0 3px 10px rgba(99,102,241,0.3);
        }
        .mana-msg-time { font-size: 10px; color: #9CA3AF; margin-top: 3px; padding: 0 4px; }
        .mana-msg.user .mana-msg-time { text-align: right; }

        .mana-dots { display: inline-flex; gap: 4px; padding: 4px 0; }
        .mana-dots span { width: 6px; height: 6px; border-radius: 50%; background: #9CA3AF; animation: manaDotPulse 1.4s infinite; }
        .mana-dots span:nth-child(2) { animation-delay: 0.2s; }
        .mana-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes manaDotPulse { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

        .mana-input-area {
          padding: 10px 12px;
          padding-bottom: max(12px, env(safe-area-inset-bottom));
          border-top: 1px solid #E5E7EB;
          background: white;
          flex-shrink: 0;
        }
        .mana-input-row {
          display: flex; align-items: center; gap: 6px; background: #F3F4F6; border-radius: 26px;
          padding: 3px 3px 3px 14px; border: 2px solid transparent; transition: border-color 0.2s, background 0.2s;
        }
        .mana-input-row:focus-within { border-color: #4F46E5; background: white; }
        .mana-input-row input { flex: 1; border: none; background: transparent; outline: none; font-size: 13.5px; color: #1F2937; padding: 8px 0; min-width: 0; }
        .mana-input-row input::placeholder { color: #9CA3AF; }
        .mana-send-btn {
          width: 34px; height: 34px; border-radius: 50%; border: none;
          background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0;
        }
        .mana-send-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .mana-send-btn:not(:disabled):hover { transform: scale(1.08); }
        .mana-send-btn:not(:disabled):active { transform: scale(0.93); }
        .mana-send-btn svg { width: 16px; height: 16px; }
        .mana-disclaimer { text-align: center; font-size: 9.5px; color: #9CA3AF; padding: 5px 0 1px; letter-spacing: 0.01em; }
      `}</style>

      <div className="mana-chat">
        {/* ── Header ── */}
        <div className="mana-header">
          <div className="mana-header-left">
            <div className="mana-header-avatar">
              <img src="/ganesha-login-banner.jpg" alt="Mana AI" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div className="mana-header-info">
              <h3>Mana AI Assistant</h3>
              <div className="mana-status">
                {isLoading
                  ? <><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24", display: "inline-block" }} /> Thinking…</>
                  : <><span className="mana-status-dot" /> Online &amp; ready</>
                }
              </div>
            </div>
          </div>
          <div className="mana-header-actions">
            <button className="mana-header-btn" onClick={startNewChat} title="New conversation">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>
            </button>
            {onClose && (
              <button className="mana-header-btn" onClick={onClose} title="Close">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="mana-body">
          {messages.length === 0 ? (
            <div className="mana-welcome">
              <div style={{ width: 60, height: 60, borderRadius: 18, overflow: "hidden", boxShadow: "0 6px 20px rgba(245,158,11,0.3), 0 0 0 3px rgba(245,158,11,0.2)" }}>
                <img src="/ganesha-login-banner.jpg" alt="Mana AI" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <h4>Mana AI Assistant</h4>
              <p>Ask about players, budgets, match schedules, team stats, tournament overviews, and more.</p>
              <div className="mana-prompts">
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <button key={i} className="mana-prompt-btn" onClick={() => sendMessage(p.full)}>
                    <span>{p.icon}</span> {p.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`mana-msg ${msg.role}`}>
                <div className="mana-msg-avatar">{msg.role === "assistant" ? "🤖" : "👤"}</div>
                <div>
                  <div className="mana-msg-bubble">
                    {msg.isStreaming && !msg.content ? (
                      <div className="mana-dots"><span /><span /><span /></div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  <div className="mana-msg-time">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input ── */}
        <div className="mana-input-area">
          <div className="mana-input-row">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about players, budgets, tournaments..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              disabled={isLoading}
            />
            <button className="mana-send-btn" onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" /></svg>
            </button>
          </div>
          <div className="mana-disclaimer">AI-powered assistant. Verify important data before acting.</div>
        </div>
      </div>
    </>
  );
}
