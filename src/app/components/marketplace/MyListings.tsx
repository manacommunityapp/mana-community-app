import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Package, Edit, Trash2, Eye, Pause, Play, CheckCircle2, Loader2,
  ImagePlus, Tag, MoreVertical
} from "lucide-react";
import { listingService, type ListingResponse } from "../../../services/listingService";
import { USE_MOCK_DATA, MOCK_MY_LISTINGS } from "./mockData";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

function formatPrice(price: number, unit?: string): string {
  const formatted = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);
  return unit ? `${formatted} / ${unit}` : formatted;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  PAUSED: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  SOLD: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  DELETED: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
};

export function MyListings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<ListingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMenu, setActionMenu] = useState<number | null>(null);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      setListings(MOCK_MY_LISTINGS);
      setLoading(false);
    } else {
      listingService.getMyListings()
        .then(setListings)
        .catch(() => setListings([]))
        .finally(() => setLoading(false));
    }
  }, []);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await listingService.updateStatus(id, status);
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
    } catch {}
    setActionMenu(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      await listingService.deleteListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch {}
    setActionMenu(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 text-slate-900 dark:text-white">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">My Posted Advertisements ({listings.length})</h2>
        <button
          onClick={() => navigate("/marketplace")}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20"
        >
          + Post New Item
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 text-center p-6">
          <Package className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">You haven't posted any listings yet</p>
          <button
            onClick={() => navigate("/marketplace")}
            className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Browse marketplace to post an item
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#1E1E36] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all shadow-xs"
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-[#262644] overflow-hidden flex-shrink-0">
                  {item.imageUrls?.[0] ? (
                    <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImagePlus className="w-6 h-6 text-slate-300" />
                    </div>
                  )}
                </div>

                {/* Listing Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider", statusColors[item.status] || "bg-slate-100 text-slate-600")}>
                      {item.status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                    {item.title}
                  </h3>
                  <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {formatPrice(item.price, item.priceUnit)}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800 justify-end">
                <button
                  onClick={() => navigate(`/marketplace/${item.id}`)}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-[#262644] hover:bg-slate-100 dark:hover:bg-[#323254] text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="View Item"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {item.status === "ACTIVE" ? (
                  <button
                    onClick={() => handleStatusChange(item.id, "PAUSED")}
                    className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer"
                    title="Pause Listing"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                ) : item.status === "PAUSED" ? (
                  <button
                    onClick={() => handleStatusChange(item.id, "ACTIVE")}
                    className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                    title="Activate Listing"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                ) : null}

                {item.status !== "SOLD" && (
                  <button
                    onClick={() => handleStatusChange(item.id, "SOLD")}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    Mark Sold
                  </button>
                )}

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                  title="Delete Listing"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
