import { useState, useEffect } from "react";
import { Gavel, Zap, ExternalLink } from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { Input } from "../ui/input";
import { auctionService } from "../../../services/sports/auctionService";
import type { AuctionConfigResponse, AuctionPlayer } from "../../../types/api";
import { useNavigate } from "react-router";

// Fallback mock items when no live backend auction is configured
const MOCK_ITEMS = [
  { id: 1, name: "Ganesh Laddu (21 kg)",      category: "Prasadam",  basePrice: 5000,  currentBid: 28000, bids: 12, leader: "Venkat R.",   status: "live",   image: "🪔" },
  { id: 2, name: "Pattu Vastram – Silk Dhoti", category: "Clothing",  basePrice: 3000,  currentBid: 11500, bids: 7,  leader: "Suresh K.",   status: "live",   image: "🥻" },
  { id: 3, name: "Silver Padaraksha (pair)",   category: "Jewellery", basePrice: 8000,  currentBid: 22000, bids: 9,  leader: "Ramesh M.",   status: "live",   image: "🌸" },
  { id: 4, name: "Gold-plated Coconut",        category: "Ritual",    basePrice: 4000,  currentBid: 15000, bids: 5,  leader: "Anitha P.",   status: "live",   image: "🥥" },
  { id: 5, name: "Flower Decoration Lot A",    category: "Decor",     basePrice: 2000,  currentBid: 8500,  bids: 6,  leader: "Kiran D.",    status: "upcoming", image: "🌺" },
  { id: 6, name: "Annadanam – Full Day",       category: "Seva",      basePrice: 25000, currentBid: 0,     bids: 0,  leader: "—",           status: "upcoming", image: "🍛" },
];

const bidHistory = [
  { bidder: "Venkat R.",  amount: 28000, time: "2m ago",  item: "Laddu"  },
  { bidder: "Suresh K.",  amount: 11500, time: "5m ago",  item: "Vastram"},
  { bidder: "Ramesh M.",  amount: 22000, time: "8m ago",  item: "Padaraksha"},
  { bidder: "Anitha P.",  amount: 15000, time: "11m ago", item: "Coconut"},
  { bidder: "Priya L.",   amount: 25000, time: "15m ago", item: "Padaraksha"},
  { bidder: "Deepak S.",  amount: 10000, time: "18m ago", item: "Vastram"},
];

const leaderboard = [
  { rank: 1, name: "Venkat R.",  total: "₹61,500", bids: 8 },
  { rank: 2, name: "Ramesh M.",  total: "₹48,000", bids: 5 },
  { rank: 3, name: "Anitha P.",  total: "₹38,500", bids: 6 },
  { rank: 4, name: "Suresh K.",  total: "₹27,000", bids: 4 },
  { rank: 5, name: "Priya L.",   total: "₹25,000", bids: 3 },
];

const statusStyle: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  live:     { bg: "bg-rose-50",    text: "text-rose-600",    dot: "bg-rose-500",    label: "Live"     },
  upcoming: { bg: "bg-amber-50",   text: "text-amber-600",   dot: "bg-amber-400",   label: "Upcoming" },
  closed:   { bg: "bg-slate-100",  text: "text-slate-500",   dot: "bg-slate-400",   label: "Closed"   },
};

export function EventsAuction() {
  const navigate = useNavigate();
  const { useMock } = useEventMock();
  const [bidItem, setBidItem] = useState<number | null>(null);
  const [auctionConfigs, setAuctionConfigs] = useState<AuctionConfigResponse[]>([]);
  const [livePlayers, setLivePlayers] = useState<AuctionPlayer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (useMock) return;
    setLoading(true);
    auctionService.getAllCommunityConfigs()
      .then((configs) => {
        setAuctionConfigs(configs || []);
        if (configs && configs.length > 0) {
          const active = configs.find(c => c.status === "LIVE" || c.status === "ACTIVE") || configs[0];
          return auctionService.getPlayers(active.id);
        }
        return [];
      })
      .then((players) => setLivePlayers(players || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [useMock]);

  // Combine real backend players with fallback items
  const items = !useMock && livePlayers.length > 0
    ? livePlayers.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category || p.role || "General",
        basePrice: p.basePrice || 1000,
        currentBid: p.soldPrice || p.basePrice || 0,
        bids: p.status === "SOLD" ? 1 : 0,
        leader: p.assignedTeam?.teamName || "—",
        status: p.status === "SELLING" ? "live" : p.status === "SOLD" ? "closed" : "upcoming",
        image: "🏆"
      }))
    : MOCK_ITEMS;

  const liveItems = items.filter(i => i.status === "live");
  const totalRevenue = items.reduce((a, i) => a + (i.currentBid || 0), 0);

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Action Banner to Sports Auction Center */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md">
        <div>
          <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
            <Gavel className="w-5 h-5" /> Live Sports & Community Auction Center
          </h3>
          <p className="text-xs sm:text-sm text-indigo-100 mt-0.5">
            Manage live bidding, team budgets, player pools, and real-time captain nominations.
          </p>
        </div>
        <button
          onClick={() => navigate("/sports")}
          className="px-4 py-2 bg-white text-indigo-700 rounded-xl font-extrabold text-xs sm:text-sm hover:bg-indigo-50 transition-all flex items-center gap-1.5 flex-shrink-0 shadow-sm"
        >
          Open Sports Center <ExternalLink className="w-4 h-4" />
        </button>
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: "Live Items",    value: liveItems.length,              color: "#ef4444" },
          { label: "Total Revenue", value: `₹${(totalRevenue/1000).toFixed(1)}K`, color: "#10b981" },
          { label: "Active Bidders",value: 28,                            color: "#6366f1" },
          { label: "Total Bids",    value: items.reduce((a,i) => a + i.bids, 0), color: "#4f46e5" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-2.5 sm:p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center">
            <p className="text-lg sm:text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 sm:mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Auction items */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-slate-800 px-1">Auction Items</h2>
          {items.map((item) => {
            const ss = statusStyle[item.status];
            const isOpen = bidItem === item.id;
            return (
              <div key={item.id}
                className="animate-fade-in-up bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-5">
                  <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-xl bg-indigo-50 flex items-center justify-center text-base sm:text-2xl flex-shrink-0">
                    {item.image}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-bold text-slate-800 text-sm sm:text-base">{item.name}</p>
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{item.category} · {item.bids} bids · Leader: {item.leader}</p>
                      </div>
                      <span className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0 ${ss.bg} ${ss.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${ss.dot}`} />
                        {ss.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3 flex-wrap">
                      <div>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wide">Base</p>
                        <p className="font-bold text-slate-600 text-sm sm:text-base">₹{item.basePrice.toLocaleString()}</p>
                      </div>
                      <div className="h-8 w-px bg-slate-100" />
                      <div>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wide">Current Bid</p>
                        <p className="font-black text-emerald-600 text-base sm:text-lg">
                          {item.currentBid > 0 ? `₹${item.currentBid.toLocaleString()}` : "—"}
                        </p>
                      </div>
                      {item.status === "live" && (
                        <button onClick={() => setBidItem(isOpen ? null : item.id)}
                          className="ml-auto flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all shadow-sm">
                          <Gavel className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Bid
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`border-t border-slate-100 bg-indigo-50/40 overflow-hidden transition-all duration-300 ease-out ${
                    isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0 border-t-0"
                  }`}
                >
                  <div className="p-5">
                    <p className="text-xs font-bold text-slate-500 mb-3">Enter your bid amount</p>
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 bg-white">
                        <span className="text-slate-400 font-bold">₹</span>
                        <Input type="number" defaultValue={item.currentBid + 500}
                          className="flex-1 border-0 outline-none text-slate-800 font-bold bg-transparent shadow-none focus-visible:ring-0 p-0" />
                      </div>
                      <button className="px-5 py-2.5 bg-indigo-500 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all shadow-sm flex items-center gap-1.5">
                        <Zap className="w-4 h-4" /> Place Bid
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">Minimum increment: ₹500</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar: bid feed + leaderboard */}
        <div className="space-y-5">
          {/* Live bid feed */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <h3 className="font-bold text-slate-800 text-sm">Live Bid Feed</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {bidHistory.map((b, i) => (
                <div key={i}
                  className="animate-fade-in-up flex items-center gap-3 px-3 sm:px-5 py-2 sm:py-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-300 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                    {b.bidder[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{b.bidder}</p>
                    <p className="text-[10px] text-slate-400">{b.item} · {b.time}</p>
                  </div>
                  <p className="text-xs font-black text-emerald-600 flex-shrink-0">₹{b.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">Top Bidders</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {leaderboard.map((l) => (
                <div key={l.rank} className="flex items-center gap-3 px-3 sm:px-5 py-2 sm:py-3">
                  <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0
                    ${l.rank === 1 ? "bg-amber-400 text-white" : l.rank === 2 ? "bg-slate-300 text-slate-700" : l.rank === 3 ? "bg-indigo-300 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {l.rank}
                  </span>
                  <p className="flex-1 text-sm font-semibold text-slate-700">{l.name}</p>
                  <p className="text-xs font-black text-indigo-600">{l.total}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
