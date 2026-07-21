import {
  MessageSquare,
  Heart,
  Share2,
  Image as ImageIcon,
  CheckCircle,
  Trash2,
  Send,
  Loader2,
  X,
  Link as LinkIcon,
  Megaphone
} from "lucide-react";
import { useState, useEffect } from "react";
import { feedService } from "../../../services/feedService";
import { useAuth } from "../../../contexts/AuthContext";
import type { PostResponse, CommentResponse } from "../../../types/api";
import { toast } from "sonner";
import { CommunityDirectory } from "./CommunityDirectory";
import { AlertTicker } from "./AlertTicker";
import { SportsNotificationCard } from "./SportsNotificationCard";

export function Feed() {
  const { user, isAdmin } = useAuth();
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // New Post Form State
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImageUrl, setNewPostImageUrl] = useState("");
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Advanced Composer State
  const [composerType, setComposerType] = useState<"GENERAL" | "CLASSIFIED" | "POLL" | "LOST_FOUND">("GENERAL");
  const [classifiedPrice, setClassifiedPrice] = useState("");
  const [classifiedLocation, setClassifiedLocation] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [lostFoundType, setLostFoundType] = useState<"LOST" | "FOUND">("LOST");
  const [lostFoundLocation, setLostFoundLocation] = useState("");

  // Feed Filter Tab State
  const [activeFilter, setActiveFilter] = useState("ALL");

  // Comments State
  const [commentsOpen, setCommentsOpen] = useState<Record<number, boolean>>({});
  const [comments, setComments] = useState<Record<number, CommentResponse[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<number, boolean>>({});
  const [newCommentText, setNewCommentText] = useState<Record<number, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<number, boolean>>({});

  // Fetch initial feed posts
  useEffect(() => {
    async function loadInitialFeed() {
      if (!user?.communityId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await feedService.getFeed(0, 10, activeFilter !== "ALL" ? activeFilter : undefined);
        setPosts(res.content);
        setHasMore(!res.last);
        setPage(0);
      } catch (error: any) {
        toast.error("Failed to load feed: " + error.message);
      } finally {
        setLoading(false);
      }
    }
    loadInitialFeed();
  }, [user?.communityId, activeFilter]);

  // Load more posts (Pagination)
  const handleLoadMore = async () => {
    if (!hasMore || loading) return;
    try {
      setLoading(true);
      const nextPage = page + 1;
      const res = await feedService.getFeed(nextPage, 10, activeFilter !== "ALL" ? activeFilter : undefined);
      setPosts((prev) => [...prev, ...res.content]);
      setHasMore(!res.last);
      setPage(nextPage);
    } catch (error: any) {
      toast.error("Failed to load more posts: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Create new post
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      toast.error("Post content cannot be empty.");
      return;
    }

    let price: number | undefined = undefined;
    let location: string | undefined = undefined;
    let pollQuest: string | undefined = undefined;
    let pollOptsCombined: string | undefined = undefined;

    if (composerType === "CLASSIFIED") {
      const parsed = parseFloat(classifiedPrice);
      if (isNaN(parsed) || parsed <= 0) {
        toast.error("Please enter a valid price.");
        return;
      }
      price = parsed;
      location = classifiedLocation.trim() || undefined;
    } else if (composerType === "POLL") {
      if (!pollQuestion.trim()) {
        toast.error("Please enter a poll question.");
        return;
      }
      const opts = pollOptions.map(o => o.trim()).filter(Boolean);
      if (opts.length < 2) {
        toast.error("Please provide at least two choices.");
        return;
      }
      pollQuest = pollQuestion.trim();
      pollOptsCombined = opts.join(",");
    } else if (composerType === "LOST_FOUND") {
      if (!lostFoundLocation.trim()) {
        toast.error("Please enter a location.");
        return;
      }
      location = `${lostFoundType}: ${lostFoundLocation.trim()}`;
    }

    setIsPosting(true);
    try {
      const newPost = await feedService.createPost(
        newPostContent,
        newPostImageUrl.trim() || undefined,
        composerType,
        price,
        location,
        pollQuest,
        pollOptsCombined
      );
      setPosts((prev) => [newPost, ...prev]);
      setNewPostContent("");
      setNewPostImageUrl("");
      setShowImageUrlInput(false);
      
      // Reset composer inputs
      setComposerType("GENERAL");
      setClassifiedPrice("");
      setClassifiedLocation("");
      setPollQuestion("");
      setPollOptions(["", ""]);
      setLostFoundLocation("");
      
      toast.success("Post published successfully!");
    } catch (error: any) {
      toast.error("Failed to publish post: " + error.message);
    } finally {
      setIsPosting(false);
    }
  };

  // Delete post
  const handleDeletePost = async (postId: number) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await feedService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success("Post deleted.");
    } catch (error: any) {
      toast.error("Failed to delete post: " + error.message);
    }
  };

  // Toggle Like (Optimistic UI)
  const handleLike = async (postId: number) => {
    // Save original state for rollback
    const originalPosts = [...posts];

    // Optimistically update local state
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const newLiked = !post.likedByCurrentUser;
          return {
            ...post,
            likedByCurrentUser: newLiked,
            likesCount: post.likesCount + (newLiked ? 1 : -1),
          };
        }
        return post;
      })
    );

    try {
      const res = await feedService.toggleLike(postId);
      // Sync with exact server response
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              likedByCurrentUser: res.liked,
              likesCount: res.likesCount,
            };
          }
          return post;
        })
      );
    } catch (error: any) {
      // Rollback on failure
      setPosts(originalPosts);
      toast.error("Failed to like post: " + error.message);
    }
  };

  // Vote on poll
  const handleVote = async (postId: number, option: string) => {
    try {
      const updatedPost = await feedService.voteOnPoll(postId, option);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
      toast.success("Vote recorded!");
    } catch (error: any) {
      toast.error("Failed to vote: " + error.message);
    }
  };
  const handleToggleComments = async (postId: number) => {
    const isOpen = !commentsOpen[postId];
    setCommentsOpen((prev) => ({ ...prev, [postId]: isOpen }));

    if (isOpen && !comments[postId]) {
      setLoadingComments((prev) => ({ ...prev, [postId]: true }));
      try {
        const res = await feedService.getComments(postId);
        setComments((prev) => ({ ...prev, [postId]: res }));
      } catch (error: any) {
        toast.error("Failed to load comments: " + error.message);
      } finally {
        setLoadingComments((prev) => ({ ...prev, [postId]: false }));
      }
    }
  };

  // Add Comment
  const handleAddComment = async (postId: number) => {
    const text = newCommentText[postId]?.trim();
    if (!text) return;

    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
    try {
      const comment = await feedService.addComment(postId, text);
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), comment],
      }));
      setNewCommentText((prev) => ({ ...prev, [postId]: "" }));
      // Increment comment count on the post UI
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return { ...post, commentsCount: post.commentsCount + 1 };
          }
          return post;
        })
      );
    } catch (error: any) {
      toast.error("Failed to add comment: " + error.message);
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Delete Comment
  const handleDeleteComment = async (postId: number, commentId: number) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await feedService.deleteComment(commentId);
      setComments((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c.id !== commentId),
      }));
      // Decrement comment count on the post UI
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return { ...post, commentsCount: Math.max(0, post.commentsCount - 1) };
          }
          return post;
        })
      );
      toast.success("Comment deleted.");
    } catch (error: any) {
      toast.error("Failed to delete comment: " + error.message);
    }
  };

  // Helper: Format initials
  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Helper: Relative time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  // Check if user has community setup
  if (!user?.communityId) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-700 mb-2">No Community Assigned</h3>
        <p className="text-sm text-slate-500">
          You must be assigned to a community to access the community feed. Please complete your profile configuration.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 items-start">
        {/* Main Feed Content (Left side, spanning 3 columns on lg) */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          {/* Mobile-only Community Directory & Sports Notifications (hidden on lg, visible on smaller screens) */}
          <div className="lg:hidden space-y-4">
            <CommunityDirectory />
            <SportsNotificationCard />
          </div>

          {/* Alert Ticker Notice Board */}
          <AlertTicker />

      {/* Category Tabs Filter */}
      <div className="flex items-center gap-1 sm:gap-2 pb-2 border-b border-slate-100/80 overflow-hidden flex-nowrap justify-between w-full">
        {[
          { id: "ALL", label: "All Updates", shortLabel: "All", color: "bg-gradient-to-r from-indigo-500 to-violet-600 text-white" },
          { id: "OFFICIAL", label: "Official Notices", shortLabel: "Notices", color: "bg-gradient-to-r from-amber-500 to-orange-600 text-white" },
          { id: "POLL", label: "Interactive Polls", shortLabel: "Polls", color: "bg-gradient-to-r from-violet-500 to-purple-600 text-white" },
          { id: "CLASSIFIED", label: "Classifieds", shortLabel: "Classifieds", color: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white" },
          { id: "LOST_FOUND", label: "Lost & Found", shortLabel: "Lost/Found", color: "bg-gradient-to-r from-rose-500 to-red-600 text-white" }
        ].map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex-1 text-center px-1.5 sm:px-3.5 py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer border ${
                isActive
                  ? `${tab.color} border-transparent shadow-sm shadow-indigo-500/10`
                  : "bg-slate-50 text-slate-500 border-slate-200/60 hover:text-slate-800 hover:bg-slate-100/80"
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="inline sm:hidden">{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Create Post */}
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
        <div className="flex gap-3 sm:gap-4">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-700 font-semibold shadow-inner">
            {getInitials(user.fullName)}
          </div>
          <div className="flex-1 space-y-3">
            {/* Post Type Selector */}
            <div className="flex gap-2 pb-1 border-b border-slate-100 overflow-x-auto hide-scrollbar">
              {[
                { id: "GENERAL", label: "General Post" },
                { id: "POLL", label: "Create Poll" },
                { id: "CLASSIFIED", label: "Classifieds" },
                { id: "LOST_FOUND", label: "Lost & Found" }
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setComposerType(type.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    composerType === type.id
                      ? "bg-indigo-50 text-indigo-700 font-extrabold"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <textarea
              className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-all"
              placeholder={
                composerType === "POLL" ? "Provide context or details about this poll..."
                : composerType === "CLASSIFIED" ? "Describe the item you are listing..."
                : composerType === "LOST_FOUND" ? "Describe the lost or found item..."
                : "Share an update, announce an event, or ask a question..."
              }
              rows={2}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              disabled={isPosting}
            ></textarea>

            {/* Conditional Post Type Inputs */}
            {composerType === "CLASSIFIED" && (
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Price (INR)</label>
                  <input
                    type="number"
                    placeholder="Enter price..."
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    value={classifiedPrice}
                    onChange={(e) => setClassifiedPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Item Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Block A Lobby..."
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    value={classifiedLocation}
                    onChange={(e) => setClassifiedLocation(e.target.value)}
                  />
                </div>
              </div>
            )}

            {composerType === "POLL" && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-2 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Poll Question</label>
                  <input
                    type="text"
                    placeholder="Enter your poll question..."
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                    Choices
                    <button
                      type="button"
                      onClick={() => setPollOptions((prev) => [...prev, ""])}
                      className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      + Add Option
                    </button>
                  </label>
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        placeholder={`Option ${idx + 1}...`}
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...pollOptions];
                          updated[idx] = e.target.value;
                          setPollOptions(updated);
                        }}
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-red-500 text-xs px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {composerType === "LOST_FOUND" && (
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    value={lostFoundType}
                    onChange={(e) => setLostFoundType(e.target.value as any)}
                  >
                    <option value="LOST">Lost Item</option>
                    <option value="FOUND">Found Item</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Location Lost/Found</label>
                  <input
                    type="text"
                    placeholder="e.g. Garden Park..."
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    value={lostFoundLocation}
                    onChange={(e) => setLostFoundLocation(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Optional Image URL Input */}
            {showImageUrlInput && (
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <LinkIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Paste image URL here..."
                  className="bg-transparent border-none text-xs w-full outline-none text-slate-600 focus:ring-0"
                  value={newPostImageUrl}
                  onChange={(e) => setNewPostImageUrl(e.target.value)}
                  disabled={isPosting}
                />
                {newPostImageUrl && (
                  <button
                    onClick={() => setNewPostImageUrl("")}
                    className="p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Image Preview thumbnail if URL exists */}
            {newPostImageUrl && (
              <div className="relative inline-block mt-2">
                <img
                  src={newPostImageUrl}
                  alt="Post preview"
                  className="h-20 w-32 object-cover rounded-lg border border-slate-200 shadow-sm"
                  onError={() => toast.error("Invalid image URL or unable to load.")}
                />
                <button
                  onClick={() => setNewPostImageUrl("")}
                  className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-sm"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowImageUrlInput(!showImageUrlInput)}
                  className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
                    showImageUrlInput
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                  }`}
                  disabled={isPosting}
                >
                  <ImageIcon className="w-4 h-4" /> Add Image
                </button>
              </div>
              <button
                onClick={handleCreatePost}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                disabled={isPosting || !newPostContent.trim()}
              >
                {isPosting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Publishing...
                  </>
                ) : (
                  "Post"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Items */}
      <div className="space-y-4">
        {posts.length === 0 && !loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500 text-sm">
            No posts in the feed yet. Be the first to share something!
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className={`bg-white rounded-xl shadow-sm border p-4 sm:p-5 transition-all duration-300 hover:shadow-md ${
                post.official 
                  ? "border-amber-200 bg-amber-50/10 shadow-[0_4px_15px_-3px_rgba(217,119,6,0.04)]" 
                  : "border-slate-200"
              }`}
            >
              {/* Post Header */}
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold border border-slate-200 shadow-inner">
                    {post.authorAvatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900 leading-tight">
                        {post.authorName}
                      </span>
                      {post.official && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </div>
                    <div className="flex items-center text-xs text-slate-500 gap-2">
                      <span
                        className={
                          post.official ? "text-indigo-600 font-semibold" : "font-medium"
                        }
                      >
                        {post.authorRole}
                      </span>
                      <span>•</span>
                      <span>{formatTimeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Delete button (Visible only to post author or Admin) */}
                {(user?.userId === String(post.authorId) || isAdmin) && (
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                    title="Delete Post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Official Announcement Banner */}
              {post.official && (
                <div className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-100/50 border border-amber-200/50 px-2 py-0.5 rounded-md font-bold mb-3 w-fit">
                  📢 Official Announcement
                </div>
              )}

              {/* Content text */}
              <p className="text-slate-800 text-sm mb-4 whitespace-pre-line leading-relaxed text-left">
                {post.content}
              </p>

              {/* Custom Post Content Type (Poll, Classified, Lost & Found) */}
              {post.postType === "CLASSIFIED" && (
                <div className="flex flex-wrap gap-2 mb-4 text-left">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg px-3 py-1.5 text-xs font-black flex items-center gap-1 shadow-sm">
                    Price: ₹{post.price?.toLocaleString("en-IN")}
                  </span>
                  {post.location && (
                    <span className="bg-slate-50 text-slate-600 border border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1 shadow-sm">
                      📍 Location: {post.location}
                    </span>
                  )}
                </div>
              )}

              {post.postType === "LOST_FOUND" && post.location && (() => {
                const isLost = post.location.startsWith("LOST:");
                const cleanLoc = post.location.replace(/^(LOST|FOUND):\s*/, "");
                return (
                  <div className="flex flex-wrap gap-2 mb-4 text-left">
                    <span className={`border rounded-lg px-3 py-1.5 text-xs font-black flex items-center gap-1.5 shadow-sm ${
                      isLost 
                        ? "bg-rose-50 text-rose-700 border-rose-100" 
                        : "bg-teal-50 text-teal-700 border-teal-100"
                    }`}>
                      {isLost ? "⚠️ Lost Item" : "✅ Found Item"}
                    </span>
                    <span className="bg-slate-50 text-slate-600 border border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1 shadow-sm">
                      📍 Area: {cleanLoc}
                    </span>
                  </div>
                );
              })()}

              {post.postType === "POLL" && post.pollQuestion && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-4 text-left space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    📊 Poll: {post.pollQuestion}
                  </h4>
                  <div className="space-y-2">
                    {post.pollOptionsList?.map((option) => {
                      const votes = post.pollVotes?.[option] || 0;
                      const totalVotes = Object.values(post.pollVotes || {}).reduce((a, b) => a + b, 0);
                      const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                      const hasVoted = !!post.userVotedOption;
                      const isUserChoice = post.userVotedOption === option;

                      return (
                        <div key={option} className="relative">
                          {hasVoted ? (
                            <div className={`w-full border rounded-lg p-2.5 text-xs font-bold flex justify-between items-center relative overflow-hidden transition-all bg-white ${
                              isUserChoice ? "border-indigo-300 text-indigo-800" : "border-slate-200 text-slate-700"
                            }`}>
                              {/* Percentage filled bar background */}
                              <div 
                                className={`absolute left-0 top-0 bottom-0 transition-all ${
                                  isUserChoice ? "bg-indigo-100/50" : "bg-slate-100/60"
                                }`}
                                style={{ width: `${percent}%`, zIndex: 0 }}
                              />
                              <span className="relative z-10 flex items-center gap-1.5">
                                {option}
                                {isUserChoice && <span className="text-[10px] text-indigo-500 font-extrabold">(My Choice)</span>}
                              </span>
                              <span className="relative z-10 text-[10px] text-slate-500">
                                {votes} votes ({percent}%)
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleVote(post.id, option)}
                              className="w-full text-left border border-slate-200 bg-white hover:bg-indigo-50/30 hover:border-indigo-200 rounded-lg p-2.5 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
                            >
                              {option}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium pt-1">
                    Total: {Object.values(post.pollVotes || {}).reduce((a, b) => a + b, 0)} votes
                  </div>
                </div>
              )}

              {/* Attached Image */}
              {post.imageUrl && (
                <div className="mb-4 overflow-hidden rounded-xl border border-slate-100 max-h-64 sm:max-h-96 bg-slate-50 flex items-center justify-center">
                  <img
                    src={post.imageUrl}
                    alt="Post attachment"
                    className="w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Feed Actions */}
              <div className="pt-3 sm:pt-4 border-t border-slate-100 flex items-center justify-between text-slate-500 text-sm">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1.5 transition-colors font-medium ${
                    post.likedByCurrentUser
                      ? "text-rose-600 hover:text-rose-700"
                      : "hover:text-indigo-600"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      post.likedByCurrentUser ? "fill-rose-500 text-rose-500" : ""
                    }`}
                  />{" "}
                  {post.likesCount}
                </button>
                <button
                  onClick={() => handleToggleComments(post.id)}
                  className={`flex items-center gap-1.5 transition-colors font-medium hover:text-indigo-600 ${
                    commentsOpen[post.id] ? "text-indigo-600" : ""
                  }`}
                >
                  <MessageSquare className="w-4 h-4" /> {post.commentsCount} Comments
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/posts/${post.id}`
                    );
                    toast.success("Link copied to clipboard!");
                  }}
                  className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors font-medium"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>

              {/* Comments Section */}
              {commentsOpen[post.id] && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                  {/* Comments Loader */}
                  {loadingComments[post.id] && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                    </div>
                  )}

                  {/* List comments */}
                  {comments[post.id] && (
                    <div className="space-y-3">
                      {comments[post.id].length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-2">
                          No comments yet. Start the conversation!
                        </p>
                      ) : (
                        comments[post.id].map((comment) => (
                          <div
                            key={comment.id}
                            className="flex gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100/50"
                          >
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-xs text-slate-600 font-bold">
                              {comment.authorAvatar}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-800">
                                    {comment.authorName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 bg-slate-200/50 px-1 rounded">
                                    {comment.authorRole}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-400">
                                    {formatTimeAgo(comment.createdAt)}
                                  </span>
                                  {/* Delete comment button (comment author, post author, or admin) */}
                                  {(user?.userId === String(comment.authorId) ||
                                    user?.userId === String(post.authorId) ||
                                    isAdmin) && (
                                    <button
                                      onClick={() => handleDeleteComment(post.id, comment.id)}
                                      className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-all"
                                      title="Delete Comment"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-slate-700 leading-normal whitespace-pre-line">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Add Comment Input */}
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="Write a comment..."
                      value={newCommentText[post.id] || ""}
                      onChange={(e) =>
                        setNewCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment(post.id);
                        }
                      }}
                      disabled={submittingComment[post.id]}
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="p-2 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-600 rounded-lg transition-colors flex-shrink-0"
                      disabled={submittingComment[post.id] || !newCommentText[post.id]?.trim()}
                    >
                      {submittingComment[post.id] ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Spinner / Skeletons */}
        {loading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-2.5 bg-slate-200 rounded w-1/6"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3.5 bg-slate-200 rounded"></div>
                  <div className="h-3.5 bg-slate-200 rounded w-5/6"></div>
                </div>
                <div className="h-8 bg-slate-100 rounded-lg"></div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !loading && posts.length > 0 && (
          <div className="flex justify-center pt-2">
            <button
              onClick={handleLoadMore}
              className="px-6 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-lg bg-white shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              Load More Posts
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Sidebar content (Right side, visible on lg, spanning 1 column) */}
    <div className="hidden lg:block sticky top-20 space-y-4">
      <CommunityDirectory />
      <SportsNotificationCard />
      <SidebarAnnouncements posts={posts} />
      <QuickLinksCard />
    </div>
  </div>
</div>
);
}

function SidebarAnnouncements({ posts }: { posts: PostResponse[] }) {
  const announcements = posts.filter((p) => p.official).slice(0, 3);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
      <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
        <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
          <Megaphone className="w-4 h-4" />
        </div>
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Official Notices
        </h4>
      </div>

      {announcements.length === 0 ? (
        <p className="text-[11px] text-slate-400 text-center py-2">
          No official announcements yet.
        </p>
      ) : (
        <div className="space-y-2.5">
          {announcements.map((p) => (
            <div key={p.id} className="text-left text-xs space-y-1">
              <p className="font-semibold text-slate-700 hover:text-indigo-600 cursor-pointer line-clamp-2">
                {p.content}
              </p>
              <p className="text-[10px] text-slate-400">
                {new Date(p.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickLinksCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
      <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
          <LinkIcon className="w-4 h-4" />
        </div>
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Quick Links
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <a href="/profile" className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-semibold border border-slate-100 text-slate-700">
          👤 Profile
        </a>
        <a href="/finance/ledger" className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-semibold border border-slate-100 text-slate-700">
          💸 Payments
        </a>
        <a href="/helpdesk" className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-semibold border border-slate-100 text-slate-700">
          🔧 Helpdesk
        </a>
        <a href="/community/inventory" className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-semibold border border-slate-100 text-slate-700">
          📦 Inventory
        </a>
      </div>
    </div>
  );
}


