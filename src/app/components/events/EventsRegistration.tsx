import { useState } from "react";
import { Search, Download, QrCode, Filter, CheckCircle2, Clock, XCircle, Plus } from "lucide-react";
import { NoBackendBanner } from "./EventMockToggle";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { cn } from "../ui/utils";

const categories = ["All", "Family", "Individual", "VIP", "Volunteer", "Committee", "Sponsor", "Media"];

// No backend endpoint yet — mock data only
const registrants = [
  { id: "REG-001", name: "Ramesh Sharma",   category: "VIP",        tickets: 2, amount: "₹2,000", status: "Confirmed", time: "2h ago"  },
  { id: "REG-002", name: "Priya Iyer",      category: "Family",     tickets: 4, amount: "₹1,600", status: "Confirmed", time: "3h ago"  },
  { id: "REG-003", name: "Karan Mehta",     category: "Individual", tickets: 1, amount: "₹400",   status: "Pending",   time: "5h ago"  },
  { id: "REG-004", name: "Neha Kulkarni",   category: "Volunteer",  tickets: 1, amount: "Free",   status: "Confirmed", time: "6h ago"  },
  { id: "REG-005", name: "Arvind Patel",    category: "Family",     tickets: 5, amount: "₹2,000", status: "Confirmed", time: "8h ago"  },
  { id: "REG-006", name: "Sudha Reddy",     category: "Committee",  tickets: 1, amount: "Free",   status: "Confirmed", time: "1d ago"  },
  { id: "REG-007", name: "Vikram Singh",    category: "Individual", tickets: 1, amount: "₹400",   status: "Cancelled", time: "1d ago"  },
  { id: "REG-008", name: "Anita Desai",     category: "Sponsor",    tickets: 10,amount: "₹15,000",status: "Confirmed", time: "2d ago"  },
  { id: "REG-009", name: "Media Corp TV",   category: "Media",      tickets: 3, amount: "Free",   status: "Pending",   time: "2d ago"  },
  { id: "REG-010", name: "Deepak Joshi",    category: "VIP",        tickets: 2, amount: "₹2,000", status: "Confirmed", time: "3d ago"  },
];

const statusStyle: Record<string, { icon: any; bg: string; text: string }> = {
  Confirmed: { icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-600" },
  Pending:   { icon: Clock,        bg: "bg-amber-50",   text: "text-amber-600"   },
  Cancelled: { icon: XCircle,      bg: "bg-rose-50",    text: "text-rose-600"    },
};

const catStats = [
  { label: "Total",      value: 1842, color: "#4f46e5" },
  { label: "Family",     value: 520,  color: "#6366f1" },
  { label: "Individual", value: 680,  color: "#0891b2" },
  { label: "VIP",        value: 120,  color: "#7c3aed" },
  { label: "Volunteer",  value: 318,  color: "#10b981" },
  { label: "Other",      value: 204,  color: "#8b5cf6" },
];

export function EventsRegistration() {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = registrants.filter(r =>
    (activeTab === "All" || r.category === activeTab) &&
    (r.name.toLowerCase().includes(search.toLowerCase()) || r.id.includes(search))
  );

  return (
    <div className="space-y-6">
      <NoBackendBanner feature="Registration Management" />
      {/* Stats strip */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
        {catStats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center">
            <p className="text-2xl font-black tabular-nums" style={{ color: s.color }}>{s.value.toLocaleString()}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-50 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-bold text-slate-800">Registrant List</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 h-auto">
                <Download className="w-3.5 h-3.5" /> Export
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 h-auto">
                <QrCode className="w-3.5 h-3.5" /> Print Passes
              </Button>
              <Button size="sm" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm h-auto">
                <Plus className="w-3.5 h-3.5" /> Add Registrant
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 flex-1 min-w-48 max-w-64">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or ID…"
                className="bg-transparent border-none shadow-none h-auto p-0 text-sm outline-none flex-1 placeholder-slate-400 text-slate-700 focus-visible:ring-0" />
            </div>
            {/* Category tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {categories.map(c => (
                <button key={c} onClick={() => setActiveTab(c)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                    activeTab === c ? "bg-indigo-500 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                  )}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table className="text-sm">
            <TableHeader>
              <TableRow className="bg-slate-50/80 border-b border-slate-100 hover:bg-slate-50/80">
                {["ID", "Name", "Category", "Tickets", "Amount", "Status", "Time", "Actions"].map(h => (
                  <TableHead key={h} className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap h-auto">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-50">
              {filtered.map((r) => {
                const ss = statusStyle[r.status];
                return (
                  <TableRow key={r.id} className="animate-fade-in-up hover:bg-slate-50/60 transition-colors">
                    <TableCell className="px-6 py-3.5 font-mono text-xs text-slate-400">{r.id}</TableCell>
                    <TableCell className="px-6 py-3.5 font-semibold text-slate-800">{r.name}</TableCell>
                    <TableCell className="px-6 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600">{r.category}</span>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-slate-600 font-medium tabular-nums">{r.tickets}</TableCell>
                    <TableCell className="px-6 py-3.5 font-bold text-slate-800 tabular-nums">{r.amount}</TableCell>
                    <TableCell className="px-6 py-3.5">
                      <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-[10px] font-bold ${ss.bg} ${ss.text}`}>
                        <ss.icon className="w-3 h-3" /> {r.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-xs text-slate-400">{r.time}</TableCell>
                    <TableCell className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <button className="text-xs font-semibold text-indigo-600 hover:underline">View</button>
                        <button className="text-xs font-semibold text-indigo-600 hover:underline">Pass</button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="px-6 py-4 border-t border-slate-50 text-xs text-slate-400">
          Showing {filtered.length} of {registrants.length} registrants
        </div>
      </div>
    </div>
  );
}
