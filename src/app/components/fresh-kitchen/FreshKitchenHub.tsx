import React, { useState, useEffect, useMemo } from "react";
import {
  Snowflake,
  Thermometer,
  ShieldCheck,
  Clock,
  Plus,
  Minus,
  ShoppingBag,
  Calendar,
  Check,
  AlertCircle,
  Sparkles,
  Search,
  ChevronRight,
  X,
  Star,
  Info,
  Flame,
  Leaf,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import {
  freshKitchenService,
  MOCK_FRESH_PRODUCTS,
} from "../../../services/fresh-kitchen/freshKitchenService";
import type {
  FreshFoodProduct,
  FreshFoodProductCategory,
  DietaryFlag,
  DayOfWeek,
} from "../../../types/freshKitchen";
import { BreakfastComboCustomizer } from "./BreakfastComboCustomizer";
import { DailyBasketManager } from "./DailyBasketManager";

const CATEGORIES: { key: FreshFoodProductCategory; label: string; icon: string }[] = [
  { key: "ALL", label: "All Items", icon: "✨" },
  { key: "STANDARD_BATTER", label: "Standard Batters", icon: "🥣" },
  { key: "SPECIALTY_BATTER", label: "Specialty Batters", icon: "🥞" },
  { key: "MILLET_BATTER", label: "Millet Batters", icon: "🌾" },
  { key: "CHUTNEY_PODI", label: "Chutneys & Podis", icon: "🥥" },
  { key: "BREAKFAST_KIT", label: "Breakfast Kits", icon: "🍱" },
];

const DIETARY_FILTERS: { key: DietaryFlag | "ALL"; label: string }[] = [
  { key: "ALL", label: "All Diet" },
  { key: "VEG", label: "Pure Veg" },
  { key: "VEGAN", label: "Vegan" },
  { key: "JAIN", label: "Jain Friendly" },
  { key: "GLUTEN_FREE", label: "Gluten Free" },
  { key: "ORGANIC", label: "Organic" },
];

const ALL_DAYS: { code: DayOfWeek; label: string }[] = [
  { code: "MON", label: "M" },
  { code: "TUE", label: "T" },
  { code: "WED", label: "W" },
  { code: "THU", label: "Th" },
  { code: "FRI", label: "F" },
  { code: "SAT", label: "Sa" },
  { code: "SUN", label: "Su" },
];

export function FreshKitchenHub() {
  const [activeCategory, setActiveCategory] = useState<FreshFoodProductCategory>("ALL");
  const [selectedDietary, setSelectedDietary] = useState<DietaryFlag | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<FreshFoodProduct[]>(MOCK_FRESH_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Active view tab: "browse" | "customizer" | "basket"
  const [activeTab, setActiveTab] = useState<"browse" | "customizer" | "basket">("browse");

  // Nutrition / Ingredients modal
  const [inspectedProduct, setInspectedProduct] = useState<FreshFoodProduct | null>(null);

  // Quick Add to Basket Day Picker Modal
  const [basketModalProduct, setBasketModalProduct] = useState<FreshFoodProduct | null>(null);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(["MON", "WED", "FRI"]);
  const [isSubmittingBasket, setIsSubmittingBasket] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Instant Buy Modal
  const [instantBuyProduct, setInstantBuyProduct] = useState<FreshFoodProduct | null>(null);
  const [isSubmittingBuy, setIsSubmittingBuy] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber: string; slot: string } | null>(null);

  useEffect(() => {
    loadProducts();
  }, [activeCategory]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await freshKitchenService.getProducts(activeCategory);
      setProducts(data);
    } catch {
      // Fallback already returned by service
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Dietary filter
      if (selectedDietary !== "ALL" && !item.dietaryFlags.includes(selectedDietary)) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesIngredient = item.ingredients.some((i) => i.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesIngredient) return false;
      }
      return true;
    });
  }, [products, selectedDietary, searchQuery]);

  const updateQuantity = (productId: string, delta: number) => {
    setQuantities((prev) => {
      const cur = prev[productId] || 1;
      const next = Math.max(1, cur + delta);
      return { ...prev, [productId]: next };
    });
  };

  const getQuantity = (productId: string) => quantities[productId] || 1;

  const handleOpenDayPicker = (product: FreshFoodProduct) => {
    setBasketModalProduct(product);
    setSelectedDays(["MON", "WED", "FRI"]);
  };

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleConfirmAddToBasket = async () => {
    if (!basketModalProduct || selectedDays.length === 0) return;
    setIsSubmittingBasket(true);
    try {
      const qty = getQuantity(basketModalProduct.id);
      await freshKitchenService.addDailyBasketItem({
        productId: basketModalProduct.id,
        itemName: `${basketModalProduct.name} (${basketModalProduct.unit})`,
        itemCategory: basketModalProduct.category,
        unitPrice: basketModalProduct.price,
        quantity: qty,
        scheduledDays: selectedDays,
        specialInstructions: "Delivered chilled at 2-4°C",
      });
      setSuccessToast(`Added ${basketModalProduct.name} to Daily Basket for ${selectedDays.join(", ")}!`);
      setBasketModalProduct(null);
      setTimeout(() => setSuccessToast(null), 4000);
    } finally {
      setIsSubmittingBasket(false);
    }
  };

  const handleExecuteInstantBuy = async () => {
    if (!instantBuyProduct) return;
    setIsSubmittingBuy(true);
    try {
      const qty = getQuantity(instantBuyProduct.id);
      const res = await freshKitchenService.createInstantBuy({
        productId: instantBuyProduct.id,
        quantity: qty,
        unitPrice: instantBuyProduct.price,
        totalPrice: instantBuyProduct.price * qty,
        deliveryAddress: "Tower 4, Flat 1204, Mana Foliage Greens, Sarjapur Road",
        flatNumber: "Tower 4 - 1204",
        preferredDeliveryTime: "06:00 AM - 06:45 AM",
      });
      setOrderSuccess({ orderNumber: res.orderNumber, slot: res.deliveryTimeSlot });
      setInstantBuyProduct(null);
    } finally {
      setIsSubmittingBuy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Notification Toast */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl animate-bounce">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="ml-2 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero / Header Section */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Mana Fresh Kitchen Hub
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Fresh Stone-Ground Batters & Morning Kits
              </h1>
              <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                100% naturally fermented, preservative-free batters and artisanal condiments.
                Maintained strictly in 2°C - 4°C active cold-chain from grinding stone to your flat door.
              </p>

              {/* Freshness Assurance Badges */}
              <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-medium">
                <span className="inline-flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 text-emerald-400 px-3 py-1.5 rounded-lg shadow-sm">
                  <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                  Chilled 2°C - 4°C Cold Chain
                </span>
                <span className="inline-flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 text-amber-300 px-3 py-1.5 rounded-lg shadow-sm">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Morning Drop: 6:00 AM - 7:30 AM
                </span>
                <span className="inline-flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  FSSAI & QA Batch Tested
                </span>
              </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="flex flex-row md:flex-col gap-3">
              <button
                onClick={() => setActiveTab("customizer")}
                className={`flex items-center justify-between gap-4 px-4 py-3 rounded-2xl text-left border transition-all ${
                  activeTab === "customizer"
                    ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-lg"
                    : "bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-100"
                }`}
              >
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Interactive Builder
                  </div>
                  <div className="text-sm font-semibold">Breakfast Combo Customizer</div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>

              <button
                onClick={() => setActiveTab("basket")}
                className={`flex items-center justify-between gap-4 px-4 py-3 rounded-2xl text-left border transition-all ${
                  activeTab === "basket"
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-lg"
                    : "bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-100"
                }`}
              >
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    Recurring Delivery
                  </div>
                  <div className="text-sm font-semibold">My Daily Basket Manager</div>
                </div>
                <Calendar className="w-4 h-4 opacity-70" />
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 mt-8 border-t border-slate-700/60 pt-4">
            <button
              onClick={() => setActiveTab("browse")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "browse"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              Browse Catalog ({products.length})
            </button>
            <button
              onClick={() => setActiveTab("customizer")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "customizer"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              Breakfast Combos (BOM)
            </button>
            <button
              onClick={() => setActiveTab("basket")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "basket"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              My Daily Basket Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {activeTab === "customizer" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveTab("browse")}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5"
              >
                ← Back to Fresh Kitchen Catalog
              </button>
            </div>
            <BreakfastComboCustomizer onNavigateToBasket={() => setActiveTab("basket")} />
          </div>
        )}

        {activeTab === "basket" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveTab("browse")}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5"
              >
                ← Back to Catalog
              </button>
            </div>
            <DailyBasketManager onExploreKitchen={() => setActiveTab("browse")} />
          </div>
        )}

        {activeTab === "browse" && (
          <>
            {/* Search and Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by batter name, grain, chutney, or ingredient..."
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dietary Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 mr-1 flex-shrink-0" />
                  {DIETARY_FILTERS.map((d) => (
                    <button
                      key={d.key}
                      onClick={() => setSelectedDietary(d.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedDietary === d.key
                          ? "bg-emerald-700 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-none">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      activeCategory === cat.key
                        ? "bg-slate-900 text-white shadow"
                        : "bg-slate-100/80 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Results Counter */}
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-xs font-semibold text-slate-500">
                Showing {filteredProducts.length} fresh products
              </span>
              <button
                onClick={loadProducts}
                className="text-xs font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {/* Product Cards Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <Leaf className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No fresh items found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try adjusting your search query or dietary filters to find fresh stone-ground batters.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedDietary("ALL");
                    setActiveCategory("ALL");
                  }}
                  className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const qty = getQuantity(product.id);
                  const savings = product.mrp - product.price;

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
                    >
                      {/* Product Image & Badges */}
                      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* 2-4°C Cold Chain Freshness Badge */}
                        <div className="absolute top-3 left-3 flex items-center gap-1 bg-cyan-900/90 text-cyan-200 text-[11px] font-extrabold px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm border border-cyan-500/30">
                          <Snowflake className="w-3 h-3 text-cyan-300 animate-pulse" />
                          2°C - 4°C Fresh Cold Chain
                        </div>

                        {/* Fermentation / Shelf life badge */}
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-md">
                          <Clock className="w-3 h-3 text-amber-400" />
                          {product.fermentationHours ? `${product.fermentationHours}h Fermented` : "Fresh Tadka"}
                          <span className="opacity-40">•</span>
                          {product.shelfLifeHours}h Shelf Life
                        </div>

                        {/* Stock status badge */}
                        <div className="absolute top-3 right-3">
                          {product.isSoldOut ? (
                            <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase shadow">
                              Sold Out
                            </span>
                          ) : product.availableStock <= 10 ? (
                            <span className="bg-amber-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow">
                              Only {product.availableStock} Left
                            </span>
                          ) : (
                            <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow">
                              In Stock
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          {/* Vendor & Rating */}
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span className="font-semibold text-emerald-800">{product.vendorName}</span>
                            <div className="flex items-center gap-1 text-amber-500 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{product.rating.toFixed(1)}</span>
                              <span className="text-slate-400 font-normal">({product.totalReviews})</span>
                            </div>
                          </div>

                          {/* Title & Unit */}
                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {product.name}
                          </h3>
                          <div className="text-xs font-semibold text-slate-500 mt-0.5">
                            Unit: {product.unit}
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                            {product.description}
                          </p>

                          {/* Dietary Tags */}
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {product.dietaryFlags.map((flag) => (
                              <span
                                key={flag}
                                className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[10px] font-bold px-2 py-0.5 rounded-md"
                              >
                                {flag.replace("_", " ")}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Price, Stepper & Action Buttons */}
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                          <div className="flex items-baseline justify-between">
                            <div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl font-black text-slate-950">₹{product.price}</span>
                                <span className="text-xs text-slate-400 line-through">₹{product.mrp}</span>
                                {savings > 0 && (
                                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                                    Save ₹{savings}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400">Doorstep morning delivery</span>
                            </div>

                            {/* Quantity Stepper */}
                            <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5">
                              <button
                                onClick={() => updateQuantity(product.id, -1)}
                                className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg transition-all"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-7 text-center text-xs font-bold text-slate-900">{qty}</span>
                              <button
                                onClick={() => updateQuantity(product.id, 1)}
                                className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg transition-all"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleOpenDayPicker(product)}
                              disabled={product.isSoldOut}
                              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300/80 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                            >
                              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                              Add to Basket
                            </button>

                            <button
                              onClick={() => setInstantBuyProduct(product)}
                              disabled={product.isSoldOut}
                              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                            >
                              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                              Buy Tomorrow
                            </button>
                          </div>

                          {/* Nutrition / Ingredients Inspector Link */}
                          <button
                            onClick={() => setInspectedProduct(product)}
                            className="w-full text-center text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 pt-1"
                          >
                            <Info className="w-3 h-3" />
                            View Ingredients & Nutrition Facts
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Day of Week Selector Modal for "Add to Basket" ── */}
      {basketModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Daily Basket Schedule
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  Choose Delivery Days
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  How often should we deliver <b>{basketModalProduct.name}</b>?
                </p>
              </div>
              <button
                onClick={() => setBasketModalProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Summary */}
            <div className="bg-slate-50 rounded-2xl p-3.5 my-4 border border-slate-200/80 flex items-center gap-3">
              <img
                src={basketModalProduct.imageUrl}
                alt={basketModalProduct.name}
                className="w-14 h-14 rounded-xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {basketModalProduct.name}
                </div>
                <div className="text-[11px] text-slate-500">
                  Qty: {getQuantity(basketModalProduct.id)} × ₹{basketModalProduct.price} ({basketModalProduct.unit})
                </div>
                <div className="text-[11px] font-bold text-emerald-700 mt-0.5">
                  ₹{basketModalProduct.price * getQuantity(basketModalProduct.id)} per delivery day
                </div>
              </div>
            </div>

            {/* Day Pills */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Deliver on which days?
              </label>
              <div className="grid grid-cols-7 gap-1.5">
                {ALL_DAYS.map((d) => {
                  const isSelected = selectedDays.includes(d.code);
                  return (
                    <button
                      key={d.code}
                      onClick={() => toggleDay(d.code)}
                      className={`h-11 rounded-xl flex flex-col items-center justify-center text-xs font-black transition-all ${
                        isSelected
                          ? "bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-500/20"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span>{d.label}</span>
                      <span className="text-[9px] font-normal opacity-80">{d.code}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDays(["MON", "WED", "FRI"])}
                  className="text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg"
                >
                  Mon - Wed - Fri
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDays(["SAT", "SUN"])}
                  className="text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg"
                >
                  Weekends Only
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDays(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"])}
                  className="text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg"
                >
                  Daily (7 Days)
                </button>
              </div>
            </div>

            {/* Total Schedule Projection */}
            <div className="bg-emerald-50 rounded-2xl p-3 my-4 border border-emerald-200 text-xs flex items-center justify-between">
              <span className="text-emerald-900 font-medium">
                {selectedDays.length} drops/week:
              </span>
              <span className="text-emerald-950 font-black">
                ₹{basketModalProduct.price * getQuantity(basketModalProduct.id) * selectedDays.length} / week
              </span>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirmAddToBasket}
              disabled={isSubmittingBasket || selectedDays.length === 0}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmittingBasket ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Confirm & Save to Daily Basket
            </button>
          </div>
        </div>
      )}

      {/* ── Instant Buy Checkout Modal ── */}
      {instantBuyProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-700">
                  Instant Morning Delivery
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  Confirm One-Time Order
                </h3>
              </div>
              <button
                onClick={() => setInstantBuyProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 my-4 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>{instantBuyProduct.name}</span>
                <span>₹{instantBuyProduct.price * getQuantity(instantBuyProduct.id)}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Quantity: {getQuantity(instantBuyProduct.id)} pack ({instantBuyProduct.unit})
              </div>
              <div className="text-[11px] text-slate-600 border-t border-slate-200 pt-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-600" />
                Delivery Slot: <b>Tomorrow, 6:00 AM - 6:45 AM</b>
              </div>
              <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-emerald-600" />
                Chilled insulated box packaging included (2°C - 4°C)
              </div>
            </div>

            <div className="text-xs text-slate-600 mb-4 bg-amber-50 border border-amber-200 p-3 rounded-xl">
              📍 Delivering to: <b>Tower 4, Flat 1204</b> (Mana Foliage Greens)
            </div>

            <button
              onClick={handleExecuteInstantBuy}
              disabled={isSubmittingBuy}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isSubmittingBuy ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
              )}
              Pay ₹{instantBuyProduct.price * getQuantity(instantBuyProduct.id)} & Confirm Order
            </button>
          </div>
        </div>
      )}

      {/* ── Order Success Modal ── */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Order Confirmed!</h3>
            <p className="text-xs text-slate-500 mt-1">
              Order ID: <b className="text-slate-800">{orderSuccess.orderNumber}</b>
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 my-4 text-xs text-slate-600 text-left space-y-1">
              <div>⏰ <b>Dispatch Slot:</b> {orderSuccess.slot}</div>
              <div>❄️ <b>Cold Chain:</b> 2-4°C Insulated Pack</div>
              <div>🏠 <b>Location:</b> Flat Doorstep</div>
            </div>
            <button
              onClick={() => setOrderSuccess(null)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ── Ingredients & Nutrition Inspector Modal ── */}
      {inspectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Batch & Nutrition Transparency
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  {inspectedProduct.name}
                </h3>
                <p className="text-xs text-slate-500">{inspectedProduct.storageInstructions}</p>
              </div>
              <button
                onClick={() => setInspectedProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ingredients Section */}
            <div className="mt-5 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                100% Clean Ingredients
              </h4>
              <div className="flex flex-wrap gap-2">
                {inspectedProduct.ingredients.map((ing) => (
                  <span
                    key={ing}
                    className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-lg border border-slate-200 font-medium"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>

            {/* Nutrition Facts Table */}
            {inspectedProduct.nutritionalInfo && (
              <div className="mt-5 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Nutritional Facts (Per 100g)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                    <div className="text-xs text-amber-800 font-semibold">Calories</div>
                    <div className="text-base font-black text-amber-950">
                      {inspectedProduct.nutritionalInfo.calories} kcal
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                    <div className="text-xs text-emerald-800 font-semibold">Protein</div>
                    <div className="text-base font-black text-emerald-950">
                      {inspectedProduct.nutritionalInfo.protein}g
                    </div>
                  </div>
                  <div className="bg-cyan-50 border border-cyan-200 p-2.5 rounded-xl">
                    <div className="text-xs text-cyan-800 font-semibold">Carbs</div>
                    <div className="text-base font-black text-cyan-950">
                      {inspectedProduct.nutritionalInfo.carbs}g
                    </div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 p-2.5 rounded-xl">
                    <div className="text-xs text-purple-800 font-semibold">Fiber</div>
                    <div className="text-base font-black text-purple-950">
                      {inspectedProduct.nutritionalInfo.fiber || 2}g
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quality & Traceability Specs */}
            <div className="mt-5 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>FSSAI License:</span>
                <span className="font-mono font-bold text-slate-800">
                  {inspectedProduct.fssaiNumber || "11521018000452"}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Production Batch:</span>
                <span className="font-mono font-bold text-slate-800">
                  {inspectedProduct.preparationBatchId || "BAT-2026-031"}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fermentation Time:</span>
                <span className="font-bold text-slate-800">
                  {inspectedProduct.fermentationHours || 14} Hours (Natural Culture)
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cold Chain Verification:</span>
                <span className="font-bold text-emerald-700">Strictly 2°C - 4°C Maintained</span>
              </div>
            </div>

            <button
              onClick={() => setInspectedProduct(null)}
              className="mt-6 w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default FreshKitchenHub;
