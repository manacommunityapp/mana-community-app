import { useState, useEffect } from "react";
import { TrendingDown, Plus, UtensilsCrossed, Loader2, CheckCircle2 } from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { ErrorBanner, LoadingSpinner } from "./shared";
import { foodEventService } from "../../../services/food/foodEventService";
import { eventProgramService, type MealSummaryResponse, type MealRegistrationRequest, type MealRegistrationResponse } from "../../../services/events/eventProgramService";
import { eventService, type EventResponse } from "../../../services/events/eventService";

const menuItems = [
  { name: "Pulihora",         qty: 800,  unit: "plates", prepared: 650, status: "In Progress" },
  { name: "Curd Rice",        qty: 600,  unit: "plates", prepared: 600, status: "Ready"       },
  { name: "Sweet Pongal",     qty: 500,  unit: "plates", prepared: 500, status: "Ready"       },
  { name: "Vada",             qty: 1200, unit: "pieces", prepared: 900, status: "In Progress" },
  { name: "Payasam",          qty: 700,  unit: "cups",   prepared: 0,   status: "Pending"     },
  { name: "Prasadam Laddu",   qty: 2000, unit: "pieces", prepared: 1500,status: "In Progress" },
  { name: "Coconut Water",    qty: 400,  unit: "pieces", prepared: 400, status: "Ready"       },
];

// Mock data — foodEventService used when toggle is "Live API"
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
  let useMock = true;
  try { useMock = useEventMock().useMock; } catch {}

  const [liveEvents, setLiveEvents] = useState<any[]>([]);
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
    if (useMock) {
      setMealSummary(MOCK_MEAL_SUMMARY);
      return;
    }
    setLoading(true);
    setError("");
    foodEventService.getEvents()
      .then(res => setLiveEvents(res.content ?? []))
      .catch(e => {
        if (e?.message?.toLowerCase().includes("403") || e?.status === 403 || String(e?.message ?? "").includes("Access Denied")) {
        } else {
          setError(e.message ?? "Failed to load food events");
        }
      })
      .finally(() => setLoading(false));

    eventService.getAll()
      .then(evts => {
        if (evts.length > 0) {
          eventProgramService.getMealSummary(evts[0].id)
            .then(setMealSummary)
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [useMock]);


  const totalPlanned = menuItems.reduce((a, m) => a + m.qty, 0);
  const totalPrepared = menuItems.reduce((a, m) => a + m.prepared, 0);

  const foodKpis = useMock
    ? [
        { label: "Total Planned",  value: `${totalPlanned.toLocaleString()}`,   color: "#4f46e5" },
        { label: "Prepared",       value: `${totalPrepared.toLocaleString()}`,   color: "#10b981" },
        { label: "Ready %",        value: `${Math.round(totalPrepared/totalPlanned*100)}%`, color: "#6366f1" },
        { label: "Kitchen Teams",  value: "6",                                   color: "#7c3aed" },
      ]
    : [
        { label: "Food Events",    value: String(liveEvents.length),              color: "#4f46e5" },
        { label: "Total Planned",  value: `${totalPlanned.toLocaleString()}`,   color: "#10b981" },
        { label: "Ready %",        value: `${Math.round(totalPrepared/totalPlanned*100)}%`, color: "#6366f1" },
        { label: "Kitchen Teams",  value: "6",                                   color: "#7c3aed" },
      ];

  return (
    <div className="space-y-3 sm:space-y-6">
      {error && <ErrorBanner message={error} />}
      {loading && <LoadingSpinner label="Loading food events…" />}
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {foodKpis.map((s, i) => (
          <div
            key={s.label}
            className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)} bg-white rounded-2xl p-2.5 sm:p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center`}
          >
            <p className="text-lg sm:text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 sm:mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        {/* Menu preparation status */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="flex items-center justify-between px-3 sm:px-6 pt-3 sm:pt-5 pb-2 sm:pb-4 border-b border-slate-50">
            <h2 className="font-bold text-slate-800">Menu Preparation</h2>
            <button className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          </div>
          <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
            {menuItems.map((item, i) => {
              const ss = statusStyle[item.status];
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
            })}
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
    </div>
  );
}
