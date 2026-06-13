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
  Link as LinkIcon
} from "lucide-react";
import { useState, useEffect } from "react";
import { feedService } from "../../../services/feedService";
import { useAuth } from "../../../contexts/AuthContext";
import type { PostResponse, CommentResponse } from "../../../types/api";
import { toast } from "sonner";

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
        const res = await feedService.getFeed(0, 10);
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
  }, [user?.communityId]);

  // Load more posts (Pagination)
  const handleLoadMore = async () => {
    if (!hasMore || loading) return;
    try {
      setLoading(true);
      const nextPage = page + 1;
      const res = await feedService.getFeed(nextPage, 10);
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
    setIsPosting(true);
    try {
      const newPost = await feedService.createPost(
        newPostContent,
        newPostImageUrl.trim() || undefined
      );
      setPosts((prev) => [newPost, ...prev]);
      setNewPostContent("");
      setNewPostImageUrl("");
      setShowImageUrlInput(false);
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

  // Toggle and load comments
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Create Post */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
        <div className="flex gap-4">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-700 font-semibold shadow-inner">
            {getInitials(user.fullName)}
          </div>
          <div className="flex-1 space-y-3">
            <textarea
              className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-all"
              placeholder="Share an update, announce an event, or ask a question..."
              rows={2}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              disabled={isPosting}
            ></textarea>

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
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition-all duration-300 hover:shadow-md"
            >
              {/* Post Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold border border-slate-200 shadow-inner">
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

              {/* Content text */}
              <p className="text-slate-800 text-sm mb-4 whitespace-pre-line leading-relaxed">
                {post.content}
              </p>

              {/* Attached Image */}
              {post.imageUrl && (
                <div className="mb-4 overflow-hidden rounded-xl border border-slate-100 max-h-96 bg-slate-50 flex items-center justify-center">
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
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-slate-500 text-sm">
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
  );
}

