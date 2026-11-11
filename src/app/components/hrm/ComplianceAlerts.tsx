import { useEffect, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, XCircle, RefreshCw, Zap } from "lucide-react";
import { hrmService } from "../../../services/hrm/hrmService";
import type { HrComplianceAlert } from "../../../types/hrm";

interface Props {
  orgId: number;
}

const SEVERITY_STYLES: Record<string, { badge: string; border: string }> = {
  CRITICAL: { badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", border: "border-red-300 dark:border-red-700" },
  HIGH:     { badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", border: "border-orange-300 dark:border-orange-700" },
  MEDIUM:   { badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300", border: "border-yellow-300 dark:border-yellow-700" },
  LOW:      { badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700" },
};

type TabFilter = "ALL" | "OPEN" | "ACKNOWLEDGED";

export default function ComplianceAlerts({ orgId }: Props) {
  const [alerts, setAlerts] = useState<HrComplianceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState<TabFilter>("OPEN");

  const load = () => {
    if (!orgId) return;
    setLoading(true);
    hrmService.getComplianceAlerts(orgId)
      .then(setAlerts)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [orgId]);

  const generate = async () => {
    setGenerating(true);
    try {
      await hrmService.generateComplianceAlerts(orgId);
      load();
    } finally {
      setGenerating(false);
    }
  };

  const act = async (id: number, action: "acknowledge" | "resolve" | "dismiss") => {
    try {
      if (action === "acknowledge") await hrmService.acknowledgeAlert(orgId, id);
      else if (action === "resolve") await hrmService.resolveAlert(orgId, id);
      else await hrmService.dismissAlert(orgId, id);
      load();
    } catch {}
  };

  const filtered = alerts.filter(a =>
    tab === "ALL" ? true : tab === "OPEN" ? a.status === "OPEN" : a.status === "ACKNOWLEDGED"
  );

  if (!orgId) return <p className="text-muted-foreground">Select an organisation.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-semibold">Compliance Alerts</h2>
          <p className="text-sm text-muted-foreground">Probation, contract & document expiry tracking</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={generate} disabled={generating} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50">
            <Zap className="h-4 w-4" /> {generating ? "Generating…" : "Generate Alerts"}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {(["OPEN", "ACKNOWLEDGED", "ALL"] as TabFilter[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
            <span className="ml-1.5 text-xs">
              ({t === "ALL" ? alerts.length : alerts.filter(a => a.status === t).length})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-border animate-pulse bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500" />
          <p className="font-medium">No {tab.toLowerCase()} alerts</p>
          <p className="text-sm">Use "Generate Alerts" to scan for upcoming compliance events.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => {
            const styles = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.LOW;
            return (
              <div key={alert.id} className={`rounded-xl border ${styles.border} bg-card p-4 space-y-2`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{alert.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles.badge}`}>{alert.severity}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{alert.alertType.replace(/_/g, " ")}</span>
                    </div>
                    {alert.employee && <p className="text-xs text-muted-foreground">{alert.employee.fullName}</p>}
                    {alert.description && <p className="text-xs text-muted-foreground">{alert.description}</p>}
                    <p className="text-xs text-muted-foreground">Due: {new Date(alert.dueDate).toLocaleDateString()}</p>
                  </div>
                  {alert.status === "OPEN" && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => act(alert.id, "acknowledge")} title="Acknowledge" className="p-1.5 rounded hover:bg-accent text-yellow-600">
                        <Bell className="h-4 w-4" />
                      </button>
                      <button onClick={() => act(alert.id, "resolve")} title="Resolve" className="p-1.5 rounded hover:bg-accent text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => act(alert.id, "dismiss")} title="Dismiss" className="p-1.5 rounded hover:bg-accent text-muted-foreground">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {alert.status === "ACKNOWLEDGED" && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => act(alert.id, "resolve")} title="Resolve" className="p-1.5 rounded hover:bg-accent text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => act(alert.id, "dismiss")} title="Dismiss" className="p-1.5 rounded hover:bg-accent text-muted-foreground">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
