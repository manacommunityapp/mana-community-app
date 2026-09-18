import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Loader2, AlertTriangle, Bell, Trophy, Users, Zap, CalendarDays, ArrowUpRight, ChevronDown, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { sportsService } from "../../../services/sports/sportsService";
import { confirmAction } from "../../../utils/AlertUtils";
import { sportsDashboardService, type DashboardTournamentCard } from "../../../services/sports/sportsDashboardService";
import { auctionService } from "../../../services/sports/auctionService";
import { useAuth } from "../../../contexts/AuthContext";
import {
  VIEW_SPORTS_MAIN,
  VIEW_EVENT_REGISTRATIONS,
  VIEW_AUCTION_CONFIG,
  VIEW_LIVE_AUCTION,
  VIEW_TEAMS_DASHBOARD,
  VIEW_PLAYER_POOL,
  VIEW_AUCTION_RESULTS,
  CREATE_EDIT_SPORTS_MAIN,
  DELETE_SPORTS_MAIN,
  CREATE_EDIT_AUCTION_CONFIG,
  CREATE_EDIT_PLAYER_POOL,
  CREATE_EDIT_EVENT_REGISTRATIONS,
} from "../../../constants/permissions";
import { format, differenceInDays } from "date-fns";
import { SPORTS_DATA } from "./sportsData";
import type { OpenRegistration } from "./sportsData";

function getSportEmoji(sportName: string | null | undefined): string {
  const n = (sportName || "").toLowerCase();
  if (n.includes("cricket")) return "🏏";
  if (n.includes("football") || n.includes("soccer")) return "⚽";
  if (n.includes("badminton")) return "🏸";
  if (n.includes("volleyball")) return "🏐";
  if (n.includes("basketball")) return "🏀";
  if (n.includes("kabaddi")) return "🤼";
  if (n.includes("hockey")) return "🏑";
  if (n.includes("throwball")) return "🏐";
  if (n.includes("table tennis") || n.includes("tt")) return "🏓";
  if (n.includes("tennis")) return "🎾";
  if (n.includes("chess")) return "♟️";
  if (n.includes("carrom")) return "🎯";
  return "🏆";
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  value: number;
  label: string;
  badge: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

function StatCard({ value, label, badge, color, badgeBg, badgeText, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-xl p-2.5 sm:p-3 card-hover-lift flex items-center gap-2.5 bg-white border border-[#6366f1]/12 shadow-[0_2px_8px_rgba(99,102,241,0.04)] transition-all duration-300 hover:border-indigo-500/20">
      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs" style={{ background: badgeBg }}>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-1">
          <div className="text-base sm:text-xl font-extrabold leading-none" style={{ color }}>{value}</div>
          <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none" style={{ background: badgeBg, color: badgeText }}>
            {badge}
          </span>
        </div>
        <div className="text-[11px] sm:text-xs text-[#6b7094] mt-0.5 font-medium truncate" title={label}>{label}</div>
      </div>
    </div>
  );
}

// ─── Compact Match Timer ───────────────────────────────────────────────────

function CompactMatchBadge({ targetDate }: { targetDate?: Date }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    if (!targetDate) return;
    const calculateTime = () => {
      const diff = targetDate.getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return null;

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[11px] font-bold tabular-nums shrink-0 ml-1.5 shadow-2xs">
      <span className="text-[10px] text-amber-600/70">⏱</span>
      {timeLeft.d > 0 && <span>{timeLeft.d}d</span>}
      <span>{pad(timeLeft.h)}h</span>
      <span>:</span>
      <span>{pad(timeLeft.m)}m</span>
      <span>:</span>
      <span className="text-amber-600">{pad(timeLeft.s)}s</span>
    </span>
  );
}

// ─── Event Row ───────────────────────────────────────────────────────────────

interface EventRowProps { event: (typeof SPORTS_DATA.upcomingEvents)[number] & { targetDate?: Date }; onClick: () => void; }

function EventRow({ event, onClick }: EventRowProps) {
  const dotClass = event.status === "LIVE" ? "bg-[#10b981] shadow-[0_0_10px_#10b981] animate-pulse"
    : event.status === "COMPLETED" ? "bg-slate-500" : "bg-[#f97316]";
  return (
    <div onClick={onClick} className="flex items-center justify-between gap-3 p-3 rounded-lg mb-2 cursor-pointer bg-white border border-[#6366f1]/12 shadow-[0_2px_10px_rgba(99,102,241,0.03)] transition-all duration-300 hover:border-indigo-500/20 hover:translate-x-0.5 hover:shadow-md">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotClass}`} />
        <div className="min-w-0 text-left flex-1">
          <div className="text-sm font-bold text-[#0d0d2b] flex items-center flex-wrap gap-1">
            <span className="truncate">{event.name}{event.subtitle ? ` — ${event.subtitle}` : ""}</span>
            {event.targetDate && event.targetDate.getTime() > Date.now() && (
              <CompactMatchBadge targetDate={event.targetDate} />
            )}
          </div>
          <div className="text-xs text-[#6b7094] mt-0.5 font-medium">{event.venue}</div>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-xs font-semibold" style={{ color: event.wonColor ?? event.timeColor }}>{event.statusText}</div>
        <div className="text-[10px] text-[#6b7094] mt-0.5 font-medium">{event.statusSub}</div>
      </div>
    </div>
  );
}

// ─── Registration Card ───────────────────────────────────────────────────────

interface RegCardProps {
  item: OpenRegistration;
  onRegister: (item: OpenRegistration) => void;
  onView: (item: OpenRegistration) => void;
  onWithdraw?: (item: OpenRegistration) => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: (item: OpenRegistration) => void;
  isAdmin?: boolean;
  onToggleStatus?: (item: OpenRegistration) => void;
  onStartAuction?: (item: OpenRegistration) => void;
  onScheduleMatches?: (item: OpenRegistration) => void;
  toggling?: boolean;
}

function RegCard({
  item,
  onRegister,
  onView,
  onWithdraw,
  secondaryActionLabel,
  onSecondaryAction,
  isAdmin,
  onToggleStatus,
  onStartAuction,
  onScheduleMatches,
  toggling
}: RegCardProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg mb-2 bg-white border border-[#6366f1]/12 shadow-[0_2px_10px_rgba(99,102,241,0.03)] transition-all duration-300 hover:border-indigo-500/20 hover:shadow-md">
      {item.sportEmoji ? (
        <span className="text-lg flex-shrink-0 mt-0.5">{item.sportEmoji}</span>
      ) : (
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: item.dotColor }} />
      )}
      <div className="flex-1 min-w-0 text-left">
        <div className="text-sm font-bold text-[#0d0d2b]">
          {item.name} <span className="text-[#6b7094] font-medium">— {item.date}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
          <span className="text-xs text-[#6b7094] font-medium">{item.category}</span>
          {item.categoryName && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
              {item.categoryName}
            </span>
          )}
        </div>
        {item.spots && <div className="text-[10px] text-indigo-600 font-semibold mt-1">{item.spots}</div>}
      </div>
      <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
        <div className="flex gap-1.5 justify-end">
          {item.status === "REGISTRATION_CLOSED" && item.auctionStatus === "COMPLETED" && !isAdmin ? (
            <button
              disabled
              className="text-[11px] px-2.5 py-1 rounded-lg font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-75"
            >
              Closed
            </button>
          ) : (
            <button
              onClick={() => {
                if (item.action === "Confirmed") return;
                if (item.action === "Register") onRegister(item);
                else if (item.action === "Withdraw" && onWithdraw) onWithdraw(item);
                else onView(item);
              }}
              disabled={item.action === "Confirmed"}
              className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer ${
                item.action === "Register"
                  ? "bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-500/20 active:scale-95"
                  : item.action === "Confirmed"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default"
                    : item.action === "Withdraw"
                      ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                      : "bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 cursor-pointer"
              }`}
            >
              <span>{item.action}</span>
              {item.action === "Register" && <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />}
            </button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={() => onSecondaryAction(item)}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-all bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs hover:opacity-95"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
        {isAdmin && (
          <div className="flex flex-col gap-1.5 mt-0.5">
            {onToggleStatus && (
              <button
                onClick={() => onToggleStatus(item)}
                disabled={toggling}
                className={`text-[10px] py-1 rounded-lg font-bold border cursor-pointer transition-all bg-transparent disabled:opacity-50 ${item.status === "REGISTRATION_OPEN"
                  ? "border-red-500/30 text-red-500 hover:bg-red-500/5"
                  : "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/5"
                  }`}
              >
                {toggling ? "..." : item.status === "REGISTRATION_OPEN" ? "Close Registration" : "Resume"}
              </button>
            )}

            {item.status === "REGISTRATION_CLOSED" && (
              <>
                {item.auctionStatus === "COMPLETED" ? (
                  <button
                    disabled
                    className="text-[10px] py-1 rounded-lg font-bold border transition-all bg-emerald-50 border-emerald-200 text-emerald-600 cursor-default"
                  >
                    Auction Completed
                  </button>
                ) : (
                  <button
                    onClick={() => onStartAuction?.(item)}
                    className="text-[10px] py-1 rounded-lg font-bold border cursor-pointer transition-all bg-transparent border-indigo-500/30 text-indigo-600 hover:bg-indigo-50"
                  >
                    {item.auctionStatus === "LIVE" ? "Resume Auction" : "Start Auction"}
                  </button>
                )}
                <button
                  onClick={() => onScheduleMatches?.(item)}
                  className="text-[10px] py-1 rounded-lg font-bold border cursor-pointer transition-all bg-transparent border-violet-500/30 text-violet-600 hover:bg-violet-50"
                >
                  Schedule Matches
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Next Match Timer ─────────────────────────────────────────────────────────

interface NextMatchData {
  title: string;
  subtitle: string;
  targetDate: Date;
}

function NextMatchTimer({ nextMatch }: { nextMatch: NextMatchData | null }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number }>({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    if (!nextMatch) return;
    const calculateTime = () => {
      const diff = nextMatch.targetDate.getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }
      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [nextMatch]);

  if (!nextMatch) return null;

  const isUrgent = timeLeft.d === 0 && timeLeft.h === 0 && timeLeft.m < 60;
  const accent = isUrgent ? "#ef4444" : "#f97316";

  const timeUnits = [
    { v: timeLeft.d, l: "DAYS" },
    { v: timeLeft.h, l: "HOURS" },
    { v: timeLeft.m, l: "MIN" },
    { v: timeLeft.s, l: "SEC" },
  ];

  return (
    <div
      className="rounded-xl p-3.5 sm:p-4"
      style={{
        background: "white",
        border: "1px solid rgba(99, 102, 241, 0.12)",
        boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px",
      }}
    >
      <div className="text-xs font-semibold uppercase tracking-widest mb-2.5" style={{ color: "#6b7094" }}>
        Next Match Timer
      </div>
      <div className="text-center">
        <div className="text-xs mb-2.5 font-semibold text-slate-800 truncate px-1" title={nextMatch.title}>
          {nextMatch.title}
        </div>
        <div className="flex justify-center items-center gap-1.5 sm:gap-2">
          {timeUnits.map(({ v, l }, i) => (
            <div key={l} className="flex items-center gap-1.5 sm:gap-2">
              <div className="text-center">
                <div
                  className="text-lg sm:text-2xl font-bold bg-slate-50 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-lg min-w-[40px] sm:min-w-[48px] tabular-nums"
                  style={{ color: accent, border: `1px solid ${accent}30` }}
                >
                  {v < 10 ? `0${v}` : v}
                </div>
                <div className="text-[9px] sm:text-[10px] mt-1 font-semibold tracking-wider" style={{ color: "#6b7094" }}>
                  {l}
                </div>
              </div>
              {i < timeUnits.length - 1 && (
                <div className="text-base sm:text-xl text-slate-400 font-light mb-4 sm:mb-5 select-none">:</div>
              )}
            </div>
          ))}
        </div>
        <div className="text-xs mt-2.5 font-medium truncate px-1" style={{ color: "#6b7094" }} title={nextMatch.subtitle}>
          {nextMatch.subtitle}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function SportsDashboard() {
  const { user, hasPermission, hasAnyPermission } = useAuth();
  const navigate = useNavigate();
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [openRegs, setOpenRegs] = useState<OpenRegistration[]>([]);
  const [openTournaments, setOpenTournaments] = useState<(DashboardTournamentCard & { mappedEvents: OpenRegistration[] })[]>([]);
  const [expandedTournaments, setExpandedTournaments] = useState<Set<number>>(new Set());
  const [expandedSports, setExpandedSports] = useState<Set<string>>(new Set());
  const [closedRegs, setClosedRegs] = useState<OpenRegistration[]>([]);
  const [closedTournaments, setClosedTournaments] = useState<(DashboardTournamentCard & { mappedEvents: OpenRegistration[] })[]>([]);
  const [expandedClosedTournaments, setExpandedClosedTournaments] = useState<Set<number>>(new Set());
  const [myRegistrations, setMyRegistrations] = useState<any[]>([]);
  const [captainRegistration, setCaptainRegistration] = useState<any[]>([]);
  const [captainRegs, setCaptainRegs] = useState<any[]>([]);
  const [selectedCaptainEventId, setSelectedCaptainEventId] = useState<number | null>(null);
  const [loadingCaptains, setLoadingCaptains] = useState(false);

  const [isNominateModalOpen, setIsNominateModalOpen] = useState(false);
  const [isAdminNomination, setIsAdminNomination] = useState(false);
  const [selectedRegForNomination, setSelectedRegForNomination] = useState<number | null>(null);
  const [nominateTeamName, setNominateTeamName] = useState("");
  const [nominatingRegId, setNominatingRegId] = useState<number | null>(null);
  const [isSubmittingNomination, setIsSubmittingNomination] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [stats, setStats] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [nextMatch, setNextMatch] = useState<NextMatchData | null>(null);

  const canManageCaptainNominations = hasAnyPermission(CREATE_EDIT_PLAYER_POOL, CREATE_EDIT_SPORTS_MAIN);
  const confirmedMyRegistrations = myRegistrations.filter(r => r.status === "CONFIRMED");
  const teamClosedRegs = closedRegs.filter(r => r.isTeamSport);
  const confirmedTeamRegistrations = confirmedMyRegistrations.filter(r => r.matchType === "TEAM");

  const fetchData = useCallback(async () => {
    if (!user?.userId) return;
    setLoading(true);
    setError(null);
    try {
      // Trigger parallel granular fetch requests
      const [statsData, upcomingData, openTournamentsData, closedTournamentsData, myRegsData, notificationsData] = await Promise.all([
        sportsDashboardService.getStats(),
        sportsDashboardService.getUpcomingEvents(),
        sportsDashboardService.getOpenTournaments(),
        sportsDashboardService.getClosedTournaments(),
        sportsDashboardService.getMyRegistrations(),
        sportsDashboardService.getNotifications()
      ]);

      const fmtRange = (start: string | null, end: string | null) =>
        start && end ? `${format(new Date(start), "MMM d")} - ${format(new Date(end), "MMM d")}` : "TBD";

      // Map my registrations
      const fetchedMyRegs = myRegsData.map(r => ({
        id: r.id,
        eventId: r.eventId,
        event: {
          id: r.eventId,
          name: r.eventName,
          eventDateStart: r.eventDateStart,
          sport: { name: r.sportName },
          registrationStatus: r.eventRegistrationStatus,
        },
        category: { name: r.categoryName },
        status: r.status,
        matchType: r.matchType,
        captainNomination: r.captainNomination,
        captainConfirmation: r.captainConfirmation,
      }));
      setMyRegistrations(fetchedMyRegs);

      // Helper event mapping function
      const mapEventCard = (e: any): OpenRegistration => {
        let actionVal = "Register";
        if (e.myRegistrationId) {
          actionVal = e.myRegistrationStatus === "CONFIRMED" ? "Confirmed" : "Withdraw";
        }
        return {
          id: e.id,
          uuid: e.uuid ?? undefined,
          name: e.name,
          date: fmtRange(e.eventDateStart, e.eventDateEnd),
          category: [e.sportName, e.venueName].filter(Boolean).join(" · ") || (e.sportName ?? "Sport"),
          spots: e.maxParticipants ? `${e.maxParticipants} max spots` : "Unlimited spots",
          progress: e.myRegistrationId ? (e.myRegistrationStatus === "CONFIRMED" ? 100 : 50) : 0,
          progressColor: e.myRegistrationId ? (e.myRegistrationStatus === "CONFIRMED" ? "#10b981" : "#f97316") : "#e2e8f0",
          dotColor: "#10b981",
          action: actionVal,
          status: e.registrationStatus ?? "REGISTRATION_OPEN",
          registrationId: e.myRegistrationId ?? undefined,
          isTeamSport: e.teamSport,
          sportEmoji: getSportEmoji(e.sportName),
          categoryName: e.categoryName ?? undefined,
        };
      };

      // Grouped open tournaments
      if (openTournamentsData?.length) {
        setOpenTournaments(openTournamentsData.map(t => ({
          ...t,
          mappedEvents: t.events.map(mapEventCard),
        })));
        setExpandedTournaments(new Set(openTournamentsData.map(t => t.id)));
      } else {
        setOpenTournaments([]);
      }

      // Helper closed event mapping function
      const mapClosedEventCard = (e: any): OpenRegistration => {
        return {
          id: e.id,
          uuid: e.uuid ?? undefined,
          name: e.name,
          date: fmtRange(e.eventDateStart, e.eventDateEnd),
          category: [e.sportName, e.venueName].filter(Boolean).join(" · ") || (e.sportName ?? "Sport"),
          spots: "Registration closed",
          progress: 100,
          progressColor: "#ef4444",
          dotColor: "#ef4444",
          action: "View" as const,
          sportEmoji: getSportEmoji(e.sportName),
          categoryName: e.categoryName ?? undefined,
          status: e.registrationStatus ?? "REGISTRATION_CLOSED",
          auctionStatus: e.auctionStatus ?? "DRAFT",
          isTeamSport: e.teamSport,
        };
      };

      // Grouped closed tournaments
      if (closedTournamentsData?.length) {
        setClosedTournaments(closedTournamentsData.map(t => ({
          ...t,
          mappedEvents: t.events.map(mapClosedEventCard),
        })));
        setExpandedClosedTournaments(new Set(closedTournamentsData.map(t => t.id)));
      } else {
        setClosedTournaments([]);
      }

      // Re-populate closedRegs flat array just in case there are single fallback items
      setClosedRegs(closedTournamentsData.flatMap(t => t.events).map(mapClosedEventCard));

      // Captain registrations (auction domain — separate concern, kept as-is)
      try {
        const regs = await auctionService.getCaptainRegistration();
        setCaptainRegistration(regs);
      } catch {
        setCaptainRegistration([]);
      }

      // Map my upcoming events
      const mappedMyEvents = upcomingData.map(e => {
        let exactTargetDate: Date | undefined;
        if (e.eventDateStart) {
          try {
            if (e.startTime) {
              const datePart = e.eventDateStart.includes("T") ? e.eventDateStart.split("T")[0] : e.eventDateStart;
              const combined = new Date(`${datePart}T${e.startTime.length === 5 ? `${e.startTime}:00` : e.startTime}`);
              if (!isNaN(combined.getTime())) {
                exactTargetDate = combined;
              }
            }
            if (!exactTargetDate) {
              const parsed = new Date(e.eventDateStart);
              if (!isNaN(parsed.getTime())) {
                exactTargetDate = parsed;
              }
            }
          } catch {
            exactTargetDate = undefined;
          }
        }

        return {
          id: e.id,
          name: e.name,
          subtitle: e.tournamentName ? `${e.tournamentName} · ${e.sportName ?? ""}` : (e.sportName ?? ""),
          venue: e.venueName ?? "TBD",
          category: e.categoryName ?? "General",
          status: (e.registrationStatus === "LIVE" ? "LIVE" : e.registrationStatus === "COMPLETED" ? "COMPLETED" : "UPCOMING") as any,
          statusText: e.registrationStatus === "LIVE" ? "LIVE NOW"
            : e.registrationStatus === "COMPLETED" ? (exactTargetDate ? format(exactTargetDate, "MMM d, h:mm a") : "Completed")
            : (exactTargetDate && exactTargetDate.getTime() <= Date.now()) ? format(exactTargetDate, "MMM d, h:mm a")
            : "Upcoming",
          statusSub: e.registrationStatus === "LIVE" ? "In Progress"
            : e.registrationStatus === "COMPLETED" ? "Completed"
            : "Confirmed ✓",
          dotColor: e.registrationStatus === "LIVE" ? "#10b981" : "#f97316",
          timeColor: e.registrationStatus === "LIVE" ? "#10b981" : "#f97316",
          targetDate: exactTargetDate,
        };
      });
      setLiveEvents(mappedMyEvents);

      // Stats (server-computed counts)
      setStats([
        { id: 1, value: statsData.yourRegistrations, label: "Your Registrations", badge: "Live Updates", badgeType: "orange", color: "#f97316", icon: Trophy },
        { id: 2, value: statsData.liveEvents, label: "Live Events", badge: statsData.liveEvents > 0 ? "● Running" : "None live", badgeType: "green", color: "#10b981", icon: Zap },
        { id: 3, value: statsData.openRegistrations, label: "Open Registrations", badge: "Join now", badgeType: "blue", color: "#3b82f6", icon: CalendarDays },
        { id: 4, value: statsData.upcomingTournaments, label: "Upcoming Tournaments", badge: "Register", badgeType: "purple", color: "#8b5cf6", icon: Trophy },
      ] as any);

      // Next match
      const upcoming = mappedMyEvents
        .filter(e => e.targetDate && e.targetDate.getTime() > new Date().getTime())
        .sort((a, b) => (a.targetDate?.getTime() ?? 0) - (b.targetDate?.getTime() ?? 0))[0];

      if (upcoming && upcoming.targetDate) {
        setNextMatch({
          title: upcoming.name,
          subtitle: upcoming.subtitle ? `${upcoming.subtitle} · ${upcoming.venue}` : `${upcoming.venue} · ${upcoming.category}`,
          targetDate: upcoming.targetDate
        });
      } else {
        setNextMatch(null);
      }

      // Database notifications
      setNotifications(notificationsData.map(n => ({
        id: n.id,
        icon: n.icon || "🔔",
        iconBg: n.priority === "HIGH" ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.15)",
        iconColor: n.priority === "HIGH" ? "#ef4444" : "#6366f1",
        text: n.title,
        bold: n.body || "",
        textAfter: "",
        time: n.createdAt ? format(new Date(n.createdAt), "MMM d, h:mm a") : "Recent"
      })));

    } catch {
      setError("Could not load live events.");
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  const fetchCaptainRegs = useCallback(async (eventId: number) => {
    setLoadingCaptains(true);
    try {
      const regs = await sportsService.getEventRegistrations(eventId);
      setCaptainRegs(regs.filter(r => r.status === "CONFIRMED"));
    } catch {
      toast.error("Failed to fetch registrations for captaincy");
    } finally {
      setLoadingCaptains(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCaptainEventId) {
      fetchCaptainRegs(selectedCaptainEventId);
    }
  }, [selectedCaptainEventId, fetchCaptainRegs]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleNominateSubmit = async () => {
    if ((isAdminNomination && !selectedRegForNomination) || (!isAdminNomination && !nominatingRegId)) {
      toast.error("Required data missing");
      return;
    }
    if (!nominateTeamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }

    setIsSubmittingNomination(true);
    try {
      const regId = isAdminNomination ? selectedRegForNomination : nominatingRegId;
      if (!regId) return;

      const eventId = isAdminNomination ? selectedCaptainEventId : myRegistrations.find(r => r.id === regId)?.event.id;
      if (!eventId) {
        toast.error("Event not found");
        return;
      }

      await auctionService.nominateCaptain(eventId, true, nominateTeamName);
      toast.success("Nominated successfully!");
      setIsNominateModalOpen(false);
      setNominateTeamName("");
      setNominatingRegId(null);
      setSelectedRegForNomination(null);
      setIsAdminNomination(false);
      fetchData();
    } catch {
      toast.error("Failed to nominate");
    } finally {
      setIsSubmittingNomination(false);
    }
  };


  const badgeMap = {
    orange: { bg: "rgba(249,115,22,0.15)", text: "#f97316" },
    green: { bg: "rgba(16,185,129,0.15)", text: "#10b981" },
    blue: { bg: "rgba(59,130,246,0.15)", text: "#3b82f6" },
    purple: { bg: "rgba(139,92,246,0.15)", text: "#8b5cf6" },
  };

  return (
    <div className="space-y-3.5">

      {error && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-red-200/80 dark:border-red-800/40 shadow-[0_15px_40px_rgba(220,38,38,0.15)] rounded-2xl p-4 flex items-center justify-between gap-3 text-left animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-50 dark:bg-red-950/40 text-red-500 rounded-xl flex-shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Live Tracker Alert</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setError(null)}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex-shrink-0"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}


      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className={`shimmer-bg-light border border-slate-200/60 rounded-xl p-3.5 ${idx >= 2 ? "hidden sm:block" : ""}`}>
              <div className="h-7 bg-slate-200/60 rounded w-1/3"></div>
              <div className="h-3.5 bg-slate-200/60 rounded w-2/3 mt-2"></div>
              <div className="h-3.5 bg-slate-200/60 rounded w-1/2 mt-2"></div>
            </div>
          ))
        ) : (
          stats.map((s, idx) => {
            const bc = badgeMap[s.badgeType as keyof typeof badgeMap] || { bg: "rgba(0,0,0,0.1)", text: "#94a3b8" };
            const isHiddenOnMobile = s.label === "Open Registrations" || s.label === "Upcoming Tournaments" || s.id === 3 || s.id === 4;
            return (
              <div key={s.id} className={`animate-fade-in-up stagger-${(idx % 8) + 1} ${isHiddenOnMobile ? "hidden sm:block" : ""}`}>
                <StatCard value={s.value} label={s.label} badge={s.badge} color={s.color} badgeBg={bc.bg} badgeText={bc.text} icon={s.icon} />
              </div>
            );
          })
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-3.5">
        <div className="lg:col-span-2 space-y-3">
          {/* Upcoming events */}
          <div className="rounded-xl p-3.5 sm:p-4 bg-white border border-[#6366f1]/12 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
            <div className="text-xs font-semibold uppercase tracking-widest mb-2.5" style={{ color: "#6b7094" }}>Your Upcoming Events</div>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 text-[#f97316] animate-spin" />
              </div>
            ) : liveEvents.length === 0 ? (
              <div className="text-center py-5">
                <div className="text-xs font-semibold" style={{ color: "#6b7094" }}>No upcoming events</div>
                {(openTournaments.length > 0 || openRegs.length > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("open-registrations-section");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="mt-2 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition-all cursor-pointer inline-flex items-center gap-1"
                  >
                    Browse Open Registrations <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : (
              liveEvents.map((ev, idx) => {
              const myReg = myRegistrations.find(r => r.event.id === ev.id);
              const isConfirmed = myReg?.status === "CONFIRMED";
              const isNominated = myReg?.captainNomination;
              const isTeamReg = myReg?.matchType === "TEAM";

              return (
                <div key={ev.id} className={`mb-3 animate-fade-in-up stagger-${(idx % 8) + 1}`}>
                  <EventRow event={ev} onClick={() => toast.info(`Selected: ${ev.name}`)} />
                  {isConfirmed && isTeamReg && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-b-lg border-x border-b -mt-2"
                      style={{
                        background: "rgba(99, 102, 241, 0.03)",
                        borderColor: "rgba(99, 102, 241, 0.08)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]" style={{ color: "#6b7094" }}>Captaincy Status:</span>
                        <span className={`text-[10px] font-semibold ${myReg?.captainConfirmation ? 'text-emerald-600' : isNominated ? 'text-[#f97316]' : 'text-slate-500'}`}>
                          {myReg?.captainConfirmation ? 'Confirmed Captain' : isNominated ? 'Nominated' : 'Not Nominated'}
                        </span>
                      </div>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (myReg?.captainConfirmation) return;
                          try {
                            const newVal = !isNominated;
                            await auctionService.nominateCaptain(ev.id, newVal);
                            toast.success(newVal ? "Self-nominated for captaincy!" : "Nomination withdrawn");
                            fetchData();
                          } catch {
                            toast.error("Failed to update nomination");
                          }
                        }}
                        disabled={myReg?.captainConfirmation}
                        className={`text-[10px] px-2 py-1 rounded border transition-colors ${myReg?.captainConfirmation
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default'
                          : isNominated
                            ? 'bg-orange-50 text-[#f97316] border-orange-200 hover:bg-orange-100 cursor-pointer'
                            : 'bg-slate-50 text-indigo-600 border-indigo-200 hover:bg-indigo-50 cursor-pointer'
                          }`}
                      >
                        {myReg?.captainConfirmation ? 'Confirmed' : isNominated ? 'Withdraw Nomination' : 'Nominate Me as Captain'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
            )}
          </div>
          {/* Open registrations — grouped by tournament */}
          <div id="open-registrations-section" className="rounded-xl p-3.5 sm:p-4 bg-white border border-[#6366f1]/12 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6b7094" }}>Open for Registration</div>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-green-500/10 text-[#10b981]">
                {openTournaments.length > 0
                  ? `${openTournaments.length} tournament${openTournaments.length !== 1 ? "s" : ""}`
                  : `${openRegs.length} event${openRegs.length !== 1 ? "s" : ""}`}
              </span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-5">
                <Loader2 className="w-5 h-5 text-[#f97316] animate-spin" />
              </div>
            ) : openTournaments.length === 0 && openRegs.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <div className="text-2xl mb-1.5">🏅</div>
                <p className="text-sm font-semibold text-slate-800">No events open for registration right now</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#6b7094" }}>Check back later or ask your admin to open registrations</p>
              </div>
            ) : openTournaments.length > 0 ? (
              openTournaments.map((t, tIdx) => {
                const isExpanded = expandedTournaments.has(t.id);
                const totalCount = t.mappedEvents.length;
                const deadlineDays = t.eventDateStart ? differenceInDays(new Date(t.eventDateStart), new Date()) : null;
                const sportCatMap = new Map<string, { emoji: string; registered: boolean }>();
                t.mappedEvents.forEach(ev => {
                  const sport = (ev.category?.split(" · ")[0]) || "Sport";
                  const emoji = ev.sportEmoji || getSportEmoji(sport);
                  if (!sportCatMap.has(sport)) sportCatMap.set(sport, { emoji, registered: false });
                  if (ev.action === "Confirmed" || ev.action === "Withdraw") {
                    sportCatMap.get(sport)!.registered = true;
                  }
                });
                const sportCats = Array.from(sportCatMap.entries());
                return (
                  <div key={t.id} className={`mb-2.5 last:mb-0 animate-fade-in-up stagger-${(tIdx % 8) + 1}`}>
                    {/* Tournament header */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedTournaments(prev => {
                        const next = new Set(prev);
                        if (next.has(t.id)) next.delete(t.id); else next.add(t.id);
                        return next;
                      })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setExpandedTournaments(prev => {
                            const next = new Set(prev);
                            if (next.has(t.id)) next.delete(t.id); else next.add(t.id);
                            return next;
                          });
                        }
                      }}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-lg border border-indigo-100 hover:border-indigo-200 transition-all cursor-pointer text-left group select-none relative overflow-hidden"
                      style={{
                        background: t.bannerImage
                          ? `linear-gradient(135deg, rgba(238,242,255,0.92), rgba(237,233,254,0.92)), url(${t.bannerImage}) center/cover`
                          : "linear-gradient(to right, #eef2ff, #ede9fe)",
                      }}
                    >
                      <div className="h-8 w-8 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Trophy className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-bold text-[#0d0d2b] truncate">{t.name}</div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="hidden sm:inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 uppercase tracking-wider">
                              Open
                            </span>
                            {totalCount > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/sports/register-tournament/${t.id}`);
                                }}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                                title="Register for multiple events in this tournament"
                              >
                                <span>Register All</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </button>
                            )}
                            {isExpanded
                              ? <ChevronDown className="w-3.5 h-3.5 text-[#6b7094] group-hover:text-indigo-600 transition-colors" />
                              : <ChevronRight className="w-3.5 h-3.5 text-[#6b7094] group-hover:text-indigo-600 transition-colors" />}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
                          <span className="text-[10px] text-[#6b7094] font-medium">
                            {t.eventDateStart && t.eventDateEnd
                              ? `${format(new Date(t.eventDateStart), "MMM d")} - ${format(new Date(t.eventDateEnd), "MMM d")}`
                              : "Dates TBD"}
                            {" · "}
                            {sportCats.length} sport{sportCats.length !== 1 ? "s" : ""}
                          </span>
                          {sportCats.map(([sport, { emoji, registered }]) => (
                            <span
                              key={sport}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border inline-flex items-center gap-0.5 ${
                                registered
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-slate-50 text-slate-400 border-slate-200"
                              }`}
                              title={`${sport}: ${registered ? "Registered" : "Not registered"}`}
                            >
                              {emoji} {registered ? "1" : "0"}
                            </span>
                          ))}
                          {deadlineDays !== null && deadlineDays >= 0 && deadlineDays <= 7 && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                              deadlineDays <= 2
                                ? "bg-red-50 text-red-600 border-red-200"
                                : "bg-amber-50 text-amber-600 border-amber-200"
                            }`}>
                              {deadlineDays === 0 ? "Starts today" : `${deadlineDays}d left`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Child events — grouped by sport, one row per sport */}
                    {isExpanded && (() => {
                      const sportGroupMap = new Map<string, { emoji: string; events: OpenRegistration[] }>();
                      t.mappedEvents.forEach(ev => {
                        const sport = (ev.category?.split(" · ")[0]) || "Sport";
                        if (!sportGroupMap.has(sport)) sportGroupMap.set(sport, { emoji: ev.sportEmoji || getSportEmoji(sport), events: [] });
                        sportGroupMap.get(sport)!.events.push(ev);
                      });
                      const sportEntries = Array.from(sportGroupMap.entries());
                      return (
                        <div className="mt-2 space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                          {sportEntries.map(([sport, { emoji, events }], sIdx) => {
                            const regCount = events.filter(e => e.action === "Confirmed" || e.action === "Withdraw").length;
                            const allRegistered = regCount === events.length;
                            const firstEvent = events[0];
                            const sportKey = `${t.id}-${sport}`;
                            const isSportExpanded = expandedSports.has(sportKey);
                            return (
                              <div
                                key={sport}
                                className={`rounded-lg border overflow-hidden transition-all animate-fade-in-up stagger-${(sIdx % 8) + 1} ${
                                  allRegistered
                                    ? "border-emerald-100 bg-emerald-50/30"
                                    : "border-slate-100 bg-white"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 px-3 py-2.5">
                                  <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setExpandedSports(prev => {
                                      const next = new Set(prev);
                                      if (next.has(sportKey)) next.delete(sportKey); else next.add(sportKey);
                                      return next;
                                    })}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setExpandedSports(prev => {
                                          const next = new Set(prev);
                                          if (next.has(sportKey)) next.delete(sportKey); else next.add(sportKey);
                                          return next;
                                        });
                                      }
                                    }}
                                    className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer select-none group"
                                  >
                                    <span className="text-xl shrink-0">{emoji}</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-bold text-slate-900">{sport}</span>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                          · {events.length} {events.length === 1 ? "category" : "categories"}
                                        </span>
                                      </div>
                                      {regCount > 0 && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 inline-flex mt-0.5">
                                          {regCount}/{events.length} registered
                                        </span>
                                      )}
                                    </div>
                                    {isSportExpanded
                                      ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                                      : <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />}
                                  </div>
                                  {allRegistered ? (
                                    <span className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0 flex items-center gap-1">
                                      ✓ Registered
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/sports/register/${firstEvent.uuid ?? firstEvent.id}`);
                                      }}
                                      className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm shadow-indigo-500/20 transition-all flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
                                    >
                                      Register
                                      <ArrowUpRight className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                                {isSportExpanded && (
                                  <div className="border-t border-slate-100 divide-y divide-slate-50 bg-slate-50/40">
                                    {events.map(item => {
                                      const isReg = item.action === "Confirmed" || item.action === "Withdraw";
                                      return (
                                        <div key={item.id} className="flex items-center gap-2.5 px-4 py-2 pl-11">
                                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isReg ? "bg-emerald-500" : "bg-slate-300"}`} />
                                          <div className="flex-1 min-w-0">
                                            <span className="text-[13px] font-semibold text-slate-800">{item.categoryName || item.name}</span>
                                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                              <span className="text-[10px] text-slate-400">{item.date}</span>
                                              {item.spots && <span className="text-[10px] text-indigo-500 font-medium">{item.spots}</span>}
                                            </div>
                                          </div>
                                          {isReg ? (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                                              {item.action === "Confirmed" ? "✓ Confirmed" : "Registered"}
                                            </span>
                                          ) : (
                                            <span className="text-[10px] font-medium text-slate-400 shrink-0">Not registered</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                );
              })
            ) : (
              <div className="max-h-[290px] overflow-y-auto pr-1">
                {openRegs.map((item, idx) => (
                  <div key={item.id} className={`animate-fade-in-up stagger-${(idx % 8) + 1}`}>
                    <RegCard
                       item={item}
                       onRegister={() => navigate(`/sports/register/${item.uuid ?? item.id}`)}
                       onView={() => navigate("/sports/auction")}
                       onWithdraw={async (regItem) => {
                         if (!regItem.registrationId) return;
                         if (!(await confirmAction("Withdraw Registration", `Are you sure you want to withdraw your registration for ${regItem.name}?`))) return;
                         try {
                           await sportsService.withdraw(regItem.registrationId);
                           toast.success(`Successfully withdrawn from ${regItem.name}`);
                           fetchData();
                         } catch (err: any) {
                           toast.error(err?.message || "Failed to withdraw registration");
                         }
                       }}
                       isAdmin={hasAnyPermission(CREATE_EDIT_SPORTS_MAIN, CREATE_EDIT_PLAYER_POOL)}
                       toggling={togglingId === item.id}
                       onToggleStatus={async (evt) => {
                         setTogglingId(evt.id);
                         try {
                           const newStatus = evt.status === "REGISTRATION_OPEN" ? "REGISTRATION_CLOSED" : "REGISTRATION_OPEN";
                           await sportsService.updateEventStatus(evt.id, newStatus);
                           toast.success(`Registration ${newStatus === "REGISTRATION_OPEN" ? "reopened" : "closed"} for ${evt.name}`);
                           fetchData();
                         } catch {
                           toast.error("Failed to update status");
                         } finally {
                           setTogglingId(null);
                         }
                       }}
                     />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Closed registrations */}
          {(canManageCaptainNominations || confirmedMyRegistrations.length > 0) && (closedTournaments.length > 0 || closedRegs.length > 0) && (
            <div className="rounded-xl p-3.5 sm:p-4 mt-3 bg-white border border-[#6366f1]/12 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6b7094" }}>Closed Registrations</div>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-red-500/10 text-red-500">
                  {closedTournaments.length > 0
                    ? `${closedTournaments.length} tournament${closedTournaments.length !== 1 ? "s" : ""}`
                    : `${closedRegs.length} event${closedRegs.length !== 1 ? "s" : ""}`}
                </span>
              </div>
              {closedTournaments.length > 0 ? (
                closedTournaments.map((t, tIdx) => {
                  const isExpanded = expandedClosedTournaments.has(t.id);
                  return (
                    <div key={t.id} className={`mb-2.5 last:mb-0 animate-fade-in-up stagger-${(tIdx % 8) + 1}`}>
                      <button
                        type="button"
                        onClick={() => setExpandedClosedTournaments(prev => {
                          const next = new Set(prev);
                          if (next.has(t.id)) next.delete(t.id); else next.add(t.id);
                          return next;
                        })}
                        className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-gradient-to-r from-slate-50 to-red-50/20 border border-slate-100 hover:border-slate-200 transition-all cursor-pointer text-left group"
                      >
                        <div className="h-8 w-8 rounded-md bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Trophy className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-[#0d0d2b] truncate">{t.name}</div>
                          <div className="text-[10px] text-[#6b7094] mt-0.5 font-medium">
                            {t.eventDateStart && t.eventDateEnd
                              ? `${format(new Date(t.eventDateStart), "MMM d")} - ${format(new Date(t.eventDateEnd), "MMM d")}`
                              : "Dates TBD"}
                            {" · "}
                            {t.mappedEvents.length} event{t.mappedEvents.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 uppercase tracking-wider">
                            Closed
                          </span>
                          {isExpanded
                            ? <ChevronDown className="w-3.5 h-3.5 text-[#6b7094] group-hover:text-indigo-600 transition-colors" />
                            : <ChevronRight className="w-3.5 h-3.5 text-[#6b7094] group-hover:text-indigo-600 transition-colors" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="mt-2 ml-3 pl-2.5 border-l-2 border-slate-200 space-y-0">
                          {t.mappedEvents.map((item, idx) => (
                            <div key={item.id} className={`animate-fade-in-up stagger-${(idx % 8) + 1}`}>
                              <RegCard
                                item={item}
                                onRegister={() => { }}
                                onView={() => navigate("/sports/auction")}
                                isAdmin={hasAnyPermission(CREATE_EDIT_SPORTS_MAIN, CREATE_EDIT_PLAYER_POOL)}
                                toggling={togglingId === item.id}
                                onToggleStatus={async (evt) => {
                                  setTogglingId(evt.id);
                                  try {
                                    const newStatus = evt.status === "REGISTRATION_OPEN" ? "REGISTRATION_CLOSED" : "REGISTRATION_OPEN";
                                    await sportsService.updateEventStatus(evt.id, newStatus);
                                    toast.success(`Registration ${newStatus === "REGISTRATION_OPEN" ? "reopened" : "closed"} for ${evt.name}`);
                                    fetchData();
                                  } catch {
                                    toast.error("Failed to update status");
                                  } finally {
                                    setTogglingId(null);
                                  }
                                }}
                                onStartAuction={async (evt) => {
                                  try {
                                    await auctionService.updateStatus(evt.id, "LIVE");
                                    navigate(`/sports/auction/${evt.id}`);
                                  } catch {
                                    navigate(`/sports/auction/${evt.id}`);
                                  }
                                }}
                                onScheduleMatches={(evt) => {
                                  navigate(`/sports/schedule/${evt.id}`);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                closedRegs.map((item, idx) => (
                  <div key={item.id} className={`animate-fade-in-up stagger-${(idx % 8) + 1}`}>
                    <RegCard
                      item={item}
                      onRegister={() => { }}
                      onView={() => navigate("/sports/auction")}
                      isAdmin={hasAnyPermission(CREATE_EDIT_SPORTS_MAIN, CREATE_EDIT_PLAYER_POOL)}
                      toggling={togglingId === item.id}
                      onToggleStatus={async (evt) => {
                        setTogglingId(evt.id);
                        try {
                           const newStatus = evt.status === "REGISTRATION_OPEN" ? "REGISTRATION_CLOSED" : "REGISTRATION_OPEN";
                           await sportsService.updateEventStatus(evt.id, newStatus);
                           toast.success(`Registration ${newStatus === "REGISTRATION_OPEN" ? "reopened" : "closed"} for ${evt.name}`);
                           fetchData();
                         } catch {
                           toast.error("Failed to update status");
                         } finally {
                           setTogglingId(null);
                         }
                      }}
                      onStartAuction={async (evt) => {
                        try {
                          await auctionService.updateStatus(evt.id, "LIVE");
                          navigate(`/sports/auction/${evt.id}`);
                        } catch {
                          navigate(`/sports/auction/${evt.id}`);
                        }
                      }}
                      onScheduleMatches={(evt) => {
                        navigate(`/sports/schedule/${evt.id}`);
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          )}

          {/* Unified Captain Nominations Section — team sports only */}
          {(canManageCaptainNominations ? teamClosedRegs.length > 0 : confirmedTeamRegistrations.length > 0) && (
            <div className="rounded-xl p-3.5 sm:p-4 mt-3 bg-white border border-[#6366f1]/12 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6b7094" }}>Captain Nominations</div>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-600">
                  {canManageCaptainNominations ? `${teamClosedRegs.length} Available` : "Registration Confirmed ✓"}
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Admin View: team events only */}
                {canManageCaptainNominations ? (
                  teamClosedRegs.map(item => (
                    <div key={item.id}>
                      <RegCard
                        item={{ ...item, action: "Register Captain" as any }}
                        onRegister={() => { }}
                        onView={async () => {
                          setSelectedCaptainEventId(item.id);
                          setIsAdminNomination(true);
                          setIsNominateModalOpen(true);
                          setLoadingCaptains(true);
                          try {
                            const regs = await sportsService.getEventRegistrations(item.id);
                            setCaptainRegs(regs.filter(r => r.status === "CONFIRMED"));
                          } catch { toast.error("Failed to load members"); }
                          setLoadingCaptains(false);
                        }}
                        isAdmin={false}
                      />
                    </div>
                  ))
                ) : (
                  /* User View: Self-nomination for confirmed team events only */
                  confirmedTeamRegistrations.map(reg => {
                    const capNom = captainRegistration.find(c => c.eventId === reg.event.id)
                    const isNominated = capNom?.captainNomination;
                    const isCaptainConfirmed = capNom?.captainConfirmation;

                    return (
                      <RegCard
                        key={reg.id}
                        item={{
                          id: reg.id,
                          name: reg.event.name,
                          date: `${new Date(reg.event.eventDateStart).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`,
                          category: `${reg.event.sport?.name ?? "Sport"} · ${reg.category?.name ?? "Open"}`,
                          spots: isCaptainConfirmed ? "Confirmed Captain 🏆" : (isNominated ? "Nomination Active" : "Available for Captaincy"),
                          progress: isCaptainConfirmed ? 100 : (isNominated ? 50 : 0),
                          progressColor: isCaptainConfirmed ? "#10b981" : "#f97316",
                          dotColor: isCaptainConfirmed ? "#10b981" : "#f97316",
                          action: (isCaptainConfirmed || isNominated ? "Withdraw" : "Nominate Me") as any,
                          status: reg.event.registrationStatus,
                        }}
                        onView={async () => {
                          if (isNominated) {
                            try {
                              await auctionService.nominateCaptain(reg.event.id, false);
                              toast.success("Nomination withdrawn");
                              fetchData();
                            } catch { toast.error("Failed to withdraw"); }
                          } else {
                            setNominatingRegId(reg.id);
                            setIsAdminNomination(false);
                            setNominateTeamName("");
                            setIsNominateModalOpen(true);
                          }
                        }}
                        onRegister={() => {}}
                      />
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-3">
          {/* Notifications */}
          <div className="rounded-xl p-3.5 sm:p-4 bg-white border border-[#6366f1]/12 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
            <div className="text-xs font-semibold uppercase tracking-widest mb-2.5 flex items-center gap-2" style={{ color: "#6b7094" }}>
              <Bell className="w-3 h-3" /> Notifications
            </div>
            <div className="space-y-0">
              {loading ? (
                <div className="flex items-center justify-center py-5">
                  <Loader2 className="w-5 h-5 text-[#f97316] animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <p className="text-[10px] text-center py-3" style={{ color: "#6b7094" }}>No new notifications</p>
              ) : (
                notifications.map((n, i) => (
                  <div key={n.id} className={`flex items-start gap-2.5 py-2 ${i < notifications.length - 1 ? "border-b border-slate-100" : ""} animate-fade-in-up stagger-${(i % 8) + 1}`}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0" style={{ background: n.iconBg, color: n.iconColor }}>
                      {n.icon}
                    </div>
                    <div>
                      <div className="text-xs leading-relaxed text-slate-800">
                        {n.text} <strong className="font-bold text-slate-800">{n.bold}</strong>{n.textAfter}
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: "#6b7094" }}>{n.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Timer */}
          <NextMatchTimer nextMatch={nextMatch} />

          {/* Season Stats */}
          <div className="rounded-xl p-3.5 sm:p-4 bg-white border border-[#6366f1]/12 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
            <div className="flex items-center gap-2 mb-2.5">
              <Trophy className="w-4 h-4 text-[#f97316]" />
              <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6b7094" }}>Season Stats</div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-[#f97316] animate-spin" />
              </div>
            ) : (
              <div className="space-y-1.5">
                {(() => {
                  const total = myRegistrations.length;
                  const confirmed = confirmedMyRegistrations.length;
                  const teamRegs = confirmedTeamRegistrations.length;
                  const seasonData: [string, string][] = [
                    ["Total Registrations", String(total)],
                    ["Confirmed", `${confirmed} / ${total}`],
                    ["Team Events", String(teamRegs)],
                    ["Upcoming", String(liveEvents.length)],
                  ];
                  return seasonData.map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center text-xs">
                      <span style={{ color: "#6b7094" }}>{k}</span>
                      <span className="font-semibold text-slate-800">{v}</span>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>
        {/* Captain Nomination Modal */}
        {isNominateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {isAdminNomination ? "Appoint Captain" : "Register as Captain"}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: "#6b7094" }}>
                    {isAdminNomination ? "Select a member and assign a team name" : "Propose a name for your future team"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsNominateModalOpen(false);
                    setIsAdminNomination(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <div className="w-5 h-5 flex items-center justify-center text-xl font-light">×</div>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7094" }}>
                    {isAdminNomination ? "Select Member" : "Logged In User"}
                  </label>
                  {isAdminNomination ? (
                    <select
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
                      value={selectedRegForNomination || ""}
                      onChange={(e) => setSelectedRegForNomination(Number(e.target.value))}
                    >
                      <option value="">Choose a member...</option>
                      {loadingCaptains ? (
                        <option disabled>Loading members...</option>
                      ) : captainRegs.map(reg => (
                        <option key={reg.id} value={reg.id}>
                          {reg.playerName || reg.user?.fullName} {reg.captainNomination ? " (Already Nominated)" : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-4 py-3 cursor-not-allowed">
                      {user?.fullName || user?.email || "Logged in user"}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#6b7094" }}>
                    {isAdminNomination ? "Assigned Team Name" : "Proposed Team Name"}
                  </label>
                  <input
                    type="text"
                    autoFocus={!isAdminNomination}
                    placeholder="e.g. Sector 12 Warriors"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all"
                    value={nominateTeamName}
                    onChange={(e) => setNominateTeamName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNominateSubmit()}
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => {
                      setIsNominateModalOpen(false);
                      setIsAdminNomination(false);
                    }}
                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-all border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNominateSubmit}
                    disabled={isSubmittingNomination || !nominateTeamName.trim() || (isAdminNomination && !selectedRegForNomination)}
                    className="flex-1 px-4 py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-xl text-sm font-medium shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmittingNomination ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      isAdminNomination ? "Confirm Appointment" : "Register Now"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
