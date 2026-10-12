import React, { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  Users,
  PieChart,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Receipt,
  Search,
  Check,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  AlertTriangle,
  QrCode,
  Bell,
  Sparkles,
  HeartHandshake,
  DollarSign,
  Send,
  Building,
  Compass,
  Copy,
  Clock
} from "lucide-react";
import {
  manaSplitService,
  type SplitGroup,
  type SplitExpenseItem,
  type OptimizedTransfer,
  type VerifiedCommunityCollection,
  type SplitMethod,
  type ExpenseCategory,
  type GroupType,
} from "../../../services/split/manaSplitService";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";

type TabKey = "groups" | "settlements" | "collections";

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  FOOD: "🍽️",
  STAY: "🏨",
  FUEL: "⛽",
  TRANSPORT: "🚌",
  ACTIVITIES: "🎯",
  TICKETS: "🎟️",
  COMMUNITY_DRIVE: "🤝",
  UTILITIES: "⚡",
  MAINTENANCE: "🛠️",
  MISCELLANEOUS: "🧾",
};

export const ManaSplitHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("groups");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("grp-trip-01");

  // Live state
  const [groups, setGroups] = useState<SplitGroup[]>([]);
  const [expenses, setExpenses] = useState<SplitExpenseItem[]>([]);
  const [settlements, setSettlements] = useState<OptimizedTransfer[]>([]);
  const [collections, setCollections] = useState<VerifiedCommunityCollection[]>([]);
  const [overview, setOverview] = useState({ youOwe: 0, youReceive: 0, netBalance: 0, totalGroups: 0, activeCollectionsCount: 0 });

  // Dialogs
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState<OptimizedTransfer | null>(null);
  const [showContributeModal, setShowContributeModal] = useState<VerifiedCommunityCollection | null>(null);

  // Forms
  const [newExpenseForm, setNewExpenseForm] = useState({
    description: "",
    category: "FOOD" as ExpenseCategory,
    totalAmount: 1200,
    splitMethod: "EQUAL" as SplitMethod,
    paidByMemberId: "user-me",
    recordInMyMoney: false,
  });

  const [newGroupForm, setNewGroupForm] = useState({
    title: "",
    type: "TRIP" as GroupType,
    description: "",
  });

  const [contributeAmount, setContributeAmount] = useState<number>(500);
  const [contributeRecordInMyMoney, setContributeRecordInMyMoney] = useState<boolean>(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [reminderSent, setReminderSent] = useState<string | null>(null);

  const refreshData = () => {
    const grps = manaSplitService.getGroups();
    const exps = manaSplitService.getExpenses(selectedGroupId);
    const stls = manaSplitService.getOptimizedSettlements(selectedGroupId);
    const cols = manaSplitService.getVerifiedCollections();
    const ov = manaSplitService.getUserOverview();

    setGroups(grps);
    setExpenses(exps);
    setSettlements(stls);
    setCollections(cols);
    setOverview(ov);
  };

  useEffect(() => {
    refreshData();
  }, [selectedGroupId]);

  const selectedGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) || groups[0];
  }, [groups, selectedGroupId]);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseForm.description || newExpenseForm.totalAmount <= 0) return;

    manaSplitService.createExpense({
      groupId: selectedGroupId,
      category: newExpenseForm.category,
      description: newExpenseForm.description,
      totalAmount: Number(newExpenseForm.totalAmount),
      paidByMemberId: newExpenseForm.paidByMemberId,
      splitMethod: newExpenseForm.splitMethod,
      recordInMyMoney: newExpenseForm.recordInMyMoney,
    });

    setShowAddExpenseModal(false);
    setNewExpenseForm({ description: "", category: "FOOD", totalAmount: 0, splitMethod: "EQUAL", paidByMemberId: "user-me", recordInMyMoney: false });
    refreshData();
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupForm.title) return;

    const grp = manaSplitService.createGroup({
      title: newGroupForm.title,
      type: newGroupForm.type,
      description: newGroupForm.description,
      memberIds: ["user-2", "user-3"],
    });

    setSelectedGroupId(grp.id);
    setShowCreateGroupModal(false);
    setNewGroupForm({ title: "", type: "TRIP", description: "" });
    refreshData();
  };

  const handleConfirmPayment = () => {
    if (!showPayModal) return;

    manaSplitService.recordPayment({
      groupId: selectedGroupId,
      toMemberId: showPayModal.toMemberId,
      amount: showPayModal.amount,
      paymentMethod: "UPI",
      referenceNote: `Settled via Mana Split to ${showPayModal.toName}`,
    });

    setShowPayModal(null);
    refreshData();
  };

  const handleContributeCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showContributeModal || contributeAmount <= 0) return;

    manaSplitService.contributeToCollection(
      showContributeModal.id,
      Number(contributeAmount),
      contributeRecordInMyMoney
    );
    setShowContributeModal(null);
    setContributeRecordInMyMoney(false);
    refreshData();
  };

  const handleSendReminder = (transfer: OptimizedTransfer) => {
    setReminderSent(transfer.fromMemberId);
    setTimeout(() => setReminderSent(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFC] pb-24 text-slate-900">
      {/* ── Top Header / Hero ── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
                  <PieChart className="w-5 h-5" />
                </span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                    Mana Split & Collections
                    <Badge className="bg-purple-100 text-purple-800 border-none font-semibold text-xs">
                      PhonePe-Grade Split Engine
                    </Badge>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Split trip, fuel, food, and community expenses. Optimized debt transfers with zero lost paise.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateGroupModal(true)}
                className="border-slate-200 text-slate-700 text-xs h-9"
              >
                <Plus className="w-4 h-4 mr-1.5" /> New Group
              </Button>
              <Button
                onClick={() => setShowAddExpenseModal(true)}
                className="bg-[#00D09C] hover:bg-[#008767] text-white font-semibold text-xs h-9 shadow-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Expense
              </Button>
            </div>
          </div>

          {/* ── Tabs Bar ── */}
          <div className="flex items-center gap-2 overflow-x-auto pt-4 border-t border-slate-100 mt-4 scrollbar-none">
            {[
              { key: "groups", label: "Active Groups & Ledger", icon: Users, count: groups.length },
              { key: "settlements", label: "Optimized Settlements", icon: ArrowRight, count: settlements.length },
              { key: "collections", label: "Verified Community Collections", icon: HeartHandshake, count: collections.length },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key as TabKey)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0] shadow-xs"
                      : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                  <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-[#008767] text-white" : "bg-slate-200 text-slate-700"}`}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Total You Owe
            </span>
            <div className="text-2xl font-black text-rose-600">
              ₹{overview.youOwe.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Across all shared group expenses</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Total You Receive
            </span>
            <div className="text-2xl font-black text-emerald-600">
              ₹{overview.youReceive.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Reimbursements owed to you</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Net Community Balance
            </span>
            <div className={`text-2xl font-black ${overview.netBalance >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
              {overview.netBalance >= 0 ? "+" : ""}₹{overview.netBalance.toLocaleString("en-IN")}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#008767] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Auto-synced with My Money suite</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* ── TAB 1: GROUPS & EXPENSES ── */}
        {activeTab === "groups" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Group Selector Side Pane */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Your Split Groups ({groups.length})
              </h3>
              <div className="space-y-2">
                {groups.map((grp) => {
                  const isSelected = grp.id === selectedGroupId;
                  return (
                    <button
                      key={grp.id}
                      onClick={() => setSelectedGroupId(grp.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? "bg-white border-purple-400 shadow-sm ring-2 ring-purple-100"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className="bg-slate-100 text-slate-700 border-none text-[10px] mb-1">
                            {grp.type}
                          </Badge>
                          <h4 className="text-sm font-bold text-slate-900">{grp.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{grp.description}</p>
                        </div>
                        <ChevronRight className={`w-4 h-4 mt-1 ${isSelected ? "text-purple-600" : "text-slate-400"}`} />
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{grp.members.length} members</span>
                        {grp.linkedTripId && (
                          <span className="text-indigo-600 font-semibold flex items-center gap-1">
                            <Compass className="w-3 h-3" /> Trip Linked
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Group Expense Stream */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-black text-slate-900">{selectedGroup?.title}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedGroup?.description}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowAddExpenseModal(true)}
                    className="bg-[#00D09C] hover:bg-[#008767] text-white font-semibold text-xs h-8"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Expense
                  </Button>
                </div>

                {/* Expense List */}
                <div className="divide-y divide-slate-100 mt-2">
                  {expenses.length === 0 ? (
                    <div className="text-center py-10">
                      <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">No expenses recorded yet in this group.</p>
                    </div>
                  ) : (
                    expenses.map((exp) => (
                      <div key={exp.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl p-2 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
                            {CATEGORY_ICONS[exp.category] || "🧾"}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{exp.description}</h4>
                            <p className="text-xs text-slate-500">
                              Paid by <span className="font-semibold text-slate-800">{exp.paidByName}</span> · {exp.expenseDate} · Split {exp.splitMethod}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {exp.shares.map((s) => (
                                <span
                                  key={s.memberId}
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                    s.memberId === "user-me"
                                      ? "bg-purple-100 text-purple-800 font-bold"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {s.memberName}: ₹{s.amount}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-base font-black text-slate-900">
                            ₹{exp.totalAmount.toLocaleString("en-IN")}
                          </span>
                          <span className="block text-[11px] text-slate-400">Total bill</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: OPTIMIZED SETTLEMENTS ── */}
        {activeTab === "settlements" && (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-purple-600 text-white">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-purple-950">
                    Debt Minimization Engine (Greedy Settlement Algorithm)
                  </h3>
                  <p className="text-xs text-purple-800">
                    Reduces multi-member debts down to the minimal number of direct transfers. Nobody pays extra; zero paise are lost.
                  </p>
                </div>
              </div>
              <Badge className="bg-purple-200 text-purple-900 border-none font-semibold text-xs">
                Zero Lost Paise Guarantee
              </Badge>
            </div>

            {settlements.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-base font-bold text-slate-900">All Balances Settled Up!</h3>
                <p className="text-xs text-slate-500 mt-1">No pending reimbursements in this group.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settlements.map((s, idx) => {
                  const isYouPaying = s.fromMemberId === "user-me";
                  const isYouReceiving = s.toMemberId === "user-me";

                  return (
                    <div
                      key={idx}
                      className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between ${
                        isYouPaying ? "border-rose-200" : isYouReceiving ? "border-emerald-200" : "border-slate-200"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Direct Settlement Transfer
                          </span>
                          <span className="text-lg font-black text-slate-900">
                            ₹{s.amount.toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px]">PAYS</span>
                            <span className="font-bold text-slate-900">{s.fromName}</span>
                            <span className="text-slate-500 block text-[10px]">{s.fromFlat}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                          <div className="text-right">
                            <span className="text-slate-400 block text-[10px]">RECEIVES</span>
                            <span className="font-bold text-emerald-700">{s.toName}</span>
                            <span className="text-slate-500 block text-[10px]">{s.toFlat}</span>
                          </div>
                        </div>

                        {s.toUpiId && (
                          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
                            <span>UPI Handle: <span className="font-mono font-semibold text-slate-700">{s.toUpiId}</span></span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(s.toUpiId || "");
                                setCopiedUpi(true);
                                setTimeout(() => setCopiedUpi(false), 2000);
                              }}
                              className="text-purple-600 text-xs font-semibold hover:underline"
                            >
                              {copiedUpi ? "Copied!" : "Copy"}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        {isYouPaying ? (
                          <Button
                            size="sm"
                            onClick={() => setShowPayModal(s)}
                            className="bg-[#00D09C] hover:bg-[#008767] text-white w-full text-xs font-semibold h-8"
                          >
                            <QrCode className="w-3.5 h-3.5 mr-1.5" /> Pay Now / Settle Up
                          </Button>
                        ) : isYouReceiving ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendReminder(s)}
                            className="border-slate-200 text-slate-700 w-full text-xs font-semibold h-8"
                          >
                            <Bell className="w-3.5 h-3.5 mr-1.5" />
                            {reminderSent === s.fromMemberId ? "Reminder Sent! ✅" : "Send Reminder"}
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Peer reimbursement in progress</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: VERIFIED COMMUNITY COLLECTIONS ── */}
        {activeTab === "collections" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Verified Community Expense Collections</h2>
              <p className="text-xs text-slate-500">
                Official approved collections for celebrations, infrastructure upgrades, or charity drives with transparent public ledgers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {collections.map((col) => {
                const percent = Math.min(100, Math.round((col.collectedAmount / col.targetAmount) * 100));

                return (
                  <div key={col.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Committee Verified
                        </Badge>
                        <span className="text-xs text-slate-400">Deadline: {col.deadline}</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mt-2">{col.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{col.description}</p>

                      <div className="mt-5 space-y-1.5">
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="font-bold text-slate-900">
                            ₹{col.collectedAmount.toLocaleString("en-IN")}
                          </span>
                          <span className="text-slate-400">
                            Target: ₹{col.targetAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-[#00D09C] h-2 rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>{percent}% funded</span>
                          <span>{col.contributorsCount} resident contributors</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[11px] text-slate-500">
                        Suggested: ₹{col.suggestedContributionINR || 500}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setShowContributeModal(col);
                          setContributeAmount(col.suggestedContributionINR || 500);
                        }}
                        disabled={col.status === "COMPLETED"}
                        className="bg-[#00D09C] hover:bg-[#008767] text-white text-xs font-semibold h-8"
                      >
                        {col.status === "COMPLETED" ? "Target Achieved" : "Contribute Now"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: ADD EXPENSE ── */}
      <Dialog open={showAddExpenseModal} onOpenChange={setShowAddExpenseModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Add Expense to {selectedGroup?.title}</DialogTitle>
            <DialogDescription>
              Record a bill with equal, percentage, quantity, or exact split.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateExpense} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Description</label>
              <Input
                placeholder="e.g. Innova Highway Toll & Fuel, Resort Buffet"
                value={newExpenseForm.description}
                onChange={(e) => setNewExpenseForm({ ...newExpenseForm, description: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Category</label>
                <select
                  value={newExpenseForm.category}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, category: e.target.value as ExpenseCategory })}
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2 bg-white"
                >
                  <option value="FOOD">Food & Dining</option>
                  <option value="STAY">Hotel & Stay</option>
                  <option value="FUEL">Fuel & Gas</option>
                  <option value="TRANSPORT">Transport</option>
                  <option value="ACTIVITIES">Activities</option>
                  <option value="TICKETS">Tickets</option>
                  <option value="UTILITIES">Utilities</option>
                  <option value="MISCELLANEOUS">Miscellaneous</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Total Amount (₹)</label>
                <Input
                  type="number"
                  value={newExpenseForm.totalAmount || ""}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, totalAmount: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Paid By</label>
                <select
                  value={newExpenseForm.paidByMemberId}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, paidByMemberId: e.target.value })}
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2 bg-white"
                >
                  {selectedGroup?.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.flat})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Split Method</label>
                <select
                  value={newExpenseForm.splitMethod}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, splitMethod: e.target.value as SplitMethod })}
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2 bg-white"
                >
                  <option value="EQUAL">Equal Split</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="QUANTITY">Quantity / Items</option>
                  <option value="EXACT">Exact Amounts</option>
                </select>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
              <input
                type="checkbox"
                id="recordInMyMoney"
                checked={newExpenseForm.recordInMyMoney}
                onChange={(e) =>
                  setNewExpenseForm({ ...newExpenseForm, recordInMyMoney: e.target.checked })
                }
                className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="recordInMyMoney" className="text-xs text-slate-700 cursor-pointer">
                <span className="font-bold text-slate-900 block">Record my share in My Money (Personal Finance)</span>
                <span className="text-[11px] text-slate-500">
                  Keep systems isolated: Personal ledger will only be updated if checked.
                </span>
              </label>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              Largest-remainder arithmetic guarantees zero lost paise across shares.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddExpenseModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#00D09C] hover:bg-[#008767] text-white">
                Save & Split
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: CREATE GROUP ── */}
      <Dialog open={showCreateGroupModal} onOpenChange={setShowCreateGroupModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Create Split Group</DialogTitle>
            <DialogDescription>Start a group for a trip, flatmates, or event expenses.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Group Title</label>
              <Input
                placeholder="e.g. Coorg Weekend Drive, Wing B Flatmates"
                value={newGroupForm.title}
                onChange={(e) => setNewGroupForm({ ...newGroupForm, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Group Type</label>
              <select
                value={newGroupForm.type}
                onChange={(e) => setNewGroupForm({ ...newGroupForm, type: e.target.value as GroupType })}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2 bg-white"
              >
                <option value="TRIP">Trip / Outing</option>
                <option value="FLATMATES">Flatmates & Utilities</option>
                <option value="EVENT">Community Event</option>
                <option value="CUSTOM">Custom Group</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Description</label>
              <Input
                placeholder="Brief purpose of the group"
                value={newGroupForm.description}
                onChange={(e) => setNewGroupForm({ ...newGroupForm, description: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateGroupModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#00D09C] hover:bg-[#008767] text-white">
                Create Group
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: PAY / SETTLE UP ── */}
      <Dialog open={!!showPayModal} onOpenChange={(open) => !open && setShowPayModal(null)}>
        <DialogContent className="max-w-md bg-white text-center">
          <DialogHeader>
            <DialogTitle>Settle Up with {showPayModal?.toName}</DialogTitle>
            <DialogDescription>Direct UPI QR transfer for zero transaction fees.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl inline-block mx-auto">
              <QrCode className="w-32 h-32 text-slate-800 mx-auto" />
              <p className="text-xs font-mono text-slate-600 mt-2 font-semibold">
                {showPayModal?.toUpiId || "mana.split@upi"}
              </p>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">
                ₹{showPayModal?.amount.toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Scan via PhonePe, Google Pay, or Paytm to complete transfer.
              </p>
            </div>
          </div>
          <DialogFooter className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => setShowPayModal(null)}>Cancel</Button>
            <Button onClick={handleConfirmPayment} className="bg-[#00D09C] hover:bg-[#008767] text-white">
              Mark as Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: CONTRIBUTE TO COLLECTION ── */}
      <Dialog open={!!showContributeModal} onOpenChange={(open) => !open && setShowContributeModal(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Contribute to {showContributeModal?.title}</DialogTitle>
            <DialogDescription>Official verified collection managed by {showContributeModal?.verifiedBy}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleContributeCollection} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Contribution Amount (₹)</label>
              <Input
                type="number"
                value={contributeAmount}
                onChange={(e) => setContributeAmount(Number(e.target.value))}
                required
              />
            </div>
            <div className="flex gap-2">
              {[250, 500, 1000, 2000].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setContributeAmount(amt)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                >
                  ₹{amt}
                </button>
              ))}
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
              <input
                type="checkbox"
                id="contributeRecordInMyMoney"
                checked={contributeRecordInMyMoney}
                onChange={(e) => setContributeRecordInMyMoney(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="contributeRecordInMyMoney" className="text-xs text-slate-700 cursor-pointer">
                <span className="font-bold text-slate-900 block">Record in My Money personal ledger</span>
                <span className="text-[11px] text-slate-500">
                  Optional: Syncs contribution to your personal accounts.
                </span>
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowContributeModal(null)}>Cancel</Button>
              <Button type="submit" className="bg-[#00D09C] hover:bg-[#008767] text-white">
                Confirm Contribution
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManaSplitHub;
