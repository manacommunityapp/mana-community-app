import { useEffect, useState } from "react";
import { Trophy, Calendar, MapPin, Users, ChevronRight, ChevronDown, ChevronUp, Loader2, Bell, Award, Zap } from "lucide-react";
import { sportsEventService } from "../../../services/sports/sportsEventService";
import { notificationService } from "../../../services/notices/notificationService";
import type { SportsEvent } from "../../../types/api";
import type { NotificationItem } from "../../../services/notices/notificationService";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router";

// ─── Helpers ───────────────────────────────────────────────────────────────
function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function statusBadge(status?: string) {
  const s = (status ?? "").toUpperCase();
  if (s === "REGISTRATION_OPEN" || s === "OPEN")
    return { label: "Registration Open", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (s === "UPCOMING")
    return { label: "Upcoming", cls: "bg-sky-50 text-sky-700 border-sky-200" };
  if (s === "ONGOING" || s === "IN_PROGRESS")
    return { label: "Live", cls: "bg-rose-50 text-rose-700 border-rose-200 animate-pulse" };
  if (s === "COMPLETED")
    return { label: "Completed", cls: "bg-slate-100 text-slate-500 border-slate-200" };
  return { label: s || "Event", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" };
}

// ─── SportEventRow ─────────────────────────────────────────────────────────
function SportEventRow({ ev, onNavigate }: { ev: SportsEvent; onNavigate: () => void }) {
  const badge = statusBadge(ev.status ?? ev.registrationStatus);
  return (
    <button
      type="button"
      onClick={onNavigate}
      className="w-full text-left flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-white hover:bg-sky-50/30 hover:border-sky-200 transition-all group"
    >
      <div className="w-6 h-6 rounded-md bg-sky-50 border border-sky-100 flex items-center justify-center flex-shrink-0">
        <Trophy className="w-3 h-3 text-sky-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold text-slate-800 truncate leading-tight">{ev.name}</div>
        <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
          {ev.sport?.name && (
            <span className="text-[8px] font-bold text-slate-500">{ev.sport.name}</span>
          )}
          {ev.eventDateStart && (
            <span className="text-[8px] text-slate-400 flex items-center gap-0.5">
              <Calendar className="w-2 h-2" />{formatDate(ev.eventDateStart)}
            </span>
          )}
          {ev.venue?.name && (
            <span className="text-[8px] text-slate-400 flex items-center gap-0.5 truncate max-w-[80px]">
              <MapPin className="w-2 h-2" />{ev.venue.name}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${badge.cls}`}>
          {badge.label}
        </span>
        <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-sky-500 transition-colors" />
      </div>
    </button>
  );
}

// ─── NotificationRow ───────────────────────────────────────────────────────
function NotificationRow({ n }: { n: NotificationItem }) {
  const isSports = n.category?.toLowerCase() === "sports" || n.type === "SPORTS_EVENT";
  return (
    <div className="flex items-start gap-2 p-1.5 rounded-lg border border-slate-50 bg-white">
      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isSports ? "bg-sky-50 text-sky-600" : "bg-indigo-50 text-indigo-600"
      }`}>
        {isSports ? <Trophy className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold text-slate-800 leading-tight">{n.title}</div>
        {n.body && <div className="text-[9px] text-slate-500 mt-0.5 leading-snug line-clamp-1">{n.body}</div>}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
interface Props {
  /** Pass "sports" to show Sports tab first */
  defaultTab?: "events" | "notifications";
  defaultExpanded?: boolean;
}

export function SportsNotificationCard({ defaultTab = "events", defaultExpanded = false }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(defaultExpanded);
  const [hasFetched, setHasFetched] = useState(false);
  const [tab, setTab] = useState<"events" | "notifications">(defaultTab);
  const [events, setEvents] = useState<SportsEvent[]>([]);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    if (hasFetched) return;

    if (user?.communityId) {
      setLoadingEvents(true);
      sportsEventService.getOpenTournaments(user.communityId)
        .then(setEvents)
        .catch(() => {})
        .finally(() => setLoadingEvents(false));
    }

    setLoadingNotifs(true);
    notificationService.getNotifications(0, 10)
      .then(page => setNotifs(page.content))
      .catch(() => {})
      .finally(() => setLoadingNotifs(false));

    setHasFetched(true);
  }, [expanded, hasFetched, user?.communityId]);

  const sportsNotifs = notifs.filter((n) => {
    const cat = (n.category || "").toLowerCase();
    const type = (n.type || "").toUpperCase();
    return (
      cat === "sports" ||
      cat === "auction" ||
      type === "SPORTS_EVENT" ||
      type.startsWith("TOURNAMENT") ||
      type.startsWith("MATCH") ||
      type.startsWith("SCHEDULE") ||
      type.startsWith("AUCTION") ||
      type.startsWith("PLAYER") ||
      type.startsWith("BID") ||
      type.startsWith("TEAM") ||
      type.startsWith("CAPTAIN")
    );
  });

  const hasEvents = events.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-3 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-white text-left cursor-pointer transition-colors hover:bg-sky-50/80"
      >
        <div className="w-7 h-7 rounded-xl bg-sky-600 flex items-center justify-center shadow-xs">
          <Trophy className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-bold text-slate-900 leading-tight truncate">Sports Hub</h3>
          <p className="text-[10px] text-slate-500 font-medium leading-tight truncate">Tournaments, matches & alerts</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <>
          {/* Tab Bar */}
          <div className="flex border-b border-slate-100 bg-slate-50/60">
            <button
              type="button"
              onClick={() => setTab("events")}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-bold transition-all border-b-2 cursor-pointer ${
                tab === "events"
                  ? "border-sky-500 text-sky-700 bg-white shadow-2xs"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Award className="w-3 h-3" />
              Events {hasEvents && <span className="bg-sky-100 text-sky-600 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold">{events.length}</span>}
            </button>
            <button
              type="button"
              onClick={() => setTab("notifications")}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-bold transition-all border-b-2 cursor-pointer ${
                tab === "notifications"
                  ? "border-indigo-500 text-indigo-700 bg-white shadow-2xs"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Bell className="w-3 h-3" />
              Alerts {sportsNotifs.length > 0 && <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold">{sportsNotifs.length}</span>}
            </button>
          </div>

          {/* Content */}
          <div className="p-2 space-y-1.5 max-h-52 overflow-y-auto">
            {tab === "events" && (
              <>
                {loadingEvents ? (
                  <div className="flex items-center justify-center py-4 text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    <span className="text-[10px]">Loading events...</span>
                  </div>
                ) : hasEvents ? (
                  events.slice(0, 5).map(ev => (
                    <SportEventRow
                      key={ev.id}
                      ev={ev}
                      onNavigate={() => navigate(`/sports/events/${ev.id}`)}
                    />
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-400">
                    <Trophy className="w-5 h-5 mx-auto mb-1 opacity-30" />
                    <p className="text-[10px]">No open sports events right now.</p>
                  </div>
                )}
                {events.length > 5 && (
                  <button
                    type="button"
                    onClick={() => navigate("/sports")}
                    className="w-full py-1 text-[9px] font-bold text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded transition-colors flex items-center justify-center gap-0.5"
                  >
                    View all {events.length} events <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                )}
              </>
            )}

            {tab === "notifications" && (
              <>
                {loadingNotifs ? (
                  <div className="flex items-center justify-center py-4 text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    <span className="text-[10px]">Loading alerts...</span>
                  </div>
                ) : sportsNotifs.length > 0 ? (
                  sportsNotifs.slice(0, 8).map(n => (
                    <NotificationRow key={n.id} n={n} />
                  ))
                ) : notifs.length > 0 ? (
                  notifs.slice(0, 8).map(n => (
                    <NotificationRow key={n.id} n={n} />
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-400">
                    <Bell className="w-5 h-5 mx-auto mb-1 opacity-30" />
                    <p className="text-[10px]">No notifications yet.</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer CTA */}
          <div className="border-t border-slate-100 px-2.5 py-1.5 flex items-center justify-between bg-slate-50/40">
            <span className="text-[9px] text-slate-400">Sports Hub</span>
            <button
              type="button"
              onClick={() => navigate("/sports")}
              className="text-[9px] font-bold text-sky-600 hover:text-sky-800 flex items-center gap-0.5 transition-colors"
            >
              Explore <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
