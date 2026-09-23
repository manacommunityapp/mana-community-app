import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  HelpCircle,
  Receipt,
  Download,
} from "lucide-react";
import type { HomeServiceBooking, ServiceAttendance, AttendanceStatus } from "../../../types/homeServices";
import { homeServiceApi } from "../../../services/homeServices/homeServiceApi";

interface ServiceAttendanceModalProps {
  booking: HomeServiceBooking;
  onClose: () => void;
}

export function ServiceAttendanceModal({ booking, onClose }: ServiceAttendanceModalProps) {
  const [attendance, setAttendance] = useState<ServiceAttendance[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [statusToMark, setStatusToMark] = useState<AttendanceStatus>("COMPLETED");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    loadAttendance();
  }, [booking.id]);

  const loadAttendance = async () => {
    const data = await homeServiceApi.getAttendance(booking.id);
    setAttendance(data);
  };

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    await homeServiceApi.markAttendance({
      bookingId: booking.id,
      workerId: booking.workerId,
      serviceDate: selectedDate,
      status: statusToMark,
      notes,
    });
    setNotes("");
    loadAttendance();
  };

  const billSummary = homeServiceApi.calculateMonthlyBill(booking, attendance);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-w-2xl w-full">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
              Attendance &amp; Service History — {booking.workerName}
            </h3>
            <p className="text-xs text-slate-500">
              {booking.categoryName} • Flat {booking.flatNumber} ({booking.pricingModel})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Monthly Bill Calculation Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-primary/5 to-violet-500/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                Billing Summary (September 2026)
              </span>
              <div className="flex items-center gap-3 mt-1 font-bold">
                <span className="text-emerald-600 dark:text-emerald-400">
                  ✓ {billSummary.completedDays} Completed
                </span>
                <span className="text-rose-600 dark:text-rose-400">
                  ❌ {billSummary.absentDays} Absent
                </span>
                <span className="text-amber-600 dark:text-amber-400">
                  ⛱️ {billSummary.leaveDays} Leave
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Model: {billSummary.calculationNote}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Amount</span>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                ₹{billSummary.totalBill.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* Mark Attendance Form */}
          <form onSubmit={handleMarkAttendance} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <h4 className="font-extrabold text-slate-900 dark:text-white">
              Mark / Update Attendance
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="font-bold text-slate-500 block mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-500 block mb-1">Status</label>
                <select
                  value={statusToMark}
                  onChange={(e) => setStatusToMark(e.target.value as any)}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                >
                  <option value="COMPLETED">✓ Completed</option>
                  <option value="ABSENT">❌ Absent</option>
                  <option value="LEAVE">⛱️ Leave</option>
                  <option value="HOLIDAY">- Holiday</option>
                  <option value="CANCELLED">🚫 Cancelled</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-500 block mb-1">Optional Note</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Extra deep cleaned"
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold shadow-xs hover:opacity-95 cursor-pointer"
              >
                Record Entry
              </button>
            </div>
          </form>

          {/* History List */}
          <div>
            <h4 className="text-xs font-extrabold uppercase text-slate-400 mb-2">
              Service Logs
            </h4>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {attendance.length > 0 ? (
                attendance.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {rec.serviceDate}
                      </span>
                      {rec.notes && (
                        <span className="text-[11px] text-slate-400 italic">
                          "{rec.notes}"
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                          rec.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : rec.status === "ABSENT"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {rec.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        by {rec.markedBy}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">
                  No attendance records logged yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
