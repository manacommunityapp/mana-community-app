import React, { useState } from "react";
import {
  Calendar,
  Clock,
  ArrowRightLeft,
  CheckCircle2,
  Sparkles,
  Info,
  Flame,
  Dna,
  Wheat,
  ShieldAlert,
} from "lucide-react";
import type {
  WellnessMenuWeek,
  WellnessMenuDay,
  WellnessNutrition,
  WellnessSwapRequest,
} from "../../../types/wellnessBasket";

interface WeeklyMenuCalendarProps {
  menuWeek: WellnessMenuWeek;
  onSwapItem: (request: WellnessSwapRequest) => Promise<void>;
  isSubscriber: boolean;
}

export const WeeklyMenuCalendar: React.FC<WeeklyMenuCalendarProps> = ({
  menuWeek,
  onSwapItem,
  isSubscriber,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [swapModalDay, setSwapModalDay] = useState<WellnessMenuDay | null>(null);
  const [productToSwap, setProductToSwap] = useState<WellnessNutrition | null>(null);
  const [selectedReplacementId, setSelectedReplacementId] = useState<number | null>(null);
  const [swapReason, setSwapReason] = useState<string>("");
  const [isSwapping, setIsSwapping] = useState<boolean>(false);

  const currentDay = menuWeek.days[selectedDayIndex] || menuWeek.days[0];

  const handleOpenSwapModal = (day: WellnessMenuDay, product: WellnessNutrition) => {
    setSwapModalDay(day);
    setProductToSwap(product);
    setSelectedReplacementId(day.alternativeProducts[0]?.productId || null);
    setSwapReason("");
  };

  const handleConfirmSwap = async () => {
    if (!swapModalDay || !productToSwap || !selectedReplacementId) return;
    setIsSwapping(true);
    try {
      await onSwapItem({
        deliveryDate: swapModalDay.deliveryDate,
        originalProductId: productToSwap.productId,
        requestedProductId: selectedReplacementId,
        reason: swapReason,
      });
      setSwapModalDay(null);
      setProductToSwap(null);
    } catch (e) {
      console.error("Swap error", e);
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Swap Window Announcement Banner */}
      <div
        className={`px-6 py-3.5 flex items-center justify-between border-b ${
          menuWeek.isSwapWindowOpen
            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            : "bg-slate-50 text-slate-700 border-slate-200"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Clock className={`w-4 h-4 ${menuWeek.isSwapWindowOpen ? "text-emerald-100" : "text-slate-400"}`} />
          <span className="text-xs font-semibold">
            {menuWeek.swapWindowCloseMessage}
          </span>
        </div>
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            menuWeek.isSwapWindowOpen
              ? "bg-white/20 text-white backdrop-blur-sm"
              : "bg-slate-200 text-slate-600"
          }`}
        >
          {menuWeek.isSwapWindowOpen ? "SWAPS ACTIVE" : "LOCKED"}
        </span>
      </div>

      {/* Calendar Week Tabs */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              4-Week Rotation Cycle (Week {menuWeek.cycleWeek} of 4)
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Weekly Nutrition Schedule ({menuWeek.weekStartDate} to {menuWeek.weekEndDate})
            </h3>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
            Plan: {menuWeek.planType}
          </span>
        </div>

        {/* Day Selector Pills */}
        <div className="grid grid-cols-6 gap-2 mb-6">
          {menuWeek.days.map((day, idx) => {
            const isSelected = selectedDayIndex === idx;
            return (
              <button
                key={day.deliveryDate}
                type="button"
                onClick={() => setSelectedDayIndex(idx)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50/70 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <span className="text-[11px] uppercase tracking-wider font-bold block text-slate-500">
                  {day.dayOfWeekName.substring(0, 3)}
                </span>
                <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                  {new Date(day.deliveryDate).getDate()}
                </span>
                <div className="mt-1 flex items-center justify-center gap-1">
                  {day.isSwapped && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Custom swapped item" />
                  )}
                  <span className="text-[10px] text-slate-500 font-medium">
                    {day.totalEnergyKcal} kcal
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Day Card */}
        {currentDay && (
          <div className="space-y-6">
            {/* Dietitian Notes & Daily Macros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Dietitian Formulation for {currentDay.dayOfWeekName}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{currentDay.dietitianNotes}"
                </p>
              </div>

              {/* Macro Nutrients Grid */}
              <div className="grid grid-cols-4 gap-2 text-center border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
                <div className="p-2 rounded-lg bg-white border border-slate-100">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-amber-600 font-bold">
                    <Flame className="w-3 h-3" /> Cals
                  </div>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">
                    {currentDay.totalEnergyKcal}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-100">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-bold">
                    <Dna className="w-3 h-3" /> Pro
                  </div>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">
                    {currentDay.totalProteinG}g
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-100">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-blue-600 font-bold">
                    <Wheat className="w-3 h-3" /> Carb
                  </div>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">
                    {currentDay.totalCarbsG}g
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-100">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-purple-600 font-bold">
                    Fibre
                  </div>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">
                    {currentDay.totalFibreG}g
                  </span>
                </div>
              </div>
            </div>

            {/* Daily Box Product Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">
                  Morning Box Items ({currentDay.products.length} portions)
                </h4>
                {currentDay.activeSwapStatus && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Swap: {currentDay.activeSwapStatus}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {currentDay.products.map((item) => (
                  <div
                    key={item.productId}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                          {item.category.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs font-extrabold text-slate-800">
                          {item.energyKcal} kcal
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-900 text-xs mt-2">{item.productName}</h5>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>P: {item.proteinG}g</span>
                        <span>•</span>
                        <span>C: {item.carbsG}g</span>
                        <span>•</span>
                        <span>F: {item.fatG}g</span>
                      </div>

                      {/* Goal tags */}
                      {item.goalTags && item.goalTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {item.goalTags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700"
                            >
                              {tag.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Swap button (shown if swap window is open and user is subscriber) */}
                    {isSubscriber && menuWeek.isSwapWindowOpen && currentDay.alternativeProducts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleOpenSwapModal(currentDay, item)}
                        className="mt-3 w-full py-1.5 px-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        Swap Item
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SWAP MODAL */}
      {swapModalDay && productToSwap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Swap Item for {swapModalDay.dayOfWeekName}
                </h4>
                <p className="text-xs text-slate-500">
                  Replacing: <span className="font-semibold text-slate-800">{productToSwap.productName}</span>
                </p>
              </div>
              <button
                onClick={() => setSwapModalDay(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-2">
                  Select Dietitian-Approved Alternative:
                </label>
                <div className="space-y-2">
                  {swapModalDay.alternativeProducts.map((alt) => {
                    const isSelected = selectedReplacementId === alt.productId;
                    return (
                      <div
                        key={alt.productId}
                        onClick={() => setSelectedReplacementId(alt.productId)}
                        className={`cursor-pointer p-3 rounded-xl border transition-all ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/50"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">{alt.productName}</span>
                          <span className="text-slate-500 font-medium">{alt.energyKcal} kcal</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Protein: {alt.proteinG}g | Carbs: {alt.carbsG}g | Fat: {alt.fatG}g
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Reason for Swap (Optional)
                </label>
                <input
                  type="text"
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  placeholder="e.g. Prefer chickpeas over paneer this week..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
              <button
                onClick={() => setSwapModalDay(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSwap}
                disabled={isSwapping || !selectedReplacementId}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {isSwapping ? "Saving Swap..." : "Confirm Item Swap"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
