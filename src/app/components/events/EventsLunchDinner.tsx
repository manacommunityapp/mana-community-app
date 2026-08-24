import { useState, useEffect, useMemo } from "react";
import {
  UtensilsCrossed, Plus, Loader2, AlertCircle, Pencil, Trash2, Users, Clock,
  MapPin, Calendar, X, ChevronDown, ChevronUp, User, Download,
  CheckCircle2, Sparkles,
} from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { eventService, type EventResponse } from "../../../services/events/eventService";
import { TimePicker } from "../ui/time-picker";

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

type BookingRegistration = {
  id: number;
  regCode: string;
  activityId: string;
  activityTitle: string;
  category: string;
  participantName: string;
  email?: string;
  phone?: string;
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
  notes?: string;
};

const MEAL_TYPES = ["Lunch", "Dinner", "Breakfast", "Brunch", "Snacks", "Prasadam"];
const DIET_TYPES = ["Vegetarian", "Vegan", "Jain", "Sattvic", "Non-Vegetarian"];

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
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [expandedMealId, setExpandedMealId] = useState<number | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [rsvpMeal, setRsvpMeal] = useState<LunchDinner | null>(null);
  const [rsvpForm, setRsvpForm] = useState({
    participantName: "",
    phone: "",
    email: "",
    devoteeCount: "1",
    dietType: "Vegetarian",
    notes: "",
  });
  const [savingRsvp, setSavingRsvp] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [rsvpError, setRsvpError] = useState("");

  useEffect(() => {
    eventService.getAll().then((data) => setEvents(data || [])).catch(() => {});
  }, []);

  const loadData = () => {
    if (useMock) return;
    setLoading(true);
    setError("");
    Promise.all([eventService.getLunchDinners(), eventService.getAllRegistrations()])
      .then(([m, regs]) => {
        setMeals(m || []);
        const mealRegs = (regs || [])
          .filter((r: any) => {
            const regStatus = String(r.status || "").toUpperCase();
            if (regStatus === "CANCELLED" || regStatus === "REJECTED") return false;
            if (String(r.eventStatus || "").toUpperCase() === "CANCELLED") return false;
            return r.category === "Meal" || r.category === "Food" || r.category === "Prasadam" || r.activityId?.startsWith("meal-") || r.activityId?.startsWith("food-");
          })
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
      .catch((e) => setError(e?.message || "Failed to load meal data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    window.addEventListener("mana_activities_updated", loadData);
    return () => window.removeEventListener("mana_activities_updated", loadData);
  }, [useMock]);

  const selectedEvent = useMemo(() => {
    if (selectedEventId === "all") return null;
    return events.find((e) => String(e.id) === selectedEventId) || null;
  }, [events, selectedEventId]);

  const filteredMeals = useMemo(() => {
    if (selectedEventId === "all") return meals;
    const numId = Number(selectedEventId);
    return meals.filter((m) => {
      if (m.mainEventId && m.mainEventId === numId) return true;
      if (!m.mainEventId && selectedEvent) {
        return m.date >= (selectedEvent.startDate || "") && m.date <= (selectedEvent.endDate || selectedEvent.startDate || "");
      }
      return false;
    });
  }, [meals, selectedEventId, selectedEvent]);

  const getRegsForMeal = (meal: LunchDinner) =>
    registrations.filter((r) => r.activityId === `meal-${meal.id}` || r.activityId === `food-${meal.id}` || r.activityId === String(meal.id) || r.activityTitle === meal.name);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditingId(null);
    const initialEventId = selectedEventId !== "all" ? selectedEventId : (events[0] ? String(events[0].id) : "");
    const matchedEv = events.find((e) => String(e.id) === initialEventId);
    setForm({ ...emptyForm, mainEventId: initialEventId, date: matchedEv?.startDate || "", venue: matchedEv?.location || "" });
    setShowModal(true);
  };

  const openEdit = (m: LunchDinner) => {
    setEditingId(m.id);
    setForm({
      mainEventId: m.mainEventId ? String(m.mainEventId) : (selectedEventId !== "all" ? selectedEventId : ""),
      name: m.name, mealType: m.mealType, date: m.date,
      startTime: m.startTime || "12:00", endTime: m.endTime || "14:00",
      venue: m.venue || "", targetPlates: String(m.targetPlates || 500),
      caterer: m.caterer || "", dietType: m.dietType || "Vegetarian",
      fee: String(m.fee || 0), isFree: m.isFree ?? true,
      menuItems: m.menuItems?.length ? m.menuItems : ["Rice"], notes: m.notes || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.date) { setFormError("Name and Date are required"); return; }
    const payload = {
      mainEventId: form.mainEventId ? Number(form.mainEventId) : undefined,
      name: form.name.trim(), mealType: form.mealType, date: form.date,
      startTime: form.startTime || undefined, endTime: form.endTime || undefined,
      venue: form.venue?.trim() || undefined, targetPlates: form.targetPlates ? Number(form.targetPlates) : undefined,
      caterer: form.caterer?.trim() || undefined, dietType: form.dietType || undefined,
      fee: form.isFree ? 0 : Number(form.fee || 0), isFree: form.isFree,
      menuItems: form.menuItems.filter(Boolean), notes: form.notes?.trim() || undefined,
    };
    setSaving(true);
    try {
      if (editingId) {
        if (!useMock) await eventService.updateLunchDinner(editingId, payload);
      } else {
        if (!useMock) await eventService.createLunchDinner(payload);
      }
      window.dispatchEvent(new CustomEvent("mana_activities_updated"));
      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);
      loadData();
    } catch (err: any) { setFormError(err?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (m: LunchDinner) => {
    if (!confirm(`Delete "${m.name}"?`)) return;
    try {
      if (!useMock) await eventService.deleteLunchDinner(m.id);
      loadData();
    } catch (err: any) { setError(err?.message || "Failed to delete"); }
  };

  const openRsvp = (meal: LunchDinner) => {
    setRsvpMeal(meal);
    setRsvpForm({ participantName: "", phone: "", email: "", devoteeCount: "1", dietType: meal.dietType || "Vegetarian", notes: "" });
    setShowRsvpModal(true);
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpMeal) return;
    const count = Math.max(1, Number(rsvpForm.devoteeCount) || 1);
    setSavingRsvp(true);
    try {
      const regPayload = {
        category: "Meal", activityId: `meal-${rsvpMeal.id}`, activityTitle: rsvpMeal.name,
        participantName: rsvpForm.participantName.trim(), phone: rsvpForm.phone.trim() || undefined,
        devoteeCount: count, eventDate: rsvpMeal.date, bookingFee: (rsvpMeal.isFree ? 0 : (rsvpMeal.fee || 0)) * count,
        paymentStatus: rsvpMeal.isFree ? "FREE" : "PAID", status: "CONFIRMED",
        notes: `Diet: ${rsvpForm.dietType}${rsvpForm.notes ? ` · ${rsvpForm.notes}` : ""}`,
      };
      if (!useMock) await eventService.adminCreateRegistration(regPayload);
      setRsvpSuccess(true);
      window.dispatchEvent(new CustomEvent("mana_activities_updated"));
      setTimeout(() => { setShowRsvpModal(false); setRsvpSuccess(false); loadData(); }, 1200);
    } catch (err: any) { setRsvpError(err?.message || "Failed to book"); }
    finally { setSavingRsvp(false); }
  };

  const exportMealCsv = (meal: LunchDinner) => {
    const regs = getRegsForMeal(meal);
    const headers = ["Reg Code", "Guest Name", "Phone", "Devotee Count", "Fee", "Status"];
    const rows = regs.map((r) => [r.regCode, r.participantName, r.phone || "", r.devoteeCount, r.bookingFee, r.status]);
    const csv = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meal.name.replace(/\s+/g, '_')}_attendees.csv`;
    a.click();
  };

  const addMenuItem = () => set("menuItems", [...form.menuItems, ""]);
  const removeMenuItem = (i: number) => set("menuItems", form.menuItems.filter((_, idx) => idx !== i));
  const updateMenuItem = (i: number, v: string) => { const n = [...form.menuItems]; n[i] = v; set("menuItems", n); };

  const totalPlates = filteredMeals.reduce((a, m) => a + (m.targetPlates || 0), 0);
  const relevantRegs = registrations.filter((r) => filteredMeals.some((m) => r.activityId === `meal-${m.id}` || r.activityTitle === m.name));
  const totalRegs = relevantRegs.length;
  const totalHeadcount = relevantRegs.reduce((a, r) => a + (r.devoteeCount || 1), 0);

  const mealIcon = (type: string) => (type === "Breakfast" ? "🌅" : type === "Lunch" ? "☀️" : type === "Dinner" ? "🌙" : type === "Prasadam" ? "🙏" : "🍽️");

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center flex-shrink-0">
            <UtensilsCrossed className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              Lunch & Dinner Management
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                {filteredMeals.length} {filteredMeals.length === 1 ? "Meal" : "Meals"}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live catering, prasadam scheduling, plates capacity & devotee pass management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Event selector dropdown */}
          {events.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer max-w-[160px] sm:max-w-[220px] truncate"
              >
                <option value="all">🌟 All Events</option>
                {events.map((ev) => (
                  <option key={ev.id} value={String(ev.id)}>
                    {ev.title} {ev.startDate ? `(${ev.startDate})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Meal
          </button>
        </div>
      </div>

      {/* Selected Event Context Banner */}
      {selectedEvent && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-orange-50/70 border border-orange-200/80 text-xs text-orange-950 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-orange-600 font-bold">📅 Scoped Event:</span>
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

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading meal records from database...
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: "Scheduled Meals", value: filteredMeals.length, color: "#f97316", sub: "Active sessions" },
          { label: "Target Plates", value: totalPlates.toLocaleString("en-IN"), color: "#6366f1", sub: "Kitchen capacity" },
          { label: "Devotee Bookings", value: totalRegs, color: "#10b981", sub: "Confirmed passes" },
          { label: "Booked Attendees", value: totalHeadcount, color: "#0891b2", sub: `${totalPlates > 0 ? Math.round((totalHeadcount / totalPlates) * 100) : 0}% booked` },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-3 sm:p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center"
          >
            <p className="text-lg sm:text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 sm:mt-1">{s.label}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Meal List */}
      <div className="space-y-3.5">
        {filteredMeals.map((meal) => {
          const regs = getRegsForMeal(meal);
          const isExpanded = expandedMealId === meal.id;
          const headcount = regs.reduce((a, r) => a + (r.devoteeCount || 1), 0);
          const target = meal.targetPlates || 500;
          const pct = Math.min(100, Math.round((headcount / target) * 100));

          return (
            <div
              key={meal.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden transition-all hover:border-orange-200"
            >
              <div className="px-4 sm:px-6 py-3.5 sm:py-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5 text-lg shadow-2xs">
                    {mealIcon(meal.mealType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-extrabold text-slate-900 text-sm sm:text-base">{meal.name}</p>
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                            {meal.mealType}
                          </span>
                          {meal.dietType && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {meal.dietType}
                            </span>
                          )}
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            {meal.isFree ? "Free Meal" : `₹${meal.fee?.toLocaleString("en-IN")}`}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openRsvp(meal)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-50 text-orange-700 hover:bg-orange-600 hover:text-white transition-colors cursor-pointer"
                          title="Issue Meal Pass"
                        >
                          <Plus className="w-3 h-3" /> Book Plate
                        </button>
                        <button
                          onClick={() => openEdit(meal)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Edit Meal"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(meal)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Meal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata chips */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-orange-500" /> {meal.date}
                      </span>
                      {meal.startTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {meal.startTime}
                          {meal.endTime ? ` – ${meal.endTime}` : ""}
                        </span>
                      )}
                      {meal.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {meal.venue}
                        </span>
                      )}
                      {meal.caterer && (
                        <span className="flex items-center gap-1 font-medium text-slate-600">
                          👨‍🍳 Caterer: {meal.caterer}
                        </span>
                      )}
                    </div>

                    {/* Menu items */}
                    {meal.menuItems && meal.menuItems.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px]">
                        <span className="font-bold text-slate-500">Menu:</span>
                        {meal.menuItems.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Plate utilization progress bar */}
                    <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          🍽️ Plate Capacity:{" "}
                          <span className="text-orange-600">{headcount}</span> / {target} Booked
                        </span>
                        <span
                          className={`font-black text-[11px] ${
                            pct >= 90 ? "text-rose-600" : pct >= 70 ? "text-amber-600" : "text-emerald-600"
                          }`}
                        >
                          {pct}% Filled
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expand registrations trigger */}
                <div className="mt-3 pt-2 border-t border-slate-50 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    onClick={() => setExpandedMealId(isExpanded ? null : meal.id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors py-1 px-2 rounded-lg hover:bg-indigo-50 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    {regs.length} Registration{regs.length !== 1 ? "s" : ""} ({headcount} attendee{headcount !== 1 ? "s" : ""})
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
                  </button>

                  {regs.length > 0 && (
                    <button
                      onClick={() => exportMealCsv(meal)}
                      className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                      title="Download attendee list as CSV"
                    >
                      <Download className="w-3 h-3" /> Export CSV
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable registered attendees table */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/40">
                  {regs.length === 0 ? (
                    <div className="px-6 py-6 text-center text-sm text-slate-400">
                      <p>No devotee registrations recorded yet for this meal.</p>
                      <button
                        onClick={() => openRsvp(meal)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Book first pass
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-100/70 border-b border-slate-200/80">
                            {["Reg Code", "Devotee Name", "Attendees", "Diet / Notes", "Date / Time", "Fee", "Payment", "Status"].map((h) => (
                              <th
                                key={h}
                                className={`px-3 sm:px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ${
                                  ["Date / Time"].includes(h) ? "hidden lg:table-cell" : ""
                                }`}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {regs.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-3 sm:px-4 py-2.5 font-mono text-[11px] text-indigo-600 font-bold whitespace-nowrap">
                                {r.regCode}
                              </td>
                              <td className="px-3 sm:px-4 py-2.5">
                                <p className="font-bold text-slate-800 text-[11px] whitespace-nowrap">{r.participantName}</p>
                                {r.phone && <p className="text-[10px] text-slate-400">{r.phone}</p>}
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                                  <User className="w-3 h-3" /> {r.devoteeCount} {r.devoteeCount === 1 ? "Plate" : "Plates"}
                                </span>
                              </td>
                              <td className="px-3 sm:px-4 py-2.5">
                                <span className="text-[10px] text-slate-600">{r.notes || "Standard"}</span>
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 text-slate-500 text-[10px] hidden lg:table-cell whitespace-nowrap">
                                {r.eventDate || meal.date} {r.eventTime || meal.startTime ? `· ${r.eventTime || meal.startTime}` : ""}
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 font-semibold text-slate-700 whitespace-nowrap">
                                {r.bookingFee > 0 ? `₹${r.bookingFee.toLocaleString("en-IN")}` : "Free"}
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    r.paymentStatus === "PAID"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : r.paymentStatus === "FREE"
                                      ? "bg-sky-50 text-sky-700 border-sky-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}
                                >
                                  {r.paymentStatus}
                                </span>
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    r.status === "CONFIRMED"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : r.status === "CANCELLED"
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  {r.status}
                                </span>
                              </td>
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

        {!loading && filteredMeals.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-8 text-center">
            <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">No meal events scheduled</p>
            <p className="text-xs text-slate-400 mt-1">
              {selectedEvent ? `No meals found for "${selectedEvent.title}".` : "Click \"Create Meal\" to add breakfast, lunch, dinner, or prasadam."}
            </p>
            <button
              onClick={openCreate}
              className="mt-3 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Schedule First Meal
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{editingId ? "Edit Meal Event" : "Create Meal Event"}</h3>
                  <p className="text-xs text-slate-400">Set up meal timings, menu, diet category, and target plates</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowModal(false); setEditingId(null); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {formError}
                </div>
              )}

              {/* Parent event selection */}
              {!useMock && events.length > 0 && (
                <div>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-700">Parent Community Event</span>
                    <select
                      value={form.mainEventId}
                      onChange={(e) => {
                        const newEventId = e.target.value;
                        const ev = events.find((x) => String(x.id) === newEventId);
                        set("mainEventId", newEventId);
                        if (ev && ev.startDate) {
                          set("date", ev.startDate);
                          if (ev.location && !form.venue) set("venue", ev.location);
                        }
                      }}
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                    >
                      <option value="">Select parent event (recommended)</option>
                      {events.map((ev) => (
                        <option key={ev.id} value={String(ev.id)}>
                          {ev.title} {ev.startDate ? `(${ev.startDate} to ${ev.endDate || ev.startDate})` : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedEvent && (
                    <p className="text-[11px] text-indigo-600 mt-1 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Event Duration: {selectedEvent.startDate} to {selectedEvent.endDate || selectedEvent.startDate}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-700">Meal Name *</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="e.g. Day 1 Grand Prasadam Lunch"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-700">Meal Type *</span>
                  <select
                    value={form.mealType}
                    onChange={(e) => set("mealType", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                    required
                  >
                    {MEAL_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-700">Date *</span>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => set("date", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    required
                  />
                </label>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-700">Start Time</span>
                  <TimePicker value={form.startTime} onChange={(v) => set("startTime", v)} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-700">End Time</span>
                  <TimePicker value={form.endTime} onChange={(v) => set("endTime", v)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-700">Venue / Dining Hall</span>
                  <input
                    type="text"
                    value={form.venue}
                    onChange={(e) => set("venue", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="e.g. Community Dining Hall"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-700">Caterer / Kitchen</span>
                  <input
                    type="text"
                    value={form.caterer}
                    onChange={(e) => set("caterer", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="e.g. Temple Kitchen / Sri Annapurna"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-700">Target Plates</span>
                  <input
                    type="number"
                    value={form.targetPlates}
                    onChange={(e) => set("targetPlates", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    min="1"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-700">Diet Type</span>
                  <select
                    value={form.dietType}
                    onChange={(e) => set("dietType", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                  >
                    {DIET_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-700">Free Meal?</span>
                  <div className="flex items-center gap-2 h-[38px]">
                    <input
                      type="checkbox"
                      checked={form.isFree}
                      onChange={(e) => set("isFree", e.target.checked)}
                      className="rounded border-slate-300 text-orange-600 focus:ring-orange-300"
                    />
                    <span className="text-sm text-slate-700">{form.isFree ? "Free meal" : "Paid"}</span>
                  </div>
                </label>
                {!form.isFree && (
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-700">Fee per Head (₹)</span>
                    <input
                      type="number"
                      value={form.fee}
                      onChange={(e) => set("fee", e.target.value)}
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                      min="0"
                    />
                  </label>
                )}
              </div>

              {/* Menu items editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-700">Menu Items</span>
                  <button
                    type="button"
                    onClick={addMenuItem}
                    className="text-[11px] font-bold text-orange-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.menuItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1"
                    >
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateMenuItem(idx, e.target.value)}
                        className="bg-transparent text-xs text-orange-800 font-semibold focus:outline-none w-28"
                        placeholder="Item name"
                      />
                      <button
                        type="button"
                        onClick={() => removeMenuItem(idx)}
                        className="text-orange-400 hover:text-rose-500 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-700">Notes / Instructions</span>
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  rows={2}
                  placeholder="e.g. VIP seating section, unlimited buffet arrangement"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingId(null); }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? "Update Meal" : "Create Meal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Devotee Quick Booking / RSVP Modal */}
      {showRsvpModal && rsvpMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-orange-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold">
                  🍽️
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Issue Meal Pass / RSVP</h3>
                  <p className="text-[11px] text-slate-500">{rsvpMeal.name} · {rsvpMeal.date}</p>
                </div>
              </div>
              <button
                onClick={() => setShowRsvpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRsvpSubmit} className="p-5 space-y-3.5">
              {rsvpError && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {rsvpError}
                </div>
              )}

              {rsvpSuccess && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> Meal pass issued successfully!
                </div>
              )}

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-700">Guest / Devotee Name *</span>
                <input
                  type="text"
                  value={rsvpForm.participantName}
                  onChange={(e) => setRsvpForm((f) => ({ ...f, participantName: e.target.value }))}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder="e.g. S. Ramanathan"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-700">Phone Number</span>
                  <input
                    type="tel"
                    value={rsvpForm.phone}
                    onChange={(e) => setRsvpForm((f) => ({ ...f, phone: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="9876543210"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-700">Number of Plates</span>
                  <input
                    type="number"
                    value={rsvpForm.devoteeCount}
                    min="1"
                    max="50"
                    onChange={(e) => setRsvpForm((f) => ({ ...f, devoteeCount: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-700">Dietary Preference</span>
                  <select
                    value={rsvpForm.dietType}
                    onChange={(e) => setRsvpForm((f) => ({ ...f, dietType: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                  >
                    {DIET_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-col justify-end">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total Fee</p>
                    <p className="text-sm font-extrabold text-slate-800">
                      {rsvpMeal.isFree ? "Free" : `₹${((rsvpMeal.fee || 0) * (Number(rsvpForm.devoteeCount) || 1)).toLocaleString("en-IN")}`}
                    </p>
                  </div>
                </div>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-700">Special Notes</span>
                <input
                  type="text"
                  value={rsvpForm.notes}
                  onChange={(e) => setRsvpForm((f) => ({ ...f, notes: e.target.value }))}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder="e.g. No onion/garlic, elderly seating"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRsvpModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRsvp || rsvpSuccess}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {savingRsvp && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
