import { useState, useEffect, useMemo, useCallback } from "react";
import { Gavel, Loader2, Clock, CheckCircle, Radio, Calendar, Users, IndianRupee, ChevronRight, Eye, EyeOff } from "lucide-react";
import { auctionService } from "../../../services/sports/auctionService";
import type { AuctionConfigResponse } from "../../../types/api";

interface SportsAuctionDiscoveryProps {
  onSelectAuction?: (configId: number) => void;
}

type TabKey = "live" | "upcoming" | "ended";

const TAB_CONFIG: { key: TabKey; label: string; icon: typeof Radio; color: string; statuses: string[] }[] = [
  { key: "live", label: "Live", icon: Radio, color: "#ef4444", statuses: ["LIVE", "IN_PROGRESS", "ACTIVE"] },
  { key: "upcoming", label: "Upcoming", icon: Calendar, color: "#3b82f6", statuses: ["UPCOMING", "DRAFT", "CONFIGURED", "READY"] },
  { key: "ended", label: "Ended", icon: CheckCircle, color: "#10b981", statuses: ["COMPLETED", "ENDED", "FINISHED"] },
];

export function SportsAuctionDiscovery({ onSelectAuction }: SportsAuctionDiscoveryProps) {
  const [configs, setConfigs] = useState<AuctionConfigResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("live");
  const [watchMap, setWatchMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    auctionService.getAllCommunityConfigs()
      .then(async (cfgs) => {
        setConfigs(cfgs);
        try {
          const watched = await auctionService.getWatchList();
          const map: Record<number, boolean> = {};
          for (const w of watched) map[w.configId] = true;
          setWatchMap(map);
        } catch { /* silent */ }
      })
      .catch(() => setConfigs([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleWatch = useCallback(async (configId: number) => {
    const watching = watchMap[configId];
    setWatchMap((m) => ({ ...m, [configId]: !watching }));
    try {
      if (watching) await auctionService.unwatchAuction(configId);
      else await auctionService.watchAuction(configId);
    } catch {
      setWatchMap((m) => ({ ...m, [configId]: watching }));
    }
  }, [watchMap]);

  const grouped = useMemo(() => {
    const result: Record<TabKey, AuctionConfigResponse[]> = { live: [], upcoming: [], ended: [] };
    for (const c of configs) {
      const status = (c.status || "").toUpperCase();
      const tab = TAB_CONFIG.find(t => t.statuses.includes(status));
      if (tab) result[tab.key].push(c);
      else result.upcoming.push(c);
    }
    return result;
  }, [configs]);

  // Auto-select tab with content
  useEffect(() => {
    if (!loading) {
      if (grouped.live.length > 0) setActiveTab("live");
      else if (grouped.upcoming.length > 0) setActiveTab("upcoming");
      else setActiveTab("ended");
    }
  }, [loading, grouped]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>
        <Loader2 size={28} className="animate-spin" style={{ margin: "0 auto 10px" }} />
        <div style={{ fontSize: 13 }}>Loading auctions...</div>
      </div>
    );
  }

  const currentConfigs = grouped[activeTab];
  const currentTabConfig = TAB_CONFIG.find(t => t.key === activeTab)!;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Gavel size={18} style={{ color: "var(--gold)" }} />
        <span style={{ fontSize: 16, fontWeight: 700 }}>Auctions</span>
        <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: "auto" }}>{configs.length} total</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: 3, background: "rgba(148,163,184,0.06)", borderRadius: 10, marginBottom: 14 }}>
        {TAB_CONFIG.map(tab => {
          const count = grouped[tab.key].length;
          const active = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer",
              background: active ? "var(--card)" : "transparent",
              boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              color: active ? tab.color : "var(--muted)",
              fontWeight: active ? 700 : 500, fontSize: 11,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              transition: "all 0.15s",
            }}>
              <Icon size={12} />
              {tab.label}
              {count > 0 && (
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 6,
                  background: active ? `${tab.color}18` : "rgba(148,163,184,0.1)",
                  color: active ? tab.color : "var(--muted)",
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {currentConfigs.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
          <Gavel size={28} style={{ margin: "0 auto 8px", opacity: 0.2 }} />
          <div style={{ fontSize: 12 }}>No {currentTabConfig.label.toLowerCase()} auctions</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {currentConfigs.map(config => (
            <AuctionCard key={config.id} config={config} tabColor={currentTabConfig.color} isLive={activeTab === "live"} onSelect={onSelectAuction} watching={!!watchMap[config.id]} onToggleWatch={toggleWatch} />
          ))}
        </div>
      )}
    </div>
  );
}

function AuctionCard({ config, tabColor, isLive, onSelect, watching, onToggleWatch }: {
  config: AuctionConfigResponse; tabColor: string; isLive: boolean;
  onSelect?: (id: number) => void;
  watching: boolean;
  onToggleWatch: (id: number) => void;
}) {
  return (
    <div
      onClick={() => onSelect?.(config.id)}
      style={{
        padding: "12px 14px", borderRadius: 12, cursor: onSelect ? "pointer" : "default",
        border: `1px solid ${isLive ? "rgba(239,68,68,0.2)" : "rgba(148,163,184,0.12)"}`,
        background: isLive ? "rgba(239,68,68,0.03)" : "rgba(148,163,184,0.02)",
        transition: "transform 0.1s, box-shadow 0.1s",
      }}
      onMouseEnter={e => { if (onSelect) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            {isLive && (
              <span style={{
                width: 6, height: 6, borderRadius: "50%", background: "#ef4444",
                animation: "pulse 1.5s infinite",
              }} />
            )}
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{config.seasonName}</span>
            <span style={{
              fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
              background: `${tabColor}15`, color: tabColor, textTransform: "uppercase",
            }}>
              {config.status}
            </span>
          </div>

          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>
            {config.sportName}{config.eventName ? ` · ${config.eventName}` : ""}
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <StatChip icon={Users} label={`${config.totalTeams} teams`} />
            <StatChip icon={Users} label={`${config.totalPlayers} players`} />
            <StatChip icon={IndianRupee} label={`${(config.budgetPerTeam / 100000).toFixed(1)}L budget`} />
            <StatChip icon={IndianRupee} label={`${config.basePrice} base`} />
            <StatChip icon={Clock} label={`${config.bidTimerSeconds}s timer`} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleWatch(config.id); }}
            title={watching ? "Unwatch auction" : "Watch auction"}
            style={{
              background: watching ? "rgba(99,102,241,0.1)" : "transparent",
              border: "none",
              borderRadius: 8,
              padding: 6,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s",
            }}
          >
            {watching ? <Eye size={15} color="#6366f1" /> : <EyeOff size={15} color="#94a3b8" />}
          </button>
          {onSelect && <ChevronRight size={16} style={{ color: "var(--muted)", opacity: 0.5 }} />}
        </div>
      </div>

      {/* Format & Features */}
      <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
        <span style={{
          fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
          background: "rgba(148,163,184,0.08)", color: "var(--muted)",
        }}>
          {config.auctionFormat}
        </span>
        {config.rtmEnabled && (
          <span style={{
            fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
            background: "rgba(59,130,246,0.08)", color: "#3b82f6",
          }}>
            RTM Enabled
          </span>
        )}
        {config.categories?.length > 0 && (
          <span style={{
            fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
            background: "rgba(168,85,247,0.08)", color: "#a855f7",
          }}>
            {config.categories.length} categories
          </span>
        )}
      </div>
    </div>
  );
}

function StatChip({ icon: Icon, label }: { icon: typeof Users; label: string }) {
  return (
    <span style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 3 }}>
      <Icon size={10} /> {label}
    </span>
  );
}
