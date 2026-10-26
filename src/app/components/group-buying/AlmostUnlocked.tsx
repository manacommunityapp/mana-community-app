import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Zap, Users, Clock, Star, ShoppingCart } from "lucide-react";
import { groupBuyingService, type GroupDeal } from "../../../services/group-buying/groupBuyingService";

export function AlmostUnlocked() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<GroupDeal[]>([]);

  useEffect(() => { setDeals(groupBuyingService.getAlmostUnlockedDeals()); }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <button onClick={() => navigate("/group-buying")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Zap size={22} style={{ color: "#f59e0b" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>Almost Unlocked</h1>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>These deals need just a few more neighbours to drop to the next price tier!</p>
        </div>
      </div>

      {deals.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)" }}>
          <Zap size={32} style={{ color: "var(--muted)", marginBottom: 8 }} />
          <div style={{ fontSize: 13, color: "var(--muted)" }}>No deals near a tier unlock right now. Check back later!</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {deals.map(deal => {
            const activeTier = deal.tiers.find(t => deal.currentParticipants >= t.minQty && (t.maxQty === null || deal.currentParticipants <= t.maxQty)) || deal.tiers[0];
            const nextTier = deal.tiers.find(t => t.minQty > deal.currentParticipants);
            const remaining = nextTier ? nextTier.minQty - deal.currentParticipants : 0;
            const pct = Math.min(100, Math.round((deal.currentParticipants / deal.targetParticipants) * 100));

            return (
              <div key={deal.id} style={{ padding: 18, borderRadius: 14, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ width: 64, height: 64, borderRadius: 12, background: deal.imagePlaceholderColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ShoppingCart size={24} style={{ color: "#fff" }} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{deal.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>
                    <span>{deal.vendor}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 2, color: "#f59e0b" }}><Star size={10} style={{ fill: "#f59e0b" }} />{deal.vendorRating}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "rgba(148,163,184,0.1)", marginBottom: 6 }}>
                    <div style={{ height: 6, borderRadius: 3, background: "#f59e0b", width: `${pct}%` }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 3, color: "var(--muted)" }}><Users size={10} />{deal.currentParticipants}/{deal.targetParticipants}</span>
                    {nextTier && (
                      <span style={{ fontWeight: 700, color: "#f59e0b", background: "rgba(245,158,11,0.08)", padding: "2px 8px", borderRadius: 6 }}>
                        Only {remaining} more for ₹{nextTier.pricePerUnit}!
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#10b981" }}>₹{activeTier.pricePerUnit}</div>
                  {nextTier && <div style={{ fontSize: 10, color: "var(--muted)" }}>Next: ₹{nextTier.pricePerUnit}</div>}
                  <button onClick={() => navigate(`/group-buying/deal/${deal.id}`)} style={{ marginTop: 8, padding: "6px 16px", borderRadius: 8, background: "#f59e0b", color: "#000", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                    Help Unlock
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
