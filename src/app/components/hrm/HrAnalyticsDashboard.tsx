import { useEffect, useState } from "react";
import { Users, UserCheck, UserPlus, TrendingDown, Clock, Building2, RefreshCw } from "lucide-react";
import { hrmService } from "../../../services/hrm/hrmService";
import type { HrAnalyticsDashboard, HrTrendPoint, HrWorkforceMetrics } from "../../../types/hrm";

interface Props {
  orgId: number;
}

function KpiCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: React.ElementType; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function BarChart({ data, color = "#6366f1" }: { data: HrTrendPoint[]; color?: string }) {
  if (!data.length) return <p className="text-sm text-muted-foreground">No data</p>;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-1">
          <div
            className="w-full rounded-t"
            style={{ height: `${(d.value / max) * 80}px`, backgroundColor: color, minHeight: d.value > 0 ? "4px" : "0" }}
          />
          <span className="text-[10px] text-muted-foreground leading-none truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function HrAnalyticsDashboardPage({ orgId }: Props) {
  const [dashboard, setDashboard] = useState<HrAnalyticsDashboard | null>(null);
  const [headcountTrend, setHeadcountTrend] = useState<HrTrendPoint[]>([]);
  const [attritionTrend, setAttritionTrend] = useState<HrTrendPoint[]>([]);
  const [workforce, setWorkforce] = useState<HrWorkforceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!orgId) return;
    setLoading(true);
    Promise.allSettled([
      hrmService.getHrAnalyticsDashboard(orgId),
      hrmService.getHeadcountTrend(orgId, 12),
      hrmService.getAttritionTrend(orgId, 12),
      hrmService.getWorkforceMetrics(orgId),
    ]).then(([d, hc, at, wf]) => {
      if (d.status === "fulfilled") setDashboard(d.value);
      if (hc.status === "fulfilled") setHeadcountTrend(hc.value);
      if (at.status === "fulfilled") setAttritionTrend(at.value);
      if (wf.status === "fulfilled") setWorkforce(wf.value);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [orgId]);

  if (!orgId) return <p className="text-muted-foreground">Select an organisation to view analytics.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">HR Analytics</h2>
          <p className="text-sm text-muted-foreground">Workforce insights and trends</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 h-24 animate-pulse" />
          ))}
        </div>
      ) : dashboard ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total Employees" value={dashboard.totalEmployees} icon={Users} />
          <KpiCard label="Active" value={dashboard.activeEmployees} icon={UserCheck} />
          <KpiCard label="New Hires (Month)" value={dashboard.newHiresThisMonth} icon={UserPlus} />
          <KpiCard label="Attrition Rate" value={`${(dashboard.attritionRate * 100).toFixed(1)}%`} icon={TrendingDown} sub={`${dashboard.attritionThisMonth} exits this month`} />
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No analytics data available.</p>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold">Headcount Trend (12 months)</h3>
          <BarChart data={headcountTrend} color="#6366f1" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold">Attrition Trend (12 months)</h3>
          <BarChart data={attritionTrend} color="#f43f5e" />
        </div>
      </div>

      {dashboard && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Building2 className="h-4 w-4" /> Department Breakdown</h3>
            <div className="space-y-2">
              {dashboard.departmentBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data</p>
              ) : (
                dashboard.departmentBreakdown.map((d, i) => {
                  const max = Math.max(...dashboard.departmentBreakdown.map(x => x.count), 1);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-28 text-xs text-muted-foreground truncate">{d.department}</span>
                      <div className="flex-1 bg-muted rounded h-2">
                        <div className="bg-primary h-2 rounded" style={{ width: `${(d.count / max) * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium w-6 text-right">{d.count}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold">Gender Ratio</h3>
            {(() => {
              const { male, female, other } = dashboard.genderRatio;
              const total = male + female + other || 1;
              return (
                <div className="space-y-2">
                  {[{ label: "Male", value: male, color: "bg-blue-500" }, { label: "Female", value: female, color: "bg-pink-500" }, { label: "Other", value: other, color: "bg-purple-500" }].map(g => (
                    <div key={g.label} className="flex items-center gap-2">
                      <span className="w-14 text-xs text-muted-foreground">{g.label}</span>
                      <div className="flex-1 bg-muted rounded h-2">
                        <div className={`${g.color} h-2 rounded`} style={{ width: `${(g.value / total) * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium w-10 text-right">{((g.value / total) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {dashboard && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Clock className="h-4 w-4" /> Workforce Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Avg Tenure</p>
              <p className="font-medium">{Math.round(dashboard.avgTenureMonths)} months</p>
            </div>
            {workforce && (
              <>
                <div>
                  <p className="text-muted-foreground text-xs">Attendance Rate</p>
                  <p className="font-medium">{workforce.attendanceRatePercent?.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Leave Utilization</p>
                  <p className="font-medium">{workforce.leaveUtilizationPercent?.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Avg OT Hours/Month</p>
                  <p className="font-medium">{workforce.avgOvertimeHoursPerMonth?.toFixed(1)} hrs</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
