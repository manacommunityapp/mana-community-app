import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Package, Trash2, Eye, Pause, Play, CheckCircle2, Loader2,
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
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PAUSED: "bg-amber-50 text-amber-700 border-amber-200",
  SOLD: "bg-blue-50 text-blue-700 border-blue-200",
  DELETED: "bg-red-50 text-red-700 border-red-200",
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
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-[#0d0d2b]">My Listings ({listings.length})</h2>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-[#6b7094] text-sm font-medium">You haven't posted any listings yet</p>
          <button
            onClick={() => navigate("/marketplace")}
            className="mt-3 text-sm font-semibold text-indigo-600 hover:underline cursor-pointer"
          >
            Go to marketplace to post
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 hover:border-indigo-200 transition-all"
            >
              {/* Thumbnail */}
              <div className="w-20 h-20 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0">
                {item.imageUrls?.[0] ? (
                  <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImagePlus className="w-6 h-6 text-slate-300" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className="text-sm font-bold text-[#0d0d2b] truncate cursor-pointer hover:text-indigo-600"
                    onClick={() => navigate(`/marketplace/${item.id}`)}
                  >
                    {item.title}
                  </h3>
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", statusColors[item.status] || "bg-slate-50 text-slate-600 border-slate-200")}>
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#6b7094]">
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{item.category}</span>
                  <span className="font-bold text-[#0d0d2b]">{formatPrice(item.price, item.priceUnit)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setActionMenu(actionMenu === item.id ? null : item.id)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <MoreVertical className="w-4 h-4 text-[#6b7094]" />
                </button>
                {actionMenu === item.id && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-lg py-1 w-40 z-10">
                    <button onClick={() => navigate(`/marketplace/${item.id}`)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0d0d2b] hover:bg-slate-50 cursor-pointer">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    {item.status === "ACTIVE" && (
                      <button onClick={() => handleStatusChange(item.id, "PAUSED")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0d0d2b] hover:bg-slate-50 cursor-pointer">
                        <Pause className="w-3.5 h-3.5" /> Pause
                      </button>
                    )}
                    {item.status === "PAUSED" && (
                      <button onClick={() => handleStatusChange(item.id, "ACTIVE")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0d0d2b] hover:bg-slate-50 cursor-pointer">
                        <Play className="w-3.5 h-3.5" /> Activate
                      </button>
                    )}
                    {(item.status === "ACTIVE" || item.status === "PAUSED") && (
                      <button onClick={() => handleStatusChange(item.id, "SOLD")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0d0d2b] hover:bg-slate-50 cursor-pointer">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Sold
                      </button>
                    )}
                    <button onClick={() => handleDelete(item.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
