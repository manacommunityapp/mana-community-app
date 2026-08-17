import { useState, useEffect } from "react";
import {
  UtensilsCrossed, Plus, Loader2, AlertCircle, Pencil, Trash2, Users, Clock,
  MapPin, Calendar, IndianRupee, X, ChevronDown, ChevronUp, User,
} from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { eventService, type EventResponse } from "../../../services/events/eventService";

type LunchDinner = {
  id: number;
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

type BookingRegistration = {
  id: number;
  regCode: string;
  activityId: string;
  activityTitle: string;
  category: string;
  participantName: string;
  gotram?: string;
  attendingDevotees?: string;
  devoteeCount: number;
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  bookingFee: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
};

const MEAL_TYPES = ["Lunch", "Dinner", "Breakfast", "Brunch", "Snacks", "Prasadam"];
const DIET_TYPES = ["Vegetarian", "Vegan", "Jain", "Sattvic", "Non-Vegetarian"];

const mockLunchDinners: LunchDinner[] = [
  { id: 1, name: "Day 1 – Grand Lunch", mealType: "Lunch", date: "2026-08-27", startTime: "12:00", endTime: "14:00", venue: "Community Hall - Dining Area", targetPlates: 500, caterer: "Sri Annapurna Caterers", dietType: "Vegetarian", fee: 0, isFree: true, menuItems: ["Rice", "Sambar", "Rasam", "Curd", "Payasam", "Poriyal", "Papad"], notes: "Unlimited serving" },
  { id: 2, name: "Day 1 – Evening Prasadam", mealType: "Dinner", date: "2026-08-27", startTime: "19:00", endTime: "21:00", venue: "Temple Courtyard", targetPlates: 300, caterer: "Temple Kitchen", dietType: "Sattvic", fee: 0, isFree: true, menuItems: ["Pulihora", "Vada", "Kesari", "Buttermilk"], notes: "" },
  { id: 3, name: "Day 2 – Sponsor Lunch", mealType: "Lunch", date: "2026-08-28", startTime: "12:30", endTime: "14:30", venue: "VIP Dining Hall", targetPlates: 100, caterer: "Grand Bhoj Caterers", dietType: "Vegetarian", fee: 501, isFree: false, menuItems: ["Paneer Butter Masala", "Naan", "Biryani", "Gulab Jamun", "Raita", "Salad"], notes: "Sponsor-only lunch, pass required" },
  { id: 4, name: "Day 2 – Community Dinner", mealType: "Dinner", date: "2026-08-28", startTime: "19:30", endTime: "21:30", venue: "Community Hall - Dining Area", targetPlates: 400, caterer: "Sri Annapurna Caterers", dietType: "Vegetarian", fee: 0, isFree: true, menuItems: ["Chapati", "Dal Fry", "Aloo Gobi", "Rice", "Kheer"], notes: "" },
];

const mockRegistrations: BookingRegistration[] = [
  { id: 10, regCode: "MEAL-2001", activityId: "meal-1", activityTitle: "Day 1 – Grand Lunch", category: "Meal", participantName: "Ramesh Sharma", devoteeCount: 4, eventDate: "2026-08-27", eventTime: "12:00 PM", venue: "Community Hall", bookingFee: 0, paymentStatus: "FREE", status: "CONFIRMED", createdAt: "2026-08-15T10:00:00" },
  { id: 11, regCode: "MEAL-2002", activityId: "meal-1", activityTitle: "Day 1 – Grand Lunch", category: "Meal", participantName: "Lakshmi Devi", devoteeCount: 3, eventDate: "2026-08-27", eventTime: "12:00 PM", venue: "Community Hall", bookingFee: 0, paymentStatus: "FREE", status: "CONFIRMED", createdAt: "2026-08-15T14:00:00" },
  { id: 12, regCode: "MEAL-2003", activityId: "meal-3", activityTitle: "Day 2 – Sponsor Lunch", category: "Meal", participantName: "Venkatesh Rao", devoteeCount: 2, eventDate: "2026-08-28", eventTime: "12:30 PM", venue: "VIP Dining Hall", bookingFee: 501, paymentStatus: "PAID", status: "CONFIRMED", createdAt: "2026-08-16T09:00:00" },
  { id: 13, regCode: "MEAL-2004", activityId: "meal-2", activityTitle: "Day 1 – Evening Prasadam", category: "Meal", participantName: "Subramaniam K.", devoteeCount: 5, eventDate: "2026-08-27", eventTime: "07:00 PM", venue: "Temple Courtyard", bookingFee: 0, paymentStatus: "FREE", status: "CONFIRMED", createdAt: "2026-08-16T11:00:00" },
  { id: 14, regCode: "MEAL-2005", activityId: "meal-4", activityTitle: "Day 2 – Community Dinner", category: "Meal", participantName: "Annapurna Devi", devoteeCount: 6, eventDate: "2026-08-28", eventTime: "07:30 PM", venue: "Community Hall", bookingFee: 0, paymentStatus: "FREE", status: "CONFIRMED", createdAt: "2026-08-17T08:00:00" },
];

const emptyForm = {
  mainEventId: "",
  name: "",
  mealType: "Lunch",
  date: "",
  startTime: "12:00",
  endTime: "14:00",
  venue: "",
  targetPlates: "500",
  caterer: "",
  dietType: "Vegetarian",
  fee: "0",
  isFree: true,
  menuItems: ["Rice", "Sambar", "Rasam"],
  notes: "",
};

export function EventsLunchDinner() {
  const { useMock } = useEventMock();
  const [meals, setMeals] = useState<LunchDinner[]>([]);
  const [registrations, setRegistrations] = useState<BookingRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [expandedMealId, setExpandedMealId] = useState<number | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    eventService.getAll().then(setEvents).catch(() => {});
  }, []);

  const loadData = () => {
    let localMeals: any[] = [];
    try {
      localMeals = JSON.parse(localStorage.getItem("mana_local_lunch_dinners") || "[]");
    } catch {}

    if (useMock) {
      const merged = [...localMeals, ...mockLunchDinners];
      const unique = merged.filter((item, index, self) => index === self.findIndex((t) => t.name === item.name));
      setMeals(unique);
      setRegistrations(mockRegistrations);
      return;
    }
    setLoading(true);
    setError("");
    Promise.all([eventService.getLunchDinners(), eventService.getAllRegistrations()])
      .then(([m, regs]) => {
        const merged = [...localMeals, ...(m || [])];
        const unique = merged.filter((item, index, self) => index === self.findIndex((t) => t.name === item.name));
        const mealRegs = (regs || [])
          .filter((r: any) => r.category === "Meal" || r.activityId?.startsWith("meal-"))
          .map((r: any) => {
            let count = Number(r.devoteeCount ?? r.membersCount ?? 0);
            if (!count && r.membersJson) {
              try {
                const parsed = JSON.parse(r.membersJson);
                if (Array.isArray(parsed) && parsed.length > 0) count = parsed.length;
              } catch {}
            }
            if (!count) count = 1;
            return { ...r, devoteeCount: count };
          });
        setRegistrations(mealRegs);
      })
      .catch(e => {
        if (localMeals.length > 0) {
          setMeals(localMeals);
        } else {
          setError(e?.message || "Failed to load meal data");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    window.addEventListener("mana_activities_updated", loadData);
    window.addEventListener("mana_schedule_updated", loadData);
    return () => {
      window.removeEventListener("mana_activities_updated", loadData);
      window.removeEventListener("mana_schedule_updated", loadData);
    };
  }, [useMock]);

  const getRegsForMeal = (meal: LunchDinner) =>
    useMock
      ? registrations.filter(r => r.activityId === `meal-${meal.id}`)
      : registrations.filter(r => r.activityTitle === meal.name || r.activityId === `meal-${meal.id}` || r.activityId === String(meal.id));

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = () => { setEditingId(null); setForm({ ...emptyForm, mainEventId: events[0] ? String(events[0].id) : "" }); setFormError(""); setShowModal(true); };

  const openEdit = (m: LunchDinner) => {
    setEditingId(m.id);
    setForm({
      mainEventId: "", name: m.name, mealType: m.mealType, date: m.date,
      startTime: m.startTime || "12:00", endTime: m.endTime || "14:00",
      venue: m.venue || "", targetPlates: String(m.targetPlates || 500),
      caterer: m.caterer || "", dietType: m.dietType || "Vegetarian",
      fee: String(m.fee || 0), isFree: m.isFree ?? true,
      menuItems: m.menuItems?.length ? m.menuItems : ["Rice"], notes: m.notes || "",
    });
    setFormError(""); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError("Name is required"); return; }
    if (!form.date) { setFormError("Date is required"); return; }

    const payload = {
      mainEventId: form.mainEventId || undefined,
      name: form.name, mealType: form.mealType, date: form.date,
      startTime: form.startTime || undefined, endTime: form.endTime || undefined,
      venue: form.venue || undefined, targetPlates: form.targetPlates ? Number(form.targetPlates) : undefined,
      caterer: form.caterer || undefined, dietType: form.dietType || undefined,
      fee: form.isFree ? 0 : Number(form.fee || 0), isFree: form.isFree,
      menuItems: form.menuItems.filter(Boolean), notes: form.notes || undefined,
    };

    setSaving(true); setFormError("");
    try {
      if (editingId) {
        if (useMock) { setMeals(prev => prev.map(m => m.id === editingId ? { ...m, ...payload, targetPlates: payload.targetPlates, fee: payload.fee } as LunchDinner : m)); }
        else { const resp = await eventService.updateLunchDinner(editingId, payload); setMeals(prev => prev.map(m => m.id === editingId ? resp : m)); }
      } else {
        if (useMock) { setMeals(prev => [{ id: Date.now(), ...payload, targetPlates: payload.targetPlates, fee: payload.fee } as LunchDinner, ...prev]); }
        else { const resp = await eventService.createLunchDinner(payload); setMeals(prev => [resp, ...prev]); }
      }
      setShowModal(false); setEditingId(null); setForm(emptyForm);
    } catch (err: any) { setFormError(err?.response?.data?.message || err?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (m: LunchDinner) => {
    if (!confirm(`Delete "${m.name}"?`)) return;
    if (useMock) { setMeals(prev => prev.filter(x => x.id !== m.id)); return; }
    try { await eventService.deleteLunchDinner(m.id); setMeals(prev => prev.filter(x => x.id !== m.id)); }
    catch (err: any) { setError(err?.message || "Failed to delete"); }
  };

  const addMenuItem = () => set("menuItems", [...form.menuItems, ""]);
  const removeMenuItem = (i: number) => set("menuItems", form.menuItems.filter((_, idx) => idx !== i));
  const updateMenuItem = (i: number, v: string) => { const n = [...form.menuItems]; n[i] = v; set("menuItems", n); };

  const totalPlates = meals.reduce((a, m) => a + (m.targetPlates || 0), 0);
  const totalRegs = registrations.length;
  const totalHeadcount = registrations.reduce((a, r) => a + (r.devoteeCount || 1), 0);

  const mealIcon = (type: string) => {
    switch (type) {
      case "Breakfast": return "🌅";
      case "Lunch": return "☀️";
      case "Dinner": return "🌙";
      case "Snacks": return "🍪";
      case "Prasadam": return "🙏";
      default: return "🍽️";
    }
  };

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-orange-500" /> Lunch & Dinner Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage meals, caterers, menus, and registrations</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 transition-all shadow-sm">
          <Plus className="w-3.5 h-3.5" /> Create Meal
        </button>
      </div>

      {error && <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700"><AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}</div>}
      {loading && <div className="flex items-center justify-center py-8 text-slate-400"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading meals...</div>}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: "Total Meals", value: meals.length, color: "#f97316" },
          { label: "Target Plates", value: totalPlates.toLocaleString("en-IN"), color: "#6366f1" },
          { label: "Registrations", value: totalRegs, color: "#10b981" },
          { label: "Total Headcount", value: totalHeadcount, color: "#0891b2" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-2.5 sm:p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center">
            <p className="text-lg sm:text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 sm:mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Meal List */}
      <div className="space-y-3">
        {meals.map(meal => {
          const regs = getRegsForMeal(meal);
          const isExpanded = expandedMealId === meal.id;
          const headcount = regs.reduce((a, r) => a + (r.devoteeCount || 1), 0);
          return (
            <div key={meal.id} className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5 text-lg">
                    {mealIcon(meal.mealType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-bold text-slate-800 text-sm sm:text-base">{meal.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700">{meal.mealType}</span>
                          {meal.dietType && <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">{meal.dietType}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(meal)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(meal)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {meal.date}</span>
                      {meal.startTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {meal.startTime}{meal.endTime ? ` – ${meal.endTime}` : ""}</span>}
                      {meal.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {meal.venue}</span>}
                      {meal.caterer && <span className="flex items-center gap-1">👨‍🍳 {meal.caterer}</span>}
                    </div>

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {meal.targetPlates && <span className="text-xs font-semibold text-indigo-600">🍽️ {meal.targetPlates} plates target</span>}
                      <span className="text-xs font-semibold text-emerald-600">{meal.isFree ? "Free" : `₹${meal.fee?.toLocaleString("en-IN")}`}</span>
                      {meal.menuItems && meal.menuItems.length > 0 && <span className="text-[10px] text-slate-400">Menu: {meal.menuItems.join(", ")}</span>}
                    </div>
                  </div>
                </div>

                <button onClick={() => setExpandedMealId(isExpanded ? null : meal.id)}
                  className="mt-3 flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors w-full justify-center py-1.5 rounded-lg hover:bg-indigo-50">
                  <Users className="w-3.5 h-3.5" />
                  {regs.length} Registration{regs.length !== 1 ? "s" : ""} ({headcount} guest{headcount !== 1 ? "s" : ""})
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100">
                  {regs.length === 0 ? (
                    <p className="px-6 py-6 text-center text-sm text-slate-400">No registrations yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-100">
                            {["Reg Code", "Guest Name", "Guests", "Date / Time", "Fee", "Payment", "Status", "Registered At"].map(h => (
                              <th key={h} className={`px-3 sm:px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap ${["Date / Time", "Registered At"].includes(h) ? "hidden lg:table-cell" : ""}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {regs.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-3 sm:px-4 py-2.5 font-mono text-xs text-indigo-600 font-semibold">{r.regCode}</td>
                              <td className="px-3 sm:px-4 py-2.5 font-semibold text-slate-800">{r.participantName}</td>
                              <td className="px-3 sm:px-4 py-2.5"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold"><User className="w-3 h-3" /> {r.devoteeCount}</span></td>
                              <td className="px-3 sm:px-4 py-2.5 text-slate-500 hidden lg:table-cell whitespace-nowrap">{r.eventDate || "—"} {r.eventTime ? `· ${r.eventTime}` : ""}</td>
                              <td className="px-3 sm:px-4 py-2.5 font-semibold text-slate-700">{r.bookingFee > 0 ? `₹${r.bookingFee.toLocaleString("en-IN")}` : "Free"}</td>
                              <td className="px-3 sm:px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.paymentStatus === "PAID" ? "bg-emerald-50 text-emerald-700" : r.paymentStatus === "FREE" ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700"}`}>{r.paymentStatus}</span></td>
                              <td className="px-3 sm:px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700" : r.status === "CANCELLED" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>{r.status}</span></td>
                              <td className="px-3 sm:px-4 py-2.5 text-slate-400 hidden lg:table-cell whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!loading && meals.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-8 text-center">
            <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">No meals created yet</p>
            <p className="text-xs text-slate-400 mt-1">Click "Create Meal" to add lunch, dinner, or prasadam</p>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center"><UtensilsCrossed className="w-5 h-5 text-orange-500" /></div>
                <div>
                  <h3 className="font-bold text-slate-800">{editingId ? "Edit Meal" : "Create Meal"}</h3>
                  <p className="text-xs text-slate-400">Set up meal details, menu, and capacity</p>
                </div>
              </div>
              <button onClick={() => { setShowModal(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formError && <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700"><AlertCircle className="w-4 h-4 flex-shrink-0" /> {formError}</div>}

              {!useMock && events.length > 0 && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Parent Event</span>
                  <select value={form.mainEventId} onChange={e => set("mainEventId", e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white">
                    <option value="">Select event (optional)</option>
                    {events.map(ev => <option key={ev.id} value={String(ev.id)}>{ev.title}</option>)}
                  </select>
                </label>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Meal Name *</span>
                  <input type="text" value={form.name} onChange={e => set("name", e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" placeholder="e.g. Day 1 Grand Lunch" required />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Meal Type *</span>
                  <select value={form.mealType} onChange={e => set("mealType", e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" required>
                    {MEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Date *</span>
                  <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" required />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Start Time</span>
                  <input type="time" value={form.startTime} onChange={e => set("startTime", e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">End Time</span>
                  <input type="time" value={form.endTime} onChange={e => set("endTime", e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Venue</span>
                  <input type="text" value={form.venue} onChange={e => set("venue", e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" placeholder="Community Hall" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Caterer</span>
                  <input type="text" value={form.caterer} onChange={e => set("caterer", e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" placeholder="Sri Annapurna Caterers" />
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Target Plates</span>
                  <input type="number" value={form.targetPlates} onChange={e => set("targetPlates", e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" min="1" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Diet Type</span>
                  <select value={form.dietType} onChange={e => set("dietType", e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white">
                    {DIET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Free?</span>
                  <div className="flex items-center gap-2 h-[38px]">
                    <input type="checkbox" checked={form.isFree} onChange={e => set("isFree", e.target.checked)} className="rounded border-slate-300 text-orange-600 focus:ring-orange-300" />
                    <span className="text-sm text-slate-600">{form.isFree ? "Free meal" : "Paid"}</span>
                  </div>
                </label>
                {!form.isFree && (
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-600">Fee (₹)</span>
                    <input type="number" value={form.fee} onChange={e => set("fee", e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" min="0" />
                  </label>
                )}
              </div>

              {/* Menu Items */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-600">Menu Items</span>
                  <button type="button" onClick={addMenuItem} className="text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-0.5"><Plus className="w-3 h-3" /> Add Item</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.menuItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1">
                      <input type="text" value={item} onChange={e => updateMenuItem(idx, e.target.value)} className="bg-transparent text-xs text-orange-800 font-semibold focus:outline-none w-24" placeholder="Item name" />
                      <button type="button" onClick={() => removeMenuItem(idx)} className="text-orange-400 hover:text-rose-500"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">Notes</span>
                <textarea value={form.notes} onChange={e => set("notes", e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" rows={2} placeholder="Special instructions" />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editingId ? "Update Meal" : "Create Meal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
