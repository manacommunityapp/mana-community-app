import { useState } from "react";
import {
  Brain, Sparkles, Users, Search, MapPin, Star, ChevronRight,
  Eye, EyeOff, ShoppingBag, Calendar, Briefcase, Heart, ArrowRight, Filter,
} from "lucide-react";

const TABS = ["For You", "Discover Neighbors"] as const;

const TYPE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "Group Buy": { bg: "rgba(245,158,11,0.08)", text: "#f59e0b", border: "#f59e0b" },
  Service: { bg: "rgba(59,130,246,0.08)", text: "#3b82f6", border: "#3b82f6" },
  "Skill Match": { bg: "rgba(139,92,246,0.08)", text: "#8b5cf6", border: "#8b5cf6" },
  Event: { bg: "rgba(236,72,153,0.08)", text: "#ec4899", border: "#ec4899" },
  Deal: { bg: "rgba(16,185,129,0.08)", text: "#10b981", border: "#10b981" },
};

const RECOMMENDATIONS = [
  { type: "Group Buy", title: "Organic Fruits — Weekly Basket", desc: "Join 23 neighbors in weekly organic fruit delivery from local farms", reason: "Popular in your tower", action: "Join" },
  { type: "Service", title: "Yoga Classes by Priya M.", desc: "Morning yoga sessions in the clubhouse. 4.9★ rating from 32 residents", reason: "Based on your interests", action: "Book" },
  { type: "Skill Match", title: "Guitar Lessons Available", desc: "Rahul from B-204 offers weekend guitar lessons for beginners", reason: "Matches your saved interest", action: "Connect" },
  { type: "Event", title: "Diwali Cultural Night", desc: "Community celebration with performances, food stalls, and fireworks", reason: "Trending in community", action: "RSVP" },
  { type: "Deal", title: "20% off at Fresh Mart", desc: "Exclusive community deal on groceries. Valid until Oct 20", reason: "Based on your purchase history", action: "View" },
  { type: "Group Buy", title: "Water Purifier Service", desc: "Annual AMC at ₹1,200 (vs ₹2,500 retail). 45 residents joined", reason: "Cost saving opportunity", action: "Join" },
];

const TOP_SKILLS = ["Yoga", "Cooking", "Music", "Photography", "Tutoring", "Gardening", "Fitness", "Art"];

const NEIGHBORS = [
  { name: "Priya Menon", initials: "PM", flat: "A-302", profession: "Yoga Instructor", skills: ["Yoga", "Meditation", "Nutrition"], visibility: "Public" },
  { name: "Arjun Shah", initials: "AS", flat: "B-105", profession: "Software Engineer", skills: ["Coding", "Guitar", "Cricket"], visibility: "Neighbors Only" },
  { name: "Meera Joshi", initials: "MJ", flat: "C-401", profession: "Chef", skills: ["Cooking", "Baking", "Food Photography"], visibility: "Public" },
  { name: "Vikram Rao", initials: "VR", flat: "A-204", profession: "Photographer", skills: ["Photography", "Video Editing"], visibility: "Neighbors Only" },
];

export function IntelligenceDashboard() {
  const [tab, setTab] = useState<typeof TABS[number]>("For You");
  const [skillSearch, setSkillSearch] = useState("");

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(139,92,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Brain size={22} style={{ color: "#8b5cf6" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>Mana Intelligence</h1>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Personalized recommendations for your community life</p>
        </div>
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

      {/* For You */}
      {tab === "For You" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {RECOMMENDATIONS.map((r, i) => {
            const ts = TYPE_STYLES[r.type] || TYPE_STYLES.Deal;
            return (
              <div key={i} style={{ padding: 16, borderRadius: 12, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)", borderLeft: `3px solid ${ts.border}`, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: ts.bg, color: ts.text }}>{r.type}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{r.desc}</div>
                  <div style={{ fontSize: 10, color: "#8b5cf6", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <Sparkles size={10} /> {r.reason}
                  </div>
                </div>
                <button style={{ fontSize: 11, fontWeight: 700, padding: "6px 16px", borderRadius: 6, background: "var(--gold)", color: "#000", border: "none", cursor: "pointer" }}>{r.action}</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Discover Neighbors */}
      {tab === "Discover Neighbors" && (
        <div>
          <div style={{ position: "relative", marginBottom: 14 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "var(--muted)" }} />
            <input value={skillSearch} onChange={e => setSkillSearch(e.target.value)} placeholder="Search by skill or profession..."
              style={{ width: "100%", padding: "8px 8px 8px 30px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)", fontSize: 12, boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {TOP_SKILLS.map(s => (
              <button key={s} onClick={() => setSkillSearch(s)} style={{
                fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 12,
                border: "1px solid rgba(148,163,184,0.15)", background: skillSearch === s ? "rgba(212,160,23,0.08)" : "transparent",
                color: skillSearch === s ? "var(--gold)" : "var(--muted)", cursor: "pointer",
              }}>{s}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {NEIGHBORS.map(n => (
              <div key={n.name} style={{ padding: 16, borderRadius: 12, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(148,163,184,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>{n.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{n.name}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>{n.flat} · {n.profession}</div>
                  </div>
                  <span style={{ fontSize: 8, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: n.visibility === "Public" ? "rgba(16,185,129,0.1)" : "rgba(148,163,184,0.1)", color: n.visibility === "Public" ? "#10b981" : "var(--muted)", display: "flex", alignItems: "center", gap: 2 }}>
                    {n.visibility === "Public" ? <Eye size={8} /> : <EyeOff size={8} />}{n.visibility}
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {n.skills.map(s => (
                    <span key={s} style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: "rgba(139,92,246,0.08)", color: "#8b5cf6" }}>{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: "rgba(148,163,184,0.04)", border: "1px solid rgba(148,163,184,0.1)", display: "flex", alignItems: "center", gap: 8 }}>
            <EyeOff size={14} style={{ color: "var(--muted)" }} />
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Your visibility: <strong>Neighbors Only</strong> — Change in Settings</span>
          </div>
        </div>
      )}
    </div>
  );
}
