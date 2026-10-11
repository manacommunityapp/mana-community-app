import { useState, useEffect } from "react";
import { Trophy, Loader2, Medal, TrendingUp } from "lucide-react";
import { tournamentService } from "../../../services/sports/tournamentService";

interface SportsTournamentStandingsProps {
  configId: number;
  sportType?: string;
  inline?: boolean;
}

interface StandingsEntry {
  rank: number;
  playerId: number;
  playerName: string;
  flatNo?: string;
  teamName?: string;
  value: number;
  displayValue?: string;
}

type StandingsCategory = "runs" | "wickets" | "matches" | "wins";

export function SportsTournamentStandings({ configId, sportType, inline = false }: SportsTournamentStandingsProps) {
  const [data, setData] = useState<StandingsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<StandingsCategory>("runs");
  const isCricket = sportType?.toLowerCase()?.includes("cricket") ?? true;

  const categories: { key: StandingsCategory; label: string }[] = isCricket
    ? [
        { key: "runs", label: "Top Run Scorers" },
        { key: "wickets", label: "Top Wicket Takers" },
        { key: "matches", label: "Most Matches" },
      ]
    : [
        { key: "wins", label: "Most Wins" },
        { key: "matches", label: "Most Matches" },
      ];

  useEffect(() => {
    setLoading(true);
    tournamentService.getLeaderboard(configId, category)
      .then(entries => {
        setData(entries.map((e: any, i: number) => ({
          rank: i + 1,
          playerId: e.playerId,
          playerName: e.playerName || e.name,
          flatNo: e.flatNo,
          teamName: e.teamName,
          value: e.totalRuns ?? e.totalWickets ?? e.matchesPlayed ?? e.wins ?? 0,
          displayValue: e.displayValue,
        })));
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [configId, category]);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", icon: "🥇" };
    if (rank === 2) return { bg: "rgba(148,163,184,0.12)", color: "#94a3b8", icon: "🥈" };
    if (rank === 3) return { bg: "rgba(205,127,50,0.12)", color: "#cd7f32", icon: "🥉" };
    return { bg: "transparent", color: "var(--muted)", icon: "" };
  };

  return (
    <div style={{ padding: inline ? 0 : 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <TrendingUp size={16} style={{ color: "var(--gold)" }} />
        <span style={{ fontSize: 14, fontWeight: 700 }}>Standings & Leaderboard</span>
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
        {categories.map(cat => (
          <button key={cat.key} onClick={() => setCategory(cat.key)} style={{
            fontSize: 10, fontWeight: 600, padding: "5px 10px", borderRadius: 6,
            border: `1px solid ${category === cat.key ? "var(--gold)" : "rgba(148,163,184,0.15)"}`,
            background: category === cat.key ? "rgba(212,160,23,0.1)" : "transparent",
            color: category === cat.key ? "var(--gold)" : "var(--muted)", cursor: "pointer",
          }}>
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 30, color: "var(--muted)" }}>
          <Loader2 size={20} className="animate-spin" style={{ margin: "0 auto 6px" }} />
          <div style={{ fontSize: 11 }}>Loading standings...</div>
        </div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: "center", padding: 30, color: "var(--muted)" }}>
          <Medal size={24} style={{ margin: "0 auto 6px", opacity: 0.2 }} />
          <div style={{ fontSize: 11 }}>No standings data available</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {data.slice(0, 15).map(entry => {
            const rs = getRankStyle(entry.rank);
            return (
              <div key={entry.playerId} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                borderRadius: 8, background: rs.bg,
                border: entry.rank <= 3 ? `1px solid ${rs.color}30` : "1px solid transparent",
              }}>
                <div style={{
                  width: 24, fontSize: rs.icon ? 14 : 11, fontWeight: 700, textAlign: "center",
                  color: rs.color,
                }}>
                  {rs.icon || `#${entry.rank}`}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                    {entry.playerName}
                  </div>
                  {(entry.flatNo || entry.teamName) && (
                    <div style={{ fontSize: 9, color: "var(--muted)" }}>
                      {[entry.flatNo, entry.teamName].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                  {entry.displayValue || entry.value}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
