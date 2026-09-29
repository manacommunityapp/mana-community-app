import React, { useState } from "react";
import { MessageSquare, Heart, Share2, Sparkles } from "lucide-react";
import type { CursorFeedItem } from "../../../../services/community/feedService";

interface FeedCardProps {
  item: CursorFeedItem;
  onLike?: (id: string | number) => void;
  onCommentClick?: (id: string | number) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatRelativeTime(dateString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (isNaN(diff)) return "Just now";
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateString).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch {
    return "Recent";
  }
}

export function FeedCard({ item, onLike, onCommentClick }: FeedCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(item.likesCount ?? 0);
  const [imgError, setImgError] = useState(false);

  const handleToggleLike = () => {
    setLiked((prev) => !prev);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    if (onLike) onLike(item.id);
  };

  const authorName = item.authorName || "Community Member";
  const authorRole = item.authorRole;

  return (
    <article
      className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col gap-3"
      style={{ borderRadius: "12px" }}
    >
      {/* Author & Header */}
      <div className="flex items-center gap-3">
        {item.authorAvatar ? (
          <img
            src={item.authorAvatar}
            alt={authorName}
            className="w-10 h-10 rounded-full object-cover border border-slate-100 shrink-0"
            loading="lazy"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
            {getInitials(authorName)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {authorName}
            </h4>
            {authorRole && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                {authorRole}
              </span>
            )}
          </div>
          <p className="text-[10.5px] text-slate-400 font-medium">
            {formatRelativeTime(item.createdAt)}
          </p>
        </div>
      </div>

      {/* Title & Summary */}
      <div className="space-y-1">
        {item.title && (
          <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
            {item.title}
          </h3>
        )}
        {item.summary && (
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
            {item.summary}
          </p>
        )}
      </div>

      {/* 16:9 Aspect Ratio Media Container (Zero CLS layout shift) */}
      {item.image && !imgError && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80">
          <img
            src={item.image}
            alt={item.title || "Feed Attachment"}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.02]"
          />
        </div>
      )}

      {/* Actions Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-500 text-xs">
        <button
          type="button"
          onClick={handleToggleLike}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
            liked
              ? "text-rose-600 bg-rose-50 font-bold"
              : "hover:bg-slate-50 hover:text-slate-800"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current text-rose-600" : ""}`} />
          <span>{likesCount > 0 ? likesCount : "Like"}</span>
        </button>

        <button
          type="button"
          onClick={() => onCommentClick && onCommentClick(item.id)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{item.commentsCount ? `${item.commentsCount} Comments` : "Comment"}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: item.title, text: item.summary, url: window.location.href }).catch(() => {});
            }
          }}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </article>
  );
}
