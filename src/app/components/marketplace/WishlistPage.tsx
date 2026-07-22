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
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-black text-[#0d0d2b] mb-6">
        <Heart className="inline w-5 h-5 text-rose-500 mr-2" />
        My Wishlist ({items.length})
      </h2>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-[#6b7094] text-sm font-medium">Your wishlist is empty</p>
          <p className="text-slate-400 text-xs mt-1">Save items you like to find them later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-indigo-200 transition-all group"
            >
              <div
                className="h-40 bg-slate-50 relative cursor-pointer"
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
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                    {item.listingStatus}
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-1">
                  <Tag className="w-3 h-3" /> {item.listingCategory}
                </div>
                <h3
                  className="text-sm font-bold text-[#0d0d2b] truncate cursor-pointer hover:text-indigo-600"
                  onClick={() => navigate(`/marketplace/${item.listingId}`)}
                >
                  {item.listingTitle}
                </h3>
                <p className="text-lg font-black text-indigo-600 mt-1">{formatPrice(item.listingPrice)}</p>
                <p className="text-xs text-[#6b7094] mt-1">by {item.sellerName}</p>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => navigate(`/marketplace/${item.listingId}`)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> View Listing
                  </button>
                  <button
                    onClick={() => handleRemove(item.listingId)}
                    className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
