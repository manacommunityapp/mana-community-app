import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Sliders,
  Check,
  RotateCcw,
  Sparkles,
  Shield,
} from "lucide-react";
import { tournamentService, type ScoringConfig } from "../../../services/sports/tournamentService";
import { toast } from "sonner";
import { isCricketSport, isTimeSport } from "./utils/sportScoringConstants";

interface MatchScoringRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: number;
  sportType?: string;
  matchName?: string;
  onSaved?: (updatedConfig: ScoringConfig) => void;
}

export function MatchScoringRulesModal({
  isOpen,
  onClose,
  matchId,
  sportType = "BADMINTON",
  matchName,
  onSaved,
}: MatchScoringRulesModalProps) {
  const normSport = (sportType || "BADMINTON").toUpperCase().replace(/[\s-]/g, "_");
  const isCricket = isCricketSport(normSport);
  const isTimed = isTimeSport(normSport);
  const isSetBased = [
    "BADMINTON",
    "TENNIS",
    "TABLE_TENNIS",
    "PICKLEBALL",
    "SQUASH",
    "VOLLEYBALL",
    "BEACH_VOLLEYBALL",
    "GRASS_VOLLEYBALL",
    "THROWBALL",
  ].includes(normSport);
  const isTargetScore = ["CARROM", "FOOSBALL", "DART", "POOL", "BILLIARDS", "SNOOKER"].includes(normSport);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [defaultConfig, setDefaultConfig] = useState<ScoringConfig | null>(null);

  // Editable rule states
  const [periodsCount, setPeriodsCount] = useState<number>(3);
  const [periodsToWin, setPeriodsToWin] = useState<number>(2);
  const [pointsToWinPeriod, setPointsToWinPeriod] = useState<number>(21);
  const [mustWinByTwo, setMustWinByTwo] = useState<boolean>(true);
  const [tiebreakPointsToWin, setTiebreakPointsToWin] = useState<number | null>(30);

  const [periodDurationMinutes, setPeriodDurationMinutes] = useState<number>(45);
  const [hasOvertime, setHasOvertime] = useState<boolean>(false);
  const [hasPenaltyShootout, setHasPenaltyShootout] = useState<boolean>(false);

  const [oversPerInnings, setOversPerInnings] = useState<number>(20);
  const [maxOversPerBowler, setMaxOversPerBowler] = useState<number>(4);
  const [ballsPerOver, setBallsPerOver] = useState<number>(6);

  const [targetScore, setTargetScore] = useState<number>(25);

  const applyConfigValues = (cfg: ScoringConfig) => {
    if (cfg.periodsCount != null) setPeriodsCount(cfg.periodsCount);
    if (cfg.periodsToWin != null) setPeriodsToWin(cfg.periodsToWin);
    if (cfg.pointsToWinPeriod != null) setPointsToWinPeriod(cfg.pointsToWinPeriod);
    if (cfg.mustWinByTwo !== undefined) setMustWinByTwo(cfg.mustWinByTwo);
    if (cfg.tiebreakPointsToWin !== undefined) setTiebreakPointsToWin(cfg.tiebreakPointsToWin);

    if (cfg.periodDurationMinutes != null) setPeriodDurationMinutes(cfg.periodDurationMinutes);
    if (cfg.hasOvertime !== undefined) setHasOvertime(cfg.hasOvertime);
    if (cfg.hasPenaltyShootout !== undefined) setHasPenaltyShootout(cfg.hasPenaltyShootout);

    if (cfg.oversPerInnings != null) setOversPerInnings(cfg.oversPerInnings);
    if (cfg.maxOversPerBowler != null) setMaxOversPerBowler(cfg.maxOversPerBowler);
    if (cfg.ballsPerOver != null) setBallsPerOver(cfg.ballsPerOver);

    if (cfg.targetScore != null) setTargetScore(cfg.targetScore);
  };

  // Load effective config for this match
  useEffect(() => {
    if (!isOpen || !matchId) return;
    setLoading(true);

    Promise.all([
      tournamentService.getMatchScoringConfig(matchId).catch(() => null),
      tournamentService.getDefaultScoringConfig(normSport).catch(() => null),
    ])
      .then(([matchCfg, defCfg]) => {
        if (defCfg) setDefaultConfig(defCfg);
        const cfg = matchCfg || defCfg;
        if (cfg) {
          applyConfigValues(cfg);
        }
      })
      .finally(() => setLoading(false));
  }, [isOpen, matchId, normSport]);

  const handleSetsCountChange = (sets: number) => {
    setPeriodsCount(sets);
    setPeriodsToWin(Math.ceil(sets / 2));
  };

  // Quick preset apply handlers
  const applyPreset = (preset: {
    periodsCount?: number;
    periodsToWin?: number;
    pointsToWinPeriod?: number;
    mustWinByTwo?: boolean;
    tiebreakPointsToWin?: number | null;
    periodDurationMinutes?: number;
    hasOvertime?: boolean;
    hasPenaltyShootout?: boolean;
    oversPerInnings?: number;
    maxOversPerBowler?: number;
    ballsPerOver?: number;
    targetScore?: number;
  }) => {
    if (preset.periodsCount != null) setPeriodsCount(preset.periodsCount);
    if (preset.periodsToWin != null) setPeriodsToWin(preset.periodsToWin);
    if (preset.pointsToWinPeriod != null) setPointsToWinPeriod(preset.pointsToWinPeriod);
    if (preset.mustWinByTwo !== undefined) setMustWinByTwo(preset.mustWinByTwo);
    if (preset.tiebreakPointsToWin !== undefined) setTiebreakPointsToWin(preset.tiebreakPointsToWin);
    if (preset.periodDurationMinutes != null) setPeriodDurationMinutes(preset.periodDurationMinutes);
    if (preset.hasOvertime !== undefined) setHasOvertime(preset.hasOvertime);
    if (preset.hasPenaltyShootout !== undefined) setHasPenaltyShootout(preset.hasPenaltyShootout);
    if (preset.oversPerInnings != null) setOversPerInnings(preset.oversPerInnings);
    if (preset.maxOversPerBowler != null) setMaxOversPerBowler(preset.maxOversPerBowler);
    if (preset.ballsPerOver != null) setBallsPerOver(preset.ballsPerOver);
    if (preset.targetScore != null) setTargetScore(preset.targetScore);
    toast.info("Applied preset rules");
  };

  const handleResetToDefault = () => {
    if (defaultConfig) {
      applyConfigValues(defaultConfig);
      toast.info("Reset to standard sport default rules");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const payload: Partial<ScoringConfig> = {
      periodsCount,
      periodsToWin,
      pointsToWinPeriod: isSetBased ? pointsToWinPeriod : undefined,
      mustWinByTwo: isSetBased ? mustWinByTwo : false,
      tiebreakPointsToWin: isSetBased ? tiebreakPointsToWin : undefined,
      periodDurationMinutes: isTimed ? periodDurationMinutes : undefined,
      hasOvertime: isTimed ? hasOvertime : false,
      hasPenaltyShootout: isTimed ? hasPenaltyShootout : false,
      oversPerInnings: isCricket ? oversPerInnings : undefined,
      maxOversPerBowler: isCricket ? maxOversPerBowler : undefined,
      ballsPerOver: isCricket ? ballsPerOver : 6,
      targetScore: isTargetScore ? targetScore : undefined,
    };

    try {
      const updated = await tournamentService.updateMatchConfigOverride(matchId, payload);
      toast.success("Match scoring rules updated!");
      if (onSaved && updated) onSaved(updated);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update match rules");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50/80 via-white to-white dark:from-slate-800 dark:via-slate-900 dark:to-slate-900 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shadow-inner">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Configure Match Rules
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                  {normSport.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[260px] sm:max-w-xs">
                {matchName ? `${matchName} (Match #${matchId})` : `Match #${matchId} single-match override`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="max-h-[min(75vh,580px)] overflow-y-auto p-5 space-y-4 text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
              <span>Loading current match rules...</span>
            </div>
          ) : (
            <>
              {/* Presets Bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Quick Format Presets
                  </span>
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> Reset Default
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {isSetBased && normSport.includes("BADMINTON") && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          applyPreset({
                            periodsCount: 3,
                            periodsToWin: 2,
                            pointsToWinPeriod: 21,
                            mustWinByTwo: true,
                            tiebreakPointsToWin: 30,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 font-medium transition cursor-pointer active:scale-95"
                      >
                        🏸 Standard 21 pts (Best of 3)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyPreset({
                            periodsCount: 3,
                            periodsToWin: 2,
                            pointsToWinPeriod: 15,
                            mustWinByTwo: true,
                            tiebreakPointsToWin: 21,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 font-medium transition cursor-pointer active:scale-95"
                      >
                        ⚡ Shortened 15 pts (Best of 3)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyPreset({
                            periodsCount: 1,
                            periodsToWin: 1,
                            pointsToWinPeriod: 21,
                            mustWinByTwo: true,
                            tiebreakPointsToWin: 30,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 font-medium transition cursor-pointer active:scale-95"
                      >
                        🎯 1-Set Decider (21 pts)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyPreset({
                            periodsCount: 1,
                            periodsToWin: 1,
                            pointsToWinPeriod: 15,
                            mustWinByTwo: true,
                            tiebreakPointsToWin: 21,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 font-medium transition cursor-pointer active:scale-95"
                      >
                        ⏱ 1-Set Quick (15 pts)
                      </button>
                    </>
                  )}

                  {isSetBased && (normSport.includes("PICKLEBALL") || normSport.includes("TABLE_TENNIS") || normSport.includes("SQUASH")) && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          applyPreset({
                            periodsCount: 3,
                            periodsToWin: 2,
                            pointsToWinPeriod: 11,
                            mustWinByTwo: true,
                            tiebreakPointsToWin: normSport.includes("PICKLEBALL") ? 15 : null,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 font-medium transition cursor-pointer active:scale-95"
                      >
                        Standard 11 pts (Best of 3)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyPreset({
                            periodsCount: 5,
                            periodsToWin: 3,
                            pointsToWinPeriod: 11,
                            mustWinByTwo: true,
                            tiebreakPointsToWin: null,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 font-medium transition cursor-pointer active:scale-95"
                      >
                        Best of 5 Sets (11 pts)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyPreset({
                            periodsCount: 1,
                            periodsToWin: 1,
                            pointsToWinPeriod: 11,
                            mustWinByTwo: true,
                            tiebreakPointsToWin: 15,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 font-medium transition cursor-pointer active:scale-95"
                      >
                        Single Set (11 pts)
                      </button>
                    </>
                  )}

                  {isSetBased && normSport.includes("VOLLEYBALL") && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          applyPreset({
                            periodsCount: 3,
                            periodsToWin: 2,
                            pointsToWinPeriod: 25,
                            mustWinByTwo: true,
                            tiebreakPointsToWin: 15,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 font-medium transition cursor-pointer active:scale-95"
                      >
                        🏐 Best of 3 (25 pts / 15 3rd)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyPreset({
                            periodsCount: 5,
                            periodsToWin: 3,
                            pointsToWinPeriod: 25,
                            mustWinByTwo: true,
                            tiebreakPointsToWin: 15,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 font-medium transition cursor-pointer active:scale-95"
                      >
                        Best of 5 Sets (25 pts)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyPreset({
                            periodsCount: 1,
                            periodsToWin: 1,
                            pointsToWinPeriod: 25,
                            mustWinByTwo: true,
                            tiebreakPointsToWin: null,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 font-medium transition cursor-pointer active:scale-95"
                      >
                        Single Set (25 pts)
                      </button>
                    </>
                  )}

                  {isTimed && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          applyPreset({
                            periodsCount: 2,
                            periodDurationMinutes: 45,
                            hasOvertime: true,
                            hasPenaltyShootout: true,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 font-medium transition cursor-pointer active:scale-95"
                      >
                        Full 90m (2 x 45 min)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyPreset({
                            periodsCount: 2,
                            periodDurationMinutes: 20,
                            hasOvertime: false,
                            hasPenaltyShootout: true,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 font-medium transition cursor-pointer active:scale-95"
                      >
                        Shortened (2 x 20 min)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyPreset({
                            periodsCount: 2,
                            periodDurationMinutes: 10,
                            hasOvertime: false,
                            hasPenaltyShootout: false,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 font-medium transition cursor-pointer active:scale-95"
                      >
                        Fast 20m (2 x 10 min)
                      </button>
                    </>
                  )}

                  {isCricket && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          applyPreset({
                            oversPerInnings: 20,
                            maxOversPerBowler: 4,
                            ballsPerOver: 6,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 font-medium transition cursor-pointer active:scale-95"
                      >
                        🏏 T20 (20 ov • 4/bowler)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyPreset({
                            oversPerInnings: 10,
                            maxOversPerBowler: 2,
                            ballsPerOver: 6,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 font-medium transition cursor-pointer active:scale-95"
                      >
                        ⚡ T10 (10 ov • 2/bowler)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyPreset({
                            oversPerInnings: 6,
                            maxOversPerBowler: 2,
                            ballsPerOver: 6,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 font-medium transition cursor-pointer active:scale-95"
                      >
                        Box 6 Overs
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyPreset({
                            oversPerInnings: 5,
                            maxOversPerBowler: 1,
                            ballsPerOver: 6,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 font-medium transition cursor-pointer active:scale-95"
                      >
                        Super 5 Overs
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Set-based Sport Configuration Fields */}
              {isSetBased && (
                <div className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Match Format (Sets)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 3, 5, 7].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSetsCountChange(s)}
                          className={`py-2 px-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                            periodsCount === s
                              ? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-400 dark:text-indigo-300 ring-2 ring-indigo-400/20"
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                          }`}
                        >
                          <div className="text-xs">{s === 1 ? "1 Set" : `Best of ${s}`}</div>
                          <div className="text-[10px] font-normal text-slate-400 dark:text-slate-500 mt-0.5">
                            {s === 1 ? "Sudden Death" : `First to ${Math.ceil(s / 2)}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Points to Win Set
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={pointsToWinPeriod}
                        onChange={(e) => setPointsToWinPeriod(Number(e.target.value) || 21)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <div className="flex gap-1.5 mt-1.5">
                        {[21, 15, 11, 25].map((pts) => (
                          <button
                            key={pts}
                            type="button"
                            onClick={() => setPointsToWinPeriod(pts)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                              pointsToWinPeriod === pts
                                ? "bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-300"
                                : "text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            {pts}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Max Cap (Golden Point)
                      </label>
                      <input
                        type="number"
                        min={pointsToWinPeriod}
                        max={100}
                        placeholder="No cap (Unlimited)"
                        value={tiebreakPointsToWin ?? ""}
                        onChange={(e) =>
                          setTiebreakPointsToWin(e.target.value ? Number(e.target.value) : null)
                        }
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {tiebreakPointsToWin
                          ? `E.g., ends at ${tiebreakPointsToWin}-${tiebreakPointsToWin - 1}`
                          : "Continuous 2-point lead required"}
                      </span>
                    </div>
                  </div>

                  {/* Deuce rule toggle */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        Must Win By 2 Points (Deuce)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                        If tied (e.g. 20-20), play continues until a player has a 2-point margin or hits the max cap.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                      <input
                        type="checkbox"
                        checked={mustWinByTwo}
                        onChange={(e) => setMustWinByTwo(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Timed Sport Configuration Fields */}
              {isTimed && (
                <div className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Number of Periods
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={periodsCount}
                        onChange={(e) => setPeriodsCount(Number(e.target.value) || 2)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Usually 2 Halves or 4 Quarters</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Minutes per Period
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={periodDurationMinutes}
                        onChange={(e) => setPeriodDurationMinutes(Number(e.target.value) || 20)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Total duration: {periodsCount * periodDurationMinutes} mins
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">Allow Overtime (Extra Time)</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                        Play extra period(s) if tied at regular full-time
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                      <input
                        type="checkbox"
                        checked={hasOvertime}
                        onChange={(e) => setHasOvertime(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">Penalty Shootout</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                        Determine winner via penalty shootout if tied
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                      <input
                        type="checkbox"
                        checked={hasPenaltyShootout}
                        onChange={(e) => setHasPenaltyShootout(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Cricket Sport Configuration Fields */}
              {isCricket && (
                <div className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Overs / Innings
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={oversPerInnings}
                        onChange={(e) => setOversPerInnings(Number(e.target.value) || 20)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Max Ov / Bowler
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={oversPerInnings}
                        value={maxOversPerBowler}
                        onChange={(e) => setMaxOversPerBowler(Number(e.target.value) || 4)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Balls / Over
                      </label>
                      <input
                        type="number"
                        min={4}
                        max={8}
                        value={ballsPerOver}
                        onChange={(e) => setBallsPerOver(Number(e.target.value) || 6)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Target Score Sport Fields */}
              {isTargetScore && (
                <div className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Target Score to Win
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={targetScore}
                        onChange={(e) => setTargetScore(Number(e.target.value) || 25)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Number of Boards / Games
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={periodsCount}
                        onChange={(e) => setPeriodsCount(Number(e.target.value) || 1)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Effective Format Summary Banner */}
              <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60 text-indigo-900 dark:text-indigo-200">
                <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-1">
                  <Shield className="w-3.5 h-3.5" /> Effective Single-Match Format
                </div>
                <p className="text-xs font-semibold m-0">
                  {isSetBased
                    ? `${periodsCount === 1 ? "1 Set Decider" : `Best of ${periodsCount} Sets`} • First to ${pointsToWinPeriod} pts${
                        mustWinByTwo ? " (Deuce: win by 2)" : ""
                      }${tiebreakPointsToWin ? ` • Max cap at ${tiebreakPointsToWin}` : ""}`
                    : isTimed
                    ? `${periodsCount} Halves of ${periodDurationMinutes} mins each${hasOvertime ? " + Overtime" : ""}${
                        hasPenaltyShootout ? " + Shootout" : ""
                      }`
                    : isCricket
                    ? `${oversPerInnings} Overs per Innings (${maxOversPerBowler} overs max per bowler)`
                    : isTargetScore
                    ? `Target: ${targetScore} pts across ${periodsCount} boards`
                    : `${periodsCount} Periods`}
                </p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 m-0">
                  ⚡ Saving applies immediately to live referees, spectators, and sets calculation for this match.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || loading}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl shadow-md shadow-indigo-100 dark:shadow-none transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{saving ? "Saving..." : "Apply Match Rules"}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
