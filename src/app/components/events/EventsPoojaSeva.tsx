import { useState, useEffect, Fragment } from "react";
import {
  Flame, Plus, Loader2, AlertCircle, Pencil, Trash2, Users, Clock, MapPin,
  Calendar, IndianRupee, X, Star, ChevronDown, ChevronUp, User, Ban,
  CheckCircle2, Search, UserPlus, Edit3, Save, Phone, Mail, FileText, AlertTriangle,
  CalendarDays, LayoutList, ShieldOff, RefreshCw, Sparkles, Ticket,
} from "lucide-react";

import { toast } from "sonner";
import { useEventMock } from "./EventMockToggle";
import { eventService, type EventResponse, type PoojaScheduleDto, type UserSearchResult } from "../../../services/events/eventService";
import { TimePicker, TimeSelect } from "../ui/time-picker";

type TimeSlotEntry = { id?: number; slotDate: string | null; startTime: string; endTime?: string; title?: string; slotCount: number; status?: "OPEN" | "BLOCKED" | "CLOSED" };

type PoojaSeva = {
  id: number;
  mainEventId?: number;
  poojaTypeId?: number;
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
  timeSlotConfig?: TimeSlotEntry[];
  fee?: number;
  isFree?: boolean;
  needsRegistration?: boolean;
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
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
  poojaSlotName?: string;
  poojaSlotDate?: string;
  poojaSlotTime?: string;
  poojaSevaTimeSlotsId?: number;
  scheduleId?: number;
  poojaId?: number | string;
  poojaSevaId?: number | string;
  eventId?: number | string;
  eventName?: string;
  // Audit fields from backend
  registrationSource?: "SELF" | "ADMIN" | "IMPORT";
  registeredBy?: number;
  overrideUsed?: boolean;
  overrideReason?: string;
  tokenNumber?: number;
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
  poojaTypeId: undefined as number | undefined,
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
  timeSlotConfig: [] as TimeSlotEntry[],
  fee: "501",
  isFree: true,
  needsRegistration: true,
  items: ["Coconut", "Flowers", "Bananas"],
  notes: "",
};


const emptyRegForm = {
  participantName: "",
  attendingDevotees: "",
  gotram: "",
  devoteeCount: 1,
  phone: "",
  email: "",
  eventDate: "",
  eventTime: "",
  venue: "",
  bookingFee: 0,
  paymentStatus: "PAID",
  status: "CONFIRMED",
  notes: "",
  overrideReason: "",
  targetUserId: undefined as number | undefined,
};

export function EventsPoojaSeva() {
  const { useMock } = useEventMock();
  const [poojaSevas, setPoojaSevas] = useState<PoojaSeva[]>([]);
  const [registrations, setRegistrations] = useState<BookingRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [expandedPoojaId, setExpandedPoojaId] = useState<number | null>(null);

  // Pooja Seva Create / Edit modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPoojaId, setEditingPoojaId] = useState<number | null>(null);
  const [poojaForm, setPoojaForm] = useState(emptyPoojaForm);
  const [poojaTypes, setPoojaTypes] = useState<string[]>(DEFAULT_POOJA_TYPES);
  const [poojaTypeObjects, setPoojaTypeObjects] = useState<{ id: number; name: string; description?: string }[]>([]);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // New Pooja Type creation modal state
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDesc, setNewTypeDesc] = useState("");
  const [addingType, setAddingType] = useState(false);
  const [addTypeError, setAddTypeError] = useState("");

  // Admin Registration Management state
  const [showRegModal, setShowRegModal] = useState(false);
  const [editingReg, setEditingReg] = useState<BookingRegistration | null>(null);
  const [selectedPoojaForReg, setSelectedPoojaForReg] = useState<PoojaSeva | null>(null);
  const [regForm, setRegForm] = useState(emptyRegForm);
  const [regFormError, setRegFormError] = useState("");
  const [savingReg, setSavingReg] = useState(false);
  const [regSelectedScheduleId, setRegSelectedScheduleId] = useState<number | null>(null);
  const [regSchedulesLoading, setRegSchedulesLoading] = useState(false);
  const [regSchedules, setRegSchedules] = useState<PoojaScheduleDto[]>([]);

  // Participants panel state (per registration row)
  const [expandedParticipantRegId, setExpandedParticipantRegId] = useState<number | null>(null);
  const [participantsByRegId, setParticipantsByRegId] = useState<Record<number, any[]>>({});
  const [participantsLoading, setParticipantsLoading] = useState<Record<number, boolean>>({});

  const loadParticipants = (regId: number) => {
    if (participantsByRegId[regId] !== undefined) return; // already fetched
    setParticipantsLoading(prev => ({ ...prev, [regId]: true }));
    eventService.getPoojaRegistrationParticipants(regId)
      .then(rows => setParticipantsByRegId(prev => ({ ...prev, [regId]: rows || [] })))
      .catch(() => setParticipantsByRegId(prev => ({ ...prev, [regId]: [] })))
      .finally(() => setParticipantsLoading(prev => ({ ...prev, [regId]: false })));
  };

  // Admin user-search state (for admin-create flow)
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [selectedTargetUser, setSelectedTargetUser] = useState<UserSearchResult | null>(null);

  // Per-pooja search and status filter state
  const [regSearch, setRegSearch] = useState<Record<number, string>>({});
  const [regFilterStatus, setRegFilterStatus] = useState<Record<number, string>>({});

  // Schedule management state
  const [expandedSchedulesPoojaId, setExpandedSchedulesPoojaId] = useState<number | null>(null);
  const [schedulesPerPooja, setSchedulesPerPooja] = useState<Record<number, PoojaScheduleDto[]>>({});
  const [schedulesLoading, setSchedulesLoading] = useState<Record<number, boolean>>({});
  const [showAddScheduleForm, setShowAddScheduleForm] = useState<number | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const emptyScheduleForm = { scheduleDate: "", startTime: "08:30", endTime: "10:00", familyCapacity: 10, devoteeCapacity: 30 };
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [scheduleEditForm, setScheduleEditForm] = useState(emptyScheduleForm);
  const [savingScheduleEdit, setSavingScheduleEdit] = useState(false);

  // #20: Reservations panel state per schedule slot
  const [expandedReservationsScheduleId, setExpandedReservationsScheduleId] = useState<number | null>(null);
  const [reservationsBySchedule, setReservationsBySchedule] = useState<Record<number, any[]>>({});

  const loadReservationsForSchedule = (scheduleId: number) => {
    eventService.getScheduleReservations(scheduleId).then(res => {
      setReservationsBySchedule(prev => ({ ...prev, [scheduleId]: res || [] }));
    }).catch(() => {
      setReservationsBySchedule(prev => ({ ...prev, [scheduleId]: [] }));
    });
  };

  // Confirmation modals
  const [deleteConfirmReg, setDeleteConfirmReg] = useState<BookingRegistration | null>(null);
  const [cancelConfirmReg, setCancelConfirmReg] = useState<BookingRegistration | null>(null);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    eventService.getAll().then(evts => {
      const safeEvts = Array.isArray(evts) ? evts : Array.isArray((evts as any)?.content) ? (evts as any).content : [];
      setEvents(safeEvts);
    }).catch(() => {
      setEvents([]);
    });
  }, []);

  const loadData = () => {
    if (useMock) {
      setPoojaSevas(mockPoojaSevas);
      setRegistrations(mockRegistrations);
      return;
    }
    setLoading(true);
    setError("");
    Promise.all([
      eventService.getPoojaSevas().catch(() => []),
      eventService.getAllRegistrations().catch(() => []),
      eventService.getPoojaTypes().catch(() => []),
    ])
      .then(([sevas, regs, types]) => {
        const safeSevas = Array.isArray(sevas) ? sevas : Array.isArray((sevas as any)?.content) ? (sevas as any).content : Array.isArray((sevas as any)?.data) ? (sevas as any).data : [];
        setPoojaSevas(safeSevas);
        const safeTypes = Array.isArray(types) ? types : Array.isArray((types as any)?.content) ? (types as any).content : [];
        if (safeTypes.length > 0) {
          setPoojaTypeObjects(safeTypes);
          setPoojaTypes(safeTypes.map((t: any) => t.name));
        }
        const safeRegs = Array.isArray(regs) ? regs : Array.isArray((regs as any)?.content) ? (regs as any).content : Array.isArray((regs as any)?.data) ? (regs as any).data : [];
        const poojaRegs = safeRegs
          .filter((r: any) => {
            if (!r) return false;
            const cat = String(r.category || "").toLowerCase();
            const actId = String(r.activityId || "");
            const title = String(r.activityTitle || r.poojaSlotName || r.eventName || "").toLowerCase().trim();
            return (
              cat === "pooja" ||
              cat === "seva" ||
              cat.includes("pooja") ||
              cat.includes("seva") ||
              actId.startsWith("pooja-") ||
              Boolean(r.poojaSlotName) ||
              Boolean(r.poojaSevaId) ||
              Boolean(r.poojaId) ||
              Boolean(r.poojaSevaTimeSlotsId) ||
              safeSevas.some((s: any) => s.name && s.name.toLowerCase().trim() === title)
            );
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
            return {
              ...r,
              devoteeCount: count,
              status: String(r.status || "CONFIRMED").toUpperCase(),
              paymentStatus: String(r.paymentStatus || "PAID").toUpperCase(),
            };
          });
        setRegistrations(poojaRegs);
        if (safeTypes.length > 0) setPoojaTypes(safeTypes.map((t: any) => t.name));
      })
      .catch(e => {
        setError(e?.message || "Failed to load pooja data from database");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    window.addEventListener("mana_activities_updated", loadData);
    window.addEventListener("mana_schedule_updated", loadData);
    window.addEventListener("mana_event_created", loadData);
    window.addEventListener("mana_event_updated", loadData);
    window.addEventListener("mana_event_registration_updated", loadData);
    return () => {
      window.removeEventListener("mana_activities_updated", loadData);
      window.removeEventListener("mana_schedule_updated", loadData);
      window.removeEventListener("mana_event_created", loadData);
      window.removeEventListener("mana_event_updated", loadData);
      window.removeEventListener("mana_event_registration_updated", loadData);
    };
  }, [useMock]);

  const matchesPooja = (r: BookingRegistration, pooja: PoojaSeva): boolean => {
    if (!r || !pooja) return false;
    const poojaIdStr = String(pooja.id ?? "").trim();
    const poojaName = (pooja.name || "").trim().toLowerCase();

    // 1. Direct ID matching
    if (r.activityId === `pooja-${poojaIdStr}` || String(r.activityId) === poojaIdStr) return true;
    if (r.poojaId != null && String(r.poojaId) === poojaIdStr) return true;
    if (r.poojaSevaId != null && String(r.poojaSevaId) === poojaIdStr) return true;
    if (r.scheduleId != null && String(r.scheduleId) === poojaIdStr) return true;
    if ((r as any).eventId != null && String((r as any).eventId) === poojaIdStr) return true;

    // 2. Title / Name matching (case-insensitive & trimmed)
    const actTitle = (r.activityTitle || "").trim().toLowerCase();
    const slotName = (r.poojaSlotName || "").trim().toLowerCase();
    const evName = ((r as any).eventName || "").trim().toLowerCase();
    if (poojaName && (actTitle === poojaName || slotName === poojaName || evName === poojaName)) return true;

    // 3. Time slot ID matching
    if (r.poojaSevaTimeSlotsId && Array.isArray(pooja.timeSlotConfig)) {
      if (pooja.timeSlotConfig.some(ts => ts.id != null && String(ts.id) === String(r.poojaSevaTimeSlotsId))) {
        return true;
      }
    }

    return false;
  };

  const getRegistrationsForPooja = (pooja: PoojaSeva) => {
    const safeRegs = Array.isArray(registrations) ? registrations : [];
    const raw = useMock
      ? safeRegs.filter(r => r.activityId === `pooja-${pooja.id}`)
      : safeRegs.filter(r => matchesPooja(r, pooja));

    const searchQ = (regSearch[pooja.id] || "").toLowerCase().trim();
    const filterSt = regFilterStatus[pooja.id] || "ALL";

    return raw.filter(r => {
      const matchSearch =
        !searchQ ||
        (r.participantName && r.participantName.toLowerCase().includes(searchQ)) ||
        (r.gotram && r.gotram.toLowerCase().includes(searchQ)) ||
        (r.regCode && r.regCode.toLowerCase().includes(searchQ)) ||
        (r.phone && r.phone.includes(searchQ));

      const matchStatus =
        filterSt === "ALL" ||
        (filterSt === "CONFIRMED" && r.status === "CONFIRMED") ||
        (filterSt === "PENDING" && r.status === "PENDING") ||
        (filterSt === "CANCELLED" && (r.status === "CANCELLED" || r.status === "REJECTED"));

      return matchSearch && matchStatus;
    });
  };

  const activeEvents = (Array.isArray(events) ? events : []).filter(ev => {
    const s = String(ev?.status || "").toUpperCase();
    return s !== "CANCELLED" && s !== "CLOSED" && s !== "ARCHIVED";
  });

  const openCreateModal = () => {
    setEditingPoojaId(null);
    setPoojaForm({ ...emptyPoojaForm, mainEventId: activeEvents.length > 0 ? String(activeEvents[0].id) : "" });
    setFormError("");
    setShowCreateModal(true);
  };

  const openEditModal = (p: PoojaSeva) => {
    const pAny = p as any;
    const parentId = pAny.mainEventId ? String(pAny.mainEventId) : pAny.eventId ? String(pAny.eventId) : "";
    const matchedTypeId = p.poojaTypeId || poojaTypeObjects.find(t => t.name.toLowerCase() === (p.type || "").toLowerCase())?.id;
    setEditingPoojaId(p.id);
    setPoojaForm({
      mainEventId: parentId,
      poojaTypeId: matchedTypeId,
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
      timeSlotConfig: p.timeSlotConfig || [],
      fee: String(p.fee || 0),
      isFree: p.isFree || false,
      needsRegistration: p.needsRegistration !== undefined && p.needsRegistration !== null ? Boolean(p.needsRegistration) : true,
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
    if (poojaForm.isMultiDay && !poojaForm.endDate) {
      setFormError("End date is required for multi-day pooja / seva.");
      return;
    }
    if (poojaForm.isMultiDay && poojaForm.endDate && poojaForm.date && poojaForm.endDate < poojaForm.date) {
      setFormError(`End date (${poojaForm.endDate}) cannot be earlier than start date (${poojaForm.date}).`);
      return;
    }

    const matchedTypeId = poojaForm.poojaTypeId || poojaTypeObjects.find(t => t.name.toLowerCase() === poojaForm.type.toLowerCase())?.id;
    const validStartTimes = poojaForm.startTimes.filter(Boolean);
    const calculatedTotalSlots = poojaForm.isMultiDay && poojaForm.timeSlotConfig.length > 0
      ? poojaForm.timeSlotConfig.reduce((acc, curr) => acc + (Number(curr.slotCount) || 0), 0)
      : poojaForm.slots ? Number(poojaForm.slots) : 20;

    const payload = {
      mainEventId: poojaForm.mainEventId || undefined,
      poojaTypeId: matchedTypeId,
      name: poojaForm.name,
      type: poojaForm.type,
      date: poojaForm.date,
      endDate: poojaForm.isMultiDay && poojaForm.endDate ? poojaForm.endDate : undefined,
      multiDay: poojaForm.isMultiDay,
      startTime: validStartTimes[0] || poojaForm.startTime,
      duration: poojaForm.duration ? Number(poojaForm.duration) : undefined,
      mandap: poojaForm.mandap || undefined,
      pandit: poojaForm.pandit || undefined,
      slots: calculatedTotalSlots,
      timeSlotConfig: poojaForm.timeSlotConfig.length > 0
        ? poojaForm.timeSlotConfig.map(e => ({
            slotDate: e.slotDate || null,
            startTime: e.startTime,
            endTime: e.endTime?.trim() || undefined,
            title: e.title?.trim() || undefined,
            slotCount: Number(e.slotCount) || 20,
          }))
        : undefined,
      fee: poojaForm.isFree ? 0 : Number(poojaForm.fee || 0),
      isFree: poojaForm.isFree,
      needsRegistration: poojaForm.needsRegistration !== false,
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
        toast.success("Pooja updated successfully");
      } else {
        if (useMock) {
          const newPooja: PoojaSeva = { id: Date.now(), ...payload, fee: payload.fee, duration: payload.duration, slots: payload.slots } as PoojaSeva;
          setPoojaSevas(prev => [newPooja, ...prev]);
        } else {
          const resp = await eventService.createPoojaSeva(payload);
          setPoojaSevas(prev => [resp, ...prev]);
        }
        toast.success("Pooja created successfully");
      }
      setShowCreateModal(false);
      setEditingPoojaId(null);
      setPoojaForm(emptyPoojaForm);
    } catch (err: any) {
      setFormError(err?.message || "Failed to save pooja");
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePoojaType = async () => {
    if (!newTypeName.trim()) {
      setAddTypeError("Please enter a valid Pooja Type name.");
      return;
    }
    const clean = newTypeName.trim();
    try {
      setAddingType(true);
      setAddTypeError("");
      let createdType: { id: number; name: string; description?: string } | null = null;
      if (!useMock) {
        createdType = await eventService.createPoojaType(clean, newTypeDesc.trim() || undefined);
      } else {
        createdType = { id: Date.now(), name: clean, description: newTypeDesc.trim() || undefined };
      }
      if (createdType) {
        setPoojaTypeObjects(prev => [...prev.filter(t => t.name.toLowerCase() !== clean.toLowerCase()), createdType!]);
      }
      setPoojaTypes(prev => (prev.includes(clean) ? prev : [...prev, clean]));
      set("type", clean);
      if (createdType?.id) {
        set("poojaTypeId", createdType.id);
      }
      setNewTypeName("");
      setNewTypeDesc("");
      setShowAddTypeModal(false);
      toast.success(`Pooja Type "${clean}" created in database!`);
    } catch (err: any) {
      setAddTypeError(err?.message || "Failed to create pooja type in database");
    } finally {
      setAddingType(false);
    }
  };

  const handleDelete = async (p: PoojaSeva) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    if (useMock) {
      setPoojaSevas(prev => prev.filter(x => x.id !== p.id));
      toast.success("Pooja deleted");
      return;
    }
    try {
      await eventService.deletePoojaSeva(p.id);
      setPoojaSevas(prev => prev.filter(x => x.id !== p.id));
      toast.success("Pooja deleted successfully");
    } catch (err: any) {
      setError(err?.message || "Failed to delete pooja");
    }
  };

  /* ─── Schedule Management ─── */
  const loadSchedulesForPooja = async (poojaId: number) => {
    setSchedulesLoading(prev => ({ ...prev, [poojaId]: true }));
    try {
      const schedules = await eventService.getSchedulesByPooja(poojaId);
      setSchedulesPerPooja(prev => ({ ...prev, [poojaId]: schedules || [] }));
    } catch {
      setSchedulesPerPooja(prev => ({ ...prev, [poojaId]: [] }));
    } finally {
      setSchedulesLoading(prev => ({ ...prev, [poojaId]: false }));
    }
  };

  const toggleSchedulesPanel = (poojaId: number) => {
    if (expandedSchedulesPoojaId === poojaId) {
      setExpandedSchedulesPoojaId(null);
      setShowAddScheduleForm(null);
    } else {
      setExpandedSchedulesPoojaId(poojaId);
      setShowAddScheduleForm(null);
      setScheduleForm(emptyScheduleForm);
      loadSchedulesForPooja(poojaId);
    }
  };

  const handleSaveSchedule = async (poojaId: number) => {
    if (!scheduleForm.scheduleDate || !scheduleForm.startTime || !scheduleForm.endTime) return;
    setSavingSchedule(true);
    try {
      const created = await eventService.createPoojaSchedule({
        poojaId,
        scheduleDate: scheduleForm.scheduleDate,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        familyCapacity: Number(scheduleForm.familyCapacity) || 10,
        devoteeCapacity: Number(scheduleForm.devoteeCapacity) || 30,
      });
      setSchedulesPerPooja(prev => ({
        ...prev,
        [poojaId]: [...(prev[poojaId] || []), created].sort((a, b) =>
          a.scheduleDate.localeCompare(b.scheduleDate) || a.startTime.localeCompare(b.startTime)
        ),
      }));
      setShowAddScheduleForm(null);
      setScheduleForm(emptyScheduleForm);
      toast.success("Schedule created successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create schedule");
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleSaveScheduleEdit = async (poojaId: number, scheduleId: number) => {
    if (!scheduleEditForm.scheduleDate || !scheduleEditForm.startTime || !scheduleEditForm.endTime) {
      toast.error("Please fill in date, start time, and end time");
      return;
    }
    setSavingScheduleEdit(true);
    try {
      const updated = await eventService.updatePoojaSchedule(scheduleId, {
        scheduleDate: scheduleEditForm.scheduleDate,
        startTime: scheduleEditForm.startTime,
        endTime: scheduleEditForm.endTime,
        familyCapacity: Number(scheduleEditForm.familyCapacity) || 10,
        devoteeCapacity: Number(scheduleEditForm.devoteeCapacity) || 30,
      });
      setSchedulesPerPooja(prev => ({
        ...prev,
        [poojaId]: (prev[poojaId] || []).map(s => s.id === scheduleId ? updated : s),
      }));
      setEditingScheduleId(null);
      toast.success("Schedule slot updated successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update schedule");
    } finally {
      setSavingScheduleEdit(false);
    }
  };

  const handleScheduleStatusChange = async (poojaId: number, scheduleId: number, newStatus: string) => {
    try {
      const updated = await eventService.updatePoojaScheduleStatus(scheduleId, newStatus);
      setSchedulesPerPooja(prev => ({
        ...prev,
        [poojaId]: (prev[poojaId] || []).map(s => s.id === scheduleId ? updated : s),
      }));
      toast.success(`Schedule status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  const handleDeleteSchedule = async (poojaId: number, schedule: PoojaScheduleDto) => {
    if (!confirm(`Delete schedule on ${schedule.scheduleDate} at ${schedule.startTime}?`)) return;
    try {
      await eventService.deletePoojaSchedule(schedule.id);
      setSchedulesPerPooja(prev => ({
        ...prev,
        [poojaId]: (prev[poojaId] || []).filter(s => s.id !== schedule.id),
      }));
      toast.success("Schedule deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete schedule");
    }
  };

  /* ─── Admin Registration Actions (Add, Edit, Cancel, Delete) ─── */
  const fetchRegSchedules = (pooja: PoojaSeva) => {
    setRegSchedules([]);
    setRegSelectedScheduleId(null);
    setRegSchedulesLoading(true);
    eventService.getSchedulesByPooja(pooja.id)
      .then(s => setRegSchedules(Array.isArray(s) ? s : []))
      .catch(() => setRegSchedules([]))
      .finally(() => setRegSchedulesLoading(false));
  };

  const handleOpenAddReg = (pooja: PoojaSeva) => {
    setSelectedPoojaForReg(pooja);
    setEditingReg(null);
    setRegSelectedScheduleId(null);
    setRegForm({
      ...emptyRegForm,
      eventDate: pooja.date,
      eventTime: pooja.startTimes?.[0] || pooja.startTime || "08:30 AM",
      venue: pooja.mandap || "Main Temple Mandap",
      bookingFee: pooja.isFree ? 0 : Number(pooja.fee || 0),
      paymentStatus: pooja.isFree ? "FREE" : "PAID",
      status: "CONFIRMED",
    });
    setRegFormError("");
    setShowRegModal(true);
    fetchRegSchedules(pooja);
  };

  const handleOpenEditReg = (pooja: PoojaSeva, reg: BookingRegistration) => {
    setSelectedPoojaForReg(pooja);
    setEditingReg(reg);
    setRegSelectedScheduleId(reg.scheduleId ?? null);
    setRegForm({
      participantName: reg.participantName || "",
      attendingDevotees: reg.attendingDevotees || "",
      gotram: reg.gotram || "",
      devoteeCount: reg.devoteeCount || 1,
      phone: reg.phone || "",
      email: reg.email || "",
      eventDate: reg.poojaSlotDate || reg.eventDate || pooja.date,
      eventTime: reg.poojaSlotTime || reg.eventTime || pooja.startTimes?.[0] || pooja.startTime || "",
      venue: reg.venue || pooja.mandap || "Main Temple Mandap",
      bookingFee: Number(reg.bookingFee || 0),
      paymentStatus: reg.paymentStatus || "PAID",
      status: reg.status || "CONFIRMED",
      notes: reg.notes || "",
      overrideReason: "",
      targetUserId: undefined,
    });
    setRegFormError("");
    setShowRegModal(true);
    fetchRegSchedules(pooja);
  };

  const handleUserSearch = async (q: string) => {
    setUserSearchQuery(q);
    if (!q.trim() || q.trim().length < 2) { setUserSearchResults([]); return; }
    setUserSearchLoading(true);
    try {
      const results = await eventService.searchCommunityUsers(q.trim());
      setUserSearchResults(results || []);
    } catch {
      setUserSearchResults([]);
    } finally {
      setUserSearchLoading(false);
    }
  };

  const handleSaveRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoojaForReg) return;
    if (!regForm.participantName.trim()) {
      setRegFormError("Devotee / Participant Name is required");
      return;
    }
    if (!editingReg && !regForm.targetUserId && !selectedTargetUser) {
      setRegFormError("Please select a member to register on their behalf");
      return;
    }

    const slotDate = regForm.eventDate || selectedPoojaForReg.date;
    const slotTime = regForm.eventTime || selectedPoojaForReg.startTime || "";
    const payload = {
      // Legacy / local-state fields (used for mock and immediate UI update)
      activityId: `pooja-${selectedPoojaForReg.id}`,
      activityTitle: selectedPoojaForReg.name,
      category: "Pooja",
      eventDate: slotDate,
      eventTime: slotTime,
      // Correct backend entity field names (what actually gets persisted)
      poojaSlotName: selectedPoojaForReg.name,
      poojaSlotDate: slotDate,
      poojaSlotTime: slotTime,
      participantName: regForm.participantName.trim(),
      attendingDevotees: regForm.attendingDevotees.trim() || undefined,
      gotram: regForm.gotram.trim() || undefined,
      devoteeCount: Math.max(1, Number(regForm.devoteeCount) || 1),
      phone: regForm.phone.trim() || undefined,
      email: regForm.email.trim() || undefined,
      venue: regForm.venue || selectedPoojaForReg.mandap || "Main Temple Mandap",
      bookingFee: Number(regForm.bookingFee) || 0,
      paymentStatus: regForm.paymentStatus,
      status: regForm.status,
      notes: regForm.notes.trim() || undefined,
      targetUserId: regForm.targetUserId ?? selectedTargetUser?.id,
      overrideReason: regForm.overrideReason?.trim() || undefined,
      ...(regSelectedScheduleId ? { scheduleId: regSelectedScheduleId } : {}),
    };

    setSavingReg(true);
    setRegFormError("");

    try {
      if (editingReg) {
        if (useMock) {
          setRegistrations(prev =>
            prev.map(r => (r.id === editingReg.id ? { ...r, ...payload } : r))
          );
        } else {
          const updated = await eventService.updatePoojaRegistration(editingReg.id, payload as any);
          setRegistrations(prev =>
            prev.map(r => (r.id === editingReg.id ? { ...r, ...updated, ...payload } : r))
          );
        }
        toast.success(`Registration updated for ${regForm.participantName}`);
      } else {
        if (useMock) {
          const newReg: BookingRegistration = {
            id: Date.now(),
            regCode: `POOJA-${Math.floor(1000 + Math.random() * 9000)}`,
            ...payload,
            createdAt: new Date().toISOString(),
          };
          setRegistrations(prev => [newReg, ...prev]);
        } else {
          const created = await eventService.adminCreateRegistration(payload);
          setRegistrations(prev => [
            {
              id: created.id || Date.now(),
              regCode: created.regCode || `POOJA-${created.id || 'REG'}`,
              ...payload,
              // Ensure backend-returned fields override the payload so matchesPooja works post-create
              poojaSlotName: created.poojaSlotName || payload.poojaSlotName,
              poojaSlotDate: created.poojaSlotDate || payload.poojaSlotDate,
              poojaSlotTime: created.poojaSlotTime || payload.poojaSlotTime,
              poojaSevaTimeSlotsId: created.poojaSevaTimeSlotsId,
              scheduleId: created.scheduleId ?? (regSelectedScheduleId ?? undefined),
              createdAt: created.createdAt || new Date().toISOString(),
            },
            ...prev,
          ]);
        }
        toast.success(`Devotee registration added for ${regForm.participantName}`);
      }
      setShowRegModal(false);
      setEditingReg(null);
      setSelectedPoojaForReg(null);
      setRegForm(emptyRegForm);
      setRegSelectedScheduleId(null);
      setRegSchedules([]);
      setSelectedTargetUser(null);
      setUserSearchQuery("");
      setUserSearchResults([]);
      window.dispatchEvent(new CustomEvent("mana_event_registration_updated"));
    } catch (err: any) {
      setRegFormError(err?.message || "Failed to save registration");
    } finally {
      setSavingReg(false);
    }
  };

  const handleConfirmCancelRegistration = async () => {
    if (!cancelConfirmReg) return;
    setProcessingAction(true);
    try {
      if (useMock) {
        setRegistrations(prev =>
          prev.map(r => (r.id === cancelConfirmReg.id ? { ...r, status: "CANCELLED" } : r))
        );
      } else {
        await eventService.cancelRegistration(cancelConfirmReg.id);
        setRegistrations(prev =>
          prev.map(r => (r.id === cancelConfirmReg.id ? { ...r, status: "CANCELLED" } : r))
        );
      }
      toast.success(`Registration cancelled for ${cancelConfirmReg.participantName}`);
      setCancelConfirmReg(null);
      window.dispatchEvent(new CustomEvent("mana_event_registration_updated"));
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel registration");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleConfirmDeleteRegistration = async () => {
    if (!deleteConfirmReg) return;
    setProcessingAction(true);
    try {
      if (useMock) {
        setRegistrations(prev => prev.filter(r => r.id !== deleteConfirmReg.id));
      } else {
        await eventService.deleteRegistrationPermanent(deleteConfirmReg.id);
        setRegistrations(prev => prev.filter(r => r.id !== deleteConfirmReg.id));
      }
      toast.success(`Registration permanently deleted for ${deleteConfirmReg.participantName}`);
      setDeleteConfirmReg(null);
      window.dispatchEvent(new CustomEvent("mana_event_registration_updated"));
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete registration");
    } finally {
      setProcessingAction(false);
    }
  };

  const set = (k: string, v: any) => setPoojaForm(f => ({ ...f, [k]: v }));

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

  const getDayRange = (startDate: string, endDate: string): string[] => {
    if (!startDate) return [];
    if (!endDate || endDate === startDate) return [startDate];
    const days: string[] = [];
    const [sy, sm, sd] = startDate.split("-").map(Number);
    const [ey, em, ed] = endDate.split("-").map(Number);
    if (!sy || !sm || !sd || !ey || !em || !ed) return [startDate];
    const cur = new Date(sy, sm - 1, sd, 12, 0, 0);
    const end = new Date(ey, em - 1, ed, 12, 0, 0);
    let limit = 0;
    while (cur <= end && limit < 60) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, "0");
      const d = String(cur.getDate()).padStart(2, "0");
      days.push(`${y}-${m}-${d}`);
      cur.setDate(cur.getDate() + 1);
      limit++;
    }
    return days;
  };

  const updateTimeSlotCount = (slotDate: string | null, startTime: string, slotCount: number) => {
    setPoojaForm(f => ({
      ...f,
      timeSlotConfig: f.timeSlotConfig.map(e =>
        e.slotDate === slotDate && e.startTime === startTime ? { ...e, slotCount } : e
      ),
    }));
  };

  const updateTimeSlotTitle = (slotDate: string | null, startTime: string, title: string) => {
    setPoojaForm(f => ({
      ...f,
      timeSlotConfig: f.timeSlotConfig.map(e =>
        e.slotDate === slotDate && e.startTime === startTime ? { ...e, title } : e
      ),
    }));
  };

  const updateTimeSlotEndTime = (slotDate: string | null, startTime: string, endTime: string) => {
    setPoojaForm(f => ({
      ...f,
      timeSlotConfig: f.timeSlotConfig.map(e =>
        e.slotDate === slotDate && e.startTime === startTime ? { ...e, endTime } : e
      ),
    }));
  };

  const updateTimeSlotStatus = (slotDate: string | null, startTime: string, status: "OPEN" | "BLOCKED" | "CLOSED") => {
    setPoojaForm(f => ({
      ...f,
      timeSlotConfig: f.timeSlotConfig.map(e =>
        e.slotDate === slotDate && e.startTime === startTime ? { ...e, status } : e
      ),
    }));
  };

  const handlePersistSlotStatus = async (slot: TimeSlotEntry, status: "OPEN" | "BLOCKED" | "CLOSED") => {
    updateTimeSlotStatus(slot.slotDate, slot.startTime, status);
    if (!slot.id || useMock) return;
    try {
      await eventService.updatePoojaTimeSlotStatus(slot.id, status);
      toast.success(`Slot ${slot.startTime} marked ${status}`);
    } catch {
      toast.error("Failed to update slot status — reload to retry");
    }
  };

  // Sync timeSlotConfig when times, dates, or multiDay toggle changes
  const startTimesKey = poojaForm.startTimes.filter(Boolean).join(",");
  useEffect(() => {
    const times = poojaForm.startTimes.filter(Boolean);
    if (times.length === 0) { set("timeSlotConfig", []); return; }

    if (poojaForm.isMultiDay) {
      const range = getDayRange(poojaForm.date, poojaForm.endDate);
      if (range.length === 0) { set("timeSlotConfig", []); return; }
      setPoojaForm(f => {
        const existing = f.timeSlotConfig;
        const defaultCount = Number(f.slots) || 20;
        const synced: TimeSlotEntry[] = [];
        for (const date of range) {
          for (const time of times) {
            const found = existing.find(e => e.slotDate === date && e.startTime === time);
            synced.push(found ?? { slotDate: date, startTime: time, endTime: "", title: "", slotCount: defaultCount });
          }
        }
        return { ...f, timeSlotConfig: synced };
      });
    } else {
      setPoojaForm(f => {
        const existing = f.timeSlotConfig;
        const defaultCount = Number(f.slots) || 20;
        const synced: TimeSlotEntry[] = times.map(time => {
          const found = existing.find(e => e.slotDate === null && e.startTime === time);
          return found ?? { slotDate: null, startTime: time, endTime: "", title: "", slotCount: defaultCount };
        });
        return { ...f, timeSlotConfig: synced };
      });
    }
  }, [poojaForm.isMultiDay, poojaForm.date, poojaForm.endDate, startTimesKey]);

  const activeRegistrations = (Array.isArray(registrations) ? registrations : []).filter(r => r.status !== "CANCELLED" && r.status !== "REJECTED");
  const totalRegisteredDevotees = activeRegistrations.reduce((a, r) => a + (r.devoteeCount || 1), 0);

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" /> Pooja &amp; Seva Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage temple rituals, devotee registrations, slots, and bookings</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-all shadow-sm cursor-pointer"
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
          { label: "Total Poojas", value: (Array.isArray(poojaSevas) ? poojaSevas : []).length, color: "#f59e0b" },
          { label: "Active Registrations", value: activeRegistrations.length, color: "#6366f1" },
          { label: "Total Devotees", value: totalRegisteredDevotees, color: "#10b981" },
          { label: "Paid Bookings", value: activeRegistrations.filter(r => r.paymentStatus === "PAID").length, color: "#0891b2" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-2.5 sm:p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center">
            <p className="text-lg sm:text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 sm:mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pooja List with expandable registrations */}
      <div className="space-y-3">
        {(Array.isArray(poojaSevas) ? poojaSevas : []).map(pooja => {
          const regs = getRegistrationsForPooja(pooja);
          const safeRegs = Array.isArray(registrations) ? registrations : [];
          const rawPoojaRegs = useMock
            ? safeRegs.filter(r => r.activityId === `pooja-${pooja.id}`)
            : safeRegs.filter(r => matchesPooja(r, pooja));
          const isExpanded = expandedPoojaId === pooja.id;
          const activeRegsForPooja = rawPoojaRegs.filter(r => r.status !== "CANCELLED" && r.status !== "REJECTED");
          const totalDevotees = activeRegsForPooja.reduce((a, r) => a + (r.devoteeCount || 1), 0);

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
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">{pooja.type}</span>
                          {pooja.needsRegistration === false ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Sparkles className="w-2.5 h-2.5" /> Open to All
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Ticket className="w-2.5 h-2.5" /> Pass Required
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenAddReg(pooja)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
                          title="Add devotee registration"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Add Devotee</span>
                        </button>
                        <button
                          onClick={() => toggleSchedulesPanel(pooja.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer border ${
                            expandedSchedulesPoojaId === pooja.id
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                          }`}
                          title="Manage booking schedules"
                        >
                          <CalendarDays className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Schedules</span>
                          {(schedulesPerPooja[pooja.id]?.length ?? 0) > 0 && (
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${expandedSchedulesPoojaId === pooja.id ? "bg-white/25 text-white" : "bg-indigo-100 text-indigo-700"}`}>
                              {schedulesPerPooja[pooja.id].length}
                            </span>
                          )}
                        </button>
                        <button onClick={() => openEditModal(pooja)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer" title="Edit Pooja">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(pooja)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer" title="Delete Pooja">
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
                          {Array.isArray(pooja.timeSlotConfig) && pooja.timeSlotConfig.length > 0
                            ? [...new Set(pooja.timeSlotConfig.map((c: any) => c.startTime).filter(Boolean))].join(", ")
                            : pooja.startTime}
                          {pooja.duration ? ` (${pooja.duration}m)` : ""}
                        </span>
                      )}
                      {pooja.mandap && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {pooja.mandap}</span>}
                      {pooja.pandit && <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {pooja.pandit}</span>}
                    </div>

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {pooja.needsRegistration === false ? (
                        <span className="text-xs font-semibold text-emerald-600">
                          <Sparkles className="w-3 h-3 inline mr-1" />Open Entry / No Pass Required
                        </span>
                      ) : pooja.slots ? (
                        <span className="text-xs font-semibold text-indigo-600">
                          <Users className="w-3 h-3 inline mr-1" />{activeRegsForPooja.length}/{pooja.slots} slots booked
                        </span>
                      ) : null}

                      <span className="text-xs font-semibold text-emerald-600">
                        {pooja.isFree ? "Free" : `₹${pooja.fee?.toLocaleString("en-IN")}`}
                      </span>
                      {pooja.items && pooja.items.length > 0 && (
                        <span className="text-[10px] text-slate-400">Samagri: {pooja.items.join(", ")}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Schedule Management Panel ── */}
                {expandedSchedulesPoojaId === pooja.id && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" /> Booking Schedules
                        <span className="text-[10px] font-normal text-slate-400">(live capacity slots for member booking)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddScheduleForm(showAddScheduleForm === pooja.id ? null : pooja.id);
                          setScheduleForm(emptyScheduleForm);
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Schedule
                      </button>
                    </div>

                    {/* Add Schedule Form */}
                    {showAddScheduleForm === pooja.id && (
                      <div className="bg-indigo-50/50 border border-indigo-200/60 rounded-xl p-3 space-y-2.5">
                        <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">New Schedule Entry</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          <label className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-slate-600">Date *</span>
                            <input
                              type="date"
                              value={scheduleForm.scheduleDate}
                              onChange={e => setScheduleForm(prev => ({ ...prev, scheduleDate: e.target.value }))}
                              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                            />
                          </label>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-slate-600">Start Time *</span>
                            <TimePicker
                              value={scheduleForm.startTime}
                              onChange={v => setScheduleForm(prev => ({ ...prev, startTime: v }))}
                              size="sm"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-slate-600">End Time *</span>
                            <TimePicker
                              value={scheduleForm.endTime}
                              onChange={v => setScheduleForm(prev => ({ ...prev, endTime: v }))}
                              size="sm"
                            />
                          </div>
                          <label className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-slate-600">Family Capacity</span>
                            <input
                              type="number"
                              min="1"
                              value={scheduleForm.familyCapacity}
                              onChange={e => setScheduleForm(prev => ({ ...prev, familyCapacity: Number(e.target.value) || 10 }))}
                              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-slate-600">Devotee Capacity</span>
                            <input
                              type="number"
                              min="1"
                              value={scheduleForm.devoteeCapacity}
                              onChange={e => setScheduleForm(prev => ({ ...prev, devoteeCapacity: Number(e.target.value) || 30 }))}
                              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                            />
                          </label>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowAddScheduleForm(null)}
                            className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={savingSchedule || !scheduleForm.scheduleDate}
                            onClick={() => handleSaveSchedule(pooja.id)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                          >
                            {savingSchedule ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            Create Schedule
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Schedule List */}
                    {schedulesLoading[pooja.id] ? (
                      <div className="flex items-center justify-center py-4 text-slate-400 text-xs gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading schedules...
                      </div>
                    ) : (schedulesPerPooja[pooja.id] || []).length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        <CalendarDays className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                        No schedules yet — click &ldquo;Add Schedule&rdquo; to create the first booking slot.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {(schedulesPerPooja[pooja.id] || []).map(sch => {
                          const statusColor: Record<string, string> = {
                            OPEN: "bg-emerald-50 text-emerald-700 border-emerald-200",
                            LIMITED: "bg-amber-50 text-amber-700 border-amber-200",
                            FULL: "bg-rose-50 text-rose-700 border-rose-200",
                            BLOCKED: "bg-slate-100 text-slate-500 border-slate-200",
                            CLOSED: "bg-slate-100 text-slate-500 border-slate-200",
                          };
                          const isEditingThis = editingScheduleId === sch.id;
                          const isResOpen = expandedReservationsScheduleId === sch.id;
                          return (
                            <div key={sch.id} className="bg-white rounded-xl border border-slate-200 px-3 py-2.5 space-y-2">
                              {isEditingThis ? (
                                <div className="space-y-2.5 bg-indigo-50/40 p-2.5 rounded-xl border border-indigo-100">
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                    <label className="flex flex-col gap-0.5">
                                      <span className="text-[10px] font-bold text-slate-600 uppercase">Date *</span>
                                      <input
                                        type="date"
                                        value={scheduleEditForm.scheduleDate}
                                        onChange={e => setScheduleEditForm(prev => ({ ...prev, scheduleDate: e.target.value }))}
                                        className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-indigo-300"
                                      />
                                    </label>
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[10px] font-bold text-slate-600 uppercase">Start Time *</span>
                                      <TimePicker
                                        value={scheduleEditForm.startTime}
                                        onChange={v => setScheduleEditForm(prev => ({ ...prev, startTime: v }))}
                                        size="sm"
                                      />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[10px] font-bold text-slate-600 uppercase">End Time *</span>
                                      <TimePicker
                                        value={scheduleEditForm.endTime}
                                        onChange={v => setScheduleEditForm(prev => ({ ...prev, endTime: v }))}
                                        size="sm"
                                      />
                                    </div>
                                    <label className="flex flex-col gap-0.5">
                                      <span className="text-[10px] font-bold text-slate-600 uppercase">Family Cap</span>
                                      <input
                                        type="number"
                                        min="1"
                                        value={scheduleEditForm.familyCapacity}
                                        onChange={e => setScheduleEditForm(prev => ({ ...prev, familyCapacity: Number(e.target.value) || 10 }))}
                                        className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-indigo-300"
                                      />
                                    </label>
                                    <label className="flex flex-col gap-0.5">
                                      <span className="text-[10px] font-bold text-slate-600 uppercase">Devotee Cap</span>
                                      <input
                                        type="number"
                                        min="1"
                                        value={scheduleEditForm.devoteeCapacity}
                                        onChange={e => setScheduleEditForm(prev => ({ ...prev, devoteeCapacity: Number(e.target.value) || 30 }))}
                                        className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-indigo-300"
                                      />
                                    </label>
                                  </div>
                                  <div className="flex items-center justify-end gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setEditingScheduleId(null)}
                                      className="text-xs text-slate-500 hover:text-slate-700 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      disabled={savingScheduleEdit || !scheduleEditForm.scheduleDate}
                                      onClick={() => handleSaveScheduleEdit(pooja.id, sch.id)}
                                      className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                                    >
                                      {savingScheduleEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                      Save Slot
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 flex-wrap">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                    <span className="text-xs font-bold text-slate-800">{sch.scheduleDate}</span>
                                    <Clock className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                                    <span className="text-xs text-slate-600">{sch.startTime} – {sch.endTime}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                    <span className="font-semibold text-indigo-600">{sch.availableFamilies}/{sch.familyCapacity} families</span>
                                    <span>·</span>
                                    <span className="font-semibold text-emerald-600">{sch.availableDevotees}/{sch.devoteeCapacity} devotees</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusColor[sch.status] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
                                      {sch.status}
                                    </span>
                                    <select
                                      value={sch.status}
                                      onChange={e => handleScheduleStatusChange(pooja.id, sch.id, e.target.value)}
                                      className="text-[10px] border border-slate-200 rounded-lg px-1.5 py-0.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
                                      title="Change schedule status"
                                    >
                                      <option value="OPEN">OPEN</option>
                                      <option value="LIMITED">LIMITED</option>
                                      <option value="FULL">FULL</option>
                                      <option value="BLOCKED">BLOCKED</option>
                                      <option value="CLOSED">CLOSED</option>
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingScheduleId(sch.id);
                                        setScheduleEditForm({
                                          scheduleDate: sch.scheduleDate,
                                          startTime: sch.startTime,
                                          endTime: sch.endTime,
                                          familyCapacity: sch.familyCapacity,
                                          devoteeCapacity: sch.devoteeCapacity,
                                        });
                                      }}
                                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                      title="Edit schedule slot"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    {/* #20: Reservations toggle */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setExpandedReservationsScheduleId(isResOpen ? null : sch.id);
                                        if (!isResOpen) loadReservationsForSchedule(sch.id);
                                      }}
                                      className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 px-1.5 py-0.5 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                                      title="View reservations"
                                    >
                                      <Users className="w-3 h-3" />
                                      {isResOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSchedule(pooja.id, sch)}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title="Delete schedule"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                              {/* #20: Reservations list */}
                              {isResOpen && (
                                <div className="bg-indigo-50/60 rounded-lg p-2 space-y-1.5">
                                  {(reservationsBySchedule[sch.id] || []).length === 0 ? (
                                    <p className="text-[10px] text-slate-400 italic">No reservations for this slot.</p>
                                  ) : (
                                    (reservationsBySchedule[sch.id] || []).map((r: any) => (
                                      <div key={r.id} className="flex items-center justify-between text-[10px] bg-white rounded-md px-2 py-1 border border-indigo-100">
                                        <span className="font-bold text-slate-700">#{r.tokenNumber ?? "—"} {r.userDisplayName || "Guest"}</span>
                                        <span className={`px-1.5 py-0.5 rounded font-bold ${r.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" : r.status === "RESERVED" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{r.status}</span>
                                        <span className="text-slate-400">{r.reservedDevoteeCount ?? 1} dev</span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Expand toggle for registrations */}
                <button
                  onClick={() => setExpandedPoojaId(isExpanded ? null : pooja.id)}
                  className="mt-3 flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors w-full justify-center py-2 rounded-xl hover:bg-indigo-50/80 cursor-pointer border border-transparent hover:border-indigo-100"
                >
                  <Users className="w-3.5 h-3.5" />
                  {rawPoojaRegs.length} Registration{rawPoojaRegs.length !== 1 ? "s" : ""} ({totalDevotees} active devotee{totalDevotees !== 1 ? "s" : ""})
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Expanded Registrations Table */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/40 p-3 sm:p-5 space-y-3">
                  {/* Search, Status filter & Add Devotee Toolbar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={regSearch[pooja.id] || ""}
                          onChange={e => setRegSearch(prev => ({ ...prev, [pooja.id]: e.target.value }))}
                          placeholder="Search devotee, gotram, reg code..."
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-300"
                        />
                        {regSearch[pooja.id] && (
                          <button
                            onClick={() => setRegSearch(prev => ({ ...prev, [pooja.id]: "" }))}
                            className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-700"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1 overflow-x-auto">
                        {["ALL", "CONFIRMED", "PENDING", "CANCELLED"].map(st => {
                          const currentFilter = regFilterStatus[pooja.id] || "ALL";
                          const isActive = currentFilter === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setRegFilterStatus(prev => ({ ...prev, [pooja.id]: st }))}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                                isActive
                                  ? "bg-amber-500 text-white shadow-2xs"
                                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                              }`}
                            >
                              {st === "ALL" && "All"}
                              {st === "CONFIRMED" && "Confirmed"}
                              {st === "PENDING" && "Pending"}
                              {st === "CANCELLED" && "Cancelled"}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenAddReg(pooja)}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Devotee Registration
                    </button>
                  </div>

                  {regs.length === 0 ? (
                    <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center space-y-2">
                      <Users className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-semibold text-slate-600">No registrations match your filter</p>
                      <p className="text-[11px] text-slate-400">Click &ldquo;Add Devotee Registration&rdquo; to manually book a slot for a devotee.</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              <th className="px-3 py-2.5 text-left">Reg Code</th>
                              <th className="px-3 py-2.5 text-left">Devotee Name &amp; Gotram</th>
                              <th className="px-3 py-2.5 text-left">Devotees</th>
                              <th className="px-3 py-2.5 text-left hidden md:table-cell">Slot Date / Time</th>
                              <th className="px-3 py-2.5 text-left hidden lg:table-cell">Fee / Payment</th>
                              <th className="px-3 py-2.5 text-left">Status</th>
                              <th className="px-3 py-2.5 text-right">Admin Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {regs.map(r => {
                              const isCancelled = r.status === "CANCELLED" || r.status === "REJECTED";
                              return (
                                <Fragment key={r.id}>
                                <tr className={`hover:bg-slate-50/80 transition-colors ${isCancelled ? "opacity-60 bg-rose-50/20" : ""}`}>
                                  <td className="px-3 py-2.5">
                                    <div className="font-mono font-bold text-amber-700">{r.regCode}</div>
                                    {(r as any).registrationSource === "ADMIN" && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-violet-50 text-violet-700 border border-violet-200 mt-0.5">
                                        Admin
                                      </span>
                                    )}
                                    {(r as any).overrideUsed && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-orange-50 text-orange-700 border border-orange-200 mt-0.5 ml-1">
                                        Override
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <div className="font-semibold text-slate-800">{r.participantName}</div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                                      {r.gotram && <span className="text-amber-700 font-medium bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">Gotram: {r.gotram}</span>}
                                      {r.attendingDevotees && <span className="truncate max-w-[160px]" title={r.attendingDevotees}>Family: {r.attendingDevotees}</span>}
                                      {r.phone && <span>📞 {r.phone}</span>}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                                      <User className="w-3 h-3" /> {r.devoteeCount}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-slate-600 hidden md:table-cell whitespace-nowrap">
                                    <div>{r.poojaSlotDate || r.eventDate || pooja.date}</div>
                                    <div className="text-[10px] text-slate-400">{r.poojaSlotTime || r.eventTime || pooja.startTime}</div>
                                  </td>
                                  <td className="px-3 py-2.5 hidden lg:table-cell">
                                    <div className="font-semibold text-slate-700">
                                      {r.bookingFee > 0 ? `₹${r.bookingFee.toLocaleString("en-IN")}` : "Free"}
                                    </div>
                                    <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase mt-0.5 ${
                                      r.paymentStatus === "PAID" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                      r.paymentStatus === "FREE" ? "bg-sky-50 text-sky-700 border border-sky-200" :
                                      "bg-amber-50 text-amber-700 border border-amber-200"
                                    }`}>
                                      {r.paymentStatus}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5">
                                    {(() => {
                                      const s = r.status || "CONFIRMED";
                                      const cfg: Record<string, { cls: string; icon: React.ReactNode }> = {
                                        CONFIRMED:   { cls: "bg-emerald-50 text-emerald-700 border-emerald-200",  icon: <CheckCircle2 className="w-3 h-3" /> },
                                        CHECKED_IN:  { cls: "bg-teal-50 text-teal-700 border-teal-200",          icon: <CheckCircle2 className="w-3 h-3" /> },
                                        IN_PROGRESS: { cls: "bg-blue-50 text-blue-700 border-blue-200",          icon: <RefreshCw className="w-3 h-3" /> },
                                        COMPLETED:   { cls: "bg-indigo-50 text-indigo-700 border-indigo-200",    icon: <Sparkles className="w-3 h-3" /> },
                                        RESCHEDULED: { cls: "bg-violet-50 text-violet-700 border-violet-200",    icon: <CalendarDays className="w-3 h-3" /> },
                                        PENDING:     { cls: "bg-amber-50 text-amber-700 border-amber-200",       icon: <Clock className="w-3 h-3" /> },
                                        NO_SHOW:     { cls: "bg-orange-50 text-orange-700 border-orange-200",    icon: <ShieldOff className="w-3 h-3" /> },
                                        EXPIRED:     { cls: "bg-slate-100 text-slate-500 border-slate-200",      icon: <Clock className="w-3 h-3" /> },
                                        CANCELLED:   { cls: "bg-rose-50 text-rose-700 border-rose-200",          icon: <Ban className="w-3 h-3" /> },
                                        REJECTED:    { cls: "bg-rose-50 text-rose-700 border-rose-200",          icon: <Ban className="w-3 h-3" /> },
                                      };
                                      const { cls, icon } = cfg[s] ?? { cls: "bg-amber-50 text-amber-700 border-amber-200", icon: null };
                                      return (
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
                                          {icon}{s}
                                        </span>
                                      );
                                    })()}
                                  </td>
                                  <td className="px-3 py-2.5 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      {/* Edit */}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditReg(pooja, r)}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                        title="Edit registration details"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Cancel */}
                                      {!isCancelled && (
                                        <button
                                          type="button"
                                          onClick={() => setCancelConfirmReg(r)}
                                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                          title="Cancel registration"
                                        >
                                          <Ban className="w-3.5 h-3.5" />
                                        </button>
                                      )}

                                      {/* Delete Permanent */}
                                      <button
                                        type="button"
                                        onClick={() => setDeleteConfirmReg(r)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                        title="Permanently delete registration"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Toggle participants */}
                                      <button
                                        type="button"
                                        title={expandedParticipantRegId === r.id ? "Collapse participants" : "View participants"}
                                        onClick={() => {
                                          if (expandedParticipantRegId === r.id) {
                                            setExpandedParticipantRegId(null);
                                          } else {
                                            setExpandedParticipantRegId(r.id);
                                            loadParticipants(r.id);
                                          }
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <Users className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>

                                {/* ── Participants sub-row ── */}
                                {expandedParticipantRegId === r.id && (
                                  <tr key={`${r.id}-participants`}>
                                    <td colSpan={7} className="px-4 py-2 bg-teal-50/60 border-b border-teal-100">
                                      {participantsLoading[r.id] ? (
                                        <div className="flex items-center gap-2 text-[11px] text-teal-700 py-1">
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading participants…
                                        </div>
                                      ) : (participantsByRegId[r.id] || []).length === 0 ? (
                                        <p className="text-[11px] text-slate-400 py-1">
                                          No individual participant rows yet — devotees stored in attending list above.
                                        </p>
                                      ) : (
                                        <div className="flex flex-wrap gap-2 py-1">
                                          {(participantsByRegId[r.id] || []).map((p: any, idx: number) => (
                                            <div key={p.id ?? idx} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10.5px] font-medium ${p.checkedIn ? "bg-teal-100 border-teal-300 text-teal-800" : "bg-white border-slate-200 text-slate-700"}`}>
                                              <span className="font-bold">{p.name}</span>
                                              {p.gotram && <span className="text-slate-400">· {p.gotram}</span>}
                                              {p.relation && <span className="text-slate-400">· {p.relation}</span>}
                                              {p.checkedIn
                                                ? <CheckCircle2 className="w-3 h-3 text-teal-600" />
                                                : <span className="text-slate-300">○</span>}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )}
                                </Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
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
            <p className="text-xs text-slate-400 mt-1">Click &ldquo;Create Pooja&rdquo; to add your first pooja or seva</p>
          </div>
        )}
      </div>

      {/* ── Add / Edit Devotee Registration Modal ── */}
      {showRegModal && selectedPoojaForReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    {editingReg ? "Edit Devotee Registration" : "Add Devotee Registration"}
                  </h3>
                  <p className="text-[11px] text-amber-100 truncate max-w-[260px] sm:max-w-xs">{selectedPoojaForReg.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowRegModal(false); setEditingReg(null); }}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRegistration} className="p-5 sm:p-6 space-y-3.5 overflow-y-auto flex-1 text-xs">
              {regFormError && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {regFormError}
                </div>
              )}

              {/* ── Member Search (admin picks the target user) ── */}
              {!editingReg && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Register On Behalf Of (Member) *
                  </label>
                  {selectedTargetUser ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-300 rounded-xl">
                      <User className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="flex-1 text-sm font-medium text-slate-700">
                        {selectedTargetUser.fullName || selectedTargetUser.name}
                        {selectedTargetUser.flatNo && <span className="text-slate-400 ml-1">· {selectedTargetUser.flatNo}</span>}
                      </span>
                      <button type="button" onClick={() => { setSelectedTargetUser(null); setUserSearchQuery(""); setUserSearchResults([]); }} className="p-0.5 hover:text-rose-600 text-slate-400 cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl">
                        <Search className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Search by name (min 2 chars)…"
                          value={userSearchQuery}
                          onChange={e => handleUserSearch(e.target.value)}
                          className="flex-1 text-sm outline-none bg-transparent"
                        />
                        {userSearchLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />}
                      </div>
                      {userSearchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
                          {userSearchResults.map(u => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setSelectedTargetUser(u);
                                setUserSearchQuery("");
                                setUserSearchResults([]);
                                if (!regForm.participantName) {
                                  setRegForm(prev => ({ ...prev, participantName: u.fullName || u.name || "" }));
                                }
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-amber-50 text-sm cursor-pointer"
                            >
                              <span className="font-medium">{u.fullName || u.name}</span>
                              {u.flatNo && <span className="text-slate-400 ml-1">· {u.flatNo}</span>}
                              {u.email && <span className="text-slate-400 ml-1 hidden sm:inline">· {u.email}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Devotee / Participant Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Sharma"
                  value={regForm.participantName}
                  onChange={e => setRegForm({ ...regForm, participantName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gotram
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bharadwaj"
                    value={regForm.gotram}
                    onChange={e => setRegForm({ ...regForm, gotram: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Devotee Count (Number of people)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={regForm.devoteeCount}
                    onChange={e => setRegForm({ ...regForm, devoteeCount: Number(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
              </div>

              {/* Attending Family Members field hidden per UI requirement */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={regForm.phone}
                    onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. devotee@example.com"
                    value={regForm.email}
                    onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
              </div>

              {/* Live Schedule Picker */}
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" /> Select Booking Slot
                  </p>
                  {regSelectedScheduleId && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Schedule Linked
                    </span>
                  )}
                </div>

                {regSchedulesLoading ? (
                  <div className="flex items-center justify-center py-4 text-slate-400 text-xs gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading live schedules…
                  </div>
                ) : regSchedules.length > 0 ? (
                  <>
                    <p className="text-[10px] text-amber-700">Select a live booking slot — selection links this registration to the capacity engine.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {regSchedules.map(sch => {
                        const isSelected = regSelectedScheduleId === sch.id;
                        const isUnavailable = sch.status === "BLOCKED" || sch.status === "CLOSED" || sch.status === "FULL";
                        const statusColor: Record<string, string> = {
                          OPEN: "text-emerald-700",
                          LIMITED: "text-amber-600",
                          FULL: "text-rose-600",
                          BLOCKED: "text-slate-400",
                          CLOSED: "text-slate-400",
                        };
                        return (
                          <button
                            key={sch.id}
                            type="button"
                            disabled={isUnavailable}
                            onClick={() => {
                              setRegSelectedScheduleId(sch.id);
                              setRegForm(f => ({ ...f, eventDate: sch.scheduleDate, eventTime: sch.startTime }));
                            }}
                            className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                              isSelected
                                ? "border-amber-500 bg-amber-50 shadow-xs ring-2 ring-amber-300/50"
                                : "border-slate-200 bg-white hover:border-amber-400"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0">
                                <span className="block text-[10px] font-extrabold text-slate-500 uppercase">
                                  {new Date(sch.scheduleDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                                </span>
                                <span className="block text-xs font-bold text-slate-800 mt-0.5">
                                  {sch.startTime} – {sch.endTime}
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className={`block text-[9px] font-extrabold uppercase ${statusColor[sch.status] || "text-slate-500"}`}>
                                  {sch.status}
                                </span>
                                <span className="block text-[9px] text-slate-500 mt-0.5">
                                  {sch.availableFamilies}/{sch.familyCapacity} fam · {sch.availableDevotees}/{sch.devoteeCapacity} dev
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <span className="mt-1.5 text-[9px] font-bold text-amber-700 flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Selected
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => setRegSelectedScheduleId(null)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                    >
                      Clear selection (no schedule link)
                    </button>
                  </>
                ) : (
                  /* Fallback: no live schedules — show manual date/time inputs */
                  <>
                    <p className="text-[10px] text-amber-600">No live schedules found. Enter slot date and time manually.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Slot Date</label>
                        {selectedPoojaForReg.multiDay && selectedPoojaForReg.endDate ? (
                          <select
                            value={regForm.eventDate}
                            onChange={e => setRegForm({ ...regForm, eventDate: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm"
                          >
                            {getDayRange(selectedPoojaForReg.date, selectedPoojaForReg.endDate).map(d => {
                              const [y, m, day] = (d || "").split("-").map(Number);
                              const dt = y && m && day ? new Date(y, m - 1, day, 12, 0, 0) : new Date();
                              const dayText = dt.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
                              return (
                                <option key={d} value={d}>
                                  {dayText} ({d})
                                </option>
                              );
                            })}
                          </select>
                        ) : (
                          <input
                            type="date"
                            value={regForm.eventDate}
                            onChange={e => setRegForm({ ...regForm, eventDate: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm"
                          />
                        )}
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Slot Time</label>
                        {Array.isArray(selectedPoojaForReg.timeSlotConfig) && selectedPoojaForReg.timeSlotConfig.length > 0 ? (
                          <select
                            value={regForm.eventTime}
                            onChange={e => setRegForm({ ...regForm, eventTime: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm"
                          >
                            {[...new Set(selectedPoojaForReg.timeSlotConfig.map((c: any) => c.startTime).filter(Boolean))].map((t: string) => (
                              <option key={t} value={t}>⏰ {t}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="08:30 AM"
                            value={regForm.eventTime}
                            onChange={e => setRegForm({ ...regForm, eventTime: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm"
                          />
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Status & Payment Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Booking Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={regForm.bookingFee}
                    onChange={e => setRegForm({ ...regForm, bookingFee: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Status
                  </label>
                  <select
                    value={regForm.paymentStatus}
                    onChange={e => setRegForm({ ...regForm, paymentStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                  >
                    <option value="PAID">PAID</option>
                    <option value="PENDING">PENDING</option>
                    <option value="FREE">FREE</option>
                    <option value="WAIVED">WAIVED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Registration Status
                  </label>
                  <select
                    value={regForm.status}
                    onChange={e => setRegForm({ ...regForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notes / Sankalpam Requests
                </label>
                <textarea
                  rows={2}
                  placeholder="Special dietary / sankalpam / seating requests"
                  value={regForm.notes}
                  onChange={e => setRegForm({ ...regForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                />
              </div>

              {!editingReg && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Override Reason
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Slot full but family requested special consideration"
                    value={regForm.overrideReason}
                    onChange={e => setRegForm({ ...regForm, overrideReason: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowRegModal(false); setEditingReg(null); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReg}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  {savingReg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {editingReg ? "Save Changes" : "Create Registration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Cancel Registration Confirmation Modal ── */}
      {cancelConfirmReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Cancel Registration?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to cancel the pooja booking for <strong>{cancelConfirmReg.participantName}</strong> ({cancelConfirmReg.regCode})?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelConfirmReg(null)}
                className="flex-1 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={processingAction}
                onClick={handleConfirmCancelRegistration}
                className="flex-1 px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {processingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Registration Permanent Confirmation Modal ── */}
      {deleteConfirmReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Permanently Delete Record?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This will permanently purge the registration record of <strong>{deleteConfirmReg.participantName}</strong> ({deleteConfirmReg.regCode}) from the database. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmReg(null)}
                className="flex-1 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingAction}
                onClick={handleConfirmDeleteRegistration}
                className="flex-1 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {processingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Pooja Modal ── */}
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
              <button
                type="button"
                onClick={() => { setShowCreateModal(false); setEditingPoojaId(null); }}
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

              {/* Event Type / Parent Event Selection */}
              {(() => {
                const selectedParentEvent = activeEvents.find(ev => String(ev.id) === String(poojaForm.mainEventId));
                return (
                  <div className="space-y-2 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
                    <label className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Event Type</span>
                        <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">Optional</span>
                      </div>
                      <select
                        value={poojaForm.mainEventId}
                        onChange={e => set("mainEventId", e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
                      >
                        <option value="">-- Standalone Pooja (Not linked to any event) --</option>
                        {activeEvents.map(ev => (
                          <option key={ev.id} value={String(ev.id)}>
                            {ev.title} {ev.type ? `[${ev.type}]` : ""} ({ev.startDate || "No date"}{ev.endDate && ev.endDate !== ev.startDate ? ` to ${ev.endDate}` : ""})
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-500">
                        Select an existing event to add this Pooja / Seva to, or leave as standalone.
                      </p>
                    </label>

                    {selectedParentEvent && (
                      <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <CalendarDays className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-800">{selectedParentEvent.title}: </span>
                            <span className="font-extrabold text-amber-900 bg-white px-2 py-0.5 rounded-md border border-amber-200 shadow-2xs">
                              📅 {selectedParentEvent.startDate || "No Start Date"}
                              {selectedParentEvent.endDate && selectedParentEvent.endDate !== selectedParentEvent.startDate
                                ? ` to ${selectedParentEvent.endDate}`
                                : ""}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedParentEvent.startDate) {
                              set("date", selectedParentEvent.startDate);
                              if (selectedParentEvent.endDate && selectedParentEvent.endDate !== selectedParentEvent.startDate) {
                                set("isMultiDay", true);
                                set("endDate", selectedParentEvent.endDate);
                              } else {
                                set("isMultiDay", false);
                                set("endDate", "");
                              }
                            }
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-white hover:bg-amber-100/80 rounded-lg border border-amber-200 transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1 shrink-0"
                        >
                          <span>Auto-fill Dates</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Pooja / Seva Name *</span>
                  <input type="text" value={poojaForm.name} onChange={e => set("name", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    placeholder="e.g. Ganesh Abhishekam" required />
                </label>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Pooja Type *</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddTypeModal(true);
                        setNewTypeName("");
                        setNewTypeDesc("");
                        setAddTypeError("");
                      }}
                      className="text-[11px] font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add New
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={poojaForm.type}
                      onChange={e => {
                        const chosen = e.target.value;
                        const match = poojaTypeObjects.find(t => t.name.toLowerCase() === chosen.toLowerCase());
                        set("type", chosen);
                        set("poojaTypeId", match ? match.id : undefined);
                      }}
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
                      required
                    >
                      <option value="">Select type</option>
                      {poojaTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddTypeModal(true);
                        setNewTypeName("");
                        setNewTypeDesc("");
                        setAddTypeError("");
                      }}
                      className="px-2.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs active:scale-95"
                      title="Create new Pooja Type in database"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
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
                        className={`border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                          poojaForm.endDate && poojaForm.date && poojaForm.endDate < poojaForm.date
                            ? "border-rose-400 focus:ring-rose-300 bg-rose-50/30 text-rose-900"
                            : "border-slate-200 focus:ring-amber-300"
                        }`}
                        min={poojaForm.date} required={poojaForm.isMultiDay} />
                      {poojaForm.endDate && poojaForm.date && poojaForm.endDate < poojaForm.date && (
                        <span className="text-[10px] font-semibold text-rose-600 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3 shrink-0" /> End date cannot be before start date
                        </span>
                      )}
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
                      <div key={idx} className="flex items-center gap-1.5 min-w-0">
                        <div className="flex-1 min-w-0">
                          <TimePicker
                            value={t}
                            onChange={val => updateTimeSlot(idx, val)}
                            size="sm"
                          />
                        </div>
                        {poojaForm.startTimes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTimeSlot(idx)}
                            className="p-1 text-rose-400 hover:text-rose-600 cursor-pointer shrink-0"
                            title="Remove time slot"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
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

              {/* Requires Devotee Seva Pass / Registration Toggle */}
              <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={poojaForm.needsRegistration ?? true}
                      onChange={e => set("needsRegistration", e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 accent-amber-600 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Requires Devotee Seva Pass / Registration
                    </span>
                  </label>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    (poojaForm.needsRegistration ?? true)
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}>
                    {(poojaForm.needsRegistration ?? true) ? "Pass Required" : "Open to All"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {(poojaForm.needsRegistration ?? true)
                    ? "Devotees must register or book a slot pass to attend this Pooja / Seva."
                    : "This seva/ritual is open to all devotees without any pass or prior registration."}
                </p>
              </div>

              {/* Slots Configuration */}
              {(poojaForm.needsRegistration ?? true) && (!poojaForm.isMultiDay ? (

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-500" />
                      Available Slots (Capacity) *
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={poojaForm.slots}
                        onChange={e => {
                          const val = e.target.value;
                          set("slots", val);
                          const num = Number(val) || 20;
                          setPoojaForm(f => ({
                            ...f,
                            slots: val,
                            timeSlotConfig: f.timeSlotConfig.map(ts => ({ ...ts, slotCount: num })),
                          }));
                        }}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
                        placeholder="e.g. 20 Families / Devotees"
                        min="1"
                        required
                      />
                      <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Families / Devotees</span>
                    </div>
                  </label>

                  {(Array.isArray(poojaForm.startTimes) ? poojaForm.startTimes : []).filter(Boolean).length > 1 && (
                    <div className="pt-2 border-t border-slate-200/70 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span>Slots for each Time Slot:</span>
                        <span className="text-slate-400 font-normal">Defaults to {poojaForm.slots || 20}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(Array.isArray(poojaForm.timeSlotConfig) ? poojaForm.timeSlotConfig : []).map(e => (
                          <div key={e.startTime} className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-700">Slot: {e.startTime}</span>
                              <span className="text-[10px] text-slate-400 font-medium">Configure Time &amp; Cap</span>
                            </div>
                            <input
                              type="text"
                              value={e.title || ""}
                              onChange={ev => updateTimeSlotTitle(null, e.startTime, ev.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-300 placeholder:text-slate-400/70"
                              placeholder="Slot Name (e.g. Morning Batch)"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-semibold text-slate-500">Start Time</span>
                                <span className="text-xs font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded-md border border-slate-200/80">⏰ {e.startTime}</span>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-semibold text-slate-500">End Time</span>
                                <TimePicker
                                  value={e.endTime || ""}
                                  onChange={v => updateTimeSlotEndTime(null, e.startTime, v)}
                                  size="sm"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className="text-[10px] font-semibold text-slate-500 shrink-0">Capacity:</span>
                              <input
                                type="number"
                                value={e.slotCount}
                                onChange={ev => updateTimeSlotCount(null, e.startTime, Number(ev.target.value))}
                                className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-300 bg-slate-50/50"
                                placeholder="20"
                                min="1"
                              />
                              <span className="text-[10px] text-slate-400 whitespace-nowrap font-medium">slots</span>
                            </div>
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className="text-[10px] font-semibold text-slate-500 shrink-0">Status:</span>
                              <select
                                value={e.status || "OPEN"}
                                onChange={ev => handlePersistSlotStatus(e, ev.target.value as "OPEN" | "BLOCKED" | "CLOSED")}
                                className={`flex-1 border rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-300 cursor-pointer ${
                                  (e.status || "OPEN") === "OPEN" ? "border-emerald-300 text-emerald-700 bg-emerald-50" :
                                  (e.status) === "BLOCKED" ? "border-orange-300 text-orange-700 bg-orange-50" :
                                  "border-rose-300 text-rose-700 bg-rose-50"
                                }`}
                              >
                                <option value="OPEN">OPEN</option>
                                <option value="BLOCKED">BLOCKED</option>
                                <option value="CLOSED">CLOSED</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-500" />
                      Multi-Day Slots (for each Day &amp; Time Slot)
                    </span>
                    <span className="text-[11px] font-extrabold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 shadow-2xs">
                      Total Capacity: {(Array.isArray(poojaForm.timeSlotConfig) ? poojaForm.timeSlotConfig : []).reduce((acc, curr) => acc + (Number(curr.slotCount) || 0), 0)} Slots
                    </span>
                  </div>

                  {(Array.isArray(poojaForm.timeSlotConfig) ? poojaForm.timeSlotConfig : []).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      Please enter Start Date, End Date, and at least one Start Time above to configure slots for each multi-day session.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {Array.from(new Set((Array.isArray(poojaForm.timeSlotConfig) ? poojaForm.timeSlotConfig : []).map(e => e.slotDate as string))).map(date => {
                        const [y, m, d] = (date || "").split("-").map(Number);
                        const dateObj = y && m && d ? new Date(y, m - 1, d, 12, 0, 0) : new Date();
                        const dayLabel = dateObj.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
                        const dayEntries = (Array.isArray(poojaForm.timeSlotConfig) ? poojaForm.timeSlotConfig : []).filter(e => e.slotDate === date);
                        const dayTotal = dayEntries.reduce((a, c) => a + (Number(c.slotCount) || 0), 0);
                        return (
                          <div key={date} className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs">
                            <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100">
                              <p className="text-[11px] font-extrabold text-amber-700 uppercase tracking-wide">
                                📅 {dayLabel} ({date})
                              </p>
                              <span className="text-[10px] text-slate-500 font-semibold">
                                {dayTotal} slots this day
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {dayEntries.map(e => (
                                <div key={e.startTime} className="p-2.5 rounded-xl bg-slate-50/60 border border-slate-200 space-y-2">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-slate-700">Slot: {e.startTime}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Session</span>
                                  </div>
                                  <input
                                    type="text"
                                    value={e.title || ""}
                                    onChange={ev => updateTimeSlotTitle(date, e.startTime, ev.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-300 placeholder:text-slate-400/70 bg-white"
                                    placeholder="Slot Name (e.g. Morning Homam)"
                                  />
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[10px] font-semibold text-slate-500">Start</span>
                                      <span className="text-xs font-bold text-slate-800 bg-white px-2 py-1 rounded-md border border-slate-200/80">⏰ {e.startTime}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[10px] font-semibold text-slate-500">End Time</span>
                                      <TimePicker
                                        value={e.endTime || ""}
                                        onChange={v => updateTimeSlotEndTime(date, e.startTime, v)}
                                        size="sm"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 pt-0.5">
                                    <span className="text-[10px] font-semibold text-slate-500 shrink-0">Capacity:</span>
                                    <input
                                      type="number"
                                      value={e.slotCount}
                                      onChange={ev => updateTimeSlotCount(date, e.startTime, Number(ev.target.value))}
                                      className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-300 bg-white"
                                      placeholder="20" min="1"
                                    />
                                    <span className="text-[10px] text-slate-400 whitespace-nowrap font-medium">slots</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 pt-0.5">
                                    <span className="text-[10px] font-semibold text-slate-500 shrink-0">Status:</span>
                                    <select
                                      value={e.status || "OPEN"}
                                      onChange={ev => handlePersistSlotStatus(e, ev.target.value as "OPEN" | "BLOCKED" | "CLOSED")}
                                      className={`flex-1 border rounded-lg px-2 py-1 text-xs font-bold focus:outline-none cursor-pointer ${
                                        (e.status || "OPEN") === "OPEN" ? "border-emerald-300 text-emerald-700 bg-emerald-50" :
                                        (e.status) === "BLOCKED" ? "border-orange-300 text-orange-700 bg-orange-50" :
                                        "border-rose-300 text-rose-700 bg-rose-50"
                                      }`}
                                    >
                                      <option value="OPEN">OPEN</option>
                                      <option value="BLOCKED">BLOCKED</option>
                                      <option value="CLOSED">CLOSED</option>
                                    </select>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}


              <div className="grid grid-cols-2 gap-3">
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

      {/* ── Create New Pooja Type Modal ── */}
      {showAddTypeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50 via-white to-amber-50/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Create New Pooja Type</h4>
                  <p className="text-[11px] text-slate-500">Save custom temple ritual type to database</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTypeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              {addTypeError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {addTypeError}
                </div>
              )}

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-700">Pooja Type Name *</span>
                <input
                  type="text"
                  autoFocus
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="e.g. Rudrabhishekam, Lakshmi Kubera Homa, Chandi Path..."
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreatePoojaType();
                    }
                  }}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-700">Description (Optional)</span>
                <input
                  type="text"
                  value={newTypeDesc}
                  onChange={(e) => setNewTypeDesc(e.target.value)}
                  placeholder="Brief notes or ritual purpose..."
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </label>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddTypeModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={addingType || !newTypeName.trim()}
                onClick={handleCreatePoojaType}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {addingType ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving to DB...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save Pooja Type</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

