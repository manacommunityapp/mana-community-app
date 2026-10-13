import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, ThumbsUp, Star, Clock, Truck, CheckCircle2, Users, Package } from "lucide-react";
import { groupBuyingService, type DemandItem } from "../../../services/group-buying/groupBuyingService";

export function DemandDetail() {
  const { demandId } = useParams<{ demandId: string }>();
  const navigate = useNavigate();
  const [demand, setDemand] = useState<DemandItem | null>(null);
  const [acceptedVendor, setAcceptedVendor] = useState<string | null>(null);

  useEffect(() => {
    if (demandId) setDemand(groupBuyingService.getDemandById(demandId) || null);
  }, [demandId]);

  if (!demand) return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
      <Package size={48} style={{ color: "var(--muted)" }} />
      <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>Demand item not found</div>
    </div>
  );

  const handleAcceptOffer = (vendorId: string) => {
    groupBuyingService.acceptVendorOffer(demand.id, vendorId);
    setAcceptedVendor(vendorId);
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px" }}>
      <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header */}
      <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 24, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "rgba(168,85,247,0.1)", color: "#a855f7" }}>{demand.category}</span>
          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: demand.status === "CONVERTED" ? "rgba(16,185,129,0.1)" : demand.status === "MATCHED" ? "rgba(59,130,246,0.1)" : "rgba(245,158,11,0.1)", color: demand.status === "CONVERTED" ? "#10b981" : demand.status === "MATCHED" ? "#3b82f6" : "#f59e0b" }}>{demand.status}</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 6px" }}>{demand.title}</h1>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px", lineHeight: 1.5 }}>{demand.description}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "var(--muted)" }}>
          <span>Requested by {demand.requestedBy}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={10} />{new Date(demand.createdAt).toLocaleDateString()}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontWeight: 700, color: "#a855f7" }}><ThumbsUp size={10} />{demand.upvotes} interested</span>
        </div>
      </div>

      {/* Vendor Offers */}
      {demand.vendorOffers && demand.vendorOffers.length > 0 ? (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Vendor Offers ({demand.vendorOffers.length})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {demand.vendorOffers.map((offer, i) => (
              <div key={offer.vendorId} style={{ padding: 18, borderRadius: 14, background: "var(--card)", border: `1.5px solid ${i === 0 ? "#10b981" : "rgba(148,163,184,0.1)"}` }}>
                {i === 0 && <div style={{ fontSize: 9, fontWeight: 700, color: "#10b981", marginBottom: 8 }}>BEST MATCH</div>}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{offer.vendorName}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Star size={10} style={{ color: "#f59e0b", fill: "#f59e0b" }} />{offer.rating}</span>
                      <span>MOQ: {offer.moq}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Truck size={10} />{offer.deliveryDays}d delivery</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#10b981" }}>₹{offer.price}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginTop: 2 }}>
                      <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(148,163,184,0.1)" }}>
                        <div style={{ width: `${offer.score}%`, height: 4, borderRadius: 2, background: offer.score >= 85 ? "#10b981" : "#f59e0b" }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: offer.score >= 85 ? "#10b981" : "#f59e0b" }}>{offer.score}%</span>
                    </div>
                  </div>
                </div>

                {acceptedVendor === offer.vendorId ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "rgba(16,185,129,0.08)", color: "#10b981", fontWeight: 700, fontSize: 12 }}>
                    <CheckCircle2 size={14} /> Offer Accepted — Deal Created!
                  </div>
                ) : (
                  <button onClick={() => handleAcceptOffer(offer.vendorId)} disabled={!!acceptedVendor} style={{
                    width: "100%", padding: "8px 16px", borderRadius: 8,
                    background: acceptedVendor ? "rgba(148,163,184,0.1)" : "#059669",
                    color: acceptedVendor ? "var(--muted)" : "#fff",
                    border: "none", cursor: acceptedVendor ? "not-allowed" : "pointer",
                    fontSize: 12, fontWeight: 700,
                  }}>Accept Offer</button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: 32, background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)" }}>
          <Users size={32} style={{ color: "var(--muted)", marginBottom: 8 }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>No vendor offers yet</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Keep upvoting — vendors respond when demand is high enough!</div>
        </div>
      )}
    </div>
  );
}
