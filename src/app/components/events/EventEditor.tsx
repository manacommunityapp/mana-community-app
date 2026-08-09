import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  CalendarDays, MapPin, Users, DollarSign, Image,
  CheckCircle2, ChevronRight, ChevronLeft, Sparkles, Clock,
  Globe, Lock, Building2, Heart, Music, Utensils,
  Briefcase, GraduationCap, Tent, Plus, X, Upload,
  Tag, AlertCircle, Check, Ticket, Eye, FileText,
  Zap, Star, ArrowRight, Trash2, PlusCircle, Link2,
  Save, Loader2, Send, FileEdit, ArrowLeft, MoreVertical,
  Copy, Archive, RotateCcw,
} from "lucide-react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { cn } from "../ui/utils";
import { useEventMock } from "./EventMockToggle";
import { eventService, type EventRequest, type EventResponse } from "../../../services/events/eventService";

/* ─── Types ─── */
type EventStatus = "draft" | "published";

interface FormData {
  title: string;
  eventType: string;
  category: string;
  description: string;
  visibility: "public" | "community" | "invite";
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  multiDay: boolean;
  daySchedules: DaySchedule[];
  venueName: string;
  venueAddress: string;
  city: string;
  capacity: string;
  registrationEnabled: boolean;
  registrationDeadline: string;
  ticketTypes: TicketType[];
  requireApproval: boolean;
  allowWaitlist: boolean;
  totalBudget: string;
  budgetItems: BudgetItem[];
  coverImageUrl: string;
  tags: string[];
}

interface TicketType { id: string; name: string; price: string; qty: string; description: string; }
interface BudgetItem { id: string; category: string; amount: string; }
interface ScheduleActivity { id: string; name: string; startTime: string; endTime: string; description: string; }
interface DaySchedule { date: string; activities: ScheduleActivity[]; }

/* ─── Constants ─── */
const EVENT_TYPES = [
  { value: "festival",    label: "Festival",       icon: Sparkles,      color: "#7c3aed", bg: "#f5f3ff" },
  { value: "cultural",    label: "Cultural",       icon: Music,         color: "#8b5cf6", bg: "#f5f3ff" },
  { value: "health",      label: "Health Camp",    icon: Heart,         color: "#be185d", bg: "#fdf2f8" },
  { value: "community",   label: "Community",      icon: Users,         color: "#0891b2", bg: "#ecfeff" },
  { value: "corporate",   label: "Corporate",      icon: Briefcase,     color: "#374151", bg: "#f9fafb" },
  { value: "education",   label: "Education",      icon: GraduationCap, color: "#059669", bg: "#ecfdf5" },
  { value: "food",        label: "Food & Dining",  icon: Utensils,      color: "#4f46e5", bg: "#eef2ff" },
  { value: "outdoor",     label: "Outdoor",        icon: Tent,          color: "#065f46", bg: "#ecfdf5" },
  { value: "other",       label: "Other",          icon: Globe,         color: "#64748b", bg: "#f8fafc" },
];

const SECTIONS = [
  { id: "basics",        label: "Basics",       icon: FileText,    desc: "Name, type & visibility" },
  { id: "schedule",      label: "Schedule",     icon: Clock,       desc: "Date, time & venue" },
  { id: "registration",  label: "Registration", icon: Ticket,      desc: "Tickets & categories" },
  { id: "budget",        label: "Budget",       icon: DollarSign,  desc: "Allocation & breakdown" },
  { id: "media",         label: "Media",        icon: Image,       desc: "Cover image & tags" },
];

const BUDGET_CATEGORIES = ["Venue", "Food & Catering", "Decoration", "Audio / Visual", "Security", "Marketing", "Transport", "Volunteers", "Medical", "Other"];

const DEFAULT_TICKET_TYPES: TicketType[] = [
  { id: "t1", name: "General",   price: "0",   qty: "100", description: "Open for all community members" },
  { id: "t2", name: "VIP",       price: "500", qty: "20",  description: "Priority seating & welcome kit" },
];

const DEFAULT_BUDGET_ITEMS: BudgetItem[] = [
  { id: "b1", category: "Venue",            amount: "" },
  { id: "b2", category: "Food & Catering",  amount: "" },
  { id: "b3", category: "Decoration",       amount: "" },
];

const INITIAL_FORM_DATA: FormData = {
  title: "", eventType: "", category: "", description: "",
  visibility: "community",
  startDate: "", endDate: "", startTime: "", endTime: "",
  multiDay: false, daySchedules: [], venueName: "", venueAddress: "", city: "", capacity: "",
  registrationEnabled: true, registrationDeadline: "",
  ticketTypes: [...DEFAULT_TICKET_TYPES],
  requireApproval: false, allowWaitlist: true,
  totalBudget: "", budgetItems: [...DEFAULT_BUDGET_ITEMS],
  coverImageUrl: "", tags: [],
};

const INPUT_CLS = "w-full px-4 py-3 h-auto rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none focus-visible:border-indigo-400 focus-visible:ring-4 focus-visible:ring-indigo-50 transition-all";

/* ─── Shared sub-components ─── */
function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
      </div>
      <div>
        <h3 className="text-xs sm:text-sm font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-[10px] sm:text-[11px] text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function FieldLabel({ children, required, hint }: { children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-1.5">
      <Label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em]">
        {children}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </Label>
      {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
    </div>
  );
}

function ToggleRow({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <div className={cn(
      "flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-all",
      checked ? "bg-indigo-50/50 border-indigo-200" : "bg-slate-50 border-slate-100"
    )}>
      <div>
        <span className="text-xs sm:text-sm font-medium text-slate-700">{label}</span>
        {desc && <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/* ─── Section: Basics ─── */
function SectionBasics({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  return (
    <div className="space-y-4 sm:space-y-7">
      <SectionHeader icon={FileText} title="Event Details" subtitle="Give your event a name and describe what it's about" />
      <div>
        <FieldLabel required>Event Title</FieldLabel>
        <Input value={data.title} onChange={e => update("title", e.target.value)}
          placeholder="e.g. Ganesh Chaturthi 2026 – Grand Celebration"
          className={cn(INPUT_CLS, "text-base font-medium")} />
      </div>
      <div>
        <FieldLabel required>Event Type</FieldLabel>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {EVENT_TYPES.map(t => {
            const selected = data.eventType === t.value;
            return (
              <button key={t.value} onClick={() => update("eventType", t.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 sm:gap-2.5 p-2.5 sm:p-4 rounded-xl border-2 text-center transition-all",
                  selected
                    ? "border-indigo-500 shadow-[0_2px_16px_rgba(99,102,241,0.2)] scale-[1.02]"
                    : "border-transparent bg-white hover:border-slate-200 hover:shadow-sm"
                )}
                style={{ background: selected ? t.bg : undefined }}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-transform"
                  style={{ background: selected ? `${t.color}25` : "#f1f5f9" }}>
                  <t.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: t.color }} />
                </div>
                <span className={cn("text-[11px] font-bold leading-tight", selected ? "text-slate-800" : "text-slate-500")}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <FieldLabel required hint={`${data.description.length}/1000`}>Description</FieldLabel>
        <Textarea value={data.description} onChange={e => update("description", e.target.value)} rows={4}
          placeholder="Describe your event – purpose, highlights, what attendees can expect…"
          className={cn(INPUT_CLS, "resize-none")} />
      </div>
      <div>
        <FieldLabel>Visibility</FieldLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {([
            { value: "public",    label: "Public",      icon: Globe,    desc: "Anyone can view & register", color: "#059669" },
            { value: "community", label: "Community",   icon: Building2, desc: "Members only",               color: "#4f46e5" },
            { value: "invite",    label: "Invite Only", icon: Lock,      desc: "Private, by invitation",     color: "#7c3aed" },
          ] as const).map(opt => {
            const selected = data.visibility === opt.value;
            return (
              <button key={opt.value} onClick={() => update("visibility", opt.value)}
                className={cn(
                  "p-3 sm:p-4 rounded-xl border-2 text-left transition-all group flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0",
                  selected
                    ? "border-indigo-400 bg-indigo-50/60 shadow-sm"
                    : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
                )}>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center sm:mb-3 transition-colors flex-shrink-0",
                  selected ? "bg-indigo-100" : "bg-slate-100 group-hover:bg-slate-50")}>
                  <opt.icon className="w-4 h-4" style={{ color: selected ? opt.color : "#94a3b8" }} />
                </div>
                <div>
                  <p className={cn("text-sm font-bold", selected ? "text-indigo-700" : "text-slate-700")}>{opt.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Section: Schedule ─── */
function getDaysBetween(start: string, end: string): string[] {
  if (!start || !end) return [];
  const days: string[] = [];
  const d = new Date(start);
  const last = new Date(end);
  while (d <= last && days.length < 30) {
    days.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
}

function SectionSchedule({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const syncDaySchedules = (start: string, end: string) => {
    const days = getDaysBetween(start, end);
    const existing = new Map(data.daySchedules.map(ds => [ds.date, ds]));
    const synced = days.map(date => existing.get(date) ?? {
      date,
      activities: [{ id: `a${Date.now()}-${date}`, name: "", startTime: "09:00", endTime: "10:00", description: "" }],
    });
    update("daySchedules", synced);
    if (synced.length > 0 && !expandedDay) setExpandedDay(synced[0].date);
  };

  const handleStartDate = (val: string) => {
    update("startDate", val);
    if (data.multiDay && data.endDate) syncDaySchedules(val, data.endDate);
  };

  const handleEndDate = (val: string) => {
    update("endDate", val);
    if (data.multiDay && data.startDate) syncDaySchedules(data.startDate, val);
  };

  const handleMultiDayToggle = (v: boolean) => {
    update("multiDay", v);
    if (v && data.startDate && data.endDate) syncDaySchedules(data.startDate, data.endDate);
    else if (!v) update("daySchedules", []);
  };

  const addActivity = (date: string) => {
    const updated = data.daySchedules.map(ds =>
      ds.date === date
        ? { ...ds, activities: [...ds.activities, { id: `a${Date.now()}`, name: "", startTime: "", endTime: "", description: "" }] }
        : ds
    );
    update("daySchedules", updated);
  };

  const removeActivity = (date: string, actId: string) => {
    const updated = data.daySchedules.map(ds =>
      ds.date === date ? { ...ds, activities: ds.activities.filter(a => a.id !== actId) } : ds
    );
    update("daySchedules", updated);
  };

  const updateActivity = (date: string, actId: string, field: keyof ScheduleActivity, value: string) => {
    const updated = data.daySchedules.map(ds =>
      ds.date === date
        ? { ...ds, activities: ds.activities.map(a => a.id === actId ? { ...a, [field]: value } : a) }
        : ds
    );
    update("daySchedules", updated);
  };

  const dayCount = data.daySchedules.length;

  return (
    <div className="space-y-4 sm:space-y-7">
      <SectionHeader icon={CalendarDays} title="Date & Time" subtitle="When is your event happening?" />
      <ToggleRow checked={data.multiDay} onChange={handleMultiDayToggle}
        label="Multi-day event" desc="Enable to set up a day-wise schedule with activities" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel required>{data.multiDay ? "Start Date" : "Event Date"}</FieldLabel>
          <Input type="date" value={data.startDate} onChange={e => handleStartDate(e.target.value)} className={INPUT_CLS} />
        </div>
        {data.multiDay && (
          <div className="animate-fade-in-up">
            <FieldLabel required>End Date</FieldLabel>
            <Input type="date" value={data.endDate} onChange={e => handleEndDate(e.target.value)} className={INPUT_CLS} />
          </div>
        )}
        <div>
          <FieldLabel required>Start Time</FieldLabel>
          <Input type="time" value={data.startTime} onChange={e => update("startTime", e.target.value)} className={INPUT_CLS} />
        </div>
        <div>
          <FieldLabel required>End Time</FieldLabel>
          <Input type="time" value={data.endTime} onChange={e => update("endTime", e.target.value)} className={INPUT_CLS} />
        </div>
      </div>

      {data.multiDay && dayCount > 0 && (
        <div className="animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader icon={Zap} title="Day-wise Schedule" subtitle={`${dayCount} day${dayCount > 1 ? "s" : ""} — add activities for each day`} />
          </div>
          <div className="space-y-3">
            {data.daySchedules.map((day, dayIdx) => {
              const isExpanded = expandedDay === day.date;
              const filledCount = day.activities.filter(a => a.name).length;
              const totalCount = day.activities.length;
              return (
                <div key={day.date} className={cn("rounded-2xl border overflow-hidden transition-all",
                  isExpanded ? "border-indigo-200 shadow-[0_4px_20px_rgba(99,102,241,0.08)]" : "border-slate-200 hover:border-slate-300")}>
                  <button onClick={() => setExpandedDay(isExpanded ? null : day.date)}
                    className={cn("w-full flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 transition-colors",
                      isExpanded ? "bg-indigo-50/50" : "bg-white hover:bg-slate-50")}>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={cn("w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex flex-col items-center justify-center text-white font-black",
                        isExpanded ? "shadow-md" : ""
                      )} style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                        <span className="text-[10px] leading-none opacity-70">DAY</span>
                        <span className="text-sm leading-none">{dayIdx + 1}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-800">{formatDayLabel(day.date)}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{filledCount}/{totalCount} activities filled</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {filledCount === totalCount && totalCount > 0 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      <ChevronRight className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", isExpanded && "rotate-90")} />
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-3 sm:px-5 pb-3 sm:pb-5 pt-2 bg-white space-y-3 animate-fade-in-up">
                      {day.activities.map((act, actIdx) => (
                        <div key={act.id} className="relative p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3 group">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-[10px] font-black text-indigo-600">{actIdx + 1}</span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activity</span>
                            </div>
                            {day.activities.length > 1 && (
                              <button onClick={() => removeActivity(day.date, act.id)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all p-1 rounded-lg hover:bg-rose-50">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
                            <div>
                              <FieldLabel required>Activity Name</FieldLabel>
                              <Input value={act.name} onChange={e => updateActivity(day.date, act.id, "name", e.target.value)}
                                placeholder="e.g. Opening Ceremony" className={INPUT_CLS} />
                            </div>
                            <div className="w-28">
                              <FieldLabel required>From</FieldLabel>
                              <Input type="time" value={act.startTime} onChange={e => updateActivity(day.date, act.id, "startTime", e.target.value)} className={INPUT_CLS} />
                            </div>
                            <div className="w-28">
                              <FieldLabel required>To</FieldLabel>
                              <Input type="time" value={act.endTime} onChange={e => updateActivity(day.date, act.id, "endTime", e.target.value)} className={INPUT_CLS} />
                            </div>
                          </div>
                          <div>
                            <FieldLabel>Description</FieldLabel>
                            <Input value={act.description} onChange={e => updateActivity(day.date, act.id, "description", e.target.value)}
                              placeholder="Optional details about this activity" className={INPUT_CLS} />
                          </div>
                        </div>
                      ))}
                      <button onClick={() => addActivity(day.date)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-indigo-200 text-xs font-bold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all">
                        <Plus className="w-3.5 h-3.5" /> Add Activity to Day {dayIdx + 1}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="pt-2">
        <SectionHeader icon={MapPin} title="Venue Details" subtitle="Where is your event taking place?" />
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Venue Name</FieldLabel>
              <Input value={data.venueName} onChange={e => update("venueName", e.target.value)}
                placeholder="e.g. Community Hall, Society Ground" className={INPUT_CLS} />
            </div>
            <div>
              <FieldLabel required>City</FieldLabel>
              <Input value={data.city} onChange={e => update("city", e.target.value)} placeholder="City" className={INPUT_CLS} />
            </div>
          </div>
          <div>
            <FieldLabel required>Address</FieldLabel>
            <Textarea value={data.venueAddress} onChange={e => update("venueAddress", e.target.value)} rows={2}
              placeholder="Full address of the venue" className={cn(INPUT_CLS, "resize-none")} />
          </div>
          <div>
            <FieldLabel hint="Optional">Max Capacity</FieldLabel>
            <Input type="number" value={data.capacity} onChange={e => update("capacity", e.target.value)}
              placeholder="e.g. 500" className={cn(INPUT_CLS, "sm:w-48")} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Section: Registration ─── */
function SectionRegistration({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  const addTicket = () => {
    const newTicket: TicketType = { id: `t${Date.now()}`, name: "", price: "0", qty: "", description: "" };
    update("ticketTypes", [...data.ticketTypes, newTicket]);
  };
  const removeTicket = (id: string) => update("ticketTypes", data.ticketTypes.filter(t => t.id !== id));
  const updateTicket = (id: string, field: keyof TicketType, value: string) =>
    update("ticketTypes", data.ticketTypes.map(t => t.id === id ? { ...t, [field]: value } : t));

  const totalSeats = data.ticketTypes.reduce((s, t) => s + (parseInt(t.qty) || 0), 0);
  const isDeadlineInvalid = Boolean(
    data.registrationEnabled && data.registrationDeadline && data.startDate &&
    new Date(data.registrationDeadline) >= new Date(data.startDate)
  );
  const maxDeadlineDate = data.startDate
    ? new Date(new Date(data.startDate).getTime() - 86400000).toISOString().split("T")[0]
    : undefined;

  return (
    <div className="space-y-4 sm:space-y-7">
      <SectionHeader icon={Ticket} title="Registration Settings" subtitle="Configure how attendees can register for your event" />
      <ToggleRow checked={data.registrationEnabled} onChange={v => update("registrationEnabled", v)}
        label="Enable event registration" desc="Allow attendees to register for this event" />
      {data.registrationEnabled && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel hint={data.startDate ? `Must be before ${data.startDate}` : undefined}>Registration Deadline</FieldLabel>
              <Input type="date" value={data.registrationDeadline} max={maxDeadlineDate}
                onChange={e => update("registrationDeadline", e.target.value)}
                className={cn(INPUT_CLS, isDeadlineInvalid && "border-rose-500 focus-visible:ring-rose-200 bg-rose-50/20 text-rose-900 font-semibold")} />
              {isDeadlineInvalid && (
                <p className="text-xs font-semibold text-rose-600 mt-1.5 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Registration deadline must be before the event start date ({data.startDate}).
                </p>
              )}
            </div>
            <div className="flex items-end pb-1">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
                <Users className="w-4 h-4 text-indigo-500" />
                <input type="number" value={totalSeats || ""} onChange={e => {
                  const newTotal = parseInt(e.target.value) || 0;
                  if (newTotal < 0) return;
                  const tickets = data.ticketTypes;
                  if (tickets.length === 0) return;
                  const oldTotal = totalSeats;
                  if (oldTotal === 0) {
                    const perTicket = Math.floor(newTotal / tickets.length);
                    const remainder = newTotal % tickets.length;
                    update("ticketTypes", tickets.map((t, i) => ({ ...t, qty: String(perTicket + (i < remainder ? 1 : 0)) })));
                  } else {
                    const ratio = newTotal / oldTotal;
                    let distributed = 0;
                    const updated = tickets.map((t, i) => {
                      const oldQty = parseInt(t.qty) || 0;
                      const isLast = i === tickets.length - 1;
                      const newQty = isLast ? newTotal - distributed : Math.round(oldQty * ratio);
                      distributed += isLast ? 0 : newQty;
                      return { ...t, qty: String(Math.max(0, newQty)) };
                    });
                    update("ticketTypes", updated);
                  }
                }} placeholder="0"
                  className="w-16 bg-transparent text-sm font-bold text-indigo-700 outline-none text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                <span className="text-sm font-bold text-indigo-700">total seats</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ToggleRow checked={data.requireApproval} onChange={v => update("requireApproval", v)}
              label="Require approval" desc="Admin must approve each registration" />
            <ToggleRow checked={data.allowWaitlist} onChange={v => update("allowWaitlist", v)}
              label="Enable waitlist" desc="When tickets are full" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-700">Ticket Categories</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Define different registration tiers for your event</p>
              </div>
              <button onClick={addTicket}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all">
                <Plus className="w-3.5 h-3.5" /> Add Category
              </button>
            </div>
            <div className="space-y-3">
              {data.ticketTypes.map((ticket, i) => (
                <div key={ticket.id}
                  className="p-3 sm:p-5 bg-white rounded-xl border border-slate-200 space-y-3 sm:space-y-4 hover:border-slate-300 transition-colors group animate-fade-in-up">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: i === 0 ? "#eef2ff" : i === 1 ? "#fef9ee" : "#f0fdf4" }}>
                        <Star className="w-3.5 h-3.5" style={{ color: i === 0 ? "#4f46e5" : i === 1 ? "#d97706" : "#059669" }} />
                      </div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Category {i + 1}</span>
                    </div>
                    {data.ticketTypes.length > 1 && (
                      <button onClick={() => removeTicket(ticket.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all p-1 rounded-lg hover:bg-rose-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <FieldLabel required>Name</FieldLabel>
                      <Input value={ticket.name} onChange={e => updateTicket(ticket.id, "name", e.target.value)}
                        placeholder="e.g. Family, VIP" className={INPUT_CLS} />
                    </div>
                    <div>
                      <FieldLabel>Price</FieldLabel>
                      <Input type="number" value={ticket.price} onChange={e => updateTicket(ticket.id, "price", e.target.value)}
                        placeholder="0 = Free" className={INPUT_CLS} />
                    </div>
                    <div>
                      <FieldLabel>Seats</FieldLabel>
                      <Input type="number" value={ticket.qty} onChange={e => updateTicket(ticket.id, "qty", e.target.value)}
                        placeholder="Capacity" className={INPUT_CLS} />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Description</FieldLabel>
                    <Input value={ticket.description} onChange={e => updateTicket(ticket.id, "description", e.target.value)}
                      placeholder="What's included for this category?" className={INPUT_CLS} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Section: Budget ─── */
function SectionBudget({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  const addItem = () => update("budgetItems", [...data.budgetItems, { id: `b${Date.now()}`, category: "", amount: "" }]);
  const removeItem = (id: string) => update("budgetItems", data.budgetItems.filter(b => b.id !== id));
  const updateItem = (id: string, field: keyof BudgetItem, value: string) =>
    update("budgetItems", data.budgetItems.map(b => b.id === id ? { ...b, [field]: value } : b));

  const totalAllocated = data.budgetItems.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
  const totalBudgetNum = parseFloat(data.totalBudget) || 0;
  const pct = totalBudgetNum > 0 ? Math.min(100, (totalAllocated / totalBudgetNum) * 100) : 0;
  const remaining = totalBudgetNum - totalAllocated;

  return (
    <div className="space-y-4 sm:space-y-7">
      <SectionHeader icon={DollarSign} title="Budget Planning" subtitle="Set a budget and allocate across categories" />
      <div>
        <FieldLabel>Total Event Budget</FieldLabel>
        <div className="relative sm:w-64">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">&#8377;</span>
          <Input type="number" value={data.totalBudget} onChange={e => update("totalBudget", e.target.value)}
            placeholder="e.g. 500000" className={cn(INPUT_CLS, "pl-8 text-base font-semibold")} />
        </div>
      </div>
      {totalBudgetNum > 0 && (
        <div className="p-3 sm:p-5 rounded-2xl border border-indigo-100 animate-fade-in-up"
          style={{ background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Budget Utilization</p>
              <p className="text-2xl font-black text-indigo-700 mt-1">&#8377;{totalAllocated.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400">Remaining</p>
              <p className={cn("text-lg font-black", remaining >= 0 ? "text-emerald-600" : "text-rose-600")}>
                &#8377;{Math.abs(remaining).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="h-3 bg-indigo-100 rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-500",
              pct > 100 ? "bg-rose-500" : pct > 80 ? "bg-amber-500" : "bg-indigo-500"
            )} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <p className="text-[11px] mt-2 font-medium"
            style={{ color: pct > 100 ? "#e11d48" : pct > 80 ? "#d97706" : "#6366f1" }}>
            {pct.toFixed(0)}% allocated{pct > 100 ? " — over budget!" : ""}
          </p>
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-700">Budget Breakdown</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Allocate budget across expense categories</p>
          </div>
          <button onClick={addItem}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all">
            <Plus className="w-3.5 h-3.5" /> Add Line
          </button>
        </div>
        <div className="space-y-2.5">
          {data.budgetItems.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 animate-fade-in-up group">
              <Select value={item.category} onValueChange={v => updateItem(item.id, "category", v)}>
                <SelectTrigger className="flex-1 h-auto px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus-visible:border-indigo-400">
                  <SelectValue placeholder="Select category…" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="w-full sm:w-40 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">&#8377;</span>
                <Input value={item.amount} onChange={e => updateItem(item.id, "amount", e.target.value)}
                  type="number" placeholder="Amount" className={cn(INPUT_CLS, "pl-8")} />
              </div>
              <button onClick={() => removeItem(item.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all p-1.5 rounded-lg hover:bg-rose-50 flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Section: Media ─── */
function SectionMedia({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  const [tagInput, setTagInput] = useState("");
  const [imageMode, setImageMode] = useState<"upload" | "url">(data.coverImageUrl && !data.coverImageUrl.startsWith("data:") ? "url" : "upload");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") update("coverImageUrl", reader.result); };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const clearImage = () => {
    update("coverImageUrl", "");
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !data.tags.includes(t)) { update("tags", [...data.tags, t]); setTagInput(""); }
  };
  const removeTag = (t: string) => update("tags", data.tags.filter(x => x !== t));

  return (
    <div className="space-y-4 sm:space-y-7">
      <SectionHeader icon={Image} title="Cover Image & Tags" subtitle="Add visual identity and discoverability to your event" />
      <div>
        <FieldLabel>Cover Image</FieldLabel>
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-4">
          <button onClick={() => setImageMode("upload")}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all",
              imageMode === "upload" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            <Upload className="w-3.5 h-3.5" /> Upload File
          </button>
          <button onClick={() => setImageMode("url")}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all",
              imageMode === "url" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            <Link2 className="w-3.5 h-3.5" /> Paste URL
          </button>
        </div>

        {imageMode === "url" ? (
          <Input value={data.coverImageUrl.startsWith("data:") ? "" : data.coverImageUrl}
            onChange={e => { update("coverImageUrl", e.target.value); setFileName(""); }}
            placeholder="https://images.unsplash.com/…" className={INPUT_CLS} />
        ) : (
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        )}

        {data.coverImageUrl ? (
          <div className="mt-3 h-52 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner relative group">
            <img src={data.coverImageUrl} alt="Cover preview" className="w-full h-full object-cover" onError={() => {}} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
              {fileName && <span className="text-xs text-white/80 font-medium truncate max-w-[60%]">{fileName}</span>}
              <button onClick={clearImage}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white text-xs font-bold hover:bg-white/30 transition-all">
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div onClick={() => imageMode === "upload" && fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              "mt-3 h-52 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all",
              imageMode === "upload" ? "cursor-pointer" : "cursor-default",
              dragOver
                ? "border-indigo-400 bg-indigo-50/40 scale-[1.01]"
                : "border-slate-200 bg-gradient-to-b from-slate-50 to-white hover:border-indigo-300 hover:bg-indigo-50/20"
            )}>
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
              dragOver ? "bg-indigo-100" : "bg-slate-100")}>
              <Upload className={cn("w-6 h-6 transition-colors", dragOver ? "text-indigo-500" : "text-slate-300")} />
            </div>
            <div className="text-center">
              {imageMode === "upload" ? (
                <>
                  <p className="text-sm text-slate-500 font-medium">
                    <span className="text-indigo-600 font-bold">Click to upload</span> or drag & drop
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-400 font-medium">Paste an image URL above</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">The preview will appear here</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <FieldLabel hint="Press Add or Enter">Tags</FieldLabel>
        <div className="flex gap-2 mb-3">
          <Input value={tagInput} onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="Add a tag (e.g. festival, 2026)…" className={INPUT_CLS} />
          <Button onClick={addTag}
            className="px-5 py-3 h-auto rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 transition-all flex-shrink-0 shadow-sm">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
        {data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-fade-in-up">
            {data.tags.map(t => (
              <Badge key={t} variant="outline"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border-indigo-200 text-indigo-700 text-xs font-bold rounded-full hover:bg-indigo-100 transition-colors">
                <Tag className="w-3 h-3" /> {t}
                <button onClick={() => removeTag(t)} className="hover:text-rose-500 transition-colors ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function toEventRequest(data: FormData): EventRequest {
  return {
    title: data.title,
    description: data.description || undefined,
    type: data.eventType || undefined,
    startDate: data.startDate,
    endDate: data.multiDay && data.endDate ? data.endDate : undefined,
    startTime: data.startTime || undefined,
    endTime: data.endTime || undefined,
    locationType: data.visibility,
    location: [data.venueName, data.venueAddress, data.city].filter(Boolean).join(", ") || undefined,
    priceType: data.ticketTypes.some(t => parseFloat(t.price) > 0) ? "PAID" : "FREE",
    price: data.ticketTypes.length > 0 ? parseFloat(data.ticketTypes[0].price) || undefined : undefined,
    capacity: data.capacity ? parseInt(data.capacity) : undefined,
    imageUrl: data.coverImageUrl && !data.coverImageUrl.startsWith("data:") ? data.coverImageUrl : undefined,
    organizerName: undefined,
    organizerContact: undefined,
  };
}

function fromEventResponse(ev: EventResponse): FormData {
  const parts = (ev.location || "").split(", ");
  return {
    title: ev.title || "",
    eventType: ev.type || "",
    category: "",
    description: ev.description || "",
    visibility: (ev.locationType as FormData["visibility"]) || "community",
    startDate: ev.startDate || "",
    endDate: ev.endDate || "",
    startTime: ev.startTime || "",
    endTime: ev.endTime || "",
    multiDay: !!ev.endDate,
    daySchedules: [],
    venueName: parts[0] || "",
    venueAddress: parts.slice(1, -1).join(", ") || "",
    city: parts[parts.length - 1] || "",
    capacity: ev.capacity ? String(ev.capacity) : "",
    registrationEnabled: true,
    registrationDeadline: "",
    ticketTypes: [
      { id: "t1", name: "General", price: ev.price ? String(ev.price) : "0", qty: ev.capacity ? String(ev.capacity) : "100", description: "" },
    ],
    requireApproval: false,
    allowWaitlist: true,
    totalBudget: "",
    budgetItems: [...DEFAULT_BUDGET_ITEMS],
    coverImageUrl: ev.imageUrl || "",
    tags: [],
  };
}

function getCompletionPct(data: FormData): number {
  let filled = 0;
  let total = 0;
  const check = (v: any) => { total++; if (v) filled++; };
  check(data.title);
  check(data.eventType);
  check(data.description);
  check(data.startDate);
  check(data.startTime);
  check(data.endTime);
  check(data.venueName);
  check(data.city);
  check(data.venueAddress);
  if (data.registrationEnabled) { check(data.ticketTypes.some(t => t.name)); }
  check(data.coverImageUrl);
  return total > 0 ? Math.round((filled / total) * 100) : 0;
}

/* ─── Main Component ─── */
export function EventEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  let useMock = true;
  try { useMock = useEventMock().useMock; } catch {}

  const [formData, setFormData] = useState<FormData>({ ...INITIAL_FORM_DATA });
  const [status, setStatus] = useState<EventStatus>("draft");
  const [activeSection, setActiveSection] = useState("basics");
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showSuccess, setShowSuccess] = useState<"draft" | "publish" | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const update = useCallback((key: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setDirty(true);
    setSaveError("");
  }, []);

  useEffect(() => {
    if (!isEditMode || useMock) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const ev = await eventService.getById(parseInt(id!));
        setFormData(fromEventResponse(ev));
        setStatus("published");
      } catch (e: any) {
        setSaveError("Failed to load event");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEditMode, useMock]);

  const handleSaveDraft = async () => {
    setSaving(true);
    setSaveError("");
    try {
      if (!useMock) {
        const payload = toEventRequest(formData);
        if (isEditMode) {
          await eventService.update(parseInt(id!), payload);
        } else {
          await eventService.create(payload);
        }
      }
      setStatus("draft");
      setDirty(false);
      setLastSaved(new Date());
      setShowSuccess("draft");
      setTimeout(() => setShowSuccess(null), 3000);
    } catch (e: any) {
      setSaveError(e.message ?? "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    const warnings = getValidationWarnings(formData);
    if (warnings.length > 0) {
      setSaveError(warnings[0]);
      return;
    }
    setPublishing(true);
    setSaveError("");
    try {
      if (!useMock) {
        const payload = toEventRequest(formData);
        if (isEditMode) {
          await eventService.update(parseInt(id!), payload);
        } else {
          await eventService.create(payload);
        }
      }
      setStatus("published");
      setDirty(false);
      setLastSaved(new Date());
      setShowSuccess("publish");
      setTimeout(() => setShowSuccess(null), 4000);
    } catch (e: any) {
      setSaveError(e.message ?? "Failed to publish event");
    } finally {
      setPublishing(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    sectionRefs.current[sectionId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const completionPct = getCompletionPct(formData);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading event...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ─── Top Header ─── */}
      <div className="flex-shrink-0 border-b border-slate-100 bg-white">
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3"
          style={{ background: "linear-gradient(135deg, #eef2ff 0%, #faf5ff 40%, #ffffff 100%)" }}>
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button onClick={() => navigate("/events")}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-all flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md"
              style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
              <FileEdit className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <h2 className="text-sm sm:text-lg font-black text-slate-900 truncate">
                  {isEditMode ? "Edit Event" : "Create New Event"}
                </h2>
                <Badge variant="outline" className={cn(
                  "text-[10px] font-bold uppercase tracking-wider flex-shrink-0",
                  status === "draft"
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                )}>
                  {status === "draft" ? <FileText className="w-3 h-3 mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {status === "draft" ? "Draft" : "Published"}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                {formData.title && (
                  <span className="text-xs text-indigo-500 font-medium truncate max-w-[200px]">
                    {formData.title}
                  </span>
                )}
                {lastSaved && (
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
                {dirty && !saving && !publishing && (
                  <span className="text-[10px] text-amber-500 font-medium flex-shrink-0">Unsaved changes</span>
                )}
              </div>
            </div>
          </div>

          {/* Completion ring */}
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            <div className="relative w-11 h-11">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none"
                  stroke={completionPct === 100 ? "#10b981" : "#6366f1"}
                  strokeWidth="3" strokeDasharray={`${completionPct * 0.942} 100`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-slate-600">
                {completionPct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Section Nav (horizontal scroll) ─── */}
      <div className="flex-shrink-0 border-b border-slate-100 bg-white px-4 sm:px-6 py-2">
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
          {SECTIONS.map((sec, i) => {
            const active = activeSection === sec.id;
            return (
              <button key={sec.id} onClick={() => scrollToSection(sec.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0",
                  active
                    ? "bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-[0_2px_12px_rgba(99,102,241,0.25)]"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                )}>
                <sec.icon className="w-3.5 h-3.5" />
                {sec.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Form Body (scrollable) ─── */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-10 sm:space-y-14">
          <div ref={el => { sectionRefs.current["basics"] = el; }}>
            <SectionBasics data={formData} update={update} />
          </div>
          <div className="border-t border-slate-100" />
          <div ref={el => { sectionRefs.current["schedule"] = el; }}>
            <SectionSchedule data={formData} update={update} />
          </div>
          <div className="border-t border-slate-100" />
          <div ref={el => { sectionRefs.current["registration"] = el; }}>
            <SectionRegistration data={formData} update={update} />
          </div>
          <div className="border-t border-slate-100" />
          <div ref={el => { sectionRefs.current["budget"] = el; }}>
            <SectionBudget data={formData} update={update} />
          </div>
          <div className="border-t border-slate-100" />
          <div ref={el => { sectionRefs.current["media"] = el; }}>
            <SectionMedia data={formData} update={update} />
          </div>

          {/* Bottom spacer for sticky footer */}
          <div className="h-4" />
        </div>
      </div>

      {/* ─── Sticky Bottom Bar ─── */}
      <div className="flex-shrink-0 border-t border-slate-200 bg-white/95 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
        {/* Success toast inline */}
        {showSuccess && (
          <div className={cn(
            "mb-3 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium animate-fade-in-up",
            showSuccess === "draft"
              ? "bg-amber-50 text-amber-800 border border-amber-200"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
          )}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {showSuccess === "draft"
              ? "Draft saved successfully! You can continue editing anytime."
              : "Event published successfully! It's now visible to your audience."}
          </div>
        )}

        {saveError && (
          <div className="mb-3 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium bg-rose-50 text-rose-700 border border-rose-200 animate-fade-in-up">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {saveError}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          {/* Left — back & info */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/events")}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-sm transition-all">
              <ArrowLeft className="w-4 h-4" /> Cancel
            </button>
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              {completionPct}% complete
            </div>
          </div>

          {/* Right — action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* More options */}
            <div className="relative">
              <button onClick={() => setMoreOpen(!moreOpen)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all border border-slate-200">
                <MoreVertical className="w-4 h-4" />
              </button>
              {moreOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-1 animate-fade-in-up">
                    <button onClick={() => { setFormData({ ...INITIAL_FORM_DATA }); setDirty(true); setMoreOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                      <RotateCcw className="w-3.5 h-3.5" /> Reset Form
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(formData, null, 2)); setMoreOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                      <Copy className="w-3.5 h-3.5" /> Copy as JSON
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Save as Draft */}
            <button onClick={handleSaveDraft} disabled={saving || publishing}
              className={cn(
                "flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all",
                "bg-white border-2 border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 hover:shadow-sm",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save as Draft"}
            </button>

            {/* Publish Event */}
            <button onClick={handlePublish} disabled={saving || publishing}
              className={cn(
                "flex items-center gap-2 px-5 sm:px-7 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg",
                "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}>
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {publishing ? "Publishing..." : status === "published" ? "Update & Publish" : "Publish Event"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getValidationWarnings(data: FormData): string[] {
  const warnings: string[] = [];
  if (!data.title) warnings.push("Event title is required.");
  if (!data.eventType) warnings.push("Please select an event type.");
  if (!data.startDate) warnings.push("Start date is required.");
  if (!data.venueName) warnings.push("Venue name is required.");
  if (data.registrationEnabled && data.registrationDeadline && data.startDate &&
    new Date(data.registrationDeadline) >= new Date(data.startDate)) {
    warnings.push("Registration deadline must be before the event start date.");
  }
  return warnings;
}
