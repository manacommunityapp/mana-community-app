import { useEffect, useState } from "react";
import { Link2, Truck, Home, Dumbbell, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { workforce360Service } from "../../../services/workforce360Service";
import { useHrmOrg } from "../../../contexts/HrmOrgContext";
import type { MwIntegrationConfig, MwFreshAssignment } from "../../../types/hrm";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ASSIGNED:    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    COMPLETED:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function CompleteModal({
  assignment,
  orgId,
  onClose,
  onDone,
}: {
  assignment: MwFreshAssignment;
  orgId: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [actualKm, setActualKm] = useState(assignment.estimatedKm?.toString() ?? "");
  const [onTime, setOnTime] = useState(true);
  const [score, setScore] = useState(5);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!actualKm || isNaN(Number(actualKm))) { setErr("Enter a valid distance"); return; }
    setSaving(true);
    try {
      await workforce360Service.completeFreshDelivery(orgId, assignment.id, Number(actualKm), onTime, score);
      onDone();
    } catch {
      setErr("Failed to complete delivery");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h3 className="mb-4 text-base font-semibold text-foreground">Complete Delivery #{assignment.freshOrderId}</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Actual Distance (km)</label>
            <input
              type="number" step="0.1" min="0"
              value={actualKm} onChange={e => setActualKm(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Delivered On Time?</span>
            <button
              onClick={() => setOnTime(!onTime)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${onTime ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${onTime ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Performance Score (1–5)</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onClick={() => setScore(n)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${score >= n ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          {err && <p className="text-xs text-red-500">{err}</p>}
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Complete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationSettings() {
  const { activeOrgId } = useHrmOrg();
  const [config, setConfig] = useState<MwIntegrationConfig | null>(null);
  const [form, setForm] = useState<Partial<MwIntegrationConfig>>({});
  const [deliveries, setDeliveries] = useState<MwFreshAssignment[]>([]);
  const [completing, setCompleting] = useState<MwFreshAssignment | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!activeOrgId) return;
    setLoading(true);
    workforce360Service.getIntegrationConfig(activeOrgId)
      .then(c => { setConfig(c); setForm(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeOrgId]);

  useEffect(() => {
    if (!activeOrgId || !config?.freshEnabled) return;
    workforce360Service.getOrgFreshDeliveries(activeOrgId).then(setDeliveries).catch(() => {});
  }, [activeOrgId, config?.freshEnabled]);

  async function saveConfig() {
    if (!activeOrgId) return;
    setSaving(true);
    try {
      const updated = await workforce360Service.updateIntegrationConfig(activeOrgId, form);
      setConfig(updated);
      setForm(updated);
      setMsg("Settings saved.");
      setTimeout(() => setMsg(""), 2500);
    } catch {
      setMsg("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  function toggle(field: keyof MwIntegrationConfig) {
    setForm(f => ({ ...f, [field]: !f[field] }));
  }

  function refreshDeliveries() {
    if (!activeOrgId) return;
    setCompleting(null);
    workforce360Service.getOrgFreshDeliveries(activeOrgId).then(setDeliveries).catch(() => {});
    workforce360Service.getIntegrationConfig(activeOrgId).then(c => { setConfig(c); setForm(c); }).catch(() => {});
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  const modules: { key: keyof MwIntegrationConfig; icon: React.ElementType; label: string; desc: string }[] = [
    { key: "freshEnabled",  icon: Truck,     label: "Mana Fresh",  desc: "Link food delivery orders to employee assignments" },
    { key: "homesEnabled",  icon: Home,      label: "Mana Homes",  desc: "Connect home-services bookings to workforce tasks" },
    { key: "sportsEnabled", icon: Dumbbell,  label: "Mana Sports", desc: "Tie sports-event staffing to shift assignments" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Link2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Integration Settings</h1>
          <p className="text-sm text-muted-foreground">Connect Mana platform modules to Workforce 360</p>
        </div>
      </div>

      {/* Module Toggles */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Module Integrations</h2>
        <div className="space-y-3">
          {modules.map(({ key, icon: Icon, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
              <button
                onClick={() => toggle(key)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${form[key] ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form[key] ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Pay Config — only when Fresh enabled */}
      {form.freshEnabled && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Mana Fresh — Delivery Pay Rates</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { field: "baseDeliveryPay" as keyof MwIntegrationConfig, label: "Base Pay (₹)" },
              { field: "perKmRate"       as keyof MwIntegrationConfig, label: "Per Km Rate (₹)" },
              { field: "onTimeBonus"     as keyof MwIntegrationConfig, label: "On-Time Bonus (₹)" },
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
                <input
                  type="number" min="0" step="0.5"
                  value={(form[field] as number) ?? 0}
                  onChange={e => setForm(f => ({ ...f, [field]: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Settings
        </button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>

      {/* Deliveries table */}
      {config?.freshEnabled && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">Recent Deliveries</h2>
          </div>
          {deliveries.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No delivery assignments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Order ID</th>
                    <th className="px-4 py-2 text-left font-medium">Route</th>
                    <th className="px-4 py-2 text-left font-medium">Distance</th>
                    <th className="px-4 py-2 text-left font-medium">On Time</th>
                    <th className="px-4 py-2 text-right font-medium">Incentive</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {deliveries.map(d => (
                    <tr key={d.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2 font-mono text-xs">{d.freshOrderId}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {d.pickupLocation ? `${d.pickupLocation} → ${d.dropLocation ?? "—"}` : "—"}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {d.actualKm != null ? `${d.actualKm} km` : d.estimatedKm != null ? `~${d.estimatedKm} km` : "—"}
                      </td>
                      <td className="px-4 py-2">
                        {d.onTime == null ? <span className="text-muted-foreground">—</span> :
                         d.onTime ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-foreground">₹{d.totalIncentive.toFixed(2)}</td>
                      <td className="px-4 py-2"><StatusBadge status={d.operationalAssignment.status} /></td>
                      <td className="px-4 py-2">
                        {d.operationalAssignment.status === "IN_PROGRESS" && (
                          <button
                            onClick={() => setCompleting(d)}
                            className="rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted"
                          >
                            Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {completing && activeOrgId && (
        <CompleteModal
          assignment={completing}
          orgId={activeOrgId}
          onClose={() => setCompleting(null)}
          onDone={refreshDeliveries}
        />
      )}
    </div>
  );
}
