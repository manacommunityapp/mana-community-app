import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  Users,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UtensilsCrossed,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { eventService } from "../../../services/events/eventService";
import { userService } from "../../../services/common/userService";
import { showSuccess, showError } from "../../../utils/ToastUtils";
import { useEscapeKey } from "../../../hooks/useEscapeKey";

export interface LunchDinnerMeal {
  id: number | string;
  name: string;
  mealType?: "LUNCH" | "DINNER" | "BREAKFAST" | "SNACKS" | string;
  date?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  caterer?: string;
  isFree?: boolean;
  fee?: number;
  mainEventId?: number;
  mainEventTitle?: string;
}

export interface LunchDinnerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: LunchDinnerMeal | null;
  onSuccess?: () => void;
}

export function LunchDinnerRegistrationModal({
  isOpen,
  onClose,
  meal,
  onSuccess,
}: LunchDinnerRegistrationModalProps) {
  const { user: authUser } = useAuth();
  useEscapeKey(isOpen ? onClose : () => {});

  const [participantName, setParticipantName] = useState("");
  const [phone, setPhone] = useState("");
  const [familyCount, setFamilyCount] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Track previous open state so typing / clicking never triggers a re-initialization reset
  const prevOpenRef = React.useRef(false);

  // Initialize and pre-fill form from logged-in user ONLY when modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      let initialName = authUser?.fullName || (authUser as any)?.name || (authUser as any)?.username || "";
      let initialPhone =
        authUser?.phone ||
        (authUser as any)?.mobile ||
        (authUser as any)?.phoneNumber ||
        (authUser as any)?.contactPhone ||
        "";

      // Check localStorage cache if authUser in memory was incomplete
      if (!initialPhone || !initialName) {
        try {
          const cached = localStorage.getItem("mana_user") || localStorage.getItem("mana_user_profile");
          if (cached) {
            const parsed = JSON.parse(cached);
            if (!initialName) initialName = parsed.fullName || parsed.name || parsed.username || "";
            if (!initialPhone) initialPhone = parsed.phone || parsed.mobile || parsed.phoneNumber || parsed.contactPhone || "";
          }
        } catch {}
      }

      setParticipantName(initialName);
      setPhone(initialPhone);
      setFamilyCount(1);
      setError("");
      setIsSuccess(false);

      // If still missing phone or name, fetch fresh from userService.getMe()
      if (!initialPhone || !initialName) {
        userService
          .getMe()
          .then((u: any) => {
            if (u) {
              const fetchedName = u.fullName || u.name || u.username || "";
              const fetchedPhone = u.phone || u.mobile || u.phoneNumber || u.contactPhone || "";
              if (fetchedName) setParticipantName((prev) => prev || fetchedName);
              if (fetchedPhone) setPhone((prev) => prev || fetchedPhone);
            }
          })
          .catch(() => {});
      }
    }
    prevOpenRef.current = isOpen;
  }, [isOpen]);

  if (!isOpen || !meal) return null;

  const count = Math.max(1, Number(familyCount) || 1);
  const isFree = Boolean(meal.isFree || !meal.fee || meal.fee <= 0);
  const unitFee = Number(meal.fee) || 0;
  const totalFee = isFree ? 0 : unitFee * count;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    if (count < 1) {
      setError("Family count must be at least 1.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const numericMealId = typeof meal.id === "number" ? meal.id : parseInt(String(meal.id).replace(/\D/g, ""), 10) || undefined;
      const numericMainEventId = meal.mainEventId ? Number(meal.mainEventId) : undefined;

      const regPayload = {
        mealId: numericMealId,
        lunchDinnerId: numericMealId,
        eventLunchDinnerId: numericMealId,
        mainEventId: numericMainEventId,
        eventId: numericMainEventId,
        category: "Meal",
        activityId: `meal-${meal.id}`,
        activityTitle: meal.name,
        activityType: "LUNCH_DINNER",
        mealType: meal.mealType || "LUNCH",
        participantName: participantName.trim(),
        phone: phone.trim(),
        devoteeCount: count,
        membersCount: count,
        familyCount: count,
        eventDate: meal.date,
        mealDate: meal.date,
        eventTime: meal.startTime,
        venue: meal.venue,
        bookingFee: totalFee,
        paymentStatus: isFree ? "FREE" : "PAID",
        status: "CONFIRMED",
      };

      await eventService.createMealRegistration(regPayload);

      setIsSuccess(true);
      showSuccess(`Meal pass confirmed for ${participantName.trim()} (${count} member${count > 1 ? "s" : ""})!`);
      window.dispatchEvent(new CustomEvent("mana_activities_updated"));
      window.dispatchEvent(new CustomEvent("mana_event_registration_updated"));

      setTimeout(() => {
        onSuccess?.();
        onClose();
        setIsSuccess(false);
      }, 1200);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to register for meal. Please try again.";
      setError(msg);
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-amber-50 via-orange-50/60 to-white border-b border-orange-100/80">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors cursor-pointer shadow-2xs"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                  {meal.mealType || "MEAL PASS"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {isFree ? "Free Meal" : `₹${unitFee.toLocaleString("en-IN")} / head`}
                </span>
              </div>
              <h3 className="font-black text-slate-900 text-base mt-1 line-clamp-1">
                {meal.name}
              </h3>
            </div>
          </div>

          {/* Quick Schedule Badges */}
          <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-500 font-semibold flex-wrap">
            {meal.date && (
              <span className="flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-lg border border-orange-100/60 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                {meal.date}
              </span>
            )}
            {meal.startTime && (
              <span className="flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-lg border border-orange-100/60 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                {meal.startTime}{meal.endTime ? ` – ${meal.endTime}` : ""}
              </span>
            )}
            {meal.venue && (
              <span className="flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-lg border border-orange-100/60 shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                {meal.venue}
              </span>
            )}
          </div>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2.5 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-slate-900">Registration Confirmed!</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Meal pass for <strong className="text-slate-800">{count} member{count > 1 ? "s" : ""}</strong> has been successfully booked for {participantName}.
              </p>
            </div>
          ) : (
            <>
              {/* Field 1: participantName */}
              <div>
                <label htmlFor="lunch-reg-name" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Participant Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="lunch-reg-name"
                    name="participantName"
                    type="text"
                    autoComplete="name"
                    required
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 pl-1">
                  Pre-filled from your logged-in account
                </p>
              </div>

              {/* Field 2: phone */}
              <div>
                <label htmlFor="lunch-reg-phone" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    id="lunch-reg-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 pl-1">
                  Used for meal pass notifications and coordination
                </p>
              </div>

              {/* Field 3: family count (overall number input) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Family Count (Overall Members) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3 bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-2.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setFamilyCount((prev) => Math.max(1, (Number(prev) || 1) - 1));
                    }}
                    disabled={count <= 1}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-black text-lg flex items-center justify-center hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-xs active:scale-95"
                    aria-label="Decrease member count"
                  >
                    −
                  </button>

                  <div className="flex-1 flex items-center justify-center gap-2">
                    <Users className="w-4 h-4 text-orange-500" />
                    <input
                      id="lunch-reg-family-count"
                      name="familyCount"
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={familyCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setFamilyCount(isNaN(val) ? 1 : Math.max(1, Math.min(100, val)));
                      }}
                      className="w-16 text-center text-xl font-black text-slate-900 bg-transparent focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-500">
                      {count === 1 ? "Member" : "Members"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setFamilyCount((prev) => Math.min(100, (Number(prev) || 1) + 1));
                    }}
                    disabled={count >= 100}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-black text-lg flex items-center justify-center hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-xs active:scale-95"
                    aria-label="Increase member count"
                  >
                    +
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 pl-1">
                  Total devotees / family members attending this meal
                </p>
              </div>

              {/* Total Fee Summary (if paid meal) */}
              {!isFree && (
                <div className="flex items-center justify-between p-3.5 bg-orange-50/80 border border-orange-200 rounded-2xl">
                  <div>
                    <p className="text-[11px] font-bold text-orange-950">Total Pass Fee</p>
                    <p className="text-[10px] text-orange-700">₹{unitFee.toLocaleString("en-IN")} × {count} member{count > 1 ? "s" : ""}</p>
                  </div>
                  <span className="text-base font-black text-orange-800">
                    ₹{totalFee.toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 rounded-2xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Booking...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Pass</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
