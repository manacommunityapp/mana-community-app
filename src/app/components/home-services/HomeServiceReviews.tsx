import { useState, useEffect } from "react";
import { Star, ShieldCheck, MessageSquare, ThumbsUp, User } from "lucide-react";
import type { HomeServiceReview } from "../../../types/homeServices";
import { homeServiceApi } from "../../../services/homeServices/homeServiceApi";

export function HomeServiceReviews() {
  const [reviews, setReviews] = useState<HomeServiceReview[]>([]);

  useEffect(() => {
    homeServiceApi.getReviews().then(setReviews);
  }, []);

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
          Community Worker Reviews &amp; Ratings
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real feedback from verified residents after completed domestic service agreements
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {rev.reviewerName}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Reviewed on {rev.createdAt}
                </p>
              </div>

              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-xl">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span className="text-xs font-black text-amber-700 dark:text-amber-400">
                  {rev.rating.toFixed(1)}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
              "{rev.comment}"
            </p>

            {/* Criteria Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500">
              <div>Quality: ⭐ {rev.workQuality}/5</div>
              <div>Punctuality: ⭐ {rev.punctuality}/5</div>
              <div>Behaviour: ⭐ {rev.behaviour}/5</div>
              <div>Reliability: ⭐ {rev.reliability}/5</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
