import { useState, useEffect, useRef } from "react";
import { Users, Plus, Send, Loader2, MessageSquare, Calendar, Wallet, Lock, LogOut, UserPlus } from "lucide-react";
import { toast } from "react-toastify";
import {
  socialGroupService,
  type SocialGroup,
  type GroupMessage,
  GROUP_TYPES,
} from "../../../services/socialGroupService";
import { getStoredUser } from "../../../services/common/apiClient";

type GroupTab = "chat" | "events" | "expenses";

function GroupAvatar({ group }: { group: SocialGroup }) {
  const colors = ["bg-indigo-500", "bg-pink-500", "bg-green-500", "bg-orange-500", "bg-teal-500", "bg-purple-500"];
  const bg = group.coverColor ?? colors[group.id % colors.length];
  return (
    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
      {group.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function SocialCirclesPage() {
  const user = getStoredUser();
  const communityId: number = (user as { communityId?: number })?.communityId ?? 0;

  const [myGroups, setMyGroups] = useState<SocialGroup[]>([]);
  const [allGroups, setAllGroups] = useState<SocialGroup[]>([]);
  const [listTab, setListTab] = useState<"my" | "all">("my");
  const [filterType, setFilterType] = useState("");
  const [selected, setSelected] = useState<SocialGroup | null>(null);
  const [groupTab, setGroupTab] = useState<GroupTab>("chat");
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [expAmt, setExpAmt] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<string>(GROUP_TYPES[0]);
  const [newDesc, setNewDesc] = useState("");
  const [newPrivate, setNewPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      socialGroupService.getMyGroups(),
      socialGroupService.getGroups(communityId),
    ]).then(([my, all]) => {
      setMyGroups(my);
      setAllGroups(all);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [communityId]);

  useEffect(() => {
    if (!selected) return;
    socialGroupService.getMessages(selected.id, 0).then((r) => setMessages(r.content.reverse())).catch(() => {});
    if (groupTab === "expenses") {
      socialGroupService.getBalance(selected.id).then(setBalance).catch(() => {});
    }
  }, [selected, groupTab]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function handleSend() {
    if (!selected || !msgInput.trim()) return;
    setSending(true);
    try {
      const m = await socialGroupService.sendMessage(selected.id, msgInput.trim());
      setMessages((prev) => [...prev, m]);
      setMsgInput("");
    } catch { toast.error("Failed to send message"); }
    setSending(false);
  }

  async function handleJoin(group: SocialGroup) {
    try {
      await socialGroupService.join(group.id);
      setMyGroups((prev) => [...prev, { ...group, isMember: true }]);
      setAllGroups((prev) => prev.map((g) => g.id === group.id ? { ...g, isMember: true, memberCount: g.memberCount + 1 } : g));
      toast.success(`Joined ${group.name}`);
    } catch { toast.error("Failed to join group"); }
  }

  async function handleLeave() {
    if (!selected) return;
    try {
      await socialGroupService.leave(selected.id);
      setMyGroups((prev) => prev.filter((g) => g.id !== selected.id));
      setSelected(null);
      toast.success("Left the group");
    } catch { toast.error("Failed to leave group"); }
  }

  async function handleAddExpense() {
    if (!selected || !expAmt || !expDesc) return;
    try {
      await socialGroupService.addExpense(selected.id, Number(expAmt), expDesc);
      setExpAmt(""); setExpDesc("");
      toast.success("Expense added");
      const b = await socialGroupService.getBalance(selected.id);
      setBalance(b);
    } catch { toast.error("Failed to add expense"); }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const g = await socialGroupService.createGroup({ name: newName, groupType: newType, description: newDesc, isPrivate: newPrivate, communityId });
      setMyGroups((prev) => [g, ...prev]);
      setShowCreate(false); setNewName(""); setNewDesc("");
      toast.success("Group created!");
    } catch { toast.error("Failed to create group"); }
    setCreating(false);
  }

  const displayGroups = listTab === "my" ? myGroups : allGroups.filter((g) => !filterType || g.groupType === filterType);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Left panel */}
      <div className="w-72 border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h1 className="font-bold text-slate-800">Social Circles</h1>
          </div>
          <button onClick={() => setShowCreate(true)} className="p-1.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-slate-200">
          <button onClick={() => setListTab("my")} className={`flex-1 py-2 text-xs font-medium ${listTab === "my" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500"}`}>My Groups</button>
          <button onClick={() => setListTab("all")} className={`flex-1 py-2 text-xs font-medium ${listTab === "all" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500"}`}>All Groups</button>
        </div>

        {listTab === "all" && (
          <div className="p-2 flex gap-1 flex-wrap border-b border-slate-200">
            <button onClick={() => setFilterType("")} className={`px-2 py-0.5 rounded-full text-xs ${filterType === "" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>All</button>
            {GROUP_TYPES.map((t) => <button key={t} onClick={() => setFilterType(t)} className={`px-2 py-0.5 rounded-full text-xs ${filterType === t ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>{t}</button>)}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {displayGroups.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-10">No groups found</p>
          ) : displayGroups.map((g) => (
            <button key={g.id} onClick={() => { setSelected(g); setGroupTab("chat"); }} className={`w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition text-left ${selected?.id === g.id ? "bg-indigo-50" : ""}`}>
              <GroupAvatar group={g} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-slate-700 truncate">{g.name}</p>
                <p className="text-xs text-slate-400">{g.memberCount} members · {g.groupType}</p>
              </div>
              {g.isPrivate && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Right panel */}
      {selected ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-slate-200 p-4 flex items-center gap-3">
            <GroupAvatar group={selected} />
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-800">{selected.name}</h2>
              <p className="text-xs text-slate-400">{selected.memberCount} members</p>
            </div>
            {myGroups.some((g) => g.id === selected.id) ? (
              <button onClick={handleLeave} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 px-3 py-1 border border-red-200 rounded-lg">
                <LogOut className="w-3.5 h-3.5" /> Leave
              </button>
            ) : (
              <button onClick={() => handleJoin(selected)} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 px-3 py-1 border border-indigo-200 rounded-lg">
                <UserPlus className="w-3.5 h-3.5" /> Join
              </button>
            )}
          </div>

          <div className="flex border-b border-slate-200">
            {(["chat", "events", "expenses"] as GroupTab[]).map((t) => (
              <button key={t} onClick={() => setGroupTab(t)} className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium capitalize ${groupTab === t ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700"}`}>
                {t === "chat" ? <MessageSquare className="w-4 h-4" /> : t === "events" ? <Calendar className="w-4 h-4" /> : <Wallet className="w-4 h-4" />} {t}
              </button>
            ))}
          </div>

          {groupTab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex flex-col ${String(m.senderId) === (user?.userId ?? "") ? "items-end" : "items-start"}`}>
                    <p className="text-xs text-slate-400 mb-0.5">{m.senderName}</p>
                    <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${String(m.senderId) === (user?.userId ?? "") ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                      {m.content}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{new Date(m.sentAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t border-slate-200 p-3 flex gap-2">
                <input value={msgInput} onChange={(e) => setMsgInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()} placeholder="Type a message…" className="flex-1 border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <button onClick={handleSend} disabled={sending || !msgInput.trim()} className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}

          {groupTab === "events" && (
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-center text-slate-400 text-sm mt-10">No upcoming events for this group.</p>
            </div>
          )}

          {groupTab === "expenses" && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {balance !== null && (
                <div className={`p-4 rounded-xl text-sm font-medium ${balance >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {balance >= 0 ? `You are owed ₹${balance}` : `You owe ₹${Math.abs(balance)}`}
                </div>
              )}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-slate-700 text-sm">Add Expense</h3>
                <input value={expDesc} onChange={(e) => setExpDesc(e.target.value)} placeholder="Description" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <input value={expAmt} onChange={(e) => setExpAmt(e.target.value.replace(/\D/g, ""))} placeholder="Amount (₹)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <button onClick={handleAddExpense} disabled={!expAmt || !expDesc} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">Add</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center space-y-2">
            <Users className="w-12 h-12 mx-auto opacity-30" />
            <p className="text-sm">Select a group to get started</p>
          </div>
        </div>
      )}

      {/* Create group modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h2 className="font-bold text-slate-800">Create Group</h2>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Group name" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              {GROUP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={newPrivate} onChange={(e) => setNewPrivate(e.target.checked)} className="rounded" /> Private group
            </label>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={handleCreate} disabled={creating || !newName.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
