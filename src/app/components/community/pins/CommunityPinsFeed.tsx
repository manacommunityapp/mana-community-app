import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Pin,
  Plus,
  Clock,
  Heart,
  Share2,
  X,
  ExternalLink,
  AlertCircle,
  Trophy,
  Tag,
  KeyRound,
  Car,
  HelpCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  communityPinService,
  type CommunityPin,
  type PinCategory,
} from "../../../../services/pins/communityPinService";
import { StoryCardModal, type StoryCardData } from "../../commons/StoryCardModal";

const CATEGORIES: Array<{ key: PinCategory; label: string; icon: React.ReactNode; color: string }> = [
  { key: "ALL", label: "All Pins", icon: <Pin className="w-3.5 h-3.5" />, color: "bg-slate-800 text-slate-200" },
  { key: "ALERTS", label: "Alerts", icon: <AlertCircle className="w-3.5 h-3.5" />, color: "bg-rose-950/70 border-rose-800/60 text-rose-300" },
  { key: "SPORTS", label: "Sports", icon: <Trophy className="w-3.5 h-3.5" />, color: "bg-emerald-950/70 border-emerald-800/60 text-emerald-300" },
  { key: "OFFERS", label: "Offers", icon: <Tag className="w-3.5 h-3.5" />, color: "bg-amber-950/70 border-amber-800/60 text-amber-300" },
  { key: "LOST_FOUND", label: "Lost & Found", icon: <KeyRound className="w-3.5 h-3.5" />, color: "bg-purple-950/70 border-purple-800/60 text-purple-300" },
  { key: "CARPOOL", label: "Carpool", icon: <Car className="w-3.5 h-3.5" />, color: "bg-cyan-950/70 border-cyan-800/60 text-cyan-300" },
  { key: "HELP_NEEDED", label: "Help Needed", icon: <HelpCircle className="w-3.5 h-3.5" />, color: "bg-blue-950/70 border-blue-800/60 text-blue-300" },
];

export function CommunityPinsFeed() {
  const { user } = useAuth();
  const communityId = user?.communityId || 1;

  const [pins, setPins] = useState<CommunityPin[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PinCategory>("ALL");
  const [loading, setLoading] = useState(false);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [storyCardData, setStoryCardData] = useState<StoryCardData | null>(null);
  const [storyModalOpen, setStoryModalOpen] = useState(false);

  // Create form states
  const [formCategory, setFormCategory] = useState<string>("GENERAL");
  const [formContent, setFormContent] = useState("");
  const [formDuration, setFormDuration] = useState<number>(24);
  const [formExternalLink, setFormExternalLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPins = useCallback(async () => {
    try {
      setLoading(true);
      const data = await communityPinService.getPins(communityId, selectedCategory);
      setPins(data);
    } catch {
      // silent fallback
    } finally {
      setLoading(false);
    }
  }, [communityId, selectedCategory]);

  useEffect(() => {
    loadPins();
  }, [loadPins]);

  const handleLike = async (pinId: number) => {
    try {
      const updated = await communityPinService.likePin(communityId, pinId);
      setPins((prev) => prev.map((p) => (p.id === pinId ? updated : p)));
    } catch {
      toast.error("Failed to like pin");
    }
  };

  const handleClosePin = async (pinId: number) => {
    try {
      const updated = await communityPinService.closePin(communityId, pinId);
      setPins((prev) => prev.map((p) => (p.id === pinId ? updated : p)));
      toast.success("Pin marked as closed");
    } catch {
      toast.error("Only author or admin can close this pin");
    }
  };

  const handleOpenStoryCard = (pin: CommunityPin) => {
    const cardData: StoryCardData = {
      type: "PIN",
      communityName: user?.communityName || "Mana Community",
      category: `COMMUNITY PIN • ${pin.category}`,
      title: pin.content,
      subtitle: `${pin.authorName}${pin.flatNumber ? " • Flat " + pin.flatNumber : ""}`,
      statusBadge: pin.isClosed ? "CLOSED" : "ACTIVE PIN",
      badgeColor: pin.isClosed ? "#64748B" : "#10B981",
      highlights: [
        `Posted by ${pin.authorName}`,
        pin.isClosed ? "Status: Resolved / Closed" : `Auto-expires: ${formatExpiry(pin.expiresAt)}`,
        `Community: ${user?.communityName || "Mana Society"}`,
      ],
      footerNote: "Mana Community Pins • Real-Time Hyperlocal Updates",
      dateStr: new Date(pin.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      authorInfo: pin.flatNumber ? `Flat ${pin.flatNumber}` : undefined,
      accentColor: getCategoryAccent(pin.category),
    };
    setStoryCardData(cardData);
    setStoryModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) {
      toast.error("Pin content cannot be empty");
      return;
    }
    try {
      setIsSubmitting(true);
      const newPin = await communityPinService.createPin(communityId, {
        category: formCategory,
        content: formContent.trim(),
        durationHours: formDuration,
        externalLink: formExternalLink.trim() || undefined,
      });
      setPins((prev) => [newPin, ...prev]);
      setCreateModalOpen(false);
      setFormContent("");
      setFormExternalLink("");
      toast.success("Community pin posted! Auto-expires in " + formDuration + " hours.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to post pin");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPins = useMemo(() => {
    if (selectedCategory === "ALL") return pins;
    return pins.filter((p) => p.category.toUpperCase() === selectedCategory);
  }, [pins, selectedCategory]);

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl mb-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Pin className="w-5 h-5 rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Community Pins</h2>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded-full">
                Auto-Expiring 24h
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real-time micro-broadcasts, urgent alerts, and neighborhood requests.
            </p>
          </div>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Post a Pin</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all whitespace-nowrap ${
                isSelected
                  ? "bg-emerald-600 border-emerald-500 text-white shadow-sm"
                  : "bg-slate-800/80 hover:bg-slate-800 border-slate-700/60 text-slate-300"
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Pins Stream */}
      {loading ? (
        <div className="py-8 text-center text-slate-400 text-sm">Loading active pins...</div>
      ) : filteredPins.length === 0 ? (
        <div className="py-8 px-4 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
          <Pin className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-300 text-sm font-medium">No active pins in this category</p>
          <p className="text-slate-500 text-xs mt-1">
            Need a player, selling an item, or have an urgent announcement? Share a pin!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredPins.map((pin) => {
            const isAuthor = user?.userId && Number(user.userId) === Number(pin.authorId);
            const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
            const canClose = (isAuthor || isAdmin) && !pin.isClosed;

            return (
              <div
                key={pin.id}
                className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all hover:border-slate-700 ${
                  pin.isClosed
                    ? "bg-slate-950/60 border-slate-800/60 opacity-75"
                    : "bg-slate-950/90 border-slate-800 shadow-md"
                }`}
              >
                {/* Card Top: Category & Expiry */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase tracking-wider ${getCategoryBadgeStyle(
                        pin.category
                      )}`}
                    >
                      {pin.category}
                    </span>

                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      {pin.isClosed ? (
                        <span className="flex items-center gap-1 text-slate-400 font-semibold">
                          <Lock className="w-3 h-3" /> Closed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-400/90">
                          <Clock className="w-3 h-3" /> {formatExpiry(pin.expiresAt)}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Content */}
                  <p className="text-slate-200 text-sm font-medium leading-relaxed mb-3 whitespace-pre-wrap">
                    {pin.content}
                  </p>

                  {/* External link if any */}
                  {pin.externalLink && (
                    <a
                      href={pin.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold mb-3 hover:underline"
                    >
                      <span>Visit Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Card Bottom: Author & Action Buttons */}
                <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-400">
                  <div className="truncate pr-2">
                    <span className="font-semibold text-slate-300">{pin.authorName}</span>
                    {pin.flatNumber && (
                      <span className="text-slate-500 text-[11px]"> • Flat {pin.flatNumber}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Like button */}
                    <button
                      onClick={() => handleLike(pin.id)}
                      className="flex items-center gap-1 px-2 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-rose-400 rounded-lg transition-colors"
                      title="Like pin"
                    >
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-[11px] font-medium">{pin.likesCount || 0}</span>
                    </button>

                    {/* Share Story Card button */}
                    <button
                      onClick={() => handleOpenStoryCard(pin)}
                      className="p-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 rounded-lg transition-colors"
                      title="Share to WhatsApp / Story Card"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Close pin button */}
                    {canClose && (
                      <button
                        onClick={() => handleClosePin(pin.id)}
                        className="p-1.5 bg-slate-800/80 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 rounded-lg transition-colors"
                        title="Mark pin as closed / resolved"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Pin Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-slate-800/80 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Pin className="w-5 h-5 rotate-45" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Post a Community Pin</h3>
                <p className="text-xs text-slate-400">Quick, auto-expiring update visible to all residents.</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="GENERAL">General Notice</option>
                  <option value="ALERTS">🚨 Urgent Alert</option>
                  <option value="SPORTS">🏸 Sports / Games</option>
                  <option value="OFFERS">🏷️ Offer / Giveaway</option>
                  <option value="LOST_FOUND">🔑 Lost & Found</option>
                  <option value="CARPOOL">🚗 Carpool / Ride</option>
                  <option value="HELP_NEEDED">🤝 Help Needed</option>
                </select>
              </div>

              {/* Content Textarea */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Message (Max 280 chars)</label>
                  <span className={`text-[11px] ${formContent.length > 260 ? "text-rose-400 font-bold" : "text-slate-500"}`}>
                    {formContent.length} / 280
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={280}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="e.g. Giving away kids study table for free (Tower B, Flat 402). Available until 9 PM tonight!"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              {/* Expiry Duration */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Auto-Expires After</label>
                <div className="grid grid-cols-4 gap-2">
                  {[6, 12, 24, 48].map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setFormDuration(hours)}
                      className={`py-2 text-xs font-medium rounded-xl border transition-colors ${
                        formDuration === hours
                          ? "bg-emerald-600 border-emerald-500 text-white"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                      }`}
                    >
                      {hours}h
                    </button>
                  ))}
                </div>
              </div>

              {/* External Link */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">External Link (Optional)</label>
                <input
                  type="url"
                  value={formExternalLink}
                  onChange={(e) => setFormExternalLink(e.target.value)}
                  placeholder="https://chat.whatsapp.com/... or link"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Submit */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formContent.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
                >
                  {isSubmitting ? "Posting..." : "Publish Pin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Story Card Modal */}
      <StoryCardModal
        open={storyModalOpen}
        onClose={() => setStoryModalOpen(false)}
        data={storyCardData}
      />
    </div>
  );
}

// ── Helpers ──

function formatExpiry(expiresAt: string): string {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return "Expired";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d left`;
  }
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

function getCategoryBadgeStyle(category: string): string {
  switch (category.toUpperCase()) {
    case "ALERTS":
      return "bg-rose-950/80 text-rose-300 border-rose-800/70";
    case "SPORTS":
      return "bg-emerald-950/80 text-emerald-300 border-emerald-800/70";
    case "OFFERS":
      return "bg-amber-950/80 text-amber-300 border-amber-800/70";
    case "LOST_FOUND":
      return "bg-purple-950/80 text-purple-300 border-purple-800/70";
    case "CARPOOL":
      return "bg-cyan-950/80 text-cyan-300 border-cyan-800/70";
    case "HELP_NEEDED":
      return "bg-blue-950/80 text-blue-300 border-blue-800/70";
    default:
      return "bg-slate-800 text-slate-300 border-slate-700";
  }
}

function getCategoryAccent(category: string): string {
  switch (category.toUpperCase()) {
    case "ALERTS":
      return "#F43F5E";
    case "SPORTS":
      return "#10B981";
    case "OFFERS":
      return "#F59E0B";
    case "LOST_FOUND":
      return "#A855F7";
    case "CARPOOL":
      return "#06B6D4";
    case "HELP_NEEDED":
      return "#3B82F6";
    default:
      return "#10B981";
  }
}
