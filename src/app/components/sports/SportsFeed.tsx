import { useState, useEffect } from "react";
import {
  Newspaper,
  Heart,
  MessageCircle,
  Share2,
  Trophy,
  Target,
  Camera,
  Star,
  MessageSquare,
  Megaphone,
  Sparkles,
  Filter,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { sportsSocialService } from "../../../services/sports/sportsSocialService";
import type { SportsFeedPost, FeedComment, FeedPostType } from "../../../types/sportsSocial";

const POST_TYPE_META: Record<FeedPostType, { label: string; icon: typeof Trophy; color: string }> = {
  SCORECARD: { label: "Scorecard", icon: Trophy, color: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" },
  HIGHLIGHT: { label: "Highlight", icon: Sparkles, color: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400" },
  PHOTO: { label: "Photo", icon: Camera, color: "bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400" },
  MILESTONE: { label: "Milestone", icon: Star, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" },
  DISCUSSION: { label: "Discussion", icon: MessageSquare, color: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400" },
  MATCH_RESULT: { label: "Result", icon: Target, color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400" },
  TOURNAMENT_UPDATE: { label: "Tournament", icon: Megaphone, color: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400" },
};

const SPORT_FILTERS = ["ALL", "CRICKET", "FOOTBALL", "BADMINTON", "TABLE_TENNIS", "VOLLEYBALL"];

function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function SportsFeed() {
  const [posts, setPosts] = useState<SportsFeedPost[]>([]);
  const [sportFilter, setSportFilter] = useState("ALL");
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, FeedComment[]>>({});
  const [commentInput, setCommentInput] = useState("");

  useEffect(() => {
    setPosts(sportsSocialService.getFeed(sportFilter));
  }, [sportFilter]);

  function handleLike(postId: string) {
    const updated = sportsSocialService.likePost(postId);
    if (updated) setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
  }

  function handleShare(postId: string) {
    sportsSocialService.sharePost(postId);
    toast.success("Post shared!");
    setPosts(sportsSocialService.getFeed(sportFilter));
  }

  function toggleComments(postId: string) {
    if (expandedComments === postId) {
      setExpandedComments(null);
    } else {
      setExpandedComments(postId);
      if (!comments[postId]) {
        setComments((prev) => ({ ...prev, [postId]: sportsSocialService.getComments(postId) }));
      }
    }
  }

  function handleAddComment(postId: string) {
    if (!commentInput.trim()) return;
    const c = sportsSocialService.addComment(postId, "me", "You", commentInput.trim());
    setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), c] }));
    setCommentInput("");
    setPosts(sportsSocialService.getFeed(sportFilter));
    toast.success("Comment added");
  }

  return (
    <div className="space-y-4 sm:space-y-5 p-3 sm:p-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
          <Newspaper className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">Sports Feed</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Scorecards, highlights &amp; community discussions</p>
        </div>
      </div>

      {/* Sport Filter */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
        {SPORT_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setSportFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              sportFilter === s
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            {s === "ALL" ? "All Sports" : s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Feed Posts */}
      <div className="space-y-4">
        {posts.map((post) => {
          const meta = POST_TYPE_META[post.type];
          const Icon = meta.icon;
          return (
            <div key={post.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              {/* Post Header */}
              <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {post.authorName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{post.authorName}</div>
                  <div className="text-[10px] text-slate-400">{formatTimeAgo(post.createdAt)} &middot; {post.sport.charAt(0) + post.sport.slice(1).toLowerCase()}</div>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.color}`}>
                  <Icon className="w-3 h-3" />
                  {meta.label}
                </span>
              </div>

              {/* Post Content */}
              <div className="px-4 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{post.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{post.content}</p>
              </div>

              {/* Scorecard (if present) */}
              {post.scorecard && (
                <div className="mx-4 mb-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/50 dark:to-violet-950/50 border border-indigo-100 dark:border-indigo-900">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-center flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{post.scorecard.teamA}</div>
                      <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{post.scorecard.scoreA}</div>
                    </div>
                    <div className="text-xs font-bold text-slate-400 px-3">vs</div>
                    <div className="text-center flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{post.scorecard.teamB}</div>
                      <div className="text-lg font-black text-red-500 dark:text-red-400 tabular-nums">{post.scorecard.scoreB}</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 text-center">{post.scorecard.result}</div>
                  <div className="flex items-center justify-center gap-3 mt-1.5 text-[10px] text-slate-500">
                    <span>{post.scorecard.venue}</span>
                    {post.scorecard.playerOfMatch && (
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-500" />
                        {post.scorecard.playerOfMatch}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="px-4 pb-2 flex gap-1 flex-wrap">
                  {post.tags.map((t) => (
                    <span key={t} className="text-[10px] font-medium text-indigo-500 dark:text-indigo-400">#{t}</span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition cursor-pointer ${
                    post.likedByMe ? "text-red-500" : "text-slate-400 hover:text-red-500"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.likedByMe ? "fill-current" : ""}`} />
                  {post.likes}
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-slate-400 hover:text-indigo-500 transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  {post.comments}
                </button>
                <button
                  onClick={() => handleShare(post.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-slate-400 hover:text-emerald-500 transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  {post.shares}
                </button>
              </div>

              {/* Comments Section */}
              {expandedComments === post.id && (
                <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 space-y-3">
                  {(comments[post.id] || []).map((c) => (
                    <div key={c.id} className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                        {c.authorName.charAt(0)}
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{c.authorName}</span>
                        <span className="text-[10px] text-slate-400 ml-2">{formatTimeAgo(c.createdAt)}</span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{c.content}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
