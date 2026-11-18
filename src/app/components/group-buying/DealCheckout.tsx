import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, MapPin, Truck, CreditCard, Wallet, Shield, CheckCircle2, Package, Loader2,
} from "lucide-react";
import { groupBuyingService, type GroupDeal, type FulfillmentType, type PaymentMethod } from "../../../services/group-buying/groupBuyingService";
import { useAuth } from "../../../contexts/AuthContext";
import { useCashfree } from "../../../hooks/useCashfree";
import CashfreeCheckout from "../payments/CashfreeCheckout";
import { useCheckoutOptions } from "../../../hooks/payments/useCheckoutOptions";
import { PaymentGatewaySelector } from "../payments/PaymentGatewaySelector";

export function DealCheckout() {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deal, setDeal] = useState<GroupDeal | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("PICKUP");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [selectedGateway, setSelectedGateway] = useState<string>("");
  const [selectedManualMode, setSelectedManualMode] = useState<string | undefined>();
  const [pickupPoint, setPickupPoint] = useState("");
  const { options: checkoutOptions, loading: checkoutLoading, error: checkoutError, retry: retryCheckout } = useCheckoutOptions();
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const { status: cfStatus, order: cfOrder, error: cfError, initiatePayment, reset: resetCf } = useCashfree({
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => navigate("/group-buying/my-orders"), 2000);
    },
    onError: (err) => {
      setOrderError(err);
    },
  });

  useEffect(() => {
    if (dealId) {
      groupBuyingService.fetchDealById(dealId).then((d) => {
        if (d) { setDeal(d); if (d.pickupPoints?.[0]) setPickupPoint(d.pickupPoints[0]); }
      });
      const d = groupBuyingService.getDealById(dealId);
      if (d) { setDeal(d); if (d.pickupPoints?.[0]) setPickupPoint(d.pickupPoints[0]); }
    }
  }, [dealId]);

  if (!deal) return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
      <Package size={48} style={{ color: "var(--muted)" }} />
      <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>Deal not found</div>
    </div>
  );

  const activeTier = deal.tiers.find(t => deal.currentParticipants >= t.minQty && (t.maxQty === null || deal.currentParticipants <= t.maxQty)) || deal.tiers[0];
  const subtotal = (activeTier?.pricePerUnit ?? deal.currentTierPrice ?? 0) * quantity;
  const deliveryFee = fulfillment === "DELIVERY" ? 49 : 0;
  const platformFee = 0;
  const total = subtotal + deliveryFee + platformFee;

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      setOrderError(null);
      const order = await groupBuyingService.joinDeal(
        deal.id,
        quantity,
        user?.userId || "user-1",
        fulfillment,
        paymentMethod,
        pickupPoint
      );

      if (paymentMethod === "UPI" || paymentMethod === "CARD") {
        const refId = order.commerceOrderId ?? (typeof order.id === "number" ? order.id : Number(order.id));
        if (!refId || isNaN(refId)) {
          throw new Error("Unable to initiate payment: missing commerce order reference ID");
        }
        await initiatePayment({
          amount: total,
          referenceType: "GROUP_BUY_ORDER",
          referenceId: refId,
          description: `Group Buy Order: ${deal.title}`,
        });
      } else {
        setSuccess(true);
        setTimeout(() => navigate("/group-buying/my-orders"), 2000);
      }
    } catch (err: any) {
      setOrderError(err?.response?.data?.message || err?.message || "Failed to place group order");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: "60px 16px", textAlign: "center" }}>
      <CheckCircle2 size={64} style={{ color: "#10b981", marginBottom: 16 }} />
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>Order Confirmed!</h2>
      <p style={{ fontSize: 13, color: "var(--muted)" }}>Your group buying order has been placed. Check My Orders for your pickup QR code.</p>
    </div>
  );

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
        {checkoutLoading ? (
          <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
            Loading payment options…
          </div>
        ) : checkoutError || !checkoutOptions ? (
          <div className="text-sm text-red-600">
            {checkoutError ?? "Unable to load payment options"}
            <button type="button" onClick={retryCheckout} className="ml-2 underline text-violet-600 cursor-pointer">Retry</button>
          </div>
        ) : (
          <PaymentGatewaySelector
            options={checkoutOptions}
            selectedGateway={selectedGateway}
            selectedManualMode={selectedManualMode}
            onChange={(gw, mode) => {
              setSelectedGateway(gw);
              setSelectedManualMode(mode);
              // Map gateway to legacy paymentMethod for the existing flow
              if (gw === "MANUAL") setPaymentMethod("CASH" as PaymentMethod);
              else setPaymentMethod("UPI" as PaymentMethod);
            }}
          />
        )}
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

      {orderError && (
        <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fef2f2", color: "#dc2626", fontSize: 13, marginBottom: 14, border: "1px solid #fecaca" }}>
          {orderError}
        </div>
      )}

      <button
        disabled={submitting || cfStatus === "creating" || cfStatus === "checkout" || cfStatus === "verifying"}
        onClick={handleConfirm}
        style={{
          width: "100%", padding: "14px 24px", borderRadius: 12,
          background: submitting ? "#9ca3af" : "#059669",
          color: "#fff", border: "none",
          cursor: submitting ? "not-allowed" : "pointer",
          fontSize: 15, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}
      >
        {submitting && <Loader2 size={18} className="animate-spin" />}
        {submitting ? "Processing..." : `Confirm & Pay ₹${total}`}
      </button>

      <CashfreeCheckout
        visible={cfStatus !== "idle"}
        status={cfStatus}
        order={cfOrder}
        error={cfError}
        onDismiss={resetCf}
      />
    </div>
  );
}
