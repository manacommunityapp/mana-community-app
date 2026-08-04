// TODO: wire to eventService
import { useState } from "react";
import {
  CalendarDays, MapPin, Users, DollarSign, Image,
  CheckCircle2, ChevronRight, ChevronLeft, Sparkles, Clock,
  Globe, Lock, Building2, Heart, Music, Utensils,
  Briefcase, GraduationCap, Tent, Plus, X, Upload,
  Tag, AlertCircle, Check, Ticket, Eye, FileText,
  Zap, Star, ArrowRight, Trash2, PlusCircle,
} from "lucide-react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogOverlay, DialogPortal } from "../ui/dialog";
import { cn } from "../ui/utils";

/* ─── Types ─── */
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

const STEPS = [
  { id: 1, label: "Basics",       desc: "Name, type & visibility", icon: CalendarDays },
  { id: 2, label: "Schedule",     desc: "Date, time & venue",      icon: Clock        },
  { id: 3, label: "Registration", desc: "Tickets & categories",    icon: Ticket       },
  { id: 4, label: "Budget",       desc: "Allocation & breakdown",  icon: DollarSign   },
  { id: 5, label: "Media",        desc: "Cover image & tags",      icon: Image        },
  { id: 6, label: "Review",       desc: "Verify & publish",        icon: Eye          },
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
  ticketTypes: DEFAULT_TICKET_TYPES,
  requireApproval: false, allowWaitlist: true,
  totalBudget: "", budgetItems: DEFAULT_BUDGET_ITEMS,
  coverImageUrl: "", tags: [],
};

const INPUT_CLS = "w-full px-4 py-3 h-auto rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 outline-none focus-visible:border-indigo-400 focus-visible:ring-4 focus-visible:ring-indigo-50 transition-all";

/* ─── Shared sub-components ─── */
function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
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
      "flex items-center justify-between p-4 rounded-xl border transition-all",
      checked ? "bg-indigo-50/50 border-indigo-200" : "bg-slate-50 border-slate-100"
    )}>
      <div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {desc && <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/* ─── Step 1: Basics ─── */
function Step1Basics({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  return (
    <div className="space-y-7">
      <SectionHeader icon={FileText} title="Event Details" subtitle="Give your event a name and describe what it's about" />

      <div>
        <FieldLabel required>Event Title</FieldLabel>
        <Input value={data.title} onChange={e => update("title", e.target.value)}
          placeholder="e.g. Ganesh Chaturthi 2026 – Grand Celebration"
          className={cn(INPUT_CLS, "text-base font-medium")} />
      </div>

      <div>
        <FieldLabel required>Event Type</FieldLabel>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
          {EVENT_TYPES.map(t => {
            const selected = data.eventType === t.value;
            return (
              <button key={t.value} onClick={() => update("eventType", t.value)}
                className={cn(
                  "flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 text-center transition-all",
                  selected
                    ? "border-indigo-500 shadow-[0_2px_16px_rgba(99,102,241,0.2)] scale-[1.02]"
                    : "border-transparent bg-white hover:border-slate-200 hover:shadow-sm"
                )}
                style={{ background: selected ? t.bg : undefined }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform"
                  style={{ background: selected ? `${t.color}25` : "#f1f5f9" }}>
                  <t.icon className="w-5 h-5" style={{ color: t.color }} />
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
        <div className="grid grid-cols-3 gap-3">
          {([
            { value: "public",    label: "Public",      icon: Globe,    desc: "Anyone can view & register", color: "#059669" },
            { value: "community", label: "Community",   icon: Building2, desc: "Members only",               color: "#4f46e5" },
            { value: "invite",    label: "Invite Only", icon: Lock,      desc: "Private, by invitation",     color: "#7c3aed" },
          ] as const).map(opt => {
            const selected = data.visibility === opt.value;
            return (
              <button key={opt.value} onClick={() => update("visibility", opt.value)}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all group",
                  selected
                    ? "border-indigo-400 bg-indigo-50/60 shadow-sm"
                    : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
                )}>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-colors",
                  selected ? "bg-indigo-100" : "bg-slate-100 group-hover:bg-slate-50")}>
                  <opt.icon className="w-4 h-4" style={{ color: selected ? opt.color : "#94a3b8" }} />
                </div>
                <p className={cn("text-sm font-bold", selected ? "text-indigo-700" : "text-slate-700")}>{opt.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 2: Schedule ─── */
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

function Step2Schedule({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
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
    if (v && data.startDate && data.endDate) {
      syncDaySchedules(data.startDate, data.endDate);
    } else if (!v) {
      update("daySchedules", []);
    }
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
    <div className="space-y-7">
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

      {/* Multi-day schedule builder */}
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
                <div key={day.date}
                  className={cn(
                    "rounded-2xl border overflow-hidden transition-all",
                    isExpanded ? "border-indigo-200 shadow-[0_4px_20px_rgba(99,102,241,0.08)]" : "border-slate-200 hover:border-slate-300"
                  )}>
                  <button onClick={() => setExpandedDay(isExpanded ? null : day.date)}
                    className={cn(
                      "w-full flex items-center justify-between px-5 py-4 transition-colors",
                      isExpanded ? "bg-indigo-50/50" : "bg-white hover:bg-slate-50"
                    )}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-11 h-11 rounded-xl flex flex-col items-center justify-center text-white font-black",
                        isExpanded ? "shadow-md" : ""
                      )} style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                        <span className="text-[10px] leading-none opacity-70">DAY</span>
                        <span className="text-sm leading-none">{dayIdx + 1}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-800">{formatDayLabel(day.date)}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {filledCount}/{totalCount} activities filled
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {filledCount === totalCount && totalCount > 0 && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                      <ChevronRight className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", isExpanded && "rotate-90")} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 bg-white space-y-3 animate-fade-in-up">
                      {day.activities.map((act, actIdx) => (
                        <div key={act.id}
                          className="relative p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3 group">
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
                                placeholder="e.g. Opening Ceremony, Cultural Program" className={INPUT_CLS} />
                            </div>
                            <div className="w-28">
                              <FieldLabel required>From</FieldLabel>
                              <Input type="time" value={act.startTime} onChange={e => updateActivity(day.date, act.id, "startTime", e.target.value)}
                                className={INPUT_CLS} />
                            </div>
                            <div className="w-28">
                              <FieldLabel required>To</FieldLabel>
                              <Input type="time" value={act.endTime} onChange={e => updateActivity(day.date, act.id, "endTime", e.target.value)}
                                className={INPUT_CLS} />
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

      {/* Venue */}
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

/* ─── Step 3: Registration ─── */
function Step3Registration({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  const addTicket = () => {
    const newTicket: TicketType = { id: `t${Date.now()}`, name: "", price: "0", qty: "", description: "" };
    update("ticketTypes", [...data.ticketTypes, newTicket]);
  };
  const removeTicket = (id: string) => update("ticketTypes", data.ticketTypes.filter(t => t.id !== id));
  const updateTicket = (id: string, field: keyof TicketType, value: string) =>
    update("ticketTypes", data.ticketTypes.map(t => t.id === id ? { ...t, [field]: value } : t));

  const totalSeats = data.ticketTypes.reduce((s, t) => s + (parseInt(t.qty) || 0), 0);

  return (
    <div className="space-y-7">
      <SectionHeader icon={Ticket} title="Registration Settings" subtitle="Configure how attendees can register for your event" />

      <ToggleRow checked={data.registrationEnabled} onChange={v => update("registrationEnabled", v)}
        label="Enable event registration" desc="Allow attendees to register for this event" />

      {data.registrationEnabled && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Registration Deadline</FieldLabel>
              <Input type="date" value={data.registrationDeadline} onChange={e => update("registrationDeadline", e.target.value)} className={INPUT_CLS} />
            </div>
            <div className="flex items-end pb-1">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
                <Users className="w-4 h-4 text-indigo-500" />
                <input
                  type="number"
                  value={totalSeats || ""}
                  onChange={e => {
                    const newTotal = parseInt(e.target.value) || 0;
                    if (newTotal < 0) return;
                    const tickets = data.ticketTypes;
                    if (tickets.length === 0) return;
                    const oldTotal = totalSeats;
                    if (oldTotal === 0) {
                      const perTicket = Math.floor(newTotal / tickets.length);
                      const remainder = newTotal % tickets.length;
                      update("ticketTypes", tickets.map((t, i) => ({
                        ...t,
                        qty: String(perTicket + (i < remainder ? 1 : 0)),
                      })));
                    } else {
                      const ratio = newTotal / oldTotal;
                      let distributed = 0;
                      const updated = tickets.map((t, i) => {
                        const oldQty = parseInt(t.qty) || 0;
                        const isLast = i === tickets.length - 1;
                        const newQty = isLast
                          ? newTotal - distributed
                          : Math.round(oldQty * ratio);
                        distributed += isLast ? 0 : newQty;
                        return { ...t, qty: String(Math.max(0, newQty)) };
                      });
                      update("ticketTypes", updated);
                    }
                  }}
                  placeholder="0"
                  className="w-16 bg-transparent text-sm font-bold text-indigo-700 outline-none text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
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
                  className="p-5 bg-white rounded-xl border border-slate-200 space-y-4 hover:border-slate-300 transition-colors group animate-fade-in-up">
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
                      <FieldLabel>Price (₹)</FieldLabel>
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

/* ─── Step 4: Budget ─── */
function Step4Budget({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  const addItem = () => update("budgetItems", [...data.budgetItems, { id: `b${Date.now()}`, category: "", amount: "" }]);
  const removeItem = (id: string) => update("budgetItems", data.budgetItems.filter(b => b.id !== id));
  const updateItem = (id: string, field: keyof BudgetItem, value: string) =>
    update("budgetItems", data.budgetItems.map(b => b.id === id ? { ...b, [field]: value } : b));

  const totalAllocated = data.budgetItems.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
  const totalBudgetNum = parseFloat(data.totalBudget) || 0;
  const pct = totalBudgetNum > 0 ? Math.min(100, (totalAllocated / totalBudgetNum) * 100) : 0;
  const remaining = totalBudgetNum - totalAllocated;

  return (
    <div className="space-y-7">
      <SectionHeader icon={DollarSign} title="Budget Planning" subtitle="Set a budget and allocate across categories" />

      <div>
        <FieldLabel required>Total Event Budget</FieldLabel>
        <div className="relative sm:w-64">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
          <Input type="number" value={data.totalBudget} onChange={e => update("totalBudget", e.target.value)}
            placeholder="e.g. 500000" className={cn(INPUT_CLS, "pl-8 text-base font-semibold")} />
        </div>
      </div>

      {totalBudgetNum > 0 && (
        <div className="p-5 rounded-2xl border border-indigo-100 animate-fade-in-up"
          style={{ background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Budget Utilization</p>
              <p className="text-2xl font-black text-indigo-700 mt-1">₹{totalAllocated.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400">Remaining</p>
              <p className={cn("text-lg font-black", remaining >= 0 ? "text-emerald-600" : "text-rose-600")}>
                ₹{Math.abs(remaining).toLocaleString()}
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
            <div key={item.id} className="flex items-center gap-3 animate-fade-in-up group">
              <Select value={item.category} onValueChange={v => updateItem(item.id, "category", v)}>
                <SelectTrigger className="flex-1 h-auto px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus-visible:border-indigo-400">
                  <SelectValue placeholder="Select category…" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="w-40 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₹</span>
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

/* ─── Step 5: Media ─── */
function Step5Media({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  const [tagInput, setTagInput] = useState("");
  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !data.tags.includes(t)) {
      update("tags", [...data.tags, t]);
      setTagInput("");
    }
  };
  const removeTag = (t: string) => update("tags", data.tags.filter(x => x !== t));

  return (
    <div className="space-y-7">
      <SectionHeader icon={Image} title="Cover Image & Tags" subtitle="Add visual identity and discoverability to your event" />

      <div>
        <FieldLabel>Cover Image URL</FieldLabel>
        <Input value={data.coverImageUrl} onChange={e => update("coverImageUrl", e.target.value)}
          placeholder="https://images.unsplash.com/…" className={INPUT_CLS} />
        {data.coverImageUrl ? (
          <div className="mt-3 h-52 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner relative group">
            <img src={data.coverImageUrl} alt="Cover preview" className="w-full h-full object-cover" onError={() => {}} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ) : (
          <div className="mt-3 h-52 rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/20 transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
              <Upload className="w-6 h-6 text-slate-300 group-hover:text-indigo-400 transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-400 font-medium">Paste an image URL above</p>
              <p className="text-[10px] text-slate-300 mt-0.5">The preview will appear here</p>
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

/* ─── Step 6: Review ─── */
function Step6Review({ data }: { data: FormData }) {
  const eventType = EVENT_TYPES.find(t => t.value === data.eventType);
  const totalBudget = parseFloat(data.totalBudget) || 0;
  const totalAllocated = data.budgetItems.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);

  const warnings: string[] = [];
  if (!data.title) warnings.push("Event title is required.");
  if (!data.eventType) warnings.push("Please select an event type.");
  if (!data.startDate) warnings.push("Start date is required.");
  if (!data.venueName) warnings.push("Venue name is required.");

  const reviewSections = [
    {
      icon: FileText, title: "Event Basics", color: "#4f46e5",
      rows: [
        { label: "Title",      value: data.title || "—"       },
        { label: "Type",       value: eventType?.label || "—"  },
        { label: "Visibility", value: data.visibility.charAt(0).toUpperCase() + data.visibility.slice(1) },
      ],
    },
    {
      icon: CalendarDays, title: "Schedule & Venue", color: "#7c3aed",
      rows: [
        { label: "Date",     value: data.startDate ? `${data.startDate}${data.multiDay && data.endDate ? ` → ${data.endDate}` : ""}` : "—" },
        { label: "Time",     value: data.startTime ? `${data.startTime} – ${data.endTime}` : "—" },
        { label: "Venue",    value: data.venueName ? `${data.venueName}, ${data.city}` : "—" },
        { label: "Capacity", value: data.capacity ? `${parseInt(data.capacity).toLocaleString()} seats` : "—" },
      ],
    },
    ...(data.multiDay && data.daySchedules.length > 0 ? [{
      icon: Zap as React.ElementType, title: "Day-wise Schedule", color: "#0891b2",
      rows: data.daySchedules.map((ds, i) => ({
        label: `Day ${i + 1}`,
        value: ds.activities.filter(a => a.name).map(a => `${a.startTime}–${a.endTime} ${a.name}`).join(" · ") || "No activities",
      })),
    }] : []),
    {
      icon: Ticket, title: "Registration", color: "#059669",
      rows: [
        { label: "Status",     value: data.registrationEnabled ? "Enabled" : "Disabled" },
        ...(data.registrationEnabled ? [
          { label: "Categories", value: data.ticketTypes.filter(t => t.name).map(t => `${t.name} (₹${t.price})`).join(", ") || "—" },
          { label: "Deadline",   value: data.registrationDeadline || "—" },
          { label: "Approval",   value: data.requireApproval ? "Required" : "Auto-approve" },
          { label: "Waitlist",   value: data.allowWaitlist ? "Enabled" : "Disabled" },
        ] : []),
      ],
    },
    {
      icon: DollarSign, title: "Budget", color: "#d97706",
      rows: [
        { label: "Total Budget",    value: totalBudget ? `₹${totalBudget.toLocaleString()}` : "—" },
        { label: "Allocated",       value: totalAllocated ? `₹${totalAllocated.toLocaleString()}` : "—" },
        ...(data.budgetItems.filter(b => b.category && b.amount).map(b => ({
          label: b.category, value: `₹${parseFloat(b.amount).toLocaleString()}`,
        }))),
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {warnings.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 animate-fade-in-up">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800 mb-1">Complete these before publishing:</p>
            <ul className="space-y-0.5">
              {warnings.map(w => <li key={w} className="text-xs text-amber-700 flex items-center gap-1.5"><ArrowRight className="w-3 h-3" />{w}</li>)}
            </ul>
          </div>
        </div>
      )}

      {reviewSections.map((sec, secIdx) => (
        <div key={sec.title} className={cn("rounded-2xl border border-slate-200 overflow-hidden animate-fade-in-up", `stagger-${Math.min(secIdx + 1, 8)}`)}>
          <div className="px-5 py-3 flex items-center gap-3 border-b border-slate-100"
            style={{ background: `${sec.color}08` }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${sec.color}15` }}>
              <sec.icon className="w-3.5 h-3.5" style={{ color: sec.color }} />
            </div>
            <p className="text-xs font-black text-slate-600 uppercase tracking-widest">{sec.title}</p>
          </div>
          <div className="divide-y divide-slate-50 bg-white">
            {sec.rows.map(item => (
              <div key={item.label} className="flex items-start justify-between gap-4 px-5 py-3">
                <span className="text-xs font-semibold text-slate-400 flex-shrink-0 w-28">{item.label}</span>
                <span className="text-sm font-medium text-slate-800 text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {data.coverImageUrl && (
        <div className="h-36 rounded-2xl overflow-hidden border border-slate-200 shadow-inner animate-fade-in-up">
          <img src={data.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
        </div>
      )}

      {data.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-fade-in-up">
          {data.tags.map(t => (
            <Badge key={t} variant="outline" className="px-3 py-1 bg-indigo-50 border-indigo-200 text-indigo-700 text-xs font-bold rounded-full">
              #{t}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Wizard content (shared between page and dialog) ─── */
function EventCreateWizard({ onClose, onCreated }: { onClose?: () => void; onCreated?: () => void }) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState<FormData>({ ...INITIAL_FORM_DATA });

  const update = (key: keyof FormData, value: any) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  const handlePublish = () => {
    setSubmitted(true);
    onCreated?.();
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-fade-in-up">
        <div className="w-24 h-24 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-8
          shadow-[0_0_0_8px_rgba(16,185,129,0.08),0_0_0_16px_rgba(16,185,129,0.04)]">
          <Check className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-3">Event Created!</h2>
        <p className="text-slate-500 mb-10 max-w-sm mx-auto">
          <span className="font-semibold text-slate-700">"{formData.title || "Your event"}"</span> has been created
          and is now {formData.visibility === "public" ? "publicly visible" : "live for your community"}.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setSubmitted(false); setStep(1); setFormData({ ...INITIAL_FORM_DATA }); }}
            className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-all">
            Create Another
          </button>
          {onClose ? (
            <button onClick={onClose}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all">
              <Check className="w-4 h-4" /> Done
            </button>
          ) : (
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all">
              <Eye className="w-4 h-4" /> View Event
            </button>
          )}
        </div>
      </div>
    );
  }

  const stepComponents: Record<number, JSX.Element> = {
    1: <Step1Basics data={formData} update={update} />,
    2: <Step2Schedule data={formData} update={update} />,
    3: <Step3Registration data={formData} update={update} />,
    4: <Step4Budget data={formData} update={update} />,
    5: <Step5Media data={formData} update={update} />,
    6: <Step6Review data={formData} />,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header with step progress */}
      <div className="flex-shrink-0 border-b border-slate-100">
        {/* Title bar */}
        <div className="px-6 sm:px-8 pt-6 pb-4 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #eef2ff 0%, #faf5ff 40%, #ffffff 100%)" }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md"
              style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
              {(() => { const S = STEPS[step - 1]; return <S.icon className="w-6 h-6 text-white" />; })()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black text-slate-900">Create New Event</h2>
                {formData.title && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-600 max-w-[180px] truncate">
                    <Sparkles className="w-3 h-3 flex-shrink-0" /> {formData.title}
                  </span>
                )}
              </div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em] mt-0.5">
                Step {step} of {STEPS.length} — {STEPS[step - 1].desc}
              </p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step pills */}
        <div className="px-6 sm:px-8 pb-4">
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
            {STEPS.map((s, i) => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => (done || active) && setStep(s.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                      active ? "bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-[0_2px_12px_rgba(99,102,241,0.25)]"
                      : done ? "bg-emerald-50 text-emerald-700 cursor-pointer hover:bg-emerald-100"
                      : "bg-slate-50 text-slate-400 cursor-default"
                    )}>
                    {done ? <Check className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={cn("w-6 h-0.5 rounded-full mx-0.5", done ? "bg-emerald-300" : "bg-slate-200")} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-500 ease-out"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Scrollable form content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-6 sm:px-8 py-8">
        <div key={step} className="animate-fade-in-up max-w-3xl mx-auto">
          {stepComponents[step]}
        </div>
      </div>

      {/* Sticky footer navigation */}
      <div className="flex-shrink-0 px-6 sm:px-8 py-4 border-t border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-sm">
        <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
            step === 1 ? "text-slate-300 cursor-not-allowed" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-sm"
          )}>
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-1.5">
          {STEPS.map(s => (
            <div key={s.id} className={cn(
              "w-2 h-2 rounded-full transition-all",
              step === s.id ? "bg-indigo-500 w-6" : step > s.id ? "bg-emerald-400" : "bg-slate-200"
            )} />
          ))}
        </div>

        {step < STEPS.length ? (
          <button onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-sm hover:shadow-md hover:from-indigo-700 hover:to-violet-600 transition-all">
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handlePublish}
            className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all">
            <Sparkles className="w-4 h-4" /> Publish Event
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Dialog wrapper ─── */
export function CreateEventDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/40 backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[min(92vh,900px)] flex flex-col overflow-hidden animate-fade-in-up
            border border-slate-200/60 ring-1 ring-black/5 pointer-events-auto"
            onWheel={e => e.stopPropagation()}>
            <EventCreateWizard
              onClose={() => onOpenChange(false)}
              onCreated={() => {}}
            />
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}

/* ─── Standalone trigger button (for use anywhere) ─── */
export function CreateEventButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-sm hover:shadow-md hover:from-indigo-700 hover:to-violet-600 transition-all",
          className
        )}>
        <PlusCircle className="w-4 h-4" /> Create Event
      </button>
      <CreateEventDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

/* ─── Route-compatible page export (backward compat with /events/create) ─── */
export function EventsCreate() {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: "600px" }}>
      <EventCreateWizard />
    </div>
  );
}
