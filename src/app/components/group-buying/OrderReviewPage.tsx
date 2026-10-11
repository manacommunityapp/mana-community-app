import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Star, CheckCircle2 } from "lucide-react";
import { groupBuyingService } from "../../../services/group-buying/groupBuyingService";

const HIGHLIGHT_TAGS = ["Great Quality", "Fast Delivery", "Good Packaging", "Value for Money", "Fresh Product", "Responsive Vendor", "Would Reorder"];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange(n)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
          <Star size={24} style={{ color: n <= value ? "#f59e0b" : "rgba(148,163,184,0.3)", fill: n <= value ? "#f59e0b" : "none" }} />
        </button>
      ))}
    </div>
  );
}

export function OrderReviewPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [dealRating, setDealRating] = useState(0);
  const [vendorRating, setVendorRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = () => {
    if (!orderId || dealRating === 0) return;
    groupBuyingService.submitReview({
      orderId, dealRating, vendorRating, tags, comment, createdAt: new Date().toISOString(),
    });
    setSubmitted(true);
    setTimeout(() => navigate("/group-buying/my-orders"), 2000);
  };

  if (submitted) return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: "60px 16px", textAlign: "center" }}>
      <CheckCircle2 size={64} style={{ color: "#10b981", marginBottom: 16 }} />
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>Review Submitted!</h2>
      <p style={{ fontSize: 13, color: "var(--muted)" }}>Thank you for your feedback.</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px" }}>
      <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>Leave a Review</h1>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 24 }}>Order: {orderId}</p>

      {/* Deal Rating */}
      <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Rate the Deal</div>
        <StarRating value={dealRating} onChange={setDealRating} />
      </div>

      {/* Vendor Rating */}
      <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Rate the Vendor</div>
        <StarRating value={vendorRating} onChange={setVendorRating} />
      </div>

      {/* Highlight Tags */}
      <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Highlights</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {HIGHLIGHT_TAGS.map(tag => (
            <button key={tag} onClick={() => toggleTag(tag)} style={{
              fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 20, cursor: "pointer",
              border: `1px solid ${tags.includes(tag) ? "#10b981" : "rgba(148,163,184,0.15)"}`,
              background: tags.includes(tag) ? "rgba(16,185,129,0.08)" : "transparent",
              color: tags.includes(tag) ? "#10b981" : "var(--muted)",
            }}>{tag}</button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Write a Review</div>
        <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Share your experience..."
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.15)", background: "transparent", color: "var(--text)", fontSize: 12, resize: "vertical", boxSizing: "border-box" }} />
      </div>

      <button onClick={handleSubmit} disabled={dealRating === 0} style={{ width: "100%", padding: "14px 24px", borderRadius: 12, background: dealRating === 0 ? "rgba(148,163,184,0.2)" : "#f59e0b", color: dealRating === 0 ? "var(--muted)" : "#000", border: "none", cursor: dealRating === 0 ? "not-allowed" : "pointer", fontSize: 15, fontWeight: 800 }}>
        Submit Review
      </button>
    </div>
  );
}
