import React, { useState, useEffect } from "react";
import {
  Gavel,
  Zap,
  Plus,
  RefreshCw,
  Clock,
  Trophy,
  Flame,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  History,
  Edit3,
  Trash2,
  Loader2,
  Tag,
  DollarSign
} from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import {
  eventService,
  type EventAuctionItemResponse,
  type EventAuctionBidResponse,
  type EventAuctionStatsResponse,
  type EventAuctionItemRequest,
  type EventResponse,
} from "../../../services/events/eventService";
import { showError, showSuccess } from "../../../utils/ToastUtils";

const CATEGORIES = [
  { label: "All Categories", value: "ALL" },
  { label: "Prasadam & Offerings", value: "Prasadam", emoji: "🪔" },
  { label: "Clothing & Vastrams", value: "Clothing", emoji: "𥻻" },
  { label: "Jewellery & Padaraksha", value: "Jewellery", emoji: "🌸" },
  { label: "Rituals & Kalasha", value: "Ritual", emoji: "🥥" },
  { label: "Decor & Lighting", value: "Decor", emoji: "🌺" },
  { label: "Annadanam & Seva", value: "Seva", emoji: "🍛" },
  { label: "Sacred Souvenirs", value: "Souvenir", emoji: "🏺" },
];

const EMOJI_OPTIONS = ["🪔", "𥻻", "🌸", "🥥", "🌺", "🍛", "🏺", "👑", "🕉️", "🚩", "🔔", "🏆"];

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string; border: string }> = {
  LIVE: { bg: "bg-rose-50", text: "text-rose-600", dot: "bg-rose-500", label: "Live Bidding", border: "border-rose-200" },
  UPCOMING: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400", label: "Upcoming", border: "border-amber-200" },
  CLOSED: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", label: "Closed / Won", border: "border-slate-200" },
};

const emptyForm: EventAuctionItemRequest = {
  eventId: null,
  name: "",
  description: "",
  category: "Prasadam",
  basePrice: 5000,
  minIncrement: 500,
  imageEmoji: "🪔",
  status: "UPCOMING",
  sortOrder: 0,
};

export function EventsAuction() {
  const { useMock } = useEventMock();
  const [items, setItems] = useState<EventAuctionItemResponse[]>([]);
  const [stats, setStats] = useState<EventAuctionStatsResponse | null>(null);
  const [recentBids, setRecentBids] = useState<EventAuctionBidResponse[]>([]);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Bidding states
  const [expandedBidItemId, setExpandedBidItemId] = useState<number | null>(null);
  const [bidInputs, setBidInputs] = useState<Record<number, number>>({});
  const [placingBidId, setPlacingBidId] = useState<number | null>(null);

  // Modal: Create / Edit
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<EventAuctionItemResponse | null>(null);
  const [form, setForm] = useState<EventAuctionItemRequest>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Modal: Bid History
  const [historyItem, setHistoryItem] = useState<EventAuctionItemResponse | null>(null);
  const [historyBids, setHistoryBids] = useState<EventAuctionBidResponse[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load Active Events for selector
  useEffect(() => {
    eventService.getAll()
      .then((evts) => {
        const activeList = (evts || []).filter((e) => {
          const s = String(e.status || "").toUpperCase();
          return s !== "CANCELLED" && s !== "CLOSED" && s !== "ARCHIVED";
        });
        setEvents(activeList);
      })
      .catch(() => {});
  }, []);

  const loadData = () => {
    setLoading(true);
    setError("");

    Promise.all([
      eventService.getAuctionItems(selectedEventId || undefined),
      eventService.getRecentAuctionBids().catch(() => []),
      eventService.getAuctionStats(selectedEventId || undefined).catch(() => null),
    ])
      .then(([fetchedItems, fetchedRecentBids, fetchedStats]) => {
        setItems(fetchedItems || []);
        setRecentBids(fetchedRecentBids || []);
        setStats(fetchedStats);
      })
      .catch((err: any) => {
        setError(err?.message || "Failed to load live auction items from database.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [useMock, selectedEventId]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingItem(null);
    setForm({
      ...emptyForm,
      eventId: selectedEventId || (events.length > 0 ? events[0].id : null),
    });
    setFormError("");
    setShowModal(true);
  };

  // Open Edit Modal
  const openEditModal = (item: EventAuctionItemResponse) => {
    setEditingItem(item);
    setForm({
      eventId: item.eventId || null,
      name: item.name,
      description: item.description || "",
      category: item.category || "General",
      basePrice: item.basePrice || 0,
      minIncrement: item.minIncrement || 500,
      imageEmoji: item.imageEmoji || "🪔",
      imageUrl: item.imageUrl || "",
      status: item.status as any,
      sortOrder: item.sortOrder || 0,
    });
    setFormError("");
    setShowModal(true);
  };

  // Save (Create or Update) Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Item name is required.");
      return;
    }
    if (form.basePrice < 0) {
      setFormError("Base price cannot be negative.");
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      if (editingItem) {
        await eventService.updateAuctionItem(editingItem.id, form);
        showSuccess(`Auction item "${form.name}" updated successfully!`);
      } else {
        await eventService.createAuctionItem(form);
        showSuccess(`Auction item "${form.name}" created successfully!`);
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      setFormError(err?.message || "Failed to save auction item.");
    } finally {
      setSaving(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async (item: EventAuctionItemResponse) => {
    if (!window.confirm(`Are you sure you want to delete auction item "${item.name}"?`)) {
      return;
    }
    try {
      await eventService.deleteAuctionItem(item.id);
      showSuccess(`Auction item "${item.name}" deleted.`);
      loadData();
    } catch (err: any) {
      showError(err?.message || "Failed to delete auction item.");
    }
  };

  // Toggle Item Status (e.g. mark CLOSED or LIVE)
  const handleToggleStatus = async (item: EventAuctionItemResponse, newStatus: "UPCOMING" | "LIVE" | "CLOSED") => {
    try {
      await eventService.updateAuctionItem(item.id, {
        name: item.name,
        basePrice: item.basePrice,
        status: newStatus,
      });
      showSuccess(`Auction item status updated to ${newStatus}.`);
      loadData();
    } catch (err: any) {
      showError(err?.message || "Failed to update item status.");
    }
  };

  // Place Bid
  const handlePlaceBid = async (item: EventAuctionItemResponse, amount: number) => {
    const minInc = item.minIncrement || 500;
    const minRequired = item.bidCount === 0 || !item.currentBid || item.currentBid === 0
      ? item.basePrice
      : item.currentBid + minInc;

    if (amount < minRequired) {
      showError(`Minimum required bid amount is ₹${minRequired.toLocaleString("en-IN")}`);
      return;
    }

    try {
      setPlacingBidId(item.id);
      await eventService.placeAuctionBid(item.id, amount);
      showSuccess(`🎉 Bid of ₹${amount.toLocaleString("en-IN")} placed successfully on ${item.name}!`);
      setExpandedBidItemId(null);
      loadData();
    } catch (err: any) {
      showError(err?.message || "Failed to place bid.");
    } finally {
      setPlacingBidId(null);
    }
  };

  // Open Bid History
  const openBidHistory = async (item: EventAuctionItemResponse) => {
    setHistoryItem(item);
    setLoadingHistory(true);
    try {
      const bids = await eventService.getAuctionBids(item.id);
      setHistoryBids(bids || []);
    } catch (err: any) {
      showError("Could not load bid history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;
    if (selectedStatus !== "ALL" && item.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.leaderName && item.leaderName.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalRevenue = stats?.totalRevenue ?? items.reduce((a, b) => a + (Number(b.currentBid) || 0), 0);
  const liveCount = stats?.liveItemsCount ?? items.filter((i) => i.status === "LIVE").length;
  const totalBids = stats?.totalBidsCount ?? items.reduce((a, b) => a + (b.bidCount || 0), 0);
  const highestBid = items.reduce((max, i) => Math.max(max, Number(i.currentBid) || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                Community Festival & Event Auction
              </h2>
              <p className="text-xs text-slate-400">
                Live fundraising bids, holy prasadam offerings, deity vastrams, and festival sponsorships
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-600" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Auction Item
          </button>
        </div>
      </div>

      {/* Main Event Selection Filter Banner */}
      {events.length > 0 && (
        <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Target Festival / Event:</span>
          </div>
          <div className="flex items-center gap-2 flex-1 sm:max-w-md">
            <select
              value={selectedEventId === null ? "" : String(selectedEventId)}
              onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">All Community Events & Festivals</option>
              {events.map((ev) => (
                <option key={ev.id} value={String(ev.id)}>
                  {ev.title} {ev.startDate ? `(${ev.startDate}${ev.endDate && ev.endDate !== ev.startDate ? ` to ${ev.endDate}` : ""})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Real-time KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: "Total Raised", value: `₹${Number(totalRevenue).toLocaleString("en-IN")}`, icon: DollarSign, color: "#10b981", bg: "bg-emerald-50 text-emerald-600" },
          { label: "Live Items", value: liveCount, icon: Flame, color: "#ef4444", bg: "bg-rose-50 text-rose-600" },
          { label: "Total Bids Placed", value: totalBids, icon: Gavel, color: "#f59e0b", bg: "bg-amber-50 text-amber-600" },
          { label: "Highest Bid", value: `₹${Number(highestBid).toLocaleString("en-IN")}`, icon: Trophy, color: "#6366f1", bg: "bg-indigo-50 text-indigo-600" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-xl font-black text-slate-800 truncate">{s.value}</p>
              <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-xs">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {["ALL", "LIVE", "UPCOMING", "CLOSED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                selectedStatus === st
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "ALL" ? "All Items" : st === "LIVE" ? "🔴 Live" : st === "UPCOMING" ? "⏳ Upcoming" : "🏁 Closed"}
            </button>
          ))}
        </div>

        {/* Category & Search */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.emoji ? `${c.emoji} ` : ""}{c.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search items, leaders…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 w-full sm:w-44"
          />
        </div>
      </div>

      {/* Main Grid: Items + Live Feed Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Auction Items Grid */}
        <div className="lg:col-span-2 space-y-3">
          {loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-400 text-sm gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
              Loading live festival auction items…
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <p className="text-2xl">🪔</p>
              <p className="text-sm font-bold text-slate-700 mt-2">No auction items match your filters</p>
              <p className="text-xs text-slate-400 mt-1">Create an auction item to begin festival fundraising bidding.</p>
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700"
              >
                + Add First Item
              </button>
            </div>
          ) : (
            filteredItems.map((item) => {
              const ss = STATUS_CONFIG[item.status] || STATUS_CONFIG.UPCOMING;
              const isExpanded = expandedBidItemId === item.id;
              const minInc = item.minIncrement || 500;
              const nextMinBid = item.bidCount === 0 || !item.currentBid || item.currentBid === 0
                ? item.basePrice
                : Number(item.currentBid) + minInc;
              const inputBidAmount = bidInputs[item.id] ?? nextMinBid;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                    item.status === "LIVE"
                      ? "border-amber-200/80 shadow-[0_4px_16px_rgba(245,158,11,0.08)]"
                      : "border-slate-100 shadow-xs"
                  }`}
                >
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Item Emoji / Avatar */}
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl sm:text-3xl shrink-0">
                      {item.imageEmoji || "🪔"}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <h3 className="font-extrabold text-slate-800 text-sm sm:text-base leading-snug">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              {item.category || "General"}
                            </span>
                            {item.eventTitle && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                                📅 {item.eventTitle}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              {item.bidCount} {item.bidCount === 1 ? "bid" : "bids"}
                            </span>
                            {item.leaderName && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                                👑 High Bidder: {item.leaderName}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${ss.bg} ${ss.text} ${ss.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${ss.dot} ${item.status === "LIVE" ? "animate-ping" : ""}`} />
                            {ss.label}
                          </span>
                        </div>
                      </div>

                      {/* Pricing Bar */}
                      <div className="flex items-center gap-4 sm:gap-6 mt-3 pt-3 border-t border-slate-100 flex-wrap">
                        <div>
                          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide">Base Price</p>
                          <p className="font-bold text-slate-700 text-xs sm:text-sm">₹{Number(item.basePrice).toLocaleString("en-IN")}</p>
                        </div>

                        <div className="h-7 w-px bg-slate-200/70" />

                        <div>
                          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide">Current Highest Bid</p>
                          <p className="font-black text-emerald-600 text-sm sm:text-lg">
                            {Number(item.currentBid) > 0 ? `₹${Number(item.currentBid).toLocaleString("en-IN")}` : "No bids yet"}
                          </p>
                        </div>

                        <div className="h-7 w-px bg-slate-200/70 hidden sm:block" />

                        <div className="hidden sm:block">
                          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide">Min Increment</p>
                          <p className="font-semibold text-slate-600 text-xs">+₹{Number(minInc).toLocaleString("en-IN")}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="ml-auto flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openBidHistory(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="View Bids History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Edit Item"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {item.status === "LIVE" ? (
                            <button
                              type="button"
                              onClick={() => setExpandedBidItemId(isExpanded ? null : item.id)}
                              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-xs transition-all cursor-pointer"
                            >
                              <Gavel className="w-3.5 h-3.5" /> Place Bid
                            </button>
                          ) : item.status === "UPCOMING" ? (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(item, "LIVE")}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all cursor-pointer"
                            >
                              Start Bidding
                            </button>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-400 px-2 py-1 bg-slate-100 rounded-lg">
                              Closed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Live Bid Placement Drawer */}
                  {isExpanded && item.status === "LIVE" && (
                    <div className="border-t border-amber-200/60 bg-amber-50/40 p-4 sm:p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-amber-600" /> Enter Bid Amount for {item.name}
                        </span>
                        <span className="text-[11px] font-bold text-amber-700">
                          Next Minimum Bid: ₹{nextMinBid.toLocaleString("en-IN")}
                        </span>
                      </div>

                      {/* Quick preset increments */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Quick Add:</span>
                        {[500, 1000, 2000, 5000, 10000].map((inc) => {
                          const calculated = Math.max(nextMinBid, (Number(item.currentBid) || item.basePrice) + inc);
                          return (
                            <button
                              key={inc}
                              type="button"
                              onClick={() => setBidInputs({ ...bidInputs, [item.id]: calculated })}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs"
                            >
                              +₹{inc.toLocaleString("en-IN")}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex gap-2 items-center">
                        <div className="flex-1 flex items-center gap-2 px-3.5 py-2 rounded-xl border border-amber-300 bg-white shadow-2xs">
                          <span className="text-slate-400 font-bold text-sm">₹</span>
                          <input
                            type="number"
                            min={nextMinBid}
                            step={minInc}
                            value={inputBidAmount}
                            onChange={(e) => setBidInputs({ ...bidInputs, [item.id]: Number(e.target.value) })}
                            className="w-full border-0 outline-none text-slate-900 font-black text-sm bg-transparent"
                            placeholder={String(nextMinBid)}
                          />
                        </div>
                        <button
                          type="button"
                          disabled={placingBidId === item.id || inputBidAmount < nextMinBid}
                          onClick={() => handlePlaceBid(item, inputBidAmount)}
                          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          {placingBidId === item.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4" /> Confirm Bid
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedBidItemId(null)}
                          className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar: Live Bid Feed & Top Leaderboard */}
        <div className="space-y-4">
          {/* Live Recent Bids Feed */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="px-4 py-3.5 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">Live Recent Bids</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">{recentBids.length} records</span>
            </div>

            <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
              {recentBids.length === 0 ? (
                <p className="text-xs text-slate-400 p-4 text-center">No bids recorded yet.</p>
              ) : (
                recentBids.map((b) => (
                  <div key={b.id} className="p-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{b.bidderName}</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {b.itemName} {b.timeAgo ? `· ${b.timeAgo}` : ""}
                      </p>
                    </div>
                    <span className="text-xs font-black text-emerald-600 shrink-0">
                      ₹{Number(b.amount).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Leaderboard */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="px-4 py-3.5 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">Top Donors & Bidders</h3>
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              {(!stats?.leaderboard || stats.leaderboard.length === 0) ? (
                <p className="text-xs text-slate-400 p-4 text-center">Leaderboard will appear as bids are placed.</p>
              ) : (
                stats.leaderboard.map((l) => (
                  <div key={l.rank} className="p-3 flex items-center gap-3 hover:bg-slate-50/70 transition-colors">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        l.rank === 1
                          ? "bg-amber-400 text-white shadow-xs"
                          : l.rank === 2
                          ? "bg-slate-300 text-slate-800"
                          : l.rank === 3
                          ? "bg-amber-700/60 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {l.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{l.name}</p>
                      <p className="text-[10px] text-slate-400">{l.bidCount} bids placed</p>
                    </div>
                    <p className="text-xs font-black text-amber-600 shrink-0">
                      ₹{Number(l.totalAmount).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Create / Edit Auction Item */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  {editingItem ? "Edit Auction Item" : "Create New Auction Item"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
                </div>
              )}

              {/* Item Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Item / Seva Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ganesh Maha Laddu (21 kg)"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* Category & Emoji */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={form.category || "Prasadam"}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  >
                    {CATEGORIES.filter((c) => c.value !== "ALL").map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.emoji ? `${c.emoji} ` : ""}{c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Icon / Emoji</label>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={form.imageEmoji || "🪔"}
                      onChange={(e) => setForm({ ...form, imageEmoji: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    >
                      {EMOJI_OPTIONS.map((em) => (
                        <option key={em} value={em}>{em} Emoji</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Base Price & Min Increment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    required
                    value={form.basePrice}
                    onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Increment (₹)</label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    value={form.minIncrement || 500}
                    onChange={(e) => setForm({ ...form, minIncrement: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Parent Event & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Parent Event</label>
                  <select
                    value={form.eventId ? String(form.eventId) : ""}
                    onChange={(e) => setForm({ ...form, eventId: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  >
                    <option value="">No specific event</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={String(ev.id)}>{ev.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status || "UPCOMING"}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  >
                    <option value="UPCOMING">Upcoming</option>
                    <option value="LIVE">Live Bidding</option>
                    <option value="CLOSED">Closed / Won</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Spiritual Significance</label>
                <textarea
                  rows={2}
                  placeholder="Sacred prasadam blessed during Maha Aarti…"
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {editingItem ? "Update Item" : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Item Bid History */}
      {historyItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{historyItem.imageEmoji || "🪔"}</span>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{historyItem.name}</h3>
                  <p className="text-[10px] text-slate-400">Complete Bid History</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto divide-y divide-slate-50">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" /> Loading bid history…
                </div>
              ) : historyBids.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No bids have been placed on this item yet.</p>
              ) : (
                historyBids.map((b, idx) => (
                  <div key={b.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${idx === 0 ? "bg-amber-400 text-white" : "bg-slate-100 text-slate-600"}`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{b.bidderName}</p>
                        <p className="text-[10px] text-slate-400">{b.timeAgo || b.bidAt}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-black ${idx === 0 ? "text-emerald-600 text-sm font-extrabold" : "text-slate-700"}`}>
                      ₹{Number(b.amount).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
