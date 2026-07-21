import {
  Search, Tag, MapPin, CheckCircle, Plus, X, Loader2, ImagePlus, ShoppingBag,
  MessageCircle, ChevronLeft, ChevronRight, Heart, Star, Sparkles, TrendingUp,
  ShieldCheck, Wrench, Home, Gift, HelpCircle, Utensils, Laptop, Car, BookOpen,
  ArrowUp, Zap, ShoppingCart, Clock, Check
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { listingService, wishlistService, type ListingResponse, type ListingRequest } from "../../../services/listingService";
import { useAuth } from "../../../contexts/AuthContext";
import { useChat } from "../../../contexts/ChatContext";
import { CREATE_LISTING } from "../../../constants/permissions";

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
  const [listings, setListings] = useState<ListingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const { hasPermission } = useAuth();
  const canCreate = hasPermission(CREATE_LISTING);

  const fetchListings = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await listingService.getListings(
        activeCategory !== "All" ? activeCategory : undefined,
        searchQuery || undefined,
        pageNum,
        12
      );
      setListings(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      setListings([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    setPage(0);
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => fetchListings(page), searchQuery ? 400 : 0);
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

      {activeTab === "vendors" && <VendorsView />}
      {activeTab === "services" && <ServicesView />}
      {activeTab === "rentals" && <RentalsView />}
      {activeTab === "food" && <FoodView />}
      {activeTab === "deals" && <DealsView />}
      {activeTab === "cart" && <CartView />}

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

          {/* Category Chips Filter */}
          <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">Categories</h3>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {categories.length - 1} Categories
              </span>
            </div>
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
              <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">No listings found in "{activeCategory}"</p>
              <p className="text-slate-400 text-xs mt-1">Be the first neighbor to post a product or service in this category!</p>
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

{/* ── SUB VIEWS DEFINITIONS MATCHING HTML MOCKUP ── */}

function VendorsView() {
  const vendors = [
    { name: "Fresh Farm Organics", desc: "Organic vegetables, fruits, and dairy delivered fresh daily.", tags: ["Groceries", "Organic", "Dairy"], rating: 4.8, products: 324, orders: "1.2K" },
    { name: "TechZone Electronics", desc: "Premium electronics, gadgets, and accessories with warranty.", tags: ["Electronics", "Gadgets", "Repair"], rating: 4.7, products: 156, orders: "850" },
    { name: "Home Chefs Hub", desc: "Authentic regional homemade meals and bakery items.", tags: ["Food", "Bakery", "Catering"], rating: 4.9, products: 88, orders: "2.1K" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black text-slate-900 dark:text-white">Verified Community Vendors</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map((v, i) => (
          <div key={i} className="bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="h-24 bg-gradient-to-r from-indigo-600 to-purple-600 relative" />
            <div className="p-5 pt-0 relative">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#262644] border-4 border-white dark:border-[#1E1E36] shadow-md -mt-8 flex items-center justify-center text-xl font-bold text-indigo-600">
                {v.name.charAt(0)}
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2 flex items-center gap-1">
                {v.name} <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{v.desc}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {v.tags.map((t) => (
                  <span key={t} className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#262644] text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800 mt-4 text-xs font-bold text-slate-500">
                <span>⭐ {v.rating} Rating</span>
                <span>{v.products} Items</span>
                <span>{v.orders} Orders</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServicesView() {
  const services = [
    { title: "AC Repair & Servicing", provider: "CoolCare Technicians", price: "₹499 / Visit", rating: 4.8 },
    { title: "Home Deep Cleaning", provider: "ShineClean Pros", price: "₹1,499 / Session", rating: 4.9 },
    { title: "Plumbing & Electrical Work", provider: "FixIt Fast", price: "₹299 / Hour", rating: 4.7 },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black text-slate-900 dark:text-white">Book Neighborhood Services</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s, i) => (
          <div key={i} className="bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{s.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">By {s.provider}</p>
            </div>
            <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">{s.price}</div>
            <button className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-indigo-700">
              Book Appointment Slot
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RentalsView() {
  const rentals = [
    { title: "DSLR Camera & Lens Kit", owner: "Rohan V.", day: "₹800", week: "₹4,000", avail: "Available Now" },
    { title: "Power Tool Drill Set", owner: "Karan M.", day: "₹350", week: "₹1,500", avail: "Available Now" },
    { title: "Camping Tent 4-Person", owner: "Ananya S.", day: "₹500", week: "₹2,200", avail: "Booked Till Tomorrow" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black text-slate-900 dark:text-white">Rent Equipment & Tools</h2>
      <div className="space-y-3">
        {rentals.map((r, i) => (
          <div key={i} className="bg-white dark:bg-[#1E1E36] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-[#262644] flex items-center justify-center text-indigo-600">
                <Home className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{r.title}</h3>
                <p className="text-xs text-slate-400">Owner: {r.owner} • Status: <span className="text-emerald-500 font-bold">{r.avail}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center px-3 py-1 bg-slate-50 dark:bg-[#262644] rounded-xl">
                <div className="text-xs font-black text-indigo-600">{r.day}</div>
                <div className="text-[9px] text-slate-400">Per Day</div>
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl cursor-pointer">
                Rent Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FoodView() {
  const foods = [
    { title: "Hyderabadi Chicken Biryani", chef: "Ayesha's Kitchen", price: "₹280", type: "NON-VEG" },
    { title: "South Indian Tiffin Combo", chef: "Lakshmi Amma Meals", price: "₹140", type: "VEG" },
    { title: "Fresh Choco-Lava Cakes (2pcs)", chef: "Sweet Treats", price: "₹180", type: "VEG" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black text-slate-900 dark:text-white">Homemade Food & Catering</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {foods.map((f, i) => (
          <div key={i} className="bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <div className="h-32 bg-slate-100 dark:bg-[#262644] rounded-2xl flex items-center justify-center">
              <Utensils className="w-10 h-10 text-slate-300" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{f.title}</h3>
              <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full border", f.type === "VEG" ? "text-emerald-600 border-emerald-300" : "text-rose-600 border-rose-300")}>
                {f.type}
              </span>
            </div>
            <p className="text-xs text-slate-400">Chef: {f.chef}</p>
            <div className="flex items-center justify-between pt-2">
              <span className="text-base font-black text-indigo-600">{f.price}</span>
              <button className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl cursor-pointer">Order Now</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DealsView() {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">Flash Sale</span>
          <h2 className="text-2xl font-black mt-2">Community Weekend Deals</h2>
          <p className="text-xs opacity-90 mt-1">Up to 60% off on electronics, home decor, and sports items!</p>
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
    </div>
  );
}

function CartView() {
  return (
    <div className="bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
      <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
        <ShoppingCart className="w-5 h-5 text-indigo-600" /> Shopping Cart (2 items)
      </h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h4 className="text-xs font-bold">Yonex Badminton Racket Set</h4>
            <p className="text-[10px] text-slate-400">Qty: 1</p>
          </div>
          <span className="text-xs font-black text-indigo-600">₹2,400</span>
        </div>
      </div>
      <div className="pt-3 flex justify-between items-center">
        <span className="text-sm font-black text-slate-900 dark:text-white">Total: ₹2,400</span>
        <button className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl cursor-pointer">Proceed to Checkout</button>
      </div>
    </div>
  );
}



function ListingCard({ item }: { item: ListingResponse }) {
  const imageUrl = item.imageUrls?.[0];
  const { startConversation } = useChat();
  const navigate = useNavigate();
  const [wishlisted, setWishlisted] = useState(false);

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    startConversation(String(item.seller.id));
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
        <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
          {item.category}
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

          <button
            onClick={handleContact}
            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" /> Contact
          </button>
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
    description: "",
    priceUnit: "",
    transactionMode: "CHAT_ONLY",
    visibility: "COMMUNITY",
    location: "",
    imageUrls: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.price) {
      setError("Title and price are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await listingService.create(form);
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Mode</label>
              <select
                value={form.transactionMode}
                onChange={(e) => update("transactionMode", e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 dark:text-white"
              >
                {transactionModes.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
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
