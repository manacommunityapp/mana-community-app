import React, { useState, useEffect, useMemo } from "react";
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
  communityEvents?: Array<{
    id: number;
    name: string;
    sport?: { id: number; name: string };
    status?: string;
  }>;
  communityUsers?: Array<{ id: number; name: string }>;
}

export const SPORT_OPTIONS = [
  { id: 1, name: "Cricket", emoji: "🏏" },
  { id: 2, name: "Badminton", emoji: "🏸" },
  { id: 3, name: "Football", emoji: "⚽" },
  { id: 4, name: "Volleyball", emoji: "🏐" },
  { id: 5, name: "Table Tennis", emoji: "🏓" },
  { id: 6, name: "Tennis", emoji: "🎾" },
  { id: 7, name: "Basketball", emoji: "🏀" },
];

export const DEFAULT_CATEGORY_PRESETS: Record<string, string[]> = {
  cricket: ["Batsmen", "Bowlers", "All-rounders", "Wicket-Keepers"],
  badminton: ["Men's Singles", "Women's Singles", "Men's Doubles", "Mixed Doubles"],
  football: ["Forwards", "Midfielders", "Defenders", "Goalkeepers"],
  volleyball: ["Attackers / Spikers", "Setters", "Blockers", "Liberos"],
};

export function getSportCategoryPreset(sportName: string): string[] {
  const key = (sportName || "").toLowerCase();
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

export const AuctionConfigModal: React.FC<AuctionConfigModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
  editingConfig,
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
  const [activeModalTab, setActiveModalTab] = useState<"general" | "teams" | "bidding" | "categories" | "committee">("general");

  // Sync state with editingConfig when opened
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
      setCategories(editingConfig.categories && editingConfig.categories.length > 0
        ? editingConfig.categories
        : ["Batsmen", "Bowlers", "All-rounders", "Wicket-Keepers"]);
      setCommitteeMembers(
        (editingConfig.committeeMembers || []).map((name, idx) => ({ id: idx + 1, name }))
      );
    } else {
      // Defaults for Create mode
      setSportId(1);
      setEventId(undefined);
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
    }
    setNewCategoryInput("");
    setCommitteeSearchQuery("");
    setActiveModalTab("general");
  }, [isOpen, editingConfig]);

  // When sport changes in Create mode, update default categories
  const handleSportChange = (newSportId: number) => {
    setSportId(newSportId);
    if (!isEditMode) {
      const sportObj = SPORT_OPTIONS.find(s => s.id === newSportId);
      const sportKey = sportObj?.name.toLowerCase() || "";
      if (DEFAULT_CATEGORY_PRESETS[sportKey]) {
        setCategories(DEFAULT_CATEGORY_PRESETS[sportKey]);
      }
    }
  };

  // When event selection changes, sync sport if known
  const handleEventChange = (selectedEvId?: number) => {
    setEventId(selectedEvId);
    if (selectedEvId) {
      const ev = communityEvents.find(e => e.id === selectedEvId);
      if (ev?.sport?.id) {
        setSportId(ev.sport.id);
      }
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
    const preset = DEFAULT_CATEGORY_PRESETS[sportName.toLowerCase()];
    if (preset) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl h-[92vh] max-h-[92vh] flex flex-col shadow-2xl text-left overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center text-lg flex-shrink-0">
              <Gavel size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 m-0 leading-tight">
                  {isEditMode ? "Edit Auction Configuration" : "New Auction Configuration"}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isEditMode ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                }`}>
                  {isEditMode ? "Edit Mode" : "New Config"}
                </span>
              </div>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Define tournament rules, team budgets, bidding increments, and category structures
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer text-base"
            title="Close Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Tab Bar */}
        <div className="flex border-b border-slate-200 bg-white px-6 overflow-x-auto gap-2 flex-shrink-0">
          {[
            { id: "general", label: "General & Event", icon: Trophy },
            { id: "teams", label: "Teams & Budget", icon: Users },
            { id: "bidding", label: "Bidding Ladder", icon: IndianRupee },
            { id: "categories", label: "Categories & Rules", icon: Tag },
            { id: "committee", label: "Dispute Committee", icon: Shield },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeModalTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveModalTab(tab.id as any)}
                className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap bg-transparent cursor-pointer ${
                  active
                    ? "border-amber-600 text-amber-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: "thin" }}>
          
          {/* TAB 1: General & Event */}
          {activeModalTab === "general" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Sport */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    Sport <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    value={sportId}
                    onChange={e => handleSportChange(Number(e.target.value))}
                  >
                    {SPORT_OPTIONS.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.emoji} {s.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-slate-400">Selecting a sport applies corresponding category presets.</span>
                </div>

                {/* Mapped Event */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    Mapped Sports Event / Tournament
                  </label>
                  <select
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    value={eventId ?? ""}
                    onChange={e => handleEventChange(e.target.value ? Number(e.target.value) : undefined)}
                  >
                    <option value="">No Event (Standalone Auction Config)</option>
                    {communityEvents.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name} {ev.sport?.name ? `(${ev.sport.name})` : ""}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-slate-400">Optional: links player registrations to this tournament.</span>
                </div>

                {/* Season Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    Season / Edition Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="e.g. LEPL Season 2 (2026)"
                    value={seasonName}
                    onChange={e => setSeasonName(e.target.value)}
                    required
                  />
                  <span className="text-[11px] text-slate-400">Displays on the live auction banner and public scorecard.</span>
                </div>

                {/* Auction Format */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    Auction Format <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    value={auctionFormat}
                    onChange={e => setAuctionFormat(e.target.value)}
                  >
                    <option value="OPEN_AUCTION">Open Auction (Real-time live English bidding)</option>
                    <option value="SILENT_AUCTION">Silent Auction (Sealed bid submission)</option>
                    <option value="DRAFT_FORMAT">Draft Format (Sequential snake draft pick)</option>
                  </select>
                  <span className="text-[11px] text-slate-400">Open Auction is recommended for live community events.</span>
                </div>
              </div>

              {/* Status Alert if in Edit Mode */}
              {isEditMode && editingConfig && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                    <Sliders size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-900">Current Status: {editingConfig.status}</span>
                    <p className="text-[11px] text-amber-700 m-0">
                      {editingConfig.status === "LIVE"
                        ? "Auction is currently LIVE. Pricing and team rules cannot be edited while in live session."
                        : "Rules can be updated dynamically before the auction commences."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Teams & Budget */}
          {activeModalTab === "teams" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Total Teams */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Users size={14} className="text-amber-600" /> Participating Teams
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold text-slate-800"
                    value={totalTeams}
                    onChange={e => setTotalTeams(Number(e.target.value))}
                  />
                  <span className="text-[11px] text-slate-400 block">Between 2 and 20 teams.</span>
                </div>

                {/* Total Players */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Users size={14} className="text-indigo-600" /> Total Players in Pool
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold text-slate-800"
                    value={totalPlayers}
                    onChange={e => setTotalPlayers(Number(e.target.value))}
                  />
                  <span className="text-[11px] text-slate-400 block">Expected pool size for the auction.</span>
                </div>

                {/* Team Budget */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <IndianRupee size={14} className="text-emerald-600" /> Budget Per Team (₹)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold text-slate-800"
                    value={budgetPerTeam}
                    onChange={e => setBudgetPerTeam(Number(e.target.value))}
                  />
                  <span className="text-[11px] text-emerald-600 font-medium block">
                    ₹{budgetPerTeam.toLocaleString("en-IN")} ({((budgetPerTeam) / 100000).toFixed(1)} Lakhs)
                  </span>
                </div>
              </div>

              {/* Pool Sizing Summary Card */}
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                <div className="text-xs font-bold text-indigo-900 mb-1">Squad Sizing Preview</div>
                <div className="text-xs text-indigo-700 leading-relaxed">
                  With <span className="font-bold">{totalTeams} teams</span> and{" "}
                  <span className="font-bold">{totalPlayers} total players</span>, each team will acquire an average of{" "}
                  <span className="font-bold">
                    {totalTeams > 0 ? (totalPlayers / totalTeams).toFixed(1) : 0} players
                  </span>{" "}
                  with an average spend of{" "}
                  <span className="font-bold">
                    ₹{totalPlayers > 0 ? Math.round((totalTeams * budgetPerTeam) / totalPlayers).toLocaleString("en-IN") : 0}
                  </span>{" "}
                  per player.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Bidding Ladder */}
          {activeModalTab === "bidding" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Base Price */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Base Price (₹)</label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    value={basePrice}
                    onChange={e => setBasePrice(Number(e.target.value))}
                  />
                  <span className="text-[11px] text-slate-400">Opening bid when a player is brought to the auction floor.</span>
                </div>

                {/* Default Increment */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Default Bid Increment (₹)</label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    value={bidIncrementDefault}
                    onChange={e => setBidIncrementDefault(Number(e.target.value))}
                  />
                  <span className="text-[11px] text-slate-400">Standard increment added to each subsequent bid.</span>
                </div>

                {/* Threshold */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Threshold Bid Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    value={bidIncrementThreshold}
                    onChange={e => setBidIncrementThreshold(Number(e.target.value))}
                  />
                  <span className="text-[11px] text-slate-400">When bid reaches this level, the higher increment kicks in.</span>
                </div>

                {/* Increment Above Threshold */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Increment Above Threshold (₹)</label>
                  <input
                    type="number"
                    min={100}
                    step={500}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    value={bidIncrementAbove}
                    onChange={e => setBidIncrementAbove(Number(e.target.value))}
                  />
                  <span className="text-[11px] text-slate-400">Faster bid escalation once threshold is crossed.</span>
                </div>

                {/* Bid Timer Seconds */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock size={14} className="text-amber-600" /> Real-Time Countdown Timer (seconds)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={10}
                      max={120}
                      className="w-28 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                      value={bidTimerSeconds}
                      onChange={e => setBidTimerSeconds(Number(e.target.value))}
                    />
                    <div className="flex gap-2">
                      {[15, 30, 45, 60].map(sec => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setBidTimerSeconds(sec)}
                          className={`px-2.5 py-1 text-xs rounded-md border cursor-pointer font-medium ${
                            bidTimerSeconds === sec
                              ? "bg-amber-100 border-amber-300 text-amber-800"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">Timer resets automatically whenever a team submits a valid higher bid.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Categories & Rules */}
          {activeModalTab === "categories" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Category Pills & Manager */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Tag size={14} className="text-purple-600" /> Player Categories ({categories.length})
                  </label>
                  <div className="flex gap-1.5">
                    {Object.keys(DEFAULT_CATEGORY_PRESETS).map(sportKey => (
                      <button
                        key={sportKey}
                        type="button"
                        onClick={() => handleApplyPreset(sportKey)}
                        className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600 hover:text-slate-900 cursor-pointer capitalize"
                        title={`Apply ${sportKey} preset`}
                      >
                        {sportKey}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current category pills */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-xs font-semibold shadow-sm"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat)}
                        className="text-purple-400 hover:text-purple-700 cursor-pointer border-none bg-transparent p-0 text-sm leading-none"
                        title={`Remove ${cat}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add new category input */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add custom category (e.g. All-Rounder, Batsman)..."
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    value={newCategoryInput}
                    onChange={e => setNewCategoryInput(e.target.value)}
                    onKeyDown={e => {
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

              {/* Advanced Auction Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* RTM Toggle */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Shield size={14} className="text-blue-600" /> Right to Match (RTM)
                    </label>
                    <input
                      type="checkbox"
                      id="rtmToggle"
                      checked={rtmEnabled}
                      onChange={e => setRtmEnabled(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 m-0">
                    Allows a player's previous franchise to match the highest hammer bid before sale finalization.
                  </p>
                </div>

                {/* Unsold Player Rule */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-slate-700">Unsold Player Rule</label>
                  <select
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    value={unsoldRule}
                    onChange={e => setUnsoldRule(e.target.value)}
                  >
                    <option value="ROTATION_AUCTION">Rotation Auction (Re-queued until sold)</option>
                    <option value="RESERVE_POOL">Reserve Pool (Transferred to unsold reserve)</option>
                    <option value="RE_AUCTION_BASE">Re-Auction at Base (Discounted secondary round)</option>
                  </select>
                  <p className="text-[11px] text-slate-500 m-0">
                    Dictates procedure when no team bids on a player in their initial round.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Dispute Committee */}
          {activeModalTab === "committee" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Shield size={14} className="text-amber-600" /> Dispute Committee Members ({committeeMembers.length})
                  </label>
                  <span className="text-[11px] text-slate-400">Responsible for resolving disputes during live bidding.</span>
                </div>

                {/* Current committee chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {committeeMembers.map((member, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold shadow-sm"
                    >
                      <span className="w-4 h-4 rounded-full bg-amber-200 text-[10px] text-amber-800 flex items-center justify-center font-bold">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                      {member.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveCommitteeMember(member.name)}
                        className="text-amber-500 hover:text-amber-800 cursor-pointer border-none bg-transparent p-0 text-sm leading-none"
                        title={`Remove ${member.name}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {committeeMembers.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No committee members added yet. Search below to add.</span>
                  )}
                </div>

                {/* User search dropdown */}
                <div className="relative pt-2">
                  <input
                    type="text"
                    placeholder="Search community member name..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    value={committeeSearchQuery}
                    onChange={e => setCommitteeSearchQuery(e.target.value)}
                  />

                  {filteredUsers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg mt-1 shadow-lg z-20 max-h-48 overflow-y-auto">
                      {filteredUsers.map(user => (
                        <div
                          key={user.id}
                          className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs border-b border-slate-100 flex items-center justify-between"
                          onClick={() => handleAddCommitteeMember(user)}
                        >
                          <span className="font-semibold text-slate-800">{user.name}</span>
                          <span className="text-[10px] text-amber-600 font-bold">+ Add to Committee</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form Actions (Sticky at bottom) */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer bg-white"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 hidden sm:inline">
                {seasonName ? `Ready to save: ${seasonName}` : "Enter season name to proceed"}
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
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
