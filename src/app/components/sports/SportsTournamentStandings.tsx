import { useState, useEffect } from "react";
import { Trophy, Loader2, Medal, TrendingUp, Users } from "lucide-react";
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

interface StandingItem {
  position: number;
  teamId: number;
  teamName: string;
  teamColor?: string;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  points: number;
  netRunRate: number;
  qualified: boolean;
}

interface GroupInfo {
  groupId: number;
  groupName: string;
  standings: StandingItem[];
}

type StandingsCategory = "points_table" | "runs" | "wickets" | "matches" | "wins";

function formatNRR(nrr: number | undefined | null): string {
  if (nrr == null || isNaN(nrr)) return "0.000";
  const sign = nrr > 0 ? "+" : "";
  return `${sign}${nrr.toFixed(3)}`;
}

export function SportsTournamentStandings({ configId, sportType, inline = false }: SportsTournamentStandingsProps) {
  const [data, setData] = useState<StandingsEntry[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<StandingsCategory>("points_table");
  const isCricket = sportType?.toLowerCase()?.includes("cricket") ?? true;

  // 1. Fetch group schedule & standings
  useEffect(() => {
    let active = true;
    tournamentService.getSchedule(configId)
      .then(schedule => {
        if (!active) return;
        const grps: GroupInfo[] = (schedule?.groups || []).map((g: any) => ({
          groupId: g.groupId || g.id,
          groupName: g.groupName || g.name || "Group",
          standings: Array.isArray(g.standings) ? g.standings : [],
        }));
        setGroups(grps);
        // If no groups with standings exist, default to player stats
        const hasStandings = grps.some(g => g.standings.length > 0);
        if (!hasStandings) {
          setCategory(isCricket ? "runs" : "wins");
        }
      })
      .catch(() => {
        if (active) setGroups([]);
      });
    return () => { active = false; };
  }, [configId, isCricket]);

  // 2. Fetch individual leaderboard when not in points_table view
  useEffect(() => {
    if (category === "points_table") {
      setLoading(false);
      return;
    }
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

  const baseCategories: { key: StandingsCategory; label: string }[] = isCricket
    ? [
        { key: "runs", label: "Top Run Scorers" },
        { key: "wickets", label: "Top Wicket Takers" },
        { key: "matches", label: "Most Matches" },
      ]
    : [
        { key: "wins", label: "Most Wins" },
        { key: "matches", label: "Most Matches" },
      ];

  const categories = [
    { key: "points_table" as StandingsCategory, label: "Points Table" },
    ...baseCategories,
  ];

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", icon: "🥇" };
    if (rank === 2) return { bg: "rgba(148,163,184,0.12)", color: "#94a3b8", icon: "🥈" };
    if (rank === 3) return { bg: "rgba(205,127,50,0.12)", color: "#cd7f32", icon: "🥉" };
    return { bg: "transparent", color: "var(--muted)", icon: "" };
  };

  const totalTeamsInStandings = groups.reduce((acc, g) => acc + g.standings.length, 0);

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

      {/* Points Table View */}
      {category === "points_table" ? (
        totalTeamsInStandings === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>
            <Trophy size={24} style={{ margin: "0 auto 6px", opacity: 0.25 }} />
            <div style={{ fontSize: 11, fontWeight: 600 }}>No group points table recorded yet</div>
            <div style={{ fontSize: 10, marginTop: 2 }}>Standings automatically update as match scores are entered.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {groups.map(group => (
              <div key={group.groupId} style={{
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid rgba(148,163,184,0.18)",
                background: "rgba(255,255,255,0.02)"
              }}>
                {groups.length > 1 && (
                  <div style={{
                    padding: "6px 12px",
                    background: "rgba(148,163,184,0.08)",
                    fontWeight: 700,
                    fontSize: 11,
                    color: "var(--text)",
                    borderBottom: "1px solid rgba(148,163,184,0.12)"
                  }}>
                    {group.groupName}
                  </div>
                )}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr style={{
                        background: "rgba(148,163,184,0.05)",
                        borderBottom: "1px solid rgba(148,163,184,0.12)",
                        color: "var(--muted)",
                        textAlign: "center"
                      }}>
                        <th style={{ padding: "6px 8px", width: 32 }}>#</th>
                        <th style={{ padding: "6px 8px", textAlign: "left" }}>Team / Competitor</th>
                        <th style={{ padding: "6px 6px", width: 28 }} title="Played">P</th>
                        <th style={{ padding: "6px 6px", width: 28 }} title="Won">W</th>
                        <th style={{ padding: "6px 6px", width: 28 }} title="Lost">L</th>
                        <th style={{ padding: "6px 6px", width: 28 }} title="Drawn/Tied">D</th>
                        <th style={{ padding: "6px 6px", width: 34, fontWeight: 700 }} title="Points">Pts</th>
                        <th style={{ padding: "6px 8px", width: 56 }} title="Net Run Rate">NRR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.standings.map((s, idx) => (
                        <tr key={s.teamId || idx} style={{
                          borderBottom: idx < group.standings.length - 1 ? "1px solid rgba(148,163,184,0.08)" : "none",
                          textAlign: "center"
                        }}>
                          <td style={{
                            padding: "6px 8px",
                            fontWeight: 700,
                            color: s.position <= 2 ? "var(--gold)" : "var(--muted)"
                          }}>
                            {s.position}
                          </td>
                          <td style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "var(--text)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {s.teamColor && (
                                <span style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  backgroundColor: s.teamColor,
                                  display: "inline-block"
                                }} />
                              )}
                              <span>{s.teamName}</span>
                              {s.qualified && (
                                <span style={{
                                  fontSize: 9,
                                  padding: "1px 5px",
                                  borderRadius: 4,
                                  background: "rgba(34,197,94,0.15)",
                                  color: "#16a34a",
                                  fontWeight: 700
                                }}>
                                  Q
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: "6px 6px" }}>{s.played}</td>
                          <td style={{ padding: "6px 6px", color: "#16a34a", fontWeight: 600 }}>{s.won}</td>
                          <td style={{ padding: "6px 6px", color: "#ef4444" }}>{s.lost}</td>
                          <td style={{ padding: "6px 6px", color: "var(--muted)" }}>{s.drawn}</td>
                          <td style={{ padding: "6px 6px", fontWeight: 700, color: "var(--text)" }}>{s.points}</td>
                          <td style={{
                            padding: "6px 8px",
                            color: (s.netRunRate || 0) >= 0 ? "#16a34a" : "#ef4444",
                            fontSize: 10,
                            fontWeight: 600
                          }}>
                            {formatNRR(s.netRunRate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )
      ) : loading ? (
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
