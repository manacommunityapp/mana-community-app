import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Gavel,
  Trophy,
  Users,
  IndianRupee,
  Clock,
  Shield,
  Tag,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  HelpCircle,
  Loader2,
  Sliders,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { auctionService } from "../../../services/sports/auctionService";
import { sportsService } from "../../../services/sports/sportsService";
import type { AuctionConfigRequest, AuctionConfigResponse } from "../../../types/api";

export interface AuctionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (savedConfig: AuctionConfigResponse) => void;
  editingConfig?: AuctionConfigResponse | null;
  defaultEventId?: number;
  communityEvents?: Array<{
    id: number;
    name: string;
    sport?: { id: number; name: string };
    status?: string;
    maxParticipants?: number;
    registeredCount?: number;
    registrationCount?: number;
    registeredParticipants?: number;
    minPlayers?: number;
    maxPlayers?: number;
    totalTeams?: number;
    maxTeams?: number;
    teamCount?: number;
    teamsCount?: number;
    teams?: any[];
    registrations?: any[];
    spots?: string;
    [key: string]: any;
  }>;
  communityUsers?: Array<{ id: number; name: string }>;
}

export const SPORT_OPTIONS = [
  { id: 1, name: "Cricket", emoji: "🏏" },
  { id: 8, name: "Cricket (Tennis Ball)", emoji: "🏏" },
  { id: 2, name: "Badminton", emoji: "🏸" },
  { id: 3, name: "Football", emoji: "⚽" },
  { id: 4, name: "Volleyball", emoji: "🏐" },
  { id: 5, name: "Table Tennis", emoji: "🏓" },
  { id: 6, name: "Tennis", emoji: "🎾" },
  { id: 7, name: "Basketball", emoji: "🏀" },
];

export const DEFAULT_CATEGORY_PRESETS: Record<string, string[]> = {
  cricket: ["Batsmen", "Bowlers", "All-rounders", "Wicket-Keepers"],
  "cricket (tennis ball)": ["Batsmen", "Bowlers", "All-rounders", "Wicket-Keepers"],
  "cricket tennis ball": ["Batsmen", "Bowlers", "All-rounders", "Wicket-Keepers"],
  badminton: ["Men's Singles", "Women's Singles", "Men's Doubles", "Mixed Doubles"],
  football: ["Forwards", "Midfielders", "Defenders", "Goalkeepers"],
  volleyball: ["Attackers / Spikers", "Setters", "Blockers", "Liberos"],
};

export function getSportCategoryPreset(sportName: string): string[] {
  const key = (sportName || "").toLowerCase().trim();
  if (DEFAULT_CATEGORY_PRESETS[key]) return DEFAULT_CATEGORY_PRESETS[key];
  if (key.includes("cricket")) return DEFAULT_CATEGORY_PRESETS.cricket;
  return DEFAULT_CATEGORY_PRESETS[key] || ["General"];
}

export function validateAuctionConfigForm(form: {
  seasonName?: string;
  totalTeams: number;
  totalPlayers: number;
  budgetPerTeam: number;
  basePrice: number;
  bidIncrementDefault: number;
  bidIncrementThreshold: number;
  bidIncrementAbove: number;
  bidTimerSeconds: number;
  categories: string[];
}): string | null {
  if (!form.seasonName?.trim()) return "Season Name is required (e.g. 'Season 2026').";
  if (form.totalTeams < 2 || form.totalTeams > 20) return "Total participating teams must be between 2 and 20.";
  if (form.totalPlayers < 1) return "Total players in pool must be at least 1.";
  if (form.budgetPerTeam < 1000) return "Budget per team must be at least ₹1,000.";
  if (form.basePrice < 100) return "Base price must be at least ₹100.";
  if (form.basePrice > form.budgetPerTeam) return "Base price cannot exceed total team budget.";
  if (form.bidIncrementDefault < 100) return "Default bid increment must be at least ₹100.";
  if (form.bidIncrementThreshold < 0) return "Increment threshold cannot be negative.";
  if (form.bidIncrementAbove < 100) return "Increment above threshold must be at least ₹100.";
  if (form.bidTimerSeconds < 10 || form.bidTimerSeconds > 120) return "Bid timer must be between 10 and 120 seconds.";
  if (!form.categories || form.categories.length === 0) return "At least one player category must be defined.";
  return null;
}

export function calculateNextBidAmount(
  currentBid: number,
  threshold: number,
  defaultIncrement: number,
  aboveIncrement: number
): {
  nextBid: number;
  incrementApplied: number;
  isAboveThreshold: boolean;
} {
  const isAboveThreshold = currentBid >= threshold;
  const incrementApplied = isAboveThreshold ? aboveIncrement : defaultIncrement;
  return {
    nextBid: currentBid + incrementApplied,
    incrementApplied,
    isAboveThreshold,
  };
}

export function computeSquadMetrics(totalTeams: number, totalPlayers: number, budgetPerTeam: number) {
  const avgSquadSize = totalTeams > 0 ? parseFloat((totalPlayers / totalTeams).toFixed(1)) : 0;
  const avgSpendPerPlayer = totalPlayers > 0 ? Math.round((totalTeams * budgetPerTeam) / totalPlayers) : 0;
  const totalCombinedPurse = totalTeams * budgetPerTeam;
  return { avgSquadSize, avgSpendPerPlayer, totalCombinedPurse };
}

export function parseDisputeCommitteeIds(raw: unknown): number[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(Number).filter((n) => !isNaN(n) && n > 0);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);
  }
  if (typeof raw === "number" && !isNaN(raw) && raw > 0) {
    return [raw];
  }
  return [];
}

export interface EventSyncMetrics {
  totalTeams?: number;
  totalPlayers?: number;
  sportId?: number;
  seasonName?: string;
  sourceDesc?: string;
  eventName?: string;
}

/**
 * Extracts and maps total participating teams, player pool size, sport, and metadata
 * from a selected sports event object dynamically rather than static defaults.
 */
export function extractEventMetrics(ev: any): EventSyncMetrics {
  if (!ev) return {};

  const metrics: EventSyncMetrics = {};
  if (ev.name) {
    metrics.eventName = ev.name;
    metrics.seasonName = `${ev.name} ${new Date().getFullYear()}`;
  }

  // 1. Sport ID
  if (ev.sport?.id && typeof ev.sport.id === "number") {
    metrics.sportId = ev.sport.id;
  } else if (typeof ev.sportId === "number") {
    metrics.sportId = ev.sportId;
  } else if (ev.sport?.name || ev.sportName) {
    const sName = String(ev.sport?.name || ev.sportName).toLowerCase().trim();
    const matched =
      (sName.includes("tennis ball") ? SPORT_OPTIONS.find((s) => s.name.toLowerCase().includes("tennis ball")) : undefined) ||
      SPORT_OPTIONS.find((s) => s.name.toLowerCase() === sName) ||
      (sName.includes("cricket") ? SPORT_OPTIONS.find((s) => s.name.toLowerCase() === "cricket") : undefined);
    if (matched) {
      metrics.sportId = matched.id;
    }
  }

  // 2. Extract Total Players
  // Priority: explicit totalPlayers -> maxParticipants -> registeredCount -> spots string -> registrations array -> maxPlayers
  let players: number | undefined = undefined;
  if (typeof ev.totalPlayers === "number" && ev.totalPlayers > 0) {
    players = ev.totalPlayers;
  } else if (typeof ev.maxParticipants === "number" && ev.maxParticipants > 0) {
    players = ev.maxParticipants;
  } else if (typeof ev.registeredCount === "number" && ev.registeredCount > 0) {
    players = ev.registeredCount;
  } else if (typeof ev.registrationCount === "number" && ev.registrationCount > 0) {
    players = ev.registrationCount;
  } else if (typeof ev.registeredParticipants === "number" && ev.registeredParticipants > 0) {
    players = ev.registeredParticipants;
  } else if (Array.isArray(ev.registrations) && ev.registrations.length > 0) {
    players = ev.registrations.length;
  } else if (typeof ev.spots === "string") {
    const match = ev.spots.match(/\/(\d+)/) || ev.spots.match(/(\d+)\s*spots/i);
    if (match && Number(match[1]) > 0) {
      players = Number(match[1]);
    }
  } else if (typeof ev.maxPlayers === "number" && ev.maxPlayers > 0) {
    players = ev.maxPlayers;
  }

  if (players !== undefined) {
    metrics.totalPlayers = Math.min(500, Math.max(1, Math.round(players)));
  }

  // 3. Extract Total Teams
  // Priority: explicit totalTeams -> maxTeams -> teamCount -> teamsCount -> teams.length -> registeredTeams.length -> nominatedCaptains.length -> derived squad
  let teams: number | undefined = undefined;
  if (typeof ev.totalTeams === "number" && ev.totalTeams >= 2) {
    teams = ev.totalTeams;
  } else if (typeof ev.maxTeams === "number" && ev.maxTeams >= 2) {
    teams = ev.maxTeams;
  } else if (typeof ev.teamCount === "number" && ev.teamCount >= 2) {
    teams = ev.teamCount;
  } else if (typeof ev.teamsCount === "number" && ev.teamsCount >= 2) {
    teams = ev.teamsCount;
  } else if (Array.isArray(ev.teams) && ev.teams.length >= 2) {
    teams = ev.teams.length;
  } else if (Array.isArray(ev.registeredTeams) && ev.registeredTeams.length >= 2) {
    teams = ev.registeredTeams.length;
  } else if (Array.isArray(ev.nominatedCaptains) && ev.nominatedCaptains.length >= 2) {
    teams = ev.nominatedCaptains.length;
  } else if (metrics.totalPlayers && ev.minPlayers && ev.minPlayers > 0) {
    const estimated = Math.floor(metrics.totalPlayers / ev.minPlayers);
    if (estimated >= 2 && estimated <= 20) {
      teams = estimated;
    }
  } else if (metrics.totalPlayers && ev.maxPlayers && ev.maxPlayers > 0) {
    const estimated = Math.round(metrics.totalPlayers / ev.maxPlayers);
    if (estimated >= 2 && estimated <= 20) {
      teams = estimated;
    }
  }

  if (teams !== undefined) {
    metrics.totalTeams = Math.min(20, Math.max(2, Math.round(teams)));
  }

  if (metrics.totalTeams || metrics.totalPlayers) {
    metrics.sourceDesc = `Synced from ${ev.name || "selected event"}: ${metrics.totalTeams ? `${metrics.totalTeams} teams` : ""}${metrics.totalTeams && metrics.totalPlayers ? ", " : ""}${metrics.totalPlayers ? `${metrics.totalPlayers} players in pool` : ""}`;
  }

  return metrics;
}

export const AuctionConfigModal: React.FC<AuctionConfigModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
  editingConfig,
  defaultEventId,
  communityEvents = [],
  communityUsers = [],
}) => {
  const isEditMode = Boolean(editingConfig && editingConfig.id);

  // Form State
  const [sportId, setSportId] = useState<number>(1);
  const [eventId, setEventId] = useState<number | undefined>(undefined);
  const [seasonName, setSeasonName] = useState<string>(`Season ${new Date().getFullYear()}`);
  const [auctionFormat, setAuctionFormat] = useState<string>("OPEN_AUCTION");
  const [totalTeams, setTotalTeams] = useState<number>(8);
  const [totalPlayers, setTotalPlayers] = useState<number>(40);
  const [budgetPerTeam, setBudgetPerTeam] = useState<number>(100000);
  const [basePrice, setBasePrice] = useState<number>(1000);
  const [bidIncrementDefault, setBidIncrementDefault] = useState<number>(1000);
  const [bidIncrementThreshold, setBidIncrementThreshold] = useState<number>(10000);
  const [bidIncrementAbove, setBidIncrementAbove] = useState<number>(5000);
  const [bidTimerSeconds, setBidTimerSeconds] = useState<number>(30);
  const [rtmEnabled, setRtmEnabled] = useState<boolean>(true);
  const [unsoldRule, setUnsoldRule] = useState<string>("ROTATION_AUCTION");
  const [categories, setCategories] = useState<string[]>(["Batsmen", "Bowlers", "All-rounders", "Wicket-Keepers"]);
  const [newCategoryInput, setNewCategoryInput] = useState<string>("");
  const [committeeMembers, setCommitteeMembers] = useState<Array<{ id?: number; name: string }>>([]);
  const [committeeSearchQuery, setCommitteeSearchQuery] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>("overview");

  // Live Event Sync State
  const [syncedEventInfo, setSyncedEventInfo] = useState<{
    name: string;
    teams: number;
    players: number;
  } | null>(null);
  const [isSyncingEvent, setIsSyncingEvent] = useState<boolean>(false);

  // Scroll container ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Synchronizes total teams and player pool counts from the selected sports event.
   * Performs an immediate synchronous mapping from communityEvents, followed by an
   * asynchronous enrichment (active registrations & nominated captains).
   */
  const syncEventData = async (selectedEvId?: number, options?: { force?: boolean }) => {
    if (!selectedEvId) {
      setSyncedEventInfo(null);
      return;
    }

    const matchedEvent = communityEvents.find((e) => e.id === selectedEvId);
    const syncMetrics = extractEventMetrics(matchedEvent);

    if (syncMetrics.sportId) {
      setSportId(syncMetrics.sportId);
      if (!isEditMode) {
        const sportObj = SPORT_OPTIONS.find((s) => s.id === syncMetrics.sportId);
        const preset = getSportCategoryPreset(sportObj?.name || "");
        if (preset && preset.length > 0) {
          setCategories([...preset]);
        }
      }
    }

    if (!isEditMode && syncMetrics.seasonName) {
      setSeasonName((prev) => (prev.startsWith("Season ") || prev === "" || options?.force ? syncMetrics.seasonName! : prev));
    }

    let appliedTeams = syncMetrics.totalTeams;
    let appliedPlayers = syncMetrics.totalPlayers;

    if (appliedTeams) {
      setTotalTeams(appliedTeams);
    }
    if (appliedPlayers) {
      setTotalPlayers(appliedPlayers);
    }

    if (appliedTeams || appliedPlayers) {
      setSyncedEventInfo({
        name: matchedEvent?.name || `Event #${selectedEvId}`,
        teams: appliedTeams ?? totalTeams,
        players: appliedPlayers ?? totalPlayers,
      });
    }

    // Secondary async enrichment from sports & auction services
    setIsSyncingEvent(true);
    try {
      const [nominatedCaptains, eventDetails, registrations] = await Promise.allSettled([
        auctionService.getNominatedCaptains(selectedEvId),
        sportsService.getEventById(selectedEvId),
        sportsService.getEventRegistrations(selectedEvId),
      ]);

      let enrichedTeams = appliedTeams;
      let enrichedPlayers = appliedPlayers;
      let eventName = matchedEvent?.name;

      if (eventDetails.status === "fulfilled" && eventDetails.value) {
        const fullMetrics = extractEventMetrics(eventDetails.value);
        if (fullMetrics.eventName) eventName = fullMetrics.eventName;
        if (fullMetrics.totalTeams && !enrichedTeams) enrichedTeams = fullMetrics.totalTeams;
        if (fullMetrics.totalPlayers && !enrichedPlayers) enrichedPlayers = fullMetrics.totalPlayers;
      }

      if (nominatedCaptains.status === "fulfilled" && Array.isArray(nominatedCaptains.value) && nominatedCaptains.value.length >= 2) {
        enrichedTeams = Math.min(20, Math.max(2, nominatedCaptains.value.length));
      }

      if (registrations.status === "fulfilled" && Array.isArray(registrations.value)) {
        const activeRegs = registrations.value.filter(
          (r: any) => r.status !== "CANCELLED" && r.status !== "REJECTED" && r.status !== "WITHDRAWN"
        );
        if (activeRegs.length >= 1 && (!enrichedPlayers || activeRegs.length > enrichedPlayers)) {
          enrichedPlayers = Math.min(500, activeRegs.length);
        }
      }

      if (enrichedTeams && enrichedTeams !== appliedTeams) {
        setTotalTeams(enrichedTeams);
      }
      if (enrichedPlayers && enrichedPlayers !== appliedPlayers) {
        setTotalPlayers(enrichedPlayers);
      }

      if (enrichedTeams || enrichedPlayers) {
        setSyncedEventInfo({
          name: eventName || `Event #${selectedEvId}`,
          teams: enrichedTeams ?? (appliedTeams ?? totalTeams),
          players: enrichedPlayers ?? (appliedPlayers ?? totalPlayers),
        });
      }
    } catch (err) {
      console.warn("Async event enrichment notice:", err);
    } finally {
      setIsSyncingEvent(false);
    }
  };

  // Sync state with editingConfig or defaultEventId when opened
  useEffect(() => {
    if (!isOpen) return;

    if (editingConfig) {
      setSportId(editingConfig.sportId ?? 1);
      setEventId(editingConfig.eventId || undefined);
      setSeasonName(editingConfig.seasonName || "");
      setAuctionFormat(editingConfig.auctionFormat || "OPEN_AUCTION");
      setTotalTeams(editingConfig.totalTeams || 8);
      setTotalPlayers(editingConfig.totalPlayers || 40);
      setBudgetPerTeam(editingConfig.budgetPerTeam || 100000);
      setBasePrice(editingConfig.basePrice || 1000);
      setBidIncrementDefault(editingConfig.bidIncrementDefault || 1000);
      setBidIncrementThreshold(editingConfig.bidIncrementThreshold || 10000);
      setBidIncrementAbove(editingConfig.bidIncrementAbove || 5000);
      setBidTimerSeconds(editingConfig.bidTimerSeconds || 30);
      setRtmEnabled(editingConfig.rtmEnabled ?? true);
      setUnsoldRule(editingConfig.unsoldRule || "ROTATION_AUCTION");
      setCategories(
        editingConfig.categories && editingConfig.categories.length > 0
          ? editingConfig.categories
          : ["Batsmen", "Bowlers", "All-rounders", "Wicket-Keepers"]
      );
      setCommitteeMembers(
        (editingConfig.committeeMembers || []).map((name, idx) => ({ id: idx + 1, name }))
      );

      if (editingConfig.eventId) {
        const ev = communityEvents.find((e) => e.id === editingConfig.eventId);
        setSyncedEventInfo({
          name: editingConfig.eventName || ev?.name || `Event #${editingConfig.eventId}`,
          teams: editingConfig.totalTeams,
          players: editingConfig.totalPlayers,
        });
      } else {
        setSyncedEventInfo(null);
      }
    } else {
      // Defaults for Create mode
      const initialEvId = defaultEventId;
      setSportId(1);
      setEventId(initialEvId);
      setSeasonName(`Season ${new Date().getFullYear()}`);
      setAuctionFormat("OPEN_AUCTION");
      setTotalTeams(8);
      setTotalPlayers(40);
      setBudgetPerTeam(100000);
      setBasePrice(1000);
      setBidIncrementDefault(1000);
      setBidIncrementThreshold(10000);
      setBidIncrementAbove(5000);
      setBidTimerSeconds(30);
      setRtmEnabled(true);
      setUnsoldRule("ROTATION_AUCTION");
      setCategories(["Batsmen", "Bowlers", "All-rounders", "Wicket-Keepers"]);
      setCommitteeMembers([]);
      setSyncedEventInfo(null);

      if (initialEvId) {
        syncEventData(initialEvId, { force: true });
      }
    }
    setNewCategoryInput("");
    setCommitteeSearchQuery("");
    setActiveSection("overview");
  }, [isOpen, editingConfig, defaultEventId]);

  // When sport changes in Create mode, update default categories
  const handleSportChange = (newSportId: number) => {
    setSportId(newSportId);
    if (!isEditMode) {
      const sportObj = SPORT_OPTIONS.find((s) => s.id === newSportId);
      const preset = getSportCategoryPreset(sportObj?.name || "");
      if (preset && preset.length > 0) {
        setCategories([...preset]);
      }
    }
  };

  // When event selection changes, dynamically sync teams, players, and sport rules
  const handleEventChange = (selectedEvId?: number) => {
    setEventId(selectedEvId);
    if (selectedEvId) {
      syncEventData(selectedEvId, { force: true });
    } else {
      setSyncedEventInfo(null);
    }
  };

  // Category management
  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`Category "${trimmed}" already exists.`);
      return;
    }
    setCategories([...categories, trimmed]);
    setNewCategoryInput("");
  };

  const handleRemoveCategory = (catToRemove: string) => {
    if (categories.length <= 1) {
      toast.error("At least one category is required.");
      return;
    }
    setCategories(categories.filter(c => c !== catToRemove));
  };

  const handleApplyPreset = (sportName: string) => {
    const preset = getSportCategoryPreset(sportName);
    if (preset && preset.length > 0) {
      setCategories([...preset]);
      toast.success(`Applied ${sportName} category presets`);
    }
  };

  // Committee management
  const handleAddCommitteeMember = (user: { id: number; name: string }) => {
    if (committeeMembers.some(c => c.name.toLowerCase() === user.name.toLowerCase())) {
      toast.error(`${user.name} is already in the committee.`);
      return;
    }
    setCommitteeMembers([...committeeMembers, user]);
    setCommitteeSearchQuery("");
  };

  const handleRemoveCommitteeMember = (name: string) => {
    setCommitteeMembers(committeeMembers.filter(c => c.name !== name));
  };

  // Filtered community users for committee
  const filteredUsers = useMemo(() => {
    if (!committeeSearchQuery.trim()) return [];
    const q = committeeSearchQuery.toLowerCase();
    return communityUsers
      .filter(u => u.name.toLowerCase().includes(q) && !committeeMembers.some(c => c.name.toLowerCase() === u.name.toLowerCase()))
      .slice(0, 8);
  }, [communityUsers, committeeSearchQuery, committeeMembers]);

  // Squad metrics computation
  const squadMetrics = useMemo(
    () => computeSquadMetrics(totalTeams, totalPlayers, budgetPerTeam),
    [totalTeams, totalPlayers, budgetPerTeam]
  );

  // Selected sport object
  const currentSport = useMemo(
    () => SPORT_OPTIONS.find((s) => s.id === sportId) || SPORT_OPTIONS[0],
    [sportId]
  );

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const target = document.getElementById(`section-${sectionId}`);
    if (target && scrollContainerRef.current) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Validation
  const validateForm = (): string | null => {
    return validateAuctionConfigForm({
      seasonName,
      totalTeams,
      totalPlayers,
      budgetPerTeam,
      basePrice,
      bidIncrementDefault,
      bidIncrementThreshold,
      bidIncrementAbove,
      bidTimerSeconds,
      categories,
    });
  };

  // Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const payload: AuctionConfigRequest = {
      sportId,
      eventId: eventId || undefined,
      seasonName: seasonName.trim(),
      auctionFormat,
      totalTeams: Number(totalTeams),
      totalPlayers: Number(totalPlayers),
      budgetPerTeam: Number(budgetPerTeam),
      basePrice: Number(basePrice),
      bidIncrementDefault: Number(bidIncrementDefault),
      bidIncrementThreshold: Number(bidIncrementThreshold),
      bidIncrementAbove: Number(bidIncrementAbove),
      bidTimerSeconds: Number(bidTimerSeconds),
      rtmEnabled,
      unsoldRule,
      categories,
      committeeMembers: committeeMembers.map(c => c.name),
    };

    setIsSubmitting(true);
    try {
      let result: AuctionConfigResponse;
      if (isEditMode && editingConfig) {
        result = await auctionService.updateConfig(editingConfig.id, payload);
        toast.success(`Auction configuration for "${seasonName}" updated successfully!`);
      } else {
        result = await auctionService.createConfig(payload);
        toast.success(`Auction configuration for "${seasonName}" created successfully!`);
      }

      // Sync committee with event table if eventId provided and committee IDs exist
      if (eventId && committeeMembers.length > 0) {
        const committeeIds = committeeMembers
          .map(c => c.id)
          .filter((id): id is number => typeof id === "number" && !isNaN(id));
        if (committeeIds.length > 0) {
          sportsService.updateCommittee(eventId, committeeIds).catch(err => {
            console.warn("Could not sync committee IDs to sports event", err);
          });
        }
      }

      onSaveSuccess(result);
      onClose();
    } catch (err: any) {
      console.error("Auction config save error:", err);
      toast.error(err?.message || "Failed to save auction configuration");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl h-[92vh] max-h-[92vh] flex flex-col shadow-2xl text-left overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-50/70 via-white to-slate-50 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-xl shadow-md shadow-amber-500/20 shrink-0">
                <Gavel size={22} className="stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 m-0 leading-tight">
                    {isEditMode ? "Edit Auction Configuration" : "New Auction Configuration"}
                  </h2>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isEditMode
                        ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                        : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {isEditMode ? "Edit Mode" : "New Config"}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                    <span>{currentSport.emoji}</span>
                    <span>{currentSport.name}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 m-0 mt-0.5 truncate">
                  Define tournament rules, team budgets, bidding increments, and category structures
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-200/80 rounded-xl text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer shrink-0"
              title="Close Modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick-Scroll In-Modal Section Anchor Bar */}
          <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100 overflow-x-auto no-scrollbar">
            {[
              { id: "overview", label: "1. Overview", icon: Trophy },
              { id: "teams", label: "2. Teams & Purse", icon: Users },
              { id: "bidding", label: "3. Bidding Ladder", icon: IndianRupee },
              { id: "categories", label: "4. Categories & Rules", icon: Tag },
              { id: "committee", label: "5. Dispute Committee", icon: Shield },
            ].map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  <Icon size={13} />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Form Body - Single Smooth Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
            style={{ scrollbarWidth: "thin" }}
          >
            {/* ── SECTION 1: Overview & Tournament Details ── */}
            <div
              id="section-overview"
              className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 transition-all"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                    <Trophy size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 m-0">1. Tournament & Auction Overview</h3>
                    <p className="text-[11px] text-slate-500 m-0">
                      Select sport discipline, link community event, and choose auction style
                    </p>
                  </div>
                </div>
              </div>

              {/* Sport Selection with Quick Emoji Chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  Sport Discipline <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {SPORT_OPTIONS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSportChange(s.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        sportId === s.id
                          ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-sm">{s.emoji}</span>
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-400 block pt-0.5">
                  Selecting a sport automatically loads category presets and positional buckets.
                </span>
              </div>

              {/* Event, Season, Format Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                {/* Mapped Event */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Mapped Sports Event</label>
                  <select
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    value={eventId ?? ""}
                    onChange={(e) => handleEventChange(e.target.value ? Number(e.target.value) : undefined)}
                  >
                    <option value="">No Event (Standalone Auction)</option>
                    {communityEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name} {ev.sport?.name ? `(${ev.sport.name})` : ""}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 block">
                    {eventId ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={11} /> Links registered players & auto-populates teams and player pool.
                      </span>
                    ) : (
                      "Optional: select a tournament event to auto-populate teams and player pool size."
                    )}
                  </span>
                </div>

                {/* Season Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    Season / Edition Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                    placeholder="e.g. LEPL Season 2 (2026)"
                    value={seasonName}
                    onChange={(e) => setSeasonName(e.target.value)}
                    required
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Appears on live scoreboard and player cards.
                  </span>
                </div>

                {/* Auction Format */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    Auction Format <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                    value={auctionFormat}
                    onChange={(e) => setAuctionFormat(e.target.value)}
                  >
                    <option value="OPEN_AUCTION">Open Auction (Real-time English bidding)</option>
                    <option value="SILENT_AUCTION">Silent Auction (Sealed bid submission)</option>
                    <option value="DRAFT_FORMAT">Draft Format (Snake draft pick)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block">
                    Open English auction is recommended for live events.
                  </span>
                </div>
              </div>

              {/* Status Alert if in Edit Mode */}
              {isEditMode && editingConfig && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Sliders size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-900">
                      Configuration Status: {editingConfig.status}
                    </span>
                    <p className="text-[11px] text-amber-700 m-0">
                      {editingConfig.status === "LIVE"
                        ? "Auction is currently LIVE. Pricing and team rules cannot be edited during active bidding."
                        : "Rules and settings can be modified freely before the live session begins."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── SECTION 2: Teams & Budget Allocation ── */}
            <div
              id="section-teams"
              className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3 border-b border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                    <Users size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 m-0">2. Teams & Purse Allocation</h3>
                    <p className="text-[11px] text-slate-500 m-0">
                      Set participating franchises, expected pool size, and salary caps
                    </p>
                  </div>
                </div>

                {syncedEventInfo ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold self-start sm:self-auto">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>
                      Synced from {syncedEventInfo.name} ({syncedEventInfo.teams} teams · {syncedEventInfo.players} players)
                    </span>
                    <button
                      type="button"
                      onClick={() => syncEventData(eventId, { force: true })}
                      disabled={isSyncingEvent}
                      className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline ml-1 cursor-pointer disabled:opacity-50"
                      title="Re-sync team and pool values from selected sports event"
                    >
                      {isSyncingEvent ? "Syncing..." : "Re-sync"}
                    </button>
                  </div>
                ) : eventId ? (
                  <button
                    type="button"
                    onClick={() => syncEventData(eventId, { force: true })}
                    disabled={isSyncingEvent}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-semibold hover:bg-indigo-100 transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
                  >
                    {isSyncingEvent && <Loader2 size={12} className="animate-spin text-indigo-600" />}
                    <span>Sync from Event</span>
                  </button>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Total Teams */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Users size={14} className="text-amber-600" /> Participating Teams
                    </label>
                    {syncedEventInfo && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Event Linked
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    className="w-full px-3 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold text-slate-800"
                    value={totalTeams}
                    onChange={(e) => setTotalTeams(Number(e.target.value))}
                  />
                  <span className="text-[11px] text-slate-400 block">
                    {syncedEventInfo ? (
                      <span className="text-emerald-700 font-medium">
                        ✓ Value from {syncedEventInfo.name} ({totalTeams} teams)
                      </span>
                    ) : (
                      "Between 2 and 20 teams."
                    )}
                  </span>
                </div>

                {/* Total Players */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Users size={14} className="text-indigo-600" /> Total Players in Pool
                    </label>
                    {syncedEventInfo && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Event Linked
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    className="w-full px-3 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold text-slate-800"
                    value={totalPlayers}
                    onChange={(e) => setTotalPlayers(Number(e.target.value))}
                  />
                  <span className="text-[11px] text-slate-400 block">
                    {syncedEventInfo ? (
                      <span className="text-emerald-700 font-medium">
                        ✓ Value from {syncedEventInfo.name} ({totalPlayers} players in pool)
                      </span>
                    ) : (
                      "Target pool size for the auction."
                    )}
                  </span>
                </div>

                {/* Team Budget */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <IndianRupee size={14} className="text-emerald-600" /> Budget Per Team (₹)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    className="w-full px-3 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold text-slate-800"
                    value={budgetPerTeam}
                    onChange={(e) => setBudgetPerTeam(Number(e.target.value))}
                  />
                  <span className="text-[11px] text-emerald-600 font-semibold block">
                    ₹{budgetPerTeam.toLocaleString("en-IN")} ({(budgetPerTeam / 100000).toFixed(1)} Lakhs)
                  </span>
                </div>
              </div>

              {/* Squad & Economy Preview Card */}
              <div className="p-3.5 bg-gradient-to-r from-indigo-50/80 to-blue-50/50 border border-indigo-100 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={15} className="text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-950">League Economy & Squad Sizing Preview</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center sm:text-left">
                  <div className="p-2 bg-white/80 rounded-lg border border-indigo-100">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                      Avg Squad Size
                    </span>
                    <span className="text-sm font-extrabold text-indigo-700">
                      {squadMetrics.avgSquadSize} players / team
                    </span>
                  </div>
                  <div className="p-2 bg-white/80 rounded-lg border border-indigo-100">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                      Avg Spend / Player
                    </span>
                    <span className="text-sm font-extrabold text-indigo-700">
                      ₹{squadMetrics.avgSpendPerPlayer.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="p-2 bg-white/80 rounded-lg border border-indigo-100">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                      Total League Purse
                    </span>
                    <span className="text-sm font-extrabold text-indigo-700">
                      ₹{squadMetrics.totalCombinedPurse.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 3: Bidding Ladder & Timer ── */}
            <div
              id="section-bidding"
              className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 transition-all"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold">
                    <IndianRupee size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 m-0">3. Bidding Ladder & Timer</h3>
                    <p className="text-[11px] text-slate-500 m-0">
                      Opening base prices, tiered bid escalation increments, and clock duration
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Base Price */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                  <label className="text-xs font-bold text-slate-700">Base Price (₹)</label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    className="w-full px-3 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                  />
                  <span className="text-[10px] text-slate-400 block">Opening floor price.</span>
                </div>

                {/* Default Increment */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                  <label className="text-xs font-bold text-slate-700">Default Increment (₹)</label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    className="w-full px-3 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                    value={bidIncrementDefault}
                    onChange={(e) => setBidIncrementDefault(Number(e.target.value))}
                  />
                  <span className="text-[10px] text-slate-400 block">Added to bids below threshold.</span>
                </div>

                {/* Threshold */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                  <label className="text-xs font-bold text-slate-700">Threshold Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    className="w-full px-3 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                    value={bidIncrementThreshold}
                    onChange={(e) => setBidIncrementThreshold(Number(e.target.value))}
                  />
                  <span className="text-[10px] text-slate-400 block">Escalation point.</span>
                </div>

                {/* Increment Above Threshold */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                  <label className="text-xs font-bold text-slate-700">Above Threshold (₹)</label>
                  <input
                    type="number"
                    min={100}
                    step={500}
                    className="w-full px-3 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                    value={bidIncrementAbove}
                    onChange={(e) => setBidIncrementAbove(Number(e.target.value))}
                  />
                  <span className="text-[10px] text-slate-400 block">Higher tier increment.</span>
                </div>
              </div>

              {/* Interactive Bidding Ladder Flow Visualizer */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center justify-between gap-3 flex-wrap text-xs">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Sliders size={14} className="text-emerald-700" /> Bidding Escalation Flow:
                </span>
                <div className="flex items-center gap-2 flex-wrap text-emerald-800 font-semibold text-[11px]">
                  <span className="px-2 py-0.5 bg-white rounded-md border border-emerald-200 shadow-2xs">
                    Floor: ₹{basePrice.toLocaleString("en-IN")}
                  </span>
                  <ArrowRight size={12} className="text-emerald-500" />
                  <span className="px-2 py-0.5 bg-white rounded-md border border-emerald-200 shadow-2xs">
                    +₹{bidIncrementDefault.toLocaleString("en-IN")}
                  </span>
                  <ArrowRight size={12} className="text-emerald-500" />
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-md border border-emerald-300 font-bold">
                    Threshold: ₹{bidIncrementThreshold.toLocaleString("en-IN")}
                  </span>
                  <ArrowRight size={12} className="text-emerald-500" />
                  <span className="px-2 py-0.5 bg-white rounded-md border border-emerald-200 shadow-2xs text-amber-700 font-bold">
                    +₹{bidIncrementAbove.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Countdown Timer with Presets */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock size={14} className="text-amber-600" /> Real-Time Countdown Timer (seconds)
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[15, 30, 45, 60].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setBidTimerSeconds(sec)}
                        className={`px-2.5 py-1 text-xs rounded-lg border cursor-pointer font-bold transition-all ${
                          bidTimerSeconds === sec
                            ? "bg-amber-100 border-amber-300 text-amber-900 shadow-2xs"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={10}
                    max={120}
                    className="w-28 px-3 py-1.5 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                    value={bidTimerSeconds}
                    onChange={(e) => setBidTimerSeconds(Number(e.target.value))}
                  />
                  <span className="text-[11px] text-slate-400">
                    Timer automatically resets whenever a franchise places a higher bid.
                  </span>
                </div>
              </div>
            </div>

            {/* ── SECTION 4: Player Categories & Rules ── */}
            <div
              id="section-categories"
              className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 transition-all"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-700 flex items-center justify-center font-bold">
                    <Tag size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 m-0">4. Categories & Auction Rules</h3>
                    <p className="text-[11px] text-slate-500 m-0">
                      Define positional categories, Right-to-Match privileges, and unsold rules
                    </p>
                  </div>
                </div>
              </div>

              {/* Category Pills & Quick Presets */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Tag size={14} className="text-purple-600" /> Player Categories ({categories.length})
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-medium">Quick presets:</span>
                    {["cricket", "badminton", "football", "volleyball"].map((sportKey) => (
                      <button
                        key={sportKey}
                        type="button"
                        onClick={() => handleApplyPreset(sportKey)}
                        className="text-[10px] px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer capitalize font-semibold transition"
                        title={`Apply ${sportKey} category preset`}
                      >
                        {sportKey}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current category pills */}
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-xs font-semibold shadow-2xs"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat)}
                        className="text-purple-400 hover:text-purple-800 cursor-pointer border-none bg-transparent p-0 text-sm leading-none ml-0.5"
                        title={`Remove ${cat}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add new category input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add custom category (e.g. All-Rounder, Batsman)..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>

              {/* Advanced Auction Rules Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* RTM Toggle */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Shield size={14} className="text-blue-600" /> Right to Match (RTM)
                    </label>
                    <input
                      type="checkbox"
                      id="rtmToggle"
                      checked={rtmEnabled}
                      onChange={(e) => setRtmEnabled(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer accent-amber-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 m-0 leading-relaxed">
                    Allows a player's previous franchise to match the highest hammer bid to retain them.
                  </p>
                </div>

                {/* Unsold Player Rule */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                  <label className="text-xs font-bold text-slate-700">Unsold Player Rule</label>
                  <select
                    className="w-full px-3 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                    value={unsoldRule}
                    onChange={(e) => setUnsoldRule(e.target.value)}
                  >
                    <option value="ROTATION_AUCTION">Rotation Auction (Re-queued into subsequent rounds)</option>
                    <option value="RESERVE_POOL">Reserve Pool (Transferred to reserve pool)</option>
                    <option value="RE_AUCTION_BASE">Re-Auction at Base Price (Secondary discounted round)</option>
                  </select>
                  <p className="text-[11px] text-slate-500 m-0 leading-relaxed">
                    Specifies rule when no team bids on a player in their initial presentation.
                  </p>
                </div>
              </div>
            </div>

            {/* ── SECTION 5: Dispute Resolution Committee ── */}
            <div
              id="section-committee"
              className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 transition-all"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center font-bold">
                    <Shield size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 m-0">
                      5. Dispute Committee ({committeeMembers.length})
                    </h3>
                    <p className="text-[11px] text-slate-500 m-0">
                      Appoint community members to arbitrate bids, tie-breakers, and live disputes
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                {/* Current committee chips */}
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {committeeMembers.map((member, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold shadow-2xs"
                    >
                      <span className="w-4 h-4 rounded-full bg-amber-200 text-[10px] text-amber-800 flex items-center justify-center font-bold">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                      {member.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveCommitteeMember(member.name)}
                        className="text-amber-500 hover:text-amber-800 cursor-pointer border-none bg-transparent p-0 text-sm leading-none ml-0.5"
                        title={`Remove ${member.name}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {committeeMembers.length === 0 && (
                    <span className="text-xs text-slate-400 italic">
                      No committee members added yet. Search below to add from community.
                    </span>
                  )}
                </div>

                {/* User search dropdown */}
                <div className="relative pt-1">
                  <input
                    type="text"
                    placeholder="Search community resident name to add to committee..."
                    className="w-full px-3 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    value={committeeSearchQuery}
                    onChange={(e) => setCommitteeSearchQuery(e.target.value)}
                  />

                  {filteredUsers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl mt-1.5 shadow-xl z-20 max-h-48 overflow-y-auto">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="px-3.5 py-2 hover:bg-slate-50 cursor-pointer text-xs border-b border-slate-100 flex items-center justify-between transition-colors"
                          onClick={() => handleAddCommitteeMember(user)}
                        >
                          <span className="font-semibold text-slate-800">{user.name}</span>
                          <span className="text-[10px] text-amber-600 font-bold hover:underline">
                            + Add to Committee
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Modal Footer */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50/90 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-600 hidden md:flex">
              <span className="font-semibold text-slate-700">Summary:</span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-medium">
                {currentSport.emoji} {currentSport.name}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-medium">
                {totalTeams} Teams
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-medium">
                ₹{(budgetPerTeam / 100000).toFixed(1)}L Budget
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-medium">
                {categories.length} Categories
              </span>
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/80 rounded-xl transition-colors border border-slate-200 cursor-pointer bg-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-amber-600/20 disabled:opacity-50 active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check size={14} /> {isEditMode ? "Save Changes" : "Create Configuration"}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
