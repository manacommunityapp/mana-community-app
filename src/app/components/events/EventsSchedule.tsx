import { useState, useEffect, useCallback } from "react";
import { useEventMock } from "./EventMockToggle";
import { eventService } from "../../../services/events/eventService";
import {
  eventNotificationService,
  type ScheduleNotificationRequest,
  type ScheduledNotificationResponse,
  type ChannelKey,
} from "../../../services/events/eventNotificationService";
import {
  CalendarDays, ClipboardList, Mic2, Search, MoreVertical,
  Pencil, Trash2, Bell, Eye, Copy, CheckCircle2, Clock, XCircle,
  AlertCircle, MapPin, Users, Ticket, Globe, Lock,
  Send, Mail, BellRing, Megaphone, MessageSquare,
  ChevronRight, Filter, ArrowUpDown, Plus, ExternalLink, Loader2,
  CalendarClock, Repeat, Timer, History, Zap, RotateCcw, Pause, Play, X,
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { cn } from "../ui/utils";
import { EventsPlanning } from "./EventsPlanning";
import { EventsPrograms } from "./EventsPrograms";

/* ─── Types ─── */
type EventStatus = "upcoming" | "ongoing" | "completed" | "draft" | "cancelled";

interface EventItem {
  id: string;
  title: string;
  type: string;
  category: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  city: string;
  status: EventStatus;
  visibility: "public" | "community" | "private";
  registrations: number;
  capacity: number;
  coverImage: string;
  createdAt: string;
}

/* ─── Mock Data ─── */
const MOCK_EVENTS: EventItem[] = [
  {
    id: "EVT-001", title: "Ganesh Chaturthi Grand Festival 2026", type: "Festival", category: "Religious",
    startDate: "2026-08-22", endDate: "2026-08-31", startTime: "08:00", endTime: "22:00",
    venue: "Society Ground & Community Hall", city: "Mumbai",
    status: "upcoming", visibility: "public", registrations: 342, capacity: 500,
    coverImage: "", createdAt: "2026-07-15",
  },
  {
    id: "EVT-002", title: "Annual Sports Day 2026", type: "Sports", category: "Community",
    startDate: "2026-09-15", endDate: "2026-09-15", startTime: "07:00", endTime: "18:00",
    venue: "Community Sports Ground", city: "Mumbai",
    status: "upcoming", visibility: "community", registrations: 87, capacity: 200,
    coverImage: "", createdAt: "2026-07-28",
  },
  {
    id: "EVT-003", title: "Blood Donation Camp", type: "Health", category: "Social",
    startDate: "2026-09-20", endDate: "2026-09-20", startTime: "09:00", endTime: "16:00",
    venue: "Community Center Hall A", city: "Mumbai",
    status: "upcoming", visibility: "public", registrations: 56, capacity: 150,
    coverImage: "", createdAt: "2026-08-01",
  },
  {
    id: "EVT-004", title: "Navratri Garba Night 2026", type: "Cultural", category: "Festival",
    startDate: "2026-10-02", endDate: "2026-10-11", startTime: "19:00", endTime: "23:00",
    venue: "Open Ground — Andheri East", city: "Mumbai",
    status: "draft", visibility: "community", registrations: 0, capacity: 300,
    coverImage: "", createdAt: "2026-08-05",
  },
  {
    id: "EVT-005", title: "Republic Day Cultural Festival", type: "Cultural", category: "National",
    startDate: "2026-01-26", endDate: "2026-01-26", startTime: "10:00", endTime: "18:00",
    venue: "Society Amphitheatre", city: "Mumbai",
    status: "completed", visibility: "public", registrations: 189, capacity: 200,
    coverImage: "", createdAt: "2025-12-20",
  },
  {
    id: "EVT-006", title: "Diwali Grand Celebration 2025", type: "Festival", category: "Religious",
    startDate: "2025-10-20", endDate: "2025-10-24", startTime: "17:00", endTime: "23:00",
    venue: "Community Hall & Garden", city: "Mumbai",
    status: "completed", visibility: "public", registrations: 456, capacity: 500,
    coverImage: "", createdAt: "2025-09-10",
  },
  {
    id: "EVT-007", title: "Kids Summer Camp 2026", type: "Workshop", category: "Education",
    startDate: "2026-05-01", endDate: "2026-05-31", startTime: "09:00", endTime: "13:00",
    venue: "Community Learning Center", city: "Mumbai",
    status: "completed", visibility: "community", registrations: 124, capacity: 150,
    coverImage: "", createdAt: "2026-03-15",
  },
  {
    id: "EVT-008", title: "Yoga & Wellness Workshop", type: "Health", category: "Wellness",
    startDate: "2026-10-05", endDate: "2026-10-05", startTime: "06:00", endTime: "08:00",
    venue: "Terrace Garden", city: "Mumbai",
    status: "draft", visibility: "private", registrations: 0, capacity: 40,
    coverImage: "", createdAt: "2026-08-06",
  },
];

const STATUS_CONFIG: Record<EventStatus, { label: string; icon: any; bg: string; text: string; dot: string }> = {
  upcoming:  { label: "Upcoming",  icon: Clock,        bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500"    },
  ongoing:   { label: "Ongoing",   icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  completed: { label: "Completed", icon: CheckCircle2, bg: "bg-slate-100",  text: "text-slate-600",   dot: "bg-slate-400"   },
  draft:     { label: "Draft",     icon: Clock,        bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500"   },
  cancelled: { label: "Cancelled", icon: XCircle,      bg: "bg-rose-50",    text: "text-rose-600",    dot: "bg-rose-400"    },
};

const VISIBILITY_ICON: Record<string, { icon: any; label: string }> = {
  public:    { icon: Globe, label: "Public" },
  community: { icon: Users, label: "Community" },
  private:   { icon: Lock,  label: "Private" },
};

const TYPE_COLORS: Record<string, string> = {
  Festival: "#4f46e5", Sports: "#0891b2", Health: "#be185d",
  Cultural: "#7c3aed", Workshop: "#d97706", Social: "#059669",
};

const FILTER_TABS: { id: EventStatus | "all"; label: string }[] = [
  { id: "all",       label: "All Events"  },
  { id: "upcoming",  label: "Upcoming"     },
  { id: "ongoing",   label: "Ongoing"      },
  { id: "draft",     label: "Drafts"       },
  { id: "completed", label: "Completed"    },
];

/* ─── Scheduled Notification Types ─── */
type SendMode = "now" | "scheduled";
type RepeatMode = "none" | "daily" | "weekly" | "custom";
type ScheduleStatus = "scheduled" | "sent" | "paused" | "failed";

interface ScheduledNotification {
  id: string;
  eventId: string;
  type: "reminder" | "update" | "custom";
  typeLabel: string;
  channels: string[];
  scheduledAt: string;
  repeat: RepeatMode;
  repeatLabel: string;
  recipients: number;
  status: ScheduleStatus;
  message?: string;
}

const MOCK_SCHEDULED: ScheduledNotification[] = [
  {
    id: "SN-001", eventId: "EVT-001", type: "reminder", typeLabel: "Event Reminder",
    channels: ["Email", "WhatsApp", "Push"], scheduledAt: "2026-08-20T09:00",
    repeat: "none", repeatLabel: "One-time", recipients: 342, status: "scheduled",
  },
  {
    id: "SN-002", eventId: "EVT-001", type: "reminder", typeLabel: "Event Reminder",
    channels: ["Email", "Push"], scheduledAt: "2026-08-21T18:00",
    repeat: "none", repeatLabel: "One-time", recipients: 342, status: "scheduled",
  },
  {
    id: "SN-003", eventId: "EVT-001", type: "update", typeLabel: "Event Update",
    channels: ["Email", "WhatsApp", "In-App"], scheduledAt: "2026-08-15T10:00",
    repeat: "none", repeatLabel: "One-time", recipients: 342, status: "sent",
  },
  {
    id: "SN-004", eventId: "EVT-002", type: "reminder", typeLabel: "Event Reminder",
    channels: ["Email"], scheduledAt: "2026-09-14T08:00",
    repeat: "daily", repeatLabel: "Daily until event", recipients: 87, status: "scheduled",
  },
];

const SCHEDULE_STATUS_CONFIG: Record<ScheduleStatus, { label: string; bg: string; text: string; dot: string }> = {
  scheduled: { label: "Scheduled", bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500"    },
  sent:      { label: "Sent",      bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  paused:    { label: "Paused",    bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500"   },
  failed:    { label: "Failed",    bg: "bg-rose-50",    text: "text-rose-600",    dot: "bg-rose-400"    },
};

/* ─── Quick Schedule Presets ─── */
function getPresetDateTime(preset: string, eventStartDate: string): { date: string; time: string } {
  const eventDate = new Date(eventStartDate);
  const now = new Date();
  switch (preset) {
    case "1h": {
      const d = new Date(now.getTime() + 60 * 60 * 1000);
      return { date: d.toISOString().slice(0, 10), time: d.toTimeString().slice(0, 5) };
    }
    case "tomorrow_9am": {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      return { date: d.toISOString().slice(0, 10), time: "09:00" };
    }
    case "1day_before": {
      const d = new Date(eventDate);
      d.setDate(d.getDate() - 1);
      return { date: d.toISOString().slice(0, 10), time: "09:00" };
    }
    case "3days_before": {
      const d = new Date(eventDate);
      d.setDate(d.getDate() - 3);
      return { date: d.toISOString().slice(0, 10), time: "10:00" };
    }
    case "1week_before": {
      const d = new Date(eventDate);
      d.setDate(d.getDate() - 7);
      return { date: d.toISOString().slice(0, 10), time: "10:00" };
    }
    default:
      return { date: now.toISOString().slice(0, 10), time: now.toTimeString().slice(0, 5) };
  }
}

/* ─── Notification Dialog ─── */
function NotificationDialog({ event, onClose }: { event: EventItem; onClose: () => void }) {
  const { useMock } = useEventMock();
  const [channels, setChannels] = useState({ email: true, sms: false, whatsapp: false, push: false, inApp: false });
  const [notificationType, setNotificationType] = useState<"reminder" | "update" | "custom">("reminder");
  const [customMessage, setCustomMessage] = useState("");
  const [sendToAll, setSendToAll] = useState(true);
  const [sendMode, setSendMode] = useState<SendMode>("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("none");
  const [customRepeatDays, setCustomRepeatDays] = useState(2);
  const [showHistory, setShowHistory] = useState(false);
  const [scheduledList, setScheduledList] = useState<ScheduledNotification[]>(
    MOCK_SCHEDULED.filter(s => s.eventId === event.id)
  );
  const [confirmSent, setConfirmSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = useCallback(async () => {
    if (useMock) return;
    setLoadingHistory(true);
    try {
      const eventId = typeof event.id === "string" ? parseInt(event.id.replace(/\D/g, ""), 10) : Number(event.id);
      const page = await eventNotificationService.list(eventId);
      setScheduledList(page.content.map(r => ({
        id: String(r.id),
        eventId: String(r.eventId),
        type: r.type,
        typeLabel: r.typeLabel,
        channels: r.channels as string[],
        scheduledAt: r.scheduledAt,
        repeat: r.repeat as RepeatMode,
        repeatLabel: r.repeatLabel,
        recipients: r.recipients,
        status: r.status as ScheduleStatus,
        message: r.message ?? undefined,
      })));
    } catch {
      // keep mock data on failure
    } finally {
      setLoadingHistory(false);
    }
  }, [useMock, event.id]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const NOTIFICATION_TYPES = [
    {
      id: "reminder" as const, label: "Event Reminder", icon: BellRing, color: "text-amber-500",
      description: "Remind registered attendees about the upcoming event",
      preview: `Reminder: ${event.title} is happening on ${new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}. Don't forget to attend!`,
    },
    {
      id: "update" as const, label: "Event Update", icon: Megaphone, color: "text-blue-500",
      description: "Notify attendees about event changes (venue, time, etc.)",
      preview: `Update: There has been an update to ${event.title}. Please check the event page for the latest details.`,
    },
    {
      id: "custom" as const, label: "Custom Message", icon: MessageSquare, color: "text-violet-500",
      description: "Send a custom notification to attendees",
      preview: "",
    },
  ];

  const CHANNELS = [
    { key: "email" as const, label: "Email", icon: Mail, desc: "Send to registered email addresses" },
    { key: "sms" as const, label: "SMS", icon: MessageSquare, desc: "Send text messages" },
    { key: "whatsapp" as const, label: "WhatsApp", icon: Send, desc: "Send via WhatsApp" },
    { key: "push" as const, label: "Push Notification", icon: Bell, desc: "App push notification" },
    { key: "inApp" as const, label: "In-App", icon: BellRing, desc: "Show in notification center" },
  ];

  const QUICK_PRESETS = [
    { id: "1h", label: "In 1 Hour", icon: Timer },
    { id: "tomorrow_9am", label: "Tomorrow 9 AM", icon: Clock },
    { id: "1day_before", label: "1 Day Before Event", icon: CalendarClock },
    { id: "3days_before", label: "3 Days Before", icon: CalendarClock },
    { id: "1week_before", label: "1 Week Before", icon: CalendarClock },
  ];

  const REPEAT_OPTIONS: { id: RepeatMode; label: string; desc: string; icon: any }[] = [
    { id: "none", label: "One-time", desc: "Send only once", icon: Zap },
    { id: "daily", label: "Daily", desc: "Repeat every day until event", icon: Repeat },
    { id: "weekly", label: "Weekly", desc: "Repeat every week until event", icon: RotateCcw },
    { id: "custom", label: "Custom", desc: "Set custom interval", icon: CalendarClock },
  ];

  const activeChannels = Object.entries(channels).filter(([, v]) => v).length;
  const selectedType = NOTIFICATION_TYPES.find(t => t.id === notificationType)!;

  const formatSchedule = () => {
    if (sendMode === "now") return "Immediately";
    if (!scheduleDate || !scheduleTime) return "Not set";
    const d = new Date(`${scheduleDate}T${scheduleTime}`);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) + " at " +
      d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const repeatLabel = () => {
    if (repeatMode === "none") return "One-time";
    if (repeatMode === "daily") return "Daily until event";
    if (repeatMode === "weekly") return "Weekly until event";
    return `Every ${customRepeatDays} days`;
  };

  const handleApplyPreset = (presetId: string) => {
    const { date, time } = getPresetDateTime(presetId, event.startDate);
    setScheduleDate(date);
    setScheduleTime(time);
  };

  const handleSend = async () => {
    setError(null);
    setSending(true);
    const activeChKeys = CHANNELS.filter(ch => channels[ch.key]).map(ch => ch.key) as ChannelKey[];
    const activeChNames = CHANNELS.filter(ch => channels[ch.key]).map(ch => ch.label);

    if (!useMock) {
      try {
        const eventId = typeof event.id === "string" ? parseInt(event.id.replace(/\D/g, ""), 10) : Number(event.id);
        const request: ScheduleNotificationRequest = {
          eventId,
          type: notificationType,
          channels: activeChKeys,
          sendNow: sendMode === "now",
          scheduledAt: sendMode === "scheduled" ? `${scheduleDate}T${scheduleTime}:00` : undefined,
          repeat: sendMode === "now" ? "none" : repeatMode,
          customRepeatDays: repeatMode === "custom" ? customRepeatDays : undefined,
          sendToAll,
          customMessage: notificationType === "custom" ? customMessage : undefined,
        };
        const result = await eventNotificationService.schedule(eventId, request);
        setScheduledList(prev => [{
          id: String(result.id),
          eventId: String(result.eventId),
          type: result.type,
          typeLabel: result.typeLabel,
          channels: result.channels as string[],
          scheduledAt: result.scheduledAt,
          repeat: result.repeat as RepeatMode,
          repeatLabel: result.repeatLabel,
          recipients: result.recipients,
          status: result.status as ScheduleStatus,
          message: result.message ?? undefined,
        }, ...prev]);
        setConfirmSent(true);
        setTimeout(() => setConfirmSent(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send notification");
      } finally {
        setSending(false);
      }
      return;
    }

    const newEntry: ScheduledNotification = {
      id: `SN-${Date.now()}`,
      eventId: event.id,
      type: notificationType,
      typeLabel: selectedType.label,
      channels: activeChNames,
      scheduledAt: sendMode === "now"
        ? new Date().toISOString().slice(0, 16)
        : `${scheduleDate}T${scheduleTime}`,
      repeat: sendMode === "now" ? "none" : repeatMode,
      repeatLabel: sendMode === "now" ? "One-time" : repeatLabel(),
      recipients: event.registrations,
      status: sendMode === "now" ? "sent" : "scheduled",
      message: notificationType === "custom" ? customMessage : undefined,
    };
    setScheduledList(prev => [newEntry, ...prev]);
    setConfirmSent(true);
    setSending(false);
    setTimeout(() => setConfirmSent(false), 3000);
  };

  const handlePauseResume = async (id: string) => {
    const item = scheduledList.find(s => s.id === id);
    if (!item) return;

    if (!useMock) {
      try {
        const eventId = typeof event.id === "string" ? parseInt(event.id.replace(/\D/g, ""), 10) : Number(event.id);
        const nId = parseInt(id, 10);
        if (item.status === "paused") {
          await eventNotificationService.resume(eventId, nId);
        } else {
          await eventNotificationService.pause(eventId, nId);
        }
      } catch {
        // fall through to local update
      }
    }
    setScheduledList(prev => prev.map(s =>
      s.id === id ? { ...s, status: s.status === "paused" ? "scheduled" : "paused" } as ScheduledNotification : s
    ));
  };

  const handleDeleteScheduled = async (id: string) => {
    if (!useMock) {
      try {
        const eventId = typeof event.id === "string" ? parseInt(event.id.replace(/\D/g, ""), 10) : Number(event.id);
        await eventNotificationService.cancel(eventId, parseInt(id, 10));
      } catch {
        // fall through to local update
      }
    }
    setScheduledList(prev => prev.filter(s => s.id !== id));
  };

  const canSend = sendMode === "now"
    || (sendMode === "scheduled" && scheduleDate && scheduleTime);
  const canSendFinal = canSend && activeChannels > 0
    && (notificationType !== "custom" || customMessage.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-500 px-6 py-4 rounded-t-2xl flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5" /> Notification Scheduler
            </h3>
            <p className="text-indigo-100 text-sm">{event.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowHistory(!showHistory)}
              className={cn("p-2 rounded-lg transition-all",
                showHistory ? "bg-white/20 text-white" : "text-indigo-200 hover:text-white hover:bg-white/10"
              )}>
              <History className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="text-indigo-200 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {confirmSent && (
          <div className="mx-6 mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2 text-sm text-emerald-700 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            {sendMode === "now" ? "Notification sent successfully!" : "Notification scheduled successfully!"}
          </div>
        )}
        {error && (
          <div className="mx-6 mt-3 bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-center gap-2 text-sm text-rose-700 shrink-0">
            <AlertCircle className="w-4 h-4" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {showHistory ? (
            /* ─── Scheduled History Panel ─── */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-500" /> Scheduled & Sent Notifications
                </h4>
                <Badge variant="outline" className="text-[10px]">{scheduledList.length} total</Badge>
              </div>

              {loadingHistory ? (
                <div className="bg-slate-50 rounded-xl p-8 text-center">
                  <Loader2 className="w-8 h-8 text-indigo-300 mx-auto mb-2 animate-spin" />
                  <p className="text-sm text-slate-500">Loading notification history...</p>
                </div>
              ) : scheduledList.length === 0 ? (
                <div className="bg-slate-50 rounded-xl p-8 text-center">
                  <CalendarClock className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No notifications scheduled yet</p>
                  <p className="text-[10px] text-slate-400 mt-1">Schedule one using the form</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {scheduledList.map(sn => {
                    const sc = SCHEDULE_STATUS_CONFIG[sn.status];
                    const dt = new Date(sn.scheduledAt);
                    return (
                      <div key={sn.id} className="bg-white rounded-xl border border-slate-100 p-3 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs font-semibold text-slate-700">{sn.typeLabel}</span>
                              <Badge className={cn("gap-1 text-[9px]", sc.bg, sc.text)}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                                {sc.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                <CalendarClock className="w-3 h-3" />
                                {dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                {" at "}
                                {dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Repeat className="w-3 h-3" /> {sn.repeatLabel}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" /> {sn.recipients}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              {sn.channels.map(ch => (
                                <Badge key={ch} variant="outline" className="text-[8px] py-0">{ch}</Badge>
                              ))}
                            </div>
                          </div>
                          {sn.status === "scheduled" || sn.status === "paused" ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => handlePauseResume(sn.id)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-amber-500 transition-colors"
                                title={sn.status === "paused" ? "Resume" : "Pause"}>
                                {sn.status === "paused" ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => handleDeleteScheduled(sn.id)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
                                title="Cancel notification">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[9px] text-slate-400 shrink-0 mt-1">{sn.id}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Button variant="outline" className="w-full gap-2 text-sm" onClick={() => setShowHistory(false)}>
                <Plus className="w-4 h-4" /> Schedule New Notification
              </Button>
            </div>
          ) : (
            /* ─── Create / Send Form ─── */
            <>
              {/* Send Mode Toggle */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700">When to Send</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setSendMode("now")}
                    className={cn("p-3 rounded-xl border-2 transition-all text-left",
                      sendMode === "now"
                        ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-200"
                        : "border-slate-200 hover:border-emerald-200"
                    )}>
                    <div className="flex items-center gap-2">
                      <Zap className={cn("w-4 h-4", sendMode === "now" ? "text-emerald-500" : "text-slate-400")} />
                      <span className={cn("text-sm font-semibold", sendMode === "now" ? "text-emerald-700" : "text-slate-600")}>
                        Send Now
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 ml-6">Deliver immediately</p>
                  </button>
                  <button onClick={() => setSendMode("scheduled")}
                    className={cn("p-3 rounded-xl border-2 transition-all text-left",
                      sendMode === "scheduled"
                        ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200"
                        : "border-slate-200 hover:border-indigo-200"
                    )}>
                    <div className="flex items-center gap-2">
                      <CalendarClock className={cn("w-4 h-4", sendMode === "scheduled" ? "text-indigo-500" : "text-slate-400")} />
                      <span className={cn("text-sm font-semibold", sendMode === "scheduled" ? "text-indigo-700" : "text-slate-600")}>
                        Schedule
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 ml-6">Pick date & time</p>
                  </button>
                </div>
              </div>

              {/* Schedule Date/Time Picker */}
              {sendMode === "scheduled" && (
                <div className="space-y-3 bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                  {/* Quick Presets */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-indigo-600 uppercase">Quick Presets</p>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_PRESETS.map(p => (
                        <button key={p.id} onClick={() => handleApplyPreset(p.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-white rounded-lg border border-indigo-100 text-[10px] font-medium text-indigo-700 hover:bg-indigo-100 hover:border-indigo-200 transition-all shadow-sm">
                          <p.icon className="w-3 h-3" /> {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold text-slate-600">Date</Label>
                      <Input type="date" className="text-xs h-9 bg-white"
                        value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                        min={new Date().toISOString().slice(0, 10)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold text-slate-600">Time</Label>
                      <Input type="time" className="text-xs h-9 bg-white"
                        value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
                    </div>
                  </div>

                  {/* Repeat */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-slate-600 uppercase">Repeat</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {REPEAT_OPTIONS.map(r => (
                        <button key={r.id} onClick={() => setRepeatMode(r.id)}
                          className={cn("p-2 rounded-lg border-2 transition-all text-center",
                            repeatMode === r.id
                              ? "border-indigo-400 bg-white ring-1 ring-indigo-200"
                              : "border-transparent bg-white/50 hover:bg-white"
                          )}>
                          <r.icon className={cn("w-3.5 h-3.5 mx-auto mb-0.5",
                            repeatMode === r.id ? "text-indigo-500" : "text-slate-400"
                          )} />
                          <p className={cn("text-[10px] font-semibold",
                            repeatMode === r.id ? "text-indigo-700" : "text-slate-600"
                          )}>{r.label}</p>
                          <p className="text-[8px] text-slate-400">{r.desc}</p>
                        </button>
                      ))}
                    </div>
                    {repeatMode === "custom" && (
                      <div className="flex items-center gap-2 bg-white rounded-lg p-2 border border-indigo-100">
                        <Label className="text-[10px] text-slate-600 whitespace-nowrap">Every</Label>
                        <Input type="number" className="text-xs h-7 w-16 text-center"
                          min={1} max={30} value={customRepeatDays}
                          onChange={e => setCustomRepeatDays(Number(e.target.value))} />
                        <Label className="text-[10px] text-slate-600 whitespace-nowrap">days until event</Label>
                      </div>
                    )}
                  </div>

                  {/* Schedule Preview */}
                  {scheduleDate && scheduleTime && (
                    <div className="bg-white rounded-lg p-2.5 flex items-center gap-2 text-xs border border-indigo-100">
                      <CalendarClock className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-700">{formatSchedule()}</span>
                        {repeatMode !== "none" && (
                          <span className="text-slate-400"> &middot; {repeatLabel()}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notification Type */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700">Notification Type</h4>
                <div className="space-y-2">
                  {NOTIFICATION_TYPES.map(t => (
                    <button key={t.id} onClick={() => setNotificationType(t.id)}
                      className={cn("w-full text-left p-3 rounded-xl border-2 transition-all",
                        notificationType === t.id
                          ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200"
                          : "border-slate-200 hover:border-indigo-200"
                      )}>
                      <div className="flex items-center gap-2">
                        <t.icon className={cn("w-4 h-4", t.color)} />
                        <span className={cn("text-sm font-semibold", notificationType === t.id ? "text-indigo-700" : "text-slate-700")}>
                          {t.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 ml-6">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Message */}
              {notificationType === "custom" ? (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Your Message</Label>
                  <Textarea
                    className="text-sm min-h-[80px]"
                    placeholder="Type your custom notification message..."
                    value={customMessage}
                    onChange={e => setCustomMessage(e.target.value)}
                  />
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-3 space-y-1">
                  <p className="text-[10px] font-medium text-slate-500 uppercase">Preview</p>
                  <p className="text-sm text-slate-700">{selectedType.preview}</p>
                </div>
              )}

              {/* Audience */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700">Audience</h4>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                  <div>
                    <p className="text-xs font-medium text-slate-700">Send to all registered attendees</p>
                    <p className="text-[10px] text-slate-400">{event.registrations} registrants will receive this</p>
                  </div>
                  <Switch checked={sendToAll} onCheckedChange={setSendToAll} />
                </div>
                {!sendToAll && (
                  <div className="bg-amber-50 rounded-lg p-2.5 flex items-center gap-2 text-[10px] text-amber-600">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Selective sending is available when backend is connected
                  </div>
                )}
              </div>

              {/* Channels */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700">Channels</h4>
                  <Badge variant="outline" className="text-[9px]">{activeChannels} selected</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CHANNELS.map(ch => (
                    <div key={ch.key} className={cn("flex items-center justify-between p-2.5 rounded-lg border-2 transition-all",
                      channels[ch.key] ? "border-indigo-300 bg-indigo-50" : "border-slate-200")}>
                      <div className="flex items-center gap-2">
                        <ch.icon className={cn("w-3.5 h-3.5", channels[ch.key] ? "text-indigo-600" : "text-slate-400")} />
                        <div>
                          <p className="text-xs font-medium text-slate-700">{ch.label}</p>
                          <p className="text-[9px] text-slate-400">{ch.desc}</p>
                        </div>
                      </div>
                      <Switch checked={channels[ch.key]}
                        onCheckedChange={v => setChannels({ ...channels, [ch.key]: v })} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-semibold text-indigo-700">Notification Summary</h4>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-indigo-700">{event.registrations}</p>
                    <p className="text-[9px] text-indigo-400">Recipients</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-violet-700">{activeChannels}</p>
                    <p className="text-[9px] text-violet-400">Channels</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700 leading-tight mt-0.5">
                      {sendMode === "now" ? "Now" : (scheduleDate ? new Date(scheduleDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—")}
                    </p>
                    <p className="text-[9px] text-slate-400">
                      {sendMode === "now" ? "Send Time" : (scheduleTime || "Set time")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-600 leading-tight mt-0.5">
                      {sendMode === "now" ? "—" : (repeatMode === "none" ? "Once" : repeatMode === "custom" ? `${customRepeatDays}d` : repeatMode.charAt(0).toUpperCase() + repeatMode.slice(1))}
                    </p>
                    <p className="text-[9px] text-amber-400">Repeat</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!showHistory && (
          <div className="border-t border-slate-100 px-6 py-4 flex gap-2 shrink-0">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            {scheduledList.length > 0 && (
              <Button variant="outline" className="gap-1 text-xs" onClick={() => setShowHistory(true)}>
                <History className="w-3.5 h-3.5" /> {scheduledList.length}
              </Button>
            )}
            <Button
              className={cn("flex-1 gap-2",
                sendMode === "now"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600"
                  : "bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600"
              )}
              disabled={!canSendFinal || sending}
              onClick={handleSend}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : sendMode === "now" ? <Send className="w-4 h-4" /> : <CalendarClock className="w-4 h-4" />}
              {sending ? "Sending..." : sendMode === "now" ? "Send Now" : "Schedule Notification"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Delete Confirmation ─── */
function DeleteConfirmDialog({ event, onClose, onConfirm }: {
  event: EventItem; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-3">
            <Trash2 className="w-6 h-6 text-rose-500" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Delete Event?</h3>
          <p className="text-sm text-slate-500 mt-1">
            Are you sure you want to delete <span className="font-semibold text-slate-700">"{event.title}"</span>?
            This action cannot be undone.
          </p>
          {event.registrations > 0 && (
            <div className="bg-amber-50 rounded-lg p-2.5 mt-3 flex items-center gap-2 text-xs text-amber-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              This event has {event.registrations} registrations. All registrations will also be removed.
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-rose-600 hover:bg-rose-700 gap-1" onClick={onConfirm}>
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Event Card ─── */
function EventCard({ event, onEdit, onDelete, onNotify, onPreview }: {
  event: EventItem;
  onEdit: () => void;
  onDelete: () => void;
  onNotify: () => void;
  onPreview: () => void;
}) {
  const s = STATUS_CONFIG[event.status];
  const vis = VISIBILITY_ICON[event.visibility];
  const typeColor = TYPE_COLORS[event.type] ?? "#64748b";
  const [menuOpen, setMenuOpen] = useState(false);
  const capacityPct = Math.round((event.registrations / event.capacity) * 100);
  const isMultiDay = event.startDate !== event.endDate;

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? "PM" : "AM"}`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all">
      {/* Color strip */}
      <div className="h-1.5 rounded-t-xl" style={{ backgroundColor: typeColor }} />

      <div className="p-4 sm:p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge className={cn("gap-1 text-[10px]", s.bg, s.text)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
                {s.label}
              </Badge>
              <Badge variant="outline" className="gap-1 text-[10px]" style={{ color: typeColor, borderColor: typeColor + "40" }}>
                {event.type}
              </Badge>
              <div className="flex items-center gap-0.5 text-[10px] text-slate-400">
                <vis.icon className="w-3 h-3" /> {vis.label}
              </div>
            </div>
            <h4 className="font-semibold text-slate-800 text-sm sm:text-base line-clamp-1">{event.title}</h4>
          </div>

          <div className="relative">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setMenuOpen(!menuOpen)}>
              <MoreVertical className="w-4 h-4 text-slate-400" />
            </Button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-9 z-20 bg-white rounded-lg shadow-lg border border-slate-100 py-1 w-48">
                  <button onClick={() => { onPreview(); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </button>
                  <button onClick={() => { onEdit(); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <Pencil className="w-3.5 h-3.5" /> Edit Event
                  </button>
                  <button onClick={() => { onNotify(); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5" /> Send Notification
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <Copy className="w-3.5 h-3.5" /> Duplicate Event
                  </button>
                  {event.status !== "completed" && (
                    <button className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5" /> Registration Link
                    </button>
                  )}
                  <hr className="my-1 border-slate-100" />
                  <button onClick={() => { onDelete(); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5" /> Delete Event
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Date & Venue */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              {formatDate(event.startDate)}
              {isMultiDay && ` — ${formatDate(event.endDate)}`}
            </span>
            <span className="text-slate-300">|</span>
            <span>{formatTime(event.startTime)} – {formatTime(event.endTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{event.venue}, {event.city}</span>
          </div>
        </div>

        {/* Registration Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Ticket className="w-3.5 h-3.5 text-violet-400" />
            <span className="font-semibold">{event.registrations}</span>
            <span className="text-slate-400">/ {event.capacity}</span>
          </div>
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all",
                capacityPct >= 90 ? "bg-rose-500" : capacityPct >= 70 ? "bg-amber-500" : "bg-emerald-500"
              )}
              style={{ width: `${Math.min(capacityPct, 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400">{capacityPct}%</span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="border-t border-slate-100 px-4 sm:px-5 py-2.5 flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-slate-500 hover:text-indigo-600" onClick={onEdit}>
          <Pencil className="w-3 h-3" /> Edit
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-slate-500 hover:text-rose-500" onClick={onDelete}>
          <Trash2 className="w-3 h-3" /> Delete
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-slate-500 hover:text-amber-600" onClick={onNotify}>
          <Bell className="w-3 h-3" /> Notify
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-slate-500 hover:text-indigo-600" onClick={onPreview}>
          Details <ChevronRight className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Events List Sub-tab ─── */
function EventsList() {
  const { useMock } = useEventMock();
  const [events, setEvents] = useState<EventItem[]>(MOCK_EVENTS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<EventStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "registrations">("date");
  const [notifyEvent, setNotifyEvent] = useState<EventItem | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    if (useMock) {
      setEvents(MOCK_EVENTS);
      return;
    }
    async function loadLive() {
      setLoading(true);
      try {
        const res = await eventService.getAllEvents();
        if (res && res.length > 0) {
          const mapped: EventItem[] = res.map(e => ({
            id: String(e.id),
            title: e.title,
            type: e.type ? e.type.charAt(0).toUpperCase() + e.type.slice(1) : "General",
            category: e.category || "Community",
            startDate: e.startDate || new Date().toISOString().split("T")[0],
            endDate: e.endDate || e.startDate || new Date().toISOString().split("T")[0],
            startTime: e.startTime || "09:00",
            endTime: e.endTime || "17:00",
            venue: e.venue || e.location || "Community Center",
            city: e.city || "Local",
            status: e.startDate && new Date(e.startDate) > new Date() ? "upcoming" : "completed",
            visibility: (e.visibility?.toLowerCase() as any) || "community",
            registrations: e.attendees || 0,
            capacity: e.maxAttendees || 100,
            coverImage: e.imageUrl || "",
            createdAt: e.createdAt || new Date().toISOString(),
          }));
          setEvents(mapped);
        } else {
          setEvents([]);
        }
      } catch (err) {
        console.error("Failed to load live events for schedule", err);
      } finally {
        setLoading(false);
      }
    }
    loadLive();
  }, [useMock]);

  const filtered = events
    .filter(e => filterTab === "all" || e.status === filterTab)
    .filter(e => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return e.title.toLowerCase().includes(q) || e.type.toLowerCase().includes(q) || e.id.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.title.localeCompare(b.title);
      if (sortBy === "registrations") return b.registrations - a.registrations;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

  const stats = {
    total: events.length,
    upcoming: events.filter(e => e.status === "upcoming").length,
    totalRegs: events.reduce((s, e) => s + e.registrations, 0),
    drafts: events.filter(e => e.status === "draft").length,
  };

  const handleDelete = () => {
    if (!deleteEvent) return;
    setEvents(prev => prev.filter(e => e.id !== deleteEvent.id));
    setDeleteEvent(null);
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: stats.total, icon: CalendarDays, color: "bg-indigo-500", sub: `${stats.upcoming} upcoming` },
          { label: "Upcoming", value: stats.upcoming, icon: Clock, color: "bg-blue-500" },
          { label: "Total Registrations", value: stats.totalRegs.toLocaleString(), icon: Ticket, color: "bg-violet-500" },
          { label: "Drafts", value: stats.drafts, icon: AlertCircle, color: "bg-amber-500", sub: "awaiting publish" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-3 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", s.color)}>
                <s.icon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[10px] text-slate-400">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{s.value}</p>
            {s.sub && <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-1 p-0.5 bg-white rounded-lg border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-x-auto hide-scrollbar flex-1 sm:flex-none">
          {FILTER_TABS.map(t => {
            const count = t.id === "all" ? events.length : events.filter(e => e.status === t.id).length;
            return (
              <button key={t.id} onClick={() => setFilterTab(t.id)}
                className={cn(
                  "flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap",
                  filterTab === t.id
                    ? "bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-sm"
                    : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                )}>
                {t.label}
                <span className={cn("text-[9px] px-1 py-0.5 rounded-full",
                  filterTab === t.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                )}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input className="pl-8 h-8 text-xs" placeholder="Search events..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs"
            onClick={() => setSortBy(s => s === "date" ? "registrations" : s === "registrations" ? "name" : "date")}>
            <ArrowUpDown className="w-3 h-3" />
            {sortBy === "date" ? "Date" : sortBy === "registrations" ? "Registrations" : "Name"}
          </Button>
        </div>
      </div>

      {/* Events Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-10 text-center">
          <CalendarDays className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-600 mb-1">
            {search.trim() ? "No events found" : "No events yet"}
          </h3>
          <p className="text-sm text-slate-400">
            {search.trim() ? "Try a different search term" : "Create your first event using the 'Create Event' button"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={() => {}}
              onDelete={() => setDeleteEvent(event)}
              onNotify={() => setNotifyEvent(event)}
              onPreview={() => {}}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      {notifyEvent && (
        <NotificationDialog event={notifyEvent} onClose={() => setNotifyEvent(null)} />
      )}
      {deleteEvent && (
        <DeleteConfirmDialog event={deleteEvent} onClose={() => setDeleteEvent(null)} onConfirm={handleDelete} />
      )}
    </div>
  );
}

/* ─── Main Component ─── */
const TABS = [
  { id: "events",   label: "Events",          icon: CalendarDays  },
  { id: "planning", label: "Planning & Tasks", icon: ClipboardList },
  { id: "programs", label: "Day Programs",     icon: Mic2          },
] as const;

export function EventsSchedule() {
  const [tab, setTab] = useState<string>("events");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-white rounded-lg sm:rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-x-auto hide-scrollbar">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-sm font-semibold transition-all whitespace-nowrap flex-1 sm:flex-none justify-center ${
              tab === t.id
                ? "bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-sm"
                : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
            }`}>
            <t.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" /> {t.label}
          </button>
        ))}
      </div>
      {tab === "events" && <EventsList />}
      {tab === "planning" && <EventsPlanning />}
      {tab === "programs" && <EventsPrograms />}
    </div>
  );
}
