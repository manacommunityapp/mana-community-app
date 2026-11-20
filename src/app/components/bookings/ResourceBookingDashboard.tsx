import {
  Building2, Calendar, Clock, Users, MapPin, Star, Search, Filter,
  ChevronLeft, ChevronRight, Plus, X, Loader2, QrCode, Ban,
  CheckCircle, AlertCircle, Timer, Bookmark, ArrowRight, Tag, Percent,
  CreditCard, Sparkles, ShieldCheck, Receipt, Copy
} from "lucide-react";
import { toast } from "react-toastify";
import { analyticsService } from "../../../services/analytics/analyticsService";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { resourceBookingService } from "../../../services/bookings/bookingService";
import type {
  ResourceResponse as Resource,
  ResourceCategoryResponse as ResourceCategory,
  ResourceBookingResponse as Booking,
  SlotResponse as TimeSlot,
  BookingStatus,
  WaitlistResponse,
} from "../../../types/booking";
import { formatIndianTime, formatIndianDate, getNowInIST } from "../../../utils/indianDateTimeUtils";
import { useAuth } from "../../../contexts/AuthContext";
import { useCheckoutOptions } from "../../../hooks/payments/useCheckoutOptions";
import { PaymentGatewaySelector } from "../payments/PaymentGatewaySelector";
import { PaymentStatusBadge } from "../payments/PaymentStatusBadge";
import { ManaPayCheckoutModal } from "../payments/unified/ManaPayCheckoutModal";
import { unifiedPaymentService, type PaymentOrder } from "../../../services/payments/unifiedPaymentService";
import {
  automationService,
  type AmenityFairUsageAuditResponse,
  type AmenityDepositInspectionResponse
} from "../../../services/automation/automationService";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  CHECKED_IN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
  NO_SHOW: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  WAITLISTED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const CATEGORY_FALLBACK_COLORS: Record<string, string> = {
  CLUBHOUSE: "from-violet-50 to-purple-50 border-violet-200",
  GYM: "from-red-50 to-orange-50 border-red-200",
  POOL: "from-cyan-50 to-sky-50 border-cyan-200",
  PARTY_HALL: "from-pink-50 to-rose-50 border-pink-200",
  TENNIS_COURT: "from-green-50 to-emerald-50 border-green-200",
  BADMINTON_COURT: "from-lime-50 to-green-50 border-lime-200",
  GUEST_ROOM: "from-amber-50 to-yellow-50 border-amber-200",
  MEETING_ROOM: "from-indigo-50 to-blue-50 border-indigo-200",
};

const TABS = [
  { key: "browse", label: "Browse Resources", icon: Building2 },
  { key: "bookings", label: "My Bookings", icon: Bookmark },
  { key: "calendar", label: "Calendar", icon: Calendar },
  { key: "waitlist", label: "Waitlist", icon: Timer },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const BOOKING_FILTERS = ["All", "Upcoming", "Completed", "Cancelled"] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayStr(): string {
  const d = getNowInIST();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate(dateStr: string): string {
  return formatIndianDate(dateStr, "medium");
}

function formatTime(t: string): string {
  return formatIndianTime(t);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function getWeekDays(startDate: string): string[] {
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(startDate, i));
  }
  return days;
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function getCategoryGradient(category?: string | null, color?: string | null): string {
  if (color) return color;
  return CATEGORY_FALLBACK_COLORS[category ?? ""] ?? "from-slate-50 to-gray-50 border-slate-200";
}

// ---------------------------------------------------------------------------
// Skeleton Components
// ---------------------------------------------------------------------------

function StatCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm p-5 animate-pulse">
      <div className="h-3 w-20 bg-muted rounded mb-3" />
      <div className="h-7 w-16 bg-muted rounded mb-2" />
      <div className="h-2 w-24 bg-muted rounded" />
    </div>
  );
}

function ResourceCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden animate-pulse">
      <div className="h-36 bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 bg-muted rounded" />
        <div className="h-3 w-1/2 bg-muted rounded" />
        <div className="h-9 w-full bg-muted rounded-xl" />
      </div>
    </div>
  );
}

function BookingCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm p-4 animate-pulse flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-muted shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/2 bg-muted rounded" />
        <div className="h-3 w-3/4 bg-muted rounded" />
      </div>
      <div className="h-6 w-16 bg-muted rounded-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ResourceBookingDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabKey) || "browse";
  const setActiveTab = (tab: TabKey) => {
    setSearchParams((prev) => {
      prev.set("tab", tab);
      return prev;
    }, { replace: true });
  };
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [todaysBookings, setTodaysBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookingFilter, setBookingFilter] = useState<string>("All");
  const [calendarWeekStart, setCalendarWeekStart] = useState(getWeekStart(todayStr()));
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuditingFairUsage, setIsAuditingFairUsage] = useState(false);
  const [fairUsageResult, setFairUsageResult] = useState<AmenityFairUsageAuditResponse | null>(null);
  const [showFairUsageModal, setShowFairUsageModal] = useState(false);
  const [isInspectingDeposit, setIsInspectingDeposit] = useState(false);
  const [depositInspectionResult, setDepositInspectionResult] = useState<AmenityDepositInspectionResponse | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);

  // ---- Data Fetching ----

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resourcesData, categoriesData] = await Promise.all([
        resourceBookingService.getResources(),
        resourceBookingService.getCategories(),
      ]);
      setResources(resourcesData);
      setCategories(categoriesData);

      // Today's bookings is an admin endpoint; catch gracefully if user lacks Manage Resources permission
      try {
        const todaysData = await resourceBookingService.getTodaysBookings();
        setTodaysBookings(todaysData || []);
      } catch {
        setTodaysBookings([]);
      }
    } catch {
      setError("Failed to load resources. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const fetchMyBookings = useCallback(async () => {
    try {
      const data = await resourceBookingService.getMyBookings();
      setMyBookings(data);
    } catch {
      setMyBookings([]);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "bookings" || activeTab === "calendar" || activeTab === "waitlist") {
      fetchMyBookings();
    }
  }, [activeTab, fetchMyBookings]);

  // ---- Computed Values ----

  const filteredResources = useMemo(() => {
    let result = resources;
    if (selectedCategory) {
      result = result.filter((r) => r.categoryId?.toString() === selectedCategory || r.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.category?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [resources, selectedCategory, searchQuery]);

  const filteredBookings = useMemo(() => {
    if (bookingFilter === "All") return myBookings;
    const today = todayStr();
    switch (bookingFilter) {
      case "Upcoming":
        return myBookings.filter(
          (b) => (b.status === "CONFIRMED" || b.status === "PENDING") && b.bookingDate >= today
        );
      case "Completed":
        return myBookings.filter((b) => b.status === "COMPLETED" || b.status === "CHECKED_IN");
      case "Cancelled":
        return myBookings.filter((b) => b.status === "CANCELLED" || b.status === "REJECTED");
      default:
        return myBookings;
    }
  }, [myBookings, bookingFilter]);

  const waitlistBookings = useMemo(
    () => myBookings.filter((b) => b.status === "WAITLISTED"),
    [myBookings]
  );

  const stats = useMemo(() => {
    const activeResources = resources.filter((r) => r.active !== false).length;
    const occupancyRate = resources.length > 0
      ? Math.round((todaysBookings.length / Math.max(resources.length, 1)) * 100)
      : 0;
    const revenue = todaysBookings.reduce((sum, b) => sum + (b.totalAmount ?? 0), 0);
    return {
      todaysCount: todaysBookings.length,
      activeResources,
      occupancyRate: Math.min(occupancyRate, 100),
      revenue,
    };
  }, [resources, todaysBookings]);

  // ---- Handlers ----

  const handleBookResource = (resource: Resource) => {
    setSelectedResource(resource);
    setShowBookingModal(true);
  };

  const handleBookingComplete = () => {
    setShowBookingModal(false);
    setSelectedResource(null);
    fetchMyBookings();
    fetchInitialData();
  };

  const handleCancelBooking = async (id: number) => {
    try {
      await resourceBookingService.cancelBooking(id);
      fetchMyBookings();
      fetchInitialData();
    } catch {
      // silently fail
    }
  };

  const handleAuditFairUsage = async (resource?: Resource | null) => {
    setIsAuditingFairUsage(true);
    try {
      const targetName = resource?.name ?? (resources[0]?.name || "Clubhouse Badminton Court A");
      const res = await automationService.auditAmenityFairUsage({
        resourceId: resource ? String(resource.id) : undefined,
        resourceName: targetName,
        targetDate: todayStr(),
        recentBookingHistory: [
          { flatNo: "B-402", bookingsInLast7Days: 4, peakHourBookings: 3, isPeak: true, requestedSlot: "19:00 - 20:00" },
          { flatNo: "A-101", bookingsInLast7Days: 1, peakHourBookings: 0, isPeak: false, requestedSlot: "08:00 - 09:00" },
          { flatNo: "C-205", bookingsInLast7Days: 5, peakHourBookings: 4, isPeak: true, requestedSlot: "20:00 - 21:00" },
        ]
      });
      setFairUsageResult(res);
      setShowFairUsageModal(true);
      toast.success("AI Fair-Usage Guard audit complete!");
    } catch {
      toast.error("Failed to run fair-usage audit.");
    } finally {
      setIsAuditingFairUsage(false);
    }
  };

  const handleInspectDeposit = async (booking: Booking) => {
    setIsInspectingDeposit(true);
    try {
      const res = await automationService.inspectAmenityDepositRelease({
        bookingId: String(booking.id),
        facilityName: booking.resourceName || "Multipurpose Party Hall",
        residentFlat: "B-304",
        residentName: "Resident Member",
        securityDepositPaid: 5000,
        preInspectionStatus: "Clean with minor paint scuffs",
        postInspectionNotes: "Post-event inspection completed. Sound curfew respected, kitchen counter deep-cleaned, minor confetti cleanup required.",
        photosCount: 4
      });
      setDepositInspectionResult(res);
      setShowDepositModal(true);
      toast.success("AI Deposit Arbitrator settlement ready!");
    } catch {
      toast.error("Failed to inspect deposit release.");
    } finally {
      setIsInspectingDeposit(false);
    }
  };

  // ---- Render ----

  if (error && !loading && resources.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-lg font-black text-foreground mb-2">Something went wrong</p>
        <p className="text-muted-foreground text-sm mb-6">{error}</p>
        <button
          onClick={fetchInitialData}
          className="bg-primary text-white rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer transition-all duration-200 hover:opacity-90"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 font-sans">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-primary font-bold uppercase tracking-wider">Community</span>
          <h4 className="text-xl md:text-2xl font-black text-foreground mt-1">Resource Booking</h4>
          <p className="text-muted-foreground text-sm mt-1">
            Reserve amenities, rooms, and facilities for your community.
          </p>
        </div>
        <button
          onClick={() => handleAuditFairUsage(selectedResource)}
          disabled={isAuditingFairUsage}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer shadow-xs self-start sm:self-auto disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isAuditingFairUsage ? "animate-spin text-indigo-500" : "text-indigo-600"}`} />
          {isAuditingFairUsage ? "Auditing Usage..." : "AI Fair-Usage Guard"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Today's Bookings"
              value={stats.todaysCount}
              icon={<Calendar className="w-4 h-4" />}
              accent="text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
            />
            <StatCard
              label="Active Resources"
              value={stats.activeResources}
              icon={<Building2 className="w-4 h-4" />}
              accent="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400"
            />
            <StatCard
              label="Occupancy Rate"
              value={`${stats.occupancyRate}%`}
              icon={<Users className="w-4 h-4" />}
              accent="text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400"
            />
            <StatCard
              label="Revenue"
              value={stats.revenue > 0 ? `₹${stats.revenue.toLocaleString()}` : "--"}
              icon={<Tag className="w-4 h-4" />}
              accent="text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400"
            />
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1 shadow-sm mb-6 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap",
              activeTab === key
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted/50"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "browse" && (
        <BrowseTab
          resources={filteredResources}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          loading={loading}
          onBook={handleBookResource}
        />
      )}

      {activeTab === "bookings" && (
        <MyBookingsTab
          bookings={filteredBookings}
          filter={bookingFilter}
          onFilterChange={setBookingFilter}
          loading={loading}
          onCancel={handleCancelBooking}
          onInspectDeposit={handleInspectDeposit}
        />
      )}

      {activeTab === "calendar" && (
        <CalendarTab
          bookings={myBookings}
          weekStart={calendarWeekStart}
          onWeekChange={setCalendarWeekStart}
        />
      )}

      {activeTab === "waitlist" && (
        <WaitlistTab bookings={waitlistBookings} loading={loading} />
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedResource && (
        <BookingModal
          resource={selectedResource}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedResource(null);
          }}
          onBooked={handleBookingComplete}
        />
      )}

      {/* ── AI Fair-Usage Guard Evaluation Modal ───────────────────────────────── */}
      {showFairUsageModal && fairUsageResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    Fair-Usage & Anti-Hoarding Guard
                  </h3>
                  <p className="text-[11px] text-slate-500">{fairUsageResult.resource}</p>
                </div>
              </div>
              <button
                onClick={() => setShowFairUsageModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Verdict Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Allocation Verdict</div>
                <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${fairUsageResult.evaluation.fairnessVerdict === "APPROVED" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                  {fairUsageResult.evaluation.fairnessVerdict.replace(/_/g, " ")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Fairness Score</div>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {fairUsageResult.evaluation.fairnessScore}%
                </div>
              </div>
            </div>

            {/* Quota breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-slate-50 dark:bg-[#262644] rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 font-bold">Weekly Slots Used</div>
                <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  {fairUsageResult.evaluation.quotaStatus.weeklyUsed} / {fairUsageResult.evaluation.quotaStatus.weeklyAllowed}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#262644] rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 font-bold">Peak-Hour Cap</div>
                <div className={`text-xs font-black mt-1 ${fairUsageResult.evaluation.quotaStatus.peakHourLimitReached ? "text-rose-500" : "text-emerald-500"}`}>
                  {fairUsageResult.evaluation.quotaStatus.peakHourLimitReached ? "Cap Reached" : "Available"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#262644] rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 font-bold">Hoarding Risk</div>
                <div className={`text-xs font-black mt-1 ${fairUsageResult.evaluation.hoardingRisk === "HIGH" ? "text-rose-500" : fairUsageResult.evaluation.hoardingRisk === "MODERATE" ? "text-amber-500" : "text-emerald-500"}`}>
                  {fairUsageResult.evaluation.hoardingRisk}
                </div>
              </div>
            </div>

            {/* Restriction reason / Action */}
            <div className="p-3 bg-slate-50 dark:bg-[#262644] rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Autonomous Sentinel Policy</div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                {fairUsageResult.evaluation.restrictionReason || "Normal booking privileges maintained across community units."}
              </p>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-1">
                Recommendation: {fairUsageResult.evaluation.recommendedAction}
              </p>
            </div>

            {/* Resident broadcast notice */}
            {fairUsageResult.evaluation.residentNotice && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-500">Community Resident Notice:</div>
                <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                  {fairUsageResult.evaluation.residentNotice}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(fairUsageResult.evaluation.residentNotice);
                  toast.success("Resident notice copied!");
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Notice
              </button>
              <button
                onClick={() => setShowFairUsageModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Deposit Inspection & Arbitrator Modal ───────────────────────────── */}
      {showDepositModal && depositInspectionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    Deposit Release & Inspection Settlement
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {depositInspectionResult.facility} • Flat {depositInspectionResult.flat}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDepositModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Verdict Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Arbitration Verdict</div>
                <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${depositInspectionResult.depositSettlement.arbitrationVerdict === "FULL_RELEASE" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                  {depositInspectionResult.depositSettlement.arbitrationVerdict.replace(/_/g, " ")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Net Refund</div>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  ₹{depositInspectionResult.depositSettlement.netRefundAmount.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Financials summary */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-slate-50 dark:bg-[#262644] rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 font-bold">Security Deposit</div>
                <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                  ₹{depositInspectionResult.depositSettlement.securityDepositOriginal.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#262644] rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 font-bold">Deductions</div>
                <div className="text-xs font-black text-rose-500 mt-0.5">
                  -₹{depositInspectionResult.depositSettlement.totalDeductions.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
                <div className="text-[10px] text-emerald-600 font-bold">Payable to Resident</div>
                <div className="text-xs font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                  ₹{depositInspectionResult.depositSettlement.netRefundAmount.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Itemized Deductions (if any) */}
            {depositInspectionResult.depositSettlement.itemizedDeductions?.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-black text-slate-700 dark:text-slate-300">Itemized Deductions</div>
                {depositInspectionResult.depositSettlement.itemizedDeductions.map((ded, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 dark:bg-[#262644] rounded-xl border border-slate-100 dark:border-slate-800 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{ded.category.replace(/_/g, " ")}</span>
                      <p className="text-[10px] text-slate-500">{ded.description}</p>
                    </div>
                    <span className="font-black text-rose-600 dark:text-rose-400">
                      -₹{ded.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Remarks */}
            <div className="p-3 bg-slate-50 dark:bg-[#262644] rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Facility Inspector Remarks</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {depositInspectionResult.depositSettlement.inspectorRemarks}
              </p>
            </div>

            {/* Settlement letter */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-500">Official Settlement Receipt Letter:</div>
              <div className="p-3 bg-slate-50 dark:bg-[#262644] rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-mono leading-relaxed whitespace-pre-line">
                {depositInspectionResult.depositSettlement.residentSettlementLetter}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(depositInspectionResult.depositSettlement.residentSettlementLetter);
                  toast.success("Settlement letter copied!");
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Receipt Letter
              </button>
              <button
                onClick={() => setShowDepositModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm p-4 md:p-5 transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-muted-foreground text-xs font-medium">{label}</span>
        <span className={cn("p-1.5 rounded-lg", accent)}>{icon}</span>
      </div>
      <p className="text-xl md:text-2xl font-black text-foreground">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Browse Resources Tab
// ---------------------------------------------------------------------------

function BrowseTab({
  resources,
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  loading,
  onBook,
}: {
  resources: Resource[];
  categories: ResourceCategory[];
  selectedCategory: string | null;
  onCategoryChange: (id: string | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  loading: boolean;
  onBook: (r: Resource) => void;
}) {
  return (
    <div>
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search resources..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
        />
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        <button
          onClick={() => onCategoryChange(null)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer border",
            !selectedCategory
              ? "bg-primary text-white border-primary"
              : "bg-card text-muted-foreground border-border hover:bg-muted/50"
          )}
        >
          <Filter className="w-3 h-3" />
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              onCategoryChange(
                selectedCategory === cat.id.toString() ? null : cat.id.toString()
              )
            }
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer border",
              selectedCategory === cat.id.toString()
                ? "bg-primary text-white border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-muted/50"
            )}
          >
            {cat.icon && <span className="text-sm">{cat.icon}</span>}
            {cat.name}
          </button>
        ))}
      </div>

      {/* Resource Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ResourceCardSkeleton key={i} />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm font-medium">No resources found</p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Try adjusting your filters or search query
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} onBook={onBook} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResourceCard({
  resource,
  onBook,
}: {
  resource: Resource;
  onBook: (r: Resource) => void;
}) {
  const gradient = getCategoryGradient(resource.category, resource.categoryColor);
  const isAvailable = resource.active !== false;

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group">
      {/* Image Placeholder */}
      <div
        className={cn(
          "h-36 bg-gradient-to-br flex items-center justify-center relative",
          gradient
        )}
      >
        <Building2 className="w-10 h-10 text-muted-foreground/30" />
        {/* Status dot */}
        <div className="absolute top-3 right-3">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
              isAvailable
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", isAvailable ? "bg-emerald-500" : "bg-red-500")} />
            {isAvailable ? "Available" : "Unavailable"}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {resource.name}
          </h3>
        </div>

        {resource.category && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted text-muted-foreground mb-2">
            {resource.category}
          </span>
        )}

        <div className="flex items-center gap-3 text-muted-foreground text-xs mb-3">
          {resource.maxCapacity && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {resource.maxCapacity}
            </span>
          )}
          {resource.bookingType && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {resource.bookingType === "SLOT_BASED" ? "Slots" : "Full Day"}
            </span>
          )}
          {resource.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[80px]">{resource.location}</span>
            </span>
          )}
        </div>

        <button
          onClick={() => onBook(resource)}
          disabled={!isAvailable}
          className="w-full bg-primary text-white rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Book Now
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// My Bookings Tab
// ---------------------------------------------------------------------------

function MyBookingsTab({
  bookings,
  filter,
  onFilterChange,
  loading,
  onCancel,
  onInspectDeposit,
}: {
  bookings: Booking[];
  filter: string;
  onFilterChange: (f: string) => void;
  loading: boolean;
  onCancel: (id: number) => void;
  onInspectDeposit?: (booking: Booking) => void;
}) {
  return (
    <div className="max-w-3xl">
      {/* Filter Pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {BOOKING_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer border",
              filter === f
                ? "bg-primary text-white border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-muted/50"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Booking List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm font-medium">No bookings found</p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            {filter === "All"
              ? "Book a resource to get started"
              : `No ${filter.toLowerCase()} bookings`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} onCancel={onCancel} onInspectDeposit={onInspectDeposit} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingCard({
  booking,
  onCancel,
  onInspectDeposit,
}: {
  booking: Booking;
  onCancel: (id: number) => void;
  onInspectDeposit?: (booking: Booking) => void;
}) {
  const statusStyle = STATUS_STYLES[booking.status] ?? STATUS_STYLES.PENDING;
  const canCancel = booking.status === "CONFIRMED" || booking.status === "PENDING";
  const isCompleted = booking.status === "COMPLETED";

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0",
            getCategoryGradient(booking.resourceCategory)
          )}
        >
          <Building2 className="w-5 h-5 text-muted-foreground/50" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">
            {booking.resourceName ?? "Resource"}
          </p>
          <div className="flex items-center gap-2 text-muted-foreground text-xs mt-0.5">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(booking.bookingDate)}
            </span>
            {booking.startTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(booking.startTime)}
                {booking.endTime && ` - ${formatTime(booking.endTime)}`}
              </span>
            )}
          </div>
          {booking.purpose && (
            <p className="text-muted-foreground/60 text-[10px] mt-1 truncate">{booking.purpose}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "text-[10px] font-bold px-2.5 py-1 rounded-full",
              statusStyle
            )}
          >
            {booking.status.replace("_", " ")}
          </span>

          <div className="flex items-center gap-1">
            {onInspectDeposit && (
              <button
                onClick={() => onInspectDeposit(booking)}
                className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                title="AI Deposit & Inspection Arbitrator"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </button>
            )}

            {(booking.status === "CONFIRMED" || booking.status === "CHECKED_IN") && (
              <button
                className="p-1.5 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                title="Show QR Code"
              >
                <QrCode className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}

            {isCompleted && (
              <button
                className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors cursor-pointer"
                title="Rate this booking"
              >
                <Star className="w-3.5 h-3.5 text-amber-500" />
              </button>
            )}

            {canCancel && (
              <button
                onClick={() => onCancel(booking.id)}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                title="Cancel booking"
              >
                <Ban className="w-3.5 h-3.5 text-red-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendar Tab
// ---------------------------------------------------------------------------

function CalendarTab({
  bookings,
  weekStart,
  onWeekChange,
}: {
  bookings: Booking[];
  weekStart: string;
  onWeekChange: (s: string) => void;
}) {
  const weekDays = getWeekDays(weekStart);
  const today = todayStr();

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const b of bookings) {
      if (!map[b.bookingDate]) map[b.bookingDate] = [];
      map[b.bookingDate].push(b);
    }
    return map;
  }, [bookings]);

  return (
    <div>
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onWeekChange(addDays(weekStart, -7))}
          className="p-2 hover:bg-muted rounded-xl transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-foreground">
            {formatDate(weekStart)} - {formatDate(addDays(weekStart, 6))}
          </p>
          <button
            onClick={() => onWeekChange(getWeekStart(todayStr()))}
            className="text-xs text-primary font-bold cursor-pointer hover:underline mt-0.5"
          >
            This Week
          </button>
        </div>
        <button
          onClick={() => onWeekChange(addDays(weekStart, 7))}
          className="p-2 hover:bg-muted rounded-xl transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const d = new Date(day + "T00:00:00");
          const dayBookings = bookingsByDate[day] ?? [];
          const isToday = day === today;

          return (
            <div key={day} className="min-h-[120px]">
              <div
                className={cn(
                  "text-center py-1.5 rounded-t-xl text-xs font-bold",
                  isToday
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <p>{d.toLocaleDateString("en-IN", { weekday: "short" })}</p>
                <p className="text-lg">{d.getDate()}</p>
              </div>
              <div className="bg-card border border-border border-t-0 rounded-b-xl p-1.5 space-y-1 min-h-[80px]">
                {dayBookings.length === 0 ? (
                  <p className="text-muted-foreground/40 text-[9px] text-center py-2">--</p>
                ) : (
                  dayBookings.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      className={cn(
                        "px-1.5 py-1 rounded-md text-[9px] font-bold truncate",
                        STATUS_STYLES[b.status] ?? STATUS_STYLES.PENDING
                      )}
                      title={`${b.resourceName} ${b.startTime ? formatTime(b.startTime) : ""}`}
                    >
                      {b.resourceName ?? "Booking"}
                    </div>
                  ))
                )}
                {dayBookings.length > 3 && (
                  <p className="text-[9px] text-muted-foreground text-center">
                    +{dayBookings.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Waitlist Tab
// ---------------------------------------------------------------------------

function WaitlistTab({
  bookings,
  loading,
}: {
  bookings: Booking[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-3 max-w-3xl">
        {Array.from({ length: 2 }).map((_, i) => (
          <BookingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Timer className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground text-sm font-medium">No waitlist entries</p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          You'll be added to the waitlist when a resource is fully booked
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-3xl">
      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="bg-card border border-border rounded-2xl shadow-sm p-4 transition-all duration-200 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0",
                getCategoryGradient(booking.resourceCategory)
              )}
            >
              <Timer className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {booking.resourceName ?? "Resource"}
              </p>
              <div className="flex items-center gap-2 text-muted-foreground text-xs mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(booking.bookingDate)}
                </span>
              </div>
            </div>
            <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full", STATUS_STYLES.WAITLISTED)}>
              WAITLISTED
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Booking Modal
// ---------------------------------------------------------------------------

function BookingModal({
  resource,
  onClose,
  onBooked,
}: {
  resource: Resource;
  onClose: () => void;
  onBooked: () => void;
}) {
  const { user } = useAuth();
  const communityId = user?.communityId as number;
  const { options: checkoutOptions, loading: optionsLoading } = useCheckoutOptions();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [purpose, setPurpose] = useState("");
  const [guests, setGuests] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Payment state
  const [selectedGateway, setSelectedGateway] = useState<string>("");
  const [selectedManualMode, setSelectedManualMode] = useState<string | undefined>();
  const [createdBookingId, setCreatedBookingId] = useState<number | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null);
  const [showManaPayModal, setShowManaPayModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [payError, setPayError] = useState<string>("");

  const isPaidResource = (resource.pricePerSlot ?? 0) > 0;
  const totalSteps = isPaidResource ? 4 : 3;

  useEffect(() => {
    if (checkoutOptions?.defaultGateway && !selectedGateway) {
      setSelectedGateway(checkoutOptions.defaultGateway);
    }
  }, [checkoutOptions]);

  const maxDate = resource.advanceBookingDays
    ? addDays(todayStr(), resource.advanceBookingDays)
    : addDays(todayStr(), 30);

  // Fetch slots when date changes
  useEffect(() => {
    if (step !== 2) return;
    let cancelled = false;
    (async () => {
      setSlotsLoading(true);
      try {
        const data = await resourceBookingService.getSlots(resource.id, selectedDate);
        if (!cancelled) setSlots(data);
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resource.id, selectedDate, step]);

  const handleCreateBooking = async () => {
    setSaving(true);
    setError("");
    try {
      const booking = await resourceBookingService.createBooking({
        resourceId: resource.id,
        bookingDate: selectedDate,
        startTime: selectedSlot?.startTime ?? "",
        endTime: selectedSlot?.endTime ?? "",
        purpose,
        numberOfGuests: guests > 0 ? guests : undefined,
        couponCode: couponCode.trim() || undefined,
      });
      analyticsService.track("booking_created", { module: "amenity_booking", paid: isPaidResource });
      if (isPaidResource) {
        setCreatedBookingId(booking.id);
        setStep(4);
      } else {
        onBooked();
      }
    } catch (err: unknown) {
      analyticsService.track("booking_failed", { module: "amenity_booking" });
      const msg = err instanceof Error ? err.message : "Failed to create booking";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handlePayBooking = async () => {
    if (!selectedGateway || !communityId || !createdBookingId) return;
    setSaving(true);
    setPayError("");
    try {
      const order = await unifiedPaymentService.createOrder({
        referenceType: "AMENITY_BOOKING",
        referenceId: createdBookingId,
        gateway: selectedGateway as any,
        communityId,
        amount: resource.pricePerSlot!,
      });
      setPaymentOrder(order);

      if (selectedGateway === "MANA_PAY") {
        setShowManaPayModal(true);
        return;
      }
      if (selectedGateway === "MANUAL") {
        setPaymentStatus("PENDING");
        onBooked();
        return;
      }
      // Cashfree/Razorpay: SDK would launch here with order.gatewayOrderId
      const verified = await unifiedPaymentService.verifyPayment(order.id);
      setPaymentStatus(verified.status);
      if (verified.status === "SUCCESS") {
        onBooked();
      } else {
        setPayError("Payment verification failed. Try again.");
      }
    } catch (err: any) {
      setPayError(err?.message ?? "Payment failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleManaPaySuccess = async () => {
    if (!paymentOrder) return;
    try {
      const verified = await unifiedPaymentService.verifyPayment(paymentOrder.id);
      setPaymentStatus(verified.status);
      setShowManaPayModal(false);
      if (verified.status === "SUCCESS") {
        onBooked();
      } else {
        setPayError("Payment verification failed.");
      }
    } catch {
      setPayError("Payment verification failed.");
      setShowManaPayModal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-foreground truncate">
              {step === 1 ? resource.name : step === 2 ? "Select Time" : "Confirm Booking"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 rounded-full flex-1 transition-all duration-200",
                    i + 1 <= step ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors cursor-pointer ml-3"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-medium bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg mb-4">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Step 1: Resource Details + Date */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Resource Info */}
              <div className={cn("h-32 rounded-xl bg-gradient-to-br flex items-center justify-center", getCategoryGradient(resource.category, resource.categoryColor))}>
                <Building2 className="w-10 h-10 text-muted-foreground/30" />
              </div>

              {resource.description && (
                <p className="text-muted-foreground text-sm">{resource.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                {resource.maxCapacity && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>Up to {resource.maxCapacity} people</span>
                  </div>
                )}
                {resource.bookingType && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{resource.bookingType === "SLOT_BASED" ? "Slot-based" : "Full day"}</span>
                  </div>
                )}
                {resource.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{resource.location}</span>
                  </div>
                )}
                {resource.pricePerSlot != null && resource.pricePerSlot > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Tag className="w-4 h-4" />
                    <span>₹{resource.pricePerSlot}/slot</span>
                  </div>
                )}
              </div>

              {resource.rules && (
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-xs font-bold text-foreground mb-1">Rules</p>
                  <p className="text-muted-foreground text-xs whitespace-pre-line">{resource.rules}</p>
                </div>
              )}

              {/* Date Selection */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={todayStr()}
                  max={maxDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                />
              </div>
            </div>
          )}

          {/* Step 2: Time Slots */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {formatDate(selectedDate)} -- select an available time slot
              </p>

              {slotsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-10">
                  <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No available slots for this date</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime;
                    const available = slot.available !== false;
                    return (
                      <button
                        key={slot.startTime}
                        onClick={() => available && setSelectedSlot(slot)}
                        disabled={!available}
                        className={cn(
                          "p-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border text-center",
                          isSelected
                            ? "bg-primary text-white border-primary shadow-md"
                            : available
                              ? "bg-card text-foreground border-border hover:border-primary/50 hover:bg-primary/5"
                              : "bg-muted/50 text-muted-foreground/40 border-transparent cursor-not-allowed line-through"
                        )}
                      >
                        <p>{formatTime(slot.startTime)}</p>
                        {slot.endTime && (
                          <p className={cn("text-[10px] mt-0.5", isSelected ? "text-white/70" : "text-muted-foreground")}>
                            to {formatTime(slot.endTime)}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Details + Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Resource</span>
                  <span className="font-bold text-foreground">{resource.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-bold text-foreground">{formatDate(selectedDate)}</span>
                </div>
                {selectedSlot && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-bold text-foreground">
                      {formatTime(selectedSlot.startTime)}
                      {selectedSlot.endTime && ` - ${formatTime(selectedSlot.endTime)}`}
                    </span>
                  </div>
                )}
                {resource.pricePerSlot != null && resource.pricePerSlot > 0 && (
                  <div className="flex items-center justify-between text-sm border-t border-border pt-2 mt-2">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-black text-foreground">₹{resource.pricePerSlot}</span>
                  </div>
                )}
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Purpose
                </label>
                <input
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  maxLength={300}
                  className="w-full px-3 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  placeholder="Birthday party, team meeting..."
                />
              </div>

              {/* Guests */}
              {resource.allowGuests !== false && (
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Number of Guests
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={resource.maxCapacity ?? 50}
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  />
                </div>
              )}

              {/* Coupon */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  <span className="flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    Coupon Code
                  </span>
                </label>
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  maxLength={20}
                  className="w-full px-3 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 uppercase"
                  placeholder="Enter coupon code"
                />
              </div>
            </div>
          )}

          {/* Step 4: Payment (paid resources only) */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">Payment</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{resource.name}</span>
                  <span className="font-black text-foreground">₹{resource.pricePerSlot}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {formatDate(selectedDate)}
                  {selectedSlot && ` · ${formatTime(selectedSlot.startTime)}`}
                </p>
              </div>

              {payError && (
                <div className="flex items-center gap-2 text-red-600 text-xs font-medium bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {payError}
                </div>
              )}
              {paymentStatus && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Payment status:</span>
                  <PaymentStatusBadge status={paymentStatus} />
                </div>
              )}

              {optionsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading payment options...
                </div>
              ) : checkoutOptions ? (
                <PaymentGatewaySelector
                  options={checkoutOptions}
                  selectedGateway={selectedGateway}
                  selectedManualMode={selectedManualMode}
                  onChange={(gw, mode) => { setSelectedGateway(gw); setSelectedManualMode(mode); }}
                  orderAmount={resource.pricePerSlot ?? undefined}
                />
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-5 border-t border-border shrink-0">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={saving}
              className="px-4 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 2 && !selectedSlot}
              className="bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-bold cursor-pointer transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Continue
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : step === 3 ? (
            <button
              onClick={handleCreateBooking}
              disabled={saving}
              className="bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-bold cursor-pointer transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Booking..." : isPaidResource ? "Continue to Payment" : "Confirm Booking"}
              {!saving && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <button
              onClick={handlePayBooking}
              disabled={saving || !selectedGateway || optionsLoading}
              className="bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-bold cursor-pointer transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Processing..." : `Pay ₹${resource.pricePerSlot}`}
              {!saving && <CheckCircle className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {showManaPayModal && paymentOrder && (
        <ManaPayCheckoutModal
          isOpen={showManaPayModal}
          onClose={() => { setShowManaPayModal(false); setPayError("Payment cancelled."); }}
          paymentOrderId={paymentOrder.id}
          order={{
            domain: "AMENITY_BOOKING",
            orderReferenceId: `BOOKING-${createdBookingId}`,
            title: `Booking: ${resource.name}`,
            description: `${formatDate(selectedDate)}${selectedSlot ? ` · ${formatTime(selectedSlot.startTime)}` : ""}`,
            totalAmount: paymentOrder.grossAmount,
            payer: {
              name: user?.name ?? "Resident",
              unit: user?.flatNo ? `Flat ${user.flatNo}` : undefined,
            },
            items: [{
              title: resource.name,
              quantity: 1,
              unitPrice: resource.pricePerSlot!,
              amount: paymentOrder.grossAmount,
            }],
          }}
          onPaymentSuccess={handleManaPaySuccess}
        />
      )}
    </div>
  );
}
