import { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  Clock,
  Zap,
  Users,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  DollarSign,
  Plus,
  RefreshCw,
  BellRing,
} from "lucide-react";
import { toast } from "sonner";
import { sportsIntelligenceService } from "../../../../../services/sports/sportsIntelligenceService";
import type {
  DemandForecast,
  WaitlistRecoveryItem,
  DynamicOfferRule,
} from "../../../../../types/sportsIntelligence";

export function SportsIntelligencePortal() {
  const [activeTab, setActiveTab] = useState<"FORECAST" | "WAITLIST" | "OFFERS">("FORECAST");
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
  const [waitlistItems, setWaitlistItems] = useState<WaitlistRecoveryItem[]>([]);
  const [offers, setOffers] = useState<DynamicOfferRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [fData, wData, oData] = await Promise.all([
        sportsIntelligenceService.getDemandForecasts("fac-1"),
        sportsIntelligenceService.getWaitlistRecovery(),
        sportsIntelligenceService.getDynamicOffers(),
      ]);
      setForecasts(fData);
      setWaitlistItems(wData);
      setOffers(oData);
    } catch (err) {
      toast.error("Failed to load sports intelligence metrics");
    } finally {
      setLoading(false);
    }
  }

  async function handleRecoverSlot(itemId: string) {
    try {
      const updated = await sportsIntelligenceService.triggerWaitlistRecovery(itemId);
      setWaitlistItems((prev) => prev.map((w) => (w.id === itemId ? updated : w)));
      toast.success("Waitlisted player notified and slot locked! Recovered ₹" + updated.recoveredRevenue);
    } catch (err) {
      toast.error("Error converting waitlisted slot");
    }
  }

  function toggleOfferActive(ruleId: string) {
    setOffers((prev) =>
      prev.map((o) => (o.id === ruleId ? { ...o, isActive: !o.isActive } : o))
    );
    toast.success("Dynamic pricing rule updated");
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-purple-700 to-emerald-700 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-purple-100">
            <Sparkles className="w-3.5 h-3.5 text-purple-200" />
            AI Demand Engine & Yield Optimization
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Sports Intelligence & Waitlist Recovery
          </h1>
          <p className="text-xs sm:text-sm text-purple-100 leading-relaxed">
            Harness predictive court demand modeling, automated waitlist revenue recovery, and dynamic off-peak pricing to maximize arena yield.
          </p>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Predictive Yield Uplift</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">+22.4%</span>
            <span className="text-xs font-bold text-emerald-600">Est. ₹34,500/mo</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">From dynamic peak/off-peak rate tuning</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Waitlist Recoveries</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {waitlistItems.filter((w) => w.status === "CONVERTED").length} Slots
            </span>
            <span className="text-xs font-bold text-indigo-600">₹1,100 Recovered</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Cancellations automatically rebooked</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Flash Rules</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {offers.filter((o) => o.isActive).length} Automated
            </span>
            <span className="text-xs font-bold text-amber-600">Live</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Triggering on off-peak hours</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab("FORECAST")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "FORECAST"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Predictive Demand Matrix
        </button>

        <button
          onClick={() => setActiveTab("WAITLIST")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "WAITLIST"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <BellRing className="w-3.5 h-3.5" />
          Waitlist Auto-Recovery ({waitlistItems.length})
        </button>

        <button
          onClick={() => setActiveTab("OFFERS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "OFFERS"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Dynamic Flash Rules ({offers.length})
        </button>
      </div>

      {/* Tab 1: Demand Forecast Matrix */}
      {activeTab === "FORECAST" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Hourly Slot Occupancy & Pricing Recommendation
              </h3>
              <p className="text-[11px] text-slate-500">
                AI analyzes booking frequency, resident peak hours, and weekend surges.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
              SmashZone Arena - Court 1
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Historical Occupancy</th>
                  <th className="py-3 px-4">Demand Level</th>
                  <th className="py-3 px-4">Current Base</th>
                  <th className="py-3 px-4">Recommended Dynamic Rate</th>
                  <th className="py-3 px-4">Est. Revenue Uplift</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {forecasts.map((f) => {
                  const isHigh = f.predictedDemand === "HIGH";
                  const isLow = f.predictedDemand === "LOW";

                  return (
                    <tr key={f.hour} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {f.hour}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isHigh ? "bg-emerald-500" : isLow ? "bg-amber-400" : "bg-indigo-500"
                              }`}
                              style={{ width: `${f.historicalOccupancyPercent}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-700">{f.historicalOccupancyPercent}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isHigh
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isLow
                              ? "bg-slate-100 text-slate-600"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          }`}
                        >
                          {f.predictedDemand} DEMAND
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-500">₹{f.currentBasePrice}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-black text-slate-900 text-sm">₹{f.recommendedPrice}</span>
                        {f.isPeakSuggested && (
                          <span className="text-[10px] text-emerald-600 font-bold block">Prime Surge</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">
                        {f.expectedRevenueUpliftPercent > 0 ? `+${f.expectedRevenueUpliftPercent}%` : "Baseline"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => toast.success(`Adopted dynamic rate ₹${f.recommendedPrice} for ${f.hour}`)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] shadow-xs transition-colors"
                        >
                          Apply Rate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Waitlist Recovery */}
      {activeTab === "WAITLIST" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {waitlistItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-300 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    {item.sport}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === "CONVERTED"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : item.status === "NOTIFIED"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{item.courtName}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {item.date} • {item.slotTime}
                  </p>
                  {item.cancelledByCustomer && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Freed up by: {item.cancelledByCustomer}
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Waitlisted Queue
                    </span>
                    <span className="font-bold text-slate-800">{item.waitlistedUsersCount} Players</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Recovered
                    </span>
                    <span className="font-black text-emerald-600">₹{item.recoveredRevenue || 500}</span>
                  </div>
                </div>

                {item.status !== "CONVERTED" ? (
                  <button
                    onClick={() => handleRecoverSlot(item.id)}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Auto-Notify & Lock Player
                  </button>
                ) : (
                  <div className="text-center text-xs font-semibold text-emerald-700 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Slot converted to: {item.convertedToCustomer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Dynamic Flash Rules */}
      {activeTab === "OFFERS" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offers.map((rule) => (
              <div
                key={rule.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{rule.name}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {rule.discountPercentage}% Discount
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Triggers between {rule.timeWindowStart} and {rule.timeWindowEnd} when occupancy drops below 40%.
                  </p>
                </div>

                <button
                  onClick={() => toggleOfferActive(rule.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                    rule.isActive
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {rule.isActive ? "Active Rule" : "Paused"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
