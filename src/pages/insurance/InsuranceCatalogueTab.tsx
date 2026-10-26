import React from "react";
import {
  FileText,
  ExternalLink,
  Plus,
  XCircle,
  RefreshCw,
  Shield,
} from "lucide-react";
import {
  CATEGORIES,
  categoryLabel,
} from "../../constants/insurance";
import type { SortKey } from "../../constants/insurance";
import type { CatalogueItem, InsuranceCategory } from "../../types/insurance";

interface InsuranceCatalogueTabProps {
  selectedCategory: InsuranceCategory;
  onSelectCategory: (cat: InsuranceCategory) => void;
  items: CatalogueItem[];
  loading: boolean;
  error: string | null;
  sortKey: SortKey;
  onSortChange: (key: SortKey) => void;
  shortlist: CatalogueItem[];
  onToggleShortlist: (item: CatalogueItem) => void;
  onNavigateToCompare: () => void;
}

export const InsuranceCatalogueTab: React.FC<InsuranceCatalogueTabProps> = ({
  selectedCategory,
  onSelectCategory,
  items,
  loading,
  error,
  sortKey,
  onSortChange,
  shortlist,
  onToggleShortlist,
  onNavigateToCompare,
}) => {
  return (
    <div className="space-y-6">
      {/* Category Selector Pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => onSelectCategory(c.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedCategory === c.key
                ? "bg-emerald-700 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
            }`}
          >
            <span>{c.emoji}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="text-xs text-gray-500">
          Showing verified plans for{" "}
          <strong className="text-gray-900">{categoryLabel(selectedCategory)}</strong>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="text-gray-400">Sort By:</span>
          <button
            onClick={() => onSortChange("NAME")}
            className={`px-3 py-1.5 rounded-lg transition ${
              sortKey === "NAME" ? "bg-emerald-50 text-emerald-800 font-bold" : "text-gray-500"
            }`}
          >
            Plan Name
          </button>
          <button
            onClick={() => onSortChange("INSURER")}
            className={`px-3 py-1.5 rounded-lg transition ${
              sortKey === "INSURER" ? "bg-emerald-50 text-emerald-800 font-bold" : "text-gray-500"
            }`}
          >
            Insurer Name
          </button>
        </div>
      </div>

      {/* Shortlist Floating Banner */}
      {shortlist.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-900">{shortlist.length} products shortlisted:</span>
            <span className="text-emerald-700">{shortlist.map((s) => s.name).join(", ")}</span>
          </div>
          <button
            onClick={onNavigateToCompare}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition"
          >
            Compare Side-by-Side →
          </button>
        </div>
      )}

      {/* Catalogue List */}
      {loading ? (
        <div className="p-16 text-center text-xs text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          Loading verified products from partner catalogue...
        </div>
      ) : error ? (
        <div className="p-12 text-center bg-red-50 rounded-2xl border border-red-200 text-xs text-red-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 space-y-2">
          <Shield className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-bold text-gray-700">No active products listed in this category</p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Only verified product versions from authorized partner insurers appear here. Please check back soon or submit an enquiry.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const isShortlisted = shortlist.some((x) => x.productVersionId === item.productVersionId);
            return (
              <div
                key={item.productVersionId}
                className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  {item.dataSource === "SANDBOX" && (
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider mb-2">
                      Sandbox Prototype Plan
                    </span>
                  )}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{item.name}</h3>
                      <p className="text-xs text-gray-500 font-medium">{item.insurerName}</p>
                    </div>
                    <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      v{item.versionNo}
                    </span>
                  </div>

                  {item.irdaiRegistrationNo && (
                    <p className="text-[11px] text-gray-400 mt-1">
                      IRDAI Reg: {item.irdaiRegistrationNo}
                    </p>
                  )}

                  {/* Official Documents Links */}
                  <div className="flex gap-3 text-xs mt-4 pt-3 border-t border-gray-100">
                    {item.brochureUrl && (
                      <a
                        href={item.brochureUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> Brochure
                      </a>
                    )}
                    {item.policyWordingUrl && (
                      <a
                        href={item.policyWordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Policy Wording
                      </a>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onToggleShortlist(item)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      isShortlisted
                        ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                        : "bg-slate-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {isShortlisted ? (
                      <>
                        <XCircle className="w-4 h-4" /> Remove from Compare
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" /> Add to Compare
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};