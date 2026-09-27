import { useState } from "react";
import {
  CheckCircle2, ArrowRight, IndianRupee, Clock,
  Users, Building2, Plus, Calendar, AlertCircle, FileText
} from "lucide-react";
import { toast } from "react-toastify";

interface ActionItem {
  id: string;
  title: string;
  owner: string;
  role: string;
  dueDate: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED";
  budget: string;
  expense: string;
}

interface Resolution {
  id: string;
  code: string;
  title: string;
  passedDate: string;
  result: "APPROVED" | "REJECTED";
  summary: string;
  budget: string;
  financeCode: string;
  votesFor: number;
  votesAgainst: number;
  actions: ActionItem[];
}

const MOCK_RESOLUTIONS: Resolution[] = [
  {
    id: "1",
    code: "RES-2026-0042",
    title: "Approval of Basement EV Fast-Charging Station Installation & Vendor SLA",
    passedDate: "15 Oct 2026",
    result: "APPROVED",
    summary: "The General Body hereby resolves to approve ₹8,50,000 for the procurement and commissioning of 12 dedicated EV chargers in Basement 1 & 2 with smart load balancing and RFID tag billing.",
    budget: "₹8,50,000",
    financeCode: "BDG-CAPEX-2026-EV01",
    votesFor: 612,
    votesAgainst: 143,
    actions: [
      { id: "a-1", title: "Obtain 3 Comparative Vendor Quotations (Tata Power, Statiq, Ather)", owner: "Arjun Rao", role: "Facility Operations", dueDate: "25 Oct 2026", status: "COMPLETED", budget: "₹25,000", expense: "₹20,000" },
      { id: "a-2", title: "Finalize Vendor Contract & Sanction Electrical Load with BESCOM", owner: "Sandeep Kumar", role: "President", dueDate: "05 Nov 2026", status: "IN_PROGRESS", budget: "₹4,50,000", expense: "₹0" },
      { id: "a-3", title: "Civil Cabling, Charger Mounting & RFID Provisioning", owner: "Lead Electrical Contractor", role: "Vendor Partner", dueDate: "25 Nov 2026", status: "OPEN", budget: "₹3,75,000", expense: "₹0" },
    ]
  },
  {
    id: "2",
    code: "RES-2025-0018",
    title: "ANPR Boom Barrier & AI Security Gate Modernization",
    passedDate: "10 Nov 2025",
    result: "APPROVED",
    summary: "Approval of ₹4,20,000 for automatic vehicle number plate recognition barriers at Main Gate and Tower B entrance.",
    budget: "₹4,20,000",
    financeCode: "BDG-CAPEX-2025-SEC02",
    votesFor: 589,
    votesAgainst: 82,
    actions: [
      { id: "a-4", title: "Boom barrier hardware installation & ANPR camera calibration", owner: "Vikram R.", role: "Security Lead", dueDate: "15 Dec 2025", status: "COMPLETED", budget: "₹4,20,000", expense: "₹4,12,000" }
    ]
  }
];

export function ResolutionsBoard() {
  const [resolutions, setResolutions] = useState<Resolution[]>(MOCK_RESOLUTIONS);
  const [selectedResolution, setSelectedResolution] = useState<Resolution>(MOCK_RESOLUTIONS[0]);

  const toggleActionStatus = (actionId: string) => {
    setResolutions(prev => prev.map(res => {
      if (res.id === selectedResolution.id) {
        const updatedActions = res.actions.map(a => {
          if (a.id === actionId) {
            const nextStatus = a.status === "OPEN" ? "IN_PROGRESS" : a.status === "IN_PROGRESS" ? "COMPLETED" : "OPEN";
            return { ...a, status: nextStatus as any };
          }
          return a;
        });
        const updatedRes = { ...res, actions: updatedActions };
        setSelectedResolution(updatedRes);
        return updatedRes;
      }
      return res;
    }));
    toast.success("Action item status updated successfully!");
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" /> Passed Resolutions & Action Item Board
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Closing the loop: Decisions → Financial Budget Codes → Assigned Action Items → Execution.
          </p>
        </div>
      </div>

      {/* ── Main Layout: Resolutions Selector + Action Board ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Resolutions List */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Official Resolutions Archive
          </h3>

          {resolutions.map((res) => (
            <div
              key={res.id}
              onClick={() => setSelectedResolution(res)}
              className={`p-4 rounded-3xl border cursor-pointer transition-all ${
                selectedResolution.id === res.id
                  ? "bg-white dark:bg-[#1E1E36] border-indigo-500 shadow-md ring-1 ring-indigo-300 dark:ring-indigo-900"
                  : "bg-white dark:bg-[#1E1E36] border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-black rounded-md">
                  {res.code}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">Passed {res.passedDate}</span>
              </div>

              <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-2 leading-snug">{res.title}</h4>
              <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-500">
                <span>Budget: <strong className="text-slate-800 dark:text-slate-200">{res.budget}</strong></span>
                <span>•</span>
                <span>{res.actions.length} Action Tasks</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right 2 Cols: Action Item Task Board for Selected Resolution */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black rounded-lg">
                  {selectedResolution.code} · Enacted
                </span>
                <span className="text-[11px] text-slate-400">Finance Budget Code: <strong className="text-indigo-600">{selectedResolution.financeCode}</strong></span>
              </div>

              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1.5">
                {selectedResolution.title}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                {selectedResolution.summary}
              </p>
            </div>

            {/* Action Items List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" /> Operational Action Items & Assigned Leads
                </h3>
              </div>

              <div className="space-y-3">
                {selectedResolution.actions.map((act) => (
                  <div
                    key={act.id}
                    className="p-4 bg-slate-50 dark:bg-[#262644] border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">{act.title}</h4>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        <span>Lead: <strong>{act.owner}</strong> ({act.role})</span>
                        <span>•</span>
                        <span>Due: <strong className="text-slate-700 dark:text-slate-300">{act.dueDate}</strong></span>
                        <span>•</span>
                        <span>Budget: {act.budget}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleActionStatus(act.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer self-start sm:self-center ${
                        act.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300"
                          : act.status === "IN_PROGRESS"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {act.status === "COMPLETED" ? "✓ Completed" : act.status === "IN_PROGRESS" ? "⏳ In Progress" : "⭕ Open"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
