import { useState, useEffect, useCallback, useMemo } from "react";
import { CalendarIcon, ChevronDown, ChevronRight, Clock, MapPin, RefreshCw, ExternalLink, Download, FileSpreadsheet, FileText, Radio, Layers, Sparkles, X, FastForward, Send, Check } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { tournamentService, type ConfigInfo, type FeedVisibilityLevel } from "../../../../services/sports/tournamentService";
import { venueService } from "../../../../services/bookings/venueService";
import { useAuth } from "../../../../contexts/AuthContext";
import type { Venue } from "../../../../types/api";
import { showError, showSuccess } from "../../../../utils/ToastUtils";
import { exportScheduleToCSV, exportScheduleToExcel, exportScheduleToPDF } from "../../../../utils/sportsExportUtils";
import {
  ScheduleExportModal,
  getMatchStage,
  prepareExportableMatches,
  detectSportName,
  type TournamentStageKey,
} from "./ScheduleExportModal";
import { BatchRescheduleModal } from "./BatchRescheduleModal";
import { BroadcastSettingsModal } from "./BroadcastSettingsModal";

interface MatchRow {
  id: number;
  round: string;
  roundName?: string;
  matchNumber: number;
  teamAName: string;
  teamBName: string;
  homeName?: string;
  awayName?: string;
  teamAFlat?: string;
  teamBFlat?: string;
  homeFlat?: string;
  awayFlat?: string;
  scheduledAt: string;
  status: string;
  scoreTeamA?: string;
  scoreTeamB?: string;
  venueName?: string;
  courtName?: string;
  showInFeed?: boolean | null;
  postToFeed?: boolean | null;
  feedResultPostId?: number | null;
}


const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT:     { bg: "bg-slate-100", text: "text-slate-600", label: "Draft" },
  ACTIVE:    { bg: "bg-blue-50",   text: "text-blue-700",  label: "Active" },
  LIVE:      { bg: "bg-green-50",  text: "text-green-700", label: "Live" },
  COMPLETED: { bg: "bg-violet-50", text: "text-violet-700", label: "Completed" },
  CANCELLED: { bg: "bg-red-50",    text: "text-red-600",   label: "Cancelled" },
  SCHEDULED: { bg: "bg-indigo-50", text: "text-indigo-700", label: "Scheduled" },
  PUBLISHED: { bg: "bg-teal-50",   text: "text-teal-700",  label: "Published" },
  BYE:       { bg: "bg-gray-50",   text: "text-gray-500",  label: "Bye" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || { bg: "bg-gray-100", text: "text-gray-600", label: status };
  return <span className={`${s.bg} ${s.text} px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide`}>{s.label}</span>;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "TBD";
  try {
    return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });
  } catch { return iso; }
}

export function ScheduleAdminTab() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<ConfigInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, MatchRow[]>>({});
  const [loadingMatches, setLoadingMatches] = useState<number | null>(null);
  const [stageFilters, setStageFilters] = useState<Record<number, TournamentStageKey>>({});
  const [venues, setVenues] = useState<Venue[]>([]);
  const [reschedulingMatch, setReschedulingMatch] = useState<{ match: MatchRow; configId: number } | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleVenueId, setRescheduleVenueId] = useState<string>("");
  const [rescheduleCourtId, setRescheduleCourtId] = useState<string>("");
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);
  const [exportModalState, setExportModalState] = useState<{
    isOpen: boolean;
    tournamentName: string;
    matches: MatchRow[];
    defaultStage?: TournamentStageKey;
    sportName?: string;
  } | null>(null);
  const [batchRescheduleModalState, setBatchRescheduleModalState] = useState<{
    isOpen: boolean;
    configId: number;
    tournamentName: string;
    matches: MatchRow[];
    selectedMatchIds?: number[];
  } | null>(null);
  const [selectedMatches, setSelectedMatches] = useState<Record<number, number[]>>({});
  const [broadcastModalState, setBroadcastModalState] = useState<{
    isOpen: boolean;
    id: number;
    level: FeedVisibilityLevel;
    title: string;
  } | null>(null);
  const [publishingMatchId, setPublishingMatchId] = useState<number | null>(null);

  const toggleSelectMatch = (configId: number, matchId: number) => {
    setSelectedMatches(prev => {
      const current = prev[configId] || [];
      const next = current.includes(matchId)
        ? current.filter(id => id !== matchId)
        : [...current, matchId];
      return { ...prev, [configId]: next };
    });
  };

  const toggleSelectAll = (configId: number, matchIds: number[]) => {
    setSelectedMatches(prev => {
      const current = prev[configId] || [];
      const allSelected = matchIds.length > 0 && matchIds.every(id => current.includes(id));
      return {
        ...prev,
        [configId]: allSelected
          ? current.filter(id => !matchIds.includes(id))
          : Array.from(new Set([...current, ...matchIds]))
      };
    });
  };

  const clearSelection = (configId: number) => {
    setSelectedMatches(prev => ({ ...prev, [configId]: [] }));
  };

  useEffect(() => {
    venueService.getVenues(user?.communityId ?? null).then(setVenues).catch(() => {});
  }, [user?.communityId]);

  const openRescheduleModal = (m: MatchRow, cfgId: number) => {
    setReschedulingMatch({ match: m, configId: cfgId });
    let initialDate = "";
    let initialTime = "09:00 AM";
    if (m.scheduledAt) {
      try {
        const dt = new Date(m.scheduledAt);
        if (!isNaN(dt.getTime())) {
          initialDate = dt.toISOString().split("T")[0];
          initialTime = dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
        }
      } catch {
        // fallback
      }
    }
    setRescheduleDate(initialDate);
    setRescheduleTime(initialTime);

    const matchedVenue = venues.find(v => v.name?.toLowerCase() === m.venueName?.toLowerCase());
    setRescheduleVenueId(matchedVenue ? String(matchedVenue.id) : "");
    if (matchedVenue && m.courtName) {
      const matchedCourt = matchedVenue.courts?.find(c => c.name?.toLowerCase() === m.courtName?.toLowerCase());
      setRescheduleCourtId(matchedCourt ? String(matchedCourt.id) : "");
    } else {
      setRescheduleCourtId("");
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!reschedulingMatch) return;
    if (!rescheduleDate) {
      showError("Please pick a scheduled date");
      return;
    }
    setIsSubmittingReschedule(true);
    try {
      let hours = 9;
      let minutes = 0;
      const t = (rescheduleTime || "").trim().toUpperCase();
      const match12 = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (match12) {
        hours = parseInt(match12[1], 10);
        minutes = parseInt(match12[2], 10);
        const meridiem = match12[3];
        if (meridiem === "PM" && hours < 12) hours += 12;
        if (meridiem === "AM" && hours === 12) hours = 0;
      } else {
        const match24 = t.match(/^(\d{1,2}):(\d{2})$/);
        if (match24) {
          hours = parseInt(match24[1], 10);
          minutes = parseInt(match24[2], 10);
        }
      }
      const hh = String(hours).padStart(2, "0");
      const mm = String(minutes).padStart(2, "0");
      const scheduledAtIso = `${rescheduleDate}T${hh}:${mm}:00`;

      const venueObj = venues.find(v => String(v.id) === rescheduleVenueId);
      const courtObj = venueObj?.courts?.find(c => String(c.id) === rescheduleCourtId);

      await tournamentService.rescheduleMatch(reschedulingMatch.match.id, {
        scheduledAt: scheduledAtIso,
        venue: rescheduleVenueId || undefined,
        court: rescheduleCourtId || undefined,
      });

      setMatches(prev => ({
        ...prev,
        [reschedulingMatch.configId]: (prev[reschedulingMatch.configId] || []).map(row => {
          if (row.id === reschedulingMatch.match.id) {
            return {
              ...row,
              scheduledAt: scheduledAtIso,
              venueName: venueObj ? venueObj.name : row.venueName,
              courtName: courtObj ? courtObj.name : (rescheduleCourtId ? row.courtName : undefined),
            };
          }
          return row;
        })
      }));

      showSuccess(`Match #${reschedulingMatch.match.matchNumber || ''} rescheduled to ${rescheduleDate}`);
      setReschedulingMatch(null);
    } catch (err: any) {
      showError(err?.message || "Failed to reschedule match on server");
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tournamentService.getConfigs();
      setConfigs(data);
    } catch (e: any) {
      showError("Failed to load tournament configs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const toggleExpand = async (configId: number) => {
    if (expandedId === configId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(configId);
    if (!matches[configId]) {
      setLoadingMatches(configId);
      try {
        const data = await tournamentService.getMatchesByConfigId(configId);
        setMatches(prev => ({ ...prev, [configId]: data }));
      } catch {
        showError("Failed to load matches");
      } finally {
        setLoadingMatches(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
        <span className="text-[10px] ml-2 text-slate-500">Loading schedules…</span>
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm text-center max-w-xl mx-auto my-8 space-y-4">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto">
          <CalendarIcon className="w-7 h-7" />
        </div>
        <h3 className="text-xs font-bold text-slate-800">No Tournament Schedules Yet</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Create a tournament configuration and generate match fixtures from the Sports Schedule page.
        </p>
        <Link
          to="/sports/schedule"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:shadow-md cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Open Schedule Builder
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500">{configs.length} tournament schedule{configs.length !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-2">
          <Link
            to="/sports/schedule"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Schedule Builder
          </Link>
          <button onClick={fetchConfigs} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {configs.map(cfg => {
        const isExpanded = expandedId === cfg.id;
        const cfgMatches = matches[cfg.id] || [];
        const isLoadingThis = loadingMatches === cfg.id;

        return (
          <div key={cfg.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
              onClick={() => toggleExpand(cfg.id)}
            >
              <div className="flex-shrink-0 text-slate-400">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-800 truncate">{cfg.tournamentName}</span>
                  <StatusBadge status={cfg.status} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span>{cfg.tournamentType?.replace(/_/g, " ")}</span>
                  <span>·</span>
                  <span>{cfg.totalTeams} teams</span>
                  {cfg.numberOfGroups && cfg.numberOfGroups > 0 && (
                    <>
                      <span>·</span>
                      <span>{cfg.numberOfGroups} groups</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{formatDate(cfg.startDate)} – {formatDate(cfg.endDate)}</span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-xs text-slate-400 uppercase tracking-wide">Event #{cfg.eventId}</div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-slate-100 bg-slate-50/40">
                {isLoadingThis ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                    <span className="ml-2 text-[10px] text-slate-500">Loading matches…</span>
                  </div>
                ) : cfgMatches.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No matches generated yet.
                    <Link to="/sports/schedule" className="text-indigo-600 font-medium ml-1 hover:underline">Generate fixtures →</Link>
                  </div>
                ) : (() => {
                  const activeStage = stageFilters[cfg.id] || 'ALL';

                  // BYE matches are strictly forbidden in playoff stages (only valid in group stage)
                  const validCfgMatches = cfgMatches.filter(m => {
                    const s = getMatchStage(m);
                    if (s !== 'GROUP') {
                      const team1 = m.teamAName || m.homeName;
                      const team2 = m.teamBName || m.awayName;
                      if (team1 === 'BYE' || team2 === 'BYE' || m.status === 'AUTO_ADVANCED') return false;
                    }
                    return true;
                  });

                  const stageCounts: Record<TournamentStageKey, number> = {
                    ALL: validCfgMatches.length,
                    GROUP: 0,
                    ROUND_OF_64: 0,
                    ROUND_OF_32: 0,
                    ROUND_OF_16: 0,
                    QUARTER_FINAL: 0,
                    SEMI_FINAL: 0,
                    FINAL: 0,
                    THIRD_PLACE: 0,
                  };

                  validCfgMatches.forEach(m => {
                    const s = getMatchStage(m);
                    stageCounts[s] = (stageCounts[s] || 0) + 1;
                  });

                  const stagePills: { key: TournamentStageKey; label: string; count: number }[] = [
                    { key: 'ALL', label: 'All Stages', count: stageCounts.ALL },
                    ...(stageCounts.GROUP > 0 ? [{ key: 'GROUP' as const, label: 'Group Stages', count: stageCounts.GROUP }] : []),
                    ...(stageCounts.ROUND_OF_64 > 0 ? [{ key: 'ROUND_OF_64' as const, label: 'Round of 64', count: stageCounts.ROUND_OF_64 }] : []),
                    ...(stageCounts.ROUND_OF_32 > 0 ? [{ key: 'ROUND_OF_32' as const, label: 'Round of 32', count: stageCounts.ROUND_OF_32 }] : []),
                    ...(stageCounts.ROUND_OF_16 > 0 ? [{ key: 'ROUND_OF_16' as const, label: 'Round of 16', count: stageCounts.ROUND_OF_16 }] : []),
                    ...(stageCounts.QUARTER_FINAL > 0 ? [{ key: 'QUARTER_FINAL' as const, label: 'Quarter-Finals', count: stageCounts.QUARTER_FINAL }] : []),
                    ...(stageCounts.SEMI_FINAL > 0 ? [{ key: 'SEMI_FINAL' as const, label: 'Semi-Finals', count: stageCounts.SEMI_FINAL }] : []),
                    ...(stageCounts.FINAL > 0 || stageCounts.THIRD_PLACE > 0
                      ? [{ key: 'FINAL' as const, label: 'Finals', count: stageCounts.FINAL + stageCounts.THIRD_PLACE }]
                      : []),
                  ];

                  const displayedMatches = activeStage === 'ALL'
                    ? validCfgMatches
                    : validCfgMatches.filter(m => {
                        const s = getMatchStage(m);
                        if (activeStage === 'FINAL') return s === 'FINAL' || s === 'THIRD_PLACE';
                        return s === activeStage;
                      });

                  const selectedList = selectedMatches[cfg.id] || [];
                  const uncompletedDisplayed = displayedMatches.filter(m => m.status !== 'COMPLETED');
                  const isAllSelected = uncompletedDisplayed.length > 0 && uncompletedDisplayed.every(m => selectedList.includes(m.id));

                  const handleExportQuick = (format: 'csv' | 'excel' | 'pdf') => {
                    const resolvedSport = cfg.sportName || detectSportName(cfg.tournamentName) || detectSportName(cfg.eventName) || 'Tournament';
                    const exportData = prepareExportableMatches(cfgMatches, activeStage, resolvedSport);
                    const stageName = activeStage === 'ALL' ? 'Full_Schedule' :
                      activeStage === 'GROUP' ? 'Group_Stage' :
                      activeStage === 'ROUND_OF_64' ? 'Round_of_64' :
                      activeStage === 'ROUND_OF_32' ? 'Round_of_32' :
                      activeStage === 'ROUND_OF_16' ? 'Round_of_16' :
                      activeStage === 'QUARTER_FINAL' ? 'Quarter_Finals' :
                      activeStage === 'SEMI_FINAL' ? 'Semi_Finals' :
                      activeStage === 'FINAL' ? 'Finals' : 'Stage';
                    const baseTitle = `${cfg.tournamentName || 'Tournament'}_${stageName}`;

                    if (format === 'csv') exportScheduleToCSV(exportData, baseTitle);
                    else if (format === 'excel') exportScheduleToExcel(exportData, baseTitle);
                    else if (format === 'pdf') exportScheduleToPDF(exportData, `${cfg.tournamentName || 'Tournament'} - ${stageName.replace(/_/g, ' ')}`);

                    showSuccess(`Exported ${exportData.length} ${stageName.replace(/_/g, ' ')} match(es) as ${format.toUpperCase()}`);
                  };

                  return (
                    <div className="overflow-x-auto">
                      {/* Sub-header with Stage Pills and Export actions */}
                      <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
                        {/* Stage Filter Pills */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-indigo-500" /> Stages:
                          </span>
                          {stagePills.map(p => {
                            const isSelected = activeStage === p.key;
                            return (
                              <button
                                key={p.key}
                                type="button"
                                onClick={() => setStageFilters(prev => ({ ...prev, [cfg.id]: p.key }))}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 border ${
                                  isSelected
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100"
                                    : "bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/60 border-slate-200"
                                }`}
                              >
                                <span>{p.label}</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                  isSelected ? "bg-indigo-500/80 text-white" : "bg-slate-100 text-slate-500"
                                }`}>
                                  {p.count}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Export & Broadcast Toolbar */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Advanced Stage-wise Export Modal Trigger */}
                          <button
                            type="button"
                            onClick={() => {
                              const resolvedSport = cfg.sportName || detectSportName(cfg.tournamentName) || detectSportName(cfg.eventName) || 'Tournament';
                              setExportModalState({
                                isOpen: true,
                                tournamentName: cfg.tournamentName || 'Tournament',
                                matches: cfgMatches,
                                defaultStage: activeStage,
                                sportName: resolvedSport,
                              });
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="Open stage-wise export modal with options for CSV, Excel, PDF & separate files"
                          >
                            <Download className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Export Stage / All</span>
                            <Sparkles className="w-3 h-3 text-amber-500" />
                          </button>

                          {/* Quick Export Current Stage Buttons */}
                          <button
                            type="button"
                            onClick={() => handleExportQuick('csv')}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-700 bg-white hover:bg-emerald-50 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                            title={`Download active stage (${displayedMatches.length} matches) as CSV`}
                          >
                            <Download className="w-3 h-3" /> CSV
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExportQuick('excel')}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-green-700 bg-white hover:bg-green-50 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                            title={`Download active stage (${displayedMatches.length} matches) as Excel (.xls)`}
                          >
                            <FileSpreadsheet className="w-3 h-3" /> Excel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExportQuick('pdf')}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-red-700 bg-white hover:bg-red-50 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                            title={`Print active stage (${displayedMatches.length} matches) as PDF`}
                          >
                            <FileText className="w-3 h-3" /> PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => setBroadcastModalState({
                              isOpen: true,
                              id: cfg.eventId || cfg.id,
                              level: cfg.eventId ? "event" : "tournament",
                              title: cfg.tournamentName || cfg.eventName || "Tournament Broadcast Settings",
                            })}
                            className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="Configure Live Now strip scoreboard and Community Feed result posting policy"
                          >
                            <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                            <span>Broadcast &amp; Feed Policy</span>
                          </button>

                          {/* Rain Delay / Batch Reschedule Button */}
                          <button
                            type="button"
                            onClick={() => setBatchRescheduleModalState({
                              isOpen: true,
                              configId: cfg.id,
                              tournamentName: cfg.tournamentName || 'Tournament',
                              matches: cfgMatches,
                            })}
                            className="px-2.5 py-1 text-[11px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Delay remaining matches (e.g. for rain delays) or postpone to a new date"
                          >
                            <FastForward className="w-3.5 h-3.5 text-amber-600" />
                            <span>Rain Delay / Shift Remaining</span>
                          </button>
                        </div>
                      </div>

                      {/* Multi-Select Floating Action Banner */}
                      {selectedList.length > 0 && (
                        <div className="px-4 py-2 bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-indigo-500/20 border-b border-amber-300 flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                              {selectedList.length}
                            </div>
                            <span className="text-xs font-bold text-amber-950">
                              {selectedList.length} match{selectedList.length !== 1 ? 'es' : ''} selected
                            </span>
                            <span className="text-[11px] text-amber-800 hidden sm:inline">
                              (selective multi-reschedule)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setBatchRescheduleModalState({
                                isOpen: true,
                                configId: cfg.id,
                                tournamentName: cfg.tournamentName || 'Tournament',
                                matches: cfgMatches,
                                selectedMatchIds: selectedList,
                              })}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition active:scale-[0.98] cursor-pointer"
                            >
                              <FastForward className="w-3.5 h-3.5" />
                              <span>Reschedule Selected ({selectedList.length})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => clearSelection(cfg.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white/70 rounded-lg transition cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Matches Table & Mobile Cards */}
                      {displayedMatches.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No matches in this stage.
                          <button
                            type="button"
                            onClick={() => setStageFilters(prev => ({ ...prev, [cfg.id]: 'ALL' }))}
                            className="text-indigo-600 font-medium ml-1.5 hover:underline cursor-pointer"
                          >
                            Show all stages ({cfgMatches.length}) →
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Mobile View: Match Cards */}
                          <div className="block md:hidden divide-y divide-slate-100 p-2 space-y-2">
                            {displayedMatches.map((m, i) => {
                              const flatA = m.teamAFlat || m.homeFlat;
                              const flatB = m.teamBFlat || m.awayFlat;
                              const stage = getMatchStage(m);
                              const stageBadge =
                                stage === 'FINAL' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                stage === 'SEMI_FINAL' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                stage === 'QUARTER_FINAL' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                stage === 'ROUND_OF_16' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                                stage === 'ROUND_OF_32' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                                stage === 'ROUND_OF_64' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                                'bg-slate-50 text-slate-600 border-slate-200';

                              return (
                                <div key={m.id} className={`rounded-xl p-3 border shadow-2xs space-y-2 ${selectedList.includes(m.id) ? "bg-amber-50/70 border-amber-300" : "bg-white border-slate-100"}`}>
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5">
                                      {m.status !== "COMPLETED" && (
                                        <input
                                          type="checkbox"
                                          checked={selectedList.includes(m.id)}
                                          onChange={() => toggleSelectMatch(cfg.id, m.id)}
                                          className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer mr-0.5"
                                          title="Select for multi-reschedule"
                                        />
                                      )}
                                      <span className="font-mono text-[10px] text-slate-400 font-bold">#{m.matchNumber || i + 1}</span>
                                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${stageBadge}`}>
                                        {(m.round || m.roundName || "").replace(/_/g, " ")}
                                      </span>
                                    </div>
                                    <StatusBadge status={m.status} />
                                  </div>

                                  {/* Teams & Score */}
                                  <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100/80 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <div className="min-w-0 pr-2">
                                        <span className="text-xs font-bold text-slate-800 block truncate">{m.teamAName || "TBD"}</span>
                                        {flatA && <span className="text-[10px] text-slate-400 block truncate">🏠 {flatA}</span>}
                                      </div>
                                      {m.status === "COMPLETED" && m.scoreTeamA != null && (
                                        <span className="font-mono text-xs font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                          {m.scoreTeamA}
                                        </span>
                                      )}
                                    </div>
                                    <div className="w-full h-px bg-slate-200/50" />
                                    <div className="flex items-center justify-between">
                                      <div className="min-w-0 pr-2">
                                        <span className="text-xs font-bold text-slate-800 block truncate">{m.teamBName || "TBD"}</span>
                                        {flatB && <span className="text-[10px] text-slate-400 block truncate">🏠 {flatB}</span>}
                                      </div>
                                      {m.status === "COMPLETED" && m.scoreTeamB != null && (
                                        <span className="font-mono text-xs font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                          {m.scoreTeamB}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Date, Time, Venue & Feed Toggle */}
                                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                    <div className="space-y-0.5 min-w-0">
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                                        <span className="font-medium truncate">{formatDateTime(m.scheduledAt)}</span>
                                      </div>
                                      {m.venueName && (
                                        <div className="flex items-center gap-1">
                                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                          <span className="truncate">{m.venueName}{m.courtName ? ` · ${m.courtName}` : ""}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {m.status !== "COMPLETED" && (
                                        <button
                                          type="button"
                                          onClick={() => openRescheduleModal(m, cfg.id)}
                                          className="px-2 py-1 rounded-md text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1 transition-colors cursor-pointer"
                                          title="Reschedule match"
                                        >
                                          <CalendarIcon className="w-2.5 h-2.5" />
                                          <span>Reschedule</span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            const next = m.showInFeed === true ? false : true;
                                            await tournamentService.setFeedVisibility("match", m.id, next);
                                            setMatches(prev => ({
                                              ...prev,
                                              [cfg.id]: (prev[cfg.id] || []).map(row => row.id === m.id ? { ...row, showInFeed: next } : row)
                                            }));
                                            toast.success(`Match #${m.matchNumber || i + 1} live scoreboard set to ${next ? "ON" : "OFF"}`);
                                          } catch {
                                            showError("Failed to update match live setting");
                                          }
                                        }}
                                        className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 border transition-colors cursor-pointer ${
                                          m.showInFeed === true
                                            ? "bg-red-50 text-red-600 border-red-200"
                                            : m.showInFeed === false
                                            ? "bg-slate-100 text-slate-400 border-slate-200"
                                            : "bg-indigo-50/70 text-indigo-600 border-indigo-200"
                                        }`}
                                        title="Toggle live scoreboard on feed"
                                      >
                                        <Radio className="w-2.5 h-2.5" />
                                        <span>Live: {m.showInFeed === true ? "ON" : m.showInFeed === false ? "OFF" : "Auto"}</span>
                                      </button>

                                      {m.feedResultPostId ? (
                                        <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                                          <Check className="w-2.5 h-2.5 text-purple-600" /> Posted
                                        </span>
                                      ) : m.status === "COMPLETED" ? (
                                        <button
                                          type="button"
                                          disabled={publishingMatchId === m.id}
                                          onClick={async () => {
                                            try {
                                              setPublishingMatchId(m.id);
                                              const res = await tournamentService.publishMatchResultToFeed(m.id);
                                              setMatches(prev => ({
                                                ...prev,
                                                [cfg.id]: (prev[cfg.id] || []).map(row => row.id === m.id ? { ...row, feedResultPostId: res.postId, postToFeed: true } : row)
                                              }));
                                              toast.success(`Match #${m.matchNumber || i + 1} result published to Community Feed!`);
                                            } catch (err: any) {
                                              toast.error(err?.message || "Failed to publish result to feed");
                                            } finally {
                                              setPublishingMatchId(null);
                                            }
                                          }}
                                          className="px-2 py-1 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                                          title="Publish official result to community feed"
                                        >
                                          <Send className="w-2.5 h-2.5" />
                                          <span>{publishingMatchId === m.id ? "Posting..." : "Post to Feed"}</span>
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Desktop View: Table */}
                          <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                  <th className="px-3 py-2 text-center w-8">
                                    <input
                                      type="checkbox"
                                      checked={isAllSelected}
                                      onChange={() => toggleSelectAll(cfg.id, uncompletedDisplayed.map(m => m.id))}
                                      className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                                      title={isAllSelected ? "Deselect all uncompleted" : "Select all uncompleted matches"}
                                    />
                                  </th>
                                  <th className="px-4 py-2 text-left font-medium">#</th>
                                  <th className="px-4 py-2 text-left font-medium">Stage / Round</th>
                                  <th className="px-4 py-2 text-left font-medium">Match Details</th>
                                  <th className="px-4 py-2 text-left font-medium">Schedule (Date &amp; Time)</th>
                                  <th className="px-4 py-2 text-left font-medium">Venue &amp; Court</th>
                                  <th className="px-4 py-2 text-left font-medium">Score</th>
                                  <th className="px-4 py-2 text-left font-medium" title="Real-time scoreboard on feed">Live Strip</th>
                                  <th className="px-4 py-2 text-left font-medium" title="Official result post on feed stream">Feed Post</th>
                                  <th className="px-4 py-2 text-left font-medium">Status</th>
                                  <th className="px-4 py-2 text-right font-medium">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {displayedMatches.map((m, i) => {
                                  const flatA = m.teamAFlat || m.homeFlat;
                                  const flatB = m.teamBFlat || m.awayFlat;
                                  const stage = getMatchStage(m);
                                  const stageBadge =
                                    stage === 'FINAL' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    stage === 'SEMI_FINAL' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                    stage === 'QUARTER_FINAL' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    stage === 'ROUND_OF_16' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                                    stage === 'ROUND_OF_32' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                                    stage === 'ROUND_OF_64' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                                    'bg-slate-50 text-slate-600 border-slate-200';

                                  return (
                                    <tr key={m.id} className={`border-b border-slate-50 ${selectedList.includes(m.id) ? "bg-amber-50/70" : i % 2 === 0 ? "bg-white/60" : ""}`}>
                                      <td className="px-3 py-2.5 text-center">
                                        {m.status !== "COMPLETED" ? (
                                          <input
                                            type="checkbox"
                                            checked={selectedList.includes(m.id)}
                                            onChange={() => toggleSelectMatch(cfg.id, m.id)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                                            title="Select for multi-reschedule"
                                          />
                                        ) : (
                                          <span className="text-slate-300 text-[10px]">—</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2.5 text-slate-400 font-mono text-[11px]">{m.matchNumber || i + 1}</td>
                                      <td className="px-4 py-2.5">
                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${stageBadge}`}>
                                          {(m.round || m.roundName || "").replace(/_/g, " ")}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2.5">
                                        <div className="inline-block">
                                          <span className="font-semibold text-slate-800">{m.teamAName || "TBD"}</span>
                                          {flatA && (
                                            <span className="block text-[10px] text-slate-500 font-medium">
                                              🏠 Flat: <span className="text-slate-700 font-semibold">{flatA}</span>
                                            </span>
                                          )}
                                        </div>
                                        <span className="mx-2 text-slate-300 font-semibold align-middle">vs</span>
                                        <div className="inline-block">
                                          <span className="font-semibold text-slate-800">{m.teamBName || "TBD"}</span>
                                          {flatB && (
                                            <span className="block text-[10px] text-slate-500 font-medium">
                                              🏠 Flat: <span className="text-slate-700 font-semibold">{flatB}</span>
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                                        <Clock className="w-3 h-3 inline-block mr-1 -mt-0.5 text-indigo-500" />
                                        <span className="font-medium">{formatDateTime(m.scheduledAt)}</span>
                                      </td>
                                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                                        {m.venueName ? (
                                          <>
                                            <MapPin className="w-3 h-3 inline-block mr-1 -mt-0.5 text-rose-500" />
                                            <span className="font-medium">{m.venueName}</span>
                                            {m.courtName ? <span className="text-slate-400"> · {m.courtName}</span> : ""}
                                          </>
                                        ) : (
                                          <span className="text-slate-400">—</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2.5 font-mono text-slate-700">
                                        {m.status === "COMPLETED" && m.scoreTeamA != null ? `${m.scoreTeamA} – ${m.scoreTeamB}` : "—"}
                                      </td>
                                      <td className="px-4 py-2.5">
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            try {
                                              const next = m.showInFeed === true ? false : true;
                                              await tournamentService.setFeedSettings("match", m.id, { showInFeed: next });
                                              setMatches(prev => ({
                                                ...prev,
                                                [cfg.id]: (prev[cfg.id] || []).map(row => row.id === m.id ? { ...row, showInFeed: next } : row)
                                              }));
                                              toast.success(`Match #${m.matchNumber || i + 1} live scoreboard set to ${next ? "ON" : "OFF"}`);
                                            } catch {
                                              showError("Failed to update match live setting");
                                            }
                                          }}
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border transition-colors cursor-pointer ${
                                            m.showInFeed === true
                                              ? "bg-red-50 text-red-600 border-red-200"
                                              : m.showInFeed === false
                                              ? "bg-slate-100 text-slate-400 border-slate-200"
                                              : "bg-indigo-50/70 text-indigo-600 border-indigo-200"
                                          }`}
                                          title={m.showInFeed === true ? "Explicitly ON (click to turn OFF)" : m.showInFeed === false ? "Explicitly OFF (click to turn ON)" : "Inherits from Event"}
                                        >
                                          <Radio className="w-2.5 h-2.5" />
                                          <span>{m.showInFeed === true ? "ON" : m.showInFeed === false ? "OFF" : "Auto"}</span>
                                        </button>
                                      </td>
                                      <td className="px-4 py-2.5">
                                        {m.feedResultPostId ? (
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Result has been published to Community Feed">
                                            <Check className="w-2.5 h-2.5" /> Posted
                                          </span>
                                        ) : m.status === "COMPLETED" ? (
                                          <button
                                            type="button"
                                            disabled={publishingMatchId === m.id}
                                            onClick={async () => {
                                              setPublishingMatchId(m.id);
                                              try {
                                                const res = await tournamentService.publishMatchResultToFeed(m.id);
                                                if (res.postId) {
                                                  setMatches(prev => ({
                                                    ...prev,
                                                    [cfg.id]: (prev[cfg.id] || []).map(row => row.id === m.id ? { ...row, feedResultPostId: res.postId, postToFeed: true } : row)
                                                  }));
                                                  toast.success("Match result posted to Community Feed!");
                                                } else {
                                                  toast.info(res.message || "Match result post handled");
                                                }
                                              } catch {
                                                showError("Failed to publish result to feed");
                                              } finally {
                                                setPublishingMatchId(null);
                                              }
                                            }}
                                            className="px-1.5 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
                                            title="Post official result to Community Feed"
                                          >
                                            <Send className="w-2.5 h-2.5" />
                                            <span>{publishingMatchId === m.id ? "Posting..." : "Post to Feed"}</span>
                                          </button>
                                        ) : (
                                          <span className="text-[10px] text-slate-400 font-medium">Stage Policy</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2.5">
                                        <StatusBadge status={m.status} />
                                      </td>
                                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                        {m.status !== "COMPLETED" && (
                                          <button
                                            type="button"
                                            onClick={() => openRescheduleModal(m, cfg.id)}
                                            className="px-2 py-1 rounded-md text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                            title="Reschedule date, time, venue or court"
                                          >
                                            <CalendarIcon className="w-3 h-3" /> Reschedule
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}

                      <div className="px-4 py-2 text-xs text-slate-500 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
                        <span className="text-[11px] text-slate-400">
                          Showing {displayedMatches.length} of {cfgMatches.length} fixtures {activeStage !== 'ALL' && `(${activeStage.replace(/_/g, ' ')})`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const resolvedSport = cfg.sportName || detectSportName(cfg.tournamentName) || detectSportName(cfg.eventName) || 'Tournament';
                            setExportModalState({
                              isOpen: true,
                              tournamentName: cfg.tournamentName || 'Tournament',
                              matches: cfgMatches,
                              defaultStage: activeStage,
                              sportName: resolvedSport,
                            });
                          }}
                          className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" /> Stage-Wise Export Options →
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        );
      })}

      {/* Stage-wise Export Modal */}
      {exportModalState && (
        <ScheduleExportModal
          isOpen={exportModalState.isOpen}
          onClose={() => setExportModalState(null)}
          tournamentName={exportModalState.tournamentName}
          matches={exportModalState.matches}
          defaultStage={exportModalState.defaultStage || 'ALL'}
          sportName={exportModalState.sportName}
        />
      )}

      {/* Reschedule Match Modal */}
      {reschedulingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-indigo-200" />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">Reschedule Match</h3>
                  <p className="text-[11px] text-indigo-200">
                    Match #{reschedulingMatch.match.matchNumber} · {reschedulingMatch.match.round?.replace(/_/g, " ") || "Fixture"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSubmittingReschedule}
                onClick={() => setReschedulingMatch(null)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Match matchup */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="truncate">{reschedulingMatch.match.teamAName || "TBD"}</span>
                  <span className="text-[10px] font-black text-indigo-500 uppercase px-2 py-0.5 rounded bg-indigo-50 shrink-0 mx-2">VS</span>
                  <span className="truncate text-right">{reschedulingMatch.match.teamBName || "TBD"}</span>
                </div>
              </div>

              {/* Form fields */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Scheduled Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-800 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Scheduled Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 09:30 AM or 14:00"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-800 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none transition"
                />
                <p className="text-[10px] text-slate-400 mt-1">Accepts 12-hour (e.g. 10:00 AM) or 24-hour (14:30) format</p>
              </div>

              {venues.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Venue</label>
                  <select
                    value={rescheduleVenueId}
                    onChange={(e) => {
                      setRescheduleVenueId(e.target.value);
                      setRescheduleCourtId("");
                    }}
                    className="w-full text-xs font-semibold text-slate-800 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none transition cursor-pointer"
                  >
                    <option value="">-- Keep Current / No Venue --</option>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {(() => {
                const selectedV = venues.find(v => String(v.id) === rescheduleVenueId);
                if (!selectedV || !selectedV.courts || selectedV.courts.length === 0) return null;
                return (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Court</label>
                    <select
                      value={rescheduleCourtId}
                      onChange={(e) => setRescheduleCourtId(e.target.value)}
                      className="w-full text-xs font-semibold text-slate-800 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none transition cursor-pointer"
                    >
                      <option value="">-- Any / Unassigned Court --</option>
                      {selectedV.courts.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isSubmittingReschedule}
                  onClick={() => setReschedulingMatch(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingReschedule || !rescheduleDate}
                  onClick={handleRescheduleSubmit}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReschedule ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <span>Save New Schedule</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Reschedule / Rain Delay Modal */}
      {broadcastModalState && (
        <BroadcastSettingsModal
          isOpen={broadcastModalState.isOpen}
          onClose={() => setBroadcastModalState(null)}
          targetId={broadcastModalState.id}
          targetType={broadcastModalState.level}
          targetTitle={broadcastModalState.title}
          onUpdated={() => {
            fetchConfigs();
          }}
        />
      )}

      {batchRescheduleModalState && (
        <BatchRescheduleModal
          isOpen={batchRescheduleModalState.isOpen}
          onClose={() => setBatchRescheduleModalState(null)}
          configId={batchRescheduleModalState.configId}
          tournamentName={batchRescheduleModalState.tournamentName}
          matches={batchRescheduleModalState.matches}
          selectedMatchIds={batchRescheduleModalState.selectedMatchIds}
          onSuccess={(updatedMatches) => {
            clearSelection(batchRescheduleModalState.configId);
            if (updatedMatches && updatedMatches.length > 0) {
              const map = new Map<number, any>(updatedMatches.map(m => [m.id, m]));
              setMatches(prev => ({
                ...prev,
                [batchRescheduleModalState.configId]: (prev[batchRescheduleModalState.configId] || []).map(row => {
                  const updated = map.get(row.id);
                  if (updated) {
                    return {
                      ...row,
                      scheduledAt: updated.scheduledAt,
                      venueName: updated.venueName || row.venueName,
                      courtName: updated.courtName || row.courtName,
                    };
                  }
                  return row;
                })
              }));
            } else {
              tournamentService.getMatchesByConfigId(batchRescheduleModalState.configId).then(data => {
                setMatches(prev => ({ ...prev, [batchRescheduleModalState.configId]: data }));
              }).catch(() => {});
            }
          }}
        />
      )}
    </div>
  );
}
