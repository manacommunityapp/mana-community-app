import React from "react";
import { Shield, AlertTriangle, Plus, Search } from "lucide-react";

interface InsuranceHeaderProps {
  onTrackPolicy: () => void;
  onExplore: () => void;
}

export const InsuranceHeader: React.FC<InsuranceHeaderProps> = ({
  onTrackPolicy,
  onExplore,
}) => {
  return (
    <div className="space-y-4">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide">
              <Shield className="w-4 h-4" />
              Mana Insurance Network & Vault
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Community Insurance Hub
            </h1>
            <p className="text-sm text-emerald-50 font-normal leading-relaxed">
              Discover verified insurance products, compare benefits side-by-side without fabricated quotes, track your policies, and get community claims support.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onTrackPolicy}
              className="px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              Track Policy
            </button>
            <button
              onClick={onExplore}
              className="px-4 py-2.5 bg-emerald-800/60 hover:bg-emerald-900/60 text-white border border-white/20 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition"
            >
              <Search className="w-4 h-4" />
              Explore Products
            </button>
          </div>
        </div>
      </div>

      {/* Persistent Regulatory Disclosure Alert Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-4 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold tracking-wide uppercase text-[11px] text-amber-800">
            Regulatory Notice & Disclosure
          </p>
          <p className="leading-relaxed">
            Mana Community acts solely as a discovery and administrative management platform. Insurance is underwritten, sold, and serviced exclusively by the registered insurer or IRDAI-authorized intermediary specified on each product. Premiums, coverage terms, and claim approvals are determined solely by the insurer and not by Mana.
          </p>
        </div>
      </div>
    </div>
  );
};