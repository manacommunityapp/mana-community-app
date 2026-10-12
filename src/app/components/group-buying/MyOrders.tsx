import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Package, Clock, MapPin, QrCode, Star, MessageSquare, AlertTriangle,
  CheckCircle2, Truck,
} from "lucide-react";
import { groupBuyingService, type GroupOrder } from "../../../services/group-buying/groupBuyingService";
import { useAuth } from "../../../contexts/AuthContext";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  CONFIRMED: { bg: "rgba(59,130,246,0.1)", text: "#3b82f6" },
  PROCESSING: { bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
  READY: { bg: "rgba(139,92,246,0.1)", text: "#8b5cf6" },
  DELIVERED: { bg: "rgba(16,185,129,0.1)", text: "#10b981" },
  CANCELLED: { bg: "rgba(239,68,68,0.1)", text: "#ef4444" },
};

export function MyOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<GroupOrder[]>([]);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => { setOrders(groupBuyingService.getMyOrders(user?.userId || "user-1")); }, [user]);

  const filtered = filter === "All" ? orders : orders.filter(o => o.status === filter);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <button onClick={() => navigate("/group-buying")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(100,116,139,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Package size={22} style={{ color: "#64748b" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>My Orders</h1>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>{orders.length} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {["All", "CONFIRMED", "PROCESSING", "READY", "DELIVERED"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            fontSize: 10, fontWeight: 700, padding: "5px 12px", borderRadius: 8,
            border: `1px solid ${filter === f ? "var(--gold)" : "rgba(148,163,184,0.15)"}`,
            background: filter === f ? "rgba(212,160,23,0.1)" : "transparent",
            color: filter === f ? "var(--gold)" : "var(--muted)", cursor: "pointer",
          }}>{f === "All" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)" }}>
          <Package size={32} style={{ color: "var(--muted)", marginBottom: 8 }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>No orders yet</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Join a group deal to start saving!</div>
          <button onClick={() => navigate("/group-buying/deals")} style={{ marginTop: 12, padding: "8px 20px", borderRadius: 8, background: "#059669", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Browse Deals</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(order => {
            const sc = STATUS_COLORS[order.status] || STATUS_COLORS.CONFIRMED;
            return (
              <div key={order.id} style={{ padding: 18, borderRadius: 14, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--muted)" }}>{order.id}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: sc.bg, color: sc.text }}>{order.status}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(148,163,184,0.06)", color: "var(--muted)" }}>{order.fulfillment}</span>
                  </div>
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>{new Date(order.orderedAt).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{order.dealTitle}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>
                  <span>Qty: {order.quantity}</span>
                  <span>₹{order.pricePerUnit}/unit</span>
                  {order.vendorName && <span>{order.vendorName}</span>}
                  {order.pickupPoint && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={10} />{order.pickupPoint}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#10b981" }}>₹{order.totalAmount}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {order.fulfillment === "PICKUP" && order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                      <button onClick={() => navigate(`/group-buying/pickup-pass/${order.id}`)} style={{ display: "flex", alignItems: "center", gap: 3, padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(139,92,246,0.2)", background: "rgba(139,92,246,0.05)", color: "#8b5cf6", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>
                        <QrCode size={12} /> Pickup Pass
                      </button>
                    )}
                    {order.status === "DELIVERED" && !order.reviewed && (
                      <button onClick={() => navigate(`/group-buying/review/${order.id}`)} style={{ display: "flex", alignItems: "center", gap: 3, padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.05)", color: "#f59e0b", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>
                        <Star size={12} /> Review
                      </button>
                    )}
                    <button onClick={() => navigate(`/group-buying/dispute/${order.id}`)} style={{ display: "flex", alignItems: "center", gap: 3, padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)", color: "#ef4444", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>
                      <AlertTriangle size={12} /> Issue
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
