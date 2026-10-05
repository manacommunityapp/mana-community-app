import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  RefreshCw,
  Bell,
  Smartphone,
  Mail,
  MessageSquare,
  Radio,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Zap,
  RotateCcw,
  Sliders,
} from "lucide-react";
import {
  unifiedNotificationService,
  type NotificationAuditLog,
  type NotificationRule,
  type NotificationChannel,
} from "../../../services/notification/unifiedNotificationService";

const CHANNEL_ICONS: Record<NotificationChannel, React.ComponentType<{ className?: string }>> = {
  IN_APP: Radio,
  PUSH: Smartphone,
  EMAIL: Mail,
  SMS: MessageSquare,
  WHATSAPP: MessageSquare,
};

export const NotificationAuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<NotificationAuditLog[]>([]);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"logs" | "rules">("logs");

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsRes, rulesRes] = await Promise.all([
        unifiedNotificationService.getMyLogs(0, 30).catch(() => ({ content: [] })),
        unifiedNotificationService.getNotificationRules().catch(() => []),
      ]);
      setLogs(logsRes.content || []);
      setRules(rulesRes || []);
    } catch (e) {
      console.warn("Failed to load logs/rules:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRetry = async (logId: number) => {
    try {
      setRetryingId(logId);
      await unifiedNotificationService.retryDelivery(logId);
      await loadData();
    } catch (e) {
      console.error("Retry failed:", e);
    } finally {
      setRetryingId(null);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Delivered
          </span>
        );
      case "SUPPRESSED_QUIET_HOURS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Quiet Hours
          </span>
        );
      case "FAILED":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-indigo-300 mb-3">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Domain Event Notification Engine • 9-Stage Pipeline
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Notification Audit Trail & Engine Rules</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Inspect multi-channel dispatches, quiet-hours suppression, delivery receipts, and trigger automated fallback cascades.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white/10 rounded-xl p-1 border border-white/15">
              <button
                onClick={() => setActiveTab("logs")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === "logs" ? "bg-white text-slate-950 shadow-sm" : "text-slate-300 hover:text-white"
                }`}
              >
                Delivery Logs
              </button>
              <button
                onClick={() => setActiveTab("rules")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === "rules" ? "bg-white text-slate-950 shadow-sm" : "text-slate-300 hover:text-white"
                }`}
              >
                Pipeline Rules ({rules.length})
              </button>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition border border-white/20"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {activeTab === "logs" ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600" /> Channel Delivery Audit Log
            </h3>
            <span className="text-xs text-slate-500">{logs.length} logged dispatches</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 animate-pulse">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-sm">No notification logs recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">Dispatches across In-App, Push, Email, SMS, and WhatsApp will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Notification ID / Time</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Title & Details</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => {
                    const Icon = CHANNEL_ICONS[log.channel] || Bell;
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4">
                          <div className="font-mono text-[11px] text-indigo-900 font-bold">{log.notificationId}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{log.createdAt || "Just now"}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {log.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <Icon className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{log.channel}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 truncate">{log.title}</div>
                          <div className="text-slate-500 text-[11px] truncate">{log.body}</div>
                          {log.errorReason && (
                            <div className="text-rose-500 text-[10px] mt-0.5">{log.errorReason}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {renderStatusBadge(log.status)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {log.status === "FAILED" && (
                            <button
                              onClick={() => handleRetry(log.id)}
                              disabled={retryingId === log.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-[11px] font-bold transition border border-indigo-200"
                            >
                              <RotateCcw className={`w-3 h-3 ${retryingId === log.id ? "animate-spin" : ""}`} />
                              Fallback Retry
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Rules View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <div key={rule.ruleId} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {rule.ruleId}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {rule.defaultPriority}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">{rule.eventType}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Category: <span className="font-semibold text-slate-700">{rule.category}</span></p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg space-y-1 text-xs font-mono text-slate-600 border border-slate-100">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Template</div>
                <div className="text-slate-800 font-semibold">{rule.titleTemplate}</div>
                <div className="text-slate-500">{rule.bodyTemplate}</div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-slate-400">Strategy: <span className="font-bold text-slate-700">{rule.defaultStrategy}</span></span>
                <div className="flex gap-1">
                  {rule.defaultChannels.map((c) => (
                    <span key={c} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
