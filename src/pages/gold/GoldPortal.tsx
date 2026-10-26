import React, { useState } from "react";
import { TrendingUp, TrendingDown, ShieldCheck, RefreshCw } from "lucide-react";
import { goldService, type GoldHolding, type GoldTransaction } from "../../services/finance/goldService";
import { showSuccess, showError } from "../../utils/ToastUtils";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export function GoldPortal() {
  const [tab, setTab] = useState<"overview" | "buy" | "sell">("overview");
  const [purity, setPurity] = useState<"24K" | "22K">("24K");
  const [buyAmount, setBuyAmount] = useState("");
  const [sellGrams, setSellGrams] = useState("");
  const [price, setPrice] = useState({ per_gram_24k: 7450, per_gram_22k: 6850, change_pct_24h: 0.42 });
  const [holdings, setHoldings] = useState<GoldHolding[]>([]);
  const [history, setHistory] = useState<GoldTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);

  React.useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [p, h, tx] = await Promise.all([goldService.getPrice(), goldService.getHoldings(), goldService.getHistory()]);
      setPrice(p); setHoldings(h); setHistory(tx); setLoadedOnce(true);
    } finally { setLoading(false); }
  }

  const currentPrice = purity === "24K" ? price.per_gram_24k : price.per_gram_22k;
  const gramsForBuy = buyAmount && currentPrice ? (parseFloat(buyAmount) / currentPrice).toFixed(4) : "—";
  const sellValue = sellGrams ? Math.round(parseFloat(sellGrams) * currentPrice) : 0;
  const totalGrams = holdings.reduce((s, h) => s + h.grams, 0);
  const totalValue = holdings.reduce((s, h) => s + h.current_value, 0);
  const totalPnl = holdings.reduce((s, h) => s + h.unrealised_pnl, 0);

  async function handleBuy() {
    const amt = parseFloat(buyAmount);
    if (!amt || amt < 10) { showError("Minimum ₹10 to buy gold."); return; }
    try {
      const result = await goldService.buy(amt, purity);
      window.open(result.phone_pe_url, "_blank");
      showSuccess(`Buying ${gramsForBuy}g of ${purity} gold — complete payment in UPI app.`);
      setBuyAmount(""); setTab("overview"); loadData();
    } catch { showError("Could not initiate gold purchase."); }
  }

  async function handleSell() {
    const g = parseFloat(sellGrams);
    if (!g || g <= 0) { showError("Enter valid grams to sell."); return; }
    if (g > totalGrams) { showError(`You only hold ${totalGrams.toFixed(4)}g.`); return; }
    try {
      const result = await goldService.sell(g, purity);
      showSuccess(`Sell initiated. ₹${result.amount.toLocaleString()} will be credited in 1–2 business days. Ref: ${result.transaction_ref}`);
      setSellGrams(""); setTab("overview"); loadData();
    } catch { showError("Could not initiate sale."); }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#44475B]">Digital Gold</h1>
          <p className="text-xs text-[#7C7E8C]">24K Pure · MMTC-PAMP Certified · Insured storage</p>
        </div>
        <button onClick={loadData} className="p-2 rounded-lg border border-[#E8E9F0] hover:bg-[#F5F5F7]">
          <RefreshCw size={14} className={loading ? "animate-spin text-[#7C7E8C]" : "text-[#7C7E8C]"} />
        </button>
      </div>

      {/* Price Banner */}
      <div className="bg-[#78350F] rounded-xl p-4 flex items-center justify-around">
        {[{ label: "24K / gram", value: `₹${price.per_gram_24k.toLocaleString()}` }, { label: "22K / gram", value: `₹${price.per_gram_22k.toLocaleString()}` }].map(item => (
          <div key={item.label} className="text-center">
            <p className="text-[10px] text-amber-200">{item.label}</p>
            <p className="text-white font-bold text-base">{item.value}</p>
          </div>
        ))}
        <div className="text-center">
          <p className="text-[10px] text-amber-200">24h Change</p>
          <p className={`font-bold text-sm flex items-center gap-1 ${price.change_pct_24h >= 0 ? "text-green-300" : "text-red-300"}`}>
            {price.change_pct_24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(price.change_pct_24h).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E8E9F0]">
        {(["overview", "buy", "sell"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${tab === t ? "border-b-2 border-amber-600 text-amber-700" : "text-[#7C7E8C]"}`}>
            {t === "overview" ? "Portfolio" : t === "buy" ? "Buy Gold" : "Sell Gold"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="bg-[#78350F] rounded-xl p-5 text-center">
            <p className="text-xs text-amber-200">Total Gold Holdings</p>
            <p className="text-4xl font-extrabold text-white mt-1">{totalGrams.toFixed(4)} g</p>
            <p className="text-amber-100 text-sm mt-1">≈ ₹{Math.round(totalValue).toLocaleString()}</p>
            <p className={`text-sm font-semibold mt-2 flex items-center justify-center gap-1 ${totalPnl >= 0 ? "text-green-300" : "text-red-300"}`}>
              {totalPnl >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {totalPnl >= 0 ? "+" : ""}₹{Math.round(totalPnl).toLocaleString()} unrealised P&L
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setTab("buy")} className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center hover:bg-amber-100 transition-colors">
              <p className="text-2xl font-black text-amber-700">+</p>
              <p className="text-sm font-bold text-amber-700 mt-1">Buy Gold</p>
            </button>
            <button onClick={() => setTab("sell")} className="bg-red-50 border border-red-200 rounded-xl p-4 text-center hover:bg-red-100 transition-colors">
              <p className="text-2xl font-black text-red-600">−</p>
              <p className="text-sm font-bold text-red-600 mt-1">Sell Gold</p>
            </button>
          </div>
          {history.length > 0 && (
            <div className="bg-white border border-[#E8E9F0] rounded-xl divide-y divide-[#F0F0F5]">
              <p className="px-4 pt-4 pb-2 text-sm font-bold text-[#44475B]">Transaction History</p>
              {history.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base ${tx.type === "BUY" ? "bg-amber-50" : "bg-green-50"}`}>
                    {tx.type === "BUY" ? "🪙" : "💰"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#44475B]">{tx.type === "BUY" ? "Bought" : "Sold"} {tx.grams}g {tx.purity}</p>
                    <p className="text-xs text-[#7C7E8C]">{new Date(tx.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  </div>
                  <p className={`text-sm font-bold ${tx.type === "BUY" ? "text-red-500" : "text-green-600"}`}>
                    {tx.type === "BUY" ? "-" : "+"}₹{tx.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "buy" && (
        <div className="bg-white border border-[#E8E9F0] rounded-xl p-5 space-y-4">
          <p className="text-sm font-bold text-[#44475B]">Buy Digital Gold</p>
          <div>
            <p className="text-xs font-semibold text-[#7C7E8C] mb-2">Select Purity</p>
            <div className="grid grid-cols-2 gap-3">
              {(["24K", "22K"] as const).map(p => (
                <button key={p} onClick={() => setPurity(p)}
                  className={`p-3 rounded-xl border-2 text-left transition-colors ${purity === p ? "border-amber-500 bg-amber-50" : "border-[#E8E9F0]"}`}>
                  <p className={`text-lg font-extrabold ${purity === p ? "text-amber-700" : "text-[#44475B]"}`}>{p}</p>
                  <p className="text-[10px] text-[#7C7E8C]">{p === "24K" ? "99.9% pure" : "91.6% jewellery"}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#7C7E8C] mb-2">Amount (₹)</p>
            <div className="flex items-center border border-[#E8E9F0] rounded-xl px-3 h-12 gap-2">
              <span className="text-[#7C7E8C] font-semibold">₹</span>
              <input type="number" className="flex-1 text-lg font-bold text-[#44475B] outline-none bg-transparent" value={buyAmount}
                onChange={e => setBuyAmount(e.target.value)} placeholder="Min ₹10" />
            </div>
            {buyAmount && <p className="text-xs text-indigo-600 mt-1.5">You will receive ≈ {gramsForBuy}g of {purity} gold</p>}
          </div>
          <div className="flex gap-2">
            {QUICK_AMOUNTS.map(a => (
              <button key={a} onClick={() => setBuyAmount(String(a))}
                className="flex-1 py-2 rounded-lg bg-[#F5F5F7] border border-[#E8E9F0] text-xs font-bold text-[#44475B] hover:bg-[#EBEBF0]">
                ₹{a}
              </button>
            ))}
          </div>
          <button onClick={handleBuy} disabled={!buyAmount || parseFloat(buyAmount) < 10}
            className="w-full bg-amber-600 text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-amber-700 transition-colors">
            Buy {gramsForBuy}g Gold · Pay ₹{buyAmount || "0"}
          </button>
          <div className="flex items-center gap-1.5 text-[10px] text-[#7C7E8C]">
            <ShieldCheck size={11} /> MMTC-PAMP certified · Insured storage · Instant delivery
          </div>
        </div>
      )}

      {tab === "sell" && (
        <div className="bg-white border border-[#E8E9F0] rounded-xl p-5 space-y-4">
          <p className="text-sm font-bold text-[#44475B]">Sell Digital Gold</p>
          <div className="flex justify-between items-center bg-[#F5F5F7] rounded-xl px-4 py-3">
            <p className="text-xs text-[#7C7E8C]">Available to sell</p>
            <p className="text-sm font-bold text-[#44475B]">{totalGrams.toFixed(4)}g</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#7C7E8C] mb-2">Grams to Sell</p>
            <div className="flex items-center border border-[#E8E9F0] rounded-xl px-3 h-12 gap-2">
              <span className="text-[#7C7E8C] font-semibold">g</span>
              <input type="number" className="flex-1 text-lg font-bold text-[#44475B] outline-none bg-transparent" value={sellGrams}
                onChange={e => setSellGrams(e.target.value)} placeholder="e.g. 0.5" />
            </div>
            {sellGrams && parseFloat(sellGrams) > 0 && (
              <p className="text-xs text-green-600 mt-1.5">You will receive ≈ ₹{sellValue.toLocaleString()} in your bank account</p>
            )}
          </div>
          <button onClick={handleSell} disabled={!sellGrams || parseFloat(sellGrams) <= 0}
            className="w-full bg-red-600 text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-red-700 transition-colors">
            Sell Gold · Get ₹{sellValue.toLocaleString()}
          </button>
          <p className="text-[10px] text-[#7C7E8C]">Amount credited in 1–2 business days · T+1 settlement</p>
        </div>
      )}
    </div>
  );
}
