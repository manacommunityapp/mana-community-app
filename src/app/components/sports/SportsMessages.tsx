import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Users,
  Search,
} from "lucide-react";
import { sportsSocialService } from "../../../services/sports/sportsSocialService";
import type { SportsConversation, SportsMessage } from "../../../types/sportsSocial";

function formatMsgTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 0) return time;
  if (diffDays === 1) return `Yesterday ${time}`;
  return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ${time}`;
}

function formatLastSeen(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function SportsMessages() {
  const [conversations, setConversations] = useState<SportsConversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<SportsMessage[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setConversations(sportsSocialService.getConversations());
  }, []);

  useEffect(() => {
    if (activeConv) {
      setMessages(sportsSocialService.getMessages(activeConv));
      sportsSocialService.markRead(activeConv);
      setConversations(sportsSocialService.getConversations());
    }
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!input.trim() || !activeConv) return;
    const msg = sportsSocialService.sendMessage(activeConv, input.trim());
    setMessages((prev) => [...prev, msg]);
    setInput("");
    setConversations(sportsSocialService.getConversations());
  }

  const activeConversation = conversations.find((c) => c.id === activeConv);
  const otherParticipant = activeConversation?.participants.find((p) => p.playerId !== "me");

  const filteredConvs = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = c.groupName || c.participants.find((p) => p.playerId !== "me")?.playerName || "";
    return name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q);
  });

  return (
    <div className="p-3 sm:p-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">Messages</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Team chats &amp; direct messages</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex" style={{ height: "calc(100vh - 220px)", minHeight: 400, maxHeight: 700 }}>
        {/* Conversation List */}
        <div className={`w-full sm:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 ${activeConv ? "hidden sm:flex" : "flex"}`}>
          {/* Search */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-slate-800 dark:text-white outline-none"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConvs.map((conv) => {
              const other = conv.participants.find((p) => p.playerId !== "me");
              const displayName = conv.groupName || other?.playerName || "Unknown";
              const isGroup = conv.type === "GROUP";
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer ${
                    activeConv === conv.id ? "bg-indigo-50 dark:bg-indigo-950/30" : ""
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      isGroup
                        ? "bg-gradient-to-br from-violet-500 to-purple-600"
                        : "bg-gradient-to-br from-blue-500 to-cyan-500"
                    }`}>
                      {isGroup ? <Users className="w-4.5 h-4.5" /> : displayName.charAt(0)}
                    </div>
                    {other?.isOnline && !isGroup && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayName}</span>
                      <span className="text-[9px] text-slate-400 flex-shrink-0 ml-2">{formatLastSeen(conv.lastMessageAt)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{conv.lastMessage}</p>
                      {conv.unreadCount > 0 && (
                        <span className="flex-shrink-0 ml-2 w-5 h-5 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col min-w-0 ${!activeConv ? "hidden sm:flex" : "flex"}`}>
          {activeConv && activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <button
                  onClick={() => setActiveConv(null)}
                  className="sm:hidden p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </button>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                  activeConversation.type === "GROUP"
                    ? "bg-gradient-to-br from-violet-500 to-purple-600"
                    : "bg-gradient-to-br from-blue-500 to-cyan-500"
                }`}>
                  {activeConversation.type === "GROUP" ? <Users className="w-4 h-4" /> : (otherParticipant?.playerName.charAt(0) || "?")}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {activeConversation.groupName || otherParticipant?.playerName}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {activeConversation.type === "GROUP"
                      ? `${activeConversation.participants.length} members`
                      : otherParticipant?.isOnline
                      ? "Online"
                      : "Offline"}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.senderId === "me";
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] sm:max-w-[65%]`}>
                        {!isMe && activeConversation.type === "GROUP" && (
                          <div className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 mb-0.5 ml-1">{msg.senderName}</div>
                        )}
                        <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? "bg-indigo-600 text-white rounded-br-md"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md"
                        }`}>
                          {msg.content}
                        </div>
                        <div className={`text-[9px] text-slate-400 mt-0.5 ${isMe ? "text-right mr-1" : "ml-1"}`}>
                          {formatMsgTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer disabled:opacity-40 disabled:cursor-default"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-slate-200 dark:text-slate-700 mb-3" />
                <p className="text-sm font-bold text-slate-400">Select a conversation</p>
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Choose from your team chats and direct messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
