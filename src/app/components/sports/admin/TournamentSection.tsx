import { useState, useMemo } from "react";
import { Loader2, Plus, ClipboardList, Users, Edit2, Trash2, CalendarIcon, CheckCircle2, XCircle, Megaphone, Download, FileSpreadsheet, FileText, Printer, ChevronDown, Sparkles, Lock, Share2, Search, X, Filter, History } from "lucide-react";
import { format } from "date-fns";
import type { TournamentRegistration, AuctionTeam } from "../../../../types/api";
import { isTeamSport, PREDEFINED_SPORTS } from "../utils/sportsConstants";
import { sportsRankingService } from "../../../../services/sports/sportsRankingService";
import { sportsService } from "../../../../services/sports/sportsService";
import { showError, showSuccess } from "../../../../utils/ToastUtils";
import { exportPlayersToCSV, exportPlayersToExcel, exportPlayersToPDF } from "../../../../utils/sportsExportUtils";
import { ExternalFormsManager } from "./external-forms/ExternalFormsManager";
import { ShareTournamentModal } from "./ShareTournamentModal";

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
  onAnnounce?: (id: number, name: string) => void;
  onViewPlayers?: (eventId: number) => void;
  onViewCaptains?: (eventId: number) => void;
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

export function TournamentSection({
  title, badge, badgeColor, emptyText, events,
  onEdit, onDelete, onActivate, showActivate, onCloseTournament, onCloseEvent, onAnnounce,
  onViewPlayers, onViewCaptains, viewMode = "players",
  viewingEventId, registrations, nominatedCaptains,
  loadingRegs, onConfirmRegistration, onRejectRegistration, onConfirmCaptain,
  onAddParticipant, onImportParticipants, onEditEvent, onDeleteEvent, onAddEventToTournament,
}: TournamentSectionProps) {
  const [expandedTournamentIds, setExpandedTournamentIds] = useState<Record<number, boolean>>({});
  const [seedDrafts, setSeedDrafts] = useState<Record<number, string>>({});
  const [savingSeeds, setSavingSeeds] = useState<Record<number, boolean>>({});
  const [exportDropdownEventId, setExportDropdownEventId] = useState<number | null>(null);
  const [showExternalFormsEventId, setShowExternalFormsEventId] = useState<number | null>(null);
  const [shareTournament, setShareTournament] = useState<any | null>(null);
  const [eventFilters, setEventFilters] = useState<Record<number, { sport?: string; category?: string; age?: string; search?: string }>>({});
  const [expandedHistoryKeys, setExpandedHistoryKeys] = useState<Record<string, boolean>>({});
  const [lazyHistoryMap, setLazyHistoryMap] = useState<Record<number, TournamentRegistration[]>>({});
  const [loadingHistoryMap, setLoadingHistoryMap] = useState<Record<number, boolean>>({});

  const handleToggleHistory = async (
    groupKey: string,
    eventId: number,
    primaryRegId: number,
    localHistory: TournamentRegistration[]
  ) => {
    const isCurrentlyExpanded = !!expandedHistoryKeys[groupKey];
    if (isCurrentlyExpanded) {
      setExpandedHistoryKeys(prev => ({ ...prev, [groupKey]: false }));
      return;
    }

    setExpandedHistoryKeys(prev => ({ ...prev, [groupKey]: true }));

    // If already loaded or fetched, no need to re-fetch
    if (lazyHistoryMap[primaryRegId]) {
      return;
    }

    // Attempt lazy loading from backend endpoint
    setLoadingHistoryMap(prev => ({ ...prev, [primaryRegId]: true }));
    try {
      const fetched = await sportsService.getRegistrationHistory(eventId, primaryRegId);
      if (fetched && Array.isArray(fetched) && fetched.length > 0) {
        setLazyHistoryMap(prev => ({ ...prev, [primaryRegId]: fetched }));
      } else {
        setLazyHistoryMap(prev => ({ ...prev, [primaryRegId]: localHistory }));
      }
    } catch {
      // Graceful fallback to client-grouped history if network or older backend
      setLazyHistoryMap(prev => ({ ...prev, [primaryRegId]: localHistory }));
    } finally {
      setLoadingHistoryMap(prev => ({ ...prev, [primaryRegId]: false }));
    }
  };

  const groupedRegistrations = useMemo(() => {
    return groupRegistrationsByPlayer(registrations || []);
  }, [registrations]);

  const setTournamentFilter = (tournamentId: number, key: "sport" | "category" | "age" | "search", value: string) => {
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

  const getSportName = (ev: any): string => {
    if (ev.sport?.name) return ev.sport.name;
    if (ev.sportName) return ev.sportName;
    const nameLower = (ev.name || "").toLowerCase();
    for (const ps of PREDEFINED_SPORTS) {
      if (ps.name && nameLower.includes(ps.name.toLowerCase())) {
        return ps.name;
      }
    }
    return "";
  };

  const getCategoryName = (ev: any): string => {
    if (ev.categoryName) return ev.categoryName;
    if (typeof ev.category === "string") return ev.category;
    if (ev.category?.name) return ev.category.name;
    if (Array.isArray(ev.categories) && ev.categories.length > 0 && ev.categories[0]?.name) {
      return ev.categories[0].name;
    }
    const nameLower = (ev.name || "").toLowerCase();
    if (nameLower.includes("mixed doubles")) return "Mixed Doubles";
    if (nameLower.includes("women's doubles") || nameLower.includes("womens doubles") || nameLower.includes("women doubles")) return "Women's Doubles";
    if (nameLower.includes("men's doubles") || nameLower.includes("mens doubles") || nameLower.includes("men doubles")) return "Men's Doubles";
    if (nameLower.includes("women's singles") || nameLower.includes("womens singles") || nameLower.includes("women singles")) return "Women's Singles";
    if (nameLower.includes("men's singles") || nameLower.includes("mens singles") || nameLower.includes("men singles")) return "Men's Singles";
    if (nameLower.includes("doubles")) return "Doubles";
    if (nameLower.includes("singles")) return "Singles";
    return "";
  };

  const getAgeCategory = (ev: any): string => {
    if (ev.ageCategory) return String(ev.ageCategory);
    if (ev.ageGroup) return String(ev.ageGroup);
    const min = ev.minAge != null ? Number(ev.minAge) : null;
    const max = ev.maxAge != null ? Number(ev.maxAge) : null;
    if (min != null || max != null) {
      if ((min == null || min <= 0) && (max == null || max >= 90)) return "Open (All Ages)";
      if ((min == null || min <= 0) && max != null && max < 90) return `Under ${max} (U-${max})`;
      if (min != null && min > 0 && (max == null || max >= 90)) return `${min}+ Yrs`;
      if (min != null && max != null) return `${min}–${max} Yrs`;
    }
    const nameLower = (ev.name || "").toLowerCase();
    const uMatch = nameLower.match(/\b(?:u-?|under\s*)(\d+)\b/i);
    if (uMatch) return `Under ${uMatch[1]} (U-${uMatch[1]})`;
    const plusMatch = nameLower.match(/\b(\d+)\s*\+/);
    if (plusMatch) return `${plusMatch[1]}+ Yrs`;
    const rangeMatch = nameLower.match(/\b(\d+)\s*[-–]\s*(\d+)\b/);
    if (rangeMatch) return `${rangeMatch[1]}–${rangeMatch[2]} Yrs`;
    if (/\bopen\b/i.test(nameLower)) return "Open (All Ages)";
    return "";
  };

  async function handleSeedSave(regId: number) {
    const raw = seedDrafts[regId];
    if (raw === undefined) return;
    const seed = raw === "" ? null : Number(raw);
    if (raw !== "" && (isNaN(seed!) || seed! < 1)) return;
    setSavingSeeds(prev => ({ ...prev, [regId]: true }));
    try {
      await sportsRankingService.setRegistrationSeed(regId, seed);
      showSuccess("Seed updated");
    } catch {
      showError("Failed to update seed");
    } finally {
      setSavingSeeds(prev => ({ ...prev, [regId]: false }));
    }
  }

  const toggleEvents = (tournamentId: number) => {
    setExpandedTournamentIds(prev => ({
      ...prev,
      [tournamentId]: !prev[tournamentId]
    }));
  };

  const hasRegistrationButtons = !!(onViewPlayers || onViewCaptains);

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING":    return "bg-[#eab308]/20 text-[#eab308]";
      case "REGISTERED": return "bg-[#f97316]/20 text-[#f97316]";
      case "CONFIRMED":  return "bg-[#10b981]/20 text-[#10b981]";
      case "WITHDRAWN":  return "bg-[#ef4444]/20 text-[#ef4444]";
      case "REJECTED":   return "bg-[#ef4444]/20 text-[#ef4444]";
      default:           return "bg-[#475569]/20 text-[#94a3b8]";
    }
  };

  const renderRegistrationPanel = (ev: any) => (
    <div className="mt-2 bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 mb-2">
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest">
            {viewMode === "captains" ? "Captain Nominations (from Auction Teams)" : "Registered Players"}
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#3b82f6]/20 text-[#3b82f6]">
            {viewMode === "captains"
              ? `${nominatedCaptains?.length ?? 0} captains`
              : groupedRegistrations.length === (registrations?.length ?? 0)
                ? `${groupedRegistrations.length} players`
                : `${groupedRegistrations.length} players (${registrations?.length ?? 0} total records)`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 relative">
          {viewMode === "players" && registrations && registrations.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setExportDropdownEventId(exportDropdownEventId === ev.id ? null : ev.id)}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Players</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {exportDropdownEventId === ev.id && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setExportDropdownEventId(null)} />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 text-left text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        exportPlayersToExcel(registrations, ev.name || "Event");
                        setExportDropdownEventId(null);
                      }}
                      className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Download Excel (.xls)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportPlayersToCSV(registrations, ev.name || "Event");
                        setExportDropdownEventId(null);
                      }}
                      className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Download CSV (.csv)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportPlayersToPDF(registrations, ev.name || "Event");
                        setExportDropdownEventId(null);
                      }}
                      className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Printer className="w-4 h-4 text-indigo-600" />
                      <span>Print / Save PDF Roster</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          {viewMode === "players" && onAddParticipant && onImportParticipants && (
            <>
              <button
                onClick={() => onAddParticipant(ev.id)}
                className="px-2.5 py-1 bg-[#f97316]/10 hover:bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/30 hover:border-[#f97316]/50 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Participant
              </button>
              <button
                onClick={() => onImportParticipants(ev.id)}
                className="px-2.5 py-1 bg-[#10b981]/10 hover:bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 hover:border-[#10b981]/50 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ClipboardList className="w-3.5 h-3.5" /> Import
              </button>
              <button
                onClick={() => setShowExternalFormsEventId(showExternalFormsEventId === ev.id ? null : ev.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer border ${
                  showExternalFormsEventId === ev.id
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                }`}
                title="Google Forms & External Registration Integration"
              >
                <Sparkles className="w-3.5 h-3.5" /> External Forms
              </button>
            </>
          )}
        </div>
      </div>

      {showExternalFormsEventId === ev.id && (
        <div className="mb-4">
          <ExternalFormsManager
            event={ev}
            onRefreshRegistrations={() => onViewPlayers && onViewPlayers(ev.id)}
          />
        </div>
      )}

      {loadingRegs && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-[#f97316]" />
        </div>
      )}

      {/* Players list */}
      {!loadingRegs && viewMode === "players" && groupedRegistrations.length > 0 && (
        <div className="space-y-2.5">
          {groupedRegistrations.map((group, idx) => {
            const reg = group.primary;
            const isHistoryExpanded = !!expandedHistoryKeys[group.key];

            return (
              <div key={group.key} className="space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-white rounded-lg border border-slate-200/60 shadow-sm transition-all hover:border-slate-300">
                  <div className="flex items-center gap-3 min-w-0 flex-1 text-left">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="text-[10px] font-medium text-slate-800 break-words">
                          {reg.playerName || reg.user?.fullName || "—"}
                        </span>
                        {reg.registrationSource === "GOOGLE_FORMS" && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-semibold border border-purple-200">
                            Google Form
                          </span>
                        )}
                        {reg.isExternalGuest && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-700 font-semibold border border-amber-200">
                            Guest
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        {reg.category?.name && <span>{reg.category.name}</span>}
                        {reg.age && <span>Age: {reg.age}</span>}
                        {reg.flatNumber && <span>Flat: {reg.flatNumber}</span>}
                        {reg.relation && <span>({reg.relation})</span>}
                        {reg.registeredAt && <span>· {format(new Date(reg.registeredAt), "MMM d, h:mm a")}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <div className="flex items-center gap-1 mr-1">
                      <span className="text-[10px] text-slate-400 font-medium">Seed</span>
                      <input
                        type="number"
                        min={1}
                        value={seedDrafts[reg.id] ?? (reg.seed != null ? String(reg.seed) : "")}
                        onChange={e => setSeedDrafts(prev => ({ ...prev, [reg.id]: e.target.value }))}
                        onBlur={() => handleSeedSave(reg.id)}
                        onKeyDown={e => { if (e.key === "Enter") { e.currentTarget.blur(); handleSeedSave(reg.id); } }}
                        placeholder="—"
                        className="w-12 text-center border border-slate-200 rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-indigo-200 focus:outline-none tabular-nums disabled:opacity-50"
                        disabled={!!savingSeeds[reg.id]}
                      />
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded font-medium ${statusBadge(reg.status)}`}>
                      {reg.status}
                    </span>
                    {group.history.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleToggleHistory(group.key, ev.id, reg.id, group.history)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isHistoryExpanded
                            ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                        }`}
                        title={`View ${group.history.length} past registration records`}
                      >
                        {loadingHistoryMap[reg.id] ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                        ) : (
                          <History className="w-3.5 h-3.5" />
                        )}
                        <span>History ({group.history.length})</span>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isHistoryExpanded ? "rotate-180" : ""}`} />
                      </button>
                    )}
                    {(reg.status === "REGISTERED" || reg.status === "PENDING") && onConfirmRegistration && (
                      <button
                        onClick={() => onConfirmRegistration(reg.id)}
                        className="text-xs px-3 py-1.5 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 rounded-lg hover:bg-[#10b981]/20 transition-colors flex items-center gap-1 font-medium"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Confirm
                      </button>
                    )}
                    {(reg.status === "REGISTERED" || reg.status === "PENDING") && onRejectRegistration && (
                      <button
                        onClick={() => onRejectRegistration(reg.id)}
                        className="text-xs px-3 py-1.5 bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30 rounded-lg hover:bg-[#ef4444]/20 transition-colors flex items-center gap-1 font-medium"
                      >
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    )}
                    {reg.status === "CONFIRMED" && onRejectRegistration && (
                      <button
                        onClick={() => onRejectRegistration(reg.id)}
                        className="text-xs px-3 py-1.5 bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30 rounded-lg hover:bg-[#ef4444]/20 transition-colors flex items-center gap-1 font-medium"
                        title="Remove / unregister this player"
                      >
                        <XCircle className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible registration history panel with lazy loading */}
                {isHistoryExpanded && group.history.length > 0 && (
                  <div className="ml-3 sm:ml-8 p-3 bg-slate-50/90 rounded-lg border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-slate-700 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-slate-500" />
                        <span>Registration History for {reg.playerName || reg.user?.fullName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full font-bold">
                          {group.history.length} previous record{group.history.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleHistory(group.key, ev.id, reg.id, group.history)}
                        className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Close
                      </button>
                    </div>

                    {loadingHistoryMap[reg.id] ? (
                      <div className="flex items-center justify-center gap-2 py-4 text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin text-[#f97316]" />
                        <span>Loading history records...</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {(lazyHistoryMap[reg.id] ?? group.history).map((hist, hIdx) => (
                          <div
                            key={hist.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white rounded border border-slate-200/80 text-slate-600 shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="text-[10px] font-bold text-slate-400 w-5 text-center flex-shrink-0">
                                #{hIdx + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-xs font-semibold text-slate-700">Reg ID: #{hist.id}</span>
                                  {hist.category?.name && (
                                    <span className="text-[10px] px-1.5 py-0.2 bg-violet-50 text-violet-700 border border-violet-200 rounded font-medium">
                                      {hist.category.name}
                                    </span>
                                  )}
                                  {hist.registrationSource && hist.registrationSource !== "MANA_APP" && (
                                    <span className="text-[10px] px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded font-medium">
                                      {hist.registrationSource}
                                    </span>
                                  )}
                                  {hist.isExternalGuest && (
                                    <span className="text-[10px] px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded font-medium">
                                      Guest
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-2 mt-0.5">
                                  {hist.registeredAt && (
                                    <span>Registered: {format(new Date(hist.registeredAt), "MMM d, yyyy · h:mm a")}</span>
                                  )}
                                  {hist.relation && <span>({hist.relation})</span>}
                                  {hist.flatNumber && <span>Flat: {hist.flatNumber}</span>}
                                  {hist.seed != null && <span>Seed: {hist.seed}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${statusBadge(hist.status)}`}>
                                {hist.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Captains list */}
      {!loadingRegs && viewMode === "captains" && nominatedCaptains && nominatedCaptains.length > 0 && (
        <div className="space-y-2">
          {nominatedCaptains.map((team) => (
            <div key={team.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-white rounded-lg border border-slate-200/60 shadow-sm">
              <div className="flex items-center gap-3 min-w-0 flex-1 text-left">
                <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center text-xs font-bold text-[#f97316] flex-shrink-0">
                  C
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-800 break-words">{team.ownerName || team.ownerUser?.fullName || "—"}</div>
                  <div className="text-xs text-[#f97316] mt-1 font-semibold tracking-wide">
                    Proposed Team: {team.teamName}
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                    <span>Budget: ₹{team.totalBudget?.toLocaleString()}</span>
                    {team.ownerUser?.phone && <span>· {team.ownerUser.phone}</span>}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                {team.captainConfirmation ? (
                  <span className="text-[10px] px-2 py-1 rounded font-medium bg-[#10b981]/20 text-[#10b981] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Confirmed
                  </span>
                ) : (
                  onConfirmCaptain && (
                    <button
                      onClick={() => onConfirmCaptain(team.id, true)}
                      className="text-xs px-3 py-1.5 bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/30 rounded-lg hover:bg-[#f97316]/20 transition-colors flex items-center gap-1 font-medium"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Confirm Captain
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty states */}
      {!loadingRegs && viewMode === "players" && (!registrations || registrations.length === 0) && (
        <div className="flex flex-col items-center justify-center py-10 px-4 gap-3 bg-white rounded-xl border border-dashed border-slate-300">
          <div className="flex items-center justify-center w-16 h-16 border border-slate-200 rounded-full bg-slate-50 shadow-inner">
            <Users className="text-2xl text-slate-400" />
          </div>
          <h6 className="text-xs font-bold text-slate-800">No Participants to show</h6>
          {onAddParticipant && onImportParticipants && (
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
              <button
                onClick={() => onAddParticipant(ev.id)}
                className="px-4 py-2 border border-[#f97316]/30 hover:border-[#f97316] bg-[#f97316]/5 hover:bg-[#f97316]/10 text-[#f97316] text-xs md:text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Participants
              </button>
              <span className="text-[#64748b] font-semibold text-[10px]">OR</span>
              <button
                onClick={() => onImportParticipants(ev.id)}
                className="px-4 py-2 border border-[#10b981]/30 hover:border-[#10b981] bg-[#10b981]/5 hover:bg-[#10b981]/10 text-[#10b981] text-xs md:text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ClipboardList className="w-4 h-4" /> Import Participants
              </button>
            </div>
          )}
        </div>
      )}
      {!loadingRegs && viewMode === "captains" && (!nominatedCaptains || nominatedCaptains.length === 0) && (
        <div className="text-center py-6 text-xs text-[#475569] italic">No nominated captains found</div>
      )}
    </div>
  );

  // ─── Button helpers ───────────────────────────────────────────────────────

  const PlayersBtn = ({ evId, size = "sm" }: { evId: number; size?: "sm" | "xs" }) =>
    onViewPlayers ? (
      <button
        onClick={() => onViewPlayers(evId)}
        className={`${size === "xs" ? "text-xs px-2 py-1" : "text-xs px-2 py-1.5"} rounded${size === "xs" ? "" : "-lg"} transition-colors flex items-center gap-1 cursor-pointer ${
          viewingEventId === evId && viewMode === "players"
            ? "bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30"
            : "border border-slate-200 text-slate-500 hover:border-[#3b82f6] hover:text-[#3b82f6]"
        }`}
      >
        <ClipboardList className={size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3"} />
        {viewingEventId === evId && viewMode === "players" ? "Hide Players" : "View Players"}
      </button>
    ) : null;

  const CaptainsBtn = ({ evId, sportName, size = "sm" }: { evId: number; sportName: string; size?: "sm" | "xs" }) => {
    if (!onViewCaptains || !isTeamSport(sportName)) return null;
    return (
      <button
        onClick={() => onViewCaptains(evId)}
        className={`${size === "xs" ? "text-xs px-2 py-1" : "text-xs px-2 py-1.5"} rounded${size === "xs" ? "" : "-lg"} transition-colors flex items-center gap-1 cursor-pointer ${
          viewingEventId === evId && viewMode === "captains"
            ? "bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/30"
            : "border border-slate-200 text-slate-500 hover:border-[#f97316] hover:text-[#f97316]"
        }`}
      >
        <Users className={size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3"} />
        {viewingEventId === evId && viewMode === "captains" ? "Hide Captains" : "Nominated Captains"}
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

            const currentFilter = eventFilters[item.id] || {};
            const selectedSport = currentFilter.sport || "";
            const selectedCategory = currentFilter.category || "";
            const selectedAge = currentFilter.age || "";
            const searchQuery = (currentFilter.search || "").toLowerCase().trim();
            const isFilterActive = Boolean(selectedSport || selectedCategory || selectedAge || searchQuery);

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
                    <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-2 sm:p-2.5 mb-2 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-700 mr-0.5">
                          <Filter className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="hidden xs:inline">Filter Events:</span>
                        </div>

                        {/* Sports filter dropdown */}
                        {allSportsInItem.length > 0 && (
                          <div className="relative min-w-[110px] sm:min-w-[135px]">
                            <select
                              value={selectedSport}
                              onChange={(e) => setTournamentFilter(item.id, "sport", e.target.value)}
                              className="w-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-2xs"
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
                          <div className="relative min-w-[115px] sm:min-w-[140px]">
                            <select
                              value={selectedCategory}
                              onChange={(e) => setTournamentFilter(item.id, "category", e.target.value)}
                              className="w-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-2xs"
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
                          <div className="relative min-w-[110px] sm:min-w-[135px]">
                            <select
                              value={selectedAge}
                              onChange={(e) => setTournamentFilter(item.id, "age", e.target.value)}
                              className="w-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-2xs"
                              aria-label="Filter by age"
                            >
                              <option value="">All Ages ({allAgeCategoriesInItem.length})</option>
                              {allAgeCategoriesInItem.map((a) => (
                                <option key={a} value={a}>{a}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Quick Search Input */}
                        <div className="relative min-w-[110px] sm:min-w-[140px] flex-1 max-w-[180px]">
                          <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={currentFilter.search || ""}
                            onChange={(e) => setTournamentFilter(item.id, "search", e.target.value)}
                            placeholder="Search event..."
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-6 pr-2 py-1.5 text-slate-700 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                          />
                        </div>

                        {/* Clear filter button */}
                        {isFilterActive && (
                          <button
                            type="button"
                            onClick={() => clearTournamentFilter(item.id)}
                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors cursor-pointer border border-indigo-200 bg-white flex items-center gap-1 shadow-2xs"
                            title="Clear filters"
                          >
                            <X className="w-3 h-3" />
                            <span>Clear</span>
                          </button>
                        )}
                      </div>

                      <div className="text-[11px] font-semibold text-slate-500 shrink-0">
                        Showing <span className="font-bold text-slate-700">{filteredSportsEvents.length}</span> of {item.sportsEvents.length}
                      </div>
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

                        return (
                          <div key={ev.id} className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-white rounded-lg border border-slate-200/60 shadow-sm">
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
                                </div>
                                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                  {ev.gender && <span>Gender: {ev.gender}</span>}
                                  {ev.minAge && ev.maxAge && <span>Age: {ev.minAge}–{ev.maxAge}</span>}
                                  {ev.maxParticipants && <span>Max Participants: {ev.maxParticipants}</span>}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                {registrationStatus && registrationStatus !== "DRAFT" && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ registrationStatus === "LIVE" || registrationStatus === "REGISTRATION_OPEN" ? "bg-green-500/20 text-[#10b981]" : registrationStatus === "COMPLETED" ? "bg-blue-500/20 text-[#3b82f6]" : "bg-[#f97316]/20 text-[#f97316]" }`}>
                                    {registrationStatus}
                                  </span>
                                )}
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
                                </>
                              )}
                            </div>
                          </div>
                          {hasRegistrationButtons && viewingEventId === ev.id && renderRegistrationPanel(ev)}
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

          return (
            <div key={item.id} className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/60 shadow-sm">
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-sm font-semibold text-slate-800 break-words">{ev.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {ev.eventDateStart && ev.eventDateEnd
                      ? `${ev.eventDateStart} — ${ev.eventDateEnd}`
                      : item.createdAt ? `Created: ${format(new Date(item.createdAt), "MMM d")}` : "—"}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {registrationStatus && registrationStatus !== "DRAFT" && (
                    <span className={`text-[10px] px-2 py-1 rounded ${ registrationStatus === "LIVE" || registrationStatus === "REGISTRATION_OPEN" ? "bg-green-500/20 text-[#10b981]" : registrationStatus === "COMPLETED" ? "bg-blue-500/20 text-[#3b82f6]" : "bg-[#f97316]/20 text-[#f97316]" }`}>
                      {registrationStatus}
                    </span>
                  )}
                  {hasRegistrationButtons && (
                    <>
                      <PlayersBtn evId={ev.id} />
                      <CaptainsBtn evId={ev.id} sportName={ev.sport?.name || ""} />
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
              {hasRegistrationButtons && viewingEventId === ev.id && renderRegistrationPanel(ev)}
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
    </div>
  );
}
