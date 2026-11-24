import { useState, useEffect, useRef } from "react";
import { Users, Plus, Send, Loader2, MessageSquare, Calendar, Wallet, Lock, LogOut, UserPlus, MapPin, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  socialGroupService,
  type SocialGroup,
  type GroupMessage,
  type GroupEvent,
  type GroupExpense,
  GROUP_TYPES,
} from "../../../services/socialGroupService";
import { getStoredUser } from "../../../services/common/apiClient";

type GroupTab = "chat" | "events" | "expenses";

function GroupAvatar({ group }: { group: SocialGroup }) {
  const colors = ["bg-indigo-500", "bg-pink-500", "bg-green-500", "bg-orange-500", "bg-teal-500", "bg-purple-500"];
  const bg = group.coverColor ?? colors[(group.id || 0) % colors.length];
  return (
    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
      {(group.name || "GC").slice(0, 2).toUpperCase()}
    </div>
  );
}

export function SocialCirclesPage() {
  const user = getStoredUser();
  const communityId: number = (user as { communityId?: number })?.communityId ?? 1;

  const [myGroups, setMyGroups] = useState<SocialGroup[]>([]);
  const [allGroups, setAllGroups] = useState<SocialGroup[]>([]);
  const [listTab, setListTab] = useState<"my" | "all">("my");
  const [filterType, setFilterType] = useState("");
  const [selected, setSelected] = useState<SocialGroup | null>(null);
  const [groupTab, setGroupTab] = useState<GroupTab>("chat");
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [expAmt, setExpAmt] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [evTitle, setEvTitle] = useState("");
  const [evDate, setEvDate] = useState("");
  const [evLocation, setEvLocation] = useState("");
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
      const myIds = new Set(my.map((g) => g.id));
      setMyGroups(my.map((g) => ({ ...g, isMember: true })));
      setAllGroups(all.map((g) => ({ ...g, isMember: Boolean(g.isMember || myIds.has(g.id)) })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [communityId]);

  useEffect(() => {
    if (!selected) return;
    socialGroupService.getMessages(selected.id, 0)
      .then((r) => setMessages([...(r.content || [])].reverse()))
      .catch(() => setMessages([]));
    if (groupTab === "events") {
      socialGroupService.getEvents(selected.id).then(setEvents).catch(() => setEvents([]));
    }
    if (groupTab === "expenses") {
      socialGroupService.getBalance(selected.id).then(setBalance).catch(() => setBalance(0));
      socialGroupService.getExpenses(selected.id).then(setExpenses).catch(() => setExpenses([]));
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
      const joined = { ...group, isMember: true, memberCount: (group.memberCount || 0) + 1 };
      setMyGroups((prev) => prev.some((g) => g.id === group.id) ? prev : [...prev, joined]);
      setAllGroups((prev) => prev.map((g) => g.id === group.id ? joined : g));
      if (selected?.id === group.id) setSelected(joined);
      toast.success(`Joined ${group.name}`);
    } catch { toast.error("Failed to join group"); }
  }

  async function handleLeave() {
    if (!selected) return;
    try {
      await socialGroupService.leave(selected.id);
      setMyGroups((prev) => prev.filter((g) => g.id !== selected.id));
      setAllGroups((prev) => prev.map((g) => g.id === selected.id ? { ...g, isMember: false, memberCount: Math.max(0, (g.memberCount || 1) - 1) } : g));
      setSelected(null);
      toast.success("Left the group");
    } catch { toast.error("Failed to leave group"); }
  }

  async function handleCreateEvent() {
    if (!selected || !evTitle.trim() || !evDate) return;
    try {
      const created = await socialGroupService.createEvent(selected.id, {
        title: evTitle.trim(),
        eventDate: new Date(evDate).toISOString(),
        location: evLocation.trim() || undefined,
      });
      setEvents((prev) => [...prev, created]);
      setEvTitle(""); setEvDate(""); setEvLocation("");
      toast.success("Event scheduled");
    } catch { toast.error("Failed to create event"); }
  }

  async function handleRsvp(eventId: number, status: "GOING" | "MAYBE" | "NOT_GOING") {
    if (!selected) return;
    try {
      await socialGroupService.rsvpEvent(selected.id, eventId, status);
      setEvents((prev) => prev.map((ev) => ev.id === eventId ? { ...ev, rsvpStatus: status } : ev));
      toast.success(`RSVP updated: ${status}`);
    } catch { toast.error("Failed to update RSVP"); }
  }

  async function handleAddExpense() {
    if (!selected || !expAmt || !expDesc) return;
    try {
      await socialGroupService.addExpense(selected.id, Number(expAmt), expDesc);
      setExpAmt(""); setExpDesc("");
      toast.success("Expense added");
      const [b, list] = await Promise.all([
        socialGroupService.getBalance(selected.id),
        socialGroupService.getExpenses(selected.id),
      ]);
      setBalance(b);
      setExpenses(list);
    } catch { toast.error("Failed to add expense"); }
  }

  async function handleSettleExpense(expenseId: number) {
    if (!selected) return;
    try {
      await socialGroupService.settleExpense(expenseId);
      toast.success("Marked as settled");
      const [b, list] = await Promise.all([
        socialGroupService.getBalance(selected.id),
        socialGroupService.getExpenses(selected.id),
      ]);
      setBalance(b);
      setExpenses(list);
    } catch { toast.error("Failed to settle expense"); }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const g = await socialGroupService.createGroup({
        name: newName.trim(),
        groupType: newType,
        description: newDesc.trim() || undefined,
        isPrivate: newPrivate,
        communityId,
      });
      const enriched = { ...g, isMember: true };
      setMyGroups((prev) => [enriched, ...prev]);
      setAllGroups((prev) => [enriched, ...prev]);
      setSelected(enriched);
      setShowCreate(false); setNewName(""); setNewDesc("");
      toast.success("Group created!");
    } catch { toast.error("Failed to create group"); }
    setCreating(false);
  }

  const myIds = new Set(myGroups.map((g) => g.id));
  const displayed = (listTab === "my" ? myGroups : allGroups).filter(
    (g) => !filterType || g.groupType === filterType
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50">
      {/* Left sidebar */}
      <div className="w-80 shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-slate-800">Social Circles</h1>
            <button onClick={() => setShowCreate(true)} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700" title="Create Group">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {(["my", "all"] as const).map((t) => (
              <button key={t} onClick={() => setListTab(t)} className={`flex-1 py-1 rounded-md text-xs font-medium transition-colors ${listTab === t ? "bg-white shadow text-slate-800" : "text-slate-500"}`}>
                {t === "my" ? `My Groups (${myGroups.length})` : "All Groups"}
              </button>
            ))}
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 focus:outline-none">
            <option value="">All types</option>
            {GROUP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-indigo-600" /></div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm px-4">
              {listTab === "my" ? "You haven't joined any groups yet." : "No groups found."}
            </div>
          ) : displayed.map((g) => {
            const isMember = Boolean(g.isMember || myIds.has(g.id));
            return (
              <div
                key={g.id}
                onClick={() => setSelected({ ...g, isMember })}
                className={`p-3.5 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${selected?.id === g.id ? "bg-indigo-50" : ""}`}
              >
                <GroupAvatar group={g} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-slate-800 text-sm truncate">{g.name}</p>
                    {g.isPrivate && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-400">{g.groupType} · {g.memberCount} members</p>
                </div>
                {listTab === "all" && !isMember && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleJoin(g); }}
                    className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 shrink-0"
                    title="Join group"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      {selected ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GroupAvatar group={selected} />
              <div>
                <h2 className="font-bold text-slate-800">{selected.name}</h2>
                <p className="text-xs text-slate-400">{selected.memberCount} members · {selected.groupType}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(["chat", "events", "expenses"] as GroupTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setGroupTab(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${groupTab === t ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  {t === "chat" && <MessageSquare className="w-3.5 h-3.5" />}
                  {t === "events" && <Calendar className="w-3.5 h-3.5" />}
                  {t === "expenses" && <Wallet className="w-3.5 h-3.5" />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
              <button onClick={handleLeave} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg" title="Leave group">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {groupTab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm mt-10">No messages yet. Say hello!</p>
                ) : messages.map((m) => (
                  <div key={m.id} className="space-y-1">
                    <p className="text-xs text-slate-500 font-medium">{m.senderName || `Member #${m.senderId}`}</p>
                    <div className="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-2 text-sm text-slate-800 inline-block max-w-[80%]">
                      {m.content}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {m.sentAt ? new Date(m.sentAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                    </p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t border-slate-200 p-3 flex gap-2 bg-white">
                <input value={msgInput} onChange={(e) => setMsgInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()} placeholder="Type a message…" className="flex-1 border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <button onClick={handleSend} disabled={sending || !msgInput.trim()} className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}

          {groupTab === "events" && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-slate-700 text-sm">Schedule Group Meetup</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input value={evTitle} onChange={(e) => setEvTitle(e.target.value)} placeholder="Event title" className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  <input type="datetime-local" value={evDate} onChange={(e) => setEvDate(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  <input value={evLocation} onChange={(e) => setEvLocation(e.target.value)} placeholder="Location (e.g. Clubhouse)" className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <button onClick={handleCreateEvent} disabled={!evTitle.trim() || !evDate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  Create Event
                </button>
              </div>

              {events.length === 0 ? (
                <p className="text-center text-slate-400 text-sm mt-10">No upcoming events for this group.</p>
              ) : (
                <div className="space-y-3">
                  {events.map((ev) => {
                    const dt = ev.scheduledAt || ev.eventDate;
                    return (
                      <div key={ev.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-800 text-sm">{ev.title}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-2">
                            <span>{dt ? new Date(dt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "TBD"}</span>
                            {ev.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ev.location}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {(["GOING", "MAYBE", "NOT_GOING"] as const).map((st) => (
                            <button
                              key={st}
                              onClick={() => handleRsvp(ev.id, st)}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                                ev.rsvpStatus === st
                                  ? "bg-indigo-600 text-white border-indigo-600"
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {st === "GOING" ? "✓ Going" : st === "MAYBE" ? "? Maybe" : "✗ No"}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {groupTab === "expenses" && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {balance !== null && !Number.isNaN(balance) && (
                <div className={`p-4 rounded-xl text-sm font-medium ${balance >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {balance >= 0 ? `You are owed ₹${balance.toLocaleString("en-IN")}` : `You owe ₹${Math.abs(balance).toLocaleString("en-IN")}`}
                </div>
              )}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-slate-700 text-sm">Add Equal-Split Expense</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input value={expDesc} onChange={(e) => setExpDesc(e.target.value)} placeholder="Description" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  <input value={expAmt} onChange={(e) => setExpAmt(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="Amount (₹)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <button onClick={handleAddExpense} disabled={!expAmt || !expDesc} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">Add Expense</button>
              </div>

              {expenses.length > 0 && (
                <div className="space-y-2">
                  {expenses.map((exp) => {
                    const myBal = Number(exp.myBalance ?? 0);
                    return (
                      <div key={exp.id} className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{exp.description}</p>
                          <p className="text-xs text-slate-500">
                            Paid by {exp.paidByName || `Member #${exp.paidBy}`} · ₹{Number(exp.amount || 0).toLocaleString("en-IN")}
                            {exp.splitBetween ? ` (split ${exp.splitBetween} ways)` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-bold ${myBal >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {myBal >= 0 ? "+" : "-"}₹{Math.abs(myBal).toLocaleString("en-IN")}
                          </span>
                          {myBal < 0 && (
                            <button
                              onClick={() => handleSettleExpense(exp.id)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Settle
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
