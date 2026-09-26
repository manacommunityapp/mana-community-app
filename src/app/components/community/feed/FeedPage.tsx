import React from "react";
import { useDashboard } from "../../../hooks/useDashboard";
import { useInfiniteFeed } from "../../../hooks/useInfiniteFeed";
import { FeedCard } from "./FeedCard";
import { SkeletonCard } from "./SkeletonCard";
import { RefreshCw, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";

export function FeedPage() {
  const { stats, loading: statsLoading, error: statsError, retry: retryStats } = useDashboard();
  const {
    items,
    loading: feedLoading,
    loadingMore,
    error: feedError,
    hasMore,
    sentinelRef,
    refresh: refreshFeed,
    retry: retryFeed,
  } = useInfiniteFeed({ limit: 20, rootMargin: "600px 0px" });

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-6 px-4">
      <div className="max-w-[640px] mx-auto space-y-6">
        {/* Top Branding & Refresh */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Community Feed</span>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Real-time updates, notices and resident conversations
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              refreshFeed();
              retryStats();
            }}
            title="Refresh Feed"
            className="p-2 rounded-xl bg-white border border-[#E2E8F0] text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/60 shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* ── Dashboard Stats Panel ───────────────────────────────────────── */}
        <section aria-label="Community Dashboard Statistics">
          {statsLoading ? (
            <div className="grid grid-cols-3 gap-3">
              <SkeletonCard type="stat" />
              <SkeletonCard type="stat" />
              <SkeletonCard type="stat" />
            </div>
          ) : statsError ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{statsError}</span>
              </div>
              <button
                type="button"
                onClick={retryStats}
                className="font-bold underline hover:text-rose-900 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {stats.slice(0, 3).map((stat, idx) => (
                <div
                  key={idx}
                  className="h-[72px] rounded-xl p-4 border border-[#E2E8F0] flex flex-col justify-between shadow-2xs"
                  style={{ backgroundColor: "#F8FAFC", borderRadius: "12px" }}
                >
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                    {stat.label}
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-900 leading-none">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Infinite Feed List ─────────────────────────────────────────── */}
        <section aria-label="Feed Stream" className="space-y-4">
          {feedLoading ? (
            // Initial 3 skeleton placeholders
            <div className="space-y-4">
              <SkeletonCard type="feed" />
              <SkeletonCard type="feed" />
              <SkeletonCard type="feed" />
            </div>
          ) : feedError && items.length === 0 ? (
            <div className="p-6 bg-white border border-[#E2E8F0] rounded-xl text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">Unable to load community posts</h4>
                <p className="text-xs text-slate-500">{feedError}</p>
              </div>
              <button
                type="button"
                onClick={retryFeed}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <FeedCard key={item.id} item={item} />
              ))}

              {/* Incremental Page Loading Skeleton */}
              {loadingMore && (
                <div className="space-y-4 pt-2">
                  <SkeletonCard type="feed" />
                  <SkeletonCard type="feed" />
                </div>
              )}

              {/* Inline Retry if incremental fetch failed */}
              {feedError && items.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-700">
                  <span>Failed to load older posts.</span>
                  <button
                    type="button"
                    onClick={retryFeed}
                    className="font-bold underline hover:text-rose-900 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* End of Feed Message */}
              {!hasMore && items.length > 0 && (
                <div className="py-8 text-center space-y-1 text-slate-400">
                  <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-600" />
                  <p className="text-xs font-bold text-slate-600">You're all caught up</p>
                  <p className="text-[11px] text-slate-400">No more community updates right now</p>
                </div>
              )}

              {/* 1px Invisible Prefetch Sentinel */}
              <div ref={sentinelRef} className="h-px w-full pointer-events-none" />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
export default FeedPage;
