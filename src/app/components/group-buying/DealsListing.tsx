import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft, Search, ShoppingCart, Users, Clock, Star, Filter,
} from "lucide-react";
import { groupBuyingService, type GroupDeal } from "../../../services/group-buying/groupBuyingService";

export function DealsListing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState("All");
  const [deals, setDeals] = useState<GroupDeal[]>([]);
  const categories = groupBuyingService.getCategories();

  useEffect(() => {
    setDeals(groupBuyingService.getDeals(category, search));
  }, [category, search]);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px" }}>
      <button onClick={() => navigate("/group-buying")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back to Hub
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 16px" }}>All Deals</h1>

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search deals..."
            style={{ width: "100%", padding: "10px 12px 10px 34px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)", fontSize: 12, boxSizing: "border-box" }} />
        </div>
      </div>

      {/* Category Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {categories.map(c => (
          <button key={c} onClick={() => setCategory(c)} style={{
            fontSize: 10, fontWeight: 700, padding: "5px 12px", borderRadius: 8,
            border: `1px solid ${category === c ? "#10b981" : "rgba(148,163,184,0.15)"}`,
            background: category === c ? "rgba(16,185,129,0.08)" : "transparent",
            color: category === c ? "#10b981" : "var(--muted)", cursor: "pointer",
          }}>{c}</button>
        ))}
      </div>

      {deals.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)" }}>
          <ShoppingCart size={32} style={{ color: "var(--muted)", marginBottom: 8 }} />
          <div style={{ fontSize: 13, color: "var(--muted)" }}>No deals found. Try different filters.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {deals.map(deal => {
            const activeTier = deal.tiers.find(t => deal.currentParticipants >= t.minQty && (t.maxQty === null || deal.currentParticipants <= t.maxQty)) || deal.tiers[0];
            const pct = Math.min(100, Math.round((deal.currentParticipants / deal.targetParticipants) * 100));
            const nextTier = deal.tiers.find(t => t.minQty > deal.currentParticipants);

            return (
              <button key={deal.id} onClick={() => navigate(`/group-buying/deal/${deal.id}`)}
                style={{ padding: 0, borderRadius: 14, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)", cursor: "pointer", textAlign: "left", overflow: "hidden" }}>
                {/* Color header */}
                <div style={{ height: 60, background: deal.imagePlaceholderColor, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(0,0,0,0.25)", color: "#fff" }}>{deal.category}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {deal.tags?.map(t => (
                      <span key={t} style={{ fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.25)", color: "#fff" }}>{t}</span>
                    ))}
                  </div>
                </div>

                <div style={{ padding: "12px 14px 14px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deal.title}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    {deal.vendor} <Star size={8} style={{ color: "#f59e0b", fill: "#f59e0b" }} /> {deal.vendorRating}
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: "#10b981" }}>₹{activeTier.pricePerUnit}</span>
                    {deal.mrp && <span style={{ fontSize: 11, color: "var(--muted)", textDecoration: "line-through" }}>₹{deal.mrp}</span>}
                    {deal.savings && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "rgba(16,185,129,0.1)", color: "#10b981" }}>{deal.savings}% off</span>}
                  </div>

                  {/* Progress */}
                  <div style={{ height: 4, borderRadius: 2, background: "rgba(148,163,184,0.1)", marginBottom: 6 }}>
                    <div style={{ height: 4, borderRadius: 2, background: pct >= 100 ? "#10b981" : "#3b82f6", width: `${pct}%` }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--muted)" }}>
                    <span><Users size={8} style={{ verticalAlign: "middle" }} /> {deal.currentParticipants}/{deal.targetParticipants}</span>
                    {nextTier && <span style={{ color: "#f59e0b", fontWeight: 700 }}>{nextTier.minQty - deal.currentParticipants} more for ₹{nextTier.pricePerUnit}</span>}
                    <span><Clock size={8} style={{ verticalAlign: "middle" }} /> {Math.max(1, Math.ceil((new Date(deal.endDate).getTime() - Date.now()) / 86400000))}d</span>
                  </div>

                  {/* Tier strip */}
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    {deal.tiers.map((t, i) => (
                      <div key={i} style={{
                        flex: 1, padding: "4px 4px", borderRadius: 4, textAlign: "center", fontSize: 8, fontWeight: 700,
                        background: t.label === activeTier.label ? "rgba(16,185,129,0.08)" : "rgba(148,163,184,0.04)",
                        color: t.label === activeTier.label ? "#10b981" : "var(--muted)",
                        border: `1px solid ${t.label === activeTier.label ? "rgba(16,185,129,0.2)" : "transparent"}`,
                      }}>
                        {t.label}: ₹{t.pricePerUnit}
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
