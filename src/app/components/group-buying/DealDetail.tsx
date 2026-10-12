import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Share2, Users, Clock, MapPin, Star, ShoppingCart, ChevronRight,
  CheckCircle2, Shield, Truck, Package,
} from "lucide-react";
import { groupBuyingService, type GroupDeal } from "../../../services/group-buying/groupBuyingService";

export function DealDetail() {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<GroupDeal | null>(null);

  useEffect(() => {
    if (dealId) {
      const d = groupBuyingService.getDealById(dealId);
      if (d) setDeal(d);
    }
  }, [dealId]);

  if (!deal) return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
      <Package size={48} style={{ color: "var(--muted)", marginBottom: 12 }} />
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Deal not found</div>
      <button onClick={() => navigate("/group-buying")} style={{ marginTop: 12, padding: "8px 20px", borderRadius: 8, background: "var(--gold)", color: "#000", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Back to Hub</button>
    </div>
  );

  const activeTier = deal.tiers.find(t => deal.currentParticipants >= t.minQty && (t.maxQty === null || deal.currentParticipants <= t.maxQty)) || deal.tiers[0];
  const nextTier = deal.tiers.find(t => t.minQty > deal.currentParticipants);
  const pct = Math.min(100, Math.round((deal.currentParticipants / deal.targetParticipants) * 100));
  const daysLeft = Math.max(1, Math.ceil((new Date(deal.endDate).getTime() - Date.now()) / 86400000));

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
      {/* Back + Share */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontSize: 13, fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "transparent", cursor: "pointer", color: "var(--muted)", fontSize: 11, fontWeight: 600 }}>
          <Share2 size={14} /> Share
        </button>
      </div>

      {/* Hero */}
      <div style={{ height: 160, borderRadius: 14, background: deal.imagePlaceholderColor, display: "flex", alignItems: "flex-end", padding: 20, marginBottom: 20, position: "relative" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: "rgba(0,0,0,0.3)", color: "#fff" }}>{deal.category}</span>
          {deal.isFestival && <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: "#f59e0b", color: "#000" }}>{deal.festivalName}</span>}
          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: deal.status === "FUNDED" ? "#10b981" : "#3b82f6", color: "#fff" }}>{deal.status}</span>
        </div>
      </div>

      {/* Title + Vendor */}
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 6px" }}>{deal.title}</h1>
      <button onClick={() => navigate(`/group-buying/vendor/${deal.vendorId}`)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>by {deal.vendor}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 12, color: "#f59e0b" }}><Star size={12} style={{ fill: "#f59e0b" }} /> {deal.vendorRating}</span>
        <ChevronRight size={12} style={{ color: "var(--muted)" }} />
      </button>

      <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>{deal.description}</p>

      {/* Price Card */}
      <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: "#10b981" }}>₹{activeTier.pricePerUnit}</span>
          {deal.mrp && <span style={{ fontSize: 14, color: "var(--muted)", textDecoration: "line-through" }}>₹{deal.mrp}</span>}
          {deal.savings && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "rgba(16,185,129,0.1)", color: "#10b981" }}>Save {deal.savings}%</span>}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: "rgba(16,185,129,0.08)", color: "#059669" }}>{activeTier.label} Tier Active</span>

        {/* Tier Grid */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${deal.tiers.length}, 1fr)`, gap: 8, marginTop: 14 }}>
          {deal.tiers.map((t, i) => (
            <div key={i} style={{
              padding: "10px 8px", borderRadius: 10, textAlign: "center",
              border: `1px solid ${t.label === activeTier.label ? "#10b981" : "rgba(148,163,184,0.15)"}`,
              background: t.label === activeTier.label ? "rgba(16,185,129,0.06)" : "transparent",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: t.label === activeTier.label ? "#10b981" : "var(--muted)" }}>{t.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: t.label === activeTier.label ? "#10b981" : "var(--text)" }}>₹{t.pricePerUnit}</div>
              <div style={{ fontSize: 9, color: "var(--muted)" }}>{t.minQty}+ units</div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: 4 }}><Users size={14} style={{ color: "#3b82f6" }} /> {deal.currentParticipants} Neighbours Joined</span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Goal: {deal.targetParticipants}</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "rgba(148,163,184,0.1)", marginBottom: 8 }}>
          <div style={{ height: 8, borderRadius: 4, background: pct >= 100 ? "#10b981" : "#3b82f6", width: `${pct}%` }} />
        </div>
        {nextTier && (
          <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
            <CheckCircle2 size={12} style={{ color: "#f59e0b" }} />
            <strong style={{ color: "var(--text)" }}>{nextTier.minQty - deal.currentParticipants} more</strong> to unlock ₹{nextTier.pricePerUnit} ({nextTier.label})
          </div>
        )}
      </div>

      {/* Fulfillment & Pickup */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ background: "var(--card)", borderRadius: 12, border: "1px solid rgba(148,163,184,0.1)", padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> Timeline</div>
          <div style={{ fontSize: 12, color: "var(--text)", marginBottom: 4 }}>Ends in <strong>{daysLeft} days</strong></div>
          <div style={{ fontSize: 12, color: "var(--text)" }}>Delivery by <strong>{new Date(deal.deliveryDate).toLocaleDateString()}</strong></div>
        </div>
        <div style={{ background: "var(--card)", borderRadius: 12, border: "1px solid rgba(148,163,184,0.1)", padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> Pickup Points</div>
          {deal.pickupPoints.map(p => (
            <div key={p} style={{ fontSize: 12, color: "var(--text)", marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#10b981" }} /> {p}
            </div>
          ))}
        </div>
      </div>

      {/* Trust Strip */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { icon: Shield, label: "Escrow Protected", color: "#10b981" },
          { icon: Truck, label: "Community Delivery", color: "#3b82f6" },
          { icon: CheckCircle2, label: "Quality Verified", color: "#8b5cf6" },
        ].map(b => (
          <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: b.color }}>
            <b.icon size={12} /> {b.label}
          </div>
        ))}
      </div>

      {/* CTA */}
      <button onClick={() => navigate(`/group-buying/checkout/${deal.id}`)}
        style={{ width: "100%", padding: "14px 24px", borderRadius: 12, background: "#059669", color: "#fff", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <ShoppingCart size={18} /> Join Deal at ₹{activeTier.pricePerUnit}
      </button>
    </div>
  );
}
