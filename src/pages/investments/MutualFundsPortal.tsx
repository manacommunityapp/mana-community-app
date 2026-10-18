import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, RefreshCw, X } from "lucide-react";
import { mutualFundService, type MutualFund, type FundCategory, type MFHolding, type SipMandate } from "../../services/finance/mutualFundService";
import { showSuccess, showError } from "../../utils/ToastUtils";

const CATEGORIES: { key: FundCategory | "ALL"; label: string }[] = [
  { key: "ALL", label: "All Funds" }, { key: "ELSS", label: "Tax Save (ELSS)" },
  { key: "LARGE_CAP", label: "Large Cap" }, { key: "MID_CAP", label: "Mid Cap" },
  { key: "INDEX", label: "Index" }, { key: "LIQUID", label: "Liquid" }, { key: "HYBRID", label: "Hybrid" },
];
const RISK_COLOR: Record<string, string> = { LOW: "text-green-700 bg-green-50", MODERATE: "text-amber-700 bg-amber-50", HIGH: "text-red-700 bg-red-50" };
const SIP_DATES = [1, 5, 7, 10, 15, 20, 25, 28];

type InvestModal = { fund: MutualFund; type: "SIP" | "LUMPSUM" } | null;

export function MutualFundsPortal() {
  const [tab, setTab] = useState<"explore" | "portfolio" | "sips">("explore");
  const [category, setCategory] = useState<FundCategory | "ALL">("ALL");
  const [funds, setFunds] = useState<MutualFund[]>([]);
  const [holdings, setHoldings] = useState<MFHolding[]>([]);
  const [sips, setSips] = useState<SipMandate[]>([]);
  const [loading, setLoading] = useState(false);
  const [investModal, setInvestModal] = useState<InvestModal>(null);
  const [amount, setAmount] = useState("");
  const [sipDate, setSipDate] = useState(5);

  useEffect(() => { loadFunds(); }, [category]);
  useEffect(() => { loadHoldings(); loadSips(); }, []);

  async function loadFunds() {
    setLoading(true);
    try { setFunds(await mutualFundService.getFunds(category === "ALL" ? undefined : category)); }
    finally { setLoading(false); }
  }
  async function loadHoldings() { setHoldings(await mutualFundService.getHoldings()); }
  async function loadSips() { setSips(await mutualFundService.getSips()); }

  async function handleInvest() {
    if (!investModal) return;
    const amt = parseFloat(amount);
    const min = investModal.type === "SIP" ? investModal.fund.min_sip : investModal.fund.min_lumpsum;
    if (!amt || amt < min) { showError(`Minimum ₹${min} for ${investModal.type}.`); return; }
    try {
      const result = await mutualFundService.invest(investModal.fund.id, amt, investModal.type, sipDate);
      window.open(result.phone_pe_url, "_blank");
      showSuccess(`${investModal.type === "SIP" ? "SIP set up" : "Investing"} ₹${amt.toLocaleString()} — complete payment in UPI app.`);
      setInvestModal(null); setAmount(""); loadHoldings(); loadSips();
    } catch { showError("Investment initiation failed."); }
  }

  async function handleCancelSip(sipId: string) {
    if (!window.confirm("Cancel this SIP?")) return;
    try { await fetch(`http://localhost:8080/api/v1/mf/sips/${sipId}/cancel`, { method: "DELETE" }); showSuccess("SIP cancelled."); loadSips(); }
    catch { showError("Could not cancel SIP."); }
  }

  const totalInvested = holdings.reduce((s, h) => s + h.invested_amount, 0);
  const totalCurrent = holdings.reduce((s, h) => s + h.current_value, 0);
  const totalPnl = totalCurrent - totalInvested;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-[#44475B]">Mutual Funds</h1><p className="text-xs text-[#7C7E8C]">SIP · Lumpsum · ELSS Tax Saving · SEBI Registered</p></div>
        <button onClick={() => { loadFunds(); loadHoldings(); loadSips(); }} className="p-2 rounded-lg border border-[#E8E9F0] hover:bg-[#F5F5F7]"><RefreshCw size={14} className={loading ? "animate-spin text-[#7C7E8C]" : "text-[#7C7E8C]"} /></button>
      </div>

      <div className="flex border-b border-[#E8E9F0]">
        {(["explore", "portfolio", "sips"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${tab === t ? "border-b-2 border-blue-600 text-blue-700" : "text-[#7C7E8C]"}`}>
            {t === "explore" ? "Explore" : t === "portfolio" ? "Portfolio" : "My SIPs"}
          </button>
        ))}
      </div>

      {tab === "explore" && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setCategory(c.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${category === c.key ? "bg-blue-600 text-white border-blue-600" : "border-[#E8E9F0] text-[#7C7E8C] hover:bg-[#F5F5F7]"}`}>
                {c.label}
              </button>
            ))}
          </div>
          {loading ? <div className="text-center py-12 text-[#7C7E8C] text-sm">Loading funds…</div> : (
            <div className="space-y-3">
              {funds.map(fund => (
                <div key={fund.id} className="bg-white border border-[#E8E9F0] rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-base flex-shrink-0">📊</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#44475B] leading-tight">{fund.name}</p>
                      <p className="text-[11px] text-[#7C7E8C] mt-0.5">{fund.amc} · {fund.category.replace("_", " ")}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${RISK_COLOR[fund.risk]}`}>{fund.risk}</span>
                  </div>
                  <div className="grid grid-cols-3 bg-[#F5F5F7] rounded-xl p-3">
                    {[["1Y", fund.returns_1y], ["3Y", fund.returns_3y], ["5Y", fund.returns_5y]].map(([label, val]) => (
                      <div key={label as string} className="text-center">
                        <p className="text-[10px] text-[#7C7E8C]">{label as string} Return</p>
                        <p className={`text-sm font-bold mt-0.5 ${(val as number) >= 0 ? "text-green-700" : "text-red-600"}`}>{(val as number) >= 0 ? "+" : ""}{val as number}%</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#7C7E8C]">NAV ₹{fund.nav.toFixed(2)}</p>
                      <p className={`text-[11px] font-semibold flex items-center gap-0.5 ${fund.nav_change_pct >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {fund.nav_change_pct >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {Math.abs(fund.nav_change_pct).toFixed(2)}%
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setInvestModal({ fund, type: "SIP" }); setAmount(String(fund.min_sip)); }}
                        className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-xs font-bold text-blue-700 hover:bg-blue-100">SIP</button>
                      <button onClick={() => { setInvestModal({ fund, type: "LUMPSUM" }); setAmount(String(fund.min_lumpsum)); }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-xs font-bold text-white hover:bg-blue-700">Lumpsum</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "portfolio" && (
        <div className="space-y-4">
          <div className="bg-[#1E3A5F] rounded-xl p-5">
            <p className="text-xs text-blue-200">Total Invested</p>
            <p className="text-3xl font-extrabold text-white mt-1">₹{totalInvested.toLocaleString()}</p>
            <p className="text-blue-200 text-sm mt-1">Current Value: ₹{Math.round(totalCurrent).toLocaleString()}</p>
            <p className={`text-sm font-bold mt-2 flex items-center gap-1 ${totalPnl >= 0 ? "text-green-300" : "text-red-300"}`}>
              {totalPnl >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {totalPnl >= 0 ? "+" : ""}₹{Math.round(totalPnl).toLocaleString()} ({totalInvested > 0 ? ((totalPnl / totalInvested) * 100).toFixed(2) : "0.00"}%)
            </p>
          </div>
          {holdings.length === 0 ? (
            <div className="text-center py-10 text-[#7C7E8C] text-sm">No holdings yet. Start investing from the Explore tab.</div>
          ) : holdings.map(h => (
            <div key={h.fund_id} className="bg-white border border-[#E8E9F0] rounded-xl p-4">
              <p className="text-sm font-bold text-[#44475B] mb-3">{h.fund_name}</p>
              <div className="grid grid-cols-4 gap-2">
                {[["Units", h.units.toFixed(3)], ["Avg NAV", `₹${h.avg_nav.toFixed(2)}`], ["Current", `₹${Math.round(h.current_value).toLocaleString()}`]].map(([l, v]) => (
                  <div key={l as string}><p className="text-[10px] text-[#7C7E8C]">{l as string}</p><p className="text-sm font-bold text-[#44475B] mt-0.5">{v as string}</p></div>
                ))}
                <div><p className="text-[10px] text-[#7C7E8C]">P&L</p><p className={`text-sm font-bold mt-0.5 ${h.pnl >= 0 ? "text-green-700" : "text-red-600"}`}>{h.pnl >= 0 ? "+" : ""}{h.pnl_pct.toFixed(2)}%</p></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "sips" && (
        <div className="space-y-4">
          {sips.length === 0 ? (
            <div className="text-center py-10 text-[#7C7E8C] text-sm">No active SIPs. Set up a SIP from the Explore tab.</div>
          ) : sips.map(sip => (
            <div key={sip.id} className="bg-white border border-[#E8E9F0] rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#44475B]">{sip.fund_name}</p>
                  <p className="text-xs text-[#7C7E8C] mt-0.5">₹{sip.amount.toLocaleString()}/month · {sip.sip_date}th of every month</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sip.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{sip.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 bg-[#F5F5F7] rounded-xl p-3">
                {[["Next SIP", sip.next_installment], ["Invested", `₹${sip.total_invested.toLocaleString()}`], ["Current", `₹${sip.current_value.toLocaleString()}`]].map(([l, v]) => (
                  <div key={l as string} className="text-center"><p className="text-[10px] text-[#7C7E8C]">{l as string}</p><p className="text-xs font-bold text-[#44475B] mt-0.5">{v as string}</p></div>
                ))}
              </div>
              <button onClick={() => handleCancelSip(sip.id)} className="w-full py-2 rounded-xl border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">Cancel SIP</button>
            </div>
          ))}
        </div>
      )}

      {/* Invest Modal */}
      {investModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#44475B]">{investModal.type === "SIP" ? "Set up SIP" : "Invest Lumpsum"} — {investModal.fund.short_name}</p>
              <button onClick={() => { setInvestModal(null); setAmount(""); }}><X size={18} className="text-[#7C7E8C]" /></button>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#7C7E8C] mb-2">Amount (₹)</p>
              <div className="flex items-center border border-[#E8E9F0] rounded-xl px-3 h-12 gap-2">
                <span className="text-[#7C7E8C] font-semibold">₹</span>
                <input type="number" className="flex-1 text-lg font-bold text-[#44475B] outline-none bg-transparent" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" />
              </div>
            </div>
            {investModal.type === "SIP" && (
              <div>
                <p className="text-xs font-semibold text-[#7C7E8C] mb-2">SIP Date</p>
                <div className="flex flex-wrap gap-2">
                  {SIP_DATES.map(d => (
                    <button key={d} onClick={() => setSipDate(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${sipDate === d ? "border-blue-600 bg-blue-50 text-blue-700" : "border-[#E8E9F0] text-[#7C7E8C]"}`}>
                      {d}th
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button onClick={handleInvest}
              disabled={!amount || parseFloat(amount) < (investModal.type === "SIP" ? investModal.fund.min_sip : investModal.fund.min_lumpsum)}
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-blue-700 transition-colors">
              {investModal.type === "SIP" ? `Start ₹${amount || "0"}/month SIP` : `Invest ₹${amount || "0"} Lumpsum`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
