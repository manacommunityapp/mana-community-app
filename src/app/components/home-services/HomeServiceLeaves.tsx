import { useState, useEffect } from "react";
import { CalendarOff, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { homeServiceApi } from "../../../services/homeServices/homeServiceApi";

interface LeaveRecord {
  id: string;
  workerId: string;
  workerName: string;
  leaveDate: string;
  reason: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  appliedOn: string;
}

export function HomeServiceLeaves() {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [filter, setFilter] = useState<"ALL" | "APPROVED" | "PENDING">("ALL");

  useEffect(() => {
    homeServiceApi.getWorkerLeaves().then(setLeaves);
  }, []);

  const filtered = leaves.filter((l) => {
    if (filter === "ALL") return true;
    return l.status === filter;
  });

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
          Worker Leave Management
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          View upcoming leaves and plan for substitute arrangements
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Leaves</span>
          <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">{leaves.length}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Approved</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">
            {leaves.filter((l) => l.status === "APPROVED").length}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Pending Approval</span>
          <span className="text-xl font-black text-amber-600 mt-1 block">
            {leaves.filter((l) => l.status === "PENDING").length}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit text-xs font-bold">
        {(["ALL", "APPROVED", "PENDING"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              filter === tab
                ? "bg-white dark:bg-slate-900 text-primary shadow-xs font-extrabold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((l) => (
          <div
            key={l.id}
            className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 font-black flex items-center justify-center shrink-0">
                <CalendarOff className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {l.workerName}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Leave on <span className="font-bold text-slate-700 dark:text-slate-300">{l.leaveDate}</span> • Applied {l.appliedOn}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 italic">
                  "{l.reason}"
                </p>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase self-end sm:self-auto ${
                l.status === "APPROVED"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : l.status === "PENDING"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {l.status}
            </span>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-sm font-bold text-slate-400">No leave records found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
