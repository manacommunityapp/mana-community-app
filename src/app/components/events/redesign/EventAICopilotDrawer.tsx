import React, { useState } from "react";
import { Bot, Mic, Send, Sparkles, X, User, ArrowRight, ShieldCheck, PieChart, Users, DollarSign } from "lucide-react";
import { GlassCard, TouchButton } from "./EventDesignSystem";

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
  cardData?: {
    title: string;
    metrics: { label: string; value: string; color: string }[];
  };
}

interface EventAICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const EventAICopilotDrawer: React.FC<EventAICopilotDrawerProps> = ({
  isOpen,
  onClose,
  isDark = false,
}) => {
  const [query, setQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "ai",
      text: "Hello Sandeep! I'm your Event Copilot AI. How can I assist with Ganesh Utsav 2026 or team schedules today?",
      timestamp: "Just now",
    },
  ]);

  if (!isOpen) return null;

  const quickPrompts = [
    { label: "📊 Budget Summary", prompt: "Give me the total budget summary for Ganesh Utsav 2026." },
    { label: "👥 Pending Volunteers", prompt: "Which departments need more volunteers today?" },
    { label: "🍲 Food Prep Status", prompt: "How many meal plates are prepared vs consumed?" },
    { label: "🎟️ Send Reminders", prompt: "Generate QR pass reminders for pending registrants." },
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || query;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");

    // Simulate AI thinking and smart response
    setTimeout(() => {
      let responseText = "I have analyzed your request across the event database.";
      let cardData;

      if (text.toLowerCase().includes("budget") || text.toLowerCase().includes("cost")) {
        responseText = "Here is the real-time financial breakdown for Ganesh Utsav 2026:";
        cardData = {
          title: "Ganesh Utsav 2026 Budget Overview",
          metrics: [
            { label: "Allocated Budget", value: "₹7.50 Lakhs", color: "#4F46E5" },
            { label: "Spent to Date", value: "₹4.82 Lakhs (64%)", color: "#FF6B00" },
            { label: "Sponsorship Collected", value: "₹6.10 Lakhs", color: "#16A34A" },
            { label: "Remaining Funds", value: "₹2.68 Lakhs", color: "#2563EB" },
          ],
        };
      } else if (text.toLowerCase().includes("volunteer") || text.toLowerCase().includes("team")) {
        responseText = "Current volunteer shift distribution across departments:";
        cardData = {
          title: "Volunteer Duty Summary",
          metrics: [
            { label: "Total Assigned", value: "318 Volunteers", color: "#4F46E5" },
            { label: "Food & Prasadam", value: "85 active (92% full)", color: "#16A34A" },
            { label: "Crowd & Security", value: "110 active (Need +15)", color: "#EF4444" },
            { label: "Cultural Stage", value: "42 active (100% full)", color: "#2563EB" },
          ],
        };
      } else {
        responseText = `Processed "${text}". All systems are operational. Total registrations standard at 1,842 passes with 98% QR scan readiness.`;
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        cardData,
      };

      setMessages((prev) => [...prev, aiMsg]);
    }, 750);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        style={{
          background: isDark ? "#0F172A" : "#FFFFFF",
          borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 107, 0, 0.2)",
        }}
        className="relative z-10 w-full max-w-lg h-[82vh] rounded-t-[32px] flex flex-col shadow-2xl border-t overflow-hidden"
      >
        {/* Header */}
        <div
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))"
              : "linear-gradient(135deg, rgba(255,107,0,0.08), rgba(79,70,229,0.08))",
          }}
          className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0"
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                background: "linear-gradient(135deg, #FF6B00 0%, #4F46E5 100%)",
              }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md animate-pulse-subtle"
            >
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                Event AI Copilot
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </h3>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Powered by Event OS Engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 hide-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  msg.sender === "user"
                    ? "bg-[#FF6B00] text-white"
                    : "bg-indigo-600 text-white"
                }`}
              >
                {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[82%] ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                <div
                  style={{
                    background:
                      msg.sender === "user"
                        ? "linear-gradient(135deg, #FF6B00, #FF8800)"
                        : isDark
                        ? "rgba(30, 41, 59, 0.9)"
                        : "rgba(241, 245, 249, 0.95)",
                    color: msg.sender === "user" ? "#FFFFFF" : isDark ? "#F8FAFC" : "#1E293B",
                  }}
                  className="inline-block p-3.5 rounded-2xl text-xs font-medium shadow-xs leading-relaxed"
                >
                  {msg.text}
                </div>

                {/* AI Interactive Card payload if any */}
                {msg.cardData && (
                  <GlassCard isDark={isDark} hoverScale={false} className="mt-2 p-3 border text-left">
                    <h4 className="text-xs font-extrabold text-[#FF6B00] mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      {msg.cardData.title}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {msg.cardData.metrics.map((m, idx) => (
                        <div key={idx} className="p-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/70">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{m.label}</p>
                          <p className="text-xs font-extrabold mt-0.5" style={{ color: m.color }}>
                            {m.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                <span className="block text-[10px] text-slate-400 mt-1">{msg.timestamp}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto hide-scrollbar border-t border-slate-100 dark:border-slate-800 shrink-0">
          {quickPrompts.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(item.prompt)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shrink-0 flex items-center gap-2">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`p-3 rounded-2xl transition-all cursor-pointer ${
              isRecording
                ? "bg-rose-500 text-white animate-pulse"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
            title="Voice query"
          >
            <Mic className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={isRecording ? "Listening... (Speak now)" : "Ask AI Copilot about budget, schedule..."}
            className="flex-1 h-12 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none border border-transparent focus:border-[#FF6B00] transition-colors"
          />

          <button
            onClick={() => handleSend()}
            style={{
              background: "linear-gradient(135deg, #FF6B00 0%, #FF8800 100%)",
            }}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
