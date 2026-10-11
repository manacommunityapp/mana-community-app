import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Sparkles, Search, Star, Users, Clock, ShoppingCart } from "lucide-react";
import { groupBuyingService, type AIDemandMatch } from "../../../services/group-buying/groupBuyingService";

export function AIDemandSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AIDemandMatch | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      setResult(groupBuyingService.askCommunityAI(query));
      setIsSearching(false);
    }, 800);
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px" }}>
      <button onClick={() => navigate("/group-buying")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(236,72,153,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={22} style={{ color: "#ec4899" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>AI Product Search</h1>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Describe what you need in natural language</p>
        </div>
      </div>

      {/* Search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="e.g. organic vegetables weekly delivery, air purifier for 2BHK..."
            style={{ width: "100%", padding: "12px 14px 12px 38px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)", fontSize: 13, boxSizing: "border-box" }} />
        </div>
        <button onClick={handleSearch} disabled={isSearching} style={{ padding: "12px 20px", borderRadius: 10, background: "#ec4899", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, opacity: isSearching ? 0.7 : 1 }}>
          <Sparkles size={14} /> {isSearching ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Quick Suggestions */}
      {!result && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Try searching for:</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["organic groceries", "electronics", "cleaning", "festive", "school supplies"].map(s => (
              <button key={s} onClick={() => { setQuery(s); setTimeout(() => { setResult(groupBuyingService.askCommunityAI(s)); }, 400); }}
                style={{ fontSize: 11, padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(236,72,153,0.2)", background: "rgba(236,72,153,0.05)", color: "#ec4899", cursor: "pointer", fontWeight: 600 }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
            {result.matches.length > 0
              ? `Found ${result.matches.length} matching deals for "${result.query}"`
              : `No exact matches for "${result.query}"`}
          </div>

          {result.matches.map(m => (
            <button key={m.deal.id} onClick={() => navigate(`/group-buying/deal/${m.deal.id}`)} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 12, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)", cursor: "pointer", marginBottom: 10, width: "100%", textAlign: "left" }}>
              <div style={{ width: 50, height: 50, borderRadius: 10, background: m.deal.imagePlaceholderColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ShoppingCart size={20} style={{ color: "#fff" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{m.deal.title}</div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>{m.reason}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "var(--muted)" }}>
                  <span>{m.deal.vendor}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Star size={8} style={{ color: "#f59e0b", fill: "#f59e0b" }} />{m.deal.vendorRating}</span>
                  <span><Users size={8} /> {m.deal.currentParticipants} joined</span>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#10b981" }}>₹{(m.deal.tiers.find(t => m.deal.currentParticipants >= t.minQty && (t.maxQty === null || m.deal.currentParticipants <= t.maxQty)) || m.deal.tiers[0]).pricePerUnit}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end", marginTop: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: m.confidence >= 80 ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", color: m.confidence >= 80 ? "#10b981" : "#f59e0b" }}>
                    {m.confidence}% match
                  </span>
                </div>
              </div>
            </button>
          ))}

          {result.suggestions.length > 0 && (
            <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: "rgba(236,72,153,0.04)", border: "1px solid rgba(236,72,153,0.1)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#ec4899", marginBottom: 6 }}>Suggestions</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {result.suggestions.map(s => (
                  <span key={s} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, background: "rgba(236,72,153,0.08)", color: "#ec4899", fontWeight: 600 }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
