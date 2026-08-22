import React, { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  X,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Flame,
  CheckCircle2,
  RefreshCw,
  Edit3,
  Loader2,
  ShieldCheck,
  Database,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { userService } from "../../../services/common/userService";
import { eventService, type PoojaRegistrationRequest } from "../../../services/events/eventService";
import { isRegistrationClosed, isPoojaSlotPassed } from "../../../utils/eventDeadlineUtils";
import { showSuccess, showWarning } from "../../../utils/ToastUtils";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import { GlassCard, TouchButton } from "./redesign/EventDesignSystem";

export interface PoojaRegistrationModalProps {
  isOpen?: boolean;
  isDark?: boolean;
  onClose: () => void;
  event: {
    id?: string | number;
    title?: string;
    name?: string;
    description?: string;
    category?: string;
    type?: string;
    price?: string | number;
    fee?: string | number;
    isFree?: boolean;
    date?: string;
    startDate?: string;
    endDate?: string;
    isMultiDay?: boolean;
    multiDay?: boolean;
    time?: string;
    startTime?: string;
    startTimes?: string[];
    venue?: string;
    mandap?: string;
    pandit?: string;
    priestName?: string;
    availableSeats?: number;
    slots?: number | string;
    parentEventTitle?: string;
    gotram?: string;
    notes?: string | null;
    samagri?: string | null;
    existingRegistration?: any;
    registrationId?: string | number;
    isUpdateMode?: boolean;
    timeSlotConfig?: any;
  };
  onSuccess?: () => void;
}

interface DaySlotOption {
  icon: string;
  time: string;
  name: string;
  left: number;
}

interface DaySchedule {
  id: number;
  dayLabel: string;
  dateStr: string;
  shortDate: string;
  dateValue?: string;
  slots: DaySlotOption[];
}

function parsePoojaDate(val: any): Date | null {
  if (!val) return null;
  const clean = String(val).trim();
  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
  }
  // Try dd-mm-yyyy or dd/mm/yyyy
  const dmyMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    return new Date(parseInt(dmyMatch[3], 10), parseInt(dmyMatch[2], 10) - 1, parseInt(dmyMatch[1], 10));
  }
  const d = new Date(clean);
  return isNaN(d.getTime()) ? null : d;
}

function formatPoojaDate(d: Date): { dayLabel: string; dateStr: string; shortDate: string } {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayOfWeek = dayNames[d.getDay()];
  const dateStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  const shortDate = `${d.getDate()} ${months[d.getMonth()]}`;
  return { dayLabel: dayOfWeek, dateStr, shortDate };
}

function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeSlotStartTime(time: string): string {
  return String(time || "")
    .replace(/\(.*?\)/g, "")
    .split(/[–-]/)[0]
    .trim();
}

function makeSlotSelectionKey(day: DaySchedule | undefined, slot: DaySlotOption | undefined): string {
  if (!day || !slot) return "";
  return `${day.dateValue || day.dateStr}__${normalizeSlotStartTime(slot.time)}__${slot.name}`;
}

function buildPoojaScheduleDays(event: any, slots: DaySlotOption[]): DaySchedule[] {
  let startRaw = event?.startDate || event?.date;
  let endRaw = event?.endDate;
  let isMultiDay = Boolean(event?.isMultiDay || event?.multiDay);

  // If date contains a range format like "2026-08-28 to 2026-08-30" or "28 Aug to 30 Aug"
  if (typeof startRaw === "string" && (startRaw.includes(" to ") || startRaw.includes(" - "))) {
    const delimiter = startRaw.includes(" to ") ? " to " : " - ";
    const parts = startRaw.split(delimiter);
    startRaw = parts[0].trim();
    if (!endRaw && parts[1]) {
      endRaw = parts[1].trim();
    }
    isMultiDay = true;
  }

  if (!startRaw || startRaw === "Upcoming") {
    return [
      {
        id: 1,
        dayLabel: "Day 1 (Main Day)",
        dateStr: "Pooja Day",
        shortDate: "Day 1",
        dateValue: undefined,
        slots,
      },
    ];
  }

  const startDate = parsePoojaDate(startRaw);
  const endDate = endRaw ? parsePoojaDate(endRaw) : null;

  if (!startDate) {
    return [
      {
        id: 1,
        dayLabel: "Day 1 (Main Day)",
        dateStr: String(startRaw),
        shortDate: String(startRaw),
        dateValue: String(startRaw),
        slots,
      },
    ];
  }

  // Multi-day Pooja with multiple sequential calendar days
  if ((isMultiDay || (endDate && endDate.getTime() > startDate.getTime())) && endDate && endDate.getTime() >= startDate.getTime()) {
    const timeSlotConfig: { slotDate: string | null; startTime: string; slotCount: number }[] =
      Array.isArray(event?.timeSlotConfig) ? event.timeSlotConfig : [];
    const days: DaySchedule[] = [];
    const cur = new Date(startDate.getTime());
    let count = 1;
    while (cur.getTime() <= endDate.getTime() && count <= 30) {
      const { dayLabel, dateStr, shortDate } = formatPoojaDate(cur);
      const dateKey = formatDateKey(cur);
      const dayConfigs = timeSlotConfig.filter(e => e.slotDate === dateKey);
      const daySpecificSlots: DaySlotOption[] = dayConfigs.length > 0
        ? slots.map(s => {
            const rawTime = normalizeSlotStartTime(s.time);
            const match = dayConfigs.find(e => s.time.includes(e.startTime) || e.startTime === rawTime);
            return match ? { ...s, left: match.slotCount } : s;
          })
        : slots;
      days.push({
        id: count,
        dayLabel: `Day ${count} (${dayLabel})`,
        dateStr,
        shortDate,
        dateValue: dateKey,
        slots: daySpecificSlots,
      });
      cur.setDate(cur.getDate() + 1);
      count++;
    }    const startFmt = formatPoojaDate(startDate);
    return days.length > 0
      ? days
      : [
          {
            id: 1,
            dayLabel: `Day 1 (${startFmt.dayLabel})`,
            dateStr: startFmt.dateStr,
            shortDate: startFmt.shortDate,
            dateValue: formatDateKey(startDate),
            slots,
          },
        ];
  }

  // Single Day Pooja
  const { dayLabel, dateStr, shortDate } = formatPoojaDate(startDate);
  const dateKey = formatDateKey(startDate);
  const singleDayConfigs: { slotDate: string | null; startTime: string; slotCount: number }[] =
    Array.isArray(event?.timeSlotConfig) ? event.timeSlotConfig.filter((e: any) => !e.slotDate) : [];
  const singleDaySlots: DaySlotOption[] = singleDayConfigs.length > 0
    ? slots.map(s => {
        const rawTime = normalizeSlotStartTime(s.time);
        const match = singleDayConfigs.find(e => s.time.includes(e.startTime) || e.startTime === rawTime);
        return match ? { ...s, left: match.slotCount } : s;
      })
    : slots;
  return [
    {
      id: 1,
      dayLabel: `Day 1 (${dayLabel})`,
      dateStr,
      shortDate,
      dateValue: dateKey,
      slots: singleDaySlots,
    },
  ];
}

export const PoojaRegistrationModal: React.FC<PoojaRegistrationModalProps> = ({
  isOpen = true,
  isDark = false,
  onClose,
  event,
  onSuccess,
}) => {
  const { user: authUser } = useAuth();
  const isAnyAdmin = Boolean(
    authUser?.role?.toLowerCase().includes("admin") ||
    authUser?.role?.toLowerCase().includes("event_admin") ||
    authUser?.role?.toLowerCase().includes("super_admin") ||
    authUser?.role?.toLowerCase().includes("community_admin")
  );
  useEscapeKey(onClose);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedDayId, setSelectedDayId] = useState<number>(1);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>("08:30 AM – 10:00 AM");
  const [selectedSlotName, setSelectedSlotName] = useState<string>("Morning Homam");
  const [selectedSlotKey, setSelectedSlotKey] = useState<string>("");
  const [gotram, setGotram] = useState<string>(
    () => event?.gotram || event?.existingRegistration?.gotram || ""
  );
  const [isGotramLoading, setIsGotramLoading] = useState<boolean>(!event?.gotram && !event?.existingRegistration?.gotram);
  const [isGotramFromDb, setIsGotramFromDb] = useState<boolean>(Boolean(event?.gotram || event?.existingRegistration?.gotram));
  const [prasadamMode, setPrasadamMode] = useState<"mandap">("mandap");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [passNumber] = useState<number>(() => Math.floor(1000 + Math.random() * 9000));
  const [copiedPass, setCopiedPass] = useState<boolean>(false);

  // Admin on-behalf registration states
  const [registerOnBehalf, setRegisterOnBehalf] = useState<boolean>(false);
  const [communityUsers, setCommunityUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState<boolean>(false);
  const [selectedTargetUserId, setSelectedTargetUserId] = useState<number | null>(null);

  // Load community users for Admin on-behalf registration
  useEffect(() => {
    if (isAnyAdmin) {
      userService
        .getAllUsers()
        .then((users) => {
          if (Array.isArray(users)) setCommunityUsers(users);
        })
        .catch((err) => {
          console.warn("Could not load community users for pooja admin registration:", err);
        });
    }
  }, [isAnyAdmin]);

  // Existing registration / Update mode detection
  const [existingReg, setExistingReg] = useState<any>(() => event?.existingRegistration || null);
  const isUpdateMode = Boolean(event?.isUpdateMode || existingReg);
  const existingRegId = event?.registrationId || existingReg?.id || (event as any)?.regId;
  const isPoojaClosed = isRegistrationClosed(event) && !isUpdateMode;
  const maxPoojaSlots = Number(event?.availableSeats ?? event?.slots ?? 0);
  const isPoojaFull = !isUpdateMode && event?.availableSeats !== undefined && Number(event?.availableSeats) <= 0;

  // User details
  const [devoteeName, setDevoteeName] = useState<string>("");
  const [devoteePhone, setDevoteePhone] = useState<string>("");
  const [devoteeFlat, setDevoteeFlat] = useState<string>("");

  // Helper to extract flat number from user profile objects
  const resolveUserFlat = (u: any): string => {
    if (!u) return "";
    const block = u.block || u.tower || u.wing || "";
    const rawFlat = u.flatNo || u.flatNumber || u.flat || u.unit || u.unitNo || u.apartmentNo || "";
    if (block && rawFlat) {
      if (String(rawFlat).toUpperCase().startsWith(String(block).toUpperCase())) {
        return String(rawFlat);
      }
      return `${block}-${rawFlat}`;
    }
    return rawFlat || (block ? `Block ${block}` : "");
  };

  // Sync profile details for name/phone/flat from logged in user details
  useEffect(() => {
    if (registerOnBehalf) return;
    // 1. Check AuthContext user
    if (authUser) {
      const flat = resolveUserFlat(authUser);
      if (authUser.fullName) setDevoteeName(authUser.fullName);
      if (authUser.phone) setDevoteePhone(authUser.phone);
      if (flat) setDevoteeFlat(flat);
    }

    // 2. Check localStorage cached profile
    try {
      const cached = localStorage.getItem("mana_user") || localStorage.getItem("mana_user_profile");
      if (cached) {
        const parsed = JSON.parse(cached);
        const flat = resolveUserFlat(parsed);
        if (parsed.fullName || parsed.name) setDevoteeName((prev) => prev || parsed.fullName || parsed.name);
        if (parsed.phone || parsed.mobile) setDevoteePhone((prev) => prev || parsed.phone || parsed.mobile);
        if (flat) setDevoteeFlat((prev) => prev || flat);
      }
    } catch {}

    // 3. Fetch latest from userService.getMe()
    userService
      .getMe()
      .then((u: any) => {
        if (u) {
          const flat = resolveUserFlat(u);
          if (u.fullName || u.name) setDevoteeName(u.fullName || u.name);
          if (u.phone || u.mobile) setDevoteePhone(u.phone || u.mobile);
          if (flat) setDevoteeFlat(flat);
        }
      })
      .catch(() => {});
  }, [authUser, registerOnBehalf]);

  // Build day schedule from event details
  const poojaTitle = event?.title || event?.name || "Maha Ganapathi Homam & Sahasranama Archana";
  const baseDate = event?.date || event?.startDate || "28 Aug 2026";
  const venueName = event?.venue || event?.mandap || "Central Temple Mandap";
  const priestName = event?.pandit || event?.priestName || "Pt. Ramachandra Sharma";
  const totalSlotsCount = Number(event?.availableSeats || event?.slots || 24);

  // Fetch Gotram and registration strictly from backend database event registrations (/api/events/registrations/my)
  useEffect(() => {
    setIsGotramLoading(true);
    eventService
      .getMyRegistrations()
      .then((regs) => {
        if (Array.isArray(regs) && regs.length > 0) {
          const activeRegs = regs.filter((r: any) => r.status !== "CANCELLED");

          const currentEventReg = activeRegs.find((r: any) => {
            if (r.activityId && (r.activityId === event?.id || String(r.activityId) === String(event?.id))) return true;
            if (event?.id && String(event.id).includes("-")) {
              const rawId = String(event.id).split("-")[1];
              if (r.activityId && (r.activityId === rawId || r.activityId === event.id)) return true;
              if (r.eventId && String(r.eventId) === rawId) return true;
            }
            const cleanPoojaTitle = (poojaTitle || "").trim().toLowerCase();
            const cleanRegTitle = (r.activityTitle || r.eventName || "").trim().toLowerCase();
            if (
              cleanPoojaTitle &&
              cleanRegTitle &&
              (cleanPoojaTitle === cleanRegTitle ||
                cleanPoojaTitle.includes(cleanRegTitle) ||
                cleanRegTitle.includes(cleanPoojaTitle))
            ) {
              return true;
            }
            return false;
          });

          // Gotram from database event registration
          const dbGotram =
            currentEventReg?.gotram ||
            currentEventReg?.formData?.gotram ||
            currentEventReg?.attendees?.[0]?.gotram ||
            activeRegs.find((r: any) => r.gotram && String(r.gotram).trim())?.gotram ||
            activeRegs.find((r: any) => r.formData?.gotram && String(r.formData.gotram).trim())?.formData?.gotram ||
            activeRegs.find((r: any) => r.attendees?.[0]?.gotram && String(r.attendees[0].gotram).trim())?.attendees?.[0]?.gotram;

          if (dbGotram && String(dbGotram).trim()) {
            setGotram(String(dbGotram).trim());
            setIsGotramFromDb(true);
          } else {
            setGotram("");
            setIsGotramFromDb(false);
          }

          if (currentEventReg) {
            setExistingReg(currentEventReg);
            if (currentEventReg.prasadamMode) setPrasadamMode(currentEventReg.prasadamMode);
            if (currentEventReg.participantName || currentEventReg.primaryName) {
              setDevoteeName(currentEventReg.participantName || currentEventReg.primaryName);
            }
            if (currentEventReg.phone) setDevoteePhone(currentEventReg.phone);
            if (currentEventReg.flatNo) setDevoteeFlat(currentEventReg.flatNo);
          }
        } else {
          setGotram("");
          setIsGotramFromDb(false);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch database event registrations for Gotram:", err);
      })
      .finally(() => {
        setIsGotramLoading(false);
      });
  }, [event?.id, poojaTitle]);

  // Compute numeric fee
  const rawFee = event?.fee ?? event?.price ?? 0;
  const isFreeEvent =
    event?.isFree === true ||
    rawFee === 0 ||
    String(rawFee).toLowerCase() === "free";
  const numericFee = isFreeEvent
    ? 0
    : typeof rawFee === "number"
    ? rawFee
    : parseFloat(String(rawFee).replace(/[^0-9.]/g, "")) || 0;

  // Derive configured start times if available from Pooja event creation
  const scheduleDays = React.useMemo(() => {
    const configuredTimes: string[] = Array.isArray((event as any)?.startTimes) && (event as any).startTimes.filter(Boolean).length > 0
      ? (event as any).startTimes.filter(Boolean)
      : event?.time && event.time.includes(",")
      ? event.time.split(",").map((t: string) => t.trim()).filter(Boolean)
      : event?.startTime
      ? [event.startTime]
      : event?.time
      ? [event.time]
      : [];

    const timeSlotConfigs: { slotDate: string | null; startTime: string; slotCount: number }[] =
      Array.isArray((event as any)?.timeSlotConfig) ? (event as any).timeSlotConfig : [];

    const defaultSlots: DaySlotOption[] = configuredTimes.length > 0
      ? configuredTimes.map((t, idx) => {
          const icon = idx === 0 ? "🌅" : idx === 1 ? "☀️" : idx === 2 ? "🪔" : "✨";
          const sessionName = configuredTimes.length === 1
            ? (poojaTitle || "Pooja Seva")
            : idx === 0
            ? "Morning Session"
            : idx === 1
            ? "Afternoon Session"
            : idx === 2
            ? "Evening Session"
            : `Session #${idx + 1}`;
          const cleanTime = String(t).replace(/\(.*?\)/g, "").trim();
          const rawTime = cleanTime.split(" ")[0];
          const formattedTime = cleanTime.includes("–") || cleanTime.includes("-") || cleanTime.toLowerCase().includes("am") || cleanTime.toLowerCase().includes("pm")
            ? cleanTime
            : `${cleanTime} onwards`;

          const matchedSingleConfig = timeSlotConfigs.find(
            c => (!c.slotDate || c.slotDate === event?.startDate || c.slotDate === event?.date) &&
                 (c.startTime === cleanTime || c.startTime === rawTime)
          );
          const slotLeft = matchedSingleConfig ? matchedSingleConfig.slotCount : totalSlotsCount;

          return {
            icon,
            time: formattedTime,
            name: sessionName,
            left: Math.max(1, slotLeft),
          };
        })
      : [
          { icon: "🌅", time: "08:30 AM – 10:00 AM", name: "Morning Homam & Sankalpam", left: Math.max(1, totalSlotsCount) },
          { icon: "🪔", time: "06:30 PM – 08:00 PM", name: "Sandhya Aarti & Archana", left: Math.max(1, totalSlotsCount) },
        ];

    return buildPoojaScheduleDays(event, defaultSlots);
  }, [event?.id, event?.startDate, event?.date, event?.endDate, event?.time, poojaTitle, totalSlotsCount, event?.timeSlotConfig]);

  // Sync initial selection to first day / first slot of created pooja
  useEffect(() => {
    if (scheduleDays.length > 0) {
      const firstDay = scheduleDays[0];
      setSelectedDayId(firstDay.id);
      if (firstDay.slots.length > 0) {
        const firstSlot = firstDay.slots[0];
        setSelectedSlotTime(firstSlot.time);
        setSelectedSlotName(firstSlot.name);
        setSelectedSlotKey(makeSlotSelectionKey(firstDay, firstSlot));
      }
    }
  }, [scheduleDays]);

  const currentDay = scheduleDays.find((d) => d.id === selectedDayId) || scheduleDays[0];
  const selectedSlot =
    currentDay?.slots.find((s) => makeSlotSelectionKey(currentDay, s) === selectedSlotKey) ||
    currentDay?.slots.find((s) => s.time === selectedSlotTime && s.name === selectedSlotName) ||
    currentDay?.slots[0];
  const selectedSlotDisplayTime = selectedSlot?.time || selectedSlotTime;
  const selectedSlotDisplayName = selectedSlot?.name || selectedSlotName;
  const selectedSlotStartTime = normalizeSlotStartTime(selectedSlotDisplayTime);
  const selectedDateValue = currentDay?.dateValue || currentDay?.dateStr || "";
  const selectedDateDisplay = currentDay?.dateStr || selectedDateValue || baseDate;

  const steps = [
    { num: 1, title: "Date & Slot" },
    { num: 2, title: "Registrant" },
    { num: 3, title: "Prasadam" },
    { num: 4, title: isUpdateMode ? "Confirm Update" : isFreeEvent ? "Confirm" : "Payment" },
  ];

  const handleNext = () => {
    if (isPoojaFull) {
      showWarning("This Pooja Seva is fully booked. No slots remaining.");
      return;
    }
    if (isPoojaClosed) {
      showWarning("Registration for this pooja seva has ended.");
      return;
    }
    if (currentStep === 1 && (!currentDay || !selectedSlot)) {
      showWarning("Please select one pooja date and one time slot.");
      return;
    }
    if (currentStep === 1 && selectedSlot && selectedSlot.left <= 0) {
      showWarning("The selected time slot is full. Please choose another session.");
      return;
    }
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleBookingConfirm = async (paymentMode: string = "UPI") => {
    if (isPoojaFull) {
      showWarning("This Pooja Seva is fully booked. No slots remaining.");
      return;
    }
    if (isPoojaClosed) {
      showWarning("Registration for this pooja seva has ended.");
      return;
    }
    if (!currentDay || !selectedSlot) {
      showWarning("Please select one pooja date and one time slot.");
      return;
    }
    if (selectedSlot && selectedSlot.left <= 0) {
      showWarning("The selected time slot is full. Please choose another session.");
      return;
    }

    setIsSubmitting(true);
    try {
      const regPayload: PoojaRegistrationRequest = {
        eventId: event?.id ? (typeof event.id === "number" ? event.id : Number(String(event.id).replace(/\D/g, "")) || 1) : 1,
        activityId: event?.id ? String(event.id) : undefined,
        eventName: poojaTitle,
        activityTitle: poojaTitle,
        category: "Pooja",
        primaryName: devoteeName,
        participantName: devoteeName,
        phone: devoteePhone,
        email: authUser?.email || "",
        gotram: gotram ? gotram.trim() : undefined,
        flatNo: devoteeFlat,
        devoteeCount: 1,
        passType: "Pooja Registration Pass",
        poojaSlot: `${selectedDateDisplay} • ${selectedSlotDisplayTime} (${selectedSlotDisplayName})`,
        poojaSlotDate: selectedDateValue,
        poojaSlotTime: selectedSlotStartTime,
        poojaSlotName: selectedSlotDisplayName,
        slotDate: selectedDateValue,
        slotTime: selectedSlotStartTime,
        timeSlot: selectedSlotDisplayTime,
        timeSlotName: selectedSlotDisplayName,
        eventDate: selectedDateValue,
        eventDateDisplay: selectedDateDisplay,
        eventTime: selectedSlotStartTime,
        eventTimeDisplay: selectedSlotDisplayTime,
        venue: venueName,
        bookingFee: numericFee,
        paymentStatus: numericFee === 0 ? "FREE" : "PAID",
        paymentMethod: numericFee === 0 ? "Free Seva" : paymentMode,
        prasadamMode,
        status: "CONFIRMED",
      };

      if (isUpdateMode && existingRegId) {
        const numericId = typeof existingRegId === "number" ? existingRegId : Number(String(existingRegId).replace(/\D/g, ""));
        if (!isNaN(numericId) && numericId > 0) {
          try {
            await eventService.updatePoojaRegistration(numericId, regPayload);
            showSuccess("🪔 Pooja registration updated successfully!");
          } catch (apiErr: any) {
            const errMsg = apiErr?.response?.data?.message || apiErr?.message || "Failed to update pooja registration.";
            showWarning(errMsg);
            return;
          }
        }
      } else {
        try {
          await eventService.createPoojaRegistration(regPayload);
          showSuccess("🪔 Pooja Seva booked successfully! Digital Sankalpam Pass generated.");
        } catch (apiErr: any) {
          const errMsg = apiErr?.response?.data?.message || apiErr?.message || "";
          console.warn("Backend createPoojaRegistration API note, trying fallback register:", apiErr);
          if (errMsg && (errMsg.toLowerCase().includes("deadline") || errMsg.toLowerCase().includes("passed") || errMsg.toLowerCase().includes("cancelled") || errMsg.toLowerCase().includes("ended") || errMsg.toLowerCase().includes("full"))) {
            showWarning(errMsg);
            return;
          }
          if (event?.id) {
            const numericEventId = typeof event.id === "number" ? event.id : Number(String(event.id).replace(/\D/g, ""));
            if (!isNaN(numericEventId) && numericEventId > 0) {
              try {
                await eventService.register(numericEventId);
                showSuccess("🪔 Pooja Seva booked successfully! Digital Sankalpam Pass generated.");
              } catch (regErr: any) {
                const regErrMsg = regErr?.response?.data?.message || regErr?.message || "Registration deadline has passed. Contact admin for manual registration.";
                showWarning(regErrMsg);
                return;
              }
            }
          } else {
            if (errMsg) {
              showWarning(errMsg);
              return;
            }
          }
        }
      }

      window.dispatchEvent(new Event("mana_activities_updated"));
      window.dispatchEvent(new Event("mana_registrations_updated"));

      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || "Registration deadline has passed. Contact admin for manual registration.";
      console.error("Failed to process pooja registration:", err);
      showWarning(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPassCode = () => {
    navigator.clipboard.writeText(`POOJA-${passNumber}`);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/70 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-lg sm:max-w-xl md:max-w-2xl bg-card text-card-foreground rounded-3xl p-4 sm:p-6 shadow-2xl border border-border min-h-[85vh] sm:min-h-[620px] max-h-[94vh] flex flex-col justify-between overflow-y-auto animate-scaleUp">
        <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
          <div className="min-w-0 pr-3">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider mb-0.5">
              {isUpdateMode ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Edit3 className="w-3 h-3" />
                  <span>Update Pooja Registration</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-primary">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pooja Registration Portal</span>
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-xl font-black text-foreground truncate">{poojaTitle}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary" />
                {scheduleDays.length > 1
                  ? `${scheduleDays[0].dateStr} to ${scheduleDays[scheduleDays.length - 1].dateStr} (${scheduleDays.length} Days)`
                  : baseDate}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary" /> {venueName}
              </span>
              <span>•</span>
              <span>🙏 {priestName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isFreeEvent && numericFee > 0 && (
              <span className="text-xs font-black px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/20">
                ₹{numericFee}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isSuccess && (
          <div className="flex items-center justify-between px-1 py-1 shrink-0 my-2">
            {steps.map((s, idx) => {
              const isActive = currentStep === s.num;
              const isDone = currentStep > s.num;

              return (
                <React.Fragment key={s.num}>
                  <div
                    className={`flex flex-col items-center gap-1 select-none transition-all ${s.num < currentStep ? "cursor-pointer" : "cursor-default"}`}
                    onClick={() => s.num < currentStep && setCurrentStep(s.num)}
                  >
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                        isDone
                          ? "bg-emerald-500 text-white shadow-xs"
                          : isActive
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-md scale-105"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                    </div>
                    <span
                      className={`text-[9.5px] sm:text-[10.5px] font-bold ${
                        isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`flex-1 h-[2px] mx-1.5 sm:mx-2 rounded-full transition-colors ${
                        currentStep > idx + 1 ? "bg-emerald-500" : "bg-border"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {!isSuccess ? (
          <GlassCard
            isDark={isDark}
            hoverScale={false}
            className="flex-1 flex flex-col justify-between p-4 sm:p-5 border border-border rounded-2xl overflow-y-auto space-y-4 shadow-xs my-2 bg-muted/20"
          >
            {isPoojaFull && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Pooja capacity reached (Housefull). All seva slots have been booked.</span>
              </div>
            )}
            {isPoojaClosed && !isPoojaFull && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Pooja registration has closed. New seva bookings are no longer accepted.</span>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-3.5 flex-1">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                      <span>Select Pooja Date &amp; Time Slot</span>
                      {scheduleDays.length > 1 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          {scheduleDays.length}-Day Utsav
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {scheduleDays.length > 1
                        ? `Multi-Day Event • Select your preferred ritual day (${scheduleDays[0].shortDate} – ${scheduleDays[scheduleDays.length - 1].shortDate}) and session`
                        : "Choose your preferred ritual session slot"}
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {totalSlotsCount} Total Slots
                  </span>
                </div>

                <div className={`grid gap-2 ${scheduleDays.length === 1 ? "grid-cols-1" : scheduleDays.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
                  {scheduleDays.map((d) => {
                    const isSelected = d.id === selectedDayId;
                    return (
                      <div
                        key={d.id}
                        onClick={() => {
                          setSelectedDayId(d.id);
                          if (d.slots && d.slots.length > 0) {
                            const firstSlot = d.slots[0];
                            setSelectedSlotTime(firstSlot.time);
                            setSelectedSlotName(firstSlot.name);
                            setSelectedSlotKey(makeSlotSelectionKey(d, firstSlot));
                          }
                        }}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer select-none text-left ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20"
                            : "border-border bg-card hover:border-primary/50"
                        }`}
                      >
                        <span className={`block text-[10px] font-bold uppercase ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                          {d.dayLabel}
                        </span>
                        <strong className="text-xs sm:text-sm font-black text-foreground block mt-0.5">{d.dateStr}</strong>
                        <span className="text-[10px] text-muted-foreground">
                          {d.slots.length} {d.slots.length === 1 ? "Session" : "Sessions"} Available
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3.5 rounded-2xl bg-card border border-border space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground px-1">
                    <span>Available Sessions for {currentDay.dateStr}:</span>
                    <span className="text-primary text-xs font-semibold">Select 1 session</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    {currentDay?.slots.map((s) => {
                      const slotKey = makeSlotSelectionKey(currentDay, s);
                      const isSlotSelected = selectedSlotKey === slotKey;
                      const isSlotPassed = isPoojaSlotPassed(currentDay.dateValue, s.time) || isPoojaClosed;

                      return (
                        <div
                          key={slotKey}
                          onClick={() => {
                            if (isSlotPassed) return;
                            setSelectedSlotTime(s.time);
                            setSelectedSlotName(s.name);
                            setSelectedSlotKey(slotKey);
                          }}
                          className={`p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                            isSlotSelected
                              ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                              : isSlotPassed
                              ? "border-border bg-muted/40 opacity-60 cursor-not-allowed"
                              : "border-border bg-card hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="block text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">{s.name}</span>
                              <strong className="block mt-1 text-xs font-black text-foreground">{s.time}</strong>
                            </div>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
                              {s.left} left
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-3.5 flex-1">
                <div className="border-b border-border pb-2">
                  <h3 className="text-sm font-extrabold text-foreground">Registrant Details</h3>
                  <p className="text-[11px] text-muted-foreground">Share the details for the seva devotee and family information.</p>
                </div>

                <div className="space-y-3">
                  <div className="grid gap-3">
                    <label className="block text-[11px] font-bold text-foreground">
                      <span className="mb-1.5 block">Yajaman / Devotee Name</span>
                      <input
                        value={devoteeName}
                        onChange={(e) => setDevoteeName(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Enter devotee name"
                      />
                    </label>
                    <label className="block text-[11px] font-bold text-foreground">
                      <span className="mb-1.5 block">Phone Number</span>
                      <input
                        value={devoteePhone}
                        onChange={(e) => setDevoteePhone(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Enter phone number"
                      />
                    </label>
                    <label className="block text-[11px] font-bold text-foreground">
                      <span className="mb-1.5 block">Flat / Block</span>
                      <input
                        value={devoteeFlat}
                        onChange={(e) => setDevoteeFlat(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Flat or block"
                      />
                    </label>
                    <label className="block text-[11px] font-bold text-foreground">
                      <span className="mb-1.5 block">Gotram</span>
                      <input
                        value={gotram}
                        onChange={(e) => setGotram(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Optional gotram"
                      />
                    </label>
                  </div>

                  {isAnyAdmin && (
                    <div className="rounded-2xl border border-border bg-card/50 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-foreground">Register on behalf</span>
                        <button
                          type="button"
                          onClick={() => setRegisterOnBehalf((prev) => !prev)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${registerOnBehalf ? "bg-primary" : "bg-muted"}`}
                        >
                          <span className={`inline-block h-4 w-4 rounded-full bg-white transition ${registerOnBehalf ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                      </div>
                      {registerOnBehalf && (
                        <div className="space-y-2">
                          <input
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            placeholder="Search community member"
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <div className="max-h-32 overflow-y-auto rounded-xl border border-border bg-background p-2 space-y-1">
                            {communityUsers
                              .filter((u) => `${u.fullName || u.name || ""} ${u.email || ""}`.toLowerCase().includes(userSearchQuery.toLowerCase()))
                              .slice(0, 6)
                              .map((u) => (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedTargetUserId(u.id);
                                    setRegisterOnBehalf(false);
                                    setDevoteeName(u.fullName || u.name || "");
                                    setDevoteePhone(u.phone || u.mobile || "");
                                    setDevoteeFlat(resolveUserFlat(u));
                                  }}
                                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-muted"
                                >
                                  <span className="text-xs font-medium text-foreground">{u.fullName || u.name || "Unknown"}</span>
                                  <span className="text-[10px] text-muted-foreground">{u.flatNo || resolveUserFlat(u) || "No flat"}</span>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-3.5 flex-1">
                <div className="border-b border-border pb-2">
                  <h3 className="text-sm font-extrabold text-foreground">Prasadam Collection</h3>
                  <p className="text-[11px] text-muted-foreground">Choose how your prasadam and tokens will be collected.</p>
                </div>

                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={() => setPrasadamMode("mandap")}
                    className={`rounded-2xl border p-3 text-left transition ${
                      prasadamMode === "mandap"
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="block text-xs font-black text-foreground">Mandap Counter Collection</span>
                        <span className="text-[10px] text-muted-foreground">Collect prasadam at the mandap after the ritual.</span>
                      </div>
                      <CheckCircle2 className={`w-4 h-4 ${prasadamMode === "mandap" ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                  </button>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-3.5 flex-1">
                <div className="border-b border-border pb-2">
                  <h3 className="text-sm font-extrabold text-foreground">
                    {isUpdateMode ? "Review & Confirm Updates" : isFreeEvent ? "Review & Confirmation" : "Review & Contribution"}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {isUpdateMode
                      ? "Verify your updated session, Gotram, and prasadam collection details"
                      : "Confirm your Pooja booking details before completing registration"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-card border border-border space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Pooja Ritual</span>
                      <strong className="text-foreground font-bold text-xs truncate block">{poojaTitle}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Selected Session</span>
                      <strong className="text-primary font-bold text-xs block truncate">
                        {selectedDateDisplay} • {selectedSlotDisplayTime}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Yajaman &amp; Gotram</span>
                      <strong className="text-foreground font-bold text-xs block truncate">
                        {devoteeName} {gotram ? `(${gotram})` : ""}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Prasadam Delivery</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-xs block truncate">
                        {prasadamMode === "mandap" ? "Mandap Counter Collection" : "Home Delivery"}
                      </strong>
                    </div>
                  </div>

                  {!isFreeEvent && numericFee > 0 && !isUpdateMode && (
                    <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-foreground block">Total Seva Contribution</span>
                        <span className="text-[10.5px] text-muted-foreground">Flat fee for complete family inclusion</span>
                      </div>
                      <span className="text-xl font-black text-primary">₹{numericFee}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </GlassCard>
        ) : (
          <div className="space-y-4 text-center py-6 animate-fadeIn flex-1 flex flex-col justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto text-3xl shadow-lg">
              🪔
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-foreground">
                {isUpdateMode ? "Pooja Registration Updated Successfully!" : "Pooja Seva Booked Successfully!"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isUpdateMode
                  ? "Your holy Sankalpam updates have been synchronized with the Temple Committee."
                  : "Your holy Sankalpam details have been registered with the Temple Committee."}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border text-left space-y-2.5 text-xs max-w-md mx-auto shadow-md">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-primary block">
                    {isUpdateMode ? "Updated Sankalpam Pass" : "Sankalpam Pass"}
                  </span>
                  <strong className="text-sm font-black text-foreground">{poojaTitle}</strong>
                </div>
                <button
                  onClick={copyPassCode}
                  className="flex items-center gap-1 text-[11px] text-primary font-bold bg-primary/10 px-2 py-1 rounded-lg border border-primary/20 hover:bg-primary/20 transition-all cursor-pointer"
                >
                  {copiedPass ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>POOJA-{passNumber}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-muted-foreground block">Date &amp; Session:</span>
                  <strong className="text-foreground">{selectedDateDisplay} • {selectedSlotDisplayTime}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Yajaman &amp; Gotram:</span>
                  <strong className="text-foreground">{devoteeName} {gotram ? `(${gotram})` : ""}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Prasadam Collection:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">Mandap Counter post-Aarti</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Seva Contribution:</span>
                  <strong className="text-primary">{isFreeEvent ? "Free Seva" : isUpdateMode ? `₹${numericFee} (Already Paid)` : `₹${numericFee} (Paid)`}</strong>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <TouchButton onClick={onClose} variant="primary" size="md" className="cursor-pointer">
                Done &amp; View Registrations
              </TouchButton>
            </div>
          </div>
        )}

        {!isSuccess && (
          <div className="flex items-center justify-center gap-3 border-t border-border pt-3 shrink-0">
            {currentStep > 1 && (
              <TouchButton
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                variant="outline"
                size="sm"
                icon={ArrowLeft}
                className="cursor-pointer"
              >
                Back
              </TouchButton>
            )}

            {isPoojaFull ? (
              <span className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20 flex items-center gap-1.5 select-none">
                <AlertCircle className="w-3.5 h-3.5" /> Pooja Capacity Full (Sold Out)
              </span>
            ) : isPoojaClosed ? (
              <span className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold border border-border flex items-center gap-1.5 select-none">
                <Clock className="w-3.5 h-3.5" /> Registration Closed
              </span>
            ) : currentStep < 4 ? (
              <TouchButton type="button" onClick={handleNext} variant="primary" size="sm" className="cursor-pointer">
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </TouchButton>
            ) : (
              <TouchButton
                type="button"
                onClick={() => handleBookingConfirm(isFreeEvent ? "Free Seva" : "UPI")}
                disabled={isSubmitting}
                variant="primary"
                size="sm"
                className="cursor-pointer"
              >
                {isUpdateMode ? (
                  <>
                    <span>Update Registration</span>
                    <RefreshCw className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>{isFreeEvent ? "Confirm & Register Pooja" : `Confirm & Book Seva (₹${numericFee})`}</span>
                    <Flame className="w-3.5 h-3.5" />
                  </>
                )}
              </TouchButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
