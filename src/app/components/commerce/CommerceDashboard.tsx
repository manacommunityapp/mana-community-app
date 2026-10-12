import { useState } from "react";
import {
  ShoppingCart, Package, Truck, CheckCircle2, Clock, MapPin,
  Store, Tag, Filter, ChevronRight, Hash, ArrowRight, RefreshCw, Star,
} from "lucide-react";

const CHANNELS = ["All", "Group Buy", "Food", "Marketplace", "Deals", "Vendor"] as const;

const CHANNEL_COLORS: Record<string, { bg: string; text: string }> = {
  "Group Buy": { bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
  Food: { bg: "rgba(239,68,68,0.1)", text: "#ef4444" },
  Marketplace: { bg: "rgba(59,130,246,0.1)", text: "#3b82f6" },
  Deals: { bg: "rgba(16,185,129,0.1)", text: "#10b981" },
  Vendor: { bg: "rgba(139,92,246,0.1)", text: "#8b5cf6" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Ordered: { bg: "rgba(59,130,246,0.1)", text: "#3b82f6" },
  Processing: { bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
  Shipped: { bg: "rgba(139,92,246,0.1)", text: "#8b5cf6" },
  Delivered: { bg: "rgba(16,185,129,0.1)", text: "#10b981" },
  "Ready for Pickup": { bg: "rgba(236,72,153,0.1)", text: "#ec4899" },
};

const STATS = [
  { label: "Total Orders", value: "34", icon: Package },
  { label: "Active", value: "5", icon: Clock },
  { label: "Delivered", value: "27", icon: CheckCircle2 },
  { label: "Returns", value: "2", icon: RefreshCw },
];

const ORDERS = [
  { id: "ORD-2847", channel: "Group Buy", item: "Organic Fruit Basket", qty: 1, amount: "₹450", status: "Ready for Pickup", fulfillment: "Lobby Pickup", date: "Oct 11", seller: "FarmFresh Collective", pin: "4829" },
  { id: "ORD-2843", channel: "Food", item: "Lunch Box — Thali", qty: 2, amount: "₹320", status: "Processing", fulfillment: "Delivery", date: "Oct 11", seller: "Priya's Kitchen" },
  { id: "ORD-2839", channel: "Marketplace", item: "Study Table (Used)", qty: 1, amount: "₹3,500", status: "Ordered", fulfillment: "Lobby Pickup", date: "Oct 10", seller: "Rahul M. (B-204)" },
  { id: "ORD-2835", channel: "Deals", item: "Annual Water Purifier AMC", qty: 1, amount: "₹1,200", status: "Delivered", fulfillment: "Delivery", date: "Oct 8", seller: "AquaPure Services" },
  { id: "ORD-2830", channel: "Vendor", item: "Deep Cleaning Service", qty: 1, amount: "₹2,500", status: "Delivered", fulfillment: "On-site", date: "Oct 5", seller: "CleanPro India" },
  { id: "ORD-2825", channel: "Group Buy", item: "Rice — 25kg Sona Masoori", qty: 1, amount: "₹1,100", status: "Delivered", fulfillment: "Lobby Pickup", date: "Oct 3", seller: "Kisan Direct", pin: "7193" },
];

export function CommerceDashboard() {
  const [channel, setChannel] = useState<string>("All");
  const filtered = channel === "All" ? ORDERS : ORDERS.filter(o => o.channel === channel);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShoppingCart size={22} style={{ color: "#10b981" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>Mana Commerce</h1>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>All your orders in one place</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {STATS.map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)" }}>
            <s.icon size={14} style={{ color: "var(--gold)" }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{s.value}</span>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Channel Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {CHANNELS.map(c => (
          <button key={c} onClick={() => setChannel(c)} style={{
            fontSize: 11, fontWeight: 700, padding: "6px 14px", borderRadius: 8,
            border: `1px solid ${channel === c ? "var(--gold)" : "rgba(148,163,184,0.15)"}`,
            background: channel === c ? "rgba(212,160,23,0.1)" : "transparent",
            color: channel === c ? "var(--gold)" : "var(--muted)", cursor: "pointer",
          }}>{c}</button>
        ))}
      </div>

      {/* Orders */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)" }}>
            <Package size={32} style={{ color: "var(--muted)", margin: "0 auto 10px", opacity: 0.3 }} />
            <div style={{ fontSize: 13, color: "var(--muted)" }}>No orders in this channel</div>
          </div>
        ) : filtered.map(o => {
          const cc = CHANNEL_COLORS[o.channel] || CHANNEL_COLORS.Deals;
          const sc = STATUS_COLORS[o.status] || STATUS_COLORS.Ordered;
          return (
            <div key={o.id} style={{ padding: 16, borderRadius: 12, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "monospace" }}>{o.id}</span>
                  <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: cc.bg, color: cc.text }}>{o.channel}</span>
                  <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: sc.bg, color: sc.text }}>{o.status}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{o.item}</div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 3, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Store size={10} />{o.seller}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={10} />{o.date}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    {o.fulfillment === "Delivery" ? <Truck size={10} /> : <MapPin size={10} />}{o.fulfillment}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{o.amount}</div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>Qty: {o.qty}</div>
                {o.pin && o.status === "Ready for Pickup" && (
                  <button style={{ marginTop: 4, fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 6, background: "rgba(236,72,153,0.08)", color: "#ec4899", border: "1px solid rgba(236,72,153,0.2)", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                    <Hash size={10} /> PIN: {o.pin}
                  </button>
                )}
                {o.status === "Shipped" && (
                  <button style={{ marginTop: 4, fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 6, background: "rgba(139,92,246,0.08)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.2)", cursor: "pointer" }}>Track</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
