import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Star,
  Loader2,
  AlertCircle,
  XCircle,
  CheckCircle2,
  RotateCcw,
  Store,
  IndianRupee,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  vendorBookingService,
  vendorRatingService,
} from "../../../../services/vendorService";
import { showSuccess, showError } from "../../../../utils/ToastUtils";
import type {
  VendorBookingResponse,
  BookingStatus,
} from "../../../../types/api";

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "UPCOMING", label: "Upcoming" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  CONFIRMED: { label: "Confirmed", variant: "default" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  COMPLETED: { label: "Completed", variant: "outline" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  NO_SHOW: { label: "No Show", variant: "destructive" },
  RESCHEDULED: { label: "Rescheduled", variant: "secondary" },
};

function BookingSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="pt-5">
        <div className="flex gap-4">
          <div className="h-12 w-12 rounded-lg bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="h-3 w-28 rounded bg-muted" />
            <div className="h-3 w-48 rounded bg-muted" />
          </div>
          <div className="h-6 w-20 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

export function MyBookingsResident() {
  const [bookings, setBookings] = useState<VendorBookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Cancel dialog
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // Rating dialog
  const [ratingBooking, setRatingBooking] = useState<VendorBookingResponse | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    setPage(0);
  }, [activeTab]);

  useEffect(() => {
    loadBookings();
  }, [activeTab, page]);

  function getStatusFilter(): string | undefined {
    switch (activeTab) {
      case "UPCOMING":
        return "CONFIRMED";
      case "COMPLETED":
        return "COMPLETED";
      case "CANCELLED":
        return "CANCELLED";
      default:
        return undefined;
    }
  }

  async function loadBookings() {
    setLoading(true);
    try {
      const result = await vendorBookingService.getMyBookings(
        getStatusFilter(),
        page,
        10
      );
      setBookings(result.content);
      setTotalPages(result.totalPages);
    } catch {
      showError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!cancellingId || !cancelReason.trim()) return;
    setCancelLoading(true);
    try {
      await vendorBookingService.cancelBooking(cancellingId, cancelReason);
      showSuccess("Booking cancelled successfully");
      setCancellingId(null);
      setCancelReason("");
      loadBookings();
    } catch {
      showError("Failed to cancel booking");
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleRate() {
    if (!ratingBooking || ratingValue === 0) return;
    setRatingLoading(true);
    try {
      await vendorRatingService.createRating({
        vendorId: ratingBooking.vendor.id,
        bookingId: ratingBooking.id,
        rating: ratingValue,
        comment: ratingComment || undefined,
      });
      showSuccess("Thank you for your review!");
      setRatingBooking(null);
      setRatingValue(0);
      setRatingComment("");
      loadBookings();
    } catch {
      showError("Failed to submit rating");
    } finally {
      setRatingLoading(false);
    }
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  const canCancel = (status: BookingStatus) =>
    status === "PENDING" || status === "CONFIRMED";

  const canRate = (booking: VendorBookingResponse) =>
    booking.status === "COMPLETED" && booking.rating == null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">My Bookings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage your service bookings
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <BookingSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && bookings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            No bookings found
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {activeTab === "ALL"
              ? "You haven't made any bookings yet"
              : `No ${activeTab.toLowerCase()} bookings`}
          </p>
        </div>
      )}

      {/* Bookings List */}
      {!loading && bookings.length > 0 && (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const statusCfg = STATUS_CONFIG[booking.status] || {
              label: booking.status,
              variant: "outline" as const,
            };

            return (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Vendor Logo */}
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {booking.vendor.logoUrl ? (
                        <img
                          src={booking.vendor.logoUrl}
                          alt={booking.vendor.businessName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">
                            {booking.service.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {booking.vendor.businessName}
                          </p>
                        </div>
                        <Badge variant={statusCfg.variant}>
                          {statusCfg.label}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(booking.scheduledDate).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {booking.scheduledTime}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <IndianRupee className="h-3 w-3" />
                          {formatCurrency(booking.totalAmount)}
                        </span>
                        {booking.bookingNumber && (
                          <span className="text-muted-foreground">
                            #{booking.bookingNumber}
                          </span>
                        )}
                      </div>

                      {/* Existing rating */}
                      {booking.rating != null && (
                        <div className="flex items-center gap-1 mt-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < booking.rating!
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3">
                        {canCancel(booking.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCancellingId(booking.id)}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Cancel
                          </Button>
                        )}
                        {canRate(booking) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRatingBooking(booking)}
                          >
                            <Star className="h-3.5 w-3.5 mr-1" />
                            Rate
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {cancellingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-5 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Cancel Booking
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Are you sure you want to cancel this booking? This action
                  cannot be undone.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  Reason for cancellation
                </label>
                <textarea
                  placeholder="Please provide a reason..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCancellingId(null);
                    setCancelReason("");
                  }}
                >
                  Keep Booking
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={cancelLoading || !cancelReason.trim()}
                >
                  {cancelLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Cancel Booking"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rating Dialog */}
      {ratingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-5 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Rate Your Experience
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  How was your experience with{" "}
                  {ratingBooking.vendor.businessName}?
                </p>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setRatingValue(i + 1)}
                    className="p-0.5"
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        i < ratingValue
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30 hover:text-amber-300"
                      }`}
                    />
                  </button>
                ))}
                {ratingValue > 0 && (
                  <span className="text-sm text-muted-foreground ml-2">
                    {ratingValue}/5
                  </span>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  Review (optional)
                </label>
                <textarea
                  placeholder="Share your experience..."
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRatingBooking(null);
                    setRatingValue(0);
                    setRatingComment("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRate}
                  disabled={ratingLoading || ratingValue === 0}
                >
                  {ratingLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
