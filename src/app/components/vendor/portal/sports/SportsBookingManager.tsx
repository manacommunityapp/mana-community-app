import { useState, useEffect } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  UserX,
  XCircle,
  QrCode,
  DollarSign,
  Phone,
  Mail,
  Building,
  AlertCircle,
  Eye,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { sportsVendorService } from "../../../../../services/sports/sportsVendorService";
import type { SportsVendorBooking } from "../../../../../types/sportsVendor";

type BookingFilterTab = "ALL" | "CONFIRMED" | "CHECKED_IN" | "NO_SHOW" | "CANCELLED";

export function SportsBookingManager() {
  const [bookings, setBookings] = useState<SportsVendorBooking[]>([]);
  const [activeTab, setActiveTab] = useState<BookingFilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<SportsVendorBooking | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);
    try {
      const data = await sportsVendorService.getBookings();
      setBookings(data);
    } catch (err) {
      toast.error("Failed to load court bookings");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn(bookingId: string) {
    try {
      const updated = await sportsVendorService.checkInBooking(bookingId);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
      if (selectedBooking?.id === bookingId) setSelectedBooking(updated);
      toast.success("Player checked in successfully!");
    } catch (err) {
      toast.error("Error checking in booking");
    }
  }

  async function handleMarkNoShow(bookingId: string) {
    if (!window.confirm("Mark this player as No-Show? This updates court utilization records.")) {
      return;
    }
    try {
      const updated = await sportsVendorService.markNoShow(bookingId);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
      if (selectedBooking?.id === bookingId) setSelectedBooking(updated);
      toast.warning("Booking marked as No-Show");
    } catch (err) {
      toast.error("Error marking no-show");
    }
  }

  async function handleCancel(bookingId: string) {
    const reason = prompt("Reason for cancellation (optional):", "Customer requested");
    if (reason === null) return;

    try {
      const updated = await sportsVendorService.cancelBooking(bookingId, reason);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
      if (selectedBooking?.id === bookingId) setSelectedBooking(updated);
      toast.info("Booking cancelled");
    } catch (err) {
      toast.error("Error cancelling booking");
    }
  }

  const filtered = bookings.filter((b) => {
    if (activeTab !== "ALL" && b.status !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.customerName.toLowerCase().includes(q) ||
        b.bookingNumber.toLowerCase().includes(q) ||
        b.courtName.toLowerCase().includes(q) ||
        b.customerPhone.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Sports Court Bookings</h1>
          <p className="text-xs text-slate-500">
            Monitor player reservations, verify QR check-ins, record attendance, and manage cancellations.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search player, booking #, court..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { key: "ALL", label: "All Bookings", count: bookings.length },
          {
            key: "CONFIRMED",
            label: "Confirmed (Upcoming)",
            count: bookings.filter((b) => b.status === "CONFIRMED").length,
          },
          {
            key: "CHECKED_IN",
            label: "Checked In",
            count: bookings.filter((b) => b.status === "CHECKED_IN").length,
          },
          {
            key: "NO_SHOW",
            label: "No-Show",
            count: bookings.filter((b) => b.status === "NO_SHOW").length,
          },
          {
            key: "CANCELLED",
            label: "Cancelled",
            count: bookings.filter((b) => b.status === "CANCELLED").length,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as BookingFilterTab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === tab.key ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bookings Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No bookings found matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Booking Ref</th>
                  <th className="py-3.5 px-4">Customer / Community</th>
                  <th className="py-3.5 px-4">Court & Sport</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {b.bookingNumber}
                      <span className="block text-[10px] font-normal text-slate-400 font-sans">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{b.customerName}</span>
                      <span className="text-[11px] text-slate-500 block">{b.customerPhone}</span>
                      {b.unitOrCommunity && (
                        <span className="text-[10px] text-indigo-600 font-medium block">
                          {b.unitOrCommunity}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">{b.courtName}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {b.sportType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{b.bookingDate}</span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {b.startTime} - {b.endTime}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">₹{b.amount}</span>
                      <span
                        className={`text-[10px] font-bold ${
                          b.paymentStatus === "PAID" ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === "CHECKED_IN"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : b.status === "CONFIRMED"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : b.status === "NO_SHOW"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {b.status}
                      </span>
                      {b.checkedInAt && (
                        <span className="block text-[9px] text-slate-400 mt-0.5">
                          In: {new Date(b.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title="View Details & QR"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {b.status === "CONFIRMED" && (
                          <>
                            <button
                              onClick={() => handleCheckIn(b.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors"
                              title="Mark Player Checked In"
                            >
                              <Check className="w-3 h-3" />
                              Check-in
                            </button>
                            <button
                              onClick={() => handleMarkNoShow(b.id)}
                              className="p-1 rounded-lg text-amber-600 hover:bg-amber-50"
                              title="Mark No-Show"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCancel(b.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Reservation Details</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedBooking.bookingNumber}</p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* QR Code Placeholder Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-white border border-slate-300 rounded-xl flex items-center justify-center text-slate-700 shadow-xs mb-2">
                  <QrCode className="w-16 h-16 text-slate-800" />
                </div>
                <span className="text-[11px] font-mono text-slate-600 font-bold">
                  {selectedBooking.qrCode || "QR-VERIFY-SAMPLE"}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Scan with front-desk camera to verify reservation
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Player Name</span>
                  <p className="font-bold text-slate-800 text-xs">{selectedBooking.customerName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Phone</span>
                  <p className="font-semibold text-slate-800 text-xs">{selectedBooking.customerPhone}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Date & Slot</span>
                  <p className="font-bold text-slate-800 text-xs">
                    {selectedBooking.bookingDate} ({selectedBooking.startTime})
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Court</span>
                  <p className="font-bold text-indigo-600 text-xs">{selectedBooking.courtName}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Total Paid Amount</span>
                  <span className="text-base font-black text-slate-900">₹{selectedBooking.amount}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {selectedBooking.paymentStatus}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              {selectedBooking.status === "CONFIRMED" && (
                <button
                  onClick={() => handleCheckIn(selectedBooking.id)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Player Check-in
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
