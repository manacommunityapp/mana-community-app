import React, { useState } from "react";
import { Utensils, QrCode, CheckCircle2, Clock, Trash2, PieChart, Sparkles, Search } from "lucide-react";
import { GlassCard, TouchButton, StatusChip, BottomSheet } from "./EventDesignSystem";

interface FoodModuleViewProps {
  isDark?: boolean;
}

export const FoodModuleView: React.FC<FoodModuleViewProps> = ({ isDark = false }) => {
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [validationResult, setValidationResult] = useState<string | null>(null);

  const menus = [
    { type: "Breakfast", item: "Idli, Vada, Chutney & Filter Coffee", time: "07:30 AM - 10:00 AM", served: 1200, capacity: 1500 },
    { type: "Grand Maha Prasadam", item: "Puri, Chole, Puliyogare, Sweets & Payasam", time: "12:30 PM - 03:30 PM", served: 2800, capacity: 3500 },
    { type: "Evening Snacks", item: "Samosa, Tea & Evening Prasadam", time: "05:00 PM - 07:00 PM", served: 800, capacity: 1200 },
  ];

  const handleValidateCoupon = () => {
    if (!couponCode.trim()) return;
    setValidationResult(`Valid Coupon! Registered to Sandeep Kumar (Pass #8849) - 1 Meal Plate Allowed.`);
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-extrabold text-[#FF6B00] uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Food OS & Catering
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Kitchen & Meal Pass OS</h2>
        </div>

        <button
          onClick={() => setShowCouponModal(true)}
          className="px-3.5 py-2.5 rounded-2xl bg-[#FF6B00] text-white text-xs font-bold shadow-md hover:scale-105 cursor-pointer flex items-center gap-1.5"
        >
          <QrCode className="w-4 h-4" />
          <span>Validate Coupon</span>
        </button>
      </div>

      {/* Kitchen Status Overview */}
      <GlassCard isDark={isDark} hoverScale={false} className="p-5 border space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Plates Planned</span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">4,200 Plates Today</h3>
          </div>
          <StatusChip status="Kitchen Active" isDark={isDark} />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Served</span>
            <span className="text-sm font-black text-[#16A34A] block mt-0.5">3,200</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Remaining</span>
            <span className="text-sm font-black text-[#FF6B00] block mt-0.5">1,000</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Food Waste</span>
            <span className="text-sm font-black text-rose-500 block mt-0.5">&lt; 2%</span>
          </div>
        </div>

        {/* Preparation Progress Meter */}
        <div>
          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
            <span>Overall Kitchen Preparation Progress</span>
            <span className="text-[#FF6B00]">82% Prepared</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#FF6B00] to-[#16A34A] rounded-full w-[82%]" />
          </div>
        </div>
      </GlassCard>

      {/* Menu Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Today's Meal Schedule</h3>

        {menus.map((m, idx) => (
          <GlassCard key={idx} isDark={isDark} hoverScale={false} className="p-4 border space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-orange-100 dark:bg-slate-800 text-[#FF6B00]">
                {m.type}
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400">{m.time}</span>
            </div>

            <h4 className="text-xs font-bold text-slate-900 dark:text-white">{m.item}</h4>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Plates Served: {m.served} / {m.capacity}</span>
              <span className="text-emerald-500 font-bold">On Schedule</span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Coupon Validator Modal */}
      <BottomSheet
        isOpen={showCouponModal}
        onClose={() => {
          setShowCouponModal(false);
          setValidationResult(null);
        }}
        title="Meal Coupon Scanner"
        subtitle="Validate food coupon codes or scan attendee QR passes at counter"
        isDark={isDark}
      >
        <div className="space-y-4 p-2">
          <input
            type="text"
            placeholder="Enter Coupon Code (e.g. MEAL-8849)"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="w-full h-12 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold outline-none text-slate-900 dark:text-white border focus:border-[#FF6B00]"
          />

          <TouchButton variant="primary" fullWidth onClick={handleValidateCoupon}>
            Validate Coupon
          </TouchButton>

          {validationResult && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-xs font-bold border border-emerald-200 dark:border-emerald-800 text-center animate-fadeIn">
              {validationResult}
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
};
