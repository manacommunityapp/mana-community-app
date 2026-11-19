import React, { useState } from "react";
import { kittyPartyService } from "../../../services/kittyPartyService";
import type { CreateKittyPartyPostRequest, KittyPartyPostType, MemberRole } from "../../../types/kittyPartyTypes";
import { hasPermission } from "../../../utils/kittyPartyPermissions";

interface Props {
  circleId: number;
  isOpen: boolean;
  currentUserRole?: MemberRole;
  onClose: () => void;
  onSuccess: () => void;
}

export const KittyPartyPostCreateModal: React.FC<Props> = ({
  circleId,
  isOpen,
  currentUserRole,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<KittyPartyPostType>("TEXT");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Please write something to post.");
      return;
    }

    if (postType === "POLL") {
      const validOptions = pollOptions.filter((o) => o.trim().length > 0);
      if (validOptions.length < 2) {
        setError("A poll requires at least 2 options.");
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      const validOptions = pollOptions.filter((o) => o.trim().length > 0);

      const payload: CreateKittyPartyPostRequest = {
        title: title.trim() || undefined,
        content: content.trim(),
        postType,
        attachmentUrl: attachmentUrl.trim() || undefined,
        isPinned: hasPermission(currentUserRole, 'PIN_POST') ? isPinned : false,
        pollOptions: postType === "POLL" ? validOptions : undefined,
      };

      await kittyPartyService.createPost(circleId, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...pollOptions];
    updated[idx] = val;
    setPollOptions(updated);
  };

  const handleRemoveOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Post in Circle Feed</h2>
            <p className="text-xs text-gray-500 mt-0.5">Share an announcement, poll, photo, or thought with circle members</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-full p-1.5 hover:bg-gray-100 transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-gray-700 uppercase">Post Type:</label>
            <div className="flex items-center gap-2 flex-wrap">
              {(["TEXT", "ANNOUNCEMENT", "POLL", "PHOTO"] as KittyPartyPostType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPostType(type)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition border ${
                    postType === type
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {type === "ANNOUNCEMENT"
                    ? "📢 Announcement"
                    : type === "POLL"
                    ? "📊 Poll"
                    : type === "PHOTO"
                    ? "📷 Photo"
                    : "💬 Update"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Next Meetup Theme: Royal Velvet"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Message / Content *
            </label>
            <textarea
              required
              rows={postType === "POLL" ? 2 : 4}
              placeholder={
                postType === "POLL"
                  ? "What question do you want the circle to vote on?"
                  : "Write your update, theme ideas, questions, or greetings..."
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Dynamic Poll Options */}
          {postType === "POLL" && (
            <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl space-y-3">
              <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider">
                Poll Options (Minimum 2, Maximum 5)
              </label>
              <div className="space-y-2">
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-600 w-5 text-center">#{idx + 1}</span>
                    <input
                      type="text"
                      required={idx < 2}
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="text-gray-400 hover:text-red-500 text-sm p-1 rounded"
                        title="Remove option"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {pollOptions.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1 mt-1"
                >
                  <span>+</span> Add Another Option
                </button>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Image / Attachment URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {hasPermission(currentUserRole, 'PIN_POST') && (
            <div className="flex items-center gap-2 p-3 bg-purple-50/70 border border-purple-100 rounded-xl">
              <input
                type="checkbox"
                id="isPinned"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
              />
              <label htmlFor="isPinned" className="text-xs font-semibold text-purple-900 cursor-pointer">
                📌 Pin this post to the top of the feed as an announcement
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl shadow-md transition"
            >
              {submitting ? "Publishing..." : "Publish Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
