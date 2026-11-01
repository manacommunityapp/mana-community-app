import { useState, useEffect } from "react";
import {
  Users,
  Search,
  MapPin,
  Star,
  Clock,
  Zap,
  Filter,
  MessageCircle,
  ChevronDown,
  Activity,
  Target,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { sportsSocialService } from "../../../services/sports/sportsSocialService";
import type { MatchmakingResult, MatchmakingSkillLevel } from "../../../types/sportsSocial";

const SPORTS = ["CRICKET", "FOOTBALL", "BADMINTON", "TABLE_TENNIS", "VOLLEYBALL", "SWIMMING", "CHESS"];
const SKILL_LEVELS: MatchmakingSkillLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "PRO"];
const TIME_PREFS = ["MORNING", "AFTERNOON", "EVENING", "FLEXIBLE"];

const SKILL_COLORS: Record<MatchmakingSkillLevel, string> = {
  BEGINNER: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
  INTERMEDIATE: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  ADVANCED: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
  PRO: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
};

export function SportsMatchmaking() {
  const [sport, setSport] = useState("CRICKET");
  const [skillLevel, setSkillLevel] = useState<MatchmakingSkillLevel>("INTERMEDIATE");
  const [results, setResults] = useState<MatchmakingResult[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setResults(sportsSocialService.findMatches(sport, skillLevel));
  }, [sport, skillLevel]);

  function handleConnect(playerName: string) {
    toast.success(`Connection request sent to ${playerName}!`);
  }

  return (
    <div className="space-y-4 sm:space-y-5 p-3 sm:p-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">Find Players</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Skill-based matchmaking to find your next game</p>
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">Sport</label>
            <div className="flex gap-1.5 flex-wrap">
              {SPORTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSport(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    sport === s
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">My Skill Level</label>
            <div className="flex gap-1.5 flex-wrap">
              {SKILL_LEVELS.map((sl) => (
                <button
                  key={sl}
                  onClick={() => setSkillLevel(sl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    skillLevel === sl
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {sl.charAt(0) + sl.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="text-xs text-slate-500 dark:text-slate-400">
        Found <span className="font-bold text-slate-700 dark:text-slate-200">{results.length}</span> players for{" "}
        <span className="font-bold text-indigo-600 dark:text-indigo-400">{sport.charAt(0) + sport.slice(1).toLowerCase().replace("_", " ")}</span>
      </div>

      {/* Player Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {results.map(({ player, matchScore, matchReasons, distanceKm }) => {
          const sportData = player.sports.find((s) => s.sport === sport);
          return (
            <div
              key={player.playerId}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:shadow-md transition-shadow"
            >
              {/* Top: Avatar + Name + Match Score */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-base font-bold flex-shrink-0">
                  {player.playerName.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{player.playerName}</div>
                    <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full flex-shrink-0">
                      <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{matchScore}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                      <MapPin className="w-3 h-3" />
                      {distanceKm} km
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                      <Star className="w-3 h-3 text-amber-500" />
                      {player.rating}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                      <Activity className="w-3 h-3" />
                      {player.matchesPlayed} games
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {player.bio && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{player.bio}</p>
              )}

              {/* Sport Skills */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {player.sports.map((s) => (
                  <span key={s.sport} className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${SKILL_COLORS[s.skillLevel]}`}>
                    {s.sport.charAt(0) + s.sport.slice(1).toLowerCase().replace("_", " ")} &middot; {s.skillLevel.toLowerCase()}
                    {s.preferredPosition && ` (${s.preferredPosition})`}
                  </span>
                ))}
              </div>

              {/* Availability */}
              <div className="flex items-center gap-2 mb-3 text-[10px] text-slate-500 dark:text-slate-400">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span>{player.availability.join(", ")}</span>
                <span className="text-slate-300 dark:text-slate-600">&middot;</span>
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span>{player.preferredTime.charAt(0) + player.preferredTime.slice(1).toLowerCase()}</span>
              </div>

              {/* Match Reasons */}
              <div className="flex flex-wrap gap-1 mb-3">
                {matchReasons.map((r) => (
                  <span key={r} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                    {r}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleConnect(player.playerName)}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold hover:shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  Connect
                </button>
                <button
                  onClick={() => toast.success(`Message sent to ${player.playerName}`)}
                  className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {results.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
          <Search className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No players found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your sport or skill level filters</p>
        </div>
      )}
    </div>
  );
}
