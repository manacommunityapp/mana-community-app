import { useState, useEffect, useCallback } from "react";
import { FileSpreadsheet, Download, RefreshCw, Plus, Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import { complianceService, type GeneratedReport, REPORT_TYPES } from "../../../../services/complianceService";
import { getStoredUser } from "../../../../services/common/apiClient";

const PERIODS: string[] = (() => {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return result;
})();

function formatReportType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPeriod(period: string) {
  const [year, month] = period.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function StatusChip({ status }: { status: GeneratedReport["status"] }) {
  const map = {
    READY: "bg-green-100 text-green-700",
    GENERATING: "bg-blue-100 text-blue-700",
    FAILED: "bg-red-100 text-red-700",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>{status}</span>;
}

export function ComplianceReportsPage() {
  const user = getStoredUser();
  const communityId: number = (user as { communityId?: number })?.communityId ?? 0;

  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [genType, setGenType] = useState<string>(REPORT_TYPES[0]);
  const [genPeriod, setGenPeriod] = useState(PERIODS[0]);
  const [generating, setGenerating] = useState(false);

  const fetchReports = useCallback(() => {
    setLoading(true);
    complianceService.getReports(communityId, filterType || undefined)
      .then(setReports)
      .catch(() => toast.error("Failed to load reports"))
      .finally(() => setLoading(false));
  }, [communityId, filterType]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const r = await complianceService.generateReport(communityId, genType, genPeriod);
      toast.success("Report generation started");
      setReports((prev) => [r, ...prev]);
      setShowModal(false);
    } catch { toast.error("Failed to generate report"); }
    setGenerating(false);
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-800">Compliance Reports</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchReports} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Generate Report
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterType("")} className={`px-3 py-1 rounded-full text-xs font-medium border ${filterType === "" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"}`}>All</button>
        {REPORT_TYPES.map((t) => (
          <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1 rounded-full text-xs font-medium border ${filterType === t ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"}`}>
            {formatReportType(t)}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No reports found. Generate one to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Period</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Generated</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rows</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-medium text-slate-700">{formatReportType(r.reportType)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatPeriod(r.reportPeriod)}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(r.generatedAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{r.rowCount ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{r.totalAmount != null ? `₹${r.totalAmount.toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-4 py-3 text-center"><StatusChip status={r.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {r.fileUrl && r.status === "READY" ? (
                      <a href={r.fileUrl} download className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-xs font-medium">
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Generate modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h2 className="font-bold text-slate-800">Generate Report</h2>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Report Type</label>
              <select value={genType} onChange={(e) => setGenType(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                {REPORT_TYPES.map((t) => <option key={t} value={t}>{formatReportType(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Period</label>
              <select value={genPeriod} onChange={(e) => setGenPeriod(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                {PERIODS.map((p) => <option key={p} value={p}>{formatPeriod(p)}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200">Cancel</button>
              <button onClick={handleGenerate} disabled={generating} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
