import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Megaphone, AlertTriangle, Info, Wrench, Shield, X, Trophy, RefreshCw, CalendarDays } from "lucide-react";
import { notificationService } from "../../../services/notices/notificationService";
import type { NotificationItem } from "../../../services/notices/notificationService";
import { eventService, type EventResponse } from "../../../services/events/eventService";
import { sportsService } from "../../../services/sports/sportsService";
import type { SportsTournament } from "../../../types/api";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AlertTickerItem {
  id: number;
  category: "EMERGENCY" | "MAINTENANCE" | "NOTICE" | "SECURITY" | "EVENT" | "SPORTS";
  message: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: "UPCOMING" | "RUNNING" | "PAST";
  actionUrl?: string;
}

// ── Static config per category ────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  EMERGENCY:   { label: "Emergency",   bg: "bg-red-600",    text: "text-white",     dot: "bg-red-300",     border: "border-red-700"    },
  MAINTENANCE: { label: "Maintenance", bg: "bg-amber-500",  text: "text-white",     dot: "bg-amber-200",   border: "border-amber-600"  },
  NOTICE:      { label: "Notice",      bg: "bg-indigo-600", text: "text-white",     dot: "bg-indigo-300",  border: "border-indigo-700" },
  SECURITY:    { label: "Security",    bg: "bg-slate-700",  text: "text-slate-100", dot: "bg-slate-400",   border: "border-slate-800"  },
  EVENT:       { label: "Event",       bg: "bg-emerald-600",text: "text-white",     dot: "bg-emerald-300", border: "border-emerald-700"},
  SPORTS:      { label: "Sports",      bg: "bg-sky-600",    text: "text-white",     dot: "bg-sky-300",     border: "border-sky-700"    },
} as const;

const CSS_COLORS: Record<string, string> = {
  "bg-red-600":    "#dc2626",
  "bg-amber-500":  "#f59e0b",
  "bg-indigo-600": "#4f46e5",
  "bg-slate-700":  "#334155",
  "bg-emerald-600":"#059669",
  "bg-sky-600":    "#0284c7",
};

const ICONS: Record<string, React.FC<{ className?: string }>> = {
  EMERGENCY:   AlertTriangle,
  MAINTENANCE: Wrench,
  NOTICE:      Megaphone,
  SECURITY:    Shield,
  EVENT:       Info,
  SPORTS:      Trophy,
};

export interface EventDateStatus {
  status: "UPCOMING" | "RUNNING" | "PAST";
  label: string;
}

/**
 * Determines whether an event/tournament is currently running or upcoming based on start and end dates.
 * Past events (where end date or start date has already elapsed) evaluate to PAST.
 */
export function getEventDateStatus(
  startDateStr?: string | null,
  endDateStr?: string | null,
  startTimeStr?: string | null,
  endTimeStr?: string | null,
  now: Date = new Date()
): EventDateStatus {
  if (!startDateStr && !endDateStr) {
    return { status: "PAST", label: "Past" };
  }

  const nowMs = now.getTime();

  let startMs: number | null = null;
  if (startDateStr) {
    if (startDateStr.length === 10 && startDateStr.includes("-")) {
      const [y, m, d] = startDateStr.split("-").map(Number);
      let hour = 0;
      let min = 0;
      if (startTimeStr) {
        const timeMatch = startTimeStr.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
        if (timeMatch) {
          hour = Number(timeMatch[1]);
          min = Number(timeMatch[2]);
          const ampm = timeMatch[3]?.toUpperCase();
          if (ampm === "PM" && hour < 12) hour += 12;
          if (ampm === "AM" && hour === 12) hour = 0;
        }
      }
      startMs = new Date(y, m - 1, d, hour, min, 0, 0).getTime();
    } else {
      const parsed = new Date(startDateStr);
      if (!isNaN(parsed.getTime())) startMs = parsed.getTime();
    }
  }

  let endMs: number | null = null;
  if (endDateStr) {
    if (endDateStr.length === 10 && endDateStr.includes("-")) {
      const [y, m, d] = endDateStr.split("-").map(Number);
      let hour = 23;
      let min = 59;
      if (endTimeStr) {
        const timeMatch = endTimeStr.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
        if (timeMatch) {
          hour = Number(timeMatch[1]);
          min = Number(timeMatch[2]);
          const ampm = timeMatch[3]?.toUpperCase();
          if (ampm === "PM" && hour < 12) hour += 12;
          if (ampm === "AM" && hour === 12) hour = 0;
        }
      }
      endMs = new Date(y, m - 1, d, hour, min, 59, 999).getTime();
    } else {
      const parsed = new Date(endDateStr);
      if (!isNaN(parsed.getTime())) endMs = parsed.getTime();
    }
  } else if (startMs !== null) {
    // Single day event runs until 23:59:59.999 of the start day
    const e = new Date(startMs);
    e.setHours(23, 59, 59, 999);
    endMs = e.getTime();
  }

  if (endMs !== null && endMs < nowMs) {
    return { status: "PAST", label: "Past" };
  }

  if (startMs !== null && startMs > nowMs) {
    return { status: "UPCOMING", label: "Upcoming" };
  }

  return { status: "RUNNING", label: "Happening Now" };
}

/**
 * Checks if a free-form notification message mentions an explicit date that is already in the past.
 */
export function isNotificationDatePast(text?: string | null): boolean {
  if (!text) return false;
  const monthNames = "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec";
  const regex = new RegExp(`(?:on|for|from|dated?|by)?\\s*(${monthNames})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s*(\\d{4})`, "i");
  const match = text.match(regex);
  if (match) {
    const parsed = new Date(`${match[1]} ${match[2]}, ${match[3]}`);
    if (!isNaN(parsed.getTime())) {
      parsed.setHours(23, 59, 59, 999);
      if (parsed.getTime() < Date.now()) {
        return true;
      }
    }
  }
  return false;
}

// ── Upcoming Fallback Alerts (Only shown if genuinely in the future/running) ──
const SEED_UPCOMING_ALERTS: AlertTickerItem[] = [
  {
    id: 101,
    category: "EVENT",
    startDate: "2026-11-08",
    endDate: "2026-11-12",
    status: "UPCOMING",
    actionUrl: "/events",
    message: "🪔 Upcoming Grand Festival: Diwali Celebrations & Deepotsavam (Nov 8–12, 2026). Join the community festivities!",
  },
  {
    id: 102,
    category: "SPORTS",
    startDate: "2026-11-20",
    endDate: "2026-11-25",
    status: "UPCOMING",
    actionUrl: "/sports",
    message: "🏆 Community Winter Sports Meet 2026: Badminton & Cricket registrations opening for November 20.",
  },
];

function formatDisplayDate(dateStr?: string | null, timeStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const formatted = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      return timeStr ? `${formatted} at ${timeStr}` : formatted;
    }
  } catch {}
  return timeStr ? `${dateStr} at ${timeStr}` : dateStr;
}

function mapEventToAlert(ev: EventResponse, idx: number): AlertTickerItem | null {
  const dateStatus = getEventDateStatus(ev.startDate, ev.endDate, ev.startTime, ev.endTime);
  if (dateStatus.status === "PAST") return null;

  const isSports = (ev.type || "").toUpperCase().includes("SPORT") || (ev.category || "").toUpperCase().includes("SPORT");
  const isPooja = (ev.type || "").toUpperCase().includes("POOJA") || (ev.category || "").toUpperCase().includes("POOJA") || (ev.title || "").toLowerCase().includes("puja") || (ev.title || "").toLowerCase().includes("pooja");
  
  const dateFormatted = formatDisplayDate(ev.startDate, ev.startTime);
  const location = ev.venue || ev.location || "";
  const locationStr = location ? ` at ${location}` : "";
  const prefix = dateStatus.status === "RUNNING"
    ? (isSports ? "🏆 [Live] " : "🔴 [Happening Now] ")
    : (isPooja ? "🙏 [Upcoming] " : isSports ? "🏆 [Upcoming] " : "🎉 [Upcoming] ");
  
  return {
    id: ev.id ? Number(ev.id) : 200 + idx,
    category: isSports ? "SPORTS" : "EVENT",
    message: `${prefix}${ev.title}${dateFormatted ? ` • ${dateFormatted}` : ""}${locationStr}${ev.priceType === "FREE" ? " (Free Entry)" : ""}`,
    startDate: ev.startDate,
    endDate: ev.endDate,
    status: dateStatus.status,
    actionUrl: "/events",
  };
}

function mapTournamentToAlert(t: SportsTournament, idx: number): AlertTickerItem | null {
  const start = t.eventDateStart || t.registrationDateStart;
  const end = t.eventDateEnd || t.registrationDateEnd;
  const dateStatus = getEventDateStatus(start, end, t.startTime, t.dueTime);
  if (dateStatus.status === "PAST") return null;

  const dateFormatted = formatDisplayDate(start, t.startTime);
  const location = t.venueName || (t.venue as any)?.name || "";
  const locationStr = location ? ` at ${location}` : "";
  const prefix = dateStatus.status === "RUNNING" ? "🏆 [Live Tournament] " : "🏆 [Upcoming Tournament] ";

  return {
    id: t.id ? 8000 + Number(t.id) : 800 + idx,
    category: "SPORTS",
    message: `${prefix}${t.name}${dateFormatted ? ` • ${dateFormatted}` : ""}${locationStr}`,
    startDate: start,
    endDate: end,
    status: dateStatus.status,
    actionUrl: "/sports",
  };
}

function mapNotificationToAlert(n: NotificationItem, idx: number): AlertTickerItem {
  const cat = (n.category || "").toUpperCase();
  const type = (n.type || "").toUpperCase();
  let category: AlertTickerItem["category"] = "NOTICE";

  const isSports = 
    cat === "SPORTS" || 
    cat === "AUCTION" ||
    type === "SPORTS_EVENT" ||
    type.startsWith("TOURNAMENT") ||
    type.startsWith("MATCH") ||
    type.startsWith("SCHEDULE") ||
    type.startsWith("AUCTION") ||
    type.startsWith("PLAYER") ||
    type.startsWith("BID") ||
    type.startsWith("TEAM") ||
    type.startsWith("CAPTAIN");

  if (isSports) category = "SPORTS";
  else if (cat === "SECURITY") category = "SECURITY";
  else if (cat === "MAINTENANCE") category = "MAINTENANCE";
  else if (cat === "EMERGENCY") category = "EMERGENCY";
  else if (cat === "EVENT") category = "EVENT";
  return {
    id: n.id ?? idx,
    category,
    message: n.body ?? n.title,
    actionUrl: isSports ? "/sports" : "/events",
  };
}

interface Props {
  speedPxPerSec?: number;
}

export function AlertTicker({ speedPxPerSec = 55 }: Props) {
  const navigate    = useNavigate();
  const trackRef    = useRef<HTMLDivElement>(null);
  const rafRef      = useRef<number>(0);
  const offsetRef   = useRef<number>(0);
  const pausedRef   = useRef<boolean>(false);
  const lastTsRef   = useRef<number | null>(null);

  const [alerts, setAlerts] = useState<AlertTickerItem[]>([]);
  const [dismissed, setDismissed]     = useState(false);
  const [activeAlert, setActiveAlert] = useState<AlertTickerItem | null>(null);

  // Fetch live notifications and only keep current running and upcoming events
  useEffect(() => {
    let isMounted = true;

    async function loadAlerts() {
      try {
        const liveItems: AlertTickerItem[] = [];

        // 1. Fetch live events from eventService
        try {
          const events = await eventService.getAllEvents().catch(() => []);
          if (Array.isArray(events)) {
            events.forEach((ev, idx) => {
              if (ev.status === "CANCELLED" || ev.status === "COMPLETED") return;
              const mapped = mapEventToAlert(ev, idx);
              if (mapped) liveItems.push(mapped);
            });
          }
        } catch (e) {
          console.warn("Failed to fetch events for alert ticker:", e);
        }

        // 2. Fetch live sports tournaments
        try {
          const tournaments = await sportsService.getAllTournaments().catch(() => []);
          if (Array.isArray(tournaments)) {
            tournaments.forEach((t, idx) => {
              if (t.registrationStatus === "COMPLETED" || t.registrationStatus === "CANCELLED") return;
              const mapped = mapTournamentToAlert(t, idx);
              if (mapped) liveItems.push(mapped);
            });
          }
        } catch (e) {
          console.warn("Failed to fetch tournaments for alert ticker:", e);
        }

        // 3. Fetch notifications summary (skip notifications referencing past dates)
        try {
          const noticesRes = await notificationService.getNotificationsSummary(0, 5).catch(() => null);
          if (noticesRes?.content && Array.isArray(noticesRes.content)) {
            noticesRes.content.forEach((n, idx) => {
              const text = (n.body ?? n.title ?? "");
              if (isNotificationDatePast(text)) return; // Exclude notifications for past events!

              const isEmergency = n.category === "EMERGENCY" || n.priority === "URGENT" || n.priority === "HIGH";
              const isNotice = n.category === "NOTICE" || n.category === "SECURITY" || n.category === "MAINTENANCE";

              // Only add if active emergency or notice, and not duplicate message
              if (isEmergency || (isNotice && liveItems.length < 5)) {
                const alert = mapNotificationToAlert(n, 9000 + idx);
                if (!liveItems.some(item => item.message.toLowerCase() === alert.message.toLowerCase())) {
                  liveItems.push(alert);
                }
              }
            });
          }
        } catch (e) {
          console.warn("Failed to fetch notifications for alert ticker:", e);
        }

        // 4. Fallback: only if no live items are present, show upcoming seed alerts that are not past
        if (liveItems.length === 0) {
          const validSeed = SEED_UPCOMING_ALERTS.filter(a => {
            const dateStatus = getEventDateStatus(a.startDate, a.endDate);
            return dateStatus.status !== "PAST";
          });
          if (isMounted) setAlerts(validSeed);
        } else {
          if (isMounted) setAlerts(liveItems);
        }
      } catch (err) {
        if (isMounted) {
          setAlerts([]);
        }
      }
    }

    loadAlerts();

    return () => {
      isMounted = false;
    };
  }, []);

  const dominantCat = alerts.find(a => a.category === "EMERGENCY")?.category
                   ?? alerts.find(a => a.category === "EVENT")?.category
                   ?? alerts.find(a => a.category === "SECURITY")?.category
                   ?? alerts[0]?.category
                   ?? "EVENT";
  const dominant = CATEGORY_CONFIG[dominantCat];
  const DomIcon  = ICONS[dominantCat];

  useEffect(() => {
    if (dismissed || alerts.length === 0) return;
    const track = trackRef.current;
    if (!track) return;

    const step = (ts: number) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const delta = ts - lastTsRef.current;
      lastTsRef.current = ts;

      if (!pausedRef.current) {
        offsetRef.current += (speedPxPerSec * delta) / 1000;
        const half = track.scrollWidth / 2;
        if (offsetRef.current >= half) offsetRef.current -= half;
        track.style.transform = `translateX(-${offsetRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [dismissed, alerts.length, speedPxPerSec]);

  if (dismissed || alerts.length === 0) return null;

  const looped = [...alerts, ...alerts];

  return (
    <>
      <div
        className={`relative flex items-stretch overflow-hidden rounded-xl border ${dominant.border} shadow-md ${dominant.bg}`}
        style={{ minHeight: "28px" }}
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
      >
        <div className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 border-r border-white/20`}>
          <DomIcon className={`w-3.5 h-3.5 ${dominant.text} flex-shrink-0`} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${dominant.text} whitespace-nowrap hidden sm:block`}>
            {dominant.label}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${dominant.dot} animate-pulse`} />
        </div>

        <div className="flex-1 overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-6 z-10 pointer-events-none"
            style={{ background: `linear-gradient(to right, ${CSS_COLORS[dominant.bg] ?? "#4f46e5"}, transparent)` }} />
          <div className="absolute right-0 top-0 bottom-0 w-6 z-10 pointer-events-none"
            style={{ background: `linear-gradient(to left, ${CSS_COLORS[dominant.bg] ?? "#4f46e5"}, transparent)` }} />

          <div ref={trackRef} className="inline-flex items-center will-change-transform py-1" style={{ whiteSpace: "nowrap" }}>
            {looped.map((alert, idx) => {
              const cfg  = CATEGORY_CONFIG[alert.category];
              return (
                <button key={`${alert.id}-${idx}`} type="button"
                  onClick={() => setActiveAlert(alert)}
                  className="inline-flex items-center gap-2.5 px-5 group cursor-pointer">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/20 ${dominant.text} border border-white/25 flex-shrink-0`}>
                    {cfg.label}
                  </span>
                  <span className={`text-[11px] font-medium ${dominant.text} group-hover:underline underline-offset-2`}>
                    {alert.message}
                  </span>
                  <span className={`text-lg leading-none opacity-25 ${dominant.text} select-none`}>•</span>
                </button>
              );
            })}
          </div>
        </div>

        <button type="button" onClick={() => setDismissed(true)}
          className={`flex-shrink-0 flex items-center px-3 border-l border-white/20 hover:bg-white/10 transition-colors ${dominant.text}`}
          title="Dismiss alerts">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {activeAlert && (() => {
        const cfg  = CATEGORY_CONFIG[activeAlert.category];
        const Icon = ICONS[activeAlert.category];
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-8 sm:pb-0"
            style={{ backdropFilter: "blur(4px)", background: "rgba(15,23,42,0.5)" }}
            onClick={() => setActiveAlert(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              <div className={`${cfg.bg} px-5 py-4 flex items-center gap-3`}>
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black uppercase tracking-wider text-white/90">{cfg.label}</div>
                  <div className="text-[10px] text-white/60 font-medium">Community Notice Board</div>
                </div>
                <button onClick={() => setActiveAlert(null)}
                  className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-slate-700 leading-relaxed">{activeAlert.message}</p>
              </div>
              <div className="px-5 pb-5 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    const target = activeAlert.actionUrl || (activeAlert.category === "SPORTS" ? "/sports" : "/events");
                    setActiveAlert(null);
                    navigate(target);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {activeAlert.category === "SPORTS" ? (
                    <>
                      <Trophy className="w-3.5 h-3.5 text-sky-600" />
                      Sports Hub
                    </>
                  ) : (
                    <>
                      <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                      Event Dashboard
                    </>
                  )}
                </button>
                <button onClick={() => setActiveAlert(null)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white ${cfg.bg} hover:opacity-90 transition-opacity cursor-pointer`}>
                  Got it
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
