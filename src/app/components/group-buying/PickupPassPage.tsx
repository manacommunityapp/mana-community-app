import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, QrCode, MapPin, Package, Clock, UserPlus, CheckCircle2 } from "lucide-react";
import { groupBuyingService, type PickupPass } from "../../../services/group-buying/groupBuyingService";

export function PickupPassPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [pass, setPass] = useState<PickupPass | null>(null);
  const [collectorName, setCollectorName] = useState("");
  const [collectorPhone, setCollectorPhone] = useState("");
  const [showAddCollector, setShowAddCollector] = useState(false);

  useEffect(() => {
    if (orderId) setPass(groupBuyingService.getPickupPass(orderId) || null);
  }, [orderId]);

  if (!pass) return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
      <Package size={48} style={{ color: "var(--muted)" }} />
      <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>Pickup pass not found</div>
      <button onClick={() => navigate("/group-buying/my-orders")} style={{ marginTop: 12, padding: "8px 16px", borderRadius: 8, background: "var(--gold)", color: "#000", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Back to Orders</button>
    </div>
  );

  const handleAddCollector = () => {
    if (!collectorName.trim() || !collectorPhone.trim()) return;
    setPass({ ...pass, authorizedCollectors: [...pass.authorizedCollectors, { name: collectorName, phone: collectorPhone }] });
    setCollectorName("");
    setCollectorPhone("");
    setShowAddCollector(false);
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: "24px 16px" }}>
      <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid rgba(148,163,184,0.1)", padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 6, display: "inline-block", marginBottom: 14, background: pass.status === "COLLECTED" ? "rgba(16,185,129,0.1)" : pass.status === "EXPIRED" ? "rgba(239,68,68,0.1)" : "rgba(139,92,246,0.1)", color: pass.status === "COLLECTED" ? "#10b981" : pass.status === "EXPIRED" ? "#ef4444" : "#8b5cf6" }}>
          {pass.status}
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>Digital Pickup Pass</h2>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 20px" }}>{pass.dealTitle}</p>

        {/* QR Code */}
        <div style={{ width: 180, height: 180, margin: "0 auto 14px", background: "rgba(148,163,184,0.06)", borderRadius: 16, border: "2px dashed rgba(148,163,184,0.2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <QrCode size={80} style={{ color: "var(--text)" }} />
          <span style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 700, color: "var(--muted)", marginTop: 8 }}>{pass.qrCode}</span>
        </div>

        <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 20 }}>Present this code at the pickup desk</p>

        {/* Details */}
        <div style={{ textAlign: "left", borderTop: "1px solid rgba(148,163,184,0.1)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}><Package size={12} /> Quantity</span>
            <span style={{ fontWeight: 700, color: "var(--text)" }}>{pass.quantity} unit(s)</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> Pickup Point</span>
            <span style={{ fontWeight: 700, color: "var(--text)" }}>{pass.pickupPoint}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> Pickup Date</span>
            <span style={{ fontWeight: 700, color: "var(--text)" }}>{new Date(pass.pickupDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Authorized Collectors */}
        <div style={{ textAlign: "left", borderTop: "1px solid rgba(148,163,184,0.1)", marginTop: 16, paddingTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>Authorized Collectors</span>
            <button onClick={() => setShowAddCollector(!showAddCollector)} style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 6, background: "rgba(59,130,246,0.08)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.15)", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
              <UserPlus size={10} /> Add
            </button>
          </div>

          {pass.authorizedCollectors.length === 0 && !showAddCollector && (
            <div style={{ fontSize: 11, color: "var(--muted)", padding: "8px 0" }}>Only you can collect. Add someone to delegate pickup.</div>
          )}

          {pass.authorizedCollectors.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: "rgba(148,163,184,0.04)", marginBottom: 6 }}>
              <CheckCircle2 size={12} style={{ color: "#10b981" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{c.name}</span>
              <span style={{ fontSize: 10, color: "var(--muted)" }}>{c.phone}</span>
            </div>
          ))}

          {showAddCollector && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              <input value={collectorName} onChange={e => setCollectorName(e.target.value)} placeholder="Name" style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)", fontSize: 12 }} />
              <input value={collectorPhone} onChange={e => setCollectorPhone(e.target.value)} placeholder="Phone number" style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)", fontSize: 12 }} />
              <button onClick={handleAddCollector} style={{ padding: "8px 16px", borderRadius: 8, background: "#3b82f6", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Authorize</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
