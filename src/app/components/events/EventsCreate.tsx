import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays, MapPin, Users, DollarSign, Image,
  CheckCircle2, ChevronRight, ChevronLeft, Sparkles, Clock,
  Globe, Lock, Building2, Heart, Music, Utensils,
  Briefcase, GraduationCap, Tent, Plus, X, Upload,
  Tag, AlertCircle, Check, Ticket, Eye, FileText,
  Zap, Star, ArrowRight, Trash2, PlusCircle, Link2,
  Save, Bookmark, XCircle, Mail,
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
import { eventService, type EventRequest } from "../../../services/events/eventService";
import { DEFAULT_REGISTRATION_FORM_CONFIG, type RegistrationFormConfig, type FormField } from "./EventRegistrationFormBuilder";
import { AgendaNotificationModal } from "./EventsPrograms";

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
  registrationFormConfig: RegistrationFormConfig;
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
  { id: 4, label: "Reg. Form",    desc: "Select form template",    icon: FileText     },
  { id: 5, label: "Budget",       desc: "Allocation & breakdown",  icon: DollarSign   },
  { id: 6, label: "Media",        desc: "Cover image & tags",      icon: Image        },
  { id: 7, label: "Review",       desc: "Verify & publish",        icon: Eye          },
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
  registrationFormConfig: { ...DEFAULT_REGISTRATION_FORM_CONFIG },
};

// shadcn theme tokens: --input-background:#f3f3f5, --border:rgba(0,0,0,0.1), --radius:0.625rem
const INPUT_CLS = "w-full px-3 py-[7px] h-auto rounded-[0.625rem] border border-black/10 bg-[#f3f3f5] text-[12.5px] text-slate-800 placeholder-slate-400 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 transition-all";

function hexRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ─── Shared sub-components ─── */
function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5 pb-4 mb-1 border-b border-slate-100">
      <div className="w-7 h-7 rounded-[0.625rem] flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
        <Icon className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
      </div>
      <div>
        <p className="text-[13px] font-semibold text-slate-800 leading-none">{title}</p>
        {subtitle && <p className="text-[11px] text-slate-400 mt-[3px]">{subtitle}</p>}
      </div>
    </div>
  );
}

function FieldLabel({ children, required, hint }: { children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.04em]">
        {children}{required && <span className="text-rose-500 ml-0.5 normal-case text-[10px]">*</span>}
      </span>
      {hint && <span className="text-[10.5px] text-slate-400 normal-case font-normal tracking-normal">{hint}</span>}
    </div>
  );
}

function ToggleRow({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 rounded-[0.625rem] border transition-all",
        checked ? "bg-indigo-50/50 border-indigo-200" : "border-slate-200"
      )}
      style={checked ? undefined : { background: "rgba(79,70,229,0.015)" }}
    >
      <div>
        <p className="text-[12px] font-medium text-slate-700">{label}</p>
        {desc && <p className="text-[10.5px] text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/* ─── Step 1: Basics ─── */
function Step1Basics({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
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
        <div className="flex flex-wrap gap-1.5">
          {EVENT_TYPES.map(t => {
            const selected = data.eventType === t.value;
            return (
              <button key={t.value} onClick={() => update("eventType", t.value)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11.5px] font-medium transition-all duration-150"
                style={{
                  borderColor: selected ? t.color : "#E2E8F0",
                  background: selected ? hexRgba(t.color, 0.08) : "#FAFAFA",
                  color: selected ? t.color : "#64748B",
                  boxShadow: selected ? `0 0 0 3px ${hexRgba(t.color, 0.12)}` : "none",
                }}>
                <t.icon className="w-[11px] h-[11px]" style={{ color: selected ? t.color : "#94A3B8" }} strokeWidth={2.2} />
                {t.label}
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
        <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-3 sm:gap-2">
          {([
            { value: "public",    label: "Public",      icon: Globe,    desc: "Anyone can view & register", color: "#059669" },
            { value: "community", label: "Community",   icon: Building2, desc: "Members only",               color: "#4f46e5" },
            { value: "invite",    label: "Invite Only", icon: Lock,      desc: "Private, by invitation",     color: "#7c3aed" },
          ] as const).map(opt => {
            const selected = data.visibility === opt.value;
            return (
              <button key={opt.value} onClick={() => update("visibility", opt.value)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[0.625rem] border text-left transition-all duration-150"
                style={{
                  borderColor: selected ? opt.color : "#E2E8F0",
                  background: selected ? hexRgba(opt.color, 0.05) : "#FAFAFA",
                  boxShadow: selected ? `0 0 0 3px ${hexRgba(opt.color, 0.10)}` : "none",
                }}>
                <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: selected ? hexRgba(opt.color, 0.14) : "#F1F5F9" }}>
                  <opt.icon className="w-3 h-3" style={{ color: selected ? opt.color : "#94A3B8" }} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[11.5px] font-semibold leading-none" style={{ color: selected ? opt.color : "#334155" }}>{opt.label}</p>
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

const FESTIVAL_AGENDA_PLACEHOLDERS: ScheduleActivity[] = [
  { id: "p1", name: "Ganesh Puja & Morning Aarti Ritual", startTime: "08:00", endTime: "09:00", description: "Traditional inauguration & morning stotram aarti" },
  { id: "p2", name: "Classical Bharatanatyam Dance & Music", startTime: "09:30", endTime: "11:00", description: "Stage performance by community troupe dancers" },
  { id: "p3", name: "Cultural Talent Hunt & Singing Competition", startTime: "11:15", endTime: "12:45", description: "Youth & adult singing and elocution competition" },
  { id: "p4", name: "Prasadam & Grand Community Lunch Feast", startTime: "13:00", endTime: "14:30", description: "Buffet dining & prasadam distribution" },
  { id: "p5", name: "Youth Sports & Rangoli Art Workshop", startTime: "15:00", endTime: "16:30", description: "Indoor badminton & rangoli competition" },
  { id: "p6", name: "Chief Guest Speech & Prize Ceremony", startTime: "17:00", endTime: "18:30", description: "Felicitation ceremony & awards distribution" },
  { id: "p7", name: "Grand Evening Musical Night & Orchestra", startTime: "19:00", endTime: "21:30", description: "Live concert & celebrity music performance" },
];

function Step2Schedule({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [notifDayLabel, setNotifDayLabel] = useState<string | undefined>(undefined);
  const [notifActivityTitle, setNotifActivityTitle] = useState<string | undefined>(undefined);

  const syncDaySchedules = (start: string, end: string) => {
    const days = getDaysBetween(start, end);
    const existing = new Map(data.daySchedules.map(ds => [ds.date, ds]));
    const synced = days.map(date => existing.get(date) ?? {
      date,
      activities: FESTIVAL_AGENDA_PLACEHOLDERS.map(p => ({ ...p, id: `a${Date.now()}-${Math.random()}` })),
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
    if (v) {
      if (data.daySchedules.length === 0) {
        const targetDate = data.startDate || new Date().toISOString().split("T")[0];
        update("daySchedules", [{
          date: targetDate,
          activities: FESTIVAL_AGENDA_PLACEHOLDERS.map(p => ({ ...p, id: `a${Date.now()}-${Math.random()}` })),
        }]);
        setExpandedDay(targetDate);
      }
    } else {
      if (data.startDate) {
        update("daySchedules", [{
          date: data.startDate,
          activities: FESTIVAL_AGENDA_PLACEHOLDERS.map(p => ({ ...p, id: `a${Date.now()}-${Math.random()}` })),
        }]);
      }
    }
  };

  const handleAddDay = () => {
    const lastDay = data.daySchedules[data.daySchedules.length - 1];
    let nextDateStr = new Date().toISOString().split("T")[0];
    if (lastDay && lastDay.date) {
      const d = new Date(lastDay.date + "T00:00:00");
      d.setDate(d.getDate() + 1);
      nextDateStr = d.toISOString().split("T")[0];
    }
    const newDay: DaySchedule = {
      date: nextDateStr,
      activities: FESTIVAL_AGENDA_PLACEHOLDERS.map(p => ({ ...p, id: `a${Date.now()}-${Math.random()}` })),
    };
    const updated = [...data.daySchedules, newDay];
    update("daySchedules", updated);
    setExpandedDay(nextDateStr);
  };

  const handleRemoveDay = (dateToRemove: string) => {
    if (data.daySchedules.length <= 1) return;
    const updated = data.daySchedules.filter(ds => ds.date !== dateToRemove);
    update("daySchedules", updated);
    if (expandedDay === dateToRemove) {
      setExpandedDay(updated[0]?.date || null);
    }
  };

  const loadFestivalPlaceholders = () => {
    const targetDate = data.startDate || new Date().toISOString().split("T")[0];
    if (data.daySchedules.length === 0) {
      update("daySchedules", [{
        date: targetDate,
        activities: FESTIVAL_AGENDA_PLACEHOLDERS.map(p => ({ ...p, id: `a${Date.now()}-${Math.random()}` })),
      }]);
      setExpandedDay(targetDate);
    } else {
      const updated = data.daySchedules.map(ds => ({
        ...ds,
        activities: FESTIVAL_AGENDA_PLACEHOLDERS.map(p => ({ ...p, id: `a${Date.now()}-${Math.random()}` })),
      }));
      update("daySchedules", updated);
    }
  };

  const triggerNotification = (dayLabel?: string, actTitle?: string) => {
    setNotifDayLabel(dayLabel);
    setNotifActivityTitle(actTitle);
    setNotifModalOpen(true);
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
    <div className="space-y-3 sm:space-y-5">
      <SectionHeader icon={CalendarDays} title="Date & Time" subtitle="When is your event happening?" />

      <ToggleRow checked={data.multiDay} onChange={handleMultiDayToggle}
        label="Multi-day event" desc="Enable to set up a day-wise schedule with activities (starts with single day, add dynamically)" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      {/* Day-wise schedule builder */}
      <div className="animate-fade-in-up pt-3 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
          <SectionHeader icon={Zap} title="Day-wise Agenda & Cultural Activities" subtitle={dayCount > 0 ? `${dayCount} day${dayCount > 1 ? "s" : ""} configured` : "Add day-wise schedule dynamically"} />
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              size="sm"
              onClick={handleAddDay}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white gap-1.5 text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Day
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={loadFestivalPlaceholders}
              className="border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 gap-1.5 text-xs font-bold rounded-xl cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Agenda Placeholders
            </Button>
            {dayCount > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={() => triggerNotification()}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 gap-1.5 text-xs font-bold rounded-xl cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" /> Notify Email
              </Button>
            )}
          </div>
        </div>

        {dayCount === 0 && (
          <div className="p-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
            <Zap className="w-6 h-6 text-indigo-400 mx-auto" />
            <div>
              <p className="text-xs font-bold text-slate-700">No Day-wise Agenda Configured</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Add Day" to add Day 1, Day 2, etc. dynamically.</p>
            </div>
            <Button
              type="button"
              onClick={handleAddDay}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs font-bold rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" /> Add Day 1
            </Button>
          </div>
        )}

        {dayCount > 0 && (
          <div className="space-y-2.5">
            {data.daySchedules.map((day, dayIdx) => {
              const isExpanded = expandedDay === day.date;
              const filledCount = day.activities.filter(a => a.name).length;
              const totalCount = day.activities.length;
              return (
                <div key={day.date}
                  className={cn(
                    "rounded-xl border overflow-hidden transition-all",
                    isExpanded ? "border-indigo-200 shadow-xs" : "border-slate-200 hover:border-slate-300"
                  )}>
                  <div className={cn(
                    "w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 transition-colors",
                    isExpanded ? "bg-indigo-50/50" : "bg-white hover:bg-slate-50"
                  )}>
                    <button onClick={() => setExpandedDay(isExpanded ? null : day.date)} className="flex items-center gap-2.5 sm:gap-3 flex-1 text-left">
                      <div className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex flex-col items-center justify-center text-white font-black shrink-0",
                        isExpanded ? "shadow-xs" : ""
                      )} style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                        <span className="text-[9px] leading-none opacity-70">DAY</span>
                        <span className="text-xs leading-none">{dayIdx + 1}</span>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-800">{formatDayLabel(day.date)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {filledCount}/{totalCount} activities configured
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); triggerNotification(`Day ${dayIdx + 1}`); }}
                        className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:text-indigo-600 hover:border-indigo-200 flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                      >
                        <Mail className="w-3 h-3 text-indigo-500" /> Notify
                      </button>
                      {data.daySchedules.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveDay(day.date); }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          title="Remove Day"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => setExpandedDay(isExpanded ? null : day.date)} className="p-1">
                        <ChevronRight className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", isExpanded && "rotate-90")} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3 sm:px-4 pb-3 pt-2 bg-white space-y-2.5 animate-fade-in-up">
                      {day.activities.map((act, actIdx) => (
                        <div key={act.id}
                          className="relative p-2.5 sm:p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2 group">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-[9px] font-black text-indigo-600">{actIdx + 1}</span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activity / Item</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {act.name && (
                                <button
                                  type="button"
                                  onClick={() => triggerNotification(`Day ${dayIdx + 1}`, act.name)}
                                  className="text-[9px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1 transition-all"
                                >
                                  <Mail className="w-2.5 h-2.5" /> Notify
                                </button>
                              )}
                              {day.activities.length > 1 && (
                                <button onClick={() => removeActivity(day.date, act.id)}
                                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all p-1 rounded hover:bg-rose-50">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-end">
                            <div>
                              <FieldLabel required>Activity / Event Title</FieldLabel>
                              <Input value={act.name} onChange={e => updateActivity(day.date, act.id, "name", e.target.value)}
                                placeholder="e.g. Aarti / Music Night" className={INPUT_CLS} />
                            </div>
                            <div className="w-24">
                              <FieldLabel required>From</FieldLabel>
                              <Input type="time" value={act.startTime} onChange={e => updateActivity(day.date, act.id, "startTime", e.target.value)}
                                className={INPUT_CLS} />
                            </div>
                            <div className="w-24">
                              <FieldLabel required>To</FieldLabel>
                              <Input type="time" value={act.endTime} onChange={e => updateActivity(day.date, act.id, "endTime", e.target.value)}
                                className={INPUT_CLS} />
                            </div>
                          </div>
                          <div>
                            <FieldLabel>Description & Location</FieldLabel>
                            <Input value={act.description} onChange={e => updateActivity(day.date, act.id, "description", e.target.value)}
                              placeholder="e.g. Main Stage" className={INPUT_CLS} />
                          </div>
                        </div>
                      ))}
                      <button onClick={() => addActivity(day.date)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-indigo-200 text-xs font-bold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer">
                        <Plus className="w-3.5 h-3.5" /> Add Activity to Day {dayIdx + 1}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bottom Add Day Button */}
            <button
              type="button"
              onClick={handleAddDay}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/40 text-xs font-bold text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4 text-indigo-600" /> Add Day {dayCount + 1} Schedule
            </button>
          </div>
        )}
      </div>

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

      {/* Agenda Notification Modal */}
      <AgendaNotificationModal
        isOpen={notifModalOpen}
        onClose={() => setNotifModalOpen(false)}
        eventName={data.title || "Community Event"}
        dayLabel={notifDayLabel}
        activityTitle={notifActivityTitle}
      />
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
  const isDeadlineInvalid = Boolean(
    data.registrationEnabled &&
    data.registrationDeadline &&
    data.startDate &&
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
              <FieldLabel hint={data.startDate ? `Must be before ${data.startDate}` : undefined}>
                Registration Deadline
              </FieldLabel>
              <Input
                type="date"
                value={data.registrationDeadline}
                max={maxDeadlineDate}
                onChange={e => update("registrationDeadline", e.target.value)}
                className={cn(
                  INPUT_CLS,
                  isDeadlineInvalid && "border-rose-500 focus-visible:ring-rose-200 bg-rose-50/20 text-rose-900 font-semibold"
                )}
              />
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

/* ─── Step 4: Form Template Selector ─── */

interface FormTemplateMeta {
  id: string;
  name: string;
  description: string;
  category: string;
  fieldsCount: number;
  icon: string;
  config: RegistrationFormConfig;
}

const FORM_TEMPLATES: FormTemplateMeta[] = [
  {
    id: "tmpl-standard",
    name: "Standard Registration",
    description: "Personal info, contact, emergency contact, dietary preferences — works for most events",
    category: "General",
    fieldsCount: 14,
    icon: "📋",
    config: {
      fields: [
        { id: "s1", type: "section", label: "Personal Information", placeholder: "", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
        { id: "f1", type: "text", label: "First Name", placeholder: "Enter first name", description: "", required: true, options: [], width: "half", validation: {}, conditional: null },
        { id: "f2", type: "text", label: "Last Name", placeholder: "Enter last name", description: "", required: true, options: [], width: "half", validation: {}, conditional: null },
        { id: "f3", type: "number", label: "Age", placeholder: "e.g. 32", description: "", required: true, options: [], width: "half", validation: { min: 0, max: 120 }, conditional: null },
        { id: "f4", type: "select", label: "Gender", placeholder: "Select gender", description: "", required: true, options: ["Male", "Female", "Other", "Prefer not to say"], width: "half", validation: {}, conditional: null },
        { id: "s2", type: "section", label: "Contact Details", placeholder: "", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
        { id: "f5", type: "email", label: "Email Address", placeholder: "your@email.com", description: "Confirmation will be sent here", required: true, options: [], width: "full", validation: {}, conditional: null },
        { id: "f6", type: "phone", label: "Mobile Number", placeholder: "+91 98765 43210", description: "", required: true, options: [], width: "full", validation: {}, conditional: null },
        { id: "f7", type: "text", label: "Address", placeholder: "Flat / Building / Street", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
        { id: "f8", type: "text", label: "City", placeholder: "City", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
        { id: "f9", type: "text", label: "Pincode", placeholder: "400069", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
        { id: "s3", type: "section", label: "Emergency Contact", placeholder: "", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
        { id: "f10", type: "text", label: "Emergency Contact Name", placeholder: "Contact person name", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
        { id: "f11", type: "phone", label: "Emergency Contact Phone", placeholder: "+91 98765 43210", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
      ] as FormField[],
      allowFamilyRegistration: true, maxFamilyMembers: 5,
      confirmationMessage: "Thank you for registering! A confirmation email will be sent shortly.",
      collectPayment: false,
    },
  },
  {
    id: "tmpl-minimal",
    name: "Quick Registration",
    description: "Just name, email, and phone — for events needing fast sign-ups",
    category: "Minimal",
    fieldsCount: 5,
    icon: "⚡",
    config: {
      fields: [
        { id: "f1", type: "text", label: "Full Name", placeholder: "Enter your full name", description: "", required: true, options: [], width: "full", validation: {}, conditional: null },
        { id: "f2", type: "email", label: "Email Address", placeholder: "your@email.com", description: "", required: true, options: [], width: "full", validation: {}, conditional: null },
        { id: "f3", type: "phone", label: "Mobile Number", placeholder: "+91 98765 43210", description: "", required: true, options: [], width: "full", validation: {}, conditional: null },
        { id: "f4", type: "number", label: "Age", placeholder: "e.g. 32", description: "", required: false, options: [], width: "half", validation: { min: 0, max: 120 }, conditional: null },
        { id: "f5", type: "select", label: "Gender", placeholder: "Select", description: "", required: false, options: ["Male", "Female", "Other"], width: "half", validation: {}, conditional: null },
      ] as FormField[],
      allowFamilyRegistration: false, maxFamilyMembers: 0,
      confirmationMessage: "You're registered! See you at the event.",
      collectPayment: false,
    },
  },
  {
    id: "tmpl-detailed",
    name: "Detailed Registration",
    description: "All fields — personal, contact, emergency, ID, dietary, medical, accessibility, apparel",
    category: "Detailed",
    fieldsCount: 22,
    icon: "📝",
    config: {
      fields: [
        { id: "s1", type: "section", label: "Personal Information", placeholder: "", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
        { id: "f1", type: "text", label: "First Name", placeholder: "First name", description: "", required: true, options: [], width: "half", validation: {}, conditional: null },
        { id: "f2", type: "text", label: "Last Name", placeholder: "Last name", description: "", required: true, options: [], width: "half", validation: {}, conditional: null },
        { id: "f3", type: "number", label: "Age", placeholder: "e.g. 32", description: "", required: true, options: [], width: "half", validation: { min: 0, max: 120 }, conditional: null },
        { id: "f4", type: "select", label: "Gender", placeholder: "Select gender", description: "", required: true, options: ["Male", "Female", "Other", "Prefer not to say"], width: "half", validation: {}, conditional: null },
        { id: "s2", type: "section", label: "Contact Details", placeholder: "", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
        { id: "f5", type: "email", label: "Email", placeholder: "your@email.com", description: "", required: true, options: [], width: "full", validation: {}, conditional: null },
        { id: "f6", type: "phone", label: "Mobile", placeholder: "+91 98765 43210", description: "", required: true, options: [], width: "full", validation: {}, conditional: null },
        { id: "f7", type: "text", label: "Address", placeholder: "Flat / Building / Street", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
        { id: "f8", type: "text", label: "City", placeholder: "City", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
        { id: "f9", type: "text", label: "Pincode", placeholder: "400069", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
        { id: "s3", type: "section", label: "Emergency Contact", placeholder: "", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
        { id: "f10", type: "text", label: "Emergency Contact Name", placeholder: "Contact name", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
        { id: "f11", type: "phone", label: "Emergency Phone", placeholder: "+91 98765 43210", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
        { id: "s4", type: "section", label: "ID Verification", placeholder: "", description: "Required for entry verification", required: false, options: [], width: "full", validation: {}, conditional: null },
        { id: "f12", type: "select", label: "ID Type", placeholder: "Select ID", description: "", required: false, options: ["Aadhaar Card", "PAN Card", "Passport", "Driving License", "Voter ID"], width: "half", validation: {}, conditional: null },
        { id: "f13", type: "text", label: "ID Number", placeholder: "ID number", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
        { id: "s5", type: "section", label: "Dietary & Medical", placeholder: "", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
        { id: "f14", type: "select", label: "Dietary Preference", placeholder: "Select", description: "", required: false, options: ["Vegetarian", "Non-Vegetarian", "Vegan", "Jain", "Eggetarian", "No Preference"], width: "half", validation: {}, conditional: null },
        { id: "f15", type: "text", label: "Allergies", placeholder: "e.g. nuts, dairy", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
        { id: "f16", type: "textarea", label: "Medical Conditions", placeholder: "Any conditions we should know about", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
        { id: "f17", type: "textarea", label: "Accessibility Needs", placeholder: "e.g. wheelchair, hearing assistance", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
      ] as FormField[],
      allowFamilyRegistration: true, maxFamilyMembers: 6,
      confirmationMessage: "Thank you for registering! A confirmation with your digital pass will be emailed shortly.",
      collectPayment: false,
    },
  },
  {
    id: "tmpl-festival",
    name: "Festival Registration",
    description: "Tailored for community festivals — family, dietary, T-shirt size, volunteer preferences",
    category: "Festival",
    fieldsCount: 18,
    icon: "🎪",
    config: {
      fields: [
        { id: "s1", type: "section", label: "Personal Information", placeholder: "", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
        { id: "f1", type: "text", label: "First Name", placeholder: "First name", description: "", required: true, options: [], width: "half", validation: {}, conditional: null },
        { id: "f2", type: "text", label: "Last Name", placeholder: "Last name", description: "", required: true, options: [], width: "half", validation: {}, conditional: null },
        { id: "f3", type: "number", label: "Age", placeholder: "e.g. 32", description: "", required: true, options: [], width: "half", validation: { min: 0, max: 120 }, conditional: null },
        { id: "f4", type: "select", label: "Gender", placeholder: "Select gender", description: "", required: true, options: ["Male", "Female", "Other"], width: "half", validation: {}, conditional: null },
        { id: "s2", type: "section", label: "Contact", placeholder: "", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
        { id: "f5", type: "email", label: "Email", placeholder: "your@email.com", description: "", required: true, options: [], width: "full", validation: {}, conditional: null },
        { id: "f6", type: "phone", label: "Mobile", placeholder: "+91 98765 43210", description: "", required: true, options: [], width: "full", validation: {}, conditional: null },
        { id: "f7", type: "text", label: "City", placeholder: "City", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
        { id: "f8", type: "text", label: "Pincode", placeholder: "400069", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
        { id: "s3", type: "section", label: "Preferences", placeholder: "", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
        { id: "f9", type: "select", label: "Dietary Preference", placeholder: "Select", description: "", required: false, options: ["Vegetarian", "Non-Vegetarian", "Vegan", "Jain", "No Preference"], width: "half", validation: {}, conditional: null },
        { id: "f10", type: "text", label: "Allergies", placeholder: "e.g. nuts, dairy, gluten", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
        { id: "f11", type: "select", label: "T-Shirt Size", placeholder: "Select size", description: "", required: false, options: ["XS", "S", "M", "L", "XL", "XXL"], width: "half", validation: {}, conditional: null },
        { id: "f12", type: "radio", label: "Volunteer?", placeholder: "", description: "Would you like to volunteer?", required: false, options: ["Yes", "No", "Maybe"], width: "half", validation: {}, conditional: null },
        { id: "s4", type: "section", label: "Emergency Contact", placeholder: "", description: "", required: false, options: [], width: "full", validation: {}, conditional: null },
        { id: "f13", type: "text", label: "Emergency Contact Name", placeholder: "Contact name", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
        { id: "f14", type: "phone", label: "Emergency Phone", placeholder: "+91 98765 43210", description: "", required: false, options: [], width: "half", validation: {}, conditional: null },
      ] as FormField[],
      allowFamilyRegistration: true, maxFamilyMembers: 5,
      confirmationMessage: "You're all set for the festival! Your digital pass will be emailed shortly.",
      collectPayment: false,
    },
  },
  {
    id: "tmpl-none",
    name: "No Registration Form",
    description: "Skip the custom form — use default registration fields only",
    category: "None",
    fieldsCount: 0,
    icon: "🚫",
    config: { ...DEFAULT_REGISTRATION_FORM_CONFIG },
  },
];

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Text", textarea: "Long Text", number: "Number", email: "Email",
  phone: "Phone", date: "Date", select: "Dropdown", multiselect: "Multi Select",
  radio: "Radio", checkbox: "Checkbox", file: "File", section: "Section", family_repeater: "Family",
};

function Step4FormTemplate({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  const [selectedId, setSelectedId] = useState<string>(
    data.registrationFormConfig.fields.length === 0 ? "tmpl-none" :
    FORM_TEMPLATES.find(t => t.config.fields.length === data.registrationFormConfig.fields.length)?.id ?? "tmpl-custom"
  );
  const [previewId, setPreviewId] = useState<string | null>(null);

  const selectTemplate = (tmpl: FormTemplateMeta) => {
    setSelectedId(tmpl.id);
    update("registrationFormConfig", { ...tmpl.config });
  };

  const previewTemplate = previewId ? FORM_TEMPLATES.find(t => t.id === previewId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-800 mb-1">Select Registration Form Template</h3>
        <p className="text-xs text-slate-500">
          Choose a form template for this event. Templates are created in{" "}
          <span className="text-indigo-600 font-medium">Events &gt; Registration &gt; Registration Forms</span>.
        </p>
      </div>

      {/* Saved Templates from Admin */}
      <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            <h4 className="text-sm font-semibold text-indigo-800">Your Saved Templates</h4>
          </div>
          <Badge variant="outline" className="text-[9px] text-indigo-500 border-indigo-200">
            Manage in Registration Forms tab
          </Badge>
        </div>
        <p className="text-[10px] text-indigo-400">
          Create custom templates with the Form Builder in Registration Forms, then select them here.
        </p>
      </div>

      {/* Built-in Templates */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700">Built-in Templates</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FORM_TEMPLATES.map(tmpl => {
            const isSelected = selectedId === tmpl.id;
            const fieldCount = tmpl.config.fields.filter(f => f.type !== "section").length;
            const reqCount = tmpl.config.fields.filter(f => f.required).length;
            return (
              <button
                key={tmpl.id}
                onClick={() => selectTemplate(tmpl)}
                className={cn(
                  "text-left p-4 rounded-xl border-2 transition-all relative group",
                  isSelected
                    ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200 shadow-sm"
                    : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                  </div>
                )}
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-2xl">{tmpl.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold", isSelected ? "text-indigo-700" : "text-slate-800")}>
                      {tmpl.name}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{tmpl.description}</p>
                  </div>
                </div>
                {tmpl.id !== "tmpl-none" && (
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-slate-400">{fieldCount} fields</span>
                    <span className="text-[10px] text-slate-400">{reqCount} required</span>
                    {tmpl.config.allowFamilyRegistration && (
                      <Badge variant="outline" className="text-[8px] py-0 text-violet-500 border-violet-200">Family</Badge>
                    )}
                    <div className="flex-1" />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setPreviewId(tmpl.id); }}
                      className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium flex items-center gap-0.5"
                    >
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Summary */}
      {selectedId !== "tmpl-none" && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
          <h4 className="text-xs font-semibold text-slate-600">Selected Template Summary</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-indigo-600">
                {data.registrationFormConfig.fields.filter(f => f.type !== "section").length}
              </p>
              <p className="text-[10px] text-slate-400">Fields</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-amber-600">
                {data.registrationFormConfig.fields.filter(f => f.required).length}
              </p>
              <p className="text-[10px] text-slate-400">Required</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-violet-600">
                {data.registrationFormConfig.allowFamilyRegistration ? `${data.registrationFormConfig.maxFamilyMembers}` : "—"}
              </p>
              <p className="text-[10px] text-slate-400">Max Family</p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setPreviewId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">{previewTemplate.icon}</span>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{previewTemplate.name}</h3>
                  <p className="text-[10px] text-slate-400">{previewTemplate.description}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPreviewId(null)}>
                <XCircle className="w-5 h-5" />
              </Button>
            </div>

            <div className="overflow-y-auto p-6 flex-1">
              <div className="space-y-3">
                {previewTemplate.config.fields.map(field => (
                  <div key={field.id}>
                    {field.type === "section" ? (
                      <div className="pt-2 pb-1 border-b border-slate-200 mb-2">
                        <h4 className="text-sm font-semibold text-slate-700">{field.label}</h4>
                        {field.description && <p className="text-[10px] text-slate-400">{field.description}</p>}
                      </div>
                    ) : (
                      <div className={cn("", field.width === "half" ? "inline-block w-[calc(50%-4px)] mr-2 align-top" : "")}>
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-xs font-medium text-slate-600">{field.label}</span>
                          {field.required && <span className="text-rose-500 text-xs">*</span>}
                          <Badge variant="outline" className="text-[8px] py-0 ml-auto">{FIELD_TYPE_LABELS[field.type] ?? field.type}</Badge>
                        </div>
                        <div className="h-8 bg-slate-50 rounded-lg border border-slate-200 px-3 flex items-center">
                          <span className="text-[10px] text-slate-400">{field.placeholder || field.label}</span>
                        </div>
                        {field.options.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {field.options.map(opt => (
                              <Badge key={opt} variant="outline" className="text-[8px]">{opt}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 flex gap-2 flex-shrink-0">
              <Button variant="outline" className="flex-1" onClick={() => setPreviewId(null)}>
                Close
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600 gap-1"
                onClick={() => { selectTemplate(previewTemplate); setPreviewId(null); }}
              >
                <CheckCircle2 className="w-4 h-4" /> Use This Template
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Step 5: Budget ─── */
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
    <div className="space-y-4 sm:space-y-7">
      <SectionHeader icon={DollarSign} title="Budget Planning" subtitle="Set a budget and allocate across categories" />

      <div>
        <FieldLabel>Total Event Budget</FieldLabel>
        <div className="relative sm:w-64">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
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
  const [imageMode, setImageMode] = useState<"upload" | "url">(data.coverImageUrl && !data.coverImageUrl.startsWith("data:") ? "url" : "upload");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        update("coverImageUrl", reader.result);
      }
    };
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
    if (t && !data.tags.includes(t)) {
      update("tags", [...data.tags, t]);
      setTagInput("");
    }
  };
  const removeTag = (t: string) => update("tags", data.tags.filter(x => x !== t));

  return (
    <div className="space-y-4 sm:space-y-7">
      <SectionHeader icon={Image} title="Cover Image & Tags" subtitle="Add visual identity and discoverability to your event" />

      <div>
        <FieldLabel>Cover Image</FieldLabel>

        {/* Upload / URL tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-4">
          <button onClick={() => setImageMode("upload")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all",
              imageMode === "upload"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}>
            <Upload className="w-3.5 h-3.5" /> Upload File
          </button>
          <button onClick={() => setImageMode("url")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all",
              imageMode === "url"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}>
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

        {/* Preview / drop zone */}
        {data.coverImageUrl ? (
          <div className="mt-3 h-52 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner relative group">
            <img src={data.coverImageUrl} alt="Cover preview" className="w-full h-full object-cover" onError={() => {}} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
              {fileName && (
                <span className="text-xs text-white/80 font-medium truncate max-w-[60%]">{fileName}</span>
              )}
              <button onClick={clearImage}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white text-xs font-bold hover:bg-white/30 transition-all">
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => imageMode === "upload" && fileInputRef.current?.click()}
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
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
              dragOver ? "bg-indigo-100" : "bg-slate-100"
            )}>
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
  if (data.registrationEnabled && data.registrationDeadline && data.startDate && new Date(data.registrationDeadline) >= new Date(data.startDate)) {
    warnings.push(`Registration deadline (${data.registrationDeadline}) must be before the event start date (${data.startDate}).`);
  }

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
      icon: FileText, title: "Registration Form", color: "#7c3aed",
      rows: [
        { label: "Fields",  value: `${data.registrationFormConfig.fields.filter(f => f.type !== "section").length} fields configured` },
        { label: "Required", value: `${data.registrationFormConfig.fields.filter(f => f.required).length} required fields` },
        { label: "Family",  value: data.registrationFormConfig.allowFamilyRegistration ? `Up to ${data.registrationFormConfig.maxFamilyMembers} members` : "Disabled" },
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
          <div className="px-3 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 border-b border-slate-100"
            style={{ background: `${sec.color}08` }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${sec.color}15` }}>
              <sec.icon className="w-3.5 h-3.5" style={{ color: sec.color }} />
            </div>
            <p className="text-xs font-black text-slate-600 uppercase tracking-widest">{sec.title}</p>
          </div>
          <div className="divide-y divide-slate-50 bg-white">
            {sec.rows.map(item => (
              <div key={item.label} className="flex items-start justify-between gap-3 sm:gap-4 px-3 sm:px-5 py-2 sm:py-3">
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

/* ─── Wizard content (shared between page and dialog) ─── */
function EventCreateWizard({ onClose, onCreated }: { onClose?: () => void; onCreated?: () => void }) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitType, setSubmitType] = useState<"published" | "draft">("published");
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishError, setPublishError] = useState("");

  let useMock = true;
  try { useMock = useEventMock().useMock; } catch {}

  const [formData, setFormData] = useState<FormData>({ ...INITIAL_FORM_DATA });

  const update = (key: keyof FormData, value: any) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  const isDeadlineInvalid = Boolean(
    formData.registrationEnabled &&
    formData.registrationDeadline &&
    formData.startDate &&
    new Date(formData.registrationDeadline) >= new Date(formData.startDate)
  );

  const handleNext = () => {
    if (step === 3 && isDeadlineInvalid) {
      setPublishError(`Registration deadline must be before the event start date (${formData.startDate}).`);
      return;
    }
    setPublishError("");
    setStep(s => Math.min(STEPS.length, s + 1));
  };

  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      setPublishError("Please enter an event title before saving as draft.");
      return;
    }
    setSavingDraft(true);
    setPublishError("");
    try {
      if (!useMock) {
        await eventService.create(toEventRequest(formData));
      }
      setSubmitType("draft");
      setSubmitted(true);
      onCreated?.();
    } catch (e: any) {
      setPublishError(e.message ?? "Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    if (!formData.title.trim()) {
      setPublishError("Event title is required before publishing.");
      return;
    }
    if (isDeadlineInvalid) {
      setPublishError(`Registration deadline must be before the event start date (${formData.startDate}).`);
      return;
    }
    setPublishing(true);
    setPublishError("");
    try {
      if (!useMock) {
        await eventService.create(toEventRequest(formData));
      }
      setSubmitType("published");
      setSubmitted(true);
      onCreated?.();
    } catch (e: any) {
      setPublishError(e.message ?? "Failed to publish event");
    } finally {
      setPublishing(false);
    }
  };

  if (submitted) {
    const isDraft = submitType === "draft";
    return (
      <div className="max-w-lg mx-auto text-center py-10 sm:py-16 animate-fade-in-up">
        <div className={cn(
          "w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 flex items-center justify-center mx-auto mb-8 shadow-md",
          isDraft
            ? "bg-amber-50 border-amber-200 text-amber-500 shadow-[0_0_0_8px_rgba(245,158,11,0.08)]"
            : "bg-emerald-50 border-emerald-200 text-emerald-500 shadow-[0_0_0_8px_rgba(16,185,129,0.08)]"
        )}>
          {isDraft ? <Bookmark className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500" /> : <Check className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-500" />}
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">
          {isDraft ? "Event Saved as Draft!" : "Event Published!"}
        </h2>
        <p className="text-slate-500 mb-10 max-w-sm mx-auto">
          <span className="font-semibold text-slate-700">"{formData.title || "Your event"}"</span> has been {isDraft ? "saved as a draft. You can edit and publish it anytime." : `created and is now ${formData.visibility === "public" ? "publicly visible" : "live for your community"}.`}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setSubmitted(false); setStep(1); setFormData({ ...INITIAL_FORM_DATA }); }}
            className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-all">
            Create Another
          </button>
          {onClose ? (
            <button onClick={onClose}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all">
              <Check className="w-4 h-4" /> Done
            </button>
          ) : (
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all">
              <Eye className="w-4 h-4" /> View Events
            </button>
          )}
        </div>
      </div>
    );
  }

  const stepComponents: Record<number, React.ReactNode> = {
    1: <Step1Basics data={formData} update={update} />,
    2: <Step2Schedule data={formData} update={update} />,
    3: <Step3Registration data={formData} update={update} />,
    4: <Step4FormTemplate data={formData} update={update} />,
    5: <Step4Budget data={formData} update={update} />,
    6: <Step5Media data={formData} update={update} />,
    7: <Step6Review data={formData} />,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>
      {/* Sticky header with step progress */}
      <div className="flex-shrink-0 border-b border-slate-100">
        {/* Title bar */}
        <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4 flex items-center justify-between"
          style={{ background: "linear-gradient(160deg, rgba(79,70,229,0.06), rgba(79,70,229,0.01) 70%, #fff)" }}>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #4f46e5, rgba(79,70,229,0.75))", boxShadow: "0 4px 12px -2px rgba(79,70,229,0.5), inset 0 1px 0 rgba(255,255,255,0.2)" }}>
              {(() => { const S = STEPS[step - 1]; return <S.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />; })()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-sm sm:text-lg font-black text-slate-900">Create New Event</h2>
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
        <div className="px-4 sm:px-8 pb-3 sm:pb-4">
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
            {STEPS.map((s, i) => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => (done || active) && setStep(s.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-[7px] rounded-[0.625rem] text-[12px] font-medium transition-all whitespace-nowrap",
                      active ? "bg-white shadow-sm border border-slate-200/80 text-slate-900"
                      : done ? "bg-[rgba(79,70,229,0.07)] text-indigo-700 cursor-pointer hover:bg-[rgba(79,70,229,0.12)]"
                      : "bg-slate-50/80 text-slate-400 cursor-default opacity-60"
                    )}>
                    {done ? (
                      <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-100 text-indigo-600">
                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className={cn(
                        "w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold",
                        active ? "bg-[#4f46e5] text-white" : "bg-slate-200 text-slate-400"
                      )}>{s.id}</span>
                    )}
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={cn("w-6 h-0.5 rounded-full mx-0.5", done ? "bg-emerald-300" : "bg-slate-200")} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2.5 mx-1 h-[3px] bg-slate-200/80 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%`, background: "#4f46e5" }} />
          </div>
        </div>
      </div>

      {/* Scrollable form content — flex-1 + min-h-0 forces height budget on mobile */}
      <div style={{ flex: "1 1 0", minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" } as React.CSSProperties} className="px-4 sm:px-8 py-4 sm:py-8">
        <div key={step} className="animate-fade-in-up max-w-5xl mx-auto">
          {stepComponents[step]}
        </div>
      </div>

      {/* Sticky footer navigation */}
      <div className="flex-shrink-0 px-4 sm:px-8 py-3 border-t border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur-sm">
        <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 rounded-[0.625rem] text-[12px] font-medium transition-all",
            step === 1 ? "opacity-0 pointer-events-none" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
          )}>
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="flex items-center gap-1">
          {STEPS.map(s => (
            <button key={s.id}
              onClick={() => (step >= s.id) && setStep(s.id)}
              className="rounded-full transition-all duration-300"
              style={{
                width: s.id === step ? 16 : 5,
                height: 5,
                background: s.id < step ? "rgba(79,70,229,0.5)" : s.id === step ? "#4f46e5" : "#E2E8F0",
              }}
            />
          ))}
        </div>

        {step < STEPS.length ? (
          <div className="flex items-center gap-2">
            <button onClick={handleSaveDraft} disabled={savingDraft || publishing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[0.625rem] text-[12px] font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50">
              <Bookmark className="w-3 h-3 text-amber-500" />
              <span>{savingDraft ? "Saving…" : "Save draft"}</span>
            </button>
            <button onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-[0.625rem] text-[12px] font-semibold text-white transition-all"
              style={{ background: "#4f46e5", boxShadow: "0 2px 10px -2px rgba(79,70,229,0.55)" }}>
              Next step <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {publishError && <span className="text-[11px] text-rose-600 font-medium max-w-[160px] truncate">{publishError}</span>}
            <button onClick={handleSaveDraft} disabled={savingDraft || publishing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[0.625rem] text-[12px] font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50">
              <Bookmark className="w-3 h-3 text-amber-500" />
              <span>{savingDraft ? "Saving…" : "Save draft"}</span>
            </button>
            <button onClick={handlePublish} disabled={publishing || savingDraft}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-[0.625rem] text-[12px] font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: "#059669", boxShadow: "0 2px 10px -2px rgba(5,150,105,0.45)" }}>
              <Check className="w-3.5 h-3.5" /> {publishing ? "Publishing…" : "Publish event"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Dialog wrapper — uses createPortal for full mobile scroll control ─── */
export function CreateEventDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  // Lock body scroll when open, restore on close
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={() => onOpenChange(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 9998,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />
      {/* Modal panel */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            background: "#fff",
            width: "100%",
            maxWidth: "54rem",  /* max-w-4xl */
            /* Mobile: full screen; tablet/desktop: bounded compact */
            height: "100dvh",
            maxHeight: "92dvh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.06), 0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 50px -12px rgba(79,70,229,0.22)",
            borderRadius: 0,
          }}
          className="sm:rounded-2xl sm:h-[min(90vh,760px)] sm:max-h-[92vh] sm:m-3 md:m-4 sm:border sm:border-slate-200/60 sm:ring-1 sm:ring-black/5 animate-fade-in-up"
          onClick={e => e.stopPropagation()}
        >
          <EventCreateWizard
            onClose={() => onOpenChange(false)}
            onCreated={() => {}}
          />
        </div>
      </div>
    </>,
    document.body
  );
}

export function CreateEventButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        className={cn(
          "flex items-center justify-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-xs hover:shadow-sm hover:from-indigo-700 hover:to-violet-600 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0",
          className
        )}>
        <PlusCircle className="w-3.5 h-3.5 text-indigo-100 shrink-0" />
        <span>Create Event</span>
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
