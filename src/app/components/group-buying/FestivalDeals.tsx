import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Gift, Clock, Users, Star, ShoppingCart } from "lucide-react";
import { groupBuyingService, type FestivalCampaign } from "../../../services/group-buying/groupBuyingService";

export function FestivalDeals() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<FestivalCampaign[]>([]);

  useEffect(() => { setCampaigns(groupBuyingService.getFestivalCampaigns()); }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <button onClick={() => navigate("/group-buying")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Gift size={22} style={{ color: "#ef4444" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>Festival Deals</h1>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Seasonal campaigns with exclusive group discounts</p>
        </div>
      </div>

      {campaigns.map(campaign => {
        const daysLeft = Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / 86400000));
        const isActive = new Date(campaign.startDate).getTime() <= Date.now();
        return (
          <div key={campaign.id} style={{ marginBottom: 24 }}>
            {/* Campaign Banner */}
            <div style={{ background: `linear-gradient(135deg, ${campaign.color}, ${campaign.color}cc)`, borderRadius: 16, padding: "24px 28px", marginBottom: 14, color: "#fff" }}>
              <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, marginBottom: 4 }}>
                {isActive ? `${daysLeft} days left` : `Starts ${new Date(campaign.startDate).toLocaleDateString()}`}
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>{campaign.festivalName}</h2>
              <p style={{ fontSize: 13, margin: 0, opacity: 0.9 }}>{campaign.tagline}</p>
            </div>

            {campaign.deals.length === 0 ? (
              <div style={{ textAlign: "center", padding: 32, background: "var(--card)", borderRadius: 12, border: "1px solid rgba(148,163,184,0.1)" }}>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Deals coming soon. Stay tuned!</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {campaign.deals.map(deal => {
                  const activeTier = deal.tiers.find(t => deal.currentParticipants >= t.minQty && (t.maxQty === null || deal.currentParticipants <= t.maxQty)) || deal.tiers[0];
                  const pct = Math.min(100, Math.round((deal.currentParticipants / deal.targetParticipants) * 100));
                  return (
                    <button key={deal.id} onClick={() => navigate(`/group-buying/deal/${deal.id}`)} style={{ padding: 16, borderRadius: 12, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)", cursor: "pointer", textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: deal.imagePlaceholderColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ShoppingCart size={18} style={{ color: "#fff" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{deal.title}</div>
                          <div style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
                            {deal.vendor} <Star size={8} style={{ color: "#f59e0b", fill: "#f59e0b" }} /> {deal.vendorRating}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: "#10b981" }}>₹{activeTier.pricePerUnit}</span>
                        {deal.mrp && <span style={{ fontSize: 11, color: "var(--muted)", textDecoration: "line-through" }}>₹{deal.mrp}</span>}
                        {deal.savings && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "rgba(16,185,129,0.1)", color: "#10b981" }}>{deal.savings}% off</span>}
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: "rgba(148,163,184,0.1)", marginBottom: 4 }}>
                        <div style={{ height: 4, borderRadius: 2, background: campaign.color, width: `${pct}%` }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--muted)" }}>
                        <span><Users size={8} style={{ verticalAlign: "middle" }} /> {deal.currentParticipants} joined</span>
                        <span><Clock size={8} style={{ verticalAlign: "middle" }} /> {Math.max(1, Math.ceil((new Date(deal.endDate).getTime() - Date.now()) / 86400000))}d left</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
