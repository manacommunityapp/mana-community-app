import { useState, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Clock, MapPin, Mic2, Music, Trophy, Layers, Star, ChevronRight, Loader2, AlertCircle,
  Mail, Bell, Send, Plus, X, Check, Sparkles, Calendar, Zap, RefreshCw, CalendarDays,
  User, CheckCircle2, UserCheck, UtensilsCrossed, Flag, Award, BookOpen, Trash2, FileText,
  Pencil,
} from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ProgramFormDraft {
  id: string;
  title: string;
  type: string;
  time: string;
  duration: string;
  venue: string;
  performer: string;
}
import { useEventMock } from "./EventMockToggle";
import { eventProgramService, type EventProgramResponse, type ActivityRegistrationResponse } from "../../../services/events/eventProgramService";
import { eventService, type EventResponse } from "../../../services/events/eventService";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";

const days = ["Day 1 – Aug 27", "Day 2 – Aug 28", "Day 3 – Aug 29"];

type ScheduleItem = {
  id?: string;
  time: string; duration: string; title: string; type: string;
  venue: string; performer?: string; judge?: string; icon: any; color: string;
  capacity?: number | null; registeredCount?: number; spotsLeft?: number;
  requiresRegistration?: boolean; slotStatus?: string;
};

const schedule: Record<string, ScheduleItem[]> = {
  "Day 1 – Aug 27": [
    { id: "p1", time: "8:00 AM",  duration: "45m", title: "Ganesh Puja & Aarti",           type: "Ritual",       venue: "Main Stage",       icon: Star,   color: "#7c3aed" },
    { id: "p2", time: "9:00 AM",  duration: "1h",  title: "Classical Dance – Bharatanatyam",type: "Cultural",     venue: "Main Stage",       performer: "Ananya Troupe", icon: Music,  color: "#8b5cf6" },
    { id: "p3", time: "10:30 AM", duration: "2h",  title: "Cricket Tournament – Pool A",    type: "Sports",       venue: "Ground A",         icon: Trophy, color: "#6366f1" },
    { id: "p4", time: "12:00 PM", duration: "1h",  title: "Lunch & Prasadam",              type: "Food",         venue: "Dining Hall",      icon: Layers, color: "#10b981" },
    { id: "p5", time: "2:00 PM",  duration: "1h",  title: "Singing Competition – Round 1",  type: "Competition",  venue: "Amphitheatre",     judge: "Ravi Shankar", icon: Mic2,   color: "#4f46e5" },
    { id: "p6", time: "4:00 PM",  duration: "90m", title: "Badminton Tournament",           type: "Sports",       venue: "Indoor Court",     icon: Trophy, color: "#0891b2" },
    { id: "p7", time: "6:00 PM",  duration: "1h",  title: "Chief Guest Address",            type: "Ceremony",     venue: "Main Stage",       performer: "Dr. Arun Kumar", icon: Mic2, color: "#d97706" },
    { id: "p8", time: "7:30 PM",  duration: "90m", title: "Cultural Night – Music Show",    type: "Cultural",     venue: "Main Stage",       performer: "Shankar Band",  icon: Music, color: "#8b5cf6" },
  ],
  "Day 2 – Aug 28": [
    { id: "p9",  time: "8:30 AM",  duration: "30m", title: "Morning Aarti",                 type: "Ritual",       venue: "Main Stage",       icon: Star,   color: "#7c3aed" },
    { id: "p10", time: "9:30 AM",  duration: "2h",  title: "Workshop: Rangoli Art",          type: "Workshop",     venue: "Hall B",           icon: Layers, color: "#be185d" },
    { id: "p11", time: "11:00 AM", duration: "2h",  title: "Cricket Finals",                 type: "Sports",       venue: "Ground A",         icon: Trophy, color: "#6366f1" },
    { id: "p12", time: "1:00 PM",  duration: "1h",  title: "Lunch & Prasadam",              type: "Food",         venue: "Dining Hall",      icon: Layers, color: "#10b981" },
    { id: "p13", time: "3:00 PM",  duration: "2h",  title: "Elocution & Skit Competition",   type: "Competition",  venue: "Amphitheatre",     icon: Mic2,   color: "#4f46e5" },
    { id: "p14", time: "6:00 PM",  duration: "2h",  title: "Prize Distribution Ceremony",    type: "Ceremony",     venue: "Main Stage",       icon: Trophy, color: "#d97706" },
    { id: "p15", time: "8:00 PM",  duration: "2h",  title: "Bollywood Night",               type: "Cultural",     venue: "Main Stage",       performer: "DJ Fusion",     icon: Music, color: "#8b5cf6" },
  ],
  "Day 3 – Aug 29": [
    { id: "p16", time: "8:00 AM",  duration: "1h",  title: "Morning Puja & Havan",          type: "Ritual",       venue: "Main Stage",       icon: Star,   color: "#7c3aed" },
    { id: "p17", time: "10:00 AM", duration: "2h",  title: "Laddu Auction",                  type: "Auction",      venue: "Auction Stage",    icon: Layers, color: "#0891b2" },
    { id: "p18", time: "12:00 PM", duration: "30m", title: "Special Lunch – Grand Feast",   type: "Food",         venue: "Dining Hall",      icon: Layers, color: "#10b981" },
    { id: "p19", time: "2:00 PM",  duration: "3h",  title: "Ganesh Visarjan Procession",     type: "Ritual",       venue: "Community Route",  icon: Star,   color: "#7c3aed" },
    { id: "p20", time: "6:00 PM",  duration: "1h",  title: "Thank You & Closing Ceremony",   type: "Ceremony",     venue: "Main Stage",       icon: Mic2,   color: "#d97706" },
  ],
};

const typeColors: Record<string, { bg: string; text: string }> = {
  Ritual:      { bg: "bg-amber-50",    text: "text-amber-700"    },
  Cultural:    { bg: "bg-violet-50",   text: "text-violet-700"   },
  Sports:      { bg: "bg-indigo-50",   text: "text-indigo-700"   },
  Competition: { bg: "bg-indigo-50",   text: "text-indigo-700"   },
  Workshop:    { bg: "bg-pink-50",     text: "text-pink-700"     },
  Food:        { bg: "bg-emerald-50",  text: "text-emerald-700"  },
  Ceremony:    { bg: "bg-yellow-50",   text: "text-yellow-700"   },
  Auction:     { bg: "bg-cyan-50",     text: "text-cyan-700"     },
};

const typeIconMap: Record<string, { icon: any; color: string }> = {
  Ritual:      { icon: Star,   color: "#7c3aed" },
  Cultural:    { icon: Music,  color: "#8b5cf6" },
  Sports:      { icon: Trophy, color: "#6366f1" },
  Competition: { icon: Mic2,   color: "#4f46e5" },
  Workshop:    { icon: Layers, color: "#be185d" },
  Food:        { icon: Layers, color: "#10b981" },
  Ceremony:    { icon: Mic2,   color: "#d97706" },
  Auction:     { icon: Layers, color: "#0891b2" },
};

function mapLivePrograms(programs: EventProgramResponse[]): ScheduleItem[] {
  return programs.map(p => {
    const typeInfo = typeIconMap[p.programType ?? ""] ?? { icon: Layers, color: "#6366f1" };
    return {
      id: String(p.id),
      time: p.startTime ?? "",
      duration: p.duration ?? "",
      title: p.title,
      type: p.programType ?? "General",
      venue: p.venue ?? "",
      performer: p.performer ?? undefined,
      judge: p.judge ?? undefined,
      icon: typeInfo.icon,
      color: typeInfo.color,
      capacity: p.capacity,
      registeredCount: p.registeredCount,
      spotsLeft: p.spotsLeft,
      requiresRegistration: p.requiresRegistration,
      slotStatus: p.slotStatus ?? undefined,
    };
  });
}

/* ─── Agenda Notification Modal ─── */
export function AgendaNotificationModal({
  isOpen,
  onClose,
  eventName,
  dayLabel,
  activityTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  eventName: string;
  dayLabel?: string;
  activityTitle?: string;
}) {
  const [audience, setAudience] = useState("all");
  const [subject, setSubject] = useState(
    activityTitle
      ? `Agenda Update: ${activityTitle} — ${eventName}`
      : `Day-wise Program Agenda Update — ${eventName} ${dayLabel ? `(${dayLabel})` : ""}`
  );
  const [message, setMessage] = useState(
    `Dear Member,\n\nWe have updated the day-wise program agenda for ${eventName}${dayLabel ? ` on ${dayLabel}` : ""}.\n\n${
      activityTitle ? `Featured Activity: ${activityTitle}\n\n` : ""
    }Please check the official event schedule for stage timings, cultural performances, and venue details.\n\nBest regards,\nMana Community Event Team`
  );
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        onClose();
      }, 1600);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 animate-fade-in-up border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Send Agenda Notification</h3>
              <p className="text-xs text-slate-400">Notify registered attendees of day-wise program updates</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sentSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-800">Email Sent Successfully!</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              The day-wise agenda notification has been dispatched to all registered attendees.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Notification Channel Selection - EMAIL AUTO SELECTED */}
            <div>
              <Label className="text-xs font-bold text-slate-700 block mb-1.5">Notification Channels</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded-xl border-2 border-indigo-500 bg-indigo-50/70 flex items-center gap-2 font-bold text-indigo-700">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span>Email</span>
                  <Badge className="ml-auto text-[8px] bg-indigo-600 text-white px-1 py-0">Auto</Badge>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 opacity-40 flex items-center gap-2 text-slate-400 cursor-not-allowed select-none">
                  <Bell className="w-4 h-4" />
                  <span>SMS</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 opacity-40 flex items-center gap-2 text-slate-400 cursor-not-allowed select-none">
                  <Bell className="w-4 h-4" />
                  <span>Push</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 opacity-40 flex items-center gap-2 text-slate-400 cursor-not-allowed select-none">
                  <Bell className="w-4 h-4" />
                  <span>WhatsApp</span>
                </div>
              </div>
              <p className="text-[10px] text-indigo-600 font-medium mt-1">
                ✓ Email channel is auto-selected by default for agenda & program updates.
              </p>
            </div>

            {/* Target Audience */}
            <div>
              <Label className="text-xs font-bold text-slate-700 block mb-1">Target Audience</Label>
              <select
                value={audience}
                onChange={e => setAudience(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:border-indigo-400"
              >
                <option value="all">All Registered Attendees</option>
                <option value="confirmed">Confirmed Registrants Only</option>
                <option value="volunteers">Event Volunteers & Organizers</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <Label className="text-xs font-bold text-slate-700 block mb-1">Email Subject</Label>
              <Input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Message Body */}
            <div>
              <Label className="text-xs font-bold text-slate-700 block mb-1">Message Preview</Label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="text-xs min-h-[90px]"
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSend}
                disabled={sending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? "Sending Email..." : "Send Email Notification"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Edit Program Modal ─── */
export function EditProgramModal({
  isOpen,
  onClose,
  program,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  program: ScheduleItem;
  onSave: (updated: ScheduleItem) => void;
}) {
  const [title, setTitle] = useState(program.title);
  const [type, setType] = useState(program.type);
  const [time, setTime] = useState(program.time);
  const [duration, setDuration] = useState(program.duration);
  const [venue, setVenue] = useState(program.venue);
  const [performer, setPerformer] = useState(program.performer || "");
  const [judge, setJudge] = useState(program.judge || "");

  if (!isOpen) return null;

  const handleSave = () => {
    const typeInfo = typeIconMap[type] || { icon: Layers, color: "#6366f1" };
    onSave({
      ...program,
      title,
      type,
      time,
      duration,
      venue,
      performer: performer || undefined,
      judge: judge || undefined,
      icon: typeInfo.icon,
      color: typeInfo.color,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-fade-in-up border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Edit Program / Activity</h3>
              <p className="text-xs text-slate-400">Update event schedule timing and details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <Label className="text-xs font-bold text-slate-700 block mb-1">Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="h-9 text-xs" />
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700 block mb-1">Category / Type</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {Object.keys(typeIconMap).map((cat) => {
                const isSelected = type === cat;
                const catInfo = typeIconMap[cat];
                const IconComp = catInfo?.icon || Layers;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setType(cat)}
                    className={cn(
                      "p-2 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer",
                      isSelected
                        ? "border-2 border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-2xs font-bold"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <span className="text-[10px] truncate">{cat}</span>
                    <IconComp className="w-3.5 h-3.5 shrink-0" style={{ color: catInfo?.color || "#6366f1" }} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-slate-700 block mb-1">Time</Label>
              <Input value={time} onChange={e => setTime(e.target.value)} className="h-9 text-xs" placeholder="e.g. 10:00 AM" />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700 block mb-1">Duration</Label>
              <Input value={duration} onChange={e => setDuration(e.target.value)} className="h-9 text-xs" placeholder="e.g. 1h 30m" />
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700 block mb-1">Venue / Stage</Label>
            <Input value={venue} onChange={e => setVenue(e.target.value)} className="h-9 text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-slate-700 block mb-1">Performer / Host</Label>
              <Input value={performer} onChange={e => setPerformer(e.target.value)} className="h-9 text-xs" placeholder="Optional" />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700 block mb-1">Judge</Label>
              <Input value={judge} onChange={e => setJudge(e.target.value)} className="h-9 text-xs" placeholder="Optional" />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
            <Check className="w-4 h-4" /> Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

export function EventsPrograms() {
  const { useMock } = useEventMock();
  const [activeDay, setActiveDay] = useState(days[0]);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [liveDays, setLiveDays] = useState<string[]>([]);
  const [liveSchedule, setLiveSchedule] = useState<Record<string, ScheduleItem[]>>({});
  const [activeLiveDay, setActiveLiveDay] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Notification state
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [targetActivityTitle, setTargetActivityTitle] = useState<string | undefined>(undefined);

  // Activity Registrations state
  const [regModalOpen, setRegModalOpen] = useState(false);
  const [regProgramId, setRegProgramId] = useState<number | null>(null);
  const [regProgramTitle, setRegProgramTitle] = useState("");
  const [registrations, setRegistrations] = useState<ActivityRegistrationResponse[]>([]);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regActioning, setRegActioning] = useState<number | null>(null);

  const openRegistrations = (item: ScheduleItem) => {
    const numId = Number(item.id);
    if (isNaN(numId)) return;
    setRegProgramId(numId);
    setRegProgramTitle(item.title);
    setRegModalOpen(true);
    setRegLoading(true);
    setRegError("");
    eventProgramService.getActivityRegistrations(numId)
      .then(setRegistrations)
      .catch(e => setRegError(e?.message || "Failed to load registrations"))
      .finally(() => setRegLoading(false));
  };

  const handleApprove = async (regId: number) => {
    setRegActioning(regId);
    try {
      const updated = await eventProgramService.approveActivityRegistration(regId);
      setRegistrations(prev => prev.map(r => r.id === regId ? updated : r));
    } catch (e: any) {
      setRegError(e?.message || "Failed to approve");
    } finally {
      setRegActioning(null);
    }
  };

  const handleReject = async (regId: number) => {
    setRegActioning(regId);
    try {
      const updated = await eventProgramService.rejectActivityRegistration(regId);
      setRegistrations(prev => prev.map(r => r.id === regId ? updated : r));
    } catch (e: any) {
      setRegError(e?.message || "Failed to reject");
    } finally {
      setRegActioning(null);
    }
  };

  // Edit Program state
  const [editingProgram, setEditingProgram] = useState<ScheduleItem | null>(null);

  // Quick Add Activity & Multi-Program state
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [selectedModalDay, setSelectedModalDay] = useState<string>(days[0]);
  const [programDrafts, setProgramDrafts] = useState<ProgramFormDraft[]>([
    { id: "draft_1", title: "", type: "Cultural", time: "10:00 AM", duration: "1h", venue: "Main Stage", performer: "" }
  ]);
  const [mockCustomSchedule, setMockCustomSchedule] = useState<Record<string, ScheduleItem[]>>(schedule);

  useEffect(() => {
    if (useMock) return;
    eventService.getUpcomingEvents()
      .then(evts => {
        setEvents(evts);
        if (evts.length > 0) setSelectedEventId(evts[0].id);
      })
      .catch(() => {});
  }, [useMock]);

  useEffect(() => {
    if (useMock || !selectedEventId) return;
    setLoading(true);
    setError("");
    eventProgramService.getByEvent(selectedEventId)
      .then(data => {
        const byDay: Record<string, ScheduleItem[]> = {};
        for (const p of data) {
          const day = p.dayLabel ?? "Day 1";
          if (!byDay[day]) byDay[day] = [];
          byDay[day].push(...mapLivePrograms([p]));
        }
        const dayKeys = Object.keys(byDay).sort();
        setLiveSchedule(byDay);
        setLiveDays(dayKeys);
        setActiveLiveDay(dayKeys[0] ?? "");
      })
      .catch(e => setError(e.message ?? "Failed to load programs"))
      .finally(() => setLoading(false));
  }, [useMock, selectedEventId]);

  const currentDays = useMock ? days : liveDays;
  const currentDay = useMock ? activeDay : activeLiveDay;
  const setCurrentDay = useMock ? setActiveDay : setActiveLiveDay;
  const items = useMock ? (mockCustomSchedule[activeDay] || []) : (liveSchedule[activeLiveDay] || []);

  const selectedEventObj = events.find(e => e.id === selectedEventId);
  const currentEventTitle = selectedEventObj?.title || "Community Festival";

  const handleOpenNotification = (activityTitle?: string) => {
    setTargetActivityTitle(activityTitle);
    setNotifModalOpen(true);
  };

  /* Open Add Program Modal pre-configured with current active day */
  const handleOpenAddModal = () => {
    setSelectedModalDay(currentDay || days[0]);
    setProgramDrafts([
      { id: `draft_${Date.now()}_1`, title: "", type: "Cultural", time: "10:00 AM", duration: "1h", venue: "Main Stage", performer: "" }
    ]);
    setShowAddActivityModal(true);
  };

  /* Draft helper functions */
  const addDraftProgram = () => {
    const defaultTimes = ["10:00 AM", "12:00 PM", "2:30 PM", "4:30 PM", "6:30 PM", "8:00 PM"];
    const nextTime = defaultTimes[programDrafts.length % defaultTimes.length];
    setProgramDrafts(prev => [
      ...prev,
      {
        id: `draft_${Date.now()}_${prev.length + 1}`,
        title: "",
        type: "Cultural",
        time: nextTime,
        duration: "1h",
        venue: "Main Stage",
        performer: "",
      },
    ]);
  };

  const updateDraftProgram = (id: string, field: keyof ProgramFormDraft, val: string) => {
    setProgramDrafts(prev => prev.map(d => d.id === id ? { ...d, [field]: val } : d));
  };

  const removeDraftProgram = (id: string) => {
    if (programDrafts.length <= 1) return;
    setProgramDrafts(prev => prev.filter(d => d.id !== id));
  };

  const handleDeleteProgram = async (item: ScheduleItem) => {
    if (!confirm(`Delete program "${item.title}"?`)) return;
    if (useMock) {
      setMockCustomSchedule(prev => {
        const updated = { ...prev };
        for (const day of Object.keys(updated)) {
          updated[day] = updated[day].filter(p => p.id !== item.id);
        }
        return updated;
      });
      return;
    }
    if (!item.id || isNaN(Number(item.id))) return;
    try {
      await eventProgramService.deleteProgram(Number(item.id));
      setLiveSchedule(prev => {
        const updated = { ...prev };
        for (const day of Object.keys(updated)) {
          updated[day] = updated[day].filter(p => p.id !== item.id);
        }
        return updated;
      });
    } catch (err: any) {
      setError(err?.message || "Failed to delete program");
    }
  };

  /* Save all drafted programs to the selected day */
  const handleSaveAllActivities = async (shouldNotify: boolean = true) => {
    const validDrafts = programDrafts.filter(d => d.title.trim().length > 0);
    if (validDrafts.length === 0) return;

    if (useMock || !selectedEventId) {
      const newItems: ScheduleItem[] = validDrafts.map((d, idx) => {
        const typeInfo = typeIconMap[d.type] || { icon: Layers, color: "#6366f1" };
        return {
          id: `custom_${Date.now()}_${idx}`,
          time: d.time || "10:00 AM",
          duration: d.duration || "1h",
          title: d.title,
          type: d.type,
          venue: d.venue || "Main Stage",
          performer: d.performer || undefined,
          icon: typeInfo.icon,
          color: typeInfo.color,
        };
      });
      setMockCustomSchedule(prev => ({
        ...prev,
        [selectedModalDay]: [...(prev[selectedModalDay] || []), ...newItems],
      }));
    } else {
      try {
        const created: ScheduleItem[] = [];
        for (const d of validDrafts) {
          const resp = await eventProgramService.create({
            eventId: selectedEventId,
            title: d.title,
            dayLabel: selectedModalDay,
            programType: d.type,
            startTime: d.time || "10:00 AM",
            duration: d.duration || "1h",
            venue: d.venue || "Main Stage",
            performer: d.performer || undefined,
          });
          created.push(...mapLivePrograms([resp]));
        }
        setLiveSchedule(prev => ({
          ...prev,
          [selectedModalDay]: [...(prev[selectedModalDay] || []), ...created],
        }));
        if (!liveDays.includes(selectedModalDay)) {
          setLiveDays(prev => [...prev, selectedModalDay].sort());
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "Failed to save programs");
        return;
      }
    }

    setCurrentDay(selectedModalDay);
    setShowAddActivityModal(false);

    if (shouldNotify) {
      const summaryTitle = validDrafts.length === 1
        ? validDrafts[0].title
        : `${validDrafts.length} New Programs for ${selectedModalDay}`;
      handleOpenNotification(summaryTitle);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Header Bar with Admin Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" /> Day-Wise Event Agenda & Cultural Programs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage schedule activities and send email updates to attendees</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={handleOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs font-bold rounded-xl"
          >
            <Plus className="w-3.5 h-3.5" /> Add Day Activity / Program
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOpenNotification()}
            className="border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/60 text-indigo-700 gap-1.5 text-xs font-bold rounded-xl"
          >
            <Mail className="w-3.5 h-3.5 text-indigo-600" /> Send Day Agenda Email
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading programs...
        </div>
      )}

      {!useMock && events.length > 1 && (
        <select
          value={selectedEventId ?? ""}
          onChange={e => setSelectedEventId(Number(e.target.value))}
          className="w-full max-w-xs px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
        >
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
      )}

      {/* Day tabs */}
      <div className="bg-white rounded-2xl p-1 sm:p-1.5 flex gap-1 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-x-auto hide-scrollbar">
        {currentDays.map(d => (
          <button key={d} onClick={() => setCurrentDay(d)}
            className={`flex-1 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-xl text-[10px] sm:text-sm font-semibold transition-all whitespace-nowrap
              ${currentDay === d ? "text-white shadow-sm" : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"}`}
            style={currentDay === d ? { background: "linear-gradient(135deg, #4f46e5, #7c3aed)" } : undefined}>
            {d}
          </button>
        ))}
      </div>

      {/* Schedule timeline */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-3 sm:px-6 py-3 sm:py-5 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800 text-sm sm:text-base">Program Schedule</h2>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{items.length} events · {currentDay}</p>
          </div>
          <button
            onClick={() => handleOpenNotification()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all"
          >
            <Mail className="w-3.5 h-3.5 text-indigo-600" /> Notify Attendees
          </button>
        </div>

        <div className="p-3 sm:p-6 space-y-3">
          {items.map((item, i) => {
            const tc = typeColors[item.type] || { bg: "bg-slate-50", text: "text-slate-600" };
            return (
              <div key={item.id || i} className="flex gap-2 sm:gap-5 group animate-fade-in-up">
                {/* Time column */}
                <div className="flex-shrink-0 w-12 sm:w-20 pt-1 text-right">
                  <p className="text-[10px] sm:text-xs font-bold text-slate-600">{item.time}</p>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">{item.duration}</p>
                </div>

                {/* Connector */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                    style={{ background: `${item.color}18` }}>
                    <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: item.color }} />
                  </div>
                  {i < items.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 mt-1" style={{ minHeight: 20 }} />}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="bg-slate-50/60 rounded-xl p-3 sm:p-4 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all group-hover:shadow-sm">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-semibold text-slate-800 text-xs sm:text-sm">{item.title}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <MapPin className="w-3 h-3" /> {item.venue}
                          </span>
                          {item.performer && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Mic2 className="w-3 h-3" /> {item.performer}
                            </span>
                          )}
                          {item.judge && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Star className="w-3 h-3" /> Judge: {item.judge}
                            </span>
                          )}
                          {item.requiresRegistration && (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                              <UserCheck className="w-3 h-3" />
                              {item.registeredCount ?? 0}/{item.capacity ?? "∞"} registered
                              {item.spotsLeft != null && item.spotsLeft > 0 && ` · ${item.spotsLeft} spots left`}
                              {item.slotStatus && ` · ${item.slotStatus}`}
                            </span>
                          )}
                          {!item.requiresRegistration && item.capacity != null && item.capacity > 0 && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <User className="w-3 h-3" /> Capacity: {item.capacity}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0 ${tc.bg} ${tc.text}`}>
                          {item.type}
                        </span>
                        <button
                          onClick={() => setEditingProgram(item)}
                          title="Edit this program / activity"
                          className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                        >
                          <Pencil className="w-3 h-3 text-indigo-500" /> Edit
                        </button>
                        <button
                          onClick={() => handleOpenNotification(item.title)}
                          title="Send Email Notification for this activity"
                          className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                        >
                          <Mail className="w-3 h-3 text-indigo-500" /> Notify
                        </button>
                        <button
                          onClick={() => handleDeleteProgram(item)}
                          title="Delete this program / activity"
                          className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600 hover:text-rose-600 hover:border-rose-200 flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" /> Delete
                        </button>
                        {!useMock && item.id && !isNaN(Number(item.id)) && (
                          <button
                            onClick={() => openRegistrations(item)}
                            title="View activity registrations"
                            className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600 hover:text-emerald-600 hover:border-emerald-200 flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                          >
                            <UserCheck className="w-3 h-3 text-emerald-500" /> Registrations
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Beautified Add Day Activity / Cultural Program Modal */}
      {showAddActivityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 space-y-5 shadow-2xl animate-fade-in-up border border-slate-100 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
                  <CalendarDays className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Add Day Activities &amp; Cultural Programs</h3>
                  <p className="text-xs text-slate-400">Select event day and configure multiple program activities at once</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddActivityModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Day Selector Banner */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-150 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" /> Select Target Event Day *
                </Label>
                <Badge className="bg-indigo-600 text-white text-[10px]">{currentEventTitle}</Badge>
              </div>
              <select
                value={selectedModalDay}
                onChange={e => setSelectedModalDay(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white font-bold text-xs text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {currentDays.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Multi-Program Draft Cards Repeater */}
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Programs &amp; Cultural Activities ({programDrafts.length})</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addDraftProgram}
                  className="text-xs font-bold border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 rounded-xl gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Program Card
                </Button>
              </div>

              <div className="space-y-4">
                {programDrafts.map((draft, idx) => (
                  <div key={draft.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3.5 shadow-2xs">
                    {/* Card Header */}
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <span className="font-extrabold text-indigo-700 text-xs flex items-center gap-1.5">
                        <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px]">#{idx + 1}</Badge>
                        Program Activity Details
                      </span>
                      {programDrafts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDraftProgram(draft.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-lg hover:bg-rose-50"
                          title="Remove this activity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Program Title */}
                    <div>
                      <Label className="text-xs font-bold text-slate-700 block mb-1">Activity / Program Title *</Label>
                      <Input
                        value={draft.title}
                        onChange={e => updateDraftProgram(draft.id, "title", e.target.value)}
                        placeholder="e.g. Classical Bharatanatyam Dance / Ganesha Aarti / Musical Night"
                        className="h-9 text-xs rounded-xl border-slate-200 bg-white"
                      />
                    </div>

                    {/* Category Selection Grid */}
                    <div>
                      <Label className="text-xs font-bold text-slate-700 block mb-1">Category</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {Object.keys(typeIconMap).map((cat) => {
                          const isSelected = draft.type === cat;
                          const catInfo = typeIconMap[cat];
                          const IconComp = catInfo?.icon || Layers;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => updateDraftProgram(draft.id, "type", cat)}
                              className={cn(
                                "p-2 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer",
                                isSelected
                                  ? "border-2 border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-2xs font-bold"
                                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                              )}
                            >
                              <span className="text-[10px] truncate">{cat}</span>
                              <IconComp className="w-3.5 h-3.5 shrink-0" style={{ color: catInfo?.color || "#6366f1" }} />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Timing, Duration & Stage Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <Label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-500" /> Start Time
                        </Label>
                        <Input
                          value={draft.time}
                          onChange={e => updateDraftProgram(draft.id, "time", e.target.value)}
                          placeholder="10:00 AM"
                          className="h-8 text-xs rounded-xl border-slate-200 bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-700 block mb-1">Duration</Label>
                        <Input
                          value={draft.duration}
                          onChange={e => updateDraftProgram(draft.id, "duration", e.target.value)}
                          placeholder="1h 30m"
                          className="h-8 text-xs rounded-xl border-slate-200 bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-indigo-500" /> Stage / Venue
                        </Label>
                        <Input
                          value={draft.venue}
                          onChange={e => updateDraftProgram(draft.id, "venue", e.target.value)}
                          placeholder="Main Stage"
                          className="h-8 text-xs rounded-xl border-slate-200 bg-white"
                        />
                      </div>
                    </div>

                    {/* Performer / Host Name */}
                    <div>
                      <Label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                        <User className="w-3 h-3 text-indigo-500" /> Performer / Host / Organizer (Optional)
                      </Label>
                      <Input
                        value={draft.performer}
                        onChange={e => updateDraftProgram(draft.id, "performer", e.target.value)}
                        placeholder="e.g. Swara Classical Music Group / Dr. Ramesh Kumar"
                        className="h-8 text-xs rounded-xl border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Another Program Button */}
              <button
                type="button"
                onClick={addDraftProgram}
                className="w-full py-2.5 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-indigo-600" /> Add Another Program / Activity to {selectedModalDay}
              </button>
            </div>

            {/* Email Auto Notification Info Banner */}
            <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="font-bold text-emerald-900 block text-[11px]">Auto Email Broadcast</span>
                  <span className="text-[10px] text-emerald-700">Email channel is auto-selected to broadcast updates for {selectedModalDay}</span>
                </div>
              </div>
              <Badge className="bg-emerald-600 text-white text-[9px]">Auto Email</Badge>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddActivityModal(false)}
                className="rounded-xl h-10 px-4 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSaveAllActivities(false)}
                  disabled={programDrafts.filter(d => d.title.trim()).length === 0}
                  className="border-indigo-200 bg-white hover:bg-slate-50 text-indigo-700 font-bold rounded-xl h-10 px-4 text-xs gap-1.5 cursor-pointer shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" /> Save as Draft
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSaveAllActivities(true)}
                  disabled={programDrafts.filter(d => d.title.trim()).length === 0}
                  className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/25 h-10 px-5 text-xs gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" /> Save &amp; Notify
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agenda Notification Modal */}
      <AgendaNotificationModal
        isOpen={notifModalOpen}
        onClose={() => setNotifModalOpen(false)}
        eventName={currentEventTitle}
        dayLabel={currentDay}
        activityTitle={targetActivityTitle}
      />

      {/* Edit Program Modal */}
      {editingProgram && (
        <EditProgramModal
          isOpen={!!editingProgram}
          onClose={() => setEditingProgram(null)}
          program={editingProgram}
          onSave={async (updated) => {
            if (useMock) {
              setMockCustomSchedule(prev => ({
                ...prev,
                [currentDay]: (prev[currentDay] || []).map(p => p.id === updated.id ? updated : p),
              }));
            } else if (selectedEventId && updated.id) {
              const numId = Number(updated.id);
              if (!isNaN(numId)) {
                try {
                  await eventProgramService.update(numId, {
                    eventId: selectedEventId,
                    title: updated.title,
                    programType: updated.type,
                    startTime: updated.time,
                    duration: updated.duration,
                    venue: updated.venue,
                    performer: updated.performer,
                    judge: updated.judge,
                    dayLabel: currentDay,
                  });
                  setLiveSchedule(prev => ({
                    ...prev,
                    [currentDay]: (prev[currentDay] || []).map(p => p.id === updated.id ? updated : p),
                  }));
                } catch (e) {
                  console.error("Failed to update program live", e);
                }
              }
            }
          }}
        />
      )}

      {/* Activity Registrations Modal */}
      {regModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">Activity Registrations</h3>
                <p className="text-xs text-slate-400 mt-0.5">{regProgramTitle}</p>
              </div>
              <button onClick={() => setRegModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-4">
              {regError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {regError}
                </div>
              )}
              {regLoading ? (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading registrations...
                </div>
              ) : registrations.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No registrations yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
                    <span className="font-semibold">{registrations.length} registrations</span>
                    <span>·</span>
                    <span className="text-emerald-600 font-semibold">{registrations.filter(r => r.status === "APPROVED" || r.status === "CONFIRMED").length} approved</span>
                    <span className="text-amber-600 font-semibold">{registrations.filter(r => r.status === "PENDING").length} pending</span>
                  </div>
                  {registrations.map(reg => {
                    const isPending = reg.status === "PENDING";
                    const isApproved = reg.status === "APPROVED" || reg.status === "CONFIRMED";
                    const isRejected = reg.status === "REJECTED" || reg.status === "CANCELLED";
                    return (
                      <div key={reg.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/60 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
                          {(reg.userName || reg.primaryName || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm">{reg.userName || reg.primaryName || `User #${reg.userId}`}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[10px] text-slate-400">
                            {reg.userEmail && <span>{reg.userEmail}</span>}
                            {reg.primaryPhone && <span>· {reg.primaryPhone}</span>}
                            <span>· {reg.headCount} {reg.headCount === 1 ? "person" : "people"}</span>
                            {reg.registrationType && <span>· {reg.registrationType}</span>}
                            <span>· {new Date(reg.registeredAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          {reg.waitlistPosition != null && reg.waitlistPosition > 0 && (
                            <p className="text-[10px] text-amber-600 mt-0.5">Waitlist position: #{reg.waitlistPosition}</p>
                          )}
                          {reg.decisionReason && (
                            <p className="text-[10px] text-slate-500 mt-0.5">Reason: {reg.decisionReason}</p>
                          )}
                          {reg.approvedByName && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {isApproved ? "Approved" : "Decided"} by {reg.approvedByName}
                              {reg.approvedAt && ` on ${new Date(reg.approvedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`}
                            </p>
                          )}
                          {reg.participants && reg.participants.length > 0 && (
                            <div className="mt-1">
                              <p className="text-[10px] font-semibold text-slate-500">Participants:</p>
                              {reg.participants.map((p, i) => (
                                <p key={i} className="text-[10px] text-slate-400 ml-2">{p.fullName}{p.email ? ` (${p.email})` : ""}</p>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isApproved ? "bg-emerald-50 text-emerald-700" :
                            isPending ? "bg-amber-50 text-amber-700" :
                            "bg-rose-50 text-rose-700"
                          }`}>{reg.status}</span>
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(reg.id)}
                                disabled={regActioning === reg.id}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                              >
                                {regActioning === reg.id ? "..." : "Approve"}
                              </button>
                              <button
                                onClick={() => handleReject(reg.id)}
                                disabled={regActioning === reg.id}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
                              >
                                {regActioning === reg.id ? "..." : "Reject"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

