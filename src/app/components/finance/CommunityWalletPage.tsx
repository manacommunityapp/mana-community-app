import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { walletService, type ResidentWallet, type WalletTransaction } from "../../../services/walletService";

const FILTER_OPTIONS = ["All", "Payments", "Top-ups", "Refunds"] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

const TXN_TYPE_MAP: Record<FilterOption, string | null> = {
  All: null,
  Payments: "PAYMENT",
  "Top-ups": "TOPUP",
  Refunds: "REFUND",
};

const PAYMENT_METHODS = ["UPI", "Card", "Net Banking"] as const;

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CommunityWalletPage() {
  const { user } = useAuth();
  const communityId = user?.communityId ?? 1;
  const isAdmin = user?.roles?.includes("ADMIN") || user?.roles?.includes("FM");

  const [wallet, setWallet] = useState<ResidentWallet | null>(null);
  const [txns, setTxns] = useState<WalletTransaction[]>([]);
  const [ledger, setLedger] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterOption>("All");
  const [showLedger, setShowLedger] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [payMethod, setPayMethod] = useState<string>("UPI");
  const [topping, setTopping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      walletService.getMyWallet(communityId),
      walletService.getTransactions(communityId),
    ])
      .then(([w, t]) => {
        setWallet(w);
        setTxns(t.content);
      })
      .catch(() => setError("Failed to load wallet"))
      .finally(() => setLoading(false));
  }, [communityId]);

  useEffect(() => { load(); }, [load]);

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) return;
    setTopping(true);
    try {
      const res = await walletService.initiateTopup(amount, payMethod);
      window.open(res.paymentUrl, "_blank");
      setTopUpOpen(false);
      setTopUpAmount("");
      load();
    } catch {
      setError("Top-up failed. Please try again.");
    } finally {
      setTopping(false);
    }
  };

  const handleViewLedger = async () => {
    if (!showLedger) {
      const data = await walletService.getCommunityLedger(communityId);
      setLedger(data);
    }
    setShowLedger((v) => !v);
  };

  const filteredTxns = txns.filter((t) => {
    const type = TXN_TYPE_MAP[filter];
    return type == null || t.txnType === type;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Community Wallet</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Balance card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-lg">
        <p className="text-sm text-blue-200 mb-1">Available Balance</p>
        <p className="text-4xl font-bold tracking-tight">
          {wallet ? formatINR(wallet.balance) : "₹ —"}
        </p>
        {wallet?.creditLimit > 0 && (
          <p className="text-sm text-blue-200 mt-1">
            {formatINR(wallet.creditLimit)} credit available
          </p>
        )}
        {wallet?.upiVirtualId && (
          <span className="inline-block mt-3 bg-white/20 text-white text-xs font-mono rounded-full px-3 py-1">
            {wallet.upiVirtualId}
          </span>
        )}
        <div className="mt-4">
          <button
            onClick={() => setTopUpOpen(true)}
            className="bg-white text-blue-700 font-semibold text-sm px-5 py-2 rounded-full hover:bg-blue-50 transition"
          >
            + Top Up
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pay Dues", to: "/finance/bills?from=wallet" },
          { label: "Pay Booking", to: "/bookings?from=wallet" },
          { label: "Settle Expense", to: "/social?from=wallet" },
        ].map(({ label, to }) => (
          <Link
            key={label}
            to={to}
            className="bg-white border border-gray-200 rounded-xl py-3 px-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Transaction history */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Transactions</h2>
          <div className="flex gap-2 flex-wrap">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1 rounded-full border transition ${
                  filter === f
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-300 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filteredTxns.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No transactions</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm divide-y divide-gray-100">
            {filteredTxns.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{t.description || t.txnType}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(t.initiatedAt)}</p>
                </div>
                <div className="text-right ml-4">
                  <p className={`text-sm font-semibold ${t.direction === "CREDIT" ? "text-green-600" : "text-red-500"}`}>
                    {t.direction === "CREDIT" ? "+" : "−"}{formatINR(t.amount)}
                  </p>
                  <p className="text-xs text-gray-400">{formatINR(t.balanceAfter)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FM / Admin community ledger */}
      {isAdmin && (
        <div>
          <button
            onClick={handleViewLedger}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            {showLedger ? "▾ Hide" : "▸ View"} Community Ledger
          </button>
          {showLedger && (
            <div className="mt-3 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm divide-y divide-gray-100">
              {ledger.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">No ledger entries</p>
              ) : (
                ledger.map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{t.description || t.txnType}</p>
                      <p className="text-xs text-gray-400">{formatDate(t.initiatedAt)}</p>
                    </div>
                    <p className={`text-sm font-semibold ml-4 ${t.direction === "CREDIT" ? "text-green-600" : "text-red-500"}`}>
                      {t.direction === "CREDIT" ? "+" : "−"}{formatINR(t.amount)}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Top-up modal */}
      {topUpOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h2 className="text-lg font-semibold mb-4">Top Up Wallet</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Amount (₹)</label>
                <input
                  type="number"
                  min={1}
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 1000"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Payment Method</label>
                <div className="flex gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setPayMethod(m)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition ${
                        payMethod === m
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setTopUpOpen(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTopUp}
                  disabled={topping || !topUpAmount}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {topping ? "Processing…" : "Pay"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
