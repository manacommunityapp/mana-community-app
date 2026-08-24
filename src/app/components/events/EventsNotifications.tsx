import { useState, useEffect } from "react";
import {
  Bell, Plus, Loader2, X, Send, Pause, Play, RotateCcw,
  Trash2, CheckCircle2, Clock, AlertCircle, Mail, MessageSquare, Smartphone,
} from "lucide-react";
import { ErrorBanner, LoadingSpinner } from "./shared";
import {
  eventNotificationService,
  type ScheduledNotificationResponse,
  type ScheduleNotificationRequest,
  type ChannelKey,
  type NotificationType,
  type RepeatMode,
  type ScheduleStatus,
  type NotificationStatsResponse,
} from "../../../services/events/eventNotificationService";
import { eventService, type EventResponse } from "../../../services/events/eventService";

const STATUS_STYLES: Record<ScheduleStatus, { label: string; bg: string; text: string; Icon: typeof CheckCircle2 }> = {
  scheduled: { label: "Scheduled", bg: "bg-blue-50",    text: "text-blue-700",   Icon: Clock        },
  sent:       { label: "Sent",      bg: "bg-emerald-50", text: "text-emerald-700",Icon: CheckCircle2 },
  paused:     { label: "Paused",    bg: "bg-amber-50",   text: "text-amber-700",  Icon: Pause        },
  failed:     { label: "Failed",    bg: "bg-rose-50",    text: "text-rose-700",   Icon: AlertCircle  },
  cancelled:  { label: "Cancelled", bg: "bg-slate-100",  text: "text-slate-500",  Icon: X            },
};

const CHANNEL_ICONS: Record<ChannelKey, typeof Mail> = {
  email:    Mail,
  sms:      MessageSquare,
  whatsapp: MessageSquare,
  push:     Bell,
  inApp:    Bell,
};

const CHANNELS: { key: ChannelKey; label: string }[] = [
  { key: "email",    label: "Email"     },
  { key: "sms",      label: "SMS"       },
  { key: "whatsapp", label: "WhatsApp"  },
  { key: "push",     label: "Push"      },
  { key: "inApp",    label: "In-App"    },
];

const emptyForm = (): ScheduleNotificationRequest => ({
  eventId: 0,
  type: "reminder",
  channels: ["email"],
  sendNow: false,
  scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
  repeat: "none",
  sendToAll: true,
  customMessage: "",
});

export function EventsNotifications() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<ScheduledNotificationResponse[]>([]);
  const [stats, setStats] = useState<NotificationStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ScheduleNotificationRequest>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<ScheduleStatus | "">("");

  useEffect(() => {
    eventService.getAll()
      .then(evts => {
        const activeList = (evts || []).filter(e => {
          const s = String(e.status || "").toUpperCase();
          return s !== "CANCELLED" && s !== "CLOSED" && s !== "ARCHIVED";
        });
        setEvents(activeList);
        if (activeList.length > 0) setSelectedEventId(activeList[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    loadNotifications();
    loadStats();
  }, [selectedEventId, filterStatus]);

  const loadNotifications = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    setError("");
    try {
      const page = await eventNotificationService.list(selectedEventId, {
        page: 0,
        size: 50,
        status: filterStatus || undefined,
      });
      setNotifications(page.content);
    } catch (e: any) {
      setError(e?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!selectedEventId) return;
    try {
      const s = await eventNotificationService.getStats(selectedEventId);
      setStats(s);
    } catch {
      setStats(null);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    setSaving(true);
    setError("");
    try {
      const payload: ScheduleNotificationRequest = { ...form, eventId: selectedEventId };
      await eventNotificationService.schedule(selectedEventId, payload);
      setShowForm(false);
      setForm(emptyForm());
      await loadNotifications();
      await loadStats();
    } catch (err: any) {
      setError(err?.message || "Failed to schedule notification");
    } finally {
      setSaving(false);
    }
  };

  const doAction = async (
    notif: ScheduledNotificationResponse,
    action: "pause" | "resume" | "resend" | "cancel"
  ) => {
    if (!selectedEventId) return;
    setActioningId(notif.id);
    try {
      if (action === "pause")  await eventNotificationService.pause(selectedEventId, notif.id);
      if (action === "resume") await eventNotificationService.resume(selectedEventId, notif.id);
      if (action === "resend") await eventNotificationService.resend(selectedEventId, notif.id);
      if (action === "cancel") await eventNotificationService.cancel(selectedEventId, notif.id);
      await loadNotifications();
      await loadStats();
    } catch (err: any) {
      setError(err?.message || "Action failed");
    } finally {
      setActioningId(null);
    }
  };

  const toggleChannel = (ch: ChannelKey) => {
    setForm(f => ({
      ...f,
      channels: f.channels.includes(ch)
        ? f.channels.filter(c => c !== ch)
        : [...f.channels, ch],
    }));
  };

  const kpis = stats
    ? [
        { label: "Total",     value: stats.total,      color: "#4f46e5" },
        { label: "Scheduled", value: stats.scheduled,  color: "#3b82f6" },
        { label: "Sent",      value: stats.sent,       color: "#10b981" },
        { label: "Paused",    value: stats.paused,     color: "#f59e0b" },
      ]
    : [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && <ErrorBanner message={error} />}

      {/* Event selector */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedEventId ?? ""}
          onChange={e => setSelectedEventId(Number(e.target.value))}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {events.length === 0 && <option value="">Loading events…</option>}
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as ScheduleStatus | "")}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">All statuses</option>
          {(Object.keys(STATUS_STYLES) as ScheduleStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_STYLES[s].label}</option>
          ))}
        </select>

        <button
          onClick={() => setShowForm(!showForm)}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Schedule Notification
        </button>
      </div>

      {/* KPI strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {kpis.map((k, i) => (
            <div
              key={k.label}
              className={`animate-fade-in-up stagger-${i + 1} bg-white rounded-2xl p-3 sm:p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center`}
            >
              <p className="text-xl sm:text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Schedule form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 border-b border-slate-50">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-500" /> New Notification
            </h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSend} className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">Type</span>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as NotificationType }))}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="reminder">Reminder</option>
                  <option value="update">Update</option>
                  <option value="custom">Custom</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">Repeat</span>
                <select
                  value={form.repeat}
                  onChange={e => setForm(f => ({ ...f, repeat: e.target.value as RepeatMode }))}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-semibold text-slate-600 w-full">Channels</span>
              {CHANNELS.map(({ key, label }) => {
                const Icon = CHANNEL_ICONS[key];
                const active = form.channels.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleChannel(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      active
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.sendNow}
                  onChange={e => setForm(f => ({ ...f, sendNow: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-300"
                />
                Send immediately
              </label>
            </div>

            {!form.sendNow && (
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">Scheduled At</span>
                <input
                  type="datetime-local"
                  value={form.scheduledAt?.slice(0, 16) || ""}
                  onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </label>
            )}

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-600">Custom Message (optional)</span>
              <textarea
                value={form.customMessage || ""}
                onChange={e => setForm(f => ({ ...f, customMessage: e.target.value }))}
                rows={3}
                placeholder="Leave blank to use default message for the type"
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.sendToAll}
                onChange={e => setForm(f => ({ ...f, sendToAll: e.target.checked }))}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-300"
              />
              Send to all registrants
            </label>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || form.channels.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {form.sendNow ? "Send Now" : "Schedule"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notifications list */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 border-b border-slate-50">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-500" /> Notification History
          </h2>
          <button
            onClick={loadNotifications}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Refresh
          </button>
        </div>

        {loading && <LoadingSpinner label="Loading notifications…" />}

        {!loading && notifications.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-400">No notifications yet</p>
            <p className="text-xs text-slate-400 mt-1">Schedule your first notification above</p>
          </div>
        )}

        {notifications.length > 0 && (
          <div className="divide-y divide-slate-50">
            {notifications.map(n => {
              const s = STATUS_STYLES[n.status] ?? STATUS_STYLES.scheduled;
              const SIcon = s.Icon;
              const isActioning = actioningId === n.id;
              return (
                <div key={n.id} className="px-4 sm:px-6 py-3 sm:py-4 flex items-start gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${s.bg}`}>
                    <SIcon className={`w-4 h-4 ${s.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-semibold text-sm text-slate-800">{n.typeLabel || n.type}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.bg} ${s.text}`}>
                        {s.label}
                      </span>
                      <span className="text-[10px] text-slate-400">{n.repeatLabel}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                      <span className="text-xs text-slate-500">
                        Channels: {n.channels.join(", ")}
                      </span>
                      <span className="text-xs text-slate-500">
                        Recipients: {n.recipients}
                      </span>
                      {n.scheduledAt && (
                        <span className="text-xs text-slate-400">
                          {new Date(n.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                      )}
                    </div>
                    {n.message && (
                      <p className="text-xs text-slate-500 mt-1 truncate max-w-md">{n.message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isActioning ? (
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    ) : (
                      <>
                        {n.status === "scheduled" && (
                          <button
                            onClick={() => doAction(n, "pause")}
                            title="Pause"
                            className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {n.status === "paused" && (
                          <button
                            onClick={() => doAction(n, "resume")}
                            title="Resume"
                            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(n.status === "sent" || n.status === "failed") && (
                          <button
                            onClick={() => doAction(n, "resend")}
                            title="Resend"
                            className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(n.status === "scheduled" || n.status === "paused") && (
                          <button
                            onClick={() => doAction(n, "cancel")}
                            title="Cancel"
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
