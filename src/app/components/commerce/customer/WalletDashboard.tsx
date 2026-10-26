import { useEffect, useState } from "react";
import { commerceWalletService, type WalletDto } from "../../../../services/commerce/commerceWalletService";

const TXN_ICONS: Record<string, string> = {
  TOPUP: "↑", PAYMENT: "↓", REFUND: "↑", CASHBACK: "★", ADJUSTMENT: "⟳",
};
const TXN_COLORS: Record<string, string> = {
  TOPUP: "text-green-600", PAYMENT: "text-red-500", REFUND: "text-green-600",
  CASHBACK: "text-yellow-500", ADJUSTMENT: "text-gray-500",
};

export default function WalletDashboard() {
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpRef, setTopUpRef] = useState("");
  const [topping, setTopping] = useState(false);

  const load = () => {
    setLoading(true);
    commerceWalletService.getWallet()
      .then(setWallet).catch(() => setError("Failed to load wallet")).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) return;
    setTopping(true);
    try {
      await commerceWalletService.topUp(amount, topUpRef || undefined);
      setTopUpOpen(false);
      setTopUpAmount("");
      setTopUpRef("");
      load();
    } catch { setError("Top-up failed"); } finally { setTopping(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MANA Wallet</h1>
          <p className="text-sm text-gray-500 mt-1">Your community digital wallet for seamless payments.</p>
        </div>
        <button onClick={() => setTopUpOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          + Add Money
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex justify-between">
        {error}<button onClick={() => setError(null)}>✕</button></div>}

      {wallet && (
        <>
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <p className="text-sm opacity-80">Available Balance</p>
            <p className="text-4xl font-bold mt-1">₹{wallet.balance.toFixed(2)}</p>
            <div className="flex justify-between mt-4 text-sm opacity-75">
              <span>{wallet.userName}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${wallet.status === "ACTIVE" ? "bg-green-400/30" : "bg-red-400/30"}`}>{wallet.status}</span>
            </div>
          </div>

          {/* Transactions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Transaction History</h2>
            {!wallet.transactions || wallet.transactions.length === 0 ? (
              <div className="text-center py-10 text-gray-400">No transactions yet.</div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {wallet.transactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-xl font-bold ${TXN_COLORS[t.txnType] ?? "text-gray-500"}`}>
                        {TXN_ICONS[t.txnType] ?? "•"}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t.txnType}</p>
                        <p className="text-xs text-gray-400">{t.description ?? t.txnRef}</p>
                        <p className="text-xs text-gray-300">{t.createdAt?.slice(0, 16).replace("T", " ")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${t.amount >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {t.amount >= 0 ? "+" : ""}₹{Math.abs(t.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">Bal: ₹{t.balanceAfter.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Top Up Dialog */}
      {topUpOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Money to Wallet</h2>
              <button onClick={() => setTopUpOpen(false)} className="text-gray-400">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input type="number" min="1" step="1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} placeholder="Enter amount" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UPI / Reference ID</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={topUpRef} onChange={e => setTopUpRef(e.target.value)} placeholder="Optional payment reference" />
              </div>
              <div className="flex flex-wrap gap-2">
                {[100, 250, 500, 1000].map(amt => (
                  <button key={amt} onClick={() => setTopUpAmount(String(amt))}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setTopUpOpen(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleTopUp} disabled={topping || !topUpAmount}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {topping ? "Processing…" : "Add Money"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
