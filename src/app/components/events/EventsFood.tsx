import { useState, useEffect, useMemo } from "react";
import { TrendingDown, Plus, UtensilsCrossed, Loader2, CheckCircle2, Calendar, MapPin, Sparkles, Clock, Users, User, ArrowRight } from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { ErrorBanner, LoadingSpinner } from "./shared";
import { foodEventService } from "../../../services/food/foodEventService";
import { eventProgramService, type MealSummaryResponse, type MealRegistrationRequest, type MealRegistrationResponse } from "../../../services/events/eventProgramService";
import { eventService, type EventResponse } from "../../../services/events/eventService";

type LunchDinner = {
  id: number;
  mainEventId?: number;
  name: string;
  mealType: string;
  date: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  targetPlates?: number;
  caterer?: string;
  dietType?: string;
  fee?: number;
  isFree?: boolean;
  menuItems?: string[];
  notes?: string;
};

const mockMenuItems = [
  { name: "Pulihora",         qty: 800,  unit: "plates", prepared: 650, status: "In Progress" },
  { name: "Curd Rice",        qty: 600,  unit: "plates", prepared: 600, status: "Ready"       },
  { name: "Sweet Pongal",     qty: 500,  unit: "plates", prepared: 500, status: "Ready"       },
  { name: "Vada",             qty: 1200, unit: "pieces", prepared: 900, status: "In Progress" },
  { name: "Payasam",          qty: 700,  unit: "cups",   prepared: 0,   status: "Pending"     },
  { name: "Prasadam Laddu",   qty: 2000, unit: "pieces", prepared: 1500,status: "In Progress" },
  { name: "Coconut Water",    qty: 400,  unit: "pieces", prepared: 400, status: "Ready"       },
];

const ingredients = [
  { item: "Rice",       required: "250 kg", available: "260 kg", status: "ok"  },
  { item: "Ghee",       required: "30 L",   available: "28 L",   status: "low" },
  { item: "Sugar",      required: "80 kg",  available: "90 kg",  status: "ok"  },
  { item: "Dal",        required: "40 kg",  available: "35 kg",  status: "low" },
  { item: "Tamarind",   required: "15 kg",  available: "18 kg",  status: "ok"  },
  { item: "Milk",       required: "200 L",  available: "180 L",  status: "low" },
];

const statusStyle: Record<string, { bg: string; text: string }> = {
  Ready:       { bg: "bg-emerald-50", text: "text-emerald-700" },
  "In Progress":{ bg: "bg-amber-50",  text: "text-amber-700"   },
  Pending:     { bg: "bg-slate-100",  text: "text-slate-500"   },
};

const MOCK_MEAL_SUMMARY: MealSummaryResponse = {
  eventId: 1,
  days: [
    { date: "2026-08-22", lunch: { totalHeads: 145, veg: 98, vegan: 12, jain: 15, nonveg: 20 }, dinner: { totalHeads: 120, veg: 82, vegan: 10, jain: 12, nonveg: 16 } },
    { date: "2026-08-23", lunch: { totalHeads: 160, veg: 110, vegan: 14, jain: 16, nonveg: 20 }, dinner: { totalHeads: 130, veg: 90, vegan: 11, jain: 13, nonveg: 16 } },
    { date: "2026-08-24", lunch: { totalHeads: 180, veg: 125, vegan: 15, jain: 18, nonveg: 22 }, dinner: { totalHeads: 155, veg: 108, vegan: 13, jain: 15, nonveg: 19 } },
    { date: "2026-08-25", lunch: { totalHeads: 140, veg: 95, vegan: 12, jain: 14, nonveg: 19 }, dinner: { totalHeads: 110, veg: 75, vegan: 10, jain: 11, nonveg: 14 } },
    { date: "2026-08-26", lunch: { totalHeads: 200, veg: 140, vegan: 16, jain: 20, nonveg: 24 }, dinner: { totalHeads: 190, veg: 132, vegan: 15, jain: 19, nonveg: 24 } },
  ],
};

export function EventsFood() {
  const { useMock } = useEventMock();

  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [liveMeals, setLiveMeals] = useState<LunchDinner[]>([]);
  const [liveRegistrations, setLiveRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mealSummary, setMealSummary] = useState<MealSummaryResponse | null>(null);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [showMealReg, setShowMealReg] = useState(false);
  const [dietaryPref, setDietaryPref] = useState("VEG");
  const [allergies, setAllergies] = useState("");
  const [mealDays, setMealDays] = useState<{ date: string; lunch: boolean; dinner: boolean; headCount: number }[]>([]);
  const [savingMeal, setSavingMeal] = useState(false);
  const [mealSaved, setMealSaved] = useState(false);
  const [existingMealReg, setExistingMealReg] = useState<MealRegistrationResponse | null>(null);

  useEffect(() => {
    eventService.getAll().then(evts => {
      const activeList = (evts || []).filter(e => {
        const s = String(e.status || "").toUpperCase();
        return s !== "CANCELLED" && s !== "CLOSED" && s !== "ARCHIVED";
      });
      setEvents(activeList);
      if (activeList.length > 0) setSelectedEventId(activeList[0].id);
    }).catch(() => {});
  }, []);

  const loadData = () => {
    if (useMock) {
      setMealSummary(MOCK_MEAL_SUMMARY);
      return;
    }
    setLoading(true);
    setError("");

    Promise.all([
      foodEventService.getEvents().catch(() => ({ content: [] })),
      eventService.getLunchDinners().catch(() => []),
      eventService.getAllRegistrations().catch(() => []),
      selectedEventId ? eventProgramService.getMealSummary(selectedEventId).catch(() => null) : Promise.resolve(null),
    ])
      .then(([fEvents, mList, regs, summary]) => {
        setLiveEvents(fEvents.content ?? []);
        setLiveMeals(mList ?? []);
        setLiveRegistrations(regs ?? []);
        if (summary) setMealSummary(summary);
      })
      .catch((e) => {
        if (!e?.message?.toLowerCase().includes("403")) {
          setError(e.message ?? "Failed to load food operations data");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [useMock, selectedEventId]);

  useEffect(() => {
    if (!selectedEventId || useMock) return;
    eventProgramService.getUserMeals(selectedEventId)
      .then(reg => {
        setExistingMealReg(reg);
        if (reg) {
          setDietaryPref(reg.dietaryPref || "VEG");
          setAllergies(reg.allergies || "");
          if (reg.meals?.length > 0) setMealDays(reg.meals);
        }
      })
      .catch(() => {});
  }, [selectedEventId, useMock]);

  const initMealDays = () => {
    if (mealSummary && mealSummary.days.length > 0) {
      setMealDays(mealSummary.days.map(d => ({ date: d.date, lunch: true, dinner: true, headCount: 1 })));
    } else {
      const today = new Date();
      const dates = Array.from({ length: 3 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        return d.toISOString().split("T")[0];
      });
      setMealDays(dates.map(date => ({ date, lunch: true, dinner: true, headCount: 1 })));
    }
  };

  const handleSaveMealReg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId && !useMock) return;
    setSavingMeal(true);
    try {
      if (!useMock && selectedEventId) {
        await eventProgramService.saveMeals(selectedEventId, {
          eventId: selectedEventId,
          dietaryPref,
          allergies: allergies || undefined,
          meals: mealDays,
        });
      }
      setMealSaved(true);
      setTimeout(() => { setMealSaved(false); setShowMealReg(false); loadData(); }, 1200);
    } catch (err: any) {
      setError(err?.message || "Failed to save meal preferences");
    } finally {
      setSavingMeal(false);
    }
  };

  const toggleMealDay = (idx: number, field: "lunch" | "dinner") => {
    setMealDays(prev => prev.map((d, i) => i === idx ? { ...d, [field]: !d[field] } : d));
  };

  const updateHeadCount = (idx: number, val: number) => {
    setMealDays(prev => prev.map((d, i) => i === idx ? { ...d, headCount: Math.max(1, val) } : d));
  };

  const selectedEvent = useMemo(() => {
    return events.find(e => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  const eventScopedMeals = useMemo(() => {
    if (!selectedEventId) return liveMeals;
    return liveMeals.filter(m => {
      if (m.mainEventId === selectedEventId) return true;
      if (selectedEvent && selectedEvent.startDate && selectedEvent.endDate) {
        return m.date >= selectedEvent.startDate && m.date <= selectedEvent.endDate;
      }
      return false;
    });
  }, [liveMeals, selectedEventId, selectedEvent]);

  const totalPlannedPlates = useMemo(() => {
    if (useMock) return mockMenuItems.reduce((a, m) => a + m.qty, 0);
    return eventScopedMeals.reduce((a, m) => a + (m.targetPlates || 500), 0);
  }, [useMock, eventScopedMeals]);

  const totalBookedAttendees = useMemo(() => {
    if (useMock) return mockMenuItems.reduce((a, m) => a + m.prepared, 0);
    return liveRegistrations
      .filter(r => {
        const s = String(r.status || "").toUpperCase();
        if (s === "CANCELLED" || s === "REJECTED") return false;
        return eventScopedMeals.some(m => r.activityId === `meal-${m.id}` || r.activityId === `food-${m.id}` || r.activityTitle === m.name);
      })
      .reduce((a, r) => a + (Number(r.devoteeCount ?? r.membersCount ?? 1) || 1), 0);
  }, [useMock, liveRegistrations, eventScopedMeals]);

  const readyPct = totalPlannedPlates > 0 ? Math.round((totalBookedAttendees / totalPlannedPlates) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Event Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center flex-shrink-0">
            <UtensilsCrossed className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              Food & Catering Operations
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                {eventScopedMeals.length} Sessions
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live catering, prasadam scheduling, plates capacity & devotee preferences
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {events.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
              <select
                value={selectedEventId ?? ""}
                onChange={(e) => setSelectedEventId(Number(e.target.value))}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[220px] truncate"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} {ev.startDate ? `(${ev.startDate})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <a
            href="/events/schedule?tab=lunchDinner"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-sm cursor-pointer"
          >
            Manage Schedule <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Scoped Event Banner */}
      {selectedEvent && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-orange-50/70 border border-orange-200/80 text-xs text-orange-950 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-orange-600 font-bold">📅 Active Event:</span>
            <span className="font-extrabold text-slate-900">{selectedEvent.title}</span>
            {selectedEvent.startDate && (
              <span className="text-slate-600 font-medium">
                ({selectedEvent.startDate} {selectedEvent.endDate ? `to ${selectedEvent.endDate}` : ""})
              </span>
            )}
          </div>
          {selectedEvent.location && (
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-orange-500" /> {selectedEvent.location}
            </span>
          )}
        </div>
      )}

      {error && <ErrorBanner message={error} />}
      {loading && <LoadingSpinner label="Loading food operations data…" />}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: "Scheduled Meals", value: String(eventScopedMeals.length || 4), color: "#f97316", sub: "Kitchen batches" },
          { label: "Target Plates", value: totalPlannedPlates.toLocaleString("en-IN"), color: "#4f46e5", sub: "Total capacity" },
          { label: "Booked Plates", value: totalBookedAttendees.toLocaleString("en-IN"), color: "#10b981", sub: `${readyPct}% capacity` },
          { label: "Kitchen Teams", value: "6", color: "#7c3aed", sub: "Active caterers" },
        ].map((s, i) => (
          <div
            key={s.label}
            className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)} bg-white rounded-2xl p-3 sm:p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center`}
          >
            <p className="text-lg sm:text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 sm:mt-1">{s.label}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        {/* Menu preparation & live meal courses */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="flex items-center justify-between px-3 sm:px-6 pt-3 sm:pt-5 pb-2 sm:pb-4 border-b border-slate-50">
            <h2 className="font-bold text-slate-800">Menu Preparation & Batches</h2>
            <a
              href="/events/schedule?tab=lunchDinner"
              className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Meal
            </a>
          </div>
          <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
            {!useMock && eventScopedMeals.length > 0 ? (
              eventScopedMeals.map((m, i) => {
                const bookedCount = liveRegistrations
                  .filter(r => r.activityId === `meal-${m.id}` || r.activityId === `food-${m.id}` || r.activityTitle === m.name)
                  .reduce((a, r) => a + (Number(r.devoteeCount ?? 1) || 1), 0);
                const target = m.targetPlates || 500;
                const pct = Math.min(100, Math.round((bookedCount / target) * 100));

                return (
                  <div key={m.id} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-xs sm:text-sm">{m.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                          {m.mealType}
                        </span>
                        {m.dietType && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            {m.dietType}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-medium tabular-nums">
                        <span className="font-bold text-orange-600">{bookedCount}</span> / {target} plates
                      </span>
                    </div>

                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full transition-all ${
                          pct >= 90 ? "bg-rose-500" : pct >= 60 ? "bg-orange-500" : "bg-emerald-500"
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>📅 {m.date} {m.startTime ? `· ${m.startTime}` : ""}</span>
                      <span>👨‍🍳 {m.caterer || "Temple Kitchen"}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              mockMenuItems.map((item, i) => {
                const ss = statusStyle[item.status] || { bg: "bg-emerald-50", text: "text-emerald-700" };
                const pct = Math.round((item.prepared / item.qty) * 100);
                return (
                  <div key={item.name} className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-slate-800">{item.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ss.bg} ${ss.text}`}>{item.status}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium tabular-nums">
                        {item.prepared} / {item.qty} {item.unit}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                          pct === 100 ? "bg-emerald-500" : pct > 60 ? "bg-orange-500" : "bg-amber-400"
                        }`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Ingredient stock */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="flex items-center justify-between px-3 sm:px-6 pt-3 sm:pt-5 pb-2 sm:pb-4 border-b border-slate-50">
            <h2 className="font-bold text-slate-800">Ingredient Stock</h2>
            <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-600">
              <TrendingDown className="w-3.5 h-3.5" /> 3 items low
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {ingredients.map((ing, i) => (
              <div
                key={ing.item}
                className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)} flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${ing.status === "ok" ? "bg-emerald-400" : "bg-amber-400"}`} />
                  <p className="font-semibold text-slate-800 text-xs sm:text-sm">{ing.item}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-600">Need: {ing.required}</p>
                  <p className={`text-xs font-semibold mt-0.5 ${ing.status === "ok" ? "text-emerald-600" : "text-amber-600"}`}>
                    Have: {ing.available}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Meal Demand from Registrations */}
      {mealSummary && mealSummary.days.length > 0 && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="flex items-center justify-between px-3 sm:px-6 pt-3 sm:pt-5 pb-2 sm:pb-4 border-b border-slate-50">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-indigo-500" /> Meal Demand (Registrations)
            </h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {mealSummary.days.reduce((a, d) => a + d.lunch.totalHeads + d.dinner.totalHeads, 0)} total meals
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-3 sm:px-6 py-2.5 text-left">Date</th>
                  <th className="px-2 py-2.5 text-center" colSpan={2}>Lunch</th>
                  <th className="px-2 py-2.5 text-center" colSpan={2}>Dinner</th>
                </tr>
                <tr className="text-[9px] font-bold text-slate-300 uppercase border-b border-slate-50">
                  <th></th>
                  <th className="px-2 py-1 text-center">Heads</th>
                  <th className="px-2 py-1 text-center">Breakdown</th>
                  <th className="px-2 py-1 text-center">Heads</th>
                  <th className="px-2 py-1 text-center">Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {mealSummary.days.map((day, i) => (
                  <tr key={day.date} className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)}`}>
                    <td className="px-3 sm:px-6 py-2.5 font-semibold text-slate-700 whitespace-nowrap">
                      {new Date(day.date + "T00:00").toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-2 py-2.5 text-center font-bold text-indigo-600">{day.lunch.totalHeads}</td>
                    <td className="px-2 py-2.5">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {day.lunch.veg > 0 && <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold">V {day.lunch.veg}</span>}
                        {day.lunch.vegan > 0 && <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-700 text-[9px] font-bold">Vn {day.lunch.vegan}</span>}
                        {day.lunch.jain > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-bold">J {day.lunch.jain}</span>}
                        {day.lunch.nonveg > 0 && <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[9px] font-bold">NV {day.lunch.nonveg}</span>}
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-center font-bold text-violet-600">{day.dinner.totalHeads}</td>
                    <td className="px-2 py-2.5">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {day.dinner.veg > 0 && <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold">V {day.dinner.veg}</span>}
                        {day.dinner.vegan > 0 && <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-700 text-[9px] font-bold">Vn {day.dinner.vegan}</span>}
                        {day.dinner.jain > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-bold">J {day.dinner.jain}</span>}
                        {day.dinner.nonveg > 0 && <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[9px] font-bold">NV {day.dinner.nonveg}</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Meal Registration Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex items-center justify-between px-3 sm:px-6 pt-3 sm:pt-5 pb-2 sm:pb-4 border-b border-slate-50">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-emerald-500" /> Meal Preferences & Registration
          </h2>
          <button
            onClick={() => { if (!showMealReg) initMealDays(); setShowMealReg(!showMealReg); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm cursor-pointer"
          >
            {showMealReg ? "Close" : existingMealReg ? "Edit Preferences" : "Register Meals"}
          </button>
        </div>

        {existingMealReg && !showMealReg && (
          <div className="px-3 sm:px-6 py-3 sm:py-4 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-700">Meal preferences registered</span>
            </div>
            <p className="text-xs text-slate-500">
              Diet: {existingMealReg.dietaryPref || "Not set"}
              {existingMealReg.allergies && ` · Allergies: ${existingMealReg.allergies}`}
              {existingMealReg.meals && ` · ${existingMealReg.meals.length} day(s)`}
            </p>
          </div>
        )}

        {showMealReg && (
          <form onSubmit={handleSaveMealReg} className="px-3 sm:px-6 py-4 space-y-4">
            {mealSaved ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-800">Meal preferences saved!</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-600">Dietary Preference</span>
                    <select value={dietaryPref} onChange={e => setDietaryPref(e.target.value)}
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white">
                      <option value="VEG">Vegetarian</option>
                      <option value="VEGAN">Vegan</option>
                      <option value="JAIN">Jain</option>
                      <option value="NON_VEG">Non-Vegetarian</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-600">Allergies / Special Needs</span>
                    <input type="text" value={allergies} onChange={e => setAllergies(e.target.value)}
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      placeholder="e.g. Nut allergy, Gluten free" />
                  </label>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-600 block mb-2">Meal Days</span>
                  <div className="space-y-2">
                    {mealDays.map((day, idx) => (
                      <div key={day.date} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">
                          {new Date(day.date + "T00:00").toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                          <input type="checkbox" checked={day.lunch} onChange={() => toggleMealDay(idx, "lunch")}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-300" />
                          Lunch
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                          <input type="checkbox" checked={day.dinner} onChange={() => toggleMealDay(idx, "dinner")}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-300" />
                          Dinner
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 ml-auto">
                          Heads:
                          <input type="number" value={day.headCount} onChange={e => updateHeadCount(idx, Number(e.target.value))}
                            className="w-14 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-2 focus:ring-emerald-300"
                            min="1" max="20" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowMealReg(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={savingMeal}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer">
                    {savingMeal && <Loader2 className="w-4 h-4 animate-spin" />} Save Meal Preferences
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

