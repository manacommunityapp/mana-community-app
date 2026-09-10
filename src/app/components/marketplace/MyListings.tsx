import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Package, Trash2, Eye, Pause, Play, CheckCircle2, Loader2,
  ImagePlus, Tag, MoreVertical, DollarSign, XCircle, Check,
  MessageCircle, Clock, ShieldCheck, BarChart3, TrendingUp, Heart, Star, Send, X
} from "lucide-react";
import {
  listingService, offerService,
  type ListingResponse, type OfferResponse
} from "../../../services/marketplace/listingService";
import { USE_MOCK_DATA, MOCK_MY_LISTINGS, MOCK_OFFERS, MOCK_SELLER_ANALYTICS } from "./mockData";
import { showSuccess, showError } from "../../../utils/ToastUtils";
import { useChat } from "../../../contexts/ChatContext";

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
  const { startConversation } = useChat();
  const [activeTab, setActiveTab] = useState<"listings" | "offers" | "analytics">("listings");
  const [listings, setListings] = useState<ListingResponse[]>([]);
  const [offers, setOffers] = useState<OfferResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [counterModalOffer, setCounterModalOffer] = useState<OfferResponse | null>(null);
  const [counterPrice, setCounterPrice] = useState<number | "">("");
  const [counterNote, setCounterNote] = useState("");

  useEffect(() => {
    if (USE_MOCK_DATA) {
      setListings(MOCK_MY_LISTINGS);
      setOffers(MOCK_OFFERS);
      setLoading(false);
    } else {
      Promise.all([
        listingService.getMyListings(),
        offerService.getOffersForMyListings().catch(() => []),
      ])
        .then(([l, o]) => {
          setListings(l);
          setOffers(o);
        })
        .catch(() => {
          setListings([]);
          setOffers([]);
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await listingService.updateStatus(id, status);
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
      showSuccess(`Listing status updated to ${status}`);
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      await listingService.deleteListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
      showSuccess("Listing deleted successfully");
    } catch {}
  };

  const handleRespondOffer = async (offerId: number, status: "ACCEPTED" | "DECLINED" | "COUNTERED", cPrice?: number) => {
    try {
      if (!USE_MOCK_DATA) {
        await offerService.respondToOffer(offerId, status === "COUNTERED" ? "DECLINED" : status, cPrice);
      }
      setOffers((prev) =>
        prev.map((o) =>
          o.id === offerId
            ? { ...o, status: status === "COUNTERED" ? "COUNTERED" : status, counterPrice: cPrice }
            : o
        )
      );
      if (status === "COUNTERED") {
        showSuccess(`Counter-offer of ₹${cPrice} sent to buyer!`);
        setCounterModalOffer(null);
        setCounterPrice("");
        setCounterNote("");
      } else {
        showSuccess(status === "ACCEPTED" ? "Offer accepted! Buyer notified." : "Offer declined.");
      }
    } catch {
      showError("Failed to update offer status.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const pendingOffersCount = offers.filter((o) => o.status === "PENDING").length;

  return (
    <div className="space-y-4 text-slate-900 dark:text-white">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#262644] p-1 rounded-2xl w-fit border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("listings")}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
              activeTab === "listings"
                ? "bg-white dark:bg-[#1E1E36] text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            My Advertisements ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab("offers")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer relative",
              activeTab === "offers"
                ? "bg-white dark:bg-[#1E1E36] text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            Offers Received
            {pendingOffersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-black">
                {pendingOffersCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
              activeTab === "analytics"
                ? "bg-white dark:bg-[#1E1E36] text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Seller Analytics
          </button>
        </div>

        <button
          onClick={() => navigate("/marketplace")}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20"
        >
          + Post New Item
        </button>
      </div>

      {/* ── TAB 1: LISTINGS ── */}
      {activeTab === "listings" && (
        <>
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
                        {item.condition && (
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-[#262644] px-2 py-0.5 rounded-full">
                            {item.condition.replace(/_/g, " ")}
                          </span>
                        )}
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
        </>
      )}

      {/* ── TAB 2: OFFERS RECEIVED ── */}
      {activeTab === "offers" && (
        <>
          {offers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 text-center p-6">
              <DollarSign className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">No price offers received yet</p>
              <p className="text-slate-400 text-xs mt-1">When buyers submit counter-offers on your items, they will appear here for one-click approval.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white dark:bg-[#1E1E36] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                        Buyer: {offer.buyer.fullName}
                        {offer.buyer.verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                      </span>
                      <span
                        className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border",
                          offer.status === "ACCEPTED" && "bg-emerald-50 text-emerald-600 border-emerald-200",
                          offer.status === "DECLINED" && "bg-rose-50 text-rose-600 border-rose-200",
                          offer.status === "PENDING" && "bg-amber-50 text-amber-600 border-amber-200"
                        )}
                      >
                        {offer.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {offer.listingTitle}
                    </h4>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-400 line-through">Listed: ₹{offer.originalPrice}</span>
                      <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                        Offered: ₹{offer.offerPrice}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                        {Math.round(((offer.originalPrice - offer.offerPrice) / offer.originalPrice) * 100)}% Discount
                      </span>
                    </div>

                    {offer.note && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#262644] p-2 rounded-xl italic">
                        "{offer.note}"
                      </p>
                    )}
                  </div>

                  {/* Offer Controls */}
                  <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => startConversation(String(offer.buyer.id))}
                      className="p-2.5 bg-slate-100 dark:bg-[#262644] hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                      title="Chat with Buyer"
                    >
                      <MessageCircle className="w-4 h-4 text-indigo-600" />
                    </button>

                    {offer.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleRespondOffer(offer.id, "DECLINED")}
                          className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => {
                            setCounterModalOffer(offer);
                            setCounterPrice(Math.round((offer.originalPrice + offer.offerPrice) / 2));
                          }}
                          className="px-3 py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 text-xs font-bold rounded-xl hover:bg-amber-100 cursor-pointer"
                        >
                          Counter
                        </button>
                        <button
                          onClick={() => handleRespondOffer(offer.id, "ACCEPTED")}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB 3: SELLER ANALYTICS ── */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#1E1E36] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase">Total Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{MOCK_SELLER_ANALYTICS.totalRevenue.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-1">{MOCK_SELLER_ANALYTICS.completedTransactions} completed sales</div>
            </div>

            <div className="bg-white dark:bg-[#1E1E36] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase">Listing Views</span>
                <Eye className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{MOCK_SELLER_ANALYTICS.viewsCount}</div>
              <div className="text-[10px] text-indigo-600 font-bold mt-1">↑ +24% this week</div>
            </div>

            <div className="bg-white dark:bg-[#1E1E36] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase">Wishlist Saves</span>
                <Heart className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-500">{MOCK_SELLER_ANALYTICS.wishlistSaves}</div>
              <div className="text-[10px] text-slate-400 mt-1">Saved by neighbors</div>
            </div>

            <div className="bg-white dark:bg-[#1E1E36] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase">Seller Trust Rating</span>
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-500">{MOCK_SELLER_ANALYTICS.averageRating} / 5.0</div>
              <div className="text-[10px] text-emerald-600 font-bold mt-1">{MOCK_SELLER_ANALYTICS.responseRatePercent}% Response Rate</div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1E1E36] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" /> Community Selling Performance Summary
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Your listings have a 78% conversion rate within 5 days of posting. Fast responses to buyer offers increase sale likelihood by 3x.
            </p>
          </div>
        </div>
      )}

      {/* ── Counter-Offer Modal ── */}
      {counterModalOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1E1E36] rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-500" /> Send Counter-Offer
              </h3>
              <button onClick={() => setCounterModalOffer(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs space-y-1">
              <p className="text-slate-500 dark:text-slate-400">
                Item: <span className="font-bold text-slate-900 dark:text-white">{counterModalOffer.listingTitle}</span>
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Original: <del>₹{counterModalOffer.originalPrice}</del> • Buyer Offered: <span className="font-bold text-indigo-600">₹{counterModalOffer.offerPrice}</span>
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (counterPrice) handleRespondOffer(counterModalOffer.id, "COUNTERED", Number(counterPrice));
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Your Counter Price (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Optional Note for Buyer</label>
                <textarea
                  rows={2}
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  placeholder="e.g. This is my best final price with accessories included..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#262644] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCounterModalOffer(null)}
                  className="px-4 py-2 font-bold text-slate-500 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md shadow-amber-500/20"
                >
                  Send Counter-Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
