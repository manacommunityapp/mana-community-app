import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, MapPin, Truck, CreditCard, Wallet, Shield, CheckCircle2, Package,
} from "lucide-react";
import { groupBuyingService, type GroupDeal, type FulfillmentType, type PaymentMethod } from "../../../services/group-buying/groupBuyingService";
import { useAuth } from "../../../contexts/AuthContext";

export function DealCheckout() {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deal, setDeal] = useState<GroupDeal | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("PICKUP");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [pickupPoint, setPickupPoint] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (dealId) {
      const d = groupBuyingService.getDealById(dealId);
      if (d) { setDeal(d); setPickupPoint(d.pickupPoints[0]); }
    }
  }, [dealId]);

  if (!deal) return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
      <Package size={48} style={{ color: "var(--muted)" }} />
      <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>Deal not found</div>
    </div>
  );

  const activeTier = deal.tiers.find(t => deal.currentParticipants >= t.minQty && (t.maxQty === null || deal.currentParticipants <= t.maxQty)) || deal.tiers[0];
  const subtotal = activeTier.pricePerUnit * quantity;
  const deliveryFee = fulfillment === "DELIVERY" ? 49 : 0;
  const platformFee = 0;
  const total = subtotal + deliveryFee + platformFee;

  const handleConfirm = () => {
    groupBuyingService.joinDeal(deal.id, quantity, user?.userId || "user-1", fulfillment, paymentMethod, pickupPoint);
    setSuccess(true);
    setTimeout(() => navigate("/group-buying/my-orders"), 2000);
  };

  if (success) return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: "60px 16px", textAlign: "center" }}>
      <CheckCircle2 size={64} style={{ color: "#10b981", marginBottom: 16 }} />
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>Order Confirmed!</h2>
      <p style={{ fontSize: 13, color: "var(--muted)" }}>Your group buying order has been placed. Check My Orders for your pickup QR code.</p>
    </div>
  );

  const PAYMENTS: { method: PaymentMethod; label: string; icon: typeof CreditCard; desc: string }[] = [
    { method: "UPI", label: "UPI", icon: Wallet, desc: "GPay, PhonePe, Paytm" },
    { method: "ESCROW", label: "Escrow", icon: Shield, desc: "Release on delivery" },
    { method: "CARD", label: "Card", icon: CreditCard, desc: "Debit / Credit card" },
  ];

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px" }}>
      <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back to Deal
      </button>

      <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>Checkout</h1>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>{deal.title}</p>

      {/* Quantity */}
      <div style={{ background: "var(--card)", borderRadius: 12, border: "1px solid rgba(148,163,184,0.1)", padding: 18, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Quantity</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(148,163,184,0.2)", background: "transparent", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>-</button>
          <span style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", minWidth: 32, textAlign: "center" }}>{quantity}</span>
          <button onClick={() => setQuantity(quantity + 1)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(148,163,184,0.2)", background: "transparent", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>+</button>
          <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 8 }}>× ₹{activeTier.pricePerUnit} ({activeTier.label} Tier)</span>
        </div>
      </div>

      {/* Fulfillment */}
      <div style={{ background: "var(--card)", borderRadius: 12, border: "1px solid rgba(148,163,184,0.1)", padding: 18, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Fulfillment</div>
        <div style={{ display: "flex", gap: 8 }}>
          {([
            { type: "PICKUP" as const, icon: MapPin, label: "Lobby Pickup", desc: "Free" },
            { type: "DELIVERY" as const, icon: Truck, label: "Home Delivery", desc: "₹49" },
          ]).map(f => (
            <button key={f.type} onClick={() => setFulfillment(f.type)} style={{
              flex: 1, padding: 12, borderRadius: 10, textAlign: "center", cursor: "pointer",
              border: `1.5px solid ${fulfillment === f.type ? "#10b981" : "rgba(148,163,184,0.15)"}`,
              background: fulfillment === f.type ? "rgba(16,185,129,0.06)" : "transparent",
            }}>
              <f.icon size={18} style={{ color: fulfillment === f.type ? "#10b981" : "var(--muted)", marginBottom: 4 }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: fulfillment === f.type ? "#10b981" : "var(--text)" }}>{f.label}</div>
              <div style={{ fontSize: 10, color: "var(--muted)" }}>{f.desc}</div>
            </button>
          ))}
        </div>
        {fulfillment === "PICKUP" && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>Select Pickup Point</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {deal.pickupPoints.map(p => (
                <button key={p} onClick={() => setPickupPoint(p)} style={{
                  fontSize: 11, fontWeight: 600, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                  border: `1px solid ${pickupPoint === p ? "#10b981" : "rgba(148,163,184,0.15)"}`,
                  background: pickupPoint === p ? "rgba(16,185,129,0.08)" : "transparent",
                  color: pickupPoint === p ? "#10b981" : "var(--muted)",
                }}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment */}
      <div style={{ background: "var(--card)", borderRadius: 12, border: "1px solid rgba(148,163,184,0.1)", padding: 18, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Payment Method</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PAYMENTS.map(p => (
            <button key={p.method} onClick={() => setPaymentMethod(p.method)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, cursor: "pointer",
              border: `1.5px solid ${paymentMethod === p.method ? "#3b82f6" : "rgba(148,163,184,0.15)"}`,
              background: paymentMethod === p.method ? "rgba(59,130,246,0.06)" : "transparent",
            }}>
              <p.icon size={18} style={{ color: paymentMethod === p.method ? "#3b82f6" : "var(--muted)" }} />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: paymentMethod === p.method ? "#3b82f6" : "var(--text)" }}>{p.label}</div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>{p.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Price Breakdown */}
      <div style={{ background: "var(--card)", borderRadius: 12, border: "1px solid rgba(148,163,184,0.1)", padding: 18, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Price Summary</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}><span>Subtotal ({quantity} × ₹{activeTier.pricePerUnit})</span><span>₹{subtotal}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}><span>Delivery Fee</span><span>{deliveryFee === 0 ? "Free" : `₹${deliveryFee}`}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}><span>Platform Fee</span><span>Free</span></div>
          <div style={{ height: 1, background: "rgba(148,163,184,0.15)", margin: "4px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, color: "var(--text)", fontSize: 16 }}><span>Total</span><span style={{ color: "#10b981" }}>₹{total}</span></div>
        </div>
      </div>

      <button onClick={handleConfirm} style={{ width: "100%", padding: "14px 24px", borderRadius: 12, background: "#059669", color: "#fff", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 800 }}>
        Confirm & Pay ₹{total}
      </button>
    </div>
  );
}
