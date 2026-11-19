import { useState, useEffect, useMemo, useCallback } from "react";
import { Gavel, Loader2, TrendingUp, Users, IndianRupee, ChevronRight, History, Eye, EyeOff, Calendar, Radio } from "lucide-react";
import { auctionService } from "../../../services/sports/auctionService";
import type { AuctionConfigResponse, AuctionTeam } from "../../../types/api";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router";

interface AuctionSummary {
  config: AuctionConfigResponse;
  myTeam?: AuctionTeam;
  isOwner: boolean;
  soldToMe: number;
  totalSpent: number;
}

interface WatchedAuction {
  id: number;
  configId: number;
  seasonName: string;
  status: string;
  createdAt: string;
}

type AuctionTab = "active" | "history" | "watching";

export function SportsMyAuctions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState<AuctionSummary[]>([]);
  const [watchList, setWatchList] = useState<WatchedAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AuctionTab>("active");

  useEffect(() => {
    const load = async () => {
      try {
        const configs = await auctionService.getAllCommunityConfigs();
        const userId = Number(user?.userId);
        const summaries: AuctionSummary[] = [];

        for (const config of configs) {
          try {
            const teams = await auctionService.getTeamsSummary(config.id);
            let myTeam: AuctionTeam | undefined;
            let isOwner = false;

            for (const team of teams) {
              if (team.ownerUser?.id === userId) {
                myTeam = team;
                isOwner = true;
                break;
              }
              if (team.players?.some((p: any) => p.userId === userId || p.playerId === userId)) {
                myTeam = team;
                break;
              }
            }

            if (myTeam) {
              summaries.push({
                config,
                myTeam,
                isOwner,
                soldToMe: myTeam.players?.length || 0,
                totalSpent: myTeam.spent || 0,
              });
            }
          } catch { /* skip */ }
        }

        setAuctions(summaries);
      } catch { setAuctions([]); }

      try {
        const watched = await auctionService.getWatchList();
        setWatchList(watched);
      } catch { setWatchList([]); }

      setLoading(false);
    };
    load();
  }, [user]);

  const toggleWatch = useCallback(async (configId: number) => {
    setWatchList((prev) => prev.filter((w) => w.configId !== configId));
    try {
      await auctionService.unwatchAuction(configId);
    } catch {
      const watched = await auctionService.getWatchList().catch(() => []);
      setWatchList(watched);
    }
  }, []);

  const active = useMemo(() =>
    auctions.filter(a => ["LIVE", "ACTIVE", "IN_PROGRESS", "CONFIGURED", "READY", "DRAFT"].includes(a.config.status?.toUpperCase())),
    [auctions]
  );

  const history = useMemo(() =>
    auctions.filter(a => ["COMPLETED", "ENDED", "FINISHED"].includes(a.config.status?.toUpperCase())),
    [auctions]
  );

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>
        <Loader2 size={28} className="animate-spin" style={{ margin: "0 auto 10px" }} />
        <div style={{ fontSize: 13 }}>Loading your auctions...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Gavel size={18} style={{ color: "var(--gold)" }} />
        <span style={{ fontSize: 16, fontWeight: 700 }}>My Auctions</span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
          background: "rgba(212,160,23,0.12)", color: "var(--gold)",
        }}>
          {auctions.length}
        </span>
        {watchList.length > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
            background: "rgba(99,102,241,0.1)", color: "#6366f1", marginLeft: 2,
          }}>
            {watchList.length} watching
          </span>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: 3, background: "rgba(148,163,184,0.06)", borderRadius: 10, marginBottom: 14 }}>
        {([
          { key: "active" as AuctionTab, label: "Active", icon: TrendingUp, count: active.length },
          { key: "history" as AuctionTab, label: "History", icon: History, count: history.length },
          { key: "watching" as AuctionTab, label: "Watching", icon: Eye, count: watchList.length },
        ]).map(tab => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer",
              background: isActive ? "var(--card)" : "transparent",
              boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              color: isActive ? "var(--text)" : "var(--muted)",
              fontWeight: isActive ? 700 : 500, fontSize: 11,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            }}>
              <Icon size={12} /> {tab.label}
              {tab.count > 0 && (
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 6,
                  background: isActive ? "rgba(212,160,23,0.15)" : "rgba(148,163,184,0.1)",
                  color: isActive ? "var(--gold)" : "var(--muted)",
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content — Watching Tab */}
      {activeTab === "watching" && (
        <div>
          {watchList.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
              <Eye size={28} style={{ margin: "0 auto 8px", opacity: 0.2 }} />
              <div style={{ fontSize: 12 }}>No watched auctions</div>
              <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>Watch auctions from the Auction tab to track them here</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {watchList.map((w) => {
                const statusUpper = w.status?.toUpperCase();
                const isLive = ["LIVE", "ACTIVE", "IN_PROGRESS"].includes(statusUpper);
                const isUpcoming = ["UPCOMING", "DRAFT", "CONFIGURED", "READY"].includes(statusUpper);
                const statusColor = isLive ? "#ef4444" : isUpcoming ? "#3b82f6" : "#10b981";
                const StatusIcon = isLive ? Radio : isUpcoming ? Calendar : History;
                return (
                  <div
                    key={w.id}
                    onClick={() => navigate(`/sports/auction?configId=${w.configId}`)}
                    style={{
                      padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                      border: `1px solid ${isLive ? "rgba(239,68,68,0.2)" : "rgba(148,163,184,0.12)"}`,
                      background: isLive ? "rgba(239,68,68,0.02)" : "rgba(148,163,184,0.02)",
                      transition: "transform 0.1s, box-shadow 0.1s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: `${statusColor}12`, border: `1.5px solid ${statusColor}30`,
                      }}>
                        <StatusIcon size={16} style={{ color: statusColor }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
                          {w.seasonName}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
                            background: `${statusColor}15`, color: statusColor, textTransform: "uppercase",
                          }}>
                            {w.status}
                          </span>
                          {isLive && (
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "pulse 1.5s infinite" }} />
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleWatch(w.configId); }}
                          title="Unwatch auction"
                          style={{
                            background: "rgba(99,102,241,0.08)", border: "none", borderRadius: 7,
                            padding: 5, cursor: "pointer", display: "flex", alignItems: "center",
                          }}
                        >
                          <EyeOff size={13} style={{ color: "#6366f1" }} />
                        </button>
                        <ChevronRight size={15} style={{ color: "var(--muted)", opacity: 0.5 }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Content — Active / History Tabs */}
      {activeTab !== "watching" && (() => {
        const items = activeTab === "active" ? active : history;
        if (items.length === 0) {
          return (
            <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
              <Gavel size={28} style={{ margin: "0 auto 8px", opacity: 0.2 }} />
              <div style={{ fontSize: 12 }}>No {activeTab} auctions</div>
            </div>
          );
        }
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map(({ config, myTeam, isOwner, soldToMe, totalSpent }) => (
              <div key={config.id}
                onClick={() => navigate(`/sports/auction/${config.eventId || ""}?tab=live`)}
                style={{
                  padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                  border: `1px solid ${config.status === "LIVE" ? "rgba(239,68,68,0.2)" : "rgba(148,163,184,0.12)"}`,
                  background: config.status === "LIVE" ? "rgba(239,68,68,0.02)" : "rgba(148,163,184,0.02)",
                  transition: "transform 0.1s, box-shadow 0.1s",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {myTeam && (
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, fontSize: 18,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: myTeam.colorHex ? `${myTeam.colorHex}20` : "rgba(148,163,184,0.1)",
                      border: `2px solid ${myTeam.colorHex || "rgba(148,163,184,0.2)"}`,
                    }}>
                      {myTeam.emoji || "🏏"}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
                      {config.seasonName}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>
                      {myTeam ? (myTeam.teamName || myTeam.name) : config.sportName}
                      {isOwner && " (Captain)"}
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 3 }}>
                        <Users size={10} /> {soldToMe} players
                      </span>
                      <span style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 3 }}>
                        <IndianRupee size={10} /> {"₹"}{totalSpent.toLocaleString("en-IN")} spent
                      </span>
                      <span style={{
                        fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 4,
                        background: config.status === "LIVE" ? "rgba(239,68,68,0.1)" : config.status === "COMPLETED" ? "rgba(16,185,129,0.1)" : "rgba(148,163,184,0.08)",
                        color: config.status === "LIVE" ? "#ef4444" : config.status === "COMPLETED" ? "#10b981" : "var(--muted)",
                      }}>
                        {config.status}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: "var(--muted)", opacity: 0.5 }} />
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
