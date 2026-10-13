import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Users, Building2, Crown, ShoppingBag, TrendingUp } from "lucide-react";
import { groupBuyingService, type BuyingGroup } from "../../../services/group-buying/groupBuyingService";

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  TOWER: { bg: "rgba(59,130,246,0.1)", text: "#3b82f6" },
  BLOCK: { bg: "rgba(139,92,246,0.1)", text: "#8b5cf6" },
  WING: { bg: "rgba(16,185,129,0.1)", text: "#10b981" },
  FLOOR: { bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
};

export function BuyingGroups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<BuyingGroup[]>([]);

  useEffect(() => { setGroups(groupBuyingService.getBuyingGroups()); }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <button onClick={() => navigate("/group-buying")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Building2 size={22} style={{ color: "#3b82f6" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>Buying Groups</h1>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Join your tower or block buying circle for extra savings</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {groups.map(group => {
          const tc = TYPE_COLORS[group.type] || TYPE_COLORS.TOWER;
          const memberPct = Math.round((group.members / group.maxMembers) * 100);
          return (
            <div key={group.id} style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: tc.bg, color: tc.text, textTransform: "uppercase" }}>{group.type}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "var(--muted)" }}><Crown size={10} style={{ color: "#f59e0b" }} />{group.admin}</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: "0 0 10px" }}>{group.name}</h3>

              {/* Members bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Users size={10} />{group.members} members</span>
                  <span>{group.maxMembers} max</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: "rgba(148,163,184,0.1)" }}>
                  <div style={{ height: 5, borderRadius: 3, background: tc.text, width: `${memberPct}%` }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: "rgba(148,163,184,0.04)", textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{group.activeDealCount}</div>
                  <div style={{ fontSize: 9, color: "var(--muted)" }}>Active Deals</div>
                </div>
                <div style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: "rgba(148,163,184,0.04)", textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#10b981" }}>₹{(group.totalSavings / 1000).toFixed(1)}K</div>
                  <div style={{ fontSize: 9, color: "var(--muted)" }}>Total Saved</div>
                </div>
              </div>

              <button style={{ width: "100%", padding: "8px 16px", borderRadius: 8, background: tc.bg, color: tc.text, border: `1px solid ${tc.text}20`, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                Join Group
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
