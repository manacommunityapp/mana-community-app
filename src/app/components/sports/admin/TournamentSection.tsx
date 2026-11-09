import { useState, useMemo } from "react";
import { Plus, ClipboardList, Users, Edit2, Trash2, CalendarIcon, Megaphone, ChevronDown, Sparkles, Lock, Share2, Search, X, Filter, Play, AlertTriangle, Download, FileSpreadsheet, FileText, Printer, Loader2, Crown } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { TournamentRegistration, AuctionTeam } from "../../../../types/api";
import { isTeamSport, PREDEFINED_SPORTS } from "../utils/sportsConstants";
import { getEventFormats } from "../SportsRegister";
import { ShareTournamentModal } from "./ShareTournamentModal";
import { ViewPlayersModal } from "./ViewPlayersModal";
import { ViewCaptainsModal } from "./ViewCaptainsModal";
import { getPartnerDetails } from "./sportsPartnerUtils";
import { tournamentPaymentService } from "../../../../services/sports/tournamentPaymentService";
import { TournamentPlayersPaymentModal } from "../TournamentPlayersPaymentModal";
import {
  exportTournamentPaymentsToCSV,
  exportTournamentPaymentsToExcel,
  exportTournamentPaymentsToPDF,
} from "../../../../utils/sportsExportUtils";

interface TournamentSectionProps {
  title: string;
  badge: number;
  badgeColor: string;
  emptyText: string;
  events: any[];
  onEdit: (ev: any) => void;
  onDelete: (id: number) => void;
  onActivate?: (id: number) => void;
  showActivate?: boolean;
  onCloseTournament?: (id: number) => void;
  onCloseEvent?: (id: number) => void;
  onStartEvent?: (id: number, name?: string) => void;
  onStartAllPendingEvents?: (tournamentId: number, eventIds?: number[]) => void;
  onAnnounce?: (id: number, name: string) => void;
  onViewPlayers?: (eventId: number, forceReload?: boolean) => void;
  onViewCaptains?: (eventId: number, forceReload?: boolean) => void;
  onToggleCaptainNomination?: (eventId: number, open: boolean) => Promise<void> | void;
  viewMode?: "players" | "captains";
  viewingEventId?: number | null;
  registrations?: TournamentRegistration[];
  nominatedCaptains?: AuctionTeam[];
  loadingRegs?: boolean;
  onConfirmRegistration?: (regId: number) => void;
  onRejectRegistration?: (regId: number) => void;
  onConfirmCaptain?: (regId: number, confirm: boolean) => void;
  onAddParticipant?: (eventId: number) => void;
  onImportParticipants?: (eventId: number) => void;
  onEditEvent?: (ev: any) => void;
  onDeleteEvent?: (id: number, tournamentId?: number) => void;
  onAddEventToTournament?: (tournamentId: number, tournamentName: string) => void;
}

export interface GroupedPlayerRegistration {
  key: string;
  primary: TournamentRegistration;
  history: TournamentRegistration[];
}

/**
 * Group registrations by participant identity so that multiple registration attempts,
 * re-registrations, or withdrawn history records for the same player are not displayed as duplicate cards.
 * Active registrations take precedence as primary; older/withdrawn attempts are tucked into history.
 */
export function groupRegistrationsByPlayer(regs: TournamentRegistration[]): GroupedPlayerRegistration[] {
  if (!regs || regs.length === 0) return [];

  const getBasePlayerKey = (reg: TournamentRegistration): string => {
    const normName = (reg.playerName || reg.user?.fullName || "").trim().toLowerCase();
    const flat = (reg.flatNumber || "").trim().toLowerCase();
    const phone = (reg.phone || "").trim();
    const relation = (reg.relation || "").trim().toLowerCase();

    if (reg.user?.id) {
      return `u_${reg.user.id}_${normName || relation || "self"}`;
    }
    if (phone) {
      return `p_${phone}_${normName}`;
    }
    if (flat && normName) {
      return `f_${flat}_${normName}`;
    }
    return normName ? `n_${normName}` : `id_${reg.id}`;
  };

  const isActiveStatus = (status: string) =>
    status === "CONFIRMED" || status === "REGISTERED" || status === "PENDING";

  const mapByPlayer = new Map<string, TournamentRegistration[]>();
  for (const reg of regs) {
    const pKey = getBasePlayerKey(reg);
    if (!mapByPlayer.has(pKey)) {
      mapByPlayer.set(pKey, []);
    }
    mapByPlayer.get(pKey)!.push(reg);
  }

  const result: GroupedPlayerRegistration[] = [];

  const STATUS_WEIGHT: Record<string, number> = {
    CONFIRMED: 4,
    REGISTERED: 3,
    PENDING: 2,
    WITHDRAWN: 1,
    REJECTED: 0,
  };

  const sortRegs = (list: TournamentRegistration[]) => {
    return [...list].sort((a, b) => {
      const wA = STATUS_WEIGHT[a.status] ?? -1;
      const wB = STATUS_WEIGHT[b.status] ?? -1;
      if (wA !== wB) return wB - wA;
      const tA = a.registeredAt ? new Date(a.registeredAt).getTime() : 0;
      const tB = b.registeredAt ? new Date(b.registeredAt).getTime() : 0;
      if (tA !== tB) return tB - tA;
      return b.id - a.id;
    });
  };

  for (const [pKey, playerRegs] of mapByPlayer.entries()) {
    if (playerRegs.length === 1) {
      result.push({
        key: `${pKey}_${playerRegs[0].id}`,
        primary: playerRegs[0],
        history: [],
      });
      continue;
    }

    const sorted = sortRegs(playerRegs);
    // Strictly ONE primary card per participant identity.
    // The highest precedence / latest registration is primary,
    // and all other registrations (e.g. earlier PENDING attempts, withdrawals) are placed in history.
    const primary = sorted[0];
    const history = sorted.slice(1);
    result.push({
      key: `${pKey}_${primary.id}`,
      primary,
      history,
    });
  }

  return result;
}

export function getSportName(ev: any): string {
  if (ev?.sport?.name) return ev.sport.name;
  if (ev?.sportName) return ev.sportName;
  const nameLower = (ev?.name || "").toLowerCase();
  for (const ps of PREDEFINED_SPORTS) {
    if (ps.name && nameLower.includes(ps.name.toLowerCase())) {
      return ps.name;
    }
  }
  return "";
}

export function getCategoryName(ev: any): string {
  if (ev?.categoryName) return ev.categoryName;
  if (typeof ev?.category === "string") return ev.category;
  if (ev?.category?.name) return ev.category.name;
  if (Array.isArray(ev?.categories) && ev.categories.length > 0 && ev.categories[0]?.name) {
    return ev.categories[0].name;
  }
  const nameLower = (ev?.name || "").toLowerCase();
  if (nameLower.includes("mixed doubles")) return "Mixed Doubles";
  if (nameLower.includes("women's doubles") || nameLower.includes("womens doubles") || nameLower.includes("women doubles")) return "Women's Doubles";
  if (nameLower.includes("men's doubles") || nameLower.includes("mens doubles") || nameLower.includes("men doubles")) return "Men's Doubles";
  if (nameLower.includes("women's singles") || nameLower.includes("womens singles") || nameLower.includes("women singles")) return "Women's Singles";
  if (nameLower.includes("men's singles") || nameLower.includes("mens singles") || nameLower.includes("men singles")) return "Men's Singles";
  if (nameLower.includes("doubles")) return "Doubles";
  if (nameLower.includes("singles")) return "Singles";
  return "";
}

export function getAgeCategory(ev: any): string {
  if (ev?.ageCategory) return String(ev.ageCategory);
  if (ev?.ageGroup) return String(ev.ageGroup);
  const min = ev?.minAge != null ? Number(ev.minAge) : null;
  const max = ev?.maxAge != null ? Number(ev.maxAge) : null;
  if (min != null || max != null) {
    if ((min == null || min <= 0) && (max == null || max >= 90)) return "Open (All Ages)";
    if ((min == null || min <= 0) && max != null && max < 90) return `Under ${max} (U-${max})`;
    if (min != null && min > 0 && (max == null || max >= 90)) return `${min}+ Yrs`;
    if (min != null && max != null) return `${min}–${max} Yrs`;
  }
  const nameLower = (ev?.name || "").toLowerCase();
  const uMatch = nameLower.match(/\b(?:u-?|under\s*)(\d+)\b/i);
  if (uMatch) return `Under ${uMatch[1]} (U-${uMatch[1]})`;
  const plusMatch = nameLower.match(/\b(\d+)\s*\+/);
  if (plusMatch) return `${plusMatch[1]}+ Yrs`;
  const rangeMatch = nameLower.match(/\b(\d+)\s*[-–]\s*(\d+)\b/);
  if (rangeMatch) return `${rangeMatch[1]}–${rangeMatch[2]} Yrs`;
  if (/\bopen\b/i.test(nameLower)) return "Open (All Ages)";
  return "";
}

export function normalizeEventGender(ev: any): string {
  const raw = ev?.gender || ev?.genderCategory || (Array.isArray(ev?.categories) && ev.categories[0]?.gender) || "";
  const g = String(raw).trim().toUpperCase();
  if (g === "MALE" || g === "MEN" || g === "BOYS") return "MALE";
  if (g === "FEMALE" || g === "WOMEN" || g === "GIRLS") return "FEMALE";
  if (g === "MIXED" || g === "COED" || g === "CO-ED") return "MIXED";
  if (g === "ALL" || g === "OPEN") return "ALL";

  const text = `${ev?.name || ""} ${ev?.categoryName || ""}`.toLowerCase();
  if (/\b(mixed|mix)\b/i.test(text)) return "MIXED";
  if (/\b(womens?|woman|females?|girls?|ladies)\b/i.test(text)) return "FEMALE";
  if (/\b(mens?|man|males?|boys?|gentlemen)\b/i.test(text)) return "MALE";
  return g || "ALL";
}

export function getDisplayEventFormats(ev: any): string[] {
  if (!ev) return [];

  // 1. Explicit formats on event
  const raw = ev?.format || ev?.formats || ev?.eventFormats;
  if (raw) {
    if (Array.isArray(raw)) {
      const list = raw
        .map(f => (typeof f === "object" ? f?.format || f?.formatType || f?.name || f?.value || f?.type || "" : String(f)))
        .map(f => f.trim().toUpperCase())
        .filter(Boolean);
      if (list.length > 0) return Array.from(new Set(list));
    } else if (typeof raw === "string" && raw.trim()) {
      const list = raw
        .split(",")
        .map(f => f.trim().toUpperCase())
        .filter(Boolean);
      if (list.length > 0) return Array.from(new Set(list));
    }
  }

  // 2. Fallback to explicit tournamentType if present
  if (ev?.tournamentType && typeof ev.tournamentType === "string" && ev.tournamentType.trim()) {
    return [ev.tournamentType.trim().toUpperCase()];
  }

  // 3. Fallback to getEventFormats heuristics ONLY if sport or event name is present
  if (ev?.name || ev?.sport?.name || ev?.sportName || ev?.categoryName) {
    try {
      const fmts = getEventFormats(ev);
      if (Array.isArray(fmts) && fmts.length > 0) {
        return Array.from(new Set(fmts.map(f => f.trim().toUpperCase())));
      }
    } catch {}
  }

  return [];
}

export function getFormatBadge(fmt: string): { label: string; color: string } {
  const norm = String(fmt || "").trim().toUpperCase();

  if (norm === "SINGLES" || norm.includes("SINGLE")) {
    return {
      label: "Singles",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }
  if (norm === "MIXED_DOUBLES" || norm === "MIXED" || norm.includes("MIXED")) {
    return {
      label: "Mixed Doubles",
      color: "bg-rose-50 text-rose-700 border-rose-200",
    };
  }
  if (norm === "DOUBLES" || norm.includes("DOUBLE")) {
    return {
      label: "Doubles",
      color: "bg-blue-50 text-blue-700 border-blue-200",
    };
  }
  if (norm === "TEAM" || norm.includes("TEAM") || norm.includes("SQUAD")) {
    return {
      label: "Team Squad",
      color: "bg-purple-50 text-purple-700 border-purple-200",
    };
  }
  if (norm === "INDIVIDUAL") {
    return {
      label: "Individual",
      color: "bg-teal-50 text-teal-700 border-teal-200",
    };
  }
  if (norm === "RELAY") {
    return {
      label: "Relay",
      color: "bg-cyan-50 text-cyan-700 border-cyan-200",
    };
  }
  if (norm === "ROUND_ROBIN") {
    return {
      label: "Round Robin",
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    };
  }
  if (norm === "KNOCKOUT_SINGLE" || norm === "KNOCKOUT") {
    return {
      label: "Knockout",
      color: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }
  if (norm === "KNOCKOUT_DOUBLE") {
    return {
      label: "Double Knockout",
      color: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  const formatted = norm
    .toLowerCase()
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    label: formatted || norm,
    color: "bg-teal-50 text-teal-700 border-teal-200",
  };
}

export function getEventFormatSignature(ev: any): string {
  const fmts = getDisplayEventFormats(ev);
  if (fmts.length > 0) {
    return fmts.sort().join(",");
  }
  return "";
}

/**
 * Generates an event signature combining:
 * 1. Sport
 * 2. Category Template / Name & Age Bracket
 * 3. Gender
 * 4. Participant Formats
 * Used to identify duplicate or parallel division events in a tournament.
 */
export function getEventCategorySignature(ev: any): string {
  const sport = (getSportName(ev) || "").trim().toLowerCase();
  const cat = (getCategoryName(ev) || "").trim().toLowerCase();
  const age = (getAgeCategory(ev) || "").trim().toLowerCase();
  const gender = normalizeEventGender(ev);
  const format = getEventFormatSignature(ev);

  if (!sport && !cat) return "";

  return `${sport}__${cat}__${age}__${gender}__${format}`;
}

export function TournamentSection({
  title, badge, badgeColor, emptyText, events,
  onEdit, onDelete, onActivate, showActivate, onCloseTournament, onCloseEvent, onAnnounce,
  onStartEvent, onStartAllPendingEvents,
  onViewPlayers, onViewCaptains, onToggleCaptainNomination, viewMode = "players",
  viewingEventId, registrations, nominatedCaptains,
  loadingRegs, onConfirmRegistration, onRejectRegistration, onConfirmCaptain,
  onAddParticipant, onImportParticipants, onEditEvent, onDeleteEvent, onAddEventToTournament,
}: TournamentSectionProps) {
  const [expandedTournamentIds, setExpandedTournamentIds] = useState<Record<number, boolean>>({});
  const [shareTournament, setShareTournament] = useState<any | null>(null);
  const [eventFilters, setEventFilters] = useState<Record<number, { sport?: string; category?: string; age?: string; format?: string; search?: string }>>({});
  const [exportDropdownTournamentId, setExportDropdownTournamentId] = useState<number | null>(null);
  const [exportingTournamentId, setExportingTournamentId] = useState<number | null>(null);
  const [paymentModalTournament, setPaymentModalTournament] = useState<any | null>(null);
  const [togglingCaptaincyId, setTogglingCaptaincyId] = useState<number | null>(null);

  const handleTournamentExport = async (
    tournamentItem: any,
    exportFormat: "excel" | "csv-roster" | "csv-events" | "pdf"
  ) => {
    setExportDropdownTournamentId(null);
    setExportingTournamentId(tournamentItem.id);
    try {
      toast.info(`Preparing ${tournamentItem.name} export...`);
      const rawEvents = tournamentItem.sportsEvents || (tournamentItem.events ? tournamentItem.events : []);
      const players = await tournamentPaymentService.loadTournamentPlayers({
        id: tournamentItem.id,
        events: rawEvents,
      });

      if (!players || players.length === 0) {
        toast.warning("No participants registered for this tournament yet.");
        setExportingTournamentId(null);
        return;
      }

      const tName = tournamentItem.name || "Tournament";
      const exportStats = {
        total: players.length,
        flats: new Set(players.map((p) => p.flatNumber).filter(Boolean)).size,
        paid: players.filter((p) => p.paymentStatus === "PAID" || p.paymentStatus === "WAIVED").length,
        unpaid: players.filter((p) => p.paymentStatus !== "PAID" && p.paymentStatus !== "WAIVED").length,
        totalCollected: players.reduce((sum, p) => sum + (p.payment?.amount || 0), 0),
      };

      if (exportFormat === "excel") {
        exportTournamentPaymentsToExcel(players, tName, exportStats);
        toast.success(`Exported ${players.length} participants to Excel`);
      } else if (exportFormat === "csv-roster") {
        exportTournamentPaymentsToCSV(players, tName, "roster");
        toast.success(`Exported ${players.length} participant roster rows to CSV`);
      } else if (exportFormat === "csv-events") {
        exportTournamentPaymentsToCSV(players, tName, "events");
        toast.success(`Exported detailed event registrations to CSV`);
      } else if (exportFormat === "pdf") {
        exportTournamentPaymentsToPDF(players, tName, exportStats);
      }
    } catch (err) {
      console.error("Failed to export tournament:", err);
      toast.error("Failed to export tournament details");
    } finally {
      setExportingTournamentId(null);
    }
  };

  const activeViewingEvent = useMemo(() => {
    if (!viewingEventId) return null;
    for (const item of events) {
      if (item.sportsEvents && Array.isArray(item.sportsEvents)) {
        const found = item.sportsEvents.find((ev: any) => ev.id === viewingEventId);
        if (found) {
          return {
            ...found,
            tournamentName: item.name,
            tournamentId: item.id,
          };
        }
      }
      const singleEv = item.event
        ? { ...item.event, id: item.event.id, name: item.name || item.event.name, tournamentId: item.id }
        : item;
      if (singleEv.id === viewingEventId) {
        return singleEv;
      }
    }
    return { id: viewingEventId, name: "Sports Event" };
  }, [events, viewingEventId]);

  const setTournamentFilter = (tournamentId: number, key: "sport" | "category" | "age" | "format" | "search", value: string) => {
    setEventFilters(prev => ({
      ...prev,
      [tournamentId]: {
        ...(prev[tournamentId] || {}),
        [key]: value,
      }
    }));
  };

  const clearTournamentFilter = (tournamentId: number) => {
    setEventFilters(prev => {
      const copy = { ...prev };
      delete copy[tournamentId];
      return copy;
    });
  };


  const toggleEvents = (tournamentId: number) => {
    setExpandedTournamentIds(prev => ({
      ...prev,
      [tournamentId]: !prev[tournamentId]
    }));
  };

  const hasRegistrationButtons = !!(onViewPlayers || onViewCaptains);

  // ─── Button helpers ───────────────────────────────────────────────────────

  const PlayersBtn = ({ evId, size = "sm" }: { evId: number; size?: "sm" | "xs" }) =>
    onViewPlayers ? (
      <button
        type="button"
        onClick={() => onViewPlayers(evId)}
        className={`${size === "xs" ? "text-xs px-2 py-1" : "text-xs px-2 py-1.5"} rounded${size === "xs" ? "" : "-lg"} transition-colors flex items-center gap-1 cursor-pointer ${
          viewingEventId === evId && viewMode === "players"
            ? "bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30 font-medium"
            : "border border-slate-200 text-slate-500 hover:border-[#3b82f6] hover:text-[#3b82f6]"
        }`}
        title="View Registered Players"
      >
        <ClipboardList className={size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3"} />
        <span>View Players</span>
      </button>
    ) : null;

  const CaptainsBtn = ({ evId, sportName, size = "sm" }: { evId: number; sportName: string; size?: "sm" | "xs" }) => {
    if (!onViewCaptains || !isTeamSport(sportName)) return null;
    return (
      <button
        type="button"
        onClick={() => onViewCaptains(evId)}
        className={`${size === "xs" ? "text-xs px-2 py-1" : "text-xs px-2 py-1.5"} rounded${size === "xs" ? "" : "-lg"} transition-colors flex items-center gap-1 cursor-pointer ${
          viewingEventId === evId && viewMode === "captains"
            ? "bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/30 font-medium"
            : "border border-slate-200 text-slate-500 hover:border-[#f97316] hover:text-[#f97316]"
        }`}
        title="View Nominated Captains"
      >
        <Users className={size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3"} />
        <span>Nominated Captains</span>
      </button>
    );
  };

  const CaptaincyBadge = ({ ev, sportName }: { ev: any; sportName: string }) => {
    const isTeam = isTeamSport(sportName) || getDisplayEventFormats(ev).includes("TEAM");
    if (!isTeam) return null;
    const isOpen = Boolean(ev.captainNominationOpen || (ev as any).rawEvent?.captainNominationOpen);
    return isOpen ? (
      <span
        className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1 shadow-2xs"
        title="Captaincy Nominations are OPEN: Registered players can nominate as captain"
      >
        <Crown className="w-3 h-3 text-amber-600" />
        <span>Captaincy Open</span>
      </span>
    ) : (
      <span
        className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1"
        title="Captaincy Nominations are CLOSED"
      >
        <Lock className="w-2.5 h-2.5 text-slate-400" />
        <span>Captaincy Closed</span>
      </span>
    );
  };

  const CaptaincyToggleBtn = ({
    ev,
    sportName,
    size = "sm",
  }: {
    ev: any;
    sportName: string;
    size?: "sm" | "xs";
  }) => {
    const isTeam = isTeamSport(sportName) || getDisplayEventFormats(ev).includes("TEAM");
    if (!onToggleCaptainNomination || !isTeam) return null;
    const isOpen = Boolean(ev.captainNominationOpen || (ev as any).rawEvent?.captainNominationOpen);
    const isToggling = togglingCaptaincyId === ev.id;

    return (
      <button
        type="button"
        disabled={isToggling}
        onClick={async () => {
          setTogglingCaptaincyId(ev.id);
          try {
            await onToggleCaptainNomination(ev.id, !isOpen);
          } finally {
            setTogglingCaptaincyId(null);
          }
        }}
        className={`${
          size === "xs" ? "text-xs px-2 py-1" : "text-xs px-2 py-1.5"
        } rounded${size === "xs" ? "" : "-lg"} transition-colors flex items-center gap-1 cursor-pointer font-medium ${
          isOpen
            ? "border border-amber-300 bg-amber-50/70 text-amber-700 hover:bg-amber-100/80"
            : "border border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100/80"
        } ${isToggling ? "opacity-60 cursor-not-allowed" : ""}`}
        title={
          isOpen
            ? "Stop accepting captain nominations for this event"
            : "Open captain nominations for registered players"
        }
      >
        {isToggling ? (
          <Loader2 className={size === "xs" ? "w-2.5 h-2.5 animate-spin" : "w-3 h-3 animate-spin"} />
        ) : isOpen ? (
          <Lock className={size === "xs" ? "w-2.5 h-2.5 text-amber-600" : "w-3 h-3 text-amber-600"} />
        ) : (
          <Crown className={size === "xs" ? "w-2.5 h-2.5 text-indigo-600" : "w-3 h-3 text-indigo-600"} />
        )}
        <span>{isOpen ? "Close Captaincy" : "Open Captaincy"}</span>
      </button>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl p-3 sm:p-4"
      style={{
        background: "white",
        border: "1px solid rgba(99, 102, 241, 0.12)",
        boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px",
      }}
    >
      <div className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center justify-between" style={{ color: "#6b7094" }}>
        <span>{title}</span>
        <span className={`px-2 py-0.5 rounded text-[10px] ${badgeColor}`}>{badge}</span>
      </div>
      <div className="space-y-2">
        {events.map(item => {
          // ── Multi-event tournaments (nested sportsEvents array) ──
          if (item.sportsEvents && item.sportsEvents.length > 0) {
            const isExpanded = !!expandedTournamentIds[item.id];
            const allSportsInItem = Array.from(new Set(item.sportsEvents.map((ev: any) => getSportName(ev)).filter(Boolean))).sort() as string[];
            const allCategoriesInItem = Array.from(new Set(item.sportsEvents.map((ev: any) => getCategoryName(ev)).filter(Boolean))).sort() as string[];
            const allAgeCategoriesInItem = Array.from(new Set(item.sportsEvents.map((ev: any) => getAgeCategory(ev)).filter(Boolean))).sort() as string[];
            const allFormatsInItem = Array.from(
              new Set(
                (item.sportsEvents || [])
                  .flatMap((ev: any) => getDisplayEventFormats(ev))
                  .filter(Boolean)
              )
            ).sort() as string[];

            const currentFilter = eventFilters[item.id] || {};
            const selectedSport = currentFilter.sport || "";
            const selectedCategory = currentFilter.category || "";
            const selectedAge = currentFilter.age || "";
            const selectedFormat = currentFilter.format || "";
            const searchQuery = (currentFilter.search || "").toLowerCase().trim();
            const isFilterActive = Boolean(selectedSport || selectedCategory || selectedAge || selectedFormat || searchQuery);

            const filteredSportsEvents = item.sportsEvents.filter((ev: any) => {
              if (selectedSport) {
                const s = getSportName(ev);
                if (!s || s.toLowerCase() !== selectedSport.toLowerCase()) return false;
              }
              if (selectedCategory) {
                const c = getCategoryName(ev);
                const nameLower = (ev.name || "").toLowerCase();
                const targetLower = selectedCategory.toLowerCase();
                const directMatch = c && c.toLowerCase() === targetLower;
                const nameMatch = nameLower.includes(targetLower);
                const arrMatch = Array.isArray(ev.categories) && ev.categories.some((cat: any) => cat?.name?.toLowerCase() === targetLower);
                if (!directMatch && !nameMatch && !arrMatch) return false;
              }
              if (selectedAge) {
                const a = getAgeCategory(ev);
                const nameLower = (ev.name || "").toLowerCase();
                const targetLower = selectedAge.toLowerCase();
                const directMatch = a && a.toLowerCase() === targetLower;
                const nameMatch = nameLower.includes(targetLower);
                if (!directMatch && !nameMatch) return false;
              }
              if (selectedFormat) {
                const evFmts = getDisplayEventFormats(ev);
                if (!evFmts.some(f => f.toUpperCase() === selectedFormat.toUpperCase())) return false;
              }
              if (searchQuery) {
                const nameLower = (ev.name || "").toLowerCase();
                const sLower = getSportName(ev).toLowerCase();
                const cLower = getCategoryName(ev).toLowerCase();
                if (!nameLower.includes(searchQuery) && !sLower.includes(searchQuery) && !cLower.includes(searchQuery)) {
                  return false;
                }
              }
              return true;
            });

            const pendingEventsInItem = (item.sportsEvents || []).filter((e: any) => {
              const st = e.registrationStatus || e.status;
              return st !== "LIVE" && st !== "REGISTRATION_OPEN" && st !== "COMPLETED";
            });
            const pendingFilteredEvents = filteredSportsEvents.filter((e: any) => {
              const st = e.registrationStatus || e.status;
              return st !== "LIVE" && st !== "REGISTRATION_OPEN" && st !== "COMPLETED";
            });

            const signatureCounts: Record<string, number> = {};
            for (const e of item.sportsEvents || []) {
              const sig = getEventCategorySignature(e);
              if (sig) {
                signatureCounts[sig] = (signatureCounts[sig] || 0) + 1;
              }
            }
            const duplicateEventsInItemCount = (item.sportsEvents || []).filter((e: any) => {
              const sig = getEventCategorySignature(e);
              return Boolean(sig && (signatureCounts[sig] || 0) > 1);
            }).length;

            return (
              <div key={item.id} className="p-3 sm:p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-3">
                {/* Tournament header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200">
                  <div className="min-w-0 flex-1 text-left">
                    <h3 className="text-xs font-bold text-slate-800 m-0 mb-0 break-words">{item.name}</h3>
                    <div className="text-xs text-slate-500 m-0 mt-0.5">
                      {item.eventDateStart && item.eventDateEnd
                        ? `${item.eventDateStart} — ${item.eventDateEnd}`
                        : item.createdAt ? `Created: ${format(new Date(item.createdAt), "MMM d")}` : "—"}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {showActivate && onActivate && (
                      <button onClick={() => onActivate(item.id)} className="text-xs px-2.5 py-1.5 bg-green-500/10 text-[#10b981] border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors font-medium cursor-pointer">
                        Open for Registration
                      </button>
                    )}
                    {!showActivate && onStartAllPendingEvents && pendingEventsInItem.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onStartAllPendingEvents(item.id, pendingEventsInItem.map((e: any) => e.id))}
                        className="text-xs px-2.5 py-1.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors font-semibold cursor-pointer flex items-center gap-1 shadow-2xs"
                        title={`Open remaining ${pendingEventsInItem.length} sports event(s) for registration`}
                      >
                        <Play className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                        <span>Open Remaining ({pendingEventsInItem.length})</span>
                      </button>
                    )}
                    {onCloseTournament && (item.registrationStatus === "LIVE" || item.registrationStatus === "REGISTRATION_OPEN" || item.status === "LIVE" || item.status === "REGISTRATION_OPEN") && (
                      <button onClick={() => onCloseTournament(item.id)} className="text-xs px-2.5 py-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 transition-colors font-medium cursor-pointer flex items-center gap-1" title="Close Tournament Registration">
                        <Lock className="w-3 h-3" /> Close Reg
                      </button>
                    )}
                    {onAnnounce && (
                      <button onClick={() => onAnnounce(item.id, item.name)} className="text-xs px-2.5 py-1.5 bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition-colors font-medium cursor-pointer flex items-center gap-1">
                        <Megaphone className="w-3 h-3" /> Announce
                      </button>
                    )}
                    <button
                      onClick={() => toggleEvents(item.id)}
                      className={`text-xs px-2.5 py-1.5 border rounded-lg transition-colors cursor-pointer ${
                        isExpanded
                          ? "bg-indigo-50 border-indigo-200 text-indigo-600 font-semibold"
                          : "border-slate-200 text-slate-500 hover:border-indigo-500 hover:text-indigo-600"
                      }`}
                    >
                      Events ({item.sportsEvents.length})
                      {isExpanded && isFilterActive && (
                        <span className="ml-1.5 px-1.5 py-0.2 bg-indigo-600 text-white text-[10px] rounded-full font-bold">
                          {filteredSportsEvents.length}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShareTournament(item)}
                      className="text-xs px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition-colors font-semibold cursor-pointer flex items-center gap-1 shadow-sm"
                      title="Share Complete Tournament (Multi-Sport Registration Form)"
                    >
                      <Share2 className="w-3 h-3" /> Share Form
                    </button>

                    {/* Complete Tournament Export Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setExportDropdownTournamentId(
                            exportDropdownTournamentId === item.id ? null : item.id
                          )
                        }
                        disabled={exportingTournamentId === item.id}
                        className="text-xs px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors font-semibold cursor-pointer flex items-center gap-1 shadow-2xs disabled:opacity-50"
                        title="Export complete tournament player roster, events & payment details"
                      >
                        {exportingTournamentId === item.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                        ) : (
                          <Download className="w-3 h-3 text-emerald-600" />
                        )}
                        <span>Export</span>
                        <ChevronDown className="w-3 h-3 text-emerald-600" />
                      </button>

                      {exportDropdownTournamentId === item.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setExportDropdownTournamentId(null)}
                          />
                          <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 text-left text-xs divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              Export Complete Tournament
                            </div>
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={() => handleTournamentExport(item, "excel")}
                                className="w-full px-3 py-2 text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800 flex items-start gap-2.5 cursor-pointer transition-colors"
                              >
                                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-bold text-slate-800">Download Excel (.xls)</div>
                                  <div className="text-[10px] text-slate-400">Complete multi-sport roster &amp; payments</div>
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTournamentExport(item, "csv-roster")}
                                className="w-full px-3 py-2 text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-700 flex items-start gap-2.5 cursor-pointer transition-colors"
                              >
                                <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-bold text-slate-800">Download CSV — Player Summary</div>
                                  <div className="text-[10px] text-slate-400">1 row per participant with all payment info</div>
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTournamentExport(item, "csv-events")}
                                className="w-full px-3 py-2 text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-700 flex items-start gap-2.5 cursor-pointer transition-colors"
                              >
                                <FileText className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-bold text-slate-800">Download CSV — Event Breakdown</div>
                                  <div className="text-[10px] text-slate-400">1 row per event registration &amp; partner</div>
                                </div>
                              </button>
                            </div>
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={() => handleTournamentExport(item, "pdf")}
                                className="w-full px-3 py-2 text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-700 flex items-start gap-2.5 cursor-pointer transition-colors"
                              >
                                <Printer className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-bold text-slate-800">Print / Save PDF Roster</div>
                                  <div className="text-[10px] text-slate-400">Printable sheet with summary stats</div>
                                </div>
                              </button>
                            </div>
                            <div className="p-1.5 bg-slate-50">
                              <button
                                type="button"
                                onClick={() => {
                                  setExportDropdownTournamentId(null);
                                  setPaymentModalTournament(item);
                                }}
                                className="w-full px-2 py-1.5 text-center text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Users className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Open Roster &amp; Payment Hub</span>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    {onAddEventToTournament && (
                      <button
                        type="button"
                        onClick={() => onAddEventToTournament(item.id, item.name)}
                        className="text-xs px-2.5 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors font-medium cursor-pointer flex items-center gap-1"
                        title="Add Event to Tournament"
                      >
                        <Plus className="w-3 h-3" /> Add Event
                      </button>
                    )}
                    <button onClick={() => onEdit(item)} className="text-xs px-2.5 py-1.5 border border-slate-200 text-slate-500 rounded-lg hover:border-[#f97316] hover:text-[#f97316] transition-colors cursor-pointer">
                      Edit
                    </button>
                    <button onClick={() => onDelete(item.id)} className="text-xs px-2.5 py-1.5 border border-slate-200 text-[#ef4444]/60 rounded-lg hover:border-[#ef4444] hover:text-[#ef4444] transition-colors cursor-pointer">
                      Delete
                    </button>
                  </div>
                </div>

                {/* Nested sports events */}
                {isExpanded && (
                  <div className="space-y-3 pl-2 sm:pl-3.5 border-l-2 border-slate-200 mt-2">
                    {/* Filter bar for nested events */}
                    <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-2.5 sm:p-3 mb-2 space-y-2.5 shadow-2xs">
                      {/* Top Header Row: Filter title + active indicator on left, Clear button + Showing count on right */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Filter className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Filter Events</span>
                          {isFilterActive && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded-full font-bold">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {isFilterActive && (
                            <button
                              type="button"
                              onClick={() => clearTournamentFilter(item.id)}
                              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer border border-indigo-200 bg-white flex items-center gap-1 shadow-2xs"
                              title="Clear all filters"
                            >
                              <X className="w-3 h-3" />
                              <span>Clear</span>
                            </button>
                          )}
                          <div className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs shrink-0">
                            Showing <span className="font-bold text-slate-700">{filteredSportsEvents.length}</span> of {item.sportsEvents.length}
                          </div>
                        </div>
                      </div>

                      {/* Dropdowns & Search Input: 2-column balanced flex on mobile, inline on desktop */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Sports filter dropdown */}
                        {allSportsInItem.length > 0 && (
                          <div className="relative flex-1 min-w-[135px] sm:min-w-[130px] sm:flex-none">
                            <select
                              value={selectedSport}
                              onChange={(e) => setTournamentFilter(item.id, "sport", e.target.value)}
                              className="w-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-2xs truncate"
                              aria-label="Filter by sport"
                            >
                              <option value="">All Sports ({allSportsInItem.length})</option>
                              {allSportsInItem.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Category filter dropdown */}
                        {allCategoriesInItem.length > 0 && (
                          <div className="relative flex-1 min-w-[135px] sm:min-w-[135px] sm:flex-none">
                            <select
                              value={selectedCategory}
                              onChange={(e) => setTournamentFilter(item.id, "category", e.target.value)}
                              className="w-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-2xs truncate"
                              aria-label="Filter by category"
                            >
                              <option value="">All Categories ({allCategoriesInItem.length})</option>
                              {allCategoriesInItem.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Age category dropdown if present */}
                        {allAgeCategoriesInItem.length > 0 && (
                          <div className="relative flex-1 min-w-[135px] sm:min-w-[130px] sm:flex-none">
                            <select
                              value={selectedAge}
                              onChange={(e) => setTournamentFilter(item.id, "age", e.target.value)}
                              className="w-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-2xs truncate"
                              aria-label="Filter by age"
                            >
                              <option value="">All Ages ({allAgeCategoriesInItem.length})</option>
                              {allAgeCategoriesInItem.map((a) => (
                                <option key={a} value={a}>{a}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Participant Format filter dropdown if present */}
                        {allFormatsInItem.length > 0 && (
                          <div className="relative flex-1 min-w-[135px] sm:min-w-[130px] sm:flex-none">
                            <select
                              value={selectedFormat}
                              onChange={(e) => setTournamentFilter(item.id, "format", e.target.value)}
                              className="w-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-2xs truncate"
                              aria-label="Filter by participant format"
                            >
                              <option value="">All Formats ({allFormatsInItem.length})</option>
                              {allFormatsInItem.map((f) => (
                                <option key={f} value={f}>{getFormatBadge(f).label}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Quick Search Input: full width on mobile for easy tapping, compact on desktop */}
                        <div className="relative w-full sm:w-auto sm:min-w-[140px] sm:max-w-[200px] sm:flex-1">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={currentFilter.search || ""}
                            onChange={(e) => setTournamentFilter(item.id, "search", e.target.value)}
                            placeholder="Search event name, sport..."
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-7 pr-7 py-1.5 text-slate-700 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                          />
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => setTournamentFilter(item.id, "search", "")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                              aria-label="Clear search input"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bottom Action & Alerts Bar: neatly separated on mobile */}
                      {(pendingEventsInItem.length > 0 || duplicateEventsInItemCount > 0) && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
                          <div className="flex items-center gap-2">
                            {duplicateEventsInItemCount > 0 && (
                              <span
                                className="text-[10px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs self-start"
                                title={`${duplicateEventsInItemCount} sports events in this tournament share the same Sport, Category, Gender, and Format with another event`}
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>{duplicateEventsInItemCount} Duplicate Categories</span>
                              </span>
                            )}
                          </div>

                          {onStartAllPendingEvents && pendingEventsInItem.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const targetIds = isFilterActive && pendingFilteredEvents.length > 0
                                  ? pendingFilteredEvents.map((e: any) => e.id)
                                  : pendingEventsInItem.map((e: any) => e.id);
                                onStartAllPendingEvents(item.id, targetIds);
                              }}
                              className="w-full sm:w-auto justify-center text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-emerald-300 flex items-center gap-1.5 shadow-2xs"
                              title={`Start registration for ${isFilterActive && pendingFilteredEvents.length > 0 ? `${pendingFilteredEvents.length} filtered pending event(s)` : `${pendingEventsInItem.length} pending event(s)`}`}
                            >
                              <Play className="w-3 h-3 fill-emerald-600 text-emerald-600 shrink-0" />
                              <span>
                                {isFilterActive && pendingFilteredEvents.length > 0 && pendingFilteredEvents.length !== pendingEventsInItem.length
                                  ? `Start Filtered (${pendingFilteredEvents.length})`
                                  : `Start All Pending (${pendingEventsInItem.length})`}
                              </span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {filteredSportsEvents.length === 0 ? (
                      <div className="text-center py-6 px-4 bg-white rounded-lg border border-dashed border-slate-200">
                        <div className="text-xs font-bold text-slate-700 mb-1">No events match the selected filters</div>
                        <p className="text-[11px] text-slate-500 mb-2">Try adjusting your sport or category selection.</p>
                        <button
                          type="button"
                          onClick={() => clearTournamentFilter(item.id)}
                          className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                        >
                          Reset filters
                        </button>
                      </div>
                    ) : (
                      filteredSportsEvents.map((ev: any) => {
                        const registrationStatus = ev.registrationStatus || ev.status;
                        const evSport = getSportName(ev);
                        const evCat = getCategoryName(ev);
                        const evAge = getAgeCategory(ev);
                        const evFormats = getDisplayEventFormats(ev);
                        const sig = getEventCategorySignature(ev);
                        const isDuplicateCategory = Boolean(sig && (signatureCounts[sig] || 0) > 1);
                        const duplicateCount = sig ? signatureCounts[sig] || 0 : 0;

                        return (
                          <div key={ev.id} className="space-y-2">
                            <div
                              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg transition-all ${
                                isDuplicateCategory
                                  ? "bg-amber-50/70 border-2 border-amber-400/80 shadow-xs ring-1 ring-amber-300/40"
                                  : "bg-white border border-slate-200/60 shadow-sm"
                              }`}
                            >
                              <div className="min-w-0 flex-1 text-left">
                                <div className="text-xs font-semibold text-slate-800 break-words flex flex-wrap items-center gap-1.5">
                                  <span>{ev.name}</span>
                                  {evSport && (
                                    <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.2 rounded font-bold uppercase tracking-wide">
                                      {evSport}
                                    </span>
                                  )}
                                  {evCat && (
                                    <span className="text-[10px] bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-0.2 rounded font-bold tracking-wide">
                                      {evCat}
                                    </span>
                                  )}
                                  {evAge && (
                                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-bold tracking-wide">
                                      {evAge}
                                    </span>
                                  )}
                                  {evFormats.map((fmt) => {
                                    const badge = getFormatBadge(fmt);
                                    return (
                                      <span
                                        key={fmt}
                                        className={`text-[10px] border px-1.5 py-0.2 rounded font-bold tracking-wide shadow-2xs ${badge.color}`}
                                        title={`Participant Format: ${badge.label}`}
                                      >
                                        {badge.label}
                                      </span>
                                    );
                                  })}
                                  {isDuplicateCategory && (
                                    <span
                                      className="text-[10px] bg-amber-500 text-white font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-2xs tracking-wide"
                                      title={`Duplicate Category: ${duplicateCount} events in this tournament share the same Sport (${evSport || "—"}), Category (${evCat || "—"}), Gender (${ev.gender || "ALL"}), and Format`}
                                    >
                                      <AlertTriangle className="w-3 h-3 text-white shrink-0" />
                                      <span>Duplicate Category ({duplicateCount})</span>
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                  {ev.gender && <span>Gender: {ev.gender}</span>}
                                  {ev.minAge && ev.maxAge && <span>Age: {ev.minAge}–{ev.maxAge}</span>}
                                  {evFormats.length > 0 && (
                                    <span>
                                      Format: <span className="font-semibold text-slate-700">{evFormats.map(f => getFormatBadge(f).label).join(", ")}</span>
                                    </span>
                                  )}
                                  {ev.maxParticipants && <span>Max Participants: {ev.maxParticipants}</span>}
                                  {isDuplicateCategory && (
                                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/90 border border-amber-200/80 px-1.5 py-0.2 rounded">
                                      Matches another event with identical Sport, Category, Gender & Format
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                {registrationStatus === "LIVE" || registrationStatus === "REGISTRATION_OPEN" ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    REGISTRATION_OPEN
                                  </span>
                                ) : registrationStatus === "DRAFT" || !registrationStatus ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                    DRAFT
                                  </span>
                                ) : registrationStatus === "REGISTRATION_CLOSED" ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    REGISTRATION_CLOSED
                                  </span>
                                ) : registrationStatus === "COMPLETED" ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    COMPLETED
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                    {registrationStatus}
                                  </span>
                                )}
                                <CaptaincyBadge ev={ev} sportName={evSport || ""} />
                              {onEditEvent && (
                                <button
                                  type="button"
                                  onClick={() => onEditEvent({
                                    ...ev,
                                    tournament: item,
                                    tournamentId: item.id,
                                    tournamentName: item.name,
                                  })}
                                  className="text-xs px-2 py-1 border border-slate-200 text-slate-500 rounded hover:border-[#f97316] hover:text-[#f97316] transition-colors cursor-pointer flex items-center gap-1 font-medium bg-transparent"
                                  title="Edit Event"
                                >
                                  <Edit2 className="w-2.5 h-2.5" /> Edit
                                </button>
                              )}
                              {onCloseEvent && (registrationStatus === "LIVE" || registrationStatus === "REGISTRATION_OPEN") && (
                                <button
                                  type="button"
                                  onClick={() => onCloseEvent(ev.id)}
                                  className="text-xs px-2 py-1 border border-amber-200 text-amber-600 rounded hover:border-amber-400 hover:bg-amber-50/50 transition-colors cursor-pointer flex items-center gap-1 font-medium bg-transparent"
                                  title="Close Event Registration"
                                >
                                  <Lock className="w-2.5 h-2.5" /> Close
                                </button>
                              )}
                              {onStartEvent && registrationStatus !== "LIVE" && registrationStatus !== "REGISTRATION_OPEN" && registrationStatus !== "COMPLETED" && (
                                <button
                                  type="button"
                                  onClick={() => onStartEvent(ev.id, ev.name)}
                                  className="text-xs px-2 py-1 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer flex items-center gap-1 font-medium bg-white shadow-2xs"
                                  title={registrationStatus === "REGISTRATION_CLOSED" ? "Re-open Event Registration" : "Start Event Registration"}
                                >
                                  <Play className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
                                  <span>{registrationStatus === "REGISTRATION_CLOSED" ? "Re-open" : "Start Reg"}</span>
                                </button>
                              )}
                              {onDeleteEvent && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteEvent(ev.id, item.id)}
                                  className="text-xs px-2 py-1 border border-slate-200 text-[#ef4444]/70 rounded hover:border-[#ef4444] hover:text-[#ef4444] hover:bg-red-50/50 transition-colors cursor-pointer flex items-center gap-1 font-medium bg-transparent"
                                  title="Delete Event"
                                >
                                  <Trash2 className="w-2.5 h-2.5" /> Delete
                                </button>
                              )}
                              {hasRegistrationButtons && (
                                <>
                                  <PlayersBtn evId={ev.id} size="xs" />
                                  <CaptainsBtn evId={ev.id} sportName={ev.sport?.name || ""} size="xs" />
                                  <CaptaincyToggleBtn ev={ev} sportName={ev.sport?.name || ""} size="xs" />
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }))}
                  </div>
                )}
              </div>
            );
          }

          // ── Single-event / fallback ──
          const ev = item.event
            ? { ...item.event, id: item.event.id, name: item.name || item.event.name, tournamentId: item.id }
            : item;
          const targetId = ev.tournamentId || ev.id;
          const registrationStatus = ev.registrationStatus || ev.status;
          const evFallbackFormats = getDisplayEventFormats(ev);

          return (
            <div key={item.id} className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/60 shadow-sm">
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-sm font-semibold text-slate-800 break-words flex flex-wrap items-center gap-1.5">
                    <span>{ev.name}</span>
                    {evFallbackFormats.map((fmt) => {
                      const badge = getFormatBadge(fmt);
                      return (
                        <span
                          key={fmt}
                          className={`text-[10px] border px-1.5 py-0.2 rounded font-bold tracking-wide shadow-2xs ${badge.color}`}
                          title={`Participant Format: ${badge.label}`}
                        >
                          {badge.label}
                        </span>
                      );
                    })}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span>
                      {ev.eventDateStart && ev.eventDateEnd
                        ? `${ev.eventDateStart} — ${ev.eventDateEnd}`
                        : item.createdAt ? `Created: ${format(new Date(item.createdAt), "MMM d")}` : "—"}
                    </span>
                    {evFallbackFormats.length > 0 && (
                      <span>
                        Format: <span className="font-semibold text-slate-700">{evFallbackFormats.map(f => getFormatBadge(f).label).join(", ")}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {registrationStatus && registrationStatus !== "DRAFT" && (
                    <span className={`text-[10px] px-2 py-1 rounded ${ registrationStatus === "LIVE" || registrationStatus === "REGISTRATION_OPEN" ? "bg-green-500/20 text-[#10b981]" : registrationStatus === "COMPLETED" ? "bg-blue-500/20 text-[#3b82f6]" : "bg-[#f97316]/20 text-[#f97316]" }`}>
                      {registrationStatus}
                    </span>
                  )}
                  <CaptaincyBadge ev={ev} sportName={ev.sport?.name || ""} />
                  {hasRegistrationButtons && (
                    <>
                      <PlayersBtn evId={ev.id} />
                      <CaptainsBtn evId={ev.id} sportName={ev.sport?.name || ""} />
                      <CaptaincyToggleBtn ev={ev} sportName={ev.sport?.name || ""} />
                    </>
                  )}
                  {showActivate && onActivate && (
                    <button onClick={() => onActivate(targetId)} className="text-xs px-2.5 py-1.5 bg-green-500/10 text-[#10b981] border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors font-medium cursor-pointer">
                      Open for Registration
                    </button>
                  )}
                  {onCloseTournament && (registrationStatus === "LIVE" || registrationStatus === "REGISTRATION_OPEN") && (
                    <button onClick={() => onCloseTournament(targetId)} className="text-xs px-2.5 py-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 transition-colors font-medium cursor-pointer flex items-center gap-1" title="Close Tournament Registration">
                      <Lock className="w-3 h-3" /> Close Reg
                    </button>
                  )}
                  {onAnnounce && (
                    <button onClick={() => onAnnounce(targetId, ev.name)} className="text-xs px-2.5 py-1.5 bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition-colors font-medium cursor-pointer flex items-center gap-1">
                      <Megaphone className="w-3 h-3" /> Announce
                    </button>
                  )}
                  {onAddEventToTournament && (
                    <button
                      type="button"
                      onClick={() => onAddEventToTournament(item.id, item.name)}
                      className="text-xs px-2.5 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors font-medium cursor-pointer flex items-center gap-1"
                      title="Add Event to Tournament"
                    >
                      <Plus className="w-3 h-3" /> Add Event
                    </button>
                  )}
                  <button onClick={() => onEdit(item)} className="text-xs px-2.5 py-1.5 border border-slate-200 text-slate-500 rounded-lg hover:border-[#f97316] hover:text-[#f97316] transition-colors cursor-pointer">
                    Edit
                  </button>
                  <button onClick={() => onDelete(targetId)} className="text-xs px-2.5 py-1.5 border border-slate-200 text-[#ef4444]/60 rounded-lg hover:border-[#ef4444] hover:text-[#ef4444] transition-colors cursor-pointer">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {events.length === 0 && (
          <div className="text-center py-6 text-xs text-[#475569] italic">{emptyText}</div>
        )}
      </div>

      {shareTournament && (
        <ShareTournamentModal
          isOpen={!!shareTournament}
          onClose={() => setShareTournament(null)}
          tournament={shareTournament}
        />
      )}

      {paymentModalTournament && (
        <TournamentPlayersPaymentModal
          isOpen={!!paymentModalTournament}
          onClose={() => setPaymentModalTournament(null)}
          tournament={{
            id: paymentModalTournament.id,
            name: paymentModalTournament.name,
            events: paymentModalTournament.sportsEvents || paymentModalTournament.events || [],
          } as any}
        />
      )}

      {viewMode === "players" && viewingEventId && activeViewingEvent && (
        <ViewPlayersModal
          isOpen={!!(viewMode === "players" && viewingEventId)}
          onClose={() => viewingEventId && onViewPlayers?.(viewingEventId)}
          event={activeViewingEvent}
          registrations={registrations}
          loadingRegs={loadingRegs}
          onConfirmRegistration={onConfirmRegistration}
          onRejectRegistration={onRejectRegistration}
          onAddParticipant={onAddParticipant}
          onImportParticipants={onImportParticipants}
          onRefresh={() => onViewPlayers?.(viewingEventId, true)}
        />
      )}

      {viewMode === "captains" && viewingEventId && activeViewingEvent && (
        <ViewCaptainsModal
          isOpen={!!(viewMode === "captains" && viewingEventId)}
          onClose={() => viewingEventId && onViewCaptains?.(viewingEventId)}
          event={activeViewingEvent}
          nominatedCaptains={nominatedCaptains}
          loadingCaptains={loadingRegs}
          onConfirmCaptain={(teamId) => onConfirmCaptain?.(teamId, true)}
          onRefresh={() => onViewCaptains?.(viewingEventId, true)}
          onToggleNomination={(evId, open) => {
            onToggleCaptainNomination?.(evId, open);
          }}
        />
      )}
    </div>
  );
}
