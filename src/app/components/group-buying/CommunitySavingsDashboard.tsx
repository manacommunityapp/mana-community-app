import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, BarChart3, Trophy, Target, TrendingUp, Users } from "lucide-react";
import { groupBuyingService, type CommunitySavings } from "../../../services/group-buying/groupBuyingService";

export function CommunitySavingsDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<CommunitySavings | null>(null);

  useEffect(() => { setData(groupBuyingService.getCommunitySavings()); }, []);

  if (!data) return null;

  const maxTrend = Math.max(...data.monthlyTrend.map(m => m.savings));

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <button onClick={() => navigate("/group-buying")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(22,163,74,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BarChart3 size={22} style={{ color: "#16a34a" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>Community Savings</h1>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Our collective buying power, visualized</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Total Saved", value: `₹${(data.totalSaved / 1000).toFixed(0)}K`, color: "#10b981" },
          { label: "Orders", value: data.ordersCompleted.toString(), color: "#3b82f6" },
          { label: "Active Deals", value: data.activeDeals.toString(), color: "#f59e0b" },
          { label: "Avg Savings", value: `${data.avgSavingsPercent}%`, color: "#8b5cf6" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--card)", borderRadius: 12, border: "1px solid rgba(148,163,184,0.1)", padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Milestones */}
      <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <Target size={16} style={{ color: "#f59e0b" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Community Milestones</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.milestones.map(m => {
            const pct = Math.min(100, Math.round((m.current / m.target) * 100));
            return (
              <div key={m.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: "var(--text)" }}>{m.label}</span>
                  <span style={{ color: "var(--muted)" }}>{pct}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "rgba(148,163,184,0.1)" }}>
                  <div style={{ height: 8, borderRadius: 4, background: pct >= 100 ? "#10b981" : "#f59e0b", width: `${pct}%`, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Monthly Trend */}
        <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <TrendingUp size={16} style={{ color: "#10b981" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Monthly Trend</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
            {data.monthlyTrend.map(m => {
              const h = Math.round((m.savings / maxTrend) * 100);
              return (
                <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#10b981" }}>₹{(m.savings / 1000).toFixed(0)}K</span>
                  <div style={{ width: "100%", height: h, borderRadius: "4px 4px 0 0", background: "linear-gradient(180deg, #10b981, #059669)" }} />
                  <span style={{ fontSize: 9, color: "var(--muted)" }}>{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tower Leaderboard */}
        <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <Trophy size={16} style={{ color: "#f59e0b" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Tower Leaderboard</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.towerLeaderboard.map((t, i) => (
              <div key={t.tower} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 20, height: 20, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, background: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7f32" : "rgba(148,163,184,0.1)", color: i < 3 ? "#fff" : "var(--muted)" }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{t.tower}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>₹{(t.savings / 1000).toFixed(1)}K</span>
                <span style={{ fontSize: 10, color: "var(--muted)" }}>{t.orders} orders</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
