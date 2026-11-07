import { useState, useEffect, useMemo } from "react";
import { SportsInsuranceBanner } from "./SportsInsuranceBanner";
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
  Send,
  Plus,
  Flame,
  TrendingUp,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { sportsSocialService } from "../../../services/sports/sportsSocialService";
import type { SportsFeedPost, FeedComment, FeedPostType } from "../../../types/sportsSocial";

// ─── constants ────────────────────────────────────────────────────────────────

const POST_TYPE_META: Record<FeedPostType, { label: string; icon: typeof Trophy; color: string }> = {
  SCORECARD:         { label: "Scorecard",   icon: Trophy,       color: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" },
  HIGHLIGHT:         { label: "Highlight",   icon: Sparkles,     color: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400" },
  PHOTO:             { label: "Photo",       icon: Camera,       color: "bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400" },
  MILESTONE:         { label: "Milestone",   icon: Star,         color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" },
  DISCUSSION:        { label: "Discussion",  icon: MessageSquare,color: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400" },
  MATCH_RESULT:      { label: "Result",      icon: Target,       color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400" },
  TOURNAMENT_UPDATE: { label: "Tournament",  icon: Megaphone,    color: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400" },
};

const SPORT_FILTERS = ["ALL", "CRICKET", "FOOTBALL", "BADMINTON", "TABLE_TENNIS", "VOLLEYBALL"];

type ViewTab = "feed" | "discussions" | "trending";

type CreatePostType = "SCORECARD" | "DISCUSSION" | "HIGHLIGHT" | "MATCH_RESULT";

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function engagementScore(p: SportsFeedPost) {
  return p.likes * 2 + p.comments * 3 + p.shares * 2;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function PostCard({
  post,
  onLike,
  onShare,
  onToggleComments,
  expandedComments,
  comments,
  commentInput,
  setCommentInput,
  onAddComment,
}: {
  post: SportsFeedPost;
  onLike: (id: string) => void;
  onShare: (id: string) => void;
  onToggleComments: (id: string) => void;
  expandedComments: string | null;
  comments: Record<string, FeedComment[]>;
  commentInput: string;
  setCommentInput: (v: string) => void;
  onAddComment: (id: string) => void;
}) {
  const meta = POST_TYPE_META[post.type];
  const Icon = meta.icon;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {post.authorName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-slate-900 dark:text-white">{post.authorName}</div>
          <div className="text-[10px] text-slate-400">
            {formatTimeAgo(post.createdAt)} &middot; {post.sport.charAt(0) + post.sport.slice(1).toLowerCase().replace("_", " ")}
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.color}`}>
          <Icon className="w-3 h-3" />
          {meta.label}
        </span>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{post.title}</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{post.content}</p>
      </div>

      {/* Scorecard embed */}
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
          type="button"
          onClick={() => onLike(post.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition cursor-pointer ${
            post.likedByMe ? "text-red-500" : "text-slate-400 hover:text-red-500"
          }`}
        >
          <Heart className={`w-4 h-4 ${post.likedByMe ? "fill-current" : ""}`} />
          {post.likes}
        </button>
        <button
          type="button"
          onClick={() => onToggleComments(post.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-slate-400 hover:text-indigo-500 transition cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          {post.comments}
        </button>
        <button
          type="button"
          onClick={() => onShare(post.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-slate-400 hover:text-emerald-500 transition cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          {post.shares}
        </button>
      </div>

      {/* Comments */}
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
              onKeyDown={(e) => e.key === "Enter" && onAddComment(post.id)}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            <button
              type="button"
              onClick={() => onAddComment(post.id)}
              className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function SportsFeed() {
  const [posts, setPosts] = useState<SportsFeedPost[]>([]);
  const [sportFilter, setSportFilter] = useState("CRICKET");
  const [viewTab, setViewTab] = useState<ViewTab>("feed");
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, FeedComment[]>>({});
  const [commentInput, setCommentInput] = useState("");

  // Create post modal
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState<CreatePostType>("SCORECARD");
  const [createForm, setCreateForm] = useState({
    title: "",
    content: "",
    // Scorecard fields
    teamA: "",
    teamB: "",
    scoreA: "",
    scoreB: "",
    result: "",
    venue: "",
    playerOfMatch: "",
    // Tags
    tags: "",
  });

  useEffect(() => {
    setPosts(sportsSocialService.getFeed(sportFilter === "ALL" ? undefined : sportFilter));
  }, [sportFilter]);

  // ── derived views ──────────────────────────────────────────────────────────
  const feedPosts = useMemo(() => posts, [posts]);

  const discussionPosts = useMemo(
    () => posts.filter(p => p.type === "DISCUSSION"),
    [posts],
  );

  const trendingPosts = useMemo(
    () => [...posts].sort((a, b) => engagementScore(b) - engagementScore(a)).slice(0, 5),
    [posts],
  );

  // ── handlers ──────────────────────────────────────────────────────────────
  function handleLike(postId: string) {
    const updated = sportsSocialService.likePost(postId);
    if (updated) setPosts(prev => prev.map(p => p.id === postId ? updated : p));
  }

  function handleShare(postId: string) {
    sportsSocialService.sharePost(postId);
    toast.success("Post shared!");
    setPosts(sportsSocialService.getFeed(sportFilter === "ALL" ? undefined : sportFilter));
  }

  function toggleComments(postId: string) {
    if (expandedComments === postId) {
      setExpandedComments(null);
    } else {
      setExpandedComments(postId);
      if (!comments[postId]) {
        setComments(prev => ({ ...prev, [postId]: sportsSocialService.getComments(postId) }));
      }
    }
  }

  function handleAddComment(postId: string) {
    if (!commentInput.trim()) return;
    const c = sportsSocialService.addComment(postId, "me", "You", commentInput.trim());
    setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), c] }));
    setCommentInput("");
    setPosts(sportsSocialService.getFeed(sportFilter === "ALL" ? undefined : sportFilter));
    toast.success("Comment added");
  }

  function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.content.trim()) return;

    const tagArr = createForm.tags
      .split(",")
      .map(t => t.trim().toLowerCase().replace(/\s+/g, "-"))
      .filter(Boolean);

    const scorecard = createType === "SCORECARD" || createType === "MATCH_RESULT"
      ? {
          teamA: createForm.teamA || "Team A",
          teamB: createForm.teamB || "Team B",
          scoreA: createForm.scoreA,
          scoreB: createForm.scoreB,
          result: createForm.result,
          venue: createForm.venue,
          date: new Date().toISOString().slice(0, 10),
          playerOfMatch: createForm.playerOfMatch || undefined,
        }
      : undefined;

    sportsSocialService.createPost({
      type: createType,
      authorId: "me",
      authorName: "You",
      sport: sportFilter === "ALL" ? "CRICKET" : sportFilter,
      title: createForm.title,
      content: createForm.content,
      scorecard,
      tags: tagArr,
    });

    setPosts(sportsSocialService.getFeed(sportFilter === "ALL" ? undefined : sportFilter));
    setShowCreate(false);
    setCreateForm({ title: "", content: "", teamA: "", teamB: "", scoreA: "", scoreB: "", result: "", venue: "", playerOfMatch: "", tags: "" });
    toast.success("Posted!");
  }

  const postListProps = {
    onLike: handleLike,
    onShare: handleShare,
    onToggleComments: toggleComments,
    expandedComments,
    comments,
    commentInput,
    setCommentInput,
    onAddComment: handleAddComment,
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-5 p-3 sm:p-5 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">Sports Feed</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Scorecards, highlights &amp; discussions</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Post</span>
        </button>
      </div>

      {/* Insurance nudge — shown once, dismissable */}
      <SportsInsuranceBanner variant="pa" compact />

      {/* Sport Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
        {SPORT_FILTERS.map(s => (
          <button
            key={s}
            type="button"
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

      {/* View tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
        {([
          { id: "feed"        as const, label: "Feed",        icon: Newspaper    },
          { id: "discussions" as const, label: "Discussions", icon: MessageSquare },
          { id: "trending"    as const, label: "Trending",    icon: Flame        },
        ] as const).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setViewTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewTab === t.id
                ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ════ FEED ════ */}
      {viewTab === "feed" && (
        <div className="space-y-4">
          {feedPosts.length === 0 ? (
            <div className="text-center py-10">
              <Newspaper className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No posts yet. Be the first to share!</p>
            </div>
          ) : (
            feedPosts.map(post => <PostCard key={post.id} post={post} {...postListProps} />)
          )}
        </div>
      )}

      {/* ════ DISCUSSIONS ════ */}
      {viewTab === "discussions" && (
        <div className="space-y-4">
          {/* Quick discussion prompt */}
          <button
            type="button"
            onClick={() => { setCreateType("DISCUSSION"); setShowCreate(true); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:border-indigo-300 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">Y</div>
            <span className="text-xs text-slate-400 flex-1">Start a cricket discussion...</span>
            <MessageSquare className="w-4 h-4 text-slate-300" />
          </button>

          {discussionPosts.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No discussions yet.</p>
              <button
                type="button"
                onClick={() => { setCreateType("DISCUSSION"); setShowCreate(true); }}
                className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 cursor-pointer transition"
              >
                Start Discussion
              </button>
            </div>
          ) : (
            discussionPosts.map(post => <PostCard key={post.id} post={post} {...postListProps} />)
          )}
        </div>
      )}

      {/* ════ TRENDING ════ */}
      {viewTab === "trending" && (
        <div className="space-y-4">
          {/* Trending header */}
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
              Hot right now — {sportFilter === "ALL" ? "All Sports" : sportFilter.charAt(0) + sportFilter.slice(1).toLowerCase()}
            </p>
          </div>

          {/* Trend strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {trendingPosts.map((post, i) => {
              const meta = POST_TYPE_META[post.type];
              const Icon = meta.icon;
              const score = engagementScore(post);
              return (
                <div
                  key={post.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-start gap-3"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-xs ${
                    i === 0 ? "bg-amber-400 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{post.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{post.authorName} · {formatTimeAgo(post.createdAt)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${meta.color}`}>
                        <Icon className="w-2.5 h-2.5" />
                        {meta.label}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px] text-orange-500 font-bold">
                        <Zap className="w-2.5 h-2.5" />
                        {score}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 text-[10px] text-slate-400 flex-shrink-0">
                    <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" />{post.likes}</span>
                    <span className="flex items-center gap-0.5"><MessageCircle className="w-2.5 h-2.5" />{post.comments}</span>
                    <span className="flex items-center gap-0.5"><Share2 className="w-2.5 h-2.5" />{post.shares}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full posts below trend strip */}
          <div className="space-y-4 mt-2">
            {trendingPosts.map(post => <PostCard key={post.id} post={post} {...postListProps} />)}
          </div>
        </div>
      )}

      {/* ════ CREATE POST MODAL ════ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">New Post</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Post type selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Post Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {([
                  { type: "SCORECARD"   as const, label: "Scorecard",  icon: Trophy,       desc: "Match scorecard" },
                  { type: "DISCUSSION"  as const, label: "Discussion", icon: MessageSquare,desc: "Start a thread" },
                  { type: "HIGHLIGHT"   as const, label: "Highlight",  icon: Sparkles,     desc: "Moment of glory" },
                  { type: "MATCH_RESULT"as const, label: "Result",     icon: Target,       desc: "Match outcome" },
                ]).map(t => (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => setCreateType(t.type)}
                    className={`flex flex-col items-center py-2.5 px-2 rounded-xl border text-[10px] font-bold transition cursor-pointer ${
                      createType === t.type
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <t.icon className="w-4 h-4 mb-1" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3">
              {/* Scorecard fields */}
              {(createType === "SCORECARD" || createType === "MATCH_RESULT") && (
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 space-y-2.5">
                  <p className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Match Details</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Team A</label>
                      <input
                        value={createForm.teamA}
                        onChange={e => setCreateForm(f => ({ ...f, teamA: e.target.value }))}
                        placeholder="Whitefield Warriors"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Team B</label>
                      <input
                        value={createForm.teamB}
                        onChange={e => setCreateForm(f => ({ ...f, teamB: e.target.value }))}
                        placeholder="Sarjapur Strikers"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Score A</label>
                      <input
                        value={createForm.scoreA}
                        onChange={e => setCreateForm(f => ({ ...f, scoreA: e.target.value }))}
                        placeholder="142/6 (20 ov)"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Score B</label>
                      <input
                        value={createForm.scoreB}
                        onChange={e => setCreateForm(f => ({ ...f, scoreB: e.target.value }))}
                        placeholder="139/8 (20 ov)"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Result</label>
                    <input
                      value={createForm.result}
                      onChange={e => setCreateForm(f => ({ ...f, result: e.target.value }))}
                      placeholder="Warriors won by 3 runs"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Venue</label>
                      <input
                        value={createForm.venue}
                        onChange={e => setCreateForm(f => ({ ...f, venue: e.target.value }))}
                        placeholder="SmashZone Arena"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Player of Match</label>
                      <input
                        value={createForm.playerOfMatch}
                        onChange={e => setCreateForm(f => ({ ...f, playerOfMatch: e.target.value }))}
                        placeholder="Deepak Nair"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {createType === "DISCUSSION" ? "Discussion Title" : "Post Title"}
                </label>
                <input
                  value={createForm.title}
                  onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                  placeholder={
                    createType === "SCORECARD" ? "Weekend Box Cricket Result"
                    : createType === "DISCUSSION" ? "Best venues for night cricket in Bangalore?"
                    : createType === "HIGHLIGHT" ? "Last-ball six to win the match!"
                    : "Match result"
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300 dark:text-white"
                />
              </div>

              {/* Content */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {createType === "DISCUSSION" ? "What's on your mind?" : "Description"}
                </label>
                <textarea
                  value={createForm.content}
                  onChange={e => setCreateForm(f => ({ ...f, content: e.target.value }))}
                  rows={3}
                  placeholder={
                    createType === "DISCUSSION"
                      ? "Share your thoughts, ask a question, or start a debate..."
                      : "Tell the community what happened..."
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300 resize-none dark:text-white"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Tags (comma-separated)</label>
                <input
                  value={createForm.tags}
                  onChange={e => setCreateForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="cricket, whitefield, t20"
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 cursor-pointer shadow-sm"
                >
                  {createType === "SCORECARD" ? "Share Scorecard" : createType === "DISCUSSION" ? "Post Discussion" : "Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
