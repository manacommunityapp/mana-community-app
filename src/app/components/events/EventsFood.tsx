import { useState, useEffect } from "react";
import { TrendingDown, Plus, Loader2, AlertCircle } from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { foodEventService } from "../../../services/food/foodEventService";

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

export function EventsFood() {
  let useMock = true;
  try { useMock = useEventMock().useMock; } catch {}

  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (useMock) return;
    setLoading(true);
    setError("");
    foodEventService.getEvents()
      .then(res => setLiveEvents(res.content ?? []))
      .catch(e => {
        // 403 = user lacks the "View Food Events" authority; fall back silently to mock view
        if (e?.message?.toLowerCase().includes("403") || e?.status === 403 || String(e?.message ?? "").includes("Access Denied")) {
          // No error banner — mock data will be displayed
        } else {
          setError(e.message ?? "Failed to load food events");
        }
      })
      .finally(() => setLoading(false));
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
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {loading && (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading food events...
        </div>
      )}
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
    </div>
  );
}
