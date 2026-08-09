import React, { useState } from "react";
import { CalendarDays, Plus, AlertCircle, CheckCircle2, Sparkles, Filter } from "lucide-react";
import { GlassCard, TouchButton, StatusChip } from "./EventDesignSystem";

interface InventoryModuleViewProps {
  isDark?: boolean;
}

export const InventoryModuleView: React.FC<InventoryModuleViewProps> = ({ isDark = false }) => {
  const [filter, setFilter] = useState("all");

  const equipmentList = [
    {
      name: "Main Stage 40x24ft Structure",
      category: "Stage & Venue",
      available: 1,
      required: 1,
      sponsored: true,
      sponsorName: "Apex Builders",
      status: "Ready",
      image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80",
    },
    {
      name: "Line Array JBL Speaker System",
      category: "Audio / Sound",
      available: 8,
      required: 12,
      sponsored: false,
      sponsorName: null,
      status: "Need 4 More",
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
    },
    {
      name: "VIP Padded Chairs",
      category: "Seating",
      available: 450,
      required: 500,
      sponsored: true,
      sponsorName: "Reliance Retail",
      status: "Need 50 More",
      image: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=400&q=80",
    },
    {
      name: "LED Stage Moving Lights",
      category: "Lighting",
      available: 24,
      required: 24,
      sponsored: true,
      sponsorName: "HDFC Bank",
      status: "Ready",
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80",
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-extrabold text-[#FF6B00] uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Operations Inventory
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Equipment & Assets</h2>
        </div>

        <button
          onClick={() => alert("Add equipment modal opened")}
          className="px-3.5 py-2.5 rounded-2xl bg-[#FF6B00] text-white text-xs font-bold shadow-md hover:scale-105 cursor-pointer flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          <span>Add Asset</span>
        </button>
      </div>

      {/* Grid of Equipment Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {equipmentList.map((item, idx) => {
          const percent = Math.min(100, Math.round((item.available / item.required) * 100));
          const isFull = percent >= 100;

          return (
            <GlassCard key={idx} isDark={isDark} hoverScale={false} className="p-4 border space-y-3">
              <div className="flex items-center gap-3">
                <img src={item.image} alt={item.name} className="w-14 h-14 rounded-2xl object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{item.category}</span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">{item.name}</h4>
                  <StatusChip status={item.status} isDark={isDark} />
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Available: {item.available} / {item.required}</span>
                  <span className={isFull ? "text-emerald-500 font-bold" : "text-amber-500 font-bold"}>
                    {percent}% Stocked
                  </span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    style={{ width: `${percent}%` }}
                    className={`h-full rounded-full ${isFull ? "bg-emerald-500" : "bg-amber-500"}`}
                  />
                </div>

                {item.sponsored && (
                  <p className="text-[10px] text-[#FF6B00] font-bold mt-1">
                    🎁 Sponsored by {item.sponsorName}
                  </p>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};
