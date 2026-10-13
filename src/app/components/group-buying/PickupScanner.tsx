import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ScanLine, CheckCircle2, XCircle, Package, MapPin, Clock } from "lucide-react";
import { groupBuyingService, type GroupOrder } from "../../../services/group-buying/groupBuyingService";

export function PickupScanner() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [result, setResult] = useState<{ valid: boolean; orderDetails?: GroupOrder } | null>(null);
  const [handoverDone, setHandoverDone] = useState(false);

  const handleVerify = () => {
    if (!token.trim()) return;
    setResult(groupBuyingService.verifyPickupToken(token));
    setHandoverDone(false);
  };

  const handleConfirmHandover = () => {
    if (result?.orderDetails) {
      groupBuyingService.confirmHandover(result.orderDetails.id);
      setHandoverDone(true);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px" }}>
      <button onClick={() => navigate("/group-buying")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ScanLine size={22} style={{ color: "#3b82f6" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>Staff Pickup Scanner</h1>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Verify token and confirm handover</p>
        </div>
      </div>

      {/* Token Input */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input value={token} onChange={e => setToken(e.target.value)} onKeyDown={e => e.key === "Enter" && handleVerify()}
          placeholder="Enter or scan QR token..."
          style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)", fontSize: 13, fontFamily: "monospace", boxSizing: "border-box" }} />
        <button onClick={handleVerify} style={{ padding: "12px 20px", borderRadius: 10, background: "#3b82f6", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
          <ScanLine size={14} /> Verify
        </button>
      </div>

      {/* Result */}
      {result && (
        <div style={{ background: "var(--card)", borderRadius: 14, border: `1.5px solid ${result.valid ? "#10b981" : "#ef4444"}`, padding: 24 }}>
          {result.valid && result.orderDetails ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <CheckCircle2 size={24} style={{ color: "#10b981" }} />
                <span style={{ fontSize: 16, fontWeight: 800, color: "#10b981" }}>Token Valid</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted)" }}>Order ID</span>
                  <span style={{ fontWeight: 700, color: "var(--text)", fontFamily: "monospace" }}>{result.orderDetails.id}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted)" }}>Deal</span>
                  <span style={{ fontWeight: 700, color: "var(--text)" }}>{result.orderDetails.dealTitle}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted)" }}>Quantity</span>
                  <span style={{ fontWeight: 700, color: "var(--text)" }}>{result.orderDetails.quantity} unit(s)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted)" }}>Pickup Point</span>
                  <span style={{ fontWeight: 700, color: "var(--text)" }}>{result.orderDetails.pickupPoint}</span>
                </div>
              </div>

              {handoverDone ? (
                <div style={{ marginTop: 20, padding: 16, borderRadius: 10, background: "rgba(16,185,129,0.06)", textAlign: "center" }}>
                  <CheckCircle2 size={28} style={{ color: "#10b981", marginBottom: 6 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>Handover Confirmed</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Order marked as delivered.</div>
                </div>
              ) : (
                <button onClick={handleConfirmHandover} style={{ marginTop: 20, width: "100%", padding: "12px 20px", borderRadius: 10, background: "#10b981", color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 800 }}>
                  Confirm Handover
                </button>
              )}
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12 }}>
              <XCircle size={24} style={{ color: "#ef4444" }} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#ef4444" }}>Invalid Token</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>No matching order found. Please verify the code.</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
