import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, RotateCcw, TrendingDown, Clock, ShoppingCart } from "lucide-react";
import { groupBuyingService } from "../../../services/group-buying/groupBuyingService";

export function BuyAgain() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ReturnType<typeof groupBuyingService.getBuyAgainSuggestions>>([]);

  useEffect(() => { setItems(groupBuyingService.getBuyAgainSuggestions()); }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <button onClick={() => navigate("/group-buying")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(6,182,212,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <RotateCcw size={22} style={{ color: "#06b6d4" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>Buy Again</h1>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Reorder your past purchases — prices may have dropped!</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map(item => {
          const priceDrop = item.lastPrice - item.currentPrice;
          const dropPct = Math.round((priceDrop / item.lastPrice) * 100);
          return (
            <div key={item.dealId} style={{ padding: 18, borderRadius: 14, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ width: 52, height: 52, borderRadius: 10, background: "rgba(6,182,212,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ShoppingCart size={20} style={{ color: "#06b6d4" }} />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>{item.vendor} · {item.category}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--muted)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={10} />Last ordered {new Date(item.lastOrderDate).toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, justifyContent: "flex-end", marginBottom: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#10b981" }}>₹{item.currentPrice}</span>
                  <span style={{ fontSize: 12, color: "var(--muted)", textDecoration: "line-through" }}>₹{item.lastPrice}</span>
                </div>
                {priceDrop > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end", marginBottom: 8, fontSize: 10, fontWeight: 700, color: "#10b981" }}>
                    <TrendingDown size={10} /> ₹{priceDrop} cheaper ({dropPct}% off)
                  </div>
                )}
                <button onClick={() => navigate(`/group-buying/deals`)} style={{ padding: "6px 16px", borderRadius: 8, background: "#06b6d4", color: "#fff", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                  Reorder
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
