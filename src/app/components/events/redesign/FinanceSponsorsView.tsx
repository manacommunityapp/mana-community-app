import React, { useState } from "react";
import { DollarSign, TrendingUp, Star, Award, Plus, ArrowUpRight, Sparkles, Building, PhoneCall } from "lucide-react";
import { GlassCard, TouchButton, StatusChip } from "./EventDesignSystem";

interface FinanceSponsorsViewProps {
  isDark?: boolean;
}

export const FinanceSponsorsView: React.FC<FinanceSponsorsViewProps> = ({ isDark = false }) => {
  const [activeTab, setActiveTab] = useState<"finance" | "sponsors">("finance");

  const financialSummary = {
    totalBudget: "₹7,50,000",
    totalCollected: "₹6,10,000",
    totalSpent: "₹4,82,000",
    sponsorships: "₹4,50,000",
    donations: "₹1,20,000",
    ticketFees: "₹40,000",
  };

  const sponsors = [
    {
      name: "Apex Builders & Infrastructure",
      category: "Platinum Sponsor",
      contribution: "₹2,50,000",
      logo: "🏢",
      contact: "Rajesh Sharma (MD)",
      phone: "+91 98222 11100",
      status: "Payment Verified",
    },
    {
      name: "Reliance Retail Digital",
      category: "Platinum Sponsor",
      contribution: "₹2,00,000",
      logo: "🛍️",
      contact: "Anita Patel (Marketing Head)",
      phone: "+91 98333 22211",
      status: "Payment Verified",
    },
    {
      name: "HDFC Bank Ltd",
      category: "Gold Sponsor",
      contribution: "₹1,00,000",
      logo: "🏦",
      contact: "Vikas Reddy (Branch Manager)",
      phone: "+91 98444 33322",
      status: "Payment Verified",
    },
    {
      name: "Apollo Multispeciality Hospitals",
      category: "Gold Sponsor",
      contribution: "₹75,000",
      logo: "🏥",
      contact: "Dr. K. Rao (Community PR)",
      phone: "+91 98555 44433",
      status: "Pending Clearance",
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-extrabold text-[#FF6B00] uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Treasury & Partners
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Finance & Sponsors OS</h2>
        </div>

        <div className="flex items-center p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab("finance")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "finance"
                ? "bg-[#FF6B00] text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Treasury
          </button>
          <button
            onClick={() => setActiveTab("sponsors")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "sponsors"
                ? "bg-[#FF6B00] text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Sponsors
          </button>
        </div>
      </div>

      {activeTab === "finance" ? (
        <div className="space-y-4">
          {/* Main Financial KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <GlassCard isDark={isDark} hoverScale={false} className="p-4 border">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Budget</span>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{financialSummary.totalBudget}</p>
            </GlassCard>
            <GlassCard isDark={isDark} hoverScale={false} className="p-4 border">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Raised</span>
              <p className="text-lg font-black text-[#16A34A] mt-0.5">{financialSummary.totalCollected}</p>
            </GlassCard>
            <GlassCard isDark={isDark} hoverScale={false} className="p-4 border">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Expenses</span>
              <p className="text-lg font-black text-[#FF6B00] mt-0.5">{financialSummary.totalSpent}</p>
            </GlassCard>
          </div>

          {/* Revenue Breakdown */}
          <GlassCard isDark={isDark} hoverScale={false} className="p-5 border space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Income Stream Breakdown</h3>
            <div className="space-y-2 text-xs font-semibold">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-600 dark:text-slate-300">Sponsorship Contributions</span>
                <span className="font-bold text-[#FF6B00]">{financialSummary.sponsorships}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-600 dark:text-slate-300">Community Donations</span>
                <span className="font-bold text-[#4F46E5]">{financialSummary.donations}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-600 dark:text-slate-300">Registration & Pass Fees</span>
                <span className="font-bold text-[#16A34A]">{financialSummary.ticketFees}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      ) : (
        /* SPONSORS TAB */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sponsors.map((sp, idx) => (
            <GlassCard key={idx} isDark={isDark} hoverScale={false} className="p-4 border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{sp.logo}</span>
                <StatusChip status={sp.status} isDark={isDark} />
              </div>

              <div>
                <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-slate-800 text-[#FF6B00] text-[9px] font-black uppercase">
                  {sp.category}
                </span>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1">{sp.name}</h4>
                <p className="text-xs font-bold text-[#16A34A] mt-0.5">Contribution: {sp.contribution}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>{sp.contact}</span>
                <button
                  onClick={() => window.open(`tel:${sp.phone}`)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:text-[#FF6B00] cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};
