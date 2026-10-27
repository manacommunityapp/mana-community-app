import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, CalendarHeart, Star, Users, Clock, CheckCircle2, ShoppingCart } from "lucide-react";
import { groupBuyingService, type MonthlyBasket } from "../../../services/group-buying/groupBuyingService";

export function MonthlyBaskets() {
  const navigate = useNavigate();
  const [baskets, setBaskets] = useState<MonthlyBasket[]>([]);
  const [joinedId, setJoinedId] = useState<string | null>(null);

  useEffect(() => { setBaskets(groupBuyingService.getMonthlyBaskets()); }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <button onClick={() => navigate("/group-buying")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(139,92,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CalendarHeart size={22} style={{ color: "#8b5cf6" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>Monthly Family Baskets</h1>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Curated recurring bundles — subscribe once, save every month</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {baskets.map(basket => (
          <div key={basket.id} style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", overflow: "hidden" }}>
            <div style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: basket.frequency === "WEEKLY" ? "rgba(59,130,246,0.1)" : "rgba(139,92,246,0.1)", color: basket.frequency === "WEEKLY" ? "#3b82f6" : "#8b5cf6" }}>
                  {basket.frequency}
                </span>
                <span style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 3 }}><Users size={10} />{basket.subscribers} subscribers</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>{basket.name}</h3>
              <p style={{ fontSize: 11, color: "var(--muted)", margin: "0 0 12px" }}>{basket.description}</p>

              {/* Items */}
              <div style={{ background: "rgba(148,163,184,0.04)", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                {basket.items.map((item, i) => {
                  const isStr = typeof item === "string";
                  const itemName = isStr ? item : item.name;
                  const itemQty = isStr ? "" : ` × ${item.qty}`;
                  const itemPrice = isStr ? "" : `₹${item.price}`;
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "4px 0", borderBottom: i < basket.items.length - 1 ? "1px solid rgba(148,163,184,0.06)" : "none" }}>
                      <span style={{ color: "var(--text)" }}>{itemName}{itemQty}</span>
                      {itemPrice ? <span style={{ color: "var(--muted)" }}>{itemPrice}</span> : null}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
                  {basket.vendor} <Star size={8} style={{ color: "#f59e0b", fill: "#f59e0b" }} /> {basket.vendorRating}
                </span>
                <span style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 3 }}>
                  <Clock size={9} /> Next: {new Date(basket.nextDelivery).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(148,163,184,0.1)", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#10b981" }}>₹{basket.totalPrice}<span style={{ fontSize: 10, fontWeight: 400, color: "var(--muted)" }}>/{basket.frequency === "WEEKLY" ? "wk" : "mo"}</span></span>
              {joinedId === basket.id ? (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#10b981" }}><CheckCircle2 size={14} /> Subscribed!</span>
              ) : (
                <button onClick={() => setJoinedId(basket.id)} style={{ padding: "8px 18px", borderRadius: 8, background: "#8b5cf6", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                  <ShoppingCart size={14} /> Subscribe
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
