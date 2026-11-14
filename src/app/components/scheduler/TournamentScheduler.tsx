import React, { useState, useEffect, useMemo } from "react";
import { Loader2, Plus, Calendar, Trophy, X, Eye, MapPin, Users, Clock, Trash2, Globe, Radio, Download, FileSpreadsheet, FileText, ChevronDown, Printer, LayoutGrid, List, Sparkles, Maximize2, Minimize2, Check } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";

import { tournamentService, type FeedVisibilityLevel } from "../../../services/sports/tournamentService";
import { BroadcastSettingsModal } from "../sports/admin/BroadcastSettingsModal";
import type { TournamentTypeInfo, EventInfo, ConfigInfo, TournamentDropdownItem } from "../../../services/sports/tournamentService";
import { sportsService } from "../../../services/sports/sportsService";
import type { EventRegistration } from "../../../types/api";
import { venueService } from "../../../services/bookings/venueService";
import type { Venue } from "../../../types/api";
import { getPartnerDetails } from "../sports/admin/sportsPartnerUtils";
import { exportScheduleToCSV, exportScheduleToExcel, exportScheduleToPDF, exportBracketToPDF } from "../../../utils/sportsExportUtils";
import {
  ScheduleExportModal,
  prepareExportableMatches,
  detectSportName,
  getMatchStage,
  extractTeamNames,
  extractFlatDetails,
  extractDateTime,
  type TournamentStageKey,
} from "../sports/admin/ScheduleExportModal";
import { FixturesListView } from "./FixturesListView";
import { FixturesTableView, type FixtureTableRow } from "./FixturesTableView";
import { getPlayerInitials } from "../sports/SportsSchedule";
import { PlayoffBracketView } from "./PlayoffBracketView";
import {
  reconstructKnockoutByes,
  sanitizePlayoffMatches,
  buildPlayoffDraftFromSavedMatches,
  type PlayoffMatchDraft,
} from "./playoffSchedule";

export interface TournamentSchedulerProps {
  onEditSchedule?: (config: ConfigInfo) => void;
}

export function TournamentScheduler({ onEditSchedule }: TournamentSchedulerProps = {}) {
  const { token, user } = useAuth() as any;

  const handleEditSchedule = (config: ConfigInfo) => {
    if (onEditSchedule) {
      onEditSchedule(config);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", "setup");
      url.searchParams.set("configId", String(config.id));
      if (config.eventId) {
        url.searchParams.set("eventId", String(config.eventId));
      }
      window.location.href = url.toString();
    }
  };
  const [types, setTypes] = useState<TournamentTypeInfo[]>([]);
  const [tournaments, setTournaments] = useState<TournamentDropdownItem[]>([]);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [configs, setConfigs] = useState<ConfigInfo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingConfig, setViewingConfig] = useState<ConfigInfo | null>(null);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);
  const [viewMatches, setViewMatches] = useState<any[]>([]);
  const [viewPlayers, setViewPlayers] = useState<EventRegistration[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState("");
  const [viewDisplayMode, setViewDisplayMode] = useState<"visual" | "list" | "table">("list");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showStageExportModal, setShowStageExportModal] = useState(false);
  const [stageModalDefaultStage, setStageModalDefaultStage] = useState<TournamentStageKey>("ALL");
  const [playoffSubView, setPlayoffSubView] = useState<"cards" | "bracket">("cards");
  const [showByesInBracket, setShowByesInBracket] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [actionConfig, setActionConfig] = useState<{ config: ConfigInfo; type: "delete" | "publish" } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [broadcastModalState, setBroadcastModalState] = useState<{
    isOpen: boolean;
    id: number;
    level: FeedVisibilityLevel;
    title: string;
  } | null>(null);
  const [configuredBroadcastTargets, setConfiguredBroadcastTargets] = useState<Set<string>>(() => new Set());

  const getBroadcastTarget = (config: ConfigInfo) => {
    const level: FeedVisibilityLevel = config.eventId ? "event" : "tournament";
    const id = Number(config.eventId || config.tournamentId || config.id);
    return { id, level, key: `${level}:${id}` };
  };

  const openBroadcastSettings = (config: ConfigInfo) => {
    const target = getBroadcastTarget(config);
    setBroadcastModalState({
      isOpen: true,
      id: target.id,
      level: target.level,
      title: config.tournamentName || "Tournament Broadcast Settings",
    });
  };

  const renderBroadcastButton = (config: ConfigInfo, compact = false) => {
    const isConfigured = configuredBroadcastTargets.has(getBroadcastTarget(config).key);
    return (
      <button
        type="button"
        onClick={() => openBroadcastSettings(config)}
        aria-label={`${isConfigured ? "Edit" : "Configure"} broadcast & feed settings for ${config.tournamentName}`}
        title={isConfigured ? "Broadcast & feed settings are configured. Click to edit." : "Configure Live Now strip and Feed Result Posting Policy"}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 ${compact ? "py-2" : "py-1.5"} text-xs font-bold transition cursor-pointer ${
          isConfigured
            ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
        }`}
      >
        {isConfigured ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Radio className={`h-3.5 w-3.5 ${config.showInFeed !== false ? "text-red-500 animate-pulse" : "text-slate-400"}`} />}
        <span>{isConfigured ? "Configured" : "Broadcast & Feed"}</span>
      </button>
    );
  };

  // Form State
  const [fTournamentId, setFTournamentId] = useState("");
  const [fName, setFName] = useState("");
  const [fEvent, setFEvent] = useState("");
  const [fType, setFType] = useState("");
  const [fTeams, setFTeams] = useState("8");
  const [fStartDate, setFStartDate] = useState("");
  const [fEndDate, setFEndDate] = useState("");
  const [fGroups, setFGroups] = useState("2");
  const [fAdvancing, setFAdvancing] = useState("2");
  const [fSwissRounds, setFSwissRounds] = useState("3");
  const [fDuration, setFDuration] = useState("90");
  const [fBreak, setFBreak] = useState("30");
  const [fVenueId, setFVenueId] = useState<number | null>(null);
  const [fPtsWin, setFPtsWin] = useState("2");
  const [fPtsDraw, setFPtsDraw] = useState("1");
  const [fPtsLoss, setFPtsLoss] = useState("0");
  const [fThirdPlace, setFThirdPlace] = useState(true);
  const [fSeeding, setFSeeding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [venueList, setVenueList] = useState<Venue[]>([]);

  // Scoring & Format Configuration State
  const [fSportName, setFSportName] = useState("");
  const [fOversPerInnings, setFOversPerInnings] = useState("20");
  const [fMaxOversPerBowler, setFMaxOversPerBowler] = useState("4");
  const [fPeriodsCount, setFPeriodsCount] = useState("3");
  const [fPeriodsToWin, setFPeriodsToWin] = useState("2");
  const [fPointsToWinPeriod, setFPointsToWinPeriod] = useState("21");
  const [fMustWinByTwo, setFMustWinByTwo] = useState(true);
  const [fPeriodDurationMinutes, setFPeriodDurationMinutes] = useState("45");
  const [fHasOvertime, setFHasOvertime] = useState(false);
  const [fHasPenaltyShootout, setFHasPenaltyShootout] = useState(false);
  const [fTargetScore, setFTargetScore] = useState("");

  useEffect(() => {
    loadData();
  }, [token]);

  useEffect(() => {
    let active = true;
    const targets = Array.from(new Map(
      configs
        .filter(config => config.status !== "DRAFT")
        .map(config => {
          const target = getBroadcastTarget(config);
          return [target.key, target] as const;
        })
    ).values());

    if (targets.length === 0) {
      setConfiguredBroadcastTargets(new Set());
      return () => { active = false; };
    }

    Promise.all(targets.map(async target => {
      try {
        const settings = await tournamentService.getFeedVisibility(target.level, target.id);
        return settings.explicit === true ? target.key : null;
      } catch {
        return null;
      }
    })).then(results => {
      if (active) setConfiguredBroadcastTargets(new Set(results.filter((key): key is string => key !== null)));
    });

    return () => { active = false; };
  }, [configs]);

  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [resTypes, resTournaments, resEvents, resConfigs] = await Promise.all([
        tournamentService.getTournamentTypes(),
        tournamentService.getTournamentsForDropdown(),
        tournamentService.getEventsForDropdown(),
        tournamentService.getConfigs(),
      ]);
      setTypes(resTypes);
      setTournaments(resTournaments);
      setEvents(resEvents);
      setConfigs(resConfigs);
    } catch (e) {
      console.error("Failed to load tournament data", e);
    }
    // Load venues
    try {
      const v = await venueService.getVenues(user?.communityId);
      setVenueList(v);
    } catch (e) {
      console.error('Failed to load venues', e);
    }
    setLoading(false);
  };

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleConfirmAction = async () => {
    if (!actionConfig) return;
    setActionLoading(true);
    try {
      if (actionConfig.type === "delete") {
        await tournamentService.deleteConfig(actionConfig.config.id);
        showToast("Draft tournament configuration deleted successfully!");
      } else {
        await tournamentService.publishTournamentConfig(actionConfig.config.id);
        showToast("Tournament schedule published! Fixtures are now visible to players.");
      }
      setActionConfig(null);
      loadData();
    } catch (e: any) {
      showToast(`${actionConfig.type === "delete" ? "Delete" : "Publish"} failed: ${e?.message || e}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFeed = async (c: ConfigInfo) => {
    try {
      const currentShow = c.showInFeed !== false; // default true
      const nextShow = !currentShow;
      if (c.eventId) {
        await tournamentService.setFeedVisibility("event", c.eventId, nextShow, true);
      } else if (c.tournamentId) {
        await tournamentService.setFeedVisibility("tournament", c.tournamentId, nextShow, true);
      } else {
        // Fallback: match-level toggle for saved matches under this config
        const matches = await tournamentService.getSavedMatchesByConfigId(c.id);
        for (const m of matches) {
          await tournamentService.setFeedVisibility("match", m.id, nextShow);
        }
      }
      showToast(nextShow ? "Live matches will appear on Community Feed" : "Hidden from Community Feed");
      loadData();
    } catch (e: any) {
      showToast("Failed to update feed visibility: " + (e?.message || e), "error");
    }
  };

  const tournamentOptions = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    // 1. Add canonical tournaments
    for (const t of tournaments) {
      if (t && t.id) {
        map.set(t.id.toString(), { id: t.id.toString(), name: t.name });
      }
    }
    // 2. Add any tournaments referenced in events that might not be in tournaments list
    for (const e of events) {
      if (e.tournamentId) {
        const tid = e.tournamentId.toString();
        if (!map.has(tid)) {
          map.set(tid, { id: tid, name: e.tournamentName || `Tournament #${tid}` });
        }
      }
    }
    return Array.from(map.values());
  }, [tournaments, events]);

  const hasStandaloneEvents = React.useMemo(() => {
    return events.some(e => !e.tournamentId && !e.tournamentName);
  }, [events]);

  const filteredEvents = React.useMemo(() => {
    if (!fTournamentId) return [];
    if (fTournamentId === "standalone") {
      return events.filter(e => !e.tournamentId && !e.tournamentName);
    }
    return events.filter(e => {
      if (e.tournamentId && e.tournamentId.toString() === fTournamentId) return true;
      const t = tournamentOptions.find(opt => opt.id === fTournamentId);
      if (t && e.tournamentName && e.tournamentName.trim().toLowerCase() === t.name.trim().toLowerCase()) {
        return true;
      }
      return false;
    });
  }, [fTournamentId, events, tournamentOptions]);

  const resetForm = () => {
    setEditingId(null);
    setFTournamentId("");
    setFName("");
    setFEvent("");
    setFType("");
    setFTeams("8");
    setFStartDate("");
    setFEndDate("");
    setFGroups("2");
    setFAdvancing("2");
    setFSwissRounds("3");
    setFDuration("90");
    setFBreak("30");
    setFVenueId(null);
    setFPtsWin("2");
    setFPtsDraw("1");
    setFPtsLoss("0");
    setFThirdPlace(true);
    setFSeeding(false);
    setFSportName("");
    setFOversPerInnings("20");
    setFMaxOversPerBowler("4");
    setFPeriodsCount("3");
    setFPeriodsToWin("2");
    setFPointsToWinPeriod("21");
    setFMustWinByTwo(true);
    setFPeriodDurationMinutes("45");
    setFHasOvertime(false);
    setFHasPenaltyShootout(false);
    setFTargetScore("");
  };

  const handleTournamentChange = (tId: string) => {
    setFTournamentId(tId);
    setFEvent("");
    if (!tId) {
      setFName("");
      return;
    }
    const t = tournamentOptions.find(opt => opt.id === tId);
    if (t) {
      setFName(t.name);
    } else if (tId === "standalone") {
      setFName("");
    }
  };

  const handleEventChange = (selectedEventId: string) => {
    setFEvent(selectedEventId);
    const matchedEvent = events.find(ev => ev.id.toString() === selectedEventId);
    if (matchedEvent) {
      const tourney = tournamentOptions.find(opt => opt.id === fTournamentId);
      if (tourney && tourney.name) {
        setFName(`${tourney.name} — ${matchedEvent.name}`);
      } else {
        setFName(matchedEvent.name);
      }
      if (matchedEvent.totalTeams !== undefined && matchedEvent.totalTeams > 0) {
        setFTeams(matchedEvent.totalTeams.toString());
      }
      if (matchedEvent.eventDateStart) {
        setFStartDate(matchedEvent.eventDateStart);
      }
      if (matchedEvent.eventDateEnd) {
        setFEndDate(matchedEvent.eventDateEnd);
      }
      if (matchedEvent.venueId) {
        setFVenueId(matchedEvent.venueId);
      }
      if (matchedEvent.sportName) {
        setFSportName(matchedEvent.sportName);
        tournamentService.getDefaultScoringConfig(matchedEvent.sportName.toUpperCase())
          .then((cfg) => {
            if (cfg) {
              if (cfg.oversPerInnings) setFOversPerInnings(cfg.oversPerInnings.toString());
              if (cfg.maxOversPerBowler) setFMaxOversPerBowler(cfg.maxOversPerBowler.toString());
              if (cfg.periodsCount) setFPeriodsCount(cfg.periodsCount.toString());
              if (cfg.periodsToWin) setFPeriodsToWin(cfg.periodsToWin.toString());
              if (cfg.pointsToWinPeriod) setFPointsToWinPeriod(cfg.pointsToWinPeriod.toString());
              if (cfg.mustWinByTwo !== undefined) setFMustWinByTwo(cfg.mustWinByTwo);
              if (cfg.periodDurationMinutes) setFPeriodDurationMinutes(cfg.periodDurationMinutes.toString());
              if (cfg.hasOvertime !== undefined) setFHasOvertime(cfg.hasOvertime);
              if (cfg.hasPenaltyShootout !== undefined) setFHasPenaltyShootout(cfg.hasPenaltyShootout);
              if (cfg.targetScore) setFTargetScore(cfg.targetScore.toString());
            }
          })
          .catch(() => {});
      }
    }
  };

  const openModal = (config?: ConfigInfo) => {
    if (config) {
      setEditingId(config.id);
      setFName(config.tournamentName || "");
      const evId = config.eventId ? config.eventId.toString() : "";
      setFEvent(evId);
      if (config.eventId) {
        const ev = events.find(e => e.id === config.eventId);
        if (ev) {
          if (ev.tournamentId) {
            setFTournamentId(ev.tournamentId.toString());
          } else if (ev.tournamentName) {
            const t = tournamentOptions.find(opt => opt.name.trim().toLowerCase() === ev.tournamentName?.trim().toLowerCase());
            setFTournamentId(t ? t.id : "standalone");
          } else {
            setFTournamentId("standalone");
          }
          if (ev.sportName) setFSportName(ev.sportName);
        } else {
          setFTournamentId("");
        }
      } else {
        setFTournamentId("");
      }
      setFType(config.tournamentType || "");
      setFTeams(config.totalTeams ? config.totalTeams.toString() : "8");
      setFStartDate(config.startDate || "");
      setFEndDate(config.endDate || "");
      setFGroups(config.numberOfGroups ? config.numberOfGroups.toString() : "2");
      setFAdvancing(config.teamsAdvancingPerGroup ? config.teamsAdvancingPerGroup.toString() : "2");
      setFSwissRounds(config.swissRounds ? config.swissRounds.toString() : "3");
      setFDuration(config.matchDurationMinutes ? config.matchDurationMinutes.toString() : "90");
      setFBreak(config.breakBetweenMatchesMinutes ? config.breakBetweenMatchesMinutes.toString() : "30");
      setFVenueId(config.venueId ?? null);
      setFPtsWin(config.pointsForWin !== undefined ? config.pointsForWin.toString() : "2");
      setFPtsDraw(config.pointsForDraw !== undefined ? config.pointsForDraw.toString() : "1");
      setFPtsLoss(config.pointsForLoss !== undefined ? config.pointsForLoss.toString() : "0");
      setFThirdPlace(config.thirdPlaceMatch !== false);
      setFSeeding(config.hasSeeding === true);
      if (config.sportName) setFSportName(config.sportName);

      tournamentService.getScoringConfig(config.id)
        .then((cfg) => {
          if (cfg) {
            if (cfg.sportType) setFSportName(cfg.sportType);
            if (cfg.oversPerInnings) setFOversPerInnings(cfg.oversPerInnings.toString());
            if (cfg.maxOversPerBowler) setFMaxOversPerBowler(cfg.maxOversPerBowler.toString());
            if (cfg.periodsCount) setFPeriodsCount(cfg.periodsCount.toString());
            if (cfg.periodsToWin) setFPeriodsToWin(cfg.periodsToWin.toString());
            if (cfg.pointsToWinPeriod) setFPointsToWinPeriod(cfg.pointsToWinPeriod.toString());
            if (cfg.mustWinByTwo !== undefined) setFMustWinByTwo(cfg.mustWinByTwo);
            if (cfg.periodDurationMinutes) setFPeriodDurationMinutes(cfg.periodDurationMinutes.toString());
            if (cfg.hasOvertime !== undefined) setFHasOvertime(cfg.hasOvertime);
            if (cfg.hasPenaltyShootout !== undefined) setFHasPenaltyShootout(cfg.hasPenaltyShootout);
            if (cfg.targetScore) setFTargetScore(cfg.targetScore.toString());
          }
        })
        .catch(() => {});
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!fName.trim()) { showToast("Tournament name is required", "error"); return; }
    if (!fType) { showToast("Select a tournament type", "error"); return; }

    const eventId = fEvent || null;
    let sportId = 1, communityId = 1;
    if (eventId) {
      const ev = events.find((e) => e.id.toString() === eventId);
      if (ev) { sportId = ev.sportId; communityId = ev.communityId; }
    }

    const body = {
      tournamentName: fName.trim(),
      sportId,
      communityId,
      eventId: eventId ? Number(eventId) : null,
      tournamentType: fType,
      totalTeams: Number(fTeams) || 8,
      teamIds: [],
      numberOfGroups: fType === "GROUP_KNOCKOUT" ? Number(fGroups) : null,
      teamsAdvancingPerGroup: fType === "GROUP_KNOCKOUT" ? Number(fAdvancing) : null,
      swissRounds: fType === "SWISS" ? Number(fSwissRounds) : null,
      thirdPlaceMatch: fThirdPlace,
      hasSeeding: fSeeding,
      startDate: fStartDate || null,
      endDate: fEndDate || null,
      matchDurationMinutes: Number(fDuration) || 90,
      breakBetweenMatchesMinutes: Number(fBreak) || 30,
      venueId: fVenueId,
      pointsForWin: Number(fPtsWin),
      pointsForDraw: Number(fPtsDraw),
      pointsForLoss: Number(fPtsLoss),
    };

    setSaving(true);
    try {
      let savedConfigId = editingId;
      if (editingId) {
        const res = await tournamentService.updateConfig(editingId, body);
        savedConfigId = res?.id || editingId;
      } else {
        const res = await tournamentService.createConfig(body);
        savedConfigId = res?.id;
      }

      if (savedConfigId) {
        try {
          await tournamentService.saveScoringConfig({
            configId: savedConfigId,
            sportType: (fSportName || "DEFAULT").toUpperCase(),
            periodsCount: Number(fPeriodsCount) || 2,
            pointsToWinPeriod: fPointsToWinPeriod ? Number(fPointsToWinPeriod) : undefined,
            mustWinByTwo: fMustWinByTwo,
            periodsToWin: fPeriodsToWin ? Number(fPeriodsToWin) : undefined,
            periodDurationMinutes: fPeriodDurationMinutes ? Number(fPeriodDurationMinutes) : undefined,
            hasOvertime: fHasOvertime,
            hasPenaltyShootout: fHasPenaltyShootout,
            oversPerInnings: fOversPerInnings ? Number(fOversPerInnings) : undefined,
            maxOversPerBowler: fMaxOversPerBowler ? Number(fMaxOversPerBowler) : undefined,
            ballsPerOver: 6,
            targetScore: fTargetScore ? Number(fTargetScore) : undefined,
          });
        } catch (scErr) {
          console.warn("Could not save scoring rules config", scErr);
        }
      }

      showToast(editingId ? "Configuration updated!" : "Configuration saved!");
      setIsModalOpen(false);
      loadData();
    } catch (e: any) {
      showToast("Save failed: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const formatType = (t: string) => {
    const map: any = { KNOCKOUT: "Knockout", GROUP_KNOCKOUT: "Group+KO", ROUND_ROBIN: "Round Robin", DOUBLE_ELIMINATION: "Double Elim", SWISS: "Swiss", SUPER_LEAGUE: "Super League" };
    return map[t] || t;
  };

  const openScheduleDetails = async (config: ConfigInfo) => {
    setViewingConfig(config);
    setIsScheduleExpanded(false);
    setViewMatches([]);
    setViewPlayers([]);
    setViewError("");
    setViewDisplayMode("list");
    setPlayoffSubView("cards");
    setShowExportMenu(false);
    setShowByesInBracket(typeof (config as any).showByesInBracket === 'boolean' ? (config as any).showByesInBracket : true);
    setViewLoading(true);
    const [matchesResult, playersResult] = await Promise.allSettled([
      tournamentService.getSavedMatchesByConfigId(config.id),
      config.eventId ? sportsService.getEventRegistrations(config.eventId) : Promise.resolve([] as EventRegistration[]),
    ]);
    const matchedEvent = events.find((item) => item.id === config.eventId);
    const resolvedSport = config.sportName || matchedEvent?.sportName || detectSportName(config.tournamentName) || detectSportName(config.eventName) || "Tournament";
    if (matchesResult.status === "fulfilled") {
      const enrichedMatches = (matchesResult.value || []).map((m: any) => ({
        ...m,
        sport: m.sport || m.sportName || resolvedSport,
        sportName: m.sportName || m.sport || resolvedSport,
        tournamentName: m.tournamentName || config.tournamentName,
      }));
      const completeMatchesWithByes = reconstructKnockoutByes(enrichedMatches, config);
      setViewMatches(completeMatchesWithByes);
    } else {
      setViewError("Could not load the saved match schedule.");
    }
    if (playersResult.status === "fulfilled") {
      setViewPlayers(playersResult.value.filter((player) => player.status === "CONFIRMED" || player.status === "REGISTERED"));
    } else {
      setViewError((current) => current ? `${current} Player registrations could not be loaded.` : "Player registrations could not be loaded.");
    }
    setViewLoading(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-4 text-left">
      {toast && (
        <div className={`fixed bottom-8 right-8 p-4 rounded-lg shadow-lg z-50 font-medium ${toast.type === "success" ? "bg-green-500 text-white" : toast.type === "info" ? "bg-indigo-600 text-white" : "bg-red-500 text-white"}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex h-[60px] min-h-[60px] max-h-[60px] w-full items-center justify-between gap-2 overflow-hidden rounded-xl border border-slate-200/80 bg-white px-3 py-0 shadow-sm">
        <div className="flex min-w-0 items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
          <h1 className="truncate text-xs font-bold leading-4 text-slate-900">Tournament configurations</h1>
          <span className="inline-flex h-3.5 min-w-3.5 shrink-0 items-center justify-center rounded-full bg-indigo-100 px-1 text-[8px] font-extrabold leading-none text-indigo-700">{configs.length}</span>
        </div>
        <button onClick={() => openModal()} aria-label="New configuration" title="New configuration" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-56 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div>
        ) : configs.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500"><Trophy className="h-6 w-6" /></div>
            <p className="mt-3 text-sm font-bold text-slate-800">No tournament configurations yet</p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">Create a configuration to set the format, dates and match rules for a tournament.</p>
            <button onClick={() => openModal()} className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"><Plus className="h-3.5 w-3.5" /> Create configuration</button>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="block sm:hidden divide-y divide-slate-100">
              {configs.map((c) => (
                <div key={c.id} className="p-3.5 space-y-2.5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{c.tournamentName}</h4>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{c.eventName || formatType(c.tournamentType)}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0
                      ${c.status === "DRAFT" ? "bg-slate-100 text-slate-600" :
                        c.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" :
                        c.status === "LIVE" ? "bg-indigo-50 text-indigo-700" :
                        "bg-sky-50 text-sky-700"}`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Format & Teams</span>
                      <span className="font-semibold">{formatType(c.tournamentType)} · {c.totalTeams || "—"} teams</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Start Date</span>
                      <span className="font-semibold">{c.startDate || "—"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100/70">
                    <button
                      onClick={() => void openScheduleDetails(c)}
                      aria-label={`View ${c.tournamentName} schedule details`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 py-2 px-2.5 text-xs font-bold text-indigo-700 active:scale-[0.98] transition cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                    <button
                      onClick={() => openModal(c)}
                      className="rounded-lg py-2 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleEditSchedule(c)}
                      aria-label={`Edit ${c.tournamentName} complete schedule`}
                      title="Edit complete schedule, rules & fixtures in Setup Schedule"
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-purple-200 bg-purple-50 py-2 px-2 text-xs font-bold text-purple-700 active:scale-[0.98] transition cursor-pointer hover:bg-purple-100 hover:border-purple-300"
                    >
                      <Calendar className="h-3.5 w-3.5" /> Edit Schedule
                    </button>
                    {c.status === "DRAFT" ? (
                      <>
                        <button
                          onClick={() => setActionConfig({ config: c, type: "publish" })}
                          aria-label={`Publish ${c.tournamentName} schedule`}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 py-2 px-2.5 text-xs font-bold text-emerald-700 active:scale-[0.98] transition cursor-pointer"
                        >
                          <Globe className="h-3.5 w-3.5" /> Publish
                        </button>
                        <button
                          onClick={() => setActionConfig({ config: c, type: "delete" })}
                          aria-label={`Delete ${c.tournamentName} draft configuration`}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      renderBroadcastButton(c, true)
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Tournament</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Type</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Event</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Teams</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Start date</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">View</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {configs.map((c) => (
                    <tr key={c.id} className="transition-colors hover:bg-indigo-50/40">
                      <td className="max-w-[260px] truncate px-4 py-3 text-sm font-bold text-slate-900">{c.tournamentName}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatType(c.tournamentType)}</td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-sm text-slate-600">{c.eventName || "—"}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">{c.totalTeams || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{c.startDate || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wide
                          ${c.status === "DRAFT" ? "bg-slate-100 text-slate-600" :
                            c.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" :
                            c.status === "LIVE" ? "bg-indigo-50 text-indigo-700" :
                            "bg-sky-50 text-sky-700"}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => void openScheduleDetails(c)} aria-label={`View ${c.tournamentName} schedule details`} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100">
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openModal(c)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-50 hover:text-indigo-900">
                            Edit
                          </button>
                          <button
                            onClick={() => handleEditSchedule(c)}
                            aria-label={`Edit ${c.tournamentName} complete schedule`}
                            title="Open setup schedule page with this configuration to edit complete schedule"
                            className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-xs font-bold text-purple-700 transition hover:border-purple-300 hover:bg-purple-100 cursor-pointer"
                          >
                            <Calendar className="h-3.5 w-3.5" /> Edit Schedule
                          </button>
                          {c.status === "DRAFT" ? (
                            <>
                              <button
                                onClick={() => setActionConfig({ config: c, type: "publish" })}
                                aria-label={`Publish ${c.tournamentName} schedule`}
                                title="Publish tournament schedule & fixtures to players"
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                              >
                                <Globe className="h-3.5 w-3.5" /> Publish
                              </button>
                              <button
                                onClick={() => setActionConfig({ config: c, type: "delete" })}
                                aria-label={`Delete ${c.tournamentName} draft configuration`}
                                title="Delete draft configuration"
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </button>
                            </>
                          ) : (
                            renderBroadcastButton(c)
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {viewingConfig && (() => {
        const event = events.find((item) => item.id === viewingConfig.eventId);
        const venue = venueList.find((item) => item.id === viewingConfig.venueId);
        const dateLabel = (value?: string) => value ? new Date(value.length === 10 ? `${value}T00:00:00` : value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "Not set";
        const matchDateLabel = (value?: string) => value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Time not set";
        const detail = (label: string, value: React.ReactNode) => (
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <div className="mt-1 text-sm font-semibold text-slate-800">{value || "Not set"}</div>
          </div>
        );
        const handleExport = (formatType: "csv" | "excel" | "pdf", stageFilter: TournamentStageKey = "ALL") => {
          if (viewMatches.length === 0) return;
          const resolvedSport = viewingConfig.sportName || event?.sportName || detectSportName(viewingConfig.tournamentName) || detectSportName(viewingConfig.eventName) || "Tournament";
          const exportData = prepareExportableMatches(viewMatches, stageFilter, resolvedSport);
          if (exportData.length === 0) {
            showToast(`No matches found for stage: ${stageFilter}`, "error");
            return;
          }
          const stageSuffix = stageFilter === "ALL" ? "Full_Schedule" :
            stageFilter === "GROUP" ? "Group_Stage" :
            stageFilter === "ROUND_OF_64" ? "Round_of_64" :
            stageFilter === "ROUND_OF_32" ? "Round_of_32" :
            stageFilter === "ROUND_OF_16" ? "Round_of_16" :
            stageFilter === "QUARTER_FINAL" ? "Quarter_Finals" :
            stageFilter === "SEMI_FINAL" ? "Semi_Finals" :
            stageFilter === "FINAL" ? "Finals" : stageFilter;
          const title = `${viewingConfig.tournamentName || "Tournament"}_${stageSuffix}`;
          if (formatType === "csv") exportScheduleToCSV(exportData, title);
          else if (formatType === "excel") exportScheduleToExcel(exportData, title);
          else if (formatType === "pdf") exportScheduleToPDF(exportData, `${viewingConfig.tournamentName || "Tournament Schedule"} - ${stageSuffix.replace(/_/g, " ")}`);
          showToast(`Exported ${exportData.length} ${stageSuffix.replace(/_/g, " ")} matches as ${formatType.toUpperCase()}`);
        };

        // Calculate available stages from matches
        const stageCounts: Record<TournamentStageKey, number> = {
          ALL: viewMatches.length,
          GROUP: 0,
          ROUND_OF_64: 0,
          ROUND_OF_32: 0,
          ROUND_OF_16: 0,
          QUARTER_FINAL: 0,
          SEMI_FINAL: 0,
          FINAL: 0,
          THIRD_PLACE: 0,
        };
        viewMatches.forEach(m => {
          const s = getMatchStage(m);
          stageCounts[s] = (stageCounts[s] || 0) + 1;
        });

        const availableStages: { key: TournamentStageKey; label: string; count: number }[] = [
          { key: "ALL", label: "Full Tournament", count: stageCounts.ALL },
          ...(stageCounts.GROUP > 0 ? [{ key: "GROUP" as const, label: "Group Stage", count: stageCounts.GROUP }] : []),
          ...(stageCounts.ROUND_OF_64 > 0 ? [{ key: "ROUND_OF_64" as const, label: "Round of 64", count: stageCounts.ROUND_OF_64 }] : []),
          ...(stageCounts.ROUND_OF_32 > 0 ? [{ key: "ROUND_OF_32" as const, label: "Round of 32", count: stageCounts.ROUND_OF_32 }] : []),
          ...(stageCounts.ROUND_OF_16 > 0 ? [{ key: "ROUND_OF_16" as const, label: "Round of 16", count: stageCounts.ROUND_OF_16 }] : []),
          ...(stageCounts.QUARTER_FINAL > 0 ? [{ key: "QUARTER_FINAL" as const, label: "Quarter-Finals", count: stageCounts.QUARTER_FINAL }] : []),
          ...(stageCounts.SEMI_FINAL > 0 ? [{ key: "SEMI_FINAL" as const, label: "Semi-Finals", count: stageCounts.SEMI_FINAL }] : []),
          ...(stageCounts.FINAL > 0 || stageCounts.THIRD_PLACE > 0
            ? [{ key: "FINAL" as const, label: "Finals & 3rd Place", count: stageCounts.FINAL + stageCounts.THIRD_PLACE }]
            : []),
        ];

        // Prepare Fixtures Table Rows for List & Table views (identical to SetupSchedule)
        const maxSavedMatchNumber = viewMatches.reduce((max, match) => {
          const number = Number(match.matchNumber);
          return Number.isFinite(number) && number > max ? number : max;
        }, 0);
        let nextFallbackMatchNumber = maxSavedMatchNumber;
        const fixturesTableRows: FixtureTableRow[] = viewMatches.map((m, idx) => {
          const { team1, team2 } = extractTeamNames(m);
          const { team1Flat, team2Flat } = extractFlatDetails(m);
          const { date, time } = extractDateTime(m);
          const savedMatchNumber = Number(m.matchNumber);
          const matchNumber = Number.isFinite(savedMatchNumber) && savedMatchNumber > 0
            ? savedMatchNumber
            : ++nextFallbackMatchNumber;
          const stageKey = getMatchStage(m);
          const isPlayoff = stageKey !== "GROUP";
          const stageLabel =
            stageKey === "GROUP" ? (m.groupName || m.roundName || "Group Stage") :
            stageKey === "QUARTER_FINAL" ? "Quarter-Finals" :
            stageKey === "SEMI_FINAL" ? "Semi-Finals" :
            stageKey === "FINAL" ? "Final" :
            stageKey === "THIRD_PLACE" ? "3rd Place" :
            stageKey === "ROUND_OF_64" ? "Round of 64" :
            stageKey === "ROUND_OF_32" ? "Round of 32" :
            stageKey === "ROUND_OF_16" ? "Round of 16" : (m.roundName || `Round ${m.roundNumber || 1}`);

          return {
            id: String(m.matchId || m.id || idx),
            key: `fixture-${m.matchId || m.id || idx}`,
            matchNumber,
            stage: stageLabel,
            isPlayoff,
            date: date || (m.scheduledAt ? String(m.scheduledAt).split("T")[0] : m.matchDate || ""),
            time: time || "",
            duration: m.duration || 30,
            venueId: m.venueId || null,
            courtId: m.courtId || null,
            venueName: m.venueName || venue?.name || "Main Arena",
            courtName: m.courtName || "",
            home: { id: `p1-${idx}`, name: team1, flatNumber: team1Flat !== "—" ? team1Flat : undefined },
            away: { id: `p2-${idx}`, name: team2, flatNumber: team2Flat !== "—" ? team2Flat : undefined },
            conflicts: [],
            rawMatch: m,
          };
        }).sort((a, b) => a.matchNumber - b.matchNumber);

        // Build PlayoffMatchDraft[] for the connected bracket tree view
        const playoffMatchesForBracket: PlayoffMatchDraft[] = buildPlayoffDraftFromSavedMatches(
          viewMatches,
          viewingConfig
        );
        const normalizedPlayoffMatches = sanitizePlayoffMatches(playoffMatchesForBracket, true);
        const normalizedPlayoffById = new Map(normalizedPlayoffMatches.map(match => [String(match.id), match]));
        const displayFixturesTableRows = fixturesTableRows.flatMap(row => {
          if (!row.isPlayoff) return [row];
          const normalizedMatch = normalizedPlayoffById.get(String(row.id));
          if (!normalizedMatch) return [];
          return [{
            ...row,
            home: {
              ...row.home,
              name: normalizedMatch.home.name,
              flatNumber: normalizedMatch.home.flatNumber || row.home.flatNumber,
            },
            away: {
              ...row.away,
              name: normalizedMatch.away.name,
              flatNumber: normalizedMatch.away.flatNumber || row.away.flatNumber,
            },
            rawMatch: normalizedMatch,
          }];
        });

        const earliestPlayoffRound = playoffMatchesForBracket.length > 0
          ? Math.min(...playoffMatchesForBracket.filter(m => m.round !== 'THIRD_PLACE').map(m => m.roundIndex))
          : 0;
        const firstRoundMatchesCount = playoffMatchesForBracket.filter(
          m => m.round !== 'THIRD_PLACE' && m.roundIndex === earliestPlayoffRound
        ).length;
        let totalDrawCountCalc = firstRoundMatchesCount * 2;
        let drawPower = 1;
        while (drawPower < totalDrawCountCalc) drawPower <<= 1;
        const totalDrawCount = drawPower >= 2 ? drawPower : (viewingConfig.totalTeams || undefined);

        const handleExportBracketPDF = () => {
          const matchesToExport = showByesInBracket
            ? playoffMatchesForBracket
            : sanitizePlayoffMatches(playoffMatchesForBracket, false);
          if (matchesToExport.length === 0) {
            showToast("No bracket matches available to download", "error");
            return;
          }
          const resolvedSport = viewingConfig.sportName || event?.sportName || detectSportName(viewingConfig.tournamentName) || detectSportName(viewingConfig.eventName) || "Tournament";
          exportBracketToPDF(
            matchesToExport as any,
            `${viewingConfig.tournamentName || "Tournament"} Knockout Draw`,
            "Mana Community Sports",
            resolvedSport
          );
          showToast("Exported tournament bracket draw as PDF", "success");
        };

        return (
          <>
            <div className={`fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-950/55 backdrop-blur-sm ${isScheduleExpanded ? "p-0" : "p-0 sm:p-2"}`} onMouseDown={(e) => { if (e.target === e.currentTarget) setViewingConfig(null); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="schedule-details-title" className={`flex flex-col overflow-hidden border border-slate-200 bg-white shadow-2xl ${isScheduleExpanded ? "h-dvh w-screen rounded-none" : "h-dvh w-screen rounded-none sm:h-[96vh] sm:w-[98vw] sm:rounded-2xl"}`}>
              <header className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white px-4 py-4 sm:px-6">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700"><Calendar className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <p className="m-0 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-600">{event?.name || viewingConfig.eventName || "Tournament match schedule"}</p>
                    <h2 id="schedule-details-title" className="mt-1 truncate text-base font-extrabold text-slate-900 sm:text-lg">{viewingConfig.tournamentName}</h2>
                    {!isScheduleExpanded && <p className="mt-0.5 text-xs text-slate-500">{event ? `${event.sportName} · ${event.communityName}` : "Tournament configuration details"}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isScheduleExpanded && <button
                    type="button"
                    onClick={() => {
                      const c = viewingConfig;
                      setViewingConfig(null);
                      handleEditSchedule(c);
                    }}
                    aria-label="Edit complete schedule"
                    title="Edit complete tournament schedule in Setup Schedule"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 transition hover:bg-purple-100 hover:border-purple-300 cursor-pointer"
                  >
                    <Calendar className="h-3.5 w-3.5" /> Edit Schedule
                  </button>}
                  <button
                    type="button"
                    onClick={() => setIsScheduleExpanded(value => !value)}
                    aria-label={isScheduleExpanded ? "Exit full screen schedule" : "View schedule full screen"}
                    title={isScheduleExpanded ? "Exit full screen" : "View schedule full screen"}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    {isScheduleExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                  <button onClick={() => setViewingConfig(null)} aria-label="Close schedule details" className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"><X className="h-4 w-4" /></button>
                </div>
              </header>

              <div className={`min-h-0 flex-1 space-y-4 overflow-y-auto ${isScheduleExpanded ? "p-2 sm:p-3" : "p-4 sm:p-6"}`}>
                {viewLoading ? (
                  <div className="flex min-h-40 items-center justify-center gap-2 text-sm font-medium text-slate-500"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" />Loading event players and schedule…</div>
                ) : (
                  <>
                    {viewError && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-800">{viewError}</div>}
                    {!isScheduleExpanded && <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                      {detail("Format", formatType(viewingConfig.tournamentType))}
                      {detail("Registered players", <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-indigo-500" />{viewPlayers.length}</span>)}
                      {detail("Scheduled matches", viewMatches.length)}
                      {detail("Status", <span className="capitalize">{(viewingConfig.status || "Not set").toLowerCase()}</span>)}
                      {detail("Dates", `${dateLabel(viewingConfig.startDate)} – ${dateLabel(viewingConfig.endDate)}`)}
                      {detail("Venue", <span className="inline-flex items-center gap-1.5 truncate"><MapPin className="h-3.5 w-3.5 shrink-0 text-indigo-500" />{venue?.name || "Not set"}</span>)}
                    </div>}

                    {/* View Switcher & Export Toolbar */}
                    {!isScheduleExpanded && <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 sm:p-3 bg-white rounded-xl border border-[rgba(99,102,241,0.12)] shadow-sm">
                      {/* Left: View Mode Pills */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
                        <span className="text-xs font-bold text-slate-700 whitespace-nowrap hidden xs:inline">View:</span>
                        <div className="flex flex-wrap rounded-lg p-0.5 bg-slate-100 border border-slate-200 shrink-0">
                          <button
                            type="button"
                            onClick={() => setViewDisplayMode("list")}
                            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer border-none shrink-0 ${
                              viewDisplayMode === "list" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900 bg-transparent"
                            }`}
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Match Schedule</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setViewDisplayMode("visual");
                              setPlayoffSubView("bracket");
                            }}
                            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer border-none shrink-0 ${
                              viewDisplayMode === "visual" && playoffSubView === "bracket" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900 bg-transparent"
                            }`}
                          >
                            <LayoutGrid className="h-3.5 w-3.5" />
                            <span>Bracket</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setViewDisplayMode("visual");
                              setPlayoffSubView("cards");
                            }}
                            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer border-none shrink-0 ${
                              viewDisplayMode === "visual" && playoffSubView === "cards" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900 bg-transparent"
                            }`}
                          >
                            <List className="h-3.5 w-3.5" />
                            <span>Bracket List</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewDisplayMode("table")}
                            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer border-none shrink-0 ${
                              viewDisplayMode === "table" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900 bg-transparent"
                            }`}
                          >
                            <span>Table</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-600 font-bold">{viewMatches.length}</span>
                          </button>
                        </div>
                      </div>

                      {/* Right: Export & Download Toolbar */}
                      <div className="relative self-end sm:self-auto w-full sm:w-auto">
                        <button
                          type="button"
                          disabled={viewMatches.length === 0}
                          onClick={() => setShowExportMenu(!showExportMenu)}
                          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Export &amp; Download</span>
                          <ChevronDown className="w-3 h-3 text-indigo-500" />
                        </button>

                        {showExportMenu && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                            <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 w-full sm:w-72 max-w-[calc(100vw-36px)] p-2 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100 max-h-[460px] overflow-y-auto">
                              {/* Stage Export Center Button (Full Modal) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setShowExportMenu(false);
                                  setStageModalDefaultStage("ALL");
                                  setShowStageExportModal(true);
                                }}
                                className="w-full flex items-center gap-2.5 p-2.5 text-xs text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/90 rounded-lg transition-colors cursor-pointer text-left font-medium border border-indigo-200/80"
                              >
                                <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
                                <div className="flex flex-col">
                                  <span className="font-bold text-indigo-900">Stage Export Center</span>
                                  <span className="text-[10px] text-indigo-600">Select stages, format &amp; preview</span>
                                </div>
                              </button>

                              {/* Visual Bracket PDF Draw Download */}
                              {playoffMatchesForBracket.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowExportMenu(false);
                                    handleExportBracketPDF();
                                  }}
                                  className="w-full flex items-center gap-2.5 p-2.5 text-xs text-purple-700 bg-purple-50/80 hover:bg-purple-100/90 rounded-lg transition-colors cursor-pointer text-left font-medium border border-purple-200/80"
                                >
                                  <Download className="h-4 w-4 text-purple-600 shrink-0" />
                                  <div className="flex flex-col">
                                    <span className="font-bold text-purple-900">Download Bracket Draw (PDF)</span>
                                    <span className="text-[10px] text-purple-600">Printable multi-round tree diagram with connectors</span>
                                  </div>
                                </button>
                              )}

                              {/* Stage Specific Download Sections */}
                              <div className="px-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-100">
                                Stage-wise Downloads
                              </div>

                              {availableStages.map((stage) => (
                                <div key={stage.key} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex flex-col gap-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800">{stage.label}</span>
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                      {stage.count} match{stage.count !== 1 ? "es" : ""}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setShowExportMenu(false);
                                        handleExport("csv", stage.key);
                                      }}
                                      className="flex items-center justify-center gap-1 py-1 px-1.5 text-[11px] font-semibold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-200 rounded transition-colors cursor-pointer"
                                      title={`Download ${stage.label} CSV`}
                                    >
                                      <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                                      <span>CSV</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setShowExportMenu(false);
                                        handleExport("excel", stage.key);
                                      }}
                                      className="flex items-center justify-center gap-1 py-1 px-1.5 text-[11px] font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded transition-colors cursor-pointer"
                                      title={`Download ${stage.label} Excel`}
                                    >
                                      <FileSpreadsheet className="w-3 h-3 text-blue-600" />
                                      <span>Excel</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setShowExportMenu(false);
                                        handleExport("pdf", stage.key);
                                      }}
                                      className="flex items-center justify-center gap-1 py-1 px-1.5 text-[11px] font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded transition-colors cursor-pointer"
                                      title={`Print / PDF ${stage.label}`}
                                    >
                                      <Printer className="w-3 h-3 text-rose-600" />
                                      <span>PDF</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>}

                    {/* View 1: Visual Draw & Bracket */}
                    {viewDisplayMode === "visual" && (
                      <div className="space-y-6">
                        {viewMatches.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                            <Trophy className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                            <p className="text-xs font-semibold text-slate-600">No bracket matches available yet</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Generate or save matches for this tournament configuration to see the visual draw.</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between border-b border-[rgba(99,102,241,0.12)] pb-3">
                              <p className="m-0 text-sm font-bold text-[#0d0d2b]">
                                {playoffSubView === "bracket" ? "Bracket" : "Bracket List"}
                              </p>
                              <span className="text-xs font-semibold text-[#6b7094]">
                                {playoffSubView === "bracket" ? playoffMatchesForBracket.length : viewMatches.length} matches
                              </span>
                            </div>

                            {playoffSubView === "bracket" ? (
                              playoffMatchesForBracket.length > 0 ? (
                                <PlayoffBracketView
                                  matches={showByesInBracket ? playoffMatchesForBracket : sanitizePlayoffMatches(playoffMatchesForBracket, false)}
                                  onEditMatch={() => {}}
                                  onDownloadBracket={handleExportBracketPDF}
                                  resolveVenueName={(id) => {
                                    const v = venueList.find(x => x.id === id);
                                    return v?.name || venue?.name || "";
                                  }}
                                  resolveCourtName={(courtId) => {
                                    if (!courtId) return "";
                                    const found = viewMatches.find(x => String(x.courtId) === String(courtId));
                                    return found?.courtName || "";
                                  }}
                                  showByes={showByesInBracket}
                                  onToggleShowByes={() => {
                                    const nextVal = !showByesInBracket;
                                    setShowByesInBracket(nextVal);
                                    showToast(nextVal ? `Showing full ${totalDrawCount || ''} draw with BYEs` : 'Hiding BYEs (compact bracket)', "info");
                                  }}
                                  totalDrawCount={totalDrawCount}
                                />
                              ) : (
                                <div className="flex min-h-[50vh] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                                  <div>
                                    <Trophy className="mx-auto mb-2 h-8 w-8 text-slate-400" />
                                    <p className="m-0 text-sm font-semibold text-slate-600">No knockout bracket available</p>
                                    <p className="mb-0 mt-1 text-xs text-slate-400">This schedule does not contain bracket matches.</p>
                                  </div>
                                </div>
                              )
                            ) : playoffMatchesForBracket.length > 0 ? (
                              <FixturesListView
                                fixtures={displayFixturesTableRows.filter(f => f.isPlayoff)}
                                onEditMatch={() => {}}
                                sportName={event?.sportName || "Tournament"}
                              />
                            ) : (
                              <div className="flex min-h-[50vh] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                                <div>
                                  <Trophy className="mx-auto mb-2 h-8 w-8 text-slate-400" />
                                  <p className="m-0 text-sm font-semibold text-slate-600">No bracket matches to list</p>
                                  <p className="mb-0 mt-1 text-xs text-slate-400">This schedule does not contain knockout matches.</p>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* View 2: List View */}
                    {viewDisplayMode === "list" && (
                      <div className="mt-1">
                        <FixturesListView
                          fixtures={displayFixturesTableRows}
                          onEditMatch={() => {}}
                          sportName={event?.sportName || "Tournament"}
                        />
                      </div>
                    )}

                    {/* View 3: Fixtures Table */}
                    {viewDisplayMode === "table" && (
                      <div className="mt-1">
                        <FixturesTableView
                          fixtures={displayFixturesTableRows}
                          onEditMatch={() => {}}
                          onExportCSV={() => handleExport("csv", "ALL")}
                          onExportExcel={() => handleExport("excel", "ALL")}
                          onExportPDF={() => handleExport("pdf", "ALL")}
                        />
                      </div>
                    )}

                    {/* Registered Players Collapsible / Section */}
                    {!isScheduleExpanded && viewDisplayMode !== "visual" && viewPlayers.length > 0 && (
                      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3.5 py-3">
                          <h3 className="m-0 inline-flex items-center gap-2 text-xs font-extrabold text-slate-800"><Users className="h-4 w-4 text-indigo-600" />Registered players</h3>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">{viewPlayers.length}</span>
                        </div>
                        <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0 sm:gap-1 sm:p-2 max-h-48 overflow-y-auto">
                          {viewPlayers.map((player) => {
                            const partnerInfo = getPartnerDetails(player, viewPlayers, event);
                            const isDoubles = partnerInfo.isDoublesEvent;
                            return (
                              <div key={player.id} className="flex min-w-0 items-start justify-between gap-3 px-3 py-2 sm:rounded-lg sm:px-2.5 hover:bg-slate-50 transition-colors text-xs">
                                <div className="min-w-0 flex-1">
                                  <p className="m-0 truncate font-bold text-slate-800">
                                    {player.playerName || player.user?.fullName || "Player"}
                                  </p>
                                  {isDoubles && partnerInfo.hasPartner && (
                                    <p className="m-0 mt-0.5 truncate text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
                                      <span>+ {partnerInfo.name}</span>
                                      {partnerInfo.relation && (
                                        <span className="text-[9px] text-slate-500 font-normal">({partnerInfo.relation})</span>
                                      )}
                                    </p>
                                  )}
                                  <p className="m-0 mt-0.5 truncate text-[10px] text-slate-500">
                                    {[player.category?.name, player.flatNumber].filter(Boolean).join(" · ") || player.status}
                                  </p>
                                </div>
                                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
                                  {player.status}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    )}
                  </>
                )}

                {!isScheduleExpanded && viewDisplayMode !== "visual" && <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
                  <h3 className="m-0 text-xs font-bold uppercase tracking-wider text-slate-500">Match settings</h3>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-xs sm:grid-cols-3 lg:grid-cols-6">
                    <div><span className="text-slate-400">Duration</span><p className="mb-0 mt-1 inline-flex items-center gap-1 font-semibold text-slate-800"><Clock className="h-3.5 w-3.5 text-indigo-500" />{viewingConfig.matchDurationMinutes ? `${viewingConfig.matchDurationMinutes} min` : "Not set"}</p></div>
                    <div><span className="text-slate-400">Break between</span><p className="mb-0 mt-1 font-semibold text-slate-800">{viewingConfig.breakBetweenMatchesMinutes != null ? `${viewingConfig.breakBetweenMatchesMinutes} min` : "Not set"}</p></div>
                    <div><span className="text-slate-400">Groups</span><p className="mb-0 mt-1 font-semibold text-slate-800">{viewingConfig.numberOfGroups ?? "—"}</p></div>
                    <div><span className="text-slate-400">Advancing / group</span><p className="mb-0 mt-1 font-semibold text-slate-800">{viewingConfig.teamsAdvancingPerGroup ?? "—"}</p></div>
                    <div><span className="text-slate-400">Swiss rounds</span><p className="mb-0 mt-1 font-semibold text-slate-800">{viewingConfig.swissRounds ?? "—"}</p></div>
                    <div><span className="text-slate-400">Points (W / D / L)</span><p className="mb-0 mt-1 font-semibold text-slate-800">{viewingConfig.pointsForWin ?? 2} / {viewingConfig.pointsForDraw ?? 1} / {viewingConfig.pointsForLoss ?? 0}</p></div>
                  </div>
                </div>}
              </div>

              {!isScheduleExpanded && <footer className="flex justify-between items-center border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-6">
                <span className="text-xs text-slate-400 font-medium">Tournament ID: #{viewingConfig.id}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const c = viewingConfig;
                      setViewingConfig(null);
                      handleEditSchedule(c);
                    }}
                    aria-label="Edit complete schedule"
                    title="Edit complete tournament schedule in Setup Schedule"
                    className="min-h-9 inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 transition hover:bg-purple-100 hover:border-purple-300 cursor-pointer"
                  >
                    <Calendar className="h-3.5 w-3.5" /> Edit Complete Schedule
                  </button>
                  <button onClick={() => setViewingConfig(null)} className="min-h-9 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-700 cursor-pointer">Close</button>
                </div>
              </footer>}
            </section>
          </div>

          {showStageExportModal && (
            <ScheduleExportModal
              isOpen={showStageExportModal}
              onClose={() => setShowStageExportModal(false)}
              tournamentName={viewingConfig.tournamentName || "Tournament"}
              matches={viewMatches}
              defaultStage={stageModalDefaultStage}
              sportName={viewingConfig.sportName || event?.sportName || detectSportName(viewingConfig.tournamentName) || detectSportName(viewingConfig.eventName)}
            />
          )}
        </>
      );
      })()}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6">
          <div className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3.5 sm:px-5">
              <h2 className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                {editingId ? "Edit Tournament Configuration" : "New Tournament Configuration"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} aria-label="Close configuration" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Tournament *
                  </label>
                  <select
                    value={fTournamentId}
                    onChange={(e) => handleTournamentChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
                  >
                    <option value="">— Select Tournament —</option>
                    {tournamentOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                    {hasStandaloneEvents && (
                      <option value="standalone">— Standalone / Individual Events —</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Sport Event / Category *
                  </label>
                  <select
                    value={fEvent}
                    onChange={(e) => handleEventChange(e.target.value)}
                    disabled={!fTournamentId}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <option value="">
                      {!fTournamentId
                        ? "— Select Tournament First —"
                        : filteredEvents.length === 0
                        ? "— No events under this tournament —"
                        : "— Select Sport Event / Category —"}
                    </option>
                    {filteredEvents.map((e) => {
                      const rawFmt = e.formats || e.format;
                      const fmtList = Array.isArray(rawFmt) ? rawFmt : (rawFmt ? [rawFmt] : []);
                      const fmt = fmtList.map(f => String(f).toUpperCase() === 'SINGLES' ? 'Singles' : String(f).toUpperCase() === 'DOUBLES' ? 'Doubles' : String(f).toUpperCase().includes('MIXED') ? 'Mixed Doubles' : String(f).toUpperCase() === 'TEAM' ? 'Team' : f).join(' / ');
                      const fmtPart = fmt && !e.name.toLowerCase().includes(fmt.toLowerCase()) ? ` — ${fmt}` : '';
                      return (
                        <option key={e.id} value={e.id}>
                          {e.name}{fmtPart} {e.sportName ? `(${e.sportName})` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Configuration Title / Schedule Name *
                </label>
                <input
                  type="text"
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  placeholder="e.g. Monsoon Badminton Cup — Men's Doubles Championship"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Auto-populated when selecting a tournament and sport event, but customizable for your schedule.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tournament Type *</label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  {types.map((t) => (
                    <button key={t.id} type="button" onClick={() => setFType(t.id)}
                      className={`min-h-[108px] rounded-xl border p-3.5 text-left transition-all ${fType === t.id ? "border-indigo-500 bg-indigo-50 shadow-sm ring-2 ring-indigo-500/10" : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"}`}>
                      <div className={`text-sm font-bold tracking-tight ${fType === t.id ? "text-indigo-700" : "text-slate-800"}`}>{t.name}</div>
                      <div className="text-xs text-slate-500 mt-1 leading-snug">{t.description}</div>
                      <div className="text-[10px] mt-2 bg-indigo-50 text-indigo-700 inline-block px-2 py-0.5 rounded">{t.teamRange} teams</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Total Teams *</label>
                  <input type="number" min="2" max="128" value={fTeams} onChange={(e) => setFTeams(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Start Date *</label>
                  <input type="date" value={fStartDate} onChange={(e) => setFStartDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 [color-scheme:light]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">End Date</label>
                  <input type="date" value={fEndDate} onChange={(e) => setFEndDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 [color-scheme:light]" />
                </div>
              </div>

              {fType === "GROUP_KNOCKOUT" && (
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Number of Groups</label>
                    <input type="number" min="2" max="8" value={fGroups} onChange={(e) => setFGroups(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Advancing per Group</label>
                    <input type="number" min="1" max="8" value={fAdvancing} onChange={(e) => setFAdvancing(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                  </div>
                </div>
              )}

              {fType === "SWISS" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Swiss Rounds</label>
                  <input type="number" min="1" max="20" value={fSwissRounds} onChange={(e) => setFSwissRounds(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Duration (min)</label>
                  <input type="number" value={fDuration} onChange={(e) => setFDuration(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Break (min)</label>
                  <input type="number" value={fBreak} onChange={(e) => setFBreak(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Venue</label>
                  <select value={fVenueId ?? ''} onChange={(e) => setFVenueId(e.target.value ? Number(e.target.value) : null)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10">
                    <option value="">— Select Venue —</option>
                    {venueList.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Pts Win</label>
                  <input type="number" value={fPtsWin} onChange={(e) => setFPtsWin(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Pts Draw</label>
                  <input type="number" value={fPtsDraw} onChange={(e) => setFPtsDraw(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Pts Loss</label>
                  <input type="number" value={fPtsLoss} onChange={(e) => setFPtsLoss(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                </div>
              </div>

              {/* Scoring & Match Format Rules (Pre-Match Config) */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                      Match Format & Scoring Rules
                    </span>
                    {fSportName && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        {fSportName}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-indigo-600 font-medium">Pre-Match Configuration</span>
                </div>

                {/* CRICKET FIELDS */}
                {(fSportName.toUpperCase().includes("CRICKET") || (!fSportName && !fEvent)) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Overs per Innings / Match
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={fOversPerInnings}
                        onChange={(e) => setFOversPerInnings(e.target.value)}
                        placeholder="e.g. 20 (T20) or 10"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500"
                      />
                      <span className="text-[10px] text-slate-400">Total overs each team bats</span>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Max Overs per Bowler
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={fMaxOversPerBowler}
                        onChange={(e) => setFMaxOversPerBowler(e.target.value)}
                        placeholder="e.g. 4 (T20) or 2"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500"
                      />
                      <span className="text-[10px] text-slate-400">Quota limit per single bowler</span>
                    </div>
                  </div>
                )}

                {/* RACKET / SET-BASED SPORTS */}
                {["BADMINTON", "TENNIS", "TABLE_TENNIS", "PICKLEBALL", "SQUASH", "VOLLEYBALL"].some(s => fSportName.toUpperCase().includes(s)) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Max Sets (Periods)
                      </label>
                      <select
                        value={fPeriodsCount}
                        onChange={(e) => {
                          setFPeriodsCount(e.target.value);
                          setFPeriodsToWin(e.target.value === "5" ? "3" : "2");
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="1">1 Set (Single Game)</option>
                        <option value="3">Best of 3 Sets (First to 2)</option>
                        <option value="5">Best of 5 Sets (First to 3)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Points to Win Set
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={fPointsToWinPeriod}
                        onChange={(e) => setFPointsToWinPeriod(e.target.value)}
                        placeholder="e.g. 21 (Badminton) or 11"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={fMustWinByTwo}
                          onChange={(e) => setFMustWinByTwo(e.target.checked)}
                          className="w-4 h-4 accent-indigo-600"
                        />
                        Must Win by 2 (Deuce)
                      </label>
                    </div>
                  </div>
                )}

                {/* TIMED SPORTS (FOOTBALL, BASKETBALL, KABADDI) */}
                {["FOOTBALL", "SOCCER", "BASKETBALL", "KABADDI"].some(s => fSportName.toUpperCase().includes(s)) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Periods / Halves
                      </label>
                      <select
                        value={fPeriodsCount}
                        onChange={(e) => setFPeriodsCount(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="2">2 Halves</option>
                        <option value="4">4 Quarters</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Minutes per Period
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={fPeriodDurationMinutes}
                        onChange={(e) => setFPeriodDurationMinutes(e.target.value)}
                        placeholder="e.g. 45 or 20"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={fHasOvertime}
                          onChange={(e) => setFHasOvertime(e.target.checked)}
                          className="w-3.5 h-3.5 accent-indigo-600"
                        />
                        Extra Time / Overtime
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={fHasPenaltyShootout}
                          onChange={(e) => setFHasPenaltyShootout(e.target.checked)}
                          className="w-3.5 h-3.5 accent-indigo-600"
                        />
                        Penalty Shootout
                      </label>
                    </div>
                  </div>
                )}

                {/* TARGET / BOARD SPORTS (CARROM, DARTS, SNOOKER, FOOSBALL) */}
                {["CARROM", "DART", "POOL", "BILLIARDS", "SNOOKER", "FOOSBALL"].some(s => fSportName.toUpperCase().includes(s)) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Target Score to Win
                      </label>
                      <input
                        type="number"
                        value={fTargetScore}
                        onChange={(e) => setFTargetScore(e.target.value)}
                        placeholder="e.g. 25 (Carrom) or 501 (Darts)"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Max Boards / Frames
                      </label>
                      <input
                        type="number"
                        value={fPeriodsCount}
                        onChange={(e) => setFPeriodsCount(e.target.value)}
                        placeholder="e.g. 8 boards or 5 frames"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-100 pt-3">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                  <input type="checkbox" checked={fThirdPlace} onChange={(e) => setFThirdPlace(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                  3rd Place Match
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                  <input type="checkbox" checked={fSeeding} onChange={(e) => setFSeeding(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                  Seeded Draw
                </label>
              </div>

            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-5">
              <button onClick={() => setIsModalOpen(false)} className="min-h-10 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200/70 hover:text-slate-900">
                Cancel
              </button>
              <button disabled={saving} onClick={handleSave} className="flex min-h-10 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? "Update Configuration" : "Save Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}

      {broadcastModalState && (
        <BroadcastSettingsModal
          isOpen={broadcastModalState.isOpen}
          onClose={() => setBroadcastModalState(null)}
          targetId={broadcastModalState.id}
          targetType={broadcastModalState.level}
          targetTitle={broadcastModalState.title}
          onUpdated={() => loadData()}
        />
      )}

      {actionConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget && !actionLoading) setActionConfig(null); }}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${actionConfig.type === "delete" ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}>
                {actionConfig.type === "delete" ? <Trash2 className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-slate-900">
                  {actionConfig.type === "delete" ? "Delete Draft Configuration" : "Publish Tournament Schedule"}
                </h3>
                <p className="truncate text-xs text-slate-500 mt-0.5">{actionConfig.config.tournamentName}</p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-600">
              {actionConfig.type === "delete"
                ? `Are you sure you want to delete draft tournament "${actionConfig.config.tournamentName}"? All draft match fixtures associated with this configuration will be permanently removed. This action cannot be undone.`
                : `Publish schedule for "${actionConfig.config.tournamentName}"? Match fixtures will become immediately visible to all players and residents on the community schedule and dashboard.`}
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActionConfig(null)}
                disabled={actionLoading}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50 ${
                  actionConfig.type === "delete"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {actionConfig.type === "delete" ? "Delete Draft" : "Publish Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
