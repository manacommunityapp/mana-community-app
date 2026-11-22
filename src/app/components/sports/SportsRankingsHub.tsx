import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Trophy,
  Medal,
  Crown,
  Search,
  ArrowLeft,
  Sparkles,
  Swords,
  TrendingUp,
  User,
  Shield,
  Filter,
  Flame,
  Award,
} from "lucide-react";
import {
  sportsRankingService,
  type SportsPlayerRanking,
} from "../../../services/sports/sportsRankingService";

interface SportOption {
  id: number;
  name: string;
  emoji: string;
}

const SPORTS: SportOption[] = [
  { id: 1, name: "Badminton", emoji: "🏸" },
  { id: 2, name: "Table Tennis", emoji: "🏓" },
  { id: 3, name: "Lawn Tennis", emoji: "🎾" },
  { id: 4, name: "Squash", emoji: "🏸" },
  { id: 5, name: "Chess", emoji: "♟️" },
  { id: 6, name: "Cricket", emoji: "🏏" },
];

const SAMPLE_RANKINGS: Record<number, SportsPlayerRanking[]> = {
  1: [
    {
      id: 1,
      player: { id: 101, fullName: "Aditya Nair", flatNo: "Tower A-402" },
      sport: { id: 1, name: "Badminton", icon: "🏸" },
      communityId: 1,
      rank: 1,
      rating: 1845,
      source: "COMPUTED",
      season: "CURRENT",
      notes: "Wins: 24 | Losses: 3 | Streak: WWWWW",
    },
    {
      id: 2,
      player: { id: 102, fullName: "Vikram Malhotra", flatNo: "Tower C-1102" },
      sport: { id: 1, name: "Badminton", icon: "🏸" },
      communityId: 1,
      rank: 2,
      rating: 1790,
      source: "COMPUTED",
      season: "CURRENT",
      notes: "Wins: 21 | Losses: 5 | Streak: LWWWW",
    },
    {
      id: 3,
      player: { id: 103, fullName: "Priya Sundaram", flatNo: "Tower B-701" },
      sport: { id: 1, name: "Badminton", icon: "🏸" },
      communityId: 1,
      rank: 3,
      rating: 1720,
      source: "COMPUTED",
      season: "CURRENT",
      notes: "Wins: 18 | Losses: 4 | Streak: WWWLW",
    },
    {
      id: 4,
      player: { id: 104, fullName: "Karthik Rangan", flatNo: "Tower D-504" },
      sport: { id: 1, name: "Badminton", icon: "🏸" },
      communityId: 1,
      rank: 4,
      rating: 1680,
      source: "COMPUTED",
      season: "CURRENT",
      notes: "Wins: 15 | Losses: 6 | Streak: WWLWW",
    },
    {
      id: 5,
      player: { id: 105, fullName: "Siddharth Verma", flatNo: "Tower A-903" },
      sport: { id: 1, name: "Badminton", icon: "🏸" },
      communityId: 1,
      rank: 5,
      rating: 1610,
      source: "COMPUTED",
      season: "CURRENT",
      notes: "Wins: 14 | Losses: 8 | Streak: LWWLW",
    },
    {
      id: 6,
      player: { id: 106, fullName: "Ananya Deshmukh", flatNo: "Tower B-204" },
      sport: { id: 1, name: "Badminton", icon: "🏸" },
      communityId: 1,
      rank: 6,
      rating: 1575,
      source: "COMPUTED",
      season: "CURRENT",
      notes: "Wins: 12 | Losses: 7 | Streak: WLWWL",
    },
  ],
  2: [
    {
      id: 201,
      player: { id: 201, fullName: "Rohan Kulkarni", flatNo: "Tower B-801" },
      sport: { id: 2, name: "Table Tennis", icon: "🏓" },
      communityId: 1,
      rank: 1,
      rating: 1890,
      source: "COMPUTED",
      season: "CURRENT",
      notes: "Wins: 30 | Losses: 2 | Streak: WWWWW",
    },
    {
      id: 202,
      player: { id: 202, fullName: "Sneha Nair", flatNo: "Tower A-302" },
      sport: { id: 2, name: "Table Tennis", icon: "🏓" },
      communityId: 1,
      rank: 2,
      rating: 1810,
      source: "COMPUTED",
      season: "CURRENT",
      notes: "Wins: 25 | Losses: 4 | Streak: WWLWW",
    },
    {
      id: 203,
      player: { id: 203, fullName: "Manish Gupta", flatNo: "Tower D-1002" },
      sport: { id: 2, name: "Table Tennis", icon: "🏓" },
      communityId: 1,
      rank: 3,
      rating: 1740,
      source: "COMPUTED",
      season: "CURRENT",
      notes: "Wins: 20 | Losses: 6 | Streak: LWWWW",
    },
  ],
};

export function SportsRankingsHub() {
  const navigate = useNavigate();
  const [selectedSportId, setSelectedSportId] = useState<number>(1);
  const [season, setSeason] = useState<string>("CURRENT");
  const [rankings, setRankings] = useState<SportsPlayerRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadRankings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sportsRankingService.list(selectedSportId, 1, season);
      if (Array.isArray(data) && data.length > 0) {
        setRankings(data);
      } else {
        setRankings(SAMPLE_RANKINGS[selectedSportId] || SAMPLE_RANKINGS[1]);
      }
    } catch {
      setRankings(SAMPLE_RANKINGS[selectedSportId] || SAMPLE_RANKINGS[1]);
    } finally {
      setLoading(false);
    }
  }, [selectedSportId, season]);

  useEffect(() => {
    loadRankings();
  }, [loadRankings]);

  const activeSport = SPORTS.find((s) => s.id === selectedSportId) || SPORTS[0];

  const filteredRankings = rankings.filter((r) =>
    r.player.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.player.flatNo && r.player.flatNo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const top3 = filteredRankings.slice(0, 3);
  const remainingLadder = filteredRankings.slice(3);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/sports")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Sports Arena
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/sports/challenge")}
            className="text-xs font-bold px-3 py-1.5 bg-violet-50 text-violet-800 rounded-xl border border-violet-200 hover:bg-violet-100 transition cursor-pointer flex items-center gap-1.5"
          >
            <Swords className="w-3.5 h-3.5 text-violet-600" />
            Post Match Challenge
          </button>
          <span className="text-xs font-semibold px-3 py-1.5 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            Official Elo Ladder
          </span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-4 -bottom-6 text-amber-100/10 pointer-events-none select-none">
          <Trophy className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-amber-100">
            <Sparkles className="w-3.5 h-3.5" />
            Community Sports Elo Ratings
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Society Player Rankings & Ladder
          </h1>
          <p className="text-amber-100/90 text-sm leading-relaxed">
            Ratings are updated automatically from tournament fixtures and accepted challenge matches.
            Climb the ladder by winning sanctioned matches against higher-seeded neighbors.
          </p>
        </div>
      </div>

      {/* Sport Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SPORTS.map((sport) => (
          <button
            key={sport.id}
            onClick={() => setSelectedSportId(sport.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              selectedSportId === sport.id
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80"
            }`}
          >
            <span>{sport.emoji}</span>
            <span>{sport.name}</span>
          </button>
        ))}
      </div>

      {/* Podium for Top 3 */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Rank 2 (Silver) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col items-center text-center space-y-3 order-2 md:order-1 relative overflow-hidden">
            <div className="absolute top-3 left-3 text-slate-300">
              <Medal className="w-6 h-6 text-slate-400" />
            </div>
            <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-slate-600 font-extrabold text-xl shadow-inner">
              2
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Silver Seed
              </span>
              <h3 className="text-base font-bold text-slate-900">{top3[1].player.fullName}</h3>
              <span className="text-xs text-slate-500">{top3[1].player.flatNo}</span>
            </div>
            <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-700">
              {top3[1].rating} ELO PTS
            </div>
          </div>

          {/* Rank 1 (Gold) */}
          <div className="bg-gradient-to-b from-amber-50 to-white rounded-3xl p-6 border-2 border-amber-300 shadow-md flex flex-col items-center text-center space-y-3 order-1 md:order-2 relative overflow-hidden transform md:-translate-y-2">
            <div className="absolute top-3 right-3 text-amber-500">
              <Crown className="w-7 h-7 text-amber-500 animate-bounce" />
            </div>
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 border-4 border-amber-200 flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
              1
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-block mb-1">
                🏆 Champion
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">{top3[0].player.fullName}</h3>
              <span className="text-xs text-slate-600 font-medium">{top3[0].player.flatNo}</span>
            </div>
            <div className="bg-amber-100 px-4 py-1.5 rounded-xl border border-amber-200 text-sm font-extrabold text-amber-900">
              {top3[0].rating} ELO PTS
            </div>
          </div>

          {/* Rank 3 (Bronze) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col items-center text-center space-y-3 order-3 md:order-3 relative overflow-hidden">
            <div className="absolute top-3 right-3 text-amber-700/60">
              <Medal className="w-6 h-6 text-amber-700/60" />
            </div>
            <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-700/40 flex items-center justify-center text-amber-800 font-extrabold text-xl shadow-inner">
              3
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                Bronze Seed
              </span>
              <h3 className="text-base font-bold text-slate-900">{top3[2].player.fullName}</h3>
              <span className="text-xs text-slate-500">{top3[2].player.flatNo}</span>
            </div>
            <div className="bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-xs font-extrabold text-amber-900">
              {top3[2].rating} ELO PTS
            </div>
          </div>
        </div>
      )}

      {/* Search and Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={`Search ${activeSport.name} players...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Season:</span>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="CURRENT">Current Season 2026</option>
              <option value="ALL_TIME">All-Time Hall of Fame</option>
            </select>
          </div>
        </div>

        {/* Complete Ladder Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Status & Notes</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRankings.map((row, index) => {
                const rankNum = row.rank || index + 1;
                return (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-extrabold text-[11px] ${
                          rankNum === 1
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : rankNum === 2
                            ? "bg-slate-100 text-slate-800 border border-slate-300"
                            : rankNum === 3
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "text-slate-500 font-semibold"
                        }`}
                      >
                        {rankNum}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                          {row.player.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{row.player.fullName}</div>
                          <div className="text-[11px] text-slate-400">{row.player.flatNo || "Resident"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-800 text-sm">
                      {row.rating || 1500}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {row.notes || "Sanctioned League Matches"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate("/sports/challenge")}
                        className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 font-bold text-[11px] border border-violet-200 transition cursor-pointer"
                      >
                        Challenge
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SportsRankingsHub;
