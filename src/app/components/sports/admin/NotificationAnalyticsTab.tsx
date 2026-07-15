import { useState, useEffect, useCallback, useRef } from "react";
import { BarChart3, Bell, RefreshCw, TrendingUp, Eye, ChevronDown, Mail } from "lucide-react";
import { notificationAnalyticsService, type NotificationAnalytics } from "../../../../services/notificationAnalyticsService";
import { showError } from "../../../../utils/ToastUtils";

const CATEGORY_COLORS: Record<string, string> = {
  SPORTS: "#6366f1",
  AUCTION: "#f59e0b",
  EVENTS: "#10b981",
  COMMUNITY: "#3b82f6",
  GENERAL: "#8b5cf6",
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  NORMAL: "#6366f1",
  LOW: "#94a3b8",
};

function MetricCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string; icon: any; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <div className="text-lg font-bold text-slate-800">{value}</div>
          <div className="text-[11px] text-slate-500">{label}</div>
          {sub && <div className="text-[10px] text-slate-400">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

function BarChartSimple({ data, labelKey, valueKey, colorFn, maxBars = 10 }: {
  data: any[]; labelKey: string; valueKey: string; colorFn: (label: string) => string; maxBars?: number;
}) {
  const sliced = data.slice(0, maxBars);
  const max = Math.max(...sliced.map(d => d[valueKey] || 0), 1);

  return (
    <div className="space-y-1.5">
      {sliced.map((d, i) => {
        const pct = ((d[valueKey] || 0) / max) * 100;
        const label = (d[labelKey] || "").replace(/_/g, " ");
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 w-28 truncate text-right">{label}</span>
            <div className="flex-1 h-5 bg-slate-50 rounded-md overflow-hidden">
              <div
                className="h-full rounded-md transition-all duration-500"
                style={{ width: `${Math.max(pct, 2)}%`, background: colorFn(d[labelKey]) }}
              />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 w-10 text-right">{d[valueKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

function DailyTrendChart({ data }: { data: { date: string; count: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 10, right: 10, bottom: 24, left: 36 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const max = Math.max(...data.map(d => d.count), 1);
    const xStep = plotW / Math.max(data.length - 1, 1);

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + plotH - (plotH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();

      ctx.fillStyle = "#94a3b8";
      ctx.font = "9px system-ui";
      ctx.textAlign = "right";
      ctx.fillText(String(Math.round((max * i) / 4)), pad.left - 4, y + 3);
    }

    // Area
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = pad.left + i * xStep;
      const y = pad.top + plotH - (d.count / max) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.left + (data.length - 1) * xStep, pad.top + plotH);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.closePath();
    ctx.fillStyle = "rgba(99,102,241,0.08)";
    ctx.fill();

    // Line
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = pad.left + i * xStep;
      const y = pad.top + plotH - (d.count / max) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dots
    data.forEach((d, i) => {
      const x = pad.left + i * xStep;
      const y = pad.top + plotH - (d.count / max) * plotH;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#6366f1";
      ctx.fill();
    });

    // X labels (show every Nth)
    const step = Math.max(1, Math.floor(data.length / 7));
    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px system-ui";
    ctx.textAlign = "center";
    data.forEach((d, i) => {
      if (i % step !== 0 && i !== data.length - 1) return;
      const x = pad.left + i * xStep;
      const label = d.date.substring(5);
      ctx.fillText(label, x, h - 6);
    });
  }, [data]);

  if (data.length === 0) {
    return <div className="py-8 text-center text-xs text-slate-400">No trend data in this period.</div>;
  }

  return <canvas ref={canvasRef} className="w-full" style={{ height: "180px" }} />;
}

export function NotificationAnalyticsTab() {
  const [analytics, setAnalytics] = useState<NotificationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationAnalyticsService.getAnalytics(days);
      setAnalytics(data);
    } catch {
      showError("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
        <span className="ml-2 text-sm text-slate-500">Loading analytics…</span>
      </div>
    );
  }

  if (!analytics) {
    return <div className="py-8 text-center text-xs text-slate-400">No analytics data available.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">Notification engagement metrics</p>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-[11px] font-medium">
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 transition-colors cursor-pointer ${days === d ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                {d}d
              </button>
            ))}
          </div>
          <button onClick={fetchAnalytics} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={Bell}
          label="Total Sent"
          value={analytics.totalSent.toLocaleString()}
          color="#6366f1"
        />
        <MetricCard
          icon={Eye}
          label="Total Read"
          value={analytics.totalRead.toLocaleString()}
          color="#10b981"
        />
        <MetricCard
          icon={TrendingUp}
          label="Read Rate"
          value={`${analytics.readRate}%`}
          color="#f59e0b"
        />
        <MetricCard
          icon={Mail}
          label="Daily Avg"
          value={analytics.dailyTrend.length > 0
            ? Math.round(analytics.dailyTrend.reduce((s, d) => s + d.count, 0) / analytics.dailyTrend.length)
            : 0}
          sub={`over ${analytics.days} days`}
          color="#8b5cf6"
        />
      </div>

      {/* Daily Trend */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <h4 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
          Daily Trend
        </h4>
        <DailyTrendChart data={analytics.dailyTrend} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By Category + Read Rate */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <h4 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
            By Category
          </h4>
          <BarChartSimple
            data={analytics.byCategory}
            labelKey="category"
            valueKey="count"
            colorFn={(label) => CATEGORY_COLORS[label] || "#6366f1"}
          />
          {analytics.readRateByCategory.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <h5 className="text-[10px] uppercase tracking-wide text-slate-400 mb-2">Read Rate by Category</h5>
              <div className="space-y-1">
                {analytics.readRateByCategory.map(r => (
                  <div key={r.category} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 w-20 truncate text-right">{r.category.replace(/_/g, " ")}</span>
                    <div className="flex-1 h-4 bg-slate-50 rounded-md overflow-hidden relative">
                      <div
                        className="h-full rounded-md"
                        style={{
                          width: `${Math.max(r.readRate, 2)}%`,
                          background: CATEGORY_COLORS[r.category] || "#6366f1",
                          opacity: 0.7,
                        }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-slate-700">
                        {r.readRate}%
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 w-16 text-right">{r.read}/{r.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* By Type */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <h4 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-indigo-500" />
            By Notification Type
          </h4>
          <BarChartSimple
            data={analytics.byType}
            labelKey="type"
            valueKey="count"
            colorFn={() => "#6366f1"}
            maxBars={12}
          />

          {analytics.byPriority.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <h5 className="text-[10px] uppercase tracking-wide text-slate-400 mb-2">By Priority</h5>
              <div className="flex items-center gap-3 flex-wrap">
                {analytics.byPriority.map(p => (
                  <div key={p.priority} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: PRIORITY_COLORS[p.priority] || "#6366f1" }} />
                    <span className="text-[11px] text-slate-600">{p.priority}</span>
                    <span className="text-[11px] font-semibold text-slate-800">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
