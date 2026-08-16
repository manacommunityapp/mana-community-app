import { useState, useEffect } from "react";
import {
  Flame, Music, Trophy, Plus, Trash2, Check, ChevronDown,
  Clock, MapPin, Users, IndianRupee, CalendarDays, FileText,
  Star, Mic, Palette, BookOpen, AlertCircle, CheckCircle2,
  Tag, ShieldCheck, Gift, Layers, Loader2, X, UtensilsCrossed, Utensils, Coffee
} from "lucide-react";
import { eventService, type EventResponse } from "../../../services/events/eventService";
import { useEventMock } from "./EventMockToggle";

// ── Fallback Main Events List ──
const FALLBACK_MAIN_EVENTS = [
  { id: "1", title: "Ganesh Chaturthi Grand Festival 2026" },
  { id: "2", title: "Navratri Garba & Dandiya Mahotsav 2026" },
  { id: "3", title: "Diwali Grand Community Celebration 2026" },
  { id: "4", title: "Annual Community Sports & Cultural Meet 2026" },
];

// ── Custom Hook to fetch Main Events dynamically from DB ──
export function useMainEvents() {
  const { useMock } = useEventMock();
  const [mainEvents, setMainEvents] = useState<{ id: string; title: string }[]>(FALLBACK_MAIN_EVENTS);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function fetchDatabaseEvents() {
      if (useMock) {
        setMainEvents(FALLBACK_MAIN_EVENTS);
        return;
      }
      try {
        setLoading(true);
        const data = await eventService.getUpcomingEvents();
        if (data && data.length > 0) {
          setMainEvents(data.map((e) => ({ id: String(e.id), title: e.title })));
        } else {
          setMainEvents(FALLBACK_MAIN_EVENTS);
        }
      } catch (err) {
        console.warn("Could not fetch events from database, using defaults:", err);
        setMainEvents(FALLBACK_MAIN_EVENTS);
      } finally {
        setLoading(false);
      }
    }
    fetchDatabaseEvents();
  }, [useMock]);

  return { mainEvents, loading };
}

// ── Form primitives ──
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
      {children} {required && <span className="text-rose-500">*</span>}
    </label>
  );
}

function Input({
  value, onChange, placeholder, type = "text", min, className = "", autoFocus
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; min?: string; className?: string; autoFocus?: boolean;
}) {
  return (
    <input
      type={type}
      min={min}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={`w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition ${className}`}
    />
  );
}

function Select({
  value, onChange, children, className = ""
}: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none transition pr-8"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}

function Textarea({
  value, onChange, placeholder, rows = 3
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none transition"
    />
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => onChange(!checked)}>
      <div className={`w-9 h-5 rounded-full relative transition-colors ${checked ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${checked ? "left-4" : "left-0.5"}`} />
      </div>
      <span className="text-xs text-foreground font-medium">{label}</span>
    </div>
  );
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-2xl border border-border p-5 shadow-xs ${className}`}>
      {children}
    </div>
  );
}

function SectionHeading({ icon: Icon, color, children }: { icon: React.ElementType; color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/10">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <p className="text-xs font-black text-foreground uppercase tracking-wider">{children}</p>
    </div>
  );
}

function Row({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>{children}</div>;
}

function Col({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1">{children}</div>;
}

function TagInput({
  tags, onAdd, onRemove, placeholder
}: {
  tags: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void; placeholder?: string;
}) {
  const [val, setVal] = useState("");
  const add = () => {
    const t = val.trim();
    if (t && !tags.includes(t)) { onAdd(t); setVal(""); }
  };
  return (
    <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-border bg-background min-h-[42px] cursor-text">
      {tags.map((t, i) => (
        <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[11.5px] font-medium border border-primary/20">
          {t}
          <button onClick={() => onRemove(i)} className="hover:text-rose-500 transition cursor-pointer">
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] text-xs text-foreground outline-none placeholder:text-muted-foreground bg-transparent"
      />
    </div>
  );
}

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl bg-emerald-600 text-white text-xs font-bold animate-in fade-in slide-in-from-bottom-3">
      <CheckCircle2 className="w-4 h-4" />
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 cursor-pointer">✕</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 1. POOJA & SEVA COMPONENT (Dynamic Types + DB Creation Button)
// ══════════════════════════════════════════════════════════════
const DEFAULT_POOJA_TYPES = [
  "Ganesh Puja", "Ganapati Homam", "Abhishekam", "Maha Aarti",
  "Satyanarayan Puja", "Laghu Rudra", "Navagraha Puja", "Sahasranama Archana",
];

export function PoojaSevaSection() {
  const { mainEvents, loading: loadingEvents } = useMainEvents();
  const { useMock } = useEventMock();

  const [poojaTypes, setPoojaTypes] = useState<string[]>(DEFAULT_POOJA_TYPES);
  const [loadingTypes, setLoadingTypes] = useState<boolean>(false);
  const [showAddTypeModal, setShowAddTypeModal] = useState<boolean>(false);
  const [newTypeName, setNewTypeName] = useState<string>("");
  const [addingType, setAddingType] = useState<boolean>(false);

  const [form, setForm] = useState({
    mainEventId: "",
    name: "", type: "", date: "", startTime: "", duration: "",
    mandap: "", pandit: "", slots: "", fee: "", isFree: false,
    items: ["Coconut", "Flowers", "Bananas"], notes: "", isRecurring: false, recurringDays: "",
  });
  const [toast, setToast] = useState("");

  // Fetch Pooja Types dynamically from backend database
  useEffect(() => {
    async function loadPoojaTypes() {
      if (useMock) return;
      try {
        setLoadingTypes(true);
        const data = await eventService.getPoojaTypes();
        if (data && data.length > 0) {
          setPoojaTypes(data.map((t) => t.name));
        }
      } catch (err) {
        console.warn("Failed to load pooja types from DB:", err);
      } finally {
        setLoadingTypes(false);
      }
    }
    loadPoojaTypes();
  }, [useMock]);

  useEffect(() => {
    if (mainEvents.length > 0 && !form.mainEventId) {
      setForm((f) => ({ ...f, mainEventId: mainEvents[0].id }));
    }
  }, [mainEvents]);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleCreateType = async () => {
    if (!newTypeName.trim()) return;
    const clean = newTypeName.trim();
    try {
      setAddingType(true);
      if (!useMock) {
        await eventService.createPoojaType(clean);
      }
      setPoojaTypes((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
      set("type", clean);
      setNewTypeName("");
      setShowAddTypeModal(false);
      setToast(`Pooja Type "${clean}" saved to database!`);
      setTimeout(() => setToast(""), 3500);
    } catch (err) {
      alert("Failed to save new pooja type to database.");
    } finally {
      setAddingType(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.mainEventId || !form.name || !form.type || !form.date) {
      alert("Please select a main event, pooja type, and fill all required fields.");
      return;
    }

    const itemObj = {
      id: "pooja-" + Date.now(),
      title: form.name,
      category: "Pooja",
      type: form.type,
      date: form.date,
      time: form.startTime ? `${form.startTime} (${form.duration || 60}m)` : "Morning",
      venue: form.mandap || "Main Temple Mandap",
      fee: form.isFree ? 0 : Number(form.fee || 501),
      availableSeats: Number(form.slots || 20),
      image: "🪔",
      description: `Pandit: ${form.pandit || "Temple Priest"}. Samagri: ${form.items.join(", ")}. ${form.notes || ""}`,
      mainEventId: form.mainEventId,
    };

    try {
      if (!useMock) {
        await eventService.createPoojaSeva({
          mainEventId: form.mainEventId,
          name: form.name,
          type: form.type,
          date: form.date,
          startTime: form.startTime,
          duration: form.duration,
          mandap: form.mandap,
          pandit: form.pandit,
          slots: form.slots,
          fee: form.fee,
          isFree: form.isFree,
          items: form.items,
          notes: form.notes,
        });
      }
    } catch (e) {
      console.warn("Backend save notice:", e);
    }

    const existing = JSON.parse(localStorage.getItem("mana_custom_activities") || "[]");
    localStorage.setItem("mana_custom_activities", JSON.stringify([itemObj, ...existing]));
    window.dispatchEvent(new Event("mana_activities_updated"));

    setToast(`Pooja / Seva "${form.name}" published to Admin & Member Dashboard!`);
    setTimeout(() => setToast(""), 3500);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {toast && <Toast msg={toast} onClose={() => setToast("")} />}

      {/* Header Banner */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black">Pooja &amp; Seva Management</h2>
            <p className="text-xs opacity-90">Schedule temple rituals, slot limits &amp; samagri requirements under main event</p>
          </div>
        </div>
      </div>

      <SectionCard>
        <SectionHeading icon={Flame} color="#F59E0B">Basic Information</SectionHeading>
        <div className="space-y-4">
          <Col>
            <Label required>Select Main Event (Parent Event)</Label>
            <Select value={form.mainEventId} onChange={(v) => set("mainEventId", v)}>
              <option value="">{loadingEvents ? "Loading events from database..." : "Select Main Festival / Event…"}</option>
              {mainEvents.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </Select>
          </Col>
          <Row>
            <Col>
              <Label required>Pooja / Seva Name</Label>
              <Input value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. Ganesh Abhishekam & Archana" />
            </Col>
            <Col>
              <div className="flex items-center justify-between">
                <Label required>Pooja Type</Label>
                <button
                  type="button"
                  onClick={() => setShowAddTypeModal(true)}
                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer mb-1"
                >
                  <Plus className="w-3 h-3" /> Create New Type
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Select value={form.type} onChange={(v) => set("type", v)} className="flex-1">
                  <option value="">{loadingTypes ? "Loading types from DB..." : "Select ritual type…"}</option>
                  {poojaTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
                <button
                  type="button"
                  onClick={() => setShowAddTypeModal(true)}
                  className="px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                  title="Create new Pooja Type in database"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Type</span>
                </button>
              </div>
            </Col>
          </Row>
          <Row>
            <Col>
              <Label required>Date</Label>
              <Input type="date" value={form.date} onChange={(v) => set("date", v)} />
            </Col>
            <Col>
              <Label required>Start Time</Label>
              <Input type="time" value={form.startTime} onChange={(v) => set("startTime", v)} />
            </Col>
          </Row>
          <Row>
            <Col>
              <Label>Duration (Minutes)</Label>
              <Input type="number" min="15" value={form.duration} onChange={(v) => set("duration", v)} placeholder="60" />
            </Col>
            <Col>
              <Label>Mandap / Venue Location</Label>
              <Input value={form.mandap} onChange={(v) => set("mandap", v)} placeholder="Main Mandap, Gate 1" />
            </Col>
          </Row>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeading icon={Star} color="#10B981">Priest &amp; Slots Configuration</SectionHeading>
        <div className="space-y-4">
          <Row>
            <Col>
              <Label>Pandit / Priest Name</Label>
              <Input value={form.pandit} onChange={(v) => set("pandit", v)} placeholder="Pandit Suresh Sharma" />
            </Col>
            <Col>
              <Label>Available Slots (Capacity)</Label>
              <Input type="number" min="1" value={form.slots} onChange={(v) => set("slots", v)} placeholder="20 Families" />
            </Col>
          </Row>
          <Row>
            <Col>
              <Toggle checked={form.isFree} onChange={(v) => set("isFree", v)} label="This seva is free of charge" />
            </Col>
            {!form.isFree && (
              <Col>
                <Label>Booking Fee (₹)</Label>
                <Input value={form.fee} onChange={(v) => set("fee", v)} placeholder="501" />
              </Col>
            )}
          </Row>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeading icon={BookOpen} color="#4F46E5">Puja Items &amp; Devotee Notes</SectionHeading>
        <div className="space-y-4">
          <Col>
            <Label>Required Samagri / Items to Bring</Label>
            <TagInput
              tags={form.items}
              onAdd={(v) => set("items", [...form.items, v])}
              onRemove={(i) => set("items", form.items.filter((_, idx) => idx !== i))}
              placeholder="Type item & press Enter…"
            />
          </Col>
          <Col>
            <Label>Devotee Guidelines &amp; Notes</Label>
            <Textarea value={form.notes} onChange={(v) => set("notes", v)} placeholder="Please arrive 15 minutes before time. Traditional attire requested." />
          </Col>
        </div>
      </SectionCard>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button onClick={handleSubmit} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-md hover:opacity-90 cursor-pointer flex items-center gap-2">
          <Plus className="w-4 h-4" /> Save Pooja / Seva
        </button>
      </div>

      {/* ─── CREATE NEW POOJA TYPE MODAL DIALOG ─── */}
      {showAddTypeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card border border-border text-card-foreground rounded-2xl p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                Create New Pooja Type
              </h3>
              <button onClick={() => setShowAddTypeModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Label required>Pooja Type Name</Label>
              <Input
                value={newTypeName}
                onChange={(v) => setNewTypeName(v)}
                placeholder="e.g. Sudarsana Homam, Chandi Path"
                autoFocus
              />
              <p className="text-[10.5px] text-muted-foreground">Will be saved to database and selected automatically.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddTypeModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateType}
                disabled={!newTypeName.trim() || addingType}
                className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {addingType ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Save to Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 2. CULTURAL EVENTS COMPONENT (Dynamic Category & Performance Type)
// ══════════════════════════════════════════════════════════════
const DEFAULT_CULTURAL_CATS = [
  "Classical Dance", "Folk Dance", "Fusion Dance", "Classical Music",
  "Film Music", "Devotional Music", "Drama / Skit", "Stand-up / Comedy",
  "Fashion Show", "Mime / Nritya", "Instrumental", "Choir",
];
const DEFAULT_PERFORMANCE_TYPES = ["Solo", "Duo", "Trio", "Small Group (4–8)", "Large Group (9+)"];
const AGE_CATS = ["Kids (Under 12)", "Youth (12–25)", "Adults (25+)", "Open (All Ages)"];

export function CulturalEventsSection() {
  const { mainEvents, loading: loadingMainEvents } = useMainEvents();
  const { useMock } = useEventMock();

  const [categories, setCategories] = useState<string[]>(DEFAULT_CULTURAL_CATS);
  const [perfTypes, setPerfTypes] = useState<string[]>(DEFAULT_PERFORMANCE_TYPES);

  const [loadingCats, setLoadingCats] = useState<boolean>(false);
  const [loadingTypes, setLoadingTypes] = useState<boolean>(false);

  const [showAddCatModal, setShowAddCatModal] = useState<boolean>(false);
  const [showAddTypeModal, setShowAddTypeModal] = useState<boolean>(false);

  const [newCatName, setNewCatName] = useState<string>("");
  const [newTypeName, setNewTypeName] = useState<string>("");

  const [addingCat, setAddingCat] = useState<boolean>(false);
  const [addingType, setAddingType] = useState<boolean>(false);

  const [form, setForm] = useState({
    mainEventId: "",
    name: "", category: "", perfType: "", ageGroup: "Open (All Ages)", date: "",
    startTime: "", duration: "", stage: "", performers: [], description: "",
    requirements: "", hasBacktrack: true, hasLiveMusic: false,
  });
  const [toast, setToast] = useState("");

  // Load Cultural Categories & Performance Types from DB
  useEffect(() => {
    async function loadData() {
      if (useMock) return;
      try {
        setLoadingCats(true);
        const catData = await eventService.getCulturalCategories();
        if (catData && catData.length > 0) setCategories(catData.map((c) => c.name));
      } catch (e) {
        console.warn("Failed to load cultural categories:", e);
      } finally {
        setLoadingCats(false);
      }

      try {
        setLoadingTypes(true);
        const typeData = await eventService.getCulturalPerformanceTypes();
        if (typeData && typeData.length > 0) setPerfTypes(typeData.map((t) => t.name));
      } catch (e) {
        console.warn("Failed to load performance types:", e);
      } finally {
        setLoadingTypes(false);
      }
    }
    loadData();
  }, [useMock]);

  useEffect(() => {
    if (mainEvents.length > 0 && !form.mainEventId) {
      setForm((f) => ({ ...f, mainEventId: mainEvents[0].id }));
    }
  }, [mainEvents]);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    const clean = newCatName.trim();
    try {
      setAddingCat(true);
      if (!useMock) await eventService.createCulturalCategory(clean);
      setCategories((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
      set("category", clean);
      setNewCatName("");
      setShowAddCatModal(false);
      setToast(`Category "${clean}" saved to database!`);
      setTimeout(() => setToast(""), 3500);
    } catch (err) {
      alert("Failed to save new category to database.");
    } finally {
      setAddingCat(false);
    }
  };

  const handleCreatePerfType = async () => {
    if (!newTypeName.trim()) return;
    const clean = newTypeName.trim();
    try {
      setAddingType(true);
      if (!useMock) await eventService.createCulturalPerformanceType(clean);
      setPerfTypes((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
      set("perfType", clean);
      setNewTypeName("");
      setShowAddTypeModal(false);
      setToast(`Performance Type "${clean}" saved to database!`);
      setTimeout(() => setToast(""), 3500);
    } catch (err) {
      alert("Failed to save new performance type to database.");
    } finally {
      setAddingType(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.mainEventId || !form.name || !form.category || !form.date) {
      alert("Please select a main event, category, and fill all required fields.");
      return;
    }

    const itemObj = {
      id: "cult-" + Date.now(),
      title: form.name,
      category: "Cultural",
      type: form.category,
      perfType: form.perfType,
      date: form.date,
      time: form.startTime ? form.startTime : "Evening",
      venue: form.stage || "Auditorium Stage A",
      fee: 0,
      availableSeats: 30,
      image: "🎭",
      description: `Category: ${form.category}. Type: ${form.perfType || "Group"}. Age: ${form.ageGroup}. ${form.requirements || ""}`,
      mainEventId: form.mainEventId,
    };

    try {
      if (!useMock) {
        await eventService.createCulturalEvent({
          mainEventId: form.mainEventId,
          name: form.name,
          category: form.category,
          perfType: form.perfType,
          ageGroup: form.ageGroup,
          date: form.date,
          startTime: form.startTime,
          stage: form.stage,
          requirements: form.requirements,
          hasBacktrack: form.hasBacktrack,
          hasLiveMusic: form.hasLiveMusic,
        });
      }
    } catch (e) {
      console.warn("Backend save notice:", e);
    }

    const existing = JSON.parse(localStorage.getItem("mana_custom_activities") || "[]");
    localStorage.setItem("mana_custom_activities", JSON.stringify([itemObj, ...existing]));
    window.dispatchEvent(new Event("mana_activities_updated"));

    setToast(`Cultural Event "${form.name}" published to Admin & Member Dashboard!`);
    setTimeout(() => setToast(""), 3500);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {toast && <Toast msg={toast} onClose={() => setToast("")} />}

      <div className="flex items-center justify-between p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-xs">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black">Cultural Events &amp; Performances</h2>
            <p className="text-xs opacity-90">Schedule dance, music, drama &amp; stage performances under main event</p>
          </div>
        </div>
      </div>

      <SectionCard>
        <SectionHeading icon={Music} color="#7C3AED">Performance Identity</SectionHeading>
        <div className="space-y-4">
          <Col>
            <Label required>Select Main Event (Parent Event)</Label>
            <Select value={form.mainEventId} onChange={(v) => set("mainEventId", v)}>
              <option value="">{loadingMainEvents ? "Loading events from database..." : "Select Main Festival / Event…"}</option>
              {mainEvents.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </Select>
          </Col>
          <Col>
            <Label required>Performance / Show Name</Label>
            <Input value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. Classical Fusion Dance Odyssey" />
          </Col>
          <Row>
            {/* Category Dropdown + New Category Button */}
            <Col>
              <div className="flex items-center justify-between">
                <Label required>Category</Label>
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(true)}
                  className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer mb-1"
                >
                  <Plus className="w-3 h-3" /> Create Category
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Select value={form.category} onChange={(v) => set("category", v)} className="flex-1">
                  <option value="">{loadingCats ? "Loading categories..." : "Select category…"}</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(true)}
                  className="px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                  title="Create new Cultural Category in database"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Category</span>
                </button>
              </div>
            </Col>

            {/* Performance Type Dropdown + New Type Button */}
            <Col>
              <div className="flex items-center justify-between">
                <Label>Performance Type</Label>
                <button
                  type="button"
                  onClick={() => setShowAddTypeModal(true)}
                  className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer mb-1"
                >
                  <Plus className="w-3 h-3" /> Create Type
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Select value={form.perfType} onChange={(v) => set("perfType", v)} className="flex-1">
                  <option value="">{loadingTypes ? "Loading types..." : "Select group type…"}</option>
                  {perfTypes.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
                <button
                  type="button"
                  onClick={() => setShowAddTypeModal(true)}
                  className="px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                  title="Create new Performance Type in database"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Type</span>
                </button>
              </div>
            </Col>
          </Row>
          <Col>
            <Label>Age Group</Label>
            <div className="flex flex-wrap gap-2">
              {AGE_CATS.map((a) => (
                <button
                  key={a}
                  onClick={() => set("ageGroup", a)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    form.ageGroup === a
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-muted text-muted-foreground border-border hover:border-purple-300"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </Col>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeading icon={Mic} color="#EC4899">Stage &amp; Technical Requirements</SectionHeading>
        <div className="space-y-4">
          <Row>
            <Col>
              <Label required>Date</Label>
              <Input type="date" value={form.date} onChange={(v) => set("date", v)} />
            </Col>
            <Col>
              <Label required>Start Time</Label>
              <Input type="time" value={form.startTime} onChange={(v) => set("startTime", v)} />
            </Col>
          </Row>
          <div className="flex flex-wrap gap-4">
            <Toggle checked={form.hasBacktrack} onChange={(v) => set("hasBacktrack", v)} label="Needs backtrack audio track upload" />
            <Toggle checked={form.hasLiveMusic} onChange={(v) => set("hasLiveMusic", v)} label="Live music instruments required" />
          </div>
          <Col>
            <Label>Stage / Technical Needs</Label>
            <Textarea value={form.requirements} onChange={(v) => set("requirements", v)} placeholder="e.g. 4 cordless mics, stage lighting preset 2, audio mixer line-in" />
          </Col>
        </div>
      </SectionCard>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button onClick={handleSubmit} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-md hover:opacity-90 cursor-pointer flex items-center gap-2">
          <Plus className="w-4 h-4" /> Save Cultural Event
        </button>
      </div>

      {/* ─── CREATE NEW CULTURAL CATEGORY MODAL DIALOG ─── */}
      {showAddCatModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card border border-border text-card-foreground rounded-2xl p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Music className="w-4 h-4 text-purple-600" />
                Create Cultural Category
              </h3>
              <button onClick={() => setShowAddCatModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Label required>Category Name</Label>
              <Input
                value={newCatName}
                onChange={(v) => setNewCatName(v)}
                placeholder="e.g. Sufi Music, Drama Skit"
                autoFocus
              />
              <p className="text-[10.5px] text-muted-foreground">Will be saved to database and selected automatically.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddCatModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={!newCatName.trim() || addingCat}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {addingCat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Save to Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATE NEW PERFORMANCE TYPE MODAL DIALOG ─── */}
      {showAddTypeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card border border-border text-card-foreground rounded-2xl p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                Create Performance Type
              </h3>
              <button onClick={() => setShowAddTypeModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Label required>Performance Type Name</Label>
              <Input
                value={newTypeName}
                onChange={(v) => setNewTypeName(v)}
                placeholder="e.g. Large Group (15+), Quartet"
                autoFocus
              />
              <p className="text-[10.5px] text-muted-foreground">Will be saved to database and selected automatically.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddTypeModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePerfType}
                disabled={!newTypeName.trim() || addingType}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {addingType ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Save to Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 3. COMPETITIONS COMPONENT (Dynamic Category & Age Group)
// ══════════════════════════════════════════════════════════════
const DEFAULT_COMP_CATS = [
  "Rangoli", "Drawing / Painting", "Kolam", "Quiz", "Fancy Dress",
  "Classical Dance", "Folk Dance", "Singing", "Instrumental",
  "Essay / Elocution", "Sports / Games", "Cooking", "Flower Decoration",
];
const DEFAULT_COMP_AGE_GROUPS = ["Kids (Under 12)", "Youth (12–25)", "Adults (25+)", "Seniors (60+)", "Open (All Ages)"];

export function CompetitionsSection() {
  const { mainEvents, loading: loadingMainEvents } = useMainEvents();
  const { useMock } = useEventMock();

  const [categories, setCategories] = useState<string[]>(DEFAULT_COMP_CATS);
  const [ageGroups, setAgeGroups] = useState<string[]>(DEFAULT_COMP_AGE_GROUPS);

  const [loadingCats, setLoadingCats] = useState<boolean>(false);
  const [loadingAgeGroups, setLoadingAgeGroups] = useState<boolean>(false);

  const [showAddCatModal, setShowAddCatModal] = useState<boolean>(false);
  const [showAddAgeModal, setShowAddAgeModal] = useState<boolean>(false);

  const [newCatName, setNewCatName] = useState<string>("");
  const [newAgeName, setNewAgeName] = useState<string>("");

  const [addingCat, setAddingCat] = useState<boolean>(false);
  const [addingAge, setAddingAge] = useState<boolean>(false);

  const [form, setForm] = useState({
    mainEventId: "",
    name: "", category: "", ageGroup: "Kids (Under 12)", date: "", startTime: "",
    regDeadline: "", fee: "", isFree: true, maxParticipants: "50",
    venue: "", judges: [], rules: "", isTeamEvent: false, teamSize: "1",
  });
  const [toast, setToast] = useState("");

  // Load Competition Categories & Age Groups dynamically from DB
  useEffect(() => {
    async function loadData() {
      if (useMock) return;
      try {
        setLoadingCats(true);
        const catData = await eventService.getCompetitionCategories();
        if (catData && catData.length > 0) setCategories(catData.map((c) => c.name));
      } catch (e) {
        console.warn("Failed to load competition categories:", e);
      } finally {
        setLoadingCats(false);
      }

      try {
        setLoadingAgeGroups(true);
        const ageData = await eventService.getCompetitionAgeGroups();
        if (ageData && ageData.length > 0) setAgeGroups(ageData.map((a) => a.name));
      } catch (e) {
        console.warn("Failed to load competition age groups:", e);
      } finally {
        setLoadingAgeGroups(false);
      }
    }
    loadData();
  }, [useMock]);

  useEffect(() => {
    if (mainEvents.length > 0 && !form.mainEventId) {
      setForm((f) => ({ ...f, mainEventId: mainEvents[0].id }));
    }
  }, [mainEvents]);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    const clean = newCatName.trim();
    try {
      setAddingCat(true);
      if (!useMock) await eventService.createCompetitionCategory(clean);
      setCategories((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
      set("category", clean);
      setNewCatName("");
      setShowAddCatModal(false);
      setToast(`Category "${clean}" saved to database!`);
      setTimeout(() => setToast(""), 3500);
    } catch (err) {
      alert("Failed to save new category to database.");
    } finally {
      setAddingCat(false);
    }
  };

  const handleCreateAgeGroup = async () => {
    if (!newAgeName.trim()) return;
    const clean = newAgeName.trim();
    try {
      setAddingAge(true);
      if (!useMock) await eventService.createCompetitionAgeGroup(clean);
      setAgeGroups((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
      set("ageGroup", clean);
      setNewAgeName("");
      setShowAddAgeModal(false);
      setToast(`Age Group "${clean}" saved to database!`);
      setTimeout(() => setToast(""), 3500);
    } catch (err) {
      alert("Failed to save new age group to database.");
    } finally {
      setAddingAge(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.mainEventId || !form.name || !form.category || !form.date) {
      alert("Please select a main event, category, and fill all required fields.");
      return;
    }

    const itemObj = {
      id: "comp-" + Date.now(),
      title: form.name,
      category: "Competitions",
      type: form.category,
      ageGroup: form.ageGroup,
      date: form.date,
      time: form.startTime ? form.startTime : "Morning",
      venue: form.venue || "Clubhouse Activity Room",
      fee: form.isFree ? 0 : Number(form.fee || 100),
      availableSeats: Number(form.maxParticipants || 50),
      image: "🏆",
      description: `Category: ${form.category}. Age Group: ${form.ageGroup}. Rules: ${form.rules || "Standard community contest rules."}`,
      mainEventId: form.mainEventId,
    };

    try {
      if (!useMock) {
        await eventService.createCompetition({
          mainEventId: form.mainEventId,
          name: form.name,
          category: form.category,
          ageGroup: form.ageGroup,
          date: form.date,
          startTime: form.startTime,
          regDeadline: form.regDeadline,
          fee: form.fee,
          isFree: form.isFree,
          maxParticipants: form.maxParticipants,
          venue: form.venue,
          rules: form.rules,
        });
      }
    } catch (e) {
      console.warn("Backend save notice:", e);
    }

    const existing = JSON.parse(localStorage.getItem("mana_custom_activities") || "[]");
    localStorage.setItem("mana_custom_activities", JSON.stringify([itemObj, ...existing]));
    window.dispatchEvent(new Event("mana_activities_updated"));

    setToast(`Competition "${form.name}" published to Admin & Member Dashboard!`);
    setTimeout(() => setToast(""), 3500);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {toast && <Toast msg={toast} onClose={() => setToast("")} />}

      <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black">Competitions &amp; Contests</h2>
            <p className="text-xs opacity-90">Manage Rangoli, Drawing, Quiz, Cooking &amp; Talent contests under main event</p>
          </div>
        </div>
      </div>

      <SectionCard>
        <SectionHeading icon={Trophy} color="#3B82F6">Competition Details</SectionHeading>
        <div className="space-y-4">
          <Col>
            <Label required>Select Main Event (Parent Event)</Label>
            <Select value={form.mainEventId} onChange={(v) => set("mainEventId", v)}>
              <option value="">{loadingMainEvents ? "Loading events from database..." : "Select Main Festival / Event…"}</option>
              {mainEvents.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </Select>
          </Col>
          <Col>
            <Label required>Competition Title</Label>
            <Input value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. Eco-Ganesha Rangoli Championship 2026" />
          </Col>
          <Row>
            {/* Category Dropdown + New Category Button */}
            <Col>
              <div className="flex items-center justify-between">
                <Label required>Category</Label>
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(true)}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer mb-1"
                >
                  <Plus className="w-3 h-3" /> Create Category
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Select value={form.category} onChange={(v) => set("category", v)} className="flex-1">
                  <option value="">{loadingCats ? "Loading categories..." : "Select competition category…"}</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(true)}
                  className="px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/20 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                  title="Create new Competition Category in database"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Category</span>
                </button>
              </div>
            </Col>

            {/* Age Group Dropdown + New Age Group Button */}
            <Col>
              <div className="flex items-center justify-between">
                <Label required>Age Group</Label>
                <button
                  type="button"
                  onClick={() => setShowAddAgeModal(true)}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer mb-1"
                >
                  <Plus className="w-3 h-3" /> Create Age Group
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Select value={form.ageGroup} onChange={(v) => set("ageGroup", v)} className="flex-1">
                  <option value="">{loadingAgeGroups ? "Loading age groups..." : "Select age group…"}</option>
                  {ageGroups.map((a) => <option key={a} value={a}>{a}</option>)}
                </Select>
                <button
                  type="button"
                  onClick={() => setShowAddAgeModal(true)}
                  className="px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/20 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                  title="Create new Age Group in database"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Age Group</span>
                </button>
              </div>
            </Col>
          </Row>
          <Row>
            <Col>
              <Label required>Date</Label>
              <Input type="date" value={form.date} onChange={(v) => set("date", v)} />
            </Col>
            <Col>
              <Label required>Start Time</Label>
              <Input type="time" value={form.startTime} onChange={(v) => set("startTime", v)} />
            </Col>
          </Row>
          <Row>
            <Col>
              <Label>Max Participants / Teams</Label>
              <Input type="number" value={form.maxParticipants} onChange={(v) => set("maxParticipants", v)} placeholder="50" />
            </Col>
            <Col>
              <Label>Venue / Hall</Label>
              <Input value={form.venue} onChange={(v) => set("venue", v)} placeholder="Clubhouse Activity Room" />
            </Col>
          </Row>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeading icon={ShieldCheck} color="#10B981">Rules &amp; Evaluation Criteria</SectionHeading>
        <div className="space-y-4">
          <Col>
            <Label>Rules &amp; Guidelines</Label>
            <Textarea rows={4} value={form.rules} onChange={(v) => set("rules", v)} placeholder="1. Time limit: 45 minutes&#10;2. Eco-friendly colors only&#10;3. Judging based on creativity & neatness" />
          </Col>
        </div>
      </SectionCard>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button onClick={handleSubmit} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md hover:opacity-90 cursor-pointer flex items-center gap-2">
          <Plus className="w-4 h-4" /> Save Competition
        </button>
      </div>

      {/* ─── CREATE NEW COMPETITION CATEGORY MODAL DIALOG ─── */}
      {showAddCatModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card border border-border text-card-foreground rounded-2xl p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Trophy className="w-4 h-4 text-blue-600" />
                Create Competition Category
              </h3>
              <button onClick={() => setShowAddCatModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Label required>Category Name</Label>
              <Input
                value={newCatName}
                onChange={(v) => setNewCatName(v)}
                placeholder="e.g. Kolam, Robotics, Quiz"
                autoFocus
              />
              <p className="text-[10.5px] text-muted-foreground">Will be saved to database and selected automatically.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddCatModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={!newCatName.trim() || addingCat}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {addingCat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Save to Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATE NEW AGE GROUP MODAL DIALOG ─── */}
      {showAddAgeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card border border-border text-card-foreground rounded-2xl p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Create Competition Age Group
              </h3>
              <button onClick={() => setShowAddAgeModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Label required>Age Group Name</Label>
              <Input
                value={newAgeName}
                onChange={(v) => setNewAgeName(v)}
                placeholder="e.g. Seniors (60+), Toddlers (Under 5)"
                autoFocus
              />
              <p className="text-[10.5px] text-muted-foreground">Will be saved to database and selected automatically.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddAgeModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAgeGroup}
                disabled={!newAgeName.trim() || addingAge}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {addingAge ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Save to Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 4. LUNCH / DINNER (MAHAPRASADAM & CATERING) SECTION
// ══════════════════════════════════════════════════════════════════

const DEFAULT_MEAL_TYPES = [
  "Lunch (Bhojanam)",
  "Dinner (Mahaprasadam)",
  "Breakfast (Tiffin)",
  "High Tea & Snacks",
  "Full Day Satvik Annadanam",
  "VIP Banquet",
];

const DEFAULT_DIET_TYPES = [
  "Satvik Pure Vegetarian",
  "Traditional South Indian",
  "North Indian Thali",
  "Jain (No Onion / Garlic)",
  "Vegan Friendly",
  "Mixed (Multi-Cuisine)",
];

export function LunchDinnerSection() {
  const { useMock } = useEventMock();
  const { mainEvents, loading: loadingEvents } = useMainEvents();

  const [mealTypes, setMealTypes] = useState<string[]>(DEFAULT_MEAL_TYPES);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [addingType, setAddingType] = useState(false);
  const [toast, setToast] = useState<string>("");

  const [form, setForm] = useState({
    mainEventId: "",
    name: "Community Satvik Mahaprasadam",
    mealType: "Lunch (Bhojanam)",
    date: "2026-08-22",
    startTime: "12:30",
    endTime: "15:00",
    venue: "Annadanam Dining Hall, Gate 2",
    targetPlates: 500,
    caterer: "ISKCON Annadanam Trust / Food Committee",
    dietType: "Satvik Pure Vegetarian",
    fee: 0,
    isFree: true,
    menuItems: ["Pulihora", "Curd Rice", "Sweet Pongal", "Medu Vada", "Payasam", "Sambar & Papad"],
    notes: "Satvik food served in traditional banana leaves. Clean drinking water and volunteer support enabled.",
  });

  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    if (mainEvents.length > 0 && !form.mainEventId) {
      setForm((f) => ({ ...f, mainEventId: mainEvents[0].id }));
    }
  }, [mainEvents]);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const addItem = () => {
    if (newItem.trim()) {
      set("menuItems", [...form.menuItems, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeItem = (i: number) => {
    set("menuItems", form.menuItems.filter((_, idx) => idx !== i));
  };

  const handleCreateMealType = () => {
    if (!newTypeName.trim()) return;
    const clean = newTypeName.trim();
    setMealTypes((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
    set("mealType", clean);
    setNewTypeName("");
    setShowAddTypeModal(false);
    setToast(`Meal Type "${clean}" added!`);
    setTimeout(() => setToast(""), 3500);
  };

  const handleSubmit = async () => {
    if (!form.mainEventId || !form.name || !form.mealType || !form.date) {
      alert("Please select a main event, meal type, and fill all required fields.");
      return;
    }

    const itemObj = {
      id: "food-" + Date.now(),
      title: form.name,
      category: "Food",
      type: form.mealType,
      date: form.date,
      time: `${form.startTime} - ${form.endTime}`,
      venue: form.venue || "Annadanam Dining Hall",
      fee: form.isFree ? 0 : Number(form.fee || 50),
      availableSeats: Number(form.targetPlates || 500),
      image: "🍲",
      description: `Meal: ${form.mealType}. Caterer: ${form.caterer || "Food Committee"}. Menu: ${form.menuItems.join(", ")}. ${form.notes || ""}`,
      mainEventId: form.mainEventId,
    };

    try {
      if (!useMock) {
        await eventService.createLunchDinner({
          mainEventId: Number(form.mainEventId),
          name: form.name,
          mealType: form.mealType,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          venue: form.venue,
          targetPlates: Number(form.targetPlates),
          caterer: form.caterer,
          dietType: form.dietType,
          fee: form.fee,
          isFree: form.isFree,
          menuItems: form.menuItems,
          notes: form.notes,
        });
      }
    } catch (e) {
      console.warn("Backend save notice:", e);
    }

    const existing = JSON.parse(localStorage.getItem("mana_custom_activities") || "[]");
    localStorage.setItem("mana_custom_activities", JSON.stringify([itemObj, ...existing]));
    window.dispatchEvent(new Event("mana_activities_updated"));

    setToast(`Lunch / Dinner "${form.name}" published to Admin & Member Dashboard!`);
    setTimeout(() => setToast(""), 3500);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {toast && <Toast msg={toast} onClose={() => setToast("")} />}

      {/* Header Banner */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500 text-white shadow-xs">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black">Lunch &amp; Dinner (Mahaprasadam / Catering)</h2>
            <p className="text-xs opacity-90">Schedule community bhojanam, meal sessions, menu items &amp; plate forecasts</p>
          </div>
        </div>
      </div>

      <SectionCard>
        <SectionHeading icon={Utensils} color="#EA580C">Meal &amp; Bhojanam Details</SectionHeading>
        <div className="space-y-4">
          <Col>
            <Label required>Select Main Event (Parent Event)</Label>
            <Select value={form.mainEventId} onChange={(v) => set("mainEventId", v)}>
              <option value="">{loadingEvents ? "Loading events from database..." : "Select Main Festival / Event…"}</option>
              {mainEvents.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </Select>
          </Col>

          <Row>
            <Col>
              <Label required>Meal / Session Name</Label>
              <Input
                value={form.name}
                onChange={(v) => set("name", v)}
                placeholder="e.g. Sri Satvik Mahaprasadam Bhojanam"
              />
            </Col>
            <Col>
              <Label required>Meal Type</Label>
              <div className="flex items-center gap-2">
                <Select value={form.mealType} onChange={(v) => set("mealType", v)} className="flex-1">
                  {mealTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
                <button
                  type="button"
                  onClick={() => setShowAddTypeModal(true)}
                  title="Create new meal type in database"
                  className="px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 border border-orange-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>
              </div>
            </Col>
          </Row>

          <Row>
            <Col>
              <Label required>Date</Label>
              <Input type="date" value={form.date} onChange={(v) => set("date", v)} />
            </Col>
            <Col>
              <Label required>Start Time</Label>
              <Input type="time" value={form.startTime} onChange={(v) => set("startTime", v)} />
            </Col>
            <Col>
              <Label required>End Time</Label>
              <Input type="time" value={form.endTime} onChange={(v) => set("endTime", v)} />
            </Col>
          </Row>

          <Row>
            <Col>
              <Label required>Dining Venue / Hall</Label>
              <Input
                value={form.venue}
                onChange={(v) => set("venue", v)}
                placeholder="e.g. Annadanam Hall, Gate 2"
              />
            </Col>
            <Col>
              <Label required>Expected Headcount / Target Plates</Label>
              <Input
                type="number"
                value={String(form.targetPlates)}
                onChange={(v) => set("targetPlates", Number(v) || 0)}
                placeholder="500"
              />
            </Col>
          </Row>

          <Row>
            <Col>
              <Label>Caterer / Annadanam Sponsor</Label>
              <Input
                value={form.caterer}
                onChange={(v) => set("caterer", v)}
                placeholder="e.g. ISKCON Annadanam Trust / Food Committee"
              />
            </Col>
            <Col>
              <Label>Dietary / Cuisine Category</Label>
              <Select value={form.dietType} onChange={(v) => set("dietType", v)}>
                {DEFAULT_DIET_TYPES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            </Col>
          </Row>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeading icon={UtensilsCrossed} color="#EA580C">Menu Items &amp; Dishes Served</SectionHeading>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              value={newItem}
              onChange={(v) => setNewItem(v)}
              placeholder="Enter dish name (e.g. Pulihora, Curd Rice, Sweet Pongal, Payasam, Vada)..."
              onKeyDown={(e: any) => e.key === "Enter" && (e.preventDefault(), addItem())}
            />
            <button
              type="button"
              onClick={addItem}
              className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Dish
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {form.menuItems.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/20 rounded-xl text-xs font-medium"
              >
                <span>🍛 {item}</span>
                <button onClick={() => removeItem(idx)} className="text-orange-400 hover:text-rose-600 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeading icon={IndianRupee} color="#10B981">Pricing &amp; Notes</SectionHeading>
        <div className="space-y-4">
          <Row>
            <Col>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="lunchFree"
                  checked={form.isFree}
                  onChange={(e) => set("isFree", e.target.checked)}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
                <label htmlFor="lunchFree" className="text-xs font-bold text-foreground cursor-pointer">
                  Free Community Prasadam / Annadanam
                </label>
              </div>
            </Col>
            {!form.isFree && (
              <Col>
                <Label required>Token Fee (₹)</Label>
                <Input
                  type="number"
                  value={String(form.fee)}
                  onChange={(v) => set("fee", Number(v) || 0)}
                  placeholder="50"
                />
              </Col>
            )}
          </Row>

          <Col>
            <Label>Notes &amp; Dietary Guidelines</Label>
            <Textarea
              value={form.notes}
              onChange={(v) => set("notes", v)}
              placeholder="Special instructions for dining lines, prasadam packing, volunteer duties, etc."
            />
          </Col>
        </div>
      </SectionCard>

      {/* Publish Action Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg hover:from-orange-700 hover:to-amber-700 transition-all flex items-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          Publish Lunch / Dinner to Dashboard
        </button>
      </div>

      {/* Modal: Create New Meal Type */}
      {showAddTypeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card border border-border text-card-foreground rounded-2xl p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Utensils className="w-4 h-4 text-orange-600" />
                Create New Meal Type
              </h3>
              <button onClick={() => setShowAddTypeModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Label required>Meal Type Name</Label>
              <Input
                value={newTypeName}
                onChange={(v) => setNewTypeName(v)}
                placeholder="e.g. Midnight Feast, Prasadam Stall"
                autoFocus
              />
              <p className="text-[10.5px] text-muted-foreground">Will be added and selected automatically.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddTypeModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMealType}
                disabled={!newTypeName.trim() || addingType}
                className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Save Meal Type
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
