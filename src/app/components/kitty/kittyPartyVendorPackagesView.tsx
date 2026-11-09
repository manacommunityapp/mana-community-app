import React, { useEffect, useState } from "react";
import { kittyPartyService } from "../../../services/kittyPartyService";
import type { KittyPartyVendorPackage, VendorPackageCategory } from "../../../types/kittyPartyTypes";
import {
  ShoppingBag,
  Utensils,
  Cake,
  Sparkles,
  Mic,
  Camera,
  Star,
  Phone,
  MessageCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

interface Props {
  circleId: number;
}

const CATEGORIES: { label: string; value: string; icon: any }[] = [
  { label: "All Packages", value: "ALL", icon: ShoppingBag },
  { label: "Catering & High Tea", value: "CATERING", icon: Utensils },
  { label: "Cakes & Desserts", value: "CAKES_DESSERTS", icon: Cake },
  { label: "Theme & Decor", value: "BALLOON_DECOR", icon: Sparkles },
  { label: "Emcee & Entertainment", value: "EMCEE_ENTERTAINMENT", icon: Mic },
  { label: "Photography", value: "PHOTOGRAPHY", icon: Camera },
];

export const KittyPartyVendorPackagesView: React.FC<Props> = ({ circleId }) => {
  const [packages, setPackages] = useState<KittyPartyVendorPackage[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMenuId, setExpandedMenuId] = useState<number | null>(null);
  const [inquirySuccess, setInquirySuccess] = useState<string | null>(null);
  const [inquiryLoading, setInquiryLoading] = useState<number | null>(null);

  const fetchPackages = async (cat?: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await kittyPartyService.getVendorPackages(circleId, cat);
      setPackages(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load party vendor packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages(activeCategory);
  }, [circleId, activeCategory]);

  const handleInquire = async (pkg: KittyPartyVendorPackage) => {
    try {
      setInquiryLoading(pkg.id);
      const res = await kittyPartyService.inquireVendorPackage({
        packageId: pkg.id,
        notes: `Inquiry from Social Circle ID: ${circleId}`,
      });
      setInquirySuccess(res.message);
      setTimeout(() => setInquirySuccess(null), 6000);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to send vendor inquiry");
    } finally {
      setInquiryLoading(null);
    }
  };

  const getCategoryBadge = (cat: VendorPackageCategory) => {
    switch (cat) {
      case "CATERING":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Catering</span>;
      case "CAKES_DESSERTS":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-800">Cakes & Desserts</span>;
      case "BALLOON_DECOR":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">Decor</span>;
      case "EMCEE_ENTERTAINMENT":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Host & Anchor</span>;
      case "PHOTOGRAPHY":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Photography</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">Service</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wide uppercase mb-2">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-200" />
              <span>Curated Party Marketplace</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Party Vendors & Curated Packages</h2>
            <p className="text-emerald-100 text-sm mt-1 max-w-xl">
              Verified local society caterers, custom bakers, balloon stylists, and Housie emcees with fixed transparent rates for your circle meetups.
            </p>
          </div>
          <button
            onClick={() => fetchPackages(activeCategory)}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition-all shadow"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Inquiry Success Toast */}
      {inquirySuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-3 text-emerald-800 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">{inquirySuccess}</p>
        </div>
      )}

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
                isActive
                  ? "bg-slate-900 text-white shadow-md scale-102"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Packages Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
          <p className="text-sm font-medium">Discovering curated party packages...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center text-red-700">
          <p className="font-semibold text-sm">{error}</p>
          <button
            onClick={() => fetchPackages(activeCategory)}
            className="mt-3 px-4 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : packages.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
          <p className="font-bold text-slate-800 text-base">No packages found for this category</p>
          <p className="text-xs text-slate-500 mt-1">Try selecting 'All Packages' to explore available options.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  {getCategoryBadge(pkg.category)}
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{pkg.rating || "4.8"}</span>
                  </div>
                </div>

                <h3 className="font-black text-slate-900 text-base leading-snug">{pkg.packageName}</h3>
                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {pkg.description || "Curated party service package crafted for apartment gatherings."}
                </p>

                {/* Price Display */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Estimated Price:</span>
                  <span className="text-sm font-black text-emerald-700">{pkg.priceRange || "Custom Quote"}</span>
                </div>

                {/* Expandable Menu / Deliverables */}
                {pkg.sampleMenu && (
                  <div className="mt-3">
                    <button
                      onClick={() => setExpandedMenuId(expandedMenuId === pkg.id ? null : pkg.id)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{expandedMenuId === pkg.id ? "Hide Inclusions" : "View Package Inclusions"}</span>
                      {expandedMenuId === pkg.id ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {expandedMenuId === pkg.id && (
                      <div className="mt-2 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-slate-700 font-medium whitespace-pre-line animate-fadeIn">
                        {pkg.sampleMenu}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Vendor & Contact Actions */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                  <span className="font-semibold text-slate-700 truncate max-w-[160px]">{pkg.contactPerson || "Vendor Partner"}</span>
                  {pkg.contactPhone && (
                    <span className="text-slate-500 font-mono text-[11px]">{pkg.contactPhone}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {pkg.contactPhone ? (
                    <a
                      href={`tel:${pkg.contactPhone.replace(/\s+/g, "")}`}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-600" />
                      <span>Call Host</span>
                    </a>
                  ) : (
                    <div />
                  )}
                  <button
                    onClick={() => handleInquire(pkg)}
                    disabled={inquiryLoading === pkg.id}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
                  >
                    {inquiryLoading === pkg.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <MessageCircle className="w-3.5 h-3.5" />
                    )}
                    <span>Book Inquiry</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
