import { useState, useEffect } from "react";
import {
  Building2,
  TrendingUp,
  MapPin,
  Users,
  ShieldCheck,
  Star,
  CheckCircle2,
  Plus,
  DollarSign,
  Layers,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { sportsIntelligenceService } from "../../../../../services/sports/sportsIntelligenceService";
import type {
  MultiBranchAnalytics,
  FederatedCommunityPass,
} from "../../../../../types/sportsIntelligence";

export function SportsMultiVenuePortal() {
  const [branches, setBranches] = useState<MultiBranchAnalytics[]>([]);
  const [passes, setPasses] = useState<FederatedCommunityPass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [bData, pData] = await Promise.all([
        sportsIntelligenceService.getMultiBranchAnalytics(),
        sportsIntelligenceService.getFederatedPasses(),
      ]);
      setBranches(bData);
      setPasses(pData);
    } catch (err) {
      toast.error("Failed to load multi-venue analytics");
    } finally {
      setLoading(false);
    }
  }

  const totalRevenue = branches.reduce((sum, b) => sum + b.monthlyRevenue, 0);
  const totalCourts = branches.reduce((sum, b) => sum + b.courtsCount, 0);
  const avgUtilization = Math.round(
    branches.reduce((sum, b) => sum + b.utilizationPercent, 0) / (branches.length || 1)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Multi-Venue & Federated Operations</h1>
          <p className="text-xs text-slate-500">
            Compare multi-branch arena performance and manage cross-community all-sports passes.
          </p>
        </div>

        <button
          onClick={() => toast.info("Federated partner community onboarding is active")}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Partner New Community
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Multi-Branch Monthly Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +19.2%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across {branches.length} locations</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Managed Courts</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalCourts} Courts</span>
            <span className="text-xs font-bold text-indigo-600">3 Sports Hubs</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Badminton, Box Cricket, Turf Football</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Network Utilization</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{avgUtilization}%</span>
            <span className="text-xs font-bold text-teal-600">Peak 94%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Weighted average across network</p>
        </div>
      </div>

      {/* Multi-Branch Performance Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Branch Comparison Matrix</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {branches.map((branch) => (
            <div
              key={branch.branchId}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:border-emerald-300 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    {branch.primarySport}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{branch.branchName}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {branch.area}, {branch.city}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{branch.rating}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Monthly Gross</span>
                  <span className="font-black text-slate-900 text-sm">₹{branch.monthlyRevenue.toLocaleString("en-IN")}</span>
                  <span className="text-[10px] font-bold text-emerald-600 block">+{branch.revenueGrowthPercent}% YoY</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Capacity Utilization</span>
                  <span className="font-black text-slate-900 text-sm">{branch.utilizationPercent}%</span>
                  <span className="text-[10px] text-indigo-600 font-bold block">{branch.courtsCount} Live Courts</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Repeat Players: <strong>{branch.repeatCustomerRate}%</strong></span>
                <span>{branch.totalReviews} Reviews</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-Community Federated Passes */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Cross-Community Federated Sports Passes</h2>
            <p className="text-xs text-slate-500">
              Shared resident memberships valid across partner arenas with pooled settlement.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {passes.map((pass) => (
            <div
              key={pass.id}
              className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50/50 rounded-3xl border border-emerald-200/80 p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                      {pass.status}
                    </span>
                    <span className="text-xs font-bold text-emerald-800">
                      {pass.activeSubscribersCount} Active Resident Passholders
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{pass.passName}</h3>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Pooled Monthly Settlement</span>
                  <span className="text-xl font-black text-emerald-700">
                    ₹{pass.monthlySettlementPool.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Partner Communities */}
              <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-emerald-100 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Eligible Resident Apartment Communities:
                </span>
                <div className="flex flex-wrap gap-2">
                  {pass.partnerCommunities.map((comm) => (
                    <span
                      key={comm}
                      className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-2xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      {comm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Participating Venues */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {pass.eligibleFacilities.map((ef) => (
                  <div key={ef.facilityId} className="bg-white/80 p-3 rounded-xl border border-slate-200 text-xs">
                    <span className="font-bold text-slate-900 block truncate">{ef.facilityName}</span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      Sports: {ef.sportsIncluded.join(", ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
