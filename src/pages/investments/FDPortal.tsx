import React, { useState, useEffect } from "react";
import { fdService, type FDProduct, type ActiveFD } from "../../services/finance/fdService";

const TYPE_COLOR: Record<string, string> = { BANK: "#1D4ED8", NBFC: "#7C3AED", POST_OFFICE: "#0F766E" };
const TYPE_BG: Record<string, string> = { BANK: "#EFF6FF", NBFC: "#F5F3FF", POST_OFFICE: "#F0FDFA" };
const QUICK_AMOUNTS = [10000, 25000, 50000, 100000];

function ProductCard({ product, onBook }: { product: FDProduct; onBook: () => void }) {
  const best = [...product.tenures].sort((a, b) => b.rate - a.rate)[0];
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0">{product.bank_icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm">{product.bank}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: TYPE_BG[product.category], color: TYPE_COLOR[product.category] }}>{product.category.replace("_", " ")}</span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700">{product.rating}</span>
            {product.is_tax_saver && <span className="px-2 py-0.5 rounded text-xs font-semibold bg-yellow-50 text-yellow-700">80C</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-extrabold text-green-600">{best.rate}%</div>
          <div className="text-xs text-gray-400">p.a.</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4 bg-gray-50 rounded-xl p-3 text-center">
        <div><div className="text-xs text-gray-400">Min Amount</div><div className="font-bold text-sm text-gray-800 mt-0.5">₹{product.min_amount.toLocaleString()}</div></div>
        <div><div className="text-xs text-gray-400">Senior Rate</div><div className="font-bold text-sm text-purple-700 mt-0.5">{product.senior_rate}%</div></div>
        <div><div className="text-xs text-gray-400">Max Tenure</div><div className="font-bold text-sm text-gray-800 mt-0.5">{product.tenures[product.tenures.length - 1]?.label}</div></div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {product.tenures.map(t => (
          <span key={t.label} className="border border-gray-100 rounded px-2 py-0.5 text-xs text-gray-700">{t.label} · <span className="text-green-600 font-semibold">{t.rate}%</span></span>
        ))}
      </div>
      <button onClick={onBook} className="w-full mt-4 bg-blue-700 text-white rounded-xl py-2.5 font-bold text-sm hover:bg-blue-800 transition-colors">
        Book FD · Up to {best.rate}% p.a.
      </button>
    </div>
  );
}

function BookModal({ product, onClose }: { product: FDProduct; onClose: () => void }) {
  const [tenureIdx, setTenureIdx] = useState(1);
  const [amount, setAmount] = useState("");
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState("");
  const tenure = product.tenures[tenureIdx];
  const principal = parseInt(amount || "0", 10);
  const maturity = principal > 0 ? fdService.calcMaturity(principal, tenure.rate, tenure.months) : 0;
  const interest = maturity - principal;

  async function handleBook() {
    if (!principal || principal < product.min_amount) { setMessage(`Minimum ₹${product.min_amount.toLocaleString()} required.`); return; }
    setBooking(true); setMessage("");
    try {
      const result = await fdService.book({ product_id: product.id, principal, tenure_months: tenure.months, rate: tenure.rate });
      window.open(result.phone_pe_url, "_blank");
      setMessage(`✅ FD Booked! FD No: ${result.fd_number} | Maturity: ₹${result.maturity_amount.toLocaleString()} on ${result.maturity_date}`);
      setTimeout(onClose, 3000);
    } catch { setMessage("Booking failed. Please try again."); }
    finally { setBooking(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Book FD – {product.bank}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <p className="text-xs text-gray-500 mb-4">{product.bank} · Up to {product.senior_rate}% for seniors</p>
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-500 mb-2">Select Tenure</div>
          <div className="flex flex-wrap gap-2">
            {product.tenures.map((t, i) => (
              <button key={t.label} onClick={() => setTenureIdx(i)} className={`px-3 py-2 rounded-xl border-2 text-xs font-bold transition-colors ${tenureIdx === i ? "border-blue-700 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-700 hover:border-gray-300"}`}>
                {t.label}<br/><span className="text-green-600">{t.rate}%</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mb-3">
          <div className="text-xs font-semibold text-gray-500 mb-2">Amount (₹)</div>
          <div className="flex items-center border-2 border-gray-200 rounded-xl px-3 h-12 gap-2 focus-within:border-blue-700">
            <span className="text-gray-400 font-semibold">₹</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Min ₹${product.min_amount.toLocaleString()}`} className="flex-1 outline-none font-bold text-lg text-gray-900 bg-transparent" />
          </div>
          <div className="flex gap-2 mt-2">
            {QUICK_AMOUNTS.map(a => <button key={a} onClick={() => setAmount(String(a))} className="flex-1 text-xs py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold">₹{a >= 100000 ? `${a/100000}L` : `${a/1000}K`}</button>)}
          </div>
        </div>
        {principal >= product.min_amount && (
          <div className="bg-green-50 rounded-xl p-3 mb-4 space-y-1">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Principal</span><span className="font-semibold text-gray-900">₹{principal.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Interest Earned</span><span className="font-semibold text-green-600">₹{interest.toLocaleString()}</span></div>
            <div className="flex justify-between border-t border-green-200 pt-1 mt-1"><span className="font-bold text-gray-900">Maturity Amount</span><span className="font-extrabold text-blue-700 text-base">₹{maturity.toLocaleString()}</span></div>
          </div>
        )}
        {message && <p className="text-sm text-center text-green-700 font-semibold mb-3">{message}</p>}
        <button onClick={handleBook} disabled={!principal || principal < product.min_amount || booking} className="w-full bg-blue-700 text-white rounded-xl py-3 font-bold text-sm disabled:opacity-40 hover:bg-blue-800 transition-colors">
          {booking ? "Processing…" : `Book FD · ₹${principal > 0 ? principal.toLocaleString() : "0"}`}
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">DICGC insured up to ₹5 lakh per bank · Pay via UPI</p>
      </div>
    </div>
  );
}

function FDCard({ fd }: { fd: ActiveFD }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div><h4 className="font-bold text-gray-900">{fd.bank}</h4><p className="text-xs text-gray-400">FD #{fd.fd_number}</p></div>
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${fd.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{fd.status}</span>
      </div>
      <div className="grid grid-cols-4 gap-2 bg-gray-50 rounded-xl p-3 text-center mb-3">
        {[["Principal", `₹${fd.principal.toLocaleString()}`], ["Rate", `${fd.interest_rate}%`], ["Maturity", `₹${fd.maturity_amount.toLocaleString()}`], ["Interest", `₹${fd.interest_earned.toLocaleString()}`]].map(([l, v]) => (
          <div key={l}><div className="text-xs text-gray-400">{l}</div><div className="font-bold text-sm text-gray-800 mt-0.5">{v}</div></div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Tenure: {fd.tenure_label}</span>
        <span className="text-blue-700 font-semibold">Matures: {fd.maturity_date}</span>
      </div>
    </div>
  );
}

export default function FDPortal() {
  const [tab, setTab] = useState<"explore" | "my-fds">("explore");
  const [bookProduct, setBookProduct] = useState<FDProduct | null>(null);
  const [products, setProducts] = useState<FDProduct[]>([]);
  const [myFDs, setMyFDs] = useState<ActiveFD[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fdService.getProducts(),
      fdService.getMyFDs(),
    ]).then(([productsData, fdsData]) => {
      if (isMounted) {
        setProducts(productsData);
        setMyFDs(fdsData);
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
  const totalInvested = myFDs.reduce((s, f) => s + f.principal, 0);
  const totalMaturity = myFDs.reduce((s, f) => s + f.maturity_amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-700 text-white px-4 py-5">
        <h1 className="text-xl font-extrabold mb-1">💰 Fixed Deposits</h1>
        <p className="text-blue-200 text-sm">Up to 8.35% p.a. · DICGC Insured · Guaranteed Returns</p>
      </div>
      <div className="flex border-b bg-white sticky top-0 z-10">
        {(["explore", "my-fds"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === t ? "border-blue-700 text-blue-700" : "border-transparent text-gray-400"}`}>
            {t === "explore" ? "Explore FDs" : `My FDs (${myFDs.length})`}
          </button>
        ))}
      </div>
      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {tab === "explore" && (isLoading ? <div className="flex justify-center pt-12"><div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" /></div> : products.map(p => <ProductCard key={p.id} product={p} onBook={() => setBookProduct(p)} />))}
        {tab === "my-fds" && (
          <>
            {myFDs.length > 0 && (
              <div className="bg-blue-700 rounded-2xl p-4 text-white flex justify-around">
                <div className="text-center"><p className="text-blue-200 text-xs mb-1">Total Invested</p><p className="font-extrabold text-lg">₹{totalInvested.toLocaleString()}</p></div>
                <div className="text-center"><p className="text-blue-200 text-xs mb-1">Total Maturity</p><p className="font-extrabold text-lg text-green-300">₹{totalMaturity.toLocaleString()}</p></div>
              </div>
            )}
            {myFDs.length === 0 ? (
              <div className="text-center pt-16"><div className="text-5xl mb-4">💰</div><h3 className="font-bold text-gray-900 mb-2">No FDs yet</h3><p className="text-gray-400 text-sm mb-4">Book your first FD and earn guaranteed returns</p><button onClick={() => setTab("explore")} className="bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm">Explore FDs</button></div>
            ) : myFDs.map(fd => <FDCard key={fd.id} fd={fd} />)}
          </>
        )}
      </div>
      {bookProduct && <BookModal product={bookProduct} onClose={() => setBookProduct(null)} />}
    </div>
  );
}
