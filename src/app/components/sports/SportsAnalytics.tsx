import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  Trophy,
  Users,
  TrendingUp,
  Target,
  Star,
  Activity,
  AlertCircle,
  RefreshCw,
  Calendar,
  Filter,
  Download,
  Flame,
  Zap,
  CheckCircle2,
  MapPin,
  Building2,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import { analyticsService } from "../../../services/admin/analyticsService";
import type { AnalyticsData } from "../../../services/admin/analyticsService";

// ── Tooltip styles (shared across all charts) ────────────────────────────────
const TOOLTIP_STYLE = {
  background: "#12132d",
  border: "1px solid rgba(99, 102, 241, 0.3)",
  borderRadius: "14px",
  color: "#e8eaf6",
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
  padding: "10px 14px",
};
const TOOLTIP_LABEL = { color: "#e8eaf6", fontWeight: 700, marginBottom: "4px" };
const AXIS_TICK = { fill: "#8b8fc8", fontSize: 11, fontWeight: 500 };

// ── Skeleton components for loading state ───────────────────────────────────
function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-card border border-border/70 rounded-2xl p-5 shadow-sm animate-pulse ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="h-9 w-9 rounded-xl bg-muted" />
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
      <div className="h-7 w-24 rounded bg-muted mb-2" />
      <div className="h-4 w-32 rounded bg-muted" />
    </div>
  );
}

function SkeletonChart({ className = "", height = 240 }: { className?: string; height?: number }) {
  return (
    <div className={`bg-card border border-border/70 rounded-2xl p-5 shadow-sm animate-pulse ${className}`}>
      <div className="h-5 w-44 rounded bg-muted mb-4" />
      <div className="rounded-xl bg-muted" style={{ height }} />
    </div>
  );
}

export function SportsAnalytics() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [timeRange, setTimeRange] = useState<"ALL" | "THIS_YEAR" | "LAST_30_DAYS">("ALL");
  const [selectedSport, setSelectedSport] = useState<string>("ALL");
  const [standingsTab, setStandingsTab] = useState<string>("");
  const [leaderboardTab, setLeaderboardTab] = useState<string>("Cricket");

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const result = await analyticsService.getAnalyticsData({
        timeRange,
        sport: selectedSport,
      });
      setData(result);

      // Set default standings tab
      const standingsKeys = Object.keys(result.standings);
      if (standingsKeys.length > 0 && (!standingsTab || !standingsKeys.includes(standingsTab))) {
        setStandingsTab(standingsKeys[0]);
      }

      // Set default leaderboard tab
      const leaderKeys = Object.keys(result.sportLeaders);
      if (leaderKeys.length > 0 && (!leaderboardTab || !leaderKeys.includes(leaderboardTab))) {
        setLeaderboardTab(leaderKeys[0]);
      }
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
      setError(err?.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange, selectedSport, standingsTab, leaderboardTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Export Summary to CSV
  const handleExportCSV = () => {
    if (!data) return;
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Metric,Value\n";
      csvContent += `Total Tournaments,${data.kpis.totalTournaments}\n`;
      csvContent += `Total Events,${data.kpis.totalEvents}\n`;
      csvContent += `Active Athletes,${data.kpis.activePlayers}\n`;
      csvContent += `Slot Fill Rate,${data.kpis.capacityFillRate}%\n`;
      csvContent += `Matches Completed Rate,${data.kpis.matchCompletionRate}%\n\n`;

      csvContent += "Sport,Distribution (%)\n";
      data.sportShare.forEach((s) => {
        csvContent += `${s.name},${s.value}%\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `sports_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Analytics summary exported successfully");
    } catch {
      toast.error("Failed to export analytics");
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="space-y-6 pb-12 animate-fade-in">
        <div className="h-14 rounded-2xl bg-muted/60 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <SkeletonChart className="lg:col-span-8" height={280} />
          <SkeletonChart className="lg:col-span-4" height={280} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonChart height={220} />
          <SkeletonChart height={220} />
          <SkeletonChart height={220} />
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="bg-card border border-border rounded-3xl p-8 shadow-xl text-center max-w-md">
          <div className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Failed to Load Analytics</h3>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => fetchData(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    kpis,
    monthlyEvents,
    sportShare,
    participationTrend,
    demographics,
    venueUtilization,
    sportLeaders,
    standings,
    topPerformers,
    sportNames,
    sportColorMap,
  } = data;

  const standingsKeys = Object.keys(standings);
  const currentStandings = standingsTab && standings[standingsTab] ? standings[standingsTab] : [];
  const leaderSportKeys = Object.keys(sportLeaders);
  const currentSportLeaders = leaderboardTab && sportLeaders[leaderboardTab] ? sportLeaders[leaderboardTab] : [];

  return (
    <div className="space-y-6 pb-14 animate-fade-in text-left">
      {/* ── 1. Top Header & Control Filter Bar ──────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/80 backdrop-blur-md border border-border/80 p-4 sm:p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-primary flex items-center justify-center text-white shadow-md shadow-primary/20">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight flex items-center gap-2">
              Analytics & Performance Hub
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                Live Data
              </span>
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Comprehensive community sports metrics, athlete leaderboards & operational health
            </p>
          </div>
        </div>

        {/* Global Filters & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Range Filter */}
          <div className="flex items-center rounded-xl bg-muted/60 p-1 border border-border/60">
            {[
              { key: "ALL", label: "All Time" },
              { key: "THIS_YEAR", label: "2026" },
              { key: "LAST_30_DAYS", label: "30 Days" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTimeRange(t.key as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  timeRange === t.key
                    ? "bg-card text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Sport Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="bg-card border border-border rounded-xl px-3 py-1.5 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer shadow-sm pr-7"
            >
              <option value="ALL">All Sports</option>
              {sportNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-muted-foreground pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-primary" : ""}`} />
          </button>

          {/* Export Action */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white text-xs font-bold shadow-md shadow-primary/25 hover:opacity-95 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── 2. KPI Cards Grid (6 High-Impact Metrics) ────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {/* Total Tournaments */}
        <div className="bg-card border border-border/80 rounded-xl p-2.5 sm:p-3 shadow-xs hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Trophy className="h-3.5 w-3.5" />
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              Leagues
            </span>
          </div>
          <p className="text-base sm:text-xl font-extrabold text-foreground">{kpis.totalTournaments}</p>
          <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground mt-0.5">Total Tournaments</p>
        </div>

        {/* Total Events */}
        <div className="bg-card border border-border/80 rounded-xl p-2.5 sm:p-3 shadow-xs hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Target className="h-3.5 w-3.5" />
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              {kpis.liveEvents} Live Now
            </span>
          </div>
          <p className="text-base sm:text-xl font-extrabold text-foreground">{kpis.totalEvents}</p>
          <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground mt-0.5">Total Sport Events</p>
        </div>

        {/* Active Players */}
        <div className="bg-card border border-border/80 rounded-xl p-2.5 sm:p-3 shadow-xs hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Users className="h-3.5 w-3.5" />
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {kpis.yourRegistrations} Registered
            </span>
          </div>
          <p className="text-base sm:text-xl font-extrabold text-foreground">{kpis.activePlayers}</p>
          <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground mt-0.5">Active Athletes</p>
        </div>

        {/* Capacity Fill Rate */}
        <div className="bg-card border border-border/80 rounded-xl p-2.5 sm:p-3 shadow-xs hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-7 w-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
              Slots
            </span>
          </div>
          <p className="text-base sm:text-xl font-extrabold text-foreground">{kpis.capacityFillRate}%</p>
          <div className="w-full bg-muted rounded-full h-1 mt-1 overflow-hidden">
            <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${kpis.capacityFillRate}%` }} />
          </div>
          <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground mt-0.5">Slot Fill Rate</p>
        </div>

        {/* Match Completion Rate */}
        <div className="bg-card border border-border/80 rounded-xl p-2.5 sm:p-3 shadow-xs hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-7 w-7 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400">
              {kpis.totalMatches} Matches
            </span>
          </div>
          <p className="text-base sm:text-xl font-extrabold text-foreground">{kpis.matchCompletionRate}%</p>
          <div className="w-full bg-muted rounded-full h-1 mt-1 overflow-hidden">
            <div className="bg-violet-500 h-full rounded-full transition-all duration-500" style={{ width: `${kpis.matchCompletionRate}%` }} />
          </div>
          <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground mt-0.5">Match Completion</p>
        </div>

        {/* Open Registrations */}
        <div className="bg-card border border-border/80 rounded-xl p-2.5 sm:p-3 shadow-xs hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-7 w-7 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-pink-500/10 text-pink-600 dark:text-pink-400">
              Joinable
            </span>
          </div>
          <p className="text-base sm:text-xl font-extrabold text-foreground">{kpis.openRegistrations}</p>
          <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground mt-0.5">Open Registrations</p>
        </div>
      </div>

      {/* ── 3. Performance & Demographics (2-Column Main Section) ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Participation Area & Monthly Trends (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Participation & Athlete Inflow Area Chart */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Athlete Participation & Inflow Trend
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Monthly athlete sign-ups and multi-sport tournament activity
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">
                Monthly Wave
              </span>
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={participationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPlayers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.08)" vertical={false} />
                <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#8b8fc8", paddingTop: "10px" }} />
                <Area
                  type="monotone"
                  dataKey="players"
                  name="Athletes Enrolled"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorPlayers)"
                />
                <Area
                  type="monotone"
                  dataKey="events"
                  name="Events Hosted"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEvents)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Events Stacked Bar Chart */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Monthly Events Breakdown by Sport
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Distribution of events scheduled each month across all sports
                </p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyEvents} barSize={12} barGap={4} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.08)" vertical={false} />
                <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#8b8fc8", paddingTop: "8px" }} />
                {sportNames.slice(0, 5).map((name) => (
                  <Bar key={name} dataKey={name} fill={sportColorMap[name] || "#6366f1"} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT COLUMN: Demographics & Tower Breakdown (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Gender Demographics Donut */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-pink-500" />
              Gender Demographics
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Male vs Female vs Mixed category participation
            </p>

            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={demographics.gender}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {demographics.gender.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: any) => [`${value}%`, "Share"]} />
              </PieChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-border/50 text-center">
              {demographics.gender.map((g) => (
                <div key={g.name} className="p-1.5 rounded-lg bg-muted/40">
                  <p className="text-[10px] text-muted-foreground font-medium">{g.name}</p>
                  <p className="text-xs font-bold text-foreground mt-0.5">{g.value}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Age Group Distribution */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Age Category Distribution
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Community athletes segmented by age brackets
            </p>

            <div className="space-y-3">
              {demographics.ageGroups.map((a) => (
                <div key={a.group}>
                  <div className="flex items-center justify-between text-xs mb-1 font-medium">
                    <span className="text-muted-foreground">{a.group}</span>
                    <span className="text-foreground font-bold">{a.percentage}% ({a.count} players)</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${a.percentage}%`, backgroundColor: a.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tower / Block Participation Leaderboard */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              Tower & Block Heatmap
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Most active apartment blocks & resident clusters
            </p>

            <div className="space-y-2.5">
              {demographics.blockDistribution.map((b, i) => (
                <div key={b.block} className="flex items-center justify-between p-2 rounded-xl bg-muted/30 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-foreground">{b.block}</span>
                  </div>
                  <span className="font-bold text-primary">{b.players} athletes</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Dynamic Sport Leaders & Top Performers ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sport-Specific Performance Leaders (Orange/Purple Caps, Golden Boot) */}
        <div className="lg:col-span-7 bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Sport Performance Leaders & Caps
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Top run scorers, wicket takers, win streaks and golden boot contenders
              </p>
            </div>

            {/* Sport Tab Switcher */}
            <div className="flex items-center rounded-xl bg-muted/60 p-1 border border-border/60 overflow-x-auto">
              {leaderSportKeys.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setLeaderboardTab(s)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    leaderboardTab === s
                      ? "bg-card text-primary shadow-sm font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Leaders List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentSportLeaders.map((lead) => (
              <div
                key={`${lead.sport}-${lead.name}-${lead.category}`}
                className="p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:border-primary/40 transition-all flex items-center gap-3"
              >
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${lead.color} text-white font-black text-sm flex items-center justify-center shadow-sm shrink-0`}>
                  {lead.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground truncate">{lead.name}</p>
                    <span className="text-[10px] font-black text-amber-500">#{lead.rank}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">{lead.category}</p>
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-border/40 text-xs">
                    <span className="font-bold text-primary">{lead.metricValue} {lead.metricLabel}</span>
                    {lead.subMetric && <span className="text-[10px] text-muted-foreground font-semibold">{lead.subMetric}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Community Events & Most Active Cups */}
        <div className="lg:col-span-5 bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Star className="w-4 h-4 text-warning" />
                Premier Tournaments & Cups
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Top registered and highest-participation leagues
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {topPerformers.map((p) => (
              <div
                key={`${p.rank}-${p.name}`}
                className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20 hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-bold w-6 text-center shrink-0">
                    {p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : p.rank === 3 ? "🥉" : `#${p.rank}`}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.sport}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-primary">{p.eventsCount}</span>
                  <p className="text-[10px] text-muted-foreground font-medium">{p.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 5. Standings & Venue Utilization ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* League Standings with Team Form */}
        <div className="lg:col-span-8 bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-primary" />
                Tournament Standings & Team Form
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Official point table, win-loss record and recent game trajectory
              </p>
            </div>

            {/* Standings Tab Filter */}
            {standingsKeys.length > 0 && (
              <div className="flex rounded-xl p-1 bg-muted/60 border border-border/60 overflow-x-auto max-w-[280px]">
                {standingsKeys.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setStandingsTab(tab)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      standingsTab === tab
                        ? "bg-card text-primary shadow-sm font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.length > 18 ? tab.slice(0, 16) + "…" : tab}
                  </button>
                ))}
              </div>
            )}
          </div>

          {currentStandings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground font-bold">
                    <th className="pb-2.5 pl-2">#</th>
                    <th className="pb-2.5">Team Name</th>
                    <th className="pb-2.5 text-center">W</th>
                    <th className="pb-2.5 text-center">L</th>
                    <th className="pb-2.5 text-center">D</th>
                    <th className="pb-2.5 text-center font-bold text-foreground">Pts</th>
                    <th className="pb-2.5 text-center">PCT</th>
                    <th className="pb-2.5 text-right pr-2">Form (Last 5)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 font-medium">
                  {currentStandings.map((row, i) => (
                    <tr
                      key={row.team}
                      className={`hover:bg-muted/30 transition-colors ${
                        i === 0 ? "bg-primary/5 font-bold" : ""
                      }`}
                    >
                      <td className="py-2.5 pl-2 font-bold text-primary">{row.rank}</td>
                      <td className="py-2.5 font-semibold text-foreground flex items-center gap-1.5">
                        {row.team}
                        {i === 0 && <Trophy className="w-3.5 h-3.5 text-amber-500 inline" />}
                      </td>
                      <td className="py-2.5 text-center text-emerald-600 font-bold">{row.w}</td>
                      <td className="py-2.5 text-center text-destructive font-bold">{row.l}</td>
                      <td className="py-2.5 text-center text-muted-foreground font-bold">{row.d}</td>
                      <td className="py-2.5 text-center font-black text-foreground">{row.pts}</td>
                      <td className="py-2.5 text-center text-muted-foreground">{row.pct.toFixed(3)}</td>
                      <td className="py-2.5 text-right pr-2">
                        <div className="flex items-center justify-end gap-1">
                          {(row.form && row.form.length > 0 ? row.form : ["W", "W", "L", "W", "D"]).map((f, fi) => (
                            <span
                              key={fi}
                              className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center text-white ${
                                f === "W"
                                  ? "bg-emerald-500"
                                  : f === "L"
                                  ? "bg-rose-500"
                                  : "bg-amber-500"
                              }`}
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center rounded-xl border border-dashed border-border/60">
              <Trophy className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No official match standings recorded yet</p>
            </div>
          )}
        </div>

        {/* Venue & Arena Utilization */}
        <div className="lg:col-span-4 bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                Venue & Court Utilization
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Most utilized sports arenas and grounds
              </p>
            </div>
          </div>

          <div className="space-y-3.5 mt-4">
            {venueUtilization.map((v) => (
              <div key={v.name} className="p-3 rounded-xl bg-muted/20 border border-border/50">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-foreground truncate">{v.name}</span>
                  <span className="font-bold text-primary">{v.eventsCount} Events</span>
                </div>
                {v.city && <p className="text-[10px] text-muted-foreground mb-1.5">{v.city}</p>}
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${v.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
