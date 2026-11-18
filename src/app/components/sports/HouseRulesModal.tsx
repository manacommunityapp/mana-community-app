import React, { useState } from "react";
import {
  X,
  Settings,
  Sliders,
  Shield,
  ZapOff,
  Clock,
  Check,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { HouseRulesConfig } from "./utils/cricketUtils";
import { toast } from "sonner";

interface HouseRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: number;
  initialRules: HouseRulesConfig;
  onSaveRules: (rules: HouseRulesConfig) => Promise<void>;
}

export function HouseRulesModal({
  isOpen,
  onClose,
  matchId,
  initialRules,
  onSaveRules,
}: HouseRulesModalProps) {
  const [noExtraRuns, setNoExtraRuns] = useState(initialRules.noExtraRuns);
  const [noFreeHits, setNoFreeHits] = useState(initialRules.noFreeHits);
  const [oversLimit, setOversLimit] = useState(initialRules.oversLimit || 20);
  const [ballsPerOver, setBallsPerOver] = useState(initialRules.ballsPerOver || 6);
  const [maxOversPerBowler, setMaxOversPerBowler] = useState(
    initialRules.maxOversPerBowler || Math.ceil((initialRules.oversLimit || 20) / 5)
  );
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleOversPreset = (ov: number) => {
    setOversLimit(ov);
    setMaxOversPerBowler(Math.ceil(ov / 5) || 1);
  };

  const handleSave = async () => {
    if (oversLimit <= 0) {
      toast.error("Overs per innings must be at least 1");
      return;
    }
    if (ballsPerOver <= 0 || ballsPerOver > 12) {
      toast.error("Balls per over must be between 1 and 12");
      return;
    }

    setSaving(true);
    try {
      await onSaveRules({
        enabled: initialRules.enabled !== false,
        noExtraRuns,
        noFreeHits,
        oversLimit,
        ballsPerOver,
        maxOversPerBowler,
      });
      toast.success("House rules & match settings updated!");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update house rules");
    } finally {
      setSaving(false);
    }
  };

  const hasAnyGullyRule = initialRules.enabled !== false && (noExtraRuns || noFreeHits || ballsPerOver !== 6);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-white flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sliders className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight">
                  Gully & Box Cricket Rules
                </h2>
                {hasAnyGullyRule && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    Custom Rules Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Optional switches and mid-match overrides tailored for community tournaments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Rule Toggle 1: No Extra Runs */}
          <div className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white">
                  No Extra Runs on Wides & No-Balls
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Gully Rule
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The delivery is re-bowled, but <strong>no penalty run</strong> is added to the batting score. Popular in street matches with limited balls.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNoExtraRuns(!noExtraRuns)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                noExtraRuns ? "bg-amber-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  noExtraRuns ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Rule Toggle 2: No Free Hits */}
          <div className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white">
                  Disable Free Hits
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Box / Indoor
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                No-Balls will not award a Free Hit on the next delivery. Keeps short-format and indoor box games fast and clean.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNoFreeHits(!noFreeHits)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                noFreeHits ? "bg-indigo-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  noFreeHits ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Setting 3: Change Overs Mid-Match */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs sm:text-sm font-bold text-white">
                  Match Overs Limit (Mid-Match Adjustment)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Decrease or increase total overs mid-game when turf booking hours expire, bad light occurs, or rain threatens.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[5, 6, 8, 10, 12, 15, 20].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleOversPreset(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition active:scale-95 ${
                    oversLimit === preset
                      ? "bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {preset} ov
                </button>
              ))}
            </div>

            {/* Detailed Controls */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold uppercase block mb-1">
                  Total Overs / Innings
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={oversLimit}
                  onChange={(e) => setOversLimit(Number(e.target.value) || 1)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-white font-mono text-sm font-bold outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold uppercase block mb-1">
                  Max Overs / Bowler
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxOversPerBowler}
                  onChange={(e) => setMaxOversPerBowler(Number(e.target.value) || 1)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-white font-mono text-sm font-bold outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Setting 4: Balls Per Over */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="space-y-0.5">
              <span className="text-xs sm:text-sm font-bold text-white">
                Balls Per Over (Box Cricket)
              </span>
              <p className="text-[11px] text-slate-400">
                Number of legal deliveries before changing ends. Standard cricket is 6 balls.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {[4, 5, 6, 8].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBallsPerOver(b)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 border ${
                    ballsPerOver === b
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-sm shadow-indigo-600/30"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  {b} Balls
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? "Saving Rules..." : "Apply & Save Rules"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
