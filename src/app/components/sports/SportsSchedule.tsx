import { useState, useEffect, useMemo } from "react";
import { safeStorage } from "../../../utils/storage";
import { useParams, Link } from "react-router";
import { Loader2, MapPin, Clock, Filter, ChevronRight, ShieldAlert, Target, Activity } from "lucide-react";
import { format, parseISO } from "date-fns";
import { sportsService } from "../../../services/sportsService";
import { useAuth } from "../../../contexts/AuthContext";
import type { SportsEvent } from "../../../types/api";
import "./SportsAuction.css";

import { TournamentScheduler } from "../scheduler/TournamentScheduler";
import { SetupSchedule } from "../scheduler/SetupSchedule";
import { ManualScheduler } from "../scheduler/ManualScheduler";

const TABS = ["My Matches", "All Events", "Brackets", "Config", "Setup Schedule", "Manual"] as const;
type Tab = typeof TABS[number];

type Sport = "Basketball" | "Soccer" | "Volleyball";

interface Game {
  id: string;
  sport: Sport;
  homeTeam: string;
  awayTeam: string;
  date: string;
  location: string;
  status: "Upcoming" | "Live" | "Completed";
  score?: { home: number; away: number };
}

const mockGames: Game[] = [
  { id: "g1", sport: "Basketball", homeTeam: "City Hoopers", awayTeam: "Downtown Dunkers", date: "2026-06-14T18:00:00", location: "Main Gym – Court 1", status: "Upcoming" },
  { id: "g2", sport: "Soccer", homeTeam: "United FC", awayTeam: "Rovers", date: "2026-06-14T19:30:00", location: "Turf Field A", status: "Upcoming" },
  { id: "g3", sport: "Volleyball", homeTeam: "Spike Syndicate", awayTeam: "Net Ninjas", date: "2026-06-14T17:00:00", location: "Community Center – Court 2", status: "Upcoming" },
  { id: "g4", sport: "Basketball", homeTeam: "Alley-Oops", awayTeam: "Fastbreakers", date: "2026-06-13T20:00:00", location: "Main Gym – Court 2", status: "Live", score: { home: 58, away: 51 } },
  { id: "g5", sport: "Soccer", homeTeam: "Galacticos", awayTeam: "Athletic Club", date: "2026-06-12T18:00:00", location: "Turf Field B", status: "Completed", score: { home: 2, away: 1 } },
  { id: "g6", sport: "Basketball", homeTeam: "Rim Rockers", awayTeam: "Court Kings", date: "2026-06-15T19:00:00", location: "Main Gym – Court 1", status: "Upcoming" },
  { id: "g7", sport: "Soccer", homeTeam: "Athletic Club", awayTeam: "United FC", date: "2026-06-10T18:00:00", location: "Turf Field A", status: "Completed", score: { home: 1, away: 3 } },
];

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

const sportIcons: Record<string, React.ElementType> = { 
  Basketball: BasketballIcon, basketball: BasketballIcon,
  Soccer: Target, soccer: Target, Football: Target, football: Target,
  Volleyball: Activity, volleyball: Activity
};
const sportColors: Record<string, { color: string; bg: string }> = {
  Basketball: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  basketball: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  Soccer: { color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  soccer: { color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  Football: { color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  football: { color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  Volleyball: { color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
  volleyball: { color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
};

const getSportIcon = (sportName: string) => {
  return sportIcons[sportName] || Activity;
};

const getSportColors = (sportName: string) => {
  return sportColors[sportName] || { color: "#6366f1", bg: "rgba(99,102,241,0.1)" };
};

const safeFormatDate = (dateStr: string, formatStr: string) => {
  try {
    const parsed = parseISO(dateStr);
    if (isNaN(parsed.getTime())) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return format(d, formatStr);
      }
      return dateStr;
    }
    return format(parsed, formatStr);
  } catch (err) {
    return dateStr;
  }
};

// ─── Timeline item ────────────────────────────────────────────────────────────

interface ScheduleEntry {
  date: string;
  name: string;
  venue: string;
  status: string;
  statusColor: string;
  badges: { label: string; color: string }[];
}



function TimelineItem({ item, isLast }: { item: ScheduleEntry; isLast: boolean }) {
  return (
    <div className="relative flex gap-4 pb-5">
      {/* Dot + line */}
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ background: item.statusColor, boxShadow: `0 0 6px ${item.statusColor}` }} />
        {!isLast && <div className="w-px flex-1 bg-slate-200 mt-1" />}
      </div>
      <div className="flex-1 min-w-0 pb-1 text-left">
        <div className="text-xs mb-1" style={{ color: "#6b7094" }}>{item.date}</div>
        <div className="text-sm font-bold mb-1 text-slate-800">{item.name}</div>
        <div className="text-xs mb-2" style={{ color: "#6b7094" }}>{item.venue}</div>
        <div className="flex flex-wrap gap-2">
          {item.badges.map(b => (
            <span key={b.label} className="text-[10px] px-2 py-0.5 rounded font-semibold" style={{ background: `${b.color}15`, color: b.color }}>{b.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Bracket view ─────────────────────────────────────────────────────────────

type BracketPlayer = { id?: number; initials: string; fullName: string; flatNumber?: string; isTBD?: boolean };
type BracketMatch = {
  id: string; label: string; date: string; time: string;
  p1: BracketPlayer | null; p2: BracketPlayer | null;
  venue: { initials: string; name: string };
  isBye?: boolean;
};
type BracketRound = { name: string; matches: BracketMatch[] };

function getPlayerInitials(fullName: string): string {
  return fullName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function MatchCard({ match }: { match: BracketMatch }) {
  const players = [match.p1, match.p2].filter(Boolean) as BracketPlayer[];
  const isByeMatch = match.isBye || players.length === 1;

  return (
    <div className="rounded-xl overflow-hidden card-hover-lift"
      style={{
        background: "white",
        border: "1px solid rgba(99, 102, 241, 0.12)",
        boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px",
      }}
    >
      <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200 text-left">
        <div className="text-xs font-bold text-slate-800">{match.label}</div>
        <div className="text-[10px] mt-0.5" style={{ color: "#6b7094" }}>{match.date} | {match.time}</div>
        {isByeMatch && <div className="text-[9px] text-emerald-600 font-bold mt-1">BYE</div>}
      </div>
      <div className="px-3 py-3 space-y-2.5 text-left">
        {players.map((p, i) => (
          <div key={i}>
            <div className="flex items-center gap-2">
              {p.isTBD ? (
                <div className="w-7 h-7 rounded-full border border-dashed border-slate-300 shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-slate-500">{p.initials}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className={`text-xs truncate ${p.isTBD ? "text-slate-400 italic" : "text-slate-800 font-semibold"}`}>
                  {p.fullName}
                </div>
                {p.flatNumber && !p.isTBD && (
                  <div className="text-[9px] text-slate-500">{p.flatNumber}</div>
                )}
              </div>
            </div>
            {i === 0 && !isByeMatch && players.length > 1 && (
              <div className="border-b border-slate-100 my-2" />
            )}
          </div>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-slate-100 flex items-center gap-1.5 text-left bg-slate-50/50">
        <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center shrink-0">
          <span className="text-[9px] font-bold text-slate-500">{match.venue.initials}</span>
        </div>
        <span className="text-[10px] truncate" style={{ color: "#6b7094" }}>{match.venue.name}</span>
      </div>
    </div>
  );
}

function BracketView({ eventId }: { eventId?: string }) {
  const [rounds, setRounds] = useState<BracketRound[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    const fetchAndGenerateBracket = async () => {
      setLoading(true);
      try {
        const registrations = await sportsService.getEventRegistrations(Number(eventId));
        const confirmed = registrations.filter(r => r.status === 'CONFIRMED');

        if (confirmed.length === 0) {
          setRounds([]);
          return;
        }

        const players = confirmed
          .filter(r => r.user)
          .map(r => ({
            id: r.user!.id,
            initials: getPlayerInitials(r.user!.fullName),
            fullName: r.user!.fullName,
            flatNumber: r.flatNumber || undefined,
          }));

        const generatedRounds = generateKnockoutBracket(players);
        setRounds(generatedRounds);
      } catch (err) {
        console.error('Failed to load bracket:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndGenerateBracket();
  }, [eventId]);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#f97316] animate-spin" /></div>;
  }

  if (rounds.length === 0) {
    return (
      <div className="rounded-xl p-6 text-center"
        style={{
          background: "white",
          border: "1px solid rgba(99, 102, 241, 0.12)",
          boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px",
        }}
      >
        <p className="text-sm text-[#6b7094]">No confirmed players yet. Bracket will be generated once players are confirmed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rounds.map(round => (
        <div key={round.name}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-bold text-[#f97316] uppercase tracking-wider">{round.name}</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {round.matches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      ))}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm font-bold text-[#f97316] uppercase tracking-wider">Results</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Winner", icon: "🏆", name: "Winner Of Final" },
            { label: "Runner-up", icon: "🥈", name: "Loser Of Final" },
          ].map(r => (
            <div key={r.label} className="rounded-xl p-4 flex items-center gap-3 card-hover-lift"
              style={{
                background: "white",
                border: "1px solid rgba(99, 102, 241, 0.12)",
                boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px",
              }}
            >
              <span className="text-2xl">{r.icon}</span>
              <div>
                <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider">{r.label}</div>
                <div className="text-sm text-[#6b7094] italic mt-0.5">{r.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function generateKnockoutBracket(players: BracketPlayer[]): BracketRound[] {
  const rounds: BracketRound[] = [];
  let currentRound = players;
  let roundNum = 1;

  while (currentRound.length > 1) {
    const roundName = roundNum === 1 ? 'Round 1'
      : roundNum === 2 ? 'Round 2'
      : roundNum === 3 ? 'Semi-Finals'
      : 'Finals';

    const matches: BracketMatch[] = [];
    let matchNum = 1;

    for (let i = 0; i < currentRound.length; i += 2) {
      const p1 = currentRound[i];
      const p2 = currentRound[i + 1] || null;
      const isByeMatch = !p2;

      matches.push({
        id: `M${roundNum}-${matchNum}`,
        label: roundName === 'Finals' ? 'Final'
          : roundName === 'Semi-Finals' ? `Semi-Final ${matchNum}`
          : `Match ${matchNum}`,
        date: '—',
        time: '—',
        p1,
        p2: p2 || { initials: '', fullName: '', isTBD: true },
        venue: { initials: 'TBD', name: 'TBD' },
        isBye: isByeMatch,
      });
      matchNum++;
    }

    rounds.push({ name: roundName, matches });

    currentRound = Array.from({ length: Math.ceil(currentRound.length / 2) }, (_, i) => ({
      initials: 'W',
      fullName: `Match ${i + 1} (Winner)`,
      isTBD: true,
    }));

    roundNum++;
  }

  return rounds;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SportsSchedule() {
  const { eventId } = useParams<{ eventId?: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (eventId) return "Setup Schedule";
    const saved = safeStorage.getItem("sports_schedule_active_tab");
    return (saved as Tab) || "My Matches";
  });

  useEffect(() => {
    safeStorage.setItem("sports_schedule_active_tab", activeTab);
  }, [activeTab]);
  const [allEvents, setAllEvents] = useState<SportsEvent[]>([]);
  const [myMatches, setMyMatches] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const gamesToDisplay = useMemo(() => {
    const games = allEvents.length > 0 
      ? allEvents.map((ev): Game => {
          const isLive = ev.registrationStatus === "LIVE";
          const isCompleted = ev.registrationStatus === "COMPLETED";
          const status = isLive ? "Live" : isCompleted ? "Completed" : "Upcoming";
          
          let homeTeam = ev.name;
          let awayTeam = "TBD";
          if (ev.name.includes(" vs ")) {
            const parts = ev.name.split(" vs ");
            homeTeam = parts[0];
            awayTeam = parts[1];
          } else if (ev.name.includes(" - ")) {
            const parts = ev.name.split(" - ");
            homeTeam = parts[0];
            awayTeam = parts[1];
          }
          
          return {
            id: String(ev.id),
            sport: (ev.sport?.name as Sport) || "Basketball",
            homeTeam,
            awayTeam,
            date: ev.eventDateStart,
            location: ev.venue?.name || "TBD",
            status,
            score: isLive ? { home: 12, away: 8 } : isCompleted ? { home: 3, away: 2 } : undefined
          };
        })
      : mockGames;

    let filtered = games;
    if (activeFilter !== "All") {
      filtered = filtered.filter(g => g.sport.toLowerCase() === activeFilter.toLowerCase());
    }

    const statusWeight = { Live: 0, Upcoming: 1, Completed: 2 };
    return [...filtered].sort((a, b) => {
      if (statusWeight[a.status] !== statusWeight[b.status]) return statusWeight[a.status] - statusWeight[b.status];
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [allEvents, activeFilter]);

  useEffect(() => {
    if (!user?.userId) return;
    setLoading(true);

    if (activeTab === "My Matches") {
      sportsService.getMyEvents()
        .then(events => {
          setMyMatches(events.map(e => ({
            date: e.eventDateStart,
            name: `${e.sport?.name ?? "Event"} — ${e.name}`,
            venue: e.venue?.name ?? "TBD",
            status: e.registrationStatus ?? "",
            statusColor: e.registrationStatus === "LIVE" ? "#10b981" : "#f97316",
            badges: [
              { label: e.registrationStatus ?? "", color: e.registrationStatus === "LIVE" ? "#10b981" : "#f97316" },
              { label: e.categories?.[0]?.name ?? "General", color: "#3b82f6" }
            ]
          })));
        })
        .catch(() => { })
        .finally(() => setLoading(false));
    } else if (activeTab === "All Events" && user?.communityId) {
      sportsService.getOpenEvents(user.communityId)
        .then(setAllEvents)
        .catch(() => { })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [activeTab, user?.communityId, user?.userId]);

  return (
    <div className="auction-hub-wrapper">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-title">Sports Scheduler</div>
        </div>
        <div className="nav-section">
          <div className="nav-label">Main</div>
          <button
            className={`nav-item ${activeTab === "My Matches" ? "active" : ""}`}
            onClick={() => setActiveTab("My Matches")}
          >
            <div className="nav-dot"></div>My Matches
          </button>
          <button
            className={`nav-item ${activeTab === "All Events" ? "active" : ""}`}
            onClick={() => setActiveTab("All Events")}
          >
            <div className="nav-dot"></div>All Events
          </button>
          <button
            className={`nav-item ${activeTab === "Brackets" ? "active" : ""}`}
            onClick={() => setActiveTab("Brackets")}
          >
            <div className="nav-dot"></div>Brackets
          </button>
        </div>
        <div className="nav-section">
          <div className="nav-label">Operations</div>
          <button
            className={`nav-item ${activeTab === "Config" ? "active" : ""}`}
            onClick={() => setActiveTab("Config")}
          >
            <div className="nav-dot"></div>Config
          </button>
          <button
            className={`nav-item ${activeTab === "Setup Schedule" ? "active" : ""}`}
            onClick={() => setActiveTab("Setup Schedule")}
          >
            <div className="nav-dot"></div>Setup Schedule
          </button>
          <button
            className={`nav-item ${activeTab === "Manual" ? "active" : ""}`}
            onClick={() => setActiveTab("Manual")}
          >
            <div className="nav-dot"></div>Manual
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="page active">
          <div className="page-hdr">
            <div>
              <div className="page-title">{activeTab}</div>
              <div className="page-sub">Sports scheduling & event matches</div>
            </div>
          </div>

      {/* My Matches */}
      {activeTab === "My Matches" && (
        <div className="rounded-xl p-4"
          style={{
            background: "white",
            border: "1px solid rgba(99, 102, 241, 0.12)",
            boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px",
          }}
        >
          <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#6b7094" }}>My Match Timeline</div>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-[#f97316] animate-spin" /></div>
          ) : myMatches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#6b7094]">No matches found in your schedule.</p>
            </div>
          ) : (
            myMatches.map((item, i) => (
              <TimelineItem key={i} item={item} isLast={i === myMatches.length - 1} />
            ))
          )}
        </div>
      )}

      {/* All Events */}
      {activeTab === "All Events" && (
        <div className="space-y-5">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl text-left"
            style={{
              background: "white",
              border: "1px solid rgba(99, 102, 241, 0.12)",
              boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px",
            }}
          >
            <div>
              <p className="text-sm font-bold" style={{ color: "#6b7094" }}>
                {gamesToDisplay.length} games · {gamesToDisplay.filter(g => g.status === "Live").length} live
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 hidden sm:block" style={{ color: "#6b7094" }} />
              {["All", "Basketball", "Soccer", "Volleyball"].map((f) => {
                const isActive = activeFilter === f;
                return (
                  <button key={f} onClick={() => setActiveFilter(f)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer"
                    style={isActive
                      ? { background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white", boxShadow: "0 2px 8px rgba(99,102,241,0.3)" }
                      : { background: "white", color: "#6b7094", border: "1px solid rgba(99, 102, 241, 0.15)" }}>
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8 bg-white border border-slate-200/60 rounded-2xl">
                  <Loader2 className="w-6 h-6 text-[#f97316] animate-spin" />
                </div>
              ) : gamesToDisplay.length === 0 ? (
                <div className="rounded-2xl p-12 flex flex-col items-center text-center"
                  style={{ background: "white", border: "1px solid rgba(99, 102, 241, 0.12)", boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px" }}>
                  <ShieldAlert className="h-10 w-10 mb-3" style={{ color: "#9ca3af" }} />
                  <p className="font-semibold" style={{ color: "#0d0d2b" }}>No games found</p>
                  <p className="text-sm mt-1" style={{ color: "#6b7094" }}>No scheduled games for this filter right now.</p>
                </div>
              ) : (
                gamesToDisplay.map((game) => {
                  const Icon = getSportIcon(game.sport);
                  const { color, bg } = getSportColors(game.sport);
                  const isLive = game.status === "Live";
                  const isDone = game.status === "Completed";

                  return (
                    <div key={game.id} className="rounded-2xl overflow-hidden card-hover-lift"
                      style={{
                        background: "white",
                        border: isLive ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(99, 102, 241, 0.12)",
                        boxShadow: isLive ? "0 4px 20px rgba(239,68,68,0.1)" : "rgba(99, 102, 241, 0.06) 0px 2px 12px",
                      }}>
                      <div className="flex flex-col sm:flex-row">
                        {/* Date column */}
                        <div className="sm:w-36 p-4 flex sm:flex-col justify-between sm:justify-center items-center gap-3"
                          style={{
                            background: isLive ? "rgba(239,68,68,0.04)" : "rgba(99, 102, 241, 0.03)",
                            borderRight: "1px solid rgba(99, 102, 241, 0.08)",
                          }}>
                          <div className="text-center">
                            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7094" }}>
                              {safeFormatDate(game.date, "MMM d")}
                            </p>
                            <p className="text-lg font-bold mt-0.5" style={{ color: "#0d0d2b" }}>
                              {safeFormatDate(game.date, "h:mm a")}
                            </p>
                          </div>
                          {isLive && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse"
                              style={{ background: "rgba(239,68,68,0.12)", color: "#dc2626" }}>
                              <div className="h-1.5 w-1.5 bg-red-500 rounded-full" />
                              LIVE
                            </div>
                          )}
                          {isDone && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                              style={{ background: "rgba(99, 102, 241, 0.08)", color: "#4f46e5" }}>
                              FINAL
                            </span>
                          )}
                        </div>

                        {/* Match details */}
                        <div className="p-5 flex-1 text-left">
                          <div className="flex items-center justify-between mb-3">
                            <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                              style={{ background: bg, color }}>
                              <Icon className="h-3 w-3" />
                              {game.sport}
                            </span>
                            <span className="flex items-center gap-1 text-xs" style={{ color: "#6b7094" }}>
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[150px]">{game.location}</span>
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800 text-sm truncate max-w-[180px]">{game.homeTeam}</span>
                              {game.score && (
                                <span className="text-base font-bold font-mono text-slate-800">
                                  {game.score.home}
                                </span>
                              )}
                            </div>
                            {game.awayTeam && (
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-800 text-sm truncate max-w-[180px]">{game.awayTeam}</span>
                                {game.score && (
                                  <span className="text-base font-bold font-mono text-slate-800">
                                    {game.score.away}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="sm:flex items-center px-4 hidden">
                          <button className="p-2 rounded-xl transition-colors cursor-pointer" style={{ color: "#4f46e5" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(99, 102, 241, 0.08)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="rounded-2xl p-5"
                style={{ background: "white", border: "1px solid rgba(99, 102, 241, 0.12)", boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px" }}>
                <h3 className="font-semibold mb-4 text-left text-slate-800 text-sm uppercase tracking-wider">Season Highlights</h3>
                <div className="space-y-3">
                  {[
                    { label: "Total Games Played", value: "94" },
                    { label: "Active Teams", value: "26" },
                    { label: "Next Tournament", value: "Jul 15" },
                  ].map((s) => (
                    <div key={s.label} className="flex justify-between items-center py-2 text-left"
                      style={{ borderBottom: "1px solid rgba(99, 102, 241, 0.06)" }}>
                      <span className="text-xs font-medium" style={{ color: "#6b7094" }}>{s.label}</span>
                      <span className="font-bold text-xs text-slate-800">{s.value}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  style={{ background: "rgba(99, 102, 241, 0.06)", color: "#4f46e5", border: "1px solid rgba(99, 102, 241, 0.15)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(99, 102, 241, 0.12)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(99, 102, 241, 0.06)")}>
                  Full Standings →
                </button>
              </div>

              <div className="rounded-2xl p-5 text-left"
                style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", boxShadow: "0 4px 20px rgba(245,158,11,0.3)" }}>
                <h3 className="font-bold text-white mb-1 text-sm">Summer 2026 Season</h3>
                <p className="text-xs text-white/80 mb-4">Registration is open for all sports.</p>
                <Link to="/sports/register"
                  className="block w-full text-center py-2.5 rounded-xl text-xs font-bold transition-all hover:bg-slate-50"
                  style={{ background: "white", color: "#f59e0b" }}>
                  Register a Team
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brackets */}
      {activeTab === "Brackets" && <BracketView eventId={eventId} />}

      {/* Config */}
      {activeTab === "Config" && <TournamentScheduler />}

      {/* Setup Schedule */}
      {activeTab === "Setup Schedule" && <SetupSchedule initialEventId={eventId} />}

      {/* Manual Scheduler */}
      {activeTab === "Manual" && <ManualScheduler />}
        </div>
      </main>
    </div>
  );
}
