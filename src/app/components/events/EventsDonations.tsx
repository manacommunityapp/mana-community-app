import { useState, useEffect } from "react";
import { IndianRupee, Package, Plus, Download, Loader2, AlertCircle } from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { eventDonationService, type EventDonationResponse } from "../../../services/events/eventDonationService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

const donationTypes = [
  { label: "Cash",              value: "₹2,40,000", icon: IndianRupee, color: "#10b981", bg: "#ecfdf5" },
  { label: "UPI / Online",      value: "₹1,85,000", icon: IndianRupee, color: "#6366f1", bg: "#eef2ff" },
  { label: "Cheque",            value: "₹80,000",   icon: IndianRupee, color: "#0891b2", bg: "#ecfeff" },
  { label: "Material Donations",value: "₹1,15,000", icon: Package,     color: "#d97706", bg: "#fffbeb" },
];

const mockDonations = [
  { id: "DON-001", donor: "Krishnamurthy S.", type: "Cash",       item: "₹25,000",         receipt: "RCP-001", date: "Aug 2" },
  { id: "DON-002", donor: "Lakshmi Devi",     type: "Gold",       item: "50g Gold coin",   receipt: "RCP-002", date: "Aug 2" },
  { id: "DON-003", donor: "Raghunath Rao",    type: "UPI",        item: "₹10,000",         receipt: "RCP-003", date: "Aug 1" },
  { id: "DON-004", donor: "Subhash Reddy",    type: "Rice",       item: "100 kg Basmati",  receipt: "RCP-004", date: "Aug 1" },
  { id: "DON-005", donor: "Venkatesha M.",    type: "Cash",       item: "₹50,000",         receipt: "RCP-005", date: "Jul 31" },
  { id: "DON-006", donor: "Annapurna S.",     type: "Milk",       item: "500 litres",      receipt: "RCP-006", date: "Jul 30" },
  { id: "DON-007", donor: "Tirumala Trust",   type: "Cheque",     item: "₹1,00,000",       receipt: "RCP-007", date: "Jul 28" },
  { id: "DON-008", donor: "Chandran Pillai",  type: "Vegetables", item: "Mixed vegetables 50kg", receipt: "RCP-008", date: "Jul 27" },
];

type DonationRow = { id: string; donor: string; type: string; item: string; receipt: string; date: string };

const typeColors: Record<string, { bg: string; text: string }> = {
  Cash:          { bg: "bg-emerald-50", text: "text-emerald-700" },
  CASH:          { bg: "bg-emerald-50", text: "text-emerald-700" },
  UPI:           { bg: "bg-indigo-50",  text: "text-indigo-700"  },
  ONLINE:        { bg: "bg-indigo-50",  text: "text-indigo-700"  },
  Cheque:        { bg: "bg-cyan-50",    text: "text-cyan-700"    },
  CHEQUE:        { bg: "bg-cyan-50",    text: "text-cyan-700"    },
  BANK_TRANSFER: { bg: "bg-sky-50",     text: "text-sky-700"     },
  Gold:          { bg: "bg-amber-50",   text: "text-amber-700"   },
  Rice:          { bg: "bg-indigo-50",  text: "text-indigo-700"  },
  Milk:          { bg: "bg-sky-50",     text: "text-sky-700"     },
  Vegetables:    { bg: "bg-lime-50",    text: "text-lime-700"    },
};

function mapLiveDonations(data: EventDonationResponse[]): DonationRow[] {
  return data.map(d => ({
    id: `DON-${String(d.id).padStart(3, "0")}`,
    donor: d.anonymous ? "Anonymous" : d.donorName,
    type: d.paymentMethod,
    item: `₹${d.amount.toLocaleString("en-IN")}`,
    receipt: d.transactionRef ?? "—",
    date: new Date(d.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
  }));
}

export function EventsDonations() {
  const { useMock } = useEventMock();
  const [liveDonations, setLiveDonations] = useState<DonationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (useMock) return;
    setLoading(true);
    setError("");
    eventDonationService.getAll()
      .then(data => setLiveDonations(mapLiveDonations(data)))
      .catch(e => setError(e.message ?? "Failed to load donations"))
      .finally(() => setLoading(false));
  }, [useMock]);

  const donations = useMock ? mockDonations : liveDonations;
  const totalAmount = useMock ? 620000 : liveDonations.reduce((a, d) => a + parseInt(d.item.replace(/[^\d]/g, "") || "0"), 0);

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading donations...
        </div>
      )}

      {/* Type summary — mock only for breakdown */}
      {useMock && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {donationTypes.map((d) => (
            <div key={d.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: d.bg }}>
                <d.icon className="w-4 h-4" style={{ color: d.color }} />
              </div>
              <p className="text-xl font-black" style={{ color: d.color }}>{d.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">{d.label}</p>
            </div>
          ))}
        </div>
      )}

      {!useMock && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center">
            <p className="text-2xl font-black text-indigo-600">{donations.length}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Total Donations</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center">
            <p className="text-2xl font-black text-emerald-600">₹{totalAmount.toLocaleString("en-IN")}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Total Amount</p>
          </div>
        </div>
      )}

      {/* Donation progress towards goal */}
      {useMock && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-800">Total Donations vs Target</h2>
            <div>
              <span className="text-lg font-black text-rose-600">₹6.2L</span>
              <span className="text-slate-400 text-sm"> / ₹8L goal</span>
            </div>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="animate-fade-in-up h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-400"
              style={{ width: "77.5%" }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">77.5% of target achieved · ₹1.8L remaining</p>
        </div>
      )}

      {/* Donation list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-50">
          <h2 className="font-bold text-slate-800">Donation Ledger</h2>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition-all shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Record Donation
            </button>
          </div>
        </div>
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="bg-slate-50/80 border-b border-slate-100 hover:bg-slate-50/80">
              {["ID", "Donor Name", "Type", "Item / Amount", "Receipt", "Date", "Actions"].map(h => (
                <TableHead key={h} className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap h-auto">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-50">
            {donations.map((d) => {
              const tc = typeColors[d.type] || { bg: "bg-slate-50", text: "text-slate-600" };
              return (
                <TableRow key={d.id} className="animate-fade-in-up hover:bg-slate-50/60 transition-colors">
                  <TableCell className="px-6 py-3.5 font-mono text-xs text-slate-400">{d.id}</TableCell>
                  <TableCell className="px-6 py-3.5 font-semibold text-slate-800">{d.donor}</TableCell>
                  <TableCell className="px-6 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${tc.bg} ${tc.text}`}>{d.type}</span>
                  </TableCell>
                  <TableCell className="px-6 py-3.5 font-semibold text-slate-700">{d.item}</TableCell>
                  <TableCell className="px-6 py-3.5 font-mono text-xs text-indigo-600">{d.receipt}</TableCell>
                  <TableCell className="px-6 py-3.5 text-xs text-slate-400">{d.date}</TableCell>
                  <TableCell className="px-6 py-3.5">
                    <div className="flex gap-2">
                      <button className="text-xs font-semibold text-indigo-600 hover:underline">Receipt</button>
                      <button className="text-xs font-semibold text-violet-600 hover:underline">Certificate</button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
