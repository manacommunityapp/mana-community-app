import React, { useState } from "react";
import { MessageSquare, Heart, Share2, Sparkles, Trophy, Send, Loader2 } from "lucide-react";
import type { CursorFeedItem } from "../../../../services/community/feedService";
import { feedService } from "../../../../services/community/feedService";
import type { CommentResponse } from "../../../../types/api";

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
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleToggleLike = () => {
    setLiked((prev) => !prev);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    if (onLike) onLike(item.id);
  };

  const handleToggleComments = async () => {
    if (onCommentClick) onCommentClick(item.id);
    if (!commentsOpen && comments.length === 0) {
      setCommentsLoading(true);
      try {
        const data = await feedService.getComments(Number(item.id));
        setComments(data ?? []);
      } catch {
        // show empty state
      } finally {
        setCommentsLoading(false);
      }
    }
    setCommentsOpen((prev) => !prev);
  };

  const handleAddComment = async () => {
    const text = newComment.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      const added = await feedService.addComment(Number(item.id), text);
      setComments((prev) => [...prev, added]);
      setNewComment("");
    } catch {
      // fail silently
    } finally {
      setSubmitting(false);
    }
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
      <div className="space-y-1.5">
        {item.postType === "SPORTS" && (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-200/80 rounded-md text-[10.5px] font-extrabold text-amber-800">
            <Trophy className="w-3 h-3 text-amber-600" />
            <span>Sports Result</span>
          </div>
        )}
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
          onClick={handleToggleComments}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
            commentsOpen ? "text-indigo-600 bg-indigo-50 font-bold" : "hover:bg-slate-50 hover:text-slate-800"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{comments.length > 0 ? `${comments.length} Comments` : item.commentsCount ? `${item.commentsCount} Comments` : "Comment"}</span>
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
      {/* Inline Comments Panel */}
      {commentsOpen && (
        <div className="border-t border-slate-100 pt-3 space-y-3">
          {commentsLoading ? (
            <div className="flex justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-1">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {getInitials(c.authorName || "?")}
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2 min-w-0">
                    <p className="text-[10.5px] font-semibold text-slate-700">{c.authorName || "Resident"}</p>
                    <p className="text-xs text-slate-600 leading-relaxed break-words">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add comment input */}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()}
              placeholder="Write a comment…"
              disabled={submitting}
              className="flex-1 text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-indigo-400 focus:bg-white transition-colors placeholder:text-slate-400 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleAddComment}
              disabled={!newComment.trim() || submitting}
              className="p-2 rounded-lg bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
