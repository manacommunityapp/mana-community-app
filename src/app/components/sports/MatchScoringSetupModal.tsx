import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Play,
  Activity,
  Check,
  CheckCircle2,
  Clock,
  Shield,
  Zap,
  RotateCcw,
  Loader2,
  Sparkles,
  Users,
  Trophy,
  Minus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  tournamentService,
  type FeedLiveMatch,
  type ScoringConfig,
  type TossDecision,
} from "../../../services/sports/tournamentService";
import { HouseRulesModal } from "./HouseRulesModal";
import type { HouseRulesConfig } from "./utils/cricketUtils";
import {
  getSportType,
  isCricketSport,
  isTimeSport,
} from "./utils/sportScoringConstants";
import { getCachedTeamLogo } from "./teams/teamImageUtils";
import { TossCoin3D } from "./utils/TossCoin3D";

export type SetupStep = "teams" | "overs" | "toss" | "score";

export interface MatchScoringSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: FeedLiveMatch;
  initialConfig?: ScoringConfig | null;
  configSource?: "match" | "default" | null;
  isStarting?: boolean;
  onConfirmStart: (params: {
    oversLimit?: number;
    ballsPerOver?: number;
    maxOversPerBowler?: number;
    houseRules?: HouseRulesConfig;
    tossWinnerTeamId?: number;
    tossDecision?: TossDecision;
  }) => Promise<void>;
  onOpenRulesModal?: () => void;
}

const CRICKET_OVERS_PRESETS = [6, 8, 10, 15, 20, 25, 50];

export function MatchScoringSetupModal({
  isOpen,
  onClose,
  match,
  initialConfig,
  configSource,
  isStarting = false,
  onConfirmStart,
  onOpenRulesModal,
}: MatchScoringSetupModalProps) {
  const sportName = match.sportName || match.eventName || "Sports";
  const sportType = getSportType(sportName) || "DEFAULT";
  const isCricket = isCricketSport(sportName);

  // Stepper state: default to "overs" (or "rules" for other sports)
  const [currentStep, setCurrentStep] = useState<SetupStep>("overs");

  // Cricket format state
  const initialOvers = initialConfig?.oversPerInnings && initialConfig.oversPerInnings > 0
    ? initialConfig.oversPerInnings
    : 20;
  const [oversLimit, setOversLimit] = useState<number>(initialOvers);
  const [isCustomOvers, setIsCustomOvers] = useState<boolean>(
    !CRICKET_OVERS_PRESETS.includes(initialOvers)
  );
  const [customOversInput, setCustomOversInput] = useState<string>(
    !CRICKET_OVERS_PRESETS.includes(initialOvers) ? String(initialOvers) : ""
  );

  const [ballsPerOver, setBallsPerOver] = useState<number>(
    initialConfig?.ballsPerOver || 6
  );

  const initialMaxBowler = initialConfig?.maxOversPerBowler || Math.ceil(initialOvers / 5);
  const [maxOversPerBowler, setMaxOversPerBowler] = useState<number>(initialMaxBowler);

  // House rules state
  const storageKey = `mc-match-${match.matchId}-house-rules`;
  const [houseRules, setHouseRules] = useState<HouseRulesConfig>(() => {
    try {
      if (typeof localStorage !== "undefined") {
        const stored = localStorage.getItem(storageKey);
        if (stored) return JSON.parse(stored);
      }
    } catch {}
    return {
      enabled: true,
      noExtraRuns: false,
      noFreeHits: false,
      oversLimit: initialOvers,
      ballsPerOver: 6,
      maxOversPerBowler: Math.ceil(initialOvers / 5),
    };
  });

  const [showFullHouseRulesModal, setShowFullHouseRulesModal] = useState(false);
  const [gullyAccordionOpen, setGullyAccordionOpen] = useState(false);

  // Toss state
  const [tossWinnerSide, setTossWinnerSide] = useState<"A" | "B" | "">("");
  const [tossDecision, setTossDecision] = useState<TossDecision | "">("");
  const [coinFlipping, setCoinFlipping] = useState(false);
  const [coinResult, setCoinResult] = useState<"heads" | "tails" | null>(null);

  // Saving state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync when initialConfig changes
  useEffect(() => {
    if (initialConfig?.oversPerInnings && initialConfig.oversPerInnings > 0) {
      setOversLimit(initialConfig.oversPerInnings);
      setIsCustomOvers(!CRICKET_OVERS_PRESETS.includes(initialConfig.oversPerInnings));
      if (!CRICKET_OVERS_PRESETS.includes(initialConfig.oversPerInnings)) {
        setCustomOversInput(String(initialConfig.oversPerInnings));
      }
      setMaxOversPerBowler(
        initialConfig.maxOversPerBowler || Math.ceil(initialConfig.oversPerInnings / 5)
      );
    }
    if (initialConfig?.ballsPerOver) {
      setBallsPerOver(initialConfig.ballsPerOver);
    }
  }, [initialConfig]);

  // Team branding logos
  const logoA = useMemo(
    () => getCachedTeamLogo(match.teamAId) || getCachedTeamLogo(match.teamAName),
    [match.teamAId, match.teamAName]
  );
  const logoB = useMemo(
    () => getCachedTeamLogo(match.teamBId) || getCachedTeamLogo(match.teamBName),
    [match.teamBId, match.teamBName]
  );

  // Count of active Gully rules
  const activeGullyRulesCount = useMemo(() => {
    let count = 0;
    if (houseRules.noExtraRuns) count++;
    if (houseRules.noFreeHits) count++;
    if (ballsPerOver !== 6) count++;
    return count;
  }, [houseRules.noExtraRuns, houseRules.noFreeHits, ballsPerOver]);

  // Stepper handler
  const handleOversPresetSelect = (ov: number) => {
    setIsCustomOvers(false);
    setCustomOversInput("");
    setOversLimit(ov);
    const newMax = Math.ceil(ov / 5) || 1;
    setMaxOversPerBowler(newMax);
    setHouseRules((prev) => ({
      ...prev,
      oversLimit: ov,
      maxOversPerBowler: newMax,
    }));
  };

  const handleCustomOversChange = (val: string) => {
    setCustomOversInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 99) {
      setOversLimit(parsed);
      const newMax = Math.ceil(parsed / 5) || 1;
      setMaxOversPerBowler(newMax);
      setHouseRules((prev) => ({
        ...prev,
        oversLimit: parsed,
        maxOversPerBowler: newMax,
      }));
    }
  };

  const handleOversStepper = (delta: number) => {
    const next = Math.max(1, Math.min(99, oversLimit + delta));
    setOversLimit(next);
    setIsCustomOvers(!CRICKET_OVERS_PRESETS.includes(next));
    if (!CRICKET_OVERS_PRESETS.includes(next)) {
      setCustomOversInput(String(next));
    } else {
      setCustomOversInput("");
    }
    const newMax = Math.ceil(next / 5) || 1;
    setMaxOversPerBowler(newMax);
    setHouseRules((prev) => ({
      ...prev,
      oversLimit: next,
      maxOversPerBowler: newMax,
    }));
  };

  const handleBowlerLimitStepper = (delta: number) => {
    const next = Math.max(1, Math.min(oversLimit, maxOversPerBowler + delta));
    setMaxOversPerBowler(next);
    setHouseRules((prev) => ({ ...prev, maxOversPerBowler: next }));
  };

  const toggleGullyNoExtraRuns = () => {
    const nextVal = !houseRules.noExtraRuns;
    const updated = { ...houseRules, noExtraRuns: nextVal };
    setHouseRules(updated);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      }
    } catch {}
  };

  const toggleGullyNoFreeHits = () => {
    const nextVal = !houseRules.noFreeHits;
    const updated = { ...houseRules, noFreeHits: nextVal };
    setHouseRules(updated);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      }
    } catch {}
  };

  // Coin toss handler
  const handleFlipCoin = () => {
    if (coinFlipping) return;
    setCoinFlipping(true);
    setCoinResult(null);
    setTimeout(() => {
      const outcome = Math.random() < 0.5 ? "heads" : "tails";
      setCoinResult(outcome);
      setCoinFlipping(false);
      // Automatically preselect a winner side based on flip if none selected
      if (!tossWinnerSide) {
        setTossWinnerSide(outcome === "heads" ? "A" : "B");
      }
    }, 1200);
  };

  // Confirm and start scoring
  const handleProceedToScore = async () => {
    if (isSubmitting || isStarting) return;

    if (isCricket) {
      if (!oversLimit || oversLimit < 1 || oversLimit > 99) {
        toast.error("Please enter a valid overs limit between 1 and 99.");
        setCurrentStep("overs");
        return;
      }
      if (!maxOversPerBowler || maxOversPerBowler < 1 || maxOversPerBowler > oversLimit) {
        toast.error("Max overs per bowler must be between 1 and total overs.");
        setCurrentStep("overs");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // 1. Sync house rules to localStorage
      const finalRules: HouseRulesConfig = {
        ...houseRules,
        enabled: houseRules.enabled !== false,
        oversLimit,
        ballsPerOver,
        maxOversPerBowler,
      };
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(storageKey, JSON.stringify(finalRules));
        }
      } catch {}

      // 2. Determine toss payload if recorded
      let tossWinnerTeamId: number | undefined;
      let tossDec: TossDecision | undefined;
      if (tossWinnerSide && tossDecision) {
        tossWinnerTeamId =
          tossWinnerSide === "A"
            ? match.teamAId || undefined
            : match.teamBId || undefined;
        tossDec = tossDecision;
      }

      await onConfirmStart({
        oversLimit,
        ballsPerOver,
        maxOversPerBowler,
        houseRules: finalRules,
        tossWinnerTeamId,
        tossDecision: tossDec,
      });
    } catch (e: any) {
      toast.error(e?.message || "Failed to start scoring setup.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-5"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="score-setup-title"
        className="relative flex w-full max-w-lg sm:max-w-xl min-h-[520px] max-h-[92vh] flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50/90 via-indigo-50/50 to-white px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-[11px] font-black text-white shadow-sm shadow-indigo-600/30">
                ⚡
              </span>
              <h2
                id="score-setup-title"
                className="m-0 text-base sm:text-lg font-black tracking-tight text-slate-900"
              >
                Match Scoring Setup
              </h2>
            </div>
            <p className="mb-0 mt-1 text-xs font-semibold text-slate-500">
              {match.teamAName} <span className="font-normal text-slate-400">vs</span> {match.teamBName}
              {match.eventName ? ` · ${match.eventName}` : ""}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close scoring setup"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* GullyCrix Flow Stepper: [1] Teams -> [2] Overs -> [3] Toss -> [4] Score */}
        <nav
          aria-label="Match setup progress"
          className="grid grid-cols-4 border-b border-slate-100 bg-slate-50/70 px-3 py-2.5 sm:px-5"
        >
          {/* Step 1: Teams */}
          <button
            type="button"
            onClick={() => setCurrentStep("teams")}
            className={`group flex items-center justify-center gap-1.5 rounded-lg py-1 transition ${
              currentStep === "teams" ? "text-indigo-600 font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black transition ${
                currentStep === "teams"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "bg-emerald-100 text-emerald-700 font-bold"
              }`}
            >
              {currentStep === "teams" ? "1" : <Check className="h-3 w-3 stroke-[3]" />}
            </span>
            <span className="text-xs">Teams</span>
          </button>

          {/* Step 2: Overs / Rules */}
          <button
            type="button"
            onClick={() => setCurrentStep("overs")}
            className={`group flex items-center justify-center gap-1.5 rounded-lg py-1 transition ${
              currentStep === "overs" ? "text-indigo-600 font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black transition ${
                currentStep === "overs"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : currentStep === "toss" || currentStep === "score"
                  ? "bg-emerald-100 text-emerald-700 font-bold"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {currentStep === "toss" || currentStep === "score" ? (
                <Check className="h-3 w-3 stroke-[3]" />
              ) : (
                "2"
              )}
            </span>
            <span className="text-xs">{isCricket ? "Overs" : "Rules"}</span>
          </button>

          {/* Step 3: Toss */}
          <button
            type="button"
            onClick={() => setCurrentStep("toss")}
            className={`group flex items-center justify-center gap-1.5 rounded-lg py-1 transition ${
              currentStep === "toss" ? "text-indigo-600 font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black transition ${
                currentStep === "toss"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : tossWinnerSide && tossDecision
                  ? "bg-emerald-100 text-emerald-700 font-bold"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {tossWinnerSide && tossDecision ? (
                <Check className="h-3 w-3 stroke-[3]" />
              ) : (
                "3"
              )}
            </span>
            <span className="text-xs">Toss</span>
          </button>

          {/* Step 4: Score */}
          <div className="flex items-center justify-center gap-1.5 py-1 text-slate-400">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-black text-slate-600">
              4
            </span>
            <span className="text-xs">Score</span>
          </div>
        </nav>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* STEP 1: TEAMS VIEW */}
          {currentStep === "teams" && (
            <div className="space-y-4 animate-fade-in">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
                <h3 className="m-0 text-xs font-black uppercase tracking-wider text-indigo-700">
                  Match Teams & Lineup
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Confirm the two competing teams for this fixture before locking rules.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Team A Card */}
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-indigo-100 bg-white p-4 text-center shadow-xs">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-200 overflow-hidden shadow-inner">
                    {logoA ? (
                      <img src={logoA} alt={match.teamAName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl font-black text-indigo-600">
                        {match.teamAName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h4 className="mt-2.5 text-sm font-extrabold text-slate-900 line-clamp-1">
                    {match.teamAName}
                  </h4>
                  <span className="mt-1 inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                    Home Team
                  </span>
                  {match.teamAFlat && (
                    <span className="text-[10px] text-slate-500 mt-1">Flat: {match.teamAFlat}</span>
                  )}
                </div>

                {/* Team B Card */}
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-amber-100 bg-white p-4 text-center shadow-xs">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 overflow-hidden shadow-inner">
                    {logoB ? (
                      <img src={logoB} alt={match.teamBName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl font-black text-amber-600">
                        {match.teamBName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h4 className="mt-2.5 text-sm font-extrabold text-slate-900 line-clamp-1">
                    {match.teamBName}
                  </h4>
                  <span className="mt-1 inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    Away Team
                  </span>
                  {match.teamBFlat && (
                    <span className="text-[10px] text-slate-500 mt-1">Flat: {match.teamBFlat}</span>
                  )}
                </div>
              </div>

              {match.venueName && (
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600 border border-slate-200">
                  <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>
                    Venue: <strong>{match.venueName}</strong>
                    {match.scheduledAt ? ` · ${new Date(match.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: OVERS & RULES VIEW (CRICKET) */}
          {currentStep === "overs" && isCricket && (
            <div className="space-y-4 animate-fade-in">
              {/* Overs Stepper: [-] {overs} [+] */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="m-0 text-xs font-black uppercase tracking-wider text-indigo-700">
                      Match Overs Stepper
                    </h3>
                    <p className="m-0 text-[11px] text-slate-500">
                      Adjust innings overs using stepper buttons or choose a standard preset.
                    </p>
                  </div>
                  <span className="rounded-full bg-indigo-600/10 px-2.5 py-0.5 text-[11px] font-black text-indigo-700">
                    {oversLimit} Overs Match
                  </span>
                </div>

                {/* Big Stepper Row */}
                <div className="flex items-center justify-center gap-4 py-2">
                  <button
                    type="button"
                    aria-label="Decrease overs"
                    onClick={() => handleOversStepper(-1)}
                    className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-100 active:scale-95 disabled:opacity-40"
                    disabled={oversLimit <= 1}
                  >
                    <Minus className="h-6 w-6 stroke-[3]" />
                  </button>

                  <div className="min-w-[120px] text-center">
                    <span className="block text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                      {oversLimit}
                    </span>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Overs / Innings
                    </span>
                  </div>

                  <button
                    type="button"
                    aria-label="Increase overs"
                    onClick={() => handleOversStepper(1)}
                    className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-100 active:scale-95 disabled:opacity-40"
                    disabled={oversLimit >= 99}
                  >
                    <Plus className="h-6 w-6 stroke-[3]" />
                  </button>
                </div>

                {/* Overs Presets: 6, 8, 10, 15, 20, 25, 50, Custom */}
                <div className="mt-3.5 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Quick Presets
                  </span>
                  <div className="flex flex-nowrap gap-1 overflow-x-auto scrollbar-none sm:flex-wrap sm:gap-1.5">
                    {CRICKET_OVERS_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleOversPresetSelect(preset)}
                        className={`${preset >= 25 ? "hidden sm:inline-flex" : "inline-flex"} min-h-8 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-xl border px-1 py-1 text-[10px] font-bold transition active:scale-95 sm:min-h-9 sm:flex-none sm:px-3 sm:py-1.5 sm:text-xs ${
                          !isCustomOvers && oversLimit === preset
                            ? "border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-black"
                            : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50"
                        }`}
                      >
                        {preset} ov
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomOvers(true);
                        setCustomOversInput(String(oversLimit));
                      }}
                      className={`inline-flex min-h-8 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-xl border px-1 py-1 text-[10px] font-bold transition active:scale-95 sm:min-h-9 sm:flex-none sm:px-3 sm:py-1.5 sm:text-xs ${
                        isCustomOvers
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-black"
                          : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50"
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {/* Custom Overs input field */}
                  {isCustomOvers && (
                    <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-indigo-200 bg-white p-2 animate-fade-in">
                      <label className="text-xs font-bold text-slate-700 whitespace-nowrap pl-1">
                        Enter Custom Overs (1–99):
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={customOversInput}
                        onChange={(e) => handleCustomOversChange(e.target.value)}
                        placeholder="e.g. 12"
                        className="h-9 w-24 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-center text-xs font-black text-slate-900 outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Bowler quota */}
              <div className="w-full">
                {/* Max overs per bowler */}
                <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 sm:p-3">
                  <div className="min-w-0">
                    <span className="block truncate text-[11px] font-extrabold text-slate-700">
                      Bowler Quota
                    </span>
                    <span className="hidden text-[10px] text-slate-500 sm:block">
                      Default: ceil(ov ÷ 5)
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => handleBowlerLimitStepper(-1)}
                      disabled={maxOversPerBowler <= 1}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 font-bold text-slate-700 transition hover:bg-slate-200 active:scale-95 disabled:opacity-40"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="whitespace-nowrap px-0.5 text-[11px] font-black text-slate-900 sm:text-xs">
                      {maxOversPerBowler} ov/bowler
                    </span>
                    <button
                      type="button"
                      onClick={() => handleBowlerLimitStepper(1)}
                      disabled={maxOversPerBowler >= oversLimit}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 font-bold text-slate-700 transition hover:bg-slate-200 active:scale-95 disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Gully Rules Row: "Optional. Wides, free hits and mid-match overs" with active pill */}
              <div className="rounded-2xl border border-amber-200/90 bg-amber-50/40 p-4 transition-all">
                <div
                  className="flex cursor-pointer items-start justify-between gap-3"
                  onClick={() => setGullyAccordionOpen(!gullyAccordionOpen)}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700 border border-amber-300">
                      <Sliders className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="m-0 text-xs font-extrabold text-slate-900">
                          Gully & Box House Rules
                        </h4>
                      </div>
                      <p className="m-0 mt-0.5 text-[11px] text-slate-500">
                        Optional. Wides, free hits and mid-match overs
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={`House rules ${houseRules.enabled === false ? "off" : "on"}. ${activeGullyRulesCount} configured.`}
                    aria-pressed={houseRules.enabled !== false}
                    title={`${activeGullyRulesCount} configured rule${activeGullyRulesCount === 1 ? "" : "s"}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setGullyAccordionOpen(true);
                      setHouseRules((previous) => ({ ...previous, enabled: previous.enabled === false }));
                    }}
                    className={`inline-flex min-w-14 items-center justify-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-extrabold transition active:scale-95 ${
                      houseRules.enabled !== false
                        ? "border-amber-300 bg-amber-100 text-amber-800 shadow-xs hover:bg-amber-200"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {houseRules.enabled === false ? "OFF" : "ON"}
                  </button>
                </div>

                {/* Inline Accordion with Gully switches */}
                {gullyAccordionOpen && (
                  <div className="mt-3.5 space-y-2.5 border-t border-amber-200/60 pt-3 animate-fade-in">
                    {/* Toggle 1: No Extra Runs */}
                    <div className="flex items-center justify-between gap-2 rounded-xl bg-white p-2.5 border border-amber-100">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          No Extra Runs for Wides / No-Balls
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Delivery is re-bowled, but no penalty run added.
                        </span>
                      </div>
                      <button
                        type="button"
                        aria-pressed={houseRules.noExtraRuns}
                        onClick={toggleGullyNoExtraRuns}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          houseRules.noExtraRuns ? "bg-amber-500" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            houseRules.noExtraRuns ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Toggle 2: Disable Free Hits */}
                    <div className="flex items-center justify-between gap-2 rounded-xl bg-white p-2.5 border border-amber-100">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          Disable Free Hits
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          No free hit awarded following a no-ball.
                        </span>
                      </div>
                      <button
                        type="button"
                        aria-pressed={houseRules.noFreeHits}
                        onClick={toggleGullyNoFreeHits}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          houseRules.noFreeHits ? "bg-indigo-600" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            houseRules.noFreeHits ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setShowFullHouseRulesModal(true)}
                        className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline underline-offset-2 flex items-center gap-1"
                      >
                        <Sliders className="h-3 w-3" />
                        Configure all mid-match house rules in detail
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: RULES VIEW (NON-CRICKET SPORTS) */}
          {currentStep === "overs" && !isCricket && (
            <div className="space-y-4 animate-fade-in">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="m-0 text-xs font-black uppercase tracking-wider text-indigo-700">
                    {sportName} Format & Rules
                  </p>
                  {onOpenRulesModal && (
                    <button
                      type="button"
                      onClick={onOpenRulesModal}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                    >
                      <Sliders className="h-3.5 w-3.5" /> Edit rules
                    </button>
                  )}
                </div>

                <div className="mt-3 space-y-2 text-xs text-slate-700">
                  <p className="m-0">
                    <strong>Periods / Sets:</strong> {initialConfig?.periodsCount ?? 3}
                    {initialConfig?.periodDurationMinutes
                      ? ` × ${initialConfig.periodDurationMinutes} min`
                      : ""}
                  </p>
                  {initialConfig?.pointsToWinPeriod && (
                    <p className="m-0">
                      <strong>Points to win set:</strong> {initialConfig.pointsToWinPeriod}
                      {initialConfig?.mustWinByTwo ? " (must win by 2)" : ""}
                    </p>
                  )}
                  {initialConfig?.targetScore != null && (
                    <p className="m-0">
                      <strong>Target Score:</strong> {initialConfig.targetScore} points
                    </p>
                  )}
                </div>

                <p className="mb-0 mt-3 text-[11px] text-slate-500">
                  Using {configSource === "match" ? "saved tournament/match rules" : "standard sport rules"}.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: TOSS VIEW */}
          {currentStep === "toss" && (
            <div className="space-y-4 animate-fade-in">
              {/* Coin Flip Interactive Widget */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-200/90 bg-gradient-to-b from-amber-50/70 via-slate-50/80 to-white p-4 shadow-xs">
                <TossCoin3D
                  isFlipping={coinFlipping}
                  result={coinResult}
                  onFlip={handleFlipCoin}
                  sportType={match.sportType || (isCricket ? "CRICKET" : "DEFAULT")}
                  size="md"
                  interactive={!coinFlipping}
                />

                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleFlipCoin}
                    disabled={coinFlipping}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-amber-400 bg-amber-500 px-4 text-xs font-black text-slate-950 shadow-sm transition hover:bg-amber-400 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCcw className={`h-3.5 w-3.5 ${coinFlipping ? "animate-spin" : ""}`} />
                    {coinFlipping ? "Flipping..." : "Flip Coin 🪙"}
                  </button>

                  {coinResult && !coinFlipping && (
                    <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900 shadow-xs animate-fade-in">
                      <span>✓ Landed: {coinResult.toUpperCase()}!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Selection 1: Who won the toss? */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                  1. Who Won the Toss?
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTossWinnerSide("A")}
                    className={`flex items-center gap-2 rounded-xl border-2 p-3 text-left transition active:scale-95 ${
                      tossWinnerSide === "A"
                        ? "border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-xs font-black"
                        : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200"
                    }`}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">
                      {match.teamAName.charAt(0)}
                    </span>
                    <span className="text-xs truncate">{match.teamAName}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTossWinnerSide("B")}
                    className={`flex items-center gap-2 rounded-xl border-2 p-3 text-left transition active:scale-95 ${
                      tossWinnerSide === "B"
                        ? "border-amber-600 bg-amber-50/80 text-amber-900 shadow-xs font-black"
                        : "border-slate-200 bg-white text-slate-700 hover:border-amber-200"
                    }`}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-xs font-bold text-amber-700">
                      {match.teamBName.charAt(0)}
                    </span>
                    <span className="text-xs truncate">{match.teamBName}</span>
                  </button>
                </div>
              </div>

              {/* Selection 2: What did they elect to do? */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                  2. What did they elect to do?
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTossDecision(isCricket ? "BAT" : "SERVE")}
                    className={`min-h-12 flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-center text-xs font-black transition active:scale-95 ${
                      tossDecision === (isCricket ? "BAT" : "SERVE")
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
                    }`}
                  >
                    {isCricket ? "🏏 Bat First" : "⚡ Serve / Kickoff First"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTossDecision(isCricket ? "BOWL" : "RECEIVE")}
                    className={`min-h-12 flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-center text-xs font-black transition active:scale-95 ${
                      tossDecision === (isCricket ? "BOWL" : "RECEIVE")
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
                    }`}
                  >
                    {isCricket ? "🎳 Bowl First" : "🛡️ Defend / Receive First"}
                  </button>
                </div>
              </div>

              {/* Toss Summary Card */}
              {tossWinnerSide && tossDecision && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-center text-xs font-bold text-emerald-800 animate-fade-in">
                  🎉 {tossWinnerSide === "A" ? match.teamAName : match.teamBName} won the toss and elected to{" "}
                  {tossDecision === "BAT" ? "bat" : tossDecision === "BOWL" ? "bowl" : tossDecision.toLowerCase()} first!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation Bar with min-h-12 h-12 buttons */}
        <footer className="border-t border-slate-100 bg-slate-50/80 px-4 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-3">
          {/* Back button */}
          {currentStep === "teams" ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-12 h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-100 active:scale-95"
            >
              Cancel
            </button>
          ) : currentStep === "overs" ? (
            <button
              type="button"
              onClick={() => setCurrentStep("teams")}
              className="inline-flex min-h-12 h-12 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-100 active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to teams</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStep("overs")}
              className="inline-flex min-h-12 h-12 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-100 active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to {isCricket ? "overs" : "rules"}</span>
            </button>
          )}

          {/* Forward / Primary button */}
          <div className="flex items-center gap-2">
            {currentStep === "overs" && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentStep("toss")}
                  className="inline-flex min-h-12 h-12 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 text-xs font-extrabold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-95"
                >
                  <span>Next: toss</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || isStarting}
                  onClick={handleProceedToScore}
                  className="inline-flex min-h-12 h-12 items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 active:scale-95 disabled:opacity-50"
                  title="Skip toss and launch scorer directly"
                >
                  {isSubmitting || isStarting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Activity className="h-4 w-4" />
                  )}
                  <span>Start scoring</span>
                </button>
              </>
            )}

            {currentStep === "teams" && (
              <button
                type="button"
                onClick={() => setCurrentStep("overs")}
                className="inline-flex min-h-12 h-12 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 text-xs font-extrabold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-95"
              >
                <span>Next: {isCricket ? "overs" : "rules"}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {currentStep === "toss" && (
              <button
                type="button"
                disabled={isSubmitting || isStarting}
                onClick={handleProceedToScore}
                className="inline-flex min-h-12 h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-xs font-extrabold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting || isStarting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 fill-current" />
                )}
                <span>Start scoring</span>
              </button>
            )}
          </div>
        </footer>

        {/* Nested full HouseRulesModal if opened */}
        {showFullHouseRulesModal && (
          <HouseRulesModal
            isOpen={showFullHouseRulesModal}
            onClose={() => setShowFullHouseRulesModal(false)}
            matchId={match.matchId}
            initialRules={{
              ...houseRules,
              oversLimit,
              ballsPerOver,
              maxOversPerBowler,
            }}
            onSaveRules={async (updated) => {
              setHouseRules(updated);
              if (updated.oversLimit) setOversLimit(updated.oversLimit);
              if (updated.ballsPerOver) setBallsPerOver(updated.ballsPerOver);
              if (updated.maxOversPerBowler) setMaxOversPerBowler(updated.maxOversPerBowler);
              setShowFullHouseRulesModal(false);
            }}
          />
        )}
      </section>
    </div>
  );
}
