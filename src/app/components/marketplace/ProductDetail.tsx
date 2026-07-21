import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  ArrowLeft, Heart, MessageCircle, Star, MapPin, CheckCircle, Clock,
  Tag, ShoppingCart, ImagePlus, Send, Loader2, Package, ShieldCheck
} from "lucide-react";
import {
  listingService, reviewService, wishlistService,
  type ListingResponse, type ReviewResponse, type ReviewStats
} from "../../../services/listingService";
import { useAuth } from "../../../contexts/AuthContext";
import { useChat } from "../../../contexts/ChatContext";
import type { PaginatedResponse } from "../../../types/api";
import { USE_MOCK_DATA, MOCK_LISTINGS, MOCK_REVIEWS, MOCK_REVIEW_STATS, paginate } from "./mockData";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

function formatPrice(price: number, unit?: string): string {
  const formatted = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);
  return unit ? `${formatted} / ${unit}` : formatted;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startConversation } = useChat();

  const [listing, setListing] = useState<ListingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [stats, setStats] = useState<ReviewStats>({ averageRating: 0, totalReviews: 0 });
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    const lid = Number(id);
    setLoading(true);
    if (USE_MOCK_DATA) {
      const found = MOCK_LISTINGS.find((l) => l.id === lid) || MOCK_LISTINGS[0];
      setListing(found);
      setStats(MOCK_REVIEW_STATS);
      setReviews(MOCK_REVIEWS.filter((r) => r.listingId === lid || lid === 1));
      setWishlisted(false);
      setLoading(false);
    } else {
      Promise.all([
        listingService.getById(lid),
        reviewService.getListingStats(lid),
        reviewService.getListingReviews(lid, 0, 20),
        wishlistService.check(lid),
      ]).then(([l, s, r, w]) => {
        setListing(l);
        setStats(s);
        setReviews(r.content);
        setWishlisted(w.wishlisted);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [id]);

  const toggleWishlist = async () => {
    if (!id) return;
    setWishlistLoading(true);
    try {
      if (wishlisted) {
        await wishlistService.remove(Number(id));
        setWishlisted(false);
      } else {
        await wishlistService.add(Number(id));
        setWishlisted(true);
      }
    } catch {}
    setWishlistLoading(false);
  };

  const handleContact = () => {
    if (listing) startConversation(String(listing.seller.id));
  };

  const submitReview = async () => {
    if (!id) return;
    setSubmittingReview(true);
    try {
      const review = await reviewService.create({ listingId: Number(id), rating: reviewRating, comment: reviewComment });
      setReviews((prev) => [review, ...prev]);
      setStats((prev) => ({
        totalReviews: prev.totalReviews + 1,
        averageRating: ((prev.averageRating * prev.totalReviews) + reviewRating) / (prev.totalReviews + 1),
      }));
      setShowReviewForm(false);
      setReviewComment("");
      setReviewRating(5);
    } catch {}
    setSubmittingReview(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-32">
        <p className="text-slate-500 dark:text-slate-400">Listing not found</p>
        <button onClick={() => navigate("/marketplace")} className="mt-4 text-indigo-600 font-bold text-xs cursor-pointer hover:underline">
          Back to Marketplace
        </button>
      </div>
    );
  }

  const isOwner = user?.userId && Number(user.userId) === listing.seller.id;

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-900 dark:text-white">
      {/* Back button */}
      <button onClick={() => navigate("/marketplace")} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Back to listings
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Images Preview */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="h-80 sm:h-96 bg-slate-50 dark:bg-[#262644] flex items-center justify-center">
              {listing.imageUrls.length > 0 ? (
                <img src={listing.imageUrls[selectedImage]} alt={listing.title} className="w-full h-full object-contain" />
              ) : (
                <ImagePlus className="w-16 h-16 text-slate-300" />
              )}
            </div>
            {listing.imageUrls.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto border-t border-slate-100 dark:border-slate-800">
                {listing.imageUrls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      "w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 cursor-pointer transition-all",
                      selectedImage === i ? "border-indigo-600" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Info Sidebar */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mb-2">
              <Tag className="w-3.5 h-3.5" /> {listing.category}
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{listing.title}</h2>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">{formatPrice(listing.price, listing.priceUnit)}</p>

            {listing.location && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-3">
                <MapPin className="w-4 h-4 text-indigo-500" /> {listing.location}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
              <Clock className="w-3.5 h-3.5" /> Listed {timeAgo(listing.createdAt)}
            </div>

            {/* Rating Summary */}
            {stats.totalReviews > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("w-4 h-4", s <= Math.round(stats.averageRating) ? "text-amber-400 fill-amber-400" : "text-slate-300")} />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{stats.averageRating.toFixed(1)}</span>
                <span className="text-xs text-slate-400">({stats.totalReviews} reviews)</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              {!isOwner && (
                <button onClick={handleContact} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-500/20">
                  <MessageCircle className="w-4 h-4" /> Contact Seller
                </button>
              )}
              <button
                onClick={toggleWishlist}
                disabled={wishlistLoading}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  wishlisted
                    ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-600"
                    : "bg-slate-50 dark:bg-[#262644] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                )}
              >
                <Heart className={cn("w-4 h-4", wishlisted && "fill-rose-500")} />
                {wishlisted ? "Saved" : "Save"}
              </button>
            </div>
          </div>

          {/* Seller Card */}
          <div className="bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Seller Details</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 text-indigo-600 font-bold text-sm flex items-center justify-center">
                {listing.seller.fullName?.charAt(0) ?? "?"}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1">
                  {listing.seller.fullName}
                  {listing.seller.verified && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                </div>
                <p className="text-[10px] text-slate-400">Verified Neighbor</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {listing.description && (
        <div className="bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{listing.description}</p>
        </div>
      )}

      {/* Reviews Section */}
      <div className="bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Reviews ({stats.totalReviews})</h3>
          {!isOwner && !showReviewForm && (
            <button onClick={() => setShowReviewForm(true)} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
              Write a Review
            </button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <div className="bg-slate-50 dark:bg-[#262644] rounded-2xl p-4 mb-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setReviewRating(s)} className="cursor-pointer">
                  <Star className={cn("w-5 h-5 transition-colors", s <= reviewRating ? "text-amber-400 fill-amber-400" : "text-slate-300")} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience with this listing..."
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-indigo-600 text-slate-900 dark:text-white resize-none"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setShowReviewForm(false)} className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer">Cancel</button>
              <button onClick={submitReview} disabled={submittingReview} className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer">
                {submittingReview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Submit Review
              </button>
            </div>
          </div>
        )}

        {/* Review List */}
        {reviews.length === 0 ? (
          <p className="text-xs text-slate-400">No reviews yet. Be the first neighbor to leave feedback!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-xs font-bold text-indigo-600">
                      {r.reviewer.fullName?.charAt(0)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{r.reviewer.fullName}</span>
                      {r.reviewer.verified && <CheckCircle className="inline w-3 h-3 text-emerald-500 ml-1" />}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">{timeAgo(r.createdAt)}</span>
                </div>
                <div className="flex items-center gap-0.5 mt-1.5 ml-9">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("w-3 h-3", s <= r.rating ? "text-amber-400 fill-amber-400" : "text-slate-300")} />
                  ))}
                </div>
                {r.comment && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 ml-9">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
