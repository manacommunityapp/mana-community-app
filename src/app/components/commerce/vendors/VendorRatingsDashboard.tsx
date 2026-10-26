import React, { useEffect, useState } from "react";
import { apiClient } from "../../../../services/common/apiClient";

interface VendorRatingRow {
  vendorId: string;
  averageRating: number;
  reviewCount: number;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400 text-sm">
      {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
    </span>
  );
}

export default function VendorRatingsDashboard() {
  const [rows, setRows] = useState<VendorRatingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<VendorRatingRow[]>("/commerce/ratings/vendors")
      .then((d) => setRows(d))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Vendor Ratings</h2>
      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">Loading ratings…</div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">No vendor reviews yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Vendor ID", "Rating", "Reviews"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.vendorId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{r.vendorId}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Stars rating={r.averageRating} />
                      <span className="text-sm font-semibold text-gray-700">
                        {r.averageRating.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{r.reviewCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
