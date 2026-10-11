import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, AlertTriangle, Shield, CheckCircle2 } from "lucide-react";
import { groupBuyingService, type OrderDispute } from "../../../services/group-buying/groupBuyingService";

const CATEGORIES: { value: OrderDispute["category"]; label: string; desc: string }[] = [
  { value: "QUALITY", label: "Quality Issue", desc: "Product damaged or poor quality" },
  { value: "QUANTITY", label: "Quantity Mismatch", desc: "Received less than ordered" },
  { value: "WRONG_ITEM", label: "Wrong Item", desc: "Received a different product" },
  { value: "DELAYED", label: "Delayed Delivery", desc: "Significantly late delivery" },
  { value: "NOT_RECEIVED", label: "Not Received", desc: "Never received the order" },
];

export function OrderDisputePage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<OrderDispute["category"] | null>(null);
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!orderId || !category || !description.trim()) return;
    groupBuyingService.raiseDispute({
      orderId, category, description, escrowProtected: true,
    });
    setSubmitted(true);
    setTimeout(() => navigate("/group-buying/my-orders"), 2500);
  };

  if (submitted) return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: "60px 16px", textAlign: "center" }}>
      <CheckCircle2 size={64} style={{ color: "#10b981", marginBottom: 16 }} />
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>Dispute Raised</h2>
      <p style={{ fontSize: 13, color: "var(--muted)" }}>Our team will review and get back within 48 hours. Your payment is escrow-protected.</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px" }}>
      <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>Report an Issue</h1>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>Order: {orderId}</p>

      {/* Escrow Badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", marginBottom: 20 }}>
        <Shield size={16} style={{ color: "#10b981" }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>Escrow Protected</div>
          <div style={{ fontSize: 10, color: "var(--muted)" }}>Your payment is held safely until the issue is resolved</div>
        </div>
      </div>

      {/* Issue Category */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>What went wrong?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setCategory(c.value)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, cursor: "pointer", textAlign: "left",
              border: `1.5px solid ${category === c.value ? "#ef4444" : "rgba(148,163,184,0.15)"}`,
              background: category === c.value ? "rgba(239,68,68,0.04)" : "var(--card)",
            }}>
              <AlertTriangle size={18} style={{ color: category === c.value ? "#ef4444" : "var(--muted)", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: category === c.value ? "#ef4444" : "var(--text)" }}>{c.label}</div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>{c.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Describe the issue</div>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Please provide details about the problem..."
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)", fontSize: 12, resize: "vertical", boxSizing: "border-box" }} />
      </div>

      <button onClick={handleSubmit} disabled={!category || !description.trim()} style={{
        width: "100%", padding: "14px 24px", borderRadius: 12,
        background: !category || !description.trim() ? "rgba(148,163,184,0.2)" : "#ef4444",
        color: !category || !description.trim() ? "var(--muted)" : "#fff",
        border: "none", cursor: !category || !description.trim() ? "not-allowed" : "pointer",
        fontSize: 15, fontWeight: 800,
      }}>
        Raise Dispute
      </button>
    </div>
  );
}
