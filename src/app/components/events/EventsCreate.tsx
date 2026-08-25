import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays, Calendar, MapPin, Users, IndianRupee, Image,
  CheckCircle2, ChevronRight, ChevronLeft, ChevronDown, Sparkles, Clock,
  Globe, Lock, Building2, Heart, Music, Utensils,
  Briefcase, GraduationCap, Tent, Plus, X, Upload,
  Tag, AlertCircle, Check, Ticket, Eye, FileText,
  Zap, Star, ArrowRight, Trash2, PlusCircle, Link2, Flame, Copy,
  Save, Bookmark, XCircle, Mail, CreditCard, QrCode, Phone, User, Info, Loader2,
} from "lucide-react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { SectionHeader, FieldLabel, ToggleRow } from "./shared";

import { cn } from "../ui/utils";
import { TimePicker } from "../ui/time-picker";
import { DatePicker } from "../ui/date-picker";
import { useAuth } from "../../../contexts/AuthContext";
import { CREATE_EVENT, MANAGE_EVENT_DASHBOARD } from "../../../constants/permissions";
import { useEventMock } from "./EventMockToggle";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import { eventService, type EventRequest } from "../../../services/events/eventService";
import { ticketCategoryService, type TicketCategoryMasterResponse } from "../../../services/events/ticketCategoryService";
import { showSuccess, showError } from "../../../utils/ToastUtils";
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
  subEventId?: number;
  categoryType: string; // "Pooja & Seva" | "Lunch" | "Dinner" | "Cultural Events" | "Competitions" | "Other"
  customType?: string;
  name: string;
  poojaType?: string;  // Pooja & Seva: type stored in event_pooja_types
  needsRegistration: boolean;
  registrationFee?: string;
  slots?: string;
  startTime: string;
  endTime: string;
  description: string; // maps to notes
  venue?: string;      // maps to mandap/location
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

  // 1. Group all Pooja & Seva activities across all days by poojaType / name
  const poojaGroups = new Map<string, { dayDate: string; act: ScheduleActivity }[]>();

  for (const day of daySchedules) {
    for (const act of day.activities) {
      if (!act.name || !act.name.trim()) continue;
      const cat = act.categoryType || "Other";
      if (cat === "Pooja & Seva") {
        const key = (act.poojaType || act.name).trim().toLowerCase();
        if (!poojaGroups.has(key)) {
          poojaGroups.set(key, []);
        }
        poojaGroups.get(key)!.push({ dayDate: day.date, act });
      }
    }
  }

  // Sync consolidated poojas (1 single record per pooja type even when selected across multiple days)
  if (poojaGroups.size > 0) {
    let existingTypes: { id: number; name: string; description?: string }[] = [];
    try {
      existingTypes = await eventService.getPoojaTypes();
    } catch {}

    for (const [, entries] of poojaGroups.entries()) {
      if (entries.length === 0) continue;
      const first = entries[0].act;
      const poojaTypeName = first.poojaType || first.name || "Pooja";

      // Match or register the pooja type in event_pooja_types
      let poojaTypeId: number | undefined;
      const matchedType = existingTypes.find(
        t => t.name.trim().toLowerCase() === poojaTypeName.trim().toLowerCase()
      );
      if (matchedType) {
        poojaTypeId = matchedType.id;
      } else {
        try {
          const createdType = await eventService.createPoojaType(poojaTypeName);
          if (createdType?.id) {
            poojaTypeId = createdType.id;
            existingTypes.push(createdType);
          }
        } catch (e) {
          console.warn("Pooja type create notice:", e);
        }
      }

      // Collect all distinct dates and times
      const allDates = [...new Set(entries.map(e => e.dayDate).filter(Boolean))].sort();
      const minDate = allDates[0] || new Date().toISOString().split("T")[0];
      const maxDate = allDates[allDates.length - 1] || minDate;
      const isMultiDay = allDates.length > 1;

      const distinctStartTimes = [...new Set(entries.map(e => e.act.startTime || "08:30"))];
      const timeSlotConfig = entries.map(e => ({
        slotDate: e.dayDate,
        startTime: e.act.startTime || "08:30",
        slotCount: parseInt(e.act.slots || "50", 10) || 50,
      }));
      const totalSlots = timeSlotConfig.reduce((acc, curr) => acc + curr.slotCount, 0);

      const feeNum = parseFloat(first.registrationFee || "0") || 0;
      const existingSubEventId = entries.find(e => e.act.subEventId)?.act.subEventId;

      const payload = {
        mainEventId: numericEventId,
        poojaTypeId: poojaTypeId,
        name: first.name,
        type: poojaTypeName,
        date: minDate,
        endDate: isMultiDay ? maxDate : undefined,
        multiDay: isMultiDay,
        startTime: distinctStartTimes[0] || "08:30",
        endTime: first.endTime || undefined,
        mandap: first.venue || "Main Temple Mandap",
        notes: first.description || "",
        slots: totalSlots,
        fee: feeNum,
        isFree: feeNum === 0,
        startTimes: distinctStartTimes,
        timeSlotConfig: timeSlotConfig,
      };

      try {
        if (existingSubEventId) {
          await eventService.updatePoojaSeva(existingSubEventId, payload);
        } else {
          await eventService.createPoojaSeva(payload);
        }
      } catch (e) {
        console.warn("Database save consolidated pooja notice:", e);
      }
    }
  }

  // 2. Sync remaining category submodules (Lunch/Dinner, Cultural, Competitions)
  for (const day of daySchedules) {
    for (const act of day.activities) {
      if (!act.name || !act.name.trim()) continue;
      const cat = act.categoryType || "Other";
      if (cat === "Pooja & Seva") continue; // Handled above in consolidated sync

      const feeNum = parseFloat(act.registrationFee || "0") || 0;
      const slotsNum = parseInt(act.slots || "50", 10) || 50;

      if (cat === "Lunch" || cat === "Dinner") {
        const payload = {
          mainEventId: numericEventId,
          name: act.name,
          mealType: cat,
          date: day.date,
          startTime: act.startTime || (cat === "Lunch" ? "12:00" : "19:00"),
          endTime: act.endTime || (cat === "Lunch" ? "14:00" : "21:00"),
          venue: act.venue || act.description || "Community Dining Hall",
          targetPlates: slotsNum,
          dietType: "Vegetarian",
          fee: feeNum,
          isFree: feeNum === 0,
          menuItems: ["Mahaprasadam Meal", "Rice", "Curry", "Sweet"],
          notes: act.description || "",
        };
        try {
          if (act.subEventId) {
            await eventService.updateLunchDinner(act.subEventId, payload);
          } else {
            await eventService.createLunchDinner(payload);
          }
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
          stage: act.venue || act.description || "Main Stage",
          requirements: "Sound system & lighting",
          fee: feeNum,
          isFree: feeNum === 0,
        };
        try {
          if (act.subEventId) {
            await eventService.updateCulturalEvent(act.subEventId, payload);
          } else {
            await eventService.createCulturalEvent(payload);
          }
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
          venue: act.venue || act.description || "Auditorium",
          fee: String(feeNum),
          isFree: feeNum === 0,
          maxParticipants: String(slotsNum),
        };
        try {
          if (act.subEventId) {
            await eventService.updateCompetition(act.subEventId, payload);
          } else {
            await eventService.createCompetition(payload);
          }
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

interface StepItem {
  id: number;
  label: string;
  desc: string;
  icon: any;
}

const STEPS: StepItem[] = [
  { id: 1, label: "Basics",             desc: "Name, type & description",      icon: CalendarDays },
  { id: 2, label: "Schedule",           desc: "Date, time & day agenda",       icon: Clock        },
  { id: 3, label: "Venue",              desc: "Venue, city & address",         icon: MapPin       },
  { id: 4, label: "Registration",       desc: "Tickets & categories",          icon: Ticket       },
  { id: 5, label: "Payment & Contacts", desc: "Payment modes, QR & contacts", icon: CreditCard   },
  { id: 6, label: "Reg. Form",          desc: "Select form template",          icon: FileText     },
  { id: 7, label: "Budget",             desc: "Allocation & breakdown",        icon: IndianRupee  },
  { id: 8, label: "Media",              desc: "Cover image & tags",            icon: Image        },
  { id: 9, label: "Review",             desc: "Verify & publish",              icon: Eye          },
];

const BUDGET_CATEGORIES = [
  "Venue & Mandap Setup",
  "Food & Catering (Prasadam / Meals)",
  "Decoration & Flower Arrangements",
  "Audio / Visual, Sound & Stage Lighting",
  "Pooja & Homam Ritual Samagri",
  "Pandit & Priest Dakshina / Honorarium",
  "Security, Bouncers & Gate Pass Desks",
  "Marketing, Banners & Social Media",
  "Transport, Logistics & Generator Power",
  "Volunteers Honorarium & T-shirts",
  "Prizes, Mementos, Trophies & Gifts",
  "Photography, Drone & Videography",
  "Waste Management & Post-event Cleaning",
  "Medical Kit & First Aid",
  "Permits, Police & Fire Licenses",
  "Miscellaneous / Contingency Fund",
  "Other",
];

const DEFAULT_TICKET_TYPES: TicketType[] = [
  { id: "t1", name: "General",   price: "0",   qty: "0", description: "Open for all community members" },
  { id: "t2", name: "Volunteer", price: "0",   qty: "0", description: "Volunteer registration & duty pass" },
];

const DEFAULT_BUDGET_ITEMS: BudgetItem[] = [
  { id: "b1", category: "Venue & Mandap Setup",                   amount: "" },
  { id: "b2", category: "Food & Catering (Prasadam / Meals)",     amount: "" },
  { id: "b3", category: "Decoration & Flower Arrangements",        amount: "" },
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
  enableOnlinePayment: false,
  paymentModes: ["Cash"],
  upiId: "",
  scannerUrl: "",
  notes: "",
  paymentInstructions: "Please scan the QR code using any UPI app (GPay, PhonePe, Paytm) and save the transaction screenshot/UTR.",
  contacts: DEFAULT_CONTACTS,
};

// shadcn theme tokens: --input-background:#f3f3f5, --border:rgba(0,0,0,0.1), --radius:0.625rem
const INPUT_CLS = "w-full px-2.5 py-1.5 h-8.5 rounded-lg border border-black/10 bg-[#f3f3f5] text-[11.5px] text-slate-800 placeholder-slate-400 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 transition-all";

const reqCls = (isEmpty: boolean) =>
  isEmpty ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 bg-rose-50/30" : "";

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
    <div className="space-y-3.5 sm:space-y-5">
      <div>
        <FieldLabel required>Event Title</FieldLabel>
        <Input
          value={data.title}
          onChange={e => update("title", e.target.value)}
          placeholder="e.g. Ganesh Chaturthi 2026 – Grand Celebration"
          className={cn(INPUT_CLS, "h-9 text-xs sm:text-[13px] font-semibold", reqCls(!data.title?.trim()))}
        />
      </div>

      <div>
        <FieldLabel required>Event Type</FieldLabel>
        <div className={cn("flex flex-wrap gap-1.5 p-1 rounded-xl transition-all", reqCls(!data.eventType && !data.category))}>
          {EVENT_TYPES.map(t => {
            const currentVal = (data.eventType || "").toLowerCase().trim();
            const currentCat = (data.category || "").toLowerCase().trim();
            const selected = currentVal === t.value.toLowerCase() || 
                             currentVal === t.label.toLowerCase() ||
                             currentCat === t.value.toLowerCase() ||
                             currentCat === t.label.toLowerCase();
            return (
              <button key={t.value} onClick={() => {
                update("eventType", t.value);
                update("category", t.label);
              }}
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10.5px] font-semibold transition-all duration-150 cursor-pointer"
                style={{
                  borderColor: selected ? t.color : "#E2E8F0",
                  background: selected ? hexRgba(t.color, 0.08) : "#FAFAFA",
                  color: selected ? t.color : "#64748B",
                  boxShadow: selected ? `0 0 0 2.5px ${hexRgba(t.color, 0.12)}` : "none",
                  fontWeight: selected ? 700 : 600,
                }}>
                <t.icon className="w-2.5 h-2.5" style={{ color: selected ? t.color : "#94A3B8" }} strokeWidth={2.2} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description & Visibility Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Left: Description */}
        <div className="flex flex-col">
          <FieldLabel required hint={`${data.description.length}/1000`}>Description</FieldLabel>
          <Textarea 
            value={data.description} 
            onChange={e => update("description", e.target.value)} 
            rows={5}
            placeholder="Describe your event – purpose, highlights, what attendees can expect…"
            className={cn(INPUT_CLS, "resize-none h-full min-h-[120px] text-xs leading-relaxed", reqCls(!data.description?.trim()))} 
          />
        </div>

        {/* Right: Visibility Options */}
        <div className="flex flex-col">
          <FieldLabel>Visibility</FieldLabel>
          <div className="flex flex-col gap-1.5 h-full justify-between">
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
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all duration-150 flex-1 hover:border-slate-300 cursor-pointer"
                  style={{
                    borderColor: selected ? opt.color : "#E2E8F0",
                    background: selected ? hexRgba(opt.color, 0.05) : "#FAFAFA",
                    boxShadow: selected ? `0 0 0 2.5px ${hexRgba(opt.color, 0.10)}` : "none",
                  }}
                >
                  <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: selected ? hexRgba(opt.color, 0.14) : "#F1F5F9" }}>
                    <opt.icon className="w-3 h-3" style={{ color: selected ? opt.color : "#94A3B8" }} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold leading-none" style={{ color: selected ? opt.color : "#334155" }}>{opt.label}</p>
                      {selected && <span className="w-1.5 h-1.5 rounded-full" style={{ background: opt.color }} />}
                    </div>
                    <p className="text-[9.5px] text-slate-400 mt-0.5 leading-tight truncate">{opt.desc}</p>
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
  if (!start) return [];
  if (!end || end === start) return [start];
  const days: string[] = [];
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  if (!sy || !sm || !sd || !ey || !em || !ed) return [start];
  const d = new Date(sy, sm - 1, sd, 12, 0, 0);
  const last = new Date(ey, em - 1, ed, 12, 0, 0);
  let limit = 0;
  while (d <= last && limit < 60) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    days.push(`${year}-${month}-${day}`);
    d.setDate(d.getDate() + 1);
    limit++;
  }
  return days;
}

function formatDayLabel(dateStr: string): string {
  const [y, m, d] = (dateStr || "").split("-").map(Number);
  const dt = y && m && d ? new Date(y, m - 1, d, 12, 0, 0) : new Date();
  return dt.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
}

const FESTIVAL_AGENDA_PLACEHOLDERS: ScheduleActivity[] = [
  // Pooja & Seva
  { id: "p1", categoryType: "Pooja & Seva", name: "Ganesh Puja & Morning Aarti Ritual", needsRegistration: true, registrationFee: "0", slots: "100", startTime: "08:00", endTime: "09:00", description: "Traditional inauguration & morning stotram aarti", venue: "Main Mandap" },
  { id: "p2", categoryType: "Pooja & Seva", name: "Maha Ganapathi Homam & Sankalpam", needsRegistration: true, registrationFee: "0", slots: "50", startTime: "08:30", endTime: "10:00", description: "Vedic havan with sacred mantras and sankalpam", venue: "Yagna Shala / Main Mandap" },
  { id: "p3", categoryType: "Pooja & Seva", name: "Navagraha Pooja & Sahasranama Archana", needsRegistration: true, registrationFee: "0", slots: "75", startTime: "10:30", endTime: "11:30", description: "Nine planetary deity prayers with flower archana", venue: "Main Mandap" },
  { id: "p4", categoryType: "Pooja & Seva", name: "Evening Maha Mangala Aarti & Deepotsav", needsRegistration: false, registrationFee: "0", slots: "300", startTime: "19:00", endTime: "20:00", description: "Lighting of 1008 deepas & grand evening arati", venue: "Main Stage & Mandap" },
  { id: "p5", categoryType: "Pooja & Seva", name: "Satyanarayan Swamy Vratam & Katha", needsRegistration: true, registrationFee: "0", slots: "60", startTime: "16:00", endTime: "18:00", description: "Community vratam prayer, katha recitation and prasadam", venue: "Mandap Hall" },
  
  // Cultural Events
  { id: "p6", categoryType: "Cultural Events", name: "Classical Bharatanatyam Dance & Music", needsRegistration: false, registrationFee: "0", slots: "200", startTime: "09:30", endTime: "11:00", description: "Stage performance by community troupe dancers", venue: "Main Stage" },
  { id: "p7", categoryType: "Cultural Events", name: "Grand Evening Musical Concert & Orchestra", needsRegistration: false, registrationFee: "0", slots: "400", startTime: "19:00", endTime: "21:30", description: "Live concert & devotional celebrity music performance", venue: "Amphitheatre" },
  { id: "p8", categoryType: "Cultural Events", name: "Chief Guest Speech, Felicitation & Prize Ceremony", needsRegistration: false, registrationFee: "0", slots: "300", startTime: "17:00", endTime: "18:30", description: "Dignitary felicitation ceremony & awards distribution", venue: "Main Stage" },
  { id: "p9", categoryType: "Cultural Events", name: "Mythological Drama / Natakam: Bhakta Prahlada", needsRegistration: false, registrationFee: "0", slots: "250", startTime: "18:30", endTime: "20:30", description: "Epic stage play performed by community youth drama group", venue: "Main Stage" },
  { id: "p10", categoryType: "Cultural Events", name: "Kids & Teens Fancy Dress & Cultural Showcase", needsRegistration: true, registrationFee: "0", slots: "80", startTime: "16:30", endTime: "18:00", description: "Traditional mythological costume showcase for kids and youth", venue: "Auditorium" },
  
  // Competitions
  { id: "p11", categoryType: "Competitions", name: "Cultural Talent Hunt & Singing Competition", needsRegistration: true, registrationFee: "0", slots: "50", startTime: "11:15", endTime: "12:45", description: "Youth & adult devotional and classical singing contest", venue: "Auditorium" },
  { id: "p12", categoryType: "Competitions", name: "Youth & Kids Rangoli Art & Clay Workshop", needsRegistration: true, registrationFee: "0", slots: "60", startTime: "15:00", endTime: "16:30", description: "Traditional floral rangoli & eco-friendly clay art", venue: "Activity Hall" },
  { id: "p13", categoryType: "Competitions", name: "Drawing & Painting Competition for Children", needsRegistration: true, registrationFee: "0", slots: "60", startTime: "10:00", endTime: "11:30", description: "Art contest for age groups 5-10 and 11-16", venue: "Activity Hall" },
  { id: "p14", categoryType: "Competitions", name: "Traditional Cooking & Modak Making Contest", needsRegistration: true, registrationFee: "0", slots: "40", startTime: "11:30", endTime: "13:00", description: "Culinary competition for traditional festive delicacies", venue: "Club House" },
  
  // Food & Meals
  { id: "p15", categoryType: "Lunch", name: "Prasadam & Grand Community Lunch Feast", needsRegistration: true, registrationFee: "0", slots: "500", startTime: "13:00", endTime: "14:30", description: "Traditional vegetarian feast & prasadam distribution", venue: "Dining Hall" },
  { id: "p16", categoryType: "Dinner", name: "Community Annadanam & Mahaprasadam Dinner", needsRegistration: true, registrationFee: "0", slots: "500", startTime: "19:30", endTime: "21:00", description: "Community dinner buffet & sweet distribution", venue: "Dining Hall" },
];

interface AgendaPlaceholdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate: string;
  onAddActivities: (targetDate: string, activities: ScheduleActivity[]) => void;
}

function AgendaPlaceholdersModal({ isOpen, onClose, targetDate, onAddActivities }: AgendaPlaceholdersModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedIds([]);
      setCategoryFilter("All");
      setSearchQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ["All", "Pooja & Seva", "Cultural Events", "Competitions", "Lunch", "Dinner"];

  const filtered = FESTIVAL_AGENDA_PLACEHOLDERS.filter(item => {
    const matchesCat = categoryFilter === "All" || item.categoryType === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || item.name.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q)) || (item.venue && item.venue.toLowerCase().includes(q));
    return matchesCat && matchesQuery;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    const visibleIds = filtered.map(x => x.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleConfirm = () => {
    const chosen = FESTIVAL_AGENDA_PLACEHOLDERS.filter(p => selectedIds.includes(p.id));
    if (chosen.length === 0) return;
    onAddActivities(targetDate, chosen);
    onClose();
  };

  const allVisibleSelected = filtered.length > 0 && filtered.every(x => selectedIds.includes(x.id));

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-white border-b border-indigo-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                Select Agenda Placeholders
                <Badge variant="outline" className="bg-indigo-100/70 border-indigo-200 text-indigo-700 font-bold text-[10px]">
                  {formatDayLabel(targetDate)}
                </Badge>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pick pre-built festival and community agenda templates to add to this day.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="p-3.5 bg-slate-50/80 border-b border-slate-200/80 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search placeholders by activity name, venue, or timing..."
                className="h-9 pl-3 text-xs bg-white border-slate-200"
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleSelectAll}
              className="h-9 px-3 text-xs font-bold border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 cursor-pointer shrink-0"
            >
              {allVisibleSelected ? "Deselect All" : "Select All"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-0.5">
            {categories.map(cat => {
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border",
                    active
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60"
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* List of Placeholders */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No agenda placeholders matching your filter.
            </div>
          ) : (
            filtered.map(item => {
              const isSelected = selectedIds.includes(item.id);
              const catColor = ACTIVITY_CATEGORY_OPTIONS.find(c => c.value === item.categoryType)?.color || "#4f46e5";
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={cn(
                    "p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3.5",
                    isSelected
                      ? "border-indigo-400 bg-indigo-50/50 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                  )}
                >
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(item.id)}
                      className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.2"
                        style={{
                          color: catColor,
                          borderColor: hexRgba(catColor, 0.3),
                          backgroundColor: hexRgba(catColor, 0.08),
                        }}
                      >
                        {item.categoryType}
                      </Badge>
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {item.startTime} – {item.endTime}
                      </span>
                      {item.needsRegistration && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                          Pass Required
                        </Badge>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {item.venue ? `📍 ${item.venue}` : ""} {item.description ? `• ${item.description}` : ""}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-600">
            {selectedIds.length > 0 ? (
              <span className="text-indigo-600 font-extrabold">{selectedIds.length} activities selected</span>
            ) : (
              <span className="text-slate-400">Select activities to import</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="px-4 text-xs font-bold border-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={selectedIds.length === 0}
              onClick={handleConfirm}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 px-4 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add {selectedIds.length > 0 ? `(${selectedIds.length})` : ""} to Day
            </Button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}

function Step2Schedule({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  const [expandedDay, setExpandedDay] = useState<string | null>(() => {
    return data.daySchedules.length > 0 ? data.daySchedules[0].date : null;
  });
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [notifDayLabel, setNotifDayLabel] = useState<string | undefined>(undefined);
  const [notifActivityTitle, setNotifActivityTitle] = useState<string | undefined>(undefined);
  const [placeholderModalOpen, setPlaceholderModalOpen] = useState(false);
  const [placeholderTargetDate, setPlaceholderTargetDate] = useState<string | null>(null);

  const initializedDayRef = useRef(false);
  useEffect(() => {
    if (!initializedDayRef.current && data.daySchedules.length > 0) {
      initializedDayRef.current = true;
      setExpandedDay(data.daySchedules[0].date);
    }
  }, [data.daySchedules]);

  const [poojaTypeOptions, setPoojaTypeOptions] = useState<{ id: number; name: string }[]>([]);
  useEffect(() => {
    eventService.getPoojaTypes().then((types: { id: number; name: string }[]) => {
      if (Array.isArray(types) && types.length > 0) setPoojaTypeOptions(types);
    }).catch(() => {});
  }, []);

  const [addingTypeForActId, setAddingTypeForActId] = useState<string | null>(null);
  const [newPoojaTypeName, setNewPoojaTypeName] = useState("");
  const [addingType, setAddingType] = useState(false);
  const [addTypeError, setAddTypeError] = useState("");

  const handleAddPoojaType = async (actId: string, actDate: string) => {
    const clean = newPoojaTypeName.trim();
    if (!clean) return;
    setAddingType(true);
    setAddTypeError("");
    try {
      const created = await eventService.createPoojaType(clean);
      setPoojaTypeOptions(prev => prev.some(t => t.name === created.name) ? prev : [...prev, { id: created.id, name: created.name }]);
      updateActivity(actDate, actId, "poojaType", created.name);
      setAddingTypeForActId(null);
      setNewPoojaTypeName("");
    } catch {
      setAddTypeError("Failed to save type. Try again.");
    } finally {
      setAddingType(false);
    }
  };

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

  const allDaysInRange = data.multiDay && data.startDate && data.endDate && data.endDate >= data.startDate
    ? getDaysBetween(data.startDate, data.endDate)
    : data.startDate ? [data.startDate] : [];

  const handleSelectDay = (dateStr: string) => {
    if (!dateStr) return;
    const exists = data.daySchedules.some(ds => ds.date === dateStr);
    if (!exists) {
      const newDay: DaySchedule = {
        date: dateStr,
        activities: [],
      };
      const updated = [...data.daySchedules, newDay].sort((a, b) => a.date.localeCompare(b.date));
      update("daySchedules", updated);
    }
    setExpandedDay(dateStr);
  };

  const isEndDateInvalid = Boolean(data.multiDay && data.endDate && data.startDate && data.endDate < data.startDate);
  const isTimeInvalid = Boolean(
    (!data.multiDay || data.startDate === data.endDate) &&
    data.startTime &&
    data.endTime &&
    data.endTime <= data.startTime
  );

  const handleStartDate = (val: string) => {
    update("startDate", val);
    if (data.multiDay) {
      if (data.endDate && data.endDate < val) {
        update("endDate", val);
      }
      if (data.daySchedules.length > 0) {
        const pruned = data.daySchedules.filter(ds => ds.date >= val && (!data.endDate || ds.date <= data.endDate));
        update("daySchedules", pruned);
      }
    }
  };

  const handleEndDate = (val: string) => {
    update("endDate", val);
    if (data.multiDay && data.startDate && val >= data.startDate) {
      if (data.daySchedules.length > 0) {
        const pruned = data.daySchedules.filter(ds => ds.date >= data.startDate && ds.date <= val);
        update("daySchedules", pruned);
      }
    }
  };

  const handleMultiDayToggle = (v: boolean) => {
    update("multiDay", v);
    if (v) {
      const targetStart = data.startDate || new Date().toISOString().split("T")[0];
      const targetEnd = data.endDate && data.endDate >= targetStart ? data.endDate : targetStart;
      if (!data.endDate || data.endDate < targetStart) {
        update("endDate", targetEnd);
      }
      if (data.daySchedules.length > 0) {
        const valid = data.daySchedules.filter(ds => ds.date >= targetStart && ds.date <= targetEnd);
        update("daySchedules", valid);
      }
    } else {
      if (data.startDate) {
        const existingForStart = data.daySchedules.find(ds => ds.date === data.startDate);
        update("daySchedules", existingForStart ? [existingForStart] : []);
      }
    }
  };

  const handleAddDay = () => {
    // Look for first unconfigured date in range if multiDay
    if (data.multiDay && allDaysInRange.length > 0) {
      const unconfigured = allDaysInRange.find(d => !data.daySchedules.some(ds => ds.date === d));
      if (unconfigured) {
        handleSelectDay(unconfigured);
        return;
      }
    }
    const lastDay = data.daySchedules[data.daySchedules.length - 1];
    let nextDateStr = new Date().toISOString().split("T")[0];
    if (lastDay && lastDay.date) {
      const d = new Date(lastDay.date + "T00:00:00");
      d.setDate(d.getDate() + 1);
      nextDateStr = d.toISOString().split("T")[0];
    }
    const newDay: DaySchedule = {
      date: nextDateStr,
      activities: [],
    };
    const updated = [...data.daySchedules, newDay];
    update("daySchedules", updated);
    if (data.multiDay) {
      update("endDate", nextDateStr);
    }
    setExpandedDay(nextDateStr);
  };

  const handleRemoveDay = (dateToRemove: string) => {
    if (data.daySchedules.length <= 1 && !data.multiDay) return;
    const updated = data.daySchedules.filter(ds => ds.date !== dateToRemove);
    update("daySchedules", updated);
    if (data.multiDay && updated.length > 0) {
      update("endDate", updated[updated.length - 1].date);
    }
    if (expandedDay === dateToRemove) {
      setExpandedDay(updated[0]?.date || null);
    }
  };

  const handleOpenPlaceholderModal = (dateStr?: string) => {
    const target = dateStr || expandedDay || data.startDate || new Date().toISOString().split("T")[0];
    setPlaceholderTargetDate(target);
    setPlaceholderModalOpen(true);
  };

  const handleAddPlaceholders = (targetDate: string, selectedActivities: ScheduleActivity[]) => {
    if (!targetDate || selectedActivities.length === 0) return;
    const cloned = selectedActivities.map(p => ({
      ...p,
      id: `a${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    }));
    const exists = data.daySchedules.some(ds => ds.date === targetDate);
    let updated: DaySchedule[];
    if (exists) {
      updated = data.daySchedules.map(ds => {
        if (ds.date === targetDate) {
          return {
            ...ds,
            activities: [...ds.activities, ...cloned],
          };
        }
        return ds;
      });
    } else {
      const newDay: DaySchedule = {
        date: targetDate,
        activities: cloned,
      };
      updated = [...data.daySchedules, newDay].sort((a, b) => a.date.localeCompare(b.date));
    }
    update("daySchedules", updated);
    setExpandedDay(targetDate);
    showSuccess(`Added ${selectedActivities.length} activities to ${formatDayLabel(targetDate)}`);
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

  const updateActivityFields = (date: string, actId: string, fields: Partial<ScheduleActivity>) => {
    const updated = data.daySchedules.map(ds =>
      ds.date === date
        ? { ...ds, activities: ds.activities.map(a => a.id === actId ? { ...a, ...fields } : a) }
        : ds
    );
    update("daySchedules", updated);
  };

  const cloneActivity = (date: string, actToClone: ScheduleActivity) => {
    const clonedObj: ScheduleActivity = {
      ...actToClone,
      id: `a${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      subEventId: undefined, // Fresh subEventId for cloned activity
    };
    const updated = data.daySchedules.map(ds => {
      if (ds.date === date) {
        const targetIdx = ds.activities.findIndex(a => a.id === actToClone.id);
        const newActivities = [...ds.activities];
        if (targetIdx >= 0) {
          newActivities.splice(targetIdx + 1, 0, clonedObj);
        } else {
          newActivities.push(clonedObj);
        }
        return {
          ...ds,
          activities: newActivities,
        };
      }
      return ds;
    });
    update("daySchedules", updated);
    showSuccess(`Cloned "${actToClone.name || "Sub-Event"}" successfully`);
  };

  const duplicateAboveActivity = (date: string) => {
    const daySchedule = data.daySchedules.find(ds => ds.date === date);
    if (!daySchedule || daySchedule.activities.length === 0) {
      const currentDayIdx = data.daySchedules.findIndex(ds => ds.date === date);
      if (currentDayIdx > 0) {
        const prevDay = data.daySchedules[currentDayIdx - 1];
        if (prevDay && prevDay.activities.length > 0) {
          const lastPrevAct = prevDay.activities[prevDay.activities.length - 1];
          const clonedObj: ScheduleActivity = {
            ...lastPrevAct,
            id: `a${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            subEventId: undefined,
          };
          const updated = data.daySchedules.map(ds =>
            ds.date === date
              ? { ...ds, activities: [...ds.activities, clonedObj] }
              : ds
          );
          update("daySchedules", updated);
          showSuccess(`Copied "${lastPrevAct.name || "Sub-Event"}" from previous day`);
          return;
        }
      }
      addActivity(date);
      return;
    }
    const lastActivity = daySchedule.activities[daySchedule.activities.length - 1];
    cloneActivity(date, lastActivity);
  };

  const dayCount = data.daySchedules.length;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Date & Time Header + Compact Multi-day Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 sm:px-3 sm:py-2 rounded-xl bg-slate-50 border border-slate-200/90 transition-all hover:bg-slate-100/60 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800">Multi-day Event</span>
              <Badge variant="outline" className={cn("text-[9.5px] px-1.5 py-0 font-bold", data.multiDay ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-slate-100 border-slate-200 text-slate-500")}>
                {data.multiDay ? "Active" : "Single Day"}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400">
              {data.multiDay ? "Multiple dates schedule builder enabled" : "Configure single date timing and agenda"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">{data.multiDay ? "Multi-Day Schedule" : "Single Day"}</span>
          <Switch checked={data.multiDay} onCheckedChange={handleMultiDayToggle} />
        </div>
      </div>

      {/* Date & Time Input Grid */}
      <div className={cn(
        "grid gap-2.5",
        data.multiDay ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"
      )}>
        <div>
          <FieldLabel required>{data.multiDay ? "Start Date" : "Event Date"}</FieldLabel>
          <DatePicker
            value={data.startDate}
            onChange={v => handleStartDate(v)}
            size="sm"
            className={reqCls(!data.startDate)}
          />
        </div>
        {data.multiDay && (
          <div className="animate-fade-in-up">
            <FieldLabel required>End Date</FieldLabel>
            <DatePicker
              value={data.endDate}
              min={data.startDate || undefined}
              onChange={v => handleEndDate(v)}
              size="sm"
              className={cn(
                isEndDateInvalid ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/20 text-rose-900 font-semibold" : reqCls(!data.endDate)
              )}
            />
            {isEndDateInvalid && (
              <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0 text-rose-600" />
                End date cannot be earlier than start date ({data.startDate}).
              </p>
            )}
          </div>
        )}
        <div>
          <FieldLabel required>Start Time</FieldLabel>
          <TimePicker
            value={data.startTime}
            onChange={v => update("startTime", v)}
            size="sm"
            className={reqCls(!data.startTime)}
          />
        </div>
        <div>
          <FieldLabel required>End Time</FieldLabel>
          <TimePicker
            value={data.endTime}
            onChange={v => update("endTime", v)}
            size="sm"
            className={cn(
              isTimeInvalid ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/20 text-rose-900 font-semibold" : reqCls(!data.endTime)
            )}
          />
          {isTimeInvalid && (
            <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0 text-rose-600" />
              End time must be after start time ({data.startTime}).
            </p>
          )}
        </div>
      </div>

      {/* Day-wise schedule builder */}
      <div className="animate-fade-in-up pt-3 border-t border-slate-200/80 space-y-3.5">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Zap className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-slate-900 tracking-tight">Day-wise Agenda &amp; Activities</h4>
                <Badge variant="outline" className="text-[10px] font-extrabold bg-indigo-50/70 border-indigo-200 text-indigo-700 px-2 py-0.5">
                  {dayCount > 0 ? `${dayCount} Day${dayCount > 1 ? "s" : ""} Configured` : "0 Days"}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Organize Poojas, Sevas, Cultural Shows, Prasadam Meals, and Competitions per day.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Add Day button hidden as of now */}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleOpenPlaceholderModal()}
              className="h-8.5 px-3 text-xs font-bold border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 rounded-xl shadow-2xs gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Agenda Placeholders
            </Button>
            {dayCount > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => triggerNotification()}
                className="h-8.5 px-3 text-xs font-bold bg-white border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-600 rounded-xl shadow-2xs gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Mail className="w-3.5 h-3.5 text-indigo-500" /> Notify Email
              </Button>
            )}
          </div>
        </div>

        {/* Interactive Day Switcher Tabs for Multi-Day or Configured Days */}
        {dayCount > 0 && (
          <div className="p-2.5 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Select Day Schedule
              </span>
              <span className="text-[10.5px] font-medium text-slate-400">
                Click a day tab to view and manage its agenda
              </span>
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
              {data.daySchedules.map((day, idx) => {
                const isActive = expandedDay === day.date;
                const actCount = day.activities.filter(a => a.name?.trim()).length;
                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setExpandedDay(day.date)}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0",
                      isActive
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-md shadow-indigo-500/20 ring-2 ring-indigo-300/50"
                        : "bg-white text-slate-700 border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                    )}
                  >
                    <span className={cn(
                      "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0",
                      isActive ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700"
                    )}>
                      {idx + 1}
                    </span>
                    <span className="truncate max-w-[130px]">{formatDayLabel(day.date)}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9.5px] px-1.5 py-0 font-extrabold shrink-0",
                        isActive
                          ? "bg-white/20 border-white/30 text-white"
                          : actCount > 0
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-slate-100 border-slate-200 text-slate-500"
                      )}
                    >
                      {actCount} {actCount === 1 ? "activity" : "activities"}
                    </Badge>
                  </button>
                );
              })}

              {/* Extra unconfigured days quick add pill */}
              {data.multiDay && allDaysInRange.filter(d => !data.daySchedules.some(ds => ds.date === d)).map(unconfDay => (
                <button
                  key={unconfDay}
                  type="button"
                  onClick={() => handleSelectDay(unconfDay)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-400 text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add {formatDayLabel(unconfDay)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State when 0 days */}
        {dayCount === 0 && (
          <div className="p-8 text-center border-2 border-dashed border-indigo-200 rounded-3xl bg-indigo-50/30 space-y-3.5 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-800">No Day Agenda Configured Yet</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Add schedule items like Pooja, Archana, Homam, Cultural Performances, and Mahaprasadam Meals to your event agenda.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <Button
                type="button"
                onClick={handleAddDay}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 px-4 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Day 1 Schedule
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const targetDate = data.startDate || new Date().toISOString().split("T")[0];
                  handleOpenPlaceholderModal(targetDate);
                }}
                className="border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 gap-1.5 text-xs font-bold rounded-xl cursor-pointer shadow-xs px-4"
              >
                <Sparkles className="w-4 h-4 text-amber-500" /> Use Agenda Placeholders
              </Button>
            </div>
          </div>
        )}

        {/* Expanded Day Agenda View */}
        {dayCount > 0 && (
          <div className="space-y-3">
            {data.daySchedules.map((day, dayIdx) => {
              if (expandedDay && expandedDay !== day.date) return null;
              const isExpanded = true;
              const filledCount = day.activities.filter(a => a.name).length;
              const totalCount = day.activities.length;

              return (
                <div
                  key={day.date}
                  className="rounded-2xl border border-indigo-100 bg-white overflow-hidden shadow-xs space-y-0 animate-fade-in"
                >
                  {/* Day Banner Toolbar */}
                  <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md shadow-amber-400/20 shrink-0">
                        D{dayIdx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-white">Day {dayIdx + 1} &bull; {formatDayLabel(day.date)}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-indigo-200 border border-white/10">
                            {filledCount} of {totalCount} configured
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Configure all activities and seva timings for this specific day
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addActivity(day.date)}
                        className="h-8 px-3 text-xs font-bold bg-white text-indigo-950 hover:bg-indigo-50 rounded-xl shadow-xs gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-indigo-600" /> Add Activity
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleOpenPlaceholderModal(day.date)}
                        className="h-8 px-3 text-xs font-bold bg-indigo-800/80 hover:bg-indigo-700 text-white border border-indigo-600/50 rounded-xl gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Placeholders
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => triggerNotification(`Day ${dayIdx + 1}`)}
                        className="h-8 px-2.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-xl gap-1 cursor-pointer border border-white/10"
                        title="Send email alert for this day"
                      >
                        <Mail className="w-3.5 h-3.5 text-indigo-300" />
                      </Button>
                      {data.daySchedules.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleRemoveDay(day.date)}
                          className="h-8 px-2.5 text-xs font-bold bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 rounded-xl gap-1 cursor-pointer border border-rose-500/30"
                          title="Remove this entire day"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Day Activities List */}
                  <div className="p-3.5 sm:p-4 space-y-3.5 bg-slate-50/50">
                    {day.activities.length === 0 && (
                      <div className="p-6 text-center border-2 border-dashed border-indigo-200 rounded-2xl bg-white space-y-2.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-extrabold text-slate-800">No activities on {formatDayLabel(day.date)}</p>
                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                          Click below to add a customized ritual/program or import templates.
                        </p>
                        <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => addActivity(day.date)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Activity
                          </Button>
                          {dayIdx > 0 && data.daySchedules[dayIdx - 1]?.activities.length > 0 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => duplicateAboveActivity(day.date)}
                              className="border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 gap-1.5 text-xs font-bold rounded-xl cursor-pointer"
                              title={`Copy activities from Day ${dayIdx}`}
                            >
                              <Copy className="w-3.5 h-3.5 text-indigo-600" /> Copy Day {dayIdx} Sub-Events
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenPlaceholderModal(day.date)}
                            className="border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 gap-1.5 text-xs font-bold rounded-xl cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Agenda Placeholders
                          </Button>
                        </div>
                      </div>
                    )}

                    {day.activities.map((act, actIdx) => {
                      const currentCategory = act.categoryType || "Pooja & Seva";
                      const suggestions = PRESET_ACTIVITY_TITLES[currentCategory] || [];
                      const isPooja = currentCategory === "Pooja & Seva";
                      const isOtherCategory = currentCategory === "Other";

                      return (
                        <div
                          key={act.id}
                          className={cn(
                            "relative rounded-2xl border transition-all shadow-xs overflow-hidden",
                            isPooja
                              ? "border-amber-200 bg-gradient-to-b from-amber-50/40 via-white to-white"
                              : currentCategory === "Cultural Events"
                              ? "border-purple-200 bg-gradient-to-b from-purple-50/40 via-white to-white"
                              : currentCategory === "Competitions"
                              ? "border-pink-200 bg-gradient-to-b from-pink-50/40 via-white to-white"
                              : currentCategory === "Lunch" || currentCategory === "Dinner"
                              ? "border-emerald-200 bg-gradient-to-b from-emerald-50/40 via-white to-white"
                              : "border-slate-200 bg-white"
                          )}
                        >
                          {/* Activity Card Header */}
                          <div className={cn(
                            "flex items-center justify-between px-3.5 py-2.5 border-b",
                            isPooja ? "border-amber-100 bg-amber-50/60" : "border-slate-100 bg-slate-50/80"
                          )}>
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0",
                                isPooja
                                  ? "bg-amber-500 text-white shadow-xs"
                                  : "bg-indigo-600 text-white shadow-xs"
                              )}>
                                {actIdx + 1}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-slate-800">
                                  {act.name || `Activity #${actIdx + 1}`}
                                </span>
                                {isPooja && act.poojaType && (
                                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-bold">
                                    🪔 {act.poojaType}
                                  </Badge>
                                )}
                                {act.needsRegistration && (
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9.5px] font-bold">
                                    Pass Required &bull; ₹{act.registrationFee || "0"}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => cloneActivity(day.date, act)}
                                className="text-[10px] font-bold text-slate-700 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 px-2 py-1 rounded-lg border border-slate-200 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                title="Duplicate / Clone this sub-event"
                              >
                                <Copy className="w-3 h-3 text-indigo-500" /> Clone
                              </button>
                              {act.name && (
                                <button
                                  type="button"
                                  onClick={() => triggerNotification(`Day ${dayIdx + 1}`, act.name)}
                                  className="text-[10px] font-bold text-indigo-600 bg-white hover:bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                >
                                  <Mail className="w-3 h-3 text-indigo-500" /> Notify
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeActivity(day.date, act.id)}
                                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all p-1.5 rounded-lg cursor-pointer"
                                title="Remove activity"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Activity Card Body */}
                          <div className="p-3.5 sm:p-4 space-y-3.5">
                            {/* Visual Category Selector & Dropdown */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <FieldLabel required>Activity Category / Type</FieldLabel>
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                                  Selected: {currentCategory}
                                </span>
                              </div>

                              {/* Dropdown Selector */}
                              <div>
                                <select
                                  value={currentCategory}
                                  onChange={(e) => {
                                    const newCat = e.target.value;
                                    const updates: Partial<ScheduleActivity> = { categoryType: newCat };
                                    if (newCat !== "Other" && PRESET_ACTIVITY_TITLES[newCat]) {
                                      if (!act.name || Object.values(PRESET_ACTIVITY_TITLES).some(list => list.includes(act.name))) {
                                        updates.name = PRESET_ACTIVITY_TITLES[newCat][0];
                                      }
                                    }
                                    updateActivityFields(day.date, act.id, updates);
                                  }}
                                  className={cn(
                                    INPUT_CLS,
                                    "h-9 text-xs font-bold text-slate-800 bg-white cursor-pointer shadow-2xs",
                                    reqCls(!currentCategory)
                                  )}
                                >
                                  {ACTIVITY_CATEGORY_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.icon} {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Row: Title + (Pooja Type if Pooja & Seva) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                              {/* Left: Activity Title */}
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <FieldLabel required>
                                    {isPooja ? "Pooja / Seva Title" : "Activity / Event Title"}
                                  </FieldLabel>
                                </div>
                                <Input
                                  list={`preset-titles-${act.id}`}
                                  value={act.name}
                                  onChange={(e) => updateActivity(day.date, act.id, "name", e.target.value)}
                                  placeholder={isPooja ? "e.g. Maha Ganapathi Homam & Sankalpam" : "e.g. Classical Dance / Drawing Contest"}
                                  className={cn(INPUT_CLS, "h-9 text-xs bg-white font-bold text-slate-900 border-slate-200")}
                                />
                                <datalist id={`preset-titles-${act.id}`}>
                                  {suggestions.map((title, i) => (
                                    <option key={i} value={title} />
                                  ))}
                                </datalist>

                                {suggestions.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    <span className="text-[9.5px] font-bold text-slate-400 mr-0.5 py-0.5">Presets:</span>
                                    {suggestions.slice(0, 3).map((title, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => updateActivity(day.date, act.id, "name", title)}
                                        className={cn(
                                          "text-[9.5px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer font-bold",
                                          act.name === title
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                                        )}
                                      >
                                        + {title.split(" ")[0]} {title.split(" ")[1] || ""}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Right: Specialized Section (Pooja Type for Pooja, or Custom Type / Sync info) */}
                              {isPooja ? (
                                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-extrabold text-amber-900 flex items-center gap-1">
                                      <Flame className="w-3.5 h-3.5 text-amber-600" /> Pooja &amp; Seva Type
                                    </label>
                                    {addingTypeForActId !== act.id && (
                                      <button
                                        type="button"
                                        onClick={() => { setAddingTypeForActId(act.id); setNewPoojaTypeName(""); setAddTypeError(""); }}
                                        className="text-[10.5px] font-bold text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-0.5 cursor-pointer"
                                      >
                                        <Plus className="w-3 h-3" /> Add Custom Type
                                      </button>
                                    )}
                                  </div>

                                  {addingTypeForActId === act.id ? (
                                    <div className="space-y-1.5 pt-0.5">
                                      <div className="flex gap-1.5">
                                        <Input
                                          value={newPoojaTypeName}
                                          onChange={(e) => { setNewPoojaTypeName(e.target.value); setAddTypeError(""); }}
                                          placeholder="e.g. Navagraha Homam, Deeparadhana..."
                                          className={cn(INPUT_CLS, "bg-white flex-1 h-8.5 text-xs font-bold border-amber-300")}
                                          autoFocus
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") { e.preventDefault(); handleAddPoojaType(act.id, day.date); }
                                            if (e.key === "Escape") { setAddingTypeForActId(null); setNewPoojaTypeName(""); }
                                          }}
                                        />
                                        <Button
                                          type="button"
                                          size="sm"
                                          disabled={addingType || !newPoojaTypeName.trim()}
                                          onClick={() => handleAddPoojaType(act.id, day.date)}
                                          className="h-8.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-50 shrink-0 shadow-xs cursor-pointer"
                                        >
                                          {addingType ? "…" : "Save"}
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => { setAddingTypeForActId(null); setNewPoojaTypeName(""); setAddTypeError(""); }}
                                          className="h-8.5 px-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold shrink-0 border-slate-200"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                      {addTypeError && <p className="text-[10px] font-bold text-rose-600">{addTypeError}</p>}
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <select
                                          value={act.poojaType || ""}
                                          onChange={(e) => updateActivity(day.date, act.id, "poojaType", e.target.value)}
                                          className="flex-1 h-9 px-3 rounded-xl bg-white border border-amber-300 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-200 cursor-pointer shadow-2xs"
                                        >
                                          <option value="">— Select Pooja / Seva Type —</option>
                                          {poojaTypeOptions.length > 0 ? (
                                            poojaTypeOptions.map(t => (
                                              <option key={t.id} value={t.name}>{t.name}</option>
                                            ))
                                          ) : (
                                            <>
                                              <option value="Maha Pooja">Maha Pooja</option>
                                              <option value="Archana & Deeparadhana">Archana &amp; Deeparadhana</option>
                                              <option value="Rudrabhishekam">Rudrabhishekam</option>
                                              <option value="Homam & Havan">Homam &amp; Havan</option>
                                              <option value="Maha Sankalpam">Maha Sankalpam</option>
                                              <option value="Mahamangal Aarti">Mahamangal Aarti</option>
                                              <option value="Sri Satyanarayana Vratham">Sri Satyanarayana Vratham</option>
                                              <option value="Special Seva">Special Seva</option>
                                            </>
                                          )}
                                        </select>
                                        <button
                                          type="button"
                                          onClick={() => { setAddingTypeForActId(act.id); setNewPoojaTypeName(""); setAddTypeError(""); }}
                                          className="h-9 px-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1 transition shadow-2xs active:scale-95 cursor-pointer shrink-0"
                                          title="Add new Pooja Type"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                        </button>
                                      </div>

                                      {/* Quick Clickable Pooja Type Chips */}
                                      <div className="flex flex-wrap gap-1">
                                        {["Archana", "Homam", "Abhishekam", "Sankalpam", "Aarti", "Seva"].map((quickType) => (
                                          <button
                                            key={quickType}
                                            type="button"
                                            onClick={() => updateActivity(day.date, act.id, "poojaType", quickType)}
                                            className={cn(
                                              "text-[9.5px] px-2 py-0.5 rounded-lg border font-bold transition-all cursor-pointer",
                                              act.poojaType === quickType
                                                ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                                                : "bg-white text-amber-900 border-amber-200 hover:bg-amber-100 hover:border-amber-300"
                                            )}
                                          >
                                            {quickType}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : isOtherCategory ? (
                                <div>
                                  <FieldLabel required>Custom Type Name</FieldLabel>
                                  <Input
                                    value={act.customType || ""}
                                    onChange={(e) => updateActivity(day.date, act.id, "customType", e.target.value)}
                                    placeholder="e.g. Sports / Workshop / Stage Play"
                                    className={cn(INPUT_CLS, "h-9 text-xs bg-white font-medium")}
                                  />
                                </div>
                              ) : (
                                <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col justify-center">
                                  <span className="text-[10px] font-extrabold uppercase text-indigo-400">Sync Destination</span>
                                  <p className="text-xs font-bold text-indigo-900 mt-0.5">
                                    {currentCategory === "Lunch" || currentCategory === "Dinner"
                                      ? "🍽️ Automatically synced to Lunch & Dinner modules"
                                      : currentCategory === "Cultural Events"
                                      ? "🎭 Automatically synced to Cultural Events dashboard"
                                      : currentCategory === "Competitions"
                                      ? "🏆 Automatically synced to Competitions roster"
                                      : "⚡ Synced to Programs"}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Row: Timing (Start & End Time) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <FieldLabel required>Start Time (From)</FieldLabel>
                                <TimePicker
                                  value={act.startTime}
                                  onChange={(v) => updateActivity(day.date, act.id, "startTime", v)}
                                  size="sm"
                                />
                              </div>
                              <div>
                                <FieldLabel required>End Time (To)</FieldLabel>
                                <TimePicker
                                  value={act.endTime}
                                  onChange={(v) => updateActivity(day.date, act.id, "endTime", v)}
                                  size="sm"
                                />
                              </div>
                            </div>

                            {/* Row: Devotee Pass & Seva Booking Bar */}
                            <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5">
                              <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={act.needsRegistration ?? true}
                                    onChange={(e) => updateActivity(day.date, act.id, "needsRegistration", e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                                  />
                                  <span className="text-xs font-bold text-slate-800">
                                    {isPooja ? "Requires Devotee Seva Pass / Registration" : "Requires Member Entry Pass"}
                                  </span>
                                </label>

                                <Badge variant="outline" className={cn(
                                  "text-[10px] font-bold",
                                  act.needsRegistration ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                                )}>
                                  {act.needsRegistration ? "Pass Enabled" : "Open to All"}
                                </Badge>
                              </div>

                              {act.needsRegistration && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100 animate-fade-in">
                                  <div>
                                    <FieldLabel>
                                      {isPooja ? "Seva / Registration Fee (₹)" : "Pass Fee (₹)"}
                                    </FieldLabel>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                                      <Input
                                        type="text"
                                        value={act.registrationFee ?? "0"}
                                        onChange={(e) => updateActivity(day.date, act.id, "registrationFee", e.target.value)}
                                        placeholder="0 for Free"
                                        className={cn(INPUT_CLS, "h-8.5 text-xs bg-slate-50 font-bold pl-7 border-slate-200")}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <FieldLabel>
                                      {isPooja ? "Max Devotee Slots / Capacity" : "Available Seats / Slots"}
                                    </FieldLabel>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                                        <Users className="w-3.5 h-3.5" />
                                      </span>
                                      <Input
                                        type="number"
                                        value={act.slots ?? "50"}
                                        onChange={(e) => updateActivity(day.date, act.id, "slots", e.target.value)}
                                        placeholder="50"
                                        className={cn(INPUT_CLS, "h-8.5 text-xs bg-slate-50 font-bold pl-8 border-slate-200")}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Row: Venue + Special Guidelines */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <FieldLabel>{isPooja ? "Mandap / Sacred Venue" : "Stage / Location Venue"}</FieldLabel>
                                <Input
                                  value={act.venue || ""}
                                  onChange={(e) => updateActivity(day.date, act.id, "venue", e.target.value)}
                                  placeholder={isPooja ? "e.g. Main Temple Mandap / Homa Kundam" : "e.g. Community Stage / Dining Hall"}
                                  className={cn(INPUT_CLS, "h-8.5 text-xs bg-white border-slate-200")}
                                />
                              </div>
                              <div>
                                <FieldLabel>{isPooja ? "Devotee Samagri & Special Instructions" : "Description & Instructions"}</FieldLabel>
                                <Input
                                  value={act.description}
                                  onChange={(e) => updateActivity(day.date, act.id, "description", e.target.value)}
                                  placeholder={isPooja ? "e.g. Devotees to bring coconuts & flowers; traditional attire" : "e.g. Arrive 15 mins prior for registration"}
                                  className={cn(INPUT_CLS, "h-8.5 text-xs bg-white border-slate-200")}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Bottom Day Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <Button
                        type="button"
                        onClick={() => addActivity(day.date)}
                        className="flex-1 min-w-[200px] h-9 rounded-xl border-2 border-dashed border-indigo-200 text-xs font-bold text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 hover:border-indigo-300 transition-all cursor-pointer shadow-xs gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 text-indigo-600" /> Add Another Activity to Day {dayIdx + 1}
                      </Button>
                      {day.activities.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => duplicateAboveActivity(day.date)}
                          className="h-9 px-3.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-xs font-bold text-indigo-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          title="Clone / Duplicate the last activity in this day"
                        >
                          <Copy className="w-3.5 h-3.5 text-indigo-600" /> Clone Above Activity
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenPlaceholderModal(day.date)}
                        className="h-9 px-3.5 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-xs font-bold text-indigo-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        title="Pick and import agenda placeholders for this day"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Import Placeholders
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Bottom Add Next Day Button */}
            <button
              type="button"
              onClick={handleAddDay}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/40 text-xs font-bold text-indigo-700 hover:bg-indigo-100/70 hover:border-indigo-400 transition-all cursor-pointer shadow-2xs mt-2"
            >
              <Plus className="w-4 h-4 text-indigo-600" /> Add Day {dayCount + 1} Schedule
            </button>
          </div>
        )}
      </div>

      {/* Agenda Notification Modal */}
      <AgendaNotificationModal
        isOpen={notifModalOpen}
        onClose={() => setNotifModalOpen(false)}
        eventName={data.title || "Community Event"}
        dayLabel={notifDayLabel}
        activityTitle={notifActivityTitle}
      />

      {/* Agenda Placeholders Selection Modal */}
      {placeholderModalOpen && placeholderTargetDate && (
        <AgendaPlaceholdersModal
          isOpen={placeholderModalOpen}
          onClose={() => {
            setPlaceholderModalOpen(false);
            setPlaceholderTargetDate(null);
          }}
          targetDate={placeholderTargetDate}
          onAddActivities={handleAddPlaceholders}
        />
      )}
    </div>
  );
}

/* ─── Step 3: Venue ─── */
function Step3Venue({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <SectionHeader icon={MapPin} title="Venue Details" subtitle="Where is your event taking place?" />

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <FieldLabel required>Venue Name</FieldLabel>
            <Input
              value={data.venueName}
              onChange={e => update("venueName", e.target.value)}
              placeholder="e.g. Community Hall, Society Ground, Main Temple Mandap"
              className={cn(INPUT_CLS, reqCls(!data.venueName?.trim()))}
            />
          </div>
          <div>
            <FieldLabel required>City</FieldLabel>
            <Input
              value={data.city}
              onChange={e => update("city", e.target.value)}
              placeholder="e.g. Hyderabad, Bengaluru, Mumbai"
              className={cn(INPUT_CLS, reqCls(!data.city?.trim()))}
            />
          </div>
        </div>

        <div>
          <FieldLabel required>Address</FieldLabel>
          <Textarea
            value={data.venueAddress}
            onChange={e => update("venueAddress", e.target.value)}
            rows={3}
            placeholder="Full address of the venue, landmark, street name..."
            className={cn(INPUT_CLS, "resize-none", reqCls(!data.venueAddress?.trim()))}
          />
        </div>

        <div className="sm:w-64">
          <FieldLabel hint="Optional">Max Capacity (Attendees)</FieldLabel>
          <Input
            type="number"
            min={0}
            value={data.capacity}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e" || e.key === "+") e.preventDefault();
            }}
            onChange={e => {
              const val = e.target.value;
              const parsed = parseInt(val, 10);
              const sanitized = isNaN(parsed) ? "" : String(Math.max(0, parsed));
              update("capacity", val === "" ? "" : sanitized);
            }}
            placeholder="e.g. 500"
            className={INPUT_CLS}
          />
          <p className="text-[10px] text-slate-400 mt-1">Maximum estimated seating capacity or attendee limit.</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 4: Registration ─── */
function Step3Registration({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  const [dbCategories, setDbCategories] = useState<TicketCategoryMasterResponse[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [addingNewCatForTicketId, setAddingNewCatForTicketId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [savingNewCat, setSavingNewCat] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingCats(true);
    ticketCategoryService.getAll()
      .then(res => {
        if (!cancelled && Array.isArray(res)) {
          setDbCategories(res);
        }
      })
      .catch(err => console.warn("Failed to load ticket category master names:", err))
      .finally(() => {
        if (!cancelled) setLoadingCats(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleCreateCategoryName = async (ticketId: string) => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      showError("Please enter a category name");
      return;
    }
    setSavingNewCat(true);
    try {
      const created = await ticketCategoryService.create(trimmed, newCatDesc.trim() || undefined);
      setDbCategories(prev => {
        if (prev.some(c => c.name.toLowerCase() === created.name.toLowerCase())) return prev;
        return [...prev, created];
      });
      updateTicket(ticketId, "name", created.name);
      showSuccess(`Added category "${created.name}" to database`);
      setAddingNewCatForTicketId(null);
      setNewCatName("");
      setNewCatDesc("");
    } catch (err: any) {
      showError(err?.message || "Failed to create category name");
    } finally {
      setSavingNewCat(false);
    }
  };

  const addTicket = () => {
    const newTicket: TicketType = { id: `t${Date.now()}`, name: "", price: "0", qty: "0", description: "" };
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

  const maxEventCapacity = data.capacity ? parseInt(data.capacity, 10) : 0;
  const totalCategorySeats = data.ticketTypes.reduce((sum, t) => sum + (parseInt(t.qty || "0", 10) || 0), 0);
  const isCapacityExceeded = maxEventCapacity > 0 && totalCategorySeats > maxEventCapacity;

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
            <DatePicker
              value={data.registrationDeadline}
              max={maxDeadlineDate}
              onChange={v => update("registrationDeadline", v)}
              size="sm"
              className={cn(
                isDeadlineInvalid && "border-rose-500 ring-2 ring-rose-200 bg-rose-50/20 text-rose-900 font-semibold"
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
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-700">Ticket Categories</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Define different registration tiers from database categories</p>
              </div>
              <button onClick={addTicket}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Add Category Tier
              </button>
            </div>

            {maxEventCapacity > 0 && (
              <div className={cn(
                "p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 text-xs transition-colors",
                isCapacityExceeded
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              )}>
                <div className="flex items-center gap-2">
                  {isCapacityExceeded ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">Total Category Seats: </span>
                    <span className={cn("font-black font-mono", isCapacityExceeded ? "text-rose-600" : "text-indigo-600")}>
                      {totalCategorySeats.toLocaleString()}
                    </span>
                    <span className="text-slate-500 font-medium"> / {maxEventCapacity.toLocaleString()} max event capacity</span>
                    {isCapacityExceeded && (
                      <span className="text-rose-600 font-bold ml-1">
                        ({(totalCategorySeats - maxEventCapacity).toLocaleString()} seats over limit!)
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-[11px] font-bold">
                  {isCapacityExceeded ? (
                    <span className="text-rose-600 font-bold">Exceeds Max Capacity</span>
                  ) : (
                    <span className="text-emerald-600 font-bold">
                      {Math.max(0, maxEventCapacity - totalCategorySeats).toLocaleString()} unallocated seats
                    </span>
                  )}
                </div>
              </div>
            )}

            {isCapacityExceeded && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 mb-3 animate-fade-in-up">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>
                  Total seats across all ticket categories ({totalCategorySeats}) cannot exceed Event Max Capacity ({maxEventCapacity}). Please adjust category seat allocations.
                </span>
              </div>
            )}
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
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all p-1 rounded-lg hover:bg-rose-50 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <FieldLabel required>Category Name</FieldLabel>
                        {addingNewCatForTicketId !== ticket.id && (
                          <button
                            type="button"
                            onClick={() => {
                              setAddingNewCatForTicketId(ticket.id);
                              setNewCatName("");
                              setNewCatDesc("");
                            }}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                          >
                            + Add New
                          </button>
                        )}
                      </div>

                      {addingNewCatForTicketId === ticket.id ? (
                        <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200 space-y-2">
                          <input
                            type="text"
                            value={newCatName}
                            onChange={e => setNewCatName(e.target.value)}
                            placeholder="New category name (e.g. VIP Pass)..."
                            className="w-full px-2.5 py-1.5 border border-indigo-300 rounded-lg bg-white text-xs font-bold text-slate-800 outline-none"
                            autoFocus
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setAddingNewCatForTicketId(null);
                                setNewCatName("");
                                setNewCatDesc("");
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCreateCategoryName(ticket.id)}
                              disabled={savingNewCat}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              {savingNewCat && <Loader2 className="w-3 h-3 animate-spin" />}
                              Save to Database
                            </button>
                          </div>
                        </div>
                      ) : (
                        <select
                          value={ticket.name}
                          onChange={e => updateTicket(ticket.id, "name", e.target.value)}
                          className={cn(INPUT_CLS, "bg-white cursor-pointer font-medium")}
                        >
                          <option value="">-- Select Category Name --</option>
                          {dbCategories.map(c => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                          {ticket.name && !dbCategories.some(c => c.name.toLowerCase() === ticket.name.toLowerCase()) && (
                            <option value={ticket.name}>{ticket.name}</option>
                          )}
                        </select>
                      )}
                    </div>
                    <div>
                      <FieldLabel>Price (₹)</FieldLabel>
                      <Input
                        type="number"
                        min={0}
                        value={ticket.price}
                        onKeyDown={(e) => {
                          if (e.key === "-" || e.key === "e" || e.key === "+") e.preventDefault();
                        }}
                        onChange={e => {
                          const val = e.target.value;
                          const parsed = parseFloat(val);
                          const sanitized = isNaN(parsed) ? "" : String(Math.max(0, parsed));
                          updateTicket(ticket.id, "price", val === "" ? "" : sanitized);
                        }}
                        placeholder="0 = Free"
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <FieldLabel>Seats</FieldLabel>
                      <Input
                        type="number"
                        min={0}
                        value={ticket.qty}
                        onKeyDown={(e) => {
                          if (e.key === "-" || e.key === "e" || e.key === "+") e.preventDefault();
                        }}
                        onChange={e => {
                          const val = e.target.value;
                          const parsed = parseInt(val, 10);
                          const sanitized = isNaN(parsed) ? "" : String(Math.max(0, parsed));
                          updateTicket(ticket.id, "qty", val === "" ? "" : sanitized);
                        }}
                        placeholder="0"
                        className={INPUT_CLS}
                      />
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

                {!data.scannerUrl && (
                  <div>
                    <Input
                      value={data.scannerUrl}
                      onChange={(e) => update("scannerUrl", e.target.value)}
                      placeholder="Or paste QR image URL (https://...)"
                      className={cn(INPUT_CLS, "h-8 text-[11px]")}
                    />
                  </div>
                )}
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
                    className={cn(INPUT_CLS, "h-8 text-xs py-1 px-2.5", reqCls(!contact.name?.trim()))}
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
                    className={cn(INPUT_CLS, "h-8 text-xs font-mono py-1 px-2.5", reqCls(!contact.phone?.trim()))}
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
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const existing = (data.budgetItems || [])
      .map(b => b.category?.trim())
      .filter(c => c && !BUDGET_CATEGORIES.includes(c));
    return Array.from(new Set(existing));
  });

  const [newCatInput, setNewCatInput] = useState<string>("");
  const [showAddCatModal, setShowAddCatModal] = useState<boolean>(false);
  const [customRowIds, setCustomRowIds] = useState<Set<string>>(new Set());

  // Combined list of all available categories
  const allCategories = useMemo(() => {
    return Array.from(new Set([...BUDGET_CATEGORIES, ...customCategories]));
  }, [customCategories]);

  const addItem = (defaultCat = "") => {
    const newItemId = `b${Date.now()}`;
    const nextCat = defaultCat || allCategories[data.budgetItems.length % allCategories.length] || "Venue & Mandap Setup";
    update("budgetItems", [...data.budgetItems, { id: newItemId, category: nextCat, amount: "" }]);
  };

  const removeItem = (id: string) => {
    update("budgetItems", data.budgetItems.filter(b => b.id !== id));
    setCustomRowIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const updateItem = (id: string, field: keyof BudgetItem, value: string) => {
    update("budgetItems", data.budgetItems.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleCreateNewCategory = () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    if (!customCategories.includes(trimmed) && !BUDGET_CATEGORIES.includes(trimmed)) {
      setCustomCategories(prev => [...prev, trimmed]);
    }
    // Automatically add a budget line with this new category
    addItem(trimmed);
    setNewCatInput("");
    setShowAddCatModal(false);
  };

  const totalAllocated = data.budgetItems.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
  const totalBudgetNum = parseFloat(data.totalBudget) || 0;
  const pct = totalBudgetNum > 0 ? Math.min(100, (totalAllocated / totalBudgetNum) * 100) : 0;
  const remaining = totalBudgetNum - totalAllocated;

  return (
    <div className="space-y-4 sm:space-y-7">
      <SectionHeader icon={IndianRupee} title="Budget Planning" subtitle="Set a budget and allocate across categories or create custom categories" />

      <div>
        <FieldLabel>Total Event Budget</FieldLabel>
        <div className="relative sm:w-64">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
          <Input
            type="number"
            min={0}
            value={data.totalBudget}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e" || e.key === "+") e.preventDefault();
            }}
            onChange={e => {
              const val = e.target.value;
              const parsed = parseFloat(val);
              const sanitized = isNaN(parsed) ? "" : String(Math.max(0, parsed));
              update("totalBudget", val === "" ? "" : sanitized);
            }}
            placeholder="e.g. 500000"
            className={cn(INPUT_CLS, "pl-8 text-base font-semibold")}
          />
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>Budget Breakdown</span>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {data.budgetItems.length} {data.budgetItems.length === 1 ? "Line Item" : "Line Items"}
              </span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Allocate budget across expense categories or create custom categories</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAddCatModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> + New Category
            </button>
            <button
              type="button"
              onClick={() => addItem()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Line
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {data.budgetItems.length === 0 && (
            <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-600">No budget lines added yet</p>
              <p className="text-xs text-slate-400">Click &ldquo;Add Line&rdquo; or &ldquo;+ New Category&rdquo; to start allocating your event budget.</p>
              <button
                type="button"
                onClick={() => addItem("Venue & Mandap Setup")}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add First Budget Line
              </button>
            </div>
          )}

          {data.budgetItems.map((item, idx) => {
            const isCustomInput = customRowIds.has(item.id) || (item.category && !allCategories.includes(item.category));

            return (
              <div
                key={item.id}
                className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 transition-all hover:border-indigo-200 group"
              >
                <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-bold flex items-center justify-center shrink-0 hidden sm:flex">
                  {idx + 1}
                </span>

                {/* Category Selection / Custom Input */}
                {isCustomInput ? (
                  <div className="flex-1 flex items-center gap-1.5">
                    <Input
                      autoFocus
                      placeholder="Enter custom category name..."
                      value={item.category === "__custom__" ? "" : item.category}
                      onChange={e => updateItem(item.id, "category", e.target.value)}
                      className={cn(INPUT_CLS, "h-10 text-xs font-bold text-indigo-900 flex-1")}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = item.category.trim();
                        if (trimmed && trimmed !== "__custom__") {
                          setCustomCategories(prev => Array.from(new Set([...prev, trimmed])));
                        }
                        setCustomRowIds(prev => {
                          const s = new Set(prev);
                          s.delete(item.id);
                          return s;
                        });
                      }}
                      className="px-3 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold shrink-0 transition-colors cursor-pointer"
                      title="Save category"
                    >
                      Save ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomRowIds(prev => {
                          const s = new Set(prev);
                          s.delete(item.id);
                          return s;
                        });
                        updateItem(item.id, "category", allCategories[0] || "Venue & Mandap Setup");
                      }}
                      className="px-2.5 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold shrink-0 cursor-pointer"
                      title="Switch back to dropdown list"
                    >
                      List
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 relative">
                    <select
                      value={item.category}
                      onChange={e => {
                        if (e.target.value === "__custom__") {
                          setCustomRowIds(prev => new Set(prev).add(item.id));
                          updateItem(item.id, "category", "");
                        } else {
                          updateItem(item.id, "category", e.target.value);
                        }
                      }}
                      className="w-full h-10 px-3.5 pr-8 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 appearance-none cursor-pointer shadow-2xs"
                    >
                      <option value="">-- Select Budget Category --</option>
                      <optgroup label="Standard Categories">
                        {BUDGET_CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </optgroup>
                      {customCategories.length > 0 && (
                        <optgroup label="Custom Created Categories">
                          {customCategories.map(c => (
                            <option key={c} value={c}>⭐ {c}</option>
                          ))}
                        </optgroup>
                      )}
                      <option value="__custom__" className="font-bold text-indigo-600 bg-indigo-50">
                        ➕ + Create New Category...
                      </option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}

                {/* Amount Input */}
                <div className="w-full sm:w-44 relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                  <Input
                    value={item.amount}
                    type="number"
                    min={0}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e" || e.key === "+") e.preventDefault();
                    }}
                    onChange={e => {
                      const val = e.target.value;
                      const parsed = parseFloat(val);
                      const sanitized = isNaN(parsed) ? "" : String(Math.max(0, parsed));
                      updateItem(item.id, "amount", val === "" ? "" : sanitized);
                    }}
                    placeholder="Allocated Amount"
                    className={cn(INPUT_CLS, "h-10 pl-8 text-xs font-bold text-slate-900")}
                  />
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition-all cursor-pointer flex-shrink-0 self-end sm:self-center"
                  title="Remove line"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Create New Budget Category Modal ── */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" onClick={() => setShowAddCatModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-slate-100 animate-scaleUp" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Create Budget Category</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCatModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                Category Name <span className="text-rose-500">*</span>
              </label>
              <Input
                autoFocus
                placeholder="e.g. Stage LED Walls, Dhol Tasha, Fireworks"
                value={newCatInput}
                onChange={e => setNewCatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateNewCategory();
                  }
                }}
                className={cn(INPUT_CLS, "text-xs font-semibold")}
              />
              <p className="text-[10.5px] text-slate-400">
                Will be added to your budget categories and a new allocation line will be created.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddCatModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newCatInput.trim()}
                onClick={handleCreateNewCategory}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
              >
                Create &amp; Add Line
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Step 7: Media ─── */
function Step7Media({ data, update }: { data: FormData; update: (k: keyof FormData, v: any) => void }) {
  const [tagInput, setTagInput] = useState("");
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCloudStorageUrl = (url?: string) => {
    if (!url) return false;
    return url.includes("amazonaws.com") || url.includes(".s3.") || url.startsWith("blob:") || url.startsWith("data:");
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name);
    setUploadingImage(true);
    setImageUploadError("");

    try {
      const res = await fileUploadService.upload(file, "EVENT", "event-create", undefined, "cover-image");
      if (res?.url) {
        update("coverImageUrl", res.url);
      } else {
        throw new Error("Upload completed without an image URL.");
      }
    } catch (err) {
      console.warn("Cover image upload failed:", err);
      setImageUploadError("Cover image upload failed. Please try again or upload another file.");
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
          <button
            type="button"
            onClick={() => setImageMode("upload")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
              imageMode === "upload"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}>
            <Upload className="w-3.5 h-3.5" /> Upload File
          </button>
          <button
            type="button"
            onClick={() => setImageMode("url")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
              imageMode === "url"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}>
            <Link2 className="w-3.5 h-3.5" /> Paste Image Link
          </button>
        </div>

        {imageMode === "url" ? (
          <Input
            value={isCloudStorageUrl(data.coverImageUrl) ? "" : data.coverImageUrl}
            onChange={e => { update("coverImageUrl", e.target.value); setFileName(""); setImageUploadError(""); }}
            placeholder="https://images.unsplash.com/…"
            className={INPUT_CLS}
          />
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/90 font-bold bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/10">
                  ✓ Image Selected
                </span>
                {fileName && (
                  <span className="text-xs text-white/80 font-medium truncate max-w-[200px]">{fileName}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {imageMode === "upload" && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/25 backdrop-blur-sm text-white text-xs font-bold hover:bg-white/40 transition-all cursor-pointer"
                  >
                    <Upload className="w-3 h-3" /> Change File
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearImage}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/80 backdrop-blur-sm text-white text-xs font-bold hover:bg-rose-600 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>
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
                  <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WEBP, AVIF up to 5MB</p>
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
  if (!data.title?.trim()) warnings.push("Event title is required.");
  if (!data.eventType?.trim()) warnings.push("Please select an event type.");
  if (!data.description?.trim()) warnings.push("Event description is required.");
  if (!data.startDate) warnings.push("Start date is required.");
  if (data.multiDay && !data.endDate) warnings.push("End date is required for multi-day events.");
  if (!data.startTime?.trim()) warnings.push("Start time is required.");
  if (!data.endTime?.trim()) warnings.push("End time is required.");
  if (!data.venueName?.trim()) warnings.push("Venue name is required.");
  if (!data.city?.trim()) warnings.push("City is required.");
  if (!data.venueAddress?.trim()) warnings.push("Venue address is required.");
  if (data.enableOnlinePayment && (!data.paymentModes || data.paymentModes.length === 0)) {
    warnings.push("At least one accepted payment mode is required when online payment is enabled.");
  }
  if (data.registrationEnabled && data.registrationDeadline && data.startDate && new Date(data.registrationDeadline) > new Date(data.startDate)) {
    warnings.push(`Registration deadline (${data.registrationDeadline}) must be on or before the event start date (${data.startDate}).`);
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
      icon: CalendarDays, title: "Date & Schedule", color: "#7c3aed",
      rows: [
        { label: "Date",     value: data.startDate ? `${data.startDate}${data.multiDay && data.endDate ? ` → ${data.endDate}` : ""}` : "—" },
        { label: "Time",     value: data.startTime ? `${data.startTime} – ${data.endTime}` : "—" },
        { label: "Schedule", value: data.multiDay ? `${data.daySchedules.length} day(s) configured` : "Single Day Event" },
      ],
    },
    {
      icon: MapPin, title: "Venue Details", color: "#059669",
      rows: [
        { label: "Venue",    value: data.venueName || "—" },
        { label: "City",     value: data.city || "—" },
        { label: "Address",  value: data.venueAddress || "—" },
        { label: "Capacity", value: data.capacity ? `${parseInt(data.capacity).toLocaleString()} attendees` : "Not specified" },
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

export function toEventRequest(data: FormData, statusOverride?: "DRAFT" | "PUBLISHED", draftStep?: number): EventRequest {
  const primaryContact = data.contacts?.[0];
  const coverImageUrl = persistedMediaUrl(data.coverImageUrl);
  const scannerImageUrl = persistedMediaUrl(data.scannerUrl);
  const contactPayload = (data.contacts || []).map(({ id, name, phone, role, notes }, idx) => ({
    id,
    name,
    phone,
    role,
    notes,
    displayOrder: idx + 1,
    isPrimary: idx === 0,
  }));
  return {
    title: data.title,
    description: data.description || undefined,
    type: data.eventType ? (
      ["festival", "cultural", "meeting", "workshop", "conference", "party", "fundraiser", "sports"].includes(data.eventType.toLowerCase())
        ? data.eventType.toUpperCase()
        : "GENERAL"
    ) : undefined,
    startDate: data.startDate,
    endDate: data.multiDay && data.endDate ? data.endDate : undefined,
    startTime: data.startTime || undefined,
    endTime: data.endTime || undefined,
    locationType: data.visibility,
    location: [data.venueName, data.venueAddress, data.city].filter(Boolean).join(", ") || undefined,
    priceType: data.ticketTypes.some(t => parseFloat(t.price) > 0) ? "PAID" : "FREE",
    price: data.ticketTypes.length > 0 ? parseFloat(data.ticketTypes[0].price) || undefined : undefined,
    capacity: data.capacity ? parseInt(data.capacity) : undefined,
    maxAttendees: data.capacity ? parseInt(data.capacity) : undefined,
    imageUrl: coverImageUrl,
    organizerName: primaryContact?.name || undefined,
    organizerContact: primaryContact?.phone || undefined,
    ticketTypes: data.ticketTypes,
    ticketTypesJson: undefined,
    contacts: contactPayload,
    paymentModes: data.enableOnlinePayment ? (data.paymentModes && data.paymentModes.length > 0 ? data.paymentModes.join(",") : undefined) : "Cash",
    upiId: data.enableOnlinePayment ? (data.upiId || undefined) : undefined,
    scannerUrl: data.enableOnlinePayment ? scannerImageUrl : undefined,
    scannerImage: data.enableOnlinePayment ? scannerImageUrl : undefined,
    notes: data.notes || undefined,
    contactsJson: contactPayload.length > 0 ? JSON.stringify(contactPayload) : undefined,
    paymentInstructions: data.enableOnlinePayment ? (data.paymentInstructions || undefined) : undefined,
    venue: data.venueName || undefined,
    city: data.city || undefined,
    category: data.category || EVENT_TYPES.find(t => t.value === data.eventType)?.label || data.eventType || "Festival",
    status: statusOverride || "PUBLISHED",
    registrationDeadline: data.registrationEnabled && data.registrationDeadline ? data.registrationDeadline : undefined,
    draftStep: draftStep !== undefined ? draftStep : (statusOverride === "DRAFT" ? 1 : undefined),
  };
}

export function fromEventToFormData(ev: any): FormData {
  if (!ev) return { ...INITIAL_FORM_DATA };

  const rawLocation = ev.location || "";
  const parts = rawLocation.split(", ").map((s: string) => s.trim()).filter(Boolean);
  const venueName = ev.venue || ev.venueName || (parts.length > 0 ? parts[0] : rawLocation) || "";
  const city = ev.city || (parts.length > 1 ? parts[parts.length - 1] : "") || "";
  const venueAddress = ev.venueAddress || (parts.length > 2 ? parts.slice(1, -1).join(", ") : parts.length === 2 && parts[0] !== venueName ? parts[1] : "") || "";

  let rawTicketTypes: any[] = [];
  if (Array.isArray(ev.ticketTypes) && ev.ticketTypes.length > 0) {
    rawTicketTypes = ev.ticketTypes;
  } else if (ev.ticketTypesJson) {
    try {
      const parsed = typeof ev.ticketTypesJson === "string" ? JSON.parse(ev.ticketTypesJson) : ev.ticketTypesJson;
      if (Array.isArray(parsed) && parsed.length > 0) {
        rawTicketTypes = parsed;
      }
    } catch {}
  }

  // Extract saved capacity - prioritize true total capacity fields over remaining/available seats
  const savedCapacity = ev.capacity !== undefined && ev.capacity !== null && String(ev.capacity).trim() !== ""
    ? String(ev.capacity)
    : ev.maxAttendees !== undefined && ev.maxAttendees !== null && String(ev.maxAttendees).trim() !== ""
    ? String(ev.maxAttendees)
    : ev.totalCapacity !== undefined && ev.totalCapacity !== null && String(ev.totalCapacity).trim() !== ""
    ? String(ev.totalCapacity)
    : "100";

  const ticketTypes: TicketType[] = rawTicketTypes.length > 0
    ? rawTicketTypes.map((t: any, i: number) => ({
        id: t.id || `t${i + 1}`,
        name: t.name || (i === 0 ? "General" : `Tier ${i + 1}`),
        price: String(t.price ?? "0"),
        qty: String(t.capacity ?? t.seats ?? t.qty ?? t.maxSeats ?? savedCapacity ?? "100"),
        description: t.description || "",
      }))
    : [
        {
          id: "t1",
          name: "General",
          price: ev.price !== undefined && ev.price !== null ? String(ev.price) : "0",
          qty: savedCapacity,
          description: "Open for all community members",
        },
      ];

  const locTypeStr = String(ev.locationType || ev.visibility || "").toLowerCase();
  const visibility: FormData["visibility"] = 
    locTypeStr === "public" || locTypeStr === "online" ? "public" :
    locTypeStr === "invite" || locTypeStr === "private" ? "invite" :
    "community";

  const rawTypeCandidates: string[] = [
    ev.category,
    ev.eventType,
    ev.eventCategory,
    ev.typeName,
    ev.type,
  ].filter(Boolean).map((s: any) => String(s).toLowerCase().trim());

  let matchedType = "festival";
  let matchedFound = false;

  for (const raw of rawTypeCandidates) {
    const cleanRaw = raw.replace(/[-_]/g, " ");

    const exactVal = EVENT_TYPES.find(t => t.value.toLowerCase() === raw || t.value.toLowerCase() === cleanRaw);
    if (exactVal) {
      matchedType = exactVal.value;
      matchedFound = true;
      break;
    }

    const exactLabel = EVENT_TYPES.find(t => t.label.toLowerCase() === raw || t.label.toLowerCase() === cleanRaw);
    if (exactLabel) {
      matchedType = exactLabel.value;
      matchedFound = true;
      break;
    }

    if (cleanRaw.includes("health") || cleanRaw.includes("medical") || cleanRaw.includes("camp") || cleanRaw.includes("blood") || cleanRaw.includes("yoga") || cleanRaw.includes("wellness") || cleanRaw.includes("fitness")) {
      matchedType = "health";
      matchedFound = true;
      break;
    }
    if (cleanRaw.includes("food") || cleanRaw.includes("dining") || cleanRaw.includes("dinner") || cleanRaw.includes("lunch") || cleanRaw.includes("prasadam") || cleanRaw.includes("annadanam") || cleanRaw.includes("cooking") || cleanRaw.includes("kitchen")) {
      matchedType = "food";
      matchedFound = true;
      break;
    }
    if (cleanRaw.includes("sport") || cleanRaw.includes("cricket") || cleanRaw.includes("outdoor") || cleanRaw.includes("trek") || cleanRaw.includes("run") || cleanRaw.includes("marathon") || cleanRaw.includes("badminton") || cleanRaw.includes("football") || cleanRaw.includes("tournament")) {
      matchedType = "outdoor";
      matchedFound = true;
      break;
    }
    if (cleanRaw.includes("cultur") || cleanRaw.includes("music") || cleanRaw.includes("dance") || cleanRaw.includes("drama") || cleanRaw.includes("theatre") || cleanRaw.includes("concert") || cleanRaw.includes("art")) {
      matchedType = "cultural";
      matchedFound = true;
      break;
    }
    if (cleanRaw.includes("festiv") || cleanRaw.includes("pooja") || cleanRaw.includes("seva") || cleanRaw.includes("diwali") || cleanRaw.includes("ganesh") || cleanRaw.includes("navratri") || cleanRaw.includes("holi") || cleanRaw.includes("durga") || cleanRaw.includes("celebrat")) {
      matchedType = "festival";
      matchedFound = true;
      break;
    }
    if (cleanRaw.includes("educat") || cleanRaw.includes("workshop") || cleanRaw.includes("school") || cleanRaw.includes("class") || cleanRaw.includes("training") || cleanRaw.includes("seminar") || cleanRaw.includes("study")) {
      matchedType = "education";
      matchedFound = true;
      break;
    }
    if (cleanRaw.includes("corporat") || cleanRaw.includes("business") || cleanRaw.includes("meeting") || cleanRaw.includes("conference") || cleanRaw.includes("agm") || cleanRaw.includes("networking")) {
      matchedType = "corporate";
      matchedFound = true;
      break;
    }
    if (cleanRaw.includes("communit") || cleanRaw.includes("social") || cleanRaw.includes("general") || cleanRaw.includes("society") || cleanRaw.includes("gathering") || cleanRaw.includes("resident")) {
      matchedType = "community";
      matchedFound = true;
      break;
    }
  }

  if (!matchedFound && rawTypeCandidates.length > 0) {
    for (const raw of rawTypeCandidates) {
      const partial = EVENT_TYPES.find(t => raw.includes(t.value) || t.value.includes(raw));
      if (partial) {
        matchedType = partial.value;
        break;
      }
    }
  }

  const resolvedCategory = ev.category || EVENT_TYPES.find(t => t.value === matchedType)?.label || "Festival";

  let contacts: EventContactItem[] = [];
  if (Array.isArray(ev.contacts) && ev.contacts.length > 0) {
    contacts = ev.contacts.map((c: any, i: number) => ({
      id: c.id || `c${i + 1}`,
      name: c.name || "",
      phone: c.phone || "",
      role: c.role || "Organizer",
      notes: c.notes || "",
    }));
  } else if (Array.isArray(ev.contactDetails) && ev.contactDetails.length > 0) {
    contacts = ev.contactDetails.map((c: any, i: number) => ({
      id: c.id || `c${i + 1}`,
      name: c.name || "",
      phone: c.phone || "",
      role: c.role || "Organizer",
      notes: c.notes || "",
    }));
  } else if (ev.contactsJson) {
    try {
      const parsed = typeof ev.contactsJson === "string" ? JSON.parse(ev.contactsJson) : ev.contactsJson;
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
  if (contacts.length === 0 && Array.isArray(ev.contacts) && ev.contacts.length > 0) {
    contacts = ev.contacts.map((c: any, i: number) => ({
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

  const rawPaymentModes = ev.paymentModes
    ? typeof ev.paymentModes === "string"
      ? ev.paymentModes.split(",").map((s: string) => s.trim()).filter(Boolean)
      : Array.isArray(ev.paymentModes)
      ? ev.paymentModes
      : ["UPI", "Card", "Cash"]
    : ["UPI", "Card", "Cash"];

  const isManualOnly = rawPaymentModes.length === 1 && rawPaymentModes[0].toLowerCase() === "cash";
  const enableOnlinePayment = ev.enableOnlinePayment !== undefined
    ? Boolean(ev.enableOnlinePayment)
    : isManualOnly
    ? false
    : Boolean(ev.upiId || ev.scannerUrl || ev.scannerImage || rawPaymentModes.some((m: string) => m.toLowerCase() !== "cash"));

  const startDate = ev.startDate ? String(ev.startDate).split("T")[0] : "";
  const endDate = ev.endDate ? String(ev.endDate).split("T")[0] : startDate;
  const startTime = ev.startTime ? String(ev.startTime).slice(0, 5) : "09:00";
  const endTime = ev.endTime ? String(ev.endTime).slice(0, 5) : "18:00";
  const multiDay = Boolean(endDate && startDate && endDate !== startDate);

  let rawDaySchedules: DaySchedule[] = Array.isArray(ev.daySchedules) && ev.daySchedules.length > 0 ? ev.daySchedules : [];
  if (!multiDay && startDate) {
    const matching = rawDaySchedules.filter((ds: DaySchedule) => ds.date === startDate);
    if (matching.length > 0) {
      rawDaySchedules = matching;
    } else if (rawDaySchedules.length > 0) {
      rawDaySchedules = [{ date: startDate, activities: rawDaySchedules.flatMap((ds: DaySchedule) => ds.activities || []) }];
    }
  } else if (multiDay && startDate && endDate) {
    rawDaySchedules = rawDaySchedules.filter((ds: DaySchedule) => ds.date >= startDate && ds.date <= endDate);
  }

  return {
    title: ev.title || ev.name || "",
    eventType: matchedType,
    category: resolvedCategory,
    description: ev.description || "",
    visibility,
    startDate,
    endDate,
    startTime,
    endTime,
    multiDay,
    daySchedules: rawDaySchedules,
    venueName,
    venueAddress,
    city,
    capacity: savedCapacity,
    registrationEnabled: ev.registrationEnabled !== undefined ? Boolean(ev.registrationEnabled) : true,
    registrationDeadline: ev.registrationDeadline ? String(ev.registrationDeadline).split("T")[0] : "",
    ticketTypes,
    requireApproval: Boolean(ev.requireApproval),
    allowWaitlist: ev.allowWaitlist !== undefined ? Boolean(ev.allowWaitlist) : false,
    totalBudget: ev.totalBudget || (ev.budget ? String(ev.budget) : ""),
    budgetItems: ev.budgetItems && ev.budgetItems.length > 0 ? ev.budgetItems : [...DEFAULT_BUDGET_ITEMS],
    coverImageUrl: ev.imageUrl || ev.coverImageUrl || ev.coverImage || "",
    tags: Array.isArray(ev.tags) ? ev.tags : [],
    registrationFormConfig: ev.registrationFormConfig || { ...GANESH_CHATURTHI_FORM_CONFIG },
    enableOnlinePayment,
    paymentModes: rawPaymentModes.length > 0 ? rawPaymentModes : ["UPI", "Card", "Cash"],
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
  const [step, setStep] = useState<number>(() => {
    const rawId = eventId || initialData?.id;
    if (initialData?.draftStep && typeof initialData.draftStep === "number" && initialData.draftStep >= 1 && initialData.draftStep <= 8) {
      return initialData.draftStep;
    }
    if (rawId) {
      try {
        const localSaved = localStorage.getItem(`mana_draft_step_${rawId}`);
        if (localSaved && !isNaN(Number(localSaved))) {
          const s = parseInt(localSaved, 10);
          if (s >= 1 && s <= 8) return s;
        }
      } catch {}
    }
    return 1;
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitType, setSubmitType] = useState<"published" | "draft">("published");
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [loadingEvent, setLoadingEvent] = useState(false);

  let useMock = true;
  try { useMock = useEventMock().useMock; } catch {}

  const [formData, setFormData] = useState<FormData>(() => {
    if (initialData) return fromEventToFormData(initialData);
    return { ...INITIAL_FORM_DATA };
  });

  // Fetch full details and all sub-events from database API whenever editing an event
  useEffect(() => {
    const rawId = eventId || initialData?.id;
    if (rawId) {
      const numId = typeof rawId === "string" ? parseInt(rawId.replace(/\D/g, ""), 10) : Number(rawId);
      if (!isNaN(numId) && numId > 0) {
        setLoadingEvent(true);
        Promise.all([
          eventService.getById(numId).catch(() => null),
          eventService.getPoojaSevas(numId).catch(() => []),
          eventService.getCulturalEvents(numId).catch(() => []),
          eventService.getCompetitions(numId).catch(() => []),
          eventService.getLunchDinners(numId).catch(() => []),
        ])
          .then(([ev, poojas, cults, comps, meals]) => {
            const baseEvent = ev || initialData;
            if (baseEvent) {
              const baseForm = fromEventToFormData(baseEvent);

              // Map all sub-events into daySchedules strictly within event's configured dates
              const daysMap = new Map<string, ScheduleActivity[]>();
              const startD = baseForm.startDate;
              const endD = baseForm.multiDay && baseForm.endDate ? baseForm.endDate : startD;
              const validDaysList = startD ? (baseForm.multiDay ? getDaysBetween(startD, endD) : [startD]) : [];
              const validDaysSet = new Set(validDaysList);

              const resolveDay = (rawDate?: string): string | null => {
                if (!startD) return null;
                if (!baseForm.multiDay) return startD;
                if (rawDate && validDaysSet.has(rawDate)) return rawDate;
                return startD;
              };

              for (const d of validDaysList) {
                daysMap.set(d, []);
              }

              // If baseForm already had daySchedules, preserve them within valid days
              if (Array.isArray(baseForm.daySchedules)) {
                for (const ds of baseForm.daySchedules) {
                  const targetDay = resolveDay(ds.date);
                  if (targetDay && daysMap.has(targetDay) && Array.isArray(ds.activities)) {
                    for (const act of ds.activities) {
                      const list = daysMap.get(targetDay)!;
                      if (!list.some(a => a.id === act.id || (a.name === act.name && a.startTime === act.startTime))) {
                        list.push(act);
                      }
                    }
                  }
                }
              }

              // 1. Merge Pooja Sevas (including multi-day pooja records across day slots)
              if (Array.isArray(poojas)) {
                for (const p of poojas) {
                  if (p.mainEventId && Number(p.mainEventId) !== numId) continue;
                  
                  let targetDates: string[] = [];
                  if (Array.isArray(p.timeSlotConfig) && p.timeSlotConfig.length > 0) {
                    targetDates = [...new Set(p.timeSlotConfig.map((ts: any) => resolveDay(ts.slotDate || p.date || p.startDate)).filter(Boolean))] as string[];
                  }
                  if (targetDates.length === 0) {
                    if (p.multiDay && p.endDate && p.date) {
                      targetDates = getDaysBetween(p.date, p.endDate).map(resolveDay).filter(Boolean) as string[];
                    } else {
                      const single = resolveDay(p.date || p.startDate);
                      if (single) targetDates = [single];
                    }
                  }

                  for (const pDate of targetDates) {
                    if (!pDate || !daysMap.has(pDate)) continue;
                    const list = daysMap.get(pDate)!;
                    const daySlotMatch = Array.isArray(p.timeSlotConfig)
                      ? p.timeSlotConfig.find((ts: any) => ts.slotDate === pDate)
                      : null;
                    const actTime = daySlotMatch?.startTime || (Array.isArray(p.startTimes) && p.startTimes.length > 0 ? p.startTimes[0] : p.startTime || "08:30");
                    const cleanTime = String(actTime).split(/[–-]/)[0].trim();
                    const slotCount = daySlotMatch?.slotCount ? String(daySlotMatch.slotCount) : (p.slots ? String(p.slots) : "50");

                    const existingIdx = list.findIndex(a => a.subEventId === p.id || (a.categoryType === "Pooja & Seva" && a.name === p.name));
                    const actObj: ScheduleActivity = {
                      id: `pooja-${p.id}-${pDate}`,
                      subEventId: p.id,
                      categoryType: "Pooja & Seva",
                      name: p.name || "Pooja Seva",
                      poojaType: p.type || "Pooja",
                      needsRegistration: true,
                      registrationFee: p.fee ? String(p.fee) : "0",
                      slots: slotCount,
                      startTime: cleanTime,
                      endTime: p.endTime || "",
                      description: p.notes || "",
                      venue: p.mandap || p.venue || "Main Mandap",
                    };
                    if (existingIdx >= 0) {
                      list[existingIdx] = actObj;
                    } else {
                      list.push(actObj);
                    }
                  }
                }
              }

              // 2. Merge Cultural Events
              if (Array.isArray(cults)) {
                for (const c of cults) {
                  if (c.mainEventId && Number(c.mainEventId) !== numId) continue;
                  const cDate = resolveDay(c.date);
                  if (!cDate || !daysMap.has(cDate)) continue;
                  const list = daysMap.get(cDate)!;
                  const existingIdx = list.findIndex(a => a.subEventId === c.id || (a.categoryType === "Cultural Events" && a.name === c.name));
                  const actObj: ScheduleActivity = {
                    id: `cult-${c.id}`,
                    subEventId: c.id,
                    categoryType: "Cultural Events",
                    name: c.name || "Cultural Event",
                    needsRegistration: Boolean(c.needsRegistration),
                    registrationFee: c.fee ? String(c.fee) : "0",
                    slots: c.slots ? String(c.slots) : "200",
                    startTime: c.startTime || "18:00",
                    endTime: c.endTime || "",
                    description: c.description || c.requirements || "",
                    venue: c.stage || c.venue || "Main Stage",
                  };
                  if (existingIdx >= 0) {
                    list[existingIdx] = actObj;
                  } else {
                    list.push(actObj);
                  }
                }
              }

              // 3. Merge Competitions
              if (Array.isArray(comps)) {
                for (const cmp of comps) {
                  if (cmp.mainEventId && Number(cmp.mainEventId) !== numId) continue;
                  const cmpDate = resolveDay(cmp.date);
                  if (!cmpDate || !daysMap.has(cmpDate)) continue;
                  const list = daysMap.get(cmpDate)!;
                  const existingIdx = list.findIndex(a => a.subEventId === cmp.id || (a.categoryType === "Competitions" && a.name === cmp.name));
                  const actObj: ScheduleActivity = {
                    id: `comp-${cmp.id}`,
                    subEventId: cmp.id,
                    categoryType: "Competitions",
                    name: cmp.name || "Competition",
                    needsRegistration: true,
                    registrationFee: cmp.fee ? String(cmp.fee) : "0",
                    slots: cmp.maxParticipants || cmp.slots ? String(cmp.maxParticipants || cmp.slots) : "50",
                    startTime: cmp.startTime || "10:00",
                    endTime: cmp.endTime || "",
                    description: cmp.description || (cmp.ageGroup ? `Age Group: ${cmp.ageGroup}` : ""),
                    venue: cmp.venue || "Auditorium",
                  };
                  if (existingIdx >= 0) {
                    list[existingIdx] = actObj;
                  } else {
                    list.push(actObj);
                  }
                }
              }

              // 4. Merge Lunch / Dinners
              if (Array.isArray(meals)) {
                for (const m of meals) {
                  if (m.mainEventId && Number(m.mainEventId) !== numId) continue;
                  const mDate = resolveDay(m.date);
                  if (!mDate || !daysMap.has(mDate)) continue;
                  const list = daysMap.get(mDate)!;
                  const isDinner = (m.mealType?.toLowerCase() === "dinner" || m.name?.toLowerCase().includes("dinner"));
                  const catType = isDinner ? "Dinner" : "Lunch";
                  const existingIdx = list.findIndex(a => a.subEventId === m.id || ((a.categoryType === "Lunch" || a.categoryType === "Dinner") && a.name === m.name));
                  const actObj: ScheduleActivity = {
                    id: `meal-${m.id}`,
                    subEventId: m.id,
                    categoryType: catType,
                    name: m.name || (isDinner ? "Community Mahaprasadam Dinner" : "Community Mahaprasadam Lunch"),
                    needsRegistration: Boolean(m.needsRegistration),
                    registrationFee: m.fee ? String(m.fee) : "0",
                    slots: m.targetPlates || m.slots ? String(m.targetPlates || m.slots) : "500",
                    startTime: m.startTime || (isDinner ? "19:00" : "12:30"),
                    endTime: m.endTime || (isDinner ? "21:00" : "14:30"),
                    description: m.notes || m.description || (Array.isArray(m.menuItems) ? m.menuItems.join(", ") : ""),
                    venue: m.venue || "Community Dining Hall",
                  };
                  if (existingIdx >= 0) {
                    list[existingIdx] = actObj;
                  } else {
                    list.push(actObj);
                  }
                }
              }

              // Only construct day schedules for valid dates
              const sortedDates = validDaysList.length > 0 ? validDaysList : (startD ? [startD] : []);
              const builtDaySchedules: DaySchedule[] = sortedDates.map(d => ({
                date: d,
                activities: daysMap.get(d) || [],
              }));

              baseForm.daySchedules = builtDaySchedules;
              setFormData(baseForm);

              // If draft, resume to saved draft step
              const isDraft = String(baseEvent.status || "").toLowerCase() === "draft";
              if (isDraft || baseEvent.draftStep) {
                const draftS = baseEvent.draftStep;
                if (typeof draftS === "number" && draftS >= 1 && draftS <= 8) {
                  setStep(draftS);
                } else {
                  try {
                    const localSaved = localStorage.getItem(`mana_draft_step_${rawId}`);
                    if (localSaved && !isNaN(Number(localSaved))) {
                      const s = parseInt(localSaved, 10);
                      if (s >= 1 && s <= 8) setStep(s);
                    }
                  } catch {}
                }
              }
            }
          })
          .catch((err) => {
            console.warn("Could not fetch full event and sub-events by ID, falling back to initial data:", err);
          })
          .finally(() => setLoadingEvent(false));
      }
    }
  }, [eventId, initialData?.id]);

  const update = (key: keyof FormData, value: any) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  const isEndDateInvalid = Boolean(
    formData.multiDay &&
    formData.endDate &&
    formData.startDate &&
    formData.endDate < formData.startDate
  );

  const isTimeInvalid = Boolean(
    (!formData.multiDay || formData.startDate === formData.endDate) &&
    formData.startTime &&
    formData.endTime &&
    formData.endTime <= formData.startTime
  );

  const isDeadlineInvalid = Boolean(
    formData.registrationEnabled &&
    formData.registrationDeadline &&
    formData.startDate &&
    formData.registrationDeadline > formData.startDate
  );

  const validateStep = (currentStep: number): string | null => {
    if (currentStep === 1) {
      if (!formData.title.trim()) return "Please enter an event title.";
      if (!formData.category && !formData.eventType) return "Please select an event category / type.";
      if (!formData.description.trim()) return "Event description is required.";
    }
    if (currentStep === 2) {
      if (!formData.startDate) return "Event start date is required.";
      if (formData.multiDay && !formData.endDate) return "End date is required for multi-day events.";
      if (isEndDateInvalid) return `End date (${formData.endDate}) cannot be earlier than start date (${formData.startDate}).`;
      if (!formData.startTime?.trim()) return "Event start time is required.";
      if (!formData.endTime?.trim()) return "Event end time is required.";
      if (isTimeInvalid) return `End time (${formData.endTime}) must be after start time (${formData.startTime}).`;
    }
    if (currentStep === 3) {
      if (!formData.venueName?.trim()) return "Venue name is required.";
      if (!formData.city?.trim()) return "City is required.";
      if (!formData.venueAddress?.trim()) return "Venue address is required.";
    }
    if (currentStep === 4) {
      if (isDeadlineInvalid) return `Registration deadline must be on or before the event start date (${formData.startDate}).`;
      const maxCap = formData.capacity ? parseInt(formData.capacity, 10) : 0;
      if (maxCap > 0 && formData.ticketTypes && formData.ticketTypes.length > 0) {
        const totalCategorySeats = formData.ticketTypes.reduce((sum, t) => sum + (parseInt(t.qty || "0", 10) || 0), 0);
        if (totalCategorySeats > maxCap) {
          return `Total seats across all ticket categories (${totalCategorySeats}) cannot exceed Event Max Capacity (${maxCap}). Please adjust category seat allocations.`;
        }
      }
    }
    if (currentStep === 5) {
      if (formData.enableOnlinePayment && (!formData.paymentModes || formData.paymentModes.length === 0)) {
        return "Please select at least one accepted payment mode when online payment is enabled.";
      }
    }
    return null;
  };

  const validateAll = (): string | null => {
    // Step 1 — Basics
    if (!formData.title.trim()) return "Event title is required.";
    if (!formData.eventType && !formData.category) return "Please select an event type / category.";
    if (!formData.description.trim()) return "Event description is required.";

    // Step 2 — Schedule
    if (!formData.startDate) return "Event start date is required.";
    if (formData.multiDay && !formData.endDate) return "End date is required for multi-day events.";
    if (isEndDateInvalid) return `End date (${formData.endDate}) cannot be earlier than start date (${formData.startDate}).`;
    if (!formData.startTime?.trim()) return "Event start time is required.";
    if (!formData.endTime?.trim()) return "Event end time is required.";
    if (isTimeInvalid) return `End time (${formData.endTime}) must be after start time (${formData.startTime}).`;

    // Step 3 — Venue
    if (!formData.venueName?.trim()) return "Venue name is required.";
    if (!formData.city?.trim()) return "City is required.";
    if (!formData.venueAddress?.trim()) return "Venue address is required.";

    // Step 4 — Registration
    if (isDeadlineInvalid) return `Registration deadline must be on or before the event start date (${formData.startDate}).`;
    const maxCap = formData.capacity ? parseInt(formData.capacity, 10) : 0;
    if (maxCap > 0 && formData.ticketTypes && formData.ticketTypes.length > 0) {
      const totalCategorySeats = formData.ticketTypes.reduce((sum: number, t: any) => sum + (parseInt(t.qty || "0", 10) || 0), 0);
      if (totalCategorySeats > maxCap) {
        return `Total seats across all ticket categories (${totalCategorySeats}) cannot exceed Event Max Capacity (${maxCap}). Please adjust category seat allocations.`;
      }
    }

    // Step 5 — Payment
    if (formData.enableOnlinePayment && (!formData.paymentModes || formData.paymentModes.length === 0)) {
      return "Please select at least one accepted payment mode when online payment is enabled.";
    }

    return null;
  };

  const handleNext = () => {
    const errorMsg = validateStep(step);
    if (errorMsg) {
      setPublishError(errorMsg);
      return;
    }
    setPublishError("");
    setStep((s: number) => Math.min(STEPS.length, s + 1));
  };

  const handleSaveDraft = async () => {
    const errorMsg = validateAll();
    if (errorMsg) {
      setPublishError(errorMsg);
      return;
    }
    setSavingDraft(true);
    setPublishError("");
    try {
      const reqPayload = toEventRequest(formData, "DRAFT", step);
      let resultEvent: any = {
        ...(initialData || {}),
        ...formData,
        id: eventId || (initialData as any)?.id || "EVT-" + Date.now(),
        venue: formData.venueName,
        status: "draft",
        draftStep: step,
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

      const targetId = resultEvent.id || eventId || (initialData as any)?.id;
      if (targetId) {
        try {
          localStorage.setItem(`mana_draft_step_${targetId}`, String(step));
        } catch {}
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
    const errorMsg = validateAll();
    if (errorMsg) {
      setPublishError(errorMsg);
      return;
    }
    setPublishing(true);
    setPublishError("");
    try {
      const reqPayload = toEventRequest(formData, "PUBLISHED", 1);
      let resultEvent: any = {
        ...(initialData || {}),
        ...formData,
        id: eventId || (initialData as any)?.id || "EVT-" + Date.now(),
        venue: formData.venueName,
        status: "upcoming",
        draftStep: undefined,
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

      const targetId = resultEvent.id || eventId || (initialData as any)?.id;
      if (targetId) {
        try {
          localStorage.removeItem(`mana_draft_step_${targetId}`);
        } catch {}
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
      <div className="relative max-w-lg mx-auto text-center py-10 sm:py-16 animate-fade-in-up px-4">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        )}
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
        <div className="flex flex-wrap gap-2.5 justify-center items-center">
          {isEditing ? (
            <button
              type="button"
              onClick={() => { setSubmitted(false); }}
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              Continue Editing
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setSubmitted(false); setStep(1); setFormData({ ...INITIAL_FORM_DATA }); }}
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              Create Another
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <X className="w-4 h-4 text-slate-500" />
              <span>Close</span>
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-md cursor-pointer"
            >
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
    3: <Step3Venue data={formData} update={update} />,
    4: <Step3Registration data={formData} update={update} />,
    5: <Step4PaymentAndContacts data={formData} update={update} />,
    6: <Step5FormTemplate data={formData} update={update} />,
    7: <Step6Budget data={formData} update={update} />,
    8: <Step7Media data={formData} update={update} />,
    9: <Step8Review data={formData} />,
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
              {loadingEvent && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading event...
                </span>
              )}
              {!loadingEvent && formData.title && (
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
        <div className="w-48 sm:w-52 hidden md:flex flex-col justify-between bg-slate-50 border-r border-slate-200 p-3 shrink-0 overflow-y-auto">
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
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-bold w-full text-left transition-all",
                    active
                      ? "bg-white border border-purple-200 text-purple-700 shadow-xs"
                      : done
                      ? "text-slate-700 hover:bg-slate-100 cursor-pointer"
                      : "text-slate-400 cursor-default opacity-70"
                  )}
                >
                  <span
                    className={cn(
                      "w-4.5 h-4.5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0",
                      active
                        ? "bg-purple-600 text-white"
                        : done
                        ? "bg-purple-100 text-purple-700"
                        : "bg-slate-200 text-slate-500"
                    )}
                  >
                    {done ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : s.id}
                  </span>
                  <div className="truncate">
                    <p className="leading-tight truncate">{s.label}</p>
                    <p className="text-[9px] text-slate-400 font-normal truncate mt-0.5">{s.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Status Box */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2 text-xs shadow-xs mt-3">
            <span className={cn("w-2 h-2 rounded-full shrink-0", isEditing ? "bg-indigo-500" : "bg-emerald-500 animate-pulse")}></span>
            <div>
              <p className="font-bold text-slate-800 text-[10.5px]">{isEditing ? "Editing mode" : "Draft status"}</p>
              <p className="text-[9px] text-slate-400 font-medium">{isEditing ? "Updating live/draft event" : "Autosaved just now"}</p>
            </div>
          </div>
        </div>

        {/* Form Scroller Container */}
        <div style={{ flex: "1 1 0", minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" } as React.CSSProperties} className="px-4 sm:px-6 md:px-8 py-5">
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

          <div key={step} className="animate-fade-in-up max-w-5xl xl:max-w-6xl mx-auto w-full">
            {stepComponents[step]}
          </div>
        </div>
      </div>

      {/* ── Footer Navigation Bar ── */}
      <div className="flex-shrink-0 px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <button onClick={() => setStep((s: number) => Math.max(1, s - 1))} disabled={step === 1}
          className={cn(
            "flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all",
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-all shadow-xs disabled:opacity-50">
              <Bookmark className="w-3.5 h-3.5 text-amber-500" />
              <span>{savingDraft ? "Saving…" : isEditing ? "Save Draft" : "Save Draft"}</span>
            </button>
            <button onClick={handleNext}
              className="flex items-center gap-1.5 px-4.5 py-1.5 rounded-xl text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md transition-all">
              Next Step <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {publishError && <span className="text-[11px] text-rose-600 font-medium max-w-[160px] truncate">{publishError}</span>}
            <button onClick={handleSaveDraft} disabled={savingDraft || publishing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-all shadow-xs disabled:opacity-50">
              <Bookmark className="w-3.5 h-3.5 text-amber-500" />
              <span>{savingDraft ? "Saving…" : "Save Draft"}</span>
            </button>
            <button onClick={handlePublish} disabled={publishing || savingDraft}
              className="flex items-center gap-1.5 px-4.5 py-1.5 rounded-xl text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all disabled:opacity-60">
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
            maxWidth: "84rem",
            height: "100dvh",
            maxHeight: "94dvh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.06), 0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 50px -12px rgba(79,70,229,0.22)",
            borderRadius: 0,
          }}
          className="sm:rounded-2xl sm:h-[min(94vh,860px)] sm:max-h-[94vh] sm:w-[96vw] sm:max-w-[1340px] sm:m-2 md:m-3 sm:border sm:border-slate-200/60 sm:ring-1 sm:ring-black/5 animate-fade-in-up"
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
            maxWidth: "84rem",  /* max-w-7xl */
            /* Mobile: full screen; tablet/desktop: wide bounded */
            height: "100dvh",
            maxHeight: "94dvh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.06), 0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 50px -12px rgba(79,70,229,0.22)",
            borderRadius: 0,
          }}
          className="sm:rounded-2xl sm:h-[min(94vh,860px)] sm:max-h-[94vh] sm:w-[96vw] sm:max-w-[1340px] sm:m-2 md:m-3 sm:border sm:border-slate-200/60 sm:ring-1 sm:ring-black/5 animate-fade-in-up"
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
    <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden" style={{ height: "calc(100vh - 140px)", minHeight: "650px" }}>
      <EventCreateWizard />
    </div>
  );
}
