import { useState, useEffect, useCallback } from "react";
import { X, Loader2, Undo2, AlertTriangle, ChevronDown } from "lucide-react";
import {
  tournamentService,
  type GenericMatchState,
  type GenericScoreRequest,
} from "../../../services/sports/tournamentService";
import {
  SPORT_EVENT_TYPES,
  PERIOD_LABELS,
} from "./utils/sportScoringConstants";
import { toast } from "sonner";

interface GenericLiveScoringPanelProps {
  matchId: number;
  sportType: string; // "BADMINTON", "FOOTBALL", "BASKETBALL", "VOLLEYBALL", "TENNIS", "TABLE_TENNIS"
  onClose: () => void;
  teamA: { id: number; name: string; color: string };
  teamB: { id: number; name: string; color: string };
  players?: { id: number; name: string; teamId: number }[];
}

const COLOR_MAP: Record<string, string> = {
  green: "bg-emerald-500 hover:bg-emerald-600 text-white",
  blue: "bg-blue-500 hover:bg-blue-600 text-white",
  red: "bg-red-500 hover:bg-red-600 text-white",
  yellow: "bg-yellow-400 hover:bg-yellow-500 text-black",
  purple: "bg-purple-500 hover:bg-purple-600 text-white",
  indigo: "bg-indigo-500 hover:bg-indigo-600 text-white",
  orange: "bg-orange-500 hover:bg-orange-600 text-white",
  gray: "bg-slate-400 hover:bg-slate-500 text-white",
};

const isSetBased = (sport: string) =>
  ["BADMINTON", "VOLLEYBALL", "TENNIS", "TABLE_TENNIS"].includes(sport);

const isTimedSport = (sport: string) =>
  ["FOOTBALL", "SOCCER", "BASKETBALL"].includes(sport);

export function GenericLiveScoringPanel({
  matchId,
  sportType,
  onClose,
  teamA,
  teamB,
  players,
}: GenericLiveScoringPanelProps) {
  const [state, setState] = useState<GenericMatchState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedPlayerA, setSelectedPlayerA] = useState<number | undefined>();
  const [selectedPlayerB, setSelectedPlayerB] = useState<number | undefined>();
  const [matchMinute, setMatchMinute] = useState<number | undefined>();
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const eventTypes = SPORT_EVENT_TYPES[sportType] || SPORT_EVENT_TYPES["BADMINTON"] || [];
  const periodLabels = PERIOD_LABELS[sportType] || ["Period 1", "Period 2", "Period 3"];

  const fetchState = useCallback(async () => {
    try {
      const s = await tournamentService.getGenericMatchState(matchId);
      setState(s);
    } catch {
      setError("Failed to load match state");
    }
  }, [matchId]);

  useEffect(() => {
    fetchState().finally(() => setLoading(false));
    const interval = setInterval(fetchState, 10000);
    return () => clearInterval(interval);
  }, [fetchState]);

  const handleScore = useCallback(
    async (
      teamId: number,
      eventType: string,
      points: number,
      playerId?: number
    ) => {
      if (!state || saving || state.status === "COMPLETED") return;
      setSaving(true);
      try {
        const req: GenericScoreRequest = {
          matchId,
          teamId,
          eventType,
          periodNumber: state.currentPeriod,
          pointsAwarded: points,
          playerId,
          matchMinute: isTimedSport(sportType) ? matchMinute : undefined,
        };
        await tournamentService.recordGenericScore(req);
        await fetchState();
      } catch (err: any) {
        toast.error(err?.message || "Failed to record score");
      } finally {
        setSaving(false);
      }
    },
    [state, saving, matchId, sportType, matchMinute, fetchState]
  );

  const handleUndo = useCallback(async () => {
    if (!state || saving) return;
    setSaving(true);
    try {
      await tournamentService.undoGenericEvent(matchId);
      await fetchState();
      toast.success("Last event undone");
    } catch (err: any) {
      toast.error(err?.message || "Failed to undo");
    } finally {
      setSaving(false);
    }
  }, [state, saving, matchId, fetchState]);

  const handleCompletePeriod = useCallback(async () => {
    if (!state || saving) return;
    setSaving(true);
    try {
      await tournamentService.completePeriod(matchId, state.currentPeriod);
      await fetchState();
      toast.success(`${periodLabels[state.currentPeriod - 1] || `Period ${state.currentPeriod}`} completed`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to complete period");
    } finally {
      setSaving(false);
    }
  }, [state, saving, matchId, fetchState, periodLabels]);

  const playersA = players?.filter((p) => p.teamId === teamA.id) || [];
  const playersB = players?.filter((p) => p.teamId === teamB.id) || [];
  const isCompleted = state?.status === "COMPLETED";

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !state) {
    return (
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-slate-700 dark:text-slate-200 font-semibold">
            {error || "Match data unavailable"}
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const currentPeriodLabel =
    periodLabels[state.currentPeriod - 1] || `Period ${state.currentPeriod}`;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {sportType.replace(/_/g, " ")} - Live Scoring
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentPeriodLabel}
              {isCompleted && (
                <span className="ml-2 text-emerald-600 font-semibold">
                  COMPLETED
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowCloseConfirm(true)}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Scoreboard */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            {/* Team A */}
            <div className="flex-1 text-center">
              <div
                className="w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: teamA.color || "#6366f1" }}
              >
                {teamA.name.slice(0, 2).toUpperCase()}
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {teamA.name}
              </p>
            </div>

            {/* Score */}
            <div className="text-center px-3">
              <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                {state.scoreTeamA}
                <span className="text-slate-300 dark:text-slate-600 mx-1">
                  -
                </span>
                {state.scoreTeamB}
              </div>
              {isSetBased(sportType) && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Sets: {state.periodsWonA} - {state.periodsWonB}
                </div>
              )}
            </div>

            {/* Team B */}
            <div className="flex-1 text-center">
              <div
                className="w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: teamB.color || "#f97316" }}
              >
                {teamB.name.slice(0, 2).toUpperCase()}
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {teamB.name}
              </p>
            </div>
          </div>

          {/* Period scores */}
          {state.periods.length > 0 && (
            <div className="flex gap-1 justify-center flex-wrap mb-3">
              {state.periods.map((p) => (
                <div
                  key={p.periodNumber}
                  className={`text-[10px] px-2 py-1 rounded-lg font-semibold ${
                    p.periodNumber === state.currentPeriod
                      ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-300"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {p.periodLabel}: {p.scoreTeamA}-{p.scoreTeamB}
                </div>
              ))}
            </div>
          )}

          {/* Point-to-win progress bar for set-based sports */}
          {isSetBased(sportType) && state.scoringConfig?.pointsToWinPeriod && (
            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                <span>
                  {state.scoreTeamA} / {state.scoringConfig.pointsToWinPeriod}
                </span>
                <span>Target: {state.scoringConfig.pointsToWinPeriod}</span>
                <span>
                  {state.scoreTeamB} / {state.scoringConfig.pointsToWinPeriod}
                </span>
              </div>
              <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                <div
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (state.scoreTeamA /
                        state.scoringConfig.pointsToWinPeriod) *
                        50,
                      50
                    )}%`,
                    backgroundColor: teamA.color || "#6366f1",
                  }}
                />
                <div className="flex-1" />
                <div
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (state.scoreTeamB /
                        state.scoringConfig.pointsToWinPeriod) *
                        50,
                      50
                    )}%`,
                    backgroundColor: teamB.color || "#f97316",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Match minute input for timed sports */}
        {isTimedSport(sportType) && !isCompleted && (
          <div className="px-4 pb-3">
            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Match Minute
            </label>
            <input
              type="number"
              min={0}
              max={150}
              value={matchMinute ?? ""}
              onChange={(e) =>
                setMatchMinute(
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              placeholder="e.g. 45"
              className="mt-1 w-24 px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        )}

        {/* Player selectors */}
        {(playersA.length > 0 || playersB.length > 0) && !isCompleted && (
          <div className="px-4 pb-3 grid grid-cols-2 gap-3">
            {playersA.length > 0 && (
              <div>
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {teamA.name} Player
                </label>
                <div className="relative mt-1">
                  <select
                    value={selectedPlayerA ?? ""}
                    onChange={(e) =>
                      setSelectedPlayerA(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 appearance-none pr-7 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="">-- Select --</option>
                    {playersA.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}
            {playersB.length > 0 && (
              <div>
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {teamB.name} Player
                </label>
                <div className="relative mt-1">
                  <select
                    value={selectedPlayerB ?? ""}
                    onChange={(e) =>
                      setSelectedPlayerB(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 appearance-none pr-7 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="">-- Select --</option>
                    {playersB.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action buttons grid */}
        {!isCompleted && (
          <div className="px-4 pb-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Team A column */}
              <div className="space-y-2">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider text-center py-1 rounded-md"
                  style={{
                    color: teamA.color || "#6366f1",
                    backgroundColor: `${teamA.color || "#6366f1"}15`,
                  }}
                >
                  {teamA.name}
                </p>
                {eventTypes.map((evt) => (
                  <button
                    key={evt.eventType}
                    disabled={saving}
                    onClick={() =>
                      handleScore(
                        teamA.id,
                        evt.eventType,
                        evt.points,
                        selectedPlayerA
                      )
                    }
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-[0.97] disabled:opacity-50 ${
                      COLOR_MAP[evt.color] || COLOR_MAP.green
                    }`}
                  >
                    {evt.label}
                    {evt.points > 0 && (
                      <span className="ml-1 opacity-80">+{evt.points}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Team B column */}
              <div className="space-y-2">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider text-center py-1 rounded-md"
                  style={{
                    color: teamB.color || "#f97316",
                    backgroundColor: `${teamB.color || "#f97316"}15`,
                  }}
                >
                  {teamB.name}
                </p>
                {eventTypes.map((evt) => (
                  <button
                    key={evt.eventType}
                    disabled={saving}
                    onClick={() =>
                      handleScore(
                        teamB.id,
                        evt.eventType,
                        evt.points,
                        selectedPlayerB
                      )
                    }
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-[0.97] disabled:opacity-50 ${
                      COLOR_MAP[evt.color] || COLOR_MAP.green
                    }`}
                  >
                    {evt.label}
                    {evt.points > 0 && (
                      <span className="ml-1 opacity-80">+{evt.points}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Undo + Complete Period row */}
        {!isCompleted && (
          <div className="px-4 pb-3 flex gap-2">
            <button
              onClick={handleUndo}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </button>
            <button
              onClick={handleCompletePeriod}
              disabled={saving}
              className="flex-1 px-3 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              {isSetBased(sportType)
                ? `End ${currentPeriodLabel}`
                : sportType === "BASKETBALL"
                ? `End ${currentPeriodLabel}`
                : `End ${currentPeriodLabel}`}
            </button>
          </div>
        )}

        {/* Recent events feed */}
        <div className="px-4 pb-4">
          <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Recent Events
          </h3>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {state.recentEvents.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-3">
                No events yet
              </p>
            )}
            {state.recentEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      evt.teamId === teamA.id
                        ? teamA.color || "#6366f1"
                        : teamB.color || "#f97316",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                    {evt.teamName}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1">
                    {evt.eventType.replace(/_/g, " ")}
                    {evt.playerName && ` - ${evt.playerName}`}
                    {evt.pointsAwarded > 0 && ` (+${evt.pointsAwarded})`}
                  </span>
                </div>
                {evt.matchMinute != null && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                    {evt.matchMinute}'
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Saving indicator */}
        {saving && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-20 rounded-2xl">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        )}

        {/* Close confirmation */}
        {showCloseConfirm && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-30 rounded-2xl">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 mx-4 max-w-sm shadow-xl">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">
                Close scoring panel?
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Your scoring progress is saved. You can return anytime.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                >
                  Stay
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
