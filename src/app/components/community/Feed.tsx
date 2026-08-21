import {
  MessageSquare,
  Heart,
  Share2,
  Image as ImageIcon,
  Upload,
  Pencil,
  CheckCircle,
  Trash2,
  Send,
  Loader2,
  X,
  Link as LinkIcon,
  Megaphone,
  Bookmark,
  BookmarkCheck,
  Pin,
  Search,
  TrendingUp,
  Users,
  Trophy,
  Star,
  ThumbsUp,
  PartyPopper,
  Sparkles,
  HandHeart,
  Lightbulb,
  Flag,
  Calendar,
  MapPin,
  AlertTriangle,
  HelpCircle,
  Briefcase,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Check,
  Reply,
  Hash,
  Award,
  Crown,
  Flame,
  BarChart3,
  Lock,
  Play,
  Video,
  Camera,
} from "lucide-react";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { cn } from "../ui/utils";
import { feedService, type CreatePostRequest, type UpdatePostRequest, type FeedSummaryCountsResponse } from "../../../services/community/feedService";
import { engagementService, groupService } from "../../../services/community/engagementService";
import { eventService, type EventResponse } from "../../../services/events/eventService";
import { mediaService } from "../../../services/files/mediaService";
import { validateMediaFile } from "../../../utils/mediaValidator";
import {
  captureVideoFrame,
  generateVideoThumbnailCandidates,
  uploadVideoCoverBlob,
  type VideoThumbnailCandidate,
} from "../../../utils/videoThumbnailHelper";
import { useAuth } from "../../../contexts/AuthContext";
import type {
  PostResponse,
  CommentResponse,
  ReactionTypeEnum,
  GroupResponse,
  TrendingResponse,
  EngagementScoreResponse,
  PostTypeEnum,
  PostLikerResponse,
  CommentLikerResponse,
} from "../../../types/api";
import { toast } from "sonner";
import { CommunityDirectory } from "./CommunityDirectory";
import { AlertTicker } from "./AlertTicker";
import { SportsNotificationCard } from "./SportsNotificationCard";
import { EventsNotificationCard } from "./EventsNotificationCard";

type FeedMediaAttachment = {
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  thumbnailUrl?: string;
  altText?: string;
  sortOrder: number;
  mediaObjectId?: string;
};

const FEED_MEDIA_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp,video/mp4,video/webm,video/quicktime,video/x-msvideo,video/3gpp,video/ogg";
const MAX_FEED_ATTACHMENTS = 4;

const REACTION_CONFIG: { type: ReactionTypeEnum; icon: typeof Heart; label: string; color: string; activeColor: string }[] = [
  { type: "LIKE", icon: ThumbsUp, label: "Like", color: "text-blue-500", activeColor: "bg-blue-50 text-blue-600" },
  { type: "LOVE", icon: Heart, label: "Love", color: "text-rose-500", activeColor: "bg-rose-50 text-rose-600" },
  { type: "CELEBRATE", icon: PartyPopper, label: "Celebrate", color: "text-amber-500", activeColor: "bg-amber-50 text-amber-600" },
  { type: "HELPFUL", icon: HandHeart, label: "Helpful", color: "text-green-500", activeColor: "bg-green-50 text-green-600" },
  { type: "INTERESTING", icon: Lightbulb, label: "Interesting", color: "text-purple-500", activeColor: "bg-purple-50 text-purple-600" },
  { type: "SUPPORT", icon: Sparkles, label: "Support", color: "text-cyan-500", activeColor: "bg-cyan-50 text-cyan-600" },
  { type: "THANKS", icon: Star, label: "Thanks", color: "text-yellow-500", activeColor: "bg-yellow-50 text-yellow-600" },
];

/** Reaction types available on comments (subset of post reactions) */
const COMMENT_REACTION_CONFIG: { type: string; emoji: string; label: string; activeColor: string }[] = [
  { type: "LIKE",      emoji: "👍", label: "Like",      activeColor: "text-blue-600" },
  { type: "LOVE",      emoji: "❤️", label: "Love",      activeColor: "text-rose-600" },
  { type: "CELEBRATE", emoji: "🎉", label: "Celebrate", activeColor: "text-amber-600" },
  { type: "HELPFUL",   emoji: "💡", label: "Helpful",   activeColor: "text-green-600" },
  { type: "THANKS",    emoji: "🙏", label: "Thanks",    activeColor: "text-yellow-600" },
];


const POST_TYPE_CONFIG: { id: PostTypeEnum; label: string; icon: string; color: string }[] = [
  { id: "GENERAL", label: "General", icon: "💬", color: "bg-slate-100 text-slate-700" },
  { id: "ANNOUNCEMENT", label: "Announcement", icon: "📢", color: "bg-amber-100 text-amber-700" },
  { id: "QUESTION", label: "Question", icon: "❓", color: "bg-blue-100 text-blue-700" },
  { id: "POLL", label: "Poll", icon: "📊", color: "bg-violet-100 text-violet-700" },
  { id: "EVENT", label: "Event", icon: "📅", color: "bg-pink-100 text-pink-700" },
  { id: "CLASSIFIED", label: "Classified", icon: "🏷️", color: "bg-emerald-100 text-emerald-700" },
  { id: "APPRECIATION", label: "Appreciation", icon: "🙏", color: "bg-rose-100 text-rose-700" },
  { id: "SUGGESTION", label: "Suggestion", icon: "💡", color: "bg-cyan-100 text-cyan-700" },
  { id: "COMPLAINT", label: "Complaint", icon: "⚠️", color: "bg-orange-100 text-orange-700" },
  { id: "LOST_FOUND", label: "Lost & Found", icon: "🔍", color: "bg-red-100 text-red-700" },
  { id: "ARTICLE", label: "Article", icon: "📝", color: "bg-indigo-100 text-indigo-700" },
  { id: "MAINTENANCE", label: "Maintenance", icon: "🔧", color: "bg-gray-100 text-gray-700" },
  { id: "EMERGENCY", label: "Emergency", icon: "🚨", color: "bg-red-200 text-red-800" },
  { id: "COMMUNITY_NEWS", label: "News", icon: "📰", color: "bg-teal-100 text-teal-700" },
  { id: "MEETING", label: "Meeting", icon: "🤝", color: "bg-purple-100 text-purple-700" },
  { id: "COMMITTEE_NOTICE", label: "Committee", icon: "🏛️", color: "bg-sky-100 text-sky-700" },
];

const FEED_FILTERS = [
  { id: "ALL", label: "All", shortLabel: "All" },
  { id: "OFFICIAL", label: "Official", shortLabel: "Official" },
  { id: "ANNOUNCEMENT", label: "Announcements", shortLabel: "Announce" },
  { id: "POLL", label: "Polls", shortLabel: "Polls" },
  { id: "EVENT", label: "Events", shortLabel: "Events" },
  { id: "CLASSIFIED", label: "Classifieds", shortLabel: "Classifieds" },
  { id: "LOST_FOUND", label: "Lost & Found", shortLabel: "Lost/Found" },
  { id: "EMERGENCY", label: "Emergency", shortLabel: "Emergency" },
  { id: "BOOKMARKED", label: "Bookmarked", shortLabel: "Saved" },
];

function isVideoMedia(mediaType?: string, mediaUrl?: string): boolean {
  const type = (mediaType || "").toLowerCase();
  const url = (mediaUrl || "").toLowerCase().split("?")[0];
  return type.includes("video") || /\.(mp4|webm|mov|avi|3gp|ogg|mkv)$/.test(url);
}

async function uploadFeedMedia(file: File, communityId: number, subContext: string, draftId: string): Promise<Omit<FeedMediaAttachment, "sortOrder">> {
  const validation = await validateMediaFile(file);
  if (!validation.valid) throw new Error(validation.error || `File '${file.name}' failed validation.`);
  if ((file.type || "").toLowerCase() === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    throw new Error("SVG files are not allowed in the community feed. Please upload JPG, PNG, WebP, GIF, or a supported video file.");
  }

  const mediaType = validation.mediaType === "video" ? "VIDEO" : "IMAGE";
  const uploadRequest = {
    module: "COMMUNITY" as const,
    moduleId: draftId,
    communityId,
    subContext,
    caption: file.name,
    altText: file.name,
  };

  const media = mediaType === "VIDEO"
    ? await mediaService.uploadDirectToS3(file, { ...uploadRequest, mediaType: "VIDEO" })
    : await mediaService.upload(file, uploadRequest);

  const resolvedUrl = media.url || media.compressedUrl || media.mediumUrl;
  if (!resolvedUrl) throw new Error(`Upload succeeded but the server returned no URL for '${file.name}'.`);

  let coverThumbnailUrl = media.thumbnailUrl;
  if (mediaType === "VIDEO" && !coverThumbnailUrl) {
    try {
      const frame = await captureVideoFrame(file, 1.0);
      coverThumbnailUrl = await uploadVideoCoverBlob(frame.blob, file.name, communityId, draftId);
    } catch (e) {
      console.warn("Auto video cover generation notice:", e);
    }
  }

  return {
    mediaUrl: resolvedUrl,
    mediaType,
    thumbnailUrl: coverThumbnailUrl,
    altText: file.name,
    mediaObjectId: media.id,
  };
}

function eventStartToDateTimeLocal(event: EventResponse): string {
  const datePart = event.startDate?.slice(0, 10);
  if (!datePart) return "";

  const timePart = event.startTime?.slice(0, 5) || (event.startDate.includes("T") ? event.startDate.slice(11, 16) : "00:00");
  return `${datePart}T${timePart || "00:00"}`;
}

function eventVenueLabel(event: EventResponse): string {
  return event.venue || event.location || event.city || "";
}

function eventOptionLabel(event: EventResponse): string {
  const datePart = event.startDate?.slice(0, 10);
  const timePart = event.startTime?.slice(0, 5);
  const when = [datePart, timePart].filter(Boolean).join(" ");
  return when ? `${event.title} - ${when}` : event.title;
}

function postMediaToAttachments(post: any): FeedMediaAttachment[] {
  if (post.media?.length) {
    return post.media.map((media: any, index: number) => ({
      mediaUrl: media.mediaUrl,
      mediaType: isVideoMedia(media.mediaType, media.mediaUrl) ? "VIDEO" : "IMAGE",
      thumbnailUrl: media.thumbnailUrl,
      altText: media.altText,
      sortOrder: media.sortOrder ?? index,
      mediaObjectId: media.mediaObjectId,
    }));
  }

  return post.imageUrl ? [{
    mediaUrl: post.imageUrl,
    mediaType: "IMAGE",
    altText: "Post image",
    sortOrder: 0,
  }] : [];
}

const getInitials = (name?: string) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

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

const getPostTypeConfig = (type?: string) =>
  POST_TYPE_CONFIG.find((t) => t.id === type) || POST_TYPE_CONFIG[0];

const getReactionIcon = (type?: ReactionTypeEnum) => {
  const config = REACTION_CONFIG.find((r) => r.type === type);
  return config || REACTION_CONFIG[0];
};

const renderHashtags = (content: string) => {
  return content.replace(/#(\w+)/g, '<span class="text-indigo-600 font-semibold cursor-pointer hover:underline">#$1</span>');
};

interface FeedVideoPlayerProps {
  mediaUrl: string;
  thumbnailUrl?: string;
  altText?: string;
  isSingle?: boolean;
}

function FeedVideoPlayer({ mediaUrl, thumbnailUrl, altText, isSingle = false }: FeedVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoCover, setAutoCover] = useState<string | undefined>(thumbnailUrl);

  useEffect(() => {
    if (thumbnailUrl) {
      setAutoCover(thumbnailUrl);
      return;
    }
    let active = true;
    captureVideoFrame(mediaUrl, 0.5)
      .then((frame) => {
        if (active) setAutoCover(frame.dataUrl);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [mediaUrl, thumbnailUrl]);

  if (!isPlaying) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsPlaying(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setIsPlaying(true);
        }}
        className={cn(
          "relative w-full overflow-hidden bg-slate-950 group cursor-pointer select-none flex items-center justify-center",
          isSingle ? "max-h-96 min-h-56" : "h-full min-h-40"
        )}
        title="Play video"
      >
        {/* Cover Photo */}
        {autoCover ? (
          <img
            src={autoCover}
            alt={altText || "Video cover"}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
            <Video className="w-10 h-10 opacity-30" />
          </div>
        )}

        {/* Shaded vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30 group-hover:bg-black/40 transition-colors" />

        {/* Video Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold tracking-wide pointer-events-none">
          <Video className="w-3 h-3 text-indigo-400" />
          <span>VIDEO</span>
        </div>

        {/* Play Button Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 shadow-xl shadow-black/50 flex items-center justify-center text-indigo-600 transition-all duration-200 pl-1">
            <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-indigo-600 text-indigo-600" />
          </div>
        </div>

        {/* Bottom prompt */}
        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white/90 text-xs font-medium pointer-events-none">
          <span className="truncate drop-shadow-sm">{altText || "Watch video"}</span>
          <span className="text-[10px] bg-black/60 px-2 py-0.5 rounded-md text-white/90 font-mono backdrop-blur-xs">Tap to Play</span>
        </div>
      </div>
    );
  }

  return (
    <video
      src={mediaUrl}
      poster={autoCover || thumbnailUrl}
      autoPlay
      controls
      playsInline
      preload="auto"
      className={isSingle ? "w-full max-h-96 object-contain bg-black" : "w-full h-full object-cover bg-black"}
    />
  );
}

interface VideoCoverPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  currentCoverUrl?: string;
  onApplyCover: (coverUrl: string) => void;
  communityId: number;
  draftId: string;
}

function VideoCoverPickerModal({
  isOpen,
  onClose,
  videoUrl,
  currentCoverUrl,
  onApplyCover,
  communityId,
  draftId,
}: VideoCoverPickerModalProps) {
  const [candidates, setCandidates] = useState<VideoThumbnailCandidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | undefined>(currentCoverUrl);
  const [selectedBlob, setSelectedBlob] = useState<Blob | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const customFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !videoUrl) return;
    let active = true;
    setLoadingCandidates(true);
    setSelectedPreviewUrl(currentCoverUrl);
    setSelectedBlob(undefined);

    generateVideoThumbnailCandidates(videoUrl, 4)
      .then((cands) => {
        if (!active) return;
        setCandidates(cands);
        setLoadingCandidates(false);
        if (!currentCoverUrl && cands.length > 0 && cands[0]) {
          setSelectedPreviewUrl(cands[0].dataUrl);
          setSelectedBlob(cands[0].blob);
        }
      })
      .catch(() => {
        if (active) setLoadingCandidates(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, videoUrl, currentCoverUrl]);

  if (!isOpen) return null;

  const handleSelectCandidate = (cand: VideoThumbnailCandidate) => {
    setSelectedPreviewUrl(cand.dataUrl);
    setSelectedBlob(cand.blob);
  };

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true);
      const uploaded = await mediaService.upload(file, {
        module: "COMMUNITY",
        moduleId: draftId,
        communityId,
        subContext: "video_cover",
        caption: `Custom cover: ${file.name}`,
        altText: `Custom cover: ${file.name}`,
      });
      const url = uploaded.url || uploaded.mediumUrl || uploaded.compressedUrl || uploaded.thumbnailUrl;
      if (url) {
        setSelectedPreviewUrl(url);
        setSelectedBlob(undefined);
        toast.success("Custom cover photo loaded!");
      }
    } catch (err: any) {
      toast.error("Failed to upload custom image: " + (err.message || "Unknown error"));
    } finally {
      setIsSaving(false);
      if (customFileInputRef.current) customFileInputRef.current.value = "";
    }
  };

  const handleApply = async () => {
    let finalUrl = selectedPreviewUrl;
    if (selectedBlob) {
      try {
        setIsSaving(true);
        finalUrl = await uploadVideoCoverBlob(selectedBlob, "video_frame.jpg", communityId, draftId);
      } catch (err: any) {
        toast.error("Failed to save cover image: " + (err.message || "Unknown error"));
        setIsSaving(false);
        return;
      }
    }

    if (finalUrl) {
      onApplyCover(finalUrl);
      toast.success("Video cover photo updated!");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={() => !isSaving && onClose()} />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Select Video Cover Photo</h3>
              <p className="text-xs text-slate-500">This photo will be displayed before the video starts playing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !isSaving && onClose()}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Live Preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Cover Page Live Preview</label>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-200 shadow-inner flex items-center justify-center">
              {selectedPreviewUrl ? (
                <img
                  src={selectedPreviewUrl}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-slate-500 space-y-1">
                  <Video className="w-8 h-8 mx-auto opacity-40" />
                  <span className="text-xs">No cover image selected</span>
                </div>
              )}

              {/* Shaded vignette overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

              {/* Video Badge */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold tracking-wide pointer-events-none">
                <Video className="w-3 h-3 text-indigo-400" />
                <span>VIDEO</span>
              </div>

              {/* Play Button preview */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-indigo-600 pl-0.5">
                  <Play className="w-6 h-6 fill-indigo-600 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Choose from Video Snapshot Frames */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Choose from Video Frames</label>
              {loadingCandidates && (
                <span className="text-xs text-indigo-600 flex items-center gap-1 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" /> Extracting frames...
                </span>
              )}
            </div>

            {candidates.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {candidates.map((cand, idx) => {
                  const isSelected = selectedPreviewUrl === cand.dataUrl;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectCandidate(cand)}
                      className={cn(
                        "relative aspect-video rounded-lg overflow-hidden border-2 transition-all cursor-pointer group bg-slate-900",
                        isSelected
                          ? "border-indigo-600 ring-2 ring-indigo-300 scale-102"
                          : "border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100"
                      )}
                    >
                      <img src={cand.dataUrl} alt={`Frame at ${cand.label}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/75 text-white text-[9px] font-mono rounded">
                        {cand.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : !loadingCandidates ? (
              <p className="text-xs text-slate-400 italic">No snapshot frames could be auto-extracted.</p>
            ) : null}
          </div>

          {/* Custom Upload Option */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Custom Image</span>
              <span className="text-[11px] text-slate-400">Upload a custom thumbnail from your device (JPG, PNG, WebP)</span>
            </div>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => customFileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/40 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>Upload Image</span>
            </button>
            <input
              ref={customFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={handleCustomUpload}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving || !selectedPreviewUrl}
            onClick={handleApply}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Set Cover Photo</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function Feed() {
  const { user, isAdmin, isEventsAdmin, isSportsAdmin, isSuperAdmin } = useAuth();
  const canPost = isAdmin || isEventsAdmin || isSuperAdmin;
  const canEdit = isAdmin || isEventsAdmin || isSportsAdmin || isSuperAdmin;
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostImageUrl, setNewPostImageUrl] = useState("");
  const [newPostMedia, setNewPostMedia] = useState<FeedMediaAttachment[]>([]);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const postDraftIdRef = useRef<string>(crypto.randomUUID());
  const [postingAction, setPostingAction] = useState<"publish" | "notify" | null>(null);
  const isPosting = postingAction !== null;
  const [composerType, setComposerType] = useState<PostTypeEnum>("GENERAL");
  const [showComposerTypes, setShowComposerTypes] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [classifiedPrice, setClassifiedPrice] = useState("");
  const [classifiedLocation, setClassifiedLocation] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [lostFoundType, setLostFoundType] = useState<"LOST" | "FOUND">("LOST");
  const [lostFoundLocation, setLostFoundLocation] = useState("");
  const [createdEvents, setCreatedEvents] = useState<EventResponse[]>([]);
  const [loadingCreatedEvents, setLoadingCreatedEvents] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [activeCoverPickerMediaIndex, setActiveCoverPickerMediaIndex] = useState<number | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get("filter") || "ALL";
  const setActiveFilter = (filter: string) => {
    setSearchParams((prev) => {
      prev.set("filter", filter);
      return prev;
    }, { replace: true });
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const [commentsOpen, setCommentsOpen] = useState<Record<number, boolean>>({});
  const [comments, setComments] = useState<Record<number, CommentResponse[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<number, boolean>>({});
  const [newCommentText, setNewCommentText] = useState<Record<number, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<number, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<Record<number, number | null>>({});

  const [showReactionPicker, setShowReactionPicker] = useState<number | null>(null);
  const reactionPickerRef = useRef<HTMLDivElement>(null);

  // ── Post & Comment Likers Modal State ──
  const [postLikersModalPostId, setPostLikersModalPostId] = useState<number | null>(null);
  const [postLikersList, setPostLikersList] = useState<PostLikerResponse[]>([]);
  const [loadingPostLikers, setLoadingPostLikers] = useState(false);

  const [commentLikersModalCommentId, setCommentLikersModalCommentId] = useState<number | null>(null);
  const [commentLikersList, setCommentLikersList] = useState<CommentLikerResponse[]>([]);
  const [loadingCommentLikers, setLoadingCommentLikers] = useState(false);

  const [summaryCounts, setSummaryCounts] = useState<FeedSummaryCountsResponse | null>(null);

  useEffect(() => {
    async function loadInitialFeed() {
      if (!user?.communityId) { setLoading(false); return; }
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

  useEffect(() => {
    if (!user?.communityId) return;
    feedService.getSidebarSummary().then(setSummaryCounts).catch(() => {});
  }, [user?.communityId]);

  useEffect(() => {
    if (!user?.communityId || !canPost || !isCreateModalOpen) return;
    if (createdEvents.length > 0) return;

    let active = true;
    setLoadingCreatedEvents(true);
    eventService.getAllEvents()
      .then((events) => {
        if (!active) return;
        const sorted = [...events].sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
        setCreatedEvents(sorted);
      })
      .catch(() => {
        if (active) setCreatedEvents([]);
      })
      .finally(() => {
        if (active) setLoadingCreatedEvents(false);
      });

    return () => { active = false; };
  }, [user?.communityId, canPost, isCreateModalOpen, createdEvents.length]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(e.target as Node)) {
        setShowReactionPicker(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      const res = await feedService.searchPosts(searchQuery, 0, 20);
      setPosts(res.content);
      setHasMore(!res.last);
      setPage(0);
    } catch (error: any) {
      toast.error("Search failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (!user?.communityId) { toast.error("No community assigned — cannot upload media."); return; }

    const remainingSlots = MAX_FEED_ATTACHMENTS - newPostMedia.length;
    if (remainingSlots <= 0) {
      toast.error(`You can attach up to ${MAX_FEED_ATTACHMENTS} media files.`);
      if (imageFileInputRef.current) imageFileInputRef.current.value = "";
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      toast.warning(`Only ${remainingSlots} more media file${remainingSlots === 1 ? "" : "s"} can be added.`);
    }

    setIsUploadingImage(true);
    try {
      const uploaded: FeedMediaAttachment[] = [];
      for (const file of selectedFiles) {
        const media = await uploadFeedMedia(file, user.communityId, "feed_post", postDraftIdRef.current);
        uploaded.push({
          ...media,
          sortOrder: newPostMedia.length + uploaded.length,
        });
      }

      setNewPostMedia((prev) => [...prev, ...uploaded].map((item, index) => ({ ...item, sortOrder: index })));
      if (!newPostImageUrl) {
        const firstImage = uploaded.find((item) => item.mediaType === "IMAGE");
        if (firstImage) setNewPostImageUrl(firstImage.mediaUrl);
      }
      toast.success(`${uploaded.length} media file${uploaded.length === 1 ? "" : "s"} uploaded successfully!`);
    } catch (error: any) {
      toast.error("Media upload failed: " + (error.message || "Unknown error"));

    } finally {
      setIsUploadingImage(false);
      if (imageFileInputRef.current) imageFileInputRef.current.value = "";
    }
  };

  const handleSelectedEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    const selectedEvent = createdEvents.find((event) => String(event.id) === eventId);
    if (!selectedEvent) return;

    setEventDate(eventStartToDateTimeLocal(selectedEvent));
    setEventVenue(eventVenueLabel(selectedEvent));
  };

  const handleCreatePost = async (notify = false) => {
    if (!canPost) {
      toast.error("Posting is restricted to community administrators.");
      return;
    }
    if (!newPostContent.trim()) { toast.error("Post content cannot be empty."); return; }

    const request: CreatePostRequest = {
      content: newPostContent,
      title: newPostTitle || undefined,
      imageUrl: newPostImageUrl.trim() || newPostMedia.find((item) => item.mediaType === "IMAGE")?.mediaUrl || undefined,
      type: composerType,
      mediaAttachments: newPostMedia.length > 0 ? newPostMedia.map(({ mediaUrl, mediaType, thumbnailUrl, altText, sortOrder, mediaObjectId }) => ({
        mediaUrl,
        mediaType,
        thumbnailUrl,
        altText,
        sortOrder,
        mediaObjectId,
      })) : undefined,
    };

    if (composerType === "CLASSIFIED") {
      const parsed = parseFloat(classifiedPrice);
      if (isNaN(parsed) || parsed <= 0) { toast.error("Please enter a valid price."); return; }
      request.price = parsed;
      request.location = classifiedLocation.trim() || undefined;
    } else if (composerType === "POLL") {
      if (!pollQuestion.trim()) { toast.error("Please enter a poll question."); return; }
      const opts = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) { toast.error("Please provide at least two choices."); return; }
      request.pollQuestion = pollQuestion.trim();
      request.pollOptions = opts.join(",");
    } else if (composerType === "LOST_FOUND") {
      if (!lostFoundLocation.trim()) { toast.error("Please enter a location."); return; }
      request.location = `${lostFoundType}: ${lostFoundLocation.trim()}`;
    } else if (composerType === "EVENT") {
      const linkedEventId = Number(selectedEventId);
      if (selectedEventId && !Number.isNaN(linkedEventId)) request.eventId = linkedEventId;
      request.eventDate = eventDate || undefined;
      request.eventVenue = eventVenue || undefined;
    } else if (composerType === "EMERGENCY") {
      request.priority = "EMERGENCY";
    }

    if (notify) request.notify = true;

    setPostingAction(notify ? "notify" : "publish");
    try {
      const newPost = await feedService.createPost(request);
      setPosts((prev) => [newPost, ...prev]);
      setNewPostContent("");
      setNewPostTitle("");
      setNewPostImageUrl("");
      setNewPostMedia([]);
      postDraftIdRef.current = crypto.randomUUID();
      setShowImageUrlInput(false);
      setComposerType("GENERAL");
      setClassifiedPrice("");
      setClassifiedLocation("");
      setPollQuestion("");
      setPollOptions(["", ""]);
      setLostFoundLocation("");
      setSelectedEventId("");
      setEventDate("");
      setEventVenue("");
      setShowComposerTypes(false);
      setIsCreateModalOpen(false);
      toast.success(notify ? "Post published and notification sent!" : "Post published!");
    } catch (error: any) {
      toast.error("Failed to publish post: " + error.message);
    } finally {
      setPostingAction(null);
    }
  };

  const handleDeletePost = useCallback(async (postId: number) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await feedService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success("Post deleted.");
    } catch (error: any) {
      toast.error("Failed to delete post: " + error.message);
    }
  }, []);

  const handleUpdatePost = useCallback(async (postId: number, updates: UpdatePostRequest) => {
    try {
      const updated = await feedService.updatePost(postId, updates);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      toast.success("Post updated.");
    } catch (error: any) {
      toast.error("Failed to update post: " + error.message);
    }
  }, []);

  const handleReaction = useCallback(async (postId: number, reactionType: ReactionTypeEnum) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const wasReacted = post.currentUserReaction === reactionType;
          return {
            ...post,
            currentUserReaction: wasReacted ? undefined : reactionType,
            likesCount: post.likesCount + (wasReacted ? -1 : post.currentUserReaction ? 0 : 1),
            likedByCurrentUser: !wasReacted,
          };
        }
        return post;
      })
    );
    setShowReactionPicker(null);

    try {
      const res = await feedService.toggleReaction(postId, reactionType);
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              currentUserReaction: res.currentUserReaction,
              reactionCounts: res.reactionCounts,
              likesCount: res.totalReactions,
              likedByCurrentUser: !!res.currentUserReaction,
            };
          }
          return post;
        })
      );
    } catch (error: any) {
      toast.error("Failed to react: " + error.message);
    }
  }, []);

  const handleBookmark = useCallback(async (postId: number) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            bookmarkedByCurrentUser: !post.bookmarkedByCurrentUser,
            bookmarksCount: post.bookmarksCount + (post.bookmarkedByCurrentUser ? -1 : 1),
          };
        }
        return post;
      })
    );
    try {
      await feedService.toggleBookmark(postId);
    } catch (error: any) {
      toast.error("Failed to bookmark: " + error.message);
    }
  }, []);

  const handleVote = useCallback(async (postId: number, option: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const currentVotes = { ...(post.pollVotes || {}) };
          currentVotes[option] = (currentVotes[option] || 0) + 1;
          return {
            ...post,
            userVotedOption: option,
            pollVotes: currentVotes,
          };
        }
        return post;
      })
    );
    try {
      const updatedPost = await feedService.voteOnPoll(postId, option);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
      toast.success("Vote recorded!");
    } catch (error: any) {
      toast.error("Failed to vote: " + error.message);
    }
  }, []);

  const handleToggleComments = useCallback(async (postId: number) => {
    setCommentsOpen((prev) => {
      const isOpen = !prev[postId];
      if (isOpen) {
        setComments((cPrev) => {
          if (!cPrev[postId]) {
            setLoadingComments((lPrev) => ({ ...lPrev, [postId]: true }));
            feedService.getComments(postId)
              .then((res) => setComments((cur) => ({ ...cur, [postId]: res })))
              .catch((err) => toast.error("Failed to load comments: " + err.message))
              .finally(() => setLoadingComments((cur) => ({ ...cur, [postId]: false })));
          }
          return cPrev;
        });
      }
      return { ...prev, [postId]: isOpen };
    });
  }, []);

  const handleAddComment = useCallback(async (postId: number) => {
    const text = newCommentText[postId]?.trim();
    if (!text) return;
    const parentId = replyingTo[postId] || undefined;
    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
    try {
      const comment = await feedService.addComment(postId, text, parentId);
      if (parentId) {
        setComments((prev) => {
          const updated = { ...prev };
          updated[postId] = addReplyToTree(updated[postId] || [], parentId, comment);
          return updated;
        });
      } else {
        setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), comment] }));
      }
      setNewCommentText((prev) => ({ ...prev, [postId]: "" }));
      setReplyingTo((prev) => ({ ...prev, [postId]: null }));
      setPosts((prev) =>
        prev.map((post) => post.id === postId ? { ...post, commentsCount: post.commentsCount + 1 } : post)
      );
    } catch (error: any) {
      toast.error("Failed to add comment: " + error.message);
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  }, [newCommentText, replyingTo]);

  const handleDeleteComment = useCallback(async (postId: number, commentId: number) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await feedService.deleteComment(commentId);
      setComments((prev) => ({
        ...prev,
        [postId]: removeFromTree(prev[postId] || [], commentId),
      }));
      setPosts((prev) =>
        prev.map((post) => post.id === postId ? { ...post, commentsCount: Math.max(0, post.commentsCount - 1) } : post)
      );
      toast.success("Comment deleted.");
    } catch (error: any) {
      toast.error("Failed to delete comment: " + error.message);
    }
  }, []);

  const handleOpenPostLikers = useCallback(async (postId: number) => {
    setPostLikersModalPostId(postId);
    setLoadingPostLikers(true);
    try {
      const list = await feedService.getPostLikers(postId);
      setPostLikersList(Array.isArray(list) ? list : []);
    } catch (err: any) {
      toast.error("Failed to load likes: " + err.message);
    } finally {
      setLoadingPostLikers(false);
    }
  }, []);

  const handleOpenCommentLikers = useCallback(async (commentId: number) => {
    setCommentLikersModalCommentId(commentId);
    setLoadingCommentLikers(true);
    try {
      const list = await feedService.getCommentLikers(commentId);
      setCommentLikersList(Array.isArray(list) ? list : []);
    } catch (err: any) {
      toast.error("Failed to load comment likes: " + err.message);
    } finally {
      setLoadingCommentLikers(false);
    }
  }, []);

  const handleToggleCommentLike = useCallback(async (postId: number, commentId: number) => {
    try {
      const res = await feedService.toggleCommentLike(commentId);
      setComments((prev) => {
        const postComments = prev[postId] || [];
        const updateRecursive = (list: CommentResponse[]): CommentResponse[] => {
          return list.map((c) => {
            if (c.id === commentId) {
              return {
                ...c,
                likesCount: res.likesCount,
                likedByCurrentUser: res.liked,
              };
            }
            if (c.replies && c.replies.length > 0) {
              return {
                ...c,
                replies: updateRecursive(c.replies),
              };
            }
            return c;
          });
        };
        return {
          ...prev,
          [postId]: updateRecursive(postComments),
        };
      });
    } catch (err: any) {
      toast.error("Failed to like comment: " + err.message);
    }
  }, []);

  /** Toggle a rich emoji reaction on a comment (LIKE, LOVE, CELEBRATE, HELPFUL, THANKS) */
  const handleToggleCommentReaction = useCallback(async (postId: number, commentId: number, reactionType: string) => {
    try {
      const res = await feedService.toggleCommentReaction(commentId, reactionType);
      setComments((prev) => {
        const postComments = prev[postId] || [];
        const updateRecursive = (list: CommentResponse[]): CommentResponse[] =>
          list.map((c) => {
            if (c.id === commentId) {
              return {
                ...c,
                likesCount: res.likesCount,
                userCommentReaction: res.userReaction ?? undefined,
                commentReactionCounts: res.reactionCounts,
              };
            }
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: updateRecursive(c.replies) };
            }
            return c;
          });
        return { ...prev, [postId]: updateRecursive(postComments) };
      });
    } catch (err: any) {
      toast.error("Failed to react to comment: " + err.message);
    }
  }, []);

  if (!user?.communityId) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-700 mb-2">No Community Assigned</h3>
        <p className="text-sm text-slate-500">You must be assigned to a community to access the community feed.</p>
      </div>
    );
  }

  const composerTypeConfig = getPostTypeConfig(composerType);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 items-start">
        <div className="lg:col-span-3 space-y-4 sm:space-y-5">
          <AlertTicker />

          {/* Search Bar (Hidden on Mobile) */}
          {canEdit && (
            <div className="hidden sm:flex items-center gap-2">
              <div className={`flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 transition-all ${showSearch ? "ring-2 ring-indigo-500" : ""}`}>
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search posts, hashtags, people..."
                  className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearch(true)}
                  onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setActiveFilter("ALL"); }} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
            {FEED_FILTERS.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    isActive
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-slate-500 border-slate-200 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Facebook-style Short Composer Trigger Bar */}
          <div className={cn(
            "bg-white rounded-xl shadow-xs border p-2.5 sm:p-3.5 sm:space-y-3 transition-all",
            canPost
              ? "border-slate-200/90 hover:border-slate-300"
              : "border-slate-200/70 bg-slate-50/40"
          )}>
            {/* Main row: Mobile shows avatar + button + action symbols; Desktop shows avatar + full button */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={cn(
                "h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs sm:text-sm shadow-xs",
                canPost
                  ? "bg-gradient-to-br from-indigo-500 to-violet-600"
                  : "bg-slate-400 opacity-80"
              )}>
                {getInitials(user?.fullName)}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (canPost) {
                    setIsCreateModalOpen(true);
                  } else {
                    toast.info("Posting is restricted to community administrators.");
                  }
                }}
                className={cn(
                  "flex-1 min-w-0 rounded-full px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm text-left transition-colors border truncate flex items-center gap-2",
                  canPost
                    ? "bg-slate-100/90 text-slate-500 border-slate-200/50 hover:bg-slate-200/70 hover:text-slate-700 cursor-pointer"
                    : "bg-slate-100/70 text-slate-400 border-slate-200/60 cursor-not-allowed opacity-90"
                )}
                title={!canPost ? "Only community administrators can post updates" : undefined}
              >
                {!canPost ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="hidden sm:inline font-medium text-slate-500">Only community administrators can post updates</span>
                    <span className="sm:hidden inline font-medium text-slate-500">Only admins can post</span>
                    <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-200/80 px-2 py-0.5 rounded-full hidden md:inline-flex items-center gap-1 shrink-0">
                      <Lock className="w-2.5 h-2.5" /> Admin Only
                    </span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">What's on your mind, {user?.fullName ? user.fullName.split(" ")[0] : "Resident"}?</span>
                    <span className="sm:hidden inline">Post update...</span>
                  </>
                )}
              </button>

              {/* Mobile view only: symbols beside the feed button */}
              <div className="flex sm:hidden items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (!canPost) {
                      toast.info("Posting is restricted to community administrators.");
                      return;
                    }
                    setIsCreateModalOpen(true);
                    setTimeout(() => imageFileInputRef.current?.click(), 150);
                  }}
                  className={cn(
                    "p-1.5 rounded-full transition-colors",
                    canPost
                      ? "text-emerald-600 hover:bg-slate-100 cursor-pointer"
                      : "text-emerald-600/60 opacity-60 cursor-not-allowed hover:bg-transparent"
                  )}
                  title={canPost ? "Photo / Video" : "Only community administrators can post"}
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!canPost) {
                      toast.info("Posting is restricted to community administrators.");
                      return;
                    }
                    setComposerType("POLL");
                    setIsCreateModalOpen(true);
                  }}
                  className={cn(
                    "p-1.5 rounded-full transition-colors",
                    canPost
                      ? "text-indigo-600 hover:bg-slate-100 cursor-pointer"
                      : "text-indigo-600/60 opacity-60 cursor-not-allowed hover:bg-transparent"
                  )}
                  title={canPost ? "Poll" : "Only community administrators can post"}
                >
                  <BarChart3 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!canPost) {
                      toast.info("Posting is restricted to community administrators.");
                      return;
                    }
                    setComposerType("EVENT");
                    setIsCreateModalOpen(true);
                  }}
                  className={cn(
                    "p-1.5 rounded-full transition-colors",
                    canPost
                      ? "text-amber-600 hover:bg-slate-100 cursor-pointer"
                      : "text-amber-600/60 opacity-60 cursor-not-allowed hover:bg-transparent"
                  )}
                  title={canPost ? "Event" : "Only community administrators can post"}
                >
                  <Calendar className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!canPost) {
                      toast.info("Posting is restricted to community administrators.");
                      return;
                    }
                    setComposerType("ANNOUNCEMENT");
                    setIsCreateModalOpen(true);
                  }}
                  className={cn(
                    "p-1.5 rounded-full transition-colors",
                    canPost
                      ? "text-rose-600 hover:bg-slate-100 cursor-pointer"
                      : "text-rose-600/60 opacity-60 cursor-not-allowed hover:bg-transparent"
                  )}
                  title={canPost ? "Announcement" : "Only community administrators can post"}
                >
                  <Megaphone className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Website / Desktop view: bottom row with symbols + labels */}
            <div className={cn(
              "hidden sm:flex border-t pt-2 items-center justify-between gap-1 text-xs font-semibold",
              canPost ? "border-slate-100 text-slate-600" : "border-slate-100/60 text-slate-400"
            )}>
              <button
                type="button"
                onClick={() => {
                  if (!canPost) {
                    toast.info("Posting is restricted to community administrators.");
                    return;
                  }
                  setIsCreateModalOpen(true);
                  setTimeout(() => imageFileInputRef.current?.click(), 150);
                }}
                className={cn(
                  "flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-2 transition-colors",
                  canPost
                    ? "text-slate-600 hover:bg-slate-50 hover:text-emerald-600 cursor-pointer"
                    : "text-slate-500 opacity-60 cursor-not-allowed hover:bg-transparent"
                )}
                title={!canPost ? "Only community administrators can post" : undefined}
              >
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                <span>Photo / Video</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!canPost) {
                    toast.info("Posting is restricted to community administrators.");
                    return;
                  }
                  setComposerType("POLL");
                  setIsCreateModalOpen(true);
                }}
                className={cn(
                  "flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-2 transition-colors",
                  canPost
                    ? "text-slate-600 hover:bg-slate-50 hover:text-indigo-600 cursor-pointer"
                    : "text-slate-500 opacity-60 cursor-not-allowed hover:bg-transparent"
                )}
                title={!canPost ? "Only community administrators can post" : undefined}
              >
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                <span>Poll</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!canPost) {
                    toast.info("Posting is restricted to community administrators.");
                    return;
                  }
                  setComposerType("EVENT");
                  setIsCreateModalOpen(true);
                }}
                className={cn(
                  "flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-2 transition-colors",
                  canPost
                    ? "text-slate-600 hover:bg-slate-50 hover:text-amber-600 cursor-pointer"
                    : "text-slate-500 opacity-60 cursor-not-allowed hover:bg-transparent"
                )}
                title={!canPost ? "Only community administrators can post" : undefined}
              >
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>Event</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!canPost) {
                    toast.info("Posting is restricted to community administrators.");
                    return;
                  }
                  setComposerType("ANNOUNCEMENT");
                  setIsCreateModalOpen(true);
                }}
                className={cn(
                  "flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-2 transition-colors",
                  canPost
                    ? "text-slate-600 hover:bg-slate-50 hover:text-rose-600 cursor-pointer"
                    : "text-slate-500 opacity-60 cursor-not-allowed hover:bg-transparent"
                )}
                title={!canPost ? "Only community administrators can post" : undefined}
              >
                <Megaphone className="w-4 h-4 text-rose-500" />
                <span>Announcement</span>
              </button>
            </div>
          </div>

          {/* ── Facebook-Style Create Post Modal ── */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
              <div
                className="fixed inset-0"
                onClick={() => {
                  if (!isPosting && !isUploadingImage) setIsCreateModalOpen(false);
                }}
              />

              <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between relative bg-white shrink-0">
                  <div className="w-8" />
                  <h3 className="text-base font-bold text-slate-900 text-center flex-1">Create Post</h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isPosting && !isUploadingImage) setIsCreateModalOpen(false);
                    }}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body (Scrollable) */}
                <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
                  {/* User Profile Header & Post Type Selector */}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-xs">
                      {getInitials(user?.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 text-sm leading-tight truncate">
                        {user?.fullName || "Community Member"}
                      </div>
                      {/* Category Pill Dropdown */}
                      <div className="inline-block mt-1">
                        <button
                          type="button"
                          onClick={() => setShowComposerTypes(true)}
                          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all border shadow-2xs cursor-pointer ${composerTypeConfig.color}`}
                        >
                          <span>{composerTypeConfig.icon}</span>
                          <span>{composerTypeConfig.label}</span>
                          <ChevronDown className="w-3 h-3 opacity-70" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Title input (for Articles / Announcements) */}
                  {(composerType === "ARTICLE" || composerType === "ANNOUNCEMENT") && (
                    <input
                      type="text"
                      placeholder="Post title..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      autoFocus
                    />
                  )}

                  {/* Main Content Area */}
                  <textarea
                    className="w-full min-h-[110px] bg-transparent border-0 text-slate-900 placeholder:text-slate-400 text-sm sm:text-base leading-relaxed focus:ring-0 outline-none resize-none"
                    placeholder={
                      composerType === "POLL" ? "Provide context or details about this poll..."
                      : composerType === "QUESTION" ? "Ask your community a question..."
                      : composerType === "ANNOUNCEMENT" ? "Write your official announcement details..."
                      : composerType === "EMERGENCY" ? "Describe the emergency situation and action needed..."
                      : composerType === "APPRECIATION" ? "Share who and what you are appreciating..."
                      : composerType === "SUGGESTION" ? "Share your idea or suggestion..."
                      : composerType === "EVENT" ? "Describe what this event is about..."
                      : `What's on your mind, ${user?.fullName ? user.fullName.split(" ")[0] : "Resident"}? Use #hashtags to categorize`
                    }
                    rows={4}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    disabled={isPosting}
                    autoFocus={composerType !== "ARTICLE" && composerType !== "ANNOUNCEMENT"}
                  />

                  {/* Dynamic Type-specific inputs */}
                  {composerType === "CLASSIFIED" && (
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Price (₹)</label>
                        <input type="number" placeholder="Enter price..." className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500" value={classifiedPrice} onChange={(e) => setClassifiedPrice(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Location / Flat</label>
                        <input type="text" placeholder="e.g. Block A-402..." className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500" value={classifiedLocation} onChange={(e) => setClassifiedLocation(e.target.value)} />
                      </div>
                    </div>
                  )}

                  {composerType === "POLL" && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase">Poll Question *</label>
                        <input type="text" placeholder="Ask a question..." className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-semibold" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600 uppercase">Options</label>
                          <button type="button" onClick={() => setPollOptions((prev) => [...prev, ""])} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer">+ Add Option</button>
                        </div>
                        {pollOptions.map((opt, idx) => (
                          <div key={idx} className="flex gap-1.5 items-center">
                            <input type="text" placeholder={`Option ${idx + 1}...`} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500" value={opt} onChange={(e) => { const updated = [...pollOptions]; updated[idx] = e.target.value; setPollOptions(updated); }} />
                            {pollOptions.length > 2 && (
                              <button type="button" onClick={() => setPollOptions((prev) => prev.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500 p-1 cursor-pointer">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {composerType === "LOST_FOUND" && (
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Item Status</label>
                        <select className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none" value={lostFoundType} onChange={(e) => setLostFoundType(e.target.value as "LOST" | "FOUND")}>
                          <option value="LOST">Lost Item 🔍</option>
                          <option value="FOUND">Found Item 🎁</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Location / Area</label>
                        <input type="text" placeholder="e.g. Clubhouse park..." className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500" value={lostFoundLocation} onChange={(e) => setLostFoundLocation(e.target.value)} />
                      </div>
                    </div>
                  )}

                  {composerType === "EVENT" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Event Date & Time</label>
                        <input type="datetime-local" className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Link Created Event</label>
                        <select
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                          value={selectedEventId}
                          onChange={(e) => handleSelectedEventChange(e.target.value)}
                          disabled={loadingCreatedEvents}
                        >
                          <option value="">{loadingCreatedEvents ? "Loading events..." : "Select event"}</option>
                          {createdEvents.map((event) => (
                            <option key={event.id} value={event.id}>
                              {eventOptionLabel(event)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Venue</label>
                        <input type="text" placeholder="e.g. Amphitheatre..." className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500" value={eventVenue} onChange={(e) => setEventVenue(e.target.value)} />
                      </div>
                    </div>
                  )}

                  {/* Media Attachments Preview Grid */}
                  {newPostMedia.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      {newPostMedia.map((item, index) => (
                        <div key={`${item.mediaUrl}-${index}`} className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-xs aspect-video">
                          {isVideoMedia(item.mediaType, item.mediaUrl) ? (
                            <div className="relative w-full h-full bg-slate-950">
                              {item.thumbnailUrl ? (
                                <img src={item.thumbnailUrl} alt="Video cover" className="w-full h-full object-cover" />
                              ) : (
                                <video src={item.mediaUrl} className="w-full h-full object-cover" muted preload="metadata" />
                              )}
                              <button
                                type="button"
                                onClick={() => setActiveCoverPickerMediaIndex(index)}
                                className="absolute bottom-1.5 right-1.5 px-2 py-0.5 bg-black/75 hover:bg-black text-white text-[10px] font-bold rounded-md flex items-center gap-1 shadow-md transition-colors cursor-pointer"
                                title="Set Cover Photo"
                              >
                                <Camera className="w-3 h-3 text-indigo-400" />
                                <span>{item.thumbnailUrl ? "Change Cover" : "Set Cover"}</span>
                              </button>
                              {item.thumbnailUrl && (
                                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-600/90 text-white text-[8px] font-bold uppercase tracking-wider shadow">
                                  Cover Set
                                </span>
                              )}
                            </div>
                          ) : (
                            <img src={item.mediaUrl} alt={item.altText || "Attachment preview"} className="w-full h-full object-cover" />
                          )}
                          <span className="absolute left-1.5 bottom-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold uppercase pointer-events-none">
                            {isVideoMedia(item.mediaType, item.mediaUrl) ? "Video" : "Image"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = newPostMedia.filter((_, i) => i !== index).map((media, sortOrder) => ({ ...media, sortOrder }));
                              setNewPostMedia(next);
                              setNewPostImageUrl(next.find((media) => media.mediaType === "IMAGE")?.mediaUrl || "");
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Hidden File Input */}
                  <input
                    ref={imageFileInputRef}
                    type="file"
                    accept={FEED_MEDIA_ACCEPT}
                    multiple
                    className="hidden"
                    onChange={handleImageFileSelect}
                  />

                  {/* "Add to your post" Facebook-style Action Toolbar */}
                  <div className="p-3 border border-slate-200 rounded-xl bg-white flex items-center justify-between shadow-2xs">
                    <span className="text-xs font-bold text-slate-700">Add to your post</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => imageFileInputRef.current?.click()}
                        disabled={isUploadingImage || newPostMedia.length >= MAX_FEED_ATTACHMENTS}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer disabled:opacity-40"
                        title="Add Photos / Videos"
                      >
                        {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-5 h-5 text-emerald-500" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setComposerType(composerType === "POLL" ? "GENERAL" : "POLL")}
                        className={`p-2 rounded-full transition-colors cursor-pointer ${
                          composerType === "POLL" ? "text-indigo-600 bg-indigo-50" : "text-indigo-500 hover:bg-indigo-50"
                        }`}
                        title="Create Poll"
                      >
                        <BarChart3 className="w-5 h-5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setComposerType(composerType === "EVENT" ? "GENERAL" : "EVENT")}
                        className={`p-2 rounded-full transition-colors cursor-pointer ${
                          composerType === "EVENT" ? "text-amber-600 bg-amber-50" : "text-amber-500 hover:bg-amber-50"
                        }`}
                        title="Add Event Details"
                      >
                        <Calendar className="w-5 h-5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setComposerType(composerType === "ANNOUNCEMENT" ? "GENERAL" : "ANNOUNCEMENT")}
                        className={`p-2 rounded-full transition-colors cursor-pointer ${
                          composerType === "ANNOUNCEMENT" ? "text-rose-600 bg-rose-50" : "text-rose-500 hover:bg-rose-50"
                        }`}
                        title="Announcement"
                      >
                        <Megaphone className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modal Footer (Publish Buttons) */}
                <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCreatePost(false)}
                    className={`w-full flex-1 py-2.5 text-white text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                      composerType === "EMERGENCY" ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"
                    } disabled:opacity-50`}
                    disabled={isPosting || isUploadingImage || !newPostContent.trim()}
                  >
                    {postingAction === "publish" ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</> : "Publish Post"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCreatePost(true)}
                    className="py-2.5 px-4 text-white text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
                    disabled={isPosting || isUploadingImage || !newPostContent.trim()}
                  >
                    {postingAction === "notify" ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Notifying...</>
                    ) : (
                      <><Megaphone className="w-4 h-4" /> Publish & Notify</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Video Cover Photo Picker Modal for Create Post ── */}
          {activeCoverPickerMediaIndex !== null && newPostMedia[activeCoverPickerMediaIndex] && (
            <VideoCoverPickerModal
              isOpen={activeCoverPickerMediaIndex !== null}
              onClose={() => setActiveCoverPickerMediaIndex(null)}
              videoUrl={newPostMedia[activeCoverPickerMediaIndex].mediaUrl}
              currentCoverUrl={newPostMedia[activeCoverPickerMediaIndex].thumbnailUrl}
              onApplyCover={(coverUrl) => {
                setNewPostMedia((prev) =>
                  prev.map((item, idx) => (idx === activeCoverPickerMediaIndex ? { ...item, thumbnailUrl: coverUrl } : item))
                );
              }}
              communityId={user?.communityId || 0}
              draftId={postDraftIdRef.current}
            />
          )}

          {/* ── Centered Post Type Selection Modal (Fits mobile & desktop screens perfectly) ── */}
          {showComposerTypes && (
            <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
              <div
                className="fixed inset-0"
                onClick={() => setShowComposerTypes(false)}
              />

              <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm sm:max-w-md overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">Select Post Type</h4>
                    <p className="text-[11px] text-slate-500">Choose the format that best fits your post</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowComposerTypes(false)}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Grid of types */}
                <div className="p-3 sm:p-4 grid grid-cols-2 gap-2 max-h-[65vh] overflow-y-auto">
                  {POST_TYPE_CONFIG.map((type) => {
                    const isSelected = composerType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setComposerType(type.id);
                          setShowComposerTypes(false);
                        }}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs"
                            : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 shadow-2xs ${type.color}`}>
                          {type.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`text-xs font-bold truncate ${isSelected ? "text-indigo-950" : "text-slate-800"}`}>
                            {type.label}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Feed Items */}
          <div className="space-y-4">
            {posts.length === 0 && !loading ? (
              activeFilter === "BOOKMARKED" ? (
                /* ── Dedicated Saved Posts Empty State ── */
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-inner">
                    <Bookmark className="w-10 h-10 text-indigo-300" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-slate-800">No saved posts yet</h3>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                      You haven't saved any posts yet. Tap the{" "}
                      <BookmarkCheck className="inline w-3.5 h-3.5 text-indigo-500 align-text-bottom" />{" "}
                      bookmark icon on any post to save it for later.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveFilter("ALL")}
                    className="mt-1 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                  >
                    Browse Posts
                  </button>
                </div>
              ) : (
                /* ── Generic Empty State ── */
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500 text-sm">
                  No posts found. Be the first to share something!
                </div>
              )
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  user={user}
                  isAdmin={isAdmin}
                  canEdit={canEdit}
                  commentsOpen={commentsOpen[post.id]}
                  comments={comments[post.id] || []}
                  loadingComments={loadingComments[post.id]}
                  newCommentText={newCommentText[post.id] || ""}
                  submittingComment={submittingComment[post.id]}
                  replyingTo={replyingTo[post.id]}
                  showReactionPicker={showReactionPicker === post.id}
                  reactionPickerRef={reactionPickerRef}
                  onDeletePost={handleDeletePost}
                  onUpdatePost={handleUpdatePost}
                  onReaction={handleReaction}
                  onBookmark={handleBookmark}
                  onVote={handleVote}
                  onToggleComments={handleToggleComments}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                  onSetCommentText={(text: string) => setNewCommentText((prev) => ({ ...prev, [post.id]: text }))}
                  onSetReplyingTo={(id: number | null) => setReplyingTo((prev) => ({ ...prev, [post.id]: id }))}
                  onShowReactionPicker={() => setShowReactionPicker(showReactionPicker === post.id ? null : post.id)}
                  onOpenPostLikers={handleOpenPostLikers}
                  onOpenCommentLikers={handleOpenCommentLikers}
                  onToggleCommentLike={handleToggleCommentLike}
                  onToggleCommentReaction={handleToggleCommentReaction}
                  getInitials={getInitials}
                  formatTimeAgo={formatTimeAgo}
                  getPostTypeConfig={getPostTypeConfig}
                  getReactionIcon={getReactionIcon}
                />
              ))
            )}

            {loading && (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-200" />
                      <div className="space-y-2 flex-1"><div className="h-3 bg-slate-200 rounded w-1/4" /><div className="h-2.5 bg-slate-200 rounded w-1/6" /></div>
                    </div>
                    <div className="space-y-2"><div className="h-3.5 bg-slate-200 rounded" /><div className="h-3.5 bg-slate-200 rounded w-5/6" /></div>
                  </div>
                ))}
              </div>
            )}

            {hasMore && !loading && posts.length > 0 && (
              <div className="flex justify-center pt-2">
                <button onClick={handleLoadMore} className="px-6 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-lg bg-white shadow-sm hover:shadow-md transition-all">
                  Load More Posts
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block sticky top-20 space-y-4">
          <EventsNotificationCard badgeCount={summaryCounts?.upcomingEventsCount} passCount={summaryCounts?.myPassCount} />
          <TrendingCard badgeCount={summaryCounts?.trendingCount} onHashtagClick={(tag) => { setSearchQuery(tag); handleSearch(); }} />
          <MyGroupsCard badgeCount={summaryCounts?.myGroupsCount} />
          <LeaderboardCard badgeCount={summaryCounts?.topContributorsCount} getInitials={getInitials} />
          <CommunityDirectory badgeCount={summaryCounts?.directoryCount} />
          <EngagementScoreCard summaryScore={summaryCounts ? { totalPoints: summaryCounts.myEngagementPoints, level: summaryCounts.myEngagementLevel } : undefined} />
          <SportsNotificationCard badgeCount={summaryCounts?.sportsEventsCount} />
          <SidebarAnnouncements posts={posts} />
          <QuickLinksCard />
        </div>
      </div>

      {/* ── Modal: Post Likers / Reactions ── */}
      {postLikersModalPostId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Post Reactions & Likes</h3>
                  <p className="text-[11px] text-slate-500">
                    {postLikersList.length} {postLikersList.length === 1 ? "person" : "people"} reacted to this post
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setPostLikersModalPostId(null); setPostLikersList([]); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-3 divide-y divide-slate-100">
              {loadingPostLikers ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="text-xs font-medium">Loading reactions...</span>
                </div>
              ) : postLikersList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">
                  No likes yet on this post.
                </div>
              ) : (
                postLikersList.map((liker) => {
                  const rc = REACTION_CONFIG.find((r) => r.type === liker.reactionType) || REACTION_CONFIG[0];
                  const IconComp = rc.icon;
                  return (
                    <div key={`${liker.userId}-${liker.reactionType}`} className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 overflow-hidden shrink-0">
                            {liker.profilePicUrl ? (
                              <img src={liker.profilePicUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              getInitials(liker.fullName)
                            )}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center ${rc.color}`}>
                            <IconComp className="w-2.5 h-2.5" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{liker.fullName}</h4>
                          <p className="text-[10px] text-slate-500 truncate">{liker.role || "Verified Member"}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {liker.createdAt ? formatTimeAgo(liker.createdAt) : ""}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-slate-50/60 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => { setPostLikersModalPostId(null); setPostLikersList([]); }}
                className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Comment Likers ── */}
      {commentLikersModalCommentId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                  <Heart className="w-4 h-4 fill-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Comment Likes</h3>
                  <p className="text-[11px] text-slate-500">
                    {commentLikersList.length} {commentLikersList.length === 1 ? "like" : "likes"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setCommentLikersModalCommentId(null); setCommentLikersList([]); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-3 divide-y divide-slate-100">
              {loadingCommentLikers ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
                  <span className="text-xs font-medium">Loading likes...</span>
                </div>
              ) : commentLikersList.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-medium">
                  No likes yet on this comment.
                </div>
              ) : (
                commentLikersList.map((liker) => (
                  <div key={liker.userId} className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 overflow-hidden shrink-0">
                        {liker.profilePicUrl ? (
                          <img src={liker.profilePicUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(liker.fullName)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{liker.fullName}</h4>
                        <p className="text-[10px] text-slate-500 truncate">{liker.role || "Verified Member"}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {liker.createdAt ? formatTimeAgo(liker.createdAt) : ""}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50/60 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => { setCommentLikersModalCommentId(null); setCommentLikersList([]); }}
                className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Post Card Component (Memoized for 60fps feed performance) ─── */
const PostCard = React.memo(function PostCard({
  post, user, isAdmin, canEdit, commentsOpen, comments, loadingComments, newCommentText,
  submittingComment, replyingTo, showReactionPicker, reactionPickerRef,
  onDeletePost, onUpdatePost, onReaction, onBookmark, onVote, onToggleComments, onAddComment,
  onDeleteComment, onSetCommentText, onSetReplyingTo, onShowReactionPicker,
  onOpenPostLikers, onOpenCommentLikers, onToggleCommentLike, onToggleCommentReaction,
  getInitials, formatTimeAgo, getPostTypeConfig, getReactionIcon,
}: any) {
  const navigate = useNavigate();
  const typeConfig = getPostTypeConfig(post.postType);
  const currentReaction = getReactionIcon(post.currentUserReaction);
  const totalReactions = post.reactionCounts ? Object.values(post.reactionCounts as Record<string, number>).reduce((a: number, b: number) => a + b, 0) : post.likesCount;

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const [editTitle, setEditTitle] = useState(post.title || "");
  const [editImageUrl, setEditImageUrl] = useState(post.imageUrl || "");
  const [editMedia, setEditMedia] = useState<FeedMediaAttachment[]>(postMediaToAttachments(post));
  const [editEventDate, setEditEventDate] = useState(post.eventDate ? post.eventDate.slice(0, 16) : "");
  const [editEventVenue, setEditEventVenue] = useState(post.eventVenue || "");
  const [editLocation, setEditLocation] = useState(post.location || "");
  const [editPrice, setEditPrice] = useState(post.price != null ? String(post.price) : "");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const editImageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [activeEditCoverPickerIndex, setActiveEditCoverPickerIndex] = useState<number | null>(null);

  const canEditThisPost = canEdit || (user?.userId === String(post.authorId));

  const handleEditImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (!user?.communityId) { toast.error("No community assigned — cannot upload media."); return; }

    const remainingSlots = MAX_FEED_ATTACHMENTS - editMedia.length;
    if (remainingSlots <= 0) {
      toast.error(`You can attach up to ${MAX_FEED_ATTACHMENTS} media files.`);
      if (editImageInputRef.current) editImageInputRef.current.value = "";
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      toast.warning(`Only ${remainingSlots} more media file${remainingSlots === 1 ? "" : "s"} can be added.`);
    }

    setIsUploadingEditImage(true);
    try {
      const uploaded: FeedMediaAttachment[] = [];
      for (const file of selectedFiles) {
        const media = await uploadFeedMedia(file, user.communityId, "feed_post_edit", String(post.id));
        uploaded.push({
          ...media,
          sortOrder: editMedia.length + uploaded.length,
        });
      }

      setEditMedia((prev) => [...prev, ...uploaded].map((item, index) => ({ ...item, sortOrder: index })));
      if (!editImageUrl) {
        const firstImage = uploaded.find((item) => item.mediaType === "IMAGE");
        if (firstImage) setEditImageUrl(firstImage.mediaUrl);
      }
      toast.success(`${uploaded.length} media file${uploaded.length === 1 ? "" : "s"} uploaded!`);
    } catch (err: any) {
      toast.error("Upload failed: " + (err.message || "Please try again."));
    } finally {
      setIsUploadingEditImage(false);
      if (editImageInputRef.current) editImageInputRef.current.value = "";
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) { toast.error("Content cannot be empty."); return; }
    setIsSavingEdit(true);
    try {
      await onUpdatePost(post.id, {
        content: editContent.trim(),
        title: editTitle.trim() || undefined,
        imageUrl: editImageUrl.trim() || editMedia.find((item) => item.mediaType === "IMAGE")?.mediaUrl || undefined,
        mediaAttachments: editMedia.length > 0 ? editMedia.map(({ mediaUrl, mediaType, thumbnailUrl, altText, sortOrder, mediaObjectId }) => ({
          mediaUrl,
          mediaType,
          thumbnailUrl,
          altText,
          sortOrder,
          mediaObjectId,
        })) : undefined,
        eventDate: editEventDate || undefined,
        eventVenue: editEventVenue.trim() || undefined,
        location: editLocation.trim() || undefined,
        price: editPrice ? parseFloat(editPrice) : undefined,
      });
      setIsEditing(false);
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-4 sm:p-5 transition-all hover:shadow-md ${
      post.priority === "EMERGENCY" ? "border-red-300 bg-red-50/30 ring-1 ring-red-200" :
      post.pinned ? "border-indigo-200 bg-indigo-50/20" :
      post.official ? "border-amber-200 bg-amber-50/10" : "border-slate-200"
    }`}>
      {/* Pinned / Emergency badges */}
      {post.pinned && (
        <div className="flex items-center gap-1 text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-bold mb-2 w-fit">
          <Pin className="w-3 h-3" /> Pinned Post
        </div>
      )}
      {post.priority === "EMERGENCY" && (
        <div className="flex items-center gap-1 text-[10px] text-red-700 bg-red-100 px-2 py-0.5 rounded-md font-bold mb-2 w-fit animate-pulse">
          <AlertTriangle className="w-3 h-3" /> Emergency Alert
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-700 font-bold text-sm border border-slate-200 overflow-hidden">
            {post.authorProfilePic ? (
              <img src={post.authorProfilePic} alt="" className="w-full h-full object-cover" />
            ) : (
              post.authorAvatar
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 text-sm">{post.authorName}</span>
              {post.official && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
              {post.postType && post.postType !== "GENERAL" && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${typeConfig.color}`}>
                  {typeConfig.icon} {typeConfig.label}
                </span>
              )}
            </div>
            <div className="flex items-center text-xs text-slate-500 gap-1.5 flex-wrap">
              <span className={post.official || (post.authorRole && post.authorRole !== "Verified Member") ? "text-indigo-600 font-semibold" : "font-medium"}>
                {post.authorRole || "Verified Member"}
              </span>
              <span>·</span>
              <span>{formatTimeAgo(post.createdAt)}</span>
              {post.group && (
                <>
                  <span>·</span>
                  <span className="text-indigo-600 font-medium">{post.group.name}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onBookmark(post.id)} className={`p-1.5 rounded-full transition-all ${post.bookmarkedByCurrentUser ? "text-indigo-600 bg-indigo-50" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-50"}`}>
            {post.bookmarkedByCurrentUser ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
          {canEditThisPost && !isEditing && (
            <button
              onClick={() => {
                setEditContent(post.content || "");
                setEditTitle(post.title || "");
                setEditImageUrl(post.imageUrl || "");
                setEditMedia(postMediaToAttachments(post));
                setEditEventDate(post.eventDate ? post.eventDate.slice(0, 16) : "");
                setEditEventVenue(post.eventVenue || "");
                setEditLocation(post.location || "");
                setEditPrice(post.price != null ? String(post.price) : "");
                setIsEditing(true);
              }}
              className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-all"
              title="Edit Post"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {(user?.userId === String(post.authorId) || isAdmin) && (
            <button onClick={() => onDeletePost(post.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all" title="Delete Post">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {post.official && (
        <div className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-100/50 border border-amber-200/50 px-2 py-0.5 rounded-md font-bold mb-3 w-fit">
          <Megaphone className="w-3 h-3" /> Official
        </div>
      )}

      {/* ── Inline Edit Form ── */}
      {isEditing && (
        <div className="mb-4 bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Edit Post</span>
            <button onClick={() => setIsEditing(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>

          {(post.postType === "ARTICLE" || post.postType === "ANNOUNCEMENT") && (
            <input
              type="text"
              placeholder="Title..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-400"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          )}

          <textarea
            className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            rows={4}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />

          {post.postType === "EVENT" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Event Date</label>
                <input type="datetime-local" className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-400" value={editEventDate} onChange={(e) => setEditEventDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Venue</label>
                <input type="text" className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-400" value={editEventVenue} onChange={(e) => setEditEventVenue(e.target.value)} />
              </div>
            </div>
          )}

          {post.postType === "CLASSIFIED" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Price</label>
                <input type="number" className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-400" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Location</label>
                <input type="text" className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-400" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
              </div>
            </div>
          )}

          {/* Media section */}
          {editMedia.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {editMedia.map((item, index) => (
                <div key={`${item.mediaUrl}-${index}`} className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm aspect-video">
                  {isVideoMedia(item.mediaType, item.mediaUrl) ? (
                    <div className="relative w-full h-full bg-slate-950">
                      {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt="Video cover" className="w-full h-full object-cover" />
                      ) : (
                        <video src={item.mediaUrl} className="w-full h-full object-cover" muted preload="metadata" />
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveEditCoverPickerIndex(index)}
                        className="absolute bottom-1.5 right-1.5 px-2 py-0.5 bg-black/75 hover:bg-black text-white text-[10px] font-bold rounded flex items-center gap-1 shadow-md transition-colors cursor-pointer"
                        title="Set Cover Photo"
                      >
                        <Camera className="w-3 h-3 text-indigo-400" />
                        <span>{item.thumbnailUrl ? "Change Cover" : "Set Cover"}</span>
                      </button>
                      {item.thumbnailUrl && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-600/90 text-white text-[8px] font-bold uppercase tracking-wider shadow">
                          Cover Set
                        </span>
                      )}
                    </div>
                  ) : (
                    <img src={item.mediaUrl} alt={item.altText || "Post media"} className="w-full h-full object-cover" />
                  )}
                  <span className="absolute left-1.5 bottom-1.5 px-1.5 py-0.5 rounded bg-black/55 text-white text-[9px] font-bold uppercase pointer-events-none">
                    {isVideoMedia(item.mediaType, item.mediaUrl) ? "Video" : "Image"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = editMedia.filter((_, i) => i !== index).map((media, sortOrder) => ({ ...media, sortOrder }));
                      setEditMedia(next);
                      setEditImageUrl(next.find((media) => media.mediaType === "IMAGE")?.mediaUrl || "");
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input ref={editImageInputRef} type="file" accept={FEED_MEDIA_ACCEPT} multiple className="hidden" onChange={handleEditImageSelect} />

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => editImageInputRef.current?.click()}
              disabled={isUploadingEditImage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
            >
              {isUploadingEditImage ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</> : <><ImageIcon className="w-3.5 h-3.5" /> {editMedia.length > 0 ? "Add More Media" : "Add Media"}</>}
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsEditing(false)} className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">Cancel</button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit || isUploadingEditImage || !editContent.trim()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSavingEdit ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Video Cover Picker for Edit Mode ── */}
      {activeEditCoverPickerIndex !== null && editMedia[activeEditCoverPickerIndex] && (
        <VideoCoverPickerModal
          isOpen={activeEditCoverPickerIndex !== null}
          onClose={() => setActiveEditCoverPickerIndex(null)}
          videoUrl={editMedia[activeEditCoverPickerIndex].mediaUrl}
          currentCoverUrl={editMedia[activeEditCoverPickerIndex].thumbnailUrl}
          onApplyCover={(coverUrl) => {
            setEditMedia((prev) =>
              prev.map((item, idx) => (idx === activeEditCoverPickerIndex ? { ...item, thumbnailUrl: coverUrl } : item))
            );
          }}
          communityId={user?.communityId || 0}
          draftId={String(post.id)}
        />
      )}

      {!isEditing && post.title && <h3 className="text-base font-bold text-slate-900 mb-2 text-left">{post.title}</h3>}

      {!isEditing && <p className="text-slate-800 text-sm mb-3 whitespace-pre-line leading-relaxed text-left" dangerouslySetInnerHTML={{ __html: post.content.replace(/#(\w+)/g, '<span class="text-indigo-600 font-semibold cursor-pointer hover:underline">#$1</span>').replace(/@(\w+)/g, '<span class="text-blue-600 font-semibold">@$1</span>') }} />}

      {/* Hashtags display */}
      {post.hashtags && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.hashtags.split(",").map((tag: string) => (
            <span key={tag} className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              #{tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Event details – click to go to event dashboard */}
      {post.postType === "EVENT" && (
        <button
          onClick={() => navigate("/events")}
          className="w-full mb-3 text-left bg-pink-50/60 border border-pink-100 rounded-xl p-3 hover:bg-pink-50 hover:border-pink-200 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex flex-wrap gap-2">
            {post.eventDate && (
              <span className="bg-white text-pink-700 border border-pink-100 rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1 shadow-xs">
                <Calendar className="w-3 h-3" /> {new Date(post.eventDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </span>
            )}
            {post.eventVenue && (
              <span className="bg-white text-slate-600 border border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1 shadow-xs">
                <MapPin className="w-3 h-3" /> {post.eventVenue}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-pink-600 group-hover:text-pink-700">
            <span>View Event Dashboard</span>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
        </button>
      )}

      {/* Classified details */}
      {post.postType === "CLASSIFIED" && (
        <div className="flex flex-wrap gap-2 mb-3 text-left">
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg px-3 py-1.5 text-xs font-black">{post.price != null ? `Price: ₹${post.price.toLocaleString("en-IN")}` : ""}</span>
          {post.location && <span className="bg-slate-50 text-slate-600 border border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold"><MapPin className="w-3 h-3 inline" /> {post.location}</span>}
        </div>
      )}

      {/* Lost & Found */}
      {post.postType === "LOST_FOUND" && post.location && (() => {
        const isLost = post.location.startsWith("LOST:");
        const cleanLoc = post.location.replace(/^(LOST|FOUND):\s*/, "");
        return (
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`border rounded-lg px-3 py-1.5 text-xs font-black ${isLost ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-teal-50 text-teal-700 border-teal-100"}`}>
              {isLost ? "Lost Item" : "Found Item"}
            </span>
            <span className="bg-slate-50 text-slate-600 border border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold"><MapPin className="w-3 h-3 inline" /> {cleanLoc}</span>
          </div>
        );
      })()}

      {post.postType === "POLL" && post.pollQuestion && (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-3 text-left space-y-2.5">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{post.pollQuestion}</h4>
          <div className="space-y-1.5">
            {post.pollOptionsList?.map((option: string) => {
              const votes = post.pollVotes?.[option] || 0;
              const totalVotes = (Object.values(post.pollVotes || {}) as number[]).reduce((a: number, b: number) => a + b, 0);
              const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
              const hasVoted = !!post.userVotedOption;
              const isUserChoice = post.userVotedOption === option;
              return (
                <div key={option}>
                  {hasVoted ? (
                    <div className={`w-full border rounded-lg p-2.5 text-xs font-bold flex justify-between items-center relative overflow-hidden ${isUserChoice ? "border-indigo-300 text-indigo-800" : "border-slate-200 text-slate-700"}`}>
                      <div className={`absolute left-0 top-0 bottom-0 ${isUserChoice ? "bg-indigo-100/50" : "bg-slate-100/60"}`} style={{ width: `${percent}%` }} />
                      <span className="relative z-10 flex items-center gap-1.5">{option}{isUserChoice && <Check className="w-3 h-3 text-indigo-500" />}</span>
                      <span className="relative z-10 text-[10px] text-slate-500">{votes} ({percent}%)</span>
                    </div>
                  ) : (
                    <button onClick={() => onVote(post.id, option)} className="w-full text-left border border-slate-200 bg-white hover:bg-indigo-50/30 hover:border-indigo-200 rounded-lg p-2.5 text-xs font-semibold text-slate-700 transition-all cursor-pointer">
                      {option}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-[10px] text-slate-400 font-medium">
            {(Object.values(post.pollVotes || {}) as number[]).reduce((a: number, b: number) => a + b, 0)} votes
            {post.pollEndDate && ` · Ends ${new Date(post.pollEndDate).toLocaleDateString()}`}
          </div>
        </div>
      )}

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div className={`mb-3 gap-1 rounded-xl overflow-hidden ${post.media.length === 1 ? "" : "grid grid-cols-2"}`}>
          {post.media.slice(0, 4).map((m: any, idx: number) => (
            <div key={m.id || `${m.mediaUrl}-${idx}`} className={`overflow-hidden bg-slate-100 ${post.media.length === 1 ? "max-h-96" : "aspect-video max-h-48"} ${idx === 0 && post.media.length === 3 ? "row-span-2" : ""}`}>
              {isVideoMedia(m.mediaType, m.mediaUrl) ? (
                <FeedVideoPlayer
                  mediaUrl={m.mediaUrl}
                  thumbnailUrl={m.thumbnailUrl}
                  altText={m.altText}
                  isSingle={post.media.length === 1}
                />
              ) : (
                <img src={m.mediaUrl} alt={m.altText || ""} className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>
      )}

      {post.imageUrl && (!post.media || post.media.length === 0) && (
        <div className="mb-3 overflow-hidden rounded-xl border border-slate-100 max-h-96 bg-slate-50 flex items-center justify-center">
          {isVideoMedia(undefined, post.imageUrl) ? (
            <FeedVideoPlayer mediaUrl={post.imageUrl} isSingle />
          ) : (
            <img
              src={post.imageUrl}
              alt=""
              className="w-full object-cover"
              loading="lazy"
              onError={(e) => {
                const el = e.currentTarget;
                el.style.display = "none";
                const parent = el.parentElement;
                if (parent) parent.style.display = "none";
              }}
            />
          )}
        </div>
      )}

      {/* Link preview */}
      {post.linkUrl && post.linkTitle && (
        <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" className="block mb-3 border border-slate-200 rounded-lg overflow-hidden hover:shadow-sm transition-all">
          {post.linkImage && <img src={post.linkImage} alt="" className="w-full h-32 object-cover" />}
          <div className="p-3">
            <h5 className="text-xs font-bold text-slate-800 line-clamp-1">{post.linkTitle}</h5>
            {post.linkDescription && <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{post.linkDescription}</p>}
          </div>
        </a>
      )}

      {/* Reaction summary */}
      {totalReactions > 0 && (
        <div className="flex items-center gap-1.5 mb-2 text-xs text-slate-500">
          <button
            type="button"
            onClick={() => onOpenPostLikers(post.id)}
            className="flex items-center gap-1.5 hover:text-indigo-600 cursor-pointer group transition-colors"
            title="Click to view who liked or reacted to this post"
          >
            <div className="flex -space-x-1">
              {Object.entries(post.reactionCounts || {}).slice(0, 3).map(([type]) => {
                const rc = REACTION_CONFIG.find((r) => r.type === type);
                if (!rc) return null;
                const IconComp = rc.icon;
                return <span key={type} className={`w-5 h-5 rounded-full flex items-center justify-center ${rc.color} bg-white border border-slate-200 shadow-2xs`}><IconComp className="w-3 h-3" /></span>;
              })}
            </div>
            <span className="font-semibold text-slate-700 group-hover:text-indigo-600 group-hover:underline ml-0.5">{totalReactions} {totalReactions === 1 ? "like" : "likes"}</span>
          </button>
          {post.commentsCount > 0 && <span className="ml-auto text-slate-400">{post.commentsCount} comments</span>}
        </div>
      )}

      {/* Actions Bar */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500 text-sm relative">
        <div className="relative">
          <button
            onClick={() => onShowReactionPicker()}
            onDoubleClick={() => onReaction(post.id, "LIKE")}
            className={`flex items-center gap-1.5 transition-colors font-medium px-2 py-1 rounded-lg ${
              post.currentUserReaction ? currentReaction.activeColor : "hover:bg-slate-50"
            }`}
          >
            {(() => {
              const IconComp = currentReaction.icon;
              return <IconComp className={`w-4 h-4 ${post.currentUserReaction ? currentReaction.color : ""}`} />;
            })()}
            <span className="text-xs">{post.currentUserReaction ? currentReaction.label : "React"}</span>
          </button>

          {showReactionPicker && (
            <div ref={reactionPickerRef} className="absolute bottom-full left-0 mb-2 flex items-center gap-0.5 bg-white border border-slate-200 rounded-full px-1.5 py-1 shadow-lg z-50">
              {REACTION_CONFIG.map((r) => {
                const IconComp = r.icon;
                return (
                  <button
                    key={r.type}
                    onClick={() => onReaction(post.id, r.type)}
                    className={`p-1.5 rounded-full transition-all hover:scale-125 ${r.color} hover:bg-slate-50`}
                    title={r.label}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button onClick={() => onToggleComments(post.id)} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors font-medium hover:bg-slate-50 ${commentsOpen ? "text-indigo-600" : ""}`}>
          <MessageSquare className="w-4 h-4" />
          <span className="text-xs">{post.commentsCount}</span>
        </button>

        {/* ── Share / Copy Link Button ── */}
        <button
          onClick={async () => {
            const postUrl = `${window.location.origin}/posts/${post.id}`;
            const shareTitle = post.title || (post.content?.slice(0, 60) + (post.content && post.content.length > 60 ? "…" : "")) || "Community Post";
            const shareText = post.content?.slice(0, 120) || shareTitle;

            // Try Web Share API first (works natively on mobile → WhatsApp, etc.)
            if (typeof navigator.share === "function") {
              try {
                await navigator.share({ title: shareTitle, text: shareText, url: postUrl });
                return; // native sheet handled it
              } catch {
                // User cancelled or API unavailable — fall through to clipboard
              }
            }

            // Clipboard fallback
            try {
              await navigator.clipboard.writeText(postUrl);
            } catch {
              // Last-resort fallback for insecure contexts
              const ta = document.createElement("textarea");
              ta.value = postUrl;
              ta.style.cssText = "position:fixed;opacity:0";
              document.body.appendChild(ta);
              ta.select();
              document.execCommand("copy");
              document.body.removeChild(ta);
            }
            setIsLinkCopied(true);
            setTimeout(() => setIsLinkCopied(false), 2000);
          }}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors font-medium ${
            isLinkCopied
              ? "bg-emerald-50 text-emerald-600"
              : "hover:bg-slate-50 text-slate-500 hover:text-slate-700"
          }`}
          title="Share or copy link to this post"
        >
          {isLinkCopied ? (
            <>
              <Check className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Share</span>
            </>
          )}
        </button>
      </div>

      {/* Comments */}
      {commentsOpen && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
          {loadingComments && <div className="flex justify-center py-3"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>}
          {comments.length > 0 && (
            <div className="space-y-2">
              {comments.filter((c: CommentResponse) => !c.parentId).map((comment: CommentResponse) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  allComments={comments}
                  postId={post.id}
                  user={user}
                  isAdmin={isAdmin}
                  getInitials={getInitials}
                  formatTimeAgo={formatTimeAgo}
                  onDelete={onDeleteComment}
                  onReply={(commentId: number) => onSetReplyingTo(commentId)}
                  onToggleCommentLike={(postId: number, commentId: number) => onToggleCommentLike(postId, commentId)}
                  onToggleCommentReaction={(postId: number, commentId: number, type: string) => onToggleCommentReaction(postId, commentId, type)}
                  onOpenCommentLikers={onOpenCommentLikers}
                  depth={0}
                />
              ))}
            </div>
          )}
          {comments.length === 0 && !loadingComments && (
            <p className="text-xs text-slate-400 text-center py-2">No comments yet. Start the conversation!</p>
          )}

          {replyingTo && (
            <div className="flex items-center gap-1 text-[10px] text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
              <Reply className="w-3 h-3" /> Replying to comment
              <button onClick={() => onSetReplyingTo(null)} className="ml-auto text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
            </div>
          )}

          <div className="flex gap-2 items-center">
            <input type="text" className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all" placeholder={replyingTo ? "Write a reply..." : "Write a comment..."} value={newCommentText} onChange={(e) => onSetCommentText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onAddComment(post.id); } }} disabled={submittingComment} />
            <button onClick={() => onAddComment(post.id)} className="p-2 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-600 rounded-lg transition-colors flex-shrink-0" disabled={submittingComment || !newCommentText?.trim()}>
              {submittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

/* ─── Comment Item (Threaded) ─── */
function CommentItem({
  comment,
  allComments,
  postId,
  user,
  isAdmin,
  getInitials,
  formatTimeAgo,
  onDelete,
  onReply,
  onToggleCommentLike,
  onToggleCommentReaction,
  onOpenCommentLikers,
  depth,
}: any) {
  const replies = comment.replies || allComments.filter((c: CommentResponse) => c.parentId === comment.id);
  const [showReplies, setShowReplies] = useState(depth < 2);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Determine current user's reaction on this comment
  const userReaction = comment.userCommentReaction as string | undefined;
  const reactionCounts: Record<string, number> = comment.commentReactionCounts || {};
  const totalReactions = comment.likesCount || 0;

  // Dominant reaction emoji for button face
  const dominantEmoji = userReaction
    ? (COMMENT_REACTION_CONFIG.find(r => r.type === userReaction)?.emoji ?? "❤️")
    : (totalReactions > 0 ? (COMMENT_REACTION_CONFIG.find(r => reactionCounts[r.type] > 0)?.emoji ?? "❤️") : null);

  const handleReaction = async (type: string) => {
    setShowReactionPicker(false);
    if (onToggleCommentReaction) {
      await onToggleCommentReaction(postId, comment.id, type);
    } else if (onToggleCommentLike) {
      // Fallback to simple like for backward compat
      await onToggleCommentLike(postId, comment.id);
    }
  };

  return (
    <div className={`${depth > 0 ? "ml-6 border-l-2 border-slate-100 pl-3" : ""}`}>
      <div className="flex gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-100/50">
        <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-[10px] text-slate-600 font-bold overflow-hidden">
          {comment.authorProfilePic ? <img src={comment.authorProfilePic} alt="" className="w-full h-full object-cover" /> : comment.authorAvatar || getInitials(comment.authorName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span className="text-xs font-bold text-slate-800 truncate">{comment.authorName}</span>
              {comment.authorRole && comment.authorRole !== "Verified Member" && (
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                  {comment.authorRole}
                </span>
              )}
              {comment.pinned && <Pin className="w-3 h-3 text-indigo-500 flex-shrink-0" />}
              {comment.acceptedAnswer && <Check className="w-3 h-3 text-green-500 flex-shrink-0" />}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-[10px] text-slate-400">{formatTimeAgo(comment.createdAt)}</span>
              {(user?.userId === String(comment.authorId) || isAdmin) && (
                <button onClick={() => onDelete(postId, comment.id)} className="text-slate-400 hover:text-red-500 p-0.5"><Trash2 className="w-3 h-3" /></button>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-700 leading-normal whitespace-pre-line mt-0.5">{comment.content}</p>
          <div className="flex items-center gap-3 mt-1.5">
            {/* ── Rich Comment Reaction Picker ── */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowReactionPicker(prev => !prev)}
                className={`text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  userReaction ? "text-rose-600 font-bold" : "text-slate-500 hover:text-rose-600"
                }`}
                title="React to this comment"
              >
                {dominantEmoji ? (
                  <span className="text-[11px]">{dominantEmoji}</span>
                ) : (
                  <Heart className="w-3 h-3" />
                )}
                <span>{userReaction
                  ? (COMMENT_REACTION_CONFIG.find(r => r.type === userReaction)?.label ?? "Reacted")
                  : "React"}</span>
              </button>
              {showReactionPicker && (
                <div className="absolute bottom-full left-0 mb-1 z-30 bg-white border border-slate-200 rounded-xl shadow-xl px-2 py-1.5 flex items-center gap-1.5">
                  {COMMENT_REACTION_CONFIG.map(r => (
                    <button
                      key={r.type}
                      type="button"
                      onClick={() => handleReaction(r.type)}
                      title={r.label}
                      className={`flex flex-col items-center gap-0.5 px-1 py-0.5 rounded-lg transition-all hover:bg-slate-100 hover:scale-125 cursor-pointer ${
                        userReaction === r.type ? "bg-slate-100 scale-110" : ""
                      }`}
                    >
                      <span className="text-base leading-none">{r.emoji}</span>
                      <span className={`text-[8px] font-bold ${userReaction === r.type ? r.activeColor : "text-slate-400"}`}>{r.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reaction summary: show per-type counts or total */}
            {totalReactions > 0 && (
              <button
                type="button"
                onClick={() => onOpenCommentLikers && onOpenCommentLikers(comment.id)}
                className="text-[10px] font-medium text-slate-500 hover:text-indigo-600 hover:underline cursor-pointer flex items-center gap-0.5"
                title="View who reacted to this comment"
              >
                {Object.entries(reactionCounts).slice(0, 3).map(([type]) => {
                  const cfg = COMMENT_REACTION_CONFIG.find(r => r.type === type);
                  return cfg ? <span key={type} className="text-[11px]">{cfg.emoji}</span> : null;
                })}
                <span className="ml-0.5">{totalReactions}</span>
              </button>
            )}

            <button onClick={() => onReply(comment.id)} className="text-[10px] font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer">
              <Reply className="w-3 h-3" /> Reply
            </button>
          </div>
        </div>
      </div>

      {replies.length > 0 && (
        <>
          {!showReplies ? (
            <button onClick={() => setShowReplies(true)} className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 ml-9 mt-1 cursor-pointer">
              Show {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </button>
          ) : (
            <div className="mt-1.5 space-y-1.5">
              {replies.map((reply: CommentResponse) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  allComments={allComments}
                  postId={postId}
                  user={user}
                  isAdmin={isAdmin}
                  getInitials={getInitials}
                  formatTimeAgo={formatTimeAgo}
                  onDelete={onDelete}
                  onReply={onReply}
                  onToggleCommentLike={onToggleCommentLike}
                  onToggleCommentReaction={onToggleCommentReaction}
                  onOpenCommentLikers={onOpenCommentLikers}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Sidebar Components (On-Demand / Lazy Loaded) ─── */
function EngagementScoreCard({ summaryScore }: { summaryScore?: { totalPoints: number; level: number } }) {
  const [expanded, setExpanded] = useState(false);
  const [score, setScore] = useState<EngagementScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!expanded || hasFetched) return;
    setLoading(true);
    engagementService.getMyScore()
      .then((data) => {
        setScore(data);
        setHasFetched(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [expanded, hasFetched]);

  const displayPoints = score?.totalPoints ?? summaryScore?.totalPoints;
  const displayLevel = score?.level ?? summaryScore?.level;

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden transition-all duration-300 hover:shadow-md">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-xs">
            <Crown className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">Your Engagement Score</span>
            <span className="text-[10px] text-slate-400 font-medium">
              {displayPoints !== undefined
                ? `${displayPoints.toLocaleString()} pts · Level ${displayLevel ?? 1}`
                : "Points, level & badges"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {displayLevel !== undefined && (
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              Lvl {displayLevel}
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100">
          {loading ? (
            <div className="flex items-center justify-center py-4 text-slate-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600 mr-2" />
              Loading your score...
            </div>
          ) : !score ? (
            <div className="text-center py-4 text-slate-400 text-xs font-medium">
              Score data currently unavailable.
            </div>
          ) : (
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl p-3 text-white shadow-xs mt-1">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider opacity-90">Community Level</h4>
                <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-[9px] font-bold">
                  <Crown className="w-2.5 h-2.5" /> Lvl {score.level}
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-xl font-black leading-none">{score.totalPoints.toLocaleString()}</span>
                <span className="text-[9px] opacity-75 font-medium">pts</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="bg-white/10 rounded-lg p-1.5">
                  <div className="text-xs font-bold leading-tight">{score.postsCount}</div>
                  <div className="text-[8px] opacity-70 leading-tight">Posts</div>
                </div>
                <div className="bg-white/10 rounded-lg p-1.5">
                  <div className="text-xs font-bold leading-tight">{score.commentsCount}</div>
                  <div className="text-[8px] opacity-70 leading-tight">Comments</div>
                </div>
                <div className="bg-white/10 rounded-lg p-1.5">
                  <div className="text-xs font-bold leading-tight">{score.helpfulCount}</div>
                  <div className="text-[8px] opacity-70 leading-tight">Helpful</div>
                </div>
              </div>
              {score.badges && score.badges.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {score.badges.slice(0, 5).map((b) => (
                    <span key={b.id} className="bg-white/15 px-1.5 py-0.5 rounded text-[8px] font-semibold" title={b.title}>
                      {b.icon || "🏅"} {b.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TrendingCard({ badgeCount, onHashtagClick }: { badgeCount?: number; onHashtagClick: (tag: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [trending, setTrending] = useState<TrendingResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!expanded || hasFetched) return;
    setLoading(true);
    engagementService.getTrending(8)
      .then((data) => {
        setTrending(Array.isArray(data) ? data : []);
        setHasFetched(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [expanded, hasFetched]);

  const currentCount = hasFetched ? trending.length : (badgeCount ?? trending.length);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden transition-all duration-300 hover:shadow-md">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
            <Flame className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">Trending Topics</span>
            <span className="text-[10px] text-slate-400 font-medium">Popular community discussions</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {currentCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-orange-50 text-orange-600 border border-orange-100 leading-none">
              {currentCount}
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100">
          {loading ? (
            <div className="flex items-center justify-center py-4 text-slate-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-orange-500 mr-2" />
              Loading trending topics...
            </div>
          ) : trending.length === 0 ? (
            <div className="text-center py-4 text-slate-400 text-xs font-medium">
              No trending hashtags yet.
            </div>
          ) : (
            <div className="space-y-1.5 mt-1">
              {trending.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onHashtagClick(t.topic)}
                  className="w-full text-left flex items-center gap-2 p-1.5 rounded-xl hover:bg-orange-50/60 transition-all group cursor-pointer"
                >
                  <span className="text-[10px] font-bold text-slate-400 w-4 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 group-hover:text-orange-600 truncate">{t.topic}</div>
                    <div className="text-[10px] text-slate-400">{t.postCount} posts</div>
                  </div>
                  <TrendingUp className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MyGroupsCard({ badgeCount }: { badgeCount?: number }) {
  const [expanded, setExpanded] = useState(false);
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!expanded || hasFetched) return;
    setLoading(true);
    groupService.getMyGroups()
      .then((data) => {
        setGroups(Array.isArray(data) ? data : []);
        setHasFetched(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [expanded, hasFetched]);

  const currentCount = hasFetched ? groups.length : (badgeCount ?? groups.length);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden transition-all duration-300 hover:shadow-md">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-xs">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">My Groups</span>
            <span className="text-[10px] text-slate-400 font-medium">Interest & club channels</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {currentCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-violet-50 text-violet-600 border border-violet-100 leading-none">
              {currentCount}
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100">
          {loading ? (
            <div className="flex items-center justify-center py-4 text-slate-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-violet-600 mr-2" />
              Loading your groups...
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-4 text-slate-400 text-xs font-medium">
              You haven't joined any groups yet.
            </div>
          ) : (
            <div className="space-y-1 mt-1">
              {groups.slice(0, 5).map((g) => (
                <div key={g.id} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-violet-50/60 cursor-pointer transition-all">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-[10px] font-bold text-violet-700 shrink-0">
                    {g.iconUrl ? <img src={g.iconUrl} alt="" className="w-full h-full rounded-lg object-cover" /> : g.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate">{g.name}</div>
                    <div className="text-[10px] text-slate-400">{g.memberCount} members</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LeaderboardCard({ badgeCount, getInitials }: { badgeCount?: number; getInitials: (name: string) => string }) {
  const [expanded, setExpanded] = useState(false);
  const [leaderboard, setLeaderboard] = useState<EngagementScoreResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const medals = ["🥇", "🥈", "🥉"];

  useEffect(() => {
    if (!expanded || hasFetched) return;
    setLoading(true);
    engagementService.getLeaderboard(5)
      .then((data) => {
        setLeaderboard(Array.isArray(data) ? data : []);
        setHasFetched(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [expanded, hasFetched]);

  const currentCount = hasFetched ? leaderboard.length : (badgeCount ?? leaderboard.length);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden transition-all duration-300 hover:shadow-md">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Trophy className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">Top Contributors</span>
            <span className="text-[10px] text-slate-400 font-medium">Most active residents</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {currentCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-600 border border-amber-100 leading-none">
              {currentCount}
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100">
          {loading ? (
            <div className="flex items-center justify-center py-4 text-slate-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-amber-500 mr-2" />
              Loading top contributors...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-4 text-slate-400 text-xs font-medium">
              No contributor scores recorded yet.
            </div>
          ) : (
            <div className="space-y-1 mt-1">
              {leaderboard.map((entry, i) => (
                <div key={entry.userId} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-amber-50/60 transition-all">
                  <span className="text-xs w-5 text-center">{medals[i] || `${i + 1}`}</span>
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 overflow-hidden shrink-0">
                    {entry.profilePicUrl ? <img src={entry.profilePicUrl} alt="" className="w-full h-full object-cover" /> : getInitials(entry.userName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate">{entry.userName}</div>
                    <div className="text-[10px] text-slate-400">{entry.totalPoints} pts · Level {entry.level}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SidebarAnnouncements({ posts }: { posts: PostResponse[] }) {
  const announcements = posts.filter((p) => p.official).slice(0, 3);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
      <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
        <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><Megaphone className="w-4 h-4" /></div>
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Official Notices</h4>
      </div>
      {announcements.length === 0 ? (
        <p className="text-[11px] text-slate-400 text-center py-2">No official announcements yet.</p>
      ) : (
        <div className="space-y-2.5">
          {announcements.map((p) => (
            <div key={p.id} className="text-left text-xs space-y-1">
              <p className="font-semibold text-slate-700 hover:text-indigo-600 cursor-pointer line-clamp-2">{p.content}</p>
              <p className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
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
        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><LinkIcon className="w-4 h-4" /></div>
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Quick Links</h4>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          { href: "/profile", icon: "👤", label: "Profile" },
          { href: "/finance/ledger", icon: "💸", label: "Payments" },
          { href: "/helpdesk", icon: "🔧", label: "Helpdesk" },
          { href: "/marketplace", icon: "🛒", label: "Marketplace" },
          { href: "/events", icon: "📅", label: "Events" },
          { href: "/jobs", icon: "💼", label: "Jobs" },
        ].map((link) => (
          <a key={link.href} href={link.href} className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-semibold border border-slate-100 text-slate-700">
            {link.icon} {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function addReplyToTree(comments: CommentResponse[], parentId: number, reply: CommentResponse): CommentResponse[] {
  return comments.map((c) => {
    if (c.id === parentId) {
      return { ...c, replies: [...(c.replies || []), reply], repliesCount: (c.repliesCount || 0) + 1 };
    }
    if (c.replies && c.replies.length > 0) {
      return { ...c, replies: addReplyToTree(c.replies, parentId, reply) };
    }
    return c;
  });
}

function removeFromTree(comments: CommentResponse[], commentId: number): CommentResponse[] {
  return comments
    .filter((c) => c.id !== commentId)
    .map((c) => ({
      ...c,
      replies: c.replies ? removeFromTree(c.replies, commentId) : undefined,
    }));
}
