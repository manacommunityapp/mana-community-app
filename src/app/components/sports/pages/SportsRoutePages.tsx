import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Loader2, ArrowLeft, Trophy, Activity, Award } from "lucide-react";
import { LiveMatchView } from "../LiveMatchView";
import { LiveScoringPanel } from "../LiveScoringPanel";
import { MatchDetailView } from "../MatchDetailView";
import { GenericLiveMatchView } from "../GenericLiveMatchView";
import { GenericLiveScoringPanel } from "../GenericLiveScoringPanel";
import { GenericMatchDetailView } from "../GenericMatchDetailView";
import { Leaderboard } from "../Leaderboard";
import { GenericLeaderboard } from "../GenericLeaderboard";
import { RaceResultsView } from "../RaceResultsView";
import { RaceScoringPanel } from "../RaceScoringPanel";
import { tournamentService, type GenericMatchState } from "../../../../services/sports/tournamentService";

/**
 * 1. Match Detail Page (Scorecard / Match Overview)
 */
export function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const id = Number(matchId);

  const [loading, setLoading] = useState(true);
  const [isGeneric, setIsGeneric] = useState(false);

  useEffect(() => {
    if (!id) return;
    tournamentService
      .getGenericMatchState(id)
      .then((state) => {
        if (state && state.sportType && state.sportType !== "CRICKET") {
          setIsGeneric(true);
        }
      })
      .catch(() => {
        // Default to Cricket / standard match view
        setIsGeneric(false);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>Invalid Match ID</p>
        <button onClick={() => navigate("/sports/schedule")} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
          Back to Schedule
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return isGeneric ? (
    <GenericMatchDetailView matchId={id} onClose={() => navigate("/sports/schedule")} />
  ) : (
    <MatchDetailView matchId={id} onClose={() => navigate("/sports/schedule")} />
  );
}

/**
 * 2. Cricket Live Match Center Page
 */
export function MatchLivePage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const id = Number(matchId);

  if (!id) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>Invalid Match ID</p>
        <button onClick={() => navigate("/sports/schedule")} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
          Back to Schedule
        </button>
      </div>
    );
  }

  return <LiveMatchView matchId={id} onClose={() => navigate("/sports/schedule")} />;
}

/**
 * 3. Cricket Live Umpire Scoring Page
 */
export function MatchScorePage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const id = Number(matchId);

  if (!id) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>Invalid Match ID</p>
        <button onClick={() => navigate("/sports/schedule")} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
          Back to Schedule
        </button>
      </div>
    );
  }

  return <LiveScoringPanel matchId={id} onClose={() => navigate("/sports/schedule")} />;
}

/**
 * 4. Generic Live Match Center Page (Badminton, TT, Football, Basketball, etc.)
 */
export function GenericMatchLivePage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const id = Number(matchId);

  if (!id) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>Invalid Match ID</p>
        <button onClick={() => navigate("/sports/schedule")} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
          Back to Schedule
        </button>
      </div>
    );
  }

  return <GenericLiveMatchView matchId={id} onClose={() => navigate("/sports/schedule")} />;
}

/**
 * 5. Generic Live Scoring Panel Page
 */
export function GenericMatchScorePage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const id = Number(matchId);

  const [state, setState] = useState<GenericMatchState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    tournamentService
      .getGenericMatchState(id)
      .then(setState)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>Invalid Match ID</p>
        <button onClick={() => navigate("/sports/schedule")} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
          Back to Schedule
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <GenericLiveScoringPanel
      matchId={id}
      sportType={state?.sportType || "BADMINTON"}
      teamA={{
        id: state?.teamAId || 1,
        name: state?.teamAName || "Team A",
        color: state?.teamAColor || "#3B82F6",
      }}
      teamB={{
        id: state?.teamBId || 2,
        name: state?.teamBName || "Team B",
        color: state?.teamBColor || "#EF4444",
      }}
      onClose={() => navigate("/sports/schedule")}
    />
  );
}

/**
 * 6. Leaderboard & Tournament Standings Page
 */
export function LeaderboardPage() {
  const [sportMode, setSportMode] = useState<"cricket" | "generic">("cricket");

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Sport Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Tournament Leaderboards
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Player statistics, top scorers, MVP rankings, and tournament performance
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setSportMode("cricket")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              sportMode === "cricket"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🏏 Cricket Stats
          </button>
          <button
            onClick={() => setSportMode("generic")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              sportMode === "generic"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🏅 Multi-Sport Rankings
          </button>
        </div>
      </div>

      {/* Active Leaderboard Component */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-4 sm:p-6">
        {sportMode === "cricket" ? <Leaderboard /> : <GenericLeaderboard />}
      </div>
    </div>
  );
}

/**
 * 7. Race Results Page (Athletics / Swimming / Racing)
 */
export function RaceResultsPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const id = Number(matchId);

  if (!id) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>Invalid Match ID</p>
        <button onClick={() => navigate("/sports/schedule")} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
          Back to Schedule
        </button>
      </div>
    );
  }

  return <RaceResultsView matchId={id} onClose={() => navigate("/sports/schedule")} />;
}

/**
 * 8. Race Umpire / Timing Scoring Page
 */
export function RaceScorePage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const id = Number(matchId);

  if (!id) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>Invalid Match ID</p>
        <button onClick={() => navigate("/sports/schedule")} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
          Back to Schedule
        </button>
      </div>
    );
  }

  return <RaceScoringPanel matchId={id} sportType="ATHLETICS" onClose={() => navigate("/sports/schedule")} />;
}
