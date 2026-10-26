import { useState, useEffect } from "react";
import { Users, Loader2, Trophy, Shield, Crown, ChevronRight, LogOut, Trash2 } from "lucide-react";
import { auctionService } from "../../../services/sports/auctionService";
import type { AuctionConfigResponse, AuctionTeam } from "../../../types/api";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router";
import { toast } from "sonner";

interface TeamWithConfig {
  team: AuctionTeam;
  config: AuctionConfigResponse;
  isOwner: boolean;
}

export function SportsMyTeams() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamWithConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const configs = await auctionService.getAllCommunityConfigs();
        const userId = Number(user?.userId);
        const allTeams: TeamWithConfig[] = [];

        for (const config of configs) {
          try {
            const teamsSummary = await auctionService.getTeamsSummary(config.id);
            for (const team of teamsSummary) {
              const isOwner = team.ownerUser?.id === userId;
              const isPlayer = team.players?.some((p: any) => p.userId === userId || p.playerId === userId);
              if (isOwner || isPlayer) {
                allTeams.push({ team, config, isOwner });
              }
            }
          } catch { /* skip configs with no teams */ }
        }

        setTeams(allTeams);
      } catch { setTeams([]); }
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>
        <Loader2 size={28} className="animate-spin" style={{ margin: "0 auto 10px" }} />
        <div style={{ fontSize: 13 }}>Loading your teams...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Shield size={18} style={{ color: "var(--gold)" }} />
        <span style={{ fontSize: 16, fontWeight: 700 }}>My Teams</span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
          background: "rgba(212,160,23,0.12)", color: "var(--gold)",
        }}>
          {teams.length}
        </span>
      </div>

      {teams.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>
          <Shield size={32} style={{ margin: "0 auto 10px", opacity: 0.2 }} />
          <div style={{ fontSize: 13, fontWeight: 600 }}>No teams yet</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>You'll see your auction teams here once assigned</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {teams.map(({ team, config, isOwner }) => (
            <div key={`${config.id}-${team.id}`}
              onClick={() => navigate(`/sports/auction/${config.eventId || ""}?tab=teams`)}
              style={{
                padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                border: `1px solid ${isOwner ? "rgba(212,160,23,0.2)" : "rgba(148,163,184,0.12)"}`,
                background: isOwner ? "rgba(212,160,23,0.03)" : "rgba(148,163,184,0.02)",
                transition: "transform 0.1s, box-shadow 0.1s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Team color badge */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, fontSize: 18,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: team.colorHex ? `${team.colorHex}20` : "rgba(148,163,184,0.1)",
                  border: `2px solid ${team.colorHex || "rgba(148,163,184,0.2)"}`,
                }}>
                  {team.emoji || "🏏"}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                      {team.teamName || team.name}
                    </span>
                    {isOwner && (
                      <span style={{
                        fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 4,
                        background: "rgba(245,158,11,0.12)", color: "#f59e0b",
                        display: "flex", alignItems: "center", gap: 2,
                      }}>
                        <Crown size={8} /> Captain
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
                    {config.seasonName} &middot; {config.sportName}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 3 }}>
                      <Users size={10} /> {team.players?.length || 0} players
                    </span>
                    {team.remainingBudget != null && (
                      <span style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 3 }}>
                        <Trophy size={10} /> {"₹"}{team.remainingBudget?.toLocaleString("en-IN")} remaining
                      </span>
                    )}
                    <span style={{
                      fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 4,
                      background: config.status === "LIVE" ? "rgba(239,68,68,0.1)" : "rgba(148,163,184,0.08)",
                      color: config.status === "LIVE" ? "#ef4444" : "var(--muted)",
                    }}>
                      {config.status}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: "var(--muted)", opacity: 0.5 }} />
              </div>

              {/* Leave / Dissolve Actions */}
              <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
                {!isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!confirm(`Leave team "${team.teamName || team.name}"?`)) return;
                      auctionService.leaveTeam(team.id).then(() => {
                        toast.success("Left team successfully");
                        setTeams(prev => prev.filter(t => !(t.team.id === team.id && t.config.id === config.id)));
                      }).catch(() => toast.error("Failed to leave team"));
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
                      borderRadius: 6, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)",
                      color: "#ef4444", fontSize: 11, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    <LogOut size={12} /> Leave
                  </button>
                )}
                {isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!confirm(`Dissolve team "${team.teamName || team.name}"? All players will be unassigned.`)) return;
                      auctionService.dissolveTeam(team.id).then(() => {
                        toast.success("Team dissolved");
                        setTeams(prev => prev.filter(t => !(t.team.id === team.id && t.config.id === config.id)));
                      }).catch(() => toast.error("Failed to dissolve team"));
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
                      borderRadius: 6, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)",
                      color: "#dc2626", fontSize: 11, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    <Trash2 size={12} /> Dissolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
