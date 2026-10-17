import { useState, useEffect, useCallback } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loader2, Star, CheckCircle2, XCircle, Clock, Zap, ShieldCheck, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { apiClient } from "../../../services/common/apiClient";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SERVICES = [
  { id: "CLEANING", emoji: "🧹", label: "Cleaning", desc: "Deep clean, kitchen, bathroom & more", color: "border-sky-400 bg-sky-50 dark:bg-sky-950/20" },
  { id: "COOKING", emoji: "👩‍🍳", label: "Cooking", desc: "Breakfast, lunch, dinner or meal prep", color: "border-orange-400 bg-orange-50 dark:bg-orange-950/20" },
  { id: "MAID", emoji: "🧺", label: "Maid", desc: "Dusting, mopping & general upkeep", color: "border-purple-400 bg-purple-50 dark:bg-purple-950/20" },
  { id: "IRONING", emoji: "👔", label: "Ironing", desc: "Formal shirts, sarees, casuals & more", color: "border-rose-400 bg-rose-50 dark:bg-rose-950/20" },
  { id: "LAUNDRY", emoji: "🫧", label: "Laundry", desc: "Wash & fold, dry clean, delicates", color: "border-teal-400 bg-teal-50 dark:bg-teal-950/20" },
  { id: "BABYSITTING", emoji: "👶", label: "Babysitting", desc: "Infant care, toddlers & school-age", color: "border-pink-400 bg-pink-50 dark:bg-pink-950/20" },
];

const SUBTASKS: Record<string, string[]> = {
  CLEANING: ["Deep Clean", "Kitchen", "Bathroom", "Windows", "Floors"],
  COOKING: ["Breakfast", "Lunch", "Dinner", "Meal Prep", "Special Occasion"],
  MAID: ["Dusting", "Mopping", "Vacuuming", "Organizing", "General"],
  IRONING: ["Regular Clothes", "Formal Shirts", "Sarees", "Trousers", "Linen"],
  LAUNDRY: ["Wash & Fold", "Dry Clean", "Delicates", "Bedsheets", "Curtains"],
  BABYSITTING: ["Infant Care", "Toddler", "School Age", "Evening", "Overnight"],
};

const DURATIONS = [
  { id: "ONE_HOUR",   label: "1 Hour",   price: 149 },
  { id: "TWO_HOURS",  label: "2 Hours",  price: 249 },
  { id: "FOUR_HOURS", label: "4 Hours",  price: 449 },
  { id: "FULL_DAY",   label: "Full Day", price: 799 },
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  MATCHED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  COMPLETED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

type Step = "select" | "details" | "matching" | "matched" | "active";
type Tab = "book" | "bookings";

interface BookingResponse {
  id?: number;
  bookingRef: string;
  serviceType: string;
  subtask: string;
  duration: string;
  priceAmount?: number;
  notes?: string;
  status: string;
  closureOtp?: string;
  helperName?: string;
  helperRating?: number;
  helperEtaMinutes?: number;
  helperDistanceLabel?: string;
  residentRating?: number;
  residentFeedback?: string;
  bookedAt: string;
  matchedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

function safeDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return "—"; }
}

function durationLabel(id: string): string {
  return DURATIONS.find((d) => d.id === id)?.label ?? id;
}

export function InstaHelp() {
  const [activeTab, setActiveTab] = useState<Tab>("book");
  const [step, setStep] = useState<Step>("select");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedSubtask, setSelectedSubtask] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [myBookings, setMyBookings] = useState<BookingResponse[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const loadMyBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const data = await apiClient.get<BookingResponse[]>("/v1/insta-help/bookings/my");
      setMyBookings(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "bookings") loadMyBookings();
  }, [activeTab, loadMyBookings]);

  const resetFlow = useCallback(() => {
    setStep("select");
    setSelectedService(null);
    setSelectedSubtask(null);
    setSelectedDuration(null);
    setNotes("");
    setBooking(null);
    setRatingValue(0);
    setRatingSubmitted(false);
  }, []);

  // Poll for status changes while a booking is live (matched or active)
  useEffect(() => {
    if (!booking || (step !== "matched" && step !== "active")) return;
    // Stop polling once the booking is in a terminal state
    if (booking.status === "COMPLETED" || booking.status === "CANCELLED") return;

    const id = setInterval(async () => {
      try {
        const bookings = await apiClient.get<BookingResponse[]>("/v1/insta-help/bookings/my");
        const updated = Array.isArray(bookings)
          ? bookings.find((b) => b.bookingRef === booking.bookingRef)
          : null;
        if (!updated || updated.status === booking.status) return;

        setBooking(updated);
        if (updated.status === "IN_PROGRESS" && step === "matched") setStep("active");
        if (updated.status === "COMPLETED") setStep("active");
        if (updated.status === "CANCELLED") {
          toast.info("Your booking was cancelled");
          resetFlow();
        }
      } catch {
        // silent — don't surface background poll errors
      }
    }, 5000);

    return () => clearInterval(id);
  }, [booking, step, resetFlow]);

  const handleBook = async () => {
    if (!selectedService || !selectedSubtask || !selectedDuration) {
      toast.error("Please complete all selections");
      return;
    }
    setLoading(true);
    setStep("matching");
    try {
      const data = await apiClient.post<BookingResponse>("/v1/insta-help/bookings", {
        serviceType: selectedService,
        subtask: selectedSubtask,
        duration: selectedDuration,
        notes: notes || undefined,
      });
      setBooking(data);
      setStep("matched");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed");
      setStep("details");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: "start" | "cancel" | "complete") => {
    if (!booking) return;
    setActionLoading(true);
    try {
      const updated = await apiClient.put<BookingResponse>(`/v1/insta-help/bookings/${booking.bookingRef}/${action}`);
      setBooking(updated);
      if (action === "start") setStep("active");
      if (action === "cancel") {
        toast.success("Booking cancelled");
        resetFlow();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRate = async () => {
    if (!booking || ratingValue === 0) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/v1/insta-help/bookings/${booking.bookingRef}/rate`, { rating: ratingValue });
      setRatingSubmitted(true);
      toast.success("Rating submitted — thank you!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rating failed");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 p-5 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
          <h1 className="text-xl font-black tracking-tight">Insta Help — Get Help in ~15 Minutes</h1>
        </div>
        <p className="text-sm text-purple-100">
          Background-verified community helpers dispatched to your door, fast.
        </p>
      </div>

      {/* Tab strip */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {(["book", "bookings"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              "px-5 py-2.5 text-xs font-bold border-b-2 transition-all",
              activeTab === t
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
            )}
          >
            {t === "book" ? "⚡ Book Now" : "📋 My Bookings"}
          </button>
        ))}
      </div>

      {activeTab === "book" && (
        <div className="space-y-4">
          {step === "select" && <ServiceSelector onSelect={(s) => { setSelectedService(s); setStep("details"); }} />}
          {step === "details" && selectedService && (
            <DetailsStep
              service={selectedService}
              subtask={selectedSubtask}
              duration={selectedDuration}
              notes={notes}
              onSubtask={setSelectedSubtask}
              onDuration={setSelectedDuration}
              onNotes={setNotes}
              onBack={() => { setSelectedService(null); setStep("select"); }}
              onBook={handleBook}
            />
          )}
          {step === "matching" && <MatchingStep />}
          {step === "matched" && booking && (
            <MatchedCard
              booking={booking}
              actionLoading={actionLoading}
              onStart={() => handleAction("start")}
              onCancel={() => handleAction("cancel")}
            />
          )}
          {step === "active" && booking && (
            <ActiveStep
              booking={booking}
              actionLoading={actionLoading}
              ratingValue={ratingValue}
              ratingSubmitted={ratingSubmitted}
              onComplete={() => handleAction("complete")}
              onRate={handleRate}
              onRatingChange={setRatingValue}
              onReset={resetFlow}
              isPolling={booking.status !== "COMPLETED" && booking.status !== "CANCELLED"}
            />
          )}
        </div>
      )}

      {activeTab === "bookings" && (
        <MyBookingsTab bookings={myBookings} loading={bookingsLoading} onRefresh={loadMyBookings} />
      )}
    </div>
  );
}

function ServiceSelector({ onSelect }: { onSelect: (s: string) => void }) {
  return (
    <div>
      <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Select a Service</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SERVICES.map((svc) => (
          <button
            key={svc.id}
            onClick={() => onSelect(svc.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 text-center hover:shadow-md transition-all",
              svc.color
            )}
          >
            <span className="text-3xl">{svc.emoji}</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{svc.label}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{svc.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function DetailsStep({
  service, subtask, duration, notes,
  onSubtask, onDuration, onNotes, onBack, onBook,
}: {
  service: string;
  subtask: string | null;
  duration: string | null;
  notes: string;
  onSubtask: (s: string) => void;
  onDuration: (d: string) => void;
  onNotes: (n: string) => void;
  onBack: () => void;
  onBook: () => void;
}) {
  const svc = SERVICES.find((s) => s.id === service)!;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white">← Back</button>
        <span className="text-lg">{svc.emoji}</span>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">{svc.label}</h2>
      </div>

      {/* Subtask chips */}
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">What specifically?</p>
        <div className="flex flex-wrap gap-2">
          {SUBTASKS[service].map((st) => (
            <button
              key={st}
              onClick={() => onSubtask(st)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                subtask === st
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-indigo-400"
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Duration cards */}
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Duration</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => onDuration(d.id)}
              className={cn(
                "flex flex-col items-center p-3 rounded-xl border-2 transition-all",
                duration === d.id
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
                  : "border-slate-200 dark:border-slate-700 hover:border-indigo-300"
              )}
            >
              <span className="text-sm font-bold text-slate-900 dark:text-white">{d.label}</span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">₹{d.price}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Notes (optional)</p>
        <textarea
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
          rows={2}
          placeholder="Any specific instructions for your helper..."
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <Button
        onClick={onBook}
        disabled={!subtask || !duration}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3"
      >
        ⚡ Book Now
      </Button>
    </div>
  );
}

function MatchingStep() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
        <span className="absolute -top-1 -right-1 text-xl">⚡</span>
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Finding your helper…</h3>
      <p className="text-sm text-slate-500 text-center">Scanning nearby verified community helpers</p>
      <div className="flex gap-1.5 mt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function MatchedCard({
  booking, actionLoading, onStart, onCancel,
}: {
  booking: BookingResponse;
  actionLoading: boolean;
  onStart: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-[#1E1E36] shadow-lg p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Booking Ref</p>
          <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">{booking.bookingRef}</p>
        </div>
        <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", STATUS_STYLES[booking.status] || STATUS_STYLES.PENDING)}>
          {booking.status}
        </span>
      </div>

      {booking.helperName && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/20">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg">
            {booking.helperName.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 dark:text-white">{booking.helperName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {booking.helperRating && (
                <span className="flex items-center gap-0.5 text-xs font-semibold text-amber-600">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {booking.helperRating.toFixed(1)}
                </span>
              )}
              {booking.helperEtaMinutes && (
                <span className="flex items-center gap-0.5 text-xs text-slate-500">
                  <Clock className="w-3 h-3" /> {booking.helperEtaMinutes} min away
                </span>
              )}
              {booking.helperDistanceLabel && (
                <span className="text-xs text-slate-500">{booking.helperDistanceLabel}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Booking summary row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Duration</p>
          <p className="text-xs font-bold text-slate-900 dark:text-white">{durationLabel(booking.duration)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Price</p>
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {booking.priceAmount != null ? `₹${booking.priceAmount}` : "—"}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">ETA</p>
          <p className="text-xs font-bold text-slate-900 dark:text-white">
            {booking.helperEtaMinutes != null ? `${booking.helperEtaMinutes} min` : "—"}
          </p>
        </div>
      </div>

      {/* OTP */}
      {booking.closureOtp && (
        <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mb-1">Closure OTP — share only at end of session</p>
          <p className="text-4xl font-black tracking-[0.3em] text-amber-900 dark:text-amber-300">{booking.closureOtp}</p>
        </div>
      )}

      {/* Trust badges */}
      <div className="flex gap-2 flex-wrap">
        <span className="flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full">
          <BadgeCheck className="w-3.5 h-3.5" /> ID Verified
        </span>
        <span className="flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" /> Aadhaar Linked
        </span>
      </div>

      <div className="flex gap-2 pt-1">
        <Button onClick={onStart} disabled={actionLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Session"}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={actionLoading} className="flex-1 border-red-300 text-red-600 hover:bg-red-50">
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ActiveStep({
  booking, actionLoading, ratingValue, ratingSubmitted, isPolling,
  onComplete, onRate, onRatingChange, onReset,
}: {
  booking: BookingResponse;
  actionLoading: boolean;
  ratingValue: number;
  ratingSubmitted: boolean;
  isPolling: boolean;
  onComplete: () => void;
  onRate: () => void;
  onRatingChange: (r: number) => void;
  onReset: () => void;
}) {
  const isCompleted = booking.status === "COMPLETED";

  return (
    <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-white dark:bg-[#1E1E36] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-white">Session {isCompleted ? "Completed" : "In Progress"}</h3>
        <div className="flex items-center gap-2">
          {isPolling && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              Live
            </span>
          )}
          <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", STATUS_STYLES[booking.status] || STATUS_STYLES.IN_PROGRESS)}>
            {booking.status?.replace("_", " ")}
          </span>
        </div>
      </div>

      {booking.helperName && (
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Helper: <span className="font-semibold">{booking.helperName}</span>
        </p>
      )}

      {!isCompleted && (
        <Button onClick={onComplete} disabled={actionLoading} className="w-full bg-green-600 hover:bg-green-700 text-white">
          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          Complete Session
        </Button>
      )}

      {isCompleted && !ratingSubmitted && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Rate your helper</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => onRatingChange(s)}>
                <Star
                  className={cn("w-8 h-8 transition-colors", s <= ratingValue ? "fill-amber-500 text-amber-500" : "text-slate-300 dark:text-slate-600")}
                />
              </button>
            ))}
          </div>
          <Button onClick={onRate} disabled={ratingValue === 0 || actionLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {actionLoading ? "Submitting…" : "Submit Rating"}
          </Button>
        </div>
      )}

      {ratingSubmitted && (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold text-sm">
          <CheckCircle2 className="w-5 h-5" /> Rating submitted — thank you!
        </div>
      )}

      {isCompleted && (
        <Button variant="outline" onClick={onReset} className="w-full mt-2">
          Book Another Service
        </Button>
      )}
    </div>
  );
}

function MyBookingsTab({
  bookings, loading, onRefresh,
}: {
  bookings: BookingResponse[];
  loading: boolean;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">My Insta Help Bookings</h2>
        <Button variant="outline" size="sm" onClick={onRefresh}>Refresh</Button>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No bookings yet. Book your first Insta Help!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => {
            const svc = SERVICES.find((s) => s.id === b.serviceType);
            return (
              <div
                key={b.bookingRef}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1E36] space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-xs font-mono text-slate-500">{b.bookingRef}</span>
                      <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", STATUS_STYLES[b.status] || "bg-slate-100 text-slate-600")}>
                        {b.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {svc?.emoji} {svc?.label ?? b.serviceType} — {b.subtask}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {durationLabel(b.duration)}
                      {b.priceAmount != null && <> · <span className="font-semibold text-indigo-600 dark:text-indigo-400">₹{b.priceAmount}</span></>}
                      {b.helperName && <> · Helper: {b.helperName}</>}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-400 shrink-0">
                    {safeDate(b.bookedAt)}
                  </div>
                </div>
                {b.status === "COMPLETED" && b.completedAt && (
                  <p className="text-[11px] text-slate-400">Completed: {safeDate(b.completedAt)}</p>
                )}
                {b.status === "CANCELLED" && b.cancelledAt && (
                  <p className="text-[11px] text-red-400">Cancelled: {safeDate(b.cancelledAt)}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
