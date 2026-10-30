import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router";
import { Loader2, AlertTriangle, Bell, Trophy, Users, Zap, CalendarDays, ArrowUpRight, ChevronDown, ChevronRight, X, User, Crown, HeartHandshake, Info, Clock, Sparkles, LayoutGrid, ListTree, CheckCircle2, Award, Trash2, MapPin, Medal, Swords } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import { sportsService } from "../../../services/sports/sportsService";
import { confirmAction } from "../../../utils/AlertUtils";
import { sportsDashboardService, type DashboardTournamentCard } from "../../../services/sports/sportsDashboardService";
import { auctionService } from "../../../services/sports/auctionService";
import { tournamentService, type ConfigInfo } from "../../../services/sports/tournamentService";
import { familyService, type FamilyMember } from "../../../services/common/familyService";
import { SportsRegister, findBestMatchingCategory, calculateAge, checkCategoryEligibility, getEventFormats, inferGender } from "./SportsRegister";
import { getStoredUser } from "../../../services/common/apiClient";
import { isTeamSport } from "./utils/sportsConstants";
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
import { TournamentDetailsModal } from "./TournamentDetailsModal";
import {
  TournamentSponsorBanner,
  TournamentSponsorShowcase,
  TournamentSponsorBadge,
  mapDbSponsorToTournamentSponsor,
  type TournamentSponsor,
} from "./sponsors";

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
  onClick?: () => void;
}

function StatCard({ value, label, badge, color, badgeBg, badgeText, icon: Icon, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl px-2.5 py-2 card-hover-lift flex items-center gap-2 bg-white border border-slate-200/90 shadow-2xs transition-all duration-200 hover:border-indigo-300 hover:shadow-xs ${
        onClick ? "cursor-pointer active:scale-[0.99]" : ""
      }`}
    >
      <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 shadow-2xs" style={{ background: badgeBg }}>
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-xs sm:text-sm font-bold leading-none shrink-0" style={{ color }}>
              {value}
            </span>
            <span className="text-[11px] text-slate-500 font-medium truncate" title={label}>
              {label}
            </span>
          </div>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none shrink-0"
            style={{ background: badgeBg, color: badgeText }}
          >
            {badge}
          </span>
        </div>
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
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[10px] font-bold tabular-nums shrink-0 ml-1 shadow-2xs">
      <span className="text-[10px] text-amber-600/70 mr-0.5">⏱</span>
      {timeLeft.d > 0 && <span>{timeLeft.d}d</span>}
      <span>{pad(timeLeft.h)}h</span>
      <span>:</span>
      <span>{pad(timeLeft.m)}m</span>
      <span>:</span>
      <span className="text-amber-600">{pad(timeLeft.s)}s</span>
    </span>
  );
}

/**
 * Robust helper to determine if a member, relation, ID, or name represents the logged-in user / Self / Head.
 */
export function isSelfRelationOrMember(
  rel?: string | null,
  id?: string | number | null,
  name?: string | null,
  currentUserName?: string | null
): boolean {
  if (id != null) {
    const idStr = String(id).toLowerCase().trim();
    if (idStr === "self" || idStr === "fam-self" || idStr === "member-self" || idStr === "head" || idStr === "primary") {
      return true;
    }
  }
  if (rel) {
    const r = String(rel).toUpperCase().trim();
    if (
      r === "SELF" ||
      r === "HEAD" ||
      r === "SELF (HEAD)" ||
      r.includes("SELF") ||
      r.includes("HEAD") ||
      r === "PRIMARY" ||
      r === "OWNER"
    ) {
      return true;
    }
  }
  if (name && currentUserName) {
    const n = name.toLowerCase().trim();
    const c = currentUserName.toLowerCase().trim();
    if (n && c && (n === c || n.includes(c) || c.includes(n))) {
      return true;
    }
  }
  return false;
}

/**
 * Helper to safely extract string from matchType / format across primitives, arrays, and objects
 */
export function extractFormatStr(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return val.trim().toUpperCase();
  if (Array.isArray(val)) {
    return val.map(v => (typeof v === "string" ? v : String(v || ""))).join(" ").trim().toUpperCase();
  }
  if (typeof val === "object") {
    return String(val.name || val.code || val.format || val.matchType || "").trim().toUpperCase();
  }
  return String(val).trim().toUpperCase();
}

/**
 * Format compatibility checker to ensure Singles registrations do not match Doubles events,
 * and vice-versa, especially for events sharing the same category name (e.g. "Men's Above 19").
 */
export function isFormatCompatible(r: any, ev: OpenRegistration): boolean {
  if (!r || !ev) return true;

  const isEvTeam = Boolean(ev.isTeamSport || isTeamSport(ev.category || ev.name || ""));
  const rawEvFormats = isEvTeam ? ["TEAM"] : (getEventFormats ? getEventFormats(ev as any) : []);
  const evFormats: string[] = (Array.isArray(rawEvFormats) ? rawEvFormats : [])
    .map(f => (typeof f === "string" ? f : String(f || "")).trim().toUpperCase())
    .filter(Boolean);

  // Determine registration matchType/format
  let rFmt = extractFormatStr(r.matchType) || extractFormatStr((r as any).format) || "";
  if (!rFmt && ((r as any).partnerUserId || (r as any).partnerFamilyMemberId)) {
    rFmt = "DOUBLES";
  }

  const norm = (s?: any) => {
    if (!s) return "";
    if (typeof s === "string") return s.trim().toLowerCase();
    if (Array.isArray(s)) return s.map(x => typeof x === "string" ? x : String(x || "")).join(" ").trim().toLowerCase();
    if (typeof s === "object") return String(s.name || s.title || "").trim().toLowerCase();
    return String(s).trim().toLowerCase();
  };

  const rName = norm(r.eventName || r.event?.name);
  const rCatName = norm(r.categoryName || r.category?.name);
  const evName = norm(ev.name);
  const evCatName = norm(ev.categoryName || (ev as any).rawEvent?.categoryName || (ev as any).category?.name);

  if (!rFmt) {
    const combinedR = `${rName} ${rCatName}`;
    if (combinedR.includes("mixed") || combinedR.includes("mixed doubles")) {
      rFmt = "MIXED_DOUBLES";
    } else if (combinedR.includes("doubles")) {
      rFmt = "DOUBLES";
    } else if (combinedR.includes("singles")) {
      rFmt = "SINGLES";
    }
  }

  // Check textual keywords in event / category name
  const evStrictlyDoubles = (evName.includes("doubles") || evCatName.includes("doubles")) && !evName.includes("singles") && !evCatName.includes("singles");
  const evStrictlySingles = (evName.includes("singles") || evCatName.includes("singles")) && !evName.includes("doubles") && !evCatName.includes("doubles");

  const rHasSingles = rFmt.includes("SINGLES");
  const rHasDoubles = rFmt.includes("DOUBLES") && !rFmt.includes("MIXED");
  const rHasMixed = rFmt.includes("MIXED");
  const rHasTeam = rFmt === "TEAM" || rFmt.includes("TEAM");

  // If r is strictly Singles (does NOT also support doubles/team):
  if (rHasSingles && !rHasDoubles && !rHasMixed && !rHasTeam) {
    if (isEvTeam) return false;
    if (evStrictlyDoubles) return false;
    if (evFormats.length > 0 && !evFormats.some(f => f.includes("SINGLES"))) {
      return false;
    }
  }

  // If r is strictly Doubles (excluding Mixed, and does NOT also support singles):
  if (rHasDoubles && !rHasSingles && !rHasMixed && !rHasTeam) {
    if (isEvTeam) return false;
    if (evStrictlySingles) return false;
    if (evFormats.length > 0 && !evFormats.some(f => f.includes("DOUBLES") && !f.includes("MIXED"))) {
      return false;
    }
  }

  // If r is strictly Mixed Doubles:
  if (rHasMixed && !rHasSingles && !rHasDoubles && !rHasTeam) {
    if (isEvTeam) return false;
    if (evStrictlySingles) return false;
    if (evFormats.length > 0 && !evFormats.some(f => f.includes("MIXED"))) {
      return false;
    }
  }

  // If r is strictly Team:
  if (rHasTeam && !rHasSingles && !rHasDoubles && !rHasMixed) {
    if (!isEvTeam && evFormats.length > 0 && !evFormats.includes("TEAM")) {
      return false;
    }
  }

  // Vice versa: if ev is strictly Singles or Doubles and r keywords conflict
  if (evStrictlyDoubles && (rName.includes("singles") || rCatName.includes("singles")) && !rName.includes("doubles") && !rCatName.includes("doubles")) {
    return false;
  }
  if (evStrictlySingles && (rName.includes("doubles") || rCatName.includes("doubles")) && !rName.includes("singles") && !rCatName.includes("singles")) {
    return false;
  }

  return true;
}

/**
 * Robust helper to match an event/category registration with a dashboard event card.
 * Handles numeric/string IDs, UUIDs, nested rawEvent, category ID, and normalized event/category names.
 * Strictly respects format compatibility so Singles registrations do not match Doubles event cards.
 */
export function isEventMatch(r: any, ev: OpenRegistration): boolean {
  if (!r || !ev) return false;

  // Format compatibility check: a Singles registration MUST NOT match a Doubles event, and vice-versa
  if (!isFormatCompatible(r, ev)) {
    return false;
  }

  const rEvId = r.eventId != null ? String(r.eventId).trim() : (r.event?.id != null ? String(r.event.id).trim() : null);
  const evId = ev.id != null ? String(ev.id).trim() : null;
  const evUuid = ev.uuid != null ? String(ev.uuid).trim() : null;
  const rEvUuid = (r as any).eventUuid != null
    ? String((r as any).eventUuid).trim()
    : ((r as any).uuid != null ? String((r as any).uuid).trim() : (r.event?.uuid != null ? String(r.event.uuid).trim() : null));

  // Match by numeric or string IDs
  if (rEvId && evId && rEvId === evId) return true;
  // Match by UUID
  if (rEvUuid && evUuid && rEvUuid === evUuid) return true;
  if (evUuid && rEvId && rEvId === evUuid) return true;
  if (evId && rEvUuid && evId === rEvUuid) return true;

  // Match by rawEvent or nested eventId
  const evRawId = (ev as any).rawEvent?.id != null ? String((ev as any).rawEvent.id).trim() : null;
  if (evRawId && rEvId && evRawId === rEvId) return true;

  const evEventId = (ev as any).eventId != null ? String((ev as any).eventId).trim() : null;
  if (evEventId && rEvId && evEventId === rEvId) return true;

  // Match category ID
  const rCatId = r.category?.id != null ? String(r.category.id).trim() : ((r as any).categoryId != null ? String((r as any).categoryId).trim() : null);
  if (rCatId && evId && rCatId === evId) return true;

  // If BOTH r and ev have explicit IDs, but they do NOT match:
  // prevent matching across different event IDs for generic categories (e.g. "Men's Above 19", "Under-16")
  const norm = (s?: string | null) => (s || "").trim().toLowerCase();
  const rCatName = norm(r.categoryName || r.category?.name);
  const evCatName = norm(ev.categoryName || (ev as any).rawEvent?.categoryName || (ev as any).category?.name);
  const rName = norm(r.eventName || r.event?.name);
  const evName = norm(ev.name);

  if (rEvId && evId && rEvId !== evId) {
    const isSpecificFormatCategory =
      rCatName.includes("doubles") ||
      rCatName.includes("singles") ||
      rCatName.includes("mixed") ||
      evCatName.includes("doubles") ||
      evCatName.includes("singles") ||
      evCatName.includes("mixed");

    if (!isSpecificFormatCategory) {
      return false;
    }
  }

  // 4. Exact Category Name + Event Name matching
  // BOTH category name AND event name MUST match. Never match by event name alone!
  if (rCatName && evCatName) {
    if (rCatName === evCatName && (!rName || !evName || rName === evName)) {
      return true;
    }
  } else if (!rCatName && !evCatName && rName && evName && rName === evName) {
    // Single standalone event with no sub-categories
    return true;
  }

  return false;
}

/**
 * Robust helper to check if a registration status is active (not cancelled, withdrawn, or rejected).
 */
export function isActiveRegistrationStatus(status?: string | null): boolean {
  if (!status) return false;
  const s = String(status).toUpperCase().trim();
  return s !== "CANCELLED" && s !== "WITHDRAWN" && s !== "REJECTED";
}

/**
 * Robust helper to determine if a registration belongs to a specific family member or the logged-in user (Self).
 */
export function isRegistrationForMemberHelper(
  reg: any,
  selectedMemberId: string | number | undefined,
  familyMembersOnly: Array<{ id: string | number; name?: string; relation?: string }> = [],
  currentUserName?: string | null
): boolean {
  if (!reg) return false;
  const isSelfTarget =
    !selectedMemberId ||
    selectedMemberId === "self" ||
    selectedMemberId === "SELF" ||
    selectedMemberId === "member-self" ||
    selectedMemberId === "fam-self";

  const regPlayerName = (reg.playerName || "").trim();
  const regRelation = (reg.relation || "").trim();
  const regFamilyMemberId = reg.familyMemberId;
  const targetFullName = (currentUserName || "").trim();

  const isExplicitFamily = Boolean(
    (regFamilyMemberId && !isSelfRelationOrMember(undefined, regFamilyMemberId)) ||
    (regRelation && !isSelfRelationOrMember(regRelation))
  );

  const matchesFamilyMemberName = Boolean(
    regPlayerName && familyMembersOnly.some(m => m.name && m.name.trim().toLowerCase() === regPlayerName.toLowerCase())
  );

  // A registration belongs to Self if it's explicitly Self, OR not an explicit family member and not matching any family member's name
  const isSelfReg =
    isSelfRelationOrMember(regRelation, regFamilyMemberId, regPlayerName, targetFullName) ||
    (!isExplicitFamily && !matchesFamilyMemberName);

  if (isSelfTarget) {
    return isSelfReg;
  }

  // When filtering by an actual family member, exclude Self registrations
  if (isSelfReg) {
    return false;
  }

  if (regFamilyMemberId && String(regFamilyMemberId) === String(selectedMemberId)) {
    return true;
  }

  const targetMember = familyMembersOnly.find(m => String(m.id) === String(selectedMemberId));
  if (targetMember) {
    const targetMemberName = (targetMember.name || "").trim().toLowerCase();
    const targetMemberRelation = String(targetMember.relation || (targetMember as any).relationship || "").trim().toUpperCase();
    if (targetMemberName && regPlayerName.toLowerCase() === targetMemberName) {
      return true;
    }
    if (targetMemberRelation && String(regRelation || "").trim().toUpperCase() === targetMemberRelation) {
      return true;
    }
  }

  return false;
}

// ─── Event Row ───────────────────────────────────────────────────────────────

interface EventRowProps {
  event: (typeof SPORTS_DATA.upcomingEvents)[number] & {
    targetDate?: Date;
    registrantBadge?: string;
    isScheduledMatch?: boolean;
    matchId?: number;
    tournamentName?: string;
    eventName?: string;
    roundName?: string;
    matchNumber?: number;
    teamAName?: string;
    teamBName?: string;
    userSideName?: string;
    opponentSideName?: string;
    venueName?: string;
    courtName?: string;
    scoreTeamA?: string;
    scoreTeamB?: string;
    matchData?: any;
    config?: any;
  };
  onClick: () => void;
  onShowInfo?: (event: any) => void;
}

function EventRow({ event, onClick, onShowInfo }: EventRowProps) {
  const dotClass = event.status === "LIVE" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse"
    : event.status === "COMPLETED" ? "bg-slate-400" : "bg-amber-500";

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between gap-2 sm:gap-3 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg cursor-pointer bg-white border border-slate-200/90 shadow-2xs transition-all duration-200 hover:border-indigo-300 hover:bg-slate-50/70 hover:shadow-xs relative"
    >
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
        <div className="min-w-0 text-left flex-1">
          <div className="text-xs font-bold text-slate-900 flex items-center flex-wrap gap-1.5">
            <span className="truncate">{event.name}</span>
            {event.targetDate && event.targetDate.getTime() > Date.now() && (
              <CompactMatchBadge targetDate={event.targetDate} />
            )}
            {event.registrantBadge &&
              !String(event.registrantBadge).toUpperCase().includes("SELF") &&
              !String(event.registrantBadge).toUpperCase().includes("HEAD") && (
              <span className="text-[10px] px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 font-semibold inline-flex items-center gap-1">
                {event.registrantBadge}
              </span>
            )}
            {event.isScheduledMatch && (
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 font-semibold inline-flex items-center gap-0.5">
                ⚔️ Fixture
              </span>
            )}
            {(event.subtitle || event.venue) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onShowInfo) {
                    onShowInfo(event);
                  } else {
                    onClick();
                  }
                }}
                className="p-1 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer flex items-center justify-center shrink-0"
                title={`${event.subtitle || ""}${event.venue ? ` · ${event.venue}` : ""}`}
                aria-label="Tournament and venue info"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-xs font-semibold" style={{ color: event.wonColor ?? event.timeColor }}>
          {event.statusText}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
          {event.statusSub}
        </div>
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
    <div className="flex items-start gap-2.5 p-2 sm:p-2.5 rounded-xl mb-1.5 bg-white border border-slate-200/90 shadow-2xs transition-all duration-200 hover:border-indigo-300 hover:shadow-xs">
      {item.sportEmoji ? (
        <span className="text-xs flex-shrink-0 mt-0.5">{item.sportEmoji}</span>
      ) : (
        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: item.dotColor }} />
      )}
      <div className="flex-1 min-w-0 text-left">
        <div className="text-xs font-bold text-slate-900 truncate">
          {item.name} <span className="text-slate-500 font-medium">— {item.date}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1 mt-0.5">
          <span className="text-[11px] text-slate-500 font-medium">{item.category}</span>
          {item.categoryName && (
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
              {item.categoryName}
            </span>
          )}
        </div>
        {item.spots && <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">{item.spots}</div>}
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0 items-end">
        <div className="flex gap-1 justify-end">
          {item.status === "REGISTRATION_CLOSED" && item.auctionStatus === "COMPLETED" && !isAdmin ? (
            <button
              disabled
              className="text-xs px-2 py-0.5 rounded-lg font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-75"
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
              className={`text-xs font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer ${
                item.action === "Register"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white active:scale-95"
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
              className="text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-all bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs hover:opacity-95"
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
                className={`text-xs py-1 rounded-lg font-bold border cursor-pointer transition-all bg-transparent disabled:opacity-50 ${item.status === "REGISTRATION_OPEN"
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
                    className="text-xs py-1 rounded-lg font-bold border transition-all bg-emerald-50 border-emerald-200 text-emerald-600 cursor-default"
                  >
                    Auction Completed
                  </button>
                ) : (
                  <button
                    onClick={() => onStartAuction?.(item)}
                    className="text-xs py-1 rounded-lg font-bold border cursor-pointer transition-all bg-transparent border-indigo-500/30 text-indigo-600 hover:bg-indigo-50"
                  >
                    {item.auctionStatus === "LIVE" ? "Resume Auction" : "Start Auction"}
                  </button>
                )}
                <button
                  onClick={() => onScheduleMatches?.(item)}
                  className="text-xs py-1 rounded-lg font-bold border cursor-pointer transition-all bg-transparent border-violet-500/30 text-violet-600 hover:bg-violet-50"
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
    <div className="rounded-xl p-2 sm:p-2.5 bg-white border border-slate-200/90 shadow-2xs">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-orange-500" />
          <span>Next Match Timer</span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-200/60">
          Upcoming
        </span>
      </div>
      <div className="text-center">
        <div className="text-xs mb-1.5 font-bold text-slate-800 truncate px-1" title={nextMatch.title}>
          {nextMatch.title}
        </div>
        <div className="flex justify-center items-center gap-1 sm:gap-1.5">
          {timeUnits.map(({ v, l }, i) => (
            <div key={l} className="flex items-center gap-1 sm:gap-1.5">
              <div className="text-center">
                <div
                  className="text-xs sm:text-sm font-bold bg-gradient-to-b from-orange-50/60 to-slate-50 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md min-w-[28px] sm:min-w-[32px] tabular-nums leading-none flex items-center justify-center shadow-2xs"
                  style={{ color: accent, border: `1px solid ${accent}30` }}
                >
                  {v < 10 ? `0${v}` : v}
                </div>
                <div className="text-[9px] mt-0.5 font-bold tracking-wider text-slate-400">
                  {l}
                </div>
              </div>
              {i < timeUnits.length - 1 && (
                <div className="text-xs text-slate-300 font-bold mb-2.5 select-none">:</div>
              )}
            </div>
          ))}
        </div>
        {nextMatch.subtitle && (
          <div className="text-[10px] mt-1.5 font-medium truncate px-1.5 py-0.5 text-slate-500 bg-slate-50 rounded border border-slate-100/80 inline-block max-w-full" title={nextMatch.subtitle}>
            {nextMatch.subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

type DashboardTournamentWithEvents = Omit<DashboardTournamentCard, "sponsors"> & {
  mappedEvents: OpenRegistration[];
  sponsors?: TournamentSponsor[];
};

export function SportsDashboard() {
  const { user, hasPermission, hasAnyPermission, isSuperAdmin, isAdmin, isSportsAdmin } = useAuth();
  const canAccessAdminSports = isAdmin || isSuperAdmin || isSportsAdmin;
  const navigate = useNavigate();
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [openRegs, setOpenRegs] = useState<OpenRegistration[]>([]);
  const [openTournaments, setOpenTournaments] = useState<DashboardTournamentWithEvents[]>([]);
  const [expandedTournaments, setExpandedTournaments] = useState<Set<number>>(new Set());
  const [expandedSports, setExpandedSports] = useState<Set<string>>(new Set());
  const [closedRegs, setClosedRegs] = useState<OpenRegistration[]>([]);
  const [closedTournaments, setClosedTournaments] = useState<DashboardTournamentWithEvents[]>([]);
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

  // Family members for tournament registration selector
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMemberByTournament, setSelectedMemberByTournament] = useState<Record<string | number, string>>({});
  // Upcoming Events Family Member Filter ("ALL" | "SELF" | memberId)
  const [upcomingFamilyFilter, setUpcomingFamilyFilter] = useState<string>("ALL");
  // Stats Card Modal State ("registrations" | "live_events" | null)
  const [activeStatsModal, setActiveStatsModal] = useState<"registrations" | "live_events" | null>(null);
  // Match & Event Fixture Details Modal State
  const [activeInfoEvent, setActiveInfoEvent] = useState<any | null>(null);
  // Tournament Sponsors State (dynamic from database)
  const [sponsors, setSponsors] = useState<TournamentSponsor[]>([]);
  const [featuredTournamentName, setFeaturedTournamentName] = useState<string>("");
  const [tournamentViewMode, setTournamentViewMode] = useState<Record<number, "groups" | "grid">>({});
  const [tournamentEligibleOnly, setTournamentEligibleOnly] = useState<Record<number, boolean>>({});
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsModalTournament, setDetailsModalTournament] = useState<any>(null);
  const [showOpenRegInfo, setShowOpenRegInfo] = useState(false);
  const [withdrawnRegistrationIds, setWithdrawnRegistrationIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadFamily = async () => {
      try {
        const list = await familyService.getFamilyMembers();
        setFamilyMembers(list);
      } catch (err) {
        console.warn("Could not load family members in SportsDashboard:", err);
      }
    };
    loadFamily();
    window.addEventListener("mana_family_updated", loadFamily);
    return () => window.removeEventListener("mana_family_updated", loadFamily);
  }, []);

  const familyMembersOnly = useMemo(() => {
    const currentName = user?.fullName?.trim().toLowerCase();
    return familyMembers.filter((m) => {
      const rel = m.relation || (m as any).relationship || "";
      const isSelf = isSelfRelationOrMember(rel, m.id, m.name, currentName);
      return !isSelf;
    });
  }, [familyMembers, user?.fullName]);

  const isRegistrationForMember = useCallback((
    reg: any,
    selectedMemberId: string | number | undefined,
  ) => {
    return isRegistrationForMemberHelper(reg, selectedMemberId, familyMembersOnly, user?.fullName);
  }, [familyMembersOnly, user?.fullName]);

  const filteredLiveEvents = useMemo(() => {
    if (upcomingFamilyFilter === "ALL") return liveEvents;

    return liveEvents.filter(ev => {
      // Direct check on event's registrant details
      return isRegistrationForMember(
        {
          familyMemberId: ev.familyMemberId,
          playerName: ev.playerName,
          relation: ev.relation,
        },
        upcomingFamilyFilter
      );
    });
  }, [liveEvents, upcomingFamilyFilter, isRegistrationForMember]);

  const selectedMemberDisplayName = useMemo(() => {
    if (upcomingFamilyFilter === "ALL") return "";
    if (upcomingFamilyFilter === "SELF") return user?.fullName || "Self";
    const found = familyMembers.find(m => String(m.id) === upcomingFamilyFilter);
    return found ? `${found.name} (${found.relation || "Family"})` : "Selected Member";
  }, [upcomingFamilyFilter, familyMembers, user?.fullName]);

  const getMemberProfileStatus = useCallback((memberId: string | number | undefined) => {
    const isSelf = isSelfRelationOrMember(undefined, memberId);
    if (isSelf) {
      const stored = getStoredUser();
      const rawDob = user?.dateOfBirth || (user as any)?.dob || stored?.dateOfBirth || (stored as any)?.dob;
      const parsedAge = calculateAge(rawDob);
      const hasDob = Boolean(rawDob || (user as any)?.age > 0 || (stored as any)?.age > 0 || (parsedAge !== null && parsedAge > 0));
      const hasGender = Boolean((user?.gender && String(user.gender).trim()) || (stored?.gender && String(stored.gender).trim()));
      const missingFields: string[] = [];
      if (!hasDob) missingFields.push("Date of Birth / Age");
      if (!hasGender) missingFields.push("Gender");
      return {
        isValid: hasDob && hasGender,
        hasDob,
        hasGender,
        memberName: user?.fullName || stored?.fullName || "Self",
        isSelf: true,
        missingFields,
      };
    }

    const member = familyMembers.find(m => String(m.id) === String(memberId));
    if (!member) {
      return {
        isValid: true,
        hasDob: true,
        hasGender: true,
        memberName: "Family Member",
        isSelf: false,
        missingFields: [],
      };
    }

    const rawDob = member.dob || (member as any)?.dateOfBirth;
    const parsedAge = calculateAge(rawDob);
    const hasDob = Boolean(rawDob || (member.age && Number(member.age) > 0) || (parsedAge !== null && parsedAge > 0));
    const memberGen = inferGender(member, user?.gender);
    const hasGender = Boolean((member.gender && String(member.gender).trim()) || memberGen);
    const missingFields: string[] = [];
    if (!hasDob) missingFields.push("Date of Birth / Age");
    if (!hasGender) missingFields.push("Gender");

    return {
      isValid: hasDob && hasGender,
      hasDob,
      hasGender,
      memberName: member.name || "Family Member",
      isSelf: false,
      missingFields,
    };
  }, [familyMembers, user]);

  const upcomingMemberProfileStatus = useMemo(() => {
    if (upcomingFamilyFilter === "ALL") return null;
    return getMemberProfileStatus(upcomingFamilyFilter);
  }, [upcomingFamilyFilter, getMemberProfileStatus]);

  const upcomingTargetMember = useMemo(() => {
    if (upcomingFamilyFilter === "ALL") return null;
    const isSelf = upcomingFamilyFilter === "SELF" || upcomingFamilyFilter === "self";
    if (isSelf) {
      const computedAge = calculateAge(user?.dateOfBirth || (user as any)?.dob);
      return {
        age: (computedAge !== null && computedAge > 0 ? computedAge : Number((user as any)?.age)) || 0,
        gender: user?.gender || "Male",
      };
    }
    const fm = familyMembers.find(m => String(m.id) === String(upcomingFamilyFilter));
    const computedAge = calculateAge(fm?.dob || (fm as any)?.dateOfBirth);
    const inferredGen = inferGender(fm, user?.gender);
    return {
      age: (computedAge !== null && computedAge > 0 ? computedAge : Number(fm?.age)) || 0,
      gender: inferredGen || fm?.gender || "",
    };
  }, [upcomingFamilyFilter, user, familyMembers]);

  const notifyIncompleteProfile = useCallback((memberId: string | number | undefined) => {
    const status = getMemberProfileStatus(memberId);
    if (!status.isValid) {
      const missingText = status.missingFields.join(" and ");
      toast.warning(
        `Profile Incomplete for ${status.memberName}: Missing ${missingText}. Please update profile to register.`,
        {
          duration: 6000,
          action: {
            label: "Update Profile",
            onClick: () => {
              navigate(status.isSelf ? "/profile" : "/profile?tab=family");
            },
          },
        }
      );
    }
  }, [getMemberProfileStatus, navigate]);

  const handleTournamentMemberChange = useCallback((tournament: DashboardTournamentWithEvents, memberId: string | number) => {
    const val = String(memberId);
    setSelectedMemberByTournament(prev => ({
      ...prev,
      [tournament.id]: val,
      [String(tournament.id)]: val,
    }));

    const status = getMemberProfileStatus(val);
    if (!status.isValid) {
      notifyIncompleteProfile(val);
      return;
    }

    const isSelfMember = !val || val === "self" || isSelfRelationOrMember(undefined, val);
    const stored = getStoredUser();
    const member = isSelfMember
      ? {
          name: user?.fullName || stored?.fullName || "Self",
          age: calculateAge(user?.dateOfBirth || (user as any)?.dob || stored?.dateOfBirth || (stored as any)?.dob) || (user as any)?.age || (stored as any)?.age || 0,
          gender: user?.gender || stored?.gender || "",
        }
      : (() => {
          const fm = familyMembers.find(m => String(m.id) === String(val));
          const computedAge = calculateAge(fm?.dob || (fm as any)?.dateOfBirth);
          const inferredGen = inferGender(fm, user?.gender || stored?.gender);
          return {
            name: fm?.name || "Family Member",
            age: (computedAge !== null && computedAge > 0 ? computedAge : Number(fm?.age)) || 0,
            gender: fm?.gender || inferredGen || "",
          };
        })();

    const eligibleCount = tournament.mappedEvents.filter(ev => {
      const elig = checkCategoryEligibility(ev, member.age, member.gender);
      return elig.eligible;
    }).length;

    const genderLabel = member.gender
      ? member.gender.toLowerCase().startsWith("m")
        ? "Male"
        : "Female"
      : "unspecified gender";
    const ageLabel = member.age > 0 ? `${member.age}y` : "unspecified age";

    if (eligibleCount === 0) {
      toast.warning(
        `${member.name} (${genderLabel}, ${ageLabel}) is not eligible for categories in this tournament based on age/gender.`,
        { duration: 5000 }
      );
    } else {
      toast.success(
        `Selected ${member.name} (${genderLabel}, ${ageLabel}) · ${eligibleCount} eligible ${eligibleCount === 1 ? "category" : "categories"}`,
        { duration: 3000 }
      );
    }
  }, [getMemberProfileStatus, notifyIncompleteProfile, user, familyMembers]);

  // Registration Modal State for mobile view / quick registration popup
  const [regModalState, setRegModalState] = useState<{
    open: boolean;
    eventUuid?: string;
    forType: "self" | "family";
    memberId?: string | number;
  }>({
    open: false,
    forType: "self",
  });

  const handleOpenRegistration = (eventUuidOrId: string | number, forType: "self" | "family" = "self", memberId?: string | number) => {
    const targetId = forType === "self" ? "self" : memberId;
    const status = getMemberProfileStatus(targetId);
    if (!status.isValid) {
      notifyIncompleteProfile(targetId);
      return;
    }
    setRegModalState({
      open: true,
      eventUuid: String(eventUuidOrId),
      forType,
      memberId,
    });
  };

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
      const [statsData, upcomingData, openTournamentsData, closedTournamentsData, myRegsData, notificationsData, communityTournamentsData, configsData] = await Promise.all([
        sportsDashboardService.getStats(),
        sportsDashboardService.getUpcomingEvents(),
        sportsDashboardService.getOpenTournaments(),
        sportsDashboardService.getClosedTournaments(),
        sportsDashboardService.getMyRegistrations(),
        sportsDashboardService.getNotifications(),
        sportsService.getCommunityTournaments(user?.communityId).catch(() => [] as any[]),
        tournamentService.getConfigs().catch(() => [] as ConfigInfo[])
      ]);

      const fmtRange = (start: string | null, end: string | null) =>
        start && end ? `${format(new Date(start), "MMM d")} - ${format(new Date(end), "MMM d")}` : "TBD";

      // Build tournament sponsors lookup from database response
      const tournamentSponsorsMap = new Map<number, TournamentSponsor[]>();
      if (communityTournamentsData && Array.isArray(communityTournamentsData)) {
        communityTournamentsData.forEach((t: any) => {
          if (t?.id && Array.isArray(t?.sponsors) && t.sponsors.length > 0) {
            const mapped = t.sponsors.map((s: any) => mapDbSponsorToTournamentSponsor(s, t.id));
            tournamentSponsorsMap.set(t.id, mapped);
          }
        });
      }

      const getSponsorsForTournament = (t: DashboardTournamentCard): TournamentSponsor[] => {
        if (tournamentSponsorsMap.has(t.id)) {
          return tournamentSponsorsMap.get(t.id)!;
        }
        if (t.sponsors && t.sponsors.length > 0) {
          return t.sponsors.map(s => mapDbSponsorToTournamentSponsor(s, t.id));
        }
        return [];
      };

      // Map my registrations
      const fetchedMyRegs = myRegsData.map(r => ({
        ...r,
        id: r.id,
        eventId: r.eventId,
        event: {
          id: r.eventId,
          name: r.eventName,
          eventDateStart: r.eventDateStart,
          sport: { name: r.sportName },
          registrationStatus: r.eventRegistrationStatus,
          ...(r as any).event,
        },
        category: { name: r.categoryName, ...(r as any).category },
        status: r.status,
        matchType: r.matchType,
        captainNomination: r.captainNomination,
        captainConfirmation: r.captainConfirmation,
        playerName: r.playerName || (r as any).user?.fullName,
        relation: r.relation,
        familyMemberId: r.familyMemberId,
      }));
      setMyRegistrations(fetchedMyRegs);

      // Helper event mapping function
      const mapEventCard = (e: any): OpenRegistration => {
        // ONLY match active registrations from fetchedMyRegs
        const matchingReg = fetchedMyRegs.find(r =>
          isEventMatch(r, e) &&
          isActiveRegistrationStatus(r.status) &&
          !withdrawnRegistrationIds.has(Number(r.id))
        );

        // Check if there is an explicit inactive (withdrawn/cancelled) record in fetchedMyRegs
        const isWithdrawnInMyRegs = fetchedMyRegs.some(r =>
          (r.id === e.myRegistrationId || isEventMatch(r, e)) &&
          !isActiveRegistrationStatus(r.status)
        );

        // Check if backend e.myRegistrationStatus itself says WITHDRAWN, CANCELLED, or REJECTED:
        const backendStatus = String(e.myRegistrationStatus || "").toUpperCase().trim();
        const isBackendInactive = backendStatus === "CANCELLED" || backendStatus === "WITHDRAWN" || backendStatus === "REJECTED";

        // Check if locally marked withdrawn in this session:
        const isLocallyWithdrawn = Boolean(
          (e.myRegistrationId && withdrawnRegistrationIds.has(Number(e.myRegistrationId))) ||
          (matchingReg?.id && withdrawnRegistrationIds.has(Number(matchingReg.id)))
        );

        const hasActiveBackendReg = Boolean(e.myRegistrationId && !isBackendInactive && !isWithdrawnInMyRegs && !isLocallyWithdrawn);

        const rawRegId = hasActiveBackendReg ? e.myRegistrationId : (matchingReg && !isLocallyWithdrawn ? matchingReg.id : undefined);
        const rawRegStatus = hasActiveBackendReg ? (e.myRegistrationStatus || "CONFIRMED") : (matchingReg?.status ?? undefined);

        const activeRegId = (rawRegId && isActiveRegistrationStatus(rawRegStatus) && !isLocallyWithdrawn) ? rawRegId : undefined;
        let actionVal = "Register";
        if (activeRegId) {
          actionVal = rawRegStatus === "CONFIRMED" ? "Confirmed" : "Withdraw";
        }
        const regCount = (e as any).registeredCount ?? (e as any).registrationCount ?? (e as any).registeredParticipants ?? 0;
        return {
          id: e.id,
          uuid: e.uuid ?? undefined,
          name: e.name,
          date: fmtRange(e.eventDateStart, e.eventDateEnd),
          category: [e.sportName, e.venueName].filter(Boolean).join(" · ") || (e.sportName ?? "Sport"),
          spots: e.maxParticipants ? `${regCount}/${e.maxParticipants} spots` : "Unlimited spots",
          progress: activeRegId ? (rawRegStatus === "CONFIRMED" ? 100 : 50) : 0,
          progressColor: activeRegId ? (rawRegStatus === "CONFIRMED" ? "#10b981" : "#f97316") : "#e2e8f0",
          dotColor: "#10b981",
          action: actionVal,
          status: e.registrationStatus ?? "REGISTRATION_OPEN",
          registrationId: activeRegId,
          isTeamSport: Boolean(e.teamSport || isTeamSport(e.sportName || e.name || "") || (e as any).matchType === "TEAM" || (e as any).eventType === "TEAM"),
          sportEmoji: getSportEmoji(e.sportName),
          categoryName: e.categoryName ?? (e as any).category?.name ?? (e as any).playerCategory?.name ?? (e as any).categories?.[0]?.name ?? undefined,
          gender: e.gender ?? (e as any).genderCategory ?? (e as any).category?.gender ?? (e as any).playerCategory?.gender ?? (e as any).categories?.[0]?.gender ?? undefined,
          minAge: (() => {
            const raw = e.minAge ?? (e as any).category?.minAge ?? (e as any).playerCategory?.minAge ?? (e as any).categories?.[0]?.minAge;
            return raw != null && !isNaN(Number(raw)) ? Number(raw) : undefined;
          })(),
          maxAge: (() => {
            const raw = e.maxAge ?? (e as any).category?.maxAge ?? (e as any).playerCategory?.maxAge ?? (e as any).categories?.[0]?.maxAge;
            return raw != null && !isNaN(Number(raw)) ? Number(raw) : undefined;
          })(),
          categories: e.categories ?? undefined,
          allowedGenders: e.allowedGenders ?? undefined,
          formats: e.formats ?? (e.format ? (Array.isArray(e.format) ? e.format : [e.format]) : undefined),
          format: e.format ?? e.formats,
          rawEvent: e,
        };
      };

      // Grouped open tournaments with real database sponsors
      if (openTournamentsData?.length) {
        setOpenTournaments(openTournamentsData.map(t => {
          const commTourney = (communityTournamentsData as any[])?.find(ct => ct?.id === t.id);
          return {
            ...t,
            description: commTourney?.description ?? (t as any).description,
            contactName: commTourney?.contactName ?? (t as any).contactName,
            contactNumber: commTourney?.contactNumber ?? (t as any).contactNumber,
            contactEmail: commTourney?.contactEmail ?? (t as any).contactEmail,
            contactTitle: commTourney?.contactTitle ?? (t as any).contactTitle,
            contacts: commTourney?.contacts ?? (t as any).contacts,
            otherContacts: commTourney?.otherContacts ?? (t as any).otherContacts,
            tournamentType: commTourney?.tournamentType ?? (t as any).tournamentType,
            format: commTourney?.format ?? (t as any).format,
            mappedEvents: t.events.map(mapEventCard),
            sponsors: getSponsorsForTournament(t),
          };
        }));
        setExpandedTournaments(new Set(openTournamentsData.map(t => t.id)));
      } else {
        setOpenTournaments([]);
      }

      // Determine active tournament sponsors for the Hero banner & showcase
      let activeSponsors: TournamentSponsor[] = [];
      let activeTourneyName = "";

      for (const t of openTournamentsData) {
        const tSponsors = getSponsorsForTournament(t);
        if (tSponsors.length > 0) {
          activeSponsors = tSponsors;
          activeTourneyName = t.name;
          break;
        }
      }

      if (activeSponsors.length === 0 && communityTournamentsData?.length) {
        const tWithSponsors = (communityTournamentsData as any[]).find(t => t?.sponsors && t.sponsors.length > 0);
        if (tWithSponsors && tWithSponsors.sponsors) {
          activeSponsors = tWithSponsors.sponsors.map((s: any) => mapDbSponsorToTournamentSponsor(s, tWithSponsors.id));
          activeTourneyName = tWithSponsors.name || "";
        }
      }

      setSponsors(activeSponsors);
      setFeaturedTournamentName(activeTourneyName);

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
          categoryName: e.categoryName ?? (e as any).category?.name ?? (e as any).playerCategory?.name ?? (e as any).categories?.[0]?.name ?? undefined,
          status: e.registrationStatus ?? "REGISTRATION_CLOSED",
          auctionStatus: e.auctionStatus ?? "DRAFT",
          isTeamSport: Boolean(e.teamSport || isTeamSport(e.sportName || e.name || "") || (e as any).matchType === "TEAM" || (e as any).eventType === "TEAM"),
          formats: e.formats ?? (e.format ? (Array.isArray(e.format) ? e.format : [e.format]) : undefined),
          format: e.format ?? e.formats,
          rawEvent: e,
        };
      };

      // Grouped closed tournaments with real database sponsors and metadata
      if (closedTournamentsData?.length) {
        setClosedTournaments(closedTournamentsData.map(t => {
          const commTourney = (communityTournamentsData as any[])?.find(ct => ct?.id === t.id);
          return {
            ...t,
            description: commTourney?.description ?? (t as any).description,
            contactName: commTourney?.contactName ?? (t as any).contactName,
            contactNumber: commTourney?.contactNumber ?? (t as any).contactNumber,
            contactEmail: commTourney?.contactEmail ?? (t as any).contactEmail,
            contactTitle: commTourney?.contactTitle ?? (t as any).contactTitle,
            contacts: commTourney?.contacts ?? (t as any).contacts,
            otherContacts: commTourney?.otherContacts ?? (t as any).otherContacts,
            tournamentType: commTourney?.tournamentType ?? (t as any).tournamentType,
            format: commTourney?.format ?? (t as any).format,
            mappedEvents: t.events.map(mapClosedEventCard),
            sponsors: getSponsorsForTournament(t),
          };
        }));
        setExpandedClosedTournaments(new Set(closedTournamentsData.map(t => t.id)));
      } else {
        setClosedTournaments([]);
      }

      // Re-populate closedRegs flat array just in case there are single fallback items
      setClosedRegs(closedTournamentsData.flatMap(t => t.events).map(mapClosedEventCard));

      // Captain registrations (auction domain — separate concern, kept as-is)
      let captainRegs: any[] = [];
      try {
        captainRegs = await auctionService.getCaptainRegistration();
        setCaptainRegistration(captainRegs);
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

        const matchingReg = fetchedMyRegs.find(r =>
          isActiveRegistrationStatus(r.status) &&
          !withdrawnRegistrationIds.has(Number(r.id)) &&
          r.eventId === e.id &&
          (e.familyMemberId == null || String(r.familyMemberId) === String(e.familyMemberId))
        ) || fetchedMyRegs.find(r =>
          isActiveRegistrationStatus(r.status) &&
          !withdrawnRegistrationIds.has(Number(r.id)) &&
          r.eventId === e.id
        );
        const regPlayerName = e.playerName || matchingReg?.playerName;
        const regRelation = e.relation || matchingReg?.relation;
        const regFamId = e.familyMemberId != null ? e.familyMemberId : matchingReg?.familyMemberId;

        let registrantBadge: string | undefined;
        const isSelfEvent = isSelfRelationOrMember(regRelation, regFamId, regPlayerName, user?.fullName);
        if (!isSelfEvent && regPlayerName) {
          if (regRelation && !isSelfRelationOrMember(regRelation)) {
            registrantBadge = `👥 ${regPlayerName} (${regRelation})`;
          } else {
            registrantBadge = `👤 ${regPlayerName}`;
          }
        }

        return {
          id: e.id,
          name: e.name,
          subtitle: e.tournamentName ? `${e.tournamentName} · ${e.sportName ?? ""}` : (e.sportName ?? ""),
          venue: e.venueName ?? "TBD",
          category: e.categoryName ?? "General",
          registrantBadge,
          playerName: regPlayerName,
          relation: regRelation,
          familyMemberId: regFamId,
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
          isScheduledMatch: false,
        };
      });

      // Fetch scheduled matches for tournament configurations
      const activeFamilyMembers = familyMembers.length > 0 ? familyMembers : await familyService.getFamilyMembers().catch(() => [] as FamilyMember[]);
      if (familyMembers.length === 0 && activeFamilyMembers.length > 0) {
        setFamilyMembers(activeFamilyMembers);
      }

      const scheduledMatchesRaw: { config: ConfigInfo; match: any }[] = [];
      if (configsData && configsData.length > 0) {
        const matchResults = await Promise.allSettled(
          configsData.map(cfg =>
            tournamentService.getMatchesByConfigId(cfg.id).then(matches => ({ cfg, matches }))
          )
        );
        matchResults.forEach(res => {
          if (res.status === "fulfilled" && Array.isArray(res.value?.matches)) {
            res.value.matches.forEach((m: any) => {
              if (m && m.status !== "BYE") {
                scheduledMatchesRaw.push({ config: res.value.cfg, match: m });
              }
            });
          }
        });
      }

      // Map scheduled matches belonging to the logged-in user or family members
      const norm = (str?: string | null) => (str || "").trim().toLowerCase();
      const currentUserName = norm(user?.fullName);
      const currentUserIdStr = user?.userId ? String(user.userId) : null;

      const userScheduledMatches: any[] = [];
      const matchedConfigEventIds = new Set<number>();

      for (const { config, match: m } of scheduledMatchesRaw) {
        const rawTeamA = m.teamAName || m.homeName || m.teamA?.name || "";
        const rawTeamB = m.teamBName || m.awayName || m.teamB?.name || "";
        const teamA = norm(rawTeamA);
        const teamB = norm(rawTeamB);
        const teamAId = m.teamAId != null ? String(m.teamAId) : (m.homeId != null ? String(m.homeId) : (m.teamA?.id != null ? String(m.teamA.id) : null));
        const teamBId = m.teamBId != null ? String(m.teamBId) : (m.awayId != null ? String(m.awayId) : (m.teamB?.id != null ? String(m.teamB.id) : null));

        const playersListA: string[] = (
          Array.isArray(m.teamA?.players) ? m.teamA.players.map((p: any) => norm(p?.name || p?.playerName || p)) :
          Array.isArray(m.teamAPlayers) ? m.teamAPlayers.map((p: any) => norm(p?.name || p)) : []
        );
        const playersListB: string[] = (
          Array.isArray(m.teamB?.players) ? m.teamB.players.map((p: any) => norm(p?.name || p?.playerName || p)) :
          Array.isArray(m.teamBPlayers) ? m.teamBPlayers.map((p: any) => norm(p?.name || p)) : []
        );
        const hasNameInA = (n: string) => Boolean(n && (teamA.includes(n) || playersListA.some(p => p.includes(n))));
        const hasNameInB = (n: string) => Boolean(n && (teamB.includes(n) || playersListB.some(p => p.includes(n))));

        let matchedMember: FamilyMember | null = null;
        let matchedReg: any = null;
        let isSelfMatch = false;

        // 1. Direct check if it's the primary user
        if (currentUserName && (hasNameInA(currentUserName) || hasNameInB(currentUserName))) {
          isSelfMatch = true;
        } else if (currentUserIdStr && (teamAId === currentUserIdStr || teamBId === currentUserIdStr)) {
          isSelfMatch = true;
        }

        // 2. Check genuine family members by name (strictly familyMembersOnly, excluding self/head)
        if (!isSelfMatch) {
          for (const fm of familyMembersOnly) {
            const fmName = norm(fm.name);
            if (fmName && (hasNameInA(fmName) || hasNameInB(fmName))) {
              matchedMember = fm;
              break;
            }
          }
        }

        // 3. Check registrations in fetchedMyRegs
        if (!isSelfMatch && !matchedMember) {
          for (const r of fetchedMyRegs) {
            const rName = norm(r.playerName);
            const rTeam = norm((r as any).teamName || (r as any).proposedTeamName);
            const rIdStr = String(r.id);
            const isRegMatch =
              (rName && (hasNameInA(rName) || hasNameInB(rName))) ||
              (rTeam && (teamA === rTeam || teamB === rTeam)) ||
              (teamAId && teamAId === rIdStr) ||
              (teamBId && teamBId === rIdStr);

            if (isRegMatch) {
              matchedReg = r;
              const isSelfReg = isSelfRelationOrMember(r.relation, r.familyMemberId, r.playerName, user?.fullName);
              if (isSelfReg) {
                isSelfMatch = true;
              } else if (r.familyMemberId) {
                matchedMember = familyMembersOnly.find(f => String(f.id) === String(r.familyMemberId)) || ({
                  id: r.familyMemberId,
                  name: r.playerName || "Family Member",
                  relation: r.relation || "FAMILY",
                } as any);
              } else if (r.relation && !isSelfRelationOrMember(r.relation)) {
                matchedMember = {
                  id: r.familyMemberId || `fam-${r.playerName}`,
                  name: r.playerName || "Family Member",
                  relation: r.relation,
                } as any;
              } else {
                isSelfMatch = true;
              }
              break;
            }
          }
        }

        // 4. Check captain teams if still not matched
        if (!isSelfMatch && !matchedMember && captainRegs && captainRegs.length > 0) {
          for (const cap of captainRegs) {
            const capTeam = norm(cap.teamName);
            if (capTeam && (teamA === capTeam || teamB === capTeam)) {
              isSelfMatch = true;
              break;
            }
          }
        }

        if (matchedMember || isSelfMatch || matchedReg) {
          const isSelf = isSelfMatch || isSelfRelationOrMember(
            matchedMember?.relation || matchedReg?.relation,
            matchedMember?.id || matchedReg?.familyMemberId,
            matchedMember?.name || matchedReg?.playerName,
            user?.fullName
          );
          const regPlayerName: string = isSelf
            ? (user?.fullName || "You")
            : (matchedMember ? matchedMember.name : (matchedReg?.playerName || user?.fullName || "You"));
          const regRelation: string = isSelf
            ? "SELF"
            : (matchedMember ? (matchedMember.relation || (matchedMember as any).relationship || "FAMILY") : (matchedReg?.relation || "SELF"));
          const regFamId = isSelf ? "self" : (matchedMember ? matchedMember.id : matchedReg?.familyMemberId);

          let registrantBadge: string | undefined;
          // Strictly omit badge for the logged-in user / Self
          if (!isSelf && regPlayerName && !isSelfRelationOrMember(regRelation, regFamId, regPlayerName, user?.fullName)) {
            if (regRelation && !isSelfRelationOrMember(regRelation)) {
              registrantBadge = `👥 ${regPlayerName} (${regRelation})`;
            } else {
              registrantBadge = `👤 ${regPlayerName}`;
            }
          }

          const myIdStr = norm(matchedMember?.name || matchedReg?.playerName || (matchedReg as any)?.teamName || user?.fullName);
          const isTeamASide = (myIdStr && hasNameInA(myIdStr)) || ((matchedReg as any)?.teamName && teamA === norm((matchedReg as any).teamName));
          const userSideName = isTeamASide ? (rawTeamA || "You") : (rawTeamB || "You");
          const opponentSideName = isTeamASide ? (rawTeamB || "TBD") : (rawTeamA || "TBD");

          const roundStr = m.roundName || m.round;
          const roundPrefix = roundStr ? `${roundStr.replace(/_/g, " ")}: ` : "";
          const matchTitle = `${roundPrefix}${userSideName} vs ${opponentSideName}`;

          let exactMatchDate: Date | undefined;
          if (m.scheduledAt) {
            try {
              const parsed = new Date(m.scheduledAt);
              if (!isNaN(parsed.getTime())) exactMatchDate = parsed;
            } catch {}
          } else if (m.matchDate) {
            try {
              const timeStr = m.matchTime ? (m.matchTime.length === 5 ? `${m.matchTime}:00` : m.matchTime) : "00:00:00";
              const parsed = new Date(`${m.matchDate}T${timeStr}`);
              if (!isNaN(parsed.getTime())) exactMatchDate = parsed;
            } catch {}
          }

          const isMatchLive = m.status === "LIVE" || m.status === "IN_PROGRESS";
          const isMatchCompleted = m.status === "COMPLETED";
          const statusVal = isMatchLive ? "LIVE" : isMatchCompleted ? "COMPLETED" : "UPCOMING";
          const statusTextVal = isMatchLive ? "LIVE NOW"
            : isMatchCompleted ? (m.scoreTeamA && m.scoreTeamB ? `${m.scoreTeamA} - ${m.scoreTeamB}` : "Completed")
            : exactMatchDate ? format(exactMatchDate, "MMM d, h:mm a")
            : "Scheduled";
          const statusSubVal = isMatchLive ? "In Progress"
            : isMatchCompleted ? "Finished"
            : m.courtName || (roundStr ? roundStr.replace(/_/g, " ") : "Fixture Scheduled ✓");

          const eventIdNum = config.eventId || m.eventId;
          if (eventIdNum) {
            matchedConfigEventIds.add(Number(eventIdNum));
          }

          userScheduledMatches.push({
            id: m.id ? -Math.abs(Number(m.id)) : -Math.abs(Number(m.matchId || Math.floor(Math.random() * 100000))),
            matchId: m.id || m.matchId,
            eventId: eventIdNum,
            name: matchTitle,
            subtitle: `${config.tournamentName || "Tournament"}${config.eventName ? ` · ${config.eventName}` : ""}${roundStr ? ` · ${roundStr.replace(/_/g, " ")}` : ""}`,
            tournamentName: config.tournamentName || "Tournament",
            eventName: config.eventName,
            roundName: roundStr ? roundStr.replace(/_/g, " ") : undefined,
            matchNumber: m.matchNumber,
            teamAName: rawTeamA,
            teamBName: rawTeamB,
            userSideName,
            opponentSideName,
            venue: [m.venueName, m.courtName].filter(Boolean).join(" · ") || (config as any).venueName || "Venue TBD",
            venueName: m.venueName || (config as any).venueName || "Community Sports Arena",
            courtName: m.courtName,
            category: config.eventName || (roundStr ? roundStr.replace(/_/g, " ") : "Match"),
            registrantBadge,
            playerName: regPlayerName,
            relation: regRelation,
            familyMemberId: regFamId,
            status: statusVal as any,
            statusText: statusTextVal,
            statusSub: statusSubVal,
            scoreTeamA: m.scoreTeamA,
            scoreTeamB: m.scoreTeamB,
            dotColor: isMatchLive ? "#10b981" : "#f97316",
            timeColor: isMatchLive ? "#10b981" : "#f97316",
            targetDate: exactMatchDate,
            isScheduledMatch: true,
            matchData: m,
            config,
          });
        }
      }

      // ONLY show scheduled matches when matches got scheduled (do not show generic registered events)
      const finalEventsList: any[] = [...userScheduledMatches];

      // Sort with LIVE first, then closest upcoming targetDate
      finalEventsList.sort((a, b) => {
        if (a.status === "LIVE" && b.status !== "LIVE") return -1;
        if (b.status === "LIVE" && a.status !== "LIVE") return 1;
        const timeA = a.targetDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const timeB = b.targetDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return timeA - timeB;
      });

      setLiveEvents(finalEventsList);

      // Stats (server-computed counts)
      setStats([
        { id: 1, value: statsData.yourRegistrations, label: "Your Registrations", badge: "Live Updates", badgeType: "orange", color: "#f97316", icon: Trophy },
        { id: 2, value: statsData.liveEvents, label: "Live Events", badge: statsData.liveEvents > 0 ? "● Running" : "None live", badgeType: "green", color: "#10b981", icon: Zap },
        { id: 3, value: statsData.openRegistrations, label: "Open Registrations", badge: "Join now", badgeType: "blue", color: "#3b82f6", icon: CalendarDays },
        { id: 4, value: statsData.upcomingTournaments, label: "Upcoming Tournaments", badge: "Register", badgeType: "purple", color: "#8b5cf6", icon: Trophy },
      ] as any);

      // Next match (prioritizes concrete scheduled fixtures over generic registration events)
      const upcoming = finalEventsList
        .filter(e => e.targetDate && e.targetDate.getTime() > new Date().getTime() && e.status !== "COMPLETED")
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

  useEffect(() => {
    fetchData();
    const handleRegUpdate = () => {
      fetchData();
    };
    window.addEventListener("mana_registrations_updated", handleRegUpdate);
    return () => {
      window.removeEventListener("mana_registrations_updated", handleRegUpdate);
    };
  }, [fetchData]);

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

      const foundReg = myRegistrations.find(r => r.id === regId);
      const eventId = isAdminNomination ? selectedCaptainEventId : (foundReg?.eventId || foundReg?.event?.id || selectedCaptainEventId);
      if (!eventId) {
        toast.error("Event not found");
        return;
      }

      await auctionService.nominateCaptain(eventId, true, nominateTeamName.trim());
      toast.success(`Captain nomination submitted for team "${nominateTeamName.trim()}"!`);
      setIsNominateModalOpen(false);
      setNominateTeamName("");
      setNominatingRegId(null);
      setSelectedRegForNomination(null);
      setIsAdminNomination(false);
      window.dispatchEvent(new CustomEvent("mana_registrations_updated"));
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
    <div className="space-y-2">

      {error && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-red-200/80 dark:border-red-800/40 shadow-[0_15px_40px_rgba(220,38,38,0.15)] rounded-2xl p-4 flex items-center justify-between gap-3 text-left animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-50 dark:bg-red-950/40 text-red-500 rounded-xl flex-shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Live Tracker Alert</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-relaxed">{error}</p>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className={`shimmer-bg-light border border-slate-200/60 rounded-xl px-2.5 py-2 flex items-center gap-2 ${idx >= 2 ? "hidden sm:flex" : ""}`}>
              <div className="h-7 w-7 rounded-lg bg-slate-200/60 shrink-0"></div>
              <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 flex-1">
                  <div className="h-4 bg-slate-200/60 rounded w-6"></div>
                  <div className="h-3 bg-slate-200/60 rounded w-20"></div>
                </div>
                <div className="h-4 bg-slate-200/60 rounded-full w-12 shrink-0"></div>
              </div>
            </div>
          ))
        ) : (
          stats.map((s, idx) => {
            const bc = badgeMap[s.badgeType as keyof typeof badgeMap] || { bg: "rgba(0,0,0,0.1)", text: "#94a3b8" };
            const isHiddenOnMobile = s.label === "Open Registrations" || s.label === "Upcoming Tournaments" || s.id === 3 || s.id === 4;

            const handleCardClick = () => {
              if (s.id === 1 || s.label === "Your Registrations") {
                setActiveStatsModal("registrations");
              } else if (s.id === 2 || s.label === "Live Events") {
                setActiveStatsModal("live_events");
              }
            };

            return (
              <div key={s.id} className={`animate-fade-in-up stagger-${(idx % 8) + 1} ${isHiddenOnMobile ? "hidden sm:block" : ""}`}>
                <StatCard
                  value={s.value}
                  label={s.label}
                  badge={s.badge}
                  color={s.color}
                  badgeBg={bc.bg}
                  badgeText={bc.text}
                  icon={s.icon}
                  onClick={handleCardClick}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Hero Sponsor Banner - Only shown when real sponsors exist in database */}
      {sponsors.length > 0 && (
        <TournamentSponsorBanner
          sponsors={sponsors}
          tournamentName={featuredTournamentName || "Community Tournament"}
          variant="hero"
          onExploreClick={() => {
            const el = document.getElementById("sponsors-showcase");
            if (el) {
              el.scrollIntoView({ behavior: "smooth" });
            } else {
              toast.info("Discover our esteemed partners & sponsors below!");
            }
          }}
        />
      )}

      {/* Quick Actions Grid - Hidden temporarily */}
      {false && (
        <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-2.5">
          {[
            { label: "Tournaments", emoji: "🏆", to: "/sports/tournaments", color: "#f59e0b" },
            { label: "Live Scores", emoji: "📡", to: "/sports/schedule", color: "#ef4444" },
            { label: "My Teams", emoji: "🛡️", to: "/sports/my-teams", color: "#6366f1" },
            { label: "Auction", emoji: "🔨", to: "/sports/auction", color: "#8b5cf6" },
            { label: "Badges", emoji: "🎖️", to: "/sports/badges", color: "#10b981" },
            { label: "Leaderboard", emoji: "📊", to: "/sports/leaderboard", color: "#0ea5e9" },
            ...(canAccessAdminSports ? [{ label: "My Sports", emoji: "🏅", to: "/sports/my-sports", color: "#ec4899" }] : []),
            ...(canAccessAdminSports ? [{ label: "Analytics", emoji: "📈", to: "/sports/analytics", color: "#14b8a6" }] : []),
          ].map(action => (
            <Link
              key={action.label}
              to={action.to}
              className="flex flex-col items-center gap-1 sm:gap-1.5 p-2 sm:p-3 rounded-xl bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] text-center no-underline"
            >
              <span className="text-[10px]">{action.emoji}</span>
              <span className="text-[10px] font-semibold text-slate-600 leading-tight">{action.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Community Challenges - Only shown to Super Admin as of now */}
      {isSuperAdmin && (
        <div className="rounded-xl p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px]">🎯</span>
              <span className="text-[10px] font-bold text-amber-900">Community Challenges</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-700 uppercase tracking-wider">Coming Soon</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { title: "Most Matches Played", desc: "Play the most matches this season", icon: "🏅" },
              { title: "Century Maker", desc: "Score 100+ runs in a single match", icon: "💯" },
              { title: "Hat-Trick Hero", desc: "Take 3 wickets in consecutive balls", icon: "🎩" },
            ].map(ch => (
              <div key={ch.title} className="bg-white/80 rounded-lg p-2.5 border border-amber-100/60 opacity-75">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px]">{ch.icon}</span>
                  <span className="text-[10px] font-bold text-slate-800">{ch.title}</span>
                </div>
                <div className="text-xs text-slate-500">{ch.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 sm:gap-2.5">
        <div className="lg:col-span-3 space-y-2">
          {/* Upcoming events */}
          <div className={`rounded-xl bg-white border border-slate-200/90 shadow-2xs transition-all ${
            filteredLiveEvents.length === 0 && !loading
              ? "p-2 sm:px-3 sm:py-2"
              : "p-2 sm:p-2.5"
          }`}>
            <div className={`flex items-center justify-between gap-2 flex-wrap ${
              filteredLiveEvents.length === 0 && !loading
                ? (familyMembersOnly.length > 0 ? "mb-1" : "")
                : "mb-1.5"
            }`}>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                <CalendarDays className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Your Upcoming Matches</span>
                {filteredLiveEvents.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {filteredLiveEvents.length}
                  </span>
                )}
              </div>
              {/* Family Filter Dropdown */}
              {familyMembersOnly.length > 0 ? (
                <div className="flex items-center gap-1.5">
                  <label htmlFor="family-events-filter" className="text-xs text-slate-400 font-bold uppercase tracking-wider hidden sm:inline-block">Filter:</label>
                  <select
                    id="family-events-filter"
                    name="familyEventsFilter"
                    value={upcomingFamilyFilter}
                    onChange={(e) => setUpcomingFamilyFilter(e.target.value)}
                    className="text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg px-2 py-0.5 sm:px-2.5 sm:py-1 outline-none focus:border-indigo-500 transition cursor-pointer"
                    title="Filter upcoming matches by family member"
                  >
                    <option value="ALL">👥 All Matches</option>
                    <option value="SELF">👤 {user?.fullName || "Self"}</option>
                    {familyMembersOnly.map(m => (
                      <option key={m.id} value={String(m.id)}>
                        👥 {m.name}
                      </option>
                    ))}
                  </select>
                  {upcomingMemberProfileStatus && (
                    upcomingMemberProfileStatus.isValid ? (
                      <span
                        className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                        title={`Profile Ready (${upcomingTargetMember?.gender ? (upcomingTargetMember.gender.toLowerCase().startsWith("m") ? "Male" : "Female") : "Ready"}, ${upcomingTargetMember?.age}y)`}
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Ready ({upcomingTargetMember?.gender ? (upcomingTargetMember.gender.toLowerCase().startsWith("m") ? "Male" : "Female") : "Ready"}{upcomingTargetMember?.age ? `, ${upcomingTargetMember.age}y` : ""})</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Missing {upcomingMemberProfileStatus.missingFields.join(" & ")}</span>
                      </span>
                    )
                  )}
                </div>
              ) : (filteredLiveEvents.length === 0 && !loading) ? (
                <div className="text-xs font-semibold text-slate-400">
                  No upcoming matches scheduled
                </div>
              ) : null}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-[#f97316] animate-spin" />
              </div>
            ) : filteredLiveEvents.length === 0 ? (
              <div className="text-center py-2.5 sm:py-3">
                <div className="text-xs font-semibold text-slate-500">
                  {upcomingFamilyFilter !== "ALL"
                    ? `No upcoming matches scheduled for ${selectedMemberDisplayName}`
                    : "No upcoming matches scheduled yet"}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  When tournament draws and match fixtures are published, they will appear here.
                </div>
              </div>
            ) : (
              <div className="max-h-[220px] sm:max-h-[240px] overflow-y-auto pr-1">
                {filteredLiveEvents.map((ev, idx) => {
                  const myReg = myRegistrations.find(r => {
                    if (!isEventMatch(r, ev as any)) return false;
                    if (ev.familyMemberId != null) return String(r.familyMemberId) === String(ev.familyMemberId);
                    if (ev.playerName) return r.playerName?.toLowerCase().trim() === ev.playerName.toLowerCase().trim();
                    if (upcomingFamilyFilter !== "ALL") return isRegistrationForMember(r, upcomingFamilyFilter);
                    return true;
                  }) || myRegistrations.find(r => isEventMatch(r, ev as any));

                  const isConfirmed = myReg?.status === "CONFIRMED";
                  const isNominated = myReg?.captainNomination;
                  const isTeamReg = myReg?.matchType === "TEAM";
                  const regPersonName = myReg?.playerName || user?.fullName || "You";
                  const isSelfNomination = isSelfRelationOrMember(myReg?.relation, myReg?.familyMemberId, myReg?.playerName, user?.fullName);

                  return (
                    <div key={ev.id} className={`mb-1 sm:mb-1.5 last:mb-0 animate-fade-in-up stagger-${(idx % 8) + 1}`}>
                      <EventRow
                        event={ev}
                        onShowInfo={(infoEv) => setActiveInfoEvent(infoEv)}
                        onClick={() => setActiveInfoEvent(ev)}
                      />
                      {isConfirmed && isTeamReg && !ev.isScheduledMatch && (
                        <div className="flex items-center justify-between px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-b-lg border-x border-b -mt-1 bg-indigo-50/25 border-indigo-100/80"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-medium">Captaincy Status:</span>
                            <span className={`text-[10px] font-semibold ${myReg?.captainConfirmation ? 'text-emerald-600' : isNominated ? 'text-[#f97316]' : 'text-slate-500'}`}>
                              {myReg?.captainConfirmation ? 'Confirmed Captain' : isNominated ? 'Nominated' : 'Not Nominated'}
                            </span>
                          </div>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (myReg?.captainConfirmation) return;
                              if (isNominated) {
                                try {
                                  await auctionService.nominateCaptain(ev.id, false);
                                  toast.success("Nomination withdrawn");
                                  fetchData();
                                } catch {
                                  toast.error("Failed to update nomination");
                                }
                              } else {
                                setNominatingRegId(myReg?.id ?? null);
                                setSelectedCaptainEventId(ev.id);
                                setNominateTeamName(myReg?.proposedTeamName || myReg?.teamName || "");
                                setIsAdminNomination(false);
                                setIsNominateModalOpen(true);
                              }
                            }}
                            disabled={myReg?.captainConfirmation}
                            className={`text-xs px-2 py-1 rounded border transition-colors ${myReg?.captainConfirmation
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default'
                              : isNominated
                                ? 'bg-orange-50 text-[#f97316] border-orange-200 hover:bg-orange-100 cursor-pointer'
                                : 'bg-slate-50 text-indigo-600 border-indigo-200 hover:bg-indigo-50 cursor-pointer'
                              }`}
                          >
                            {myReg?.captainConfirmation
                              ? 'Confirmed'
                              : isNominated
                                ? 'Withdraw Nomination'
                                : isSelfNomination
                                  ? 'Nominate Me as Captain'
                                  : `Nominate ${regPersonName} as Captain`}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* Open registrations — grouped by tournament with rich sports group view */}
          <div id="open-registrations-section" className="rounded-xl p-2 sm:p-2.5 bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                  <Trophy className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <div className="relative flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-slate-900 leading-tight m-0 mb-0">Open for Registration</h3>
                    <div className="relative inline-flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowOpenRegInfo(prev => !prev)}
                        className="p-1 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer flex items-center justify-center"
                        title="Select sports groups and categories to register yourself or family members"
                        aria-label="Registration Info"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                      {showOpenRegInfo && (
                        <div className="absolute left-0 sm:left-auto top-full mt-1.5 z-30 w-64 sm:w-72 p-2.5 bg-slate-900 text-white text-xs font-medium rounded-xl shadow-lg border border-slate-800 animate-in fade-in slide-in-from-top-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="leading-snug">Select sports groups and categories to register yourself or family members</p>
                            <button
                              type="button"
                              onClick={() => setShowOpenRegInfo(false)}
                              className="text-slate-400 hover:text-white p-0.5 shrink-0 cursor-pointer"
                              title="Close"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {(openTournaments.length > 0 || openRegs.length > 0) && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Active
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              </div>
            ) : openTournaments.length === 0 && openRegs.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <div className="text-3xl mb-2">🏅</div>
                <p className="text-xs font-bold text-slate-800">No events open for registration right now</p>
                <p className="text-xs text-slate-500 mt-1">Check back later or ask your sports admin to open registrations</p>
              </div>
            ) : openTournaments.length > 0 ? (
              openTournaments.map((t, tIdx) => {
                const isExpanded = expandedTournaments.has(t.id);
                const totalCount = t.mappedEvents.length;
                const deadlineDays = t.eventDateStart ? differenceInDays(new Date(t.eventDateStart), new Date()) : null;
                const viewMode = tournamentViewMode[t.id] || "grid";


                const selectedMemberId = selectedMemberByTournament[t.id] ?? (t.id ? selectedMemberByTournament[String(t.id)] : undefined) ?? "self";
                const memberProfileStatus = getMemberProfileStatus(selectedMemberId);
                const isSelf = !selectedMemberId || selectedMemberId === "self" || isSelfRelationOrMember(undefined, selectedMemberId);
                const stored = getStoredUser();
                const targetMember = isSelf
                  ? {
                      age: calculateAge(user?.dateOfBirth || (user as any)?.dob || stored?.dateOfBirth || (stored as any)?.dob) || (user as any)?.age || (stored as any)?.age || 0,
                      gender: user?.gender || stored?.gender || "",
                    }
                  : (() => {
                      const fm = familyMembers.find(m => String(m.id) === String(selectedMemberId));
                      const computedAge = calculateAge(fm?.dob || (fm as any)?.dateOfBirth);
                      const inferredGen = inferGender(fm, user?.gender || stored?.gender);
                      return {
                        age: (computedAge !== null && computedAge > 0 ? computedAge : Number(fm?.age)) || 0,
                        gender: fm?.gender || inferredGen || "",
                      };
                    })();

                const getMemberRegsForEvent = (ev: OpenRegistration) => {
                  const fromMyRegs = myRegistrations.filter(r =>
                    isEventMatch(r, ev) &&
                    isRegistrationForMember(r, selectedMemberId) &&
                    isActiveRegistrationStatus(r.status) &&
                    !withdrawnRegistrationIds.has(Number(r.id))
                  );
                  if (fromMyRegs.length > 0) return fromMyRegs;

                  // If this member has an inactive (WITHDRAWN/CANCELLED/REJECTED) registration in myRegistrations,
                  // they are definitely NOT registered!
                  const hasInactiveForMember = myRegistrations.some(r =>
                    isEventMatch(r, ev) &&
                    isRegistrationForMember(r, selectedMemberId) &&
                    !isActiveRegistrationStatus(r.status)
                  );
                  if (hasInactiveForMember) return [];

                  // If this event or registration ID was marked withdrawn in this session:
                  if (ev.registrationId && withdrawnRegistrationIds.has(Number(ev.registrationId))) return [];
                  if ((ev as any).myRegistrationId && withdrawnRegistrationIds.has(Number((ev as any).myRegistrationId))) return [];

                  // If backend event object reports withdrawn/cancelled status:
                  const evStatus = (ev as any).myRegistrationStatus;
                  if (evStatus && !isActiveRegistrationStatus(evStatus)) return [];

                  // When myRegistrations has loaded, it is authoritative!
                  if (myRegistrations.length > 0) return [];

                  if (isSelf && (ev.registrationId || (ev as any).myRegistrationId)) {
                    const rawId = ev.registrationId || (ev as any).myRegistrationId;
                    if (withdrawnRegistrationIds.has(Number(rawId))) return [];
                    const isEvTeam = Boolean(ev.isTeamSport || isTeamSport(ev.category || ev.name || ""));
                    const evFormats = isEvTeam ? ["TEAM"] : getEventFormats(ev as any);
                    const defaultFmt = evFormats[0] || (isEvTeam ? "TEAM" : "SINGLES");
                    return [{
                      id: rawId,
                      eventId: ev.id,
                      status: (ev as any).myRegistrationStatus || "CONFIRMED",
                      matchType: (ev as any).matchType || defaultFmt,
                      playerName: user?.fullName || "Self",
                      relation: "SELF",
                    }];
                  }

                  return [];
                };
                const isMemberRegisteredForEvent = (ev: OpenRegistration) => {
                  return getMemberRegsForEvent(ev).length > 0;
                };
                const getMemberRegForEvent = (ev: OpenRegistration) => {
                  return getMemberRegsForEvent(ev)[0];
                };
                const getMemberRegisteredFormats = (ev: OpenRegistration) => {
                  const isEvTeam = Boolean(ev.isTeamSport || isTeamSport(ev.category || ev.name || ""));
                  if (isEvTeam) return ["TEAM"];
                  const evFormats = getEventFormats(ev as any);
                  const regs = getMemberRegsForEvent(ev);
                  if (regs.length === 0) return [];

                  // If event only offers 1 format (e.g. DOUBLES), any registration for this event is for that format
                  if (evFormats.length <= 1) {
                    const singleFmt = evFormats[0] || (isEvTeam ? "TEAM" : "SINGLES");
                    return [singleFmt.toUpperCase()];
                  }

                  const registered = regs.map(r => {
                    const rawFmt = (typeof r.matchType === "string" ? r.matchType : Array.isArray(r.matchType) ? r.matchType.join(" ") : String(r.matchType || (r as any).format || "")).toUpperCase().trim();
                    if (rawFmt && evFormats.map(f => f.toUpperCase()).includes(rawFmt)) {
                      return rawFmt;
                    }
                    if (((r as any).partnerUserId || (r as any).partnerFamilyMemberId) && evFormats.some(f => f.toUpperCase().includes("DOUBLES"))) {
                      return (evFormats.find(f => f.toUpperCase() === "DOUBLES") || evFormats.find(f => f.toUpperCase().includes("DOUBLES"))!).toUpperCase();
                    }
                    return (evFormats[0] || "SINGLES").toUpperCase();
                  });
                  return Array.from(new Set(registered));
                };
                const getUnregisteredFormats = (ev: OpenRegistration) => {
                  const isEvTeam = Boolean(ev.isTeamSport || isTeamSport(ev.category || ev.name || ""));
                  if (isEvTeam) {
                    return isMemberRegisteredForEvent(ev) ? [] : ["TEAM"];
                  }
                  const allFormats = getEventFormats(ev as any);
                  if (allFormats.length <= 1) {
                    return isMemberRegisteredForEvent(ev) ? [] : (allFormats.length === 1 ? allFormats : ["SINGLES"]);
                  }
                  const regFormats = getMemberRegisteredFormats(ev);
                  return allFormats.filter(f => !regFormats.some(rf => rf.toUpperCase() === f.toUpperCase()));
                };
                const isFullyRegisteredForEvent = (ev: OpenRegistration) => {
                  const isEvTeam = Boolean(ev.isTeamSport || isTeamSport(ev.category || ev.name || ""));
                  if (isEvTeam) return isMemberRegisteredForEvent(ev);
                  const allFormats = getEventFormats(ev as any);
                  if (allFormats.length <= 1) return isMemberRegisteredForEvent(ev);
                  return getUnregisteredFormats(ev).length === 0;
                };

                const handleUnregisterCategory = async (item: OpenRegistration, targetRegId?: number) => {
                  const allMemberRegs = getMemberRegsForEvent(item);
                  const regs = targetRegId
                    ? allMemberRegs.filter(r => Number(r.id) === targetRegId)
                    : allMemberRegs;
                  if (regs.length === 0) return;

                  const displayName = item.categoryName || item.name;
                  const isSelfMember = !selectedMemberId || selectedMemberId === "self" || isSelfRelationOrMember(undefined, selectedMemberId);
                  const participantName = isSelfMember ? "yourself" : (familyMembers.find(m => String(m.id) === String(selectedMemberId))?.name || "this family member");

                  const fmtList = regs.map(r => extractFormatStr(r.matchType || (r as any).format)).filter(Boolean).join(", ");
                  const confirmMsg = fmtList
                    ? `Are you sure you want to unregister ${participantName} from ${displayName} (${fmtList})? You will lose your reserved spot.`
                    : `Are you sure you want to unregister ${participantName} from ${displayName}? You will lose your reserved spot.`;

                  if (!(await confirmAction("Unregister", confirmMsg))) return;

                  const withdrawnIds = regs.map(r => Number(r.id)).filter(id => !isNaN(id) && id > 0);

                  // 1. Mark IDs as locally withdrawn immediately
                  setWithdrawnRegistrationIds(prev => {
                    const next = new Set(prev);
                    withdrawnIds.forEach(id => next.add(id));
                    return next;
                  });

                  // 2. Optimistically update myRegistrations: mark status as WITHDRAWN
                  setMyRegistrations(prev =>
                    prev.map(r => withdrawnIds.includes(Number(r.id)) ? { ...r, status: "WITHDRAWN" } : r)
                  );

                  // 3. Optimistically update openTournaments: only if all active registrations for this event are withdrawn
                  const remainingActiveCount = allMemberRegs.filter(r => !withdrawnIds.includes(Number(r.id))).length;
                  if (remainingActiveCount === 0) {
                    setOpenTournaments(prev => prev.map(tourney => ({
                      ...tourney,
                      mappedEvents: tourney.mappedEvents.map(ev => {
                        const isTarget = ev.id === item.id || isEventMatch(item, ev);
                        if (isTarget) {
                          return {
                            ...ev,
                            registrationId: undefined,
                            action: "Register",
                            progress: 0,
                            progressColor: "#e2e8f0",
                            rawEvent: {
                              ...ev.rawEvent,
                              myRegistrationId: null,
                              myRegistrationStatus: "WITHDRAWN",
                            },
                          };
                        }
                        return ev;
                      })
                    })));
                  }

                  // 4. Optimistically update stats count
                  setStats(prev => Array.isArray(prev) ? prev.map(s => s.id === 1 ? { ...s, value: Math.max(0, Number(s.value || 0) - regs.length) } : s) : prev);

                  try {
                    for (const r of regs) {
                      const rId = Number(r.id);
                      if (!isNaN(rId) && rId > 0) {
                        try {
                          await sportsService.withdraw(rId);
                        } catch (withdrawErr: any) {
                          const msg = String(withdrawErr?.message || withdrawErr?.response?.data?.message || "");
                          // If event has started and caller has admin/sports admin rights, use admin rejection/cancellation
                          if (canAccessAdminSports && (msg.toLowerCase().includes("started") || msg.toLowerCase().includes("organizer"))) {
                            await sportsService.rejectRegistration(rId, "Withdrawn by Admin");
                          } else {
                            throw withdrawErr;
                          }
                        }
                      }
                    }
                    const unregLabel = fmtList ? `${displayName} (${fmtList})` : displayName;
                    toast.success(`Unregistered from ${unregLabel}`);
                    window.dispatchEvent(new CustomEvent("mana_registrations_updated"));
                    await fetchData();
                  } catch (err: any) {
                    const msg = err?.message || err?.response?.data?.message || "Failed to unregister";
                    toast.error(msg);
                    fetchData();
                  }
                };

                // Eligibility filter state: default selected (true)
                const showEligibleOnly = tournamentEligibleOnly[t.id] ?? true;

                const isCategoryEligibleOrRegistered = (item: OpenRegistration) => {
                  const elig = checkCategoryEligibility(item, targetMember.age, targetMember.gender);
                  return elig.eligible || isMemberRegisteredForEvent(item);
                };

                const totalEligibleCount = t.mappedEvents.filter(isCategoryEligibleOrRegistered).length;

                // Group child events by sport (filtered when showEligibleOnly is active)
                const sportGroupMap = new Map<string, { emoji: string; events: OpenRegistration[] }>();
                t.mappedEvents.forEach(ev => {
                  if (showEligibleOnly && !isCategoryEligibleOrRegistered(ev)) {
                    return;
                  }
                  const sport = (ev.category?.split(" · ")[0]) || "Sport";
                  if (!sportGroupMap.has(sport)) sportGroupMap.set(sport, { emoji: ev.sportEmoji || getSportEmoji(sport), events: [] });
                  sportGroupMap.get(sport)!.events.push(ev);
                });
                const sportEntries = Array.from(sportGroupMap.entries());

                const gridEvents = showEligibleOnly
                  ? t.mappedEvents.filter(isCategoryEligibleOrRegistered)
                  : t.mappedEvents;

                const renderCategoryCard = (item: OpenRegistration) => {
                  const sportName = (item.category?.split(" · ")[0]) || "Sport";
                  const emoji = item.sportEmoji || getSportEmoji(sportName);
                  const isTeam = Boolean(item.isTeamSport || isTeamSport(sportName) || isTeamSport(item.name || "") || (item as any).matchType === "TEAM" || (item as any).eventType === "TEAM");
                  const regs = getMemberRegsForEvent(item);
                  const memberReg = regs[0];
                  const isReg = regs.length > 0;
                  const elig = checkCategoryEligibility(item, targetMember.age, targetMember.gender);
                  const isBlocked = !elig.eligible;
                  const eventFormats = isTeam ? ["TEAM"] : getEventFormats(item as any);
                  const regFormats = getMemberRegisteredFormats(item);
                  const unregFormats = getUnregisteredFormats(item);
                  const isFullyReg = isReg && (isTeam || eventFormats.length <= 1 || unregFormats.length === 0);
                  const isPartiallyReg = !isTeam && isReg && eventFormats.length > 1 && unregFormats.length > 0;

                  const displayFormats = isTeam
                    ? ["TEAM"]
                    : eventFormats && eventFormats.length > 0
                    ? eventFormats
                    : [(item.categoryName || item.name || "").toLowerCase().includes("double") ? "DOUBLES" : "SINGLES"];

                  const spotsText = item.spots || "";
                  const matchSpots = spotsText.match(/(\d+)\/(\d+)/);
                  const regCount = matchSpots ? parseInt(matchSpots[1], 10) : 0;
                  const maxSpots = matchSpots ? parseInt(matchSpots[2], 10) : null;
                  const percentFilled = maxSpots && maxSpots > 0 ? Math.min(100, Math.round((regCount / maxSpots) * 100)) : 0;
                  const isNearlyFull = maxSpots && maxSpots > 0 && percentFilled >= 75 && regCount < maxSpots;
                  const isFull = maxSpots && maxSpots > 0 && regCount >= maxSpots;

                  return (
                    <div
                      key={item.id}
                      className={`p-2 sm:p-2.5 rounded-lg border transition-all text-left flex flex-col justify-between gap-1.5 ${
                        isFullyReg
                          ? "border-emerald-200 bg-emerald-50/30 shadow-2xs"
                          : isBlocked
                          ? "border-slate-200 bg-slate-50/60 opacity-90"
                          : "border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-2xs"
                      }`}
                    >
                      <div>
                        {/* Card Header: Emoji + Title + Format Badge(s) */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] p-1 rounded-md bg-slate-50 border border-slate-100 shrink-0">
                              {emoji}
                            </span>
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-slate-900 truncate" title={item.name || item.categoryName}>
                                {item.name || item.categoryName}
                              </h5>
                              <div className="text-xs text-slate-500 font-medium truncate flex items-center gap-1.5 flex-wrap mt-0.5">
                                <span>{sportName} {item.date ? `· ${item.date}` : ""}</span>
                                {item.categoryName && (
                                  <span
                                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100/80 shrink-0"
                                    title={`Player Category: ${item.categoryName}`}
                                  >
                                    {item.categoryName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                            {displayFormats.map(fmt => {
                              const isTeamFmt = fmt === "TEAM";
                              const isMixed = fmt === "MIXED_DOUBLES" || fmt.includes("MIXED");
                              const isDbl = fmt === "DOUBLES" || (fmt.includes("DOUBLES") && !isMixed);
                              const label =
                                isTeamFmt
                                  ? "Team Squad"
                                  : isMixed
                                  ? "Mixed"
                                  : isDbl
                                  ? "Doubles"
                                  : fmt === "SINGLES"
                                  ? "Singles"
                                  : fmt.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

                              return (
                                <span
                                  key={fmt}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                                    isTeamFmt
                                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                                      : isMixed
                                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                                      : isDbl
                                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                                      : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  }`}
                                >
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Action row */}
                        <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap mt-1.5">
                          {isNearlyFull && !isFull ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                              ⚡ Filling Fast
                            </span>
                          ) : (
                            <div />
                          )}

                          {/* Action / Registration button */}
                          <div className="shrink-0 ml-auto">
                            {isFullyReg ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {regs.length > 1 ? (
                                  regs.map(r => {
                                    const rawFmt = extractFormatStr(r.matchType || (r as any).format) || "REGISTERED";
                                    const fmtLabel = rawFmt.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                                    return (
                                      <span
                                        key={r.id}
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 shadow-2xs"
                                      >
                                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                        <span>✓ {fmtLabel}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleUnregisterCategory(item, Number(r.id))}
                                          className="ml-0.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded px-1 transition-colors cursor-pointer font-bold"
                                          title={`Unregister from ${fmtLabel}`}
                                          aria-label={`Unregister from ${fmtLabel}`}
                                        >
                                          ✕
                                        </button>
                                      </span>
                                    );
                                  })
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Registered</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleUnregisterCategory(item, regs[0]?.id ? Number(regs[0].id) : undefined)}
                                      className="text-[10px] font-bold px-2 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 cursor-pointer transition-colors"
                                      title="Unregister from this category"
                                    >
                                      Unregister
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : isPartiallyReg ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {regs.map(r => {
                                  const rawFmt = extractFormatStr(r.matchType || (r as any).format) || regFormats.join(", ");
                                  const fmtLabel = rawFmt.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                                  return (
                                    <span
                                      key={r.id}
                                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 shadow-2xs"
                                    >
                                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                      <span>✓ {fmtLabel}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleUnregisterCategory(item, Number(r.id))}
                                        className="ml-0.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded px-1 transition-colors cursor-pointer font-bold"
                                        title={`Unregister from ${fmtLabel}`}
                                        aria-label={`Unregister from ${fmtLabel}`}
                                      >
                                        ✕
                                      </button>
                                    </span>
                                  );
                                })}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const isSelfMember = selectedMemberId === "self";
                                    handleOpenRegistration(item.uuid ?? item.id, isSelfMember ? "self" : "family", isSelfMember ? undefined : selectedMemberId);
                                  }}
                                  className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer flex items-center gap-0.5 transition-colors"
                                >
                                  <span>+ {unregFormats.join(", ")}</span>
                                  <ArrowUpRight className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ) : isBlocked ? (
                              <span
                                title={elig.warningMsg}
                                className={`text-[10px] font-bold px-2 py-1 rounded-md border cursor-not-allowed ${
                                  elig.isAgeUnknown
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                }`}
                              >
                                {elig.isGenderMismatch ? "Gender Ineligible" : elig.isOverAge ? "Over Age Limit" : elig.isAgeUnknown ? "Age Not Set" : "Under Age Limit"}
                              </span>
                            ) : !memberProfileStatus.isValid ? (
                              <button
                                type="button"
                                onClick={() => notifyIncompleteProfile(selectedMemberId)}
                                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors"
                              >
                                Complete Profile →
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const isSelfMember = selectedMemberId === "self";
                                  handleOpenRegistration(item.uuid ?? item.id, isSelfMember ? "self" : "family", isSelfMember ? undefined : selectedMemberId);
                                }}
                                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                              >
                                <span>Register Now</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                };

                return (
                  <div key={t.id} className="mb-2 last:mb-0 rounded-xl border border-indigo-100/90 bg-white shadow-2xs overflow-hidden transition-all text-left">
                    {/* Tournament Header with Details */}
                    <div className="p-2 sm:p-2.5 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/80 border-b border-indigo-100/80">
                      <div className="flex items-center justify-between gap-2.5 flex-wrap">
                        {/* Tournament Name, Details Button & Badges */}
                        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap min-w-0">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-full m-0 mb-0">{t.name}</h3>

                          <button
                            type="button"
                            onClick={() => {
                              setDetailsModalTournament(t);
                              setIsDetailsModalOpen(true);
                            }}
                            className="p-1 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs shrink-0"
                            title="View full tournament rules, venue, and description"
                            aria-label="Tournament Details"
                          >
                            <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="hidden sm:inline">Tournament Details</span>
                          </button>

                          {t.eventDateStart && t.eventDateEnd && (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium shrink-0">
                              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {format(new Date(t.eventDateStart), "MMM d")} - {format(new Date(t.eventDateEnd), "MMM d")}
                              </span>
                            </span>
                          )}

                          {/*
                          {deadlineDays !== null && deadlineDays >= 0 && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 shrink-0">
                              <Clock className="w-3 h-3" />
                              {deadlineDays === 0 ? "Starts Today!" : `${deadlineDays} ${deadlineDays === 1 ? "day" : "days"} to go`}
                            </span>
                          )}
                          */}

                          {t.sponsors && t.sponsors.length > 0 && (
                            <TournamentSponsorBadge sponsor={t.sponsors[0]} size="sm" />
                          )}
                        </div>

                        {/* Hide / Show Button (Hidden as requested) */}
                        {/*
                        <button
                          type="button"
                          onClick={() => setExpandedTournaments(prev => {
                            const next = new Set(prev);
                            if (next.has(t.id)) next.delete(t.id); else next.add(t.id);
                            return next;
                          })}
                          className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ml-auto sm:ml-0"
                        >
                          <span>{isExpanded ? "Hide" : "Show"}</span>
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                        */}
                      </div>

                      {/* Family member registration selector */}
                      {isExpanded && (
                        <div className="mt-1.5 pt-1.5 border-t border-indigo-100/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap shrink-0">
                              <label htmlFor={`tournament-reg-for-${t.id}`} className="text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                                Register For:
                              </label>
                              <div className="relative">
                                <select
                                  id={`tournament-reg-for-${t.id}`}
                                  name={`tournamentRegFor_${t.id}`}
                                  value={selectedMemberByTournament[t.id] ?? (t.id ? selectedMemberByTournament[String(t.id)] : undefined) ?? "self"}
                                  onChange={(e) => handleTournamentMemberChange(t, e.target.value)}
                                  className="text-xs font-semibold pl-2.5 pr-7 py-1.5 rounded-lg bg-white border border-indigo-200 text-slate-800 shadow-2xs hover:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none transition-all"
                                  title="Choose participant to register"
                                >
                                  <option value="self">👤 {user?.fullName || "Self"}</option>
                                  {familyMembersOnly.map(m => (
                                    <option key={m.id} value={String(m.id)}>
                                      👥 {m.name}{m.relation && m.relation !== "Family" ? ` (${m.relation})` : ""}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>

                              {/* Profile readiness & eligibility chip */}
                              {!memberProfileStatus.isValid ? (
                                <button
                                  type="button"
                                  onClick={() => navigate(memberProfileStatus.isSelf ? "/profile" : "/profile?tab=family")}
                                  className="text-[10px] font-medium text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200 inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer transition"
                                  title={`Profile Incomplete: Missing ${memberProfileStatus.missingFields.join(" & ")}. Click to update profile.`}
                                >
                                  <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                  <span>Missing {memberProfileStatus.missingFields.join(" & ")}</span>
                                </button>
                              ) : totalEligibleCount === 0 ? (
                                <span
                                  className="text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                                  title={`0 eligible categories in this tournament for ${targetMember.gender ? (targetMember.gender.toLowerCase().startsWith("m") ? "Male" : "Female") : "unspecified"}, ${targetMember.age > 0 ? `${targetMember.age}y` : "age unspecified"}`}
                                >
                                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>Ineligible ({targetMember.gender ? (targetMember.gender.toLowerCase().startsWith("m") ? "Male" : "Female") : ""}{targetMember.age > 0 ? `, ${targetMember.age}y` : ""})</span>
                                </span>
                              ) : (
                                <span
                                  className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                                  title={`Profile Ready & Verified: ${targetMember.gender ? (targetMember.gender.toLowerCase().startsWith("m") ? "Male" : "Female") : "Ready"}${targetMember.age > 0 ? `, ${targetMember.age}y` : ""} (${totalEligibleCount} eligible categories)`}
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>Ready ({targetMember.gender ? (targetMember.gender.toLowerCase().startsWith("m") ? "Male" : "Female") : "Ready"}{targetMember.age > 0 ? `, ${targetMember.age}y` : ""})</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* View mode & eligibility filter toolbar */}
                          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-1 bg-slate-100/90 p-1 rounded-xl sm:rounded-lg text-xs font-semibold text-slate-600 border border-slate-200/60 shadow-2xs">
                            {/* Eligible filter toggle: Default selected */}
                            <button
                              type="button"
                              onClick={() => setTournamentEligibleOnly(prev => ({ ...prev, [t.id]: !(prev[t.id] ?? true) }))}
                              className={`flex-1 sm:flex-initial min-h-[32px] sm:min-h-0 px-2.5 py-1.5 sm:py-1 rounded-lg sm:rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none active:scale-[0.98] ${
                                showEligibleOnly
                                  ? "bg-white text-emerald-700 shadow-2xs font-bold border border-emerald-100/60"
                                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                              }`}
                              title={
                                showEligibleOnly
                                  ? "Showing eligible categories only. Click to view all categories (including ineligible)."
                                  : "Showing all categories (eligible & ineligible). Click to show eligible only."
                              }
                            >
                              <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${showEligibleOnly ? "text-emerald-600" : "text-slate-400"}`} />
                              <span className="whitespace-nowrap">Eligible</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${ showEligibleOnly ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-200 text-slate-600" }`}
                              >
                                {totalEligibleCount}
                              </span>
                            </button>

                            <div className="w-px h-4 bg-slate-300 mx-0.5 shrink-0" />

                            {/* View Switcher: Grid vs By Sport */}
                            <div className="flex items-center gap-1 flex-1 sm:flex-initial">
                              <button
                                type="button"
                                onClick={() => setTournamentViewMode(prev => ({ ...prev, [t.id]: "grid" }))}
                                className={`flex-1 sm:flex-initial min-h-[32px] sm:min-h-0 px-2 sm:px-2.5 py-1.5 sm:py-1 rounded-lg sm:rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 select-none active:scale-[0.98] ${
                                  viewMode === "grid"
                                    ? "bg-white text-indigo-700 shadow-2xs font-bold border border-indigo-100/60"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                                }`}
                                title="View all categories in a grid"
                              >
                                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                                <span className="whitespace-nowrap">
                                  <span className="hidden sm:inline">All </span>Grid
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setTournamentViewMode(prev => ({ ...prev, [t.id]: "groups" }))}
                                className={`flex-1 sm:flex-initial min-h-[32px] sm:min-h-0 px-2 sm:px-2.5 py-1.5 sm:py-1 rounded-lg sm:rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 select-none active:scale-[0.98] ${
                                  viewMode === "groups"
                                    ? "bg-white text-indigo-700 shadow-2xs font-bold border border-indigo-100/60"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                                }`}
                                title="Group categories by sport"
                              >
                                <ListTree className="w-3.5 h-3.5 shrink-0" />
                                <span className="whitespace-nowrap">By Sport</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sports Group View - Body */}
                    {isExpanded && (
                      <div className="p-2 sm:p-2.5 bg-slate-50/30">
                        {showEligibleOnly && (viewMode === "groups" ? sportEntries.length === 0 : gridEvents.length === 0) ? (
                          <div className="py-6 px-3 text-center bg-white rounded-xl border border-dashed border-slate-200">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-1.5 text-base">
                              🔍
                            </div>
                            <p className="text-xs font-semibold text-slate-700">No eligible categories found for this participant</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Based on age ({targetMember.age > 0 ? `${targetMember.age}y` : "unspecified"}) and gender ({targetMember.gender || "unspecified"}).
                            </p>
                            {!memberProfileStatus.isValid && (
                              <div className="mt-2 flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => navigate(memberProfileStatus.isSelf ? "/profile" : "/profile?tab=family")}
                                  className="text-[10px] font-medium text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition shadow-2xs"
                                  title={`Profile Incomplete: Missing ${memberProfileStatus.missingFields.join(" & ")}. Click to update profile.`}
                                >
                                  <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                  <span>Missing {memberProfileStatus.missingFields.join(" & ")}</span>
                                  <span className="font-semibold underline ml-0.5">· Update Profile →</span>
                                </button>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setTournamentEligibleOnly(prev => ({ ...prev, [t.id]: false }))}
                              className="mt-2.5 px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <span>Show All Categories ({t.mappedEvents.length})</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : viewMode === "groups" ? (
                          <div className="space-y-1.5 sm:space-y-2">
                            {sportEntries.map(([sport, { emoji, events: sportEvents }]) => {
                              const eligibleCount = sportEvents.filter(e => checkCategoryEligibility(e, targetMember.age, targetMember.gender).eligible).length;
                              const regCount = sportEvents.filter(e => isMemberRegisteredForEvent(e)).length;

                              return (
                                <div key={sport} className="p-2 sm:p-2.5 rounded-lg border border-slate-200/80 bg-white shadow-2xs">
                                  <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-100 flex-wrap gap-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-[10px] shrink-0">{emoji}</span>
                                      <h3 className="text-xs font-bold text-slate-900 m-0 mb-0 truncate">{sport}</h3>
                                      <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                                        · {sportEvents.length} {sportEvents.length === 1 ? "category" : "categories"}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                      {eligibleCount > 0 && (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                                          {eligibleCount} eligible
                                        </span>
                                      )}
                                      {regCount > 0 && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          ✓ {regCount} registered
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDetailsModalTournament(t);
                                          setIsDetailsModalOpen(true);
                                        }}
                                        className="p-1 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer flex items-center justify-center"
                                        title="View tournament rules and details"
                                        aria-label="Tournament rules and details"
                                      >
                                        <Info className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                                    {sportEvents.map(renderCategoryCard)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                            {gridEvents.map(renderCategoryCard)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="max-h-[290px] overflow-y-auto pr-1">
                {openRegs.map((item, idx) => (
                  <div key={item.id} className={`animate-fade-in-up stagger-${(idx % 8) + 1}`}>
                    <RegCard
                       item={item}
                       onRegister={() => handleOpenRegistration(item.uuid ?? item.id)}
                       onView={() => navigate("/sports/auction")}
                       onWithdraw={async (regItem) => {
                         if (!regItem.registrationId) return;
                         if (!(await confirmAction("Withdraw Registration", `Are you sure you want to withdraw your registration for ${regItem.name}?`))) return;
                         const regId = Number(regItem.registrationId);
                         setWithdrawnRegistrationIds(prev => new Set(prev).add(regId));
                         setMyRegistrations(prev => prev.map(r => Number(r.id) === regId ? { ...r, status: "WITHDRAWN" } : r));
                         setOpenTournaments(prev => prev.map(tourney => ({
                           ...tourney,
                           mappedEvents: tourney.mappedEvents.map(ev => {
                             if (Number(ev.registrationId) === regId || Number(ev.id) === Number(regItem.id) || isEventMatch(regItem as any, ev)) {
                               return {
                                 ...ev,
                                 registrationId: undefined,
                                 action: "Register",
                                 progress: 0,
                                 progressColor: "#e2e8f0",
                               };
                             }
                             return ev;
                           })
                         })));
                         setStats(prev => Array.isArray(prev) ? prev.map(s => s.id === 1 ? { ...s, value: Math.max(0, Number(s.value || 0) - 1) } : s) : prev);
                         try {
                           await sportsService.withdraw(regItem.registrationId);
                           toast.success(`Successfully withdrawn from ${regItem.name}`);
                           await fetchData();
                         } catch (err: any) {
                           toast.error(err?.message || "Failed to withdraw registration");
                           fetchData();
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
            <div className="rounded-xl p-2 sm:p-2.5 mt-2 bg-white border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Closed Registrations</div>
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
                    <div key={t.id} className={`mb-1.5 last:mb-0 animate-fade-in-up stagger-${(tIdx % 8) + 1}`}>
                      <button
                        type="button"
                        onClick={() => setExpandedClosedTournaments(prev => {
                          const next = new Set(prev);
                          if (next.has(t.id)) next.delete(t.id); else next.add(t.id);
                          return next;
                        })}
                        className="w-full flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer text-left group"
                      >
                        <div className="h-7 w-7 rounded-md bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center flex-shrink-0 shadow-2xs">
                          <Trophy className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{t.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5 font-medium">
                            {t.eventDateStart && t.eventDateEnd
                              ? `${format(new Date(t.eventDateStart), "MMM d")} - ${format(new Date(t.eventDateEnd), "MMM d")}`
                              : "Dates TBD"}
                            {" · "}
                            {t.mappedEvents.length} event{t.mappedEvents.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 uppercase tracking-wider">
                            Closed
                          </span>
                          {isExpanded
                            ? <ChevronDown className="w-4 h-4 text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition-colors shrink-0" strokeWidth={2.75} />
                            : <ChevronRight className="w-4 h-4 text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition-colors shrink-0" strokeWidth={2.75} />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="mt-1.5 ml-2 pl-2 border-l-2 border-slate-200 space-y-0">
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
            <div className="rounded-xl p-2 sm:p-2.5 mt-2 bg-white border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Captain Nominations</div>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-600">
                  {canManageCaptainNominations ? `${teamClosedRegs.length} Available` : "Registration Confirmed ✓"}
                </span>
              </div>

              <div className="space-y-2">
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
        <div className="space-y-2 lg:col-span-1">
          {/* Notifications */}
          <div className="rounded-xl p-2 sm:p-2.5 bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-indigo-500" />
                <span>Notifications</span>
              </div>
              {notifications.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                  {notifications.length}
                </span>
              )}
            </div>
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 text-[#f97316] animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <p className="text-[11px] text-center py-2 text-slate-400">No new notifications</p>
              ) : (
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100/80 pr-0.5">
                  {notifications.map((n, i) => (
                    <div key={n.id} className={`flex items-start gap-2 py-1.5 first:pt-0 last:pb-0 animate-fade-in-up stagger-${(i % 8) + 1}`}>
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs flex-shrink-0" style={{ background: n.iconBg, color: n.iconColor }}>
                        {n.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-slate-800 leading-snug line-clamp-2">
                          {n.text}
                        </div>
                        {n.bold && n.bold !== n.text && !n.text.includes(n.bold) && (
                          <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                            {n.bold}
                          </div>
                        )}
                        <div className="text-[9px] sm:text-[10px] mt-0.5 font-medium text-slate-400">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Timer */}
          <NextMatchTimer nextMatch={nextMatch} />

          {/* Season Stats */}
          <div className="rounded-xl p-2 sm:p-2.5 bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Season Stats</span>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 text-[#f97316] animate-spin" />
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
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
                    <div key={k} className="flex justify-between items-center py-1 text-[11px]">
                      <span className="text-slate-500 font-medium">{k}</span>
                      <span className="font-bold text-slate-800 px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100/80 tabular-nums text-[10px] sm:text-[11px]">{v}</span>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* Franchises & Squads Quick Card (Hidden per user request) */}
          {/*
          <div className="rounded-xl p-2.5 sm:p-3 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-md border border-indigo-500/20 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-15 pointer-events-none">
              <Users className="w-16 h-16 text-indigo-400" />
            </div>
            <div className="relative z-10 space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 px-2 py-0.5 rounded-md bg-white/10 inline-block">
                Tournament Hub
              </span>
              <h4 className="text-xs font-bold text-white">Teams & Squad Rosters</h4>
              <p className="text-xs text-indigo-200/80 leading-relaxed">
                Explore franchise owners, captains, purse utilization, and full squad player lists.
              </p>
              <Link
                to="/sports/schedule"
                onClick={() => {
                  // Navigate to schedule and activeTab will be ready
                }}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <span>View All Squads</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
          */}
        </div>

        {/* Tournament Sponsor Showcase Section - Only shown when real sponsors exist */}
        {sponsors.length > 0 && (
          <div className="lg:col-span-4">
            <TournamentSponsorShowcase
              sponsors={sponsors}
              tournamentName={featuredTournamentName || "Community Tournament"}
            />
          </div>
        )}
        {/* Captain Nomination Modal */}
        {isNominateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
              {(() => {
                const targetReg = myRegistrations.find(r => r.id === nominatingRegId);
                const targetPersonName = targetReg?.playerName || user?.fullName || "Player";
                const isTargetSelf = isSelfRelationOrMember(targetReg?.relation, targetReg?.familyMemberId, targetReg?.playerName, user?.fullName);
                const targetRelation = isTargetSelf ? "Self" : (targetReg?.relation || "Family Member");

                return (
                  <>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <Crown className="w-5 h-5 text-amber-500" />
                          {isAdminNomination ? "Appoint Captain" : `Nominate Captain: ${targetPersonName}`}
                        </h3>
                        <p className="text-xs mt-1 text-slate-500">
                          {isAdminNomination
                            ? "Select a confirmed registrant and assign a team name"
                            : `Propose team name for ${targetPersonName} (${targetRelation})`}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setIsNominateModalOpen(false);
                          setIsAdminNomination(false);
                        }}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="nomination-registrant-select" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          {isAdminNomination ? "Select Registrant" : "Nominated Person"}
                        </label>
                        {isAdminNomination ? (
                          <select
                            id="nomination-registrant-select"
                            name="nominationRegistrant"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 text-xs font-semibold"
                            value={selectedRegForNomination || ""}
                            onChange={(e) => setSelectedRegForNomination(Number(e.target.value))}
                          >
                            <option value="">Choose a member...</option>
                            {loadingCaptains ? (
                              <option disabled>Loading members...</option>
                            ) : captainRegs.map(reg => (
                              <option key={reg.id} value={reg.id}>
                                {reg.playerName || reg.user?.fullName} {reg.relation ? `(${reg.relation})` : ""} {reg.captainNomination ? " (Already Nominated)" : ""}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                {isTargetSelf ? "👤" : "👥"}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 truncate">
                                  {targetPersonName}
                                </div>
                                <div className="text-xs text-slate-500 font-medium truncate">
                                  {targetRelation} {targetReg?.event?.name ? `· ${targetReg.event.name}` : ""}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 whitespace-nowrap shrink-0">
                              {isTargetSelf ? "Self" : "Family Member"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label htmlFor="nominate-team-name-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          {isAdminNomination ? "Assigned Team Name" : "Proposed Team Name"}
                        </label>
                        <input
                          id="nominate-team-name-input"
                          name="nominateTeamName"
                          type="text"
                          autoFocus={!isAdminNomination}
                          placeholder={`e.g. ${targetPersonName.split(' ')[0]}'s Warriors`}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all text-xs font-medium"
                          value={nominateTeamName}
                          onChange={(e) => setNominateTeamName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleNominateSubmit()}
                        />
                      </div>

                      <div className="pt-2 flex gap-3">
                        <button
                          onClick={() => {
                            setIsNominateModalOpen(false);
                            setIsAdminNomination(false);
                          }}
                          className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-all border border-slate-200 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleNominateSubmit}
                          disabled={isSubmittingNomination || !nominateTeamName.trim() || (isAdminNomination && !selectedRegForNomination)}
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isSubmittingNomination ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            isAdminNomination ? "Confirm Appointment" : `Nominate ${targetPersonName.split(' ')[0]}`
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── Tournament Details & Rules Modal ── */}
        <TournamentDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          tournament={detailsModalTournament}
          onRegisterEvent={(eventIdOrUuid) => {
            const memberVal = selectedMemberByTournament[detailsModalTournament?.id] ?? (detailsModalTournament?.id ? selectedMemberByTournament[String(detailsModalTournament.id)] : undefined) ?? "self";
            const isSelf = memberVal === "self";
            const memberId = isSelf ? undefined : memberVal;
            handleOpenRegistration(eventIdOrUuid, isSelf ? "self" : "family", memberId);
          }}
          onViewSchedule={(tournamentId) => {
            navigate(`/sports/schedule/${tournamentId}`);
          }}
        />

        {/* ── Mobile Registration Modal Popup ── */}
        {regModalState.open && regModalState.eventUuid && (
          <SportsRegister
            isModal={true}
            eventUuid={regModalState.eventUuid}
            initialFor={regModalState.forType}
            initialMemberId={regModalState.memberId}
            familyMembers={familyMembers}
            onClose={() => setRegModalState({ open: false, forType: "self" })}
            onSuccess={() => {
              setRegModalState({ open: false, forType: "self" });
              fetchData();
            }}
          />
        )}

        {/* ── Your Registrations Modal ── */}
        {activeStatsModal === "registrations" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full p-4 sm:p-6 space-y-4 max-h-[88vh] overflow-hidden flex flex-col text-left">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-[#f97316]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900 m-0 mb-0">
                        Your Registrations
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                        {myRegistrations.filter(r => isActiveRegistrationStatus(r.status)).length} Active ({myRegistrations.length} Total)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 m-0">
                      Sports tournaments & events you and your family are registered for
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStatsModal(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body - Registration List */}
              <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
                {myRegistrations.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-3">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">No active registrations found</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                      You haven't registered for any sports events yet. Browse open registrations below to join!
                    </p>
                  </div>
                ) : (
                  myRegistrations.map((reg) => {
                    const isConfirmed = reg.status === "CONFIRMED";
                    const isPending = reg.status === "PENDING" || reg.status === "REGISTERED";
                    const statusColor = isConfirmed
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : isPending
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-slate-50 text-slate-600 border-slate-200";

                    return (
                      <div
                        key={reg.id}
                        className="p-3 sm:p-3.5 rounded-xl border border-slate-100 hover:border-indigo-100 bg-slate-50/50 hover:bg-white transition-all space-y-2 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold text-slate-900">
                                {reg.event?.name || "Sports Event"}
                              </span>
                              {reg.event?.sport?.name && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  {reg.event.sport.name}
                                </span>
                              )}
                            </div>
                            {reg.category?.name && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                Category: <strong className="text-slate-700">{reg.category.name}</strong>
                              </p>
                            )}
                          </div>

                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase tracking-wider ${statusColor}`}>
                            {reg.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            {reg.playerName && (
                              <span className="text-[10px] font-semibold text-slate-700 inline-flex items-center gap-1">
                                👤 <span>{reg.playerName}</span>
                                {reg.relation && !isSelfRelationOrMember(reg.relation) && (
                                  <span className="text-[10px] text-slate-400">({reg.relation})</span>
                                )}
                              </span>
                            )}
                            {reg.matchType && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                                {reg.matchType.replace(/_/g, " ")}
                              </span>
                            )}
                            {reg.captainNomination && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                👑 {reg.captainConfirmation ? "Confirmed Captain" : "Captain Nominee"}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {["PENDING", "REGISTERED", "CONFIRMED"].includes(String(reg.status || "").toUpperCase().trim()) && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const evName = reg.event?.name || reg.eventName || "this event";
                                  if (!(await confirmAction("Unregister", `Are you sure you want to unregister ${reg.playerName || "yourself"} from ${evName}? You will lose your reserved spot.`))) return;
                                  const regId = Number(reg.id);
                                  if (!isNaN(regId) && regId > 0) {
                                    setWithdrawnRegistrationIds(prev => new Set(prev).add(regId));
                                    setMyRegistrations(prev => prev.map(r => Number(r.id) === regId ? { ...r, status: "WITHDRAWN" } : r));
                                    setOpenTournaments(prev => prev.map(tourney => ({
                                      ...tourney,
                                      mappedEvents: tourney.mappedEvents.map(ev => {
                                        if (Number(ev.registrationId) === regId || Number(ev.id) === Number(reg.eventId) || isEventMatch(reg, ev)) {
                                          return {
                                            ...ev,
                                            registrationId: undefined,
                                            action: "Register",
                                            progress: 0,
                                            progressColor: "#e2e8f0",
                                            rawEvent: {
                                              ...ev.rawEvent,
                                              myRegistrationId: null,
                                              myRegistrationStatus: "WITHDRAWN",
                                            },
                                          };
                                        }
                                        return ev;
                                      })
                                    })));
                                    setStats(prev => Array.isArray(prev) ? prev.map(s => s.id === 1 ? { ...s, value: Math.max(0, Number(s.value || 0) - 1) } : s) : prev);
                                    try {
                                      try {
                                        await sportsService.withdraw(regId);
                                      } catch (withdrawErr: any) {
                                        const msg = String(withdrawErr?.message || withdrawErr?.response?.data?.message || "");
                                        if (canAccessAdminSports && (msg.toLowerCase().includes("started") || msg.toLowerCase().includes("organizer"))) {
                                          await sportsService.rejectRegistration(regId, "Withdrawn by Admin");
                                        } else {
                                          throw withdrawErr;
                                        }
                                      }
                                      toast.success(`Unregistered from ${evName}`);
                                      window.dispatchEvent(new CustomEvent("mana_registrations_updated"));
                                      await fetchData();
                                    } catch (err: any) {
                                      const msg = err?.message || err?.response?.data?.message || "Failed to unregister";
                                      toast.error(msg);
                                      fetchData();
                                    }
                                  }
                                }}
                                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 cursor-pointer transition-colors inline-flex items-center gap-1"
                                title="Unregister from this event"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Unregister</span>
                              </button>
                            )}
                            {canAccessAdminSports && (
                              <Link
                                to="/sports/my-sports"
                                onClick={() => setActiveStatsModal(null)}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1"
                              >
                                Manage →
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-shrink-0">
                {canAccessAdminSports ? (
                  <Link
                    to="/sports/my-sports"
                    onClick={() => setActiveStatsModal(null)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                  >
                    Go to My Sports Dashboard →
                  </Link>
                ) : <span />}
                <button
                  type="button"
                  onClick={() => setActiveStatsModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Live Events Modal ── */}
        {activeStatsModal === "live_events" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full p-4 sm:p-6 space-y-4 max-h-[88vh] overflow-hidden flex flex-col text-left">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900 m-0 mb-0">
                        Live & Running Events
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        {liveEvents.filter(e => e.status === "LIVE").length} Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 m-0">
                      Live sports matches and upcoming event schedules
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStatsModal(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body - Live Events List */}
              <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
                {liveEvents.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-3">
                      <Zap className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">No events running right now</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                      Check the tournaments schedule to see upcoming draws and fixtures.
                    </p>
                  </div>
                ) : (
                  liveEvents.map((ev) => {
                    const isLive = ev.status === "LIVE";
                    return (
                      <div
                        key={ev.id}
                        className={`p-3.5 rounded-xl border transition-all space-y-2 shadow-2xs ${
                          isLive
                            ? "bg-emerald-50/40 border-emerald-200 hover:border-emerald-300"
                            : "bg-slate-50/50 border-slate-100 hover:bg-white hover:border-indigo-100"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-slate-900">{ev.name}</span>
                              {ev.subtitle && (
                                <span className="text-[10px] text-slate-500 font-medium">{ev.subtitle}</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <span>📍 {ev.venue || "Community Arena"}</span>
                              {ev.category && <span>· Category: {ev.category}</span>}
                            </p>
                          </div>

                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase tracking-wider inline-flex items-center gap-1 ${ isLive ? "bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse" : "bg-orange-50 text-[#f97316] border-orange-200" }`}>
                            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />}
                            {ev.statusText || (isLive ? "LIVE NOW" : "UPCOMING")}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs flex-wrap">
                          <div className="text-xs text-slate-500">
                            {ev.statusSub ? `Status: ${ev.statusSub}` : "Scheduled Match"}
                          </div>
                          <Link
                            to="/sports/schedule"
                            onClick={() => setActiveStatsModal(null)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1"
                          >
                            View Draws & Schedule →
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-shrink-0">
                <Link
                  to="/sports/schedule"
                  onClick={() => setActiveStatsModal(null)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                >
                  View Full Schedule & Fixtures →
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveStatsModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Match & Event Fixture Details Modal ── */}
        {activeInfoEvent && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setActiveInfoEvent(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto text-left animate-in zoom-in-95 duration-200 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    {activeInfoEvent.isScheduledMatch ? (
                      <Swords className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Trophy className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 m-0 leading-tight">
                        {activeInfoEvent.isScheduledMatch ? "Match Fixture Details" : "Tournament Event Details"}
                      </h3>
                      {activeInfoEvent.status === "LIVE" ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          LIVE NOW
                        </span>
                      ) : activeInfoEvent.status === "COMPLETED" ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          COMPLETED
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          UPCOMING
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 m-0 line-clamp-1">
                      {activeInfoEvent.subtitle || `${activeInfoEvent.tournamentName || "Tournament"} · ${activeInfoEvent.category || "Match"}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveInfoEvent(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Matchup Versus Card (for scheduled matches) */}
              {activeInfoEvent.isScheduledMatch && (
                <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-slate-50 via-indigo-50/25 to-slate-50 border border-slate-200/90 text-center relative overflow-hidden">
                  <div className="grid grid-cols-11 items-center gap-2">
                    {/* Team / Side A */}
                    <div className="col-span-5 text-left min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Home / Side A</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate" title={activeInfoEvent.teamAName || activeInfoEvent.userSideName || "Team A"}>
                        {activeInfoEvent.teamAName || activeInfoEvent.userSideName || "Team A"}
                      </span>
                      {activeInfoEvent.scoreTeamA != null && (
                        <span className="text-base sm:text-lg font-black text-indigo-700 block mt-0.5">
                          {activeInfoEvent.scoreTeamA}
                        </span>
                      )}
                    </div>

                    {/* VS Badge */}
                    <div className="col-span-1 flex items-center justify-center">
                      <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-extrabold flex items-center justify-center border border-indigo-200 shadow-2xs">
                        VS
                      </span>
                    </div>

                    {/* Team / Side B */}
                    <div className="col-span-5 text-right min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Away / Side B</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate" title={activeInfoEvent.teamBName || activeInfoEvent.opponentSideName || "Team B"}>
                        {activeInfoEvent.teamBName || activeInfoEvent.opponentSideName || "Team B"}
                      </span>
                      {activeInfoEvent.scoreTeamB != null && (
                        <span className="text-base sm:text-lg font-black text-indigo-700 block mt-0.5">
                          {activeInfoEvent.scoreTeamB}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Match / Event Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                {/* Tournament */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1 text-[11px]">
                    <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Tournament</span>
                  </div>
                  <div className="font-bold text-slate-900 line-clamp-1">
                    {activeInfoEvent.tournamentName || "Community Sports Championship"}
                  </div>
                </div>

                {/* Championship / Category */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1 text-[11px]">
                    <Medal className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Championship / Event</span>
                  </div>
                  <div className="font-bold text-slate-900 line-clamp-1">
                    {activeInfoEvent.eventName || activeInfoEvent.category || "Main Draw"}
                  </div>
                </div>

                {/* Fixture Round / Stage */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1 text-[11px]">
                    <Swords className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Round / Stage</span>
                  </div>
                  <div className="font-bold text-slate-900">
                    {activeInfoEvent.roundName || (activeInfoEvent.matchData?.roundName || activeInfoEvent.matchData?.round?.replace(/_/g, " ") || "Fixture Scheduled")}
                    {activeInfoEvent.matchNumber ? ` · Match #${activeInfoEvent.matchNumber}` : ""}
                  </div>
                </div>

                {/* Schedule Date & Time */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Schedule & Timing</span>
                  </div>
                  <div className="font-bold text-slate-900">
                    {activeInfoEvent.targetDate
                      ? format(activeInfoEvent.targetDate, "EEE, MMM d, yyyy · h:mm a")
                      : (activeInfoEvent.statusText || "Fixture Scheduled")}
                  </div>
                  {activeInfoEvent.targetDate && activeInfoEvent.targetDate.getTime() > Date.now() && (
                    <div className="mt-1">
                      <CompactMatchBadge targetDate={activeInfoEvent.targetDate} />
                    </div>
                  )}
                </div>

                {/* Venue & Location */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 sm:col-span-2">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Venue & Court Location</span>
                  </div>
                  <div className="font-bold text-slate-900">
                    {activeInfoEvent.venue || activeInfoEvent.venueName || "Community Sports Arena"}
                  </div>
                  {activeInfoEvent.courtName && (
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Court / Table: <span className="font-semibold text-slate-700">{activeInfoEvent.courtName}</span>
                    </div>
                  )}
                </div>

                {/* Registered Participant */}
                <div className="p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100 sm:col-span-2 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">👤</span>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-indigo-600">Registered Participant</div>
                      <div className="text-xs font-bold text-slate-900">
                        {activeInfoEvent.playerName || user?.fullName || "You"}
                        {activeInfoEvent.relation && !isSelfRelationOrMember(activeInfoEvent.relation) && (
                          <span className="text-slate-500 font-medium ml-1">({activeInfoEvent.relation})</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-indigo-700 border border-indigo-200 shadow-2xs">
                    {activeInfoEvent.isScheduledMatch ? "⚔️ Official Fixture" : "Confirmed Registration"}
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 flex-wrap">
                <Link
                  to="/sports/schedule"
                  onClick={() => setActiveInfoEvent(null)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                >
                  View Tournament Draws & Brackets →
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveInfoEvent(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
