import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useEventMock } from "./EventMockToggle";
import { eventService, type DashboardStatsResponse } from "../../../services/events/eventService";
import {
  Flame,
  Music,
  Trophy,
  Ticket,
  ShieldCheck,
  Heart,
  Utensils,
  Gavel,
  Search,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  QrCode,
  Sparkles,
  User,
  Users,
  CheckCircle2,
  Plus,
  ArrowRight,
  Download,
  Calendar,
  Smartphone,
  X,
  AlertCircle,
  UserPlus,
  Loader2,
  Filter,
  Trash2,
  Upload,
  Receipt,
  Eye,
  FileText,
  ExternalLink,
  Settings,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Edit3,
  Info,
  Zap,
  IndianRupee,
  History,
  Lock,
} from "lucide-react";
import { EventRegistrationWizard } from "./redesign/EventRegistrationWizard";
import { PoojaRegistrationModal } from "./PoojaRegistrationModal";
import { EventCompleteDetailsModal } from "./EventCompleteDetailsModal";
import { isRegistrationClosed } from "../../../utils/eventDeadlineUtils";
import { showError, showSuccess, showWarning } from "../../../utils/ToastUtils";
import { useEscapeKey } from "../../../hooks/useEscapeKey";

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number;
  avatar: string;
}

interface Activity {
  id: string;
  title: string;
  category: "Pooja" | "Cultural" | "Competitions" | "Food" | "Volunteer" | "Donation" | "Auction" | "Other" | string;
  date: string;
  time: string;
  venue: string;
  fee: number;
  availableSeats: number;
  image: string;
  description: string;
  startDate?: string;
  endDate?: string;
  isMultiDay?: boolean;
  startTime?: string;
  startTimes?: string[];
  mandap?: string;
  pandit?: string;
  slots?: number | string;
  capacity?: number;
  maxAttendees?: number;
  totalCapacity?: number;
  seats?: number;
  ticketTypes?: any[];
  isFree?: boolean;
  existingRegistration?: any;
  registrationId?: string | number;
  isUpdateMode?: boolean;
  /** ID of the parent community/top-level event this sub-event belongs to */
  mainEventId?: string | number;
  /** Raw database auction item object if category is Auction */
  rawAuctionItem?: any;
}

interface UserPass {
  id: string;
  activityId?: string;
  category?: string;
  /** Pooja Seva's numeric DB id (e.g. 5 for "pooja-5") – NOT the parent event id */
  poojaSevaId?: string;
  /** Parent community event id */
  mainEventId?: string | number;
  eventId?: number | string;
  passType: string;
  title: string;
  participantName: string;
  phone?: string;
  flatNo?: string;
  devoteeCount?: number;
  attendingDevotees?: string;
  gotram?: string;
  regId: string;
  date: string;
  time: string;
  venue: string;
  status: "CONFIRMED" | "PENDING APPROVAL" | "CANCELLED" | "EXPIRED" | "CLOSED" | string;
  isEventCancelled?: boolean;
  isEventExpired?: boolean;
  isEventClosed?: boolean;
  statusReason?: string;
  qrCodeUrl: string;
  bookingFee?: number;
  paymentStatus?: string;
  paymentReceiptUrl?: string;
  transactionId?: string;
  paymentMethod?: string;
}

const INITIAL_PASSES: UserPass[] = [];

function countdownFrom(dateStr?: string | null, timeStr?: string | null) {
  if (!dateStr) return { days: 0, hours: 0, mins: 0, secs: 0 };
  const parsedTime = Date.parse(dateStr);
  let dt: number;
  if (!isNaN(parsedTime)) {
    dt = new Date(`${new Date(parsedTime).toISOString().slice(0, 10)}${timeStr ? "T" + timeStr : "T00:00:00"}`).getTime();
  } else {
    dt = new Date(`${dateStr}${timeStr ? "T" + timeStr : "T00:00:00"}`).getTime();
  }
  if (isNaN(dt)) {
    return { days: 0, hours: 0, mins: 0, secs: 0 };
  }
  const diff = Math.max(0, dt - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins: Math.floor((diff % 3600000) / 60000),
    secs: Math.floor((diff % 60000) / 1000),
  };
}

interface MemberAuctionBidModalProps {
  activity: Activity;
  onClose: () => void;
  onSuccess: () => void;
}

function MemberAuctionBidModal({ activity, onClose, onSuccess }: MemberAuctionBidModalProps) {
  const item = activity.rawAuctionItem || {
    id: typeof activity.id === "string" ? Number(activity.id.replace(/\D/g, "")) : activity.id,
    name: activity.title,
    category: activity.category || "General",
    description: activity.description,
    basePrice: activity.fee || 5000,
    currentBid: activity.fee || 0,
    minIncrement: 500,
    imageEmoji: activity.image || "🪔",
    status: "LIVE",
    bidCount: 0,
    leaderName: null,
  };

  const itemId = typeof item.id === "number" ? item.id : Number(String(item.id).replace(/\D/g, "")) || 1;
  const isLive = item.status === "LIVE";
  const isClosed = item.status === "CLOSED";
  const minInc = item.minIncrement || 500;
  const currentBid = Number(item.currentBid) || 0;
  const basePrice = Number(item.basePrice) || 0;
  const nextMinBid = item.bidCount === 0 || currentBid === 0 ? basePrice : currentBid + minInc;

  const [bidAmount, setBidAmount] = useState<number>(nextMinBid);
  const [bidsHistory, setBidsHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = async () => {
    if (!itemId) return;
    setLoadingHistory(true);
    try {
      const bids = await eventService.getAuctionBids(itemId);
      setBidsHistory(bids || []);
    } catch {
      // fallback
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
    setBidAmount(nextMinBid);
  }, [itemId, nextMinBid]);

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bidAmount < nextMinBid) {
      setError(`Minimum required bid amount is ₹${nextMinBid.toLocaleString("en-IN")}`);
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await eventService.placeAuctionBid(itemId, bidAmount);
      showSuccess(`🎉 Bid of ₹${bidAmount.toLocaleString("en-IN")} placed successfully on ${item.name}!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to place bid.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/70 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg sm:max-w-xl bg-card border border-border text-card-foreground rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto relative animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors shadow-2xs z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Item Details */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-3xl sm:text-4xl flex items-center justify-center shrink-0">
            {item.imageEmoji || "🪔"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                {item.category || "Festival Auction"}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isLive
                    ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    : isClosed
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                    : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                }`}
              >
                {isLive && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
                {isLive ? "Live Bidding" : isClosed ? "Closed / Won" : "Upcoming"}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-foreground mt-1 leading-snug">
              {item.name}
            </h3>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
        </div>

        {/* Pricing & High Bidder Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-muted/40 border border-border/80 text-xs">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Base Price</span>
            <p className="font-bold text-foreground text-sm">₹{basePrice.toLocaleString("en-IN")}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Current Highest Bid</span>
            <p className="font-black text-emerald-600 text-base sm:text-lg">
              {currentBid > 0 ? `₹${currentBid.toLocaleString("en-IN")}` : "No bids yet"}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Leading Devotee</span>
            <p className="font-bold text-foreground truncate">
              {item.leaderName ? `👑 ${item.leaderName}` : "—"}
            </p>
            <span className="text-[10px] text-muted-foreground">{item.bidCount || 0} total bids</span>
          </div>
        </div>

        {/* Bidding Form if LIVE */}
        {isLive && (
          <form onSubmit={handlePlaceBid} className="space-y-3 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" /> Enter Your Bid Amount (₹)
              </label>
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                Min: ₹{nextMinBid.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Quick Increment Preset Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Quick Add:</span>
              {[500, 1000, 2000, 5000, 10000].map((inc) => {
                const targetVal = Math.max(nextMinBid, (currentBid || basePrice) + inc);
                return (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => setBidAmount(targetVal)}
                    className="px-2 py-1 rounded-lg text-[10.5px] font-extrabold bg-card border border-border text-foreground hover:bg-amber-100 hover:border-amber-300 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
                  >
                    +₹{inc.toLocaleString("en-IN")}
                  </button>
                );
              })}
            </div>

            {/* Custom Input */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-sm text-muted-foreground">₹</span>
              <input
                type="number"
                min={nextMinBid}
                step={minInc}
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            {error && (
              <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || bidAmount < nextMinBid}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs sm:text-sm font-black shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Gavel className="w-4 h-4" />
              )}
              Place Sacred Bid of ₹{bidAmount.toLocaleString("en-IN")}
            </button>
          </form>
        )}

        {/* If CLOSED */}
        {isClosed && (
          <div className="p-4 rounded-2xl bg-muted/60 border border-border text-center space-y-1.5">
            <Trophy className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="text-xs font-bold text-foreground">Auction Item Closed</p>
            {item.leaderName ? (
              <p className="text-xs text-emerald-600 font-extrabold">
                🎉 Won by {item.leaderName} for ₹{currentBid.toLocaleString("en-IN")}!
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No bids were placed before close.</p>
            )}
          </div>
        )}

        {/* Live Bid History Section */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-primary" /> Live Devotee Bidding History
            </span>
            <button
              type="button"
              onClick={loadHistory}
              disabled={loadingHistory}
              className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${loadingHistory ? "animate-spin" : ""}`} /> Refresh Bids
            </button>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1.5 hide-scrollbar">
            {loadingHistory && bidsHistory.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" /> Loading bids…
              </div>
            ) : bidsHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                No bids recorded yet. Be the first devotee to bid!
              </p>
            ) : (
              bidsHistory.map((b: any, idx: number) => (
                <div
                  key={b.id || idx}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
                    idx === 0
                      ? "bg-amber-500/10 border-amber-500/30 text-foreground font-bold"
                      : "bg-muted/30 border-border/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm">{idx === 0 ? "👑" : "👤"}</span>
                    <span className="truncate">{b.bidderName || "Devotee"}</span>
                    {idx === 0 && (
                      <span className="text-[9px] font-black uppercase text-amber-700 dark:text-amber-400 bg-amber-200/60 dark:bg-amber-900/60 px-1.5 py-0.2 rounded">
                        Highest
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-extrabold text-foreground">₹{Number(b.amount).toLocaleString("en-IN")}</span>
                    <span className="text-[10px] text-muted-foreground">{b.timeAgo || "recent"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventMemberView() {
  const { user, isSuperAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"home" | "passes" | "auction">("home");
  const [showQRPass, setShowQRPass] = useState<UserPass | null>(null);
  const [showFamily, setShowFamily] = useState(false);
  const [showHeroSubEvents, setShowHeroSubEvents] = useState(false);
  const [detailedEvent, setDetailedEvent] = useState<any | null>(null);
  const [mobileModal, setMobileModal] = useState<"pooja" | "meals" | "passes" | "family" | null>(null);
  const [passesList, setPassesList] = useState<UserPass[]>([]);
  const [passesFilter, setPassesFilter] = useState<"ACTIVE" | "CANCELLED" | "EXPIRED" | "CLOSED" | "ALL">("ACTIVE");
  const [mobilePassesFilter, setMobilePassesFilter] = useState<"ACTIVE" | "CANCELLED" | "EXPIRED" | "ALL">("ACTIVE");
  const [passesSearch, setPassesSearch] = useState<string>("");
  const [activitiesList, setActivitiesList] = useState<Activity[]>([]);
  const [mainEventsList, setMainEventsList] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [liveStats, setLiveStats] = useState<DashboardStatsResponse | null>(null);
  const [loadingApiData, setLoadingApiData] = useState(false);
  const [loadingFamily, setLoadingFamily] = useState(false);

  // Payment Upload & Verification States
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [viewReceiptModal, setViewReceiptModal] = useState<string | null>(null);

  // Manage Registration Modal States
  const [managePassModal, setManagePassModal] = useState<UserPass | null>(null);
  const [editParticipantName, setEditParticipantName] = useState("");
  const [editAttendeeCount, setEditAttendeeCount] = useState(1);
  const [editGotram, setEditGotram] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editFlatNo, setEditFlatNo] = useState("");
  const [cancelConfirmMode, setCancelConfirmMode] = useState(false);
  const [isSavingManage, setIsSavingManage] = useState(false);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [manageSuccess, setManageSuccess] = useState<string | null>(null);
  const [manageError, setManageError] = useState<string | null>(null);

  // Modal State for Adding Dynamic Family Member
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [mobileQuickActionModal, setMobileQuickActionModal] = useState<any | null>(null);
  const [newMember, setNewMember] = useState({
    name: "",
    relation: "Son",
    age: "",
    avatar: "👦",
  });

  useEscapeKey(() => setMobileQuickActionModal(null), Boolean(mobileQuickActionModal));
  useEscapeKey(() => setMobileModal(null), Boolean(mobileModal));
  useEscapeKey(() => setShowQRPass(null), Boolean(showQRPass));
  useEscapeKey(() => setViewReceiptModal(null), Boolean(viewReceiptModal));
  useEscapeKey(() => setShowAddMemberModal(false), showAddMemberModal);
  useEscapeKey(() => { if (!isSavingManage) { setManagePassModal(null); setCancelConfirmMode(false); } }, Boolean(managePassModal));
  useEscapeKey(() => { setSelectedActivity(null); }, Boolean(selectedActivity));

  const bannerMainEvents = useMemo(() => {
    if (mainEventsList.length > 0) return mainEventsList;
    const parentActs = activitiesList.filter(a => String(a.id).startsWith("event-"));
    if (parentActs.length > 0) return parentActs;
    return [];
  }, [mainEventsList, activitiesList]);

  // Hero Banner Carousel & Live Countdown Ticker (Main Events only)
  const [heroBannerIndex, setHeroBannerIndex] = useState(0);
  const [isHeroBannerHovered, setIsHeroBannerHovered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => countdownFrom(null, null));

  // Auto-move hero banner every 4.5s (pauses on hover or when any modal/registration is open)
  useEffect(() => {
    if (
      bannerMainEvents.length <= 1 ||
      isHeroBannerHovered ||
      Boolean(selectedActivity) ||
      Boolean(managePassModal) ||
      Boolean(showAddMemberModal) ||
      Boolean(mobileQuickActionModal) ||
      Boolean(showQRPass)
    ) return;
    const timer = setInterval(() => {
      setHeroBannerIndex((prev) => (prev + 1) % bannerMainEvents.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [
    bannerMainEvents.length,
    isHeroBannerHovered,
    selectedActivity,
    managePassModal,
    showAddMemberModal,
    mobileQuickActionModal,
    showQRPass,
  ]);

  const activeMainEvent = bannerMainEvents[Math.min(heroBannerIndex, Math.max(0, bannerMainEvents.length - 1))] || null;

  const eventSubActivities = useMemo(() => {
    if (!activeMainEvent || activeMainEvent.isStandalonePooja) return [];
    const activeIdClean = String(activeMainEvent.id).replace(/^event-/, "");
    return activitiesList.filter((a) => {
      // Exclude the parent main event itself
      if (
        a.id === `event-${activeMainEvent.id}` ||
        a.id === String(activeMainEvent.id) ||
        a.title?.trim().toLowerCase() === activeMainEvent.title?.trim().toLowerCase()
      ) {
        return false;
      }
      // Check mainEventId linkage
      if (a.mainEventId != null) {
        const aMidClean = String(a.mainEventId).replace(/^event-/, "");
        if (aMidClean === activeIdClean) {
          return true;
        }
      }
      if ((a as any)?.eventId != null) {
        const aEidClean = String((a as any).eventId).replace(/^event-/, "");
        if (aEidClean === activeIdClean) {
          return true;
        }
      }
      return false;
    });
  }, [activeMainEvent, activitiesList]);

  useEffect(() => {
    const targetDate = activeMainEvent?.startDate || activeMainEvent?.date || null;
    const targetTime = activeMainEvent?.startTime || activeMainEvent?.time || null;

    setTimeLeft(countdownFrom(targetDate, targetTime));
    const interval = setInterval(() => {
      setTimeLeft(countdownFrom(targetDate, targetTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeMainEvent]);

  const handlePrevHeroBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bannerMainEvents.length === 0) return;
    setHeroBannerIndex((prev) => (prev - 1 + bannerMainEvents.length) % bannerMainEvents.length);
  };

  const handleNextHeroBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bannerMainEvents.length === 0) return;
    setHeroBannerIndex((prev) => (prev + 1) % bannerMainEvents.length);
  };

  // Fetch activities & main events & dashboard metrics from live REST API
  const fetchLiveDataFromBackend = async () => {
    try {
      setLoadingApiData(true);
      const [allEvents, poojas, culturals, comps, meals, stats, allRegistrations, auctionItems] = await Promise.all([
        eventService.getAllEvents().catch(() => eventService.getUpcomingEvents()).catch(() => []),
        eventService.getPoojaSevas().catch(() => []),
        eventService.getCulturalEvents().catch(() => []),
        eventService.getCompetitions().catch(() => []),
        eventService.getLunchDinners().catch(() => []),
        eventService.getDashboardStats().catch(() => null),
        eventService.getAllRegistrations().catch(() => []),
        eventService.getAuctionItems().catch(() => []),
      ]);

      setLiveStats(stats);

      const getBookedCount = (actId: string, title?: string) => {
        if (!Array.isArray(allRegistrations)) return 0;
        const isPoojaAct = actId.startsWith("pooja-");
        const actIdNumeric = actId.replace(/\D/g, "");
        return allRegistrations
          .filter((r: any) => {
            if (!r || r.status === "CANCELLED") return false;
            if (r.activityId === actId) return true;
            // Flexible match for Pooja: backend may return numeric or prefixed activityId
            if (isPoojaAct && actIdNumeric) {
              const rStr = String(r.activityId ?? "");
              if (rStr === actIdNumeric || rStr === `pooja-${actIdNumeric}`) return true;
            }
            return Boolean(title && r.activityTitle &&
              r.activityTitle.trim().toLowerCase() === title.trim().toLowerCase());
          })
          .reduce((acc: number, r: any) => acc + (Number(r.devoteeCount) || 1), 0);
      };

      const fetchedActivities: Activity[] = [];

      // Collect cancelled event IDs and normalized titles
      const cancelledEventIds = new Set<string>();
      const cancelledEventTitles = new Set<string>();
      const activeEventIds = new Set<string>();

      if (allEvents && Array.isArray(allEvents)) {
        allEvents.forEach((ev: any) => {
          const isCancelled = String(ev.status || "").toUpperCase() === "CANCELLED";
          if (isCancelled) {
            if (ev.id != null) {
              cancelledEventIds.add(String(ev.id));
              cancelledEventIds.add(`event-${ev.id}`);
            }
            if (ev.title) {
              cancelledEventTitles.add(ev.title.trim().toLowerCase());
            }
          } else {
            if (ev.id != null) {
              activeEventIds.add(String(ev.id));
              activeEventIds.add(`event-${ev.id}`);
            }
          }
        });

        const running = allEvents.filter((ev: any) => String(ev.status || "").toUpperCase() !== "CANCELLED");
        running.forEach((ev: any) => {
          const initialCapacity = ev.capacity || ev.maxAttendees || 50;
          const booked = getBookedCount(`event-${ev.id}`, ev.title);
          fetchedActivities.push({
            id: `event-${ev.id}`,
            title: ev.title,
            category: ev.category || ev.type || "Pooja",
            date: ev.startDate ? String(ev.startDate) : "Upcoming",
            time: ev.startTime || "Morning",
            venue: ev.venue || ev.location || ev.city || ev.address || "",
            fee: ev.price ? Number(ev.price) : 0,
            availableSeats: Math.max(0, initialCapacity - booked),
            capacity: initialCapacity,
            maxAttendees: initialCapacity,
            slots: initialCapacity,
            seats: initialCapacity,
            ticketTypes: ev.ticketTypes,
            image: "📅",
            description: ev.description || "Community Parent Event",
          });
        });
      }

      const standalonePoojaEvents: any[] = [];

      if (poojas && Array.isArray(poojas)) {
        poojas.forEach((p: any) => {
          // Exclude if pooja itself is cancelled
          if (String(p.status || "").toUpperCase() === "CANCELLED") return;

          const isStandalone = (p.mainEventId == null || p.mainEventId === "" || p.mainEventId === 0) &&
                               (p.eventId == null || p.eventId === "" || p.eventId === 0);

          // Exclude if parent event is cancelled or not active
          if (!isStandalone && p.mainEventId != null) {
            const mid = String(p.mainEventId);
            if (cancelledEventIds.has(mid) || cancelledEventIds.has(`event-${mid}`)) {
              return;
            }
            if (allEvents && allEvents.length > 0 && !activeEventIds.has(mid) && !activeEventIds.has(`event-${mid}`)) {
              return;
            }
          }
          if (!isStandalone && p.eventId != null) {
            const eid = String(p.eventId);
            if (cancelledEventIds.has(eid) || cancelledEventIds.has(`event-${eid}`)) {
              return;
            }
            if (allEvents && allEvents.length > 0 && !activeEventIds.has(eid) && !activeEventIds.has(`event-${eid}`)) {
              return;
            }
          }
          if (!isStandalone && p.parentEventTitle && cancelledEventTitles.has(p.parentEventTitle.trim().toLowerCase())) {
            return;
          }

          const initialSlots = p.slots != null ? p.slots : 20;
          const booked = getBookedCount(`pooja-${p.id}`, p.name);
          const isMultiDay = Boolean(p.isMultiDay || (p.startDate && p.endDate && p.startDate !== p.endDate));

          const poojaAct: Activity = {
            id: `pooja-${p.id || Date.now()}`,
            title: p.name || p.title || "Pooja Seva",
            category: "Pooja",
            date: p.date ? String(p.date) : (p.startDate ? String(p.startDate) : "Upcoming"),
            startDate: p.startDate || p.date,
            endDate: p.endDate,
            isMultiDay,
            time: p.startTime ? `${p.startTime}` : (p.time || "Morning"),
            startTime: p.startTime,
            startTimes: p.startTimes,
            venue: p.mandap || p.venue || p.location || "",
            mandap: p.mandap,
            pandit: p.pandit,
            slots: p.slots,
            fee: p.isFree ? 0 : Number(p.fee || 501),
            isFree: p.isFree,
            availableSeats: Math.max(0, initialSlots - booked),
            image: "🪔",
            description: `Pandit: ${p.pandit || "Temple Priest"}. ${p.notes || ""}`,
            mainEventId: !isStandalone && p.mainEventId != null ? String(p.mainEventId) : undefined,
          };

          fetchedActivities.push(poojaAct);

          if (isStandalone) {
            standalonePoojaEvents.push({
              id: `pooja-${p.id}`,
              rawId: p.id,
              isStandalonePooja: true,
              title: p.name || p.title || "Pooja Seva",
              category: p.category || "Pooja & Seva",
              type: "Pooja & Seva",
              startDate: p.startDate || p.date || "Upcoming",
              endDate: p.endDate || p.startDate || p.date,
              startTime: p.startTime || p.time || "Morning",
              endTime: p.endTime,
              venue: p.mandap || p.venue || p.location || "",
              location: p.mandap || p.venue || p.location || "",
              mandap: p.mandap,
              pandit: p.pandit,
              isMultiDay,
              slots: p.slots,
              price: p.isFree ? 0 : Number(p.fee || 501),
              fee: p.isFree ? 0 : Number(p.fee || 501),
              isFree: p.isFree,
              coverImage: p.coverImage || p.imageUrl || "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1200&q=80",
              description: `Pandit: ${p.pandit || "Temple Priest"}. ${p.notes || p.description || "Sacred Pooja Seva Sankalpam"}${isMultiDay ? " (Multi-Day Booking)" : ""}`,
              attendees: booked,
              registrationCount: booked,
            });
          }
        });
      }

      const allRunning = allEvents ? allEvents.filter((ev: any) => String(ev.status || "").toUpperCase() !== "CANCELLED") : [];
      setMainEventsList([...allRunning, ...standalonePoojaEvents]);

      if (meals && Array.isArray(meals)) {
        meals.forEach((m: any) => {
          if (String(m.status || "").toUpperCase() === "CANCELLED") return;
          if (m.mainEventId != null) {
            const mid = String(m.mainEventId);
            if (cancelledEventIds.has(mid) || cancelledEventIds.has(`event-${mid}`)) return;
            if (allEvents && allEvents.length > 0 && !activeEventIds.has(mid) && !activeEventIds.has(`event-${mid}`)) return;
          }
          if (m.eventId != null) {
            const eid = String(m.eventId);
            if (cancelledEventIds.has(eid) || cancelledEventIds.has(`event-${eid}`)) return;
            if (allEvents && allEvents.length > 0 && !activeEventIds.has(eid) && !activeEventIds.has(`event-${eid}`)) return;
          }
          if (m.parentEventTitle && cancelledEventTitles.has(m.parentEventTitle.trim().toLowerCase())) return;

          const initialPlates = m.targetPlates != null ? m.targetPlates : 500;
          const booked = getBookedCount(`food-${m.id}`, m.name);
          fetchedActivities.push({
            id: `food-${m.id || Date.now()}`,
            title: m.name || "Community Mahaprasadam",
            category: "Food",
            date: m.date ? String(m.date) : "Upcoming",
            time: m.startTime && m.endTime ? `${m.startTime} - ${m.endTime}` : (m.startTime || "Afternoon / Evening"),
            venue: m.venue || m.diningHall || m.location || "",
            fee: m.isFree ? 0 : Number(m.fee || 50),
            availableSeats: Math.max(0, initialPlates - booked),
            image: "🍲",
            description: `Meal: ${m.mealType || "Bhojanam"}. Caterer: ${m.caterer || "Food Committee"}. Menu: ${Array.isArray(m.menuItems) ? m.menuItems.join(", ") : ""}. ${m.notes || ""}`,
          });
        });
      }

      if (culturals && Array.isArray(culturals)) {
        culturals.forEach((c: any) => {
          if (String(c.status || "").toUpperCase() === "CANCELLED") return;
          if (c.mainEventId != null) {
            const mid = String(c.mainEventId);
            if (cancelledEventIds.has(mid) || cancelledEventIds.has(`event-${mid}`)) return;
            if (allEvents && allEvents.length > 0 && !activeEventIds.has(mid) && !activeEventIds.has(`event-${mid}`)) return;
          }
          if (c.eventId != null) {
            const eid = String(c.eventId);
            if (cancelledEventIds.has(eid) || cancelledEventIds.has(`event-${eid}`)) return;
            if (allEvents && allEvents.length > 0 && !activeEventIds.has(eid) && !activeEventIds.has(`event-${eid}`)) return;
          }
          if (c.parentEventTitle && cancelledEventTitles.has(c.parentEventTitle.trim().toLowerCase())) return;

          const initialSeats = 30;
          const booked = getBookedCount(`cult-${c.id}`, c.name);
          fetchedActivities.push({
            id: `cult-${c.id || Date.now()}`,
            title: c.name || "Cultural Performance",
            category: "Cultural",
            date: c.date ? String(c.date) : "Upcoming",
            time: c.startTime || "Evening",
            venue: c.stage || c.venue || c.location || "",
            fee: 0,
            availableSeats: Math.max(0, initialSeats - booked),
            image: "🎭",
            description: `Category: ${c.category}. Type: ${c.perfType || "Group"}. Age: ${c.ageGroup || "All"}.`,
          });
        });
      }

      if (comps && Array.isArray(comps)) {
        comps.forEach((cm: any) => {
          if (String(cm.status || "").toUpperCase() === "CANCELLED") return;
          if (cm.mainEventId != null) {
            const mid = String(cm.mainEventId);
            if (cancelledEventIds.has(mid) || cancelledEventIds.has(`event-${mid}`)) return;
            if (allEvents && allEvents.length > 0 && !activeEventIds.has(mid) && !activeEventIds.has(`event-${mid}`)) return;
          }
          if (cm.eventId != null) {
            const eid = String(cm.eventId);
            if (cancelledEventIds.has(eid) || cancelledEventIds.has(`event-${eid}`)) return;
            if (allEvents && allEvents.length > 0 && !activeEventIds.has(eid) && !activeEventIds.has(`event-${eid}`)) return;
          }
          if (cm.parentEventTitle && cancelledEventTitles.has(cm.parentEventTitle.trim().toLowerCase())) return;

          const initialMax = cm.maxParticipants != null ? cm.maxParticipants : 50;
          const booked = getBookedCount(`comp-${cm.id}`, cm.name);
          fetchedActivities.push({
            id: `comp-${cm.id || Date.now()}`,
            title: cm.name || "Community Competition",
            category: "Competitions",
            date: cm.date ? String(cm.date) : "Upcoming",
            time: cm.startTime || "Morning",
            venue: cm.venue || cm.stage || cm.location || "",
            fee: cm.isFree ? 0 : Number(cm.fee || 100),
            availableSeats: Math.max(0, initialMax - booked),
            image: "🏆",
            description: `Category: ${cm.category}. Age Group: ${cm.ageGroup || "Open"}. Rules: ${cm.rules || ""}`,
          });
        });
      }

      if (auctionItems && Array.isArray(auctionItems)) {
        auctionItems.forEach((item: any) => {
          if (String(item.status || "").toUpperCase() === "CANCELLED") return;
          if (item.eventId != null) {
            const eid = String(item.eventId);
            if (cancelledEventIds.has(eid) || cancelledEventIds.has(`event-${eid}`)) return;
            if (allEvents && allEvents.length > 0 && !activeEventIds.has(eid) && !activeEventIds.has(`event-${eid}`)) return;
          }

          const currentBidNum = Number(item.currentBid) || 0;
          const basePriceNum = Number(item.basePrice) || 0;
          const displayPrice = currentBidNum > 0 ? currentBidNum : basePriceNum;

          fetchedActivities.push({
            id: `auction-${item.id || Date.now()}`,
            title: item.name || "Festival Auction Item",
            category: "Auction",
            date: item.status === "LIVE" ? "🔴 Live Bidding" : item.status === "CLOSED" ? "🏁 Closed" : "⏳ Upcoming Auction",
            time: item.status === "LIVE" ? "Bidding in Progress" : "Auction Floor",
            venue: item.eventTitle || item.venue || item.location || "",
            fee: displayPrice,
            availableSeats: item.status === "CLOSED" ? 0 : 1,
            image: item.imageEmoji || "🪔",
            description: `${item.description || "Holy festival fundraising auction."}${item.leaderName ? ` Highest Bid: ₹${displayPrice.toLocaleString("en-IN")} by ${item.leaderName} (${item.bidCount || 0} bids)` : ` Base Price: ₹${basePriceNum.toLocaleString("en-IN")}`}`,
            mainEventId: item.eventId != null ? String(item.eventId) : undefined,
            rawAuctionItem: item,
          });
        });
      }

      setActivitiesList(fetchedActivities);
    } catch (err) {
      console.warn("Failed to fetch live API events:", err);
      setActivitiesList([]);
    } finally {
      setLoadingApiData(false);
    }
  };

  // Load family members dynamically from database / mock
  // Load family members dynamically from database & include logged-in member
  const loadFamilyMembers = async () => {
    setLoadingFamily(true);

    const primaryDevotee: FamilyMember = {
      id: "self",
      name: user?.fullName || (user?.email ? user.email.split("@")[0] : "Primary Devotee"),
      relation: "Myself (Head)",
      age: user?.dateOfBirth
        ? Math.max(18, new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear())
        : 30,
      avatar: user?.gender === "Female" ? "👩" : "👨",
    };

    try {
      const dbMembers = await eventService.getFamilyMembers();
      if (Array.isArray(dbMembers) && dbMembers.length > 0) {
        const dummyNames = new Set([
          "Sunita Sharma", "Aarav Sharma", "Ananya Sharma",
          "Sandeep Verma", "Ananya Verma", "Rahul Verma", "Priya Verma"
        ]);
        const mapped: FamilyMember[] = dbMembers
          .filter((m: any) => m && m.name && !dummyNames.has(m.name.trim()))
          .map((m: any) => ({
            id: String(m.id ?? m.name),
            name: m.name,
            relation: m.relation || "Family",
            age: Number(m.age) || 25,
            avatar: m.avatar || "👤",
          }));

        // Filter out any duplicate self/primary entries from DB
        const additionalMembers = mapped.filter(
          (m) =>
            m.name.trim().toLowerCase() !== primaryDevotee.name.trim().toLowerCase() &&
            !m.relation.toLowerCase().includes("myself") &&
            !m.relation.toLowerCase().includes("head")
        );

        const combinedList = [primaryDevotee, ...additionalMembers];
        setFamilyMembers(combinedList);
        setSelectedMembers(combinedList.map((m) => m.id));
        setLoadingFamily(false);
        return;
      }
    } catch (err) {
      console.warn("Could not fetch family members from database API:", err);
    }

    // Default to the logged-in user as the primary devotee
    setFamilyMembers([primaryDevotee]);
    setSelectedMembers([primaryDevotee.id]);
    setLoadingFamily(false);
  };

  // Load User Passes dynamically from database API
  const loadUserPasses = async () => {
    try {
      const [liveRegs, allEvents] = await Promise.all([
        eventService.getMyRegistrations().catch(() => []),
        eventService.getAll().catch(() => []),
      ]);

      const eventsById = new Map<string, any>();
      const eventsByTitle = new Map<string, any>();
      (allEvents || []).forEach((ev: any) => {
        if (ev.id != null) eventsById.set(String(ev.id), ev);
        if (ev.title) eventsByTitle.set(ev.title.trim().toLowerCase(), ev);
      });

      const todayStr = new Date().toISOString().slice(0, 10);

      if (Array.isArray(liveRegs) && liveRegs.length > 0) {
        const mappedPasses: UserPass[] = liveRegs.map((r: any) => {
          let attendeeCount = Number(r.devoteeCount ?? r.membersCount ?? 0);
          if (!attendeeCount && r.membersJson) {
            try {
              const parsed = JSON.parse(r.membersJson);
              if (Array.isArray(parsed) && parsed.length > 0) attendeeCount = parsed.length;
            } catch {}
          }
          if (!attendeeCount && r.attendingDevotees) {
            try {
              const parsed = JSON.parse(r.attendingDevotees);
              if (Array.isArray(parsed) && parsed.length > 0) attendeeCount = parsed.length;
              else if (typeof r.attendingDevotees === "string") {
                const parts = r.attendingDevotees.split(",").map((s: string) => s.trim()).filter(Boolean);
                if (parts.length > 0) attendeeCount = parts.length;
              }
            } catch {
              const parts = String(r.attendingDevotees).split(",").map((s: string) => s.trim()).filter(Boolean);
              if (parts.length > 0) attendeeCount = parts.length;
            }
          }
          if (!attendeeCount) attendeeCount = 1;

          // Detect Pooja registrations — their eventId equals the seva's own numeric id (not a community
          // event id). If a community event shares that number (e.g. an old completed event), the lookup
          // would wrongly mark the Pooja pass as EXPIRED/CLOSED. Skip community-event cross-reference
          // for Pooja; their expiry is already handled by the slot date (r.eventDate) below.
          const isPooja = r.category === "Pooja" ||
                          String(r.passType || "").toLowerCase().includes("pooja") ||
                          String(r.activityId || "").startsWith("pooja-");

          // Cross-reference parent event
          const parentEvent = (r.mainEventId != null && !isPooja && eventsById.get(String(r.mainEventId))) ||
                              (r.eventId != null && !isPooja && eventsById.get(String(r.eventId))) ||
                              (r.eventName && !isPooja && eventsByTitle.get(r.eventName.trim().toLowerCase())) ||
                              (r.activityTitle && !isPooja && eventsByTitle.get(r.activityTitle.trim().toLowerCase())) ||
                              null;

          const regStatusStr = String(r.status || "").toUpperCase();
          const parentStatusStr = parentEvent ? String(parentEvent.status || "").toUpperCase() : "";

          const isCancelled = regStatusStr === "CANCELLED" ||
                              regStatusStr === "REJECTED" ||
                              r.isCancelled === true ||
                              parentStatusStr === "CANCELLED";

          const isClosed = regStatusStr === "CLOSED" ||
                           parentStatusStr === "CLOSED" ||
                           Boolean(parentEvent && isRegistrationClosed(parentEvent));

          let isExpired = false;
          if (parentEvent) {
            if (parentStatusStr === "COMPLETED" || parentStatusStr === "ARCHIVED") {
              isExpired = true;
            } else if (parentEvent.endDate && parentEvent.endDate < todayStr) {
              isExpired = true;
            } else if (parentEvent.startDate && !parentEvent.endDate && parentEvent.startDate < todayStr) {
              isExpired = true;
            }
          } else if (r.eventDate && r.eventDate < todayStr && !r.eventDate.includes("Upcoming")) {
            isExpired = true;
          }

          let finalStatus = "CONFIRMED";
          let statusReason = "Active Valid Entry E-Pass";

          if (isCancelled) {
            finalStatus = "CANCELLED";
            statusReason = parentStatusStr === "CANCELLED"
              ? "Event was cancelled by temple committee"
              : (r.cancellationReason || "Registration has been cancelled");
          } else if (isExpired) {
            finalStatus = "EXPIRED";
            statusReason = "Event has concluded (Expired Pass)";
          } else if (isClosed) {
            finalStatus = "CLOSED";
            statusReason = "Event registrations are now closed";
          } else if (regStatusStr === "PENDING APPROVAL" || regStatusStr === "PENDING") {
            finalStatus = "PENDING APPROVAL";
            statusReason = "Awaiting committee approval / verification";
          }

          const rawCat = String(r.category || "").toLowerCase();
          const rawActId = String(r.activityId || "");
          const isPoojaPass = rawCat.includes("pooja") ||
                              rawCat.includes("seva") ||
                              rawActId.startsWith("pooja-") ||
                              Boolean(r.scheduleId) ||
                              Boolean(r.poojaSlot);

          const isCompPass = rawCat.includes("competition") || rawActId.startsWith("comp-");
          const isCultPass = rawCat.includes("cultural") || rawActId.startsWith("cult-");
          const isFoodPass = rawCat.includes("food") || rawCat.includes("meal") || rawActId.startsWith("meal-") || rawActId.startsWith("food-");

          return {
            id: String(r.id),
            // activityId is stored as "pooja-5" or "event-1" or "5"
            activityId: r.activityId ? String(r.activityId) : undefined,
            category: isPoojaPass ? "Pooja" : isCompPass ? "Competitions" : isCultPass ? "Cultural" : isFoodPass ? "Food" : "General",
            // Canonical numeric-only id of the Pooja Seva strictly when it is an actual pooja registration
            poojaSevaId: isPoojaPass ? (rawActId.startsWith("pooja-") ? rawActId.replace(/^pooja-/, "") : (String(r.poojaSevaId || r.activityId || "").replace(/\D/g, "") || undefined)) : undefined,
            // Parent community event id (different from the pooja seva's own id)
            mainEventId: r.mainEventId != null ? String(r.mainEventId) : undefined,
            eventId: r.eventId ? String(r.eventId) : undefined,
            passType: r.passType || `${isPoojaPass ? "Pooja" : isCompPass ? "Competition" : isCultPass ? "Cultural" : isFoodPass ? "Food" : "Event"} Registration Pass`,
            title: r.activityTitle || r.eventName || (parentEvent ? parentEvent.title : "Community Event"),
            participantName: r.participantName || r.primaryName || "Devotee",
            phone: r.phone,
            flatNo: r.flatNo,
            devoteeCount: attendeeCount,
            attendingDevotees: r.attendingDevotees,
            gotram: r.gotram,
            regId: r.regCode || `MNA-2026-${r.id}`,
            date: r.eventDate || (parentEvent?.startDate ? String(parentEvent.startDate) : "Upcoming"),
            time: r.eventTime || (parentEvent?.startTime ? String(parentEvent.startTime) : "Scheduled"),
            venue: r.venue || (parentEvent?.location ? String(parentEvent.location) : "Community Venue"),
            status: finalStatus,
            isEventCancelled: isCancelled,
            isEventExpired: isExpired,
            isEventClosed: isClosed,
            statusReason,
            qrCodeUrl: r.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${r.regCode || r.id}`,
            bookingFee: r.bookingFee,
            paymentStatus: r.paymentStatus,
            paymentReceiptUrl: r.paymentReceiptUrl,
            transactionId: r.transactionId,
            paymentMethod: r.paymentMethod,
          };
        });
        setPassesList(mappedPasses);
        return;
      }
    } catch (err) {
      console.warn("Could not fetch user registrations from API:", err);
    }

    setPassesList([]);
  };

  useEffect(() => {
    fetchLiveDataFromBackend();
    loadFamilyMembers();
    loadUserPasses();

    const handleRegUpdate = () => {
      fetchLiveDataFromBackend();
      loadUserPasses();
    };

    window.addEventListener("mana_activities_updated", fetchLiveDataFromBackend);
    window.addEventListener("mana_event_created", fetchLiveDataFromBackend);
    window.addEventListener("mana_event_updated", fetchLiveDataFromBackend);
    window.addEventListener("mana_dashboard_updated", fetchLiveDataFromBackend);
    window.addEventListener("mana_registrations_updated", handleRegUpdate);
    window.addEventListener("mana_family_updated", loadFamilyMembers);

    return () => {
      window.removeEventListener("mana_activities_updated", fetchLiveDataFromBackend);
      window.removeEventListener("mana_event_created", fetchLiveDataFromBackend);
      window.removeEventListener("mana_event_updated", fetchLiveDataFromBackend);
      window.removeEventListener("mana_dashboard_updated", fetchLiveDataFromBackend);
      window.removeEventListener("mana_registrations_updated", handleRegUpdate);
      window.removeEventListener("mana_family_updated", loadFamilyMembers);
    };
  }, [user]);

  // Compute dynamic counters for Quick Actions
  const poojaCount = useMemo(() => activitiesList.filter((a) => a.category === "Pooja").length, [activitiesList]);
  const foodCount = useMemo(() => activitiesList.filter((a) => a.category === "Food").length, [activitiesList]);
  const culturalCount = useMemo(() => activitiesList.filter((a) => a.category === "Cultural").length, [activitiesList]);
  const compCount = useMemo(() => activitiesList.filter((a) => a.category === "Competitions").length, [activitiesList]);
  const auctionCount = useMemo(
    () => activitiesList.filter((a) => a.category?.toLowerCase() === "auction" || Boolean(a.rawAuctionItem)).length,
    [activitiesList]
  );

  const isPoojaActivity = (cat?: string) =>
    Boolean(cat && (cat.toLowerCase().includes("pooja") || cat.toLowerCase().includes("seva")));

  const activePasses = useMemo(() => {
    return passesList.filter((p) => {
      if (p.isEventCancelled || p.status === "CANCELLED") return false;
      if (p.isEventExpired || p.status === "EXPIRED") return false;
      if (p.isEventClosed || p.status === "CLOSED") return false;
      return p.status === "CONFIRMED" || p.status === "PENDING APPROVAL" || !p.status;
    });
  }, [passesList]);

  const cancelledPasses = useMemo(() => {
    return passesList.filter((p) => p.isEventCancelled || p.status === "CANCELLED");
  }, [passesList]);

  const expiredPasses = useMemo(() => {
    return passesList.filter((p) => (p.isEventExpired || p.status === "EXPIRED") && !p.isEventCancelled && p.status !== "CANCELLED");
  }, [passesList]);

  const closedPasses = useMemo(() => {
    return passesList.filter((p) => (p.isEventClosed || p.status === "CLOSED") && !p.isEventCancelled && p.status !== "CANCELLED" && !p.isEventExpired);
  }, [passesList]);

  const displayedPasses = useMemo(() => {
    let list = passesList;
    if (passesFilter === "ACTIVE") list = activePasses;
    else if (passesFilter === "CANCELLED") list = cancelledPasses;
    else if (passesFilter === "EXPIRED") list = expiredPasses;
    else if (passesFilter === "CLOSED") list = closedPasses;

    if (!passesSearch.trim()) return list;
    const q = passesSearch.trim().toLowerCase();
    return list.filter((p) =>
      (p.title || "").toLowerCase().includes(q) ||
      (p.participantName || "").toLowerCase().includes(q) ||
      (p.regId || "").toLowerCase().includes(q) ||
      (p.gotram || "").toLowerCase().includes(q) ||
      (p.passType || "").toLowerCase().includes(q)
    );
  }, [passesList, passesFilter, activePasses, cancelledPasses, expiredPasses, closedPasses, passesSearch]);

  const displayedMobilePasses = useMemo(() => {
    if (mobilePassesFilter === "ACTIVE") return activePasses;
    if (mobilePassesFilter === "CANCELLED") return cancelledPasses;
    if (mobilePassesFilter === "EXPIRED") return expiredPasses;
    return passesList;
  }, [passesList, mobilePassesFilter, activePasses, cancelledPasses, expiredPasses]);

  const dynamicQuickActions = useMemo(() => {
    const volunteerBadge =
      liveStats?.totalVolunteers !== undefined && liveStats.totalVolunteers > 0
        ? `${liveStats.totalVolunteers} Duties`
        : "0 Duties";

    const donateBadge =
      liveStats?.totalRevenue !== undefined && liveStats.totalRevenue > 0
        ? `₹${liveStats.totalRevenue.toLocaleString()} Raised`
        : "₹0 Raised";

    const foodBadge =
      foodCount > 0
        ? `${foodCount} Meal Slot${foodCount === 1 ? "" : "s"}`
        : liveStats?.foodPlatesCount !== undefined && liveStats.foodPlatesCount > 0
        ? `${liveStats.foodPlatesCount.toLocaleString()} Plates`
        : "0 Served";

    const liveAuctionCount = activitiesList.filter(
      (a) => a.rawAuctionItem?.status === "LIVE"
    ).length;

    const upcomingAuctionCount = activitiesList.filter(
      (a) => a.rawAuctionItem?.status === "UPCOMING"
    ).length;

    const auctionBadge =
      liveAuctionCount > 0
        ? `${liveAuctionCount} Live Item${liveAuctionCount === 1 ? "" : "s"}`
        : upcomingAuctionCount > 0
        ? `${upcomingAuctionCount} Upcoming`
        : liveStats?.auctionRevenue !== undefined && liveStats.auctionRevenue > 0
        ? `₹${liveStats.auctionRevenue.toLocaleString()} Bid`
        : "0 Items";

    const actions = [
      {
        id: "pooja",
        label: "Pooja & Seva",
        icon: Flame,
        color: "bg-amber-500/10 text-amber-600 border-amber-300/30",
        badge: poojaCount > 0 ? `${poojaCount} Live Slot${poojaCount === 1 ? "" : "s"}` : "0 Slots",
        category: "Pooja",
      },
      {
        id: "lunchDinner",
        label: "Lunch / Dinner",
        icon: Utensils,
        color: "bg-orange-500/10 text-orange-600 border-orange-300/30",
        badge: foodBadge,
        category: "Food",
      },
      {
        id: "cultural",
        label: "Cultural",
        icon: Music,
        color: "bg-purple-500/10 text-purple-600 border-purple-300/30",
        badge: culturalCount > 0 ? `${culturalCount} Stage Show${culturalCount === 1 ? "" : "s"}` : "0 Shows",
        category: "Cultural",
      },
      {
        id: "family",
        label: "Family Members",
        icon: Users,
        color: "bg-blue-500/10 text-blue-600 border-blue-300/30",
        badge: `${familyMembers.length} Member${familyMembers.length === 1 ? "" : "s"}`,
        action: "family",
      },
      {
        id: "passes",
        label: "My Passes",
        icon: Ticket,
        color: "bg-indigo-500/10 text-indigo-600 border-indigo-300/30",
        badge: `${activePasses.length} Active`,
        action: "passes",
      },
      {
        id: "volunteer",
        label: "Volunteer",
        icon: ShieldCheck,
        color: "bg-emerald-500/10 text-emerald-600 border-emerald-300/30",
        badge: volunteerBadge,
        category: "Volunteer",
      },
      {
        id: "donate",
        label: "Donate Seva",
        icon: Heart,
        color: "bg-rose-500/10 text-rose-600 border-rose-300/30",
        badge: donateBadge,
        category: "Donation",
      },
      {
        id: "auction",
        label: "Auction",
        icon: Gavel,
        color: "bg-cyan-500/10 text-cyan-600 border-cyan-300/30",
        badge: auctionBadge,
        category: "Auction",
      },
    ];

    return actions;
  }, [poojaCount, foodCount, culturalCount, compCount, auctionCount, familyMembers.length, activePasses.length, liveStats, activitiesList]);

  /**
   * Safe matching between an Activity and user's booked Passes list.
   * Prevents ID collision between different types (e.g. comp-1 vs pooja-1).
   */
  const getExistingPassForActivity = (act: Activity): UserPass | undefined => {
    if (!activePasses || activePasses.length === 0) return undefined;

    const actIdStr = String(act.id || "").trim();
    const actIdNumeric = actIdStr.replace(/\D/g, "");
    const isActPooja = isPoojaActivity(act.category) || actIdStr.startsWith("pooja-");
    const isActComp = act.category?.toLowerCase().includes("competition") || actIdStr.startsWith("comp-");
    const isActCult = act.category?.toLowerCase().includes("cultural") || actIdStr.startsWith("cult-");
    const isActFood = act.category?.toLowerCase().includes("food") || act.category?.toLowerCase().includes("meal") || actIdStr.startsWith("meal-") || actIdStr.startsWith("food-");
    const isMainEvent = actIdStr.startsWith("event-") || (!isActPooja && !isActComp && !isActCult && !isActFood);
    const cleanActTitle = (act.title || "").trim().toLowerCase();
    const actMainEventId = act.mainEventId ? String(act.mainEventId).replace(/\D/g, "") : null;

    return activePasses.find((p) => {
      if (p.status === "CANCELLED" || p.isEventCancelled || p.isEventExpired) return false;

      const passActIdStr = String(p.activityId || "").trim();
      const passActIdNumeric = passActIdStr.replace(/\D/g, "");
      const passPoojaIdStr = p.poojaSevaId ? String(p.poojaSevaId).trim() : "";
      const passCatLower = String(p.category || "").toLowerCase();
      const passTypeLower = String(p.passType || "").toLowerCase();

      const isPassPooja = isPoojaActivity(p.category) ||
                          isPoojaActivity(p.passType) ||
                          passActIdStr.startsWith("pooja-") ||
                          (Boolean(p.poojaSevaId) && (passCatLower.includes("pooja") || passTypeLower.includes("pooja")));

      const isPassComp = p.category?.toLowerCase().includes("competition") || passActIdStr.startsWith("comp-");
      const isPassCult = p.category?.toLowerCase().includes("cultural") || passActIdStr.startsWith("cult-");
      const isPassFood = p.category?.toLowerCase().includes("meal") || p.category?.toLowerCase().includes("food") || passActIdStr.startsWith("meal-") || passActIdStr.startsWith("food-");
      const isPassMainEvent = passActIdStr.startsWith("event-") || (!isPassPooja && !isPassComp && !isPassCult && !isPassFood);
      const cleanPassTitle = (p.title || "").trim().toLowerCase();
      const passMainEventId = p.mainEventId ? String(p.mainEventId).replace(/\D/g, "") : (p.eventId ? String(p.eventId).replace(/\D/g, "") : null);

      // ── Category Check 1: POOJA ACTIVITY ──
      if (isActPooja) {
        // A Pooja activity MUST ONLY match a Pooja pass. NEVER a main event pass!
        if (!isPassPooja || isPassMainEvent) return false;

        // 1. Exact activityId (e.g. "pooja-1" === "pooja-1")
        if (passActIdStr && actIdStr && passActIdStr === actIdStr) {
          return true;
        }
        // 2. Canonical numeric ID when both are prefixed with pooja-
        if (actIdNumeric && passActIdNumeric && passActIdStr.startsWith("pooja-") && actIdStr.startsWith("pooja-")) {
          return actIdNumeric === passActIdNumeric;
        }
        // 3. poojaSevaId match
        if (passPoojaIdStr && actIdNumeric && passPoojaIdStr === actIdNumeric) {
          return true;
        }
        // 4. Exact Title match
        if (cleanPassTitle && cleanActTitle && cleanPassTitle === cleanActTitle) {
          if (actMainEventId && passMainEventId) {
            return actMainEventId === passMainEventId;
          }
          return true;
        }
        return false;
      }

      // ── Category Check 2: MAIN EVENT ACTIVITY ──
      if (isMainEvent) {
        if (!isPassMainEvent || isPassPooja || isPassComp || isPassCult || isPassFood) return false;
        if (passActIdStr && actIdStr && passActIdStr === actIdStr) return true;
        if (actIdNumeric && passActIdNumeric && actIdNumeric === passActIdNumeric) return true;
        if (actIdNumeric && passMainEventId && actIdNumeric === passMainEventId) return true;
        if (cleanPassTitle && cleanActTitle && cleanPassTitle === cleanActTitle) return true;
        return false;
      }

      // ── Category Check 3: COMPETITIONS ──
      if (isActComp) {
        if (!isPassComp) return false;
        if (passActIdStr && actIdStr && passActIdStr === actIdStr) return true;
        if (actIdNumeric && passActIdNumeric && actIdNumeric === passActIdNumeric) return true;
        if (cleanPassTitle && cleanActTitle && cleanPassTitle === cleanActTitle) return true;
        return false;
      }

      // ── Category Check 4: CULTURAL ──
      if (isActCult) {
        if (!isPassCult) return false;
        if (passActIdStr && actIdStr && passActIdStr === actIdStr) return true;
        if (actIdNumeric && passActIdNumeric && actIdNumeric === passActIdNumeric) return true;
        if (cleanPassTitle && cleanActTitle && cleanPassTitle === cleanActTitle) return true;
        return false;
      }

      // ── Category Check 5: FOOD / MEALS ──
      if (isActFood) {
        if (!isPassFood) return false;
        if (passActIdStr && actIdStr && passActIdStr === actIdStr) return true;
        if (actIdNumeric && passActIdNumeric && actIdNumeric === passActIdNumeric) return true;
        if (cleanPassTitle && cleanActTitle && cleanPassTitle === cleanActTitle) return true;
        return false;
      }

      return false;
    });
  };

  /**
   * Helper to check if current user is registered for a parent main event.
   * Standalone poojas (targetMainEventId is null or undefined) return true.
   */
  const isMainEventRegistered = (targetMainEventId?: string | number | null): boolean => {
    if (!targetMainEventId) return true;
    const targetIdStr = String(targetMainEventId).replace(/\D/g, "");
    if (!targetIdStr) return true;

    // 1. Check in active passes for main event pass
    const hasPass = activePasses.some((p) => {
      if (p.status === "CANCELLED" || p.isEventCancelled || p.isEventExpired) return false;
      const passActIdStr = String(p.activityId || "").trim();
      const passActIdNumeric = passActIdStr.replace(/\D/g, "");
      const passCatLower = String(p.category || "").toLowerCase();
      const passTypeLower = String(p.passType || "").toLowerCase();

      const isPassPooja = isPoojaActivity(p.category) || isPoojaActivity(p.passType) || passActIdStr.startsWith("pooja-");
      const isPassComp = p.category?.toLowerCase().includes("competition") || passActIdStr.startsWith("comp-");
      const isPassCult = p.category?.toLowerCase().includes("cultural") || passActIdStr.startsWith("cult-");
      const isPassFood = p.category?.toLowerCase().includes("meal") || p.category?.toLowerCase().includes("food") || passActIdStr.startsWith("meal-") || passActIdStr.startsWith("food-");
      const isPassMainEvent = passActIdStr.startsWith("event-") || passCatLower === "general" || (!isPassPooja && !isPassComp && !isPassCult && !isPassFood);

      if (isPassMainEvent) {
        const passMainEventId = p.mainEventId ? String(p.mainEventId).replace(/\D/g, "") : (p.eventId ? String(p.eventId).replace(/\D/g, "") : null);
        if (passActIdNumeric && passActIdNumeric === targetIdStr) return true;
        if (passMainEventId && passMainEventId === targetIdStr) return true;
      }
      return false;
    });

    if (hasPass) return true;

    // 2. Check in mainEventsList / bannerMainEvents
    const parentEvent = (mainEventsList || []).find((e) => String(e.id || (e as any).rawId).replace(/\D/g, "") === targetIdStr);
    if (parentEvent && (parentEvent.isRegistered || (parentEvent as any).hasRegistered)) {
      return true;
    }

    return false;
  };

  const handleOpenUpdateRegistration = (act: Activity, existingPass: UserPass) => {
    setSelectedActivity({
      ...act,
      isUpdateMode: true,
      registrationId: existingPass.id,
      existingRegistration: existingPass,
    } as any);
  };

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  };

  const handleDeleteFamilyMember = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id.startsWith("fam-") && id !== "self") {
      try {
        await eventService.deleteFamilyMember(Number(id));
      } catch (err: any) {
        showError(err?.message || "Failed to delete devotee");
        return;
      }
    }
    setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
    setSelectedMembers((prev) => prev.filter((mid) => mid !== id));
  };

  const handleAddFamilyMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name.trim()) return;

    const payload = {
      name: newMember.name.trim(),
      relation: newMember.relation,
      age: Number(newMember.age) || 18,
      avatar: newMember.avatar,
      status: "ACTIVE",
    };

    let createdId = "fam-" + Date.now();

    try {
      const saved = await eventService.addFamilyMember(payload);
      if (saved && saved.id) {
        createdId = String(saved.id);
      }
    } catch (err: any) {
      showError(err?.message || "Failed to add family member");
      return;
    }

    const createdMember: FamilyMember = {
      id: createdId,
      name: payload.name,
      relation: payload.relation,
      age: payload.age,
      avatar: payload.avatar,
    };

    const updatedList = [...familyMembers, createdMember];
    setFamilyMembers(updatedList);
    setSelectedMembers((prev) => [...prev, createdMember.id]);
    setNewMember({ name: "", relation: "Son", age: "", avatar: "👦" });
    setShowAddMemberModal(false);
  };

  // ── Open Manage Modal ──────────────────────────────────────────────────
  const openManageModal = (pass: UserPass) => {
    setManagePassModal(pass);
    setEditParticipantName(pass.participantName || "");
    setEditAttendeeCount(pass.devoteeCount || 1);
    setEditGotram(pass.gotram || "");
    setEditPhone(pass.phone || user?.phone || "");
    setEditFlatNo(pass.flatNo || (user?.block && user?.flatNo ? `${user.block}-${user.flatNo}` : user?.flatNo || ""));
    setCancelConfirmMode(false);
    setManageSuccess(null);
    setManageError(null);
  };

  // ── Update Registration ─────────────────────────────────────────────────
  const handleUpdateRegistration = async () => {
    if (!managePassModal) return;
    setIsSavingManage(true);
    setManageError(null);
    setManageSuccess(null);

    const numericId = typeof managePassModal.id === "number"
      ? managePassModal.id
      : Number(String(managePassModal.id).replace(/\D/g, ""));

    const updatedData = {
      primaryName: editParticipantName.trim() || managePassModal.participantName,
      participantName: editParticipantName.trim() || managePassModal.participantName,
      phone: editPhone.trim() || undefined,
      gotram: editGotram.trim() || undefined,
      flatNo: editFlatNo.trim() || undefined,
      devoteeCount: editAttendeeCount,
      membersCount: editAttendeeCount,
      attendingDevotees: managePassModal.attendingDevotees,
      eventDate: managePassModal.date,
      eventTime: managePassModal.time,
      venue: managePassModal.venue,
      bookingFee: managePassModal.bookingFee,
      paymentStatus: managePassModal.paymentStatus,
      status: managePassModal.status,
    };

    try {
      if (!isNaN(numericId) && numericId > 0) {
        await eventService.updateRegistration(numericId, updatedData);
      }

      // Optimistically update passes list
      setPassesList((prev) =>
        prev.map((p) =>
          p.id === managePassModal.id
            ? {
                ...p,
                participantName: updatedData.participantName,
                devoteeCount: editAttendeeCount,
                gotram: editGotram.trim() || p.gotram,
                phone: editPhone.trim() || p.phone,
                flatNo: editFlatNo.trim() || p.flatNo,
              }
            : p
        )
      );

      setManageSuccess("Registration updated successfully in Database!");
      setTimeout(() => {
        setManagePassModal(null);
        setManageSuccess(null);
        loadUserPasses();
        fetchLiveDataFromBackend();
      }, 1200);
    } catch (err: any) {
      console.error("Failed to update registration:", err);
      setManageError(err?.message || "Failed to update registration. Please try again.");
    } finally {
      setIsSavingManage(false);
    }
  };

  // ── Cancel Registration ─────────────────────────────────────────────────
  const handleCancelRegistration = async () => {
    if (!managePassModal) return;
    setIsSavingManage(true);
    setManageError(null);

    try {
      const numericId = typeof managePassModal.id === "number"
        ? managePassModal.id
        : Number(String(managePassModal.id).replace(/\D/g, ""));

      if (!isNaN(numericId) && numericId > 0) {
        await eventService.cancelRegistration(numericId);
      }

      // Remove from UI
      setPassesList((prev) => prev.filter((p) => p.id !== managePassModal.id));
      setManagePassModal(null);
      setCancelConfirmMode(false);
      // Refresh data from backend
      loadUserPasses();
      fetchLiveDataFromBackend();
    } catch (err: any) {
      console.error("Failed to cancel registration:", err);
      setManageError(err?.message || "Failed to cancel registration. Please try again.");
    } finally {
      setIsSavingManage(false);
    }
  };

  const handleBookingSubmit = async () => {
    if (isBookingSubmitting) return;
    if (!selectedActivity) return;
    setIsBookingSubmitting(true);
    try {
      const attendingNames = familyMembers
        .filter((f) => selectedMembers.includes(f.id))
        .map((f) => f.name)
        .join(", ");

      const attendeeLabel = attendingNames || user?.fullName || (user?.email ? user.email.split("@")[0] : "Devotee");
      const regCode = `MNA-2026-${(selectedActivity.category || "EVT").toUpperCase().slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`;

      const isPaid = (selectedActivity.fee || 0) > 0;
      const resolvedMainId: number | undefined = (() => {
        if (selectedActivity.mainEventId) {
          const n = Number(String(selectedActivity.mainEventId).replace(/\D/g, ""));
          if (!isNaN(n) && n > 0) return n;
        }
        if ((selectedActivity as any).eventId) {
          const n = Number(String((selectedActivity as any).eventId).replace(/\D/g, ""));
          if (!isNaN(n) && n > 0) return n;
        }
        if (activeMainEvent?.id) {
          const n = typeof activeMainEvent.id === "number" ? activeMainEvent.id : Number(String(activeMainEvent.id).replace(/\D/g, ""));
          if (!isNaN(n) && n > 0) return n;
        }
        return undefined;
      })();

      const passPayload = {
        regCode,
        activityId: selectedActivity.id,
        mainEventId: resolvedMainId,
        eventId: resolvedMainId,
        activityTitle: selectedActivity.title,
        category: selectedActivity.category,
        passType: `${selectedActivity.category} Registration Pass`,
        participantName: attendeeLabel,
        attendingDevotees: attendingNames,
        devoteeCount: Math.max(1, selectedMembers.length),
        eventDate: selectedActivity.date,
        eventTime: selectedActivity.time,
        venue: selectedActivity.venue,
        bookingFee: (selectedActivity.fee || 0) * Math.max(1, selectedMembers.length),
        paymentStatus: isPaid ? "PAID" : "FREE",
        paymentReceiptUrl: isPaid && paymentReceiptUrl ? paymentReceiptUrl : undefined,
        transactionId: isPaid && transactionId ? transactionId : undefined,
        paymentMethod: isPaid ? paymentMethod : undefined,
        status: "CONFIRMED",
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${regCode}`,
      };

      let createdId = "pass-" + Date.now();

      try {
        const isPooja = selectedActivity.category?.toLowerCase().includes("pooja");
        const saved = isPooja
          ? await eventService.createPoojaRegistration(passPayload as any)
          : await eventService.createRegistration(passPayload);
        if (saved && saved.id) {
          createdId = String(saved.id);
        }
      } catch (err: any) {
        showError(err?.response?.data?.message || err?.message || "Registration failed. The activity capacity has been reached.");
        return;
      }

      const newPass: UserPass = {
        id: createdId,
        passType: passPayload.passType,
        title: passPayload.activityTitle,
        participantName: passPayload.participantName,
        regId: regCode,
        date: passPayload.eventDate,
        time: passPayload.eventTime,
        venue: passPayload.venue,
        status: "CONFIRMED",
        qrCodeUrl: passPayload.qrCodeUrl,
        bookingFee: passPayload.bookingFee,
        paymentStatus: passPayload.paymentStatus,
        paymentReceiptUrl: passPayload.paymentReceiptUrl,
        transactionId: passPayload.transactionId,
        paymentMethod: passPayload.paymentMethod,
      };

      setPassesList((prev) => [newPass, ...prev]);
      showSuccess(`Registered for ${selectedActivity.title}. E-Pass issued to ${attendeeLabel}!`);
      setSelectedActivity(null);
      setPaymentReceiptUrl("");
      setTransactionId("");
      setActiveTab("passes");
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  const handleDownloadPDFPass = (pass: UserPass) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups in your browser to download/print the PDF E-Pass.");
      return;
    }

    const passHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>E-Pass Ticket - ${pass.regId}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .ticket-card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 2px solid #4f46e5; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(79, 70, 229, 0.12); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; padding: 28px 24px; text-align: center; position: relative; }
    .badge { display: inline-block; background: rgba(255,255,255,0.25); color: #ffffff; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.3); }
    .header h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; font-weight: 500; }
    .body-content { padding: 28px 24px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px; }
    .info-box { background: #f8fafc; padding: 14px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .info-box.full { grid-column: span 2; }
    .label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .value { font-size: 14px; font-weight: 800; color: #0f172a; word-break: break-word; }
    .value.highlight { color: #4f46e5; }
    .qr-container { text-align: center; background: #f1f5f9; padding: 24px; border-radius: 16px; border: 2px dashed #cbd5e1; margin: 10px 0; }
    .qr-code { width: 170px; height: 170px; margin: 0 auto; display: block; background: #ffffff; padding: 8px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .reg-code { font-family: monospace; font-size: 14px; font-weight: 900; color: #4f46e5; margin-top: 12px; letter-spacing: 0.5px; }
    .instructions { font-size: 11px; color: #64748b; margin-top: 6px; font-weight: 600; }
    .footer { border-top: 1px dashed #e2e8f0; padding: 16px 24px; background: #fafafa; text-align: center; }
    .status-stamp { font-size: 12px; font-weight: 900; color: #059669; text-transform: uppercase; letter-spacing: 0.5px; }
    .terms { font-size: 10.5px; color: #94a3b8; margin-top: 4px; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .ticket-card { box-shadow: none; border-color: #000000; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="ticket-card">
    <div class="header">
      <div class="badge">OFFICIAL GATE ENTRY E-PASS</div>
      <h1>Shree Ganesh Utsav 2026</h1>
      <p>Mana Community Executive Committee • Digital Verification Voucher</p>
    </div>
    <div class="body-content">
      <div class="info-grid">
        <div class="info-box">
          <div class="label">Pass Category</div>
          <div class="value highlight">${pass.passType}</div>
        </div>
        <div class="info-box">
          <div class="label">Event / Program</div>
          <div class="value">${pass.title}</div>
        </div>
        <div class="info-box">
          <div class="label">Devotee / Attendee</div>
          <div class="value">${pass.participantName}</div>
        </div>
        <div class="info-box">
          <div class="label">Date & Time</div>
          <div class="value">${pass.date} • ${pass.time}</div>
        </div>
        <div class="info-box full">
          <div class="label">Assigned Venue & Entry Gate</div>
          <div class="value">${pass.venue}</div>
        </div>
      </div>

      <div class="qr-container">
        <img src="${pass.qrCodeUrl}" class="qr-code" alt="Gate Verification QR Code" />
        <div class="reg-code">${pass.regId}</div>
        <div class="instructions">Present QR Code at Security Scanner Desk for instant entry & prasadam verification</div>
      </div>
    </div>
    <div class="footer">
      <div class="status-stamp">✓ CONFIRMED &amp; VALIDATED PASS</div>
      <div class="terms">Please keep a digital or printed PDF copy ready at gate entry. Non-transferable.</div>
    </div>
  </div>
  <div class="no-print" style="text-align: center; margin-top: 24px;">
    <button onclick="window.print()" style="padding: 12px 28px; background: linear-gradient(to right, #4f46e5, #7c3aed); color: #ffffff; border: none; border-radius: 12px; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
      🖨️ Print / Save as PDF
    </button>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>
    `;

    printWindow.document.write(passHtml);
    printWindow.document.close();
  };

  const filteredActivities = activitiesList.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.venue.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategoryFilter ? a.category === selectedCategoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full max-w-7xl mx-auto bg-card border border-border text-card-foreground font-sans rounded-xl overflow-hidden shadow-xs pb-20 md:pb-10 relative">
      <div className="p-2.5 sm:p-4 space-y-3 sm:space-y-4">
        {activeTab === "home" && (
          <>
            {/* Search & Filter Bar on Mobile - hidden as of now */}
            {/* <div className="md:hidden space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Pooja, Meals, Passes, Contests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted/70 focus:bg-background text-xs text-foreground placeholder:text-muted-foreground pl-9 pr-8 py-2.5 rounded-2xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div> */}

            {/* Hero Community Event Banner (Interactive Mobile Optimized) */}
            <div
              onMouseEnter={() => setIsHeroBannerHovered(true)}
              onMouseLeave={() => setIsHeroBannerHovered(false)}
              className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-sm transition-all duration-300 border border-indigo-900/20 group/herobanner"
              style={{
                background:
                  "linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(124, 58, 237) 50%, rgb(99, 102, 241) 100%)",
              }}
            >
              <div
                className="absolute inset-0 opacity-[0.07] pointer-events-none z-0"
                style={{
                  backgroundImage: "radial-gradient(circle, rgb(255, 255, 255) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
              <div
                className="absolute right-0 top-0 w-48 h-full rounded-full opacity-20 blur-3xl pointer-events-none z-0"
                style={{
                  background: "radial-gradient(circle, rgb(254, 243, 199) 0%, transparent 70%)",
                  transform: "translate(20%, -20%)",
                }}
              />
              <div className="relative z-10 p-2.5 sm:p-3.5 text-white space-y-2">
                {/* ── Line 1: 🔥 Main Event Category & Live Event Indicator with Embedded Nav Controls & Details ── */}
                <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto hide-scrollbar">
                  <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[9.5px] font-black bg-amber-400/25 text-amber-200 border border-amber-300/30 uppercase tracking-wider shadow-2xs whitespace-nowrap shrink-0">
                    🔥 {activeMainEvent?.category || activeMainEvent?.type || "Grand Festival"}
                  </span>
                  
                  {/* Live Event Badge with Embedded Nav Buttons */}
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/40 text-slate-200 text-[9px] sm:text-[9.5px] font-bold border border-white/15 backdrop-blur-xs whitespace-nowrap shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${bannerMainEvents.length > 0 ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
                    <span>{bannerMainEvents.length > 0 ? "Live Event" : "0 Events Available"}</span>
                    {bannerMainEvents.length > 1 && (
                      <div className="inline-flex items-center gap-1 bg-black/30 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/20 shrink-0 shadow-xs ml-0.5">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handlePrevHeroBanner(e); }}
                          className="w-5 h-5 rounded-full bg-white/80 hover:bg-white text-slate-900 hover:text-amber-600 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90"
                          title="Previous Event"
                        >
                          <ChevronLeft className="w-3 h-3 stroke-[2.5]" />
                        </button>
                        <span className="text-[9px] sm:text-[10px] font-black text-amber-300 tracking-wide select-none px-0.5">
                          {heroBannerIndex + 1}<span className="text-white/60 font-normal">/{bannerMainEvents.length}</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleNextHeroBanner(e); }}
                          className="w-5 h-5 rounded-full bg-white/80 hover:bg-white text-slate-900 hover:text-amber-600 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90"
                          title="Next Event"
                        >
                          <ChevronRight className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    )}
                  </span>

                  {activeMainEvent && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailedEvent(activeMainEvent);
                      }}
                      className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white text-[9px] sm:text-[9.5px] font-extrabold border border-white/30 backdrop-blur-md shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
                      title="View complete event information, sub-events, and schedule"
                    >
                      <Info className="w-3 h-3 text-amber-300" />
                      <span>Info</span>
                    </button>
                  )}
                  {(activeMainEvent?.attendees ?? activeMainEvent?.registrationCount) != null && (
                    <span className="text-[11px] font-semibold text-white/80 hidden sm:inline-flex items-center gap-1 shrink-0">
                      <Ticket className="w-3.5 h-3.5 text-indigo-200" /> {activeMainEvent.attendees ?? activeMainEvent.registrationCount ?? 0} registered
                    </span>
                  )}
                </div>

                {/* ── Line 2: Main Event name, image and date and other details ── */}
                <div className="min-w-0 bg-white/5 border border-white/10 rounded-lg p-2 sm:p-2.5">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    {(() => {
                      const eventImg =
                        activeMainEvent?.coverImage ||
                        activeMainEvent?.coverImageUrl ||
                        activeMainEvent?.imageUrl ||
                        (activeMainEvent as any)?.bannerUrl ||
                        (activeMainEvent as any)?.posterUrl;

                      return (
                        <div className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-lg shrink-0 shadow-xs overflow-hidden">
                          <span>🕉️</span>
                          {eventImg && (
                            <img
                              src={eventImg}
                              alt={activeMainEvent?.title || "Event Image"}
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                        </div>
                      );
                    })()}

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h2 className="text-sm sm:text-base font-black text-white leading-snug drop-shadow-sm truncate">
                        {bannerMainEvents.length > 0
                          ? (activeMainEvent?.title || "Community Event")
                          : "No Events Created Yet"}
                      </h2>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10.5px] font-medium text-white/90 overflow-hidden">
                        {(activeMainEvent?.startDate || activeMainEvent?.date) && (
                          <span className="flex items-center gap-1 shrink-0">
                            <Calendar className="w-3 h-3 text-amber-300 shrink-0" />
                            <span className="whitespace-nowrap">
                              {activeMainEvent?.startDate || activeMainEvent?.date}
                              {activeMainEvent?.endDate && activeMainEvent.endDate !== (activeMainEvent.startDate || activeMainEvent.date) ? ` – ${activeMainEvent.endDate}` : ""}
                            </span>
                          </span>
                        )}
                        {(activeMainEvent?.venue || activeMainEvent?.location || activeMainEvent?.city || activeMainEvent?.address) && (
                          <>
                            {(activeMainEvent?.startDate || activeMainEvent?.date) && <span className="text-white/40 shrink-0">·</span>}
                            <span className="flex items-center gap-1 truncate max-w-[140px] sm:max-w-[220px]">
                              <MapPin className="w-3 h-3 text-indigo-200 shrink-0" />
                              <span className="truncate">{activeMainEvent?.venue || activeMainEvent?.location || activeMainEvent?.city || activeMainEvent?.address}</span>
                            </span>
                          </>
                        )}
                        {(activeMainEvent?.startTime || activeMainEvent?.time) && (
                          <>
                            <span className="text-white/40 shrink-0">·</span>
                            <span className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                              <Clock className="w-3 h-3 text-amber-300 shrink-0" />
                              <span className="whitespace-nowrap">{activeMainEvent.startTime || activeMainEvent.time}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Sub-Events for this Main Community Event (Pooja Sevas, Cultural, Competitions, Mahaprasadam) ── */}
                {eventSubActivities.length > 0 && (
                  <div className="space-y-1.5 pt-0.5 animate-fade-in-up">
                    <button
                      type="button"
                      onClick={() => setShowHeroSubEvents(!showHeroSubEvents)}
                      className="w-full flex items-center justify-between px-2.5 sm:px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-xs transition-all cursor-pointer select-none text-left group shadow-xs active:scale-[0.99] gap-2"
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                        <span className="text-xs shrink-0">🪔</span>
                        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-200 truncate">
                          Sub-Events &amp; Sevas
                        </span>
                        <span className="shrink-0 text-[9px] sm:text-[9.5px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-xs border border-amber-300 flex items-center gap-1 leading-none">
                          <span>{eventSubActivities.length}</span>
                          <span>Available</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[9.5px] font-bold text-white/90 group-hover:text-white shrink-0">
                        <span className="hidden sm:inline">{showHeroSubEvents ? "Hide Sub-Events" : "Show Sub-Events"}</span>
                        <span className="sm:hidden">{showHeroSubEvents ? "Hide" : "View"}</span>
                        {showHeroSubEvents ? (
                          <ChevronUp className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        )}
                      </div>
                    </button>

                    {showHeroSubEvents && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 sm:max-h-64 overflow-y-auto pr-0.5 custom-scrollbar animate-fade-in-up">
                        {eventSubActivities.map((subAct) => {
                          const existingPass = getExistingPassForActivity(subAct);
                          const isClosed = isRegistrationClosed(subAct);
                          const catLower = subAct.category?.toLowerCase() || "";
                          const isPooja = catLower.includes("pooja") || catLower.includes("seva");
                          const isCultural = catLower.includes("cultural") || catLower.includes("dance") || catLower.includes("music") || catLower.includes("bhajan");
                          const isComp = catLower.includes("comp");
                          const isFood = catLower.includes("food") || catLower.includes("lunch") || catLower.includes("dinner") || catLower.includes("prasad");

                          const iconBadge = isPooja ? "🪔" : isCultural ? "🎭" : isComp ? "🏆" : isFood ? "🍲" : "✨";
                          const catBadgeBg = isPooja
                            ? "bg-amber-400/20 text-amber-200 border-amber-300/30"
                            : isCultural
                            ? "bg-purple-400/20 text-purple-200 border-purple-300/30"
                            : isComp
                            ? "bg-sky-400/20 text-sky-200 border-sky-300/30"
                            : "bg-emerald-400/20 text-emerald-200 border-emerald-300/30";

                          return (
                            <div
                              key={subAct.id}
                              className="p-2 sm:p-2.5 rounded-xl bg-black/35 hover:bg-black/45 border border-white/15 backdrop-blur-xs transition-all flex flex-col justify-between gap-1.5 group shadow-xs"
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs">{iconBadge}</span>
                                    <h4 className="text-xs font-bold text-white leading-tight truncate group-hover:text-amber-200 transition-colors">
                                      {subAct.title}
                                    </h4>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[9.5px] text-white/75 mt-0.5 flex-wrap">
                                    <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-bold border uppercase ${catBadgeBg}`}>
                                      {subAct.category || "Seva"}
                                    </span>
                                    <span className="flex items-center gap-0.5">
                                      <Calendar className="w-2.5 h-2.5 text-amber-300 shrink-0" />
                                      <span>{subAct.date}</span>
                                    </span>
                                    <span className="text-white/30">·</span>
                                    <span className="flex items-center gap-0.5">
                                      <Clock className="w-2.5 h-2.5 text-indigo-200 shrink-0" />
                                      <span>{subAct.time}</span>
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  {subAct.fee > 0 ? (
                                    <span className="text-[10.5px] font-black text-amber-300">₹{subAct.fee}</span>
                                  ) : (
                                    <span className="text-[9.5px] font-black text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-400/30">
                                      FREE
                                    </span>
                                  )}
                                </div>
                              </div>

                              {(() => {
                                const isMainReg = isMainEventRegistered(subAct.mainEventId || activeMainEvent?.id);

                                return (
                                  <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-white/10 text-[9.5px]">
                                    <span className="text-white/70 truncate flex items-center gap-1">
                                      <MapPin className="w-2.5 h-2.5 text-slate-300 shrink-0" />
                                      <span className="truncate max-w-[110px]">{subAct.venue || "Temple Mandap"}</span>
                                      {subAct.availableSeats != null && (
                                        <span className="text-amber-200/90 font-medium ml-1">({subAct.availableSeats} slots)</span>
                                      )}
                                    </span>

                                    {existingPass ? (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenUpdateRegistration(subAct, existingPass);
                                        }}
                                        className="px-2 py-0.5 text-[9.5px] font-black rounded-md bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-400/40 shadow-xs flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 transition-all"
                                      >
                                        <Edit3 className="w-2.5 h-2.5" />
                                        <span>Update Pass</span>
                                      </button>
                                    ) : isClosed ? (
                                      <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-white/10 text-white/60 border border-white/10 shrink-0">
                                        Closed
                                      </span>
                                    ) : isPooja && (subAct.mainEventId || activeMainEvent?.id) && !isMainReg ? (
                                      <button
                                        type="button"
                                        disabled
                                        className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-white/10 text-white/50 border border-white/15 shadow-none flex items-center gap-1 shrink-0 cursor-not-allowed"
                                        title="Main event registration is mandatory before booking this Pooja Seva"
                                      >
                                        <Lock className="w-2.5 h-2.5 text-amber-300" />
                                        <span>Main Pass Required</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedActivity(subAct);
                                        }}
                                        className="px-2.5 py-0.5 text-[9.5px] font-black rounded-md bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-xs flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 transition-all"
                                      >
                                        <Ticket className="w-2.5 h-2.5" />
                                        <span>{isPooja ? "Book Seva" : "Register"}</span>
                                      </button>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Line 3: Start Time & Registration Button ── */}
                <div className="flex items-center justify-between gap-2 sm:gap-3 pt-0.5">
                  {/* Left: Start Time / Countdown Ticker in single clean row */}
                  {bannerMainEvents.length > 0 ? (
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap sm:flex-nowrap">
                      <span className="text-[9px] font-bold text-white/80 uppercase tracking-wider whitespace-nowrap">
                        Starts in:
                      </span>
                      <div className="flex items-center gap-0.5 whitespace-nowrap">
                        {[
                          { val: timeLeft.days, unit: "d" },
                          { val: timeLeft.hours, unit: "h" },
                          { val: timeLeft.mins, unit: "m" },
                          { val: timeLeft.secs, unit: "s", amber: true },
                        ].map(({ val, unit, amber }, i) => (
                          <div key={unit} className="flex items-center">
                            <div className="flex items-baseline gap-0.5 bg-black/40 border border-white/15 px-1.5 py-0.5 rounded-md shadow-sm">
                              <span className={`font-mono text-xs font-black leading-none tracking-tight ${amber ? "text-amber-300 drop-shadow-xs" : "text-white"}`}>
                                {String(val).padStart(2, "0")}
                              </span>
                              <span className="text-[8px] font-extrabold text-white/70 uppercase leading-none">{unit}</span>
                            </div>
                            {i < 3 && <span className="text-white/60 font-black text-xs mx-0.5 mb-0.5">:</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] font-semibold text-white/70 italic">
                      No active timer
                    </div>
                  )}

                  {/* Right: Registration / Pass Button for Main Event */}
                  {bannerMainEvents.length > 0 && (() => {
                    const actForReg: Activity = activitiesList.find(a => a.id === `event-${activeMainEvent?.id}` || a.title === activeMainEvent?.title) || {
                      id: `event-${activeMainEvent?.id || 1}`,
                      title: activeMainEvent?.title || "Main Event",
                      category: activeMainEvent?.category || "Event",
                      date: activeMainEvent?.startDate ? String(activeMainEvent.startDate) : "Upcoming",
                      time: activeMainEvent?.startTime || "Morning",
                      venue: activeMainEvent?.venue || activeMainEvent?.location || "Community Center",
                      fee: activeMainEvent?.price ? Number(activeMainEvent.price) : 0,
                      availableSeats: activeMainEvent?.capacity || 100,
                      image: "📅",
                      description: activeMainEvent?.description || "Community Parent Event",
                    };
                    const existingPass = getExistingPassForActivity(actForReg);
                    const isClosed = isRegistrationClosed(actForReg);
                    if (isClosed && !existingPass) {
                      return (
                        <span className="ml-auto px-2.5 py-1 text-[10.5px] sm:text-[11px] font-bold rounded-lg bg-white/10 text-white/70 border border-white/20 whitespace-nowrap shrink-0 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Registration Closed
                        </span>
                      );
                    }
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          if (existingPass) {
                            handleOpenUpdateRegistration(actForReg, existingPass);
                          } else {
                            setSelectedActivity(actForReg);
                          }
                        }}
                        className={`ml-auto px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10.5px] sm:text-[11px] font-black rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                          existingPass
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-400/40"
                            : "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950"
                        }`}
                      >
                        {existingPass ? <Edit3 className="w-3.5 h-3.5" /> : <Ticket className="w-3.5 h-3.5" />}
                        <span>{existingPass ? "Update Pass" : "Register Pass"}</span>
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Dynamic Collapsible Family Members Section */}
            <div className="hidden sm:block bg-card border border-border rounded-2xl p-3 sm:p-4 shadow-xs space-y-3 transition-all">
              <div
                className="flex items-center justify-between cursor-pointer select-none group"
                onClick={() => setShowAddMemberModal(true)}
                title="Click to add new family member"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5 group-hover:text-primary transition-colors">
                      Family Members ({familyMembers.length})
                      <span className="text-[10px] text-muted-foreground font-normal hidden sm:inline">
                        (Click to add member)
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddMemberModal(true);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-[10.5px] sm:text-[11px] font-bold border border-primary/20 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add Family Member</span>
                    <span className="sm:hidden">Add</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFamily(!showFamily);
                    }}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                    title={showFamily ? "Collapse list" : "Expand list"}
                  >
                    {showFamily ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {showFamily && (
                <div>
                  {loadingFamily ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-xs text-muted-foreground border-t border-border">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>Loading registered family members...</span>
                    </div>
                  ) : familyMembers.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground border-t border-border">
                      No registered family members yet. Tap{" "}
                      <strong className="text-primary cursor-pointer underline" onClick={() => setShowAddMemberModal(true)}>
                        + Add Family Member
                      </strong>{" "}
                      to register members.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-border animate-fadeIn">
                      {familyMembers.map((member) => {
                        const isPrimary = member.id === "self" || member.relation.includes("Myself") || member.relation.includes("Head");
                        return (
                          <div
                            key={member.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                              isPrimary
                                ? "bg-primary/5 border-primary/30 shadow-2xs"
                                : "bg-muted/50 border-border/70 hover:border-primary/30"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-xl shrink-0">{member.avatar}</span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-bold text-foreground truncate">{member.name}</p>
                                  {isPrimary && (
                                    <span className="text-[8.5px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 px-1.5 py-0.2 rounded">
                                      You
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground font-medium truncate">
                                  {member.relation} • Age {member.age}
                                  {isPrimary && (user?.flatNo || user?.block) && ` • Flat ${user?.block ? `${user?.block}-` : ""}${user?.flatNo || ""}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md border ${
                                isPrimary
                                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
                                  : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                              }`}>
                                {isPrimary ? "Primary Member" : "Active"}
                              </span>
                              {!isPrimary && (
                                <button
                                  type="button"
                                  title="Remove family member"
                                  onClick={(e) => handleDeleteFamilyMember(member.id, e)}
                                  className="p-1 text-muted-foreground hover:text-rose-500 rounded-md transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Member Actions Grid (Horizontal Mobile Scroll + Grid) */}
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Quick Actions</span>
                </h3>
                {selectedCategoryFilter && (
                  <button
                    onClick={() => setSelectedCategoryFilter(null)}
                    className="text-[10px] sm:text-[10.5px] font-bold text-rose-600 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Clear: {selectedCategoryFilter}
                  </button>
                )}
              </div>

              {/* Mobile Swipeable / Desktop Responsive Touch Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                {dynamicQuickActions.map((action) => {
                  const Icon = action.icon;
                  const isSelected = selectedCategoryFilter === action.category;
                  return (
                    <button
                      key={action.id}
                      onClick={() => {
                        if (action.action === "family" || action.id === "family") {
                          setMobileModal("family");
                          return;
                        }
                        const isMobileScreen = typeof window !== "undefined" && window.innerWidth < 768;
                        if (isMobileScreen) {
                          setMobileQuickActionModal(action);
                        } else {
                          if (action.action === "passes") {
                            setActiveTab("passes");
                          } else if (action.category) {
                            setSelectedCategoryFilter(
                              selectedCategoryFilter === action.category ? null : action.category
                            );
                          }
                        }
                      }}
                      className={`flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all active:scale-95 sm:hover:scale-[1.03] text-center cursor-pointer shadow-2xs group select-none min-h-[95px] sm:min-h-[110px] ${
                        isSelected
                          ? "bg-primary/15 border-primary ring-2 ring-primary/30"
                          : "bg-card hover:bg-accent/10 border-border hover:border-primary/40"
                      }`}
                    >
                      {(() => {
                        const isPoojaAvailable = action.id === "pooja" && poojaCount > 0;
                        return (
                          <div
                            className={`relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl ${action.color} border flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform shrink-0 ${
                              isPoojaAvailable ? "ring-2 ring-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.35)]" : ""
                            }`}
                          >
                            {isPoojaAvailable && (
                              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 shadow-xs"></span>
                              </span>
                            )}
                            <Icon
                              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                isPoojaAvailable
                                  ? "animate-pulse text-amber-500 fill-amber-500/25 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]"
                                  : ""
                              }`}
                            />
                          </div>
                        );
                      })()}
                      <div className="w-full mt-1.5 space-y-0.5">
                        <span className="text-[10.5px] sm:text-xs font-black text-foreground leading-tight block truncate w-full">
                          {action.label}
                        </span>
                        <span className="text-[8.5px] sm:text-[9.5px] font-bold text-primary block truncate w-full">
                          {action.badge}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Featured Sevas & Events (Dynamic Filtered List - Hidden on mobile view, shown in Quick Actions modal) */}
            <div id="activities-grid-section" className="hidden sm:block space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
                  <Filter className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Scheduled Activities ({filteredActivities.length})</span>
                  {selectedCategoryFilter && (
                    <span className="text-[10px] sm:text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                      {selectedCategoryFilter}
                    </span>
                  )}
                </h3>
                {selectedCategoryFilter ? (
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter(null)}
                    className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Show All
                  </button>
                ) : activePasses.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab("passes")}
                    className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>My Active Passes ({activePasses.length})</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ) : (
                  <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5 hidden sm:inline-flex">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Schedule
                  </span>
                )}
              </div>

              {filteredActivities.length === 0 ? (
                <div className="p-6 sm:p-8 text-center bg-card border border-border rounded-2xl space-y-3 shadow-2xs">
                  <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-foreground">
                      {activitiesList.length === 0
                        ? "No Events or Activities Created Yet"
                        : "No activities found in this category."}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      {activitiesList.length === 0
                        ? "Events and seva activities will appear here once published by the organizers."
                        : "Try clearing your category filter to view other scheduled sevas."}
                    </p>
                  </div>
                  {selectedCategoryFilter && (
                    <button
                      onClick={() => setSelectedCategoryFilter(null)}
                      className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl cursor-pointer shadow-xs hover:bg-primary/90"
                    >
                      Show All Activities
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {filteredActivities.map((act) => (
                    <div
                      key={act.id}
                      className="bg-card rounded-2xl border border-border p-3.5 sm:p-4 flex gap-3 sm:gap-4 shadow-xs hover:shadow-md hover:border-primary/40 transition-all group"
                    >
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 text-2xl sm:text-3xl flex items-center justify-center shrink-0 border border-primary/20 shadow-2xs group-hover:scale-105 transition-transform">
                        {act.image}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-center justify-between text-[10px] sm:text-[10.5px]">
                            <span className="font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                              {act.category}
                            </span>
                            <span className={`font-bold text-[10px] ${act.availableSeats === 0 ? "text-red-500" : "text-muted-foreground"}`}>
                              {act.availableSeats === 0 ? "Registration Closed" : `${act.availableSeats} slots left`}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-black text-foreground mt-1 line-clamp-1">
                            {act.title}
                          </h4>
                          <p className="text-[10.5px] sm:text-[11px] text-muted-foreground font-medium mt-0.5">
                            {act.date} • {act.time}
                          </p>
                          <p className="text-[10.5px] sm:text-[11px] text-muted-foreground/80 mt-0.5 line-clamp-1">{act.venue}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="text-xs sm:text-sm font-mono font-black text-foreground">
                            {act.fee === 0 ? "FREE" : `₹${act.fee}`}
                          </span>
                          {(() => {
                            const existingPass = getExistingPassForActivity(act);
                            const isThisActPooja = isPoojaActivity(act.category);
                            const isClosed = isRegistrationClosed(act);
                            const isFull = act.availableSeats !== undefined && act.availableSeats <= 0;

                            if (existingPass) {
                              if (isThisActPooja) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenUpdateRegistration(act, existingPass)}
                                    className="px-3 py-1.5 sm:px-3.5 sm:py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95 border border-amber-500"
                                    title="Reschedule your booked pooja slot"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" /> Reschedule Slot
                                  </button>
                                );
                              }
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleOpenUpdateRegistration(act, existingPass)}
                                  className="px-3 py-1.5 sm:px-3.5 sm:py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95 border border-emerald-500"
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> Update Registration
                                </button>
                              );
                            }

                            if (isFull) {
                              return (
                                <span className="px-3 py-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-500/20 flex items-center gap-1.5 select-none">
                                  <AlertCircle className="w-3.5 h-3.5" /> Full / Sold Out
                                </span>
                              );
                            }
                            if (isClosed) {
                              return (
                                <span className="px-3 py-1.5 bg-muted text-muted-foreground text-xs font-bold rounded-xl border border-border flex items-center gap-1.5 select-none">
                                  <Clock className="w-3.5 h-3.5" /> Registration Closed
                                </span>
                              );
                            }
                            if (isThisActPooja && act.mainEventId) {
                              const isMainReg = isMainEventRegistered(act.mainEventId);
                              if (!isMainReg) {
                                return (
                                  <button
                                    type="button"
                                    disabled
                                    className="px-3 py-1.5 sm:px-3.5 sm:py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-not-allowed shadow-none"
                                    title="Registration for the main event is mandatory before booking this Pooja Seva. Please register for the main event first."
                                  >
                                    <Lock className="w-3.5 h-3.5 text-amber-500" /> Main Pass Required
                                  </button>
                                );
                              }
                            }

                            if (act.category?.toLowerCase() === "auction" || Boolean(act.rawAuctionItem)) {
                              const isLive = act.rawAuctionItem?.status === "LIVE";
                              const isClosed = act.rawAuctionItem?.status === "CLOSED";
                              if (isClosed) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedActivity(act)}
                                    className="px-3 py-1.5 sm:px-3.5 sm:py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                                  >
                                    <Trophy className="w-3.5 h-3.5 text-amber-500" /> View Winner
                                  </button>
                                );
                              }
                              return (
                                <button
                                  type="button"
                                  onClick={() => setSelectedActivity(act)}
                                  className="px-3 py-1.5 sm:px-3.5 sm:py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                                >
                                  <Gavel className="w-3.5 h-3.5" /> {isLive ? "Place Live Bid" : "View Auction"}
                                </button>
                              );
                            }

                            return (
                              <button
                                type="button"
                                onClick={() => setSelectedActivity(act)}
                                className="px-3 py-1.5 sm:px-3.5 sm:py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                              >
                                <Ticket className="w-3.5 h-3.5" /> Book / Register
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── PASSES VIEW TAB ─── */}
        {activeTab === "passes" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  My E-Passes &amp; Tokens
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    {activePasses.length} Active
                  </span>
                  {cancelledPasses.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
                      {cancelledPasses.length} Cancelled
                    </span>
                  )}
                  {expiredPasses.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {expiredPasses.length} Expired
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">Digital gate passes for venue entry, pooja sevas &amp; food tokens</p>
              </div>
              <button
                onClick={() => setActiveTab("home")}
                className="px-3 py-1.5 rounded-xl bg-muted text-foreground text-xs font-bold hover:bg-muted/80 transition-colors cursor-pointer w-fit"
              >
                ← Back to Dashboard
              </button>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setPassesFilter("ACTIVE")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    passesFilter === "ACTIVE"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Active Passes ({activePasses.length})
                </button>

                <button
                  type="button"
                  onClick={() => setPassesFilter("CANCELLED")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    passesFilter === "CANCELLED"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Event Cancelled ({cancelledPasses.length})
                </button>

                <button
                  type="button"
                  onClick={() => setPassesFilter("EXPIRED")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    passesFilter === "EXPIRED"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Expired / Concluded ({expiredPasses.length})
                </button>

                {closedPasses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPassesFilter("CLOSED")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      passesFilter === "CLOSED"
                        ? "bg-slate-700 text-white shadow-xs"
                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Closed ({closedPasses.length})
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setPassesFilter("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    passesFilter === "ALL"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  All ({passesList.length})
                </button>
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={passesSearch}
                  onChange={(e) => setPassesSearch(e.target.value)}
                  placeholder="Search passes..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-card border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {displayedPasses.length === 0 ? (
              <div className="p-8 text-center bg-card border border-border rounded-2xl space-y-3">
                <Ticket className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-bold text-foreground">
                  {passesFilter === "ACTIVE"
                    ? "No Active Passes"
                    : passesFilter === "CANCELLED"
                    ? "No Cancelled Passes"
                    : passesFilter === "EXPIRED"
                    ? "No Expired / Past Passes"
                    : "No Passes Found"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {passesFilter === "ACTIVE"
                    ? "Register for an upcoming Pooja, Cultural program, or Competition to generate your active digital entry pass."
                    : "Passes matching the selected criteria will appear here."}
                </p>
                {passesFilter === "ACTIVE" && (
                  <button
                    onClick={() => setActiveTab("home")}
                    className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Browse Events
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {displayedPasses.map((p) => {
                  const isCancelled = p.isEventCancelled || p.status === "CANCELLED";
                  const isExpired = (p.isEventExpired || p.status === "EXPIRED") && !isCancelled;
                  const isClosed = (p.isEventClosed || p.status === "CLOSED") && !isCancelled && !isExpired;

                  return (
                    <div
                      key={p.id}
                      className={`p-4 sm:p-5 rounded-2xl bg-card border shadow-xs space-y-3 flex flex-col justify-between transition-all ${
                        isCancelled
                          ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10"
                          : isExpired
                          ? "border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10"
                          : isClosed
                          ? "border-slate-300 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-border pb-2">
                          <div>
                            <span className="text-[10px] font-extrabold text-primary uppercase block">{p.passType}</span>
                            <h4 className="text-xs sm:text-sm font-bold text-foreground">{p.title}</h4>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {isCancelled ? (
                              <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black bg-rose-500/10 text-rose-600 border border-rose-500/20">
                                🚫 Event Cancelled
                              </span>
                            ) : isExpired ? (
                              <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                ⏰ Expired / Past
                              </span>
                            ) : isClosed ? (
                              <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black bg-slate-500/10 text-slate-600 border border-slate-500/20">
                                🔒 Closed
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                🟢 {p.status || "CONFIRMED"}
                              </span>
                            )}

                            {p.bookingFee && p.bookingFee > 0 ? (
                              <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                                ₹{p.bookingFee} ({p.paymentStatus || "PAID"})
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-slate-500/10 text-slate-600 border border-slate-500/20">
                                FREE
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Cancellation / Expiry Alert Banner */}
                        {isCancelled && (
                          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-[11px] space-y-0.5">
                            <p className="font-bold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              {p.statusReason || "Event or registration has been cancelled"}
                            </p>
                            <p className="text-[10px] text-rose-600/80">This pass is void and cannot be scanned at the venue gate.</p>
                          </div>
                        )}

                        {isExpired && (
                          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px]">
                            <p className="font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3 shrink-0" />
                              Event concluded on {p.date}. Pass archived.
                            </p>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Attendee: <strong className="text-foreground">{p.participantName}</strong></p>
                          <p>Date &amp; Time: <strong className="text-foreground">{p.date} • {p.time}</strong></p>
                          <p className="font-mono text-[10.5px] text-muted-foreground/80">Reg ID: {p.regId}</p>
                          {p.transactionId && (
                            <p className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                              Txn: {p.transactionId}
                            </p>
                          )}
                        </div>

                        {p.paymentReceiptUrl && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => setViewReceiptModal(p.paymentReceiptUrl!)}
                              className="text-[10.5px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer bg-primary/5 px-2 py-1 rounded-lg border border-primary/20 w-fit"
                            >
                              <Receipt className="w-3 h-3" /> View Payment Receipt
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => openManageModal(p)}
                          className="flex-1 py-2.5 bg-muted hover:bg-accent border border-border hover:border-primary/40 text-foreground text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95"
                        >
                          <Settings className="w-3.5 h-3.5" /> Details
                        </button>
                        <button
                          onClick={() => setShowQRPass(p)}
                          className={`flex-[2] py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs active:scale-95 ${
                            isCancelled
                              ? "bg-slate-700 hover:bg-slate-800 text-white"
                              : isExpired
                              ? "bg-amber-700 hover:bg-amber-800 text-white"
                              : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                          }`}
                        >
                          <QrCode className="w-4 h-4" /> {isCancelled ? "View Void Pass" : isExpired ? "View Archived Pass" : "View QR Pass"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── PAYMENT RECEIPT VIEWER MODAL ─── */}
      {viewReceiptModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setViewReceiptModal(null)}>
          <div className="bg-card border border-border text-card-foreground rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-3 animate-fadeIn relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-primary" /> Verified Payment Receipt
              </h3>
              <button onClick={() => setViewReceiptModal(null)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-muted rounded-xl p-2 max-h-[70vh] overflow-auto flex items-center justify-center">
              <img src={viewReceiptModal} alt="Payment Receipt" className="max-h-[60vh] max-w-full rounded-lg object-contain" />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setViewReceiptModal(null)}
                className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STICKY MOBILE BOTTOM NAVIGATION BAR ─── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-border px-3 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => {
            setMobileModal(null);
            setActiveTab("home");
            setSelectedCategoryFilter(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all cursor-pointer ${
            !mobileModal && activeTab === "home" && !selectedCategoryFilter ? "text-primary font-black scale-105" : "text-muted-foreground font-semibold"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[9.5px]">Home</span>
        </button>

        <button
          onClick={() => setMobileModal(mobileModal === "pooja" ? null : "pooja")}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all cursor-pointer relative ${
            mobileModal === "pooja" || (!mobileModal && selectedCategoryFilter === "Pooja") ? "text-amber-600 font-black scale-105" : "text-muted-foreground font-semibold"
          }`}
        >
          <Flame className={`w-4 h-4 ${poojaCount > 0 ? "animate-pulse text-amber-500 fill-amber-500/20" : ""}`} />
          <span className="text-[9.5px]">Pooja</span>
          {poojaCount > 0 && (
            <span className="absolute top-0.5 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          )}
        </button>

        <button
          onClick={() => setMobileModal(mobileModal === "meals" ? null : "meals")}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all cursor-pointer ${
            mobileModal === "meals" || (!mobileModal && selectedCategoryFilter === "Food") ? "text-orange-600 font-black scale-105" : "text-muted-foreground font-semibold"
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span className="text-[9.5px]">Meals</span>
        </button>

        <button
          onClick={() => setMobileModal(mobileModal === "passes" ? null : "passes")}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all cursor-pointer relative ${
            mobileModal === "passes" || (!mobileModal && activeTab === "passes") ? "text-indigo-600 font-black scale-105" : "text-muted-foreground font-semibold"
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span className="text-[9.5px]">Passes</span>
          {passesList.length > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-indigo-600"></span>
          )}
        </button>

        <button
          onClick={() => setMobileModal(mobileModal === "family" ? null : "family")}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all cursor-pointer ${
            mobileModal === "family" ? "text-rose-600 font-black scale-105" : "text-muted-foreground font-semibold"
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[9.5px]">Family</span>
          {familyMembers.length > 0 && (
            <span className="text-[8px] font-bold px-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              {familyMembers.length}
            </span>
          )}
        </button>
      </div>

      {/* ─── MOBILE POOJA & SEVA MODAL / BOTTOM SHEET ─── */}
      {mobileModal === "pooja" && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn cursor-pointer"
          onClick={() => setMobileModal(null)}
        >
          <div
            className="w-full max-w-lg bg-card border-t sm:border border-border text-card-foreground rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl animate-scaleUp max-h-[85vh] flex flex-col cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto -mt-1 mb-3 sm:hidden" />
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-foreground text-base flex items-center gap-2">
                    Pooja &amp; Seva Services
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200 dark:border-amber-800">
                      Live
                    </span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Book sankalpams, homams &amp; gotram sevas for family</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileModal(null)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-2xs"
                title="Close modal (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-3 flex-1 text-xs">
              {(() => {
                const poojaItems = activitiesList.filter(
                  (a) =>
                    a.category?.toLowerCase().includes("pooja") ||
                    a.category?.toLowerCase().includes("seva") ||
                    a.category?.toLowerCase().includes("spiritual") ||
                    a.title.toLowerCase().includes("pooja") ||
                    a.title.toLowerCase().includes("homam") ||
                    a.title.toLowerCase().includes("archana")
                );

                if (poojaItems.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground space-y-3">
                      <Flame className="w-8 h-8 mx-auto text-amber-500/60" />
                      <p className="font-semibold text-foreground">No specific pooja slots listed right now</p>
                      <button
                        onClick={() => {
                          setMobileModal(null);
                          setSelectedActivity({
                            id: "pooja-general",
                            title: "Community Festival Pooja & Seva Sankalpam",
                            category: "Pooja",
                            date: "Daily",
                            time: "Morning & Evening",
                            venue: "Main Utsav Mandap",
                            fee: 0,
                            availableSeats: 50,
                            image: "🪔",
                            description: "Special community festival pooja sankalpam and archana seva with family gotram.",
                          });
                        }}
                        className="px-4 py-2 bg-amber-600 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-600/20 cursor-pointer"
                      >
                        Register for Special Festival Pooja
                      </button>
                    </div>
                  );
                }

                return poojaItems.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-amber-50/30 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                          {p.category || "Pooja & Seva"}
                        </span>
                        <h4 className="font-bold text-foreground text-sm mt-1">{p.title}</h4>
                      </div>
                      <span className="font-black text-amber-700 dark:text-amber-300 text-xs shrink-0">
                        {p.fee === 0 || p.isFree ? "Free / Seva" : `₹${p.fee}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span className="truncate">{p.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        <span className="truncate">{p.venue}</span>
                      </div>
                    </div>

                    {p.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    )}

                    <button
                      onClick={() => {
                        setMobileModal(null);
                        setSelectedActivity(p);
                      }}
                      className="w-full py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-amber-600/20 cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5" /> Book Devotee Pooja Slot
                    </button>
                  </div>
                ));
              })()}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <button
                onClick={() => {
                  setMobileModal(null);
                  setActiveTab("home");
                  setSelectedCategoryFilter("Pooja");
                }}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
              >
                View all in main feed →
              </button>
              <button
                onClick={() => setMobileModal(null)}
                className="px-4 py-1.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MOBILE MEALS & ANNADANAM MODAL / BOTTOM SHEET ─── */}
      {mobileModal === "meals" && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn cursor-pointer"
          onClick={() => setMobileModal(null)}
        >
          <div
            className="w-full max-w-lg bg-card border-t sm:border border-border text-card-foreground rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl animate-scaleUp max-h-[85vh] flex flex-col cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto -mt-1 mb-3 sm:hidden" />
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-foreground text-base flex items-center gap-2">
                    Meals &amp; Annadanam
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 border border-orange-200 dark:border-orange-800">
                      Community Feast
                    </span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Lunch/Dinner feast schedules &amp; food counter tokens</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileModal(null)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-2xs"
                title="Close modal (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-3 flex-1 text-xs">
              {/* Daily Meal Schedule Summary */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-orange-50/50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">☀️ Maha Prasadam Lunch</p>
                  <p className="font-extrabold text-foreground text-xs">12:30 PM – 03:00 PM</p>
                  <p className="text-[10px] text-muted-foreground">Main Dining Hall, Counter A &amp; B</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">🌙 Evening Utsav Dinner</p>
                  <p className="font-extrabold text-foreground text-xs">07:30 PM – 10:30 PM</p>
                  <p className="text-[10px] text-muted-foreground">Dining Area, All Counters</p>
                </div>
              </div>

              {(() => {
                const foodItems = activitiesList.filter(
                  (a) =>
                    a.category?.toLowerCase().includes("food") ||
                    a.category?.toLowerCase().includes("meal") ||
                    a.category?.toLowerCase().includes("annadanam") ||
                    a.category?.toLowerCase().includes("feast") ||
                    a.title.toLowerCase().includes("lunch") ||
                    a.title.toLowerCase().includes("dinner") ||
                    a.title.toLowerCase().includes("prasadam") ||
                    a.title.toLowerCase().includes("food") ||
                    a.title.toLowerCase().includes("feast")
                );

                if (foodItems.length === 0) {
                  return (
                    <div className="p-4 rounded-2xl bg-card border border-border text-center space-y-2">
                      <p className="font-semibold text-foreground">Community Mahaprasadam Feast is Free for All Residents</p>
                      <p className="text-[11px] text-muted-foreground">Please show your festival member entry QR pass at the dining counter.</p>
                      <button
                        onClick={() => {
                          setMobileModal("passes");
                        }}
                        className="px-4 py-2 bg-orange-600 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                      >
                        View My Dining Entry Pass
                      </button>
                    </div>
                  );
                }

                return foodItems.map((f) => (
                  <div
                    key={f.id}
                    className="p-3.5 rounded-2xl bg-orange-50/30 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-foreground text-sm">{f.title}</h4>
                      <span className="font-black text-orange-600 text-xs shrink-0">
                        {f.fee === 0 || f.isFree ? "Free Feast" : `₹${f.fee}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-orange-600" />
                        <span className="truncate">{f.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-orange-600" />
                        <span className="truncate">{f.venue}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setMobileModal(null);
                        setSelectedActivity(f);
                      }}
                      className="w-full py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-orange-600/20 cursor-pointer"
                    >
                      <Utensils className="w-3.5 h-3.5" /> Reserve Meal Token for Family
                    </button>
                  </div>
                ));
              })()}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <button
                onClick={() => {
                  setMobileModal(null);
                  setActiveTab("home");
                  setSelectedCategoryFilter("Food");
                }}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
              >
                View all food events in feed →
              </button>
              <button
                onClick={() => setMobileModal(null)}
                className="px-4 py-1.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MOBILE PASSES & TICKETS MODAL / BOTTOM SHEET ─── */}
      {mobileModal === "passes" && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn cursor-pointer"
          onClick={() => setMobileModal(null)}
        >
          <div
            className="w-full max-w-lg bg-card border-t sm:border border-border text-card-foreground rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl animate-scaleUp max-h-[85vh] flex flex-col cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto -mt-1 mb-3 sm:hidden" />
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-foreground text-base flex items-center gap-2">
                    My Event Passes
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                      {activePasses.length} Active
                    </span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Digital QR passes for festival entry &amp; dining</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileModal(null)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-2xs"
                title="Close modal (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Filter Chips */}
            <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto scrollbar-none border-b border-border/60">
              <button
                type="button"
                onClick={() => setMobilePassesFilter("ACTIVE")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  mobilePassesFilter === "ACTIVE"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                Active ({activePasses.length})
              </button>
              {cancelledPasses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMobilePassesFilter("CANCELLED")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    mobilePassesFilter === "CANCELLED"
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  Cancelled ({cancelledPasses.length})
                </button>
              )}
              {expiredPasses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMobilePassesFilter("EXPIRED")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    mobilePassesFilter === "EXPIRED"
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  Expired ({expiredPasses.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => setMobilePassesFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  mobilePassesFilter === "ALL"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                All ({passesList.length})
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-3 flex-1 text-xs">
              {displayedMobilePasses.length === 0 ? (
                <div className="text-center py-10 space-y-3 text-muted-foreground">
                  <Ticket className="w-10 h-10 mx-auto text-muted-foreground/40" />
                  <p className="font-bold text-foreground">
                    {mobilePassesFilter === "ACTIVE" ? "No Active Passes Found" : "No Passes in this category"}
                  </p>
                  <p className="text-xs max-w-xs mx-auto">
                    {mobilePassesFilter === "ACTIVE"
                      ? "Register for festival events or poojas to receive your digital QR entry pass."
                      : "No passes match the current filter selection."}
                  </p>
                  {mobilePassesFilter === "ACTIVE" && (
                    <button
                      onClick={() => {
                        setMobileModal(null);
                        setActiveTab("home");
                      }}
                      className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                    >
                      Browse Festival Events
                    </button>
                  )}
                </div>
              ) : (
                displayedMobilePasses.map((pass) => {
                  const isCancelled = pass.isEventCancelled || pass.status === "CANCELLED";
                  const isExpired = (pass.isEventExpired || pass.status === "EXPIRED") && !isCancelled;

                  return (
                    <div
                      key={pass.id}
                      className={`p-4 rounded-2xl bg-card border shadow-sm space-y-2.5 relative overflow-hidden ${
                        isCancelled
                          ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10"
                          : isExpired
                          ? "border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 border border-indigo-200 dark:border-indigo-800">
                              {pass.passType || "Entry Pass"}
                            </span>
                            {isCancelled ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                                🚫 Cancelled
                              </span>
                            ) : isExpired ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                ⏰ Expired
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                🟢 {pass.status || "CONFIRMED"}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-foreground text-sm truncate">{pass.title}</h4>
                          <p className="text-[11px] text-muted-foreground font-mono">Pass #{pass.regId || pass.id}</p>
                        </div>

                        <button
                          onClick={() => {
                            setMobileModal(null);
                            setShowQRPass(pass);
                          }}
                          className={`p-2.5 rounded-xl shrink-0 cursor-pointer flex flex-col items-center gap-1 transition-all ${
                            isCancelled
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300"
                              : isExpired
                              ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 border border-amber-300"
                              : "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800"
                          }`}
                          title="Show QR Pass"
                        >
                          <QrCode className="w-5 h-5" />
                          <span className="text-[9px] font-bold">QR Pass</span>
                        </button>
                      </div>

                      {isCancelled && (
                        <p className="text-[10px] text-rose-600 font-medium">
                          ⚠️ {pass.statusReason || "Event or booking was cancelled"}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">Devotee</p>
                          <p className="font-semibold text-foreground truncate">{pass.participantName}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">Attendees</p>
                          <p className="font-semibold text-foreground">{pass.devoteeCount || 1} Member(s)</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <button
                onClick={() => {
                  setMobileModal(null);
                  setActiveTab("passes");
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                Open Full Passes Ledger →
              </button>
              <button
                onClick={() => setMobileModal(null)}
                className="px-4 py-1.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MOBILE FAMILY DIRECTORY MODAL / BOTTOM SHEET ─── */}
      {mobileModal === "family" && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn cursor-pointer"
          onClick={() => setMobileModal(null)}
        >
          <div
            className="w-full max-w-lg bg-card border-t sm:border border-border text-card-foreground rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl animate-scaleUp max-h-[85vh] flex flex-col cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto -mt-1 mb-3 sm:hidden" />
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-foreground text-base flex items-center gap-2">
                    My Household Family
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-800">
                      {familyMembers.length} Members
                    </span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Unified profile directory across Events &amp; Sports</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileModal(null)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-2xs"
                title="Close modal (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-2.5 flex-1 text-xs">
              {familyMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground space-y-2">
                  <Users className="w-8 h-8 mx-auto text-muted-foreground/40" />
                  <p className="font-semibold text-foreground">No family members added yet</p>
                  <p className="text-[11px]">Add your spouse, kids, and parents to register them for events with a single tap.</p>
                </div>
              ) : (
                familyMembers.map((member) => {
                  const isSelf = member.relation?.toLowerCase().includes("self") || member.relation?.toLowerCase().includes("head");
                  return (
                    <div
                      key={member.id}
                      className="p-3 rounded-2xl bg-muted/30 border border-border flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                          {member.avatar || member.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-foreground text-xs truncate">{member.name}</h4>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary uppercase">
                              {member.relation}
                            </span>
                            {member.age ? (
                              <span className="text-[10px] text-muted-foreground">{member.age} yrs</span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {!isSelf && (
                        <button
                          onClick={(e) => handleDeleteFamilyMember(member.id, e)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Remove member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setShowAddMemberModal(true);
                }}
                className="flex-1 py-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Family Member
              </button>
              <button
                onClick={() => setMobileModal(null)}
                className="px-4 py-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD FAMILY MEMBER MODAL (MOBILE BOTTOM-SHEET) ─── */}
      {showAddMemberModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 cursor-pointer"
          onClick={() => setShowAddMemberModal(false)}
        >
          <form
            onSubmit={handleAddFamilyMemberSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-card border-t sm:border border-border text-card-foreground rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto cursor-default"
          >
            {/* Mobile Drag Indicator */}
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto -mt-1 mb-2 sm:hidden" />

            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                Add Family Member
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-2xs"
                title="Close modal (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="Enter member's full name"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Relationship *
                  </label>
                  <select
                    value={newMember.relation}
                    onChange={(e) => setNewMember({ ...newMember, relation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Relative">Relative</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="110"
                    required
                    value={newMember.age}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e" || e.key === "+") e.preventDefault();
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsed = parseInt(val, 10);
                      const sanitized = isNaN(parsed) ? "" : String(Math.max(0, Math.min(110, parsed)));
                      setNewMember({ ...newMember, age: sanitized });
                    }}
                    placeholder="25"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Select Avatar Icon
                </label>
                <div className="flex items-center gap-2">
                  {["👤", "👩", "👦", "👧", "👨‍🦳", "👵"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewMember({ ...newMember, avatar: emoji })}
                      className={`text-xl p-2 rounded-xl border transition-transform cursor-pointer ${
                        newMember.avatar === emoji
                          ? "bg-primary/20 border-primary scale-110 shadow-xs"
                          : "bg-background border-border hover:bg-muted"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Save Family Member
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── EVENT REGISTRATION PORTAL WIZARD / DEDICATED POOJA REGISTRATION MODAL / AUCTION BID MODAL ─── */}
      {selectedActivity && (
        selectedActivity.category?.toLowerCase() === "auction" || Boolean(selectedActivity.rawAuctionItem) ? (
          <MemberAuctionBidModal
            activity={selectedActivity}
            onClose={() => {
              setSelectedActivity(null);
              fetchLiveDataFromBackend();
            }}
            onSuccess={() => {
              fetchLiveDataFromBackend();
            }}
          />
        ) : selectedActivity.category?.toLowerCase().includes("pooja") || selectedActivity.category?.toLowerCase().includes("seva") ? (
          <PoojaRegistrationModal
            event={{
              id: selectedActivity.id,
              title: selectedActivity.title,
              description: selectedActivity.description,
              category: selectedActivity.category,
              fee: selectedActivity.fee,
              isFree: selectedActivity.isFree,
              date: selectedActivity.date,
              startDate: selectedActivity.startDate || selectedActivity.date,
              endDate: selectedActivity.endDate,
              isMultiDay: selectedActivity.isMultiDay,
              time: selectedActivity.time,
              startTime: selectedActivity.startTime,
              startTimes: selectedActivity.startTimes,
              venue: selectedActivity.venue,
              mandap: selectedActivity.mandap || selectedActivity.venue,
              pandit: selectedActivity.pandit,
              availableSeats: selectedActivity.availableSeats || 24,
              slots: selectedActivity.slots,
              timeSlotConfig: (selectedActivity as any)?.timeSlotConfig,
              parentEventTitle: "Ganesh Utsav 2026",
              gotram: passesList.find((p) => p.gotram)?.gotram || (selectedActivity as any)?.gotram || (selectedActivity as any)?.existingRegistration?.gotram,
              notes: (selectedActivity as any)?.notes,
              samagri: (selectedActivity as any)?.samagri,
              existingRegistration: (selectedActivity as any)?.existingRegistration,
              registrationId: (selectedActivity as any)?.registrationId,
              isUpdateMode: (selectedActivity as any)?.isUpdateMode,
              // Pass parent community event id for correct deduplication scoping
              mainEventId: selectedActivity.mainEventId,
            }}
            isMainEventRegistered={isMainEventRegistered(selectedActivity.mainEventId)}
            onRegisterMainEvent={() => {
              const targetParentId = selectedActivity.mainEventId || activeMainEvent?.id;
              const parentEv = (mainEventsList || []).find((e) => String(e.id || (e as any).rawId).replace(/\D/g, "") === String(targetParentId).replace(/\D/g, "")) || activeMainEvent;
              if (parentEv) {
                setSelectedActivity({
                  id: `event-${parentEv.id}`,
                  title: parentEv.title,
                  category: "General",
                  date: String(parentEv.startDate || ""),
                  time: String(parentEv.startTime || ""),
                  venue: parentEv.location || (parentEv as any).venue || "",
                  fee: 0,
                  availableSeats: 500,
                  image: "🎉",
                  description: parentEv.description || "Community Parent Event",
                });
              }
            }}
            onClose={() => {
              setSelectedActivity(null);
              fetchLiveDataFromBackend();
              loadUserPasses();
            }}
            onSuccess={() => {
              // Optimistic slot decrement so the count drops immediately
              if (selectedActivity) {
                setActivitiesList((prev) =>
                  prev.map((a) =>
                    a.id === selectedActivity.id
                      ? { ...a, availableSeats: Math.max(0, (a.availableSeats ?? 1) - 1) }
                      : a
                  )
                );
                // Optimistic pass insertion so "Reschedule Slot" appears immediately
                const actIdStr = String(selectedActivity.id);
                const optimisticPass: UserPass = {
                  id: `optimistic-${Date.now()}`,
                  activityId: actIdStr,
                  poojaSevaId: actIdStr.replace(/\D/g, "") || undefined,
                  category: "Pooja",
                  passType: "Pooja Registration Pass",
                  title: selectedActivity.title,
                  participantName: user?.fullName || "Devotee",
                  regId: `MNA-POOJA-${Date.now()}`,
                  date: selectedActivity.date || "Upcoming",
                  time: selectedActivity.time || "Scheduled",
                  venue: selectedActivity.venue || "Temple",
                  status: "CONFIRMED",
                  qrCodeUrl: "",
                };
                setPassesList((prev) => [optimisticPass, ...prev]);
              }
              // Then refresh from backend to get confirmed data
              fetchLiveDataFromBackend();
              loadUserPasses();
            }}
          />
        ) : (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/70 backdrop-blur-md overflow-y-auto animate-fadeIn">
            <div className="w-full max-w-lg sm:max-w-xl md:max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 min-h-[85vh] sm:min-h-[640px] max-h-[94vh] flex flex-col justify-between overflow-y-auto animate-scaleUp">
              <EventRegistrationWizard
                event={{
                  id: selectedActivity.id,
                  title: selectedActivity.title,
                  description: selectedActivity.description,
                  category: selectedActivity.category,
                  price: selectedActivity.fee,
                  date: selectedActivity.date,
                  time: selectedActivity.time,
                  venue: selectedActivity.venue,
                  existingRegistration: (selectedActivity as any)?.existingRegistration,
                  registrationId: (selectedActivity as any)?.registrationId,
                  isUpdateMode: (selectedActivity as any)?.isUpdateMode,
                  availableSeats: selectedActivity.availableSeats,
                  capacity: (selectedActivity as any)?.capacity ?? (selectedActivity as any)?.maxAttendees ?? (selectedActivity as any)?.slots ?? (selectedActivity as any)?.seats ?? selectedActivity.availableSeats ?? 100,
                  maxAttendees: (selectedActivity as any)?.maxAttendees ?? (selectedActivity as any)?.capacity ?? (selectedActivity as any)?.slots ?? (selectedActivity as any)?.seats ?? selectedActivity.availableSeats ?? 100,
                  seats: (selectedActivity as any)?.seats ?? (selectedActivity as any)?.capacity ?? (selectedActivity as any)?.maxAttendees ?? (selectedActivity as any)?.slots ?? selectedActivity.availableSeats ?? 100,
                  ticketTypes: (selectedActivity as any)?.ticketTypes && (selectedActivity as any).ticketTypes.length > 0
                    ? (selectedActivity as any).ticketTypes
                    : [
                        {
                          id: `pass-${selectedActivity.id}`,
                          name: `${selectedActivity.title} Pass`,
                          price: selectedActivity.fee || "0",
                          qty: (selectedActivity as any)?.capacity ?? (selectedActivity as any)?.maxAttendees ?? (selectedActivity as any)?.slots ?? (selectedActivity as any)?.seats ?? selectedActivity.availableSeats ?? 100,
                          seats: (selectedActivity as any)?.seats ?? (selectedActivity as any)?.capacity ?? (selectedActivity as any)?.maxAttendees ?? (selectedActivity as any)?.slots ?? selectedActivity.availableSeats ?? 100,
                          description: selectedActivity.description || `Entry & seva pass for ${selectedActivity.title}`,
                        },
                      ],
                }}
                onClose={() => {
                  setSelectedActivity(null);
                  fetchLiveDataFromBackend();
                }}
              />
            </div>
          </div>
        )
      )}

      {/* ─── QR GATE PASS MODAL (DIGITAL PASS WALLET) ─── */}
      {showQRPass && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 cursor-pointer"
          onClick={() => setShowQRPass(null)}
        >
          <div
            className="w-full max-w-sm bg-card border-t sm:border border-border text-card-foreground rounded-t-3xl sm:rounded-2xl p-6 space-y-4 shadow-2xl text-center animate-fadeIn relative cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Indicator */}
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto -mt-2 mb-2 sm:hidden" />

            <button
              type="button"
              onClick={() => setShowQRPass(null)}
              className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors absolute right-4 top-4 shrink-0 shadow-2xs"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>

            {(() => {
              const isCancelled = showQRPass.isEventCancelled || showQRPass.status === "CANCELLED";
              const isExpired = (showQRPass.isEventExpired || showQRPass.status === "EXPIRED") && !isCancelled;
              const isClosed = (showQRPass.isEventClosed || showQRPass.status === "CLOSED") && !isCancelled && !isExpired;

              return (
                <>
                  <div className={`p-3 rounded-2xl inline-block shadow-2xs ${
                    isCancelled
                      ? "bg-rose-500/10 text-rose-600"
                      : isExpired
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-indigo-500/10 text-indigo-600"
                  }`}>
                    <QrCode className="w-8 h-8" />
                  </div>

                  <div>
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-primary">{showQRPass.passType}</span>
                      {isCancelled ? (
                        <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 border border-rose-200">
                          🚫 VOID / CANCELLED
                        </span>
                      ) : isExpired ? (
                        <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 border border-amber-200">
                          ⏰ EXPIRED PASS
                        </span>
                      ) : (
                        <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 border border-emerald-200">
                          🟢 ACTIVE &amp; VALID
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-foreground">{showQRPass.title}</h3>
                  </div>

                  {/* Status Banner */}
                  {isCancelled ? (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold text-left space-y-0.5">
                      <p className="font-bold flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        Pass is Invalid for Admission
                      </p>
                      <p className="text-[11px] text-rose-600/80">
                        {showQRPass.statusReason || "This event was cancelled. This QR code will be rejected at gate scanners."}
                      </p>
                    </div>
                  ) : isExpired ? (
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium text-left">
                      <p className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        This event concluded on {showQRPass.date}.
                      </p>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold text-left flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>Ready to scan at Festival Gate &amp; Food Counters</span>
                    </div>
                  )}

                  <div className={`p-4 bg-white rounded-2xl border inline-block shadow-sm relative ${
                    isCancelled ? "border-rose-300 opacity-60" : "border-slate-200"
                  }`}>
                    <img src={showQRPass.qrCodeUrl} alt="QR Gate Pass" className="w-40 h-40 mx-auto" />
                    {isCancelled && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-2xl">
                        <span className="px-3 py-1 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-lg shadow-lg rotate-[-12deg]">
                          CANCELLED
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Attendee: <strong className="text-foreground">{showQRPass.participantName}</strong></p>
                    <p className="font-mono text-[11px] text-primary font-bold">{showQRPass.regId}</p>
                    <p className="text-[11px]">{showQRPass.venue} • {showQRPass.date} ({showQRPass.time})</p>
                  </div>

                  <div className="space-y-2 pt-1">
                    {!isCancelled && (
                      <button
                        type="button"
                        onClick={() => {
                          handleDownloadPDFPass(showQRPass);
                          setShowQRPass(null);
                        }}
                        className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs active:scale-95"
                      >
                        <Download className="w-4 h-4" /> Download / Save PDF E-Pass
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowQRPass(null)}
                      className="w-full py-2 bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ─── QUICK ACTION MODAL (MOBILE VIEW ONLY - Pooja, Lunch/Meals, My Passes, Donate, Auction, Cultural, Competitions, Volunteers) ─── */}
      {mobileQuickActionModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setMobileQuickActionModal(null)}
        >
          <div
            className="w-full max-w-lg bg-card border-t sm:border border-border text-card-foreground rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xl animate-in slide-in-from-bottom-5 duration-200 max-h-[85vh] flex flex-col cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Indicator */}
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto -mt-1 mb-1 sm:hidden" />

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl ${mobileQuickActionModal.color} border flex items-center justify-center shadow-xs shrink-0`}>
                  {React.createElement(mobileQuickActionModal.icon, { className: "w-4 h-4" })}
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                    {mobileQuickActionModal.label}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {mobileQuickActionModal.badge}
                    </span>
                  </h3>
                  <p className="text-[10.5px] text-muted-foreground">
                    {mobileQuickActionModal.action === "passes"
                      ? "Your booked passes & entry tokens"
                      : `Available ${mobileQuickActionModal.label} bookings`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileQuickActionModal(null)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-2xs"
                title="Close modal (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto space-y-2.5 flex-1 pr-0.5 hide-scrollbar">
              {mobileQuickActionModal.action === "passes" ? (
                passesList.length === 0 ? (
                  <div className="py-8 text-center space-y-2 text-xs text-muted-foreground">
                    <Ticket className="w-8 h-8 mx-auto text-muted-foreground/50" />
                    <p className="font-bold text-foreground">No active passes yet</p>
                    <p className="text-[11px]">Book a seva or pooja slot to get your digital pass.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {passesList.map((pass) => (
                      <div
                        key={pass.id}
                        className="bg-muted/40 border border-border/80 rounded-xl p-3 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{pass.title}</p>
                          <p className="text-[10.5px] text-muted-foreground">
                            {pass.regId} • {pass.date}
                          </p>
                          <p className="text-[10px] text-primary font-semibold truncate">
                            {pass.participantName}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              openManageModal(pass);
                              setMobileQuickActionModal(null);
                            }}
                            className="px-2 py-1.5 bg-muted hover:bg-accent border border-border rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer text-foreground"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowQRPass(pass);
                              setMobileQuickActionModal(null);
                            }}
                            className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" /> View QR
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                (() => {
                  const matchingActivities = activitiesList.filter(
                    (a) =>
                      a.category?.toLowerCase() === mobileQuickActionModal.category?.toLowerCase() ||
                      a.title?.toLowerCase().includes(mobileQuickActionModal.category?.toLowerCase() || "")
                  );

                  if (matchingActivities.length === 0) {
                    return (
                      <div className="py-8 text-center space-y-2 text-xs text-muted-foreground">
                        <Calendar className="w-8 h-8 mx-auto text-muted-foreground/50" />
                        <p className="font-bold text-foreground">
                          No {mobileQuickActionModal.label} slots available currently
                        </p>
                        <p className="text-[11px]">New slots will appear once published by organizers.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategoryFilter(null);
                            setMobileQuickActionModal(null);
                          }}
                          className="mt-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl cursor-pointer"
                        >
                          View All Events
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2.5">
                      {matchingActivities.map((act) => (
                        <div
                          key={act.id}
                          className="bg-card border border-border/90 rounded-xl p-3 flex gap-3 shadow-2xs hover:border-primary/40 transition-all"
                        >
                          <div className="w-12 h-12 rounded-xl bg-primary/10 text-2xl flex items-center justify-center shrink-0 border border-primary/20">
                            {act.image}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-black uppercase text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                                  {act.category}
                                </span>
                                <span className={`font-semibold ${act.availableSeats === 0 ? "text-red-500" : "text-muted-foreground"}`}>
                                  {act.availableSeats === 0 ? "Closed" : `${act.availableSeats} slots`}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-foreground mt-0.5 truncate">{act.title}</h4>
                              <p className="text-[10px] text-muted-foreground">
                                {act.date} • {act.time}
                              </p>
                            </div>
                            <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-border/60">
                              <span className="text-xs font-mono font-black text-foreground">
                                {act.fee === 0 ? "FREE" : `₹${act.fee}`}
                              </span>
                              {(() => {
                                const existingPass = getExistingPassForActivity(act);
                                const isThisActPooja = isPoojaActivity(act.category);
                                const isClosed = isRegistrationClosed(act);
                                const isFull = act.availableSeats !== undefined && act.availableSeats <= 0;
                                if (existingPass) {
                                  if (isThisActPooja) {
                                    return (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMobileQuickActionModal(null);
                                          handleOpenUpdateRegistration(act, existingPass);
                                        }}
                                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1 border border-amber-500"
                                        title="Reschedule your booked pooja slot"
                                      >
                                        <RefreshCw className="w-3 h-3" /> Reschedule Slot
                                      </button>
                                    );
                                  }
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMobileQuickActionModal(null);
                                        handleOpenUpdateRegistration(act, existingPass);
                                      }}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1 border border-emerald-500"
                                    >
                                      <Edit3 className="w-3 h-3" /> Update Registration
                                    </button>
                                  );
                                }

                                if (isFull) {
                                  return (
                                    <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold rounded-lg border border-rose-500/20 flex items-center gap-1 select-none">
                                      <AlertCircle className="w-3 h-3" /> Full
                                    </span>
                                  );
                                }
                                if (isClosed) {
                                  return (
                                    <span className="px-2.5 py-1 bg-muted text-muted-foreground text-[11px] font-bold rounded-lg border border-border flex items-center gap-1 select-none">
                                      <Clock className="w-3 h-3" /> Registration Closed
                                    </span>
                                  );
                                }
                                if (isThisActPooja && act.mainEventId) {
                                  const isMainReg = isMainEventRegistered(act.mainEventId);
                                  if (!isMainReg) {
                                    return (
                                      <button
                                        type="button"
                                        disabled
                                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-not-allowed shadow-none"
                                        title="Registration for the main event is mandatory before booking this Pooja Seva"
                                      >
                                        <Lock className="w-3 h-3 text-amber-500" /> Main Pass Required
                                      </button>
                                    );
                                  }
                                }
                                if (act.category?.toLowerCase() === "auction" || Boolean(act.rawAuctionItem)) {
                                  const isLive = act.rawAuctionItem?.status === "LIVE";
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedActivity(act);
                                        setMobileQuickActionModal(null);
                                      }}
                                      className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1"
                                    >
                                      <Gavel className="w-3 h-3" /> {isLive ? "Place Live Bid" : "View Auction"}
                                    </button>
                                  );
                                }

                                return (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedActivity(act);
                                      setMobileQuickActionModal(null);
                                    }}
                                    className="px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1"
                                  >
                                    <Ticket className="w-3 h-3" /> Book / Register
                                  </button>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Modal Footer with Close Button and Feed Link */}
            <div className="pt-2.5 border-t border-border flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (mobileQuickActionModal.action === "passes") {
                    setActiveTab("passes");
                  } else if (mobileQuickActionModal.category) {
                    setSelectedCategoryFilter(mobileQuickActionModal.category);
                    setActiveTab("home");
                  }
                  setMobileQuickActionModal(null);
                }}
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                {mobileQuickActionModal.action === "passes" ? "View Full Passes Dashboard →" : `View all ${mobileQuickActionModal.label} in feed →`}
              </button>
              <button
                type="button"
                onClick={() => setMobileQuickActionModal(null)}
                className="px-4 py-1.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MANAGE REGISTRATION MODAL ─── */}
      {managePassModal && (
        <div
          className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => { if (!isSavingManage) { setManagePassModal(null); setCancelConfirmMode(false); } }}
        >
          <div
            className="w-full max-w-md bg-card border-t sm:border border-border text-card-foreground rounded-t-3xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-6 sm:animate-in sm:zoom-in-95 duration-250 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag pill (mobile) */}
            <div className="w-10 h-1 rounded-full bg-muted-foreground/25 mx-auto mt-3 mb-1 sm:hidden shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-foreground">Manage Registration</h3>
                  <p className="text-[10.5px] text-muted-foreground truncate max-w-[220px]">{managePassModal.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setManagePassModal(null); setCancelConfirmMode(false); }}
                disabled={isSavingManage}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4 overflow-y-auto max-h-[70vh] hide-scrollbar">

              {/* Registration Info (read-only) */}
              <div className="bg-muted/50 rounded-xl p-3.5 space-y-2 border border-border/70">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Registration Details</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div>
                    <span className="text-muted-foreground">Reg ID</span>
                    <p className="font-mono font-bold text-foreground text-[11px] mt-0.5">{managePassModal.regId}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <p className={`font-bold mt-0.5 text-[11px] ${
                      managePassModal.status === "CONFIRMED" ? "text-emerald-600" : "text-amber-600"
                    }`}>{managePassModal.status}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date</span>
                    <p className="font-bold text-foreground text-[11px] mt-0.5">{managePassModal.date}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time</span>
                    <p className="font-bold text-foreground text-[11px] mt-0.5">{managePassModal.time}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Venue</span>
                    <p className="font-bold text-foreground text-[11px] mt-0.5">{managePassModal.venue}</p>
                  </div>
                  {managePassModal.bookingFee && managePassModal.bookingFee > 0 && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Booking Fee</span>
                      <p className="font-bold text-foreground text-[11px] mt-0.5">
                        ₹{managePassModal.bookingFee} · {managePassModal.paymentStatus || "PAID"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Editable fields */}
              {!cancelConfirmMode && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Update Details</p>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Participant / Attendee Name
                    </label>
                    <input
                      type="text"
                      value={editParticipantName}
                      onChange={(e) => setEditParticipantName(e.target.value)}
                      placeholder={managePassModal.participantName}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                    <p className="text-[10px] text-muted-foreground">Current: {managePassModal.participantName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+91..."
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Flat / Unit No.
                      </label>
                      <input
                        type="text"
                        value={editFlatNo}
                        onChange={(e) => setEditFlatNo(e.target.value)}
                        placeholder="e.g. A-402"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Gotram (Family Lineage)
                    </label>
                    <input
                      type="text"
                      value={editGotram}
                      onChange={(e) => setEditGotram(e.target.value)}
                      placeholder="e.g. Kashyapa, Bharadwaja..."
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Number of Devotees / Attendees
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditAttendeeCount((c) => Math.max(1, c - 1))}
                        className="w-8 h-8 rounded-xl bg-muted border border-border text-foreground font-black text-base flex items-center justify-center hover:bg-accent transition-colors cursor-pointer"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center text-sm font-black text-foreground tabular-nums">
                        {editAttendeeCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditAttendeeCount((c) => c + 1)}
                        className="w-8 h-8 rounded-xl bg-muted border border-border text-foreground font-black text-base flex items-center justify-center hover:bg-accent transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Success banner */}
              {manageSuccess && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-bold animate-in fade-in duration-200">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  {manageSuccess}
                </div>
              )}

              {/* Error banner */}
              {manageError && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 text-xs font-bold animate-in fade-in duration-200">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {manageError}
                </div>
              )}

              {/* Cancel Confirmation Panel */}
              {cancelConfirmMode && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-rose-700">Cancel This Registration?</p>
                      <p className="text-[10.5px] text-rose-600/80 mt-1 leading-relaxed">
                        This will permanently cancel your registration for <strong>{managePassModal.title}</strong>.
                        {managePassModal.bookingFee && managePassModal.bookingFee > 0 && (
                          <> Refund of <strong>₹{managePassModal.bookingFee}</strong> (if applicable) will be processed per policy.</>
                        )}
                        {" "}This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer actions */}
            <div className="px-5 py-4 border-t border-border shrink-0 space-y-2.5">
              {!cancelConfirmMode ? (
                <>
                  {/* Update button */}
                  <button
                    type="button"
                    onClick={handleUpdateRegistration}
                    disabled={isSavingManage || !!manageSuccess}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs active:scale-95"
                  >
                    {isSavingManage ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...</>
                    ) : (
                      <><RefreshCw className="w-3.5 h-3.5" /> Save Changes</>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] text-muted-foreground font-semibold">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Cancel trigger */}
                  <button
                    type="button"
                    onClick={() => { setCancelConfirmMode(true); setManageError(null); }}
                    disabled={isSavingManage}
                    className="w-full py-2 border border-rose-300/60 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Cancel Registration
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setCancelConfirmMode(false); setManageError(null); }}
                    disabled={isSavingManage}
                    className="flex-1 py-2.5 border border-border bg-muted hover:bg-accent text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-40"
                  >
                    Keep Registration
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelRegistration}
                    disabled={isSavingManage}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    {isSavingManage ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling...</>
                    ) : (
                      <><Trash2 className="w-3.5 h-3.5" /> Yes, Cancel</>  
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── COMPLETE EVENT DETAILS MODAL (FULL SUB-EVENTS & LOGISTICS) ─── */}
      <EventCompleteDetailsModal
        isOpen={Boolean(detailedEvent)}
        onClose={() => setDetailedEvent(null)}
        event={detailedEvent}
        allActivities={activitiesList}
        onBookActivity={(act) => {
          setSelectedActivity(act);
        }}
      />
    </div>
  );
}
