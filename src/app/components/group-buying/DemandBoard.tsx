import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, TrendingUp, ThumbsUp, Plus, Clock, ChevronRight } from "lucide-react";
import { groupBuyingService, type DemandItem } from "../../../services/group-buying/groupBuyingService";
import { useAuth } from "../../../contexts/AuthContext";

export function DemandBoard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<DemandItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Groceries");

  useEffect(() => { setItems(groupBuyingService.getDemandBoard()); }, []);

  const handleUpvote = (id: string) => {
    groupBuyingService.upvoteDemand(id);
    setItems([...groupBuyingService.getDemandBoard()]);
  };

  const handlePost = () => {
    if (!title.trim()) return;
    const newItem: DemandItem = {
      id: "dem-" + Date.now(), title, description: description || "Community requested group deal.",
      category, requestedBy: user?.fullName || "Resident", upvotes: 1,
      createdAt: new Date().toISOString(), status: "OPEN",
    };
    setItems([newItem, ...items]);
    setShowForm(false);
    setTitle("");
    setDescription("");
  };

  const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    OPEN: { bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
    MATCHED: { bg: "rgba(59,130,246,0.1)", text: "#3b82f6" },
    CONVERTED: { bg: "rgba(16,185,129,0.1)", text: "#10b981" },
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <button onClick={() => navigate("/group-buying")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back
      </button>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={22} style={{ color: "#a855f7" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>Demand Board</h1>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Request products and upvote what you want</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: "8px 16px", borderRadius: 8, background: "#a855f7", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
          <Plus size={14} /> Propose Product
        </button>
      </div>

      {/* Post Form */}
      {showForm && (
        <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(168,85,247,0.2)", padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Request a Group Deal</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Product name" style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "transparent", color: "var(--text)", fontSize: 12 }} />
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Category" style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "transparent", color: "var(--text)", fontSize: 12 }} />
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" rows={2} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "transparent", color: "var(--text)", fontSize: 12, resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "transparent", color: "var(--muted)", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Cancel</button>
              <button onClick={handlePost} style={{ flex: 1, padding: "8px 16px", borderRadius: 8, background: "#a855f7", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Post Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map(item => {
          const sc = STATUS_COLORS[item.status || "OPEN"];
          return (
            <div key={item.id} style={{ padding: 18, borderRadius: 14, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)", display: "flex", alignItems: "center", gap: 14 }}>
              <button onClick={() => handleUpvote(item.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(168,85,247,0.15)", background: "rgba(168,85,247,0.04)", cursor: "pointer", flexShrink: 0 }}>
                <ThumbsUp size={16} style={{ color: "#a855f7" }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: "#a855f7" }}>{item.upvotes}</span>
              </button>
              <div style={{ flex: 1, minWidth: 0, cursor: item.vendorOffers && item.vendorOffers.length > 0 ? "pointer" : "default" }} onClick={() => item.vendorOffers && item.vendorOffers.length > 0 && navigate(`/group-buying/demand/${item.id}`)}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "rgba(168,85,247,0.08)", color: "#a855f7" }}>{item.category}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: sc.bg, color: sc.text }}>{item.status}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{item.description}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 10, color: "var(--muted)", marginTop: 6 }}>
                  <span>{item.requestedBy}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={9} />{new Date(item.createdAt).toLocaleDateString()}</span>
                  {item.vendorOffers && item.vendorOffers.length > 0 && (
                    <span style={{ fontWeight: 700, color: "#3b82f6" }}>{item.vendorOffers.length} vendor offer(s)</span>
                  )}
                </div>
              </div>
              {item.vendorOffers && item.vendorOffers.length > 0 && (
                <ChevronRight size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
