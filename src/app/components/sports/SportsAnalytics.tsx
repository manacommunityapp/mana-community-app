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
  Activity,
  AlertCircle,
  RefreshCw,
  Calendar,
  Filter,
  Download,
  Search,
  Flame,
  Zap,
  UserCheck,
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
  const { isAdmin, isSuperAdmin, isSportsAdmin } = useAuth();
  const canAccess = isAdmin || isSuperAdmin || isSportsAdmin;
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [timeRange, setTimeRange] = useState<"ALL" | "THIS_YEAR" | "LAST_30_DAYS">("ALL");
  const [selectedSport, setSelectedSport] = useState<string>("ALL");
  const [standingsTab, setStandingsTab] = useState<string>("");
  const [leaderboardTab, setLeaderboardTab] = useState<string>("Cricket");
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryFocus, setInventoryFocus] = useState<"all" | "tournaments" | "events" | "capacity" | "matches" | "open-events">("all");
  const [registrationStatusFilter, setRegistrationStatusFilter] = useState<"ALL" | "CONFIRMED" | "PENDING">("ALL");

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (!canAccess) {
      setLoading(false);
      return;
    }
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
      setStandingsTab((current) => standingsKeys.includes(current) ? current : standingsKeys[0] || "");
      const leaderKeys = Object.keys(result.sportLeaders);
      setLeaderboardTab((current) => leaderKeys.includes(current) ? current : leaderKeys[0] || "");
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
      setError(err?.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange, selectedSport, canAccess]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Export all current filtered dashboard datasets into one workbook-friendly CSV.
  const handleExportCSV = () => {
    if (!data) return;
    try {
      const quote = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
      const sections: string[] = [];
      const add = (title: string, rows: any[]) => {
        sections.push(quote(title));
        if (!rows.length) { sections.push(quote("No records"), ""); return; }
        const columns = Object.keys(rows[0]);
        sections.push(columns.map(quote).join(","));
        rows.forEach((row) => sections.push(columns.map((column) => quote(Array.isArray(row[column]) ? (row[column] as unknown[]).join("; ") : row[column])).join(",")));
        sections.push("");
      };
      add("Summary", Object.entries(data.kpis).map(([metric, value]) => ({ metric, value })));
      add("Tournaments", data.tournamentInventory);
      add("Events", data.eventInventory);
      add("Registrations", data.registrationInventory);
      add("Matches", data.matchInventory);
      add("Teams and squads", data.teamInventory);
      const blob = new Blob(["\uFEFF" + sections.join("\r\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `sports_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Analytics summary exported successfully");
    } catch {
      toast.error("Failed to export analytics");
    }
  };

  // ── Access check ─────────────────────────────────────────────────────────
  if (!canAccess) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm max-w-lg mx-auto mt-12 animate-in fade-in duration-300">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-full border border-rose-100 mb-4">
          <ShieldAlert className="w-10 h-10 text-rose-600" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Access Restricted</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
          Sports Analytics is only accessible to Administrators and Sports Administrators.
        </p>
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="space-y-6 pb-12 animate-fade-in">
        <div className="h-14 rounded-2xl bg-muted/60 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
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
          <h3 className="text-xs font-bold text-foreground mb-2">Failed to Load Analytics</h3>
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
    sportNames,
    sportColorMap,
    eventInventory,
    tournamentInventory,
    registrationInventory,
    matchInventory,
    teamInventory,
    dataWarnings,
  } = data;

  const standingsKeys = Object.keys(standings);
  const currentStandings = standingsTab && standings[standingsTab] ? standings[standingsTab] : [];
  const leaderSportKeys = Object.keys(sportLeaders);
  const currentSportLeaders = leaderboardTab && sportLeaders[leaderboardTab] ? sportLeaders[leaderboardTab] : [];
  const searchMatches = (value: unknown) => !inventorySearch.trim() || JSON.stringify(value).toLowerCase().includes(inventorySearch.trim().toLowerCase());
  const visibleTournaments = tournamentInventory.filter(searchMatches);
  const visibleEvents = eventInventory.filter(searchMatches);
  const visibleRegistrations = registrationInventory.filter(searchMatches);
  const visibleMatches = matchInventory.filter(searchMatches);
  const visibleTeams = teamInventory.filter(searchMatches);
  const registeredPlayerRows = visibleRegistrations
    .filter((row) => registrationStatusFilter === "ALL" || (registrationStatusFilter === "PENDING" ? row.status.toUpperCase() === "PENDING" : ["REGISTERED", "CONFIRMED"].includes(row.status.toUpperCase())))
    .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
  const jumpToInventory = (focus: typeof inventoryFocus) => {
    setInventoryFocus(focus);
    setInventorySearch("");
    window.setTimeout(() => document.getElementById("sports-operations-inventory")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };
  const jumpToPlayers = () => {
    setInventoryFocus("all");
    setRegistrationStatusFilter("ALL");
    setInventorySearch("");
    window.setTimeout(() => document.getElementById("registered-players")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };
  const renderInventoryTable = (title: string, headers: string[], rows: (string | number)[][]) => (
    <section className="overflow-hidden rounded-xl border border-border/70 bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-3 py-2.5">
        <h4 className="m-0 text-xs font-bold text-foreground">{title}</h4>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{rows.length} shown</span>
      </div>
      {rows.length ? <div className="max-h-72 overflow-auto">
        <table className="w-full min-w-max text-left text-[11px]">
          <thead className="sticky top-0 z-[1] bg-muted/80 text-[10px] uppercase tracking-wide text-muted-foreground"><tr>{headers.map((header) => <th key={header} className="px-3 py-2 font-bold">{header}</th>)}</tr></thead>
          <tbody className="divide-y divide-border/40">{rows.map((row, rowIndex) => <tr key={`${title}-${rowIndex}`} className="hover:bg-muted/20">{row.map((cell, cellIndex) => <td key={cellIndex} className="max-w-64 truncate px-3 py-2 text-foreground" title={String(cell)}>{cell || "—"}</td>)}</tr>)}</tbody>
        </table>
      </div> : <p className="m-0 px-3 py-6 text-center text-xs text-muted-foreground">No {title.toLowerCase()} match the current filters.</p>}
    </section>
  );

  return (
    <div className="space-y-6 pb-14 animate-fade-in text-left">
      {/* ── 1. Top Header & Control Filter Bar ──────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/80 backdrop-blur-md border border-border/80 p-4 sm:p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-primary flex items-center justify-center text-white shadow-md shadow-primary/20">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-foreground tracking-tight flex items-center gap-2">
              Analytics & Performance Hub
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                Live Data
              </span>
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Community sports activity, event operations, registrations and saved fixtures
            </p>
          </div>
        </div>

        {/* Global Filters & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Range Filter */}
          <div className="flex items-center rounded-xl bg-muted/60 p-1 border border-border/60">
            {[
              { key: "ALL", label: "All Time" },
              { key: "THIS_YEAR", label: `${new Date().getFullYear()}` },
              { key: "LAST_30_DAYS", label: "Past 30 days" },
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

      {dataWarnings.length > 0 && <div role="status" className="space-y-1 rounded-xl border border-amber-300/60 bg-amber-500/5 px-3.5 py-3 text-xs text-amber-900 dark:text-amber-100">
        {dataWarnings.map((warning) => <p key={warning} className="m-0 flex items-start gap-2"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{warning}</p>)}
      </div>}

      {/* ── 2. KPI Cards Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 sm:gap-3">
        {/* Total Tournaments */}
        <button type="button" onClick={() => jumpToInventory("tournaments")} aria-label={`View ${kpis.totalTournaments} tournament records`} aria-pressed={inventoryFocus === "tournaments"} className={`w-full cursor-pointer rounded-xl border bg-card p-2.5 text-left shadow-xs transition-all hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-3 ${inventoryFocus === "tournaments" ? "border-primary ring-2 ring-primary/15" : "border-border/80"}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Trophy className="h-3.5 w-3.5" />
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              Filtered
            </span>
          </div>
          <p className="text-base sm:text-xl font-extrabold text-foreground">{kpis.totalTournaments}</p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Total Tournaments</p>
        </button>

        {/* Total Events */}
        <button type="button" onClick={() => jumpToInventory("events")} aria-label={`View ${kpis.totalEvents} sports events`} aria-pressed={inventoryFocus === "events"} className={`w-full cursor-pointer rounded-xl border bg-card p-2.5 text-left shadow-xs transition-all hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-3 ${inventoryFocus === "events" ? "border-primary ring-2 ring-primary/15" : "border-border/80"}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Target className="h-3.5 w-3.5" />
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              {kpis.liveEvents} Live matches
            </span>
          </div>
          <p className="text-base sm:text-xl font-extrabold text-foreground">{kpis.totalEvents}</p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Total Sport Events</p>
        </button>

        {/* Active Players */}
        <button type="button" onClick={jumpToPlayers} aria-label={`View ${kpis.yourRegistrations} player registration records`} className="w-full cursor-pointer rounded-xl border border-border/80 bg-card p-2.5 text-left shadow-xs transition-all hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Users className="h-3.5 w-3.5" />
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {kpis.yourRegistrations} records
            </span>
          </div>
          <p className="text-base sm:text-xl font-extrabold text-foreground">{kpis.activePlayers}</p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Unique Participants</p>
        </button>

        {/* Capacity Fill Rate */}
        <button type="button" onClick={() => jumpToInventory("capacity")} aria-label="View events with capacity data" aria-pressed={inventoryFocus === "capacity"} className={`w-full cursor-pointer rounded-xl border bg-card p-2.5 text-left shadow-xs transition-all hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-3 ${inventoryFocus === "capacity" ? "border-primary ring-2 ring-primary/15" : "border-border/80"}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-7 w-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
              Slots
            </span>
          </div>
          <p className="text-base sm:text-xl font-extrabold text-foreground">{kpis.capacityTracked ? `${kpis.capacityFillRate}%` : "—"}</p>
          <div className="w-full bg-muted rounded-full h-1 mt-1 overflow-hidden">
            <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${kpis.capacityTracked ? kpis.capacityFillRate : 0}%` }} />
          </div>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Slot Fill Rate</p>
        </button>

        {/* A participant counts once per tournament, even when registered in multiple events. */}
        <button type="button" onClick={() => jumpToInventory("tournaments")} aria-label={`View ${kpis.tournamentRegistrants} registered tournament users`} aria-pressed={inventoryFocus === "tournaments"} className={`w-full cursor-pointer rounded-xl border bg-card p-2.5 text-left shadow-xs transition-all hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-3 ${inventoryFocus === "tournaments" ? "border-primary ring-2 ring-primary/15" : "border-border/80"}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-7 w-7 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <Trophy className="h-3.5 w-3.5" />
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400">
              Across tournaments
            </span>
          </div>
          <p className="text-base sm:text-xl font-extrabold text-foreground">{kpis.tournamentRegistrants}</p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Registered Tournament Users</p>
        </button>

        {/* Event entries count each active player registration across the sports events. */}
        <button type="button" onClick={jumpToPlayers} aria-label={`View ${kpis.eventPlayerEntries} registered player entries across sports events`} className="w-full cursor-pointer rounded-xl border border-border/80 bg-card p-2.5 text-left shadow-xs transition-all hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-7 w-7 rounded-lg bg-fuchsia-500/10 text-fuchsia-500 flex items-center justify-center">
              <UserCheck className="h-3.5 w-3.5" />
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400">
              All sports events
            </span>
          </div>
          <p className="text-base sm:text-xl font-extrabold text-foreground">{kpis.eventPlayerEntries}</p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Registered Event Players</p>
        </button>

        {/* Open Registrations */}
        <button type="button" onClick={() => jumpToInventory("open-events")} aria-label={`View ${kpis.openRegistrations} events open for registration`} aria-pressed={inventoryFocus === "open-events"} className={`w-full cursor-pointer rounded-xl border bg-card p-2.5 text-left shadow-xs transition-all hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-3 ${inventoryFocus === "open-events" ? "border-primary ring-2 ring-primary/15" : "border-border/80"}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-7 w-7 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-pink-500/10 text-pink-600 dark:text-pink-400">
              Joinable
            </span>
          </div>
          <p className="text-base sm:text-xl font-extrabold text-foreground">{kpis.openRegistrations}</p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Open Registrations</p>
        </button>
      </div>

      <section id="registered-players" className="scroll-mt-4 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="m-0 text-sm font-extrabold text-foreground">Registered players</h3>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{registeredPlayerRows.length} shown · {registrationInventory.length} total</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Participants registered for events in the selected sport and date range.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative block w-full sm:w-48">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input value={inventorySearch} onChange={(event) => setInventorySearch(event.target.value)} placeholder="Search players or events" aria-label="Search registered players and sports records" className="w-full rounded-lg border border-border bg-background py-2 pl-8 pr-2.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15" />
            </label>
            <div className="flex rounded-lg bg-muted p-1" role="group" aria-label="Filter registrations by status">
              {[{ value: "ALL", label: "All" }, { value: "CONFIRMED", label: "Registered" }, { value: "PENDING", label: "Pending" }].map((option) => (
                <button key={option.value} type="button" onClick={() => setRegistrationStatusFilter(option.value as typeof registrationStatusFilter)} className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition ${registrationStatusFilter === option.value ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {option.label}{option.value === "CONFIRMED" ? ` (${registrationInventory.filter((row) => ["REGISTERED", "CONFIRMED"].includes(row.status.toUpperCase())).length})` : option.value === "PENDING" ? ` (${registrationInventory.filter((row) => row.status.toUpperCase() === "PENDING").length})` : ""}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => { setInventoryFocus("all"); document.getElementById("sports-operations-inventory")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="rounded-lg border border-border px-3 py-2 text-[11px] font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground">
              Full inventory
            </button>
          </div>
        </div>
        {registeredPlayerRows.length ? <div className="max-h-[420px] overflow-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="sticky top-0 z-[1] bg-muted/80 text-[10px] uppercase tracking-wide text-muted-foreground"><tr>
              {["Player", "Event", "Tournament / category", "Flat", "Status", "Registered"].map((heading) => <th key={heading} className="px-4 py-2.5 font-bold">{heading}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border/40">
              {registeredPlayerRows.map((row) => <tr key={row.id} className="hover:bg-muted/20">
                <td className="px-4 py-3"><p className="m-0 font-bold text-foreground">{row.participant}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{row.relation}</p></td>
                <td className="px-4 py-3"><p className="m-0 font-semibold text-foreground">{row.event}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{row.sport}</p></td>
                <td className="px-4 py-3"><p className="m-0 text-foreground">{row.tournament}</p><p className="mt-0.5 text-[10px] text-muted-foreground">Role / category: {row.category}</p></td>
                <td className="px-4 py-3 text-foreground">{row.flat}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${row.status.toUpperCase() === "PENDING" ? "bg-amber-500/10 text-amber-700" : "bg-emerald-500/10 text-emerald-700"}`}>{row.status}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{row.registeredAt}</td>
              </tr>)}
            </tbody>
          </table>
        </div> : <div className="px-4 py-10 text-center text-xs text-muted-foreground">No registrations match this status and the selected filters.</div>}
      </section>

      {/* Complete filtered sports inventory for admin operations */}
      <section id="sports-operations-inventory" className="scroll-mt-4 space-y-3 rounded-2xl border border-border/80 bg-muted/10 p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2"><h3 className="m-0 text-sm font-extrabold text-foreground">Sports operations inventory</h3>{inventoryFocus !== "all" && <button type="button" onClick={() => setInventoryFocus("all")} className="text-[10px] font-bold text-primary hover:underline">Show all</button>}</div>
            <p className="mt-1 text-xs text-muted-foreground">Tournaments, fixtures, registrations, squads and venues under the selected filters.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {(inventoryFocus === "all" || inventoryFocus === "tournaments") && renderInventoryTable("Tournaments", ["Tournament", "Status", "Dates", "Events", "Registered users", "Event entries", "Sports"], visibleTournaments.map((row) => [row.name, row.status, `${row.startDate || "—"} – ${row.endDate || "—"}`, row.eventCount, row.registeredUsers, row.registrations, row.sports.join(", ")]))}
          {(inventoryFocus === "all" || inventoryFocus === "events" || inventoryFocus === "capacity" || inventoryFocus === "open-events") && renderInventoryTable(inventoryFocus === "open-events" ? "Events open for registration" : inventoryFocus === "capacity" ? "Events with configured capacity" : "Events", ["Event", "Sport", "Tournament", "Date", "Venue", "Status", "Registered / Capacity", "Confirmed", "Pending"], visibleEvents.filter((row) => inventoryFocus === "capacity" ? Number(row.capacity) > 0 : inventoryFocus === "open-events" ? ["OPEN", "REGISTRATION_OPEN"].includes(row.status.toUpperCase()) : true).map((row) => [row.name, row.sport, row.tournament, row.date, row.venue, row.status, `${row.registered} / ${row.capacity ?? "—"}`, row.confirmed, row.pending]))}
          {(inventoryFocus === "all" || inventoryFocus === "matches") && renderInventoryTable("Match schedule and results", ["Tournament", "Event", "Stage", "Fixture", "Score", "Scheduled", "Venue", "Status"], visibleMatches.map((row) => [row.tournament, row.event, row.stage, `${row.homeTeam} vs ${row.awayTeam}`, row.score, row.scheduledAt, row.venue, row.status]))}
          {inventoryFocus === "all" && renderInventoryTable("Teams and squads", ["Team", "Tournament / auction", "Event", "Sport", "Captain", "Players"], visibleTeams.map((row) => [row.team, row.tournament, row.event, row.sport, row.captain, row.players.length ? row.players.join(", ") : `${row.playerCount} players`]))}
        </div>
      </section>

      {/* ── 3. Performance & Demographics (2-Column Main Section) ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Participation Area & Monthly Trends (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Participation & Athlete Inflow Area Chart */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Registrations and event activity
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
              Registration records and event dates by month
                </p>
              </div>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">
                Monthly Wave
              </span>
            </div>

            {participationTrend.length ? <ResponsiveContainer width="100%" height={240}>
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
            </ResponsiveContainer> : <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">No registration dates or events are available in this range.</div>}
          </div>

          {/* Monthly Events Stacked Bar Chart */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Monthly Events Breakdown by Sport
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Distribution of events scheduled each month across all sports
                </p>
              </div>
            </div>

            {monthlyEvents.some((row) => sportNames.some((sport) => Number(row[sport]) > 0)) ? <ResponsiveContainer width="100%" height={220}>
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
            </ResponsiveContainer> : <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">No dated sports events are available in this range.</div>}
          </div>
        </div>

        {/* RIGHT COLUMN: Registration details (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
            <h3 className="mb-1 text-xs font-bold text-foreground">Events by sport</h3>
            <p className="mb-4 text-xs text-muted-foreground">Share of scheduled sports events within these filters.</p>
            {sportShare.length ? <div className="space-y-3">{sportShare.map((sport) => (
              <div key={sport.name}>
                <div className="mb-1 flex items-center justify-between text-xs"><span className="font-semibold text-foreground">{sport.name}</span><span className="text-muted-foreground">{sport.count} events · {sport.value}%</span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${sport.value}%`, backgroundColor: sport.color }} /></div>
              </div>
            ))}</div> : <div className="rounded-xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">No events match these filters.</div>}
          </div>

          {/* Gender Demographics Donut */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-foreground mb-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-pink-500" />
              Gender Demographics
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Distribution from gender values recorded on registrations
            </p>

            {demographics.gender.length ? <ResponsiveContainer width="100%" height={150}>
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
            </ResponsiveContainer> : <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">Gender details are not included in the available registration data.</div>}

            <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-border/50 text-center">
              {demographics.gender.map((g) => (
                <div key={g.name} className="p-1.5 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground font-medium">{g.name}</p>
                  <p className="text-xs font-bold text-foreground mt-0.5">{g.value}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Age Group Distribution */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-foreground mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Age Category Distribution
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Community athletes segmented by age brackets
            </p>

            {demographics.ageGroups.length ? <div className="space-y-3">
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
            </div> : <div className="rounded-xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">No participant ages are available.</div>}
          </div>

          {/* Tower / Block Participation Leaderboard */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-foreground mb-1 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              Residence participation
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Registration counts by recorded flat number
            </p>

            {demographics.blockDistribution.length ? <div className="space-y-2.5">
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
            </div> : <div className="rounded-xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">No flat numbers were provided in registrations.</div>}
          </div>
        </div>
      </div>

      {/* ── 4. Dynamic Sport Leaders & Top Performers ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sport-Specific Performance Leaders (Orange/Purple Caps, Golden Boot) */}
        <div className="lg:col-span-12 bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Most Registered Participants by Sport
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ranked by actual registration records within the selected filters.
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
                  <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">{lead.category}</p>
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-border/40 text-xs">
                    <span className="font-bold text-primary">{lead.metricValue} {lead.metricLabel}</span>
                    {lead.subMetric && <span className="text-[10px] text-muted-foreground font-semibold">{lead.subMetric}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {currentSportLeaders.length === 0 && <div className="mt-3 rounded-xl border border-dashed border-border px-4 py-7 text-center text-xs text-muted-foreground">No participant registrations are available for this sport and time range.</div>}
        </div>
      </div>

      {/* ── 5. Standings & Venue Utilization ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* League Standings with Team Form */}
        <div className="lg:col-span-8 bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-primary" />
                Tournament Standings & Team Form
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Points calculated from completed saved match scores and configured rules
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
                          {(row.form || []).map((f, fi) => (
                            <span
                              key={fi}
                              className={`w-4 h-4 rounded text-[10px] font-black flex items-center justify-center text-white ${ f === "W" ? "bg-emerald-500" : f === "L" ? "bg-rose-500" : "bg-amber-500" }`}
                            >
                              {f}
                            </span>
                          ))}
                          {(!row.form || row.form.length === 0) && <span className="text-[10px] text-muted-foreground">—</span>}
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
              <p className="text-xs text-muted-foreground">No completed group-stage scores are available for these filters.</p>
            </div>
          )}
        </div>

        {/* Venue & Arena Utilization */}
        <div className="lg:col-span-4 bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                Venue & Court Utilization
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Most utilized sports arenas and grounds
              </p>
            </div>
          </div>

          {venueUtilization.length ? <div className="space-y-3.5 mt-4">
            {venueUtilization.map((v) => (
              <div key={v.name} className="p-3 rounded-xl bg-muted/20 border border-border/50">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-foreground truncate">{v.name}</span>
                  <span className="font-bold text-primary">{v.eventsCount} Events</span>
                </div>
                {v.city && <p className="text-xs text-muted-foreground mb-1.5">{v.city}</p>}
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${v.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div> : <div className="mt-4 rounded-xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">No venue details are recorded for the selected events.</div>}
        </div>
      </div>
    </div>
  );
}
