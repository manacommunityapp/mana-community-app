import { useEffect, useState } from "react";
import { TrendingUp, Plus, RefreshCw, Loader2 } from "lucide-react";
import { workforce360Service } from "../../../services/workforce360Service";
import { useHrmOrg } from "../../../contexts/HrmOrgContext";
import type { MwForecastSummary, MwForecastConfig, MwForecastSnapshot } from "../../../types/hrm";

type Tab = "overview" | "snapshots" | "settings";

function ConfidenceBadge({ pct }: { pct: number }) {
  const cls =
    pct >= 70 ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" :
    pct >= 50 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" :
                "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{pct}%</span>;
}

function ModuleBadge({ module }: { module: string }) {
  const styles: Record<string, string> = {
    POOL:       "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    JOBS:       "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    MANA_FRESH: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[module] ?? "bg-gray-100 text-gray-600"}`}>{module}</span>;
}

function fmtWeek(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function AddSnapshotModal({ orgId, onClose, onDone }: { orgId: number; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ weekStartDate: "", sourceModule: "POOL", demandUnits: 0, fulfilledUnits: 0, avgPayRate: 0, workerCount: 0, notes: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!form.weekStartDate) { setErr("Select a week start date"); return; }
    setSaving(true);
    try {
      await workforce360Service.addForecastSnapshot(orgId, { ...form, weekStartDate: form.weekStartDate });
      onDone();
    } catch {
      setErr("Failed to save snapshot");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h3 className="mb-4 text-base font-semibold text-foreground">Add Demand Snapshot</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Week Start Date</label>
              <input
                type="date" value={form.weekStartDate} onChange={e => setForm(f => ({ ...f, weekStartDate: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Module</label>
              <select
                value={form.sourceModule} onChange={e => setForm(f => ({ ...f, sourceModule: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="POOL">POOL</option>
                <option value="JOBS">JOBS</option>
                <option value="MANA_FRESH">MANA_FRESH</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Demand Units</label>
              <input type="number" min="0" value={form.demandUnits} onChange={e => setForm(f => ({ ...f, demandUnits: Number(e.target.value) }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Fulfilled Units</label>
              <input type="number" min="0" value={form.fulfilledUnits} onChange={e => setForm(f => ({ ...f, fulfilledUnits: Number(e.target.value) }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Avg Pay Rate (₹)</label>
              <input type="number" min="0" step="0.5" value={form.avgPayRate} onChange={e => setForm(f => ({ ...f, avgPayRate: Number(e.target.value) }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Worker Count</label>
              <input type="number" min="0" value={form.workerCount} onChange={e => setForm(f => ({ ...f, workerCount: Number(e.target.value) }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
          {err && <p className="text-xs text-red-500">{err}</p>}
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ForecastDashboard() {
  const { activeOrgId } = useHrmOrg();
  const [tab, setTab] = useState<Tab>("overview");
  const [summary, setSummary] = useState<MwForecastSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showAddSnapshot, setShowAddSnapshot] = useState(false);
  const [configForm, setConfigForm] = useState<Partial<MwForecastConfig>>({});
  const [savingConfig, setSavingConfig] = useState(false);
  const [configMsg, setConfigMsg] = useState("");

  function load() {
    if (!activeOrgId) return;
    setLoading(true);
    workforce360Service.getForecastSummary(activeOrgId)
      .then(s => { setSummary(s); setConfigForm(s.config); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [activeOrgId]);

  async function generate() {
    if (!activeOrgId) return;
    setGenerating(true);
    try {
      await workforce360Service.generateProjections(activeOrgId);
      load();
    } catch {
      /* noop */
    } finally {
      setGenerating(false);
    }
  }

  async function saveConfig() {
    if (!activeOrgId) return;
    setSavingConfig(true);
    try {
      await workforce360Service.updateForecastConfig(activeOrgId, configForm);
      setConfigMsg("Saved.");
      setTimeout(() => setConfigMsg(""), 2500);
      load();
    } catch {
      setConfigMsg("Failed to save.");
    } finally {
      setSavingConfig(false);
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview",  label: "Overview" },
    { id: "snapshots", label: "Snapshots" },
    { id: "settings",  label: "Settings" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  const modules = summary ? Object.keys(summary.gapByModule) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Workforce Forecasting</h1>
          <p className="text-sm text-muted-foreground">Demand snapshots, projections and gap analysis</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && summary && (
        <div className="space-y-5">
          {/* Gap cards */}
          {modules.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {modules.map(m => {
                const gap = summary.gapByModule[m] ?? 0;
                return (
                  <div key={m} className={`rounded-xl border p-4 shadow-sm ${gap > 0 ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20" : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"}`}>
                    <div className="mb-1 flex items-center gap-2">
                      <ModuleBadge module={m} />
                    </div>
                    <p className={`text-2xl font-bold ${gap > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>{gap}</p>
                    <p className="text-xs text-muted-foreground">unfulfilled demand units</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              No snapshot data yet. Add snapshots to see gap analysis.
            </p>
          )}

          {/* Generate + projections */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Projections ({summary.config.horizonWeeks}-week horizon)
            </h2>
            <button
              onClick={generate}
              disabled={generating}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Generate Projections
            </button>
          </div>

          {summary.projections.length === 0 ? (
            <p className="rounded-xl border border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              No projections yet. Click "Generate Projections" to compute.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="px-4 py-2 text-left font-medium">Week</th>
                      <th className="px-4 py-2 text-left font-medium">Module</th>
                      <th className="px-4 py-2 text-right font-medium">Projected Demand</th>
                      <th className="px-4 py-2 text-center font-medium">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {summary.projections.map(p => (
                      <tr key={p.id} className="hover:bg-muted/30">
                        <td className="px-4 py-2 text-xs">{fmtWeek(p.projectedWeek)}</td>
                        <td className="px-4 py-2"><ModuleBadge module={p.sourceModule} /></td>
                        <td className="px-4 py-2 text-right font-medium">{p.projectedDemand}</td>
                        <td className="px-4 py-2 text-center"><ConfidenceBadge pct={p.confidencePct} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Snapshots Tab */}
      {tab === "snapshots" && summary && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Demand Snapshots</h2>
            <button
              onClick={() => setShowAddSnapshot(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> Add Snapshot
            </button>
          </div>
          {summary.recentSnapshots.length === 0 ? (
            <p className="rounded-xl border border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">No snapshots yet.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="px-4 py-2 text-left font-medium">Week</th>
                      <th className="px-4 py-2 text-left font-medium">Module</th>
                      <th className="px-4 py-2 text-right font-medium">Demand</th>
                      <th className="px-4 py-2 text-right font-medium">Fulfilled</th>
                      <th className="px-4 py-2 text-right font-medium">Gap</th>
                      <th className="px-4 py-2 text-right font-medium">Avg Pay</th>
                      <th className="px-4 py-2 text-right font-medium">Workers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {summary.recentSnapshots.map(s => {
                      const gap = s.demandUnits - s.fulfilledUnits;
                      return (
                        <tr key={s.id} className="hover:bg-muted/30">
                          <td className="px-4 py-2 text-xs">{fmtWeek(s.weekStartDate)}</td>
                          <td className="px-4 py-2"><ModuleBadge module={s.sourceModule} /></td>
                          <td className="px-4 py-2 text-right">{s.demandUnits}</td>
                          <td className="px-4 py-2 text-right">{s.fulfilledUnits}</td>
                          <td className={`px-4 py-2 text-right font-semibold ${gap > 0 ? "text-red-500" : "text-green-500"}`}>{gap}</td>
                          <td className="px-4 py-2 text-right text-muted-foreground">{s.avgPayRate != null ? `₹${s.avgPayRate}` : "—"}</td>
                          <td className="px-4 py-2 text-right">{s.workerCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {tab === "settings" && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Forecasting Configuration</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Horizon (weeks)</label>
              <input type="number" min="1" max="52"
                value={configForm.horizonWeeks ?? 4}
                onChange={e => setConfigForm(f => ({ ...f, horizonWeeks: Number(e.target.value) }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Min Workers / Shift</label>
              <input type="number" min="1"
                value={configForm.minWorkersPerShift ?? 1}
                onChange={e => setConfigForm(f => ({ ...f, minWorkersPerShift: Number(e.target.value) }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Peak Day Multiplier</label>
              <input type="number" min="1" max="5" step="0.1"
                value={configForm.peakDayMultiplier ?? 1.5}
                onChange={e => setConfigForm(f => ({ ...f, peakDayMultiplier: Number(e.target.value) }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Source Modules</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {["POOL","JOBS","MANA_FRESH"].map(m => {
                  const active = (configForm.sourceModules ?? "").includes(m);
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        const parts = (configForm.sourceModules ?? "").split(",").filter(Boolean);
                        const next = active ? parts.filter(p => p !== m) : [...parts, m];
                        setConfigForm(f => ({ ...f, sourceModules: next.join(",") }));
                      }}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted"}`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Auto Snapshot</p>
              <p className="text-xs text-muted-foreground">Automatically record weekly snapshots</p>
            </div>
            <button
              onClick={() => setConfigForm(f => ({ ...f, autoSnapshotEnabled: !f.autoSnapshotEnabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${configForm.autoSnapshotEnabled ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${configForm.autoSnapshotEnabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={saveConfig} disabled={savingConfig}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {savingConfig && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </button>
            {configMsg && <span className="text-sm text-muted-foreground">{configMsg}</span>}
          </div>
        </div>
      )}

      {showAddSnapshot && activeOrgId && (
        <AddSnapshotModal orgId={activeOrgId} onClose={() => setShowAddSnapshot(false)} onDone={() => { setShowAddSnapshot(false); load(); }} />
      )}
    </div>
  );
}
