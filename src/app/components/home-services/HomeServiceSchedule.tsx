import { useState, useEffect } from "react";
import { Calendar, Clock, User, MapPin } from "lucide-react";
import { homeServiceApi } from "../../../services/homeServices/homeServiceApi";

interface ScheduleEntry {
  id: string;
  bookingId: string;
  serviceDate: string;
  dayLabel: string;
  workerName: string;
  categoryName: string;
  startTime: string;
  endTime: string;
  flatNumber: string;
  status: "TODAY" | "UPCOMING";
}

export function HomeServiceSchedule() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);

  useEffect(() => {
    homeServiceApi.getUpcomingSchedule().then(setSchedule);
  }, []);

  const grouped = schedule.reduce<Record<string, ScheduleEntry[]>>((acc, s) => {
    if (!acc[s.serviceDate]) acc[s.serviceDate] = [];
    acc[s.serviceDate].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
          Upcoming Schedule
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          7-day view of all scheduled domestic help visits
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([date, entries]) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase">
                {entries[0].dayLabel}
              </h3>
              {entries[0].status === "TODAY" && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                  TODAY
                </span>
              )}
            </div>

            <div className="space-y-2">
              {entries.map((s) => (
                <div
                  key={s.id}
                  className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    s.status === "TODAY"
                      ? "border-primary/30 bg-primary/5"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-black flex items-center justify-center shrink-0">
                      {s.workerName[0]}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {s.workerName}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {s.categoryName} • Flat {s.flatNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 self-end sm:self-auto">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    {s.startTime} - {s.endTime}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {schedule.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-sm font-bold text-slate-400">No upcoming schedule found.</p>
            <p className="text-xs text-slate-400 mt-1">Book a recurring helper to see your schedule here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
