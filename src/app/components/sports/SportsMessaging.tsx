import { useState, useEffect, useRef, useMemo } from "react";
import {
  MessageCircle,
  Users,
  Plus,
  Search,
  Send,
  ArrowLeft,
  CheckCheck,
  Check,
  MoreVertical,
  UserPlus,
  Hash,
  Clock,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { sportsSocialService } from "../../../services/sports/sportsSocialService";
import type { SportsConversation, SportsMessage, MatchmakingProfile } from "../../../types/sportsSocial";

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diff < 86400000 * 7) {
    return d.toLocaleDateString([], { weekday: "short" });
  }
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

function formatFullTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

type ViewMode = "list" | "thread";
type FilterTab = "all" | "dms" | "groups";

// ─── new DM modal ─────────────────────────────────────────────────────────────

function NewDMModal({
  profiles,
  existingConvos,
  onStart,
  onClose,
}: {
  profiles: MatchmakingProfile[];
  existingConvos: SportsConversation[];
  onStart: (conv: SportsConversation) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const lower = q.toLowerCase();
    return profiles.filter(
      p => !q || p.playerName.toLowerCase().includes(lower) || p.location.toLowerCase().includes(lower),
    );
  }, [profiles, q]);

  function handlePick(p: MatchmakingProfile) {
    const conv = sportsSocialService.startDM(p.playerId, p.playerName);
    onStart(conv);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex-1">New Direct Message</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search players..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-300 text-slate-800 dark:text-white" />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto px-2 pb-3 space-y-1">
          {filtered.map(p => {
            const hasConvo = existingConvos.some(c => c.type === "DM" && c.participantIds.includes(p.playerId));
            return (
              <button key={p.playerId} type="button" onClick={() => handlePick(p)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-left transition cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {getInitials(p.playerName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{p.playerName}</p>
                  <p className="text-[10px] text-slate-400">{p.location.split(",")[0]} · {p.sports[0]?.sport.charAt(0) + p.sports[0]?.sport.slice(1).toLowerCase().replace("_", " ")}</p>
                </div>
                {hasConvo && <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded-full">Existing</span>}
              </button>
            );
          })}
          {filtered.length === 0 && <p className="text-xs text-slate-400 text-center py-6">No players found</p>}
        </div>
      </div>
    </div>
  );
}

// ─── new group modal ──────────────────────────────────────────────────────────

function NewGroupModal({
  profiles,
  onCreate,
  onClose,
}: {
  profiles: MatchmakingProfile[];
  onCreate: (conv: SportsConversation) => void;
  onClose: () => void;
}) {
  const [groupName, setGroupName] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<MatchmakingProfile[]>([]);

  const filtered = useMemo(() => {
    const lower = q.toLowerCase();
    return profiles.filter(p => !q || p.playerName.toLowerCase().includes(lower) || p.location.toLowerCase().includes(lower));
  }, [profiles, q]);

  function toggle(p: MatchmakingProfile) {
    setSelected(prev => prev.some(s => s.playerId === p.playerId) ? prev.filter(s => s.playerId !== p.playerId) : [...prev, p]);
  }

  function handleCreate() {
    if (!groupName.trim()) { toast.error("Group name required"); return; }
    if (selected.length < 1) { toast.error("Add at least 1 member"); return; }
    const conv = sportsSocialService.createGroup(groupName.trim(), selected.map(p => ({ playerId: p.playerId, playerName: p.playerName })));
    onCreate(conv);
    toast.success(`"${groupName.trim()}" group created`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex-1">New Squad Group</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="px-4 py-3 space-y-2">
          <input value={groupName} onChange={e => setGroupName(e.target.value)}
            placeholder="Squad / group name e.g. Whitefield Warriors"
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-300 text-slate-800 dark:text-white" />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search players to add..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-300 text-slate-800 dark:text-white" />
          </div>
          {/* Selected chips */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {selected.map(p => (
                <span key={p.playerId} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                  {p.playerName.split(" ")[0]}
                  <button type="button" onClick={() => toggle(p)} className="cursor-pointer opacity-70 hover:opacity-100">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="max-h-52 overflow-y-auto px-2 space-y-1">
          {filtered.map(p => {
            const isSelected = selected.some(s => s.playerId === p.playerId);
            return (
              <button key={p.playerId} type="button" onClick={() => toggle(p)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition cursor-pointer ${isSelected ? "bg-indigo-50 dark:bg-indigo-950/40" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {getInitials(p.playerName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{p.playerName}</p>
                  <p className="text-[10px] text-slate-400">{p.location.split(",")[0]}</p>
                </div>
                {isSelected && <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 cursor-pointer hover:bg-slate-50">
            Cancel
          </button>
          <button type="button" onClick={handleCreate}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 cursor-pointer">
            Create Group ({selected.length} members)
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function SportsMessaging() {
  const [convos, setConvos] = useState<SportsConversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<SportsConversation | null>(null);
  const [messages, setMessages] = useState<SportsMessage[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [searchQ, setSearchQ] = useState("");
  const [profiles, setProfiles] = useState<MatchmakingProfile[]>([]);
  const [showNewDM, setShowNewDM] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setConvos(sportsSocialService.getConversations());
    setProfiles(sportsSocialService.getProfiles());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function openConvo(conv: SportsConversation) {
    setActiveConvo(conv);
    setMessages(sportsSocialService.getMessages(conv.id));
    sportsSocialService.markRead(conv.id);
    setConvos(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
  }

  function handleSend() {
    if (!msgInput.trim() || !activeConvo) return;
    const msg = sportsSocialService.sendMessage(activeConvo.id, msgInput.trim());
    setMessages(prev => [...prev, msg]);
    setMsgInput("");
    const updated = sportsSocialService.getConversations();
    setConvos(updated);
    setActiveConvo(updated.find(c => c.id === activeConvo.id) ?? activeConvo);
  }

  function handleNewDMStart(conv: SportsConversation) {
    setConvos(sportsSocialService.getConversations());
    setShowNewDM(false);
    openConvo(conv);
  }

  function handleGroupCreate(conv: SportsConversation) {
    setConvos(sportsSocialService.getConversations());
    setShowNewGroup(false);
    openConvo(conv);
  }

  const totalUnread = convos.reduce((s, c) => s + c.unreadCount, 0);

  const filteredConvos = useMemo(() => {
    let list = convos;
    if (filterTab === "dms") list = list.filter(c => c.type === "DM");
    if (filterTab === "groups") list = list.filter(c => c.type === "GROUP");
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(c => {
        const name = c.type === "GROUP" ? (c.groupName ?? "") : (c.participants.find(p => p.playerId !== "me")?.playerName ?? "");
        return name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q);
      });
    }
    return list;
  }, [convos, filterTab, searchQ]);

  // ─── conversation list ─────────────────────────────────────────────────────
  if (!activeConvo) {
    return (
      <div className="space-y-3 p-3 sm:p-5 max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                Messages
                {totalUnread > 0 && (
                  <span className="ml-2 text-xs font-black text-white bg-red-500 px-1.5 py-0.5 rounded-full">{totalUnread}</span>
                )}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">DMs &amp; squad group chats</p>
            </div>
          </div>

          {/* New conversation actions */}
          <div className="relative">
            <button type="button" onClick={() => setShowActions(a => !a)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 cursor-pointer shadow-sm">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
            {showActions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden min-w-40">
                  <button type="button" onClick={() => { setShowNewDM(true); setShowActions(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 cursor-pointer">
                    <UserPlus className="w-4 h-4 text-indigo-500" />
                    Direct Message
                  </button>
                  <button type="button" onClick={() => { setShowNewGroup(true); setShowActions(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer border-t border-slate-100 dark:border-slate-800">
                    <Users className="w-4 h-4 text-emerald-500" />
                    Squad Group
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>

        {/* Filter tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
          {([
            { id: "all"    as const, label: "All",    count: convos.length },
            { id: "dms"    as const, label: "DMs",    count: convos.filter(c => c.type === "DM").length },
            { id: "groups" as const, label: "Groups", count: convos.filter(c => c.type === "GROUP").length },
          ] as const).map(t => (
            <button key={t.id} type="button" onClick={() => setFilterTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterTab === t.id ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>
              {t.id === "dms" && <MessageCircle className="w-3 h-3" />}
              {t.id === "groups" && <Hash className="w-3 h-3" />}
              {t.label}
              <span className="text-[9px] opacity-70">({t.count})</span>
            </button>
          ))}
        </div>

        {/* Conversation list */}
        <div className="space-y-1.5">
          {filteredConvos.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No conversations yet.</p>
              <div className="flex gap-2 justify-center mt-3">
                <button type="button" onClick={() => setShowNewDM(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer hover:bg-indigo-700">
                  <UserPlus className="w-3.5 h-3.5" />New DM
                </button>
                <button type="button" onClick={() => setShowNewGroup(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer hover:bg-emerald-700">
                  <Users className="w-3.5 h-3.5" />New Group
                </button>
              </div>
            </div>
          ) : (
            filteredConvos.map(conv => {
              const isGroup = conv.type === "GROUP";
              const other = conv.participants.find(p => p.playerId !== "me");
              const isOnline = !isGroup && other?.isOnline;
              const displayName = isGroup ? (conv.groupName ?? "Group") : (other?.playerName ?? "");
              const memberCount = conv.participantIds.length;

              return (
                <button key={conv.id} type="button" onClick={() => openConvo(conv)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                    conv.unreadCount > 0
                      ? "bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900"
                      : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200"
                  }`}>
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white text-xs font-bold ${
                      isGroup ? "bg-gradient-to-br from-emerald-500 to-teal-500" : "bg-gradient-to-br from-indigo-500 to-violet-500"
                    }`}>
                      {isGroup ? <Users className="w-5 h-5" /> : getInitials(displayName)}
                    </div>
                    {isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className={`text-xs truncate ${conv.unreadCount > 0 ? "font-extrabold text-slate-900 dark:text-white" : "font-bold text-slate-800 dark:text-slate-200"}`}>
                        {displayName}
                      </p>
                      {isGroup && (
                        <span className="text-[9px] text-slate-400 font-normal flex-shrink-0">{memberCount} members</span>
                      )}
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${conv.unreadCount > 0 ? "text-slate-700 dark:text-slate-300 font-medium" : "text-slate-400"}`}>
                      {conv.lastMessage || "No messages yet"}
                    </p>
                  </div>

                  {/* Right side */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-[10px] text-slate-400">{formatTime(conv.lastMessageAt)}</span>
                    {conv.unreadCount > 0 ? (
                      <span className="min-w-[18px] h-[18px] rounded-full bg-indigo-600 text-[9px] text-white font-black flex items-center justify-center px-1">
                        {conv.unreadCount}
                      </span>
                    ) : (
                      <CheckCheck className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {showNewDM && (
          <NewDMModal profiles={profiles} existingConvos={convos} onStart={handleNewDMStart} onClose={() => setShowNewDM(false)} />
        )}
        {showNewGroup && (
          <NewGroupModal profiles={profiles} onCreate={handleGroupCreate} onClose={() => setShowNewGroup(false)} />
        )}
      </div>
    );
  }

  // ─── thread view ───────────────────────────────────────────────────────────
  const isGroup = activeConvo.type === "GROUP";
  const other = activeConvo.participants.find(p => p.playerId !== "me");
  const threadName = isGroup ? (activeConvo.groupName ?? "Group") : (other?.playerName ?? "");
  const isOnline = !isGroup && other?.isOnline;

  // Group messages by date for dividers
  const groupedMessages = useMemo(() => {
    const groups: { date: string; msgs: SportsMessage[] }[] = [];
    for (const msg of messages) {
      const dateStr = new Date(msg.createdAt).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
      const last = groups[groups.length - 1];
      if (last && last.date === dateStr) {
        last.msgs.push(msg);
      } else {
        groups.push({ date: dateStr, msgs: [msg] });
      }
    }
    return groups;
  }, [messages]);

  return (
    <div className="flex flex-col h-[560px] max-w-2xl mx-auto">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 rounded-t-2xl flex-shrink-0">
        <button type="button" onClick={() => setActiveConvo(null)}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-500">
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
          isGroup ? "bg-gradient-to-br from-emerald-500 to-teal-500" : "bg-gradient-to-br from-indigo-500 to-violet-500"
        }`}>
          {isGroup ? <Users className="w-4 h-4" /> : getInitials(threadName)}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{threadName}</p>
          <p className={`text-[10px] font-medium ${isOnline ? "text-emerald-500" : "text-slate-400"}`}>
            {isGroup
              ? `${activeConvo.participantIds.length} members`
              : (isOnline ? "Online" : "Offline")
            }
          </p>
        </div>

        <button type="button" className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-400">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No messages yet. Say hello!</p>
          </div>
        )}

        {groupedMessages.map(group => (
          <div key={group.date} className="space-y-3">
            {/* Date divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              <span className="text-[10px] font-bold text-slate-400 px-2">{group.date}</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            </div>

            {group.msgs.map((msg, i) => {
              const isMe = msg.senderId === "me";
              const prevMsg = i > 0 ? group.msgs[i - 1] : null;
              const isSameSender = prevMsg?.senderId === msg.senderId;

              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} ${isSameSender ? "mt-0.5" : "mt-3"}`}>
                  {/* Other avatar */}
                  {!isMe && !isSameSender && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mr-2 mt-auto">
                      {getInitials(msg.senderName)}
                    </div>
                  )}
                  {!isMe && isSameSender && <div className="w-7 mr-2 flex-shrink-0" />}

                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[72%]`}>
                    {!isMe && !isSameSender && isGroup && (
                      <p className="text-[9px] font-bold text-indigo-500 mb-0.5 ml-1">{msg.senderName}</p>
                    )}
                    <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-bl-sm shadow-sm"
                    }`}>
                      {msg.content}
                    </div>
                    <div className={`flex items-center gap-1 mt-0.5 ${isMe ? "flex-row-reverse" : ""}`}>
                      <span className="text-[9px] text-slate-400">{formatFullTime(msg.createdAt)}</span>
                      {isMe && (
                        msg.readBy.length > 1
                          ? <CheckCheck className="w-3 h-3 text-indigo-400" />
                          : <Check className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl flex-shrink-0">
        <div className="flex gap-2 items-end">
          <input
            value={msgInput}
            onChange={e => setMsgInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder={`Message ${isGroup ? activeConvo.groupName : other?.playerName}...`}
            className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          />
          <button type="button" onClick={handleSend}
            disabled={!msgInput.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition flex-shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
