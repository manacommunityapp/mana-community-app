import { useState, useEffect } from "react";
import {
  Music, Plus, Loader2, AlertCircle, Pencil, Trash2, Users, Clock,
  MapPin, Calendar, X, ChevronDown, ChevronUp, User, Star,
} from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { eventService, type EventResponse } from "../../../services/events/eventService";

type CulturalEvent = {
  id: number;
  name: string;
  category: string;
  perfType?: string;
  ageGroup?: string;
  date: string;
  startTime?: string;
  duration?: number;
  stage?: string;
  requirements?: string;
  hasBacktrack?: boolean;
  hasLiveMusic?: boolean;
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

const DEFAULT_CATEGORIES = ["Classical Dance", "Classical Music", "Folk Dance", "Drama/Skit", "Bhajan/Kirtan", "Instrumental", "Storytelling", "Stand-up"];
const DEFAULT_PERF_TYPES = ["Solo", "Duet", "Group", "Ensemble", "Orchestra", "Choir"];
const DEFAULT_AGE_GROUPS = ["Kids (5-10)", "Junior (11-15)", "Youth (16-25)", "Adult (26-50)", "Senior (50+)", "Open"];

const mockCulturalEvents: CulturalEvent[] = [
  { id: 1, name: "Bharatanatyam – Pushpanjali", category: "Classical Dance", perfType: "Solo", ageGroup: "Youth (16-25)", date: "2026-08-27", startTime: "10:00", duration: 15, stage: "Main Stage", requirements: "Classical music system, spotlight", hasBacktrack: true, hasLiveMusic: false },
  { id: 2, name: "Carnatic Vocal Ensemble", category: "Classical Music", perfType: "Ensemble", ageGroup: "Open", date: "2026-08-27", startTime: "11:00", duration: 30, stage: "Main Stage", requirements: "Mics x4, tanpura, tabla", hasBacktrack: false, hasLiveMusic: true },
  { id: 3, name: "Kids Fancy Dress", category: "Drama/Skit", perfType: "Group", ageGroup: "Kids (5-10)", date: "2026-08-28", startTime: "09:30", duration: 45, stage: "Side Stage", requirements: "Open floor area, props table", hasBacktrack: false, hasLiveMusic: false },
  { id: 4, name: "Bhajan Sandhya", category: "Bhajan/Kirtan", perfType: "Group", ageGroup: "Open", date: "2026-08-28", startTime: "18:00", duration: 60, stage: "Temple Mandap", requirements: "Harmonium, dholak, cymbal mics", hasBacktrack: false, hasLiveMusic: true },
  { id: 5, name: "Folk Dance – Garba Night", category: "Folk Dance", perfType: "Group", ageGroup: "Open", date: "2026-08-29", startTime: "20:00", duration: 90, stage: "Open Ground", requirements: "DJ setup, LED lights, dandiya sticks", hasBacktrack: true, hasLiveMusic: false },
];

const mockRegistrations: BookingRegistration[] = [
  { id: 20, regCode: "CULT-3001", activityId: "cultural-1", activityTitle: "Bharatanatyam – Pushpanjali", category: "Cultural", participantName: "Meenakshi Sundaram", devoteeCount: 1, eventDate: "2026-08-27", eventTime: "10:00 AM", venue: "Main Stage", bookingFee: 0, paymentStatus: "FREE", status: "CONFIRMED", createdAt: "2026-08-14T10:00:00" },
  { id: 21, regCode: "CULT-3002", activityId: "cultural-2", activityTitle: "Carnatic Vocal Ensemble", category: "Cultural", participantName: "Ramakrishnan V.", devoteeCount: 4, eventDate: "2026-08-27", eventTime: "11:00 AM", venue: "Main Stage", bookingFee: 0, paymentStatus: "FREE", status: "CONFIRMED", createdAt: "2026-08-14T12:00:00" },
  { id: 22, regCode: "CULT-3003", activityId: "cultural-3", activityTitle: "Kids Fancy Dress", category: "Cultural", participantName: "Priya Sharma (parent)", devoteeCount: 3, eventDate: "2026-08-28", eventTime: "09:30 AM", venue: "Side Stage", bookingFee: 0, paymentStatus: "FREE", status: "CONFIRMED", createdAt: "2026-08-15T09:00:00" },
  { id: 23, regCode: "CULT-3004", activityId: "cultural-4", activityTitle: "Bhajan Sandhya", category: "Cultural", participantName: "Annapurna Group", devoteeCount: 8, eventDate: "2026-08-28", eventTime: "06:00 PM", venue: "Temple Mandap", bookingFee: 0, paymentStatus: "FREE", status: "CONFIRMED", createdAt: "2026-08-16T15:00:00" },
  { id: 24, regCode: "CULT-3005", activityId: "cultural-5", activityTitle: "Folk Dance – Garba Night", category: "Cultural", participantName: "Chandrashekar M.", devoteeCount: 6, eventDate: "2026-08-29", eventTime: "08:00 PM", venue: "Open Ground", bookingFee: 0, paymentStatus: "FREE", status: "CONFIRMED", createdAt: "2026-08-17T10:00:00" },
  { id: 25, regCode: "CULT-3006", activityId: "cultural-5", activityTitle: "Folk Dance – Garba Night", category: "Cultural", participantName: "Lakshmi Family", devoteeCount: 5, eventDate: "2026-08-29", eventTime: "08:00 PM", venue: "Open Ground", bookingFee: 0, paymentStatus: "FREE", status: "CONFIRMED", createdAt: "2026-08-17T11:30:00" },
];

const emptyForm = {
  mainEventId: "",
  name: "",
  category: "",
  perfType: "Solo",
  ageGroup: "Open",
  date: "",
  startTime: "10:00",
  duration: "15",
  stage: "",
  requirements: "",
  hasBacktrack: false,
  hasLiveMusic: false,
};

export function EventsCulturalEvents() {
  const { useMock } = useEventMock();
  const [culturalEvents, setCulturalEvents] = useState<CulturalEvent[]>([]);
  const [registrations, setRegistrations] = useState<BookingRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [perfTypes, setPerfTypes] = useState<string[]>(DEFAULT_PERF_TYPES);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { eventService.getAll().then(setEvents).catch(() => {}); }, []);

  const loadData = () => {
    let localCulturals: any[] = [];
    try {
      localCulturals = JSON.parse(localStorage.getItem("mana_local_cultural_events") || "[]");
    } catch {}

    if (useMock) {
      const merged = [...localCulturals, ...mockCulturalEvents];
      const unique = merged.filter((item, index, self) => index === self.findIndex((t) => t.name === item.name));
      setCulturalEvents(unique);
      setRegistrations(mockRegistrations);
      return;
    }
    setLoading(true);
    setError("");
    Promise.all([
      eventService.getCulturalEvents(),
      eventService.getAllRegistrations(),
      eventService.getCulturalCategories().catch(() => []),
      eventService.getCulturalPerformanceTypes().catch(() => []),
    ])
      .then(([evts, regs, cats, pts]) => {
        const merged = [...localCulturals, ...(evts || [])];
        const unique = merged.filter((item, index, self) => index === self.findIndex((t) => t.name === item.name));
        setCulturalEvents(unique);
        setRegistrations((regs || []).filter((r: any) => r.category === "Cultural" || r.activityId?.startsWith("cultural-")));
        if (cats?.length > 0) setCategories(cats.map((c: any) => c.name));
        if (pts?.length > 0) setPerfTypes(pts.map((p: any) => p.name));
      })
      .catch(e => {
        if (localCulturals.length > 0) {
          setCulturalEvents(localCulturals);
        } else {
          setError(e?.message || "Failed to load cultural events");
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

  const getRegs = (ce: CulturalEvent) =>
    useMock
      ? registrations.filter(r => r.activityId === `cultural-${ce.id}`)
      : registrations.filter(r => r.activityTitle === ce.name || r.activityId === `cultural-${ce.id}` || r.activityId === String(ce.id));

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = () => { setEditingId(null); setForm({ ...emptyForm, mainEventId: events[0] ? String(events[0].id) : "" }); setFormError(""); setShowModal(true); };

  const openEdit = (ce: CulturalEvent) => {
    setEditingId(ce.id);
    setForm({
      mainEventId: "", name: ce.name, category: ce.category,
      perfType: ce.perfType || "Solo", ageGroup: ce.ageGroup || "Open",
      date: ce.date, startTime: ce.startTime || "10:00",
      duration: String(ce.duration || 15), stage: ce.stage || "",
      requirements: ce.requirements || "",
      hasBacktrack: ce.hasBacktrack ?? false, hasLiveMusic: ce.hasLiveMusic ?? false,
    });
    setFormError(""); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError("Name is required"); return; }
    if (!form.category) { setFormError("Category is required"); return; }
    if (!form.date) { setFormError("Date is required"); return; }

    const payload = {
      mainEventId: form.mainEventId || undefined,
      name: form.name, category: form.category, perfType: form.perfType || undefined,
      ageGroup: form.ageGroup || undefined, date: form.date,
      startTime: form.startTime || undefined,
      duration: form.duration ? Number(form.duration) : undefined,
      stage: form.stage || undefined, requirements: form.requirements || undefined,
      hasBacktrack: form.hasBacktrack, hasLiveMusic: form.hasLiveMusic,
    };

    setSaving(true); setFormError("");
    try {
      if (editingId) {
        if (useMock) { setCulturalEvents(prev => prev.map(c => c.id === editingId ? { ...c, ...payload, duration: payload.duration } as CulturalEvent : c)); }
        else { const resp = await eventService.updateCulturalEvent(editingId, payload); setCulturalEvents(prev => prev.map(c => c.id === editingId ? resp : c)); }
      } else {
        if (useMock) { setCulturalEvents(prev => [{ id: Date.now(), ...payload, duration: payload.duration } as CulturalEvent, ...prev]); }
        else { const resp = await eventService.createCulturalEvent(payload); setCulturalEvents(prev => [resp, ...prev]); }
      }
      setShowModal(false); setEditingId(null); setForm(emptyForm);
    } catch (err: any) { setFormError(err?.response?.data?.message || err?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (ce: CulturalEvent) => {
    if (!confirm(`Delete "${ce.name}"?`)) return;
    if (useMock) { setCulturalEvents(prev => prev.filter(x => x.id !== ce.id)); return; }
    try { await eventService.deleteCulturalEvent(ce.id); setCulturalEvents(prev => prev.filter(x => x.id !== ce.id)); }
    catch (err: any) { setError(err?.message || "Failed to delete"); }
  };

  const totalPerformers = registrations.reduce((a, r) => a + (r.devoteeCount || 1), 0);

  const categoryColor = (cat: string) => {
    switch (cat) {
      case "Classical Dance": return "bg-purple-50 text-purple-700";
      case "Classical Music": return "bg-blue-50 text-blue-700";
      case "Folk Dance": return "bg-rose-50 text-rose-700";
      case "Drama/Skit": return "bg-amber-50 text-amber-700";
      case "Bhajan/Kirtan": return "bg-emerald-50 text-emerald-700";
      case "Instrumental": return "bg-sky-50 text-sky-700";
      default: return "bg-violet-50 text-violet-700";
    }
  };

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Music className="w-5 h-5 text-violet-500" /> Cultural Events Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage performances, registrations, and stage requirements</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-violet-500 text-white hover:bg-violet-600 transition-all shadow-sm">
          <Plus className="w-3.5 h-3.5" /> Create Cultural Event
        </button>
      </div>

      {error && <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700"><AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}</div>}
      {loading && <div className="flex items-center justify-center py-8 text-slate-400"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading cultural events...</div>}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: "Total Events", value: culturalEvents.length, color: "#8b5cf6" },
          { label: "Registrations", value: registrations.length, color: "#6366f1" },
          { label: "Total Performers", value: totalPerformers, color: "#10b981" },
          { label: "Live Music", value: culturalEvents.filter(c => c.hasLiveMusic).length, color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-2.5 sm:p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center">
            <p className="text-lg sm:text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 sm:mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Cultural Event List */}
      <div className="space-y-3">
        {culturalEvents.map(ce => {
          const regs = getRegs(ce);
          const isExpanded = expandedId === ce.id;
          const headcount = regs.reduce((a, r) => a + (r.devoteeCount || 1), 0);
          return (
            <div key={ce.id} className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Music className="w-5 h-5 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-bold text-slate-800 text-sm sm:text-base">{ce.name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${categoryColor(ce.category)}`}>{ce.category}</span>
                          {ce.perfType && <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">{ce.perfType}</span>}
                          {ce.ageGroup && <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700">{ce.ageGroup}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(ce)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(ce)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {ce.date}</span>
                      {ce.startTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ce.startTime}{ce.duration ? ` (${ce.duration}m)` : ""}</span>}
                      {ce.stage && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ce.stage}</span>}
                    </div>

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {ce.hasLiveMusic && <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">🎵 Live Music</span>}
                      {ce.hasBacktrack && <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">🔊 Backtrack</span>}
                      {ce.requirements && <span className="text-[10px] text-slate-400">Needs: {ce.requirements}</span>}
                    </div>
                  </div>
                </div>

                <button onClick={() => setExpandedId(isExpanded ? null : ce.id)}
                  className="mt-3 flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors w-full justify-center py-1.5 rounded-lg hover:bg-indigo-50">
                  <Users className="w-3.5 h-3.5" />
                  {regs.length} Registration{regs.length !== 1 ? "s" : ""} ({headcount} performer{headcount !== 1 ? "s" : ""})
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
                            {["Reg Code", "Performer / Group", "Participants", "Date / Time", "Status", "Registered At"].map(h => (
                              <th key={h} className={`px-3 sm:px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap ${["Date / Time", "Registered At"].includes(h) ? "hidden lg:table-cell" : ""}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {regs.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-3 sm:px-4 py-2.5 font-mono text-xs text-indigo-600 font-semibold">{r.regCode}</td>
                              <td className="px-3 sm:px-4 py-2.5 font-semibold text-slate-800">{r.participantName}</td>
                              <td className="px-3 sm:px-4 py-2.5"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[10px] font-bold"><User className="w-3 h-3" /> {r.devoteeCount}</span></td>
                              <td className="px-3 sm:px-4 py-2.5 text-slate-500 hidden lg:table-cell whitespace-nowrap">{r.eventDate || "—"} {r.eventTime ? `· ${r.eventTime}` : ""}</td>
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

        {!loading && culturalEvents.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-8 text-center">
            <Music className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">No cultural events created yet</p>
            <p className="text-xs text-slate-400 mt-1">Click "Create Cultural Event" to add a performance or program</p>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center"><Music className="w-5 h-5 text-violet-500" /></div>
                <div>
                  <h3 className="font-bold text-slate-800">{editingId ? "Edit Cultural Event" : "Create Cultural Event"}</h3>
                  <p className="text-xs text-slate-400">Set up performance details and requirements</p>
                </div>
              </div>
              <button onClick={() => { setShowModal(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formError && <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700"><AlertCircle className="w-4 h-4 flex-shrink-0" /> {formError}</div>}

              {!useMock && events.length > 0 && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Parent Event</span>
                  <select value={form.mainEventId} onChange={e => set("mainEventId", e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white">
                    <option value="">Select event (optional)</option>
                    {events.map(ev => <option key={ev.id} value={String(ev.id)}>{ev.title}</option>)}
                  </select>
                </label>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Event Name *</span>
                  <input type="text" value={form.name} onChange={e => set("name", e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="e.g. Bharatanatyam Recital" required />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Category *</span>
                  <select value={form.category} onChange={e => set("category", e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white" required>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Performance Type</span>
                  <select value={form.perfType} onChange={e => set("perfType", e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white">
                    {perfTypes.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Age Group</span>
                  <select value={form.ageGroup} onChange={e => set("ageGroup", e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white">
                    {DEFAULT_AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Stage / Venue</span>
                  <input type="text" value={form.stage} onChange={e => set("stage", e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="Main Stage" />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Date *</span>
                  <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" required />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Start Time</span>
                  <input type="time" value={form.startTime} onChange={e => set("startTime", e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Duration (min)</span>
                  <input type="number" value={form.duration} onChange={e => set("duration", e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" min="5" />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">Requirements / Equipment</span>
                <textarea value={form.requirements} onChange={e => set("requirements", e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" rows={2} placeholder="e.g. Mics x4, spotlight, tanpura" />
              </label>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.hasBacktrack} onChange={e => set("hasBacktrack", e.target.checked)} className="rounded border-slate-300 text-violet-600 focus:ring-violet-300" />
                  <span className="text-sm text-slate-600">Uses Backtrack</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.hasLiveMusic} onChange={e => set("hasLiveMusic", e.target.checked)} className="rounded border-slate-300 text-violet-600 focus:ring-violet-300" />
                  <span className="text-sm text-slate-600">Live Music</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl text-sm font-semibold bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 transition-colors flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editingId ? "Update Event" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
