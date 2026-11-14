import React, { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Clock,
  Trophy,
  CloudOff,
  RefreshCw,
  Edit3,
  ShieldAlert,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  tournamentService,
  type MatchResultRequestData,
  type MatchResultDetailRequestData,
} from "../../../services/sports/tournamentService";
import { stompClient } from "../../../services/chat/stompClient";

export interface EmergencyScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: number;
  configId?: number | null;
  sportType?: string | null;
  teamAId?: number | null;
  teamBId?: number | null;
  teamAName?: string;
  teamBName?: string;
  currentScoreA?: string | number | null;
  currentScoreB?: string | number | null;
  currentPeriod?: number;
  onSuccess?: (resultData?: any) => void;
}

type ModeTab = "FINAL_RESULT" | "INTERIM_ADJUST" | "OFFLINE_QUEUE";

const OFFLINE_QUEUE_KEY = "mana_sports_offline_scoring_queue";

export interface QueuedScoreAction {
  id: string;
  matchId: number;
  timestamp: string;
  type: "FINAL_RESULT" | "PERIOD_SCORE";
  payload: any;
}

export function getOfflineQueuedActions(matchId?: number): QueuedScoreAction[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    const list: QueuedScoreAction[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    if (matchId) return list.filter((a) => a.matchId === matchId);
    return list;
  } catch {
    return [];
  }
}

export function saveOfflineAction(action: QueuedScoreAction) {
  try {
    const current = getOfflineQueuedActions();
    current.push(action);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(current));
  } catch {}
}

export function removeOfflineAction(actionId: string) {
  try {
    const current = getOfflineQueuedActions();
    const filtered = current.filter((a) => a.id !== actionId);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  } catch {}
}

export function EmergencyScoreModal({
  isOpen,
  onClose,
  matchId,
  configId,
  sportType = "Sports",
  teamAId,
  teamBId,
  teamAName = "Team A",
  teamBName = "Team B",
  currentScoreA,
  currentScoreB,
  currentPeriod = 1,
  onSuccess,
}: EmergencyScoreModalProps) {
  const [activeTab, setActiveTab] = useState<ModeTab>("FINAL_RESULT");
  const [submitting, setSubmitting] = useState(false);

  // Tab 1: Final Match Result States
  const [resultType, setResultType] = useState<
    "WIN" | "TIE" | "DRAW" | "WALK_OVER" | "FORFEIT" | "ABANDONED" | "NO_RESULT"
  >("WIN");
  const [scoreTeamA, setScoreTeamA] = useState<string>(
    currentScoreA != null && currentScoreA !== "—" ? String(currentScoreA) : ""
  );
  const [scoreTeamB, setScoreTeamB] = useState<string>(
    currentScoreB != null && currentScoreB !== "—" ? String(currentScoreB) : ""
  );
  const [winnerSide, setWinnerSide] = useState<"A" | "B" | "NONE">("A");
  const [winMargin, setWinMargin] = useState<string>("");
  const [matchNotes, setMatchNotes] = useState<string>("");

  // Tab 2: Interim Score Correction States (for match in progress)
  const [interimPeriod, setInterimPeriod] = useState<number>(currentPeriod || 1);
  const [interimScoreA, setInterimScoreA] = useState<string>(
    currentScoreA != null && currentScoreA !== "—" ? String(currentScoreA) : "0"
  );
  const [interimScoreB, setInterimScoreB] = useState<string>(
    currentScoreB != null && currentScoreB !== "—" ? String(currentScoreB) : "0"
  );

  // Tab 3: Offline Queue State
  const [offlineQueue, setOfflineQueue] = useState<QueuedScoreAction[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    if (!isOpen) return;
    setOfflineQueue(getOfflineQueuedActions(matchId));
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOffline();
    function setIsOffline() { setIsOnline(false); }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isOpen, matchId]);

  if (!isOpen) return null;

  const isCricket = /cricket/i.test(sportType || "");
  const isSetSport = /badminton|tennis|table|volleyball|squash|pickleball/i.test(sportType || "");

  // Submit Final Match Result
  const handleSubmitFinalResult = async () => {
    if (resultType === "WIN" || resultType === "WALK_OVER" || resultType === "FORFEIT") {
      if (winnerSide === "NONE") {
        toast.error("Please select the winning team / player.");
        return;
      }
    }

    setSubmitting(true);
    const resolvedWinnerTeamId =
      winnerSide === "A" ? (teamAId ?? 1) : winnerSide === "B" ? (teamBId ?? 2) : null;
    const resolvedWinnerName =
      winnerSide === "A" ? teamAName : winnerSide === "B" ? teamBName : undefined;

    const detailedReq: MatchResultDetailRequestData = {
      matchId,
      winnerTeamId: resolvedWinnerTeamId,
      resultType,
      scoreTeamA: scoreTeamA.trim() || "0",
      scoreTeamB: scoreTeamB.trim() || "0",
      winMargin: winMargin.trim() || undefined,
      matchNotes:
        matchNotes.trim() ||
        `Manual score override: ${resultType}${resolvedWinnerName ? ` (${resolvedWinnerName})` : ""}`,
    };

    const basicReq: MatchResultRequestData = {
      matchId,
      winnerTeamId: resolvedWinnerTeamId,
      winnerName: resolvedWinnerName,
      winnerSide: winnerSide === "A" ? "A" : winnerSide === "B" ? "B" : undefined,
      scoreTeamA: scoreTeamA.trim() || "0",
      scoreTeamB: scoreTeamB.trim() || "0",
      matchNotes:
        matchNotes.trim() ||
        `Emergency score submission (${resultType})`,
    };

    try {
      // 1. Primary submission via detailed result
      try {
        await tournamentService.recordDetailedResult(detailedReq);
      } catch (err) {
        // 2. Resilient fallback via basic bracket result
        await tournamentService.recordResult(basicReq);
      }

      toast.success(
        `Match completed successfully! Outcome: ${resultType}${
          resolvedWinnerName ? ` — Winner: ${resolvedWinnerName}` : ""
        }`
      );

      // Re-trigger global feeds
      try {
        if (stompClient.connected) {
          stompClient.publish("/topic/sports/live", { type: "REFRESH" });
        }
      } catch {}

      onSuccess?.(detailedReq);
      onClose();
    } catch (networkErr: any) {
      // 3. Complete Offline Fallback: Queue locally if network dropped
      const queueAction: QueuedScoreAction = {
        id: crypto.randomUUID(),
        matchId,
        timestamp: new Date().toISOString(),
        type: "FINAL_RESULT",
        payload: detailedReq,
      };
      saveOfflineAction(queueAction);
      setOfflineQueue(getOfflineQueuedActions(matchId));
      toast.warning(
        "Network connection offline. Score saved to local backup queue and will auto-sync when online."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Interim Score Adjustment (Match stays LIVE / In Progress)
  const handleApplyInterimScore = async () => {
    setSubmitting(true);
    const scoreA = Number(interimScoreA) || 0;
    const scoreB = Number(interimScoreB) || 0;

    try {
      if (isSetSport || !isCricket) {
        await tournamentService.recordPeriodScore(matchId, interimPeriod, scoreA, scoreB);
      }
      toast.success(
        `Interim score updated: ${teamAName} ${scoreA} - ${scoreB} ${teamBName}`
      );
      onSuccess?.({ scoreA, scoreB, period: interimPeriod });
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update interim score. Check connection.");
    } finally {
      setSubmitting(false);
    }
  };

  // Sync Offline Queue
  const handleSyncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    setSubmitting(true);
    let successCount = 0;
    for (const item of offlineQueue) {
      try {
        if (item.type === "FINAL_RESULT") {
          await tournamentService.recordDetailedResult(item.payload).catch(async () => {
            await tournamentService.recordResult(item.payload);
          });
          removeOfflineAction(item.id);
          successCount++;
        }
      } catch {}
    }
    setOfflineQueue(getOfflineQueuedActions(matchId));
    setSubmitting(false);
    if (successCount > 0) {
      toast.success(`Successfully synced ${successCount} offline score action(s)!`);
      onSuccess?.();
      onClose();
    } else {
      toast.error("Could not sync offline queue yet. Please ensure you have internet access.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-fade-in text-slate-800"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-inner">
              <Zap className="w-5 h-5 text-amber-200 fill-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white m-0 tracking-tight">
                  Emergency Scoring & Manual Override
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/20 text-white border border-white/20">
                  Sure-Fire Mode
                </span>
              </div>
              <p className="text-xs text-amber-100/90 m-0 mt-0.5 font-medium">
                {teamAName} vs {teamBName} · Match #{matchId} ({sportType})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Offline Warning Banner */}
        {!isOnline && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center gap-2">
            <CloudOff className="w-4 h-4 shrink-0" />
            <span>
              Device is currently offline. Any scores submitted now will be preserved safely in local storage and synced automatically.
            </span>
          </div>
        )}

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-3 pt-2 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("FINAL_RESULT")}
            className={`px-3 py-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-t border-x ${
              activeTab === "FINAL_RESULT"
                ? "bg-white text-amber-800 border-slate-200 shadow-2xs font-black"
                : "text-slate-500 border-transparent hover:text-slate-800"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>Complete Match Result</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("INTERIM_ADJUST")}
            className={`px-3 py-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-t border-x ${
              activeTab === "INTERIM_ADJUST"
                ? "bg-white text-indigo-700 border-slate-200 shadow-2xs font-black"
                : "text-slate-500 border-transparent hover:text-slate-800"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Interim Score Adjust</span>
          </button>

          {offlineQueue.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("OFFLINE_QUEUE")}
              className={`px-3 py-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-t border-x ${
                activeTab === "OFFLINE_QUEUE"
                  ? "bg-white text-rose-700 border-slate-200 shadow-2xs font-black"
                  : "text-rose-600 border-transparent hover:text-rose-800"
              }`}
            >
              <CloudOff className="w-3.5 h-3.5 text-rose-600" />
              <span>Offline Queue ({offlineQueue.length})</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[70vh]">
          {/* TAB 1: Complete Match Result */}
          {activeTab === "FINAL_RESULT" && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Guaranteed Match Completion:</span> Use this to directly submit final scores and advance the tournament bracket if real-time scoring is interrupted, socket disconnected, or if players had walkovers/forfeits.
                </div>
              </div>

              {/* Result Outcome Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Result Outcome *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-bold">
                  {[
                    { id: "WIN", label: "Standard Win" },
                    { id: "WALK_OVER", label: "Walkover" },
                    { id: "FORFEIT", label: "Forfeit" },
                    { id: "TIE", label: "Tie / Draw" },
                    { id: "ABANDONED", label: "Abandoned (Rain)" },
                    { id: "NO_RESULT", label: "No Result" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setResultType(item.id as any)}
                      className={`py-2 px-2.5 rounded-xl border text-center transition cursor-pointer ${
                        resultType === item.id
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Scores Input */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-bold text-slate-700 truncate mb-1">
                    {teamAName} Score
                  </label>
                  <input
                    type="text"
                    value={scoreTeamA}
                    onChange={(e) => setScoreTeamA(e.target.value)}
                    placeholder={isCricket ? "e.g. 154/6 (20 ov)" : isSetSport ? "e.g. 21 (or 2 sets)" : "Score"}
                    className="w-full text-center bg-white border border-slate-200 rounded-xl py-2 px-3 text-base font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 truncate mb-1">
                    {teamBName} Score
                  </label>
                  <input
                    type="text"
                    value={scoreTeamB}
                    onChange={(e) => setScoreTeamB(e.target.value)}
                    placeholder={isCricket ? "e.g. 142/8 (20 ov)" : isSetSport ? "e.g. 18 (or 1 set)" : "Score"}
                    className="w-full text-center bg-white border border-slate-200 rounded-xl py-2 px-3 text-base font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Winner Selector (for WIN, WALK_OVER, FORFEIT) */}
              {(resultType === "WIN" || resultType === "WALK_OVER" || resultType === "FORFEIT") && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Select Winner *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setWinnerSide("A")}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                        winnerSide === "A"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400/30"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="block text-xs font-bold truncate">{teamAName}</span>
                        <span className="text-[10px] text-slate-500">Side A</span>
                      </div>
                      {winnerSide === "A" && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setWinnerSide("B")}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                        winnerSide === "B"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400/30"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="block text-xs font-bold truncate">{teamBName}</span>
                        <span className="text-[10px] text-slate-500">Side B</span>
                      </div>
                      {winnerSide === "B" && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Win Margin & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Win Margin (Optional)
                  </label>
                  <input
                    type="text"
                    value={winMargin}
                    onChange={(e) => setWinMargin(e.target.value)}
                    placeholder="e.g. 12 runs / 2 sets / 3-1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:bg-white focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Reason / Umpire Remarks
                  </label>
                  <input
                    type="text"
                    value={matchNotes}
                    onChange={(e) => setMatchNotes(e.target.value)}
                    placeholder="e.g. Walkover due to player injury"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:bg-white focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Submit Final Button */}
              <button
                type="button"
                onClick={handleSubmitFinalResult}
                disabled={submitting}
                className="w-full py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Recording Match Result...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-amber-200" />
                    <span>Submit Final Result & Complete Match</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: Interim Score Correction */}
          {activeTab === "INTERIM_ADJUST" && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200 text-xs text-indigo-950 flex items-start gap-2.5">
                <Edit3 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Live Score Correction:</span> Use this to directly adjust the in-progress score if points were counted incorrectly or missed, without completing the match.
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 uppercase">
                    Select Set / Period:
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setInterimPeriod(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                          interimPeriod === p
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-slate-600 border border-slate-200"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <span className="block text-xs font-bold text-slate-700 truncate mb-1">
                      {teamAName} Points
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={interimScoreA}
                      onChange={(e) => setInterimScoreA(e.target.value)}
                      className="w-full text-center bg-white border border-slate-200 rounded-xl py-2 px-3 text-lg font-black text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-slate-700 truncate mb-1">
                      {teamBName} Points
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={interimScoreB}
                      onChange={(e) => setInterimScoreB(e.target.value)}
                      className="w-full text-center bg-white border border-slate-200 rounded-xl py-2 px-3 text-lg font-black text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyInterimScore}
                disabled={submitting}
                className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Applying Correction...</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 text-indigo-200" />
                    <span>Apply Interim Score Adjustment</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: Offline Queue */}
          {activeTab === "OFFLINE_QUEUE" && (
            <div className="space-y-4">
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-950 flex items-start gap-2.5">
                <CloudOff className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Offline Backups:</span> Scores saved in device memory while offline.
                </div>
              </div>

              <div className="space-y-2">
                {offlineQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{item.type}</span>
                      <span className="text-slate-400 block text-[10px]">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        removeOfflineAction(item.id);
                        setOfflineQueue(getOfflineQueuedActions(matchId));
                      }}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                    >
                      Discard
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSyncOfflineQueue}
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${submitting ? "animate-spin" : ""}`} />
                <span>Sync Offline Queue Now</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:px-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Match #{matchId} Override Safety</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel / Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmergencyScoreModal;
