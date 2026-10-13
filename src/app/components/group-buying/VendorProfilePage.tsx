import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Star, Shield, CheckCircle2, Clock, Package, Award,
  FileCheck, ShoppingCart,
} from "lucide-react";
import { groupBuyingService, type VendorProfile } from "../../../services/group-buying/groupBuyingService";

export function VendorProfilePage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);

  useEffect(() => {
    if (vendorId) setVendor(groupBuyingService.getVendorProfile(vendorId) || null);
  }, [vendorId]);

  if (!vendor) return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
      <Package size={48} style={{ color: "var(--muted)" }} />
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginTop: 8 }}>Vendor not found</div>
      <button onClick={() => navigate("/group-buying")} style={{ marginTop: 12, padding: "8px 16px", borderRadius: 8, background: "var(--gold)", color: "#000", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Back</button>
    </div>
  );

  const SCORES = [
    { label: "On-Time Rate", value: `${vendor.onTimeRate}%`, color: "#10b981" },
    { label: "Quality Score", value: `${vendor.qualityScore}%`, color: "#3b82f6" },
    { label: "Response Time", value: vendor.responseTime, color: "#8b5cf6" },
    { label: "Total Orders", value: vendor.totalOrders.toString(), color: "#f59e0b" },
  ];

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px" }}>
      <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header */}
      <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 24, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(16,185,129,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShoppingCart size={24} style={{ color: "#10b981" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 2px" }}>{vendor.name}</h1>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{vendor.category}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 13, fontWeight: 700, color: "#f59e0b" }}><Star size={14} style={{ fill: "#f59e0b" }} /> {vendor.rating}</span>
              <span style={{ fontSize: 10, color: "var(--muted)" }}>Since {new Date(vendor.since).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
            </div>
          </div>
        </div>

        {/* Verification Badges */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {vendor.verified && <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: "rgba(16,185,129,0.08)", color: "#10b981" }}><Shield size={10} /> Verified</span>}
          {vendor.gstVerified && <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: "rgba(59,130,246,0.08)", color: "#3b82f6" }}><FileCheck size={10} /> GST Verified</span>}
          {vendor.fssaiVerified && <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: "rgba(139,92,246,0.08)", color: "#8b5cf6" }}><CheckCircle2 size={10} /> FSSAI</span>}
          {vendor.badges.map(b => (
            <span key={b} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: "rgba(245,158,11,0.08)", color: "#f59e0b" }}><Award size={10} /> {b}</span>
          ))}
        </div>
      </div>

      {/* Trust Scorecard */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 16 }}>
        {SCORES.map(s => (
          <div key={s.label} style={{ background: "var(--card)", borderRadius: 12, border: "1px solid rgba(148,163,184,0.1)", padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Product Catalog */}
      <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 14px" }}>Product Catalog</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {vendor.products.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "rgba(148,163,184,0.04)" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{p.name}</div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>per {p.unit}</div>
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#10b981" }}>₹{p.price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
