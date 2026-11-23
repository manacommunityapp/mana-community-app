import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Bot,
  Send,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  User,
  CreditCard,
  Calendar,
  Shield,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Swords,
  Flame,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp: string;
  actions?: { label: string; path: string; icon?: any }[];
}

const CATEGORIES = ["All", "Bills & Dues", "Amenity Booking", "Visitor Passes", "Sports & Tournaments", "Bylaws", "Maintenance"];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m-1",
    role: "ai",
    text: "Namaste! 🙏 I am your Mana Society AI Concierge. I can help you check maintenance bills, reserve sports courts, generate visitor QR passes, lookup committee bylaws, or post marketplace items. What can I do for you today?",
    timestamp: "Just now",
    actions: [
      { label: "Check Pending Dues", path: "/bbps" },
      { label: "Book Sports Court", path: "/sports" },
      { label: "Pre-Approve Visitor", path: "/visitors" },
    ],
  },
];

const QUICK_ACTIONS = [
  {
    emoji: "💰",
    label: "Check my dues",
    desc: "View pending maintenance & utility bills",
    prompt: "What are my pending maintenance dues and utility bills?",
  },
  {
    emoji: "🏸",
    label: "Book badminton court",
    desc: "Reserve indoor court slots for today or weekend",
    prompt: "Find available slots for badminton court this weekend.",
  },
  {
    emoji: "🚪",
    label: "Pre-approve visitor",
    desc: "Generate express gate pass for guests or domestic staff",
    prompt: "How do I create a visitor pass or add trusted daily maid?",
  },
  {
    emoji: "📖",
    label: "Society bylaws",
    desc: "Rules on renovation, pets, and quiet hours",
    prompt: "What are our society's rules regarding pet walking and quiet hours?",
  },
  {
    emoji: "📦",
    label: "Sell pre-owned item",
    desc: "Post furniture, appliances, or books to neighbors",
    prompt: "I want to sell an item to neighbors in the marketplace.",
  },
  {
    emoji: "🪔",
    label: "Book pooja & seva",
    desc: "Reserve ritual archana and prasad meal slots",
    prompt: "Show me upcoming community pooja rituals and catering tokens.",
  },
];

export function AiChatDashboard() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const aiReply = generateAiResponse(query);
      setMessages((prev) => [...prev, aiReply]);
      setIsTyping(false);
    }, 800);
  };

  const generateAiResponse = (q: string): ChatMessage => {
    const lower = q.toLowerCase();
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    if (lower.includes("due") || lower.includes("bill") || lower.includes("maintenance") || lower.includes("pay")) {
      return {
        id: `ai-${Date.now()}`,
        role: "ai",
        text: "I checked your society accounts ledger for Flat 402:\n\n• **Society Maintenance**: ₹4,850 (Current Month · Due in 5 days)\n• **Electricity (DISCOM)**: ₹2,140 (Fetched via BBPS)\n• **Piped Gas**: All cleared ✅\n\nYou can pay your maintenance dues or BBPS utilities with zero surcharge using UPI or net banking.",
        timestamp: time,
        actions: [
          { label: "Pay Maintenance Dues", path: "/finance/maintenance" },
          { label: "Pay BBPS Utilities", path: "/bbps" },
          { label: "Personal Khata", path: "/personal-finance" },
        ],
      };
    }

    if (lower.includes("court") || lower.includes("badminton") || lower.includes("sport") || lower.includes("tennis")) {
      return {
        id: `ai-${Date.now()}`,
        role: "ai",
        text: "Here is the court status at our Clubhouse Sports Arena for Saturday:\n\n• **Court 1 (Wooden)**: 06:00 – 07:00 AM (Available) ✅\n• **Court 1 (Wooden)**: 07:00 – 08:00 AM (Available) ✅\n• **Court 2 (Synthetic)**: 05:00 – 06:00 PM (Available) ✅\n\nYou can also broadcast an open match challenge to neighbors on the ladder!",
        timestamp: time,
        actions: [
          { label: "Reserve Court Slot", path: "/sports" },
          { label: "Post Match Challenge", path: "/sports/challenge" },
          { label: "View Elo Rankings", path: "/sports/rankings" },
        ],
      };
    }

    if (lower.includes("visitor") || lower.includes("guest") || lower.includes("maid") || lower.includes("gate")) {
      return {
        id: `ai-${Date.now()}`,
        role: "ai",
        text: "For hassle-free gate access, you can:\n\n1. **Pre-Approve a Guest**: Generates a 6-digit OTP & QR pass sent via WhatsApp.\n2. **Trusted Staff Whitelist**: Set recurring time windows for your maid, driver, or cook so security admits them automatically without ringing you.\n3. **Group Invite**: Perfect for family parties and housewarmings.",
        timestamp: time,
        actions: [
          { label: "Trusted Staff Whitelist", path: "/visitors/trusted" },
          { label: "Create Group Pass", path: "/visitors/group-invite" },
          { label: "Open Visitors Hub", path: "/visitors" },
        ],
      };
    }

    if (lower.includes("bylaw") || lower.includes("rule") || lower.includes("pet") || lower.includes("quiet")) {
      return {
        id: `ai-${Date.now()}`,
        role: "ai",
        text: "Here are the key society bylaws on common living standards:\n\n• **Quiet Hours**: 10:30 PM to 06:30 AM daily (No loud music or civil drilling).\n• **Pet Guidelines**: Dogs must be leashed in elevators and common podium areas; designated pet relief zone is behind Block D.\n• **Interior Renovation**: Heavy acoustic drilling permitted only Mon–Fri 09:00 AM – 05:00 PM with prior security permit.",
        timestamp: time,
        actions: [
          { label: "View Official Bylaws", path: "/notices" },
          { label: "Helpdesk Complaint", path: "/helpdesk" },
        ],
      };
    }

    if (lower.includes("sell") || lower.includes("market") || lower.includes("item") || lower.includes("furniture")) {
      return {
        id: `ai-${Date.now()}`,
        role: "ai",
        text: "You can list any pre-owned household items, gadgets, books, or sports gear to verified residents in our society marketplace with 0% commission.",
        timestamp: time,
        actions: [
          { label: "+ Post Item for Sale", path: "/marketplace/sell" },
          { label: "Browse Marketplace", path: "/marketplace" },
          { label: "My Active Listings", path: "/marketplace/my-listings" },
        ],
      };
    }

    if (lower.includes("pooja") || lower.includes("seva") || lower.includes("meal") || lower.includes("food") || lower.includes("prasad")) {
      return {
        id: `ai-${Date.now()}`,
        role: "ai",
        text: "Our cultural festival portal is live! You can book sacred family sankalp rituals and reserve community feast catering tokens (Pure Veg / Jain / Vegan).",
        timestamp: time,
        actions: [
          { label: "Book Pooja Tokens", path: "/events/pooja" },
          { label: "Prasad Catering Preferences", path: "/events/meals" },
          { label: "Events Calendar", path: "/events" },
        ],
      };
    }

    return {
      id: `ai-${Date.now()}`,
      role: "ai",
      text: `I've analyzed your question: "${q}". You can access all resident facilities, service requests, and governance portals from your dashboard. How else can I assist you?`,
      timestamp: time,
      actions: [
        { label: "Resident Dashboard", path: "/my-dashboard" },
        { label: "Helpdesk Support", path: "/helpdesk" },
        { label: "Community Forum", path: "/forum" },
      ],
    };
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          AI Society Resident Concierge
        </span>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-4 -bottom-6 text-blue-100/10 pointer-events-none select-none">
          <Bot className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-blue-100">
            <Sparkles className="w-3.5 h-3.5" />
            Natural Language Community Assistant
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Mana Society AI Assistant
          </h1>
          <p className="text-blue-100/90 text-sm leading-relaxed">
            Ask questions about maintenance dues, book court slots, pre-approve guests, or check society bylaws instantly in natural language.
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === cat
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Chat Messages Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[520px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isUser ? "bg-indigo-600 text-white" : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className="space-y-2">
                  <div
                    className={`rounded-2xl p-4 text-xs leading-relaxed ${
                      isUser
                        ? "bg-indigo-600 text-white shadow-sm rounded-tr-none"
                        : "bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none whitespace-pre-line"
                    }`}
                  >
                    {m.text}
                  </div>

                  {/* Deep link Action Buttons */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {m.actions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => navigate(act.path)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>{act.label}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 block px-1">
                    {m.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-2 px-4 bg-slate-50 rounded-2xl w-fit">
              <Bot className="w-4 h-4 text-blue-500 animate-spin" />
              <span>Mana AI is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type your question (e.g. check maintenance, book badminton court, add maid)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-sm cursor-pointer disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetChat}
            className="p-2.5 rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
            title="Reset Conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggested Quick Prompt Cards */}
      <div>
        <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
          Suggested Resident Topics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((item, i) => (
            <div
              key={i}
              onClick={() => handleSend(item.prompt)}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer flex items-start gap-3 group"
            >
              <span className="text-2xl p-2 rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-110 transition">
                {item.emoji}
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                  {item.label}
                </h4>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AiChatDashboard;
