import {
  Search, Tag, MapPin, CheckCircle, Plus, X, Loader2, ImagePlus, ShoppingBag,
  MessageCircle, ChevronLeft, ChevronRight, Heart, Star, Sparkles, TrendingUp,
  ShieldCheck, Wrench, Home, Gift, HelpCircle, Utensils, Laptop, Car, BookOpen,
  ArrowUp, Zap, ShoppingCart, Clock, Check, SlidersHorizontal, Trash2, ArrowRight,
  Copy, Calendar, Info, Building2, CheckCircle2, ShieldAlert, QrCode, CreditCard,
  Wallet, Banknote, AlertTriangle, Eye, ArrowDownToLine, Users, Scale, BarChart3,
  Send, Percent, Flame, FileText, CheckSquare, Shield
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  listingService, wishlistService, moderationService, requestService, groupOrderService, disputeService, adminMarketplaceService, privacyService,
  type ListingResponse, type ListingRequest, type ReportedListingResponse, type ProductRequestItem, type GroupOrderItem, type DisputeItem, type MarketplaceAuditLog
} from "../../../services/marketplace/listingService";
import { useAuth } from "../../../contexts/AuthContext";
import { useChat } from "../../../contexts/ChatContext";
import { useCart, type DeliveryMethod, type PaymentMode } from "../../../contexts/CartContext";
import { CREATE_LISTING, VIEW_ADMIN } from "../../../constants/permissions";
import {
  USE_MOCK_DATA, MOCK_LISTINGS, MOCK_REPORTS, MOCK_REQUESTS, MOCK_GROUP_ORDERS,
  MOCK_DISPUTES, MOCK_AUDIT_LOGS, MOCK_FESTIVAL_ITEMS, MOCK_COUPONS, paginate
} from "./mockData";
import { showSuccess, showError } from "../../../utils/ToastUtils";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const categories = [
  "All", "Homemade Food", "Electronics", "Furniture", "Home Appliances", 
  "Fashion", "Books", "Sports", "Kids Items", "Vehicles", "Pets", "Plants", "Beauty", "Medical", "Services"
];

const transactionModes = [
  { value: "CHAT_ONLY", label: "Chat Only" },
  { value: "CHAT_CALL", label: "Chat & Call" },
  { value: "IN_APP_PAYMENT", label: "In-App Payment" },
];

function formatPrice(price: number, unit?: string): string {
  const formatted = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);
  return unit ? `${formatted} / ${unit}` : formatted;
}

export function Marketplace() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = new URLSearchParams(location.search).get("tab") || "dashboard";

  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "popular">("newest");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [showFilters, setShowFilters] = useState(false);

  const [listings, setListings] = useState<ListingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const { hasPermission, isAnyAdmin } = useAuth();
  const canCreate = hasPermission(CREATE_LISTING);

  const fetchListings = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      if (USE_MOCK_DATA) {
        let filtered = [...MOCK_LISTINGS];
        if (activeCategory !== "All") filtered = filtered.filter((l) => l.category === activeCategory);
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter((l) => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q));
        }
        if (minPrice !== "") {
          filtered = filtered.filter((l) => l.price >= Number(minPrice));
        }
        if (maxPrice !== "") {
          filtered = filtered.filter((l) => l.price <= Number(maxPrice));
        }

        // Sorting
        if (sortBy === "price_asc") {
          filtered.sort((a, b) => a.price - b.price);
        } else if (sortBy === "price_desc") {
          filtered.sort((a, b) => b.price - a.price);
        } else if (sortBy === "newest") {
          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        const data = paginate(filtered, pageNum, 12);
        setListings(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      } else {
        const data = await listingService.getListings(
          activeCategory !== "All" ? activeCategory : undefined,
          searchQuery || undefined,
          pageNum,
          12
        );
        let content = [...data.content];
        if (minPrice !== "") content = content.filter((l) => l.price >= Number(minPrice));
        if (maxPrice !== "") content = content.filter((l) => l.price <= Number(maxPrice));
        if (sortBy === "price_asc") content.sort((a, b) => a.price - b.price);
        if (sortBy === "price_desc") content.sort((a, b) => b.price - a.price);
        
        setListings(content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      }
    } catch {
      setListings([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery, sortBy, minPrice, maxPrice]);

  useEffect(() => {
    setPage(0);
  }, [activeCategory, searchQuery, sortBy, minPrice, maxPrice]);

  useEffect(() => {
    const timer = setTimeout(() => fetchListings(page), searchQuery ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchListings, page, searchQuery]);

  const handleCreated = () => {
    setShowCreate(false);
    setPage(0);
    fetchListings(0);
  };

  return (
    <div className="text-slate-900 dark:text-white font-sans space-y-6">

      {/* ── CONDITIONAL SUB-TAB VIEWS ── */}

      {activeTab === "requests" && <RequestsView />}
      {activeTab === "group-buying" && <GroupBuyingView />}
      {activeTab === "festivals" && <FestivalMarketplaceView />}
      {activeTab === "vendors" && <VendorsView />}
      {activeTab === "services" && <ServicesView />}
      {activeTab === "rentals" && <RentalsView />}
      {activeTab === "food" && <FoodView />}
      {activeTab === "deals" && <DealsView />}
      {activeTab === "cart" && <CartView />}
      {activeTab === "disputes" && <DisputesView />}
      {activeTab === "admin-hub" && (isAnyAdmin || hasPermission(VIEW_ADMIN)) && <MarketplaceAdminHub />}
      {activeTab === "moderation" && (isAnyAdmin || hasPermission(VIEW_ADMIN)) && <ModerationView />}

      {/* ── DEFAULT DASHBOARD & PRODUCTS VIEW ── */}
      {(activeTab === "dashboard" || activeTab === "products") && (
        <>
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 p-6 sm:p-10 text-white shadow-xl shadow-indigo-500/10">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-2 space-y-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-amber-300">
                  <Sparkles className="w-3.5 h-3.5" /> Community Marketplace
                </span>
                <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight">
                  Buy, Sell, Rent & Discover Local Services
                </h1>
                <p className="text-sm sm:text-base text-indigo-100 max-w-xl leading-relaxed">
                  Connect directly with verified neighbors. Browse homemade food, pre-loved items, equipment rentals, and neighborhood services.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  {canCreate && (
                    <button
                      onClick={() => setShowCreate(true)}
                      className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-slate-100 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Post Advertisement
                    </button>
                  )}
                  <button
                    onClick={() => navigate("/marketplace/donations")}
                    className="px-5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold text-xs sm:text-sm rounded-xl transition-all border border-white/20 cursor-pointer flex items-center gap-2"
                  >
                    <Gift className="w-4 h-4 text-pink-300" /> Donate Items
                  </button>
                </div>
              </div>

              {/* Hero Metric Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl text-center">
                  <div className="text-2xl font-black text-white">{totalElements || 2847}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 mt-1">Active Listings</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl text-center">
                  <div className="text-2xl font-black text-amber-300">156</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 mt-1">Verified Vendors</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl text-center">
                  <div className="text-2xl font-black text-emerald-300">89</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 mt-1">Services Bookable</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl text-center">
                  <div className="text-2xl font-black text-cyan-300">43</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 mt-1">Equipment Rentals</div>
                </div>
              </div>
            </div>
          </div>

          {/* Metric Stat Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex items-center gap-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-black text-slate-900 dark:text-white">2,847</div>
                <div className="text-[10px] font-semibold text-slate-400">Total Products</div>
              </div>
            </div>
            <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-black text-slate-900 dark:text-white">156</div>
                <div className="text-[10px] font-semibold text-slate-400">Verified Vendors</div>
              </div>
            </div>
            <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex items-center gap-3">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-black text-slate-900 dark:text-white">89</div>
                <div className="text-[10px] font-semibold text-slate-400">Services</div>
              </div>
            </div>
            <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex items-center gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-black text-slate-900 dark:text-white">28</div>
                <div className="text-[10px] font-semibold text-slate-400">Community Deals</div>
              </div>
            </div>
          </div>

          {/* Search, Sort & Multi-Facet Filter Bar */}
          <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter listings by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="newest">Newest Listed</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer",
                    showFilters || minPrice !== "" || maxPrice !== ""
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                      : "bg-slate-50 dark:bg-[#262644] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  )}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filters</span>
                  {(minPrice !== "" || maxPrice !== "") && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  )}
                </button>
              </div>
            </div>

            {/* Expandable Advanced Filters */}
            {showFilters && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Min Price (₹)</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Max Price (₹)</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => { setMinPrice(""); setMaxPrice(""); }}
                    className="w-full py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#262644] transition-all cursor-pointer"
                  >
                    Reset Filter
                  </button>
                </div>
              </div>
            )}

            {/* Category Chips */}
            <div className="pt-1">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0",
                      activeCategory === cat
                        ? "bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-500/20"
                        : "bg-slate-50 dark:bg-[#262644] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Listings Header */}
          <div className="flex items-center justify-between pt-2">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              {activeCategory === "All" ? "Featured Community Listings" : `${activeCategory} Listings`}
            </h2>
            <span className="text-xs font-medium text-slate-400">
              Showing {listings.length} of {totalElements} items
            </span>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 text-center p-6">
              <ShoppingBag className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">No listings found</p>
              <p className="text-slate-400 text-xs mt-1">Try adjusting your filters or be the first neighbor to post!</p>
              {canCreate && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-4 px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20"
                >
                  + Post Listing Now
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((item) => (
                  <ListingCard key={item.id} item={item} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <span className="text-xs font-bold text-slate-500">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {showCreate && <CreateListingModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  );
}

{/* ── 1. BUYER REQUESTS ("LOOKING FOR") VIEW ── */}

function RequestsView() {
  const { user } = useAuth();
  const { startConversation } = useChat();
  const [requests, setRequests] = useState<ProductRequestItem[]>(MOCK_REQUESTS);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProductRequestItem | null>(null);
  const [offerPrice, setOfferPrice] = useState<number | "">("");
  const [offerMessage, setOfferMessage] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);

  const [reqTitle, setReqTitle] = useState("");
  const [reqCategory, setReqCategory] = useState("Furniture");
  const [reqBudget, setReqBudget] = useState<number | "">("");
  const [reqNeededBy, setReqNeededBy] = useState("");
  const [reqDesc, setReqDesc] = useState("");

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle || !reqBudget) return;
    const newReq: ProductRequestItem = {
      id: Date.now(),
      title: reqTitle,
      category: reqCategory,
      description: reqDesc,
      budget: Number(reqBudget),
      neededBy: reqNeededBy || "Flexible",
      requester: {
        id: user?.userId ? Number(user.userId) : 100,
        fullName: user?.fullName || "Demo Resident",
        tower: "Tower A - 302",
        verified: true,
      },
      status: "OPEN",
      responsesCount: 0,
      createdAt: "Just now",
    };
    setRequests([newReq, ...requests]);
    showSuccess("Buyer request posted to community board!");
    setShowNewRequestModal(false);
    setReqTitle("");
    setReqBudget("");
    setReqNeededBy("");
    setReqDesc("");
  };

  const handleSendOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !offerPrice) return;
    setSubmittingOffer(true);
    setTimeout(() => {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? { ...r, responsesCount: r.responsesCount + 1, status: "RESPONDED" as const }
            : r
        )
      );
      startConversation(String(selectedRequest.requester.id));
      showSuccess(`Offer of ₹${offerPrice} sent to ${selectedRequest.requester.fullName}!`);
      setSubmittingOffer(false);
      setSelectedRequest(null);
      setOfferPrice("");
      setOfferMessage("");
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-[#202038] dark:to-[#262644] p-6 rounded-3xl border border-indigo-100 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-100/60 dark:bg-indigo-950/60 px-3 py-1 rounded-full">
            Resident "Looking For" Board
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">Community Buyer Requests</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mt-0.5">
            Can't find what you need in the catalog? Post a request with your budget and let neighbors offer what they have available.
          </p>
        </div>
        <button
          onClick={() => setShowNewRequestModal(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20 cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" /> Post a Request
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {requests.map((r) => (
          <div
            key={r.id}
            className="bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-full">
                  {r.category}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    r.status === "OPEN" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                  )}
                >
                  {r.status === "OPEN" ? "Open for Offers" : `${r.responsesCount} Offers Received`}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">{r.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{r.description}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#262644] rounded-2xl space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Budget:</span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400">Up to ₹{r.budget}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Needed By:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{r.neededBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Requested By:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    {r.requester.fullName} ({r.requester.tower})
                    {r.requester.verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedRequest(r)}
              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> I Have This / Make Offer
            </button>
          </div>
        ))}
      </div>

      {/* Post Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1E1E36] rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" /> Post What You're Looking For
              </h3>
              <button onClick={() => setShowNewRequestModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Item or Service Title *</label>
                <input
                  type="text"
                  required
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  placeholder="e.g. Baby Cot / Organic Jaggery / Physics Tutor"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white"
                  >
                    <option value="Furniture">Furniture</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Services">Services</option>
                    <option value="Rentals">Rentals</option>
                    <option value="Kids Items">Kids Items</option>
                    <option value="Books">Books</option>
                    <option value="Food">Food</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Max Budget (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={reqBudget}
                    onChange={(e) => setReqBudget(Number(e.target.value))}
                    placeholder="e.g. 2500"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Needed By Date</label>
                <input
                  type="date"
                  value={reqNeededBy}
                  onChange={(e) => setReqNeededBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Detailed Description & Preferences</label>
                <textarea
                  rows={3}
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  placeholder="Mention condition requirements, dimensions, or specific preferences..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewRequestModal(false)}
                  className="px-4 py-2 font-bold text-slate-500 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20"
                >
                  Publish Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Make Offer to Requester Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1E1E36] rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-500" /> Send Offer to Neighbor
              </h3>
              <button onClick={() => setSelectedRequest(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              For request: <span className="font-bold text-slate-900 dark:text-white">"{selectedRequest.title}"</span> (Budget: ₹{selectedRequest.budget})
            </p>
            <form onSubmit={handleSendOffer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Your Offered Price (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(Number(e.target.value))}
                  placeholder={`e.g. ${selectedRequest.budget}`}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Message / Item Condition Details</label>
                <textarea
                  rows={3}
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="e.g. I have this in excellent condition, can drop off at Tower A entrance..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 font-bold text-slate-500 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOffer}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20"
                >
                  {submittingOffer ? "Sending..." : "Send Price Offer & Open Chat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

{/* ── 2. COMMUNITY GROUP BUYING VIEW ── */}

function GroupBuyingView() {
  const { addItem } = useCart();
  const [campaigns, setCampaigns] = useState<GroupOrderItem[]>(MOCK_GROUP_ORDERS);
  const [joinModalItem, setJoinModalItem] = useState<GroupOrderItem | null>(null);
  const [joinQty, setJoinQty] = useState(1);

  const handleJoinOrder = () => {
    if (!joinModalItem) return;
    const activeTier = joinModalItem.tiers
      .filter((t) => joinModalItem.currentQuantity + joinQty >= t.minQuantity)
      .pop() || joinModalItem.tiers[0];

    addItem({
      id: `GROUP-${joinModalItem.id}`,
      title: `[Group Order] ${joinModalItem.title}`,
      price: activeTier.discountedPrice,
      category: joinModalItem.category,
      imageUrl: joinModalItem.imageUrl,
      sellerName: joinModalItem.supplierName,
      type: "PRODUCT",
    }, joinQty);

    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === joinModalItem.id
          ? {
              ...c,
              currentQuantity: c.currentQuantity + joinQty,
              participantsCount: c.participantsCount + 1,
              status: c.currentQuantity + joinQty >= c.targetQuantity ? ("MINIMUM_REACHED" as const) : c.status,
            }
          : c
      )
    );
    showSuccess(`Joined group order for ${joinQty} units at ₹${activeTier.discountedPrice}/unit!`);
    setJoinModalItem(null);
    setJoinQty(1);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-emerald-500/10">
        <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
          Community Bulk Orders
        </span>
        <h2 className="text-2xl sm:text-3xl font-black mt-2">Community Group Buying</h2>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mt-1 leading-relaxed">
          Order together with neighbors to unlock wholesale rates direct from organic farms, artisanal guilds, and bulk suppliers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {campaigns.map((c) => {
          const progressPercent = Math.min(100, Math.round((c.currentQuantity / c.targetQuantity) * 100));
          const activeTier = c.tiers.filter((t) => c.currentQuantity >= t.minQuantity).pop() || c.tiers[0];

          return (
            <div
              key={c.id}
              className="bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col justify-between"
            >
              <div className="relative h-52 bg-slate-100 dark:bg-[#262644]">
                <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-white/90 dark:bg-[#1E1E36]/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase text-emerald-600">
                  {c.category}
                </div>
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-300" /> Closes: {c.closesAt}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white leading-snug">{c.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">Supplier: <span className="font-bold text-slate-700 dark:text-slate-300">{c.supplierName}</span></p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">{c.description}</p>
                </div>

                {/* Tier Discount Breakdown */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Volume Discount Tiers</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {c.tiers.map((t, idx) => {
                      const isCurrentTier = activeTier.minQuantity === t.minQuantity;
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "p-2.5 rounded-2xl border text-center transition-all",
                            isCurrentTier
                              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold"
                              : "border-slate-200 dark:border-slate-700 text-slate-500"
                          )}
                        >
                          <div className="text-[10px] text-slate-400">{t.minQuantity}+ Units</div>
                          <div className="text-sm font-black text-slate-900 dark:text-white">₹{t.discountedPrice}</div>
                          {isCurrentTier && <div className="text-[9px] text-emerald-600 font-extrabold uppercase mt-0.5">Active Tier</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">
                      {c.currentQuantity} / {c.targetQuantity} units committed
                    </span>
                    <span className="text-emerald-600">{progressPercent}% unlocked ({c.participantsCount} neighbors)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-[#262644] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400">Regular: <del>₹{c.regularPrice}</del></span>
                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{activeTier.discountedPrice} / Unit</div>
                  </div>
                  <button
                    onClick={() => {
                      setJoinModalItem(c);
                      setJoinQty(1);
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <Users className="w-4 h-4" /> Join Group Order
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Join Modal */}
      {joinModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1E1E36] rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" /> Join Group Purchase
              </h3>
              <button onClick={() => setJoinModalItem(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs space-y-2">
              <p className="font-bold text-slate-900 dark:text-white">{joinModalItem.title}</p>
              <p className="text-slate-400">Select the quantity you want to reserve in this bulk shipment.</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-4 py-3 bg-slate-50 dark:bg-[#262644] rounded-2xl">
                <button
                  onClick={() => setJoinQty(Math.max(1, joinQty - 1))}
                  className="w-9 h-9 rounded-xl bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-base cursor-pointer"
                >
                  -
                </button>
                <span className="text-xl font-black px-4">{joinQty}</span>
                <button
                  onClick={() => setJoinQty(joinQty + 1)}
                  className="w-9 h-9 rounded-xl bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-base cursor-pointer"
                >
                  +
                </button>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setJoinModalItem(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleJoinOrder}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-500/20"
                >
                  Add to Cart & Commit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

{/* ── 3. FESTIVAL & EVENT MARKETPLACE VIEW ── */}

function FestivalMarketplaceView() {
  const { addItem } = useCart();
  const [selectedCat, setSelectedCat] = useState("All");

  const festivalCategories = ["All", "Pooja & Festivals", "Homemade Food"];
  const items = selectedCat === "All"
    ? MOCK_FESTIVAL_ITEMS
    : MOCK_FESTIVAL_ITEMS.filter((i) => i.category === selectedCat);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-orange-500/10">
        <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full flex items-center gap-1 w-fit">
          <Sparkles className="w-3.5 h-3.5" /> Event & Festival Specials
        </span>
        <h2 className="text-2xl sm:text-3xl font-black mt-2">Ganesh Chaturthi & Pooja Marketplace</h2>
        <p className="text-xs sm:text-sm text-orange-100 max-w-xl mt-1 leading-relaxed">
          Pre-order fresh flowers, pooja kits, authentic festive modaks and return gifts directly curated for upcoming community festivals.
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {festivalCategories.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCat(c)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
              selectedCat === c
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                : "bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-400"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col justify-between group hover:border-amber-400 transition-all"
          >
            <div className="relative h-48 bg-slate-100 dark:bg-[#262644] overflow-hidden">
              <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">
                {item.category}
              </div>
            </div>

            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-1">By: {item.seller.fullName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{item.description}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-base font-black text-amber-600 dark:text-amber-400">{formatPrice(item.price, item.priceUnit)}</div>
                <button
                  onClick={() => {
                    addItem({
                      id: item.id,
                      title: item.title,
                      price: item.price,
                      priceUnit: item.priceUnit,
                      category: item.category,
                      imageUrl: item.imageUrls[0],
                      sellerId: item.seller.id,
                      sellerName: item.seller.fullName,
                      type: "PRODUCT",
                    });
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5" /> Pre-Order
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

{/* ── 4. DISPUTE MANAGEMENT VIEW ── */}

function DisputesView() {
  const { isAnyAdmin, hasPermission } = useAuth();
  const isAdmin = isAnyAdmin || hasPermission(VIEW_ADMIN);
  const [disputes, setDisputes] = useState<DisputeItem[]>(MOCK_DISPUTES);
  const [showFileModal, setShowFileModal] = useState(false);

  const [orderNum, setOrderNum] = useState("ORD-9428-MC");
  const [reason, setReason] = useState<DisputeItem["reason"]>("DAMAGED_ITEM");
  const [claimAmount, setClaimAmount] = useState<number | "">(450);
  const [desc, setDesc] = useState("");

  const handleCreateDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !claimAmount) return;
    const newD: DisputeItem = {
      id: Date.now(),
      orderNumber: orderNum,
      orderId: 1,
      complainant: { id: 100, fullName: "Demo Resident", tower: "Tower A - 302" },
      respondent: { id: 103, fullName: "Merchant / Neighbor Seller" },
      reason,
      description: desc,
      claimAmount: Number(claimAmount),
      status: "OPEN",
      createdAt: "Just now",
    };
    setDisputes([newD, ...disputes]);
    showSuccess("Dispute ticket registered with society admin.");
    setShowFileModal(false);
    setDesc("");
  };

  const handleAdminAction = (id: number, action: "REFUND" | "DISMISS") => {
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: action === "REFUND" ? ("RESOLVED_REFUNDED" as const) : ("RESOLVED_DISMISSED" as const),
              adminNotes: action === "REFUND" ? `Refund of ₹${d.claimAmount} approved to resident wallet.` : "Dismissed after verification.",
            }
          : d
      )
    );
    showSuccess(action === "REFUND" ? "Refund approved and credited!" : "Dispute ticket dismissed.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-600" /> Marketplace Support & Disputes
          </h2>
          <p className="text-xs text-slate-400">File tickets for order handover issues, rental damage, or unfulfilled services.</p>
        </div>
        <button
          onClick={() => setShowFileModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> File a Dispute
        </button>
      </div>

      <div className="space-y-4">
        {disputes.map((d) => (
          <div
            key={d.id}
            className="bg-white dark:bg-[#1E1E36] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">{d.orderNumber}</span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#262644] text-slate-700 dark:text-slate-300">
                  {d.reason.replace(/_/g, " ")}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    d.status.includes("RESOLVED") ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                  )}
                >
                  {d.status.replace(/_/g, " ")}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-400">Claim Amount: ₹{d.claimAmount}</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{d.description}</p>
            {d.adminNotes && (
              <p className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 p-2.5 rounded-xl font-medium">
                Admin Resolution: {d.adminNotes}
              </p>
            )}

            {isAdmin && !d.status.includes("RESOLVED") && (
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleAdminAction(d.id, "DISMISS")}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-[#262644] rounded-xl cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => handleAdminAction(d.id, "REFUND")}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Approve Refund (₹{d.claimAmount})
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* File Dispute Modal */}
      {showFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1E1E36] rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-600" /> File a Marketplace Dispute
              </h3>
              <button onClick={() => setShowFileModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDispute} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Order Number *</label>
                <input
                  type="text"
                  required
                  value={orderNum}
                  onChange={(e) => setOrderNum(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Reason</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as DisputeItem["reason"])}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white"
                  >
                    <option value="DAMAGED_ITEM">Damaged Item</option>
                    <option value="SERVICE_NOT_COMPLETED">Service Not Completed</option>
                    <option value="WRONG_ITEM">Wrong Item Handed Over</option>
                    <option value="SELLER_NO_SHOW">Seller No Show</option>
                    <option value="DEPOSIT_DISPUTE">Rental Deposit Dispute</option>
                    <option value="OTHER">Other Issue</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Claim Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Detailed Description of Problem *</label>
                <textarea
                  rows={3}
                  required
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Explain what went wrong during handover or service execution..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFileModal(false)}
                  className="px-4 py-2 font-bold text-slate-500 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20"
                >
                  Submit Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

{/* ── 5. MARKETPLACE ADMIN HUB & AUDIT TRAIL ── */}

function MarketplaceAdminHub() {
  const [activeAdminTab, setActiveAdminTab] = useState<"metrics" | "safety" | "audit" | "privacy">("metrics");
  const [auditLogs] = useState<MarketplaceAuditLog[]>(MOCK_AUDIT_LOGS);
  const [safetyRules, setSafetyRules] = useState([
    { id: 1, name: "Prohibit Weapons & Firearm Replicas", enabled: true, category: "Safety" },
    { id: 2, name: "Prohibit Hazardous Fireworks & Flammables", enabled: true, category: "Safety" },
    { id: 3, name: "Mandatory Gate Pass OTP for Deliveries over ₹500", enabled: true, category: "Security" },
    { id: 4, name: "Auto-Flag Listings with Negative Price Gouging (>300% MRP)", enabled: true, category: "Fair Pricing" },
    { id: 5, name: "Require Police-Verification Document for Service Technicians", enabled: true, category: "Vendors" },
  ]);

  const toggleRule = (id: number) => {
    setSafetyRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
    showSuccess("Safety policy rule updated.");
  };

  const handlePrivacyRequest = () => {
    showSuccess("Data anonymization and retention audit initiated successfully.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" /> Marketplace Administration & Governance
          </h2>
          <p className="text-xs text-slate-400">Oversee society commerce, category restrictions, audit trails, and data privacy.</p>
        </div>
        <div className="flex items-center gap-2">
          {(["metrics", "safety", "audit", "privacy"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveAdminTab(t)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer capitalize",
                activeAdminTab === t
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics View */}
      {activeAdminTab === "metrics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#1E1E36] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Gross Merchandise Value (GMV)</div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">₹1,84,500</div>
              <div className="text-[10px] text-emerald-600 font-bold mt-1">↑ +18% this month</div>
            </div>
            <div className="bg-white dark:bg-[#1E1E36] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Total Completed Orders</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">142</div>
              <div className="text-[10px] text-slate-400 font-bold mt-1">99.2% fulfillment rate</div>
            </div>
            <div className="bg-white dark:bg-[#1E1E36] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Active Approved Vendors</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">42</div>
              <div className="text-[10px] text-slate-400 font-bold mt-1">Police verified</div>
            </div>
            <div className="bg-white dark:bg-[#1E1E36] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Open Disputes</div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">2</div>
              <div className="text-[10px] text-amber-600 font-bold mt-1">Requires review</div>
            </div>
          </div>
        </div>
      )}

      {/* Safety Policy Rules */}
      {activeAdminTab === "safety" && (
        <div className="bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" /> Community Commerce Safety Policies
          </h3>
          <div className="space-y-3">
            {safetyRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{rule.name}</span>
                  <p className="text-[10px] text-slate-400">Category: {rule.category}</p>
                </div>
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                    rule.enabled ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-700"
                  )}
                >
                  {rule.enabled ? "Active" : "Disabled"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Log Trail */}
      {activeAdminTab === "audit" && (
        <div className="bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" /> Marketplace Audit Trail
          </h3>
          <div className="space-y-2 text-xs">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{log.actorName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#262644] font-semibold text-slate-500">
                      {log.actorRole}
                    </span>
                    <span className="font-mono text-[10px] text-indigo-600 font-black">{log.action}</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Privacy & Data Retention */}
      {activeAdminTab === "privacy" && (
        <div className="bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" /> Data Privacy, Masking & Retention Policy
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Mana Community implements strict data minimization: resident phone numbers and precise flat numbers are never exposed publicly. All completed order records are preserved solely for financial audit and dispute history.
          </p>
          <div className="p-4 bg-slate-50 dark:bg-[#262644] rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Resident Data Deletion Request Handler</div>
            <p className="text-[11px] text-slate-400">
              Process resident account erasure requests while maintaining legally mandated transaction ledger anonymization.
            </p>
            <button
              onClick={handlePrivacyRequest}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              Run Retention Anonymization Check
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

{/* ── ADMIN MODERATION VIEW ── */}

function ModerationView() {
  const [reports, setReports] = useState<ReportedListingResponse[]>(MOCK_REPORTS);
  const [loading, setLoading] = useState(false);

  const handleDismiss = (id: number) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    showSuccess("Report dismissed.");
  };

  const handleRemoveListing = (id: number, listingTitle: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    showSuccess(`Listing "${listingTitle}" removed from marketplace.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" /> Community Moderation Queue
          </h2>
          <p className="text-xs text-slate-400">Review flagged listings reported by residents for community safety.</p>
        </div>
        <span className="text-xs font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800">
          {reports.length} Pending Review
        </span>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white dark:bg-[#1E1E36] rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-2">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Moderation Queue Clear</h3>
          <p className="text-xs text-slate-400">All community listings comply with safety guidelines.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="bg-white dark:bg-[#1E1E36] rounded-2xl border border-rose-200 dark:border-rose-900/60 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                    {r.reason}
                  </span>
                  <span className="text-xs font-bold text-slate-400">Reported by {r.reportedBy}</span>
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">{r.listingTitle}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Seller: <span className="font-bold text-slate-700 dark:text-slate-300">{r.sellerName}</span> • Listed at ₹{r.price}</p>
                {r.details && (
                  <p className="text-xs bg-slate-50 dark:bg-[#262644] p-2.5 rounded-xl text-slate-600 dark:text-slate-300 italic">
                    "{r.details}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDismiss(r.id)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-[#262644] rounded-xl cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => handleRemoveListing(r.id, r.listingTitle)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-500/20 cursor-pointer"
                >
                  Take Down Listing
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

{/* ── DYNAMIC SUB-VIEWS ── */}

function VendorsView() {
  const navigate = useNavigate();
  const vendors = [
    { name: "Fresh Farm Organics", desc: "Organic vegetables, fruits, and dairy delivered fresh daily.", tags: ["Groceries", "Organic", "Dairy"], rating: 4.8, products: 324, orders: "1.2K" },
    { name: "TechZone Electronics", desc: "Premium electronics, gadgets, and accessories with warranty.", tags: ["Electronics", "Gadgets", "Repair"], rating: 4.7, products: 156, orders: "850" },
    { name: "Home Chefs Hub", desc: "Authentic regional homemade meals and bakery items.", tags: ["Food", "Bakery", "Catering"], rating: 4.9, products: 88, orders: "2.1K" },
    { name: "Green Thumb Nursery", desc: "Indoor plants, balcony setups, pots, organic fertilizers.", tags: ["Plants", "Gardening", "Pots"], rating: 4.9, products: 64, orders: "430" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">Verified Community Vendors</h2>
        <button
          onClick={() => navigate("/vendor-marketplace")}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
        >
          View Full Vendor Hub <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {vendors.map((v, i) => (
          <div key={i} className="bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-400 transition-all flex flex-col justify-between">
            <div>
              <div className="h-20 bg-gradient-to-r from-indigo-600 to-purple-600 relative" />
              <div className="p-4 pt-0 relative">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#262644] border-4 border-white dark:border-[#1E1E36] shadow-md -mt-6 flex items-center justify-center text-lg font-bold text-indigo-600">
                  {v.name.charAt(0)}
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2 flex items-center gap-1">
                  {v.name} <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">{v.desc}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {v.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#262644] text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 pt-0">
              <div className="flex justify-between items-center py-2.5 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500">
                <span>⭐ {v.rating}</span>
                <span>{v.products} Items</span>
                <span>{v.orders} Orders</span>
              </div>
              <button
                onClick={() => navigate("/vendor-marketplace")}
                className="w-full py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Browse Vendor
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServicesView() {
  const navigate = useNavigate();
  const services = [
    { title: "AC Repair & Deep Servicing", provider: "CoolCare Technicians", price: "₹499 / Visit", rating: 4.8, category: "Appliances" },
    { title: "Home Deep Cleaning & Sanitization", provider: "ShineClean Pros", price: "₹1,499 / Session", rating: 4.9, category: "Cleaning" },
    { title: "Plumbing & Electrical Work", provider: "FixIt Fast Pros", price: "₹299 / Hour", rating: 4.7, category: "Repairs" },
    { title: "Sofa & Carpet Shampooing", provider: "FreshHome Care", price: "₹799 / Set", rating: 4.8, category: "Cleaning" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">Book Neighborhood Services</h2>
        <button
          onClick={() => navigate("/services")}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
        >
          View All Services <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((s, i) => (
          <div key={i} className="bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-400 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                  <Wrench className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                  ⭐ {s.rating}
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{s.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">By {s.provider}</p>
              </div>
            </div>
            <div>
              <div className="text-base font-black text-indigo-600 dark:text-indigo-400 mb-3">{s.price}</div>
              <button
                onClick={() => navigate("/vendor-marketplace")}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-md shadow-indigo-500/20"
              >
                Book Appointment Slot
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RentalsView() {
  const { addItem } = useCart();
  const [selectedRental, setSelectedRental] = useState<any | null>(null);
  const [days, setDays] = useState(2);

  const rentals = [
    { id: "rent-1", title: "DSLR Camera Canon EOS with 50mm Lens", owner: "Rohan V. (Tower B - 604)", dayPrice: 800, weekPrice: 4000, deposit: 2000, avail: "Available Now" },
    { id: "rent-2", title: "Bosch Heavy Power Drill & Bit Set", owner: "Karan M. (Tower A - 102)", dayPrice: 350, weekPrice: 1500, deposit: 800, avail: "Available Now" },
    { id: "rent-3", title: "Camping 4-Person Waterproof Tent", owner: "Ananya S. (Tower C - 402)", dayPrice: 500, weekPrice: 2200, deposit: 1000, avail: "Available Today" },
    { id: "rent-4", title: "High-Pressure Car & Balcony Washer", owner: "Suresh K. (Tower D - 901)", dayPrice: 450, weekPrice: 1800, deposit: 1200, avail: "Available Now" },
  ];

  const handleBookRental = (item: typeof rentals[0]) => {
    setSelectedRental(item);
    setDays(2);
  };

  const confirmRentalBooking = () => {
    if (!selectedRental) return;
    const totalRentalPrice = selectedRental.dayPrice * days;
    addItem({
      id: selectedRental.id,
      title: `${selectedRental.title} (${days} Days Rental)`,
      price: totalRentalPrice,
      priceUnit: `${days} days`,
      category: "Rentals",
      type: "RENTAL",
      sellerName: selectedRental.owner,
    });
    setSelectedRental(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Community Equipment & Tool Sharing</h2>
          <p className="text-xs text-slate-400">Borrow tools and gear from verified neighbors instead of buying new.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rentals.map((r) => (
          <div key={r.id} className="bg-white dark:bg-[#1E1E36] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shadow-xs hover:border-indigo-400 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 shrink-0">
                <Home className="w-7 h-7" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  {r.avail}
                </span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{r.title}</h3>
                <p className="text-xs text-slate-400">Owner: {r.owner}</p>
                <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 font-semibold">
                  <Info className="w-3 h-3" /> Refundable Security Deposit: ₹{r.deposit}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="text-center px-2.5 py-1 bg-slate-50 dark:bg-[#262644] rounded-xl">
                  <div className="text-xs font-black text-indigo-600">₹{r.dayPrice}</div>
                  <div className="text-[8px] text-slate-400 uppercase">Per Day</div>
                </div>
                <div className="text-center px-2.5 py-1 bg-slate-50 dark:bg-[#262644] rounded-xl">
                  <div className="text-xs font-black text-purple-600">₹{r.weekPrice}</div>
                  <div className="text-[8px] text-slate-400 uppercase">Per Week</div>
                </div>
              </div>
              <button
                onClick={() => handleBookRental(r)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-md shadow-indigo-500/20"
              >
                Rent Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Rental Booking Duration Drawer / Modal */}
      {selectedRental && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1E1E36] rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Configure Rental Booking</h3>
              <button onClick={() => setSelectedRental(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{selectedRental.title}</h4>
              <p className="text-xs text-slate-400 mt-0.5">Owner: {selectedRental.owner}</p>
            </div>

            <div className="space-y-2 bg-slate-50 dark:bg-[#262644] p-4 rounded-2xl">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Rental Duration (Days)</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDays((d) => Math.max(1, d - 1))}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-700 font-bold text-xs cursor-pointer"
                >
                  -
                </button>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{days} Days</span>
                <button
                  onClick={() => setDays((d) => d + 1)}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-700 font-bold text-xs cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="flex justify-between">
                <span>Rental Charge ({days} x ₹{selectedRental.dayPrice}):</span>
                <span className="font-bold text-slate-900 dark:text-white">₹{days * selectedRental.dayPrice}</span>
              </div>
              <div className="flex justify-between text-amber-600">
                <span>Refundable Deposit:</span>
                <span className="font-bold">₹{selectedRental.deposit}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-indigo-600 dark:text-indigo-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Total Payable:</span>
                <span>₹{days * selectedRental.dayPrice + selectedRental.deposit}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedRental(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-500 rounded-xl hover:bg-slate-100 dark:hover:bg-[#262644] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmRentalBooking}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                Add to Cart & Reserve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FoodView() {
  const { addItem } = useCart();
  const [foodFilter, setFoodFilter] = useState<"ALL" | "VEG" | "NON-VEG">("ALL");

  const foods = [
    { id: "food-1", title: "Hyderabadi Chicken Dum Biryani", chef: "Ayesha's Kitchen (Tower A - 302)", price: 280, type: "NON-VEG", serves: "Serves 1-2", time: "Ready by 7:30 PM" },
    { id: "food-2", title: "South Indian Special Thali / Tiffin Combo", chef: "Lakshmi Amma Meals (Tower C - 104)", price: 140, type: "VEG", serves: "Serves 1", time: "Ready by 8:00 PM" },
    { id: "food-3", title: "Fresh Molten Choco-Lava Cakes (Pack of 2)", chef: "Sweet Treats Bakery (Tower B - 501)", price: 180, type: "VEG", serves: "2 pcs", time: "Instant Delivery" },
    { id: "food-4", title: "Punjabi Paneer Butter Masala + 3 Phulkas", chef: "Simran's Home Dhaba (Tower D - 802)", price: 220, type: "VEG", serves: "Serves 1", time: "Ready by 8:15 PM" },
  ];

  const filteredFoods = foodFilter === "ALL" ? foods : foods.filter((f) => f.type === foodFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Homemade Food & Home Chefs</h2>
          <p className="text-xs text-slate-400">Order hygienic, home-cooked regional specialties made fresh by your neighbors.</p>
        </div>
        <div className="flex items-center gap-2">
          {(["ALL", "VEG", "NON-VEG"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFoodFilter(t)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                foodFilter === t
                  ? "bg-indigo-600 text-white border-transparent"
                  : "bg-white dark:bg-[#1E1E36] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredFoods.map((f) => (
          <div key={f.id} className="bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-400 transition-all">
            <div className="space-y-3">
              <div className="h-32 bg-slate-100 dark:bg-[#262644] rounded-2xl flex items-center justify-center relative overflow-hidden">
                <Utensils className="w-10 h-10 text-slate-300" />
                <span className={cn("absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-full border bg-white/90 dark:bg-black/70", f.type === "VEG" ? "text-emerald-600 border-emerald-300" : "text-rose-600 border-rose-300")}>
                  {f.type}
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-1">{f.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Chef: {f.chef}</p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-1">🕒 {f.time} • {f.serves}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-base font-black text-indigo-600 dark:text-indigo-400">₹{f.price}</span>
              <button
                onClick={() => addItem({
                  id: f.id,
                  title: f.title,
                  price: f.price,
                  priceUnit: "portion",
                  category: "Homemade Food",
                  type: "FOOD",
                  sellerName: f.chef,
                })}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DealsView() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    showSuccess(`Coupon code ${code} copied to clipboard!`);
    setTimeout(() => setCopied(null), 2500);
  };

  const deals = [
    { title: "20% Off Weekend Baking & Meals", code: "COMMUNITY20", discount: "20% OFF", desc: "Valid on all homemade cakes and Sunday specials.", expiry: "Ends Sunday 11:59 PM" },
    { title: "₹100 Off AC & Appliance Servicing", code: "COOL100", discount: "₹100 OFF", desc: "Applicable on service visits above ₹500.", expiry: "Valid till end of month" },
    { title: "15% Off Organic Mangoes & Veg Baskets", code: "FARMFRESH15", discount: "15% OFF", desc: "From Fresh Farm Organics stall at Tower A lobby.", expiry: "Ends Today" },
  ];

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-orange-500/10">
        <div>
          <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">Flash Sale</span>
          <h2 className="text-2xl font-black mt-2">Community Weekend Deals</h2>
          <p className="text-xs opacity-90 mt-1">Special neighbor-exclusive discounts on food, services, and pre-loved items!</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl text-center min-w-[50px]">
            <div className="text-lg font-black">04</div>
            <div className="text-[9px] uppercase">Hours</div>
          </div>
          <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl text-center min-w-[50px]">
            <div className="text-lg font-black">32</div>
            <div className="text-[9px] uppercase">Mins</div>
          </div>
        </div>
      </div>

      {/* Coupons List */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {deals.map((d, i) => (
          <div key={i} className="bg-white dark:bg-[#1E1E36] rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg">
                {d.discount}
              </span>
              <span className="text-[10px] text-slate-400">{d.expiry}</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">{d.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{d.desc}</p>
            </div>
            <div className="flex items-center justify-between bg-slate-50 dark:bg-[#262644] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 tracking-wider">{d.code}</span>
              <button
                onClick={() => copyCode(d.code)}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {copied === d.code ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === d.code ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CartView() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    deliveryFee,
    discountAmount,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    totalAmount,
    deliveryMethod,
    setDeliveryMethod,
    deliveryNotes,
    setDeliveryNotes,
    deliveryAddress,
    setDeliveryAddress,
    paymentMode,
    setPaymentMode,
    isCheckingOut,
    checkout,
  } = useCart();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const navigate = useNavigate();

  const handleProceedToPayment = () => {
    if (paymentMode === "CASH_ON_HANDOVER") {
      handleFinalCheckout();
    } else {
      setShowPaymentModal(true);
    }
  };

  const handleFinalCheckout = async () => {
    const order = await checkout();
    setShowPaymentModal(false);
    if (order) {
      navigate("/marketplace/orders");
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 text-center p-6 space-y-3">
        <ShoppingCart className="w-12 h-12 text-slate-300" />
        <h3 className="text-base font-black text-slate-900 dark:text-white">Your Cart is Empty</h3>
        <p className="text-xs text-slate-400 max-w-sm">Explore community marketplace listings, homemade food, or equipment rentals to add items!</p>
        <button
          onClick={() => navigate("/marketplace")}
          className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
        >
          Explore Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-900 dark:text-white">
      {/* Items List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-600" /> Shopping Cart ({items.length} items)
          </h2>
          <button
            onClick={clearCart}
            className="text-xs font-bold text-rose-500 hover:underline cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Cart
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#1E1E36] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-[#262644] overflow-hidden flex items-center justify-center shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : item.type === "FOOD" ? (
                    <Utensils className="w-6 h-6 text-slate-300" />
                  ) : (
                    <ShoppingBag className="w-6 h-6 text-slate-300" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  {item.category && (
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                  )}
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">{item.title}</h4>
                  <p className="text-xs text-slate-400">Seller: {item.sellerName || "Neighbor"}</p>
                  <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 mt-1">{formatPrice(item.price, item.priceUnit)}</p>
                </div>
              </div>

              {/* Quantity Controls & Remove */}
              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#262644] px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-6 h-6 rounded-md bg-white dark:bg-[#1E1E36] flex items-center justify-center text-xs font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-xs font-black px-1.5">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-6 h-6 rounded-md bg-white dark:bg-[#1E1E36] flex items-center justify-center text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <div className="text-right min-w-[70px]">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Checkout Sidebar */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
          <h3 className="text-sm font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Order & Delivery Details
          </h3>

          {/* Delivery Method */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Delivery / Pickup Method</label>
            <div className="space-y-2">
              {[
                { id: "FLAT_PICKUP", title: "Neighbor Flat Pickup (Free)", desc: "Collect from neighbor's flat" },
                { id: "CLUBHOUSE", title: "Clubhouse Drop / Handover (Free)", desc: "Includes Secure Handover OTP" },
                { id: "GATE_SECURITY", title: "Security Gate Drop (Free)", desc: "Includes Gate Pass OTP" },
                { id: "DOORSTEP_DELIVERY", title: "Doorstep Runner (+₹30)", desc: "Delivered directly to your door" },
              ].map((m) => (
                <label
                  key={m.id}
                  onClick={() => setDeliveryMethod(m.id as DeliveryMethod)}
                  className={cn(
                    "flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer",
                    deliveryMethod === m.id
                      ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#262644]"
                  )}
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    checked={deliveryMethod === m.id}
                    onChange={() => setDeliveryMethod(m.id as DeliveryMethod)}
                    className="mt-0.5 text-indigo-600"
                  />
                  <div>
                    <div className="text-xs font-bold">{m.title}</div>
                    <div className="text-[10px] text-slate-400">{m.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Payment Mode */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Payment Option</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "UPI_QR", label: "Instant UPI QR", icon: QrCode },
                { id: "COMMUNITY_WALLET", label: "Mana Wallet", icon: Wallet },
                { id: "CARD_NETBANKING", label: "Cards / NetBank", icon: CreditCard },
                { id: "CASH_ON_HANDOVER", label: "Cash on Pickup", icon: Banknote },
              ].map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPaymentMode(p.id as PaymentMode)}
                    className={cn(
                      "p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer",
                      paymentMode === p.id
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    )}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="text-[10px]">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delivery Apartment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">My Flat / Apartment Location</label>
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 dark:text-white"
              placeholder="Tower A - Flat 302"
            />
          </div>

          {/* Delivery Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Notes / Instructions for Seller</label>
            <textarea
              rows={2}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 dark:text-white resize-none"
              placeholder="e.g. Please ring bell after 7 PM..."
            />
          </div>

          {/* Coupon Code Section */}
          <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-indigo-600" /> Community Promo Code
            </label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                <div>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase">{appliedCoupon.code}</span>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400">{appliedCoupon.description}</p>
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-xs font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. COMMUNITY10"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-600 uppercase font-mono font-bold text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!couponInput) return;
                    setApplyingCoupon(true);
                    const success = await applyCoupon(couponInput);
                    if (success) setCouponInput("");
                    setApplyingCoupon(false);
                  }}
                  disabled={applyingCoupon || !couponInput}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  {applyingCoupon ? "Applying..." : "Apply"}
                </button>
              </div>
            )}
            <p className="text-[10px] text-slate-400">Available: <span className="font-mono font-bold text-indigo-600 cursor-pointer" onClick={() => setCouponInput("COMMUNITY10")}>COMMUNITY10</span>, <span className="font-mono font-bold text-indigo-600 cursor-pointer" onClick={() => setCouponInput("FREEDEL")}>FREEDEL</span></p>
          </div>

          {/* Summary Breakdown */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Items Subtotal:</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatPrice(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Coupon Discount:</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Delivery Fee:</span>
              <span className="font-bold text-slate-900 dark:text-white">{deliveryFee > 0 ? formatPrice(deliveryFee) : "FREE"}</span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Total Payable:</span>
              <span className="text-indigo-600 dark:text-indigo-400">{formatPrice(totalAmount)}</span>
            </div>
          </div>

          <button
            onClick={handleProceedToPayment}
            disabled={isCheckingOut}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-indigo-500/25 cursor-pointer flex items-center justify-center gap-2"
          >
            {isCheckingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {paymentMode === "CASH_ON_HANDOVER" ? "Place Community Order" : `Pay ${formatPrice(totalAmount)} & Place Order`}
          </button>
        </div>
      </div>

      {/* ── Payment Processing Modal (UPI QR / Wallet / Card) ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1E1E36] rounded-3xl p-6 w-full max-w-sm border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-indigo-600" /> Digital Payment
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                {formatPrice(totalAmount)}
              </div>

              {/* QR Mock Box */}
              <div className="w-44 h-44 mx-auto bg-slate-50 dark:bg-white rounded-2xl border-2 border-indigo-600 p-3 flex flex-col items-center justify-center shadow-inner">
                <div className="w-36 h-36 bg-slate-900 rounded-lg flex items-center justify-center text-white text-center p-2">
                  <div className="space-y-1">
                    <QrCode className="w-16 h-16 mx-auto text-indigo-400" />
                    <span className="text-[9px] font-mono text-slate-300">Scan via GPay / PhonePe</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#262644] p-2.5 rounded-xl text-xs flex items-center justify-between font-mono text-slate-700 dark:text-slate-300">
                <span>manacommunity@upi</span>
                <span className="text-[10px] text-indigo-600 font-sans font-bold">Verified VPA</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleFinalCheckout}
                disabled={isCheckingOut}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {isCheckingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                I Have Completed Payment
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Cancel & Change Option
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ListingCard({ item }: { item: ListingResponse }) {
  const imageUrl = item.imageUrls?.[0];
  const { startConversation } = useChat();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [wishlisted, setWishlisted] = useState(false);

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    startConversation(String(item.seller.id));
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      id: item.id,
      title: item.title,
      price: item.price,
      priceUnit: item.priceUnit,
      category: item.category,
      imageUrl: item.imageUrls?.[0],
      sellerId: item.seller.id,
      sellerName: item.seller.fullName,
      type: "PRODUCT",
    });
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (wishlisted) {
        await wishlistService.remove(item.id);
        setWishlisted(false);
      } else {
        await wishlistService.add(item.id);
        setWishlisted(true);
      }
    } catch {}
  };

  return (
    <div
      onClick={() => navigate(`/marketplace/${item.id}`)}
      className="bg-white dark:bg-[#1E1E36] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col hover:border-indigo-500/40 hover:shadow-xl transition-all duration-300 group cursor-pointer"
    >
      {/* Thumbnail Header */}
      <div className="h-48 relative overflow-hidden bg-slate-100 dark:bg-[#262644]">
        {imageUrl ? (
          <img src={imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImagePlus className="w-10 h-10 text-slate-300" />
          </div>
        )}

        {/* Badge */}
        <div className="absolute top-3 left-3 flex gap-1">
          <span className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
            {item.category}
          </span>
          {item.condition && (
            <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-bold uppercase px-2 py-1 rounded-full">
              {item.condition.replace(/_/g, " ")}
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className={cn(
            "absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all shadow-md cursor-pointer",
            wishlisted ? "bg-rose-500 text-white" : "bg-white/80 dark:bg-black/40 text-slate-600 dark:text-white hover:bg-white"
          )}
        >
          <Heart className="w-4 h-4 fill-current" />
        </button>

        {/* Price Floating Tag */}
        <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md text-white font-black text-xs px-3 py-1.5 rounded-full shadow-md border border-white/10">
          {formatPrice(item.price, item.priceUnit)}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
            {item.title}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mt-1 line-clamp-2">
            {item.description}
          </p>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center">
              {item.seller.fullName?.charAt(0) ?? "?"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                {item.seller.fullName}
                {item.seller.verified && <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />}
              </div>
              {item.location && (
                <div className="text-[10px] text-slate-400 flex items-center gap-0.5 truncate">
                  <MapPin className="w-2.5 h-2.5 shrink-0" /> {item.location}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleAddToCart}
              className="p-2 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer"
              title="Add to Cart"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleContact}
              className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Contact
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateListingModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<ListingRequest>({
    title: "",
    price: 0,
    category: "Homemade Food",
    condition: "LIKE_NEW",
    warranty: "",
    description: "",
    priceUnit: "",
    transactionMode: "CHAT_ONLY",
    visibility: "COMMUNITY",
    location: "",
    imageUrls: [],
  });
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.price) {
      setError("Title and price are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: ListingRequest = {
        ...form,
        imageUrls: images.length > 0 ? images : form.imageUrls,
      };
      await listingService.create(payload);
      showSuccess("Advertisement posted successfully!");
      onCreated();
    } catch {
      setError("Failed to create listing. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof ListingRequest, value: string | number | string[]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1E1E36] rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-black text-slate-900 dark:text-white">Post Community Advertisement</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#262644] rounded-lg transition-colors cursor-pointer text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl">{error}</p>}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Title *</label>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              maxLength={150}
              className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 dark:text-white"
              placeholder="e.g. Homemade Biryani – Sunday Special"
            />
          </div>

          {/* Multi-Image File Uploader */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Product Images</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {images.map((img, i) => (
                <div key={i} className="w-16 h-16 rounded-xl overflow-hidden relative group border border-slate-200 dark:border-slate-700">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-400 hover:text-indigo-600">
                <ImagePlus className="w-5 h-5" />
                <span className="text-[8px] font-bold mt-0.5">Upload</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              maxLength={2000}
              rows={3}
              className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 dark:text-white resize-none"
              placeholder="Describe your item or service..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Price (₹) *</label>
              <input
                type="number"
                min={0}
                value={form.price || ""}
                onChange={(e) => update("price", parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 dark:text-white"
                placeholder="350"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Price Unit</label>
              <input
                value={form.priceUnit}
                onChange={(e) => update("priceUnit", e.target.value)}
                maxLength={20}
                className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 dark:text-white"
                placeholder="portion, kg, hour..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 dark:text-white"
              >
                {categories.filter((c) => c !== "All").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Condition</label>
              <select
                value={form.condition}
                onChange={(e) => update("condition", e.target.value as any)}
                className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 dark:text-white"
              >
                <option value="NEW">Brand New (Unopened)</option>
                <option value="LIKE_NEW">Like New (Barely Used)</option>
                <option value="GOOD">Good Condition</option>
                <option value="FAIR">Fair (Functional)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Warranty Details</label>
              <input
                value={form.warranty}
                onChange={(e) => update("warranty", e.target.value)}
                maxLength={50}
                className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 dark:text-white"
                placeholder="e.g. 6 Months Left / None"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Location</label>
              <input
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                maxLength={100}
                className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 dark:text-white"
                placeholder="Tower B, Apt 402"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-[#262644] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-md shadow-indigo-500/20"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "Posting..." : "Post Advertisement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
