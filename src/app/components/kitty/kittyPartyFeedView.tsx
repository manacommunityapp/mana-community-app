import React, { useEffect, useState } from "react";
import { kittyPartyService } from "../../../services/kittyPartyService";
import type { KittyPartyPost, KittyPartyPostComment } from "../../../types/kittyPartyTypes";
import { KittyPartyPostCreateModal } from "./kittyPartyPostCreateModal";

interface Props {
  circleId: number;
  isAdmin: boolean;
}

export const KittyPartyFeedView: React.FC<Props> = ({ circleId, isAdmin }) => {
  const [posts, setPosts] = useState<KittyPartyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Comments state: map of postId -> { comments: KittyPartyPostComment[], open: boolean, newText: string, submitting: boolean }
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<number, KittyPartyPostComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<number, boolean>>({});
  const [votingMap, setVotingMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (circleId) {
      loadPosts();
    }
  }, [circleId]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await kittyPartyService.getCirclePosts(circleId);
      setPosts(data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load circle feed");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (postId: number, optionId: number) => {
    try {
      setVotingMap((prev) => ({ ...prev, [postId]: true }));
      const updatedPost = await kittyPartyService.votePoll(postId, optionId);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to submit vote");
    } finally {
      setVotingMap((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleTogglePin = async (postId: number) => {
    try {
      await kittyPartyService.togglePinPost(postId);
      loadPosts();
    } catch (err: any) {
      alert(err?.message || "Failed to toggle pin");
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await kittyPartyService.deletePost(postId);
      loadPosts();
    } catch (err: any) {
      alert(err?.message || "Failed to delete post");
    }
  };

  const handleToggleComments = async (postId: number) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }

    setExpandedPostId(postId);
    if (!commentsMap[postId]) {
      try {
        const comments = await kittyPartyService.getPostComments(postId);
        setCommentsMap((prev) => ({ ...prev, [postId]: comments || [] }));
      } catch (err) {
        console.error("Failed to load comments", err);
      }
    }
  };

  const handleAddComment = async (postId: number) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    try {
      setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
      const newComment = await kittyPartyService.addComment(postId, { commentText: text });
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      // Increment comment count locally
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
      );
    } catch (err: any) {
      alert(err?.message || "Failed to add comment");
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-transparent border border-purple-500/20">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>💬</span> Circle Discussion Feed & Announcements
          </h3>
          <p className="text-xs text-gray-600 mt-1 max-w-xl">
            Share group announcements, discuss party themes, ask questions, and share photos with trusted circle members.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition flex items-center gap-1.5 shrink-0"
        >
          <span>✍️</span> Share an Update
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading feed...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">{error}</div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6">
          <div className="text-4xl mb-2">📣</div>
          <h4 className="text-base font-semibold text-gray-900">No Posts in Feed Yet</h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4">
            Start the conversation by announcing your circle's theme, rules, or greeting members!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow"
          >
            Create First Post
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isCommentsOpen = expandedPostId === post.id;
            const comments = commentsMap[post.id] || [];
            const isAnnouncement = post.postType === "ANNOUNCEMENT" || post.isPinned;

            return (
              <div
                key={post.id}
                className={`rounded-2xl border bg-white p-5 transition shadow-sm hover:shadow-md ${
                  post.isPinned
                    ? "border-purple-300 ring-1 ring-purple-100 bg-purple-50/20"
                    : "border-gray-200/80"
                }`}
              >
                {/* Pinned Badge */}
                {post.isPinned && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 mb-2 pb-2 border-b border-purple-100">
                    <span>📌</span>
                    <span>PINNED ANNOUNCEMENT</span>
                  </div>
                )}

                {/* Author Row */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {post.authorName ? post.authorName.charAt(0) : "U"}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{post.authorName || "Member"}</div>
                      <div className="text-[11px] text-gray-400">{formatTimestamp(post.createdAt)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        isAnnouncement
                          ? "bg-purple-100 text-purple-800 border border-purple-200"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {post.postType}
                    </span>

                    {isAdmin && (
                      <button
                        onClick={() => handleTogglePin(post.id)}
                        className={`text-xs p-1 rounded-md transition ${
                          post.isPinned
                            ? "text-purple-600 bg-purple-100 hover:bg-purple-200"
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        }`}
                        title={post.isPinned ? "Unpin post" : "Pin as announcement"}
                      >
                        📌
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-xs p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                        title="Delete post"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                {post.title && <h4 className="text-base font-bold text-gray-900 mb-1">{post.title}</h4>}
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed mb-3">
                  {post.content}
                </p>

                {/* Optional Media */}
                {post.attachmentUrl && (
                  <div className="mb-3 rounded-xl overflow-hidden border border-gray-100 max-h-72 bg-gray-50">
                    <img
                      src={post.attachmentUrl}
                      alt="Attachment"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                {/* Poll Options */}
                {post.postType === "POLL" && post.pollOptions && post.pollOptions.length > 0 && (
                  <div className="mb-4 space-y-2 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
                      <span className="flex items-center gap-1.5">
                        <span>📊</span> Community Poll
                      </span>
                      <span>{post.totalVotes || 0} votes</span>
                    </div>

                    {post.pollOptions.map((opt) => {
                      const isVoted = post.userVotedOptionId === opt.id || opt.userVoted;
                      const hasVotedAny = !!post.userVotedOptionId;

                      return (
                        <div
                          key={opt.id}
                          onClick={() => {
                            if (!hasVotedAny && !votingMap[post.id]) {
                              handleVote(post.id, opt.id);
                            }
                          }}
                          className={`relative overflow-hidden rounded-xl border p-3 transition-all ${
                            hasVotedAny
                              ? isVoted
                                ? "border-purple-500 bg-purple-50/40"
                                : "border-slate-200 bg-white"
                              : "border-slate-200 bg-white hover:border-purple-400 hover:bg-purple-50/20 cursor-pointer"
                          }`}
                        >
                          {/* Percentage Fill Bar */}
                          {hasVotedAny && (
                            <div
                              className={`absolute top-0 bottom-0 left-0 transition-all duration-500 ${
                                isVoted ? "bg-purple-200/60" : "bg-slate-100"
                              }`}
                              style={{ width: `${opt.percentage || 0}%` }}
                            />
                          )}

                          <div className="relative z-10 flex items-center justify-between text-xs font-semibold">
                            <span className="flex items-center gap-2">
                              {isVoted ? (
                                <span className="text-purple-700 font-bold">✓</span>
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block" />
                              )}
                              <span className={isVoted ? "text-purple-900 font-bold" : "text-slate-800"}>
                                {opt.optionText}
                              </span>
                            </span>

                            {hasVotedAny && (
                              <span className="text-slate-600 font-bold ml-2">
                                {opt.percentage}% <span className="text-[10px] text-slate-400 font-normal">({opt.voteCount})</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                  <button
                    onClick={() => handleToggleComments(post.id)}
                    className="flex items-center gap-1.5 font-semibold text-gray-600 hover:text-purple-600 transition"
                  >
                    <span>💬</span>
                    <span>
                      {post.commentsCount > 0
                        ? `${post.commentsCount} Comment${post.commentsCount > 1 ? "s" : ""}`
                        : "Comment"}
                    </span>
                  </button>
                </div>

                {/* Comments Section */}
                {isCommentsOpen && (
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
                    {comments.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {comments.map((c) => (
                          <div
                            key={c.id}
                            className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs flex items-start justify-between gap-2"
                          >
                            <div>
                              <div className="font-semibold text-gray-900">{c.userName || "Member"}</div>
                              <p className="text-gray-700 mt-0.5">{c.commentText}</p>
                            </div>
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {formatTimestamp(c.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Comment Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentInputs[post.id] || ""}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddComment(post.id);
                        }}
                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={submittingComment[post.id] || !commentInputs[post.id]?.trim()}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-40 rounded-xl transition"
                      >
                        {submittingComment[post.id] ? "..." : "Send"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <KittyPartyPostCreateModal
        circleId={circleId}
        isOpen={showCreateModal}
        isAdmin={isAdmin}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadPosts}
      />
    </div>
  );
};
