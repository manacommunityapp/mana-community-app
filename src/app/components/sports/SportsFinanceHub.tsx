import { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  Receipt,
  History,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle,
  Loader2,
  Trophy,
  AlertCircle,
  X,
  Banknote,
  Users,
  Smartphone,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import {
  manaSplitService,
  type SplitGroup,
  type SplitExpenseItem,
  type OptimizedTransfer,
  type ExpenseCategory,
  type SplitMethod,
} from "../../../services/split/manaSplitService";
import { sportsDashboardService, type DashboardTournamentCard } from "../../../services/sports/sportsDashboardService";
import { safeStorage } from "../../../utils/storage";

// ─── constants ───────────────────────────────────────────────────────────────

const SPORTS_GROUP_KEY = "mana_sports_split_groups";
const FEE_PAYMENTS_KEY = "mana_sports_fee_payments";

const SPORTS_EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; emoji: string }[] = [
  { value: "TRANSPORT",    label: "Transport",    emoji: "🚌" },
  { value: "FUEL",         label: "Fuel",         emoji: "⛽" },
  { value: "FOOD",         label: "Food",         emoji: "🍱" },
  { value: "STAY",         label: "Stay",         emoji: "🏨" },
  { value: "TICKETS",      label: "Entry",        emoji: "🎟️" },
  { value: "ACTIVITIES",   label: "Ground/Kit",   emoji: "🏏" },
  { value: "MISCELLANEOUS",label: "Misc",         emoji: "📦" },
];

type FinanceTab = "expenses" | "fees" | "history";

type FeePaymentMode = "CASH" | "UPI" | "BANK_TRANSFER";

interface FeePaymentRecord {
  id: string;
  tournamentId: number;
  tournamentName: string;
  playerName: string;
  amount: number;
  mode: FeePaymentMode;
  transactionRef?: string;
  paidAt: string;
  collectedBy?: string;
}

type HistoryEntry = {
  id: string;
  date: string;
  type: "TOURNAMENT_FEE" | "SPLIT_SETTLEMENT";
  description: string;
  amount: number;
  direction: "out" | "in";
  status: string;
  counterparty?: string;
  paymentMode?: string;
};

// ─── local fee helpers ────────────────────────────────────────────────────────

function loadFeePayments(): FeePaymentRecord[] {
  try {
    const raw = safeStorage.getItem(FEE_PAYMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveFeePayment(p: FeePaymentRecord) {
  const list = loadFeePayments();
  list.unshift(p);
  try { safeStorage.setItem(FEE_PAYMENTS_KEY, JSON.stringify(list)); } catch { /* */ }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtAmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── component ───────────────────────────────────────────────────────────────

interface Props {
  communityId?: number | null;
}

export function SportsFinanceHub({ communityId: _communityId }: Props) {
  const [tab, setTab] = useState<FinanceTab>("expenses");

  // ── Expense Split state ────────────────────────────────────────────────────
  const [sportsGroups, setSportsGroups] = useState<SplitGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<SplitExpenseItem[]>([]);
  const [settlements, setSettlements] = useState<OptimizedTransfer[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showPayModal, setShowPayModal] = useState<OptimizedTransfer | null>(null);
  const [groupForm, setGroupForm] = useState({ title: "", description: "" });
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    category: "TRANSPORT" as ExpenseCategory,
    totalAmount: 0,
    splitMethod: "EQUAL" as SplitMethod,
  });

  // ── Fee Collection state ───────────────────────────────────────────────────
  const [tournaments, setTournaments] = useState<DashboardTournamentCard[]>([]);
  const [toursLoading, setToursLoading] = useState(false);
  const [collectModal, setCollectModal] = useState<DashboardTournamentCard | null>(null);
  const [feeForm, setFeeForm] = useState({
    playerName: "",
    amount: 100,
    mode: "CASH" as FeePaymentMode,
    transactionRef: "",
    collectedBy: "",
  });
  const [feePayments, setFeePayments] = useState<FeePaymentRecord[]>([]);

  // ── History ────────────────────────────────────────────────────────────────
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // ── Load sports split groups ───────────────────────────────────────────────
  const loadSportsGroups = () => {
    const all = manaSplitService.getGroups();
    let sportGroupIds: string[] = [];
    try {
      const raw = safeStorage.getItem(SPORTS_GROUP_KEY);
      sportGroupIds = raw ? JSON.parse(raw) : [];
    } catch { /* */ }
    const filtered = sportGroupIds.length
      ? all.filter(g => sportGroupIds.includes(g.id))
      : all.filter(g => g.type === "EVENT" || g.type === "TRIP");
    setSportsGroups(filtered);
    if (!selectedGroupId && filtered.length > 0) {
      setSelectedGroupId(filtered[0].id);
    }
  };

  const loadGroupData = (gid: string) => {
    setExpenses(manaSplitService.getExpenses(gid));
    setSettlements(manaSplitService.getOptimizedSettlements(gid));
  };

  useEffect(() => {
    loadSportsGroups();
    setFeePayments(loadFeePayments());
  }, []);

  useEffect(() => {
    if (selectedGroupId) loadGroupData(selectedGroupId);
  }, [selectedGroupId]);

  // ── Load tournaments ───────────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== "fees") return;
    setToursLoading(true);
    Promise.allSettled([
      sportsDashboardService.getOpenTournaments(),
      sportsDashboardService.getClosedTournaments(),
    ]).then(([open, closed]) => {
      const list: DashboardTournamentCard[] = [
        ...(open.status === "fulfilled" ? open.value : []),
        ...(closed.status === "fulfilled" ? closed.value : []),
      ];
      setTournaments(list);
    }).finally(() => setToursLoading(false));
  }, [tab]);

  // ── Build history ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== "history") return;
    const entries: HistoryEntry[] = [];

    // Local fee payments
    for (const p of loadFeePayments()) {
      entries.push({
        id: p.id,
        date: p.paidAt,
        type: "TOURNAMENT_FEE",
        description: `${p.tournamentName} — ${p.playerName}`,
        amount: p.amount,
        direction: "out",
        status: "PAID",
        paymentMode: p.mode,
        counterparty: p.collectedBy,
      });
    }

    // Split settlements
    for (const g of sportsGroups) {
      const pmts = manaSplitService.getPayments(g.id);
      for (const p of pmts) {
        entries.push({
          id: `split-${p.id}`,
          date: p.createdAt,
          type: "SPLIT_SETTLEMENT",
          description: `Settlement — ${g.title}`,
          amount: p.amount,
          direction: p.fromMemberId === "user-me" ? "out" : "in",
          status: p.status,
          paymentMode: p.paymentMethod,
          counterparty: p.fromMemberId === "user-me" ? p.toName : p.fromName,
        });
      }
    }

    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setHistory(entries);
  }, [tab, sportsGroups]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.title.trim()) return;
    const grp = manaSplitService.createGroup({
      title: groupForm.title,
      type: "EVENT",
      description: groupForm.description,
      memberIds: ["user-2", "user-3"],
    });
    let ids: string[] = [];
    try {
      const r = safeStorage.getItem(SPORTS_GROUP_KEY);
      ids = r ? JSON.parse(r) : [];
    } catch { /* */ }
    ids.push(grp.id);
    safeStorage.setItem(SPORTS_GROUP_KEY, JSON.stringify(ids));
    setSelectedGroupId(grp.id);
    setGroupForm({ title: "", description: "" });
    setShowCreateGroup(false);
    loadSportsGroups();
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !expenseForm.description || expenseForm.totalAmount <= 0) return;
    manaSplitService.createExpense({
      groupId: selectedGroupId,
      category: expenseForm.category,
      description: expenseForm.description,
      totalAmount: Number(expenseForm.totalAmount),
      paidByMemberId: "user-me",
      splitMethod: expenseForm.splitMethod,
      recordInMyMoney: false,
    });
    setExpenseForm({ description: "", category: "TRANSPORT", totalAmount: 0, splitMethod: "EQUAL" });
    setShowAddExpense(false);
    if (selectedGroupId) loadGroupData(selectedGroupId);
    toast.success("Expense added");
  };

  const handlePay = () => {
    if (!showPayModal || !selectedGroupId) return;
    manaSplitService.recordPayment({
      groupId: selectedGroupId,
      toMemberId: showPayModal.toMemberId,
      amount: showPayModal.amount,
      paymentMethod: "UPI",
      referenceNote: `Sports settlement to ${showPayModal.toName}`,
    });
    setShowPayModal(null);
    if (selectedGroupId) loadGroupData(selectedGroupId);
    toast.success("Settlement recorded");
  };

  const handleCollectFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectModal || !feeForm.playerName || feeForm.amount <= 0) return;
    const record: FeePaymentRecord = {
      id: `fee-${Date.now()}`,
      tournamentId: collectModal.id,
      tournamentName: collectModal.name,
      playerName: feeForm.playerName,
      amount: Number(feeForm.amount),
      mode: feeForm.mode,
      transactionRef: feeForm.transactionRef || undefined,
      collectedBy: feeForm.collectedBy || undefined,
      paidAt: new Date().toISOString(),
    };
    saveFeePayment(record);
    setFeePayments(loadFeePayments());
    setFeeForm({ playerName: "", amount: 100, mode: "CASH", transactionRef: "", collectedBy: "" });
    setCollectModal(null);
    toast.success(`Fee of ${fmtAmt(record.amount)} collected from ${record.playerName}`);
  };

  const selectedGroup = useMemo(
    () => sportsGroups.find(g => g.id === selectedGroupId),
    [sportsGroups, selectedGroupId],
  );
  const overview = manaSplitService.getUserOverview();

  const tourFeeTotal = feePayments.reduce((s, p) => s + p.amount, 0);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl p-3 bg-red-50 border border-red-100 text-center">
          <TrendingDown className="w-4 h-4 text-red-500 mx-auto mb-0.5" />
          <p className="text-sm font-extrabold text-red-600">{fmtAmt(overview.youOwe)}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">You Owe</p>
        </div>
        <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-100 text-center">
          <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-0.5" />
          <p className="text-sm font-extrabold text-emerald-600">{fmtAmt(overview.youReceive)}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">You Get</p>
        </div>
        <div className="rounded-xl p-3 bg-indigo-50 border border-indigo-100 text-center">
          <Wallet className="w-4 h-4 text-indigo-500 mx-auto mb-0.5" />
          <p className="text-sm font-extrabold text-indigo-600">{fmtAmt(tourFeeTotal)}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fees Collected</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
        {([
          { id: "expenses" as const, label: "Expenses",        icon: Receipt },
          { id: "fees"     as const, label: "Fee Collection",  icon: Trophy  },
          { id: "history"  as const, label: "History",         icon: History },
        ] as const).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              tab === t.id
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════ EXPENSES TAB ═══════════════════ */}
      {tab === "expenses" && (
        <div className="space-y-3">
          {/* Group selector row */}
          <div className="flex items-center gap-2">
            <div className="flex-1 overflow-x-auto flex gap-2 pb-1">
              {sportsGroups.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGroupId(g.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    selectedGroupId === g.id
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {g.title}
                </button>
              ))}
              {sportsGroups.length === 0 && (
                <p className="text-xs text-slate-400 py-1.5 italic">No expense groups yet.</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowCreateGroup(true)}
              className="flex-shrink-0 p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 transition cursor-pointer"
              title="New group"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {selectedGroup && (
            <>
              {/* Pending settlements */}
              {settlements.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                  <p className="text-xs font-extrabold text-amber-800 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Pending Settlements
                  </p>
                  {settlements.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="text-xs text-amber-900">
                        <span className="font-bold">{s.fromName}</span>
                        <ArrowRight className="w-3 h-3 inline mx-1" />
                        <span className="font-bold">{s.toName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-amber-700">{fmtAmt(s.amount)}</span>
                        {s.fromMemberId === "user-me" && (
                          <button
                            type="button"
                            onClick={() => setShowPayModal(s)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-600 text-white hover:bg-amber-700 cursor-pointer transition"
                          >
                            Pay
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Expense list */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50">
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">{selectedGroup.title}</p>
                    <p className="text-[10px] text-slate-400">
                      {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddExpense(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Expense
                  </button>
                </div>
                {expenses.length === 0 ? (
                  <div className="p-6 text-center">
                    <Receipt className="w-7 h-7 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No expenses yet. Add the first one.</p>
                  </div>
                ) : (
                  expenses.map(exp => {
                    const cat = SPORTS_EXPENSE_CATEGORIES.find(c => c.value === exp.category);
                    return (
                      <div key={exp.id} className="flex items-center gap-3 px-3 py-2.5">
                        <span className="text-lg flex-shrink-0">{cat?.emoji ?? "📦"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{exp.description}</p>
                          <p className="text-[10px] text-slate-400">
                            {fmtDate(exp.expenseDate)} · Paid by {exp.paidByName}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-extrabold text-slate-900">{fmtAmt(exp.totalAmount)}</p>
                          <p className="text-[10px] text-slate-400">{exp.splitMethod}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════ FEE COLLECTION TAB ═══════════════════ */}
      {tab === "fees" && (
        <div className="space-y-3">
          {/* Recent collections */}
          {feePayments.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50">
              <p className="px-3 py-2 text-xs font-extrabold text-slate-700">Recent Collections</p>
              {feePayments.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{p.playerName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{p.tournamentName} · {p.mode}</p>
                  </div>
                  <p className="text-xs font-extrabold text-emerald-600 flex-shrink-0">{fmtAmt(p.amount)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tournament list */}
          {toursLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            </div>
          ) : tournaments.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 p-8 text-center">
              <Trophy className="w-7 h-7 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No tournaments found.</p>
            </div>
          ) : (
            tournaments.map(t => (
              <div key={t.id} className="bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 p-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-slate-900 truncate">{t.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {t.sportName ?? "Sports"} · {t.communityName ?? "Community"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCollectModal(t)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition cursor-pointer shadow-sm flex-shrink-0"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Collect Fee</span>
                    <span className="sm:hidden">Collect</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══════════════════ HISTORY TAB ═══════════════════ */}
      {tab === "history" && (
        <div className="space-y-2">
          {history.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 p-8 text-center">
              <History className="w-7 h-7 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No payment history yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50">
              {history.map(h => (
                <div key={h.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    h.direction === "out"
                      ? "bg-red-50 border border-red-100"
                      : "bg-emerald-50 border border-emerald-100"
                  }`}>
                    {h.direction === "out"
                      ? <TrendingDown className="w-4 h-4 text-red-400" />
                      : <TrendingUp className="w-4 h-4 text-emerald-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{h.description}</p>
                    <p className="text-[10px] text-slate-400">
                      {fmtDate(h.date)}
                      {h.counterparty && ` · ${h.counterparty}`}
                      {h.paymentMode && ` · ${h.paymentMode}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-extrabold ${
                      h.direction === "out" ? "text-red-600" : "text-emerald-600"
                    }`}>
                      {h.direction === "out" ? "−" : "+"}{fmtAmt(h.amount)}
                    </p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      h.status === "PAID" || h.status === "CONFIRMED"
                        ? "bg-emerald-50 text-emerald-700"
                        : h.status === "PENDING" || h.status === "UNPAID"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-500"
                    }`}>
                      {h.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ Create group modal ══ */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">New Expense Group</h3>
              <button
                type="button"
                onClick={() => setShowCreateGroup(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Group Name</label>
                <input
                  value={groupForm.title}
                  onChange={e => setGroupForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Cricket Away Match Travel"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description (optional)</label>
                <input
                  value={groupForm.description}
                  onChange={e => setGroupForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Train + food for Pune tournament"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 cursor-pointer shadow-sm"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ Add expense modal ══ */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">Add Expense</h3>
              <button
                type="button"
                onClick={() => setShowAddExpense(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {SPORTS_EXPENSE_CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setExpenseForm(f => ({ ...f, category: c.value }))}
                      className={`flex flex-col items-center py-2 px-1 rounded-xl border text-[10px] font-bold transition cursor-pointer ${
                        expenseForm.category === c.value
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-base">{c.emoji}</span>
                      <span>{c.label.split("/")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                <input
                  value={expenseForm.description}
                  onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Train tickets to Pune"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Total Amount (₹)</label>
                <input
                  type="number"
                  min={1}
                  value={expenseForm.totalAmount || ""}
                  onChange={e => setExpenseForm(f => ({ ...f, totalAmount: Number(e.target.value) }))}
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Split Method</label>
                <select
                  value={expenseForm.splitMethod}
                  onChange={e => setExpenseForm(f => ({ ...f, splitMethod: e.target.value as SplitMethod }))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                >
                  <option value="EQUAL">Equal Split</option>
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="EXACT">Exact Amounts</option>
                  <option value="SHARES">By Shares</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 cursor-pointer shadow-sm"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ Confirm pay modal ══ */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">Confirm Settlement</h3>
              <button
                type="button"
                onClick={() => setShowPayModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-center space-y-1">
              <p className="text-xs text-slate-500">Pay to</p>
              <p className="text-sm font-extrabold text-slate-900">{showPayModal.toName}</p>
              {showPayModal.toUpiId && (
                <p className="text-xs text-slate-500 font-mono">{showPayModal.toUpiId}</p>
              )}
              <p className="text-2xl font-extrabold text-amber-700">{fmtAmt(showPayModal.amount)}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPayModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePay}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 cursor-pointer shadow-sm flex items-center justify-center gap-1"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Mark as Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Collect fee modal ══ */}
      {collectModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Collect Match Fee</h3>
                <p className="text-[10px] text-slate-400 truncate max-w-[260px]">{collectModal.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setCollectModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCollectFee} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Player Name</label>
                <input
                  value={feeForm.playerName}
                  onChange={e => setFeeForm(f => ({ ...f, playerName: e.target.value }))}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  min={1}
                  value={feeForm.amount}
                  onChange={e => setFeeForm(f => ({ ...f, amount: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Payment Mode</label>
                <div className="flex gap-2">
                  {([
                    { value: "CASH" as const,         label: "Cash",         icon: Banknote },
                    { value: "UPI" as const,          label: "UPI",          icon: Smartphone },
                    { value: "BANK_TRANSFER" as const,label: "Bank",         icon: Users },
                  ]).map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setFeeForm(f => ({ ...f, mode: m.value }))}
                      className={`flex-1 flex flex-col items-center py-2 rounded-xl border text-[11px] font-bold cursor-pointer transition ${
                        feeForm.mode === m.value
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <m.icon className="w-4 h-4 mb-0.5" />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              {feeForm.mode !== "CASH" && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {feeForm.mode === "UPI" ? "UPI Ref / TXN ID" : "UTR / Reference"}
                  </label>
                  <input
                    value={feeForm.transactionRef}
                    onChange={e => setFeeForm(f => ({ ...f, transactionRef: e.target.value }))}
                    placeholder="Transaction reference"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Collected By (optional)</label>
                <input
                  value={feeForm.collectedBy}
                  onChange={e => setFeeForm(f => ({ ...f, collectedBy: e.target.value }))}
                  placeholder="Your name"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCollectModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 cursor-pointer shadow-sm"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
