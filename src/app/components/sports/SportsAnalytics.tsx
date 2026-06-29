import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Trophy, Users, TrendingUp, Target, Star, Activity, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { analyticsService } from "../../../services/analyticsService";
import type { AnalyticsData } from "../../../services/analyticsService";

// ── Tooltip styles (shared across all charts) ────────────────────────────────
const TOOLTIP_STYLE = {
  background: "#16163a",
  border: "1px solid rgba(99, 102, 241, 0.25)",
  borderRadius: "12px",
  color: "#e8eaf6",
};
const TOOLTIP_LABEL = { color: "#e8eaf6", fontWeight: 600 };
const AXIS_TICK = { fill: "#8b8fc8", fontSize: 11 };

// ── Skeleton card for loading state ──────────────────────────────────────────
function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-2xl p-5 shadow-lg animate-pulse ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="h-9 w-9 rounded-xl bg-input" />
        <div className="h-5 w-14 rounded-full bg-input" />
      </div>
      <div className="h-7 w-20 rounded bg-input mb-1" />
      <div className="h-4 w-24 rounded bg-input" />
    </div>
  );
}

function SkeletonChart({ className = "", height = 220 }: { className?: string; height?: number }) {
  return (
    <div className={`bg-card border border-border rounded-2xl p-5 shadow-lg animate-pulse ${className}`}>
      <div className="h-5 w-40 rounded bg-input mb-4" />
      <div className="rounded-xl bg-input" style={{ height }} />
    </div>
  );
}

export function SportsAnalytics() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [standingsTab, setStandingsTab] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsService.getAnalyticsData();
      setData(result);
      // Set default standings tab to the first available key
      const standingsKeys = Object.keys(result.standings);
      if (standingsKeys.length > 0 && !standingsTab) {
        setStandingsTab(standingsKeys[0]);
      }
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
      setError(err?.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in-up stagger-1">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <SkeletonChart className="lg:col-span-2" />
          <SkeletonChart height={160} />
        </div>
        <SkeletonChart height={180} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SkeletonChart height={200} />
          <SkeletonChart height={200} />
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg text-center max-w-md">
          <div className="h-14 w-14 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-7 w-7 text-danger" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Analytics</h3>
          <p className="text-sm text-muted-foreground mb-5">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { kpis, monthlyEvents, sportShare, participationTrend, standings, topPerformers, sportNames, sportColorMap } = data;
  const standingsKeys = Object.keys(standings);
  const currentStandings = standingsTab && standings[standingsTab] ? standings[standingsTab] : [];

  // ── KPI cards config ─────────────────────────────────────────────────────
  const kpiCards = [
    { label: "Total Events", value: String(kpis.totalEvents), change: `${kpis.liveEvents} live`, icon: Target, color: "#818cf8", bg: "rgba(129,140,248,0.1)" },
    { label: "Active Players", value: String(kpis.activePlayers), change: `${kpis.yourRegistrations} yours`, icon: Users, color: "#34d399", bg: "rgba(52,211,153,0.1)" },
    { label: "Open Registrations", value: String(kpis.openRegistrations), change: "Active now", icon: TrendingUp, color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
    { label: "Tournaments", value: String(kpis.totalTournaments), change: `${sportNames.length} sports`, icon: Trophy, color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  ];

  // ── Check if we have meaningful data for charts ──────────────────────────
  const hasMonthlyData = monthlyEvents.length > 0;
  const hasSportShare = sportShare.length > 0;
  const hasParticipation = participationTrend.length > 0;
  const hasStandings = standingsKeys.length > 0;
  const hasPerformers = topPerformers.length > 0;

  return (
    <div className="space-y-5 animate-fade-in-up stagger-1">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                <s.icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success">
                {s.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs mt-0.5 text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly events bar chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-lg">
          <h3 className="font-semibold mb-4 text-foreground">Monthly Events by Sport</h3>
          {hasMonthlyData ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyEvents} barSize={10} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.08)" />
                <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#8b8fc8" }} />
                {sportNames.map((name) => (
                  <Bar key={name} dataKey={name} fill={sportColorMap[name]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState label="No event data available yet" height={220} />
          )}
        </div>

        {/* Sport distribution pie */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
          <h3 className="font-semibold mb-4 text-foreground">Sport Distribution</h3>
          {hasSportShare ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={sportShare} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {sportShare.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value: any) => [`${value}%`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {sportShare.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                      <span className="text-muted-foreground">{s.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{s.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyChartState label="No sports data available" height={160} />
          )}
        </div>
      </div>

      {/* Participation trend */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
        <h3 className="font-semibold mb-4 text-foreground">Participation Trend</h3>
        {hasParticipation ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={participationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.08)" />
              <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} />
              <Line
                type="monotone"
                dataKey="players"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ fill: "#6366f1", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#818cf8" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChartState label="No participation data available yet" height={180} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Standings */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">League Standings</h3>
            {hasStandings && (
              <div className="flex rounded-xl p-1 bg-input border border-border overflow-x-auto max-w-[220px]">
                {standingsKeys.map((tab) => (
                  <button key={tab} onClick={() => setStandingsTab(tab)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                      standingsTab === tab
                        ? "bg-card text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}>
                    {tab.length > 16 ? tab.slice(0, 14) + "…" : tab}
                  </button>
                ))}
              </div>
            )}
          </div>
          {hasStandings && currentStandings.length > 0 ? (
            <div className="space-y-1">
              <div className="grid grid-cols-6 text-xs font-semibold px-2 py-1 text-muted-foreground border-b border-border/40 pb-2">
                <span className="col-span-2">Team</span>
                <span className="text-center">W</span>
                <span className="text-center">L</span>
                <span className="text-center">Pts</span>
                <span className="text-center">PCT</span>
              </div>
              {currentStandings.map((row, i) => (
                <div key={row.team} className="grid grid-cols-6 items-center px-2 py-2 rounded-xl text-sm"
                  style={{ background: i === 0 ? "rgba(99,102,241,0.08)" : "transparent" }}>
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="text-xs font-bold w-4" style={{ color: i === 0 ? "#818cf8" : "var(--mana-text-dim)" }}>{row.rank}</span>
                    <span className="font-medium truncate text-foreground">{row.team}</span>
                    {i === 0 && <Trophy className="h-3 w-3 flex-shrink-0 text-warning" />}
                  </div>
                  <span className="text-center font-semibold text-success">{row.w}</span>
                  <span className="text-center font-semibold text-danger">{row.l}</span>
                  <span className="text-center font-semibold text-foreground">{row.pts}</span>
                  <span className="text-center text-muted-foreground">{row.pct.toFixed(3)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyChartState label="No match results available yet" height={180} icon={<Trophy className="h-8 w-8 text-muted-foreground/30" />} />
          )}
        </div>

        {/* Top Performers / Events */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Top Events</h3>
            <Star className="h-4 w-4 text-warning" />
          </div>
          {hasPerformers ? (
            <div className="space-y-3">
              {topPerformers.map((p) => (
                <div key={`${p.rank}-${p.name}`} className="flex items-center gap-3 py-1 border-b border-border/20 last:border-0 pb-2 last:pb-0">
                  <span className="text-xs font-bold w-5 text-center flex-shrink-0"
                    style={{ color: p.rank <= 3 ? "#fbbf24" : "var(--mana-text-dim)" }}>
                    {p.rank <= 3 ? ["🥇", "🥈", "🥉"][p.rank - 1] : p.rank}
                  </span>
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br ${p.color} flex-shrink-0`}>
                    {p.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sport}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm text-[var(--mana-accent)]">{p.eventsCount}</p>
                    <p className="text-[10px] text-muted-foreground">{p.label}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyChartState label="No event data available yet" height={180} icon={<Star className="h-8 w-8 text-muted-foreground/30" />} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Empty state component for charts with no data ────────────────────────────
function EmptyChartState({
  label,
  height,
  icon,
}: {
  label: string;
  height: number;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50"
      style={{ height }}
    >
      {icon || <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />}
      <p className="text-sm text-muted-foreground/60 mt-2">{label}</p>
    </div>
  );
}
