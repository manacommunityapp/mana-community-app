import { useState, useMemo, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { MapPin, Filter, ChevronRight, ShieldAlert, Volleyball, Goal, Loader2, AlertTriangle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { sportsService } from "../../../services/sportsService";
import { useAuth } from "../../../contexts/AuthContext";
import type { SportsEvent, SportMeta } from "../../../types/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BasketballIcon = ({ size = 24, className, ...props }: React.ComponentPropsWithoutRef<"svg"> & { size?: number | string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2v20" />
    <path d="M2 12h20" />
    <path d="M4.93 4.93a10 10 0 0 1 0 14.14" />
    <path d="M19.07 4.93a10 10 0 0 0 0 14.14" />
  </svg>
);

const DEFAULT_SPORT_ICONS: Record<string, React.ElementType> = {
  Basketball: BasketballIcon,
  Soccer: Goal,
  Volleyball: Volleyball,
};

const SPORT_COLORS: Record<string, string> = {
  Basketball: "bg-orange-100 text-orange-700 border-orange-200",
  Soccer: "bg-green-100 text-green-700 border-green-200",
  Volleyball: "bg-blue-100 text-blue-700 border-blue-200",
};

function DefaultSportIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

export function Scheduler() {
  const { user } = useAuth();
  const [events, setEvents] = useState<SportsEvent[]>([]);
  const [sportsMeta, setSportsMeta] = useState<SportMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [meta, eventsData] = await Promise.all([
          sportsService.getSportsMeta(),
          user?.communityId
            ? sportsService.getOpenEvents(user.communityId)
            : sportsService.getMyEvents(),
        ]);
        setSportsMeta(meta);
        setEvents(eventsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load sports data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.communityId]);

  const sportFilters = useMemo(() => {
    const names = sportsMeta.map((s) => s.name);
    return ["All", ...names];
  }, [sportsMeta]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === "All") return events;
    return events.filter((e) => e.sport?.name === activeFilter);
  }, [events, activeFilter]);

  const getSportIcon = (sportName?: string): React.ElementType => {
    if (!sportName) return DefaultSportIcon;
    return DEFAULT_SPORT_ICONS[sportName] ?? DefaultSportIcon;
  };

  const getSportColors = (sportName?: string) => {
    if (sportName === "Basketball") return { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
    if (sportName === "Soccer") return { color: "#10b981", bg: "rgba(16,185,129,0.1)" };
    if (sportName === "Volleyball") return { color: "#6366f1", bg: "rgba(99,102,241,0.1)" };
    return { color: "#4f46e5", bg: "rgba(99,102,241,0.1)" };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "LIVE": return { label: "LIVE", cls: "bg-red-100 text-red-700 animate-pulse" };
      case "REGISTRATION_OPEN": return { label: "OPEN", cls: "bg-green-100 text-green-700" };
      case "COMPLETED": return { label: "FINAL", cls: "bg-slate-200 text-slate-600" };
      case "CANCELLED": return { label: "CANCELLED", cls: "bg-red-50 text-red-600" };
      default: return { label: status, cls: "bg-slate-100 text-slate-600" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sports Events</h1>
          <p className="text-slate-500 mt-1">View upcoming events and register your team.</p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          <Filter className="h-4 w-4 mr-1 hidden sm:block" style={{ color: "#6b7094" }} />
          {loading
            ? null
            : sportFilters.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer"
                  style={isActive
                    ? { background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white", boxShadow: "0 2px 8px rgba(99,102,241,0.3)" }
                    : { background: "white", color: "#6b7094", border: "1px solid rgba(99, 102, 241, 0.15)" }}
                >
                  {filter}
                </button>
              );
            })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {loading && (
            <div className="rounded-xl p-12 flex flex-col items-center justify-center"
              style={{
                background: "white",
                border: "1px solid rgba(99, 102, 241, 0.12)",
                boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px",
              }}
            >
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-3" />
              <p className="text-slate-500">Loading events...</p>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-800">Failed to load events</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 text-sm text-red-700 underline"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {!loading && !error && filteredEvents.length === 0 && (
            <div className="rounded-xl p-12 flex flex-col items-center justify-center text-center"
              style={{
                background: "white",
                border: "1px solid rgba(99, 102, 241, 0.12)",
                boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px",
              }}
            >
              <div className="bg-slate-100 p-3 rounded-full mb-4">
                <ShieldAlert className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No events found</h3>
              <p className="text-slate-500 max-w-sm mt-1">
                {activeFilter === "All"
                  ? "No open events in your community right now. Check back later!"
                  : `No ${activeFilter} events available. Try a different filter.`}
              </p>
            </div>
          )}

          {!loading && !error && filteredEvents.map((event) => {
            const Icon = getSportIcon(event.sport?.name);
            const badge = getStatusBadge(event.status || "DRAFT");
            const parsedDate = event.eventDateStart ? parseISO(event.eventDateStart) : null;
            const isLive = event.status === "LIVE";
            const isDone = event.status === "COMPLETED";

            return (
              <div
                key={event.id}
                className="overflow-hidden card-hover-lift"
                style={{
                  background: "white",
                  border: isLive ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(99, 102, 241, 0.12)",
                  boxShadow: isLive ? "0 4px 20px rgba(239,68,68,0.1)" : "rgba(99, 102, 241, 0.06) 0px 2px 12px",
                  borderRadius: "1rem",
                }}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Date Column */}
                  <div className="p-4 sm:w-48 flex sm:flex-col justify-between sm:justify-center items-center sm:border-r border-b sm:border-b-0"
                    style={{
                      background: isLive ? "rgba(239,68,68,0.04)" : "rgba(99, 102, 241, 0.03)",
                      borderColor: "rgba(99, 102, 241, 0.08)",
                    }}
                  >
                    <div className="text-center">
                      {parsedDate ? (
                        <>
                          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7094" }}>
                            {format(parsedDate, "MMM d")}
                          </p>
                          <p className="text-lg font-bold mt-0.5" style={{ color: "#0d0d2b" }}>
                            {format(parsedDate, "h:mm a")}
                          </p>
                        </>
                      ) : (
                        <div className="text-sm text-slate-400">TBD</div>
                      )}
                    </div>
                    {isLive && (
                      <div className="flex items-center gap-1.5 mt-2 bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse"
                        style={{ background: "rgba(239,68,68,0.12)", color: "#dc2626" }}>
                        <div className="h-1.5 w-1.5 bg-red-500 rounded-full" />
                        LIVE
                      </div>
                    )}
                    {isDone && (
                      <span className="mt-2 px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ background: "rgba(99, 102, 241, 0.08)", color: "#4f46e5" }}>
                        FINAL
                      </span>
                    )}
                    {!isLive && !isDone && (
                      <div className="mt-2 px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ background: "rgba(99, 102, 241, 0.06)", color: "#6b7094" }}>
                        {badge.label}
                      </div>
                    )}
                  </div>

                  {/* Matchup Column */}
                  <div className="p-5 flex-1 flex flex-col justify-center text-left">
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          color: getSportColors(event.sport?.name).color,
                          background: getSportColors(event.sport?.name).bg
                        }}
                      >
                        <Icon className="w-3 h-3 mr-1" />
                        {event.sport?.name ?? "Sport"}
                      </span>
                      {event.venue && (
                        <div className="flex items-center text-sm" style={{ color: "#6b7094" }}>
                          <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                          {event.venue.name}
                        </div>
                      )}
                    </div>

                    <h4 className="text-lg font-bold text-slate-800 mb-1">{event.name}</h4>
                    {event.maxParticipants && (
                      <p className="text-sm mb-2" style={{ color: "#6b7094" }}>
                        Max participants: {event.maxParticipants}
                      </p>
                    )}

                    <div className="ml-6 pl-6 border-l border-slate-100 hidden sm:flex items-center justify-end mt-2">
                      <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer">
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl p-5 text-left"
            style={{
              background: "white",
              border: "1px solid rgba(99, 102, 241, 0.12)",
              boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px",
            }}
          >
            <h3 className="font-bold text-slate-800 mb-4 flex items-center text-sm uppercase tracking-wider">
              <Trophy className="w-5 h-5 mr-2 text-amber-500" />
              Season Highlights
            </h3>
            <ul className="space-y-3">
              <li className="flex justify-between items-center text-xs">
                <span style={{ color: "#6b7094" }}>Total Events</span>
                <span className="font-bold text-slate-800">{events.length}</span>
              </li>
              <li className="flex justify-between items-center text-xs">
                <span style={{ color: "#6b7094" }}>Active Sports</span>
                <span className="font-bold text-slate-800">{sportsMeta.length}</span>
              </li>
              <li className="flex justify-between items-center text-xs">
                <span style={{ color: "#6b7094" }}>Open for Registration</span>
                <span className="font-bold text-slate-800">
                  {events.filter((e) => e.status === "REGISTRATION_OPEN").length}
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl p-5 text-left"
            style={{
              background: "linear-gradient(135deg, #f59e0b, #f97316)",
              boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
            }}
          >
            <h3 className="font-bold text-white mb-2 text-sm">Want to join the league?</h3>
            <p className="text-white/80 text-xs mb-4">Registration for the current season is open for all sports.</p>
            <a href="/sports/register" className="inline-block w-full text-center py-2.5 bg-white text-amber-600 hover:bg-slate-50 text-xs font-bold rounded-lg transition-colors shadow-sm">
              Register a Team
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Trophy(props: { className?: string }) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7c0 6 6 8 6 8s6-2 6-8V2Z" />
    </svg>
  );
}
