import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare, Heart, Pin, Plus, Search, Filter,
  Share2, MoreVertical, Trash2, Clock, CheckCircle2,
  AlertTriangle, Send, User, ChevronRight, X, Sparkles
} from "lucide-react";
import {
  forumService,
  type ForumPostDto,
  type ForumCommentDto,
  FORUM_CATEGORIES
} from "../../../services/forum/forumService";

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  ANNOUNCEMENT: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  MAINTENANCE:  { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  EVENTS:       { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  CLASSIFIEDS:  { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  COMPLAINT:    { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  DISCUSSION:   { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" }
};

function formatTimeAgo(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function CommunityForumHub() {
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState<ForumPostDto[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<ForumPostDto | null>(null);
  const [loading, setLoading] = useState(true);

  // New Post Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("DISCUSSION");
  const [submitting, setSubmitting] = useState(false);

  // Reply State
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const res = await forumService.getPosts({
        category: activeCategory !== "ALL" ? activeCategory : undefined,
        search: search.trim() || undefined
      });
      setPosts(res.content);
      if (res.content.length > 0 && !selectedPostId) {
        setSelectedPostId(res.content[0].id);
      }
    } catch (e) {
      console.error("Failed to load forum posts", e);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, search, selectedPostId]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (selectedPostId) {
      forumService.getPostById(selectedPostId).then(p => {
        setSelectedPost(p);
      });
    }
  }, [selectedPostId]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setSubmitting(true);
    try {
      const created = await forumService.createPost({
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory
      });
      setShowCreateModal(false);
      setNewTitle("");
      setNewContent("");
      setSelectedPostId(created.id);
      loadPosts();
    } catch (err: any) {
      alert("Failed to create post: " + (err.message || "Please try again"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async (postId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const res = await forumService.toggleLikePost(postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: res.liked, likeCount: res.likeCount } : p));
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => prev ? { ...prev, isLiked: res.liked, likeCount: res.likeCount } : null);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const comment = await forumService.addComment(selectedPost.id, replyText.trim());
      setSelectedPost(prev => {
        if (!prev) return null;
        return {
          ...prev,
          commentCount: (prev.commentCount || 0) + 1,
          comments: [...(prev.comments || []), comment]
        };
      });
      setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p));
      setReplyText("");
    } catch (err: any) {
      alert("Failed to add comment: " + (err.message || "Please try again"));
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
            <MessageSquare size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Community Discussion Forum</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                Residents & MC Hub
              </span>
            </div>
            <p className="text-sm text-gray-500">Threaded discussion boards, announcements, grievances, and neighbour recommendations</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition"
          >
            <Plus size={16} />
            <span>Start Discussion</span>
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FORUM_CATEGORIES.map(cat => {
          const isActive = cat.key === activeCategory;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                isActive
                  ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search topics, author names, or keywords..."
          className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Two-Column Desktop Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Thread Cards Feed */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold px-1">
            <span>Discussions ({posts.length})</span>
            <span>Sorted by Latest</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              <MessageSquare size={24} className="animate-pulse mx-auto text-teal-500 mb-2" />
              Loading community threads...
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-gray-100 text-center text-gray-400 text-sm">
              <MessageSquare size={32} className="mx-auto text-gray-300 mb-2" />
              No discussions found in this category. Be the first to start one!
            </div>
          ) : (
            posts.map(post => {
              const isSelected = post.id === selectedPostId;
              const catStyle = CATEGORY_STYLES[post.category || "DISCUSSION"] || CATEGORY_STYLES.DISCUSSION;
              return (
                <div
                  key={post.id}
                  onClick={() => setSelectedPostId(post.id)}
                  className={`p-4 rounded-2xl border transition cursor-pointer space-y-2.5 ${
                    isSelected
                      ? "border-teal-500 bg-teal-50/40 shadow-xs ring-1 ring-teal-500"
                      : "bg-white border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                      {post.category || "DISCUSSION"}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {post.isPinned && (
                        <span className="flex items-center gap-1 text-amber-600 font-semibold text-[11px]">
                          <Pin size={12} /> Pinned
                        </span>
                      )}
                      <span>{formatTimeAgo(post.createdAt)}</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {post.preview || post.content}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100/80 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 font-bold text-[10px] flex items-center justify-center">
                        {post.authorName.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-700 text-xs">{post.authorName}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={e => handleLikePost(post.id, e)}
                        className={`flex items-center gap-1 text-xs transition ${post.isLiked ? "text-rose-600 font-bold" : "text-gray-400 hover:text-rose-600"}`}
                      >
                        <Heart size={14} className={post.isLiked ? "fill-rose-600" : ""} />
                        <span>{post.likeCount || 0}</span>
                      </button>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <MessageSquare size={14} />
                        <span>{post.commentCount || 0}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column (7 cols): Active Thread Details & Threaded Replies */}
        <div className="lg:col-span-7">
          {selectedPost ? (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              {/* Thread Header */}
              <div className="space-y-3 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${CATEGORY_STYLES[selectedPost.category || "DISCUSSION"]?.bg} ${CATEGORY_STYLES[selectedPost.category || "DISCUSSION"]?.text} ${CATEGORY_STYLES[selectedPost.category || "DISCUSSION"]?.border}`}>
                    {selectedPost.category || "DISCUSSION"}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock size={14} />
                    <span>Posted {formatTimeAgo(selectedPost.createdAt)}</span>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                  {selectedPost.title}
                </h2>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                      {selectedPost.authorName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{selectedPost.authorName}</p>
                      <p className="text-[11px] text-gray-400">{selectedPost.authorFlat || "Resident"}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleLikePost(selectedPost.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                      selectedPost.isLiked
                        ? "bg-rose-50 text-rose-600 border-rose-200"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <Heart size={14} className={selectedPost.isLiked ? "fill-rose-600" : ""} />
                    <span>{selectedPost.likeCount} {selectedPost.likeCount === 1 ? "Like" : "Likes"}</span>
                  </button>
                </div>
              </div>

              {/* Thread Content Body */}
              <div className="prose prose-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {selectedPost.content || selectedPost.preview}
              </div>

              {/* Comments Section */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare size={16} className="text-teal-600" />
                  <span>Discussion Replies ({selectedPost.comments?.length || 0})</span>
                </h4>

                {/* Comment List */}
                <div className="space-y-3">
                  {!selectedPost.comments || selectedPost.comments.length === 0 ? (
                    <p className="text-xs text-gray-400 py-3 text-center">No replies yet. Start the conversation below.</p>
                  ) : (
                    selectedPost.comments.map(c => (
                      <div key={c.id} className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-900 flex items-center gap-2">
                            <span>{c.authorName}</span>
                            <span className="text-[10px] text-gray-400 font-normal">{c.authorFlat}</span>
                          </span>
                          <span className="text-[11px] text-gray-400">{formatTimeAgo(c.createdAt)}</span>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleAddComment} className="pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Write a constructive reply to the community..."
                      className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      type="submit"
                      disabled={submittingReply || !replyText.trim()}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send size={14} />
                      <span>{submittingReply ? "Posting..." : "Reply"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-400">
              <MessageSquare size={36} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-medium">Select a discussion thread from the left to read and reply</p>
            </div>
          )}
        </div>
      </div>

      {/* New Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Start New Discussion</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="DISCUSSION">☕ General Discussion</option>
                  <option value="ANNOUNCEMENT">📢 Community Announcement</option>
                  <option value="MAINTENANCE">🔧 Maintenance & Facilities</option>
                  <option value="EVENTS">🎉 Events & Festivals</option>
                  <option value="CLASSIFIEDS">🏷️ Buy & Sell (Classifieds)</option>
                  <option value="COMPLAINT">⚠️ Complaints & Grievances</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Topic Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Low water pressure in Tower C morning timings"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Content & Details *</label>
                <textarea
                  rows={5}
                  required
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Describe the issue, proposal, or question in detail for fellow residents..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newTitle.trim() || !newContent.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? "Publishing..." : "Publish Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default CommunityForumHub;
