import { useState, useEffect } from "react";
import { Gem, CheckCircle2, Plus, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { eventSponsorService, type EventSponsorResponse } from "../../../services/events/eventSponsorService";

const packages = [
  { name: "Platinum",  price: "₹5,00,000", perks: ["Logo on main stage", "VIP 20 passes", "Full page ad", "Social media feature", "Brand in all materials"], color: "#6366f1", bg: "#eef2ff", count: 1 },
  { name: "Gold",      price: "₹2,00,000", perks: ["Logo on backdrop", "VIP 10 passes", "Half page ad", "Social media mention"], color: "#d97706", bg: "#fffbeb", count: 2 },
  { name: "Silver",    price: "₹75,000",   perks: ["Logo on flex banners", "5 VIP passes", "Quarter page ad"], color: "#64748b", bg: "#f8fafc", count: 4 },
  { name: "Bronze",    price: "₹25,000",   perks: ["Name in brochure", "2 passes", "Social mention"], color: "#4338ca", bg: "#eef2ff", count: 8 },
];

const mockSponsors = [
  { name: "TechCorp India",    package: "Platinum", amount: "₹5,00,000", status: "Paid",    logo: "TC" },
  { name: "Sunrise Foods",     package: "Gold",     amount: "₹2,00,000", status: "Paid",    logo: "SF" },
  { name: "BlueStar Finance",  package: "Gold",     amount: "₹2,00,000", status: "Pending", logo: "BF" },
  { name: "GreenLeaf Exports", package: "Silver",   amount: "₹75,000",   status: "Paid",    logo: "GL" },
  { name: "Reliance Retail",   package: "Silver",   amount: "₹75,000",   status: "Paid",    logo: "RR" },
  { name: "PrimeHealth Clinic",package: "Silver",   amount: "₹75,000",   status: "Pending", logo: "PH" },
  { name: "Saraswati Textiles",package: "Bronze",   amount: "₹25,000",   status: "Paid",    logo: "ST" },
  { name: "Kiran AutoWorks",   package: "Bronze",   amount: "₹25,000",   status: "Paid",    logo: "KA" },
];

type SponsorRow = { name: string; package: string; amount: string; status: string; logo: string };

const statusStyle: Record<string, { bg: string; text: string }> = {
  Paid:      { bg: "bg-emerald-50", text: "text-emerald-700" },
  CONFIRMED: { bg: "bg-emerald-50", text: "text-emerald-700" },
  Pending:   { bg: "bg-amber-50",   text: "text-amber-700"   },
  PENDING:   { bg: "bg-amber-50",   text: "text-amber-700"   },
  CANCELLED: { bg: "bg-rose-50",    text: "text-rose-700"    },
};

const pkgColor: Record<string, { bg: string; text: string }> = {
  Platinum: { bg: "bg-indigo-50", text: "text-indigo-700" },
  PLATINUM: { bg: "bg-indigo-50", text: "text-indigo-700" },
  Gold:     { bg: "bg-amber-50",  text: "text-amber-700"  },
  GOLD:     { bg: "bg-amber-50",  text: "text-amber-700"  },
  Silver:   { bg: "bg-slate-100", text: "text-slate-600"  },
  SILVER:   { bg: "bg-slate-100", text: "text-slate-600"  },
  Bronze:   { bg: "bg-indigo-50", text: "text-indigo-700" },
  BRONZE:   { bg: "bg-indigo-50", text: "text-indigo-700" },
};

function formatAmount(n: number | null): string {
  if (!n) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
}

function mapLiveSponsors(data: EventSponsorResponse[]): SponsorRow[] {
  return data.map(s => ({
    name: s.name,
    package: s.tier,
    amount: formatAmount(s.amountPledged),
    status: s.amountReceived && s.amountReceived >= (s.amountPledged ?? 0) ? "Paid" : "Pending",
    logo: s.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
  }));
}

export function EventsSponsors() {
  const { useMock } = useEventMock();
  const [liveSponsors, setLiveSponsors] = useState<SponsorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (useMock) return;
    setLoading(true);
    setError("");
    eventSponsorService.getAll()
      .then(data => setLiveSponsors(mapLiveSponsors(data)))
      .catch(e => setError(e.message ?? "Failed to load sponsors"))
      .finally(() => setLoading(false));
  }, [useMock]);

  const sponsors = useMock ? mockSponsors : liveSponsors;

  const totalCollected = useMock ? 1240000 : liveSponsors.filter(s => s.status === "Paid").reduce((a, s) => a + parseInt(s.amount.replace(/[^\d]/g, "") || "0"), 0);
  const totalTarget = useMock ? 1500000 : Math.max(totalCollected, 1);
  const pct = Math.round(totalCollected / totalTarget * 100);

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading sponsors...
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total Sponsors",  value: sponsors.length,                                                   color: "#6366f1" },
          { label: "Amount Collected",value: useMock ? "₹12.4L" : formatAmount(totalCollected),                 color: "#10b981" },
          { label: "Pending",         value: useMock ? "₹2.75L" : `${sponsors.filter(s => s.status === "Pending").length}`,  color: "#f59e0b" },
          { label: "Target Met",      value: `${pct}%`,                                                        color: "#4f46e5" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center">
            <p className="text-xl sm:text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 sm:mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Collection progress */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
          <h2 className="font-bold text-slate-800 text-sm sm:text-base">Sponsorship Collection</h2>
          <span className="text-xs sm:text-sm font-black text-indigo-600 flex-shrink-0">{formatAmount(totalCollected)} / {formatAmount(totalTarget)}</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
          <div
            className="animate-fade-in-up h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        {useMock && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4">
            {packages.map((pkg) => (
              <div key={pkg.name} className="text-center p-2.5 sm:p-3 rounded-xl" style={{ background: pkg.bg }}>
                <p className="font-black text-base sm:text-lg" style={{ color: pkg.color }}>{pkg.count}</p>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: pkg.color }}>{pkg.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Packages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.map((pkg) => (
          <div key={pkg.name}
            className="animate-fade-in-up bg-white rounded-2xl p-5 border shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-lg transition-shadow"
            style={{ borderColor: `${pkg.color}25` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: pkg.bg }}>
              <Gem className="w-5 h-5" style={{ color: pkg.color }} />
            </div>
            <p className="font-black text-slate-900 text-lg">{pkg.name}</p>
            <p className="font-bold mt-0.5" style={{ color: pkg.color }}>{pkg.price}</p>
            <ul className="mt-4 space-y-1.5">
              {pkg.perks.map(perk => (
                <li key={perk} className="flex items-start gap-2 text-xs text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: pkg.color }} />
                  {perk}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Sponsors table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-slate-50">
          <h2 className="font-bold text-slate-800 text-sm sm:text-base">Sponsors</h2>
          <button className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition-all shadow-sm">
            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Add Sponsor
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {sponsors.map((s) => {
            const ss = statusStyle[s.status] ?? statusStyle.Pending;
            const pc = pkgColor[s.package] ?? pkgColor.Bronze;
            return (
              <div key={s.name}
                className="animate-fade-in-up flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 hover:bg-slate-50/60 transition-colors">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[10px] sm:text-xs font-black flex-shrink-0 shadow-sm">
                  {s.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-xs sm:text-sm truncate">{s.name}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${pc.bg} ${pc.text}`}>{s.package}</span>
                </div>
                <p className="font-black text-slate-800 text-xs sm:text-sm tabular-nums">{s.amount}</p>
                <span className={`px-2 sm:px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0 ${ss.bg} ${ss.text}`}>{s.status}</span>
                <button className="text-slate-400 hover:text-indigo-500 transition-colors hidden sm:block">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
