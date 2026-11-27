import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { opsDashboardService, type OpsSnapshot } from "../../../services/opsDashboardService";
import { stompClient } from "../../../services/chat/stompClient";
import {
  AlertCircle, Users, Car, Eye, Shield, RefreshCw, Loader2,
  TrendingUp, Clock,
} from "lucide-react";

function formatINR(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  return `${Math.floor(secs / 60)}m ago`;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  severity?: "ok" | "warn" | "critical" | "neutral";
}

function MetricCard({ icon, label, value, sub, severity = "neutral" }: MetricCardProps) {
  const colors = {
    ok:       { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", val: "text-emerald-800" },
    warn:     { bg: "bg-amber-50 border-amber-200",     text: "text-amber-700",   val: "text-amber-900" },
    critical: { bg: "bg-red-50 border-red-200",         text: "text-red-600",     val: "text-red-800" },
    neutral:  { bg: "bg-white border-slate-200",        text: "text-slate-500",   val: "text-slate-800" },
  }[severity];

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 ${colors.bg}`}>
      <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${colors.text}`}>
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-bold font-mono ${colors.val}`}>{value}</div>
      {sub && <div className={`text-xs ${colors.text}`}>{sub}</div>}
    </div>
  );
}

export function OpsDashboardLive() {
  const { user } = useAuth();
  const communityId = user?.communityId ?? 0;
  const [snap, setSnap] = useState<OpsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toISOString());
  const [tick, setTick] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!communityId) return;
    try {
      const data = await opsDashboardService.getSnapshot(communityId);
      setSnap(data);
      setLastUpdate(data.asOf ?? new Date().toISOString());
      setError(null);
    } catch {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => { load(); }, [load]);

  // "X seconds ago" counter
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 10_000);
    return () => clearInterval(t);
  }, []);
  void tick; // used for re-render

  useEffect(() => {
    if (!communityId) return;

    if (stompClient.connected) {
      const unsub = stompClient.subscribe(
        `/topic/community/${communityId}/ops`,
        (body: unknown) => {
          const data = body as OpsSnapshot;
          setSnap(data);
          setLastUpdate(data.asOf ?? new Date().toISOString());
        }
      );
      return unsub;
    } else {
      pollRef.current = setInterval(load, 30_000);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }
  }, [communityId, load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
        <button
          onClick={load}
          className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (!snap) return null;

  const complaintSeverity: MetricCardProps["severity"] =
    snap.openComplaints > 20 ? "critical" : snap.openComplaints > 5 ? "warn" : "ok";
  const paymentSeverity: MetricCardProps["severity"] =
    snap.overduePaymentsCount > 10 ? "critical" : snap.overduePaymentsCount > 0 ? "warn" : "ok";
  const guardSeverity: MetricCardProps["severity"] =
    snap.activeGuards < snap.totalGuards * 0.6 ? "warn" : "ok";

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" /> Ops Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Updated {timeAgo(lastUpdate)}
            {stompClient.connected && (
              <span className="ml-2 text-emerald-500 font-medium">● Live</span>
            )}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MetricCard
          icon={<AlertCircle className="w-3.5 h-3.5" />}
          label="Open Complaints"
          value={snap.openComplaints}
          sub="Requires resolution"
          severity={complaintSeverity}
        />
        <MetricCard
          icon={<AlertCircle className="w-3.5 h-3.5" />}
          label="Overdue Payments"
          value={formatINR(snap.overduePaymentsAmount)}
          sub={`${snap.overduePaymentsCount} residents`}
          severity={paymentSeverity}
        />
        <MetricCard
          icon={<Shield className="w-3.5 h-3.5" />}
          label="Guards Active"
          value={`${snap.activeGuards} / ${snap.totalGuards}`}
          sub="On duty now"
          severity={guardSeverity}
        />
        <MetricCard
          icon={<Eye className="w-3.5 h-3.5" />}
          label="Visitors Today"
          value={snap.todayVisitors}
          sub="Checked in"
          severity="neutral"
        />
        <MetricCard
          icon={<Users className="w-3.5 h-3.5" />}
          label="Staff Present"
          value={snap.staffPresent}
          sub="Domestic + community"
          severity="neutral"
        />
        <MetricCard
          icon={<Car className="w-3.5 h-3.5" />}
          label="Parking"
          value={`${snap.parkingOccupied} / ${snap.parkingTotal}`}
          sub="Slots occupied"
          severity={snap.parkingOccupied >= snap.parkingTotal ? "warn" : "neutral"}
        />
      </div>
    </div>
  );
}
