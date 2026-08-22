import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
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
  CalendarClock, Repeat, Timer, History, Zap, RotateCcw, Pause, Play, X, ShieldCheck, Smartphone,
  Flame, Music, Trophy, UtensilsCrossed, Phone, CreditCard, QrCode, IndianRupee, Share2, Check, FileText, Sparkles, Info
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { cn } from "../ui/utils";
import { useAuth } from "../../../contexts/AuthContext";
import { CREATE_EVENT, MANAGE_EVENT_DASHBOARD } from "../../../constants/permissions";
import { EventsPlanning } from "./EventsPlanning";
import { EventsPrograms } from "./EventsPrograms";
import { EventsFood } from "./EventsFood";
import { OrganizerDashboard } from "./OrganizerDashboard";
import { EventDashboardWrapper } from "./EventDashboardWrapper";
import { CompetitionsSection } from "./EventSubCreatorForms";
import { EventsPoojaSeva } from "./EventsPoojaSeva";
import { EventsLunchDinner } from "./EventsLunchDinner";
import { EventsCulturalEvents } from "./EventsCulturalEvents";
import { EditEventDialog } from "./EventsCreate";

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

const STATUS_CONFIG: Record<string, { label: string; icon: any; bg: string; text: string; dot: string }> = {
  upcoming:  { label: "Upcoming",  icon: Clock,        bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500"    },
  ongoing:   { label: "Ongoing",   icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  completed: { label: "Completed", icon: CheckCircle2, bg: "bg-slate-100",  text: "text-slate-600",   dot: "bg-slate-400"   },
  draft:     { label: "Draft",     icon: Clock,        bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500"   },
  cancelled: { label: "Cancelled", icon: XCircle,      bg: "bg-rose-50",    text: "text-rose-600",    dot: "bg-rose-400"    },
  published: { label: "Published", icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  active:    { label: "Active",    icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  live:      { label: "Live",      icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
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
                    const sc = SCHEDULE_STATUS_CONFIG[sn.status?.toLowerCase() as ScheduleStatus] ||
                      SCHEDULE_STATUS_CONFIG[sn.status] || {
                        label: sn.status || "Scheduled",
                        bg: "bg-slate-100",
                        text: "text-slate-600",
                        dot: "bg-slate-400",
                      };
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
  const hasRegs = (event.registrations || 0) > 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 space-y-4 animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-3">
            <Trash2 className="w-6 h-6 text-rose-500" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">
            {hasRegs ? "Cancel & Close Event?" : "Delete Event?"}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Are you sure you want to {hasRegs ? "cancel" : "delete"} <span className="font-semibold text-slate-700">"{event.title}"</span>?
          </p>
          {hasRegs && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3 text-left space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{event.registrations} Active Registration(s)</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Because attendees have already registered for this event or its sub-events, deleting it will automatically transition the event and all linked sub-activities to <strong>Cancelled</strong> status, preserving registration records and notifying registered members.
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1 cursor-pointer" onClick={onClose}>Keep Event</Button>
          <Button className="flex-1 bg-rose-600 hover:bg-rose-700 gap-1.5 font-bold cursor-pointer" onClick={onConfirm}>
            <Trash2 className="w-4 h-4" /> {hasRegs ? "Cancel Event" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Event Details Dialog ─── */
function EventDetailsDialog({
  event,
  onClose,
  onEdit,
  onNotify,
}: {
  event: EventItem;
  onClose: () => void;
  onEdit?: () => void;
  onNotify?: () => void;
}) {
  const { user, hasPermission, isAdmin, isSuperAdmin } = useAuth();
  const [fullEvent, setFullEvent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const userRolesUpper = (user?.roles || []).map((r: any) => String(r?.name || r).toUpperCase());
  const isEventsAdmin =
    isAdmin ||
    isSuperAdmin ||
    userRolesUpper.includes("ADMIN") ||
    userRolesUpper.includes("COMMUNITY_ADMIN") ||
    userRolesUpper.includes("EVENT_ADMIN") ||
    userRolesUpper.includes("EVENTS_ADMIN") ||
    hasPermission(CREATE_EVENT) ||
    hasPermission(MANAGE_EVENT_DASHBOARD);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const rawId = event.id;
    const numId = typeof rawId === "string" ? parseInt(rawId.replace(/\D/g, ""), 10) : Number(rawId);
    if (!isNaN(numId) && numId > 0) {
      setLoading(true);
      eventService
        .getById(numId)
        .then((res) => {
          if (res) setFullEvent(res);
        })
        .catch((err) => {
          console.warn("Could not fetch full event details:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [event.id]);

  const activeData = fullEvent || event;
  const s = STATUS_CONFIG[activeData.status?.toLowerCase()] || STATUS_CONFIG.upcoming;
  const vis = VISIBILITY_ICON[activeData.visibility?.toLowerCase()] || VISIBILITY_ICON.community;
  const typeColor = TYPE_COLORS[activeData.type] ?? "#4f46e5";

  const formatDate = (d: string) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatTime = (t: string) => {
    if (!t) return "";
    const clean = t.includes("T") ? t.split("T")[1] : t;
    const [h, m] = clean.split(":");
    const hr = parseInt(h);
    if (isNaN(hr)) return t;
    return `${hr > 12 ? hr - 12 : hr === 0 ? 12 : hr}:${m || "00"} ${hr >= 12 ? "PM" : "AM"}`;
  };

  const isMultiDay = activeData.startDate && activeData.endDate && activeData.startDate !== activeData.endDate;
  const capacity = activeData.capacity || activeData.maxAttendees || 100;
  const registrations = activeData.attendees || activeData.registrations || 0;
  const capacityPct = Math.round((registrations / (capacity || 1)) * 100);

  // Parse ticket categories
  let ticketTypes: any[] = [];
  if (Array.isArray(activeData.ticketTypes) && activeData.ticketTypes.length > 0) {
    ticketTypes = activeData.ticketTypes;
  } else if (activeData.ticketTypesJson) {
    try {
      const parsed = typeof activeData.ticketTypesJson === "string" ? JSON.parse(activeData.ticketTypesJson) : activeData.ticketTypesJson;
      if (Array.isArray(parsed) && parsed.length > 0) ticketTypes = parsed;
    } catch {}
  }

  // Parse contacts
  let contacts: any[] = [];
  if (activeData.contactsJson) {
    try {
      const parsed = typeof activeData.contactsJson === "string" ? JSON.parse(activeData.contactsJson) : activeData.contactsJson;
      if (Array.isArray(parsed) && parsed.length > 0) contacts = parsed;
    } catch {}
  }
  if (contacts.length === 0 && Array.isArray(activeData.contactDetails) && activeData.contactDetails.length > 0) {
    contacts = activeData.contactDetails;
  }
  if (contacts.length === 0 && Array.isArray(activeData.contacts) && activeData.contacts.length > 0) {
    contacts = activeData.contacts;
  }
  if (contacts.length === 0 && (activeData.organizerName || activeData.organizerContact)) {
    contacts = [
      {
        name: activeData.organizerName,
        phone: activeData.organizerContact,
        role: "Event Organizer",
      },
    ];
  }

  const paymentModes = activeData.paymentModes
    ? typeof activeData.paymentModes === "string"
      ? activeData.paymentModes.split(",").map((s: string) => s.trim()).filter(Boolean)
      : Array.isArray(activeData.paymentModes)
      ? activeData.paymentModes
      : ["UPI", "Card", "Cash"]
    : ["UPI", "Card", "Cash"];

  const handleCopyLink = () => {
    const url = `${window.location.origin}/events?id=${event.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyUpi = () => {
    if (activeData.upiId) {
      navigator.clipboard.writeText(activeData.upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200/80 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Banner / Cover */}
        <div className="relative h-44 sm:h-52 bg-slate-900 overflow-hidden shrink-0">
          {activeData.coverImage || activeData.imageUrl ? (
            <img
              src={activeData.coverImage || activeData.imageUrl}
              alt={activeData.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-950 p-6"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 30%, ${typeColor}60 0%, transparent 70%)`,
              }}
            >
              <Sparkles className="w-16 h-16 text-white/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Top Actions */}
          <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <Badge className={cn("gap-1 text-[10px] shadow-sm font-bold", s.bg, s.text)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
                {s.label}
              </Badge>
              <Badge
                variant="outline"
                className="gap-1 text-[10px] bg-black/30 backdrop-blur-md text-white border-white/20 font-bold"
              >
                {activeData.type}
              </Badge>
              <div className="flex items-center gap-1 text-[10px] text-white/80 bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/20 font-medium">
                <vis.icon className="w-3 h-3" /> {vis.label}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all cursor-pointer shadow-sm"
                title="Copy shareable event link"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all cursor-pointer shadow-sm"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Title & Subtitle in Hero */}
          <div className="absolute bottom-3.5 inset-x-4 text-white z-10">
            <h2 className="text-lg sm:text-2xl font-black drop-shadow-md line-clamp-1">{activeData.title}</h2>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-200 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-indigo-300" />
                {formatDate(activeData.startDate)}
                {isMultiDay && ` — ${formatDate(activeData.endDate)}`}
              </span>
              <span className="text-white/40">•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-300" />
                {formatTime(activeData.startTime)} – {formatTime(activeData.endTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 text-slate-800">
          {/* Description */}
          {activeData.description && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" /> About the Event
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70 whitespace-pre-line">
                {activeData.description}
              </p>
            </div>
          )}

          {/* Location & Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" /> Venue &amp; Location
              </span>
              <p className="text-xs font-bold text-slate-800">{activeData.venue || activeData.location || "Community Grounds"}</p>
              {activeData.city && <p className="text-[11px] text-slate-500 font-medium">{activeData.city}</p>}
            </div>

            {/* Capacity & Registrations */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Ticket className="w-3.5 h-3.5 text-violet-500" /> Capacity &amp; Bookings
                </span>
                <span className="text-xs font-black text-indigo-700">{capacityPct}% Booked</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    capacityPct >= 90 ? "bg-rose-500" : capacityPct >= 70 ? "bg-amber-500" : "bg-emerald-500"
                  )}
                  style={{ width: `${Math.min(capacityPct, 100)}%` }}
                />
              </div>
              <p className="text-[11px] font-semibold text-slate-600">
                {registrations} / {capacity} passes filled
              </p>
            </div>
          </div>

          {/* Ticket Tiers / Categories */}
          {ticketTypes.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-indigo-600" /> Ticket Passes &amp; Tiers
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ticketTypes.map((t, idx) => {
                  const priceNum = parseFloat(String(t.price || 0));
                  return (
                    <div
                      key={t.id || idx}
                      className="p-3 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-indigo-200 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <strong className="text-xs font-bold text-slate-900">{t.name || `Category ${idx + 1}`}</strong>
                          {t.description && <p className="text-[10.5px] text-slate-500 mt-0.5 line-clamp-2">{t.description}</p>}
                        </div>
                        <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          {priceNum > 0 ? `₹${priceNum}` : "Free"}
                        </span>
                      </div>
                      {(t.qty || t.seats || t.capacity) && (
                        <div className="text-[10px] font-semibold text-slate-400 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span>Capacity</span>
                          <span>{t.qty || t.seats || t.capacity} seats</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment & QR Setup */}
          {(activeData.upiId || activeData.scannerUrl || activeData.paymentInstructions || paymentModes.length > 0) && (
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600" /> Payment Modes &amp; Instructions
              </h4>

              {/* Modes Badges */}
              <div className="flex flex-wrap gap-1.5">
                {paymentModes.map((mode: string) => (
                  <span
                    key={mode}
                    className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-white text-indigo-700 border border-indigo-200 shadow-2xs"
                  >
                    {mode}
                  </span>
                ))}
              </div>

              {/* UPI & Scanner Preview */}
              {(activeData.upiId || activeData.scannerUrl) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {activeData.upiId && (
                    <div className="p-2.5 rounded-xl bg-white border border-indigo-200/80 flex items-center justify-between">
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="text-[9.5px] font-bold uppercase text-slate-400 block">UPI VPA</span>
                        <p className="text-xs font-mono font-bold text-slate-800 truncate">{activeData.upiId}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="px-2 py-1 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer shrink-0 flex items-center gap-1"
                      >
                        {copiedUpi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedUpi ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  )}

                  {activeData.scannerUrl && (
                    <div
                      onClick={() => setShowQrModal(true)}
                      className="p-2.5 rounded-xl bg-white border border-indigo-200/80 flex items-center gap-2.5 cursor-pointer hover:border-indigo-300 transition-all"
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        <img src={activeData.scannerUrl} alt="QR Scanner" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <strong className="text-xs font-bold text-slate-800 block leading-none">QR Scanner</strong>
                        <span className="text-[10px] text-indigo-600 font-semibold mt-0.5 inline-block">Click to enlarge</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Instructions */}
              {activeData.paymentInstructions && (
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed bg-white p-2.5 rounded-xl border border-indigo-100">
                  ℹ️ {activeData.paymentInstructions}
                </p>
              )}
            </div>
          )}

          {/* Notes & Guidelines */}
          {activeData.notes && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-500" /> Guidelines &amp; Notes
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/60 border border-amber-200/80 p-3 rounded-2xl whitespace-pre-line">
                {activeData.notes}
              </p>
            </div>
          )}

          {/* Coordinators & Contacts */}
          {contacts.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" /> Event Coordinators &amp; Helpdesk
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {contacts.map((c, idx) => (
                  <div
                    key={c.id || idx}
                    className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <strong className="text-xs font-bold text-slate-900 block truncate">{c.name || "Event Lead"}</strong>
                      <span className="text-[10.5px] text-slate-400 block truncate">{c.role || "Organizer"}</span>
                      {c.phone && <p className="text-xs font-mono font-semibold text-slate-600 mt-0.5">{c.phone}</p>}
                    </div>
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer shadow-2xs"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" /> Call
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200/80 flex items-center gap-2 shrink-0">
          <Button variant="outline" className="text-xs font-semibold px-4 cursor-pointer" onClick={onClose}>
            Close
          </Button>

          <div className="flex-1" />

          {isEventsAdmin && onNotify && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200 font-bold cursor-pointer"
              onClick={onNotify}
            >
              <Bell className="w-3.5 h-3.5" /> Notify
            </Button>
          )}

          {isEventsAdmin && onEdit && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200 font-bold cursor-pointer"
              onClick={onEdit}
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          )}

          <a
            href={`/events?tab=registration&id=${event.id}`}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Ticket className="w-3.5 h-3.5" /> Book Passes
          </a>
        </div>

        {/* Enlarge QR Modal */}
        {showQrModal && activeData.scannerUrl && (
          <div
            className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowQrModal(false)}
          >
            <div
              className="bg-white rounded-3xl p-5 max-w-sm w-full text-center space-y-3 shadow-2xl animate-fade-in-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <strong className="text-sm font-bold text-slate-800">Scan &amp; Pay via UPI</strong>
                <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="w-56 h-56 mx-auto rounded-2xl overflow-hidden border-2 border-indigo-100 shadow-inner bg-white p-2">
                <img src={activeData.scannerUrl} alt="QR Scanner" className="w-full h-full object-contain" />
              </div>
              {activeData.upiId && <p className="text-xs font-mono font-bold text-slate-700">{activeData.upiId}</p>}
            </div>
          </div>
        )}
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
  const { user, hasPermission, isAdmin, isSuperAdmin } = useAuth();
  const userRolesUpper = (user?.roles || []).map((r: any) => String(r?.name || r).toUpperCase());
  const isEventsAdmin =
    isAdmin ||
    isSuperAdmin ||
    userRolesUpper.includes("ADMIN") ||
    userRolesUpper.includes("COMMUNITY_ADMIN") ||
    userRolesUpper.includes("EVENT_ADMIN") ||
    userRolesUpper.includes("EVENTS_ADMIN") ||
    hasPermission(CREATE_EVENT) ||
    hasPermission(MANAGE_EVENT_DASHBOARD);

  const s = STATUS_CONFIG[event.status?.toLowerCase()] ||
    STATUS_CONFIG[event.status] ||
    STATUS_CONFIG.upcoming || {
      label: event.status || "Upcoming",
      icon: Clock,
      bg: "bg-blue-50",
      text: "text-blue-700",
      dot: "bg-blue-500",
    };
  const vis = VISIBILITY_ICON[event.visibility?.toLowerCase()] ||
    VISIBILITY_ICON[event.visibility] ||
    VISIBILITY_ICON.community || {
      icon: Users,
      label: event.visibility || "Community",
    };
  const typeColor = TYPE_COLORS[event.type] ?? "#64748b";
  const [menuOpen, setMenuOpen] = useState(false);
  const capacityPct = Math.round((event.registrations / event.capacity) * 100);
  const isMultiDay = event.startDate !== event.endDate;

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const formatTime = (t: string) => {
    if (!t) return "";
    const clean = t.includes("T") ? t.split("T")[1] : t;
    const [h, m] = clean.split(":");
    const hr = parseInt(h);
    if (isNaN(hr)) return t;
    return `${hr > 12 ? hr - 12 : hr === 0 ? 12 : hr}:${m || "00"} ${hr >= 12 ? "PM" : "AM"}`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all">
      {/* Color strip */}
      <div className="h-1.5 rounded-t-xl" style={{ backgroundColor: typeColor }} />

      <div className="p-4 sm:p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onPreview}>
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
            <h4 className="font-semibold text-slate-800 text-sm sm:text-base line-clamp-1 hover:text-indigo-600 transition-colors">{event.title}</h4>
          </div>

          {isEventsAdmin && (
            <div className="relative">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer" onClick={() => setMenuOpen(!menuOpen)}>
                <MoreVertical className="w-4 h-4 text-slate-400" />
              </Button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-9 z-20 bg-white rounded-lg shadow-lg border border-slate-100 py-1 w-48 animate-fade-in-up">
                    <button onClick={() => { onPreview(); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                    <button onClick={() => { onEdit(); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                      <Pencil className="w-3.5 h-3.5" /> Edit Event
                    </button>
                    <button onClick={() => { onNotify(); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                      <Bell className="w-3.5 h-3.5" /> Send Notification
                    </button>
                    <button onClick={() => {
                      const url = `${window.location.origin}/events?id=${event.id}`;
                      navigator.clipboard.writeText(url);
                      setMenuOpen(false);
                    }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                      <Copy className="w-3.5 h-3.5" /> Copy Event Link
                    </button>
                    <hr className="my-1 border-slate-100" />
                    <button onClick={() => { onDelete(); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" /> Delete Event
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Date & Venue */}
        <div className="space-y-1.5 cursor-pointer" onClick={onPreview}>
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
        {isEventsAdmin && (
          <>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-slate-500 hover:text-indigo-600 cursor-pointer" onClick={onEdit}>
              <Pencil className="w-3 h-3" /> Edit
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-slate-500 hover:text-rose-500 cursor-pointer" onClick={onDelete}>
              <Trash2 className="w-3 h-3" /> Delete
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-slate-500 hover:text-amber-600 cursor-pointer" onClick={onNotify}>
              <Bell className="w-3 h-3" /> Notify
            </Button>
          </>
        )}
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-slate-600 hover:text-indigo-600 font-semibold cursor-pointer" onClick={onPreview}>
          Details <ChevronRight className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}



/* ─── Events List Sub-tab ─── */
function EventsList() {
  const { user, hasPermission, isAdmin, isSuperAdmin } = useAuth();
  const { useMock } = useEventMock();
  const [events, setEvents] = useState<EventItem[]>(MOCK_EVENTS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<EventStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "registrations">("date");
  const [notifyEvent, setNotifyEvent] = useState<EventItem | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<EventItem | null>(null);
  const [editEvent, setEditEvent] = useState<EventItem | null>(null);
  const [detailEvent, setDetailEvent] = useState<EventItem | null>(null);

  const userRolesUpper = (user?.roles || []).map((r: any) => String(r?.name || r).toUpperCase());
  const isEventsAdmin =
    isAdmin ||
    isSuperAdmin ||
    userRolesUpper.includes("ADMIN") ||
    userRolesUpper.includes("COMMUNITY_ADMIN") ||
    userRolesUpper.includes("EVENT_ADMIN") ||
    userRolesUpper.includes("EVENTS_ADMIN") ||
    hasPermission(CREATE_EVENT) ||
    hasPermission(MANAGE_EVENT_DASHBOARD);

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
            status: (e.status?.toLowerCase() as EventStatus) || (e.startDate && new Date(e.startDate) > new Date() ? "upcoming" : "completed"),
            visibility: (e.visibility?.toLowerCase() as any) || "community",
            registrations: e.attendees ?? (e as any).registrationCount ?? (e as any).registrations ?? 0,
            capacity: e.capacity ?? e.maxAttendees ?? 100,
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
    };
    loadLive();

    const handleReload = () => {
      loadLive();
    };
    window.addEventListener("mana_event_created", handleReload);
    window.addEventListener("mana_activities_updated", handleReload);
    return () => {
      window.removeEventListener("mana_event_created", handleReload);
      window.removeEventListener("mana_activities_updated", handleReload);
    };
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

  const handleDelete = async () => {
    if (!deleteEvent) return;
    const targetId = deleteEvent.id;
    try {
      const numericId = parseInt(targetId, 10);
      if (!isNaN(numericId)) {
        await eventService.deleteEvent(numericId);
      }
      if (!useMock) {
        try {
          const res = await eventService.getAllEvents();
          if (res) {
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
              status: (e.status?.toLowerCase() as EventStatus) || (e.startDate && new Date(e.startDate) > new Date() ? "upcoming" : "completed"),
              visibility: (e.visibility?.toLowerCase() as any) || "community",
              registrations: e.attendees ?? (e as any).registrationCount ?? (e as any).registrations ?? 0,
              capacity: e.capacity ?? e.maxAttendees ?? 100,
              coverImage: e.imageUrl || "",
              createdAt: e.createdAt || new Date().toISOString(),
            }));
            setEvents(mapped);
          }
        } catch {
          setEvents(prev => prev.map(e => e.id === targetId ? { ...e, status: "cancelled" as EventStatus } : e));
        }
      } else {
        setEvents(prev => prev.map(e => e.id === targetId ? { ...e, status: "cancelled" as EventStatus } : e));
      }
      window.dispatchEvent(new Event("mana_event_created"));
      window.dispatchEvent(new Event("mana_event_updated"));
      window.dispatchEvent(new Event("mana_activities_updated"));
    } catch (err: any) {
      console.error("Failed to delete/cancel event from database:", err);
      alert(err?.response?.data?.message || err?.message || "Failed to process event deletion/cancellation.");
    } finally {
      setDeleteEvent(null);
    }
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
            {search.trim()
              ? "Try a different search term"
              : isEventsAdmin
              ? "Create your first event using the 'Create Event' button"
              : "Events will appear here once scheduled by community organizers."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={() => setEditEvent(event)}
              onDelete={() => setDeleteEvent(event)}
              onNotify={() => setNotifyEvent(event)}
              onPreview={() => setDetailEvent(event)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      {detailEvent && (
        <EventDetailsDialog
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onEdit={() => {
            const target = detailEvent;
            setDetailEvent(null);
            setEditEvent(target);
          }}
          onNotify={() => {
            const target = detailEvent;
            setDetailEvent(null);
            setNotifyEvent(target);
          }}
        />
      )}
      {editEvent && (
        <EditEventDialog
          event={editEvent}
          onClose={() => setEditEvent(null)}
          onSave={(updated) => {
            setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
          }}
        />
      )}
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
  { id: "events",          label: "Events",               icon: CalendarDays  },
  { id: "planning",        label: "Planning & Tasks",    icon: ClipboardList },
  { id: "programs",        label: "Day Programs",         icon: Mic2          },
  { id: "poojaSeva",       label: "Pooja & Seva",         icon: Flame         },
  { id: "lunchDinner",     label: "Lunch / Dinner",       icon: UtensilsCrossed },
  { id: "culturalEvents",  label: "Cultural Events",      icon: Music         },
  { id: "competitions",     label: "Competitions",         icon: Trophy        },
] as const;

export function EventsSchedule() {
  const { user, hasPermission, isAdmin, isSuperAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");

  const userRolesUpper = (user?.roles || []).map((r: any) => String(r?.name || r).toUpperCase());
  const isEventsAdmin =
    isAdmin ||
    isSuperAdmin ||
    userRolesUpper.includes("ADMIN") ||
    userRolesUpper.includes("COMMUNITY_ADMIN") ||
    userRolesUpper.includes("EVENT_ADMIN") ||
    userRolesUpper.includes("EVENTS_ADMIN") ||
    hasPermission(CREATE_EVENT) ||
    hasPermission(MANAGE_EVENT_DASHBOARD);

  const visibleTabs = TABS.filter((t) => {
    if (t.id === "events") return true;
    return isEventsAdmin;
  });

  const resolveInitialTab = () => {
    if (tabParam && visibleTabs.some(t => t.id === tabParam)) {
      return tabParam;
    }
    return "events";
  };

  const [tab, setTab] = useState<string>(resolveInitialTab);

  useEffect(() => {
    if (tabParam && visibleTabs.some(t => t.id === tabParam)) {
      setTab(tabParam);
    }
  }, [tabParam, visibleTabs]);

  const handleTabSelect = (tabId: string) => {
    setTab(tabId);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set("tab", tabId);
      return next;
    }, { replace: true });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-white rounded-lg sm:rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-x-auto hide-scrollbar">
        {visibleTabs.map(t => (
          <button key={t.id} onClick={() => handleTabSelect(t.id)}
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
      {tab === "poojaSeva" && <EventsPoojaSeva />}
      {tab === "lunchDinner" && (
        <div className="space-y-8">
          <EventsLunchDinner />
          <div className="pt-4 border-t border-border">
            <EventsFood />
          </div>
        </div>
      )}
      {tab === "culturalEvents" && <EventsCulturalEvents />}
      {tab === "competitions" && <CompetitionsSection />}
    </div>
  );
}
