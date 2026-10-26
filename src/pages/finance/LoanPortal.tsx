import React, { useState, useEffect } from "react";
import { loanService, type LoanOffer, type ActiveLoan } from "../../services/finance/loanService";

const TENURES = [3, 6, 12, 18, 24, 36, 48, 60, 84];

function OfferCard({ offer, onApply }: { offer: LoanOffer; onApply: () => void }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-2xl flex-shrink-0">{offer.lender_icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 text-sm">{offer.lender}</h3>
            {offer.pre_approved && <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-700 text-xs font-bold rounded">PRE-APPROVED</span>}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{offer.disbursal_time} disbursal · Up to {offer.max_tenure_months}m tenure</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xl font-extrabold text-red-600">{offer.interest_rate_min}%</div>
          <div className="text-xs text-gray-400">onwards p.a.</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4 bg-gray-50 rounded-xl p-3 text-center">
        <div><div className="text-xs text-gray-400">Loan Amount</div><div className="font-bold text-sm text-gray-800 mt-0.5">₹{(offer.min_amount/1000)}K–{(offer.max_amount/100000).toFixed(0)}L</div></div>
        <div><div className="text-xs text-gray-400">Processing Fee</div><div className="font-bold text-sm text-gray-800 mt-0.5">{offer.processing_fee_pct}%</div></div>
        <div><div className="text-xs text-gray-400">Max Tenure</div><div className="font-bold text-sm text-gray-800 mt-0.5">{offer.max_tenure_months}m</div></div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {offer.features.map(f => <span key={f} className="border border-gray-100 rounded-full px-2.5 py-0.5 text-xs text-gray-500">✓ {f}</span>)}
      </div>
      <button onClick={onApply} className="w-full mt-4 bg-red-600 text-white rounded-xl py-2.5 font-bold text-sm hover:bg-red-700 transition-colors">Apply Now</button>
    </div>
  );
}

function ApplyModal({ offer, onClose }: { offer: LoanOffer; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [tenure, setTenure] = useState(12);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState("");
  const principal = parseInt(amount || "0", 10);
  const rate = offer.interest_rate_min;
  const emi = principal > 0 ? loanService.calcEMI(principal, rate, tenure) : 0;
  const validTenures = TENURES.filter(t => t <= offer.max_tenure_months);

  async function handleApply() {
    if (!principal || principal < offer.min_amount) { setMessage(`Min ₹${offer.min_amount.toLocaleString()} required.`); return; }
    if (principal > offer.max_amount) { setMessage(`Max ₹${offer.max_amount.toLocaleString()} for this offer.`); return; }
    setApplying(true); setMessage("");
    try {
      const result = await loanService.apply({ offer_id: offer.id, amount: principal, tenure_months: tenure, rate });
      setMessage(`✅ ${result.message} EMI: ₹${result.emi.toLocaleString()}/month`);
      setTimeout(onClose, 3000);
    } catch { setMessage("Application failed. Please try again."); }
    finally { setApplying(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Apply – {offer.lender}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <p className="text-xs text-gray-500 mb-4">{offer.interest_rate_min}%–{offer.interest_rate_max}% p.a. · Processing fee {offer.processing_fee_pct}%</p>
        <div className="mb-3">
          <div className="text-xs font-semibold text-gray-500 mb-2">Loan Amount (₹)</div>
          <div className="flex items-center border-2 border-gray-200 rounded-xl px-3 h-12 gap-2 focus-within:border-red-500">
            <span className="text-gray-400 font-semibold">₹</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`₹${offer.min_amount.toLocaleString()} – ₹${(offer.max_amount/100000).toFixed(0)}L`} className="flex-1 outline-none font-bold text-lg text-gray-900 bg-transparent" />
          </div>
        </div>
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-500 mb-2">Tenure</div>
          <div className="flex flex-wrap gap-2">
            {validTenures.map(t => (
              <button key={t} onClick={() => setTenure(t)} className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-colors ${tenure === t ? "border-red-600 bg-red-50 text-red-600" : "border-gray-200 text-gray-700"}`}>{t}m</button>
            ))}
          </div>
        </div>
        {principal >= offer.min_amount && (
          <div className="bg-red-50 rounded-xl p-3 mb-4 space-y-1">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Monthly EMI</span><span className="font-extrabold text-red-600 text-base">₹{emi.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Total Interest</span><span className="font-semibold text-gray-700">₹{(emi * tenure - principal).toLocaleString()}</span></div>
            <div className="flex justify-between border-t border-red-200 pt-1 mt-1"><span className="font-bold text-gray-900">Total Payable</span><span className="font-bold text-gray-900">₹{(emi * tenure).toLocaleString()}</span></div>
          </div>
        )}
        {message && <p className="text-sm text-center text-green-700 font-semibold mb-3">{message}</p>}
        <button onClick={handleApply} disabled={!principal || principal < offer.min_amount || applying} className="w-full bg-red-600 text-white rounded-xl py-3 font-bold text-sm disabled:opacity-40 hover:bg-red-700 transition-colors">
          {applying ? "Submitting…" : principal >= offer.min_amount ? `Apply for ₹${principal.toLocaleString()} @ ₹${emi.toLocaleString()}/mo` : "Apply Now"}
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">Subject to credit evaluation · Final rate post verification</p>
      </div>
    </div>
  );
}

function LoanCard({ loan }: { loan: ActiveLoan }) {
  const progress = (loan.emis_paid / loan.emis_total) * 100;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div><h4 className="font-bold text-gray-900">{loan.lender}</h4><p className="text-xs text-gray-400">{loan.loan_account}</p></div>
        <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold">{loan.status}</span>
      </div>
      <div className="grid grid-cols-4 gap-2 bg-red-50 rounded-xl p-3 text-center mb-3">
        {[["Loan Amount", `₹${loan.amount.toLocaleString()}`], ["EMI", `₹${loan.emi.toLocaleString()}`], ["Outstanding", `₹${loan.outstanding.toLocaleString()}`], ["EMIs Left", `${loan.emis_total - loan.emis_paid}`]].map(([l, v]) => (
          <div key={l}><div className="text-xs text-gray-400">{l}</div><div className="font-bold text-sm text-gray-800 mt-0.5">{v}</div></div>
        ))}
      </div>
      <div>
        <div className="flex justify-between text-xs mb-1"><span className="text-gray-400">Repayment Progress</span><span className="text-green-600 font-semibold">{loan.emis_paid}/{loan.emis_total} EMIs</span></div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${progress}%` }} /></div>
      </div>
      <p className="text-xs text-blue-700 font-medium mt-2">Next EMI: {loan.next_emi_date} · Rate: {loan.interest_rate}% p.a.</p>
    </div>
  );
}

export default function LoanPortal() {
  const [tab, setTab] = useState<"offers" | "my-loans">("offers");
  const [applyOffer, setApplyOffer] = useState<LoanOffer | null>(null);
  const [offers, setOffers] = useState<LoanOffer[]>([]);
  const [myLoans, setMyLoans] = useState<ActiveLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      loanService.getOffers(),
      loanService.getMyLoans(),
    ]).then(([offersData, myLoansData]) => {
      if (isMounted) {
        setOffers(offersData);
        setMyLoans(myLoansData);
        setIsLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-red-600 text-white px-4 py-5">
        <h1 className="text-xl font-extrabold mb-1">💸 Personal Loans</h1>
        <p className="text-red-200 text-sm">From 10.50% p.a. · Instant approval · 100% online</p>
      </div>
      <div className="flex border-b bg-white sticky top-0 z-10">
        {(["offers", "my-loans"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === t ? "border-red-600 text-red-600" : "border-transparent text-gray-400"}`}>
            {t === "offers" ? "Loan Offers" : `My Loans (${myLoans.length})`}
          </button>
        ))}
      </div>
      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {tab === "offers" && (isLoading ? <div className="flex justify-center pt-12"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div> : offers.map(o => <OfferCard key={o.id} offer={o} onApply={() => setApplyOffer(o)} />))}
        {tab === "my-loans" && (
          myLoans.length === 0 ? (
            <div className="text-center pt-16"><div className="text-5xl mb-4">💸</div><h3 className="font-bold text-gray-900 mb-2">No active loans</h3><button onClick={() => setTab("offers")} className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm">Browse Loan Offers</button></div>
          ) : myLoans.map(loan => <LoanCard key={loan.id} loan={loan} />)
        )}
      </div>
      {applyOffer && <ApplyModal offer={applyOffer} onClose={() => setApplyOffer(null)} />}
    </div>
  );
}
