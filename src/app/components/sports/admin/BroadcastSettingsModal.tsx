import React, { useState, useEffect } from "react";
import { X, Radio, Send, Trophy, Flame, BellOff, Check, AlertCircle } from "lucide-react";
import {
  tournamentService,
  type FeedVisibilityLevel,
  type FeedPostPolicy,
} from "../../../../services/sports/tournamentService";
import { toast } from "sonner";

interface BroadcastSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  level?: FeedVisibilityLevel;
  id?: number;
  title?: string;
  targetId?: number;
  targetType?: FeedVisibilityLevel;
  targetTitle?: string;
  onUpdated?: () => void;
}

const POLICY_OPTIONS: {
  policy: FeedPostPolicy;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}[] = [
  {
    policy: "FINALS_ONLY",
    title: "Finals Only",
    desc: "Only Grand Finals & Championship matches auto-post to the community feed. Keeps feed clean while celebrating champions.",
    icon: Trophy,
    badge: "Recommended",
  },
  {
    policy: "KNOCKOUTS_ONLY",
    title: "Knockout Stages Only",
    desc: "Auto-posts results for Quarter-Finals, Semi-Finals, and Finals. Group/league stage matches remain on the Live Strip only.",
    icon: Flame,
  },
  {
    policy: "ALL_MATCHES",
    title: "All Completed Matches",
    desc: "Auto-posts an official result for every completed match across all rounds.",
    icon: Send,
  },
  {
    policy: "NONE",
    title: "Live Strip Only (No Auto-Posts)",
    desc: "Never auto-posts results to the feed stream. Organizers can still use the 1-click 'Post to Feed' button on any match.",
    icon: BellOff,
  },
];

export function BroadcastSettingsModal({
  isOpen,
  onClose,
  level: propLevel,
  id: propId,
  title: propTitle,
  targetId,
  targetType,
  targetTitle,
  onUpdated,
}: BroadcastSettingsModalProps) {
  const level = (targetType || propLevel || "tournament") as FeedVisibilityLevel;
  const id = (targetId ?? propId) as number;
  const title = targetTitle || propTitle || "Broadcast Settings";
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showInLiveStrip, setShowInLiveStrip] = useState<boolean>(true);
  const [feedPostPolicy, setFeedPostPolicy] = useState<FeedPostPolicy>("FINALS_ONLY");
  const [cascade, setCascade] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen || !id) return;
    setLoading(true);
    tournamentService
      .getFeedVisibility(level, id)
      .then((data) => {
        setShowInLiveStrip(data.showInFeed !== false);
        setFeedPostPolicy(data.feedPostPolicy || "FINALS_ONLY");
      })
      .catch(() => {
        setShowInLiveStrip(true);
        setFeedPostPolicy("FINALS_ONLY");
      })
      .finally(() => setLoading(false));
  }, [isOpen, level, id]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await tournamentService.setFeedSettings(level, id, {
        showInFeed: showInLiveStrip,
        feedPostPolicy,
        cascade,
      });
      toast.success("Broadcast & feed settings updated successfully!");
      if (onUpdated) onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update broadcast settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30">
          <div className="min-w-0 pr-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 truncate">
              <Radio className="w-4 h-4 text-red-500 animate-pulse" />
              <span>Broadcast &amp; Feed Policy</span>
            </h3>
            <p className="text-xs text-slate-500 truncate mt-0.5">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs text-slate-600">
          {loading ? (
            <div className="py-12 text-center text-slate-400 font-medium">
              Loading broadcast settings...
            </div>
          ) : (
            <>
              {/* Part 1: Live Now Strip */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-indigo-600" />
                      1. "Live Now" Top Strip Visibility
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Display active matches in the real-time scoreboard ticker at the top of the feed.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInLiveStrip((v) => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      showInLiveStrip ? "bg-emerald-600" : "bg-slate-300"
                    }`}
                    role="switch"
                    aria-checked={showInLiveStrip}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        showInLiveStrip ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                <div
                  className={`p-3 rounded-xl border text-[11px] ${
                    showInLiveStrip
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  {showInLiveStrip ? (
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Live Scoreboard Active:</strong> Residents will see live scores while matches are underway.
                      </span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        <strong>Live Scoreboard Muted:</strong> Matches will not appear in the top "Live Now" strip.
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Part 2: Community Feed Result Posting */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-indigo-600" />
                    2. Community Feed Result Posting Policy
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select when the system automatically creates an official result post in the community feed stream:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {POLICY_OPTIONS.map((opt) => {
                    const isSelected = feedPostPolicy === opt.policy;
                    const IconComponent = opt.icon;
                    return (
                      <button
                        key={opt.policy}
                        type="button"
                        onClick={() => setFeedPostPolicy(opt.policy)}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? "bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-200 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                              <IconComponent
                                className={`w-3.5 h-3.5 ${
                                  isSelected ? "text-indigo-600" : "text-slate-400"
                                }`}
                              />
                              <span>{opt.title}</span>
                            </span>
                            {opt.badge && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            {opt.desc}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="mt-2 pt-1 border-t border-indigo-100/80 flex items-center gap-1 text-[10px] font-bold text-indigo-700">
                            <Check className="w-3 h-3 text-indigo-600" />
                            <span>Selected</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Part 3: Cascade */}
              {level !== "match" && (
                <div className="pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={cascade}
                      onChange={(e) => setCascade(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span className="text-[11px] font-medium text-slate-700">
                      Apply this policy to all associated sub-events and matches
                    </span>
                  </label>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-slate-100 bg-slate-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || loading}
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Policy"}
          </button>
        </div>
      </div>
    </div>
  );
}
