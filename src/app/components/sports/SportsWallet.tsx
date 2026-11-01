import { useState, useEffect } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Users,
  Receipt,
  SplitSquareVertical,
  ChevronRight,
  Bell,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Filter,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { sportsWalletService } from "../../../services/sports/sportsWalletService";
import type {
  WalletBalance,
  WalletTransaction,
  MatchFeeCollection,
  ExpenseSplit,
  TransactionCategory,
} from "../../../types/sportsWallet";

type WalletTab = "overview" | "transactions" | "fee-collection" | "expense-splits";

const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  MATCH_FEE: "Match Fee",
  TOURNAMENT_ENTRY: "Tournament Entry",
  VENUE_BOOKING: "Venue Booking",
  COACHING_FEE: "Coaching Fee",
  MERCHANDISE: "Merchandise",
  REWARD: "Reward",
  TOP_UP: "Top-up",
  WITHDRAWAL: "Withdrawal",
  EXPENSE_SPLIT: "Expense Split",
  REFUND: "Refund",
};

const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  MATCH_FEE: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  TOURNAMENT_ENTRY: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
  VENUE_BOOKING: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  COACHING_FEE: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  MERCHANDISE: "bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400",
  REWARD: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  TOP_UP: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
  WITHDRAWAL: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  EXPENSE_SPLIT: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  REFUND: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function SportsWallet() {
  const [tab, setTab] = useState<WalletTab>("overview");
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [feeCollections, setFeeCollections] = useState<MatchFeeCollection[]>([]);
  const [expenseSplits, setExpenseSplits] = useState<ExpenseSplit[]>([]);
  const [txFilter, setTxFilter] = useState<"ALL" | "CREDIT" | "DEBIT">("ALL");
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [expandedFee, setExpandedFee] = useState<string | null>(null);
  const [expandedSplit, setExpandedSplit] = useState<string | null>(null);

  useEffect(() => {
    reload();
  }, []);

  function reload() {
    setBalance(sportsWalletService.getBalance());
    setTransactions(sportsWalletService.getTransactions());
    setFeeCollections(sportsWalletService.getFeeCollections());
    setExpenseSplits(sportsWalletService.getExpenseSplits());
  }

  function handleTopUp() {
    const amt = Number(topUpAmount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    sportsWalletService.topUp(amt);
    toast.success(`${formatCurrency(amt)} added to Mana Wallet`);
    setShowTopUp(false);
    setTopUpAmount("");
    reload();
  }

  function handleMarkPaid(feeId: string, playerId: string) {
    sportsWalletService.markParticipantPaid(feeId, playerId);
    toast.success("Marked as paid");
    reload();
  }

  function handleRemindParticipant(feeId: string, playerId: string) {
    sportsWalletService.remindParticipant(feeId, playerId);
    toast.success("Reminder sent");
    reload();
  }

  function handleMarkSplitPaid(splitId: string, playerId: string) {
    sportsWalletService.markSplitMemberPaid(splitId, playerId);
    toast.success("Marked as paid");
    reload();
  }

  function handleRemindSplitMember(splitId: string, playerId: string) {
    sportsWalletService.remindSplitMember(splitId, playerId);
    toast.success("Reminder sent");
    reload();
  }

  const filteredTxns = transactions.filter((t) => {
    if (txFilter === "ALL") return true;
    return t.type === txFilter;
  });

  const tabs: { id: WalletTab; label: string; icon: typeof Wallet }[] = [
    { id: "overview", label: "Overview", icon: Wallet },
    { id: "transactions", label: "History", icon: Receipt },
    { id: "fee-collection", label: "Match Fees", icon: Users },
    { id: "expense-splits", label: "Splits", icon: SplitSquareVertical },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 p-3 sm:p-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
              Mana Wallet
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sports payments, match fees &amp; expense splitting
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowTopUp(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Money
        </button>
      </div>

      {/* Top-up Modal */}
      {showTopUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowTopUp(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Add Money to Wallet</h3>
            <div className="flex items-center gap-2 mb-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
              <IndianRupee className="w-5 h-5 text-slate-400" />
              <input
                type="number"
                placeholder="Enter amount"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="flex-1 bg-transparent text-lg font-bold text-slate-900 dark:text-white outline-none"
                autoFocus
              />
            </div>
            <div className="flex gap-2 mb-4">
              {[500, 1000, 2000, 5000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTopUpAmount(String(amt))}
                  className="flex-1 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 transition cursor-pointer"
                >
                  {formatCurrency(amt)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowTopUp(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer">
                Cancel
              </button>
              <button onClick={handleTopUp} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer">
                Add {topUpAmount ? formatCurrency(Number(topUpAmount)) : "Money"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Balance Cards */}
      {balance && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-600/15 col-span-2 sm:col-span-1">
            <div className="text-xs font-medium opacity-80">Available Balance</div>
            <div className="text-2xl font-black mt-1 tabular-nums">{formatCurrency(balance.available)}</div>
            {balance.pending > 0 && (
              <div className="text-xs opacity-70 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatCurrency(balance.pending)} pending
              </div>
            )}
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Earned</div>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {formatCurrency(balance.totalEarned)}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Spent</div>
            <div className="text-lg font-black text-red-500 dark:text-red-400 mt-1 tabular-nums flex items-center gap-1">
              <TrendingDown className="w-4 h-4" />
              {formatCurrency(balance.totalSpent)}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Transactions</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1 tabular-nums">
              {transactions.length}
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                tab === t.id
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB: Overview */}
      {tab === "overview" && (
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Collect Match Fee", icon: Users, color: "from-blue-500 to-blue-600", action: () => setTab("fee-collection") },
              { label: "Split Expense", icon: SplitSquareVertical, color: "from-orange-500 to-orange-600", action: () => setTab("expense-splits") },
              { label: "View History", icon: Receipt, color: "from-emerald-500 to-emerald-600", action: () => setTab("transactions") },
              { label: "Add Money", icon: CreditCard, color: "from-violet-500 to-violet-600", action: () => setShowTopUp(true) },
            ].map((a) => (
              <button
                key={a.label}
                onClick={a.action}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                  <a.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{a.label}</span>
              </button>
            ))}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
              <button onClick={() => setTab("transactions")} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 cursor-pointer">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.slice(0, 5).map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          </div>

          {/* Active Fee Collections */}
          {feeCollections.filter((f) => f.status === "COLLECTING").length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Fee Collections</h3>
                <button onClick={() => setTab("fee-collection")} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 cursor-pointer">
                  Manage <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {feeCollections
                .filter((f) => f.status === "COLLECTING")
                .map((fee) => (
                  <FeeCollectionCard key={fee.id} fee={fee} expanded={false} />
                ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Transactions */}
      {tab === "transactions" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["ALL", "CREDIT", "DEBIT"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTxFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  txFilter === f
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {f === "ALL" ? "All" : f === "CREDIT" ? "Money In" : "Money Out"}
              </button>
            ))}
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {filteredTxns.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No transactions found</div>
            ) : (
              filteredTxns.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
            )}
          </div>
        </div>
      )}

      {/* TAB: Fee Collection */}
      {tab === "fee-collection" && (
        <div className="space-y-3">
          {feeCollections.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
              <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No fee collections yet</p>
              <p className="text-xs text-slate-400 mt-1">Create one to start collecting match fees from players</p>
            </div>
          ) : (
            feeCollections.map((fee) => (
              <FeeCollectionCard
                key={fee.id}
                fee={fee}
                expanded={expandedFee === fee.id}
                onToggle={() => setExpandedFee(expandedFee === fee.id ? null : fee.id)}
                onMarkPaid={(pid) => handleMarkPaid(fee.id, pid)}
                onRemind={(pid) => handleRemindParticipant(fee.id, pid)}
              />
            ))
          )}
        </div>
      )}

      {/* TAB: Expense Splits */}
      {tab === "expense-splits" && (
        <div className="space-y-3">
          {expenseSplits.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
              <SplitSquareVertical className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No expense splits yet</p>
              <p className="text-xs text-slate-400 mt-1">Split team expenses evenly among members</p>
            </div>
          ) : (
            expenseSplits.map((split) => (
              <ExpenseSplitCard
                key={split.id}
                split={split}
                expanded={expandedSplit === split.id}
                onToggle={() => setExpandedSplit(expandedSplit === split.id ? null : split.id)}
                onMarkPaid={(pid) => handleMarkSplitPaid(split.id, pid)}
                onRemind={(pid) => handleRemindSplitMember(split.id, pid)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const isCredit = tx.type === "CREDIT";
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isCredit ? "bg-emerald-50 dark:bg-emerald-950" : "bg-red-50 dark:bg-red-950"
      }`}>
        {isCredit ? (
          <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <ArrowUpRight className="w-4 h-4 text-red-500 dark:text-red-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{tx.description}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${CATEGORY_COLORS[tx.category]}`}>
            {CATEGORY_LABELS[tx.category]}
          </span>
          <span className="text-[10px] text-slate-400">{formatDate(tx.createdAt)}</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={`text-sm font-black tabular-nums ${
          isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
        }`}>
          {isCredit ? "+" : "-"}{formatCurrency(tx.amount)}
        </div>
        <div className="flex items-center justify-end gap-1 mt-0.5">
          {tx.status === "COMPLETED" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
          {tx.status === "PENDING" && <Clock className="w-3 h-3 text-amber-500" />}
          {tx.status === "FAILED" && <XCircle className="w-3 h-3 text-red-500" />}
          <span className="text-[10px] text-slate-400">{tx.status.toLowerCase()}</span>
        </div>
      </div>
    </div>
  );
}

function FeeCollectionCard({
  fee,
  expanded,
  onToggle,
  onMarkPaid,
  onRemind,
}: {
  fee: MatchFeeCollection;
  expanded: boolean;
  onToggle?: () => void;
  onMarkPaid?: (playerId: string) => void;
  onRemind?: (playerId: string) => void;
}) {
  const paidCount = fee.participants.filter((p) => p.status === "PAID").length;
  const progress = fee.totalAmount > 0 ? (fee.collectedAmount / fee.totalAmount) * 100 : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              fee.status === "COMPLETE" ? "bg-emerald-50 dark:bg-emerald-950" : "bg-blue-50 dark:bg-blue-950"
            }`}>
              {fee.status === "COMPLETE" ? (
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Users className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{fee.matchTitle}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {fee.sport} &middot; {formatDate(fee.date)} &middot; {fee.venue}
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            <div className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(fee.collectedAmount)} / {formatCurrency(fee.totalAmount)}
            </div>
            <div className="text-[10px] text-slate-400">{paidCount}/{fee.participants.length} paid</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              fee.status === "COMPLETE" ? "bg-emerald-500" : "bg-indigo-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800/50">
          {fee.participants.map((p) => (
            <div key={p.playerId} className="flex items-center gap-3 px-4 py-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                {p.playerName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{p.playerName}</div>
                {p.paidAt && <div className="text-[10px] text-slate-400">Paid {formatDate(p.paidAt)}</div>}
              </div>
              <div className="text-xs font-bold tabular-nums text-slate-700 dark:text-slate-300 mr-2">
                {formatCurrency(p.amount)}
              </div>
              <StatusChip status={p.status} />
              {(p.status === "PENDING" || p.status === "REMINDED") && onMarkPaid && onRemind && (
                <div className="flex gap-1 ml-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onMarkPaid(p.playerId); }}
                    className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold hover:bg-emerald-100 cursor-pointer"
                  >
                    Paid
                  </button>
                  {p.status === "PENDING" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemind(p.playerId); }}
                      className="px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-[10px] font-bold hover:bg-amber-100 cursor-pointer"
                    >
                      Remind
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExpenseSplitCard({
  split,
  expanded,
  onToggle,
  onMarkPaid,
  onRemind,
}: {
  split: ExpenseSplit;
  expanded: boolean;
  onToggle?: () => void;
  onMarkPaid?: (playerId: string) => void;
  onRemind?: (playerId: string) => void;
}) {
  const paidCount = split.members.filter((m) => m.status === "PAID").length;
  const paidAmount = split.members.filter((m) => m.status === "PAID").reduce((s, m) => s + m.shareAmount, 0);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              split.status === "SETTLED"
                ? "bg-emerald-50 dark:bg-emerald-950"
                : "bg-orange-50 dark:bg-orange-950"
            }`}>
              <SplitSquareVertical className={`w-4.5 h-4.5 ${
                split.status === "SETTLED" ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"
              }`} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{split.title}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {split.category.toLowerCase().replace("_", " ")} &middot; by {split.createdByName} &middot; {formatDate(split.createdAt)}
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            <div className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(split.totalAmount)}
            </div>
            <div className="text-[10px] text-slate-400">
              {paidCount}/{split.members.length} paid &middot; {formatCurrency(paidAmount)} collected
            </div>
          </div>
        </div>
        {split.description && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">{split.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            split.status === "SETTLED"
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
              : split.status === "ACTIVE"
              ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          }`}>
            {split.status}
          </span>
          <span className="text-[10px] text-slate-400">
            {formatCurrency(split.members[0]?.shareAmount || 0)} per person ({split.splitType.toLowerCase()})
          </span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800/50">
          {split.members.map((m) => (
            <div key={m.playerId} className="flex items-center gap-3 px-4 py-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                {m.playerName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{m.playerName}</div>
                {m.paidAt && <div className="text-[10px] text-slate-400">Paid {formatDate(m.paidAt)}</div>}
              </div>
              <div className="text-xs font-bold tabular-nums text-slate-700 dark:text-slate-300 mr-2">
                {formatCurrency(m.shareAmount)}
              </div>
              <StatusChip status={m.status} />
              {split.status === "ACTIVE" && (m.status === "PENDING" || m.status === "REMINDED") && onMarkPaid && onRemind && (
                <div className="flex gap-1 ml-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onMarkPaid(m.playerId); }}
                    className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold hover:bg-emerald-100 cursor-pointer"
                  >
                    Paid
                  </button>
                  {m.status === "PENDING" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemind(m.playerId); }}
                      className="px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-[10px] font-bold hover:bg-amber-100 cursor-pointer"
                    >
                      Remind
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    PENDING: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    REMINDED: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    DECLINED: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${styles[status] || "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
  );
}
