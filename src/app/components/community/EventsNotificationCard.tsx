import { useEffect, useState } from "react";
import {
  Calendar,
  MapPin,
  ChevronRight,
  Loader2,
  Sparkles,
  Flame,
  Utensils,
  Music,
  Trophy,
  Ticket,
  Clock,
  ArrowRight,
} from "lucide-react";
import { eventService, type EventResponse } from "../../../services/events/eventService";
import { useNavigate } from "react-router";

function formatEventDate(dateStr?: string) {
  if (!dateStr) return "Upcoming";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function getCategoryIcon(typeOrCat?: string | null) {
  const c = (typeOrCat || "").toLowerCase();
  if (c.includes("pooja") || c.includes("festival") || c.includes("religious")) {
    return <Flame className="w-3.5 h-3.5 text-amber-600" />;
  }
  if (c.includes("food") || c.includes("meal") || c.includes("prasadam")) {
    return <Utensils className="w-3.5 h-3.5 text-orange-600" />;
  }
  if (c.includes("cultural") || c.includes("music") || c.includes("dance")) {
    return <Music className="w-3.5 h-3.5 text-purple-600" />;
  }
  if (c.includes("comp") || c.includes("contest") || c.includes("sport")) {
    return <Trophy className="w-3.5 h-3.5 text-blue-600" />;
  }
  return <Calendar className="w-3.5 h-3.5 text-indigo-600" />;
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

      if (Array.isArray(allUpcoming)) {
        setEvents(allUpcoming.slice(0, 4));
      }
      if (Array.isArray(myPasses)) {
        setMyPassCount(myPasses.length);
      }
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventsData();

    const handleReload = () => {
      loadEventsData();
    };

    window.addEventListener("mana_activities_updated", handleReload);
    window.addEventListener("mana_event_created", handleReload);

    return () => {
      window.removeEventListener("mana_activities_updated", handleReload);
      window.removeEventListener("mana_event_created", handleReload);
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>Events &amp; Notifications</span>
              {events.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100">
                  {events.length}
                </span>
              )}
            </h4>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/events")}
          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
        >
          View All <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* User Pass Badge banner */}
      {myPassCount > 0 && (
        <div
          onClick={() => navigate("/events")}
          className="p-2.5 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-all group"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
              <Ticket className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-indigo-900 leading-tight">
                {myPassCount} Active E-Pass{myPassCount > 1 ? "es" : ""}
              </p>
              <p className="text-[9px] text-indigo-600 font-medium">Tap to view your QR Gate Passes</p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-4 text-xs text-slate-400 gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Loading events...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-4 space-y-1">
          <p className="text-xs font-semibold text-slate-600">No Upcoming Events</p>
          <p className="text-[10px] text-slate-400">Check back soon for new community activities.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => navigate("/events")}
              className="w-full text-left flex items-start gap-2.5 p-2 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/40 hover:border-indigo-200 transition-all group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-indigo-300 transition-colors shadow-2xs">
                {getCategoryIcon(ev.category || ev.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h5 className="text-[11px] font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                    {ev.title}
                  </h5>
                  <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {ev.price && ev.price > 0 ? `₹${ev.price}` : "FREE"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[9.5px] text-slate-500 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-0.5">
                    <Calendar className="w-2.5 h-2.5 text-slate-400" />
                    {formatEventDate(ev.startDate)}
                  </span>
                  {ev.startTime && (
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5 text-slate-400" />
                      {ev.startTime}
                    </span>
                  )}
                  {ev.venue && (
                    <span className="flex items-center gap-0.5 truncate max-w-[100px]">
                      <MapPin className="w-2.5 h-2.5 text-slate-400" />
                      {ev.venue}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}