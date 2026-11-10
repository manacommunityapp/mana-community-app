import { useEffect, useState } from "react";
import { Download, Trash2, Save, RefreshCw, FileBarChart } from "lucide-react";
import { hrmService } from "../../../services/hrm/hrmService";
import type { HrReportConfig } from "../../../types/hrm";

interface Props { orgId: number }

const REPORT_TYPES = [
  { value: "HEADCOUNT", label: "Headcount Report" },
  { value: "ATTRITION", label: "Attrition Report" },
  { value: "ATTENDANCE", label: "Attendance Summary" },
  { value: "LEAVE", label: "Leave Utilization" },
  { value: "PAYROLL", label: "Payroll Summary" },
];

export default function CustomReportBuilder({ orgId }: Props) {
  const [configs, setConfigs] = useState<HrReportConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("HEADCOUNT");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const load = () => {
    if (!orgId) return;
    setLoading(true);
    hrmService.getReportConfigs(orgId).then(setConfigs).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [orgId]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await hrmService.saveReportConfig(orgId, { name: name.trim(), reportType });
      setName("");
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await hrmService.deleteReportConfig(orgId, id);
      load();
    } catch {}
  };

  const exportCsv = async (type: string, configName: string) => {
    setExporting(type);
    try {
      const blob = await hrmService.exportReport(orgId, type);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${configName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
    } finally {
      setExporting(null);
    }
  };

  if (!orgId) return <p className="text-muted-foreground">Select an organisation.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-semibold">Custom Reports</h2>
          <p className="text-sm text-muted-foreground">Save report templates and export CSV data</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2"><FileBarChart className="h-4 w-4" /> New Report</h3>
        <div className="flex gap-3 flex-wrap">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Report name…"
            className="text-sm rounded-lg border border-border bg-background px-3 py-2 flex-1 min-w-[180px]"
          />
          <select
            value={reportType}
            onChange={e => setReportType(e.target.value)}
            className="text-sm rounded-lg border border-border bg-background px-3 py-2"
          >
            {REPORT_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => exportCsv(reportType, REPORT_TYPES.find(r => r.value === reportType)?.label ?? reportType)}
            disabled={!!exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> {exporting === reportType ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Saved Reports</h3>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : configs.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground text-sm">No saved report configurations yet.</p>
        ) : (
          <div className="space-y-2">
            {configs.map(c => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <FileBarChart className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.reportType.replace(/_/g, " ")} · {new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => exportCsv(c.reportType, c.name)}
                  disabled={!!exporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-accent disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" /> {exporting === c.reportType ? "…" : "CSV"}
                </button>
                <button onClick={() => remove(c.id)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
