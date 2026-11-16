import React, { useEffect, useState } from "react";
import { kittyPartyService } from "../../../services/kittyPartyService";
import type { KittyPartyLeaderboardEntry, KittyPartyCircleLeaderboardResponse } from "../../../types/kittyPartyTypes";
import { Trophy, Medal, Award, Flame, Star, Sparkles, RefreshCw, UserCheck } from "lucide-react";

interface Props {
  circleId: number;
}

export const KittyPartyLeaderboardView: React.FC<Props> = ({ circleId }) => {
  const [data, setData] = useState<KittyPartyCircleLeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await kittyPartyService.getLeaderboard(circleId);
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [circleId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mb-3" />
        <p className="text-sm font-medium">Calculating leaderboard scores & badges...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center text-red-700">
        <p className="font-semibold text-sm">{error}</p>
        <button
          onClick={fetchLeaderboard}
          className="mt-3 px-4 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const entries = data?.entries || [];
  const top1 = entries[0];
  const top2 = entries[1];
  const top3 = entries[2];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wide uppercase mb-2">
              <Trophy className="w-3.5 h-3.5 text-amber-200" />
              <span>Housie & Games Leaderboard</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">{data?.circleName || "Social Circle"} Champions</h2>
            <p className="text-amber-100 text-sm mt-1 max-w-xl">
              Resident ranking based on Tambola games played, winning patterns claimed, and prestigious game badges.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 text-center">
              <span className="block text-2xl font-black">{data?.totalGamesInCircle || 0}</span>
              <span className="text-xs text-amber-200 font-medium">Total Matches</span>
            </div>
            <button
              onClick={fetchLeaderboard}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition-all shadow"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Top 3 Podium (if >= 2 participants) */}
      {entries.length >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-6">
          {/* 2nd Place */}
          {top2 && (
            <div className="order-2 md:order-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center relative hover:shadow-md transition">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center font-bold text-slate-700 text-lg shadow-inner">
                🥈
              </div>
              <h4 className="font-bold text-slate-900 text-base">{top2.userName}</h4>
              {top2.flatDetails && <p className="text-xs text-slate-500 font-medium">{top2.flatDetails}</p>}
              <div className="mt-3 inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-black text-slate-700">
                {top2.totalPoints} PTS
              </div>
              <div className="mt-2 text-xs text-slate-500">
                <span>{top2.totalWins} Wins</span> • <span>{top2.totalGamesPlayed} Games</span>
              </div>
            </div>
          )}

          {/* 1st Place Champion */}
          {top1 && (
            <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50 to-white border-2 border-amber-400 rounded-2xl p-6 shadow-md text-center relative scale-105 hover:shadow-lg transition">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-black px-4 py-1 rounded-full shadow flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> #1 CHAMPION
              </div>
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center font-bold text-amber-700 text-2xl shadow-inner mt-2">
                👑
              </div>
              <h4 className="font-black text-slate-900 text-lg">{top1.userName}</h4>
              {top1.flatDetails && <p className="text-xs text-amber-700 font-semibold">{top1.flatDetails}</p>}
              <div className="mt-3 inline-block px-4 py-1 bg-amber-500 text-white rounded-full text-sm font-black shadow-sm">
                {top1.totalPoints} PTS
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-600">
                <span>{top1.totalWins} Wins</span> • <span>{top1.totalGamesPlayed} Games</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3 && (
            <div className="order-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center relative hover:shadow-md transition">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-100 border-2 border-orange-300 flex items-center justify-center font-bold text-orange-700 text-lg shadow-inner">
                🥉
              </div>
              <h4 className="font-bold text-slate-900 text-base">{top3.userName}</h4>
              {top3.flatDetails && <p className="text-xs text-slate-500 font-medium">{top3.flatDetails}</p>}
              <div className="mt-3 inline-block px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-black">
                {top3.totalPoints} PTS
              </div>
              <div className="mt-2 text-xs text-slate-500">
                <span>{top3.totalWins} Wins</span> • <span>{top3.totalGamesPlayed} Games</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Complete Rankings Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <span>Circle Rankings & Badges</span>
          </h3>
          <span className="text-xs font-semibold text-slate-500">{entries.length} Participants</span>
        </div>

        {entries.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
            <p className="font-semibold text-slate-700 text-base">No game records yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Start a Housie game room in this circle to rank up and earn community badges!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 text-center w-16">Rank</th>
                  <th className="py-3 px-4">Resident</th>
                  <th className="py-3 px-4 text-center">Matches</th>
                  <th className="py-3 px-4 text-center">Claims Won</th>
                  <th className="py-3 px-4">Trophies & Badges</th>
                  <th className="py-3 px-4 text-right">Total Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => (
                  <tr key={entry.userId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold">
                      {entry.rank === 1 && <span className="text-xl">🥇</span>}
                      {entry.rank === 2 && <span className="text-xl">🥈</span>}
                      {entry.rank === 3 && <span className="text-xl">🥉</span>}
                      {entry.rank > 3 && <span className="text-slate-600">#{entry.rank}</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{entry.userName}</div>
                      {entry.flatDetails && (
                        <div className="text-xs text-slate-500 font-medium">{entry.flatDetails}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600 font-medium">
                      {entry.totalGamesPlayed}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                        {entry.totalWins}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {entry.badges && entry.badges.length > 0 ? (
                          entry.badges.map((badge, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold tracking-tight shadow-2xs"
                            >
                              {badge}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No badges yet</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-indigo-700 text-base">
                      {entry.totalPoints} <span className="text-xs text-slate-400 font-medium">pts</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
