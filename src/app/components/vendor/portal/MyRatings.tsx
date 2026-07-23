import { useState, useEffect } from "react";
import {
  Star, MessageSquare, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, Send,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { vendorRatingService } from "../../../../services/vendorService";
import type { VendorRatingResponse } from "../../../../types/api";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
        />
      ))}
    </div>
  );
}

export function MyRatings() {
  const [ratings, setRatings] = useState<VendorRatingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

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
    setSubmittingReply(true);
    try {
      await vendorRatingService.replyToRating(id, replyText);
      toast.success("Reply sent successfully");
      setReplyingTo(null);
      setReplyText("");
      loadRatings();
    } catch (err) {
      console.error(err);
      toast.error("Failed to send reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
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
        <p className="text-[#6b7094] text-sm mt-1">View and respond to customer reviews</p>
      </div>

      {/* Ratings List */}
      {ratings.length === 0 ? (
        <div className="text-center py-16">
          <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-[#6b7094] font-medium">No ratings received yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ratings.map((rating) => (
            <div key={rating.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
              {/* Customer Info & Rating */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  {rating.customer.profilePicUrl ? (
                    <img src={rating.customer.profilePicUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className="text-sm font-black text-indigo-600">
                      {rating.customer.fullName.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#0d0d2b]">{rating.customer.fullName}</p>
                      {rating.bookingNumber && (
                        <p className="text-[10px] text-[#6b7094]">Booking #{rating.bookingNumber}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <StarRating rating={rating.rating} />
                      <p className="text-[10px] text-[#6b7094] mt-0.5">
                        {new Date(rating.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Content */}
              {rating.title && (
                <h4 className="text-sm font-bold text-[#0d0d2b] mb-1">{rating.title}</h4>
              )}
              {rating.comment && (
                <p className="text-sm text-[#6b7094] mb-3">{rating.comment}</p>
              )}

              {/* Review Images */}
              {rating.images && rating.images.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto">
                  {rating.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-slate-200"
                    />
                  ))}
                </div>
              )}

              {/* Existing Reply */}
              {rating.reply && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 mt-3">
                  <p className="text-[10px] font-bold text-indigo-600 mb-1">Your Reply</p>
                  <p className="text-xs text-[#0d0d2b]">{rating.reply}</p>
                  {rating.repliedAt && (
                    <p className="text-[10px] text-[#6b7094] mt-1">
                      Replied on {new Date(rating.repliedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {/* Reply Form */}
              {!rating.reply && (
                <>
                  {replyingTo === rating.id ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none"
                        placeholder="Write your reply..."
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
                          disabled={submittingReply}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
                        >
                          {submittingReply ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                          Send Reply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(rating.id)}
                      className="flex items-center gap-1 mt-3 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Reply to Review
                    </button>
                  )}
                </>
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
