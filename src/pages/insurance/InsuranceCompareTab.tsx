import React, { useMemo } from "react";
import { FileText, Printer } from "lucide-react";
import {
  buildComparison,
  buildPrintableSummary,
} from "../../constants/insurance";
import type { CatalogueItem } from "../../types/insurance";

interface InsuranceCompareTabProps {
  shortlist: CatalogueItem[];
  onRemoveItem: (item: CatalogueItem) => void;
  onClearAll: () => void;
  onNavigateToCatalogue: () => void;
}

export const InsuranceCompareTab: React.FC<InsuranceCompareTabProps> = ({
  shortlist,
  onRemoveItem,
  onClearAll,
  onNavigateToCatalogue,
}) => {
  const comparisonRows = useMemo(() => {
    return buildComparison(shortlist);
  }, [shortlist]);

  const handlePrint = () => {
    const text = buildPrintableSummary(shortlist);
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(`<pre style="font-family: monospace; white-space: pre-wrap; padding: 20px;">${text}</pre>`);
      w.document.close();
      w.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Side-by-Side Product Comparison</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Features sourced directly from verified policy documents. No fabricated rankings or premium estimates.
          </p>
        </div>
        {shortlist.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" /> Print Summary
            </button>
            <button
              onClick={onClearAll}
              className="px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {shortlist.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 space-y-3">
          <FileText className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-bold text-gray-700">No products added for comparison</p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Select 2 to 4 products from the Catalogue to view attribute differences side-by-side.
          </p>
          <button
            onClick={onNavigateToCatalogue}
            className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 shadow"
          >
            Go to Catalogue
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200">
                  <th className="py-4 px-6 font-bold text-gray-500 uppercase tracking-wider w-1/4">
                    Attribute
                  </th>
                  {shortlist.map((item) => (
                    <th key={item.productVersionId} className="py-4 px-6 font-bold text-gray-900">
                      <div className="text-sm">{item.name}</div>
                      <div className="text-xs text-gray-500 font-normal">{item.insurerName}</div>
                      <button
                        onClick={() => onRemoveItem(item)}
                        className="mt-2 text-[10px] text-red-600 hover:underline font-semibold"
                      >
                        ✕ Remove
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparisonRows.map((row) => (
                  <tr key={row.label} className={row.differs ? "bg-amber-50/40" : "hover:bg-slate-50/50"}>
                    <td className="py-3.5 px-6 font-semibold text-gray-700">
                      {row.label}
                      {row.differs && (
                        <span className="block text-[10px] text-amber-700 font-bold uppercase mt-0.5">
                          Differs
                        </span>
                      )}
                    </td>
                    {row.values.map((v, i) => (
                      <td key={i} className="py-3.5 px-6 text-gray-600 leading-relaxed">
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};