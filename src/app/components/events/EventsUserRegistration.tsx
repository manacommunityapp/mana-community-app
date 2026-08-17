import { useState, useEffect } from "react";
import {
  User, Mail, Phone, MapPin, Calendar, Clock, CheckCircle2,
  ChevronRight, ChevronLeft, Ticket, CreditCard, Smartphone,
  Banknote, QrCode, Download, Share2, Star, Users, Shield,
  ArrowRight, Sparkles, Loader2, AlertCircle, UtensilsCrossed,
  CalendarCheck,
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils";
import { useEventMock } from "./EventMockToggle";
import { useAuth } from "../../../contexts/AuthContext";
import { userService } from "../../../services/common/userService";
import { eventService, type EventResponse } from "../../../services/events/eventService";

/* ─── Mock event data ─── */
// Mock event data — live API used when toggle is "Live API"
const EVENT = {
  id: "EVT-2026-01",
  title: "Ganesh Chaturthi Grand Festival 2026",
  date: "August 22–31, 2026",
  time: "8:00 AM onwards",
  venue: "Society Ground & Community Hall, Andheri East, Mumbai",
  organizer: "NexusApp Community",
  coverGradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #c4b5fd 100%)",
  description:
    "Join us for 10 days of devotion, culture, and celebration! Featuring live performances, cultural programs, food courts, competitions, and the grand visarjan procession.",
  categories: [
    {
      id: "ganesh-pass-2026",
      name: "Ganesh Utsav 2026 Pass",
      icon: Sparkles,
      price: 250,
      badge: "Official Pass",
      badgeColor: "#10b981",
      includes: ["Full 10-day festival entry access", "Maha Prasadam voucher", "Welcome pooja kit", "Priority seating"],
      qty: 2500,
      remaining: 658,
    },
  ],
};

/* ─── Mock event days & activities ─── */
const EVENT_DAYS = [
  { label: "Day 1", date: "2026-08-22" },
  { label: "Day 2", date: "2026-08-23" },
  { label: "Day 3", date: "2026-08-24" },
  { label: "Day 4", date: "2026-08-25" },
  { label: "Day 5", date: "2026-08-26" },
];

const ACTIVITIES = [
  { id: 1, dayLabel: "Day 1", title: "Ganapati Pooja",     programType: "Ritual",      startTime: "09:00 AM", capacity: 50,  registered: 32, requiresReg: true  },
  { id: 2, dayLabel: "Day 1", title: "Bhajan Sandhya",     programType: "Cultural",    startTime: "06:00 PM", capacity: 200, registered: 85, requiresReg: true  },
  { id: 3, dayLabel: "Day 2", title: "Yoga Workshop",      programType: "Workshop",    startTime: "07:00 AM", capacity: 30,  registered: 28, requiresReg: true  },
  { id: 4, dayLabel: "Day 2", title: "Rangoli Competition", programType: "Competition", startTime: "10:00 AM", capacity: 40,  registered: 22, requiresReg: true  },
  { id: 5, dayLabel: "Day 3", title: "Maha Aarti",         programType: "Ritual",      startTime: "07:00 PM", capacity: 100, registered: 67, requiresReg: true  },
  { id: 6, dayLabel: "Day 3", title: "Kids Dance Show",    programType: "Cultural",    startTime: "04:00 PM", capacity: null, registered: 0, requiresReg: false },
  { id: 7, dayLabel: "Day 4", title: "Cooking Contest",    programType: "Competition", startTime: "11:00 AM", capacity: 25,  registered: 25, requiresReg: true  },
  { id: 8, dayLabel: "Day 5", title: "Visarjan Procession", programType: "Ceremony",   startTime: "05:00 PM", capacity: null, registered: 0, requiresReg: false },
];

const DIETARY_OPTIONS = ["VEG", "VEGAN", "JAIN", "NONVEG"] as const;

/* ─── Types ─── */
interface MealDay {
  date: string;
  lunch: boolean;
  dinner: boolean;
  headCount: number;
}

interface EventCategoryItem {
  id: string;
  name: string;
  icon: any;
  price: number;
  badge: string | null;
  badgeColor: string;
  includes: string[];
  qty: number;
  remaining: number;
}

interface RegForm {
  category: string;
  qty: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  tshirtSize: string;
  volunteering: string;
  paymentMethod: string;
  upiId: string;
  dietaryPref: string;
  allergies: string;
  meals: MealDay[];
  selectedActivities: number[];
}

const STEPS = [
  { id: 1, label: "Choose Pass" },
  { id: 2, label: "Your Details" },
  { id: 3, label: "Payment"    },
  { id: 4, label: "Confirm"   },
];

const T_SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const VOLUNTEER_ROLES = ["Food & Kitchen", "Registration", "Security", "Decoration", "Audio/Visual", "Medical Support", "Guest Management"];

function getDynamicCategories(liveEvent?: EventResponse | null): EventCategoryItem[] {
  let cats: any[] = [];
  if (liveEvent?.ticketTypes && liveEvent.ticketTypes.length > 0) {
    cats = liveEvent.ticketTypes;
  } else {
    try {
      const saved = localStorage.getItem("mana_created_event_tickets");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cats = parsed;
        }
      }
    } catch {}
  }

  if (cats.length > 0) {
    return cats.map((c, i) => {
      const priceNum = typeof c.price === "number" ? c.price : (parseFloat(c.price) || 0);
      const nameLower = (c.name || "").toLowerCase();
      let icon = User;
      if (nameLower.includes("family")) icon = Users;
      else if (nameLower.includes("vip") || nameLower.includes("gold") || nameLower.includes("sponsor")) icon = Star;
      else if (nameLower.includes("volunteer")) icon = Sparkles;

      return {
        id: c.id || c.name,
        name: c.name,
        icon,
        price: priceNum,
        badge: priceNum === 0 ? "Free" : nameLower.includes("vip") ? "Premium" : i === 0 ? "Most Popular" : null,
        badgeColor: priceNum === 0 ? "#4f46e5" : "#10b981",
        includes: [c.description || `${c.qty || 100} seats available`, "Official entry pass badge", "Includes event entry access"],
        qty: parseInt(c.qty) || 100,
        remaining: Math.max(5, Math.floor((parseInt(c.qty) || 100) * 0.4)),
      };
    });
  }
  return EVENT.categories;
}

/* ─── Step components ─── */
function Step1Category({ form, update, categories }: { form: RegForm; update: (k: keyof RegForm, v: any) => void; categories: EventCategoryItem[] }) {
  const selected = categories.find(c => c.id === form.category);
  const total = selected ? selected.price * form.qty : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map(cat => {
          const isSelected = form.category === cat.id;
          const soldPct = Math.round((1 - cat.remaining / cat.qty) * 100);
          return (
            <button key={cat.id}
              onClick={() => update("category", cat.id)}
              className={cn(
                "p-3 sm:p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden hover:-translate-y-0.5 active:scale-[0.98]",
                isSelected
                  ? "border-indigo-400 bg-indigo-50 shadow-[0_4px_20px_rgba(99,102,241,0.2)]"
                  : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"
              )}>

              {cat.badge && (
                <Badge className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-black text-white border-none"
                  style={{ background: cat.badgeColor }}>{cat.badge}</Badge>
              )}

              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                isSelected ? "bg-indigo-500" : "bg-slate-100"
              )}>
                <cat.icon className={`w-5 h-5 ${isSelected ? "text-white" : "text-slate-500"}`} />
              </div>

              <p className={`font-black text-lg ${isSelected ? "text-indigo-700" : "text-slate-900"}`}>{cat.name}</p>
              <p className={`text-xl font-black mt-0.5 ${isSelected ? "text-indigo-600" : "text-slate-700"}`}>
                {cat.price === 0 ? "FREE" : `₹${cat.price}`}
              </p>

              <ul className="mt-3 space-y-1">
                {cat.includes.map(inc => (
                  <li key={inc} className="flex items-start gap-1.5 text-xs text-slate-600">
                    <CheckCircle2 className={`w-3 h-3 flex-shrink-0 mt-0.5 ${isSelected ? "text-indigo-500" : "text-slate-400"}`} />
                    {inc}
                  </li>
                ))}
              </ul>

              {/* Availability bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[9px] font-semibold text-slate-400 mb-1">
                  <span>{cat.remaining} left</span>
                  <span>{soldPct}% sold</span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-400" style={{ width: `${soldPct}%` }} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="animate-fade-in-up bg-white rounded-2xl p-3 sm:p-5 border border-indigo-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-slate-700">Quantity</p>
            <div className="flex items-center gap-3">
              <button onClick={() => update("qty", Math.max(1, form.qty - 1))}
                className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 hover:bg-indigo-100 transition-all">
                −
              </button>
              <span className="w-8 text-center font-black text-slate-900">{form.qty}</span>
              <button onClick={() => update("qty", Math.min(10, form.qty + 1))}
                className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 hover:bg-indigo-100 transition-all">
                +
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-sm text-slate-500">Total Amount</span>
            <span className="text-xl font-black text-indigo-600">
              {total === 0 ? "FREE" : `₹${total.toLocaleString()}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function Step2Details({ form, update, setForm }: { form: RegForm; update: (k: keyof RegForm, v: any) => void; setForm: React.Dispatch<React.SetStateAction<RegForm>> }) {
  const isVolunteer = form.category === "volunteer";
  const [activityDayTab, setActivityDayTab] = useState(EVENT_DAYS[0].label);

  const toggleMeal = (idx: number, meal: "lunch" | "dinner") => {
    setForm(prev => {
      const meals = [...prev.meals];
      meals[idx] = { ...meals[idx], [meal]: !meals[idx][meal] };
      return { ...prev, meals };
    });
  };

  const toggleActivity = (actId: number) => {
    setForm(prev => {
      const selected = prev.selectedActivities.includes(actId)
        ? prev.selectedActivities.filter(id => id !== actId)
        : [...prev.selectedActivities, actId];
      return { ...prev, selectedActivities: selected };
    });
  };

  const dayActivities = ACTIVITIES.filter(a => a.dayLabel === activityDayTab);
  const hasMeals = form.meals.some(m => m.lunch || m.dinner);

  const typeColors: Record<string, string> = {
    Ritual: "bg-amber-100 text-amber-700",
    Cultural: "bg-purple-100 text-purple-700",
    Workshop: "bg-blue-100 text-blue-700",
    Competition: "bg-rose-100 text-rose-700",
    Ceremony: "bg-emerald-100 text-emerald-700",
    Sports: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="space-y-5">
      {/* ── Personal Details ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
            First Name<span className="text-rose-500 ml-0.5">*</span>
          </Label>
          <Input value={form.firstName} onChange={e => update("firstName", e.target.value)} placeholder="Arjun"
            className="w-full px-4 py-3 h-auto rounded-xl border-slate-200 bg-white text-sm text-slate-800 focus-visible:border-indigo-400 focus-visible:ring-indigo-50" />
        </div>
        <div>
          <Label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
            Last Name<span className="text-rose-500 ml-0.5">*</span>
          </Label>
          <Input value={form.lastName} onChange={e => update("lastName", e.target.value)} placeholder="Sharma"
            className="w-full px-4 py-3 h-auto rounded-xl border-slate-200 bg-white text-sm text-slate-800 focus-visible:border-indigo-400 focus-visible:ring-indigo-50" />
        </div>
      </div>

      <div>
        <Label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
          Email Address<span className="text-rose-500 ml-0.5">*</span>
        </Label>
        <Input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="arjun@example.com"
          className="w-full px-4 py-3 h-auto rounded-xl border-slate-200 bg-white text-sm text-slate-800 focus-visible:border-indigo-400 focus-visible:ring-indigo-50" />
        <p className="text-[10px] text-slate-400 mt-1">Your e-ticket will be sent here</p>
      </div>

      <div>
        <Label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
          Mobile Number<span className="text-rose-500 ml-0.5">*</span>
        </Label>
        <Input type="tel" value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+91 98765 43210"
          className="w-full px-4 py-3 h-auto rounded-xl border-slate-200 bg-white text-sm text-slate-800 focus-visible:border-indigo-400 focus-visible:ring-indigo-50" />
      </div>

      <div>
        <Label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">Address</Label>
        <Input value={form.address} onChange={e => update("address", e.target.value)} placeholder="Flat / Building / Street"
          className="w-full px-4 py-3 h-auto rounded-xl border-slate-200 bg-white text-sm text-slate-800 focus-visible:border-indigo-400 focus-visible:ring-indigo-50" />
      </div>

      <div>
        <Label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">City</Label>
        <Input value={form.city} onChange={e => update("city", e.target.value)} placeholder="Mumbai"
          className="w-full px-4 py-3 h-auto rounded-xl border-slate-200 bg-white text-sm text-slate-800 focus-visible:border-indigo-400 focus-visible:ring-indigo-50" />
      </div>

      {isVolunteer && (
        <div className="animate-fade-in-up space-y-4 pt-2 border-t border-slate-100">
          <p className="text-sm font-bold text-indigo-600 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Volunteer Preferences
          </p>
          <div>
            <Label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">Preferred Role</Label>
            <Select value={form.volunteering} onValueChange={v => update("volunteering", v)}>
              <SelectTrigger className="w-full px-4 py-3 h-auto rounded-xl border-slate-200 bg-white text-sm text-slate-800">
                <SelectValue placeholder="Select your preferred role" />
              </SelectTrigger>
              <SelectContent>
                {VOLUNTEER_ROLES.map(o => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">T-Shirt Size</Label>
            <div className="flex gap-2 flex-wrap">
              {T_SHIRT_SIZES.map(sz => (
                <button key={sz} onClick={() => update("tshirtSize", sz)}
                  className={cn(
                    "w-12 h-10 rounded-xl border-2 text-sm font-bold transition-all",
                    form.tshirtSize === sz
                      ? "border-indigo-500 bg-indigo-500 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                  )}>
                  {sz}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Meal Preferences ── */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <p className="text-sm font-bold text-indigo-600 flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4" /> Meal Preferences
        </p>
        <p className="text-[10px] text-slate-400">Select which days you'd like lunch and/or dinner</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <Label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">Dietary Preference</Label>
            <Select value={form.dietaryPref} onValueChange={v => update("dietaryPref", v)}>
              <SelectTrigger className="w-full px-4 py-2.5 h-auto rounded-xl border-slate-200 bg-white text-sm text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIETARY_OPTIONS.map(o => (
                  <SelectItem key={o} value={o}>{o === "NONVEG" ? "Non-Veg" : o.charAt(0) + o.slice(1).toLowerCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">Allergies</Label>
            <Input value={form.allergies} onChange={e => update("allergies", e.target.value)} placeholder="e.g. nuts, dairy"
              className="w-full px-4 py-2.5 h-auto rounded-xl border-slate-200 bg-white text-sm text-slate-800 focus-visible:border-indigo-400 focus-visible:ring-indigo-50" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] items-center px-3 py-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Day</span>
            <span className="w-16 text-center">Lunch</span>
            <span className="w-16 text-center">Dinner</span>
          </div>
          {EVENT_DAYS.map((day, idx) => (
            <div key={day.date} className="grid grid-cols-[1fr_auto_auto] items-center px-3 py-2 border-t border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-700">{day.label}</p>
                <p className="text-[10px] text-slate-400">{new Date(day.date + "T00:00").toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</p>
              </div>
              <button
                onClick={() => toggleMeal(idx, "lunch")}
                className={cn(
                  "w-16 flex justify-center",
                )}>
                <div className={cn(
                  "w-9 h-5 rounded-full transition-all flex items-center px-0.5",
                  form.meals[idx].lunch ? "bg-indigo-500 justify-end" : "bg-slate-200 justify-start"
                )}>
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </div>
              </button>
              <button
                onClick={() => toggleMeal(idx, "dinner")}
                className={cn(
                  "w-16 flex justify-center",
                )}>
                <div className={cn(
                  "w-9 h-5 rounded-full transition-all flex items-center px-0.5",
                  form.meals[idx].dinner ? "bg-indigo-500 justify-end" : "bg-slate-200 justify-start"
                )}>
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </div>
              </button>
            </div>
          ))}
        </div>

        {hasMeals && (
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-xl text-xs text-indigo-700">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            {form.meals.filter(m => m.lunch).length} lunch, {form.meals.filter(m => m.dinner).length} dinner selected
          </div>
        )}
      </div>

      {/* ── Activity Registration ── */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <p className="text-sm font-bold text-indigo-600 flex items-center gap-2">
          <CalendarCheck className="w-4 h-4" /> Activity Registration
        </p>
        <p className="text-[10px] text-slate-400">Register for specific activities — limited seats, first come first served</p>

        {/* Day tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {EVENT_DAYS.map(day => (
            <button key={day.label} onClick={() => setActivityDayTab(day.label)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                activityDayTab === day.label
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}>
              {day.label}
            </button>
          ))}
        </div>

        {/* Activities for selected day */}
        <div className="space-y-2">
          {dayActivities.length === 0 && (
            <p className="text-xs text-slate-400 py-4 text-center">No registerable activities on this day</p>
          )}
          {dayActivities.map(act => {
            const isFull = act.capacity !== null && act.registered >= act.capacity;
            const spotsLeft = act.capacity !== null ? act.capacity - act.registered : null;
            const isJoined = form.selectedActivities.includes(act.id);
            const pct = act.capacity ? Math.round((act.registered / act.capacity) * 100) : 0;

            return (
              <div key={act.id}
                className={cn(
                  "p-3 rounded-xl border transition-all",
                  isJoined ? "border-indigo-300 bg-indigo-50/50" : "border-slate-200 bg-white"
                )}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold", typeColors[act.programType] || "bg-slate-100 text-slate-600")}>
                        {act.programType}
                      </span>
                      <span className="text-[10px] text-slate-400">{act.startTime}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 truncate">{act.title}</p>
                    {act.capacity !== null && (
                      <div className="mt-1.5">
                        <div className="flex justify-between text-[9px] font-semibold text-slate-400 mb-0.5">
                          <span>{act.registered}/{act.capacity} joined</span>
                          <span>{spotsLeft} left</span>
                        </div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all", isFull ? "bg-rose-400" : "bg-indigo-400")}
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {act.requiresReg && (
                    <button
                      onClick={() => !isFull || isJoined ? toggleActivity(act.id) : undefined}
                      disabled={isFull && !isJoined}
                      className={cn(
                        "flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        isJoined
                          ? "bg-indigo-500 text-white hover:bg-indigo-600"
                          : isFull
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                      )}>
                      {isJoined ? "Joined ✓" : isFull ? "Full" : "Join"}
                    </button>
                  )}
                  {!act.requiresReg && (
                    <span className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600">
                      Open
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {form.selectedActivities.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-xl text-xs text-indigo-700">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            {form.selectedActivities.length} {form.selectedActivities.length === 1 ? "activity" : "activities"} registered
          </div>
        )}
      </div>
    </div>
  );
}

function Step3Payment({ form, update }: { form: RegForm; update: (k: keyof RegForm, v: any) => void }) {
  const selected = EVENT.categories.find(c => c.id === form.category);
  const total = selected ? selected.price * form.qty : 0;

  if (total === 0) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto">
          <Sparkles className="w-10 h-10 text-emerald-500" />
        </div>
        <h3 className="font-black text-slate-900 text-xl">No Payment Required!</h3>
        <p className="text-slate-500 text-sm max-w-xs mx-auto">
          Your registration is free. Review your details and confirm to get your pass.
        </p>
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 max-w-xs mx-auto">
          <p className="text-emerald-800 font-bold text-sm">Registration Type: {selected?.name}</p>
          <p className="text-emerald-600 text-xs mt-1">Amount: FREE</p>
        </div>
      </div>
    );
  }

  const methods = [
    { id: "upi",  label: "UPI / QR Code", icon: Smartphone, desc: "Pay via any UPI app" },
    { id: "card", label: "Card / Net Banking", icon: CreditCard, desc: "Visa, Mastercard, etc." },
    { id: "cash", label: "Cash at Venue", icon: Banknote, desc: "Pay on the day of event" },
  ];

  return (
    <div className="space-y-5">
      {/* Amount summary */}
      <div className="p-3 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold text-slate-600">{selected?.name} × {form.qty}</p>
            <p className="text-xs text-slate-400">₹{selected?.price} per pass</p>
          </div>
          <p className="text-2xl font-black text-indigo-600">₹{total.toLocaleString()}</p>
        </div>
      </div>

      {/* Payment methods */}
      <div>
        <Label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5">
          Payment Method<span className="text-rose-500 ml-0.5">*</span>
        </Label>
        <div className="space-y-2.5">
          {methods.map(m => (
            <button key={m.id} onClick={() => update("paymentMethod", m.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                form.paymentMethod === m.id
                  ? "border-indigo-400 bg-indigo-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-indigo-200"
              )}>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                form.paymentMethod === m.id ? "bg-indigo-500" : "bg-slate-100"
              )}>
                <m.icon className={`w-5 h-5 ${form.paymentMethod === m.id ? "text-white" : "text-slate-500"}`} />
              </div>
              <div className="flex-1">
                <p className={`font-bold text-sm ${form.paymentMethod === m.id ? "text-indigo-700" : "text-slate-800"}`}>
                  {m.label}
                </p>
                <p className="text-xs text-slate-400">{m.desc}</p>
              </div>
              <div className={cn(
                "w-4 h-4 rounded-full border-2 flex-shrink-0",
                form.paymentMethod === m.id ? "border-indigo-500 bg-indigo-500" : "border-slate-300"
              )}>
                {form.paymentMethod === m.id && (
                  <div className="w-full h-full rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {form.paymentMethod === "upi" && (
        <div className="animate-fade-in-up p-4 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-24 h-24 bg-slate-100 rounded-xl mx-auto flex items-center justify-center">
            <QrCode className="w-12 h-12 text-slate-500" />
          </div>
          <p className="text-xs text-slate-500">Scan with any UPI app or enter UPI ID</p>
          <Input value={form.upiId} onChange={e => update("upiId", e.target.value)} placeholder="yourname@upi"
            className="w-full px-4 py-3 h-auto rounded-xl border-slate-200 bg-white text-sm text-slate-800 focus-visible:border-indigo-400 focus-visible:ring-indigo-50" />
          <p className="text-[10px] text-slate-400">UPI ID: nexusapp@icici</p>
        </div>
      )}

      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-xs text-slate-500">
        <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        Your payment is secure and encrypted. No card data is stored.
      </div>
    </div>
  );
}

function Step4Confirm({ form }: { form: RegForm }) {
  const selected = EVENT.categories.find(c => c.id === form.category);
  const total = selected ? selected.price * form.qty : 0;
  const regId = `REG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const name = `${form.firstName} ${form.lastName}`.trim() || "Attendee";
  const mealDays = form.meals.filter(m => m.lunch || m.dinner);
  const joinedActivities = ACTIVITIES.filter(a => form.selectedActivities.includes(a.id));

  return (
    <div className="space-y-5">
      {/* Digital Pass */}
      <div className="rounded-2xl overflow-hidden border border-indigo-200 shadow-[0_4px_24px_rgba(99,102,241,0.15)]">
        {/* Pass header */}
        <div className="px-6 py-5 text-white relative overflow-hidden"
          style={{ background: EVENT.coverGradient }}>
          <div className="absolute inset-0 opacity-10">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="absolute rounded-full bg-white/30"
                style={{ width: 80 + i * 20, height: 80 + i * 20, top: `${i * 15 - 20}%`, right: `${i * 8 - 15}%` }} />
            ))}
          </div>
          <div className="relative">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/70 mb-1">Digital Event Pass</p>
            <h3 className="font-black text-lg leading-tight">{EVENT.title}</h3>
            <div className="flex items-center gap-3 mt-3 text-xs text-white/80">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{EVENT.date}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{EVENT.time}</span>
            </div>
          </div>
        </div>

        {/* Pass body */}
        <div className="bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket Holder</p>
                <p className="font-black text-slate-900 text-lg">{name}</p>
                <p className="text-xs text-slate-500">{form.email || "—"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</p>
                  <p className="font-bold text-slate-700 text-sm">{selected?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Qty</p>
                  <p className="font-bold text-slate-700 text-sm">{form.qty}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</p>
                  <p className="font-bold text-indigo-600 text-sm">{total === 0 ? "FREE" : `₹${total.toLocaleString()}`}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payment</p>
                  <p className="font-bold text-slate-700 text-sm capitalize">{total === 0 ? "N/A" : form.paymentMethod || "—"}</p>
                </div>
              </div>
            </div>

            {/* QR code area */}
            <div className="flex-shrink-0 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                <QrCode className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-[9px] font-bold text-slate-400 mt-1.5 font-mono">{regId}</p>
            </div>
          </div>

          {/* Meal & Activity summary */}
          {(mealDays.length > 0 || joinedActivities.length > 0) && (
            <>
              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 border-t border-dashed border-slate-200" />
                <Ticket className="w-4 h-4 text-slate-300 rotate-90" />
                <div className="flex-1 border-t border-dashed border-slate-200" />
              </div>

              {mealDays.length > 0 && (
                <div className="mb-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Meals</p>
                  <div className="space-y-1">
                    {mealDays.map(m => (
                      <div key={m.date} className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="font-semibold w-16">
                          {new Date(m.date + "T00:00").toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </span>
                        <div className="flex gap-1.5">
                          {m.lunch && <Badge className="px-1.5 py-0 text-[9px] bg-amber-100 text-amber-700 border-none">Lunch</Badge>}
                          {m.dinner && <Badge className="px-1.5 py-0 text-[9px] bg-violet-100 text-violet-700 border-none">Dinner</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Diet: {form.dietaryPref}{form.allergies ? ` · Allergies: ${form.allergies}` : ""}</p>
                </div>
              )}

              {joinedActivities.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Activities</p>
                  <div className="space-y-1">
                    {joinedActivities.map(act => (
                      <div key={act.id} className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="font-semibold text-slate-500 w-12">{act.dayLabel}</span>
                        <span>{act.title}</span>
                        <span className="text-[10px] text-slate-400 ml-auto">{act.startTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Dashed divider */}
          <div className="flex items-center gap-2 my-4">
            <div className="flex-1 border-t border-dashed border-slate-200" />
            <Ticket className="w-4 h-4 text-slate-300 rotate-90" />
            <div className="flex-1 border-t border-dashed border-slate-200" />
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <p className="text-xs text-slate-500">{EVENT.venue}</p>
          </div>
        </div>

        {/* Action strip */}
        <div className="flex divide-x divide-slate-100 border-t border-slate-100">
          {[
            { icon: Download, label: "Download" },
            { icon: Share2, label: "Share"    },
          ].map(a => (
            <button key={a.label}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
              <a.icon className="w-4 h-4" /> {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-emerald-800">Registration Complete!</p>
          <p className="text-xs text-emerald-700 mt-0.5">A copy of your pass will be emailed to {form.email || "your email address"}.</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export function EventsUserRegistration() {
  const { user: authUser } = useAuth();
  const [step, setStep] = useState(1);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState("");

  let useMock = true;
  try { useMock = useEventMock().useMock; } catch {}

  const [liveEvents, setLiveEvents] = useState<EventResponse[]>([]);
  useEffect(() => {
    if (useMock) return;
    eventService.getUpcomingEvents().then(setLiveEvents).catch(() => {});
  }, [useMock]);

  const [form, setForm] = useState<RegForm>(() => {
    const parts = (authUser?.fullName || "").trim().split(" ");
    const flat = (authUser?.block && authUser?.flatNo) ? `${authUser.block}-${authUser.flatNo}` : (authUser?.flatNo || "");
    return {
      category: "",
      qty: 1,
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
      email: authUser?.email || "",
      phone: authUser?.phone || "",
      address: flat,
      city: "",
      tshirtSize: "",
      volunteering: "",
      paymentMethod: "",
      upiId: "",
      dietaryPref: "VEG",
      allergies: "",
      meals: EVENT_DAYS.map(d => ({ date: d.date, lunch: false, dinner: false, headCount: 1 })),
      selectedActivities: [],
    };
  });

  // Auto-fill logged in user details dynamically from backend
  useEffect(() => {
    if (authUser) {
      const parts = (authUser.fullName || "").trim().split(" ");
      const flat = (authUser.block && authUser.flatNo) ? `${authUser.block}-${authUser.flatNo}` : (authUser.flatNo || "");
      setForm(prev => ({
        ...prev,
        firstName: prev.firstName || parts[0] || "",
        lastName: prev.lastName || parts.slice(1).join(" ") || "",
        email: prev.email || authUser.email || "",
        phone: prev.phone || authUser.phone || "",
        address: prev.address || flat,
      }));
    }

    userService
      .getMe()
      .then(u => {
        if (u) {
          const parts = (u.fullName || "").trim().split(" ");
          const flat = u.flatNo ? (u.block ? `${u.block}-${u.flatNo}` : u.flatNo) : "";
          setForm(prev => ({
            ...prev,
            firstName: prev.firstName || parts[0] || "",
            lastName: prev.lastName || parts.slice(1).join(" ") || "",
            email: prev.email || u.email || "",
            phone: prev.phone || u.phone || "",
            address: prev.address || flat,
          }));
        }
      })
      .catch(() => {});
  }, [authUser]);

  const update = (key: keyof RegForm, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const [categoriesList, setCategoriesList] = useState(() => getDynamicCategories(null));

  useEffect(() => {
    const liveEv = liveEvents.length > 0 ? liveEvents[0] : null;
    const computed = getDynamicCategories(liveEv);
    setCategoriesList(computed);
    if (computed.length > 0 && !form.category) {
      setForm(prev => ({ ...prev, category: computed[0].id }));
    }
  }, [liveEvents]);

  const selected = categoriesList.find(c => c.id === form.category);

  const canNext = (): boolean => {
    if (step === 1) return !!form.category;
    if (step === 2) return !!(form.firstName && form.email && form.phone);
    if (step === 3) return selected?.price === 0 || !!form.paymentMethod;
    return true;
  };

  const handleConfirm = async () => {
    if (!useMock && liveEvents.length > 0) {
      setRegistering(true);
      setRegError("");
      try {
        await eventService.register(liveEvents[0].id);
        setIsRegistered(true);
      } catch (e: any) {
        setRegError(e.message ?? "Registration failed");
      } finally {
        setRegistering(false);
      }
    } else {
      setIsRegistered(true);
    }
  };

  const stepContent = {
    1: <Step1Category form={form} update={update} categories={categoriesList} />,
    2: <Step2Details form={form} update={update} setForm={setForm} />,
    3: <Step3Payment form={form} update={update} />,
    4: <Step4Confirm form={form} />,
  };

  return (
    <div className="max-w-2xl mx-auto">

      {/* Event hero */}
      <div className="rounded-2xl overflow-hidden mb-5 sm:mb-7 shadow-[0_4px_20px_rgba(99,102,241,0.2)]">
        <div className="px-4 py-3 sm:px-8 sm:py-8 text-white relative overflow-hidden"
          style={{ background: EVENT.coverGradient }}>
          <div className="absolute inset-0">
            {[...Array(5)].map((_, i) => (
              <div key={i}
                className="absolute rounded-full bg-white/10 animate-pulse"
                style={{ width: 60 + i * 40, height: 60 + i * 40, top: `${i * 20}%`, right: `${i * 10}%` }} />
            ))}
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="px-2.5 py-1 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider text-white/90">
                Open Registration
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black leading-tight mb-2 sm:mb-3">{EVENT.title}</h1>
            <div className="flex flex-col sm:flex-row flex-wrap gap-x-5 gap-y-1 sm:gap-y-2 text-[11px] sm:text-xs text-white/80">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 flex-shrink-0" />{EVENT.date}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 flex-shrink-0" />{EVENT.time}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{EVENT.venue}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 px-0 sm:px-1">
        {STEPS.map((s, i) => {
          const done = step > s.id || isRegistered;
          const active = step === s.id && !isRegistered;
          return (
            <div key={s.id} className="flex items-center gap-1 sm:gap-2 flex-1">
              <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                <div className={cn(
                  "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black border-2 transition-all",
                  done ? "bg-emerald-500 border-emerald-500 text-white"
                  : active ? "bg-indigo-500 border-indigo-500 text-white"
                  : "bg-white border-slate-200 text-slate-400"
                )}>
                  {done ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : s.id}
                </div>
                <span className={cn(
                  "text-[8px] sm:text-[9px] font-bold whitespace-nowrap",
                  active ? "text-indigo-600" : done ? "text-emerald-600" : "text-slate-400"
                )}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mb-4 mx-1 rounded-full transition-all",
                  done ? "bg-emerald-400" : "bg-slate-200"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-4 sm:px-7 py-4 sm:py-6 border-b border-slate-50">
          <h2 className="font-black text-slate-900">
            {isRegistered ? "Your Registration Pass" : STEPS[step - 1].label}
          </h2>
          {!isRegistered && (
            <p className="text-xs text-slate-400 mt-0.5">Step {step} of {STEPS.length}</p>
          )}
        </div>

        <div className="px-4 sm:px-7 py-4 sm:py-6">
          <div key={isRegistered ? "done" : step} className="animate-fade-in-up">
            {isRegistered
              ? <Step4Confirm form={form} />
              : (stepContent as any)[step]}
          </div>
        </div>

        {!isRegistered && (
          <div className="px-4 sm:px-7 py-4 sm:py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
            <Button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
              variant="outline"
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 h-auto rounded-xl text-xs sm:text-sm font-semibold transition-all",
                step === 1 ? "text-slate-300 cursor-not-allowed" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              )}>
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Back
            </Button>

            {step < STEPS.length ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 h-auto rounded-xl text-xs sm:text-sm font-bold transition-all",
                  canNext()
                    ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm hover:from-indigo-600 hover:to-violet-600"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}>
                Next <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                {regError && <span className="text-[10px] sm:text-xs text-rose-600 font-medium">{regError}</span>}
                <Button onClick={handleConfirm} disabled={registering}
                  className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 h-auto rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-60">
                  {registering ? <><Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> Registering…</> : <>Confirm <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></>}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
