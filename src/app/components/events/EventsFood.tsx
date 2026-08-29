import { useState, useEffect, useMemo } from "react";
import {
  TrendingDown, Plus, UtensilsCrossed, Loader2, CheckCircle2, Calendar, MapPin,
  Sparkles, Clock, Users, User, ArrowRight, Download, Pencil, Trash2, X, AlertCircle,
  Package, ShoppingBag, Save, Check
} from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { ErrorBanner, LoadingSpinner } from "./shared";
import { foodEventService } from "../../../services/food/foodEventService";
import { foodPantryService } from "../../../services/food/foodPantryService";
import type { PantryItem } from "../../../types/food";
import {
  eventProgramService,
  type MealSummaryResponse,
  type MealRegistrationRequest,
  type MealRegistrationResponse,
} from "../../../services/events/eventProgramService";
import { eventService, type EventResponse } from "../../../services/events/eventService";
import { LunchDinnerRegistrationModal } from "./LunchDinnerRegistrationModal";

type LunchDinner = {
  id: number;
  communityId?: number;
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

interface IngredientStock {
  id: string;
  item: string;
  required: string;
  available: string;
  unit: string;
  status: "ok" | "low" | "critical";
  category: string;
}

const mockMenuItems = [
  { name: "Pulihora", qty: 800, unit: "plates", prepared: 650, status: "In Progress" },
  { name: "Curd Rice", qty: 600, unit: "plates", prepared: 600, status: "Ready" },
  { name: "Sweet Pongal", qty: 500, unit: "plates", prepared: 500, status: "Ready" },
  { name: "Vada", qty: 1200, unit: "pieces", prepared: 900, status: "In Progress" },
  { name: "Payasam", qty: 700, unit: "cups", prepared: 0, status: "Pending" },
  { name: "Prasadam Laddu", qty: 2000, unit: "pieces", prepared: 1500, status: "In Progress" },
  { name: "Coconut Water", qty: 400, unit: "pieces", prepared: 400, status: "Ready" },
];

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

  const [liveMeals, setLiveMeals] = useState<LunchDinner[]>([]);
  const [liveRegistrations, setLiveRegistrations] = useState<any[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [customStockList, setCustomStockList] = useState<IngredientStock[]>(() => {
    try {
      const saved = localStorage.getItem("mana_event_pantry_custom");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mealSummary, setMealSummary] = useState<MealSummaryResponse | null>(null);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  // Meal Preferences Form State
  const [showMealReg, setShowMealReg] = useState(false);
  const [dietaryPref, setDietaryPref] = useState("VEG");
  const [allergies, setAllergies] = useState("");
  const [mealDays, setMealDays] = useState<{ date: string; lunch: boolean; dinner: boolean; headCount: number }[]>([]);
  const [savingMeal, setSavingMeal] = useState(false);
  const [mealSaved, setMealSaved] = useState(false);
  const [existingMealReg, setExistingMealReg] = useState<MealRegistrationResponse | null>(null);

  // Ingredient Stock State
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockForm, setStockForm] = useState({ item: "", required: "", available: "", unit: "kg", category: "Groceries" });
  const [savingPantryToDb, setSavingPantryToDb] = useState(false);
  const [pantrySaveSuccess, setPantrySaveSuccess] = useState(false);

  // Add / Edit Meal Modal State
  const [showMealModal, setShowMealModal] = useState(false);
  const [editingMealId, setEditingMealId] = useState<number | null>(null);
  const [mealForm, setMealForm] = useState({
    name: "",
    mealType: "Lunch",
    date: new Date().toISOString().slice(0, 10),
    startTime: "12:30",
    endTime: "14:30",
    venue: "Main Dining Hall",
    targetPlates: 500,
    caterer: "Temple Kitchen Staff",
    dietType: "VEG",
    fee: 0,
    isFree: true,
    menuItems: "Pulihora, Curd Rice, Sweet Pongal, Vada, Payasam",
  });
  const [savingMealBatch, setSavingMealBatch] = useState(false);

  // Devotee Quick Pass RSVP Modal
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [rsvpMeal, setRsvpMeal] = useState<LunchDinner | null>(null);

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
      eventService.getLunchDinners(selectedEventId ?? undefined).catch(() => []),
      selectedEventId ? eventProgramService.getMealSummary(selectedEventId).catch(() => null) : Promise.resolve(null),
      foodPantryService.getItems().catch(() => []),
    ])
      .then(([mList, summary, pantry]) => {
        setLiveMeals(mList ?? []);
        if (summary) setMealSummary(summary);
        if (Array.isArray(pantry)) setPantryItems(pantry);
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
    return eventScopedMeals.reduce((a, m) => a + (m.targetPlates || 0), 0);
  }, [useMock, eventScopedMeals]);

  const activeCaterersCount = useMemo(() => {
    if (useMock) return 6;
    const caterers = new Set(eventScopedMeals.map(m => m.caterer?.trim()).filter(Boolean));
    return caterers.size;
  }, [useMock, eventScopedMeals]);

  const totalBookedAttendees = useMemo(() => {
    if (useMock) return mockMenuItems.reduce((a, m) => a + m.prepared, 0);
    return eventScopedMeals.reduce((a, m) => {
      const booked = Number((m as any).bookedCount ?? (m as any).attendeeHeadcount ?? (m as any).headcount ?? 0);
      return a + booked;
    }, 0);
  }, [useMock, eventScopedMeals]);

  const readyPct = totalPlannedPlates > 0 ? Math.min(100, Math.round((totalBookedAttendees / totalPlannedPlates) * 100)) : 0;

  // Strictly actual database pantry items — no hardcoded/static fallbacks
  const stockList = useMemo<IngredientStock[]>(() => {
    const dbMapped: IngredientStock[] = (pantryItems || []).map((p) => {
      const customMatch = customStockList.find(c => c.item.toLowerCase() === p.itemName.toLowerCase());
      const reqNum = customMatch ? parseFloat(customMatch.required) || 0 : 0;
      const availNum = p.quantity ?? 0;
      const status: "ok" | "low" | "critical" =
        reqNum > 0
          ? (availNum >= reqNum ? "ok" : availNum < reqNum * 0.5 ? "critical" : "low")
          : (availNum > 0 ? "ok" : "critical");

      return {
        id: String(p.id),
        item: p.itemName,
        required: String(reqNum),
        available: String(availNum),
        unit: p.unit || "kg",
        status,
        category: p.category || "Pantry",
      };
    });

    const extras = customStockList.filter(c =>
      !dbMapped.some(d => d.item.toLowerCase() === c.item.toLowerCase())
    );

    return [...dbMapped, ...extras];
  }, [pantryItems, customStockList]);

  const lowStockCount = stockList.filter(s => s.status !== "ok" && parseFloat(s.required) > 0).length;

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

  const toggleMealDay = (idx: number, field: "lunch" | "dinner") => {
    setMealDays(prev => prev.map((d, i) => i === idx ? { ...d, [field]: !d[field] } : d));
  };

  const updateHeadCount = (idx: number, val: number) => {
    setMealDays(prev => prev.map((d, i) => i === idx ? { ...d, headCount: Math.max(1, val) } : d));
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

  const openCreateMealModal = () => {
    setEditingMealId(null);
    setMealForm({
      name: "",
      mealType: "Lunch",
      date: selectedEvent?.startDate || new Date().toISOString().slice(0, 10),
      startTime: "12:30",
      endTime: "14:30",
      venue: "Main Dining Hall",
      targetPlates: 500,
      caterer: "Temple Kitchen Staff",
      dietType: "VEG",
      fee: 0,
      isFree: true,
      menuItems: "Pulihora, Curd Rice, Sweet Pongal, Vada, Payasam",
    });
    setShowMealModal(true);
  };

  const openEditMealModal = (m: LunchDinner) => {
    setEditingMealId(m.id);
    setMealForm({
      name: m.name,
      mealType: m.mealType || "Lunch",
      date: m.date,
      startTime: m.startTime || "12:30",
      endTime: m.endTime || "14:30",
      venue: m.venue || "Main Dining Hall",
      targetPlates: m.targetPlates || 500,
      caterer: m.caterer || "Temple Kitchen Staff",
      dietType: m.dietType || "VEG",
      fee: m.fee || 0,
      isFree: m.isFree ?? (m.fee === 0),
      menuItems: Array.isArray(m.menuItems) ? m.menuItems.join(", ") : (m.notes || ""),
    });
    setShowMealModal(true);
  };

  const handleSaveMealBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealForm.name.trim()) return;

    if (selectedEventId) {
      const ev = events.find(x => x.id === selectedEventId);
      if (ev && ev.startDate) {
        const minD = ev.startDate;
        const maxD = ev.endDate || ev.startDate;
        if (mealForm.date < minD || mealForm.date > maxD) {
          setError(`Meal date must be between event start (${minD}) and end (${maxD}) dates.`);
          return;
        }
      }
    }

    setSavingMealBatch(true);
    setError("");
    try {
      const payload: any = {
        mainEventId: selectedEventId || 1,
        name: mealForm.name.trim(),
        mealType: mealForm.mealType,
        date: mealForm.date,
        startTime: mealForm.startTime,
        endTime: mealForm.endTime,
        venue: mealForm.venue,
        targetPlates: Number(mealForm.targetPlates) || 500,
        caterer: mealForm.caterer,
        dietType: mealForm.dietType,
        fee: mealForm.isFree ? 0 : Number(mealForm.fee) || 0,
        isFree: mealForm.isFree,
        menuItems: mealForm.menuItems.split(",").map(s => s.trim()).filter(Boolean),
        notes: mealForm.menuItems,
      };

      if (editingMealId) {
        await eventService.updateLunchDinner(editingMealId, payload);
      } else {
        await eventService.createLunchDinner(payload);
      }

      setShowMealModal(false);
      loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to save meal batch");
    } finally {
      setSavingMealBatch(false);
    }
  };

  const handleDeleteMeal = async (id: number) => {
    if (!confirm("Are you sure you want to delete this meal course?")) return;
    try {
      await eventService.deleteLunchDinner(id);
      loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to delete meal course");
    }
  };

  // Restock / Add Stock Item (Updates working list and persists to database)
  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockForm.item.trim()) return;
    const reqNum = parseFloat(stockForm.required) || 0;
    const availNum = parseFloat(stockForm.available) || 0;
    const status: "ok" | "low" | "critical" = availNum >= reqNum ? "ok" : (availNum < reqNum * 0.5 ? "critical" : "low");

    const updatedCustom: IngredientStock = {
      id: `ING-CUSTOM-${Date.now()}`,
      item: stockForm.item.trim(),
      required: stockForm.required,
      available: stockForm.available,
      unit: stockForm.unit,
      status,
      category: stockForm.category,
    };

    // Save directly to backend database
    if (!useMock) {
      try {
        const existing = pantryItems.find(p => p.itemName.toLowerCase() === updatedCustom.item.toLowerCase());
        if (existing && existing.id) {
          await foodPantryService.updateItem(existing.id, {
            itemName: updatedCustom.item,
            category: updatedCustom.category,
            quantity: availNum,
            unit: updatedCustom.unit,
            storageLocation: "PANTRY",
          });
        } else {
          await foodPantryService.addItem({
            itemName: updatedCustom.item,
            category: updatedCustom.category,
            quantity: availNum,
            unit: updatedCustom.unit,
            storageLocation: "PANTRY",
          });
        }
        const fresh = await foodPantryService.getItems().catch(() => []);
        if (Array.isArray(fresh)) setPantryItems(fresh);
      } catch (err: any) {
        console.warn("Failed to persist pantry item to database:", err);
      }
    }

    setCustomStockList(prev => {
      const idx = prev.findIndex(s => s.item.toLowerCase() === updatedCustom.item.toLowerCase());
      const next = idx >= 0 ? prev.map((s, i) => i === idx ? updatedCustom : s) : [...prev, updatedCustom];
      try {
        localStorage.setItem("mana_event_pantry_custom", JSON.stringify(next));
      } catch {}
      return next;
    });

    setShowStockModal(false);
    setStockForm({ item: "", required: "", available: "", unit: "kg", category: "Groceries" });
  };

  const handleDeleteStockItem = (ing: IngredientStock) => {
    setCustomStockList(prev => {
      const next = prev.filter(s => s.id !== ing.id && s.item.toLowerCase() !== ing.item.toLowerCase());
      try { localStorage.setItem("mana_event_pantry_custom", JSON.stringify(next)); } catch {}
      return next;
    });
    setPantryItems(prev => prev.filter(p => String(p.id) !== ing.id && p.itemName.toLowerCase() !== ing.item.toLowerCase()));
  };

  // Explicitly persist all pantry items to database
  const handleSaveAllPantryToDb = async () => {
    if (useMock) {
      setPantrySaveSuccess(true);
      setTimeout(() => setPantrySaveSuccess(false), 3000);
      return;
    }
    if (stockList.length === 0) return;
    setSavingPantryToDb(true);
    setError("");
    try {
      for (const item of stockList) {
        const availNum = parseFloat(item.available) || 0;
        const existing = pantryItems.find(p => (p.itemName || (p as any).name || "").toLowerCase() === item.item.toLowerCase());
        if (existing && existing.id) {
          await foodPantryService.updateItem(existing.id, {
            itemName: item.item,
            category: item.category,
            quantity: availNum,
            unit: item.unit,
            storageLocation: "PANTRY",
          }).catch(() => {});
        } else {
          await foodPantryService.addItem({
            itemName: item.item,
            category: item.category,
            quantity: availNum,
            unit: item.unit,
            storageLocation: "PANTRY",
          }).catch(() => {});
        }
      }
      const fresh = await foodPantryService.getItems().catch(() => []);
      if (Array.isArray(fresh)) setPantryItems(fresh);
      setPantrySaveSuccess(true);
      setTimeout(() => setPantrySaveSuccess(false), 4000);
    } catch (err: any) {
      setError(err?.message || "Failed to save pantry details to database");
    } finally {
      setSavingPantryToDb(false);
    }
  };

  // Devotee RSVP
  const openRsvpModal = (m: LunchDinner) => {
    setRsvpMeal(m);
    setShowRsvpModal(true);
  };

  // Export CSV
  const exportCateringCSV = () => {
    const headers = "Meal Course,Type,Date,Start Time,End Time,Venue,Caterer,Target Plates,Booked Plates,Diet Type,Fee (INR),Menu Items\n";
    const rows = eventScopedMeals.map(m => {
      const booked = Number((m as any).bookedCount ?? (m as any).attendeeHeadcount ?? (m as any).headcount ?? 0);
      const menu = Array.isArray(m.menuItems) ? m.menuItems.join("; ") : (m.notes || "");
      return `"${m.name.replace(/"/g, '""')}","${m.mealType}","${m.date}","${m.startTime || ""}","${m.endTime || ""}","${m.venue || ""}","${m.caterer || ""}","${m.targetPlates || 500}","${booked}","${m.dietType || "VEG"}","${m.fee || 0}","${menu.replace(/"/g, '""')}"`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `catering_logistics_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Event Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center flex-shrink-0">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              Food &amp; Catering Operations
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                {eventScopedMeals.length} Live Batches
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live catering, prasadam scheduling, plates capacity &amp; devotee preferences
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

          <button
            onClick={exportCateringCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Sheet
          </button>

          <button
            onClick={openCreateMealModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Meal Course
          </button>
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
          { label: "Scheduled Meals", value: String(eventScopedMeals.length), color: "#f97316", sub: "Kitchen batches" },
          { label: "Target Plates", value: totalPlannedPlates.toLocaleString("en-IN"), color: "#4f46e5", sub: "Total capacity" },
          { label: "Booked Plates", value: totalBookedAttendees.toLocaleString("en-IN"), color: "#10b981", sub: `${readyPct}% capacity` },
          { label: "Kitchen Teams", value: String(activeCaterersCount), color: "#7c3aed", sub: "Active caterers" },
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
            <h2 className="font-bold text-slate-800">Menu Preparation &amp; Batches</h2>
            <button
              onClick={openCreateMealModal}
              className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Course
            </button>
          </div>
          <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
            {!useMock ? (
              eventScopedMeals.length > 0 ? (
                eventScopedMeals.map((m) => {
                  const bookedCount = Number((m as any).bookedCount ?? (m as any).attendeeHeadcount ?? (m as any).headcount ?? 0);
                  const target = m.targetPlates || 0;
                  const pct = target > 0 ? Math.min(100, Math.round((bookedCount / target) * 100)) : 0;

                  return (
                    <div key={m.id} className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2 hover:border-orange-200 transition-all">
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
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                            {m.isFree ? "Free" : `₹${m.fee}`}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium tabular-nums">
                          <span className="font-bold text-orange-600">{bookedCount}</span> / {target} plates
                        </span>
                      </div>

                      {target > 0 && (
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full rounded-full transition-all ${
                              pct >= 90 ? "bg-rose-500" : pct >= 60 ? "bg-orange-500" : "bg-emerald-500"
                            }`}
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <span>📅 {m.date} {m.startTime ? `· ${m.startTime}` : ""}</span>
                          <span>👨‍🍳 {m.caterer || "Temple Kitchen"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-auto">
                          <button
                            onClick={() => openRsvpModal(m)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-orange-100 text-orange-800 hover:bg-orange-200 transition-colors cursor-pointer"
                          >
                            RSVP Pass
                          </button>
                          <button
                            onClick={() => openEditMealModal(m)}
                            className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-md transition cursor-pointer"
                            title="Edit Meal"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMeal(m.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                            title="Delete Meal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <UtensilsCrossed className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold">No meal batches scheduled for this event yet.</p>
                  <button
                    onClick={openCreateMealModal}
                    className="text-xs text-orange-600 font-bold hover:underline cursor-pointer"
                  >
                    + Add First Meal Course
                  </button>
                </div>
              )
            ) : (
              mockMenuItems.map((item, i) => {
                const pct = Math.round((item.prepared / item.qty) * 100);
                return (
                  <div key={item.name} className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-slate-800">{item.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">{item.status}</span>
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

        {/* Ingredient Stock & Pantry Tracker */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between px-3 sm:px-6 pt-3 sm:pt-5 pb-2 sm:pb-4 border-b border-slate-50 gap-2">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-500" /> Ingredient Stock & Pantry
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {pantrySaveSuccess && (
                <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 animate-fade-in">
                  <Check className="w-3 h-3 stroke-[3]" /> Saved to Database
                </span>
              )}
              {lowStockCount > 0 && (
                <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <TrendingDown className="w-3 h-3" /> {lowStockCount} items low
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveAllPantryToDb}
                disabled={savingPantryToDb || stockList.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition shadow-2xs cursor-pointer"
                title="Persist current ingredient requirements and stock to database"
              >
                {savingPantryToDb ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Save to Database
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowStockModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add / Restock
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-50 max-h-[360px] overflow-y-auto">
            {stockList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No Pantry Inventory in Database</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Click &ldquo;+ Add / Restock&rdquo; to add actual pantry items and save them to the database.
                </p>
              </div>
            ) : (
              stockList.map((ing, i) => (
                <div
                  key={ing.id}
                  className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)} flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 hover:bg-slate-50/50 transition-colors`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      ing.status === "ok" ? "bg-emerald-500" : ing.status === "low" ? "bg-amber-400" : "bg-rose-500"
                    }`} />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-xs sm:text-sm truncate">{ing.item}</p>
                      <span className="text-[10px] text-slate-400">{ing.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      {parseFloat(ing.required) > 0 && (
                        <p className="text-xs font-bold text-slate-700">Need: {ing.required} {ing.unit}</p>
                      )}
                      <p className={`text-xs font-semibold ${parseFloat(ing.required) > 0 ? "mt-0.5" : ""} ${
                        ing.status === "ok" ? "text-emerald-600" : ing.status === "low" ? "text-amber-600" : "text-rose-600"
                      }`}>
                        Available: {ing.available} {ing.unit}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteStockItem(ing)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
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

      {/* Add / Edit Meal Batch Modal */}
      {showMealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">{editingMealId ? "Edit Meal Course" : "Add Meal Course"}</h3>
              <button
                type="button"
                onClick={() => setShowMealModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveMealBatch} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="col-span-2 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Meal Course Name *</span>
                  <input
                    type="text"
                    value={mealForm.name}
                    onChange={e => setMealForm(f => ({ ...f, name: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="e.g. Mahaprasadam Feast, Royal Lunch"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Meal Type</span>
                  <select
                    value={mealForm.mealType}
                    onChange={e => setMealForm(f => ({ ...f, mealType: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Prasadam">Prasadam</option>
                    <option value="Snacks">Snacks / High Tea</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Diet Type</span>
                  <select
                    value={mealForm.dietType}
                    onChange={e => setMealForm(f => ({ ...f, dietType: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                  >
                    <option value="VEG">Vegetarian (Pure)</option>
                    <option value="JAIN">Jain Sattvik</option>
                    <option value="VEGAN">Vegan</option>
                    <option value="NON_VEG">Non-Vegetarian</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Date *</span>
                  <input
                    type="date"
                    value={mealForm.date}
                    onChange={e => setMealForm(f => ({ ...f, date: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Target Plates Capacity</span>
                  <input
                    type="number"
                    value={mealForm.targetPlates}
                    onChange={e => setMealForm(f => ({ ...f, targetPlates: Number(e.target.value) }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    min="1"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Start Time</span>
                  <input
                    type="time"
                    value={mealForm.startTime}
                    onChange={e => setMealForm(f => ({ ...f, startTime: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">End Time</span>
                  <input
                    type="time"
                    value={mealForm.endTime}
                    onChange={e => setMealForm(f => ({ ...f, endTime: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </label>

                <label className="col-span-2 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Caterer / Kitchen Incharge</span>
                  <input
                    type="text"
                    value={mealForm.caterer}
                    onChange={e => setMealForm(f => ({ ...f, caterer: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="e.g. Sri Sai Caterers"
                  />
                </label>

                <label className="col-span-2 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Menu Items (comma-separated)</span>
                  <textarea
                    rows={2}
                    value={mealForm.menuItems}
                    onChange={e => setMealForm(f => ({ ...f, menuItems: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="e.g. Pulihora, Curd Rice, Sweet Pongal, Vada, Payasam"
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMealModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMealBatch}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition disabled:opacity-60 cursor-pointer"
                >
                  {savingMealBatch && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingMealId ? "Update Course" : "Save Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock / Add Stock Modal */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Restock / Add Ingredient</h3>
              <button
                type="button"
                onClick={() => setShowStockModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveStock} className="px-6 py-5 space-y-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500">Ingredient Name *</span>
                <input
                  type="text"
                  value={stockForm.item}
                  onChange={e => setStockForm(f => ({ ...f, item: e.target.value }))}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder="e.g. Sona Masoori Rice"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Required Qty</span>
                  <input
                    type="number"
                    value={stockForm.required}
                    onChange={e => setStockForm(f => ({ ...f, required: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="250"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Available Qty</span>
                  <input
                    type="number"
                    value={stockForm.available}
                    onChange={e => setStockForm(f => ({ ...f, available: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="260"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Unit</span>
                  <select
                    value={stockForm.unit}
                    onChange={e => setStockForm(f => ({ ...f, unit: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="L">L (Litres)</option>
                    <option value="pieces">pieces</option>
                    <option value="bags">bags</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Category</span>
                  <select
                    value={stockForm.category}
                    onChange={e => setStockForm(f => ({ ...f, category: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                  >
                    <option value="Grains">Grains & Rice</option>
                    <option value="Dairy">Dairy & Milk</option>
                    <option value="Pulses">Pulses & Dal</option>
                    <option value="Spices">Spices & Oils</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Dry Fruits">Dry Fruits</option>
                  </select>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition cursor-pointer"
                >
                  Save Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Devotee Quick Pass RSVP Modal */}
      <LunchDinnerRegistrationModal
        isOpen={showRsvpModal}
        onClose={() => {
          setShowRsvpModal(false);
          setRsvpMeal(null);
        }}
        meal={rsvpMeal}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
}


