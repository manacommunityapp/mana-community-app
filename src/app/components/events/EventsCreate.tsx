import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays, MapPin, Users, IndianRupee, Image,
  CheckCircle2, ChevronRight, ChevronLeft, Sparkles, Clock,
  Globe, Lock, Building2, Heart, Music, Utensils,
  Briefcase, GraduationCap, Tent, Plus, X, Upload,
  Tag, AlertCircle, Check, Ticket, Eye, FileText,
  Zap, Star, ArrowRight, Trash2, PlusCircle, Link2,
  Save, Bookmark, XCircle, Mail, CreditCard, QrCode, Phone, User, Info,
} from "lucide-react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { SectionHeader, FieldLabel, ToggleRow } from "./shared";

import { cn } from "../ui/utils";
import { useAuth } from "../../../contexts/AuthContext";
import { CREATE_EVENT, MANAGE_EVENT_DASHBOARD } from "../../../constants/permissions";
import { useEventMock } from "./EventMockToggle";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import { eventService, type EventRequest } from "../../../services/events/eventService";
import { fileUploadService } from "../../../services/files/fileUploadService";
import { DEFAULT_REGISTRATION_FORM_CONFIG, GANESH_CHATURTHI_FORM_CONFIG, type RegistrationFormConfig, type FormField } from "./EventRegistrationFormBuilder";
import { AgendaNotificationModal } from "./EventsPrograms";

/* ─── Types ─── */
export interface EventContactItem {
  id: string;
  name: string;
  phone: string;
  role: string;
  notes?: string;
  email?: string;
}

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
  enableOnlinePayment: boolean;
  paymentModes?: string[];
  upiId: string;
  scannerUrl: string;
  notes: string;
  paymentInstructions: string;
  contacts: EventContactItem[];
}

interface TicketType { id: string; name: string; price: string; qty: string; description: string; }
interface BudgetItem { id: string; category: string; amount: string; }
export interface ScheduleActivity {
  id: string;
  categoryType: string; // "Pooja & Seva" | "Lunch" | "Dinner" | "Cultural Events" | "Competitions" | "Other"
  customType?: string;
  name: string;
  needsRegistration: boolean;
  registrationFee?: string;
  slots?: string;
  startTime: string;
  endTime: string;
  description: string;
  venue?: string;
}
export interface DaySchedule { date: string; activities: ScheduleActivity[]; }

export const ACTIVITY_CATEGORY_OPTIONS = [
  { value: "Pooja & Seva",      label: "Pooja & Seva",        icon: "🪔", color: "#f59e0b" },
  { value: "Lunch",             label: "Lunch",               icon: "🍛", color: "#10b981" },
  { value: "Dinner",            label: "Dinner",              icon: "🍲", color: "#06b6d4" },
  { value: "Cultural Events",   label: "Cultural Events",     icon: "🎭", color: "#8b5cf6" },
  { value: "Competitions",      label: "Competitions",        icon: "🏆", color: "#ec4899" },
  { value: "Other",             label: "Other / Custom Type", icon: "✨", color: "#64748b" },
];

export const PRESET_ACTIVITY_TITLES: Record<string, string[]> = {
  "Pooja & Seva": [
    "Maha Ganapathi Homam & Sankalpam",
    "Sahasranama Archana & Deeparadhana",
    "Rudrabhishekam & Panchamruta Snanam",
    "Sri Satyanarayana Swamy Vratham",
    "Navagraha Homam & Shanti Pooja",
    "Mahamangal Aarti & Prasadam Distribution",
  ],
  "Lunch": [
    "Community Mahaprasadam Lunch (Annadanam)",
    "Grand Festive Feast Lunch",
    "Sponsor & VIP Bhojan Lunch",
    "Temple Kitchen Sattvic Lunch",
  ],
  "Dinner": [
    "Community Mahaprasadam Dinner",
    "Evening Sandhya Bhojan",
    "Special Grand Bhoj Dinner",
    "Prasadam Distribution & Dinner",
  ],
  "Cultural Events": [
    "Bharatanatyam / Classical Dance Recital",
    "Devotional Bhajan & Kirtan Sandhya",
    "Carnatic & Hindustani Vocal Ensemble",
    "Mythological Drama & Natya Mahotsav",
    "Kids Traditional Fancy Dress & Talent Show",
    "Folk Dance & Garba Raas Mahotsav",
  ],
  "Competitions": [
    "Eco-Friendly Clay Ganesha Making Contest",
    "Traditional Rangoli & Kolam Contest",
    "Devotional Stotram & Shloka Chanting",
    "Vedic Heritage & Epics Quiz (Youth)",
    "Drawing & Painting Competition (Kids)",
    "Classical Vocal Music Contest",
  ],
};

export async function syncActivitiesToScheduleSubmodules(
  daySchedules: DaySchedule[],
  mainEventTitle: string,
  eventId?: number | string
) {
  const numericEventId = typeof eventId === "number" ? eventId : Number(String(eventId || "").replace(/\D/g, "")) || 1;

  for (const day of daySchedules) {
    for (const act of day.activities) {
      if (!act.name || !act.name.trim()) continue;
      const cat = act.categoryType || "Other";
      const feeNum = parseFloat(act.registrationFee || "0") || 0;
      const slotsNum = parseInt(act.slots || "50", 10) || 50;

      if (cat === "Pooja & Seva") {
        const payload = {
          mainEventId: numericEventId,
          name: act.name,
          type: "Pooja",
          date: day.date,
          startTime: act.startTime || "08:30",
          mandap: act.description || act.venue || "Main Temple Mandap",
          slots: String(slotsNum),
          fee: String(feeNum),
          isFree: feeNum === 0,
          items: ["Coconut", "Flowers", "Samagri"],
          notes: act.description || "",
        };
        try {
          await eventService.createPoojaSeva(payload);
        } catch (e) {
          console.warn("Database save pooja notice:", e);
        }
      } else if (cat === "Lunch" || cat === "Dinner") {
        const payload = {
          mainEventId: numericEventId,
          name: act.name,
          mealType: cat,
          date: day.date,
          startTime: act.startTime || (cat === "Lunch" ? "12:00" : "19:00"),
          endTime: act.endTime || (cat === "Lunch" ? "14:00" : "21:00"),
          venue: act.description || act.venue || "Community Dining Hall",
          targetPlates: slotsNum,
          dietType: "Vegetarian",
          fee: feeNum,
          isFree: feeNum === 0,
          menuItems: ["Mahaprasadam Meal", "Rice", "Curry", "Sweet"],
          notes: act.description || "",
        };
        try {
          await eventService.createLunchDinner(payload);
        } catch (e) {
          console.warn("Database save meal notice:", e);
        }
      } else if (cat === "Cultural Events") {
        const payload = {
          mainEventId: numericEventId,
          name: act.name,
          category: "Classical Dance & Music",
          date: day.date,
          startTime: act.startTime || "18:00",
          stage: act.description || act.venue || "Main Stage",
          requirements: "Sound system & lighting",
          fee: feeNum,
          isFree: feeNum === 0,
        };
        try {
          await eventService.createCulturalEvent(payload);
        } catch (e) {
          console.warn("Database save cultural notice:", e);
        }
      } else if (cat === "Competitions") {
        const payload = {
          mainEventId: numericEventId,
          name: act.name,
          category: "Art & Talent",
          ageGroup: "Open",
          date: day.date,
          startTime: act.startTime || "10:00",
          venue: act.description || act.venue || "Auditorium",
          fee: String(feeNum),
          isFree: feeNum === 0,
          maxParticipants: String(slotsNum),
        };
        try {
          await eventService.createCompetition(payload);
        } catch (e) {
          console.warn("Database save competition notice:", e);
        }
      }
    }
  }
}

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
  { id: 1, label: "Basics",             desc: "Name, type & visibility",       icon: CalendarDays },
  { id: 2, label: "Schedule",           desc: "Date, time & venue",            icon: Clock        },
  { id: 3, label: "Registration",       desc: "Tickets & categories",          icon: Ticket       },
  { id: 4, label: "Payment & Contacts", desc: "Payment modes, QR & contacts", icon: CreditCard   },
  { id: 5, label: "Reg. Form",          desc: "Select form template",          icon: FileText     },
  { id: 6, label: "Budget",             desc: "Allocation & breakdown",        icon: IndianRupee   },
  { id: 7, label: "Media",              desc: "Cover image & tags",            icon: Image        },
  { id: 8, label: "Review",             desc: "Verify & publish",              icon: Eye          },
];

const BUDGET_CATEGORIES = ["Venue", "Food & Catering", "Decoration", "Audio / Visual", "Security", "Marketing", "Transport", "Volunteers", "Medical", "Other"];

const DEFAULT_TICKET_TYPES: TicketType[] = [
  { id: "t1", name: "General",   price: "0",   qty: "100", description: "Open for all community members" },
  { id: "t2", name: "Volunteer", price: "0",   qty: "50",  description: "Volunteer registration & duty pass" },
];

const DEFAULT_BUDGET_ITEMS: BudgetItem[] = [
  { id: "b1", category: "Venue",            amount: "" },
  { id: "b2", category: "Food & Catering",  amount: "" },
  { id: "b3", category: "Decoration",       amount: "" },
];

const DEFAULT_CONTACTS: EventContactItem[] = [
  { id: "c1", name: "", phone: "", role: "Event Lead / Main Coordinator", notes: "" },
];

const INITIAL_FORM_DATA: FormData = {
  title: "", eventType: "festival", category: "Festival", description: "",
  visibility: "community",
  startDate: "", endDate: "", startTime: "", endTime: "",
  multiDay: false, daySchedules: [], venueName: "", venueAddress: "", city: "", capacity: "",
  registrationEnabled: true, registrationDeadline: "",
  ticketTypes: DEFAULT_TICKET_TYPES,
  requireApproval: false, allowWaitlist: false,
  totalBudget: "", budgetItems: DEFAULT_BUDGET_ITEMS,
  coverImageUrl: "", tags: [],
  registrationFormConfig: { ...GANESH_CHATURTHI_FORM_CONFIG },
  enableOnlinePayment: true,
  paymentModes: ["UPI", "Card", "Cash"],
  upiId: "",
  scannerUrl: "",
  notes: "",
  paymentInstructions: "Please scan the QR code using any UPI app (GPay, PhonePe, Paytm) and save the transaction screenshot/UTR.",
  contacts: DEFAULT_CONTACTS,
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

function persistedMediaUrl(url?: string | null): string | undefined {
  const trimmed = (url || "").trim();
  if (!trimmed || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return undefined;
  return trimmed;
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

      {/* Description & Visibility Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Description */}
        <div className="flex flex-col">
          <FieldLabel required hint={`${data.description.length}/1000`}>Description</FieldLabel>
          <Textarea 
            value={data.description} 
            onChange={e => update("description", e.target.value)} 
            rows={5}
            placeholder="Describe your event – purpose, highlights, what attendees can expect…"
            className={cn(INPUT_CLS, "resize-none h-full min-h-[140px]")} 
          />
        </div>

        {/* Right: Visibility Options */}
        <div className="flex flex-col">
          <FieldLabel>Visibility</FieldLabel>
          <div className="flex flex-col gap-2 h-full justify-between">
            {([
              { value: "public",    label: "Public",      icon: Globe,    desc: "Anyone can view & register for event", color: "#059669" },
              { value: "community", label: "Community",   icon: Building2, desc: "Restricted to community members only", color: "#4f46e5" },
              { value: "invite",    label: "Invite Only", icon: Lock,      desc: "Private event, access by invitation", color: "#7c3aed" },
            ] as const).map(opt => {
              const selected = data.visibility === opt.value;
              return (
                <button 
                  key={opt.value} 
                  type="button"
                  onClick={() => update("visibility", opt.value)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[0.625rem] border text-left transition-all duration-150 flex-1 hover:border-slate-300"
                  style={{
                    borderColor: selected ? opt.color : "#E2E8F0",
                    background: selected ? hexRgba(opt.color, 0.05) : "#FAFAFA",
                    boxShadow: selected ? `0 0 0 3px ${hexRgba(opt.color, 0.10)}` : "none",
                  }}
                >
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: selected ? hexRgba(opt.color, 0.14) : "#F1F5F9" }}>
                    <opt.icon className="w-3.5 h-3.5" style={{ color: selected ? opt.color : "#94A3B8" }} strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[11.5px] font-bold leading-none" style={{ color: selected ? opt.color : "#334155" }}>{opt.label}</p>
                      {selected && <span className="w-1.5 h-1.5 rounded-full" style={{ background: opt.color }} />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
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
  { id: "p1", categoryType: "Pooja & Seva", name: "Ganesh Puja & Morning Aarti Ritual", needsRegistration: true, registrationFee: "0", slots: "100", startTime: "08:00", endTime: "09:00", description: "Traditional inauguration & morning stotram aarti", venue: "Main Mandap" },
  { id: "p2", categoryType: "Cultural Events", name: "Classical Bharatanatyam Dance & Music", needsRegistration: false, registrationFee: "0", slots: "200", startTime: "09:30", endTime: "11:00", description: "Stage performance by community troupe dancers", venue: "Main Stage" },
  { id: "p3", categoryType: "Competitions", name: "Cultural Talent Hunt & Singing Competition", needsRegistration: true, registrationFee: "0", slots: "50", startTime: "11:15", endTime: "12:45", description: "Youth & adult singing and elocution competition", venue: "Auditorium" },
  { id: "p4", categoryType: "Lunch", name: "Prasadam & Grand Community Lunch Feast", needsRegistration: true, registrationFee: "0", slots: "500", startTime: "13:00", endTime: "14:30", description: "Buffet dining & prasadam distribution", venue: "Dining Hall" },
  { id: "p5", categoryType: "Competitions", name: "Youth Sports & Rangoli Art Workshop", needsRegistration: true, registrationFee: "0", slots: "60", startTime: "15:00", endTime: "16:30", description: "Indoor badminton & rangoli competition", venue: "Activity Hall" },
  { id: "p6", categoryType: "Cultural Events", name: "Chief Guest Speech & Prize Ceremony", needsRegistration: false, registrationFee: "0", slots: "300", startTime: "17:00", endTime: "18:30", description: "Felicitation ceremony & awards distribution", venue: "Main Stage" },
  { id: "p7", categoryType: "Cultural Events", name: "Grand Evening Musical Night & Orchestra", needsRegistration: false, registrationFee: "0", slots: "400", startTime: "19:00", endTime: "21:30", description: "Live concert & celebrity music performance", venue: "Amphitheatre" },
];

function Step2Schedule({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [notifDayLabel, setNotifDayLabel] = useState<string | undefined>(undefined);
  const [notifActivityTitle, setNotifActivityTitle] = useState<string | undefined>(undefined);

  const createDefaultSingleActivity = (): ScheduleActivity[] => [
    {
      id: `a${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      categoryType: "Pooja & Seva",
      name: "Maha Ganapathi Homam & Sankalpam",
      needsRegistration: true,
      registrationFee: "0",
      slots: "50",
      startTime: "08:30",
      endTime: "10:00",
      description: "Main Temple Mandap",
      venue: "Main Temple Mandap",
    }
  ];

  const syncDaySchedules = (start: string, end: string) => {
    const days = getDaysBetween(start, end);
    const existing = new Map(data.daySchedules.map(ds => [ds.date, ds]));
    const synced = days.map(date => existing.get(date) ?? {
      date,
      activities: createDefaultSingleActivity(),
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
          activities: createDefaultSingleActivity(),
        }]);
        setExpandedDay(targetDate);
      }
    } else {
      if (data.startDate) {
        update("daySchedules", [{
          date: data.startDate,
          activities: createDefaultSingleActivity(),
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
      activities: createDefaultSingleActivity(),
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
    const placeholders: ScheduleActivity[] = [
      { id: `a${Date.now()}-1`, categoryType: "Pooja & Seva", name: "Maha Ganapathi Homam & Sankalpam", needsRegistration: true, registrationFee: "0", slots: "100", startTime: "08:30", endTime: "10:30", description: "Main Mandap", venue: "Main Mandap" },
      { id: `a${Date.now()}-2`, categoryType: "Lunch", name: "Community Mahaprasadam Lunch", needsRegistration: true, registrationFee: "0", slots: "500", startTime: "12:30", endTime: "14:30", description: "Dining Hall", venue: "Dining Hall" },
      { id: `a${Date.now()}-3`, categoryType: "Competitions", name: "Eco-Friendly Clay Ganesha Making Contest", needsRegistration: true, registrationFee: "0", slots: "50", startTime: "15:30", endTime: "17:00", description: "Auditorium", venue: "Auditorium" },
      { id: `a${Date.now()}-4`, categoryType: "Cultural Events", name: "Bharatanatyam & Devotional Bhajan Sandhya", needsRegistration: false, registrationFee: "0", slots: "200", startTime: "18:00", endTime: "20:00", description: "Main Stage", venue: "Main Stage" },
      { id: `a${Date.now()}-5`, categoryType: "Dinner", name: "Evening Prasadam Dinner", needsRegistration: false, registrationFee: "0", slots: "400", startTime: "20:00", endTime: "21:30", description: "Dining Hall", venue: "Dining Hall" },
    ];
    if (data.daySchedules.length === 0) {
      update("daySchedules", [{
        date: targetDate,
        activities: placeholders,
      }]);
      setExpandedDay(targetDate);
    } else {
      const updated = data.daySchedules.map(ds => ({
        ...ds,
        activities: placeholders.map(p => ({ ...p, id: `a${Date.now()}-${Math.random().toString(36).substring(2, 6)}` })),
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
        ? {
            ...ds,
            activities: [
              ...ds.activities,
              {
                id: `a${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                categoryType: "Pooja & Seva",
                name: "",
                needsRegistration: true,
                registrationFee: "0",
                slots: "50",
                startTime: "09:00",
                endTime: "10:30",
                description: "",
                venue: "",
              }
            ]
          }
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

  const updateActivity = (date: string, actId: string, field: keyof ScheduleActivity, value: any) => {
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
      label="Multi-day event" description="Enable to set up a day-wise schedule with activities" />
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
                      {day.activities.map((act, actIdx) => {
                        const currentCategory = act.categoryType || "Pooja & Seva";
                        const suggestions = PRESET_ACTIVITY_TITLES[currentCategory] || [];
                        const isOtherCategory = currentCategory === "Other";

                        return (
                          <div
                            key={act.id}
                            className="relative p-3 sm:p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs group hover:border-indigo-200 transition-all"
                          >
                            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                                  <span className="text-[10px] font-black">{actIdx + 1}</span>
                                </div>
                                <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                                  {act.categoryType || "Activity"}
                                </span>
                                {act.needsRegistration && (
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Registration Required
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {act.name && (
                                  <button
                                    type="button"
                                    onClick={() => triggerNotification(`Day ${dayIdx + 1}`, act.name)}
                                    className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 transition-all cursor-pointer"
                                  >
                                    <Mail className="w-3 h-3" /> Notify
                                  </button>
                                )}
                                {day.activities.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeActivity(day.date, act.id)}
                                    className="opacity-60 group-hover:opacity-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all p-1.5 rounded-lg cursor-pointer"
                                    title="Remove activity"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Row 1: Category / Type Selection */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <FieldLabel required>Activity Category / Type</FieldLabel>
                                <select
                                  value={currentCategory}
                                  onChange={(e) => {
                                    const newCat = e.target.value;
                                    updateActivity(day.date, act.id, "categoryType", newCat);
                                    if (newCat !== "Other" && PRESET_ACTIVITY_TITLES[newCat]) {
                                      if (!act.name || Object.values(PRESET_ACTIVITY_TITLES).some((list) => list.includes(act.name))) {
                                        updateActivity(day.date, act.id, "name", PRESET_ACTIVITY_TITLES[newCat][0]);
                                      }
                                    }
                                  }}
                                  className={cn(INPUT_CLS, "font-bold text-indigo-900 bg-white cursor-pointer")}
                                >
                                  {ACTIVITY_CATEGORY_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.icon} {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {isOtherCategory ? (
                                <div>
                                  <FieldLabel required>Custom Type Name</FieldLabel>
                                  <Input
                                    value={act.customType || ""}
                                    onChange={(e) => updateActivity(day.date, act.id, "customType", e.target.value)}
                                    placeholder="e.g. Sports / Workshop / Stage Play"
                                    className={cn(INPUT_CLS, "bg-white font-medium")}
                                  />
                                </div>
                              ) : (
                                <div>
                                  <FieldLabel>Target Schedule Tab</FieldLabel>
                                  <div className="px-3 py-[7px] rounded-[0.625rem] bg-indigo-50/60 border border-indigo-100 text-[12px] font-semibold text-indigo-700 flex items-center gap-1.5">
                                    <span>Syncs to:</span>
                                    <span className="font-bold underline underline-offset-2">
                                      {currentCategory === "Pooja & Seva"
                                        ? "Pooja & Seva Tab"
                                        : currentCategory === "Lunch" || currentCategory === "Dinner"
                                        ? "Lunch / Dinner Tab"
                                        : currentCategory === "Cultural Events"
                                        ? "Cultural Events Tab"
                                        : currentCategory === "Competitions"
                                        ? "Competitions Tab"
                                        : "Programs Tab"}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Row 2: Title and Times */}
                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2.5 items-end">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <FieldLabel required>Activity / Event Title</FieldLabel>
                                  <span className="text-[10px] text-slate-400 font-medium">Select suggestion or type title</span>
                                </div>
                                <Input
                                  list={`preset-titles-${act.id}`}
                                  value={act.name}
                                  onChange={(e) => updateActivity(day.date, act.id, "name", e.target.value)}
                                  placeholder="e.g. Maha Ganapathi Homam / Classical Dance"
                                  className={cn(INPUT_CLS, "bg-white font-semibold text-slate-900")}
                                />
                                <datalist id={`preset-titles-${act.id}`}>
                                  {suggestions.map((title, i) => (
                                    <option key={i} value={title} />
                                  ))}
                                </datalist>

                                {suggestions.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {suggestions.slice(0, 3).map((title, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => updateActivity(day.date, act.id, "name", title)}
                                        className={cn(
                                          "text-[9.5px] px-2 py-0.5 rounded-md border transition-all cursor-pointer font-medium",
                                          act.name === title
                                            ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                                        )}
                                      >
                                        + {title.split(" ")[0]} {title.split(" ")[1] || ""}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="w-full sm:w-28">
                                <FieldLabel required>From</FieldLabel>
                                <Input
                                  type="time"
                                  value={act.startTime}
                                  onChange={(e) => updateActivity(day.date, act.id, "startTime", e.target.value)}
                                  className={cn(INPUT_CLS, "bg-white font-medium")}
                                />
                              </div>
                              <div className="w-full sm:w-28">
                                <FieldLabel required>To</FieldLabel>
                                <Input
                                  type="time"
                                  value={act.endTime}
                                  onChange={(e) => updateActivity(day.date, act.id, "endTime", e.target.value)}
                                  className={cn(INPUT_CLS, "bg-white font-medium")}
                                />
                              </div>
                            </div>

                            {/* Row 3: Registration & Fee Controls */}
                            <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-800">
                                <input
                                  type="checkbox"
                                  checked={act.needsRegistration ?? true}
                                  onChange={(e) => updateActivity(day.date, act.id, "needsRegistration", e.target.checked)}
                                  className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                                />
                                <span>Requires Member Registration &amp; Pass</span>
                              </label>

                              {act.needsRegistration && (
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-bold text-slate-500">Fee (₹):</span>
                                    <Input
                                      type="text"
                                      value={act.registrationFee ?? "0"}
                                      onChange={(e) => updateActivity(day.date, act.id, "registrationFee", e.target.value)}
                                      placeholder="0 for Free"
                                      className="w-24 h-7 text-xs bg-slate-50 font-bold border-slate-200"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-bold text-slate-500">Capacity/Slots:</span>
                                    <Input
                                      type="number"
                                      value={act.slots ?? "50"}
                                      onChange={(e) => updateActivity(day.date, act.id, "slots", e.target.value)}
                                      placeholder="50"
                                      className="w-20 h-7 text-xs bg-slate-50 font-bold border-slate-200"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Row 4: Description and Location / Venue */}
                            <div>
                              <FieldLabel>Description &amp; Location / Mandap</FieldLabel>
                              <Input
                                value={act.description}
                                onChange={(e) => updateActivity(day.date, act.id, "description", e.target.value)}
                                placeholder="e.g. Main Temple Mandap / Stage A"
                                className={cn(INPUT_CLS, "bg-white")}
                              />
                            </div>
                          </div>
                        );
                      })}
                      <button 
                        type="button"
                        onClick={() => addActivity(day.date)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-indigo-200 text-xs font-extrabold text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/80 hover:border-indigo-300 transition-all cursor-pointer shadow-xs mt-2"
                      >
                        <Plus className="w-4 h-4 text-indigo-600" /> Add Activity / Item to Day {dayIdx + 1}
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
        label="Enable event registration" description="Allow attendees to register for this event" />

      {data.registrationEnabled && (
        <div className="space-y-6 animate-fade-in-up">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ToggleRow checked={data.requireApproval} onChange={v => update("requireApproval", v)}
              label="Require approval" description="Admin must approve each registration" />
            <ToggleRow checked={data.allowWaitlist} onChange={v => update("allowWaitlist", v)}
              label="Enable waitlist" description="When tickets are full" />
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
                        placeholder="e.g. Family, Volunteer" className={INPUT_CLS} />
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

/* ─── Step 4: Payment Mode, QR Code, Notes & Contacts ─── */
function Step4PaymentAndContacts({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  const [uploadingQr, setUploadingQr] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const paymentModeOptions = [
    { id: "UPI", label: "UPI & QR", desc: "GPay, PhonePe, Paytm", icon: QrCode, color: "#4f46e5", bg: "#eef2ff" },
    { id: "Card", label: "Cards", desc: "Visa, Master, RuPay", icon: CreditCard, color: "#0891b2", bg: "#ecfeff" },
    { id: "NetBanking", label: "NetBanking", desc: "Direct Bank Transfer", icon: Building2, color: "#059669", bg: "#f0fdf4" },
    { id: "Cash", label: "Cash Desk", desc: "Pay at Venue / Desk", icon: IndianRupee, color: "#d97706", bg: "#fef9ee" },
    { id: "Cheque", label: "Cheque/DD", desc: "Society / Trust A/C", icon: FileText, color: "#7c3aed", bg: "#f5f3ff" },
  ];

  const currentModes = data.paymentModes || ["UPI", "Card", "Cash"];

  const togglePaymentMode = (modeId: string) => {
    const next = currentModes.includes(modeId)
      ? currentModes.filter((m) => m !== modeId)
      : [...currentModes, modeId];
    update("paymentModes", next);
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image (PNG, JPG, WEBP).");
      return;
    }

    setUploadingQr(true);
    setUploadError("");
    try {
      const res = await fileUploadService.upload(file, "EVENT", "event-create", undefined, "qr-scanner");
      if (res && res.url) {
        update("scannerUrl", res.url);
      } else {
        throw new Error("Upload completed without a QR image URL.");
      }
    } catch (err: any) {
      console.warn("QR upload failed:", err);
      setUploadError(err?.message || "QR upload failed. Please try again or paste a stored image URL.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setUploadingQr(false);
    }
  };

  const addContact = () => {
    const newContact: EventContactItem = {
      id: `c_${Date.now()}`,
      name: "",
      phone: "",
      role: "Event Coordinator",
      notes: "",
    };
    update("contacts", [...(data.contacts || []), newContact]);
  };

  const removeContact = (id: string) => {
    const next = (data.contacts || []).filter((c) => c.id !== id);
    update("contacts", next.length > 0 ? next : [{ id: "c1", name: "", phone: "", role: "Event Lead", notes: "" }]);
  };

  const updateContact = (id: string, field: keyof EventContactItem, value: string) => {
    const next = (data.contacts || []).map((c) => (c.id === id ? { ...c, [field]: value } : c));
    update("contacts", next);
  };

  const isOnlinePayment = data.enableOnlinePayment !== false;

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in-up">
      <SectionHeader
        icon={CreditCard}
        title="Payment Mode, QR Scanner, Notes & Contacts"
        subtitle="Configure accepted payment methods, dynamic UPI QR scanner, guidelines & committee contacts"
      />

      {/* ── Section 0: Payment Collection Setup (Online vs Manual) ── */}
      <div className="p-3.5 sm:p-4 bg-white border border-slate-200/90 rounded-2xl space-y-3 shadow-2xs">
        <div>
          <FieldLabel required>Payment Collection Setup</FieldLabel>
          <p className="text-[11px] text-slate-400">
            Choose whether to enable digital online UPI / QR scanner payment or accept manual payment / cash at helpdesk only
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div
            onClick={() => update("enableOnlinePayment", true)}
            className={cn(
              "p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 select-none",
              isOnlinePayment
                ? "bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-200/80 shadow-xs"
                : "bg-slate-50 border-slate-200/90 hover:border-slate-300 opacity-70 hover:opacity-100"
            )}
          >
            <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 shadow-2xs mt-0.5">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <strong className="text-xs font-bold text-slate-900">Online UPI &amp; Dynamic QR Scanner</strong>
                <input
                  type="radio"
                  checked={isOnlinePayment}
                  onChange={() => update("enableOnlinePayment", true)}
                  className="accent-indigo-600 cursor-pointer"
                />
              </div>
              <p className="text-[10.5px] text-slate-500 mt-0.5 leading-tight">
                Configure UPI ID, QR scanner image, accepted digital modes (GPay, PhonePe, Cards, NetBanking)
              </p>
            </div>
          </div>

          <div
            onClick={() => {
              update("enableOnlinePayment", false);
              update("paymentModes", ["Cash"]);
            }}
            className={cn(
              "p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 select-none",
              !isOnlinePayment
                ? "bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-200/80 shadow-xs"
                : "bg-slate-50 border-slate-200/90 hover:border-slate-300 opacity-70 hover:opacity-100"
            )}
          >
            <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 shadow-2xs mt-0.5">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <strong className="text-xs font-bold text-slate-900">Manual Payment / Cash</strong>
                <input
                  type="radio"
                  checked={!isOnlinePayment}
                  onChange={() => {
                    update("enableOnlinePayment", false);
                    update("paymentModes", ["Cash"]);
                  }}
                  className="accent-emerald-600 cursor-pointer"
                />
              </div>
              <p className="text-[10.5px] text-slate-500 mt-0.5 leading-tight">
                Devotees pay cash at counter / free pass. Bypasses and disables online UPI &amp; QR scanner details.
              </p>
            </div>
          </div>
        </div>

        {!isOnlinePayment && (
          <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-900 text-xs flex items-center gap-2 animate-fadeIn">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-[11.5px] leading-relaxed">
              <strong>Manual Payment / Cash Enabled:</strong> Accepted payment modes, UPI ID, and QR scanner upload below are bypassed and disabled. You can proceed directly to Notes &amp; Committee Contacts.
            </span>
          </div>
        )}
      </div>

      {/* ── Section 1 & 2: Online Payment Modes & QR Scanner (Shown ONLY when Online Payment is selected) ── */}
      {isOnlinePayment && (
        <div className="space-y-4 sm:space-y-5 animate-fade-in-up">
          {/* ── Section 1: Accepted Payment Modes ── */}
          <div className="p-3.5 sm:p-4 bg-white border border-slate-200/90 rounded-2xl space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <FieldLabel required>Accepted Payment Modes</FieldLabel>
                <p className="text-[11px] text-slate-400">
                  Select which modes are permitted for pass registration
                </p>
              </div>
              <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                {currentModes.length} Selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {paymentModeOptions.map((mode) => {
                const isChecked = currentModes.includes(mode.id);
                const Icon = mode.icon;
                return (
                  <div
                    key={mode.id}
                    onClick={() => togglePaymentMode(mode.id)}
                    className={cn(
                      "flex items-start gap-2 p-2 sm:p-2.5 rounded-xl border cursor-pointer transition-all select-none",
                      isChecked
                        ? "bg-indigo-50/70 border-indigo-300 ring-1.5 ring-indigo-200/70 shadow-xs"
                        : "bg-slate-50/50 border-slate-200/90 text-slate-600 hover:border-slate-300 hover:bg-slate-100/60"
                    )}
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 shadow-2xs"
                      style={{ background: isChecked ? mode.bg : "#f1f5f9", color: isChecked ? mode.color : "#64748b" }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={cn("text-[11.5px] font-bold truncate leading-tight", isChecked ? "text-indigo-950" : "text-slate-700")}>
                          {mode.label}
                        </p>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                        />
                      </div>
                      <p className="text-[9.5px] text-slate-400 truncate mt-0.5">{mode.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Section 2: UPI ID & Scanner QR Code Image ── */}
          <div className="p-3.5 sm:p-4 bg-white border border-slate-200/90 rounded-2xl space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <QrCode className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">UPI ID &amp; Payment QR Code</h3>
                <p className="text-[10.5px] text-slate-400">Devotees will scan this QR code or use this UPI ID to make payments</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4 items-start">
              {/* Left Column: UPI ID + Instructions (7 cols) */}
              <div className="md:col-span-7 space-y-2.5">
                <div>
                  <FieldLabel>Event UPI ID (VPA)</FieldLabel>
                  <div className="relative mt-1">
                    <Input
                      value={data.upiId}
                      onChange={(e) => update("upiId", e.target.value)}
                      placeholder="e.g. 9876543210@upi or community@icici"
                      className={cn(INPUT_CLS, "h-8.5 pl-7.5 font-mono text-xs")}
                    />
                    <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">₹</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Optional. Leave blank if using cash-only or free passes.
                  </p>
                </div>

                <div>
                  <FieldLabel>Payment Instructions for Devotees</FieldLabel>
                  <Textarea
                    rows={2}
                    value={data.paymentInstructions}
                    onChange={(e) => update("paymentInstructions", e.target.value)}
                    placeholder="e.g. Please scan QR using GPay/PhonePe and save screenshot with UTR number."
                    className={cn(INPUT_CLS, "resize-none text-xs leading-relaxed")}
                  />
                </div>
              </div>

              {/* Right Column: QR Code Scanner Upload (5 cols) */}
              <div className="md:col-span-5 space-y-2">
                <FieldLabel>Official Payment Scanner (QR Image)</FieldLabel>
                
                {data.scannerUrl ? (
                  <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/30 flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-white border border-emerald-200 p-0.5 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                      <img
                        src={data.scannerUrl}
                        alt="Event QR Scanner"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1 text-emerald-700 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">Scanner Linked</span>
                      </div>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10.5px] font-semibold hover:bg-slate-50 cursor-pointer shadow-2xs"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => update("scannerUrl", "")}
                          className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-600 text-[10.5px] font-semibold hover:bg-rose-100 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30 rounded-xl py-3 px-3 text-center cursor-pointer transition-all group"
                  >
                    <div className="w-7 h-7 rounded-full bg-white group-hover:bg-indigo-100 text-slate-400 group-hover:text-indigo-600 flex items-center justify-center mx-auto mb-1.5 transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 leading-tight">
                      {uploadingQr ? "Uploading QR..." : "Click to Upload QR Scanner"}
                    </p>
                    <p className="text-[9.5px] text-slate-400 mt-0.5">PNG, JPG, WEBP</p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleQrUpload}
                />

                {uploadError && (
                  <p className="text-[11px] text-rose-600 font-semibold">{uploadError}</p>
                )}

                <div>
                  <Input
                    value={data.scannerUrl}
                    onChange={(e) => update("scannerUrl", e.target.value)}
                    placeholder="Or paste QR image URL (https://...)"
                    className={cn(INPUT_CLS, "h-8 text-[11px]")}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 3: Event Notes & Guidelines ── */}
      <div className="p-3.5 sm:p-4 bg-white border border-slate-200/90 rounded-2xl space-y-2 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
          <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Info className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Event Notes &amp; Guidelines</h3>
            <p className="text-[10.5px] text-slate-400">Important instructions, rules, prasadam guidelines and entry details</p>
          </div>
        </div>

        <div>
          <Textarea
            rows={3}
            value={data.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="e.g. 1. Traditional dress code encouraged.&#10;2. Mahaprasadam coupons at Dining Hall Gate 2.&#10;3. Free parking at South Gate."
            className={cn(INPUT_CLS, "resize-none text-xs leading-relaxed")}
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Displayed on event overview, registration confirmation pass, and devotee schedule views.
          </p>
        </div>
      </div>

      {/* ── Section 4: Multiple Committee & Organizer Contact Numbers ── */}
      <div className="p-3.5 sm:p-4 bg-white border border-slate-200/90 rounded-2xl space-y-3 shadow-2xs">
        <div className="flex flex-row items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Phone className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider truncate">
                Committee Contacts ({data.contacts?.length || 1})
              </h3>
              <p className="text-[10.5px] text-slate-400 truncate hidden sm:block">
                Coordinators, emergency desk, food in-charge, and volunteer lead numbers
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={addContact}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition-all cursor-pointer shadow-2xs shrink-0"
          >
            <Plus className="w-3 h-3" />
            <span>+ Add Contact</span>
          </button>
        </div>

        <div className="space-y-2">
          {(data.contacts || []).map((contact, idx) => (
            <div
              key={contact.id || idx}
              className="p-2.5 sm:p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <User className="w-3 h-3 text-indigo-600" />
                  Contact #{idx + 1}
                </span>
                {(data.contacts?.length || 0) > 1 && (
                  <button
                    type="button"
                    onClick={() => removeContact(contact.id)}
                    className="text-rose-500 hover:text-rose-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <div>
                  <label className="text-[9.5px] font-bold uppercase text-slate-500 block mb-0.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={contact.name}
                    onChange={(e) => updateContact(contact.id, "name", e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className={cn(INPUT_CLS, "h-8 text-xs py-1 px-2.5")}
                  />
                </div>

                <div>
                  <label className="text-[9.5px] font-bold uppercase text-slate-500 block mb-0.5">
                    Phone / Mobile <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={contact.phone}
                    onChange={(e) => updateContact(contact.id, "phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className={cn(INPUT_CLS, "h-8 text-xs font-mono py-1 px-2.5")}
                  />
                </div>

                <div>
                  <label className="text-[9.5px] font-bold uppercase text-slate-500 block mb-0.5">
                    Role / Committee
                  </label>
                  <Input
                    value={contact.role}
                    onChange={(e) => updateContact(contact.id, "role", e.target.value)}
                    placeholder="e.g. Coordinator, Food Lead"
                    className={cn(INPUT_CLS, "h-8 text-xs py-1 px-2.5")}
                  />
                </div>

                <div>
                  <label className="text-[9.5px] font-bold uppercase text-slate-500 block mb-0.5">
                    Notes
                  </label>
                  <Input
                    value={contact.notes || ""}
                    onChange={(e) => updateContact(contact.id, "notes", e.target.value)}
                    placeholder="e.g. Available at helpdesk after 6 PM"
                    className={cn(INPUT_CLS, "h-8 text-xs py-1 px-2.5")}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 5: Form Template Selector ─── */

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
    id: "tmpl-ganesh",
    name: "Ganesh Chaturthi Grand Festival 2026",
    description: "Default Festival Template — Aarti slots, Mahaprasadam passes, cultural programs, volunteer teams & family registration up to 6 members",
    category: "Grand Festival",
    fieldsCount: 18,
    icon: "🪔",
    config: GANESH_CHATURTHI_FORM_CONFIG,
  },
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

const DEFAULT_FORM_TEMPLATE_ID = "tmpl-ganesh";
const VISIBLE_FORM_TEMPLATE_IDS = [DEFAULT_FORM_TEMPLATE_ID, "tmpl-standard"];
const VISIBLE_FORM_TEMPLATES = FORM_TEMPLATES.filter((tmpl) => VISIBLE_FORM_TEMPLATE_IDS.includes(tmpl.id));

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Text", textarea: "Long Text", number: "Number", email: "Email",
  phone: "Phone", date: "Date", select: "Dropdown", multiselect: "Multi Select",
  radio: "Radio", checkbox: "Checkbox", file: "File", section: "Section", family_repeater: "Family",
};

function Step5FormTemplate({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_FORM_TEMPLATE_ID);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const selectTemplate = (tmpl: FormTemplateMeta) => {
    if (tmpl.id !== DEFAULT_FORM_TEMPLATE_ID) return;
    setSelectedId(tmpl.id);
    update("registrationFormConfig", { ...tmpl.config });
  };

  const previewTemplate = previewId ? VISIBLE_FORM_TEMPLATES.find(t => t.id === previewId) : null;

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
      <div className="bg-amber-50/70 rounded-xl border border-amber-200/80 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h4 className="text-sm font-bold text-amber-900">Default Template: Ganesh Chaturthi Grand Festival 2026</h4>
          </div>
          <Badge className="text-[9px] bg-amber-500 text-white border-transparent">
            ⭐ Recommended Default
          </Badge>
        </div>
        <p className="text-xs text-amber-800/90 leading-relaxed">
          Pre-configured with Aarti time slots, Mahaprasadam meal passes, cultural program sign-ups, volunteer preferences & family gate pass registration up to 6 members.
        </p>
      </div>

      {/* Built-in Templates */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700">Available Templates</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {VISIBLE_FORM_TEMPLATES.map(tmpl => {
            const isSelected = selectedId === tmpl.id;
            const isDefault = tmpl.id === DEFAULT_FORM_TEMPLATE_ID;
            const isLocked = !isDefault;
            const fieldCount = tmpl.config.fields.filter(f => f.type !== "section").length;
            const reqCount = tmpl.config.fields.filter(f => f.required).length;
            return (
              <button
                key={tmpl.id}
                type="button"
                aria-disabled={isLocked}
                onClick={() => selectTemplate(tmpl)}
                className={cn(
                  "text-left p-4 rounded-xl border-2 transition-all relative group",
                  isSelected
                    ? "border-amber-500 bg-amber-50/70 ring-2 ring-amber-200 shadow-sm"
                    : "border-slate-200 hover:border-amber-300 hover:bg-slate-50",
                  isLocked && "opacity-60 cursor-not-allowed hover:border-slate-200 hover:bg-white"
                )}
              >
                {isDefault && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-amber-500 text-white font-bold text-[9px] py-0.5 px-1.5 border-none">
                      🪔 Default
                    </Badge>
                  </div>
                )}
                {isLocked && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-slate-100 text-slate-500 font-bold text-[9px] py-0.5 px-1.5 border border-slate-200">
                      Locked
                    </Badge>
                  </div>
                )}
                {isSelected && !isDefault && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                  </div>
                )}
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-2xl">{tmpl.icon}</span>
                  <div className="flex-1 min-w-0 pr-12">
                    <p className={cn("text-sm font-semibold", isSelected ? "text-amber-900" : "text-slate-800")}>
                      {tmpl.name}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{tmpl.description}</p>
                  </div>
                </div>
                {tmpl.id !== "tmpl-none" && (
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-slate-500 font-medium">{fieldCount} fields</span>
                    <span className="text-[10px] text-slate-400">{reqCount} required</span>
                    {tmpl.config.allowFamilyRegistration && (
                      <Badge variant="outline" className="text-[8px] py-0 text-violet-600 border-violet-200 bg-violet-50">Family</Badge>
                    )}
                    <div className="flex-1" />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setPreviewId(tmpl.id); }}
                      className="text-[10px] text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-0.5"
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
                disabled={previewTemplate.id !== DEFAULT_FORM_TEMPLATE_ID}
                onClick={() => { selectTemplate(previewTemplate); setPreviewId(null); }}
              >
                <CheckCircle2 className="w-4 h-4" /> {previewTemplate.id === DEFAULT_FORM_TEMPLATE_ID ? "Use This Template" : "Selection Disabled"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Step 6: Budget ─── */
function Step6Budget({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
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
      <SectionHeader icon={IndianRupee} title="Budget Planning" subtitle="Set a budget and allocate across categories" />

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

/* ─── Step 7: Media ─── */
function Step7Media({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  const [tagInput, setTagInput] = useState("");
  const [imageMode, setImageMode] = useState<"upload" | "url">(data.coverImageUrl && !data.coverImageUrl.startsWith("data:") ? "url" : "upload");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name);
    setUploadingImage(true);
    setImageUploadError("");

    try {
      const res = await fileUploadService.upload(file, "EVENT", "event-create", undefined, "cover-image");
      if (res?.url) {
        update("coverImageUrl", res.url);
        setImageMode("url");
      } else {
        throw new Error("Upload completed without an image URL.");
      }
    } catch (err) {
      console.warn("Cover image upload failed:", err);
      setImageUploadError("Cover image upload failed. Please try again or paste an image URL.");
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setUploadingImage(false);
    }
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
    setImageUploadError("");
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
            onChange={e => { update("coverImageUrl", e.target.value); setFileName(""); setImageUploadError(""); }}
            placeholder="https://images.unsplash.com/…" className={INPUT_CLS} />
        ) : (
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        )}

        {imageUploadError && (
          <p className="text-[11px] text-rose-600 font-semibold mt-2">{imageUploadError}</p>
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
                    <span className="text-indigo-600 font-bold">{uploadingImage ? "Uploading..." : "Click to upload"}</span>
                    {!uploadingImage && " or drag & drop"}
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

/* ─── Step 8: Review ─── */
function Step8Review({ data }: { data: FormData }) {
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
      icon: Ticket, title: "Registration Passes", color: "#059669",
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
      icon: CreditCard, title: "Payment Mode, QR & Contacts", color: "#0891b2",
      rows: [
        { label: "Payment Setup", value: data.enableOnlinePayment ? "Online UPI & Dynamic QR Scanner" : "Manual Payment / Cash" },
        ...(data.enableOnlinePayment ? [
          { label: "Payment Modes", value: data.paymentModes && data.paymentModes.length > 0 ? data.paymentModes.join(", ") : "All Modes (Default)" },
          { label: "UPI ID", value: data.upiId || "Not configured" },
          { label: "QR Scanner", value: data.scannerUrl ? "Linked & Active" : "No scanner image uploaded" },
        ] : [
          { label: "Payment Modes", value: "Cash / Manual" },
          { label: "UPI & Scanner", value: "Bypassed / Disabled (Manual Payment)" },
        ]),
        ...(data.notes ? [{ label: "Notes", value: data.notes }] : []),
        {
          label: "Contacts",
          value: data.contacts && data.contacts.filter(c => c.name || c.phone).length > 0
            ? data.contacts.filter(c => c.name || c.phone).map(c => `${c.name} (${c.phone}${c.role ? ` · ${c.role}` : ""})`).join(" | ")
            : "—",
        },
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
      icon: IndianRupee, title: "Budget", color: "#d97706",
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

export function toEventRequest(data: FormData, statusOverride?: "DRAFT" | "PUBLISHED"): EventRequest {
  const primaryContact = data.contacts?.[0];
  const coverImageUrl = persistedMediaUrl(data.coverImageUrl);
  const scannerImageUrl = persistedMediaUrl(data.scannerUrl);
  const contactPayload = (data.contacts || []).map(({ id, name, phone, role, notes }) => ({
    id,
    name,
    phone,
    role,
    notes,
  }));
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
    imageUrl: coverImageUrl,
    organizerName: primaryContact?.name || undefined,
    organizerContact: primaryContact?.phone || undefined,
    ticketTypes: data.ticketTypes,
    paymentModes: data.enableOnlinePayment ? (data.paymentModes && data.paymentModes.length > 0 ? data.paymentModes.join(",") : undefined) : "Cash",
    upiId: data.enableOnlinePayment ? (data.upiId || undefined) : undefined,
    scannerUrl: data.enableOnlinePayment ? scannerImageUrl : undefined,
    scannerImage: data.enableOnlinePayment ? scannerImageUrl : undefined,
    notes: data.notes || undefined,
    contactsJson: contactPayload.length > 0 ? JSON.stringify(contactPayload) : undefined,
    paymentInstructions: data.enableOnlinePayment ? (data.paymentInstructions || undefined) : undefined,
    venue: data.venueName || undefined,
    city: data.city || undefined,
    category: data.eventType || undefined,
    status: statusOverride || "PUBLISHED",
  };
}

export function fromEventToFormData(ev: any): FormData {
  if (!ev) return { ...INITIAL_FORM_DATA };

  const parts = (ev.location || "").split(", ");
  const venueName = ev.venue || ev.venueName || parts[0] || "";
  const venueAddress = ev.venueAddress || (parts.length > 2 ? parts.slice(1, -1).join(", ") : parts[1] || "");
  const city = ev.city || (parts.length > 0 ? parts[parts.length - 1] : "") || "";

  const ticketTypes: TicketType[] = Array.isArray(ev.ticketTypes) && ev.ticketTypes.length > 0
    ? ev.ticketTypes.map((t: any, i: number) => ({
        id: t.id || `t${i + 1}`,
        name: t.name || "General",
        price: String(t.price ?? "0"),
        qty: String(t.qty || t.capacity || ev.capacity || "100"),
        description: t.description || "",
      }))
    : [
        {
          id: "t1",
          name: "General",
          price: ev.price !== undefined ? String(ev.price) : "0",
          qty: ev.capacity ? String(ev.capacity) : "100",
          description: "Open for all community members",
        },
      ];

  const visibility: FormData["visibility"] = 
    ev.visibility === "public" || ev.locationType === "public" ? "public" :
    ev.visibility === "invite" || ev.locationType === "invite" || ev.visibility === "private" ? "invite" :
    "community";

  const eventTypeLower = (ev.type || ev.category || ev.eventType || "").toLowerCase();
  const matchedType = EVENT_TYPES.find(t => t.value === eventTypeLower || t.label.toLowerCase() === eventTypeLower)?.value || (eventTypeLower || "festival");

  let contacts: EventContactItem[] = [];
  if (ev.contactsJson) {
    try {
      const parsed = JSON.parse(ev.contactsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        contacts = parsed.map((c: any, i: number) => ({
          id: c.id || `c${i + 1}`,
          name: c.name || "",
          phone: c.phone || "",
          role: c.role || "Organizer",
          notes: c.notes || "",
        }));
      }
    } catch {}
  }
  if (contacts.length === 0 && Array.isArray(ev.contactDetails) && ev.contactDetails.length > 0) {
    contacts = ev.contactDetails.map((c: any, i: number) => ({
      id: c.id || `c${i + 1}`,
      name: c.name || "",
      phone: c.phone || "",
      role: c.role || "Organizer",
      notes: c.notes || "",
    }));
  }
  if (contacts.length === 0 && (ev.organizerName || ev.organizerContact)) {
    contacts = [
      {
        id: "c1",
        name: ev.organizerName || "",
        phone: ev.organizerContact || "",
        role: "Event Lead / Organizer",
        notes: "",
      },
    ];
  }
  if (contacts.length === 0) {
    contacts = [...DEFAULT_CONTACTS];
  }

  const isManualOnly = ev.paymentModes && typeof ev.paymentModes === "string" && ev.paymentModes.trim().toLowerCase() === "cash";
  const enableOnlinePayment = ev.enableOnlinePayment !== undefined
    ? Boolean(ev.enableOnlinePayment)
    : isManualOnly
    ? false
    : Boolean(ev.upiId || ev.scannerUrl || ev.scannerImage || (ev.paymentModes && !String(ev.paymentModes).toLowerCase().includes("cash only")));

  return {
    title: ev.title || "",
    eventType: matchedType,
    category: ev.category || ev.type || "Festival",
    description: ev.description || "",
    visibility,
    startDate: ev.startDate || "",
    endDate: ev.endDate || "",
    startTime: ev.startTime || "09:00",
    endTime: ev.endTime || "18:00",
    multiDay: Boolean(ev.endDate && ev.endDate !== ev.startDate),
    daySchedules: ev.daySchedules || [],
    venueName,
    venueAddress,
    city,
    capacity: ev.capacity ? String(ev.capacity) : ev.maxAttendees ? String(ev.maxAttendees) : "100",
    registrationEnabled: ev.registrationEnabled !== undefined ? Boolean(ev.registrationEnabled) : true,
    registrationDeadline: ev.registrationDeadline || "",
    ticketTypes,
    requireApproval: Boolean(ev.requireApproval),
    allowWaitlist: ev.allowWaitlist !== undefined ? Boolean(ev.allowWaitlist) : false,
    totalBudget: ev.totalBudget || (ev.budget ? String(ev.budget) : ""),
    budgetItems: ev.budgetItems && ev.budgetItems.length > 0 ? ev.budgetItems : [...DEFAULT_BUDGET_ITEMS],
    coverImageUrl: ev.imageUrl || ev.coverImageUrl || ev.coverImage || "",
    tags: ev.tags || [],
    registrationFormConfig: ev.registrationFormConfig || { ...GANESH_CHATURTHI_FORM_CONFIG },
    enableOnlinePayment,
    paymentModes: ev.paymentModes ? (typeof ev.paymentModes === "string" ? ev.paymentModes.split(",") : ev.paymentModes) : ["UPI", "Card", "Cash"],
    upiId: ev.upiId || "",
    scannerUrl: ev.scannerUrl || ev.scannerImage || "",
    notes: ev.notes || "",
    paymentInstructions: ev.paymentInstructions || "Please scan the QR code using any UPI app (GPay, PhonePe, Paytm) and save the transaction screenshot/UTR.",
    contacts,
  };
}

export interface EventCreateWizardProps {
  onClose?: () => void;
  onCreated?: (event?: any) => void;
  onSaved?: (updated?: any) => void;
  initialData?: any;
  eventId?: string | number | null;
  isEdit?: boolean;
}

/* ─── Wizard content (shared between page and dialog) ─── */
export function EventCreateWizard({
  onClose,
  onCreated,
  onSaved,
  initialData,
  eventId,
  isEdit = false,
}: EventCreateWizardProps) {
  useEscapeKey(onClose);
  const isEditing = isEdit || !!eventId || !!initialData;
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitType, setSubmitType] = useState<"published" | "draft">("published");
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [loadingEvent, setLoadingEvent] = useState(Boolean(eventId && !initialData));

  let useMock = true;
  try { useMock = useEventMock().useMock; } catch {}

  const [formData, setFormData] = useState<FormData>(() => {
    if (initialData) return fromEventToFormData(initialData);
    return { ...INITIAL_FORM_DATA };
  });

  // If eventId provided without full initialData, fetch it
  useEffect(() => {
    if (eventId && !initialData && !useMock) {
      const numId = typeof eventId === "string" ? parseInt(eventId.replace(/\D/g, ""), 10) : Number(eventId);
      if (!isNaN(numId)) {
        setLoadingEvent(true);
        eventService.getById(numId)
          .then(ev => {
            setFormData(fromEventToFormData(ev));
          })
          .catch(() => {})
          .finally(() => setLoadingEvent(false));
      }
    }
  }, [eventId, initialData, useMock]);

  // If initialData changes, update form data
  useEffect(() => {
    if (initialData) {
      setFormData(fromEventToFormData(initialData));
    }
  }, [initialData]);

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
      const reqPayload = toEventRequest(formData, "DRAFT");
      let resultEvent: any = {
        ...(initialData || {}),
        ...formData,
        id: eventId || (initialData as any)?.id || "EVT-" + Date.now(),
        venue: formData.venueName,
        status: "draft",
      };

      if (!useMock) {
        if (isEditing && (eventId || (initialData as any)?.id)) {
          const numId = typeof (eventId || (initialData as any)?.id) === "string" 
            ? parseInt(String(eventId || (initialData as any)?.id).replace(/\D/g, ""), 10) 
            : Number(eventId || (initialData as any)?.id);
          if (!isNaN(numId)) {
            const resp = await eventService.update(numId, reqPayload);
            if (resp) resultEvent = resp;
          }
        } else {
          const resp = await eventService.create(reqPayload);
          if (resp) resultEvent = resp;
        }
      }

      await syncActivitiesToScheduleSubmodules(formData.daySchedules, formData.title, resultEvent.id);

      try {
        window.dispatchEvent(new Event("mana_activities_updated"));
        window.dispatchEvent(new Event("mana_schedule_updated"));
        window.dispatchEvent(new Event("mana_event_created"));
        window.dispatchEvent(new Event("mana_event_updated"));
        window.dispatchEvent(new Event("mana_dashboard_updated"));
        window.dispatchEvent(new Event("mana_registrations_updated"));
      } catch {}
      setSubmitType("draft");
      setSubmitted(true);
      onSaved?.(resultEvent);
      onCreated?.(resultEvent);
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
      const reqPayload = toEventRequest(formData, "PUBLISHED");
      let resultEvent: any = {
        ...(initialData || {}),
        ...formData,
        id: eventId || (initialData as any)?.id || "EVT-" + Date.now(),
        venue: formData.venueName,
        status: "upcoming",
      };

      if (!useMock) {
        if (isEditing && (eventId || (initialData as any)?.id)) {
          const numId = typeof (eventId || (initialData as any)?.id) === "string" 
            ? parseInt(String(eventId || (initialData as any)?.id).replace(/\D/g, ""), 10) 
            : Number(eventId || (initialData as any)?.id);
          if (!isNaN(numId)) {
            const resp = await eventService.update(numId, reqPayload);
            if (resp) resultEvent = resp;
          }
        } else {
          const resp = await eventService.create(reqPayload);
          if (resp) resultEvent = resp;
        }
      }

      await syncActivitiesToScheduleSubmodules(formData.daySchedules, formData.title, resultEvent.id);

      try {
        window.dispatchEvent(new Event("mana_activities_updated"));
        window.dispatchEvent(new Event("mana_schedule_updated"));
        window.dispatchEvent(new Event("mana_event_created"));
        window.dispatchEvent(new Event("mana_event_updated"));
        window.dispatchEvent(new Event("mana_dashboard_updated"));
        window.dispatchEvent(new Event("mana_registrations_updated"));
      } catch {}
      setSubmitType("published");
      setSubmitted(true);
      onSaved?.(resultEvent);
      onCreated?.(resultEvent);
    } catch (e: any) {
      setPublishError(e.message ?? "Failed to save event");
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
          {isEditing 
            ? (isDraft ? "Event Saved as Draft!" : "Event Details Updated!")
            : (isDraft ? "Event Saved as Draft!" : "Event Published!")}
        </h2>
        <p className="text-slate-500 mb-10 max-w-sm mx-auto">
          <span className="font-semibold text-slate-700">"{formData.title || "Your event"}"</span> has been {isEditing ? "successfully updated." : (isDraft ? "saved as a draft. You can edit and publish it anytime." : `created and is now ${formData.visibility === "public" ? "publicly visible" : "live for your community"}.`)}
        </p>
        <div className="flex gap-3 justify-center">
          {isEditing ? (
            <button onClick={() => { setSubmitted(false); }}
              className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-all">
              Continue Editing
            </button>
          ) : (
            <button onClick={() => { setSubmitted(false); setStep(1); setFormData({ ...INITIAL_FORM_DATA }); }}
              className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-all">
              Create Another
            </button>
          )}
          {onClose && (
            <button onClick={onClose}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all shadow-md">
              View All Events
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
    4: <Step4PaymentAndContacts data={formData} update={update} />,
    5: <Step5FormTemplate data={formData} update={update} />,
    6: <Step6Budget data={formData} update={update} />,
    7: <Step7Media data={formData} update={update} />,
    8: <Step8Review data={formData} />,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}>
      {/* ── Modal Header ── */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
            {(() => { const S = STEPS[step - 1]; return <S.icon className="w-5 h-5 text-white" />; })()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">
                {isEditing ? "Edit event details" : "Create new event"}
              </h2>
              {formData.title && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-100 text-xs font-semibold text-purple-700 max-w-[160px] truncate">
                  <Sparkles className="w-3 h-3 flex-shrink-0 text-purple-600" /> {formData.title}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">Step {step} of {STEPS.length} · {STEPS[step - 1].desc}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Body: Stepper Sidebar + Form Content ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Stepper Sidebar (Desktop/Tablet) */}
        <div className="w-56 hidden md:flex flex-col justify-between bg-slate-50 border-r border-slate-200 p-4 shrink-0 overflow-y-auto">
          <div className="space-y-1">
            {STEPS.map(s => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => (done || active) && setStep(s.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold w-full text-left transition-all",
                    active
                      ? "bg-white border border-purple-200 text-purple-700 shadow-xs"
                      : done
                      ? "text-slate-700 hover:bg-slate-100 cursor-pointer"
                      : "text-slate-400 cursor-default opacity-70"
                  )}
                >
                  <span
                    className={cn(
                      "w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0",
                      active
                        ? "bg-purple-600 text-white"
                        : done
                        ? "bg-purple-100 text-purple-700"
                        : "bg-slate-200 text-slate-500"
                    )}
                  >
                    {done ? <Check className="w-3 h-3 stroke-[3]" /> : s.id}
                  </span>
                  <div className="truncate">
                    <p className="leading-tight">{s.label}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Status Box */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2.5 text-xs shadow-xs mt-4">
            <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", isEditing ? "bg-indigo-500" : "bg-emerald-500 animate-pulse")}></span>
            <div>
              <p className="font-bold text-slate-800 text-[11px]">{isEditing ? "Editing mode" : "Draft status"}</p>
              <p className="text-[10px] text-slate-400 font-medium">{isEditing ? "Updating live/draft event" : "Autosaved just now"}</p>
            </div>
          </div>
        </div>

        {/* Form Scroller Container */}
        <div style={{ flex: "1 1 0", minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" } as React.CSSProperties} className="px-4 sm:px-6 py-5">
          {/* Mobile Top Pill Bar Fallback */}
          <div className="md:hidden mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar pb-1">
              {STEPS.map(s => {
                const done = step > s.id;
                const active = step === s.id;
                return (
                  <button key={s.id} onClick={() => (done || active) && setStep(s.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all",
                      active ? "bg-purple-600 text-white shadow-xs"
                      : done ? "bg-purple-50 text-purple-700"
                      : "bg-slate-100 text-slate-400"
                    )}>
                    <span>{s.id}. {s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div key={step} className="animate-fade-in-up max-w-4xl mx-auto">
            {stepComponents[step]}
          </div>
        </div>
      </div>

      {/* ── Footer Navigation Bar ── */}
      <div className="flex-shrink-0 px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
          className={cn(
            "flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all",
            step === 1 ? "opacity-0 pointer-events-none" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 shadow-xs"
          )}>
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {STEPS.map(s => (
            <button key={s.id}
              onClick={() => (step >= s.id) && setStep(s.id)}
              className="rounded-full transition-all duration-300"
              style={{
                width: s.id === step ? 16 : 6,
                height: 6,
                background: s.id < step ? "rgba(124,58,237,0.4)" : s.id === step ? "#7c3aed" : "#E2E8F0",
              }}
            />
          ))}
        </div>

        {step < STEPS.length ? (
          <div className="flex items-center gap-2">
            <button onClick={handleSaveDraft} disabled={savingDraft || publishing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-all shadow-xs disabled:opacity-50">
              <Bookmark className="w-3.5 h-3.5 text-amber-500" />
              <span>{savingDraft ? "Saving…" : isEditing ? "Save Draft" : "Save Draft"}</span>
            </button>
            <button onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md transition-all">
              Next Step <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {publishError && <span className="text-[11px] text-rose-600 font-medium max-w-[160px] truncate">{publishError}</span>}
            <button onClick={handleSaveDraft} disabled={savingDraft || publishing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-all shadow-xs disabled:opacity-50">
              <Bookmark className="w-3.5 h-3.5 text-amber-500" />
              <span>{savingDraft ? "Saving…" : "Save Draft"}</span>
            </button>
            <button onClick={handlePublish} disabled={publishing || savingDraft}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all disabled:opacity-60">
              <Check className="w-3.5 h-3.5" /> {publishing ? "Saving…" : isEditing ? "Update Event" : "Publish Event"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Edit Event Dialog (full 7-step wizard modal) ─── */
export function EditEventDialog({
  open = true,
  onOpenChange,
  onClose,
  event,
  onSave,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  event: any;
  onSave?: (updated: any) => void;
}) {
  const close = () => {
    try {
      window.dispatchEvent(new Event("mana_event_created"));
      window.dispatchEvent(new Event("mana_event_updated"));
      window.dispatchEvent(new Event("mana_activities_updated"));
      window.dispatchEvent(new Event("mana_schedule_updated"));
      window.dispatchEvent(new Event("mana_dashboard_updated"));
      window.dispatchEvent(new Event("mana_registrations_updated"));
    } catch {}
    if (onClose) onClose();
    else onOpenChange?.(false);
  };

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  if (!open || !event) return null;

  return createPortal(
    <>
      <div
        onClick={close}
        style={{
          position: "fixed", inset: 0, zIndex: 9998,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />
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
            maxWidth: "54rem",
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
            initialData={event}
            eventId={event?.id}
            isEdit={true}
            onClose={close}
            onSaved={(updated) => {
              onSave?.(updated);
              close();
            }}
          />
        </div>
      </div>
    </>,
    document.body
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
            onClose={() => {
              onOpenChange(false);
              try {
                window.dispatchEvent(new Event("mana_event_created"));
                window.dispatchEvent(new Event("mana_activities_updated"));
                window.dispatchEvent(new Event("mana_schedule_updated"));
                window.dispatchEvent(new Event("mana_dashboard_updated"));
                window.dispatchEvent(new Event("mana_registrations_updated"));
              } catch {}
            }}
            onCreated={() => {
              try {
                window.dispatchEvent(new Event("mana_event_created"));
                window.dispatchEvent(new Event("mana_activities_updated"));
                window.dispatchEvent(new Event("mana_schedule_updated"));
                window.dispatchEvent(new Event("mana_dashboard_updated"));
                window.dispatchEvent(new Event("mana_registrations_updated"));
              } catch {}
            }}
          />
        </div>
      </div>
    </>,
    document.body
  );
}

export function CreateEventButton({ className }: { className?: string }) {
  const { user, hasPermission, isAdmin, isSuperAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  const userRolesUpper = (user?.roles || []).map((r: any) => String(r?.name || r).toUpperCase());
  const canCreate =
    isAdmin ||
    isSuperAdmin ||
    userRolesUpper.includes("ADMIN") ||
    userRolesUpper.includes("COMMUNITY_ADMIN") ||
    userRolesUpper.includes("EVENT_ADMIN") ||
    userRolesUpper.includes("EVENTS_ADMIN") ||
    hasPermission(CREATE_EVENT) ||
    hasPermission(MANAGE_EVENT_DASHBOARD);

  if (!canCreate) {
    return null;
  }

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
