import { useState, useEffect } from "react";
import {
  CalendarCheck, Search, Loader2, AlertCircle, Play,
  CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { vendorBookingService } from "../../../../services/vendorService";
import type { VendorBookingResponse } from "../../../../types/api";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No Show" },
  { value: "RESCHEDULED", label: "Rescheduled" },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-50 border-amber-200 text-amber-700",
  CONFIRMED: "bg-blue-50 border-blue-200 text-blue-700",
  IN_PROGRESS: "bg-indigo-50 border-indigo-200 text-indigo-700",
  COMPLETED: "bg-emerald-50 border-emerald-200 text-emerald-700",
  CANCELLED: "bg-red-50 border-red-200 text-red-700",
  NO_SHOW: "bg-slate-50 border-slate-200 text-slate-600",
  RESCHEDULED: "bg-violet-50 border-violet-200 text-violet-700",
};

export function MyBookings() {
  const [bookings, setBookings] = useState<VendorBookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [cancelDialog, setCancelDialog] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    loadBookings();
  }, [statusFilter, page]);

  const loadBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await vendorBookingService.getVendorBookings(statusFilter || undefined, page, 10);
      setBookings(res.content);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
      setError("Failed to load bookings");
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: number) => {
    setActionLoading(id);
    try {
      await vendorBookingService.acceptBooking(id);
      toast.success("Booking accepted");
      loadBookings();
    } catch (err) {
      console.error(err);
      toast.error("Failed to accept booking");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStart = async (id: number) => {
    setActionLoading(id);
    try {
      await vendorBookingService.startBooking(id);
      toast.success("Booking started");
      loadBookings();
    } catch (err) {
      console.error(err);
      toast.error("Failed to start booking");
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (id: number) => {
    setActionLoading(id);
    try {
      await vendorBookingService.completeBooking(id);
      toast.success("Booking completed");
      loadBookings();
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete booking");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: number) => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }
    setActionLoading(id);
    try {
      await vendorBookingService.cancelBooking(id, cancelReason);
      toast.success("Booking cancelled");
      setCancelDialog(null);
      setCancelReason("");
      loadBookings();
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel booking");
    } finally {
      setActionLoading(null);
    }
  };

  const getActions = (booking: VendorBookingResponse) => {
    const actions: { label: string; icon: typeof Play; onClick: () => void; color: string }[] = [];
    switch (booking.status) {
      case "PENDING":
        actions.push(
          { label: "Accept", icon: CheckCircle2, onClick: () => handleAccept(booking.id), color: "text-emerald-600 hover:bg-emerald-50" },
          { label: "Cancel", icon: XCircle, onClick: () => setCancelDialog(booking.id), color: "text-red-600 hover:bg-red-50" },
        );
        break;
      case "CONFIRMED":
        actions.push(
          { label: "Start", icon: Play, onClick: () => handleStart(booking.id), color: "text-indigo-600 hover:bg-indigo-50" },
          { label: "Cancel", icon: XCircle, onClick: () => setCancelDialog(booking.id), color: "text-red-600 hover:bg-red-50" },
        );
        break;
      case "IN_PROGRESS":
        actions.push(
          { label: "Complete", icon: CheckCircle2, onClick: () => handleComplete(booking.id), color: "text-emerald-600 hover:bg-emerald-50" },
        );
        break;
    }
    return actions;
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div>
        <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Vendor Portal</span>
        <h1 className="text-3xl font-black text-[#0d0d2b] flex items-center gap-2 mt-1">
          <CalendarCheck className="h-8 w-8 text-indigo-600" />
          My Bookings
        </h1>
        <p className="text-[#6b7094] text-sm mt-1">Manage bookings received from customers</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setStatusFilter(opt.value); setPage(0); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${
              statusFilter === opt.value
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-[#6b7094] border-slate-200 hover:border-indigo-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-[#6b7094] font-medium">{error}</p>
          <button onClick={loadBookings} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors">
            Retry
          </button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16">
          <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-[#6b7094] font-medium">No bookings found</p>
        </div>
      ) : (
        <>
          {/* Bookings List */}
          <div className="space-y-3">
            {bookings.map((booking) => {
              const actions = getActions(booking);
              return (
                <div key={booking.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {booking.customer.profilePicUrl ? (
                          <img src={booking.customer.profilePicUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <span className="text-sm font-black text-indigo-600">
                            {booking.customer.fullName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#0d0d2b]">{booking.service.name}</p>
                        <p className="text-xs text-[#6b7094] mt-0.5">
                          <span className="font-semibold">{booking.customer.fullName}</span>
                          {" "}&middot;{" "}#{booking.bookingNumber}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-[#6b7094]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {booking.scheduledDate} at {booking.scheduledTime}
                          </span>
                          <span className="font-bold text-[#0d0d2b]">
                            ₹{booking.totalAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                        {booking.notes && (
                          <p className="text-xs text-slate-400 mt-1 italic">Note: {booking.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_BADGE[booking.status] || ""}`}>
                        {booking.status.replace(/_/g, " ")}
                      </span>
                      <div className="flex items-center gap-1">
                        {actions.map((action) => {
                          const Icon = action.icon;
                          return (
                            <button
                              key={action.label}
                              onClick={action.onClick}
                              disabled={actionLoading === booking.id}
                              className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-all ${action.color} disabled:opacity-50`}
                            >
                              {actionLoading === booking.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Icon className="w-3 h-3" />
                              )}
                              {action.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-[#6b7094]">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Cancel Dialog */}
      {cancelDialog !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-black text-[#0d0d2b]">Cancel Booking</h3>
            <p className="text-sm text-[#6b7094]">Please provide a reason for cancellation.</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="Cancellation reason..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setCancelDialog(null); setCancelReason(""); }}
                className="px-4 py-2 text-sm font-bold text-[#6b7094] hover:bg-slate-100 rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => handleCancel(cancelDialog)}
                disabled={actionLoading === cancelDialog}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {actionLoading === cancelDialog && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
