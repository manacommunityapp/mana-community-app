import { useEffect, useRef, useState } from "react";
import { Megaphone, AlertTriangle, Info, Wrench, Shield, X, Trophy, RefreshCw } from "lucide-react";
import { notificationService } from "../../../services/notificationService";
import type { NotificationItem } from "../../../services/notificationService";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AlertTickerItem {
  id: number;
  category: "EMERGENCY" | "MAINTENANCE" | "NOTICE" | "SECURITY" | "EVENT" | "SPORTS";
  message: string;
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

const DEFAULT_ALERTS: AlertTickerItem[] = [
  { id: 1, category: "NOTICE",      message: "Annual General Meeting scheduled for Sunday, 20 Jul at 10:00 AM in Club House." },
  { id: 2, category: "MAINTENANCE", message: "Water supply interrupted on Blocks B & C from 9 AM to 1 PM on Saturday. Plan accordingly." },
  { id: 3, category: "SECURITY",    message: "Visitor gate hours updated: Entry allowed 6 AM to 10 PM only. Please inform your guests." },
  { id: 4, category: "SPORTS",      message: "Badminton tournament registrations now open! Register at the Sports Desk before 18 Jul." },
  { id: 5, category: "SPORTS",      message: "Cricket matches scheduled for this Saturday at the main ground. All players report by 7 AM." },
  { id: 6, category: "NOTICE",      message: "Maintenance fee for Q3 is now due. Please pay before 31 Jul to avoid late charges." },
  { id: 7, category: "MAINTENANCE", message: "Lift #2 (Block A) under repair from Mon to Wed. Please use the alternate lift during this period." },
  { id: 8, category: "SPORTS",      message: "Swimming pool timings updated: Morning 6-9 AM, Evening 5-8 PM. Weekends open all day." },
];

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
  };
}

interface Props {
  speedPxPerSec?: number;
}

export function AlertTicker({ speedPxPerSec = 55 }: Props) {
  const trackRef    = useRef<HTMLDivElement>(null);
  const rafRef      = useRef<number>(0);
  const offsetRef   = useRef<number>(0);
  const pausedRef   = useRef<boolean>(false);
  const lastTsRef   = useRef<number | null>(null);

  const [alerts, setAlerts] = useState<AlertTickerItem[]>(DEFAULT_ALERTS);
  const [dismissed, setDismissed]     = useState(false);
  const [activeAlert, setActiveAlert] = useState<AlertTickerItem | null>(null);

  // Fetch live notifications from the backend
  useEffect(() => {
    notificationService.getNotifications(0, 15)
      .then(page => {
        if (page.content.length > 0) {
          const live = page.content.map(mapNotificationToAlert);
          setAlerts(live);
        }
      })
      .catch(() => {/* keep defaults */});
  }, []);

  const dominantCat = alerts.find(a => a.category === "EMERGENCY")?.category
                   ?? alerts.find(a => a.category === "SECURITY")?.category
                   ?? alerts[0]?.category
                   ?? "NOTICE";
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
        style={{ minHeight: "44px" }}
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
      >
        <div className={`flex-shrink-0 flex items-center gap-2 px-3.5 border-r border-white/20`}>
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

          <div ref={trackRef} className="inline-flex items-center will-change-transform py-2.5" style={{ whiteSpace: "nowrap" }}>
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
              <div className="px-5 pb-5 flex justify-end">
                <button onClick={() => setActiveAlert(null)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white ${cfg.bg} hover:opacity-90 transition-opacity`}>
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
