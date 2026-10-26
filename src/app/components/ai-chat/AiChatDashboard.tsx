import { useState } from "react";
import {
  Bot, Send, RefreshCw, MessageSquare, Sparkles, ChevronRight,
  ThumbsUp, ThumbsDown, CreditCard, Calendar, Shield, BookOpen, ArrowRight,
} from "lucide-react";

const CATEGORIES = ["Bills", "Amenities", "Gate", "Sports", "Bylaws", "Maintenance"];

const MESSAGES = [
  { role: "user" as const, text: "What are my pending maintenance dues?" },
  {
    role: "ai" as const, text: "You have 1 pending maintenance bill:\n\n• October 2026 — ₹5,800 (Due: Oct 20)\n\nYour previous months are all cleared.",
    actions: [
      { label: "Pay Now", path: "/finance/maintenance" },
      { label: "View History", path: "/finance/maintenance" },
    ],
  },
  { role: "user" as const, text: "Book the badminton court for Saturday" },
  {
    role: "ai" as const, text: "I found available slots for Badminton Court on Saturday, Oct 17:\n\n• 6:00 AM – 7:00 AM ✅\n• 7:00 AM – 8:00 AM ✅\n• 8:00 AM – 9:00 AM (Booked)\n• 5:00 PM – 6:00 PM ✅\n\nWhich slot would you like?",
    actions: [
      { label: "Book 6–7 AM", path: "/bookings" },
      { label: "Book 7–8 AM", path: "/bookings" },
      { label: "View All Slots", path: "/bookings" },
    ],
  },
];

const QUICK_ACTIONS = [
  { emoji: "💰", label: "Check my dues", desc: "View pending payments" },
  { emoji: "🏸", label: "Book amenity", desc: "Courts, gym, pool" },
  { emoji: "🚪", label: "Pre-approve visitor", desc: "Share gate pass" },
  { emoji: "📖", label: "Community bylaws", desc: "Rules & guidelines" },
];

export function AiChatDashboard() {
  const [input, setInput] = useState("");

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bot size={22} style={{ color: "#3b82f6" }} />
        </div>
        <div>
          <h4 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: 0 }}>Mana AI Assistant</h4>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: "rgba(59,130,246,0.08)", color: "#3b82f6" }}>Powered by Spring AI</span>
        </div>
      </div>

      {/* Category Chips */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {CATEGORIES.map(c => (
          <button key={c} style={{
            fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 12,
            border: "1px solid rgba(148,163,184,0.15)", background: "transparent",
            color: "var(--muted)", cursor: "pointer",
          }}>{c}</button>
        ))}
      </div>

      {/* Chat Area */}
      <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 18, marginBottom: 16, maxHeight: 500, overflow: "auto" }}>
        {MESSAGES.map((m, i) => (
          <div key={i} style={{ marginBottom: 16, display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "85%", padding: "10px 14px", borderRadius: 12,
              background: m.role === "user" ? "var(--gold)" : "rgba(148,163,184,0.06)",
              color: m.role === "user" ? "#000" : "var(--text)",
              fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-line",
            }}>
              {m.role === "ai" && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6, fontSize: 10, fontWeight: 700, color: "#3b82f6" }}>
                  <Bot size={12} /> Mana AI
                </div>
              )}
              {m.text}
            </div>
            {m.role === "ai" && m.actions && (
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                {m.actions.map(a => (
                  <button key={a.label} style={{
                    fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
                    background: "rgba(59,130,246,0.08)", color: "#3b82f6",
                    border: "1px solid rgba(59,130,246,0.15)", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 3,
                  }}>
                    {a.label} <ArrowRight size={10} />
                  </button>
                ))}
              </div>
            )}
            {m.role === "ai" && (
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 2 }}><ThumbsUp size={12} /></button>
                <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 2 }}><ThumbsDown size={12} /></button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask Mana AI anything..."
          style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)", fontSize: 13, boxSizing: "border-box" }} />
        <button style={{ padding: "10px 16px", borderRadius: 10, background: "var(--gold)", color: "#000", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontWeight: 700, fontSize: 12 }}>
          <Send size={14} /> Send
        </button>
        <button style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.15)", background: "transparent", color: "var(--muted)", cursor: "pointer" }} title="New Topic">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Suggested Actions */}
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Suggested Actions</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
        {QUICK_ACTIONS.map(a => (
          <button key={a.label} style={{
            padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.1)",
            background: "var(--card)", cursor: "pointer", textAlign: "left",
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{a.emoji}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{a.label}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{a.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
