import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Watch, RefreshCw, ArrowLeft, Heart, Droplets, AlertTriangle } from "lucide-react";
import { apiClient } from "../../../services/common/apiClient";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm ${className}`}>{children}</div>;
}

function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 pb-2 ${className}`}>{children}</div>;
}

function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`font-semibold ${className}`}>{children}</h3>;
}

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${className}`}>{children}</span>;
}

function Button({ children, onClick, disabled, className = "" }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 text-xs transition cursor-pointer disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

type WearableEventType =
  | "FALL_DETECTED" | "HIGH_HEART_RATE" | "LOW_HEART_RATE" | "IRREGULAR_HEART_RATE"
  | "LOW_SPO2" | "INACTIVITY_ALERT" | "LOW_BATTERY" | "DEVICE_DISCONNECTED" | "MANUAL_CHECK_IN";

interface WearableHealthEventDto {
  id: number;
  userId: number;
  deviceId?: number;
  eventType: WearableEventType;
  heartRateBpm?: number;
  spo2Percent?: number;
  sosTriggered: boolean;
  linkedIncidentId?: number;
  eventAt: string;
}

const EVENT_ICON: Record<WearableEventType, string> = {
  FALL_DETECTED: "🆘",
  HIGH_HEART_RATE: "❤️‍🔥",
  LOW_HEART_RATE: "💙",
  IRREGULAR_HEART_RATE: "💔",
  LOW_SPO2: "💧",
  INACTIVITY_ALERT: "⏰",
  LOW_BATTERY: "🔋",
  DEVICE_DISCONNECTED: "📵",
  MANUAL_CHECK_IN: "✅",
};

const EVENT_LABEL: Record<WearableEventType, string> = {
  FALL_DETECTED: "Fall Detected",
  HIGH_HEART_RATE: "High Heart Rate",
  LOW_HEART_RATE: "Low Heart Rate",
  IRREGULAR_HEART_RATE: "Irregular Heart Rate",
  LOW_SPO2: "Low SpO₂",
  INACTIVITY_ALERT: "Inactivity",
  LOW_BATTERY: "Low Battery",
  DEVICE_DISCONNECTED: "Disconnected",
  MANUAL_CHECK_IN: "Check-In",
};

const CRITICAL: WearableEventType[] = ["FALL_DETECTED", "LOW_SPO2", "HIGH_HEART_RATE", "LOW_HEART_RATE"];

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function WearableAlertsDashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<WearableHealthEventDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    // Admin view: we use a broad recent-events query; per-user events require userId
    // For now fetch from a hypothetical admin endpoint; graceful fallback to empty
    apiClient
      .get<WearableHealthEventDto[]>("/api/healthguard/admin/wearable-events")
      .then(r => setEvents(Array.isArray(r) ? r : ((r as any)?.data ?? [])))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const critical = events.filter(e => CRITICAL.includes(e.eventType));
  const sosFired = events.filter(e => e.sosTriggered);

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/healthguard/admin/incidents")} className="gap-1 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Watch className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Wearable Alerts</h1>
              <p className="text-xs text-muted-foreground">Admin — recent health events from connected wearables</p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-red-600">{sosFired.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Auto-SOS Fired</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-orange-600">{critical.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Critical Alerts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-blue-600">{events.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Events</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading wearable events...</div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Watch className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No wearable events to display.</p>
            <p className="text-xs text-muted-foreground mt-1">Events appear here when residents trigger alerts from their wearables.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Recent Events ({events.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {events.map(e => (
                <div
                  key={e.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    e.sosTriggered
                      ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                      : CRITICAL.includes(e.eventType)
                      ? "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800"
                      : "bg-muted/30 border-border"
                  }`}
                >
                  <span className="text-xl mt-0.5">{EVENT_ICON[e.eventType]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{EVENT_LABEL[e.eventType]}</span>
                      {e.sosTriggered && (
                        <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">SOS Fired</Badge>
                      )}
                      {e.linkedIncidentId && (
                        <span className="text-xs text-muted-foreground">→ Incident #{e.linkedIncidentId}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>User #{e.userId}</span>
                      {e.heartRateBpm && (
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-red-500" />{e.heartRateBpm} bpm
                        </span>
                      )}
                      {e.spo2Percent && (
                        <span className="flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-blue-500" />SpO₂ {e.spo2Percent}%
                        </span>
                      )}
                      <span>{fmt(e.eventAt)}</span>
                    </div>
                  </div>
                  {CRITICAL.includes(e.eventType) && !e.sosTriggered && (
                    <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
