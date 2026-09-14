import { useState, useEffect, useCallback } from "react";
import { X, Loader2, Timer, Plus, RefreshCw } from "lucide-react";
import {
  tournamentService,
  type RaceResult,
  type RaceResultRequest,
} from "../../../services/sports/tournamentService";
import { toast } from "sonner";

interface RaceScoringPanelProps {
  matchId: number;
  sportType: string;
  onClose: () => void;
  players?: { id: number; name: string; teamId: number }[];
}

const STATUS_OPTIONS = [
  { value: "FINISHED", label: "Finished", color: "bg-emerald-500" },
  { value: "DNF", label: "DNF", color: "bg-red-500" },
  { value: "DNS", label: "DNS", color: "bg-slate-400" },
  { value: "DQ", label: "DQ", color: "bg-orange-500" },
] as const;

export function RaceScoringPanel({
  matchId,
  sportType,
  onClose,
  players,
}: RaceScoringPanelProps) {
  const [results, setResults] = useState<RaceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [playerId, setPlayerId] = useState<number | "">("");
  const [heatNumber, setHeatNumber] = useState<number | "">("");
  const [laneNumber, setLaneNumber] = useState<number | "">("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [milliseconds, setMilliseconds] = useState("");
  const [raceStatus, setRaceStatus] = useState<RaceResultRequest["raceStatus"]>("FINISHED");
  const [notes, setNotes] = useState("");

  const fetchResults = useCallback(() => {
    tournamentService
      .getRaceResults(matchId)
      .then(setResults)
      .catch(() => toast.error("Failed to load race results"))
      .finally(() => setLoading(false));
  }, [matchId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const parseTimeToMillis = (): number | undefined => {
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;
    const ms = parseInt(milliseconds) || 0;
    if (m === 0 && s === 0 && ms === 0) return undefined;
    return m * 60000 + s * 1000 + ms;
  };

  const formatTimeString = (): string | undefined => {
    const millis = parseTimeToMillis();
    if (!millis) return undefined;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;
    const ms = parseInt(milliseconds) || 0;
    if (m > 0) return `${m}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
    return `${s}.${String(ms).padStart(3, "0")}`;
  };

  const handleSubmit = async () => {
    if (!playerId) {
      toast.error("Please select a player");
      return;
    }
    setSubmitting(true);
    try {
      const req: RaceResultRequest = {
        matchId,
        playerId: playerId as number,
        heatNumber: heatNumber ? (heatNumber as number) : undefined,
        laneNumber: laneNumber ? (laneNumber as number) : undefined,
        finishTimeMillis: parseTimeToMillis(),
        formattedTime: formatTimeString(),
        raceStatus,
        notes: notes || undefined,
      };
      await tournamentService.recordRaceResult(req);
      toast.success("Result recorded");
      setPlayerId("");
      setMinutes("");
      setSeconds("");
      setMilliseconds("");
      setNotes("");
      fetchResults();
    } catch {
      toast.error("Failed to record result");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      const updated = await tournamentService.recalculateRaceRanks(matchId);
      setResults(updated);
      toast.success("Ranks recalculated");
    } catch {
      toast.error("Failed to recalculate ranks");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-white" />
            <div>
              <div className="text-sm font-bold text-white">Race Scoring</div>
              <div className="text-[10px] text-cyan-200">{sportType}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Entry Form */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Record Result
            </div>

            {/* Player */}
            <select
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value ? Number(e.target.value) : "")}
              className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-300"
            >
              <option value="">Select Player</option>
              {players?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Heat & Lane */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Heat #"
                value={heatNumber}
                onChange={(e) => setHeatNumber(e.target.value ? Number(e.target.value) : "")}
                className="text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-300"
              />
              <input
                type="number"
                placeholder="Lane #"
                value={laneNumber}
                onChange={(e) => setLaneNumber(e.target.value ? Number(e.target.value) : "")}
                className="text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-300"
              />
            </div>

            {/* Time Entry */}
            <div>
              <div className="text-[10px] font-medium text-slate-400 mb-1">Finish Time</div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    min={0}
                    className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-300"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">min</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Sec"
                    value={seconds}
                    onChange={(e) => setSeconds(e.target.value)}
                    min={0}
                    max={59}
                    className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-300"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">sec</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Ms"
                    value={milliseconds}
                    onChange={(e) => setMilliseconds(e.target.value)}
                    min={0}
                    max={999}
                    className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-300"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">ms</span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setRaceStatus(s.value)}
                  className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition ${
                    raceStatus === s.value
                      ? `${s.color} text-white shadow`
                      : "bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Notes */}
            <input
              type="text"
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-300"
            />

            <button
              onClick={handleSubmit}
              disabled={submitting || !playerId}
              className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Record Result
            </button>
          </div>

          {/* Results List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Results ({results.length})
              </div>
              <button
                onClick={handleRecalculate}
                className="text-[10px] font-medium text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Recalculate
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No results recorded yet</div>
            ) : (
              <div className="space-y-1">
                {results.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      r.overallRank === 1 ? "bg-amber-400 text-amber-900" :
                      r.overallRank === 2 ? "bg-slate-300 text-slate-700" :
                      r.overallRank === 3 ? "bg-orange-300 text-orange-800" :
                      "bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300"
                    }`}>
                      {r.overallRank || "-"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 dark:text-white truncate">
                        {r.playerName}
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {r.teamName}{r.heatNumber ? ` · Heat ${r.heatNumber}` : ""}{r.laneNumber ? ` · Lane ${r.laneNumber}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800 dark:text-white">
                        {r.raceStatus === "FINISHED" ? (r.formattedTime || "-") : r.raceStatus}
                      </div>
                      {r.isPersonalBest && (
                        <div className="text-[8px] font-bold text-emerald-500">PB!</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
