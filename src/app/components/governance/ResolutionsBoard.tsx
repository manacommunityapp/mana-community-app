import { useState, useEffect } from "react";
import { CheckCircle2, FileText, RefreshCw } from "lucide-react";
import { governanceService, type Resolution as ApiResolution } from "../../../../services/governance/governanceService";
import { useTenantContext } from "../../../../contexts/TenantContext";

export function ResolutionsBoard() {
  const { communityId } = useTenantContext();
  const [apiResolutions, setApiResolutions] = useState<ApiResolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    if (!communityId) return;
    setLoading(true);
    governanceService.getResolutions(communityId, statusFilter === "ALL" ? undefined : statusFilter)
      .then(setApiResolutions)
      .finally(() => setLoading(false));
  }, [communityId, statusFilter]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedResolution = apiResolutions.find(r => r.id === selectedId) ?? apiResolutions[0] ?? null;

  const statusColor: Record<string, string> = {
    PASSED:        "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    REJECTED:      "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    OPEN_FOR_VOTE: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    PROPOSED:      "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    WITHDRAWN:     "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  };

  const STATUS_FILTERS = ["ALL", "PASSED", "OPEN_FOR_VOTE", "PROPOSED", "REJECTED"];

  return (
    <div className="space-y-6">
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" /> Resolutions Board
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Community decisions — proposals, votes, passed resolutions and their outcomes.
          </p>
        </div>
        <button onClick={() => {
          if (!communityId) return;
          setLoading(true);
          governanceService.getResolutions(communityId, statusFilter === "ALL" ? undefined : statusFilter)
            .then(setApiResolutions).finally(() => setLoading(false));
        }} className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer self-start">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ── Status Filter Chips ──────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${statusFilter === s ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-[#1E1E36] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300"}`}>
            {s === "ALL" ? "All" : s === "OPEN_FOR_VOTE" ? "Open for Vote" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12"><RefreshCw className="w-6 h-6 text-indigo-400 mx-auto animate-spin" /></div>
      ) : apiResolutions.length === 0 ? (
        <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">No Resolutions Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            Resolutions proposed during General Body Meetings and committee sessions will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Col: Resolutions List */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {apiResolutions.length} Resolution{apiResolutions.length !== 1 ? "s" : ""}
            </h3>
            {apiResolutions.map((res) => (
              <div key={res.id} onClick={() => setSelectedId(res.id)}
                className={`p-4 rounded-3xl border cursor-pointer transition-all ${
                  selectedResolution?.id === res.id
                    ? "bg-white dark:bg-[#1E1E36] border-indigo-500 shadow-md ring-1 ring-indigo-300 dark:ring-indigo-900"
                    : "bg-white dark:bg-[#1E1E36] border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}>
                <div className="flex justify-between items-start gap-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${statusColor[res.status] ?? statusColor.WITHDRAWN}`}>
                    {res.status === "OPEN_FOR_VOTE" ? "Open for Vote" : res.status.charAt(0) + res.status.slice(1).toLowerCase()}
                  </span>
                  <span className="text-[10px] text-slate-400">{new Date(res.createdAt).toLocaleDateString("en-IN")}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-2 leading-snug">{res.title}</h4>
                <div className="mt-2 text-[10px] text-slate-500">
                  {res.resolutionType.charAt(0) + res.resolutionType.slice(1).toLowerCase()} resolution
                </div>
              </div>
            ))}
          </div>

          {/* Right 2 Cols: Resolution Detail */}
          <div className="lg:col-span-2">
            {selectedResolution ? (
              <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xs">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${statusColor[selectedResolution.status] ?? statusColor.WITHDRAWN}`}>
                      {selectedResolution.status === "OPEN_FOR_VOTE" ? "Open for Vote" : selectedResolution.status.charAt(0) + selectedResolution.status.slice(1).toLowerCase()}
                    </span>
                    <span className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {selectedResolution.resolutionType.charAt(0) + selectedResolution.resolutionType.slice(1).toLowerCase()} Resolution
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{selectedResolution.title}</h2>
                  {selectedResolution.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{selectedResolution.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-3 bg-slate-50 dark:bg-[#262644] rounded-xl">
                    <div className="text-[10px] text-slate-500 mb-0.5">Submitted</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{new Date(selectedResolution.createdAt).toLocaleDateString("en-IN")}</div>
                  </div>
                  {selectedResolution.passedAt && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                      <div className="text-[10px] text-emerald-600 mb-0.5">Passed</div>
                      <div className="text-xs font-bold text-emerald-800 dark:text-emerald-200">{new Date(selectedResolution.passedAt).toLocaleDateString("en-IN")}</div>
                    </div>
                  )}
                  {selectedResolution.rejectedAt && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl">
                      <div className="text-[10px] text-rose-600 mb-0.5">Rejected</div>
                      <div className="text-xs font-bold text-rose-800 dark:text-rose-200">{new Date(selectedResolution.rejectedAt).toLocaleDateString("en-IN")}</div>
                    </div>
                  )}
                  {selectedResolution.linkedPollId && (
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl">
                      <div className="text-[10px] text-indigo-600 mb-0.5">Linked Poll</div>
                      <div className="text-xs font-bold text-indigo-800 dark:text-indigo-200">#{selectedResolution.linkedPollId}</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Select a resolution to view details.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
