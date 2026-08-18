import { useEffect, useState } from "react";
import {
  Calendar, MapPin, ChevronRight, Loader2, Flame,
  Utensils, Music, Trophy, Ticket, Clock, ArrowRight,
} from "lucide-react";
import { eventService, type EventResponse } from "../../../services/events/eventService";
import { useNavigate } from "react-router";

function formatEventDate(dateStr?: string) {
  if (!dateStr) return "Upcoming";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function getCategoryMeta(typeOrCat?: string | null): {
  icon: React.ReactNode;
  dot: string;
} {
  const c = (typeOrCat || "").toLowerCase();
  if (c.includes("pooja") || c.includes("festival") || c.includes("religious"))
    return { icon: <Flame className="w-3 h-3" />, dot: "bg-amber-400" };
  if (c.includes("food") || c.includes("meal") || c.includes("prasadam"))
    return { icon: <Utensils className="w-3 h-3" />, dot: "bg-orange-400" };
  if (c.includes("cultural") || c.includes("music") || c.includes("dance"))
    return { icon: <Music className="w-3 h-3" />, dot: "bg-purple-400" };
  if (c.includes("comp") || c.includes("contest") || c.includes("sport"))
    return { icon: <Trophy className="w-3 h-3" />, dot: "bg-blue-400" };
  return { icon: <Calendar className="w-3 h-3" />, dot: "bg-indigo-400" };
}

export function EventsNotificationCard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [myPassCount, setMyPassCount] = useState<number>(0);

  const loadEventsData = async () => {
    try {
      setLoading(true);
      const [allUpcoming, myPasses] = await Promise.all([
        eventService.getUpcomingEvents().catch(() => []),
        eventService.getMyRegistrations().catch(() => []),
      ]);
      if (Array.isArray(allUpcoming)) setEvents(allUpcoming.slice(0, 4));
      if (Array.isArray(myPasses)) setMyPassCount(myPasses.length);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventsData();
    const reload = () => loadEventsData();
    window.addEventListener("mana_activities_updated", reload);
    window.addEventListener("mana_event_created", reload);
    return () => {
      window.removeEventListener("mana_activities_updated", reload);
      window.removeEventListener("mana_event_created", reload);
    };
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center">
            <Calendar className="w-3 h-3 text-white" />
          </div>
          <span className="text-[11px] font-black text-slate-800 tracking-wide uppercase">
            Events
          </span>
          {events.length > 0 && (
            <span className="px-1.5 py-px rounded-full text-[9px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 leading-none">
              {events.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate("/events")}
          className="flex items-center gap-0.5 text-[10px] font-bold text-indigo-500 hover:text-indigo-700 transition-colors cursor-pointer"
        >
          All <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Pass badge — compact strip */}
      {myPassCount > 0 && (
        <button
          type="button"
          onClick={() => navigate("/events")}
          className="w-full flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100 hover:from-indigo-100 hover:to-violet-100 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center">
              <Ticket className="w-3 h-3" />
            </div>
            <span className="text-[10px] font-bold text-indigo-800">
              {myPassCount} active e-pass{myPassCount > 1 ? "es" : ""}
            </span>
          </div>
          <ArrowRight className="w-3 h-3 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Body */}
      <div className="px-3 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-3 gap-1.5 text-[10px] text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
            Loading…
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-3">
            <p className="text-[10px] font-semibold text-slate-500">No upcoming events</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Check back soon.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {events.map((ev) => {
              const { icon, dot } = getCategoryMeta(ev.category || ev.type);
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => navigate("/events")}
                  className="w-full text-left flex items-center gap-2 py-2 hover:bg-slate-50 rounded-lg px-1 -mx-1 transition-colors group cursor-pointer"
                >
                  {/* Color dot + icon */}
                  <div className="relative shrink-0">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                      {icon}
                    </div>
                    <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${dot} ring-1 ring-white`} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10.5px] font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors leading-tight">
                      {ev.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-0.5 text-[9px] text-slate-400">
                        <Clock className="w-2 h-2" />
                        {formatEventDate(ev.startDate)}
                        {ev.startTime && ` · ${ev.startTime}`}
                      </span>
                      {ev.venue && (
                        <span className="flex items-center gap-0.5 text-[9px] text-slate-400 truncate max-w-[80px]">
                          <MapPin className="w-2 h-2 shrink-0" />
                          {ev.venue}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price badge */}
                  <span className={`shrink-0 text-[8.5px] font-black px-1.5 py-0.5 rounded-full ${
                    ev.price && ev.price > 0
                      ? "bg-slate-100 text-slate-600"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}>
                    {ev.price && ev.price > 0 ? `₹${ev.price}` : "FREE"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      {!loading && events.length > 0 && (
        <button
          type="button"
          onClick={() => navigate("/events")}
          className="w-full flex items-center justify-center gap-1 py-2 text-[10px] font-bold text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 border-t border-slate-100 transition-colors cursor-pointer"
        >
          View all events <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
