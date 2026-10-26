import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ShoppingBag, TrendingUp, Clock, Zap, Gift, RotateCcw, Users, BarChart3,
  Search, Sparkles, ShoppingCart, Star, ChevronRight, Package, CalendarHeart,
} from "lucide-react";
import { groupBuyingService, type GroupDeal } from "../../../services/group-buying/groupBuyingService";

const HUB_TILES = [
  { icon: ShoppingBag, label: "All Deals", path: "deals", color: "#10b981", desc: "Browse active deals" },
  { icon: Zap, label: "Almost Unlocked", path: "almost-unlocked", color: "#f59e0b", desc: "Deals near next tier" },
  { icon: Gift, label: "Festival Deals", path: "festival-deals", color: "#ef4444", desc: "Seasonal campaigns" },
  { icon: CalendarHeart, label: "Monthly Baskets", path: "monthly-baskets", color: "#8b5cf6", desc: "Recurring bundles" },
  { icon: RotateCcw, label: "Buy Again", path: "buy-again", color: "#06b6d4", desc: "Reorder past items" },
  { icon: Users, label: "Buying Groups", path: "buying-groups", color: "#3b82f6", desc: "Tower/block circles" },
  { icon: BarChart3, label: "Savings Dashboard", path: "savings", color: "#16a34a", desc: "Community analytics" },
  { icon: Sparkles, label: "AI Search", path: "ai-search", color: "#ec4899", desc: "Smart product finder" },
  { icon: Package, label: "My Orders", path: "my-orders", color: "#64748b", desc: "Track & manage" },
  { icon: TrendingUp, label: "Demand Board", path: "demand-board", color: "#a855f7", desc: "Request products" },
];

function DealMiniCard({ deal, onClick }: { deal: GroupDeal; onClick: () => void }) {
  const activeTier = deal.tiers.find(t => deal.currentParticipants >= t.minQty && (t.maxQty === null || deal.currentParticipants <= t.maxQty)) || deal.tiers[0];
  const pct = Math.min(100, Math.round((deal.currentParticipants / deal.targetParticipants) * 100));
  return (
    <button onClick={onClick} style={{ padding: 14, borderRadius: 12, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)", cursor: "pointer", textAlign: "left", minWidth: 220 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: deal.imagePlaceholderColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShoppingCart size={16} style={{ color: "#fff" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deal.title}</div>
          <div style={{ fontSize: 10, color: "var(--muted)" }}>{deal.vendor}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: "#10b981" }}>₹{activeTier.pricePerUnit}</span>
        {deal.mrp && <span style={{ fontSize: 10, color: "var(--muted)", textDecoration: "line-through" }}>₹{deal.mrp}</span>}
      </div>
      <div style={{ height: 4, borderRadius: 2, background: "rgba(148,163,184,0.1)", marginBottom: 4 }}>
        <div style={{ height: 4, borderRadius: 2, background: "#10b981", width: `${pct}%`, transition: "width 0.3s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--muted)" }}>
        <span>{deal.currentParticipants}/{deal.targetParticipants} joined</span>
        <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Clock size={8} />{Math.max(1, Math.ceil((new Date(deal.endDate).getTime() - Date.now()) / 86400000))}d left</span>
      </div>
    </button>
  );
}

export function GroupBuyingHub() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [trending, setTrending] = useState<GroupDeal[]>([]);
  const [endingSoon, setEndingSoon] = useState<GroupDeal[]>([]);
  const [almostUnlocked, setAlmostUnlocked] = useState<GroupDeal[]>([]);
  const savings = groupBuyingService.getCommunitySavings();

  useEffect(() => {
    setTrending(groupBuyingService.getTrendingDeals());
    setEndingSoon(groupBuyingService.getEndingSoonDeals());
    setAlmostUnlocked(groupBuyingService.getAlmostUnlockedDeals());
  }, []);

  const handleSearch = () => {
    if (search.trim()) navigate(`/group-buying/deals?search=${encodeURIComponent(search)}`);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #059669, #0d9488, #0891b2)", borderRadius: 16, padding: "24px 28px", marginBottom: 20, color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <ShoppingBag size={28} style={{ color: "#a7f3d0" }} />
          <div>
            <h4 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Mana Group Buying</h4>
            <p style={{ fontSize: 12, margin: 0, opacity: 0.85 }}>Unlock bulk discounts with your community</p>
          </div>
        </div>
        {/* Search */}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.5)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search deals, products, vendors..."
              style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <button onClick={handleSearch} style={{ padding: "10px 18px", borderRadius: 10, background: "#fff", color: "#059669", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Search</button>
        </div>
        {/* Stats ribbon */}
        <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, opacity: 0.9 }}>💰 ₹{(savings.totalSaved / 1000).toFixed(0)}K saved</span>
          <span style={{ fontSize: 11, opacity: 0.9 }}>📦 {savings.ordersCompleted} orders</span>
          <span style={{ fontSize: 11, opacity: 0.9 }}>🔥 {savings.activeDeals} active deals</span>
          <span style={{ fontSize: 11, opacity: 0.9 }}>📊 {savings.avgSavingsPercent}% avg savings</span>
        </div>
      </div>

      {/* Quick Nav Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
        {HUB_TILES.map(tile => (
          <button key={tile.path} onClick={() => navigate(`/group-buying/${tile.path}`)}
            style={{ padding: "14px 10px", borderRadius: 12, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${tile.color}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
              <tile.icon size={18} style={{ color: tile.color }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{tile.label}</div>
            <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 2 }}>{tile.desc}</div>
          </button>
        ))}
      </div>

      {/* Trending Deals */}
      {trending.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <TrendingUp size={16} style={{ color: "#10b981" }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Trending Deals</span>
            </div>
            <button onClick={() => navigate("/group-buying/deals")} style={{ fontSize: 11, fontWeight: 600, color: "var(--gold)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {trending.map(d => <DealMiniCard key={d.id} deal={d} onClick={() => navigate(`/group-buying/deal/${d.id}`)} />)}
          </div>
        </div>
      )}

      {/* Ending Soon */}
      {endingSoon.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={16} style={{ color: "#f59e0b" }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Ending Soon</span>
            </div>
            <button onClick={() => navigate("/group-buying/deals")} style={{ fontSize: 11, fontWeight: 600, color: "var(--gold)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {endingSoon.map(d => <DealMiniCard key={d.id} deal={d} onClick={() => navigate(`/group-buying/deal/${d.id}`)} />)}
          </div>
        </div>
      )}

      {/* Almost Unlocked */}
      {almostUnlocked.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Zap size={16} style={{ color: "#f59e0b" }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Almost Unlocked — Join Now!</span>
            </div>
            <button onClick={() => navigate("/group-buying/almost-unlocked")} style={{ fontSize: 11, fontWeight: 600, color: "var(--gold)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {almostUnlocked.map(d => <DealMiniCard key={d.id} deal={d} onClick={() => navigate(`/group-buying/deal/${d.id}`)} />)}
          </div>
        </div>
      )}

      {trending.length === 0 && endingSoon.length === 0 && almostUnlocked.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--card)", borderRadius: 16, border: "1px solid rgba(148,163,184,0.12)", marginBottom: 24 }}>
          <ShoppingBag size={36} style={{ color: "var(--muted)", marginBottom: 12, display: "inline-block" }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>No Active Group Deals Right Now</div>
          <div style={{ fontSize: 12, color: "var(--muted)", maxWidth: 440, margin: "0 auto 16px" }}>
            New bulk buying campaigns from verified community vendors will appear here. You can also request deals on the Demand Board!
          </div>
          <button onClick={() => navigate("/group-buying/demand")} style={{ padding: "8px 18px", borderRadius: 10, background: "#059669", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
            Go to Demand Board
          </button>
        </div>
      )}
    </div>
  );
}
