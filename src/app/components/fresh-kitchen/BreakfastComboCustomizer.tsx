import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  Snowflake,
  Clock,
  Layers,
  Flame,
  Coffee,
  Heart,
  ChevronRight,
  ShieldCheck,
  Utensils,
  RefreshCw,
} from "lucide-react";
import {
  freshKitchenService,
  MOCK_BREAKFAST_COMBOS,
  MOCK_FRESH_PRODUCTS,
} from "../../../services/fresh-kitchen/freshKitchenService";
import type {
  BreakfastCombo,
  BreakfastComboItem,
  FreshFoodProduct,
  DayOfWeek,
} from "../../../types/freshKitchen";

interface Props {
  onNavigateToBasket?: () => void;
}

const ALL_DAYS: { code: DayOfWeek; label: string }[] = [
  { code: "MON", label: "M" },
  { code: "TUE", label: "T" },
  { code: "WED", label: "W" },
  { code: "THU", label: "Th" },
  { code: "FRI", label: "F" },
  { code: "SAT", label: "Sa" },
  { code: "SUN", label: "Su" },
];

export function BreakfastComboCustomizer({ onNavigateToBasket }: Props) {
  const [combos, setCombos] = useState<BreakfastCombo[]>(MOCK_BREAKFAST_COMBOS);
  const [selectedComboId, setSelectedComboId] = useState<string>(
    MOCK_BREAKFAST_COMBOS[0]?.id || "combo-royal-idli-dosa"
  );

  // Selected combo
  const currentCombo = useMemo(() => {
    return combos.find((c) => c.id === selectedComboId) || combos[0];
  }, [combos, selectedComboId]);

  // Main Batter Selection (defaults to combo's main product)
  const [selectedBatterId, setSelectedBatterId] = useState<string>(
    currentCombo?.mainProduct?.id || "prod-std-idli-1"
  );

  // Mandatory Chutney Selection
  const [selectedChutneyId, setSelectedChutneyId] = useState<string>(
    currentCombo?.mandatoryChutneyOptions[0]?.id || "prod-chut-coconut-7"
  );

  // Optional Add-ons Selection & Quantities
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([
    "addon-sambar-300ml",
    "addon-ghee-50g",
  ]);
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>({
    "addon-sambar-300ml": 1,
    "addon-ghee-50g": 1,
  });

  // Servings / Scale Multiplier
  const [servingsMultiplier, setServingsMultiplier] = useState<number>(1); // 1 = 2-3 persons, 2 = 4-6 persons

  // Day of week schedule for Daily Basket
  const [scheduledDays, setScheduledDays] = useState<DayOfWeek[]>(["SAT", "SUN"]);
  const [isAddingBasket, setIsAddingBasket] = useState(false);
  const [isInstantBuying, setIsInstantBuying] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Available Batters to swap into BOM
  const availableBatterOptions = useMemo(() => {
    return MOCK_FRESH_PRODUCTS.filter(
      (p) =>
        p.category === "STANDARD_BATTER" ||
        p.category === "SPECIALTY_BATTER" ||
        p.category === "MILLET_BATTER"
    );
  }, []);

  // Update selections when combo changes
  useEffect(() => {
    if (currentCombo) {
      setSelectedBatterId(currentCombo.mainProduct.id);
      if (currentCombo.mandatoryChutneyOptions[0]) {
        setSelectedChutneyId(currentCombo.mandatoryChutneyOptions[0].id);
      }
    }
  }, [selectedComboId, currentCombo]);

  // Resolve objects
  const activeBatter = useMemo(() => {
    return (
      availableBatterOptions.find((b) => b.id === selectedBatterId) ||
      currentCombo?.mainProduct ||
      MOCK_FRESH_PRODUCTS[0]
    );
  }, [availableBatterOptions, selectedBatterId, currentCombo]);

  const activeChutney = useMemo(() => {
    return (
      currentCombo?.mandatoryChutneyOptions.find((c) => c.id === selectedChutneyId) ||
      currentCombo?.mandatoryChutneyOptions[0] ||
      MOCK_FRESH_PRODUCTS[6]
    );
  }, [currentCombo, selectedChutneyId]);

  // Toggle optional addon
  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const updateAddonQty = (addonId: string, delta: number) => {
    setAddonQuantities((prev) => {
      const cur = prev[addonId] || 1;
      const next = Math.max(1, cur + delta);
      return { ...prev, [addonId]: next };
    });
  };

  const toggleDay = (day: DayOfWeek) => {
    setScheduledDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Live BOM Dynamic Price Calculation
  const computedPrice = useMemo(() => {
    if (!currentCombo) return 0;
    // Base combo price covers default batter + mandatory chutney
    let total = currentCombo.finalPrice;

    // Price differential if user upgraded to a premium specialty/millet batter
    const batterDelta = activeBatter.price - currentCombo.mainProduct.price;
    if (batterDelta > 0) total += batterDelta;

    // Optional addons
    for (const addonId of selectedAddonIds) {
      const addon = currentCombo.optionalAddons.find((a) => a.id === addonId);
      if (addon) {
        const qty = addonQuantities[addonId] || 1;
        total += addon.price * qty;
      }
    }

    return total * servingsMultiplier;
  }, [
    currentCombo,
    activeBatter,
    selectedAddonIds,
    addonQuantities,
    servingsMultiplier,
  ]);

  const handleAddToDailyBasket = async () => {
    if (scheduledDays.length === 0) {
      alert("Please choose at least one day for weekly delivery.");
      return;
    }
    setIsAddingBasket(true);
    try {
      const addonNames = selectedAddonIds
        .map((id) => currentCombo?.optionalAddons.find((a) => a.id === id)?.name)
        .filter(Boolean)
        .join(", ");

      const instructions = `Custom Combo: Batter: ${activeBatter.name} | Chutney: ${activeChutney.name} | Extras: ${addonNames || "None"} | Servings: ${servingsMultiplier === 1 ? "2-3 Persons" : "4-6 Persons"}`;

      await freshKitchenService.addDailyBasketItem({
        comboId: currentCombo?.id,
        productId: activeBatter.id,
        itemName: `${currentCombo?.name} (Customized)`,
        itemCategory: "BREAKFAST_KIT",
        unitPrice: computedPrice,
        quantity: 1,
        scheduledDays,
        specialInstructions: instructions,
      });

      setToastMessage(
        `Added customized ${currentCombo?.name} to Daily Basket for ${scheduledDays.join(", ")}!`
      );
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsAddingBasket(false);
    }
  };

  const handleInstantBuy = async () => {
    setIsInstantBuying(true);
    try {
      const res = await freshKitchenService.createInstantBuy({
        comboId: currentCombo?.id,
        productId: activeBatter.id,
        quantity: 1,
        selectedChutneyId: activeChutney.id,
        selectedAddonIds,
        unitPrice: computedPrice,
        totalPrice: computedPrice,
        deliveryAddress: "Tower 4 - 1204, Mana Foliage Greens, Sarjapur Road",
        flatNumber: "Tower 4, Flat 1204",
        preferredDeliveryTime: "06:00 AM - 06:45 AM",
      });

      setToastMessage(`Instant Order Placed! ${res.orderNumber} scheduled for tomorrow 6:00 AM.`);
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setIsInstantBuying(false);
    }
  };

  if (!currentCombo) return null;

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
          {onNavigateToBasket && (
            <button
              onClick={onNavigateToBasket}
              className="ml-3 text-xs font-bold text-amber-400 underline hover:text-amber-300"
            >
              View Basket
            </button>
          )}
        </div>
      )}

      {/* Header & Combo Selection Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Bill of Materials (BOM) Interactive Builder
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-1">
              Customize Your Breakfast Combo
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose your favorite fresh stone-ground batter, mandatory fresh chutney, and breakfast condiments.
            </p>
          </div>

          {/* Combo Selector Radio Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {combos.map((combo) => (
              <button
                key={combo.id}
                onClick={() => setSelectedComboId(combo.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all border ${
                  selectedComboId === combo.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {combo.name}
              </button>
            ))}
          </div>
        </div>

        {/* Servings Multiplier Segmented Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-700">Portion Size:</span>
            <div className="inline-flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setServingsMultiplier(1)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  servingsMultiplier === 1
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Family (2-3 Persons)
              </button>
              <button
                onClick={() => setServingsMultiplier(2)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  servingsMultiplier === 2
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Large Feast (4-6 Persons, 2x)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1 text-cyan-700">
              <Snowflake className="w-3.5 h-3.5" />
              2°C - 4°C Cold Pack
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-amber-700">
              <Clock className="w-3.5 h-3.5" />
              Delivered 6:30 AM
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout: BOM Builder on Left, Live Price Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): BOM Interactive Steps */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── STEP 1: Main Batter Selection (BOM Component 1) ── */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Select Main Fresh Batter (Stone-Ground)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Fermented 12-16 hours naturally. Choose classic or millet batter.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                Mandatory Base
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {availableBatterOptions.map((batter) => {
                const isSelected = selectedBatterId === batter.id;
                const priceDiff = batter.price - currentCombo.mainProduct.price;

                return (
                  <div
                    key={batter.id}
                    onClick={() => setSelectedBatterId(batter.id)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 relative ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/40 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <img
                      src={batter.imageUrl}
                      alt={batter.name}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {batter.name}
                        </h4>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{batter.unit}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] font-bold text-slate-500">
                          {batter.fermentationHours}h fermentation
                        </span>
                        {priceDiff > 0 ? (
                          <span className="text-[11px] font-bold text-amber-700">
                            +₹{priceDiff} upgrade
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700">
                            Included
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── STEP 2: Mandatory Chutney Selection (BOM Component 2) ── */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Choose Fresh Morning Chutney (250g)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Prepared daily at 4:30 AM with fresh coconut or roasted tomatoes.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                Included in Combo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentCombo.mandatoryChutneyOptions.map((chutney) => {
                const isSelected = selectedChutneyId === chutney.id;

                return (
                  <div
                    key={chutney.id}
                    onClick={() => setSelectedChutneyId(chutney.id)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/40 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <img
                      src={chutney.imageUrl}
                      alt={chutney.name}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {chutney.name}
                        </h4>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{chutney.unit}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-slate-400">Tadka-Ready</span>
                        <span className="text-[11px] font-bold text-emerald-700">Included</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── STEP 3: Optional Extras & Condiments (BOM Component 3) ── */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Add Breakfast Enhancers & Beverages
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Desi cow ghee, fresh Udupi sambar, gunpowder podi, or degree coffee.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200/60">
                Optional
              </span>
            </div>

            <div className="space-y-2.5 pt-2">
              {currentCombo.optionalAddons.map((addon) => {
                const isSelected = selectedAddonIds.includes(addon.id);
                const qty = addonQuantities[addon.id] || 1;

                return (
                  <div
                    key={addon.id}
                    className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? "border-purple-500 bg-purple-50/30"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div
                      onClick={() => toggleAddon(addon.id)}
                      className="flex items-center gap-3 flex-1 cursor-pointer select-none"
                    >
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-purple-600 border-purple-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{addon.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {addon.unit} • {addon.description || "Authentic freshly prepared"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-900">₹{addon.price}</span>

                      {isSelected && (
                        <div className="flex items-center border border-purple-200 rounded-xl bg-white p-0.5 shadow-sm">
                          <button
                            onClick={() => updateAddonQty(addon.id, -1)}
                            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-purple-50 rounded"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-purple-950">
                            {qty}
                          </span>
                          <button
                            onClick={() => updateAddonQty(addon.id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-purple-50 rounded"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Live Pricing, BOM Summary & Order Actions */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 shadow-xl border border-slate-700/80 sticky top-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Live BOM Summary
            </span>
            <h3 className="text-xl font-black mt-1">{currentCombo.name}</h3>

            {/* Bill of Materials Breakdown */}
            <div className="space-y-3 my-5 border-t border-b border-slate-700/70 py-4 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="text-amber-400 font-bold">1×</span>
                  {activeBatter.name}
                </span>
                <span className="font-bold text-white">
                  ₹{(activeBatter.price * servingsMultiplier)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="text-emerald-400 font-bold">1×</span>
                  {activeChutney.name}
                </span>
                <span className="font-bold text-white">Included</span>
              </div>

              {selectedAddonIds.map((addonId) => {
                const addon = currentCombo.optionalAddons.find((a) => a.id === addonId);
                if (!addon) return null;
                const qty = addonQuantities[addonId] || 1;
                return (
                  <div key={addonId} className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="text-purple-400 font-bold">{qty}×</span>
                      {addon.name}
                    </span>
                    <span className="font-bold text-white">
                      ₹{addon.price * qty * servingsMultiplier}
                    </span>
                  </div>
                );
              })}

              {servingsMultiplier > 1 && (
                <div className="flex items-center justify-between text-amber-300 text-[11px] pt-1">
                  <span>Portion Multiplier:</span>
                  <span className="font-bold">2× (4-6 Persons)</span>
                </div>
              )}
            </div>

            {/* Computed Price Header */}
            <div className="flex items-baseline justify-between mb-6">
              <div>
                <div className="text-xs text-slate-400">Total Live Price</div>
                <div className="text-3xl font-black text-white">₹{computedPrice}</div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  {currentCombo.discountPercentage}% Combo Savings
                </span>
              </div>
            </div>

            {/* Schedule Selector for Basket */}
            <div className="space-y-2 mb-6 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700">
              <label className="text-[11px] font-bold text-slate-300 block">
                Select Recurring Delivery Days:
              </label>
              <div className="grid grid-cols-7 gap-1">
                {ALL_DAYS.map((d) => {
                  const isDay = scheduledDays.includes(d.code);
                  return (
                    <button
                      key={d.code}
                      onClick={() => toggleDay(d.code)}
                      className={`h-9 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                        isDay
                          ? "bg-emerald-500 text-slate-950 shadow-sm"
                          : "bg-slate-700/60 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
              <div className="text-[10px] text-slate-400 text-center pt-1">
                {scheduledDays.length} morning drops per week
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={handleAddToDailyBasket}
                disabled={isAddingBasket || scheduledDays.length === 0}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAddingBasket ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
                Add Custom Combo to Daily Basket
              </button>

              <button
                onClick={handleInstantBuy}
                disabled={isInstantBuying}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs transition-all border border-slate-600 flex items-center justify-center gap-2"
              >
                {isInstantBuying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                )}
                Instant Buy (Tomorrow 6:30 AM Delivery)
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Zero chemical preservatives or artificial soda</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Snowflake className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span>Cold-insulated packaging keeps batter active at 2-4°C</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default BreakfastComboCustomizer;
