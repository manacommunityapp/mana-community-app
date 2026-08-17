import { useState, useEffect } from "react";
import {
  Flame, Plus, Loader2, AlertCircle, Pencil, Trash2, Users, Clock, MapPin,
  Calendar, IndianRupee, X, Star, ChevronDown, ChevronUp, User,
} from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { eventService, type EventResponse } from "../../../services/events/eventService";

type PoojaSeva = {
  id: number;
  name: string;
  type: string;
  date: string;
  endDate?: string;
  multiDay?: boolean;
  startTime?: string;
  startTimes?: string[];
  duration?: number;
  mandap?: string;
  pandit?: string;
  slots?: number;
  fee?: number;
  isFree?: boolean;
  items?: string[];
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

const DEFAULT_POOJA_TYPES = [
  "Ganesh Puja", "Ganapati Homam", "Abhishekam", "Maha Aarti",
  "Satyanarayan Puja", "Laghu Rudra", "Navagraha Puja", "Sahasranama Archana",
];

const mockPoojaSevas: PoojaSeva[] = [
  { id: 1, name: "Maha Ganapathi Abhishekam", type: "Abhishekam", date: "2026-08-27", startTime: "08:30", startTimes: ["08:30", "11:00"], duration: 60, mandap: "Main Temple Mandap", pandit: "Pandit Suresh Sharma", slots: 20, fee: 501, isFree: false, items: ["Coconut", "Flowers", "Bananas", "Kumkum"], notes: "Special silver shield pooja" },
  { id: 2, name: "Satyanarayan Puja", type: "Satyanarayan Puja", date: "2026-08-28", startTime: "09:00", duration: 90, mandap: "Community Hall - Stage A", pandit: "Pandit Ramesh Iyer", slots: 30, fee: 0, isFree: true, items: ["Coconut", "Bananas", "Flowers"], notes: "" },
  { id: 3, name: "Navagraha Homam", type: "Ganapati Homam", date: "2026-08-27", endDate: "2026-08-29", multiDay: true, startTime: "06:00", duration: 120, mandap: "Homa Kund Area", pandit: "Pandit Vishwanath", slots: 15, fee: 1100, isFree: false, items: ["Ghee", "Samagri", "Flowers", "Coconut"], notes: "3-day special homam" },
  { id: 4, name: "Sahasranama Archana", type: "Sahasranama Archana", date: "2026-08-29", startTime: "07:00", startTimes: ["07:00", "16:00"], duration: 45, mandap: "Main Temple Mandap", pandit: "Pandit Suresh Sharma", slots: 50, fee: 251, isFree: false, items: ["Flowers", "Kumkum", "Turmeric"], notes: "" },
];

const mockRegistrations: BookingRegistration[] = [
  { id: 1, regCode: "POOJA-1001", activityId: "pooja-1", activityTitle: "Maha Ganapathi Abhishekam", category: "Pooja", participantName: "Ramesh Sharma", gotram: "Bharadwaj", attendingDevotees: "Ramesh, Priya, Arjun", devoteeCount: 3, eventDate: "2026-08-27", eventTime: "08:30 AM", venue: "Main Temple Mandap", bookingFee: 501, paymentStatus: "PAID", status: "CONFIRMED", createdAt: "2026-08-15T10:30:00" },
  { id: 2, regCode: "POOJA-1002", activityId: "pooja-1", activityTitle: "Maha Ganapathi Abhishekam", category: "Pooja", participantName: "Lakshmi Devi", gotram: "Kashyap", devoteeCount: 2, eventDate: "2026-08-27", eventTime: "11:00 AM", venue: "Main Temple Mandap", bookingFee: 501, paymentStatus: "PAID", status: "CONFIRMED", createdAt: "2026-08-15T14:20:00" },
  { id: 3, regCode: "POOJA-1003", activityId: "pooja-1", activityTitle: "Maha Ganapathi Abhishekam", category: "Pooja", participantName: "Venkatesh Rao", gotram: "Atri", devoteeCount: 4, eventDate: "2026-08-27", eventTime: "08:30 AM", venue: "Main Temple Mandap", bookingFee: 501, paymentStatus: "PAID", status: "CONFIRMED", createdAt: "2026-08-16T09:00:00" },
  { id: 4, regCode: "POOJA-1004", activityId: "pooja-2", activityTitle: "Satyanarayan Puja", category: "Pooja", participantName: "Subramaniam K.", gotram: "Vasishta", devoteeCount: 5, eventDate: "2026-08-28", eventTime: "09:00 AM", venue: "Community Hall", bookingFee: 0, paymentStatus: "FREE", status: "CONFIRMED", createdAt: "2026-08-16T11:00:00" },
  { id: 5, regCode: "POOJA-1005", activityId: "pooja-3", activityTitle: "Navagraha Homam", category: "Pooja", participantName: "Annapurna Devi", gotram: "Bharadwaj", devoteeCount: 2, eventDate: "2026-08-27", eventTime: "06:00 AM", venue: "Homa Kund Area", bookingFee: 1100, paymentStatus: "PAID", status: "CONFIRMED", createdAt: "2026-08-17T08:30:00" },
  { id: 6, regCode: "POOJA-1006", activityId: "pooja-3", activityTitle: "Navagraha Homam", category: "Pooja", participantName: "Chandrashekar M.", gotram: "Gautam", devoteeCount: 3, eventDate: "2026-08-28", eventTime: "06:00 AM", venue: "Homa Kund Area", bookingFee: 1100, paymentStatus: "PENDING", status: "CONFIRMED", createdAt: "2026-08-17T10:15:00" },
];

const emptyPoojaForm = {
  mainEventId: "",
  name: "",
  type: "",
  isMultiDay: false,
  date: "",
  endDate: "",
  startTime: "08:30",
  startTimes: ["08:30"],
  duration: "60",
  mandap: "",
  pandit: "",
  slots: "20",
  fee: "501",
  isFree: true,
  items: ["Coconut", "Flowers", "Bananas"],
  notes: "",
};

export function EventsPoojaSeva() {
  const { useMock } = useEventMock();
  const [poojaSevas, setPoojaSevas] = useState<PoojaSeva[]>([]);
  const [registrations, setRegistrations] = useState<BookingRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [expandedPoojaId, setExpandedPoojaId] = useState<number | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPoojaId, setEditingPoojaId] = useState<number | null>(null);
  const [poojaForm, setPoojaForm] = useState(emptyPoojaForm);
  const [poojaTypes, setPoojaTypes] = useState<string[]>(DEFAULT_POOJA_TYPES);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    eventService.getAll().then(evts => {
      setEvents(evts);
    }).catch(() => {});
  }, []);

  const loadData = () => {
    let localPoojas: any[] = [];
    try {
      localPoojas = JSON.parse(localStorage.getItem("mana_local_pooja_sevas") || "[]");
    } catch {}

    if (useMock) {
      const merged = [...localPoojas, ...mockPoojaSevas];
      const unique = merged.filter((item, index, self) => index === self.findIndex((t) => t.name === item.name));
      setPoojaSevas(unique);
      setRegistrations(mockRegistrations);
      return;
    }
    setLoading(true);
    setError("");
    Promise.all([
      eventService.getPoojaSevas(),
      eventService.getAllRegistrations(),
      eventService.getPoojaTypes(),
    ])
      .then(([sevas, regs, types]) => {
        const merged = [...localPoojas, ...(sevas || [])];
        const unique = merged.filter((item, index, self) => index === self.findIndex((t) => t.name === item.name));
        const poojaRegs = (regs || [])
          .filter((r: any) => r.category === "Pooja" || r.activityId?.startsWith("pooja-"))
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
        setRegistrations(poojaRegs);
        if (types?.length > 0) setPoojaTypes(types.map((t: any) => t.name));
      })
      .catch(e => {
        if (localPoojas.length > 0) {
          setPoojaSevas(localPoojas);
        } else {
          setError(e?.message || "Failed to load pooja data");
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

  const getRegistrationsForPooja = (pooja: PoojaSeva) => {
    if (useMock) {
      return registrations.filter(r => r.activityId === `pooja-${pooja.id}`);
    }
    return registrations.filter(r =>
      r.activityTitle === pooja.name || r.activityId === `pooja-${pooja.id}` || r.activityId === String(pooja.id)
    );
  };

  const set = (k: string, v: any) => setPoojaForm(f => ({ ...f, [k]: v }));

  const openCreateModal = () => {
    setEditingPoojaId(null);
    setPoojaForm({ ...emptyPoojaForm, mainEventId: events.length > 0 ? String(events[0].id) : "" });
    setFormError("");
    setShowCreateModal(true);
  };

  const openEditModal = (p: PoojaSeva) => {
    setEditingPoojaId(p.id);
    setPoojaForm({
      mainEventId: "",
      name: p.name,
      type: p.type,
      isMultiDay: p.multiDay || false,
      date: p.date,
      endDate: p.endDate || "",
      startTime: p.startTime || "08:30",
      startTimes: p.startTimes?.length ? p.startTimes : [p.startTime || "08:30"],
      duration: String(p.duration || 60),
      mandap: p.mandap || "",
      pandit: p.pandit || "",
      slots: String(p.slots || 20),
      fee: String(p.fee || 0),
      isFree: p.isFree || false,
      items: p.items || ["Coconut", "Flowers", "Bananas"],
      notes: p.notes || "",
    });
    setFormError("");
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poojaForm.name.trim()) { setFormError("Pooja name is required"); return; }
    if (!poojaForm.type) { setFormError("Pooja type is required"); return; }
    if (!poojaForm.date) { setFormError("Date is required"); return; }

    const validStartTimes = poojaForm.startTimes.filter(Boolean);
    const payload = {
      mainEventId: poojaForm.mainEventId || undefined,
      name: poojaForm.name,
      type: poojaForm.type,
      date: poojaForm.date,
      endDate: poojaForm.isMultiDay && poojaForm.endDate ? poojaForm.endDate : undefined,
      multiDay: poojaForm.isMultiDay,
      startTime: validStartTimes[0] || poojaForm.startTime,
      startTimes: validStartTimes,
      duration: poojaForm.duration ? Number(poojaForm.duration) : undefined,
      mandap: poojaForm.mandap || undefined,
      pandit: poojaForm.pandit || undefined,
      slots: poojaForm.slots ? Number(poojaForm.slots) : undefined,
      fee: poojaForm.isFree ? 0 : Number(poojaForm.fee || 0),
      isFree: poojaForm.isFree,
      items: poojaForm.items.filter(Boolean),
      notes: poojaForm.notes || undefined,
    };

    setSaving(true);
    setFormError("");
    try {
      if (editingPoojaId) {
        if (useMock) {
          setPoojaSevas(prev => prev.map(p => p.id === editingPoojaId ? { ...p, ...payload, fee: payload.fee, duration: payload.duration, slots: payload.slots } as PoojaSeva : p));
        } else {
          const resp = await eventService.updatePoojaSeva(editingPoojaId, payload);
          setPoojaSevas(prev => prev.map(p => p.id === editingPoojaId ? resp : p));
        }
      } else {
        if (useMock) {
          const newPooja: PoojaSeva = { id: Date.now(), ...payload, fee: payload.fee, duration: payload.duration, slots: payload.slots } as PoojaSeva;
          setPoojaSevas(prev => [newPooja, ...prev]);
        } else {
          const resp = await eventService.createPoojaSeva(payload);
          setPoojaSevas(prev => [resp, ...prev]);
        }
      }
      setShowCreateModal(false);
      setEditingPoojaId(null);
      setPoojaForm(emptyPoojaForm);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || "Failed to save pooja");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: PoojaSeva) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    if (useMock) {
      setPoojaSevas(prev => prev.filter(x => x.id !== p.id));
      return;
    }
    try {
      await eventService.deletePoojaSeva(p.id);
      setPoojaSevas(prev => prev.filter(x => x.id !== p.id));
    } catch (err: any) {
      setError(err?.message || "Failed to delete pooja");
    }
  };

  const addTimeSlot = () => set("startTimes", [...poojaForm.startTimes, ""]);
  const removeTimeSlot = (idx: number) => {
    const next = poojaForm.startTimes.filter((_, i) => i !== idx);
    set("startTimes", next.length > 0 ? next : [""]);
  };
  const updateTimeSlot = (idx: number, val: string) => {
    const next = [...poojaForm.startTimes];
    next[idx] = val;
    set("startTimes", next);
    if (idx === 0) set("startTime", val);
  };

  const addItem = () => set("items", [...poojaForm.items, ""]);
  const removeItem = (idx: number) => set("items", poojaForm.items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, val: string) => {
    const next = [...poojaForm.items];
    next[idx] = val;
    set("items", next);
  };

  const totalRegisteredDevotees = registrations.reduce((a, r) => a + (r.devoteeCount || 1), 0);

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" /> Pooja & Seva Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage temple rituals, view registrations, and configure pooja slots</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Create Pooja
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {loading && (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading pooja sevas...
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: "Total Poojas", value: poojaSevas.length, color: "#f59e0b" },
          { label: "Total Registrations", value: registrations.length, color: "#6366f1" },
          { label: "Total Devotees", value: totalRegisteredDevotees, color: "#10b981" },
          { label: "Paid Bookings", value: registrations.filter(r => r.paymentStatus === "PAID").length, color: "#0891b2" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-2.5 sm:p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center">
            <p className="text-lg sm:text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 sm:mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pooja List with expandable registrations */}
      <div className="space-y-3">
        {poojaSevas.map(pooja => {
          const regs = getRegistrationsForPooja(pooja);
          const isExpanded = expandedPoojaId === pooja.id;
          const totalDevotees = regs.reduce((a, r) => a + (r.devoteeCount || 1), 0);
          return (
            <div key={pooja.id} className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
              {/* Pooja Header Card */}
              <div className="px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Flame className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-bold text-slate-800 text-sm sm:text-base">{pooja.name}</p>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 mt-1">{pooja.type}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEditModal(pooja)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(pooja)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                        {pooja.multiDay && pooja.endDate ? `${pooja.date} to ${pooja.endDate}` : pooja.date}
                      </span>
                      {pooja.startTime && (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
                          {pooja.startTimes?.length ? pooja.startTimes.join(", ") : pooja.startTime}
                          {pooja.duration ? ` (${pooja.duration}m)` : ""}
                        </span>
                      )}
                      {pooja.mandap && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {pooja.mandap}</span>}
                      {pooja.pandit && <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {pooja.pandit}</span>}
                    </div>

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {pooja.slots && (
                        <span className="text-xs font-semibold text-indigo-600">
                          <Users className="w-3 h-3 inline mr-1" />{regs.length}/{pooja.slots} slots
                        </span>
                      )}
                      <span className="text-xs font-semibold text-emerald-600">
                        {pooja.isFree ? "Free" : `₹${pooja.fee?.toLocaleString("en-IN")}`}
                      </span>
                      {pooja.items && pooja.items.length > 0 && (
                        <span className="text-[10px] text-slate-400">Samagri: {pooja.items.join(", ")}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expand toggle for registrations */}
                <button
                  onClick={() => setExpandedPoojaId(isExpanded ? null : pooja.id)}
                  className="mt-3 flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors w-full justify-center py-1.5 rounded-lg hover:bg-indigo-50"
                >
                  <Users className="w-3.5 h-3.5" />
                  {regs.length} Registration{regs.length !== 1 ? "s" : ""} ({totalDevotees} devotee{totalDevotees !== 1 ? "s" : ""})
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Expanded Registrations Table */}
              {isExpanded && (
                <div className="border-t border-slate-100">
                  {regs.length === 0 ? (
                    <p className="px-6 py-6 text-center text-sm text-slate-400">No registrations yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-100">
                            {["Reg Code", "Devotee Name", "Gotram", "Devotees", "Date / Time", "Fee", "Payment", "Status", "Registered At"].map(h => (
                              <th key={h} className={`px-3 sm:px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap ${
                                ["Gotram", "Date / Time", "Registered At"].includes(h) ? "hidden lg:table-cell" : ""
                              }`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {regs.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-3 sm:px-4 py-2.5 font-mono text-xs text-indigo-600 font-semibold">{r.regCode}</td>
                              <td className="px-3 sm:px-4 py-2.5">
                                <p className="font-semibold text-slate-800">{r.participantName}</p>
                                {r.attendingDevotees && (
                                  <p className="text-[10px] text-slate-400 mt-0.5">{r.attendingDevotees}</p>
                                )}
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 text-slate-600 hidden lg:table-cell">{r.gotram || "—"}</td>
                              <td className="px-3 sm:px-4 py-2.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                                  <User className="w-3 h-3" /> {r.devoteeCount}
                                </span>
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 text-slate-500 hidden lg:table-cell whitespace-nowrap">
                                {r.eventDate || "—"} {r.eventTime ? `· ${r.eventTime}` : ""}
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 font-semibold text-slate-700">
                                {r.bookingFee > 0 ? `₹${r.bookingFee.toLocaleString("en-IN")}` : "Free"}
                              </td>
                              <td className="px-3 sm:px-4 py-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  r.paymentStatus === "PAID" ? "bg-emerald-50 text-emerald-700" :
                                  r.paymentStatus === "FREE" ? "bg-sky-50 text-sky-700" :
                                  "bg-amber-50 text-amber-700"
                                }`}>{r.paymentStatus}</span>
                              </td>
                              <td className="px-3 sm:px-4 py-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  r.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700" :
                                  r.status === "CANCELLED" ? "bg-rose-50 text-rose-700" :
                                  "bg-slate-100 text-slate-600"
                                }`}>{r.status}</span>
                              </td>
                              <td className="px-3 sm:px-4 py-2.5 text-slate-400 hidden lg:table-cell whitespace-nowrap">
                                {new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
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

        {!loading && poojaSevas.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-8 text-center">
            <Flame className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">No Pooja or Seva created yet</p>
            <p className="text-xs text-slate-400 mt-1">Click "Create Pooja" to add your first pooja or seva</p>
          </div>
        )}
      </div>

      {/* Create / Edit Pooja Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{editingPoojaId ? "Edit Pooja / Seva" : "Create Pooja / Seva"}</h3>
                  <p className="text-xs text-slate-400">Fill in the details for the temple ritual</p>
                </div>
              </div>
              <button onClick={() => { setShowCreateModal(false); setEditingPoojaId(null); }} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {formError}
                </div>
              )}

              {!useMock && events.length > 0 && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Parent Event</span>
                  <select value={poojaForm.mainEventId} onChange={e => set("mainEventId", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white">
                    <option value="">Select event (optional)</option>
                    {events.map(ev => <option key={ev.id} value={String(ev.id)}>{ev.title}</option>)}
                  </select>
                </label>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Pooja / Seva Name *</span>
                  <input type="text" value={poojaForm.name} onChange={e => set("name", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    placeholder="e.g. Ganesh Abhishekam" required />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Pooja Type *</span>
                  <select value={poojaForm.type} onChange={e => set("type", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white" required>
                    <option value="">Select type</option>
                    {poojaTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
              </div>

              {/* Date section */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Date *</span>
                  <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                    <button type="button" onClick={() => set("isMultiDay", false)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!poojaForm.isMultiDay ? "bg-amber-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-700"}`}>
                      Single Day
                    </button>
                    <button type="button" onClick={() => set("isMultiDay", true)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${poojaForm.isMultiDay ? "bg-amber-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-700"}`}>
                      Multi-Day
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-slate-500">{poojaForm.isMultiDay ? "Start Date" : "Date"}</span>
                    <input type="date" value={poojaForm.date} onChange={e => set("date", e.target.value)}
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" required />
                  </label>
                  {poojaForm.isMultiDay && (
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold text-slate-500">End Date</span>
                      <input type="date" value={poojaForm.endDate} onChange={e => set("endDate", e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                        min={poojaForm.date} required={poojaForm.isMultiDay} />
                    </label>
                  )}
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-slate-500">Duration (min)</span>
                    <input type="number" value={poojaForm.duration} onChange={e => set("duration", e.target.value)}
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      placeholder="60" min="15" />
                  </label>
                </div>

                {/* Time slots */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-slate-500">Start Time(s)</span>
                    <button type="button" onClick={addTimeSlot}
                      className="text-[10px] font-bold text-amber-600 hover:underline flex items-center gap-0.5">
                      <Plus className="w-3 h-3" /> Add Slot
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {poojaForm.startTimes.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <input type="time" value={t} onChange={e => updateTimeSlot(idx, e.target.value)}
                          className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
                        {poojaForm.startTimes.length > 1 && (
                          <button type="button" onClick={() => removeTimeSlot(idx)}
                            className="p-1 text-rose-400 hover:text-rose-600"><X className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Mandap / Venue</span>
                  <input type="text" value={poojaForm.mandap} onChange={e => set("mandap", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    placeholder="Main Temple Mandap" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Pandit / Priest</span>
                  <input type="text" value={poojaForm.pandit} onChange={e => set("pandit", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    placeholder="Pandit Suresh Sharma" />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Available Slots</span>
                  <input type="number" value={poojaForm.slots} onChange={e => set("slots", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    placeholder="20" min="1" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Free?</span>
                  <div className="flex items-center gap-2 h-[38px]">
                    <input type="checkbox" checked={poojaForm.isFree} onChange={e => set("isFree", e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-300" />
                    <span className="text-sm text-slate-600">{poojaForm.isFree ? "Free seva" : "Paid"}</span>
                  </div>
                </label>
                {!poojaForm.isFree && (
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-600">Booking Fee (₹)</span>
                    <input type="number" value={poojaForm.fee} onChange={e => set("fee", e.target.value)}
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      placeholder="501" min="0" />
                  </label>
                )}
              </div>

              {/* Samagri Items */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-600">Samagri / Items Required</span>
                  <button type="button" onClick={addItem}
                    className="text-[10px] font-bold text-amber-600 hover:underline flex items-center gap-0.5">
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {poojaForm.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                      <input type="text" value={item} onChange={e => updateItem(idx, e.target.value)}
                        className="bg-transparent text-xs text-amber-800 font-semibold focus:outline-none w-24" placeholder="Item name" />
                      <button type="button" onClick={() => removeItem(idx)} className="text-amber-400 hover:text-rose-500">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">Notes</span>
                <textarea value={poojaForm.notes} onChange={e => set("notes", e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" rows={2}
                  placeholder="Special instructions or notes" />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowCreateModal(false); setEditingPoojaId(null); }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editingPoojaId ? "Update Pooja" : "Create Pooja"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
