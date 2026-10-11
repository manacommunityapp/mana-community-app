import { useState } from "react";
import {
  Zap, Brain, Play, Pause, Clock, CheckCircle2, XCircle,
  ChevronRight, Plus, Settings, RefreshCw, Filter, ArrowRight,
} from "lucide-react";

const TABS = ["My Rules", "Preset Recipes", "Execution Logs"] as const;

const DOMAIN_COLORS: Record<string, { bg: string; text: string }> = {
  VISITOR_SECURITY: { bg: "rgba(239,68,68,0.1)", text: "#ef4444" },
  FINANCE: { bg: "rgba(16,185,129,0.1)", text: "#10b981" },
  HELPDESK: { bg: "rgba(59,130,246,0.1)", text: "#3b82f6" },
  GROUP_BUY: { bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
  SMART_METER: { bg: "rgba(139,92,246,0.1)", text: "#8b5cf6" },
  PARKING: { bg: "rgba(236,72,153,0.1)", text: "#ec4899" },
};

const RULES = [
  { name: "Visitor WhatsApp Alert", domain: "VISITOR_SECURITY", trigger: "When visitor arrives", action: "Send WhatsApp notification to flat owner", active: true, lastRun: "2 min ago", runs: 342 },
  { name: "Overdue Bill Reminder", domain: "FINANCE", trigger: "Maintenance bill overdue > 7 days", action: "Send reminder via SMS and email", active: true, lastRun: "1 hour ago", runs: 56 },
  { name: "Auto-assign Helpdesk", domain: "HELPDESK", trigger: "New plumbing ticket created", action: "Assign to plumbing vendor + notify admin", active: false, lastRun: "3 days ago", runs: 89 },
  { name: "Group Buy Alert", domain: "GROUP_BUY", trigger: "Order minimum reached", action: "Notify all participants with pickup slot", active: true, lastRun: "5 hours ago", runs: 23 },
];

const RECIPES = [
  { emoji: "🔔", name: "Visitor Pre-approval", domain: "VISITOR_SECURITY", desc: "Auto-approve visitors from pre-approved list" },
  { emoji: "💰", name: "Payment Confirmation", domain: "FINANCE", desc: "Send receipt on maintenance payment" },
  { emoji: "🔧", name: "Maintenance Escalation", domain: "HELPDESK", desc: "Escalate unresolved tickets after 48 hours" },
  { emoji: "📦", name: "Delivery Notification", domain: "VISITOR_SECURITY", desc: "Alert when courier arrives at gate" },
  { emoji: "⚡", name: "High Usage Alert", domain: "SMART_METER", desc: "Notify when electricity exceeds daily threshold" },
  { emoji: "🅿️", name: "Parking Violation", domain: "PARKING", desc: "Alert admin on unauthorized parking detected" },
];

const LOGS = [
  { time: "Oct 11, 10:23 AM", rule: "Visitor WhatsApp Alert", status: "Success", trigger: "Visitor: Swiggy Delivery" },
  { time: "Oct 11, 10:15 AM", rule: "Visitor WhatsApp Alert", status: "Success", trigger: "Visitor: Amazon Courier" },
  { time: "Oct 11, 9:00 AM", rule: "Overdue Bill Reminder", status: "Success", trigger: "3 bills overdue" },
  { time: "Oct 10, 6:00 PM", rule: "Group Buy Alert", status: "Failed", trigger: "Minimum not reached" },
  { time: "Oct 10, 2:30 PM", rule: "Visitor WhatsApp Alert", status: "Success", trigger: "Visitor: Plumber" },
];

export function AutomationDashboard() {
  const [tab, setTab] = useState<typeof TABS[number]>("My Rules");

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Zap size={22} style={{ color: "#f59e0b" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>Mana Automation</h1>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Event-driven rules for your community</p>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[{ label: "Active Rules", value: "3" }, { label: "Executions Today", value: "47" }, { label: "Pending Tasks", value: "2" }].map(m => (
          <div key={m.label} style={{ padding: "8px 14px", borderRadius: 10, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{m.value}</span>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{m.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontSize: 12, fontWeight: 700, padding: "7px 16px", borderRadius: 8,
            border: `1px solid ${tab === t ? "var(--gold)" : "rgba(148,163,184,0.15)"}`,
            background: tab === t ? "rgba(212,160,23,0.1)" : "transparent",
            color: tab === t ? "var(--gold)" : "var(--muted)", cursor: "pointer",
          }}>{t}</button>
        ))}
      </div>

      {/* My Rules */}
      {tab === "My Rules" && (
        <div>
          {RULES.map(r => {
            const dc = DOMAIN_COLORS[r.domain] || DOMAIN_COLORS.HELPDESK;
            return (
              <div key={r.name} style={{ padding: 16, borderRadius: 12, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)", marginBottom: 10, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
                    {r.name}
                    <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: dc.bg, color: dc.text }}>{r.domain.replace(/_/g, " ")}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    {r.trigger} <ArrowRight size={10} /> {r.action}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, display: "flex", gap: 10 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={10} />Last: {r.lastRun}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}><RefreshCw size={10} />{r.runs} runs</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ fontSize: 10, fontWeight: 600, padding: "5px 10px", borderRadius: 6, border: "1px solid rgba(148,163,184,0.15)", background: "transparent", color: "var(--muted)", cursor: "pointer" }}>Test</button>
                  <button style={{ fontSize: 10, fontWeight: 600, padding: "5px 10px", borderRadius: 6, border: "1px solid rgba(148,163,184,0.15)", background: "transparent", color: "var(--muted)", cursor: "pointer" }}>Edit</button>
                  <button onClick={() => {}} style={{ width: 36, height: 22, borderRadius: 11, border: "none", background: r.active ? "#10b981" : "rgba(148,163,184,0.2)", cursor: "pointer", position: "relative" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: r.active ? 17 : 3, transition: "left 0.15s" }} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* AI Rule Builder */}
          <div style={{ marginTop: 20, padding: 18, borderRadius: 14, background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Brain size={16} style={{ color: "#8b5cf6" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>AI Rule Builder</span>
            </div>
            <input placeholder='Describe your automation, e.g. "When maintenance bill is overdue by 7 days, send a reminder"'
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)", fontSize: 12, boxSizing: "border-box" }} />
          </div>
        </div>
      )}

      {/* Preset Recipes */}
      {tab === "Preset Recipes" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
          {RECIPES.map(r => {
            const dc = DOMAIN_COLORS[r.domain] || DOMAIN_COLORS.HELPDESK;
            return (
              <div key={r.name} style={{ padding: 16, borderRadius: 12, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{r.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  {r.name}
                  <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: dc.bg, color: dc.text }}>{r.domain.replace(/_/g, " ")}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>{r.desc}</div>
                <button style={{ fontSize: 10, fontWeight: 700, padding: "5px 14px", borderRadius: 6, background: "var(--gold)", color: "#000", border: "none", cursor: "pointer" }}>Enable</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Execution Logs */}
      {tab === "Execution Logs" && (
        <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", overflow: "hidden" }}>
          {LOGS.map((l, i) => (
            <div key={i} style={{ padding: "12px 16px", borderBottom: "1px solid rgba(148,163,184,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
              {l.status === "Success" ? <CheckCircle2 size={14} style={{ color: "#10b981", flexShrink: 0 }} /> : <XCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{l.rule}</div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>{l.trigger}</div>
              </div>
              <span style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0 }}>{l.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
