import { useState, useEffect } from "react";
import {
  Music, Plus, Loader2, AlertCircle, Pencil, Trash2, Users, Clock,
  MapPin, Calendar, X, ChevronDown, ChevronUp, User, CheckCircle2,
  UserCheck, Download, QrCode, ArrowUpDown,
} from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { eventService, type EventResponse } from "../../../services/events/eventService";
import { TimePicker } from "../ui/time-picker";
import { formatIndianTime, formatIndianDate, formatIndianDateTime } from "../../../utils/indianDateTimeUtils";

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
  needsRegistration?: boolean;
  capacity?: number;
  sortOrder?: number;
  regDeadline?: string;
};

type CulturalRegistration = {
  id: number;
  regCode: string;
  culturalEventId: number;
  mainEventId?: number;
  userId?: number;
  participantName: string;
  gotram?: string;
  devoteeCount: number;
  status: string;
  checkedIn?: boolean;
  checkedInAt?: string;
  qrCodeUrl?: string;
  createdAt: string;
};

const DEFAULT_CATEGORIES = ["Classical Dance", "Classical Music", "Folk Dance", "Drama/Skit", "Bhajan/Kirtan", "Instrumental", "Storytelling", "Stand-up"];
const DEFAULT_PERF_TYPES = ["Solo", "Duet", "Group", "Ensemble", "Orchestra", "Choir"];
const DEFAULT_AGE_GROUPS = ["Kids (5-10)", "Junior (11-15)", "Youth (16-25)", "Adult (26-50)", "Senior (50+)", "Open"];

const today = new Date().toISOString().slice(0, 10);
const in2days = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

const mockCulturalEvents: CulturalEvent[] = [
  { id: 1, name: "Bharatanatyam – Pushpanjali", category: "Classical Dance", perfType: "Solo", ageGroup: "Youth (16-25)", date: "2026-08-27", startTime: "10:00", duration: 15, stage: "Main Stage", requirements: "Classical music system, spotlight", hasBacktrack: true, hasLiveMusic: false, needsRegistration: true, capacity: 20, sortOrder: 1, regDeadline: in2days },
  { id: 2, name: "Carnatic Vocal Ensemble", category: "Classical Music", perfType: "Ensemble", ageGroup: "Open", date: "2026-08-27", startTime: "11:00", duration: 30, stage: "Main Stage", requirements: "Mics x4, tanpura, tabla", hasBacktrack: false, hasLiveMusic: true, needsRegistration: true, capacity: 10, sortOrder: 2 },
  { id: 3, name: "Kids Fancy Dress", category: "Drama/Skit", perfType: "Group", ageGroup: "Kids (5-10)", date: "2026-08-28", startTime: "09:30", duration: 45, stage: "Side Stage", requirements: "Open floor area, props table", hasBacktrack: false, hasLiveMusic: false, needsRegistration: true, capacity: 30, sortOrder: 3 },
  { id: 4, name: "Bhajan Sandhya", category: "Bhajan/Kirtan", perfType: "Group", ageGroup: "Open", date: "2026-08-28", startTime: "18:00", duration: 60, stage: "Temple Mandap", requirements: "Harmonium, dholak, cymbal mics", hasBacktrack: false, hasLiveMusic: true, needsRegistration: false, sortOrder: 4 },
  { id: 5, name: "Folk Dance – Garba Night", category: "Folk Dance", perfType: "Group", ageGroup: "Open", date: "2026-08-29", startTime: "20:00", duration: 90, stage: "Open Ground", requirements: "DJ setup, LED lights, dandiya sticks", hasBacktrack: true, hasLiveMusic: false, needsRegistration: true, capacity: 50, sortOrder: 5 },
];

const mockRegistrations: CulturalRegistration[] = [
  { id: 20, regCode: "MNA-2026-CULT-100001", culturalEventId: 1, participantName: "Meenakshi Sundaram", devoteeCount: 1, status: "CONFIRMED", checkedIn: true, checkedInAt: "2026-08-27T10:05:00", createdAt: "2026-08-14T10:00:00" },
  { id: 21, regCode: "MNA-2026-CULT-100002", culturalEventId: 2, participantName: "Ramakrishnan V.", devoteeCount: 4, status: "CONFIRMED", checkedIn: false, createdAt: "2026-08-14T12:00:00" },
  { id: 22, regCode: "MNA-2026-CULT-100003", culturalEventId: 3, participantName: "Priya Sharma (parent)", devoteeCount: 3, status: "CONFIRMED", checkedIn: false, createdAt: "2026-08-15T09:00:00" },
  { id: 23, regCode: "MNA-2026-CULT-100004", culturalEventId: 4, participantName: "Annapurna Group", devoteeCount: 8, status: "CONFIRMED", checkedIn: false, createdAt: "2026-08-16T15:00:00" },
  { id: 24, regCode: "MNA-2026-CULT-100005", culturalEventId: 5, participantName: "Chandrashekar M.", devoteeCount: 6, status: "CONFIRMED", checkedIn: false, createdAt: "2026-08-17T10:00:00" },
  { id: 25, regCode: "MNA-2026-CULT-100006", culturalEventId: 5, participantName: "Lakshmi Family", devoteeCount: 5, status: "CONFIRMED", checkedIn: false, createdAt: "2026-08-17T11:30:00" },
];

const emptyForm = {
  mainEventId: "", name: "", category: "", perfType: "Solo", ageGroup: "Open",
  date: "", startTime: "10:00", duration: "15", stage: "", requirements: "",
  hasBacktrack: false, hasLiveMusic: false, needsRegistration: true,
  capacity: "", regDeadline: "", sortOrder: "",
};
const emptyRegForm = { participantName: "", gotram: "", devoteeCount: "1" };

// ── helpers ────────────────────────────────────────────────────────────────
const deadlineSoon = (ce: CulturalEvent) => {
  if (!ce.regDeadline) return false;
  return ce.regDeadline >= today && ce.regDeadline <= in2days;
};

const exportCsv = (regs: CulturalRegistration[], eventName: string) => {
  const header = ["Reg Code", "Participant / Group", "Gotram", "Performers", "Status", "Checked In", "Registered At"];
  const rows = regs.map(r => [
    r.regCode,
    r.participantName,
    r.gotram || "",
    String(r.devoteeCount),
    r.status,
    r.checkedIn ? "Yes" : "No",
    new Date(r.createdAt).toLocaleString("en-IN"),
  ]);
  const csv = [header, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${eventName.replace(/[^a-z0-9]/gi, "_")}_registrations.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

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

export function EventsCulturalEvents() {
  const { useMock } = useEventMock();
  const [culturalEvents, setCulturalEvents] = useState<CulturalEvent[]>([]);
  const [registrations, setRegistrations] = useState<CulturalRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [perfTypes, setPerfTypes] = useState<string[]>(DEFAULT_PERF_TYPES);

  // Create/edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Inline category creator
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addCategoryError, setAddCategoryError] = useState("");
  const [addCategorySaving, setAddCategorySaving] = useState(false);

  // Registration modal
  const [showRegModal, setShowRegModal] = useState(false);
  const [regTarget, setRegTarget] = useState<CulturalEvent | null>(null);
  const [regForm, setRegForm] = useState(emptyRegForm);
  const [regError, setRegError] = useState("");
  const [regSaving, setRegSaving] = useState(false);

  // Confirmation after successful registration
  const [regConfirmation, setRegConfirmation] = useState<CulturalRegistration | null>(null);

  useEffect(() => { eventService.getAll().then(setEvents).catch(() => {}); }, []);

  const loadData = () => {
    if (useMock) { setCulturalEvents(mockCulturalEvents); setRegistrations(mockRegistrations); return; }
    setLoading(true); setError("");
    Promise.all([
      eventService.getCulturalEvents(),
      eventService.getCulturalRegistrations(),
      eventService.getCulturalCategories().catch(() => []),
      eventService.getCulturalPerformanceTypes().catch(() => []),
    ])
      .then(([evts, regs, cats, pts]) => {
        setCulturalEvents(evts || []);
        setRegistrations((regs || []).map((r: any) => ({ ...r, devoteeCount: Number(r.devoteeCount ?? 1) || 1 })));
        if (cats?.length > 0) setCategories(cats.map((c: any) => c.name));
        if (pts?.length > 0) setPerfTypes(pts.map((p: any) => p.name));
      })
      .catch(e => setError(e?.message || "Failed to load cultural events"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    const evs = ["mana_activities_updated", "mana_schedule_updated", "mana_event_created", "mana_event_updated"];
    evs.forEach(e => window.addEventListener(e, loadData));
    return () => evs.forEach(e => window.removeEventListener(e, loadData));
  }, [useMock]);

  const activeParentEvents = events.filter(ev => {
    const s = String(ev.status || "").toUpperCase();
    return s !== "CANCELLED" && s !== "CLOSED" && s !== "ARCHIVED";
  });

  const getRegs = (ce: CulturalEvent) => registrations.filter(r => r.culturalEventId === ce.id);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const setReg = (k: string, v: any) => setRegForm(f => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, mainEventId: activeParentEvents[0] ? String(activeParentEvents[0].id) : "" });
    setFormError(""); setShowModal(true);
  };

  const openEdit = (ce: CulturalEvent) => {
    setEditingId(ce.id);
    setForm({
      mainEventId: "", name: ce.name, category: ce.category,
      perfType: ce.perfType || "Solo", ageGroup: ce.ageGroup || "Open",
      date: ce.date, startTime: ce.startTime || "10:00",
      duration: String(ce.duration || 15), stage: ce.stage || "",
      requirements: ce.requirements || "",
      hasBacktrack: ce.hasBacktrack ?? false, hasLiveMusic: ce.hasLiveMusic ?? false,
      needsRegistration: ce.needsRegistration ?? true,
      capacity: ce.capacity ? String(ce.capacity) : "",
      regDeadline: ce.regDeadline || "",
      sortOrder: ce.sortOrder ? String(ce.sortOrder) : "",
    });
    setFormError(""); setShowModal(true);
  };

  const openRegister = (ce: CulturalEvent) => {
    setRegTarget(ce); setRegForm(emptyRegForm); setRegError(""); setShowRegModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError("Name is required"); return; }
    if (!form.category) { setFormError("Category is required"); return; }
    if (!form.date) { setFormError("Date is required"); return; }

    if (form.mainEventId) {
      const selEv = activeParentEvents.find(x => String(x.id) === String(form.mainEventId));
      if (selEv?.startDate) {
        const minD = selEv.startDate; const maxD = selEv.endDate || selEv.startDate;
        if (form.date < minD || form.date > maxD) {
          setFormError(`Date (${form.date}) must be within event period (${minD} – ${maxD}).`); return;
        }
      }
    }

    const payload = {
      mainEventId: form.mainEventId || undefined, name: form.name, category: form.category,
      perfType: form.perfType || undefined, ageGroup: form.ageGroup || undefined,
      date: form.date, startTime: form.startTime || undefined,
      duration: form.duration ? Number(form.duration) : undefined,
      stage: form.stage || undefined, requirements: form.requirements || undefined,
      hasBacktrack: form.hasBacktrack, hasLiveMusic: form.hasLiveMusic,
      needsRegistration: form.needsRegistration,
      capacity: form.capacity ? Number(form.capacity) : undefined,
      regDeadline: form.regDeadline || undefined,
      sortOrder: form.sortOrder ? Number(form.sortOrder) : undefined,
    };

    setSaving(true); setFormError("");
    try {
      if (editingId) {
        const resp = useMock
          ? { id: editingId, ...payload } as CulturalEvent
          : await eventService.updateCulturalEvent(editingId, payload);
        setCulturalEvents(prev => prev.map(c => c.id === editingId ? { ...c, ...resp } : c));
      } else {
        const resp = useMock
          ? { id: Date.now(), ...payload } as CulturalEvent
          : await eventService.createCulturalEvent(payload);
        setCulturalEvents(prev => [resp, ...prev]);
      }
      setShowModal(false); setEditingId(null); setForm(emptyForm);
    } catch (err: any) { setFormError(err?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regTarget) return;
    if (!regForm.participantName.trim()) { setRegError("Participant name is required"); return; }
    setRegSaving(true); setRegError("");
    try {
      const count = Number(regForm.devoteeCount) || 1;
      let created: CulturalRegistration;
      if (useMock) {
        created = {
          id: Date.now(),
          regCode: `MNA-${new Date().getFullYear()}-CULT-${Math.floor(100000 + Math.random() * 900000)}`,
          culturalEventId: regTarget.id, participantName: regForm.participantName.trim(),
          gotram: regForm.gotram.trim() || undefined, devoteeCount: count,
          status: "CONFIRMED", checkedIn: false,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=MOCK`,
          createdAt: new Date().toISOString(),
        };
      } else {
        const raw = await eventService.createCulturalRegistration({
          culturalEventId: regTarget.id,
          participantName: regForm.participantName.trim(),
          gotram: regForm.gotram.trim() || undefined,
          devoteeCount: count,
        });
        created = { ...raw, devoteeCount: Number(raw.devoteeCount ?? count) };
      }
      setRegistrations(prev => [...prev, created]);
      setShowRegModal(false);
      setRegConfirmation(created);   // ← show confirmation card
      setExpandedId(regTarget.id);
    } catch (err: any) { setRegError(err?.message || "Registration failed. Please try again."); }
    finally { setRegSaving(false); }
  };

  const handleCheckIn = async (reg: CulturalRegistration) => {
    if (useMock) {
      setRegistrations(prev => prev.map(r => r.id === reg.id
        ? { ...r, checkedIn: true, checkedInAt: new Date().toISOString() } : r));
      return;
    }
    try {
      const updated = await fetch(`/api/events/cultural/registrations/${reg.id}/checkin`, { method: "PATCH" })
        .then(r => r.json());
      setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, ...updated } : r));
    } catch (err: any) { setError(err?.message || "Check-in failed"); }
  };

  const handleCancelReg = async (reg: CulturalRegistration) => {
    if (!confirm(`Cancel registration for "${reg.participantName}"?`)) return;
    if (useMock) {
      setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, status: "CANCELLED" } : r)); return;
    }
    try {
      await fetch(`/api/events/cultural/registrations/${reg.id}/cancel`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by admin" }),
      });
      setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, status: "CANCELLED" } : r));
    } catch (err: any) { setError(err?.message || "Failed to cancel"); }
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) { setAddCategoryError("Category name is required"); return; }
    setAddCategorySaving(true); setAddCategoryError("");
    try {
      const createdName = useMock ? name : (await eventService.createCulturalCategory(name))?.name || name;
      setCategories(prev => prev.includes(createdName) ? prev : [...prev, createdName].sort());
      set("category", createdName); setShowAddCategory(false); setNewCategoryName("");
    } catch (err: any) { setAddCategoryError(err?.message || "Failed to create category"); }
    finally { setAddCategorySaving(false); }
  };

  const handleDelete = async (ce: CulturalEvent) => {
    if (!confirm(`Delete "${ce.name}"?`)) return;
    if (useMock) { setCulturalEvents(prev => prev.filter(x => x.id !== ce.id)); return; }
    try { await eventService.deleteCulturalEvent(ce.id); setCulturalEvents(prev => prev.filter(x => x.id !== ce.id)); }
    catch (err: any) { setError(err?.message || "Failed to delete"); }
  };

  // ── KPI totals ──────────────────────────────────────────────────────────
  const activeRegsAll = registrations.filter(r => r.status !== "CANCELLED");
  const totalPerformers = activeRegsAll.reduce((a, r) => a + (r.devoteeCount || 1), 0);
  const totalCheckedIn = activeRegsAll.filter(r => r.checkedIn).length;

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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        {[
          { label: "Total Events", value: culturalEvents.length, color: "#8b5cf6" },
          { label: "Registrations", value: activeRegsAll.length, color: "#6366f1" },
          { label: "Performers", value: totalPerformers, color: "#10b981" },
          { label: "Checked In", value: `${totalCheckedIn} / ${activeRegsAll.length}`, color: "#0ea5e9" },
          { label: "Live Music", value: culturalEvents.filter(c => c.hasLiveMusic).length, color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-2.5 sm:p-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center">
            <p className="text-lg sm:text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Cultural Event Cards */}
      <div className="space-y-3">
        {culturalEvents.map(ce => {
          const regs = getRegs(ce);
          const activeRegs = regs.filter(r => r.status !== "CANCELLED");
          const isExpanded = expandedId === ce.id;
          const headcount = activeRegs.reduce((a, r) => a + (r.devoteeCount || 1), 0);
          const checkedInCount = activeRegs.filter(r => r.checkedIn).length;
          const capacityPct = ce.capacity ? Math.min(100, (headcount / ce.capacity) * 100) : null;
          const isFull = ce.capacity ? headcount >= ce.capacity : false;
          const deadlineSoonFlag = deadlineSoon(ce);

          return (
            <div key={ce.id} className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Music className="w-5 h-5 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-800 text-sm sm:text-base">{ce.name}</p>
                          {ce.sortOrder != null && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-400">
                              <ArrowUpDown className="w-2.5 h-2.5" /> #{ce.sortOrder}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${categoryColor(ce.category)}`}>{ce.category}</span>
                          {ce.perfType && <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">{ce.perfType}</span>}
                          {ce.ageGroup && <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700">{ce.ageGroup}</span>}
                          {ce.needsRegistration === false && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">No Registration</span>
                          )}
                          {deadlineSoonFlag && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 animate-pulse">
                              ⏰ Closing {ce.regDeadline === today ? "today" : ce.regDeadline === in2days ? "in 2 days" : "soon"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {ce.needsRegistration !== false && !isFull && (
                          <button onClick={() => openRegister(ce)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-violet-500 text-white hover:bg-violet-600 transition-colors shadow-sm">
                            <Plus className="w-3 h-3" /> Register
                          </button>
                        )}
                        {isFull && <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-600">Full</span>}
                        <button onClick={() => openEdit(ce)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(ce)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatIndianDate(ce.date, "short")}</span>
                      {ce.startTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatIndianTime(ce.startTime)}{ce.duration ? ` (${ce.duration}m)` : ""}</span>}
                      {ce.stage && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ce.stage}</span>}
                      {ce.regDeadline && <span className="flex items-center gap-1 text-amber-600"><Calendar className="w-3 h-3" /> Reg by {formatIndianDate(ce.regDeadline, "short")}</span>}
                    </div>

                    {/* Capacity + check-in bar */}
                    {ce.capacity != null && capacityPct !== null && (
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                          <span className="text-slate-400">Capacity</span>
                          <div className="flex items-center gap-3">
                            <span className={isFull ? "text-rose-500" : capacityPct > 75 ? "text-amber-600" : "text-emerald-600"}>
                              {headcount} / {ce.capacity} enrolled
                            </span>
                            {checkedInCount > 0 && (
                              <span className="flex items-center gap-0.5 text-sky-600">
                                <CheckCircle2 className="w-3 h-3" /> {checkedInCount} checked in
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div style={{ width: `${capacityPct}%` }}
                            className={`h-full rounded-full transition-all ${isFull ? "bg-rose-500" : capacityPct > 75 ? "bg-amber-400" : "bg-violet-400"}`} />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {ce.hasLiveMusic && <span className="text-[10px] font-bold text-amber-600">🎵 Live Music</span>}
                      {ce.hasBacktrack && <span className="text-[10px] font-bold text-indigo-600">🔊 Backtrack</span>}
                      {ce.requirements && <span className="text-[10px] text-slate-400">Needs: {ce.requirements}</span>}
                    </div>
                  </div>
                </div>

                <button onClick={() => setExpandedId(isExpanded ? null : ce.id)}
                  className="mt-3 flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors w-full justify-center py-1.5 rounded-lg hover:bg-indigo-50">
                  <Users className="w-3.5 h-3.5" />
                  {activeRegs.length} Registration{activeRegs.length !== 1 ? "s" : ""} ({headcount} performer{headcount !== 1 ? "s" : ""})
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Expanded registrations table */}
              {isExpanded && (
                <div className="border-t border-slate-100">
                  {activeRegs.length === 0 ? (
                    <p className="px-6 py-6 text-center text-sm text-slate-400">No registrations yet</p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between px-4 sm:px-6 py-2 bg-slate-50/60 border-b border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeRegs.length} Registrations</span>
                        <button
                          onClick={() => exportCsv(activeRegs, ce.name)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-white hover:text-violet-600 border border-transparent hover:border-slate-200 transition-all"
                        >
                          <Download className="w-3 h-3" /> Export CSV
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm">
                          <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100">
                              {["Reg Code", "Participant / Group", "Performers", "Status", "Check-in", "Reg'd At", ""].map(h => (
                                <th key={h} className={`px-3 sm:px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap ${h === "Reg'd At" ? "hidden lg:table-cell" : ""}`}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {activeRegs.map(r => (
                              <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-3 sm:px-4 py-2.5 font-mono text-xs text-indigo-600 font-semibold">{r.regCode}</td>
                                <td className="px-3 sm:px-4 py-2.5 font-semibold text-slate-800">
                                  {r.participantName}
                                  {r.gotram && <span className="block text-[10px] text-slate-400 font-normal">{r.gotram}</span>}
                                </td>
                                <td className="px-3 sm:px-4 py-2.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[10px] font-bold">
                                    <User className="w-3 h-3" /> {r.devoteeCount}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-4 py-2.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700" : r.status === "CANCELLED" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
                                    {r.status}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-4 py-2.5">
                                  {r.checkedIn ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-600 text-[10px] font-bold">
                                      <CheckCircle2 className="w-3 h-3" /> In
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleCheckIn(r)}
                                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold text-sky-600 hover:bg-sky-50 transition-colors border border-sky-200"
                                      title="Mark checked in"
                                    >
                                      <UserCheck className="w-3 h-3" /> Check In
                                    </button>
                                  )}
                                </td>
                                <td className="px-3 sm:px-4 py-2.5 text-slate-400 hidden lg:table-cell whitespace-nowrap">
                                  {new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </td>
                                <td className="px-3 sm:px-4 py-2.5">
                                  <button onClick={() => handleCancelReg(r)}
                                    className="px-2 py-1 rounded-lg text-[10px] font-bold text-rose-500 hover:bg-rose-50 transition-colors">
                                    Cancel
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
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

      {/* ── Registration Confirmation Modal ── */}
      {regConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center overflow-hidden">
            <div className="bg-gradient-to-br from-violet-500 to-indigo-600 px-6 pt-8 pb-6">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-black text-white">Registration Confirmed!</h3>
              <p className="text-violet-200 text-sm mt-1">{regConfirmation.participantName}</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Your Reg Code</p>
                <p className="font-mono text-lg font-black text-indigo-600 tracking-widest">{regConfirmation.regCode}</p>
              </div>
              {regConfirmation.qrCodeUrl && (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={regConfirmation.qrCodeUrl}
                    alt="QR Code"
                    className="w-36 h-36 rounded-xl border border-slate-200"
                  />
                  <p className="text-[10px] text-slate-400 flex items-center gap-1"><QrCode className="w-3 h-3" /> Screenshot this for event day</p>
                </div>
              )}
              <button
                onClick={() => setRegConfirmation(null)}
                className="w-full py-2.5 rounded-xl text-sm font-bold bg-violet-500 text-white hover:bg-violet-600 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Register Modal ── */}
      {showRegModal && regTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Register for Performance</h3>
                  <p className="text-xs text-slate-400 truncate max-w-[220px]">{regTarget.name}</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowRegModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mx-6 mt-4 p-3 rounded-xl bg-violet-50/70 border border-violet-100 text-xs flex flex-wrap gap-x-4 gap-y-1 text-violet-900">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatIndianDate(regTarget.date, "short")}</span>
              {regTarget.startTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatIndianTime(regTarget.startTime)}</span>}
              {regTarget.stage && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {regTarget.stage}</span>}
              {regTarget.capacity != null && (
                <span className="flex items-center gap-1 font-semibold">
                  <Users className="w-3 h-3" />
                  {getRegs(regTarget).filter(r => r.status !== "CANCELLED").reduce((a, r) => a + r.devoteeCount, 0)} / {regTarget.capacity} enrolled
                </span>
              )}
              {regTarget.regDeadline && <span className="flex items-center gap-1 font-semibold text-amber-700">⏰ Reg by {formatIndianDate(regTarget.regDeadline, "short")}</span>}
            </div>

            <form onSubmit={handleRegister} className="px-6 py-5 space-y-4">
              {regError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {regError}
                </div>
              )}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">Participant / Group Name *</span>
                <input type="text" value={regForm.participantName} onChange={e => setReg("participantName", e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                  placeholder="e.g. Meenakshi Sundaram or Annapurna Group" required />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">Gotram <span className="text-slate-400 font-normal">(optional)</span></span>
                <input type="text" value={regForm.gotram} onChange={e => setReg("gotram", e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                  placeholder="e.g. Bharadwaja" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">Number of Performers</span>
                <input type="number" min="1" max="100" value={regForm.devoteeCount} onChange={e => setReg("devoteeCount", e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowRegModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" disabled={regSaving} className="px-4 py-2 rounded-xl text-sm font-semibold bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 transition-colors flex items-center gap-2">
                  {regSaving && <Loader2 className="w-4 h-4 animate-spin" />} Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
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
              <button type="button" onClick={() => { setShowModal(false); setEditingId(null); setShowAddCategory(false); setNewCategoryName(""); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formError && <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700"><AlertCircle className="w-4 h-4 flex-shrink-0" /> {formError}</div>}

              {/* Parent event selector */}
              {!useMock && activeParentEvents.length > 0 && (
                <div className="space-y-1.5">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-600">Parent Event</span>
                    <select value={form.mainEventId} onChange={e => {
                      const val = e.target.value; set("mainEventId", val);
                      const selEv = activeParentEvents.find(x => String(x.id) === val);
                      if (selEv?.startDate && !form.date) set("date", selEv.startDate);
                    }} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white">
                      <option value="">Select active event (optional)</option>
                      {activeParentEvents.map(ev => (
                        <option key={ev.id} value={String(ev.id)}>
                          {ev.title} {ev.startDate ? `(${ev.startDate}${ev.endDate && ev.endDate !== ev.startDate ? ` → ${ev.endDate}` : ""})` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  {(() => {
                    const selEv = activeParentEvents.find(x => String(x.id) === String(form.mainEventId));
                    if (!selEv) return null;
                    return (
                      <div className="p-2.5 rounded-xl bg-violet-50/80 border border-violet-200/70 text-xs text-violet-950 flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-violet-600">📅 {selEv.startDate || "N/A"}{selEv.endDate && selEv.endDate !== selEv.startDate ? ` → ${selEv.endDate}` : ""}</span>
                        {selEv.location && <span className="text-violet-800">📍 {selEv.location}</span>}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Name + Category */}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Event Name *</span>
                  <input type="text" value={form.name} onChange={e => set("name", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                    placeholder="e.g. Bharatanatyam Recital" required />
                </label>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Category *</span>
                    <button type="button" onClick={() => { setShowAddCategory(v => !v); setNewCategoryName(""); setAddCategoryError(""); }}
                      className="flex items-center gap-0.5 text-[10px] font-bold text-violet-600 hover:text-violet-800">
                      <Plus className="w-3 h-3" /> New
                    </button>
                  </div>
                  <select value={form.category} onChange={e => set("category", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white" required>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {showAddCategory && (
                    <div className="mt-1 p-3 bg-violet-50 border border-violet-200 rounded-xl space-y-2">
                      <input type="text" value={newCategoryName} onChange={e => { setNewCategoryName(e.target.value); setAddCategoryError(""); }}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } if (e.key === "Escape") { setShowAddCategory(false); } }}
                        placeholder="e.g. Fusion Dance"
                        className="w-full border border-violet-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white" autoFocus />
                      {addCategoryError && <p className="text-[10px] text-rose-600">{addCategoryError}</p>}
                      <div className="flex gap-2">
                        <button type="button" onClick={handleAddCategory} disabled={addCategorySaving}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50">
                          {addCategorySaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Save
                        </button>
                        <button type="button" onClick={() => { setShowAddCategory(false); setNewCategoryName(""); }}
                          className="px-3 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:bg-white">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Perf type + Age group + Stage */}
              <div className="grid grid-cols-3 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Performance Type</span>
                  <select value={form.perfType} onChange={e => set("perfType", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white">
                    {DEFAULT_PERF_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Age Group</span>
                  <select value={form.ageGroup} onChange={e => set("ageGroup", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white">
                    {DEFAULT_AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Stage / Venue</span>
                  <input type="text" value={form.stage} onChange={e => set("stage", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                    placeholder="Main Stage" />
                </label>
              </div>

              {/* Date + Time + Duration */}
              <div className="grid grid-cols-3 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Date *</span>
                  <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" required />
                </label>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Start Time</span>
                  <TimePicker value={form.startTime} onChange={v => set("startTime", v)} />
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Duration (min)</span>
                  <input type="number" value={form.duration} onChange={e => set("duration", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" min="5" />
                </label>
              </div>

              {/* Capacity + Reg deadline + Sort order */}
              <div className="grid grid-cols-3 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Capacity <span className="text-slate-400 font-normal">(max performers)</span></span>
                  <input type="number" value={form.capacity} onChange={e => set("capacity", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                    placeholder="Unlimited" min="1" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Reg Deadline</span>
                  <input type="date" value={form.regDeadline} onChange={e => set("regDeadline", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Stage Order <span className="text-slate-400 font-normal">(run order)</span></span>
                  <input type="number" value={form.sortOrder} onChange={e => set("sortOrder", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                    placeholder="1, 2, 3…" min="1" />
                </label>
              </div>

              {/* Registration Required toggle */}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="needsReg" checked={form.needsRegistration} onChange={e => set("needsRegistration", e.target.checked)}
                  className="rounded border-slate-300 text-violet-600 focus:ring-violet-300" />
                <label htmlFor="needsReg" className="text-sm text-slate-600 cursor-pointer">Require performer sign-up</label>
              </div>

              {/* Requirements */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">Requirements / Equipment</span>
                <textarea value={form.requirements} onChange={e => set("requirements", e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" rows={2}
                  placeholder="e.g. Mics x4, spotlight, tanpura" />
              </label>

              {/* Backtrack + Live Music */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.hasBacktrack} onChange={e => set("hasBacktrack", e.target.checked)}
                    className="rounded border-slate-300 text-violet-600 focus:ring-violet-300" />
                  <span className="text-sm text-slate-600">Uses Backtrack</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.hasLiveMusic} onChange={e => set("hasLiveMusic", e.target.checked)}
                    className="rounded border-slate-300 text-violet-600 focus:ring-violet-300" />
                  <span className="text-sm text-slate-600">Live Music</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); setShowAddCategory(false); setNewCategoryName(""); }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 transition-colors flex items-center gap-2">
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
