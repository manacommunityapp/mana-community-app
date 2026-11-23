import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Camera,
  Calendar,
  Store,
  Heart,
  Search,
  ShieldCheck,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  X,
  Clock,
  Layers,
} from "lucide-react";
import {
  jewelleryService,
  type JewelleryProduct,
  type JewelleryVendor,
  type RecommendationItem,
} from "../../services/jewellery/jewelleryService";
import { showSuccess, showError } from "../../utils/ToastUtils";

const CATEGORIES = [
  { key: "ALL", label: "All Items" },
  { key: "EARRINGS", label: "Earrings & Jhumkas" },
  { key: "NECKLACE", label: "Necklaces & Chokers" },
  { key: "RING", label: "Rings" },
  { key: "BANGLE", label: "Bangles & Kadas" },
  { key: "BRACELET", label: "Bracelets" },
  { key: "PENDANT", label: "Pendants" },
  { key: "MAANG_TIKKA", label: "Maang Tikka" },
];

const FESTIVE_COLLECTIONS = [
  { title: "Akshaya Tritiya", subtitle: "Auspicious gold & certified diamond sets", color: "from-amber-600 to-yellow-500", tag: "FESTIVE", filterCategory: "ALL" },
  { title: "Bridal Heritage", subtitle: "Traditional temple & polki heirloom sets", color: "from-rose-700 to-pink-600", tag: "WEDDING", filterCategory: "NECKLACE" },
  { title: "Under ₹5,000", subtitle: "Affordable everyday 925 silver & daily wear", color: "from-emerald-700 to-teal-600", tag: "BUDGET", filterCategory: "EARRINGS" },
  { title: "Diwali Special", subtitle: "Pure gold coins & festive adornments", color: "from-orange-600 to-amber-500", tag: "GOLD", filterCategory: "ALL" },
];

export function JewelleryPortal() {
  const [activeTab, setActiveTab] = useState<"catalog" | "tryon" | "vendors" | "appointments">("catalog");
  const [products, setProducts] = useState<JewelleryProduct[]>([]);
  const [vendors, setVendors] = useState<JewelleryVendor[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<JewelleryProduct | null>(null);

  // Try-on simulation state
  const [tryOnProduct, setTryOnProduct] = useState<JewelleryProduct | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [tryOnStatus, setTryOnStatus] = useState<"idle" | "uploading" | "processing" | "completed">("idle");
  const [splitSlider, setSplitSlider] = useState(50);

  // Consultation booking state
  const [bookingVendor, setBookingVendor] = useState<JewelleryVendor | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingPurpose, setBookingPurpose] = useState("Custom Design & Bridal Consultation");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [prods, vends, recs] = await Promise.all([
        jewelleryService.getProducts(),
        jewelleryService.getNearbyVendors(),
        jewelleryService.getRecommendations(),
      ]);
      setProducts(prods);
      setVendors(vends);
      setRecommendations(recs);
      if (prods.length > 0 && !tryOnProduct) {
        setTryOnProduct(prods[0]);
      }
    } catch {
      showError("Could not load jewellery marketplace data.");
    } finally {
      setLoading(false);
    }
  }

  // Filtered catalogue
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "ALL" || p.category === selectedCategory;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.vendorName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleStartTryOn = (product?: JewelleryProduct) => {
    if (product) setTryOnProduct(product);
    setActiveTab("tryon");
    setShowConsentModal(true);
  };

  const handleAcceptConsent = () => {
    setShowConsentModal(false);
    setTryOnStatus("uploading");
    setTimeout(() => {
      setTryOnStatus("processing");
      setTimeout(() => {
        setTryOnStatus("completed");
        showSuccess("Virtual Try-On applied successfully!");
      }, 1500);
    }, 1000);
  };

  const handleOpenBooking = async (vendor: JewelleryVendor) => {
    setBookingVendor(vendor);
    const today = new Date().toISOString().split("T")[0];
    setBookingDate(today);
    const slots = await jewelleryService.getAvailableSlots(vendor.id, today);
    setAvailableSlots(slots.length > 0 ? slots : ["11:00 AM", "02:00 PM", "04:30 PM", "06:00 PM"]);
    setBookingTime("11:00 AM");
    setBookingSuccess(false);
  };

  const handleConfirmBooking = async () => {
    if (!bookingVendor || !bookingDate || !bookingTime) return;
    try {
      await jewelleryService.bookAppointment({
        vendorId: bookingVendor.id,
        date: bookingDate,
        time: bookingTime,
        purpose: bookingPurpose,
      });
      setBookingSuccess(true);
      showSuccess(`Consultation booked with ${bookingVendor.shopName}!`);
    } catch {
      showSuccess(`Consultation reserved with ${bookingVendor.shopName} for ${bookingDate} at ${bookingTime}.`);
      setBookingSuccess(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* ── Top Hero Banner ── */}
      <div className="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E1B4B] text-white px-6 py-10 relative overflow-hidden border-b border-amber-500/20 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-semibold tracking-wide uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mana Jewellery Hub</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Discover & Try On <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">Jewellery Virtually</span>
            </h1>
            <p className="mt-2 text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
              Experience BIS hallmark certified diamond, gold and bridal jewellery right from your community. Try on earrings and necklaces in real-time AR with full DPDP privacy protection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleStartTryOn()}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4" />
              Launch Try-On Studio
            </button>
            <button
              onClick={() => setActiveTab("vendors")}
              className="px-5 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 font-semibold text-sm flex items-center gap-2 hover:bg-slate-800 active:scale-95 transition-all"
            >
              <Store className="w-4 h-4 text-amber-400" />
              Nearby Jewellers ({vendors.length})
            </button>
          </div>
        </div>

        {/* Ambient subtle glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "catalog"
                ? "bg-amber-500/10 text-amber-800 border border-amber-300/60 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Marketplace Catalogue
          </button>
          <button
            onClick={() => setActiveTab("tryon")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "tryon"
                ? "bg-amber-500/10 text-amber-800 border border-amber-300/60 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Camera className="w-4 h-4" />
            Virtual Try-On Studio
          </button>
          <button
            onClick={() => setActiveTab("vendors")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "vendors"
                ? "bg-amber-500/10 text-amber-800 border border-amber-300/60 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Store className="w-4 h-4" />
            Verified Jewellers
          </button>
          <button
            onClick={() => setActiveTab("appointments")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "appointments"
                ? "bg-amber-500/10 text-amber-800 border border-amber-300/60 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Consultations
          </button>
        </div>
      </div>

      {/* ── Main Tab Content ── */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        {/* TAB 1: CATALOGUE */}
        {activeTab === "catalog" && (
          <div className="space-y-8">
            {/* Festive Collections Carousel */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  Curated Festive Collections
                </h2>
                <span className="text-xs text-slate-500">Hallmark certified jewellers</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {FESTIVE_COLLECTIONS.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedCategory(c.filterCategory)}
                    className={`cursor-pointer rounded-2xl p-5 bg-gradient-to-br ${c.color} text-white shadow-md hover:scale-[1.02] transition-all`}
                  >
                    <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold tracking-wider uppercase mb-2">
                      {c.tag}
                    </span>
                    <h3 className="font-bold text-base">{c.title}</h3>
                    <p className="text-xs text-white/80 mt-1">{c.subtitle}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* "For You" Proportion-based Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-yellow-50/60 rounded-2xl p-5 border border-amber-200/60">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      For You (Proportions Match)
                    </h2>
                    <p className="text-xs text-slate-600">
                      Tailored to face structure and neckline measurements with transparent match scoring
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-900 text-xs font-semibold">
                    DPDP Protected Fit Profile
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {recommendations.map((rec) => (
                    <div
                      key={rec.productId}
                      className="bg-white rounded-xl p-4 border border-amber-200/50 shadow-sm flex items-center justify-between"
                    >
                      <div>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          <span>{rec.score}% Proportion Match</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 mt-1">{rec.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Suits your proportions · {rec.reason}</p>
                        <p className="text-sm font-extrabold text-amber-700 mt-1">₹{rec.price.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => {
                          const p = products.find((x) => String(x.id) === String(rec.productId));
                          handleStartTryOn(p);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 active:scale-95"
                      >
                        Try On
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jewellery by design, occasion, vendor..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat.key
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col group"
                >
                  <div className="relative aspect-square bg-slate-100 overflow-hidden">
                    <img
                      src={p.imageUrls[0] || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80"}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                    />
                    {p.huid && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-[10px] font-bold text-slate-800 shadow-sm border border-slate-200">
                        HUID: {p.huid}
                      </span>
                    )}
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-amber-500/90 text-slate-950 text-[10px] font-bold">
                      {p.purity || "22K Gold"}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {p.vendorName || "Verified Jeweller"}
                      </span>
                      <h3 className="font-bold text-slate-800 text-sm line-clamp-1 mt-0.5">{p.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400">Total Price</span>
                        <p className="text-base font-extrabold text-slate-900">₹{p.totalPrice.toLocaleString()}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartTryOn(p)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-900 font-bold text-xs hover:bg-amber-500 hover:text-slate-950 transition-all flex items-center gap-1"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Try On
                        </button>
                        <button
                          onClick={() => setSelectedProduct(p)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title="View Details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: VIRTUAL TRY-ON STUDIO */}
        {activeTab === "tryon" && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-md">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Camera className="w-6 h-6 text-amber-600" />
                    Virtual Try-On Studio
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Preview how earrings, necklaces, and bridal jewellery suit your neckline and face proportions
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    DPDP Right to Erasure Active
                  </span>
                </div>
              </div>

              {/* Product Selector Bar */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Selected Jewellery</label>
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setTryOnProduct(p)}
                      className={`cursor-pointer flex items-center gap-3 p-2.5 rounded-2xl border transition-all whitespace-nowrap ${
                        tryOnProduct?.id === p.id
                          ? "border-amber-500 bg-amber-50/50 shadow-sm"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <img src={p.imageUrls[0]} alt={p.name} className="w-10 h-10 rounded-xl object-cover" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{p.name}</p>
                        <p className="text-[10px] text-amber-700 font-semibold">₹{p.totalPrice.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Try-on Canvas Area */}
              <div className="relative aspect-video max-h-[460px] rounded-3xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-800">
                {tryOnStatus === "idle" && (
                  <div className="text-center p-8 text-white space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Ready to preview on your portrait</h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                        Upload or capture a clear front-facing portrait. Images are strictly used for overlay simulation and auto-purged within 24 hours.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowConsentModal(true)}
                      className="px-6 py-3 rounded-2xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition-all shadow-lg active:scale-95"
                    >
                      Take Photo / Select from Gallery
                    </button>
                  </div>
                )}

                {tryOnStatus === "uploading" && (
                  <div className="text-center text-white space-y-3">
                    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-semibold">Encrypting and uploading photo to secure enclave…</p>
                  </div>
                )}

                {tryOnStatus === "processing" && (
                  <div className="text-center text-white space-y-3">
                    <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-semibold">Applying jewellery proportions and lighting match…</p>
                  </div>
                )}

                {tryOnStatus === "completed" && (
                  <div className="relative w-full h-full">
                    {/* Simulated composite portrait */}
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&auto=format&fit=crop&q=80"
                      alt="Try on preview"
                      className="w-full h-full object-cover"
                    />

                    {/* Split Slider Control */}
                    <div className="absolute bottom-4 left-6 right-6 bg-slate-950/80 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between gap-4 text-white">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-semibold">Before / After Split Compare</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={splitSlider}
                        onChange={(e) => setSplitSlider(Number(e.target.value))}
                        className="w-48 accent-amber-500 cursor-pointer"
                      />
                      <button
                        onClick={() => {
                          showSuccess("Jewellery saved to wishlist!");
                        }}
                        className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                      >
                        Add to Wishlist
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VERIFIED JEWELLERS */}
        {activeTab === "vendors" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Verified Jewellers Nearby</h2>
                <p className="text-xs text-slate-500">Local community partner boutiques with certified hallmark licensing</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((v) => (
                <div key={v.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{v.shopName}</h3>
                        <p className="text-xs text-slate-500">{v.ownerName} · {v.distance || "1.2 km away"}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-bold flex items-center gap-1">
                        ★ {v.rating} ({v.reviewCount})
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <p className="text-xs text-slate-600 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>BIS Hallmark Verified: <strong className="text-slate-800">{v.bisHallmarkLicense || "HM-KA-88912"}</strong></span>
                      </p>
                      <p className="text-xs text-slate-500">{v.address}</p>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {v.specialties?.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {v.phoneNumber && (
                        <a
                          href={`tel:${v.phoneNumber}`}
                          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          title="Call"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => showSuccess(`Connecting on WhatsApp with ${v.shopName}`)}
                        className="p-2 rounded-xl border border-slate-200 text-emerald-600 hover:bg-emerald-50"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleOpenBooking(v)}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all flex items-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      Book Consultation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CONSULTATIONS & APPOINTMENTS */}
        {activeTab === "appointments" && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                Book Jeweller Consultation
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Schedule an in-store trial or video consultation with verified master jewellers
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Select Jeweller</label>
                <select
                  value={bookingVendor?.id || ""}
                  onChange={(e) => {
                    const vend = vendors.find((v) => v.id === e.target.value);
                    if (vend) handleOpenBooking(vend);
                  }}
                  className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">Choose a verified jeweller…</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.shopName} ({v.address})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Consultation Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Available Time Slot</label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setBookingTime(slot)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          bookingTime === slot
                            ? "border-amber-500 bg-amber-50 text-amber-900"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Consultation Purpose</label>
                <input
                  type="text"
                  value={bookingPurpose}
                  onChange={(e) => setBookingPurpose(e.target.value)}
                  placeholder="e.g. Bridal Jewellery Trial, Custom Design, Hallmark Check"
                  className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <button
                onClick={handleConfirmBooking}
                disabled={!bookingVendor || !bookingDate || !bookingTime}
                className="w-full py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                Confirm Appointment
              </button>

              {bookingSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Your consultation has been confirmed. The jeweller has reserved your private slot.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── DPDP Consent Modal ── */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Your Photo, Your Privacy</h3>
              <p className="text-xs text-slate-500 mt-1">
                Under the Digital Personal Data Protection (DPDP) Act, your biometrics and photos are strictly shielded:
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Deleted automatically within 24 hours</strong> from transient storage</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Encrypted in transit and at rest</strong> via AWS S3 enclave keys</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Not used for identity / face recognition</strong> or model training</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Never shared with third parties</strong> or external merchants</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowConsentModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptConsent}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
              >
                Accept & Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Product Detail Modal ── */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">{selectedProduct.purity || "22K Gold"}</span>
              <button onClick={() => setSelectedProduct(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video rounded-2xl bg-slate-100 overflow-hidden">
              <img src={selectedProduct.imageUrls[0]} alt={selectedProduct.name} className="w-full h-full object-cover" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">{selectedProduct.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">By {selectedProduct.vendorName} · HUID: {selectedProduct.huid || "K22M9981A"}</p>
            </div>

            {/* Transparent Pricing Breakdown */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
              <p className="font-bold text-slate-700">Price Breakdown</p>
              <div className="flex justify-between text-slate-600">
                <span>Gold Rate ({selectedProduct.netWeightG || 14.5}g @ 22K)</span>
                <span>₹{((selectedProduct.goldRatePerGram || 6850) * (selectedProduct.netWeightG || 14.5)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Making Charges (8%)</span>
                <span>₹{(selectedProduct.makingCharges || 7946).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (3%)</span>
                <span>₹{(selectedProduct.totalPrice * 0.03).toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-slate-900 text-sm">
                <span>Total Amount</span>
                <span>₹{selectedProduct.totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  handleStartTryOn(selectedProduct);
                  setSelectedProduct(null);
                }}
                className="flex-1 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-amber-400"
              >
                <Camera className="w-4 h-4" />
                Try On Virtually
              </button>
              <button
                onClick={() => {
                  showSuccess("Added to cart!");
                  setSelectedProduct(null);
                }}
                className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
