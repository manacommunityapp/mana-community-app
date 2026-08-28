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
  Lock,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { userService } from "../../../services/common/userService";
import { familyService, type FamilyMember } from "../../../services/common/familyService";
import { eventService, type PoojaRegistrationRequest, type PoojaScheduleDto } from "../../../services/events/eventService";
import { isRegistrationClosed, isPoojaSlotPassed } from "../../../utils/eventDeadlineUtils";
import { showSuccess, showWarning } from "../../../utils/ToastUtils";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import { GlassCard, TouchButton } from "./redesign/EventDesignSystem";

export interface PoojaRegistrationModalProps {
  isOpen?: boolean;
  isDark?: boolean;
  onClose: () => void;
  isMainEventRegistered?: boolean;
  onRegisterMainEvent?: () => void;
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
    /** Parent community event id — used for correct registration deduplication scoping */
    mainEventId?: string | number;
    status?: string;
    poojaId?: number;
  };
  onSuccess?: () => void;
}

interface DaySlotOption {
  icon: string;
  time: string;
  name: string;
  left: number;
  timeSlotConfigId?: number;
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

function makeLiveScheduleKey(scheduleDate: string, startTime: string): string {
  // Drop seconds from "HH:mm:ss" so "08:30:00" and "08:30" both produce "08:30"
  const t = String(startTime).replace(/:\d{2}$/, "");
  return `${scheduleDate}__${t}`;
}

function getLiveSlotInfo(
  map: Map<string, { scheduleId: number; availLeft: number }>,
  dateValue: string | undefined,
  slotTime: string
): { scheduleId: number; availLeft: number } | undefined {
  if (!dateValue) return undefined;
  const normalized = normalizeSlotStartTime(slotTime).replace(/:\d{2}$/, "");
  return map.get(`${dateValue}__${normalized}`);
}

function formatTime12Hour(timeStr: string): string {
  if (!timeStr) return "";
  const clean = timeStr.trim();
  if (clean.toLowerCase().includes("am") || clean.toLowerCase().includes("pm") || clean.includes("–") || clean.includes("-")) {
    return clean;
  }
  const parts = clean.split(":");
  let hr = parseInt(parts[0], 10);
  const min = parts.length > 1 ? parts[1].padStart(2, "0") : "00";
  if (isNaN(hr)) return clean;
  const ampm = hr >= 12 ? "PM" : "AM";
  if (hr > 12) hr -= 12;
  if (hr === 0) hr = 12;
  return `${String(hr).padStart(2, "0")}:${min} ${ampm}`;
}

function buildDaysFromLiveSchedules(liveSchedules: PoojaScheduleDto[], poojaTitle?: string): DaySchedule[] {
  if (!Array.isArray(liveSchedules) || liveSchedules.length === 0) return [];

  // Group schedules by scheduleDate
  const dateMap = new Map<string, PoojaScheduleDto[]>();
  for (const sch of liveSchedules) {
    if (!sch.scheduleDate) continue;
    const existing = dateMap.get(sch.scheduleDate) || [];
    existing.push(sch);
    dateMap.set(sch.scheduleDate, existing);
  }

  // Sort unique dates chronologically
  const sortedDates = Array.from(dateMap.keys()).sort();
  const totalDays = sortedDates.length;

  return sortedDates.map((dateKey, idx) => {
    const parsedDate = parsePoojaDate(dateKey) || new Date();
    const { dayLabel, dateStr, shortDate } = formatPoojaDate(parsedDate);
    const dayLabelText = totalDays > 1 ? `Day ${idx + 1} (${dayLabel})` : `Day 1 (${dayLabel})`;

    const schedulesForDay = dateMap.get(dateKey) || [];
    // Sort schedules by startTime
    schedulesForDay.sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));

    const slots: DaySlotOption[] = schedulesForDay.map((sch, sIdx) => {
      const icon = sIdx === 0 ? "🌅" : sIdx === 1 ? "☀️" : sIdx === 2 ? "🪔" : "✨";
      const startFmt = formatTime12Hour(sch.startTime);
      const endFmt = sch.endTime ? formatTime12Hour(sch.endTime) : "";
      const displayTime = endFmt ? `${startFmt} – ${endFmt}` : `${startFmt} onwards`;
      const sessionName = (sch as any).notes?.trim() || sch.poojaName || poojaTitle || (schedulesForDay.length === 1 ? "Pooja Seva" : `Session #${sIdx + 1}`);
      const avail = sch.availableDevotees !== undefined ? sch.availableDevotees : sch.availableFamilies;

      return {
        icon,
        time: displayTime,
        name: sessionName,
        left: Math.max(0, avail),
        timeSlotConfigId: sch.timeSlotConfigId,
      };
    });

    return {
      id: idx + 1,
      dayLabel: dayLabelText,
      dateStr,
      shortDate,
      dateValue: dateKey,
      slots,
    };
  });
}

function buildPoojaScheduleDays(event: any, defaultSlots: DaySlotOption[], poojaTitle?: string): DaySchedule[] {
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
        slots: defaultSlots,
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
        slots: defaultSlots,
      },
    ];
  }

  const timeSlotConfig: { id?: number; slotDate: string | null; startTime: string; endTime?: string; title?: string; slotCount: number }[] =
    Array.isArray(event?.timeSlotConfig) ? event.timeSlotConfig : [];

  const mapConfigToSlots = (configs: typeof timeSlotConfig, fallbackSlots: DaySlotOption[]): DaySlotOption[] => {
    if (configs.length === 0) return fallbackSlots;
    return configs.map((cfg, idx) => {
      const icon = idx === 0 ? "🌅" : idx === 1 ? "☀️" : idx === 2 ? "🪔" : "✨";
      const sessionName = cfg.title?.trim() || poojaTitle || (configs.length === 1 ? "Pooja Seva" : `Session #${idx + 1}`);
      const cleanTime = String(cfg.startTime).replace(/\(.*?\)/g, "").trim();
      const endClean = cfg.endTime ? formatTime12Hour(String(cfg.endTime).replace(/\(.*?\)/g, "").trim()) : "";
      const formattedTime = cleanTime.includes("–") || cleanTime.includes("-") || cleanTime.toLowerCase().includes("am") || cleanTime.toLowerCase().includes("pm")
        ? cleanTime
        : endClean ? `${formatTime12Hour(cleanTime)} – ${endClean}` : `${cleanTime} onwards`;
      return {
        icon,
        time: formattedTime,
        name: sessionName,
        left: Math.max(1, cfg.slotCount),
        timeSlotConfigId: cfg.id,
      };
    });
  };

  // Multi-day Pooja with multiple sequential calendar days
  if ((isMultiDay || (endDate && endDate.getTime() > startDate.getTime())) && endDate && endDate.getTime() >= startDate.getTime()) {
    const days: DaySchedule[] = [];
    const cur = new Date(startDate.getTime());
    let count = 1;
    while (cur.getTime() <= endDate.getTime() && count <= 30) {
      const { dayLabel, dateStr, shortDate } = formatPoojaDate(cur);
      const dateKey = formatDateKey(cur);
      const dayConfigs = timeSlotConfig.filter(e => e.slotDate === dateKey);
      const daySpecificSlots: DaySlotOption[] = dayConfigs.length > 0
        ? mapConfigToSlots(dayConfigs, defaultSlots)
        : defaultSlots;
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
    }
    const startFmt = formatPoojaDate(startDate);
    return days.length > 0
      ? days
      : [
          {
            id: 1,
            dayLabel: `Day 1 (${startFmt.dayLabel})`,
            dateStr: startFmt.dateStr,
            shortDate: startFmt.shortDate,
            dateValue: formatDateKey(startDate),
            slots: defaultSlots,
          },
        ];
  }

  // Single Day Pooja
  const { dayLabel, dateStr, shortDate } = formatPoojaDate(startDate);
  const dateKey = formatDateKey(startDate);
  const singleDayConfigs = timeSlotConfig.filter((e) => !e.slotDate || e.slotDate === dateKey);
  const singleDaySlots: DaySlotOption[] = mapConfigToSlots(singleDayConfigs, defaultSlots);

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
  isMainEventRegistered = true,
  onRegisterMainEvent,
}) => {
  const { user: authUser } = useAuth();
  const isAnyAdmin = Boolean(
    authUser?.role?.toLowerCase().includes("admin") ||
    authUser?.role?.toLowerCase().includes("event_admin") ||
    authUser?.role?.toLowerCase().includes("super_admin") ||
    authUser?.role?.toLowerCase().includes("community_admin")
  );
  useEscapeKey(onClose);

  const isMainPassMissing = Boolean(event?.mainEventId && isMainEventRegistered === false && !isAnyAdmin);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedDayId, setSelectedDayId] = useState<number>(1);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>("08:30 AM – 10:00 AM");
  const [selectedSlotName, setSelectedSlotName] = useState<string>("Morning Homam");
  const [selectedSlotKey, setSelectedSlotKey] = useState<string>("");
  const [liveSchedules, setLiveSchedules] = useState<PoojaScheduleDto[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState<boolean>(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [gotram, setGotram] = useState<string>(
    () => event?.gotram || event?.existingRegistration?.gotram || ""
  );
  const [isGotramLoading, setIsGotramLoading] = useState<boolean>(!event?.gotram && !event?.existingRegistration?.gotram);
  const [isGotramFromDb, setIsGotramFromDb] = useState<boolean>(Boolean(event?.gotram || event?.existingRegistration?.gotram));
  const [prasadamMode, setPrasadamMode] = useState<"mandap" | "home_delivery">("mandap");
  const [attendingDevotees, setAttendingDevotees] = useState<string>(
    () => event?.existingRegistration?.attendingDevotees || ""
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [registrationCode, setRegistrationCode] = useState<string>("");
  const [tokenNumber, setTokenNumber] = useState<number | null>(null);
  const [copiedPass, setCopiedPass] = useState<boolean>(false);
  const [alreadyRegisteredTitle, setAlreadyRegisteredTitle] = useState<string | null>(null);

  const resolvedPoojaId = React.useMemo(() => {
    if (event?.poojaId) return Number(event.poojaId);
    if ((event as any)?.poojaSevaId) return Number((event as any).poojaSevaId);
    if ((event as any)?.sevaId) return Number((event as any).sevaId);
    if (event?.id) {
      const num = Number(String(event.id).replace(/\D/g, ""));
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }, [event?.poojaId, (event as any)?.poojaSevaId, (event as any)?.sevaId, event?.id]);

  // #19: Available dates from backend (to gray out fully-booked dates)
  const [availableDateStrings, setAvailableDateStrings] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!resolvedPoojaId || resolvedPoojaId <= 0) return;
    eventService.getScheduleAvailableDates(resolvedPoojaId).then((dates) => {
      setAvailableDateStrings(new Set(dates));
    }).catch(() => {/* silently skip if endpoint unavailable */});
  }, [resolvedPoojaId]);

  // Admin on-behalf registration states
  const [registerOnBehalf, setRegisterOnBehalf] = useState<boolean>(false);
  const [communityUsers, setCommunityUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");
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

  // Fetch live schedule availability from the booking engine
  useEffect(() => {
    if (!resolvedPoojaId || resolvedPoojaId <= 0) return;
    setSchedulesLoading(true);
    eventService.getSchedulesByPooja(resolvedPoojaId)
      .then((schedules) => { if (Array.isArray(schedules)) setLiveSchedules(schedules); })
      .catch(() => {/* best effort — fall back to static slot counts */})
      .finally(() => setSchedulesLoading(false));
  }, [resolvedPoojaId]);

  // Load Saved Family Members from Unified Family Service
  const [savedFamilyMembers, setSavedFamilyMembers] = useState<FamilyMember[]>([]);
  useEffect(() => {
    const fetchFamily = async () => {
      try {
        const members = await familyService.getFamilyMembers();
        setSavedFamilyMembers(members);
      } catch (err) {
        console.warn("Could not load family members in Pooja modal:", err);
      }
    };
    fetchFamily();
    window.addEventListener("mana_family_updated", fetchFamily);
    return () => window.removeEventListener("mana_family_updated", fetchFamily);
  }, []);

  // Existing registration / Update mode detection
  const [existingReg, setExistingReg] = useState<any>(() => event?.existingRegistration || null);
  // isUpdateMode is ONLY true when the modal was explicitly opened for rescheduling
  // (i.e. the parent passed isUpdateMode=true via handleOpenUpdateRegistration).
  // The API may detect an existing registration and set existingReg, but that alone
  // must NOT flip the modal into reschedule mode — doing so showed reschedule UI
  // to users who just clicked "Register" and already had a prior booking.
  const isUpdateMode = Boolean(event?.isUpdateMode);
  const existingRegId = event?.registrationId || existingReg?.id || (event as any)?.regId;
  const prasadamAvailable = Boolean((event as any)?.prasadamAvailable);
  const isPoojaCancelled =
    String(event?.status || "").toUpperCase() === "CANCELLED" ||
    String((event as any)?.parentStatus || "").toUpperCase() === "CANCELLED" ||
    String((event as any)?.eventStatus || "").toUpperCase() === "CANCELLED";
  const isPoojaClosed = (isRegistrationClosed(event) || isPoojaCancelled) && !isUpdateMode;
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

          // Normalise the activity id — strip non-digits so "pooja-5", "5", 5 all compare as "5"
          const currentSevaIdNumeric = String(event?.id || "").replace(/\D/g, "");
          const currentCleanTitle = (poojaTitle || "").trim().toLowerCase();
          const currentMainEventId = event?.mainEventId ? String(event.mainEventId) : null;

          // Match for THIS specific pooja activity across all days/slots
          // Priority 1: numeric ID match (handles "pooja-5" == "5" == 5)
          // Priority 2: exact title match scoped to same mainEventId
          const currentEventReg = activeRegs.find((r: any) => {
            // Strategy 1 — normalised numeric activityId match
            const regActIdNumeric = String(r.activityId || "").replace(/\D/g, "");
            if (currentSevaIdNumeric && regActIdNumeric && currentSevaIdNumeric === regActIdNumeric) {
              return true;
            }

            // Strategy 2 — exact activityTitle match scoped to mainEventId when available
            const cleanRegTitle = (r.activityTitle || "").trim().toLowerCase();
            if (cleanRegTitle && currentCleanTitle && cleanRegTitle === currentCleanTitle) {
              const regMainEventId = r.mainEventId ? String(r.mainEventId) : null;
              if (currentMainEventId && regMainEventId) {
                return currentMainEventId === regMainEventId;
              }
              // Fallback: no mainEventId available — match on title alone
              return true;
            }

            return false;
          });

          // If the user already has a registration for THIS specific pooja, allow them to reschedule to another slot time
          if (currentEventReg) {
            setExistingReg(currentEventReg);
            setAlreadyRegisteredTitle(null);
            if (currentEventReg.prasadamMode) setPrasadamMode(currentEventReg.prasadamMode);
            if (currentEventReg.participantName || currentEventReg.primaryName) {
              setDevoteeName(currentEventReg.participantName || currentEventReg.primaryName);
            }
            if (currentEventReg.phone || currentEventReg.contactPhone) {
              setDevoteePhone(currentEventReg.phone || currentEventReg.contactPhone);
            }
            if (currentEventReg.flatNo) setDevoteeFlat(currentEventReg.flatNo);
          } else {
            // Check if user already has another POOJA SUB-EVENT booking in THIS specific parent event
            // Note: Main event passes (e.g. activityId "event-123") or unrelated events must NOT trigger this.
            const otherPoojaReg = activeRegs.find((r: any) => {
              if (r.status === "CANCELLED") return false;
              const regActId = String(r.activityId || "");
              // Only match actual pooja sub-events, never main event tickets/passes
              const isPoojaSubEvent = regActId.startsWith("pooja-") || (r.category?.toUpperCase() === "POOJA" && !regActId.startsWith("event-"));
              if (!isPoojaSubEvent) return false;

              // Must be strictly scoped to the same parent mainEventId
              const regMainEventId = r.mainEventId ? String(r.mainEventId) : null;
              if (currentMainEventId && regMainEventId && currentMainEventId === regMainEventId) {
                const regActIdNumeric = regActId.replace(/\D/g, "");
                return regActIdNumeric !== currentSevaIdNumeric;
              }
              return false;
            });

            if (otherPoojaReg) {
              setAlreadyRegisteredTitle(otherPoojaReg.activityTitle || otherPoojaReg.eventName || "Pooja Seva");
            } else {
              setAlreadyRegisteredTitle(null);
            }
          }

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

  // Derive configured start times — primary: liveSchedules (event_pooja_seva_time_slots via API),
  // fallback: timeSlotConfig stored on the event record (also from event_pooja_seva_time_slots)
  const scheduleDays = React.useMemo(() => {
    if (Array.isArray(liveSchedules) && liveSchedules.length > 0) {
      const daysFromLive = buildDaysFromLiveSchedules(liveSchedules, poojaTitle);
      if (daysFromLive.length > 0) {
        return daysFromLive;
      }
    }

    const timeSlotConfigs: { id?: number; slotDate: string | null; startTime: string; endTime?: string; slotCount: number }[] =
      Array.isArray((event as any)?.timeSlotConfig) ? (event as any).timeSlotConfig : [];

    const configuredTimes: string[] = timeSlotConfigs.length > 0
      ? [...new Set(timeSlotConfigs.map(c => c.startTime).filter(Boolean))]
      : event?.time && event.time.includes(",")
      ? event.time.split(",").map((t: string) => t.trim()).filter(Boolean)
      : event?.startTime
      ? [event.startTime]
      : event?.time
      ? [event.time]
      : [];

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

          const matchedSingleConfig = timeSlotConfigs.find(
            c => (!c.slotDate || c.slotDate === event?.startDate || c.slotDate === event?.date) &&
                 (c.startTime === cleanTime || c.startTime === rawTime)
          );
          const slotLeft = matchedSingleConfig ? matchedSingleConfig.slotCount : totalSlotsCount;
          const endClean = matchedSingleConfig?.endTime
            ? formatTime12Hour(String(matchedSingleConfig.endTime).replace(/\(.*?\)/g, "").trim())
            : "";
          const formattedTime = cleanTime.includes("–") || cleanTime.includes("-") || cleanTime.toLowerCase().includes("am") || cleanTime.toLowerCase().includes("pm")
            ? cleanTime
            : endClean ? `${formatTime12Hour(cleanTime)} – ${endClean}` : `${cleanTime} onwards`;

          return {
            icon,
            time: formattedTime,
            name: sessionName,
            left: Math.max(1, slotLeft),
            timeSlotConfigId: matchedSingleConfig?.id,
          };
        })
      : [
          { icon: "🌅", time: "08:30 AM – 10:00 AM", name: "Morning Homam & Sankalpam", left: Math.max(1, totalSlotsCount) },
          { icon: "🪔", time: "06:30 PM – 08:00 PM", name: "Sandhya Aarti & Archana", left: Math.max(1, totalSlotsCount) },
        ];

    return buildPoojaScheduleDays(event, defaultSlots, poojaTitle);
  }, [liveSchedules, event?.id, event?.startDate, event?.date, event?.endDate, event?.time, poojaTitle, totalSlotsCount, event?.timeSlotConfig]);

  // Build lookup map: "dateValue__startTime" → {scheduleId, availLeft} from live backend data
  const liveSlotInfoMap = React.useMemo(() => {
    const map = new Map<string, { scheduleId: number; availLeft: number }>();
    for (const sch of liveSchedules) {
      if (sch.status === "BLOCKED" || sch.status === "CLOSED") continue;
      const key = makeLiveScheduleKey(sch.scheduleDate, sch.startTime);
      map.set(key, {
        scheduleId: sch.id,
        availLeft: sch.availableDevotees !== undefined ? sch.availableDevotees : sch.availableFamilies,
      });
    }
    return map;
  }, [liveSchedules]);

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

  // Re-sync selectedScheduleId when live schedules arrive after the initial slot selection
  useEffect(() => {
    if (!currentDay || !selectedSlot) return;
    const liveInfo = getLiveSlotInfo(liveSlotInfoMap, currentDay.dateValue, selectedSlot.time);
    setSelectedScheduleId(liveInfo?.scheduleId ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveSlotInfoMap]);

  const steps = [
    { num: 1, title: isUpdateMode ? "Reschedule Slot" : "Date & Slot" },
    { num: 2, title: "Registrant" },
    { num: 3, title: "Prasadam" },
    { num: 4, title: isUpdateMode ? "Confirm Reschedule" : isFreeEvent ? "Confirm" : "Payment" },
  ];

  const handleNext = () => {
    if (alreadyRegisteredTitle && !isUpdateMode) {
      showWarning("You are already registered for this pooja seva. Only one registration per family per event is allowed.");
      return;
    }
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
    if (isMainPassMissing) {
      showWarning("Registration for the main event is required before booking this Pooja Seva. Please register for the main event first.");
      return;
    }
    if (currentStep === 1 && selectedSlot) {
      const liveInfo = getLiveSlotInfo(liveSlotInfoMap, currentDay?.dateValue, selectedSlot.time);
      const effectiveLeft = liveInfo !== undefined ? liveInfo.availLeft : selectedSlot.left;
      if (effectiveLeft <= 0) {
        showWarning("The selected time slot is full. Please choose another session.");
        return;
      }
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
    if (isSubmitting) return;
    if (isMainPassMissing) {
      showWarning("Registration for the main event is required before booking this Pooja Seva. Please register for the main event first.");
      return;
    }
    if (alreadyRegisteredTitle && !isUpdateMode) {
      showWarning("You are already registered for this pooja seva. Only one registration per family per event is allowed.");
      return;
    }
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
    if (selectedSlot) {
      const liveInfo = getLiveSlotInfo(liveSlotInfoMap, currentDay?.dateValue, selectedSlot.time);
      const effectiveLeft = liveInfo !== undefined ? liveInfo.availLeft : selectedSlot.left;
      if (effectiveLeft <= 0) {
        showWarning("The selected time slot is full. Please choose another session.");
        return;
      }
    }

    // Detect a slot change in update mode so we can use the reschedule endpoint.
    // Only reschedule when the EXISTING scheduleId is known (non-null) AND the user picked a different one.
    // If existingReg.scheduleId is null (old registration before scheduleId tracking), fall back to a plain update.
    const slotChangedInUpdateMode = isUpdateMode &&
      selectedScheduleId !== null &&
      existingReg?.scheduleId != null &&
      selectedScheduleId !== existingReg.scheduleId;

    setIsSubmitting(true);
    setReservationError(null);
    try {
      // ── Pre-hold a capacity slot (new registrations only — reschedule handles its own slot swap) ──
      let reservationId: number | undefined;
      if (selectedScheduleId && !isUpdateMode) {

        const idempotencyKey = (typeof crypto !== "undefined" && crypto.randomUUID)
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        try {
          const reservation = await eventService.reserveSlot(selectedScheduleId, {
            idempotencyKey,
            familyCount: 1,
            devoteeCount: 1,
          });
          reservationId = reservation.reservationId;
        } catch (reserveErr: any) {
          const errMsg = reserveErr?.message || "This slot is full or no longer available. Please choose another session.";
          showWarning(errMsg);
          setReservationError(errMsg);
          setIsSubmitting(false);
          return;
        }
      }

      // ── Resolve eventId and mainEventId separately.
      // mainEventId must ONLY come from the explicit event.mainEventId prop — that is the parent
      // community event id stored in community_events and event_booking_registrations.
      // Never fall back to the pooja's own numeric id for mainEventId because the backend
      // validates "user registered for event_id=mainEventId" and the pooja id ≠ parent event id.
      const explicitMainEventId: number | undefined = (() => {
        if (event?.mainEventId) {
          const n = Number(String(event.mainEventId).replace(/\D/g, ""));
          if (!isNaN(n) && n > 0) return n;
        }
        return undefined;
      })();

      // eventId is used for grouping; use mainEventId when available, otherwise the pooja's own numeric id.
      const resolvedParentEventId: number = explicitMainEventId ?? (() => {
        if (event?.id) {
          const n = typeof event.id === "number" ? event.id : Number(String(event.id).replace(/\D/g, ""));
          if (!isNaN(n) && n > 0) return n;
        }
        return 1;
      })();

      const regPayload: PoojaRegistrationRequest = {
        // eventId = best-effort parent event id for grouping
        eventId: resolvedParentEventId,
        // mainEventId sent ONLY when explicitly known — backend uses it to validate main-event registration
        ...(explicitMainEventId ? { mainEventId: explicitMainEventId } : {}),
        // activityId = full "pooja-N" string — used for exact sub-activity deduplication
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
        ...(attendingDevotees.trim() ? { attendingDevotees: attendingDevotees.trim() } : {}),
        ...(selectedScheduleId ? { scheduleId: selectedScheduleId } : {}),
        ...(reservationId ? { reservationId } : {}),
        ...(selectedSlot?.timeSlotConfigId ? { poojaSevaTimeSlotsId: selectedSlot.timeSlotConfigId } : {}),
        ...(selectedTargetUserId ? { targetUserId: selectedTargetUserId } : {}),
      };

      if (isUpdateMode && existingRegId) {
        const numericId = typeof existingRegId === "number" ? existingRegId : Number(String(existingRegId).replace(/\D/g, ""));
        if (!isNaN(numericId) && numericId > 0) {
          try {
            // C-3: If the user picked a (possibly new) schedule slot, use the reschedule endpoint
            // which atomically releases the old slot hold and acquires the new one.
            const existingScheduleId = (existingReg as any)?.scheduleId ?? (event?.existingRegistration as any)?.scheduleId;
            if (selectedScheduleId && selectedScheduleId !== existingScheduleId) {
              const rescheduleKey = (typeof crypto !== "undefined" && crypto.randomUUID)
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
              await eventService.rescheduleRegistration(numericId, selectedScheduleId, rescheduleKey);
            }
            // Update text fields (name, gotram, prasadamMode, display slot text, etc.)
            await eventService.updatePoojaRegistration(numericId, {
              participantName: devoteeName,
              primaryName: devoteeName,
              phone: devoteePhone,
              gotram: gotram?.trim() || undefined,
              flatNo: devoteeFlat,
              prasadamMode,
              poojaSlotName: selectedSlotDisplayName,
              poojaSlotDate: selectedDateValue,
              poojaSlotTime: selectedSlotStartTime,
              venue: venueName,
              ...(selectedSlot?.timeSlotConfigId ? { poojaSevaTimeSlotsId: selectedSlot.timeSlotConfigId } : {}),
            } as any);
            showSuccess("🪔 Pooja registration updated successfully!");

          } catch (apiErr: any) {
            const errMsg = apiErr?.response?.data?.message || apiErr?.message || "Failed to update pooja registration.";
            showWarning(errMsg);
            return;
          }
        }
      } else {
        try {
          const savedReg = await eventService.createPoojaRegistration(regPayload);
          if (savedReg?.regCode) setRegistrationCode(savedReg.regCode);
          if (savedReg?.tokenNumber) setTokenNumber(savedReg.tokenNumber);
          showSuccess("🪔 Pooja Seva booked successfully! Digital Sankalpam Pass generated.");
        } catch (apiErr: any) {
          const errMsg = apiErr?.response?.data?.message || apiErr?.message || "";
          const status = apiErr?.response?.status;
          console.warn("Backend createPoojaRegistration API note:", apiErr);
          if (status === 409 || (errMsg && (
            errMsg.toLowerCase().includes("already registered") ||
            errMsg.toLowerCase().includes("already have an active registration") ||
            errMsg.toLowerCase().includes("deadline") ||
            errMsg.toLowerCase().includes("passed") ||
            errMsg.toLowerCase().includes("cancelled") ||
            errMsg.toLowerCase().includes("ended") ||
            errMsg.toLowerCase().includes("full")
          ))) {
            showWarning(errMsg || "You are already registered for this pooja seva.");
            return;
          }
          if (errMsg) {
            showWarning(errMsg);
            return;
          }
        }
      }

      window.dispatchEvent(new Event("mana_activities_updated"));
      window.dispatchEvent(new Event("mana_registrations_updated"));

      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || "Registration failed. Please try again.";
      console.error("Failed to process pooja registration:", err);
      showWarning(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPassCode = () => {
    navigator.clipboard.writeText(registrationCode || "");
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg sm:max-w-xl bg-card text-card-foreground rounded-2xl p-3.5 sm:p-4 shadow-2xl border border-border max-h-[90vh] flex flex-col justify-between overflow-hidden animate-scaleUp">
        {/* Submitting Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 z-50 rounded-2xl bg-background/85 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center animate-fadeIn select-none pointer-events-auto shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-md animate-pulse mb-2.5">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
            <h4 className="text-sm font-extrabold text-foreground tracking-tight">
              {isUpdateMode ? "Rescheduling Pooja Seva..." : "Booking Pooja Seva & Issuing Pass..."}
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs leading-relaxed">
              Please wait while we confirm your Sankalpam slot and generate your digital pass.
            </p>
            <div className="mt-2.5 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
              <Flame className="w-3 h-3 text-amber-500" />
              <span>Registering devotee & confirming session...</span>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-2 shrink-0">
          <div className="min-w-0 pr-2">
            <div className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider mb-0.5">
              {isUpdateMode ? (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.2 rounded-full border border-amber-500/20">
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Reschedule Slot</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-primary">
                  <Sparkles className="w-3 h-3" />
                  <span>Pooja Registration Portal</span>
                </span>
              )}
            </div>
            <h2 className="text-sm sm:text-base font-black text-foreground truncate">{poojaTitle}</h2>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5 text-primary" />
                {scheduleDays.length > 1
                  ? `${scheduleDays[0].dateStr} – ${scheduleDays[scheduleDays.length - 1].dateStr} (${scheduleDays.length} Days)`
                  : baseDate}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
                <MapPin className="w-2.5 h-2.5 text-primary shrink-0" /> {venueName}
              </span>
              {priestName && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[120px]">🙏 {priestName}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isFreeEvent && numericFee > 0 && (
              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                ₹{numericFee}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
              title="Close (Esc)"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Stepper */}
        {!isSuccess && (
          <div className="flex items-center justify-between px-1 py-1 shrink-0 my-1">
            {steps.map((s, idx) => {
              const isActive = currentStep === s.num;
              const isDone = currentStep > s.num;

              return (
                <React.Fragment key={s.num}>
                  <div
                    className={`flex flex-col items-center gap-0.5 select-none transition-all ${s.num < currentStep ? "cursor-pointer" : "cursor-default"}`}
                    onClick={() => s.num < currentStep && setCurrentStep(s.num)}
                  >
                    <div
                      className={`w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${
                        isDone
                          ? "bg-emerald-500 text-white shadow-2xs"
                          : isActive
                          ? "bg-primary text-primary-foreground ring-2 ring-primary/20 shadow-xs scale-105"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : s.num}
                    </div>
                    <span
                      className={`text-[8.5px] sm:text-[9.5px] font-bold ${
                        isActive ? "text-primary font-extrabold" : isDone ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`flex-1 h-[1.5px] mx-1 sm:mx-1.5 rounded-full transition-colors ${
                        currentStep > idx + 1 ? "bg-emerald-500" : "bg-border"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Modal Body Card */}
        {!isSuccess ? (
          <GlassCard
            isDark={isDark}
            hoverScale={false}
            className="flex-1 min-h-0 flex flex-col p-2.5 sm:p-3 border border-border rounded-xl overflow-y-auto space-y-2.5 shadow-2xs my-1 bg-muted/20"
          >
            {isMainPassMissing && (
              <div className="p-2.5 sm:p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-800 dark:text-amber-300 animate-fadeIn">
                <div className="flex items-start gap-2 min-w-0">
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold">Main Event Pass Required</p>
                    <p className="text-[10.5px] font-normal text-amber-700/90 dark:text-amber-400 leading-tight">
                      This Pooja Seva belongs to a main festival event. Please register for the main event first before booking this seva.
                    </p>
                  </div>
                </div>
                {onRegisterMainEvent && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRegisterMainEvent();
                    }}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg shrink-0 shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    Register Main Event
                  </button>
                )}
              </div>
            )}
            {isPoojaCancelled && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <div>
                  <p>Event / Pooja Cancelled</p>
                  <p className="font-normal text-[10px] text-rose-600 dark:text-rose-400">
                    This event has been cancelled. Registrations are unavailable.
                  </p>
                </div>
              </div>
            )}
            {isUpdateMode && existingReg?.id && !isPoojaCancelled && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] font-bold flex items-start gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p>Reschedule Booked Pooja Slot</p>
                  <p className="font-normal text-[10px] text-amber-700 dark:text-amber-400">
                    Select a new date and ritual time slot below to reschedule your session.
                  </p>
                </div>
              </div>
            )}
            {alreadyRegisteredTitle && !isUpdateMode && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[11px] font-bold flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p>Slot Already Booked for <strong>{alreadyRegisteredTitle}</strong>.</p>
                  <p className="font-normal text-[10px] text-amber-600 dark:text-amber-500">
                    You have already registered for a Pooja seva in this event. Please reschedule your existing slot.
                  </p>
                </div>
              </div>
            )}
            {isPoojaFull && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>All slots booked. Contact admin for manual assistance.</span>
              </div>
            )}
            {isPoojaClosed && !isPoojaFull && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Pooja registration has closed.</span>
              </div>
            )}

            {/* Step 1: Select Date & Time */}
            {currentStep === 1 && (
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between border-b border-border pb-1.5">
                  <div>
                    <h3 className="text-xs sm:text-[13px] font-extrabold text-foreground flex items-center gap-1.5">
                      <span>Select Date &amp; Time Slot</span>
                      {scheduleDays.length > 1 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          {scheduleDays.length}-Day Utsav
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {scheduleDays.length > 1
                        ? `Select ritual day (${scheduleDays[0].shortDate} – ${scheduleDays[scheduleDays.length - 1].shortDate}) and session`
                        : "Choose your preferred ritual session slot"}
                    </p>
                  </div>
                  <span className="text-[9.5px] font-extrabold px-2 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {totalSlotsCount} Slots
                  </span>
                </div>

                <div className={`grid gap-1.5 ${scheduleDays.length === 1 ? "grid-cols-1" : scheduleDays.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
                  {scheduleDays.map((d) => {
                    const isSelected = d.id === selectedDayId;
                    const dateKey = d.dateValue || d.dateStr || "";
                    const isSoldOut = availableDateStrings.size > 0 && !availableDateStrings.has(dateKey);
                    return (
                      <div
                        key={d.id}
                        onClick={() => {
                          if (isSoldOut) return;
                          setSelectedDayId(d.id);
                          if (d.slots && d.slots.length > 0) {
                            const firstSlot = d.slots[0];
                            setSelectedSlotTime(firstSlot.time);
                            setSelectedSlotName(firstSlot.name);
                            setSelectedSlotKey(makeSlotSelectionKey(d, firstSlot));
                            const liveInfo = getLiveSlotInfo(liveSlotInfoMap, d.dateValue, firstSlot.time);
                            setSelectedScheduleId(liveInfo?.scheduleId ?? null);
                          }
                        }}
                        className={`p-2 rounded-xl border-2 transition-all select-none text-left ${
                          isSoldOut
                            ? "border-border bg-muted/40 opacity-50 cursor-not-allowed"
                            : isSelected
                              ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/20 cursor-pointer"
                              : "border-border bg-card hover:border-primary/50 cursor-pointer"
                        }`}
                      >
                        <span className={`block text-[9px] font-bold uppercase ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                          {d.dayLabel}
                        </span>
                        <strong className="text-xs font-black text-foreground block mt-0.5">{d.dateStr}</strong>
                        <span className="text-[9.5px] text-muted-foreground">
                          {isSoldOut ? "Fully Booked" : `${d.slots.length} ${d.slots.length === 1 ? "Session" : "Sessions"}`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="p-2.5 rounded-xl bg-card border border-border space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-foreground px-0.5">
                    <span>Available Sessions for {currentDay.dateStr}:</span>
                    <span className="text-primary text-[10px] font-semibold">Select 1 session</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs">
                    {currentDay?.slots.map((s) => {
                      const slotKey = makeSlotSelectionKey(currentDay, s);
                      const isSlotSelected = selectedSlotKey === slotKey;
                      const isSlotPassed = isPoojaSlotPassed(currentDay.dateValue, s.time) || isPoojaClosed;
                      const liveInfo = getLiveSlotInfo(liveSlotInfoMap, currentDay.dateValue, s.time);
                      const displayLeft = liveInfo !== undefined ? liveInfo.availLeft : s.left;
                      const isSlotFull = liveInfo !== undefined && liveInfo.availLeft <= 0;

                      return (
                        <div
                          key={slotKey}
                          onClick={() => {
                            if (isSlotPassed || isSlotFull) return;
                            setSelectedSlotTime(s.time);
                            setSelectedSlotName(s.name);
                            setSelectedSlotKey(slotKey);
                            setSelectedScheduleId(liveInfo?.scheduleId ?? null);
                          }}
                          className={`p-2 rounded-xl border-2 transition-all cursor-pointer ${
                            isSlotSelected
                              ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                              : isSlotPassed || isSlotFull
                              ? "border-border bg-muted/40 opacity-60 cursor-not-allowed"
                              : "border-border bg-card hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="min-w-0">
                              <span className="block text-[9.5px] font-extrabold uppercase tracking-wide text-muted-foreground truncate">{s.name}</span>
                              <strong className="block mt-0.5 text-xs font-black text-foreground">{s.time}</strong>
                            </div>
                            {schedulesLoading ? (
                              <span className="text-[8.5px] font-bold px-1 py-0.2 rounded bg-muted/50 text-muted-foreground border border-border shrink-0">
                                <Loader2 className="w-2.5 h-2.5 animate-spin inline" />
                              </span>
                            ) : isSlotFull ? (
                              <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20 shrink-0">
                                Full
                              </span>
                            ) : (
                              <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                                {displayLeft} left
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Devotee & Family Details */}
            {currentStep === 2 && (
              <div className="space-y-2 flex-1">
                <div className="border-b border-border pb-1.5">
                  <h3 className="text-xs sm:text-[13px] font-extrabold text-foreground">Registrant Details</h3>
                  <p className="text-[10px] text-muted-foreground">Share details for the seva devotee and family information.</p>
                </div>

                <div className="space-y-2">
                  {savedFamilyMembers.length > 0 && (
                    <div className="p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-1.5">
                      <div className="flex items-center justify-between text-[10.5px]">
                        <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-600" /> Select Yajaman from My Family
                        </span>
                        <span className="text-[9.5px] text-amber-700/70 dark:text-amber-400/70">Synced</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {savedFamilyMembers.map((m) => {
                          const isSelected = devoteeName.trim().toLowerCase() === m.name.trim().toLowerCase();
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setDevoteeName(m.name);
                                if (m.gotram) setGotram(m.gotram);
                                if (m.phone) setDevoteePhone(m.phone);
                              }}
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                                isSelected
                                  ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                                  : "bg-card text-foreground border-border hover:border-amber-400"
                              }`}
                            >
                              <span>{m.name}</span>
                              <span className={`text-[8.5px] font-medium px-1 py-0.1 rounded-full ${isSelected ? "bg-white/25 text-white" : "bg-muted text-muted-foreground"}`}>
                                {m.relation}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl bg-card border border-border p-2.5 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="block text-[10.5px] font-bold text-foreground">
                        <span className="mb-0.5 block">Yajaman / Devotee Name *</span>
                        <input
                          value={devoteeName}
                          onChange={(e) => setDevoteeName(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                          placeholder="Enter devotee name"
                        />
                      </label>
                      <label className="block text-[10.5px] font-bold text-foreground">
                        <span className="mb-0.5 block">Phone Number *</span>
                        <input
                          value={devoteePhone}
                          onChange={(e) => setDevoteePhone(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                          placeholder="Enter phone number"
                        />
                      </label>
                      <label className="block text-[10.5px] font-bold text-foreground">
                        <span className="mb-0.5 block">Flat / Block</span>
                        <input
                          value={devoteeFlat}
                          onChange={(e) => setDevoteeFlat(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                          placeholder="Flat or block"
                        />
                      </label>
                      <label className="block text-[10.5px] font-bold text-foreground">
                        <span className="mb-0.5 block">Gotram</span>
                        <input
                          value={gotram}
                          onChange={(e) => setGotram(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                          placeholder="Optional gotram"
                        />
                      </label>
                    </div>

                    {/* Attending family members (comma-separated) */}
                    <label className="block text-[10.5px] font-bold text-foreground">
                      <span className="mb-0.5 block">Attending Family Members</span>
                      <input
                        value={attendingDevotees}
                        onChange={(e) => setAttendingDevotees(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                        placeholder="e.g. Priya Sharma, Arjun Sharma (comma-separated)"
                      />
                      <span className="text-[9.5px] text-muted-foreground mt-0.5 block">
                        Each name becomes an individual participant row — enables per-devotee QR pass &amp; check-in
                      </span>
                    </label>
                  </div>

                  {isAnyAdmin && (
                    <div className="rounded-xl border border-border bg-card/50 p-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-foreground">Register on behalf</span>
                        <button
                          type="button"
                          onClick={() => setRegisterOnBehalf((prev) => !prev)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${registerOnBehalf ? "bg-primary" : "bg-muted"}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition ${registerOnBehalf ? "translate-x-4.5" : "translate-x-1"}`} />
                        </button>
                      </div>
                      {registerOnBehalf && (
                        <div className="space-y-1.5">
                          <input
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            placeholder="Search community member..."
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                          />
                          <div className="max-h-24 overflow-y-auto rounded-lg border border-border bg-background p-1 space-y-0.5">
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
                                  className="flex w-full items-center justify-between rounded px-1.5 py-1 text-left hover:bg-muted"
                                >
                                  <span className="text-[11px] font-medium text-foreground">{u.fullName || u.name || "Unknown"}</span>
                                  <span className="text-[9.5px] text-muted-foreground">{u.flatNo || resolveUserFlat(u) || "No flat"}</span>
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

            {/* Step 3: Prasadam Collection */}
            {currentStep === 3 && (
              <div className="space-y-2 flex-1">
                <div className="border-b border-border pb-1.5">
                  <h3 className="text-xs sm:text-[13px] font-extrabold text-foreground">Prasadam Collection</h3>
                  <p className="text-[10px] text-muted-foreground">Prasadam and sacred offerings collection method.</p>
                </div>

                <div className="grid gap-2">
                  {/* Mandap Counter Collection */}
                  <div className="rounded-xl border-2 border-primary bg-primary/10 p-2.5 text-left shadow-2xs flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="block text-xs font-black text-foreground">Mandap Counter Collection</span>
                      <span className="text-[10px] text-muted-foreground block leading-tight">
                        Collect holy prasadam directly at the mandap desk after completion of the pooja ritual.
                      </span>
                    </div>
                    <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" />
                  </div>

                  {/* Home Delivery — enabled only when admin has set prasadamAvailable=true */}
                  <div
                    className={`rounded-xl border p-2.5 text-left flex items-center justify-between gap-2 transition-colors ${
                      prasadamAvailable
                        ? prasadamMode === "home_delivery"
                          ? "border-primary bg-primary/10 shadow-2xs cursor-pointer"
                          : "border-border/80 bg-card hover:border-primary/50 cursor-pointer"
                        : "border-border/60 bg-muted/40 opacity-60 cursor-not-allowed select-none"
                    }`}
                    title={prasadamAvailable ? "" : "Home delivery is not available for this pooja seva."}
                    onClick={() => prasadamAvailable && setPrasadamMode("home_delivery")}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`block text-xs font-bold ${prasadamAvailable ? "text-foreground" : "text-muted-foreground"}`}>
                          Home Delivery
                        </span>
                        {!prasadamAvailable && (
                          <span className="text-[9px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.1 rounded border border-border">
                            Unavailable
                          </span>
                        )}
                      </div>
                      <span className="text-[9.5px] text-muted-foreground block leading-tight">
                        {prasadamAvailable
                          ? "Prasadam will be delivered to your registered address after the ritual."
                          : "Doorstep delivery is not available for this pooja."}
                      </span>
                    </div>
                    {prasadamAvailable && prasadamMode === "home_delivery"
                      ? <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" />
                      : <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 shrink-0" />
                    }
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review & Confirmation */}
            {currentStep === 4 && (
              <div className="space-y-2 flex-1">
                <div className="border-b border-border pb-1.5">
                  <h3 className="text-xs sm:text-[13px] font-extrabold text-foreground">
                    {isUpdateMode ? "Review & Confirm Reschedule" : isFreeEvent ? "Review & Confirmation" : "Review & Contribution"}
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    {isUpdateMode
                      ? "Verify your rescheduled session, Gotram, and prasadam collection details"
                      : "Confirm your Pooja booking details before completing registration"}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-card border border-border space-y-2 text-xs">
                  {/* Selected Session Highlight */}
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Selected Session
                      </span>
                      {selectedSlotDisplayName && (
                        <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-primary/20 text-primary">
                          {selectedSlotDisplayName}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <strong className="font-black text-foreground flex items-center gap-1">
                        <span>📅</span>
                        <span>{selectedDateDisplay}</span>
                        {currentDay?.dayLabel && (
                          <span className="text-muted-foreground font-semibold">({currentDay.dayLabel})</span>
                        )}
                      </strong>
                      <span className="font-extrabold text-primary flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{selectedSlotDisplayTime}</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    <div className="p-2 rounded-lg bg-muted/40 border border-border">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold block">Pooja Ritual</span>
                      <strong className="text-foreground font-bold text-[11px] truncate block">{poojaTitle}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/40 border border-border">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold block">Yajaman &amp; Gotram</span>
                      <strong className="text-foreground font-bold text-[11px] truncate block">
                        {devoteeName} {gotram ? `(${gotram})` : ""}
                      </strong>
                    </div>
                    <div className="col-span-2 sm:col-span-1 p-2 rounded-lg bg-muted/40 border border-border">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold block">Prasadam</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] truncate block">
                        Mandap Desk
                      </strong>
                    </div>
                  </div>

                  {!isFreeEvent && numericFee > 0 && !isUpdateMode && (
                    <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-foreground block">Total Seva Contribution</span>
                        <span className="text-[9.5px] text-muted-foreground">Family inclusion pass</span>
                      </div>
                      <span className="text-base font-black text-primary">₹{numericFee}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </GlassCard>
        ) : (
          /* Success Screen */
          <div className="space-y-3 text-center py-3 animate-fadeIn flex-1 flex flex-col justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto text-2xl shadow-md">
              🪔
            </div>

            <div className="space-y-0.5">
              <h3 className="text-sm sm:text-base font-black text-foreground">
                {isUpdateMode ? "Pooja Slot Rescheduled Successfully!" : "Pooja Seva Booked Successfully!"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {isUpdateMode
                  ? "Your holy Sankalpam slot has been updated with the Temple Committee."
                  : "Your holy Sankalpam details have been registered with the Temple Committee."}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border text-left space-y-2 text-xs max-w-sm mx-auto shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-1.5">
                <div>
                  <span className="text-[9px] uppercase font-bold text-primary block">
                    {isUpdateMode ? "Rescheduled Pass" : "Sankalpam Pass"}
                  </span>
                  <strong className="text-xs font-black text-foreground truncate block max-w-[200px]">{poojaTitle}</strong>
                </div>
                <button
                  onClick={copyPassCode}
                  className="flex items-center gap-1 text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 hover:bg-primary/20 transition-all cursor-pointer"
                >
                  {copiedPass ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                  <span>{registrationCode || "—"}</span>
                </button>
              </div>

              {/* Selected Session in Pass */}
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 space-y-0.5">
                <span className="text-[9px] uppercase font-bold text-primary block">
                  Selected Session
                </span>
                <div className="flex items-center justify-between gap-1 text-[11px]">
                  <strong className="text-foreground font-extrabold flex items-center gap-1">
                    <span>📅</span>
                    <span>{selectedDateDisplay}</span>
                  </strong>
                  <strong className="text-primary font-black flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{selectedSlotDisplayTime}</span>
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <div>
                  <span className="text-muted-foreground block">Yajaman:</span>
                  <strong className="text-foreground">{devoteeName} {gotram ? `(${gotram})` : ""}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Prasadam:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">Mandap Counter</strong>
                </div>
                {attendingDevotees.trim() && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground block">Attending Family:</span>
                    <strong className="text-foreground">{attendingDevotees}</strong>
                  </div>
                )}
                {tokenNumber && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground block">Queue Token:</span>
                    <strong className="text-amber-700 text-sm">🎫 Token #{tokenNumber}</strong>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-muted-foreground block">Seva Contribution:</span>
                  <strong className="text-primary">{isFreeEvent ? "Free Seva" : isUpdateMode ? `₹${numericFee} (Already Paid)` : `₹${numericFee} (Paid)`}</strong>
                </div>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-center gap-2">
              <TouchButton onClick={onClose} variant="primary" size="sm" className="cursor-pointer">
                Done &amp; View Registrations
              </TouchButton>
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        {!isSuccess && (
          <div className="flex items-center justify-center gap-2 border-t border-border pt-2.5 shrink-0">
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

            {isMainPassMissing ? (
              <TouchButton
                type="button"
                disabled
                variant="outline"
                size="sm"
                className="opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700 select-none flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>Main Pass Required to Book</span>
              </TouchButton>
            ) : alreadyRegisteredTitle && !isUpdateMode ? (
              <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-bold border border-amber-500/20 flex items-center gap-1 select-none">
                <ShieldCheck className="w-3 h-3" /> Slot Already Booked
              </span>
            ) : isPoojaFull ? (
              <span className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold border border-rose-500/20 flex items-center gap-1 select-none">
                <AlertCircle className="w-3 h-3" /> Capacity Full (Sold Out)
              </span>
            ) : isPoojaClosed ? (
              <span className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-[11px] font-bold border border-border flex items-center gap-1 select-none">
                <Clock className="w-3 h-3" /> Registration Closed
              </span>
            ) : currentStep < 4 ? (
              <TouchButton type="button" onClick={handleNext} variant="primary" size="sm" className="cursor-pointer">
                <span>Continue</span>
                <ArrowRight className="w-3 h-3" />
              </TouchButton>
            ) : (
              <TouchButton
                type="button"
                onClick={() => handleBookingConfirm(isFreeEvent ? "Free Seva" : "UPI")}
                disabled={isSubmitting}
                variant="primary"
                size="sm"
                className={`cursor-pointer ${isSubmitting ? "opacity-75 cursor-not-allowed" : ""}`}
              >
                {isSubmitting ? (
                  <>
                    <span>Processing...</span>
                    <Loader2 className="w-3 h-3 animate-spin" />
                  </>
                ) : isUpdateMode ? (
                  <>
                    <span>Confirm Reschedule</span>
                    <RefreshCw className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <span>{isFreeEvent ? "Confirm & Register" : `Confirm & Book (₹${numericFee})`}</span>
                    <Flame className="w-3 h-3" />
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
