import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle, AlertCircle, Info, Bell, ChevronLeft,
  RefreshCw, Loader2, TrendingUp, TrendingDown, Minus,
  Users, Clock, MessageSquare, DollarSign, X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import { insightsService, type CommunityInsight, type MetricsSnapshot } from "../../../services/insightsService";

const SEVERITY_CONFIG = {
  CRITICAL: { border: "border-l-red-500", bg: "bg-red-50 dark:bg-red-900/10", icon: AlertCircle, iconColor: "text-red-500", badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  ALERT:    { border: "border-l-orange-500", bg: "bg-orange-50 dark:bg-orange-900/10", icon: AlertTriangle, iconColor: "text-orange-500", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  WARNING:  { border: "border-l-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-900/10", icon: Bell, iconColor: "text-yellow-500", badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  INFO:     { border: "border-l-blue-400", bg: "bg-blue-50 dark:bg-blue-900/10", icon: Info, iconColor: "text-blue-500", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
};

function Sparkline({ data, valueKey, color = "#3b82f6" }: { data: MetricsSnapshot[]; valueKey: keyof MetricsSnapshot; color?: string }) {
  if (data.length < 2) return <div className="text-xs text-muted-foreground">Not enough data</div>;
  const vals = data.map((d) => Number(d[valueKey] ?? 0));
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const W = 200;
  const H = 50;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 8) - 4;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12" preserveAspectRatio="none">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].split(",")[0]} cy={pts[pts.length - 1].split(",")[1]} r="3" fill={color} />
    </svg>
  );
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return <Minus className="w-4 h-4 text-slate-400" />;
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 1) return <Minus className="w-4 h-4 text-slate-400" />;
  if (pct > 0) return <div className="flex items-center gap-0.5 text-emerald-600 text-xs font-medium"><TrendingUp className="w-3.5 h-3.5" />+{pct.toFixed(1)}%</div>;
  return <div className="flex items-center gap-0.5 text-red-500 text-xs font-medium"><TrendingDown className="w-3.5 h-3.5" />{pct.toFixed(1)}%</div>;
}

export default function InsightsDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const communityId = user?.communityId ?? 0;

  const [insights, setInsights] = useState<CommunityInsight[]>([]);
  const [trend, setTrend] = useState<MetricsSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!communityId) return;
    setLoading(true);
    try {
      const [ins, tr] = await Promise.all([
        insightsService.getActiveInsights(communityId),
        insightsService.getMetricsTrend(communityId, "all", 30),
      ]);
      setInsights(ins);
      setTrend(tr);
    } catch {
      toast.error("Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => { load(); }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await insightsService.generateSnapshot(communityId);
      await load();
      toast.success("Insights refreshed");
    } catch {
      toast.error("Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleDismiss(id: number) {
    try {
      await insightsService.dismissInsight(id);
      setInsights((prev) => prev.filter((i) => i.id !== id));
    } catch {
      toast.error("Could not dismiss insight");
    }
  }

  const latest = trend[trend.length - 1];
  const prev = trend[trend.length - 2];

  const kpis = latest ? [
    { icon: DollarSign, label: "Collection Rate", value: `${(latest.collectionRate * 100).toFixed(1)}%`, trend: prev ? <TrendIndicator current={latest.collectionRate} previous={prev.collectionRate} /> : null, color: "text-emerald-600" },
    { icon: MessageSquare, label: "Open Complaints", value: latest.openComplaints, trend: prev ? <TrendIndicator current={latest.openComplaints} previous={prev.openComplaints} /> : null, color: "text-orange-600" },
    { icon: Users, label: "Active Residents", value: `${(latest.activeResidentsPct * 100).toFixed(0)}%`, trend: prev ? <TrendIndicator current={latest.activeResidentsPct} previous={prev.activeResidentsPct} /> : null, color: "text-blue-600" },
    { icon: Clock, label: "Avg Resolution", value: `${latest.avgResolutionHours.toFixed(1)}h`, trend: prev ? <TrendIndicator current={latest.avgResolutionHours} previous={prev.avgResolutionHours} /> : null, color: "text-purple-600" },
  ] : [];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">AI Insights</h1>
            <p className="text-sm text-muted-foreground">Community health signals and recommendations</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh insights
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* KPI tiles */}
          {kpis.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {kpis.map(({ icon: Icon, label, value, trend: t, color }) => (
                <div key={label} className="bg-card rounded-xl border border-border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Icon className={`w-4 h-4 ${color}`} />
                    {t}
                  </div>
                  <div className="text-2xl font-bold font-mono">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Insight cards */}
          {insights.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-10 text-center text-muted-foreground">
              <Info className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No active insights. Everything looks good!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Active Insights</h2>
              {(["CRITICAL", "ALERT", "WARNING", "INFO"] as const).map((sev) => {
                const sevInsights = insights.filter((i) => i.severity === sev);
                if (!sevInsights.length) return null;
                const cfg = SEVERITY_CONFIG[sev];
                const Icon = cfg.icon;
                return sevInsights.map((insight) => (
                  <div key={insight.id} className={`bg-card rounded-xl border border-l-4 ${cfg.border} ${cfg.bg} p-4 space-y-2`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.iconColor}`} />
                        <span className="font-semibold text-sm">{insight.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>{sev}</span>
                        {insight.metricValue != null && (
                          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
                            {insight.metricValue}{insight.metricUnit ? ` ${insight.metricUnit}` : ""}
                          </span>
                        )}
                      </div>
                      <button onClick={() => handleDismiss(insight.id)} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 flex-shrink-0">
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">{insight.description}</p>
                    {insight.recommendation && (
                      <p className="text-sm pl-6 italic text-slate-600 dark:text-slate-300">💡 {insight.recommendation}</p>
                    )}
                  </div>
                ));
              })}
            </div>
          )}

          {/* Trend charts */}
          {trend.length > 2 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border p-4 space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2"><MessageSquare className="w-4 h-4 text-orange-500" /> Open Complaints (30d)</h3>
                <Sparkline data={trend} valueKey="openComplaints" color="#f97316" />
              </div>
              <div className="bg-card rounded-xl border border-border p-4 space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-500" /> Collection Rate (30d)</h3>
                <Sparkline data={trend} valueKey="collectionRate" color="#22c55e" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
