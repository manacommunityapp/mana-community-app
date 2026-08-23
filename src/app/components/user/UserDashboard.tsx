import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { Link } from "react-router";
import {
  CalendarDays,
  Megaphone,
  Building2,
  Headphones,
  Trophy,
  Store,
  Vote,
  Briefcase,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Bell,
  Clock,
  ChevronLeft,
  ChevronRight,
  Ticket,
  MapPin,
} from "lucide-react";
import { apiClient } from "../../../services/common/apiClient";
import { eventService, type EventResponse } from "../../../services/events/eventService";

interface UserStats {
  userName: string;
  communityName: string;
  activeEventsCount: number;
  activeNoticesCount: number;
  myBookingsCount: number;
  myTicketsCount: number;
  recentNotices: Array<{ id: number; title: string; category: string; createdAt: string }>;
}

export function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    userName: user?.fullName || user?.email || "Community Member",
    communityName: "Mana Community",
    activeEventsCount: 0,
    activeNoticesCount: 0,
    myBookingsCount: 0,
    myTicketsCount: 0,
    recentNotices: [],
  });
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<EventResponse[]>([]);
  const [eventCarouselIndex, setEventCarouselIndex] = useState(0);
  const [isEventHovered, setIsEventHovered] = useState(false);

  useEffect(() => {
    apiClient
      .get<UserStats>("/dashboard/user/stats")
      .then((res) => {
        if (res) setStats(res);
      })
      .catch((err) => {
        console.error("Failed to load user dashboard stats:", err);
      })
      .finally(() => setLoading(false));

    eventService.getAllEvents()
      .then((evs) => {
        const running = (evs || []).filter(e => String(e.status || "").toUpperCase() !== "CANCELLED");
        setUpcomingEvents(running);
      })
      .catch((err) => console.warn("Notice: could not load events for user dashboard:", err));
  }, []);

  // Auto-move event banner every 4.5s (pauses on hover)
  useEffect(() => {
    if (upcomingEvents.length <= 1 || isEventHovered) return;
    const timer = setInterval(() => {
      setEventCarouselIndex((prev) => (prev + 1) % upcomingEvents.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [upcomingEvents.length, isEventHovered]);

  const activeEvent = upcomingEvents[Math.min(eventCarouselIndex, upcomingEvents.length - 1)];

  const handlePrevEvent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEventCarouselIndex((prev) => (prev - 1 + upcomingEvents.length) % upcomingEvents.length);
  };

  const handleNextEvent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEventCarouselIndex((prev) => (prev + 1) % upcomingEvents.length);
  };

  const quickModules = [
    { label: "Community Feed", icon: Sparkles, to: "/", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
    { label: "Events", icon: CalendarDays, to: "/events", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
    { label: "Sports", icon: Trophy, to: "/sports", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
    { label: "Marketplace", icon: Store, to: "/marketplace", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
    { label: "Bookings", icon: Building2, to: "/bookings", color: "bg-teal-500/10 text-teal-600 border-teal-200" },
    { label: "Notices", icon: Megaphone, to: "/notices", color: "bg-red-500/10 text-red-600 border-red-200" },
    { label: "Helpdesk", icon: Headphones, to: "/helpdesk", color: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
    { label: "Polls", icon: Vote, to: "/polls", color: "bg-pink-500/10 text-pink-600 border-pink-200" },
    { label: "Jobs", icon: Briefcase, to: "/jobs", color: "bg-orange-500/10 text-orange-600 border-orange-200" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-accent p-6 sm:p-8 text-primary-foreground shadow-xl">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            User Dashboard
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {stats.userName}! 👋
          </h1>
          <p className="text-sm sm:text-base text-primary-foreground/80 max-w-2xl font-medium">
            Stay connected with {stats.communityName}. Here is your quick overview for today.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-8 translate-y-8 pointer-events-none">
          <Building2 className="h-64 w-64" />
        </div>
      </div>

      {/* ── Live Event Showcase Banner with Auto-Move and Navigation Controls ── */}
      {upcomingEvents.length > 0 && activeEvent && (() => {
        const activeEventImage =
          activeEvent.coverImage ||
          activeEvent.coverImageUrl ||
          activeEvent.imageUrl ||
          (activeEvent as any)?.bannerUrl ||
          (activeEvent as any)?.posterUrl;

        return (
          <div
            onMouseEnter={() => setIsEventHovered(true)}
            onMouseLeave={() => setIsEventHovered(false)}
            className="relative rounded-2xl overflow-hidden shadow-md transition-all duration-300 border border-indigo-900/20"
            style={{
              background: "linear-gradient(135deg, #3730A3 0%, #4F46E5 40%, #7C3AED 72%, #9333EA 100%)",
            }}
          >
            {/* Ambient Image Background (if event has an image) */}
            {activeEventImage && (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-20 blur-md scale-110 pointer-events-none z-0"
                style={{ backgroundImage: `url(${activeEventImage})` }}
              />
            )}
            <div
              className="absolute inset-0 opacity-[0.07] pointer-events-none z-0"
              style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }}
            />
            <div
              className="absolute right-0 top-0 w-48 h-full rounded-full opacity-15 blur-3xl pointer-events-none z-0"
              style={{ background: "radial-gradient(circle, #FEF3C7 0%, transparent 70%)", transform: "translate(20%,-20%)" }}
            />

            <div className="relative z-10 p-3 sm:p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                {/* Event Cover Image Thumbnail */}
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-xl shrink-0 shadow-md overflow-hidden group">
                  <span className="text-2xl select-none">🕉️</span>
                  {activeEventImage && (
                    <img
                      src={activeEventImage}
                      alt={activeEvent.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-400/20 text-amber-200 border border-amber-300/30 uppercase tracking-wider">
                      🔥 {activeEvent.category || "Featured Event"}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-[9.5px] font-bold border border-emerald-400/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {upcomingEvents.length > 1 ? `Live · Event ${eventCarouselIndex + 1} of ${upcomingEvents.length}` : `Live · 1 Event`}
                    </span>
                    {(activeEvent.attendees ?? (activeEvent as any).registrationCount) != null && (
                      <span className="text-[11px] font-semibold text-white/80 hidden sm:inline-flex items-center gap-1">
                        <Ticket className="w-3.5 h-3.5 text-indigo-200" /> {activeEvent.attendees ?? (activeEvent as any).registrationCount ?? 0} registered
                      </span>
                    )}
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-white leading-tight drop-shadow-sm truncate">
                    {activeEvent.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-[10.5px] font-normal text-white/80">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-amber-300" /> {activeEvent.venue || activeEvent.location || "Community Grounds"}</span>
                    <span className="text-white/30">·</span>
                    <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3 text-indigo-200" /> {activeEvent.startDate}{activeEvent.endDate && activeEvent.endDate !== activeEvent.startDate ? ` – ${activeEvent.endDate}` : ""}</span>
                  </div>
                </div>
              </div>

              {/* Navigation Controller & Action Link */}
              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                {upcomingEvents.length > 1 && (
                  <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-xs px-2 py-1 rounded-xl border border-white/15 shadow-xs">
                    <button
                      type="button"
                      onClick={handlePrevEvent}
                      className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                      title="Previous Event"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-1 px-1">
                      {upcomingEvents.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setEventCarouselIndex(dotIdx); }}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            dotIdx === eventCarouselIndex
                              ? "w-4 bg-amber-400 shadow-xs"
                              : "w-1.5 bg-white/40 hover:bg-white/70"
                          }`}
                          title={`Go to Event ${dotIdx + 1}`}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleNextEvent}
                      className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                      title="Next Event"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <Link
                  to="/events"
                  className="px-3.5 py-1.5 rounded-xl text-white text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
                  style={{ background: "linear-gradient(135deg, #EA580C, #F97316)" }}
                >
                  <span>View / Register</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Events</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold">{loading ? "-" : stats.activeEventsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Upcoming community events</p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Community Notices</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-600">
              <Megaphone className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold">{loading ? "-" : stats.activeNoticesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Broadcast announcements</p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">My Bookings</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold">{loading ? "-" : stats.myBookingsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Reserved amenities</p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Helpdesk Tickets</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
              <Headphones className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold">{loading ? "-" : stats.myTicketsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Active support queries</p>
          </div>
        </div>
      </div>

      {/* ── Upcoming Community Events Section with Photos ── */}
      {upcomingEvents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Upcoming Events &amp; Festivals
            </h2>
            <Link
              to="/events"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>View All Events</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.slice(0, 3).map((evt) => {
              const evtImg =
                evt.coverImage ||
                evt.coverImageUrl ||
                evt.imageUrl ||
                (evt as any)?.bannerUrl ||
                (evt as any)?.posterUrl;

              return (
                <Link
                  key={evt.id}
                  to="/events"
                  className="group bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Event Cover Image / Gradient Header */}
                    <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
                      {evtImg ? (
                        <img
                          src={evtImg}
                          alt={evt.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="text-white/80 flex flex-col items-center gap-1 select-none">
                          <span className="text-3xl">🕉️</span>
                          <span className="text-[11px] font-bold uppercase tracking-wider">{evt.category || "Festival"}</span>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
                        <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-black/50 text-white backdrop-blur-md border border-white/20">
                          {evt.category || "Event"}
                        </span>
                        {evt.price != null && (
                          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-emerald-500 text-white shadow-xs">
                            {Number(evt.price) === 0 ? "Free" : `₹${evt.price}`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <h3 className="font-extrabold text-foreground text-sm group-hover:text-primary transition-colors line-clamp-1">
                        {evt.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {evt.description || "Join the community celebration, poojas, cultural programs and festivities."}
                      </p>

                      <div className="space-y-1 pt-1 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">
                            {evt.startDate}
                            {evt.endDate && evt.endDate !== evt.startDate ? ` – ${evt.endDate}` : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{evt.venue || evt.location || "Community Grounds"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="px-4 pb-4 pt-1 flex items-center justify-between border-t border-border/60">
                    <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <Ticket className="w-3.5 h-3.5 text-indigo-500" />
                      {evt.attendees ?? (evt as any)?.registrationCount ?? 0} booked
                    </span>
                    <span className="text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      <span>Register</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Access Modules Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Quick Access Services
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {quickModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.label}
                to={mod.to}
                className="group flex flex-col items-center justify-center p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all text-center space-y-2"
              >
                <div className={`p-3 rounded-xl border transition-transform group-hover:scale-110 ${mod.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  {mod.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Admin Quick Management Tools (if user has any admin role) */}
      {useAuth().isAnyAdmin && (
        <div className="space-y-4 pt-2">
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Admin Quick Management
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              to="/admin/roles"
              className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all"
            >
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">User &amp; Roles</div>
                <div className="text-xs text-muted-foreground">Manage user role assignments</div>
              </div>
            </Link>

            <Link
              to="/admin/access-roles"
              className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all"
            >
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">Access &amp; Roles</div>
                <div className="text-xs text-muted-foreground">Configure module permissions</div>
              </div>
            </Link>

            <Link
              to="/admin"
              className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all"
            >
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">Admin Hub</div>
                <div className="text-xs text-muted-foreground">Full community management hub</div>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
