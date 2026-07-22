import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Heart, Trash2, Loader2, ImagePlus, Tag, ShoppingBag } from "lucide-react";
import { wishlistService, type WishlistResponse } from "../../../services/listingService";
import { USE_MOCK_DATA, MOCK_WISHLIST } from "./mockData";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);
}

export function WishlistPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<WishlistResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      setItems(MOCK_WISHLIST);
      setLoading(false);
    } else {
      wishlistService.getMyWishlist()
        .then(setItems)
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }
  }, []);

  const handleRemove = async (listingId: number) => {
    try {
      await wishlistService.remove(listingId);
      setItems((prev) => prev.filter((i) => i.listingId !== listingId));
    } catch {}
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
        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500 fill-rose-500" /> My Saved Wishlist ({items.length})
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 text-center p-6">
          <Heart className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">Your wishlist is empty</p>
          <p className="text-slate-400 text-xs mt-1">Save products while browsing to compare and contact sellers later!</p>
          <button
            onClick={() => navigate("/marketplace")}
            className="mt-4 px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20"
          >
            Explore Marketplace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#1E1E36] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col hover:border-indigo-300 dark:hover:border-indigo-800 transition-all shadow-xs group"
            >
              <div
                className="h-44 bg-slate-100 dark:bg-[#262644] relative cursor-pointer overflow-hidden"
                onClick={() => navigate(`/marketplace/${item.listingId}`)}
              >
                {item.listingImageUrl ? (
                  <img src={item.listingImageUrl} alt={item.listingTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImagePlus className="w-8 h-8 text-slate-300" />
                  </div>
                )}
                {item.listingStatus !== "ACTIVE" && (
                  <div className="absolute top-2 left-2 px-2.5 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                    {item.listingStatus}
                  </div>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wider mb-1">
                    <Tag className="w-3 h-3" /> {item.listingCategory}
                  </div>
                  <h3
                    className="text-sm font-extrabold text-slate-900 dark:text-white truncate cursor-pointer hover:text-indigo-600 transition-colors"
                    onClick={() => navigate(`/marketplace/${item.listingId}`)}
                  >
                    {item.listingTitle}
                  </h3>
                  <p className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-1">{formatPrice(item.listingPrice)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Seller: {item.sellerName}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => navigate(`/marketplace/${item.listingId}`)}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> View Product
                  </button>
                  <button
                    onClick={() => handleRemove(item.listingId)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Remove from Wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
