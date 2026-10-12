import { useState } from "react";
import {
  FolderKanban, Vote, Users, CheckCircle2, Clock, ArrowRight,
  Plus, BarChart3, Building2, Target, ChevronRight, AlertCircle,
} from "lucide-react";

const STAGES = ["All", "Proposal", "Voting", "Approved", "In Progress", "Completed"] as const;

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  Proposal: { bg: "rgba(148,163,184,0.12)", text: "#64748b" },
  Voting: { bg: "rgba(139,92,246,0.12)", text: "#8b5cf6" },
  Approved: { bg: "rgba(59,130,246,0.12)", text: "#3b82f6" },
  "In Progress": { bg: "rgba(245,158,11,0.12)", text: "#f59e0b" },
  Completed: { bg: "rgba(16,185,129,0.12)", text: "#10b981" },
};

const METRICS = [
  { label: "Total Projects", value: "18", icon: FolderKanban, color: "#3b82f6" },
  { label: "In Progress", value: "7", icon: Clock, color: "#f59e0b" },
  { label: "Budget Utilized", value: "₹42L / ₹65L", icon: BarChart3, color: "#10b981" },
];

const PROJECTS = [
  { name: "Swimming Pool Renovation", stage: "In Progress", category: "Infrastructure", budget: 2500000, spent: 1800000, milestones: { done: 4, total: 7 }, vendor: "AquaTech Solutions", next: "Tile installation", timeline: "Dec 2026" },
  { name: "Solar Panel Installation", stage: "Voting", category: "Sustainability", budget: 1800000, spent: 0, milestones: { done: 0, total: 5 }, vendor: "Pending", next: "Community vote", timeline: "Q1 2027" },
  { name: "Children's Play Area Upgrade", stage: "Approved", category: "Amenities", budget: 800000, spent: 120000, milestones: { done: 1, total: 4 }, vendor: "FunZone India", next: "Equipment procurement", timeline: "Nov 2026" },
  { name: "CCTV Network Expansion", stage: "Completed", category: "Security", budget: 600000, spent: 580000, milestones: { done: 6, total: 6 }, vendor: "SecureView Systems", next: "—", timeline: "Sep 2026" },
  { name: "EV Charging Station", stage: "Proposal", category: "Infrastructure", budget: 1200000, spent: 0, milestones: { done: 0, total: 3 }, vendor: "TBD", next: "Committee review", timeline: "Q2 2027" },
];

export function ProjectsDashboard() {
  const [filter, setFilter] = useState<typeof STAGES[number]>("All");
  const filtered = filter === "All" ? PROJECTS : PROJECTS.filter(p => p.stage === filter);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FolderKanban size={22} style={{ color: "#f59e0b" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>Community Projects</h1>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Track proposals, budgets & milestones</p>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {METRICS.map(m => (
          <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)" }}>
            <m.icon size={14} style={{ color: m.color }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{m.value}</span>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{m.label}</span>
          </div>
        ))}
      </div>

      {/* Stage Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {STAGES.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            fontSize: 11, fontWeight: 700, padding: "6px 14px", borderRadius: 8,
            border: `1px solid ${filter === s ? "var(--gold)" : "rgba(148,163,184,0.15)"}`,
            background: filter === s ? "rgba(212,160,23,0.1)" : "transparent",
            color: filter === s ? "var(--gold)" : "var(--muted)", cursor: "pointer",
          }}>{s}</button>
        ))}
      </div>

      {/* Project Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(p => {
          const sc = STAGE_COLORS[p.stage] || STAGE_COLORS.Proposal;
          const budgetPct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
          return (
            <div key={p.name} style={{ padding: 18, borderRadius: 14, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)" }}>
              <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
                    {p.name}
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: sc.bg, color: sc.text }}>{p.stage}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Building2 size={10} />{p.category}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Users size={10} />{p.vendor}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={10} />{p.timeline}</span>
                  </div>
                </div>
                <button style={{ fontSize: 10, fontWeight: 700, padding: "5px 12px", borderRadius: 6, background: p.stage === "Voting" ? "rgba(139,92,246,0.1)" : "rgba(212,160,23,0.08)", color: p.stage === "Voting" ? "#8b5cf6" : "var(--gold)", border: `1px solid ${p.stage === "Voting" ? "rgba(139,92,246,0.2)" : "rgba(212,160,23,0.2)"}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  {p.stage === "Voting" ? <><Vote size={10} /> Cast Vote</> : p.stage === "Completed" ? <><CheckCircle2 size={10} /> View Report</> : <><Target size={10} /> Track</>}
                </button>
              </div>
              {/* Budget Bar */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>Budget: ₹{(p.spent / 100000).toFixed(1)}L / ₹{(p.budget / 100000).toFixed(1)}L</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text)" }}>{budgetPct}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: "rgba(148,163,184,0.1)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 3, width: `${budgetPct}%`, background: budgetPct > 90 ? "#ef4444" : "#10b981" }} />
                </div>
              </div>
              {/* Milestones */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
                  <CheckCircle2 size={10} /> Milestones: {p.milestones.done}/{p.milestones.total}
                </span>
                <span style={{ fontSize: 10, color: "var(--muted)" }}>Next: {p.next}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Governance Link */}
      <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)", display: "flex", alignItems: "center", gap: 10 }}>
        <Vote size={18} style={{ color: "#8b5cf6" }} />
        <span style={{ fontSize: 12, color: "var(--text)" }}>Projects linked to governance resolutions get auto-tracked through approval stages</span>
        <ChevronRight size={14} style={{ color: "var(--muted)", marginLeft: "auto" }} />
      </div>
    </div>
  );
}
