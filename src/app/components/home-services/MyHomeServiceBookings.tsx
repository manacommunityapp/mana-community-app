import { useState, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import type { HomeServiceBooking, BookingStatus } from "../../../types/homeServices";
import { homeServiceApi } from "../../../services/homeServices/homeServiceApi";
import { ServiceAttendanceModal } from "./ServiceAttendanceModal";
import { HomeServiceChatModal } from "./HomeServiceChatModal";
import { HomeServiceReviews } from "./HomeServiceReviews";

export function MyHomeServiceBookings() {
  const [bookings, setBookings] = useState<HomeServiceBooking[]>([]);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [selectedBookingForAttendance, setSelectedBookingForAttendance] = useState<HomeServiceBooking | null>(null);
  const [selectedBookingForChat, setSelectedBookingForChat] = useState<HomeServiceBooking | null>(null);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<HomeServiceBooking | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    const data = await homeServiceApi.getBookings("user-current");
    setBookings(data);
  };

  const handleUpdateStatus = async (bookingId: string, status: BookingStatus) => {
    await homeServiceApi.updateBookingStatus(bookingId, status);
    loadBookings();
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "REQUESTED") return b.status === "REQUESTED";
    if (activeTab === "CONFIRMED") return b.status === "CONFIRMED" || b.status === "SCHEDULED";
    if (activeTab === "COMPLETED") return b.status === "COMPLETED";
    if (activeTab === "CANCELLED") return b.status.includes("CANCELLED") || b.status === "REJECTED";
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            My Service Bookings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track and manage all requested, confirmed, and past domestic service arrangements
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto text-xs font-bold">
          {["ALL", "REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-white dark:bg-slate-900 text-primary shadow-xs font-extrabold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length > 0 ? (
        <div className="space-y-3">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-black text-lg flex items-center justify-center shrink-0">
                  {b.workerName?.[0] || "W"}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                      {b.workerName}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        b.status === "CONFIRMED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : b.status === "REQUESTED"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : b.status === "COMPLETED"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-primary mt-0.5">
                    {b.categoryName} • Flat {b.flatNumber}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium">
                    <span>{b.startDate}</span>
                    <span>•</span>
                    <span>{b.startTime} - {b.endTime}</span>
                    <span>•</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      ₹{b.price.toLocaleString("en-IN")} ({b.pricingModel})
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto text-xs">
                {b.status === "REQUESTED" && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(b.id, "CONFIRMED")}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all cursor-pointer"
                    >
                      Simulate Worker Accept
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(b.id, "REJECTED")}
                      className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-600 font-bold hover:bg-rose-50 transition-all cursor-pointer"
                    >
                      Reject
                    </button>
                  </>
                )}

                {b.status === "CONFIRMED" && (
                  <>
                    <button
                      onClick={() => setSelectedBookingForAttendance(b)}
                      className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-xs hover:opacity-95 cursor-pointer"
                    >
                      Attendance
                    </button>
                    <button
                      onClick={() => setSelectedBookingForChat(b)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-primary" />
                      Chat
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(b.id, "COMPLETED")}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 cursor-pointer"
                    >
                      Mark Complete
                    </button>
                  </>
                )}

                {b.status === "COMPLETED" && (
                  <button
                    onClick={() => setSelectedBookingForReview(b)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold shadow-xs hover:bg-amber-600 cursor-pointer"
                  >
                    Rate &amp; Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No bookings found in this category.
          </p>
        </div>
      )}

      {/* Attendance Modal */}
      {selectedBookingForAttendance && (
        <ServiceAttendanceModal
          booking={selectedBookingForAttendance}
          onClose={() => setSelectedBookingForAttendance(null)}
        />
      )}

      {/* Contextual Chat Modal */}
      {selectedBookingForChat && (
        <HomeServiceChatModal
          booking={selectedBookingForChat}
          onClose={() => setSelectedBookingForChat(null)}
        />
      )}
    </div>
  );
}
