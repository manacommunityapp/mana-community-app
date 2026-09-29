import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Users,
  CalendarDays,
  Clock,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  XCircle,
  Star,
  MessageCircle,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  UserCheck,
} from "lucide-react";
import type { HomeServiceBooking, HomeServiceWorker } from "../../../types/homeServices";
import { homeServiceApi } from "../../../services/homeServices/homeServiceApi";
import { ServiceAttendanceModal } from "./ServiceAttendanceModal";
import { HomeServiceChatModal } from "./HomeServiceChatModal";
import { WorkerGatePassModal } from "./WorkerGatePassModal";
import { HomeServiceReviews } from "./HomeServiceReviews";

export function MyHomeHelp() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<HomeServiceBooking[]>([]);
  const [selectedBookingForAttendance, setSelectedBookingForAttendance] = useState<HomeServiceBooking | null>(null);
  const [selectedBookingForChat, setSelectedBookingForChat] = useState<HomeServiceBooking | null>(null);
  const [selectedWorkerForGatePass, setSelectedWorkerForGatePass] = useState<string | null>(null);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<HomeServiceBooking | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    const data = await homeServiceApi.getBookings("user-current");
    setBookings(data);
  };

  const handlePauseResume = async (booking: HomeServiceBooking) => {
    const nextStatus = booking.status === "PAUSED" ? "CONFIRMED" : "PAUSED";
    await homeServiceApi.updateBookingStatus(booking.id, nextStatus);
    loadBookings();
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (confirm("Are you sure you want to cancel this domestic help service arrangement?")) {
      await homeServiceApi.updateBookingStatus(bookingId, "CANCELLED_BY_RESIDENT", "Cancelled by resident request.");
      loadBookings();
    }
  };

  const activeHelp = bookings.filter((b) => ["CONFIRMED", "SCHEDULED", "PAUSED", "IN_PROGRESS"].includes(b.status));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            My Home Help &amp; Domestic Workers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your daily &amp; monthly recurring helpers, record daily attendance, and coordinate gate passes
          </p>
        </div>
        <button
          onClick={() => navigate("/home-services/find-help")}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
        >
          + Add New Help
        </button>
      </div>

      {/* Active Workers List */}
      {activeHelp.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeHelp.map((b) => (
            <div
              key={b.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Header & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-primary text-white font-black text-lg flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
                      {b.workerName?.[0] || "W"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                          {b.workerName}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            b.status === "PAUSED"
                              ? "bg-amber-50 text-amber-600 border border-amber-200"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-primary mt-0.5">
                        {b.categoryName} • Flat {b.flatNumber}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-slate-900 dark:text-white">
                      ₹{b.price.toLocaleString("en-IN")}
                      <span className="text-[10px] font-normal text-slate-400">/mo</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      {b.pricingModel}
                    </span>
                  </div>
                </div>

                {/* Schedule & Days */}
                <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      Daily Slot:
                    </span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                      {b.startTime} - {b.endTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-primary" />
                      Days:
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {b.recurringDays.map((d) => d.slice(0, 3)).join(", ")}
                    </span>
                  </div>
                </div>

                {b.notes && (
                  <p className="text-xs text-slate-500 italic mt-2.5">
                    "{b.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  onClick={() => setSelectedBookingForAttendance(b)}
                  className="px-2.5 py-2 rounded-xl bg-primary text-primary-foreground font-bold shadow-xs hover:opacity-95 active:scale-95 transition-all text-center cursor-pointer"
                >
                  Attendance
                </button>

                <button
                  onClick={() => setSelectedBookingForChat(b)}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-primary" />
                  Chat
                </button>

                <button
                  onClick={() => setSelectedWorkerForGatePass(b.workerId)}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-slate-500" />
                  QR Pass
                </button>

                <button
                  onClick={() => handlePauseResume(b)}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 text-slate-700 dark:text-slate-200 transition-all text-center cursor-pointer"
                >
                  {b.status === "PAUSED" ? "Resume" : "Pause"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            You currently have no active domestic helpers booked.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Browse verified community maids, cooks, and cleaners to request recurring assistance.
          </p>
          <button
            onClick={() => navigate("/home-services/find-help")}
            className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:opacity-95 cursor-pointer"
          >
            Find Home Help
          </button>
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

      {/* Gate Pass Modal */}
      {selectedWorkerForGatePass && (
        <WorkerGatePassModal
          workerId={selectedWorkerForGatePass}
          onClose={() => setSelectedWorkerForGatePass(null)}
        />
      )}
    </div>
  );
}
