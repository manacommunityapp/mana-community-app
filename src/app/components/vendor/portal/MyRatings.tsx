import { useState, useEffect } from "react";
import {
  Star, Loader2, AlertCircle, MessageSquare, Send,
  ChevronLeft, ChevronRight, User,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { vendorRatingService } from "../../../../services/vendorService";
import type { VendorRatingResponse } from "../../../../types/api";

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

export function MyRatings() {
  const [ratings, setRatings] = useState<VendorRatingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    loadRatings();
  }, [page]);

  const loadRatings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await vendorRatingService.getMyRatings(page, 10);
      setRatings(res.content);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
      setError("Failed to load ratings");
      toast.error("Failed to load ratings");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (id: number) => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }
    setReplyLoading(true);
    try {
      await vendorRatingService.replyToRating(id, replyText);
      toast.success("Reply posted successfully");
      setReplyingTo(null);
      setReplyText("");
      loadRatings();
    } catch (err) {
      console.error(err);
      toast.error("Failed to post reply");
    } finally {
      setReplyLoading(false);
    }
  };

  // ---- Summary calculations ----
  const totalRatings = ratings.length;
  const avgRating = totalRatings > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
    : 0;

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = ratings.filter((r) => r.rating === star).length;
    return { star, count, pct: totalRatings > 0 ? (count / totalRatings) * 100 : 0 };
  });

  const renderStars = (rating: number, size = "w-4 h-4") => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${size} ${s <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
        />
      ))}
    </div>
  );

  if (loading && ratings.length === 0) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && ratings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-[#6b7094] font-medium">{error}</p>
        <button onClick={loadRatings} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div>
        <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Vendor Portal</span>
        <h1 className="text-3xl font-black text-[#0d0d2b] flex items-center gap-2 mt-1">
          <Star className="h-8 w-8 text-indigo-600" />
          Ratings & Reviews
        </h1>
        <p className="text-[#6b7094] text-sm mt-1">View and respond to customer feedback</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average Rating */}
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-5 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold text-[#6b7094] uppercase tracking-wider mb-2">Average Rating</p>
          <div className="text-4xl font-black text-[#0d0d2b]">{avgRating.toFixed(1)}</div>
          <div className="mt-1">{renderStars(Math.round(avgRating), "w-5 h-5")}</div>
          <p className="text-xs text-[#6b7094] mt-1">
            {STAR_LABELS[Math.round(avgRating)] || ""}
          </p>
        </div>

        {/* Total Reviews */}
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-5 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold text-[#6b7094] uppercase tracking-wider mb-2">Total Reviews</p>
          <div className="text-4xl font-black text-[#0d0d2b]">{totalRatings}</div>
          <div className="flex items-center gap-1 mt-1">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-[#6b7094]">
              {ratings.filter((r) => r.comment).length} with comments
            </span>
          </div>
        </div>

        {/* Distribution */}
        <div className="bg-white border border-[#6366f1]/12 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] p-5">
          <p className="text-xs font-semibold text-[#6b7094] uppercase tracking-wider mb-3">Rating Distribution</p>
          <div className="space-y-2">
            {distribution.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-right font-bold text-[#0d0d2b]">{star}</span>
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-right text-[#6b7094] font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {ratings.length === 0 ? (
        <div className="text-center py-16">
          <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-[#6b7094] font-medium">No reviews yet</p>
          <p className="text-xs text-slate-400 mt-1">Customer reviews will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ratings.map((rating) => (
            <div
              key={rating.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                {/* Customer Info */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center shrink-0">
                    {rating.customer.profilePicUrl ? (
                      <img
                        src={rating.customer.profilePicUrl}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#0d0d2b]">{rating.customer.fullName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {renderStars(rating.rating, "w-3.5 h-3.5")}
                      <span className="text-[10px] text-[#6b7094] font-semibold">
                        {STAR_LABELS[rating.rating] || ""}
                      </span>
                    </div>
                    {rating.bookingNumber && (
                      <p className="text-[10px] text-[#6b7094] mt-0.5">
                        Booking #{rating.bookingNumber}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#6b7094]">
                    {new Date(rating.createdAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {rating.moderationStatus && rating.moderationStatus !== "APPROVED" && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rating.moderationStatus === "PENDING"
                          ? "bg-amber-50 text-amber-700"
                          : rating.moderationStatus === "REJECTED"
                          ? "bg-red-50 text-red-700"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      {rating.moderationStatus}
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Comment */}
              {rating.title && (
                <h4 className="text-sm font-bold text-[#0d0d2b] mt-3">{rating.title}</h4>
              )}
              {rating.comment && (
                <p className="text-xs text-[#6b7094] mt-2 leading-relaxed">{rating.comment}</p>
              )}

              {/* Images */}
              {rating.images && rating.images.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {rating.images.map((img, idx) => (
                    <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Vendor Reply */}
              {rating.reply && (
                <div className="mt-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <p className="text-[10px] font-bold text-indigo-600 mb-1">Your Reply</p>
                  <p className="text-xs text-[#6b7094]">{rating.reply}</p>
                  {rating.repliedAt && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(rating.repliedAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
              )}

              {/* Reply Action */}
              {!rating.reply && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  {replyingTo === rating.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={2}
                        placeholder="Write your reply..."
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setReplyingTo(null); setReplyText(""); }}
                          className="px-3 py-1.5 text-xs font-bold text-[#6b7094] hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReply(rating.id)}
                          disabled={replyLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg hover:opacity-95 disabled:opacity-50 transition-all"
                        >
                          {replyLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          Send Reply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(rating.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Reply
                    </button>
                  )}
                </div>
              )}

              {/* Helpful count */}
              {rating.helpful > 0 && (
                <p className="text-[10px] text-slate-400 mt-2">
                  {rating.helpful} {rating.helpful === 1 ? "person" : "people"} found this helpful
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-[#6b7094]">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
