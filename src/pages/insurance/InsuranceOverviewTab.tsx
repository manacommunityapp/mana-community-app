import React from "react";
import {
  Shield,
  FileText,
  Building,
  Lock,
  ChevronRight,
} from "lucide-react";
import {
  CATEGORIES,
  categoryLabel,
  maskPolicyNumber,
  daysUntil,
  renewalBucket,
} from "../../constants/insurance";
import type { PolicyView, InsuranceCategory } from "../../types/insurance";

interface InsuranceOverviewTabProps {
  policies: PolicyView[];
  loadingPolicies: boolean;
  onSelectCategory: (cat: InsuranceCategory) => void;
  onOpenAddPolicy: () => void;
  onNavigateTab: (tab: "overview" | "catalogue" | "compare" | "policies" | "claims" | "group" | "consents") => void;
}

export const InsuranceOverviewTab: React.FC<InsuranceOverviewTabProps> = ({
  policies,
  loadingPolicies,
  onSelectCategory,
  onOpenAddPolicy,
  onNavigateTab,
}) => {
  return (
    <div className="space-y-8">
      {/* Protection Categories */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Browse by Protection Category</h2>
          <button
            onClick={() => onNavigateTab("catalogue")}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            View all in Catalogue <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.key}
              onClick={() => {
                onSelectCategory(cat.key);
                onNavigateTab("catalogue");
              }}
              className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-emerald-300 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl p-2 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition">
                  {cat.emoji}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {cat.group}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition">
                  {cat.label}
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Policies Vault Summary */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Your Active Policies</h2>
            <p className="text-xs text-gray-500 mt-0.5">Self-declared and verified policies in your community vault.</p>
          </div>
          <button
            onClick={() => onNavigateTab("policies")}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
          >
            Manage Policies →
          </button>
        </div>

        {loadingPolicies ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading your policies...</div>
        ) : policies.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-gray-200">
            <Shield className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-700">No insurance policies tracked yet</p>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Add your existing policies (health, car, term life, home) to track upcoming renewals, maintain documents, and get claims assistance.
            </p>
            <button
              onClick={onOpenAddPolicy}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow"
            >
              + Add Your First Policy
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {policies.slice(0, 3).map((p) => {
              const bucket = renewalBucket(p);
              const days = daysUntil(p.expiryDate);
              return (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full">
                        {categoryLabel(p.category)}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          bucket === "OVERDUE"
                            ? "bg-red-100 text-red-700"
                            : bucket === "DUE_30"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {bucket === "OVERDUE"
                          ? "Overdue"
                          : bucket === "DUE_30"
                          ? "Due < 30d"
                          : "Active"}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-base">{p.productName}</h4>
                      <p className="text-xs text-gray-500">{p.insurerName}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-600">
                    <div>
                      <span className="text-gray-400 block text-[10px]">POLICY NO.</span>
                      <span className="font-mono font-medium">{maskPolicyNumber(p.maskedPolicyNumber)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-400 block text-[10px]">EXPIRY</span>
                      <span className="font-medium text-gray-800">
                        {p.expiryDate || "N/A"}
                        {days !== null && days >= 0 && (
                          <span className="text-emerald-600 text-[11px] ml-1">({days}d)</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Help Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div
          onClick={() => onNavigateTab("claims")}
          className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-emerald-200 shadow-sm cursor-pointer space-y-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-700 group-hover:scale-105 transition">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Community Claims Assistance</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Need guidance on hospitalization cashless approval or claim document checklist? Submit an assistance case.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab("group")}
          className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-emerald-200 shadow-sm cursor-pointer space-y-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-700 group-hover:scale-105 transition">
            <Building className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Society Group Enquiries</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Request collective quotes for building fire & earthquake risk, common assets, lift AMCs, or staff health benefits.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab("consents")}
          className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-emerald-200 shadow-sm cursor-pointer space-y-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-700 group-hover:scale-105 transition">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Privacy & Consent Audit</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Review data-sharing authorizations with partners and exercise your right to withdraw consent anytime.
          </p>
        </div>
      </div>
    </div>
  );
};