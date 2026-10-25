import { useState, useEffect, useCallback } from "react";
import { Star, Award, Users, Calendar, Clock, MapPin, CheckCircle2, Loader2, ChevronRight, X, UserCheck, Filter, Dumbbell, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import { academyApi } from "../../../services/academy/academyApi";
import type { AcademyInstructor, TrainerSlot } from "../../../types/academy";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSportEmoji(sport: string): string {
  const s = sport.toLowerCase();
  if (s.includes("badminton")) return "🏸";
  if (s.includes("cricket")) return "🏏";
  if (s.includes("tennis")) return "🎾";
  if (s.includes("football") || s.includes("soccer")) return "⚽";
  if (s.includes("basketball")) return "🏀";
  if (s.includes("volleyball")) return "🏐";
  if (s.includes("yoga") || s.includes("fitness")) return "🧘";
  if (s.includes("chess")) return "♟️";
  if (s.includes("table tennis") || s.includes("tt")) return "🏓";
  if (s.includes("swimming")) return "🏊";
  if (s.includes("kabaddi")) return "🤼";
  return "🏅";
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 || 12;
  return `${hh}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

// ─── Trainer Card ────────────────────────────────────────────────────────────

interface TrainerCardProps {
  trainer: AcademyInstructor;
  onSelect: (trainer: AcademyInstructor) => void;
}

function TrainerCard({ trainer, onSelect }: TrainerCardProps) {
  const specs = trainer.sportSpecializations ?? [];
  const sports = specs.map((s) => s.sport);

  return (
    <div
      onClick={() => onSelect(trainer)}
      className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.1)] hover:border-indigo-200 transition-all duration-200 cursor-pointer group"
    >
      {/* Top row: avatar + name */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative shrink-0">
          <img
            src={trainer.profilePicUrl ?? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"}
            alt={trainer.fullName}
            className="w-14 h-14 rounded-xl object-cover border-2 border-indigo-100"
          />
          <span className="absolute -bottom-1 -right-1 text-lg">{sports[0] ? getSportEmoji(sports[0]) : "🏅"}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm font-bold text-slate-800 leading-tight">{trainer.fullName}</h3>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
              <UserCheck className="w-2.5 h-2.5" />
              Certified
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-1">{trainer.profession}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{trainer.flatNumber}, {trainer.tower}</p>
        </div>
      </div>

      {/* Sport badges */}
      <div className="flex flex-wrap gap-1 mb-3">
        {sports.map((sport) => (
          <span key={sport} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[11px] font-semibold text-indigo-700">
            {getSportEmoji(sport)} {sport}
          </span>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-0.5 text-amber-500">
            <Star className="w-3 h-3 fill-amber-400" />
            <span className="text-sm font-bold text-slate-800">{trainer.averageRating.toFixed(1)}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">{trainer.reviewCount} reviews</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-800">{trainer.totalSessions}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Sessions</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-800">{trainer.totalLearners}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Learners</p>
        </div>
      </div>

      {/* Certification pills */}
      {specs.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {specs.map((sp, i) => sp.certificationBody && (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-100 text-[10px] font-medium text-amber-700">
              <Award className="w-2.5 h-2.5" />
              {sp.certificationBody} {sp.certifiedYear}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors group-hover:shadow-md">
        View Slots <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Slot Card ───────────────────────────────────────────────────────────────

interface SlotCardProps {
  slot: TrainerSlot;
  onBook: (slot: TrainerSlot) => void;
  booked: boolean;
}

function SlotCard({ slot, onBook, booked }: SlotCardProps) {
  const isFull = slot.bookedCount >= slot.maxCapacity;
  const spotsLeft = slot.maxCapacity - slot.bookedCount;

  return (
    <div className={`rounded-xl border p-3 transition-all ${isFull ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-indigo-100 hover:border-indigo-300 hover:shadow-sm"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-xs font-bold text-slate-800">{formatDate(slot.date)}</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-500">
              <Clock className="w-3 h-3" />
              {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${slot.slotType === "INDIVIDUAL" ? "bg-violet-50 border-violet-200 text-violet-700" : "bg-sky-50 border-sky-200 text-sky-700"}`}>
              <Users className="w-2.5 h-2.5" />
              {slot.slotType === "INDIVIDUAL" ? "1-on-1" : `Group (max ${slot.maxCapacity})`}
            </span>
            {slot.venueName && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
                <MapPin className="w-2.5 h-2.5" />
                {slot.venueName}
              </span>
            )}
          </div>
          {slot.notes && <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{slot.notes}</p>}
        </div>

        <div className="shrink-0 text-right">
          {booked ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
              <CheckCircle2 className="w-3 h-3" /> Booked
            </span>
          ) : isFull ? (
            <span className="px-2 py-1 rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-400">Full</span>
          ) : (
            <button
              onClick={() => onBook(slot)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-colors shadow-sm"
            >
              Book
            </button>
          )}
          {!isFull && !booked && (
            <p className="text-[10px] text-slate-400 mt-1">{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Trainer Profile + Slots Drawer ──────────────────────────────────────────

interface TrainerDrawerProps {
  trainer: AcademyInstructor;
  slots: TrainerSlot[];
  myBookedSlotIds: Set<string>;
  loading: boolean;
  onBook: (slot: TrainerSlot) => void;
  onClose: () => void;
}

function TrainerDrawer({ trainer, slots, myBookedSlotIds, loading, onBook, onClose }: TrainerDrawerProps) {
  const specs = trainer.sportSpecializations ?? [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="shrink-0 p-4 border-b border-slate-100 flex items-start gap-3">
          <img
            src={trainer.profilePicUrl ?? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"}
            alt={trainer.fullName}
            className="w-14 h-14 rounded-xl object-cover border-2 border-indigo-100 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-slate-800 leading-tight">{trainer.fullName}</h2>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{trainer.profession}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-0.5 text-xs font-bold text-amber-500">
                <Star className="w-3 h-3 fill-amber-400" />
                {trainer.averageRating.toFixed(1)}
              </span>
              <span className="text-[11px] text-slate-400">({trainer.reviewCount} reviews)</span>
              <span className="text-[11px] text-slate-400">· {trainer.experienceYears}yr exp</span>
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {/* Bio */}
          {trainer.bio && (
            <div className="p-4 border-b border-slate-50">
              <p className="text-xs text-slate-600 leading-relaxed">{trainer.bio}</p>
            </div>
          )}

          {/* Certifications */}
          {specs.length > 0 && (
            <div className="p-4 border-b border-slate-50">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Certifications</h3>
              <div className="flex flex-col gap-2">
                {specs.map((sp, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                    <Award className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-700">{sp.sport}</p>
                      {sp.certificationBody && (
                        <p className="text-[11px] text-amber-700 font-medium">{sp.certificationBody} — {sp.certificationNumber}</p>
                      )}
                      {sp.ageGroupsCoached && (
                        <p className="text-[11px] text-slate-500 mt-0.5">Age groups: {sp.ageGroupsCoached}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="p-4 border-b border-slate-50">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-indigo-50">
                <p className="text-lg font-bold text-indigo-700">{trainer.totalSessions}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Sessions</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50">
                <p className="text-lg font-bold text-emerald-700">{trainer.totalLearners}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Learners</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50">
                <p className="text-lg font-bold text-amber-700">{trainer.experienceYears}+</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Yrs Exp</p>
              </div>
            </div>
          </div>

          {/* Available Slots */}
          <div className="p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Available Slots
            </h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No upcoming slots</p>
                <p className="text-xs mt-0.5">Check back later for new availability</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {slots.map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    onBook={onBook}
                    booked={myBookedSlotIds.has(slot.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SportsTrainers() {
  const { user } = useAuth();
  const [trainers, setTrainers] = useState<AcademyInstructor[]>([]);
  const [allSlots, setAllSlots] = useState<TrainerSlot[]>([]);
  const [myBookedSlotIds, setMyBookedSlotIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<AcademyInstructor | null>(null);
  const [trainerSlots, setTrainerSlots] = useState<TrainerSlot[]>([]);
  const [sportFilter, setSportFilter] = useState<string>("All");
  const [booking, setBooking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([
        academyApi.getSportsTrainers(),
        academyApi.getTrainerSlots(),
      ]);
      setTrainers(t);
      setAllSlots(s);
      if (user?.id) {
        const bookings = await academyApi.getMySlotBookings(String(user.id));
        setMyBookedSlotIds(new Set(bookings.map((b) => b.slotId)));
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleSelectTrainer = useCallback(async (trainer: AcademyInstructor) => {
    setSelectedTrainer(trainer);
    setSlotsLoading(true);
    try {
      const slots = await academyApi.getTrainerSlots(trainer.id);
      setTrainerSlots(slots);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  const handleBook = useCallback(async (slot: TrainerSlot) => {
    if (!user) { toast.error("Please log in to book a slot"); return; }
    if (booking) return;
    setBooking(true);
    try {
      await academyApi.bookTrainerSlot(slot.id, {
        userId: String(user.id),
        userName: user.name || user.email || "Resident",
        tower: user.tower ?? undefined,
        flatNumber: user.flatNumber ?? undefined,
      });
      toast.success(`Slot booked with ${slot.trainerName}! See you on ${formatDate(slot.date)}`);
      setMyBookedSlotIds((prev) => new Set([...prev, slot.id]));
      // refresh slot list
      const updated = await academyApi.getTrainerSlots(slot.trainerId);
      setTrainerSlots(updated);
      setAllSlots((prev) => prev.map((s) => updated.find((u) => u.id === s.id) ?? s));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to book slot");
    } finally {
      setBooking(false);
    }
  }, [user, booking]);

  // Unique sports for filter chips
  const allSports = ["All", ...Array.from(new Set(trainers.flatMap((t) => t.sportSpecializations?.map((s) => s.sport) ?? [])))];

  const filteredTrainers = sportFilter === "All"
    ? trainers
    : trainers.filter((t) => t.sportSpecializations?.some((s) => s.sport === sportFilter));

  // Next slot per trainer
  const nextSlotByTrainer = allSlots.reduce<Record<string, TrainerSlot>>((acc, slot) => {
    if (slot.status === "OPEN" && (!acc[slot.trainerId] || slot.date < acc[slot.trainerId].date)) {
      acc[slot.trainerId] = slot;
    }
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-indigo-600" />
            Sports Trainers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {trainers.length} certified coach{trainers.length !== 1 ? "es" : ""} from your community
          </p>
        </div>
      </div>

      {/* Sport filter chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        {allSports.map((sport) => (
          <button
            key={sport}
            onClick={() => setSportFilter(sport)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
              sportFilter === sport
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            {sport !== "All" && getSportEmoji(sport)}{" "}{sport}
          </button>
        ))}
      </div>

      {/* Trainer grid */}
      {filteredTrainers.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Dumbbell className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No trainers found for {sportFilter}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrainers.map((trainer) => {
            const next = nextSlotByTrainer[trainer.id];
            return (
              <div key={trainer.id} className="relative">
                <TrainerCard trainer={trainer} onSelect={handleSelectTrainer} />
                {next && (
                  <div className="absolute top-2 right-2 pointer-events-none">
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold shadow-sm">
                      <Calendar className="w-2.5 h-2.5" />
                      {formatDate(next.date)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Trainer drawer */}
      {selectedTrainer && (
        <TrainerDrawer
          trainer={selectedTrainer}
          slots={trainerSlots}
          myBookedSlotIds={myBookedSlotIds}
          loading={slotsLoading}
          onBook={handleBook}
          onClose={() => setSelectedTrainer(null)}
        />
      )}

      {/* ── Become a Trainer ─────────────────────────────────────────── */}
      <BecomeATrainerSection />
    </div>
  );
}

// ─── Become a Trainer form ────────────────────────────────────────────────────

function BecomeATrainerSection() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    sport: "",
    certificationBody: "",
    certificationNumber: "",
    certifiedYear: "",
    ageGroupsCoached: "",
    bio: "",
    yearsOfExperience: "",
    phone: "",
  });

  const SPORTS = ["Badminton", "Cricket", "Tennis", "Football", "Basketball", "Volleyball", "Yoga", "Fitness", "Table Tennis", "Swimming", "Kabaddi", "Chess"];

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sport) { toast.error("Please select a sport"); return; }
    if (!form.bio.trim()) { toast.error("Please add a short bio"); return; }
    setSubmitting(true);
    try {
      await academyApi.applyAsInstructor({
        fullName: user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : "",
        email: user?.email ?? "",
        phone: form.phone,
        bio: form.bio,
        experienceYears: form.yearsOfExperience ? parseInt(form.yearsOfExperience) : undefined,
        isSportsTrainer: true,
        sportSpecializations: [{
          sport: form.sport,
          certificationBody: form.certificationBody || undefined,
          certificationNumber: form.certificationNumber || undefined,
          certifiedYear: form.certifiedYear ? parseInt(form.certifiedYear) : undefined,
          ageGroupsCoached: form.ageGroupsCoached || undefined,
        }],
        status: "APPLIED",
      });
      setSubmitted(true);
      toast.success("Application submitted! The admin will review and approve.");
    } catch {
      toast.error("Could not submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white";

  return (
    <div className="mt-6 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-violet-50/40 shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
          <PlusCircle className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900">Become a Trainer</p>
          <p className="text-[11px] text-slate-500">Share your expertise with the community</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && !submitted && (
        <form onSubmit={handleSubmit} className="px-4 pb-5 space-y-3 border-t border-indigo-100">
          <p className="text-[11px] text-slate-500 pt-3">Fill in the details below. An admin will review your application.</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Sport *</label>
              <select value={form.sport} onChange={set("sport")} required className={inputCls}>
                <option value="">Select sport</option>
                {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Years of Experience</label>
              <input type="number" min="0" max="50" placeholder="e.g. 5" value={form.yearsOfExperience} onChange={set("yearsOfExperience")} className={inputCls} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Certification Body</label>
              <input type="text" placeholder="e.g. BAI, BCCI, Yoga Alliance" value={form.certificationBody} onChange={set("certificationBody")} className={inputCls} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Certification Number</label>
              <input type="text" placeholder="Optional" value={form.certificationNumber} onChange={set("certificationNumber")} className={inputCls} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Year Certified</label>
              <input type="number" min="1990" max={new Date().getFullYear()} placeholder="e.g. 2019" value={form.certifiedYear} onChange={set("certifiedYear")} className={inputCls} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Age Groups Coached</label>
              <input type="text" placeholder="e.g. 8–14, Adults" value={form.ageGroupsCoached} onChange={set("ageGroupsCoached")} className={inputCls} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Contact Phone</label>
              <input type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={set("phone")} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bio *</label>
            <textarea
              rows={3}
              placeholder="Describe your coaching style, achievements and what you can offer residents…"
              value={form.bio}
              onChange={set("bio")}
              required
              className={inputCls + " resize-none"}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Dumbbell className="w-4 h-4" />}
            {submitting ? "Submitting…" : "Submit Application"}
          </button>
        </form>
      )}

      {open && submitted && (
        <div className="px-4 pb-5 pt-3 text-center border-t border-indigo-100">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">Application Submitted!</p>
          <p className="text-xs text-slate-500 mt-1">We'll notify you once the admin reviews your profile.</p>
        </div>
      )}
    </div>
  );
}
