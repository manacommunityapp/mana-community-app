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
  ShieldCheck,
  Search,
  Building,
  Save,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { eventService } from "../../../services/events/eventService";
import { userService } from "../../../services/common/userService";
import { showSuccess, showError } from "../../../utils/ToastUtils";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import { formatIndianTime, formatIndianDate } from "../../../utils/indianDateTimeUtils";

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
  const { user: authUser, isAdmin, isSuperAdmin } = useAuth();
  useEscapeKey(isOpen ? onClose : () => {});

  const userRolesUpper = (authUser?.roles || []).map((r: any) => String(r?.name || r).toUpperCase());
  const isAnyAdmin =
    isAdmin ||
    isSuperAdmin ||
    userRolesUpper.includes("ADMIN") ||
    userRolesUpper.includes("COMMUNITY_ADMIN") ||
    userRolesUpper.includes("EVENT_ADMIN") ||
    userRolesUpper.includes("EVENTS_ADMIN");

  const [participantName, setParticipantName] = useState("");
  const [phone, setPhone] = useState("");
  const [familyCount, setFamilyCount] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<string>("CONFIRMED");
  const [existingRegistration, setExistingRegistration] = useState<any | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);

  // Admin On-Behalf states
  const [registerOnBehalf, setRegisterOnBehalf] = useState<boolean>(false);
  const [communityUsers, setCommunityUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedTargetUserId, setSelectedTargetUserId] = useState<number | string | null>(null);

  // Track previous open state so typing / clicking never triggers a re-initialization reset
  const prevOpenRef = React.useRef(false);

  // Load community users for on-behalf registration
  useEffect(() => {
    if (isAnyAdmin && isOpen) {
      userService
        .getAllUsers()
        .then((users) => {
          if (Array.isArray(users)) setCommunityUsers(users);
        })
        .catch(() => {});
    }
  }, [isAnyAdmin, isOpen]);

  // Check if a resident/user already has a registration for this meal
  const checkUserRegistration = async (userName?: string, userPhone?: string, userId?: any) => {
    if (!meal?.id) return;
    setCheckingExisting(true);
    try {
      const mealIdNum = typeof meal.id === "number" ? meal.id : parseInt(String(meal.id).replace(/\D/g, ""), 10);
      if (!mealIdNum) return;
      const regs = await eventService.getLunchDinnerRegistrations(mealIdNum).catch(() => []);
      if (Array.isArray(regs) && regs.length > 0) {
        const found = regs.find((r: any) => {
          if (userId && r.userId && String(r.userId) === String(userId)) return true;
          const rName = String(r.participantName || r.primaryName || "").toLowerCase().trim();
          const rPhone = String(r.phone || "").replace(/\D/g, "");
          const qName = String(userName ?? participantName ?? "").toLowerCase().trim();
          const qPhone = String(userPhone ?? phone ?? "").replace(/\D/g, "");
          return (qPhone && rPhone && qPhone === rPhone) || (qName && rName && qName === rName);
        });
        if (found) {
          setExistingRegistration(found);
          setIsUpdateMode(true);
          setFamilyCount(Number(found.devoteeCount ?? (found as any).headCount ?? (found as any).membersCount ?? 1));
          setAttendanceStatus(found.status || "CONFIRMED");
          return;
        }
      }
      setExistingRegistration(null);
      setIsUpdateMode(false);
    } catch {
      setExistingRegistration(null);
    } finally {
      setCheckingExisting(false);
    }
  };

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
      setIsUpdateMode(false);
      setRegisterOnBehalf(false);
      setSelectedTargetUserId(null);
      setUserSearchQuery("");
      setAttendanceStatus("CONFIRMED");
      setExistingRegistration(null);

      if (!initialPhone || !initialName) {
        userService
          .getMe()
          .then((u: any) => {
            if (u) {
              const fetchedName = u.fullName || u.name || u.username || "";
              const fetchedPhone = u.phone || u.mobile || u.phoneNumber || u.contactPhone || "";
              if (fetchedName) setParticipantName((prev) => prev || fetchedName);
              if (fetchedPhone) setPhone((prev) => prev || fetchedPhone);
              checkUserRegistration(fetchedName, fetchedPhone, u.id);
            }
          })
          .catch(() => {});
      } else {
        checkUserRegistration(initialName, initialPhone, (authUser as any)?.id);
      }
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, meal]);

  if (!isOpen || !meal) return null;

  const count = Math.max(1, Number(familyCount) || 1);
  const isFree = Boolean(meal.isFree || !meal.fee || meal.fee <= 0);
  const unitFee = Number(meal.fee) || 0;
  const totalFee = isFree ? 0 : unitFee * count;

  const handleSelectUser = (u: any) => {
    const name = u.fullName || u.name || u.username || "";
    const ph = u.phone || u.mobile || u.phoneNumber || u.contactPhone || "";
    setSelectedTargetUserId(u.id);
    setParticipantName(name);
    setPhone(ph);
    setUserSearchQuery("");
    checkUserRegistration(name, ph, u.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerOnBehalf && !selectedTargetUserId && !participantName.trim()) {
      setError("Please select a resident to register on behalf of.");
      return;
    }
    if (!participantName.trim() || participantName.trim().length < 2) {
      setError("Please enter a valid participant / devotee name (at least 2 characters).");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit contact phone number.");
      return;
    }
    if (count < 1 || count > 100) {
      setError("Plate count must be between 1 and 100.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const numericMealId = typeof meal.id === "number" ? meal.id : parseInt(String(meal.id).replace(/\D/g, ""), 10) || undefined;
      const numericMainEventId = meal.mainEventId ? Number(meal.mainEventId) : undefined;
      const targetUid = selectedTargetUserId || existingRegistration?.userId || (authUser as any)?.id;

      if (isUpdateMode && (existingRegistration?.id || numericMealId)) {
        if (numericMealId) {
          await eventService.updateMealHeadCount(numericMealId, count, targetUid).catch(() => {});
        }
        if (existingRegistration?.id) {
          await eventService.updateRegistration(existingRegistration.id, {
            ...existingRegistration,
            userId: targetUid,
            participantName: participantName.trim(),
            phone: cleanPhone,
            devoteeCount: count,
            membersCount: count,
            status: attendanceStatus,
            paymentStatus: isFree ? "FREE" : existingRegistration.paymentStatus || "PAID",
          }).catch(() => {});
        }
        setIsSuccess(true);
        showSuccess(`Attendance updated for ${participantName.trim()} (${count} plates, ${attendanceStatus})!`);
      } else {
        const regPayload = {
          mealId: numericMealId,
          lunchDinnerId: numericMealId,
          eventLunchDinnerId: numericMealId,
          mainEventId: numericMainEventId,
          eventId: numericMainEventId,
          userId: targetUid,
          targetUserId: targetUid,
          registrationSource: registerOnBehalf ? "ADMIN" : "USER",
          category: "Meal",
          activityId: `meal-${meal.id}`,
          activityTitle: meal.name,
          activityType: "LUNCH_DINNER",
          mealType: meal.mealType || "LUNCH",
          participantName: participantName.trim(),
          phone: cleanPhone,
          devoteeCount: count,
          membersCount: count,
          familyCount: count,
          eventDate: meal.date,
          mealDate: meal.date,
          eventTime: meal.startTime,
          venue: meal.venue,
          bookingFee: totalFee,
          paymentStatus: isFree ? "FREE" : "PAID",
          status: attendanceStatus || "CONFIRMED",
        };
        await eventService.createMealRegistration(regPayload, {
          targetUserId: targetUid,
          adminOverride: registerOnBehalf,
        });
        setIsSuccess(true);
        showSuccess(`Meal pass confirmed for ${participantName.trim()} (${count} plate${count > 1 ? "s" : ""})!`);
      }

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
                {isUpdateMode ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Already Registered
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {isFree ? "Free Meal" : `₹${unitFee.toLocaleString("en-IN")} / head`}
                  </span>
                )}
              </div>
              <h3 className="font-black text-slate-900 text-base mt-1 line-clamp-1">
                {isUpdateMode ? "Update Attendance" : meal.name}
              </h3>
            </div>
          </div>

          {/* Quick Schedule Badges */}
          <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-500 font-semibold flex-wrap">
            {meal.date && (
              <span className="flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-lg border border-orange-100/60 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                {formatIndianDate(meal.date, "short")}
              </span>
            )}
            {meal.startTime && (
              <span className="flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-lg border border-orange-100/60 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                {formatIndianTime(meal.startTime)}{meal.endTime ? ` – ${formatIndianTime(meal.endTime)}` : ""}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
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
              <h4 className="text-base font-black text-slate-900">
                {isUpdateMode ? "Attendance Updated!" : "Registration Confirmed!"}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Meal pass for <strong className="text-slate-800">{count} member{count > 1 ? "s" : ""}</strong> has been successfully {isUpdateMode ? "updated" : "booked"} for {participantName}.
              </p>
            </div>
          ) : (
            <>
              {/* Admin On-Behalf Toggle Section */}
              {isAnyAdmin && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <div>
                      <p className="text-xs font-bold text-amber-950">Register on behalf of resident</p>
                      <p className="text-[10px] text-amber-700">Admin booking &amp; attendance management</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !registerOnBehalf;
                      setRegisterOnBehalf(next);
                      if (!next) {
                        setSelectedTargetUserId(null);
                        const myName = authUser?.fullName || (authUser as any)?.name || "";
                        const myPhone = authUser?.phone || (authUser as any)?.mobile || "";
                        setParticipantName(myName);
                        setPhone(myPhone);
                        checkUserRegistration(myName, myPhone, (authUser as any)?.id);
                      }
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition cursor-pointer ${
                      registerOnBehalf ? "bg-amber-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-xs transition ${
                        registerOnBehalf ? "translate-x-4.5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* On-behalf resident search dropdown */}
              {isAnyAdmin && registerOnBehalf && (
                <div className="rounded-2xl border border-amber-200 bg-white p-3 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-amber-600" /> Search Resident
                    </span>
                    {selectedTargetUserId && (
                      <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ Selected
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Type name, phone, or flat number..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
                    />
                    {userSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setUserSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-1 space-y-1 divide-y divide-slate-100">
                    {communityUsers
                      .filter((u) => {
                        if (!userSearchQuery.trim()) return true;
                        const q = userSearchQuery.toLowerCase();
                        const name = `${u.fullName || u.name || ""}`.toLowerCase();
                        const phoneNum = `${u.phone || u.mobile || ""}`.toLowerCase();
                        const flat = `${u.flatNo || u.unitNumber || ""}`.toLowerCase();
                        return name.includes(q) || phoneNum.includes(q) || flat.includes(q);
                      })
                      .slice(0, 8)
                      .map((u) => (
                        <div
                          key={u.id}
                          onClick={() => handleSelectUser(u)}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition ${
                            selectedTargetUserId === u.id
                              ? "bg-amber-100 text-amber-900 font-bold"
                              : "hover:bg-white text-slate-700"
                          }`}
                        >
                          <div>
                            <p className="font-semibold">{u.fullName || u.name}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                              {u.phone && <span>📞 {u.phone}</span>}
                              {u.flatNo && <span>🏠 Flat {u.flatNo}</span>}
                            </p>
                          </div>
                          {selectedTargetUserId === u.id && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Already Registered Alert / Status Banner */}
              {checkingExisting ? (
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                  <span>Checking existing meal registration status...</span>
                </div>
              ) : isUpdateMode ? (
                <div className="p-3.5 bg-blue-50/90 border border-blue-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-blue-900">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" /> Already Registered
                    </span>
                    {existingRegistration?.regCode && (
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        {existingRegistration.regCode}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-blue-800">
                    This devotee already has a registered meal pass. You can update the plate attendance and check-in status below.
                  </p>
                </div>
              ) : null}

              {/* Field 1: participantName */}
              <div>
                <label htmlFor="lunch-reg-name" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Participant / Devotee Name <span className="text-rose-500">*</span>
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
                    placeholder="Enter full name"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all"
                  />
                </div>
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
              </div>

              {/* Attendance & Check-In Status (Available when updating attendance or admin mode) */}
              {isUpdateMode && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Attendance / Check-In Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "CONFIRMED", label: "Confirmed", color: "text-emerald-700 bg-emerald-50 border-emerald-300" },
                      { id: "CHECKED_IN", label: "Checked In", color: "text-teal-700 bg-teal-50 border-teal-300" },
                      { id: "CANCELLED", label: "Cancelled", color: "text-rose-700 bg-rose-50 border-rose-300" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setAttendanceStatus(st.id)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                          attendanceStatus === st.id
                            ? `${st.color} ring-2 ring-orange-400 font-extrabold shadow-xs`
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Field 3: family count / plates count */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Plate Capacity / Devotee Count <span className="text-rose-500">*</span>
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
                      {count === 1 ? "Plate" : "Plates"}
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
                  Total devotees / plates attending this meal session
                </p>
              </div>

              {/* Total Fee Summary (if paid meal) */}
              {!isFree && (
                <div className="flex items-center justify-between p-3.5 bg-orange-50/80 border border-orange-200 rounded-2xl">
                  <div>
                    <p className="text-[11px] font-bold text-orange-950">Total Pass Fee</p>
                    <p className="text-[10px] text-orange-700">₹{unitFee.toLocaleString("en-IN")} × {count} plate{count > 1 ? "s" : ""}</p>
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
                      <span>{isUpdateMode ? "Updating..." : "Booking..."}</span>
                    </>
                  ) : (
                    <>
                      {isUpdateMode ? <Save className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>{isUpdateMode ? "Update Attendance" : "Confirm Pass"}</span>
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
