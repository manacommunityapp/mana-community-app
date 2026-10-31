import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Trophy,
  Calendar,
  Users,
  MapPin,
  Loader2,
  ChevronRight,
  Medal,
  TrendingUp,
  ChevronDown,
  ArrowUpRight,
  Info,
  Clock,
  Award,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { sportsDashboardService, type DashboardTournamentCard } from "../../../services/sports/sportsDashboardService";
import { sportsService } from "../../../services/sports/sportsService";
import { tournamentService } from "../../../services/sports/tournamentService";
import type { SportsEvent } from "../../../types/api";
import { useLocation, useNavigate } from "react-router";
import { SportsTournamentStandings } from "./SportsTournamentStandings";
import { TournamentDetailsModal } from "./TournamentDetailsModal";

function getSportEmoji(sportName: string | null | undefined): string {
  const n = (sportName || "").toLowerCase();
  if (n.includes("cricket")) return "🏏";
  if (n.includes("football") || n.includes("soccer")) return "⚽";
  if (n.includes("badminton")) return "🏸";
  if (n.includes("volleyball")) return "🏐";
  if (n.includes("basketball")) return "🏀";
  if (n.includes("kabaddi")) return "🤼";
  if (n.includes("hockey")) return "🏑";
  if (n.includes("throwball")) return "🏐";
  if (n.includes("table tennis") || n.includes("tt")) return "🏓";
  if (n.includes("tennis")) return "🎾";
  if (n.includes("chess")) return "♟️";
  if (n.includes("carrom")) return "🎯";
  if (n.includes("pickleball")) return "🏓";
  return "🏆";
}

type BrowseTab = "open" | "my" | "closed";

export function SportsTournamentBrowse() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  const [activeTab, setActiveTab] = useState<BrowseTab>("open");
  const [openTournaments, setOpenTournaments] = useState<DashboardTournamentCard[]>([]);
  const [closedTournaments, setClosedTournaments] = useState<DashboardTournamentCard[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<SportsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState<string>("All");

  // Selected tournament for details modal
  const [selectedTournament, setSelectedTournament] = useState<DashboardTournamentCard | SportsEvent | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      sportsDashboardService.getOpenTournaments().catch(() => []),
      sportsDashboardService.getClosedTournaments().catch(() => []),
      sportsService.getMyTournaments().catch(() => []),
    ]).then(([open, closed, my]) => {
      setOpenTournaments(open);
      setClosedTournaments(closed);
      setMyRegistrations(my);
    }).finally(() => setLoading(false));
  }, []);

  const tabs: { key: BrowseTab; label: string; icon: typeof Trophy; count: number }[] = [
    { key: "open", label: "Open Tournaments", icon: Trophy, count: openTournaments.length },
    { key: "my", label: "My Tournaments", icon: Medal, count: myRegistrations.length },
    { key: "closed", label: "Completed", icon: Calendar, count: closedTournaments.length },
  ];

  const allSports = useMemo(() => {
    const sports = new Set<string>();
    for (const t of [...openTournaments, ...closedTournaments]) {
      for (const ev of t.events || []) {
        if (ev.sportName) sports.add(ev.sportName);
      }
    }
    for (const ev of myRegistrations) {
      if (ev.sportName) sports.add(ev.sportName);
    }
    return ["All", ...Array.from(sports).sort()];
  }, [openTournaments, closedTournaments, myRegistrations]);

  const matchesSportFilter = useCallback((t: DashboardTournamentCard) => {
    if (sportFilter === "All") return true;
    return t.events?.some(ev => ev.sportName === sportFilter);
  }, [sportFilter]);

  const filteredOpen = useMemo(() => {
    let list = openTournaments;
    if (sportFilter !== "All") list = list.filter(matchesSportFilter);
    return list;
  }, [openTournaments, sportFilter, matchesSportFilter]);

  const filteredClosed = useMemo(() => {
    let list = closedTournaments;
    if (sportFilter !== "All") list = list.filter(matchesSportFilter);
    return list;
  }, [closedTournaments, sportFilter, matchesSportFilter]);

  const filteredMy = useMemo(() => {
    let list = myRegistrations;
    if (sportFilter !== "All") list = list.filter(ev => ev.sportName === sportFilter);
    return list;
  }, [myRegistrations, sportFilter]);

  const handleOpenDetails = (tournament: DashboardTournamentCard | SportsEvent) => {
    setSelectedTournament(tournament);
    setIsDetailsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <Loader2 size={32} className="animate-spin text-indigo-600 mb-3" />
        <div className="text-sm font-semibold text-slate-600">Loading tournaments & leagues...</div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-5 text-left sm:space-y-6">
      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1.5 hide-scrollbar sm:gap-2">
        {tabs.map(tab => {
          const active = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={active}
              className={`flex min-w-max flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer sm:px-4 ${
                active
                  ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/70 font-bold"
                  : "text-slate-500 hover:bg-white/60 hover:text-slate-800"
              }`}
            >
              <Icon size={14} className={active ? "text-indigo-600" : "text-slate-400"} />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${ active ? "bg-indigo-50 text-indigo-700" : "bg-slate-200/70 text-slate-600" }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sport filter */}
      {allSports.length > 2 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="m-0 text-sm font-bold text-slate-900">Browse by sport</h2>
            <p className="mt-0.5 text-xs text-slate-500">Narrow the tournament list to a sport</p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <span className="sr-only">Filter tournaments by sport</span>
            <select
              value={sportFilter}
              onChange={e => setSportFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-10 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            >
              {allSports.map(sport => <option key={sport} value={sport}>{sport === "All" ? "All sports" : sport}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </label>
        </div>
      )}

      {/* Open Tournaments List */}
      {activeTab === "open" && (
      <div className="space-y-4">
          {filteredOpen.length === 0 ? (
            <EmptyState message="No tournaments are open for registration right now" />
          ) : (
            filteredOpen.map(t => (
              <TournamentCard
                key={t.id}
                tournament={t}
                onViewDetails={() => handleOpenDetails(t)}
                onViewSchedule={() => navigate(`/sports/schedule/${t.id}`)}
                onRegister={() => navigate(`/sports/register-tournament/${t.id}`, { state: { returnTo } })}
                onRegisterOthers={() => navigate(`/sports/register-tournament/${t.id}?for=community`, { state: { returnTo } })}
              />
            ))
          )}
        </div>
      )}

      {/* My Tournaments */}
      {activeTab === "my" && (
        <div className="space-y-4">
          {filteredMy.length === 0 ? (
            <EmptyState message="You haven't joined any tournaments yet" />
          ) : (
            filteredMy.map(ev => (
              <MyTournamentCard
                key={ev.id}
                event={ev}
                onViewDetails={() => handleOpenDetails(ev)}
                onViewSchedule={() => navigate(`/sports/schedule/${ev.id}`)}
              />
            ))
          )}
        </div>
      )}

      {/* Completed Tournaments */}
      {activeTab === "closed" && (
        <div className="space-y-4">
          {filteredClosed.length === 0 ? (
            <EmptyState message="No completed tournaments found" />
          ) : (
            filteredClosed.map(t => (
              <TournamentCard
                key={t.id}
                tournament={t}
                completed
                onViewDetails={() => handleOpenDetails(t)}
                onViewSchedule={() => navigate(`/sports/schedule/${t.id}`)}
              />
            ))
          )}
        </div>
      )}

      {/* Full Tournament Details & Rules Modal */}
      <TournamentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        tournament={selectedTournament}
        onRegisterEvent={(eventIdOrUuid) => navigate(`/sports/register/${eventIdOrUuid}`)}
        onViewSchedule={(tournamentId) => navigate(`/sports/schedule/${tournamentId}`)}
      />
    </div>
  );
}

// ─── Tournament Card Component ────────────────────────────────────────────────

interface TournamentCardProps {
  tournament: DashboardTournamentCard;
  completed?: boolean;
  onViewDetails: () => void;
  onViewSchedule: () => void;
  onRegister?: () => void;
  onRegisterOthers?: () => void;
}

function TournamentCard({
  tournament,
  completed,
  onViewDetails,
  onViewSchedule,
  onRegister,
  onRegisterOthers,
}: TournamentCardProps) {
  const [showStandings, setShowStandings] = useState(false);
  const [configIds, setConfigIds] = useState<number[]>([]);
  const eventCount = tournament.events?.length ?? 0;

  const rawStart = tournament.eventDateStart;
  const rawEnd = tournament.eventDateEnd;
  const startDate = rawStart ? new Date(rawStart) : null;
  const endDate = rawEnd ? new Date(rawEnd) : null;
  const daysLeft = startDate ? differenceInDays(startDate, new Date()) : null;

  const status = tournament.registrationStatus || (completed ? "COMPLETED" : "REGISTRATION_OPEN");
  const isOpen = status === "OPEN" || status === "REGISTRATION_OPEN";

  // Total registered count across all events
  const totalRegistered = (tournament.events || []).reduce(
    (acc, ev) => acc + (ev.registeredCount ?? 0),
    0
  );

  useEffect(() => {
    if (showStandings && configIds.length === 0) {
      tournamentService
        .getConfigs()
        .then(configs => {
          const ids = configs
            .filter(c => tournament.events?.some(e => e.id === c.eventId))
            .map(c => c.id);
          setConfigIds(ids);
        })
        .catch(() => setConfigIds([]));
    }
  }, [showStandings, tournament.events, configIds.length]);

  return (
    <article className="group rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:p-5">
      {/* Top Details Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <div
            className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 transition group-hover:bg-indigo-100"
            onClick={onViewDetails}
          >
            <Trophy className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                onClick={onViewDetails}
                className="m-0 cursor-pointer truncate text-base font-extrabold tracking-tight text-slate-900 transition-colors hover:text-indigo-700 sm:text-lg"
              >
                {tournament.name}
              </h3>

              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${ completed ? "border-slate-200 bg-slate-100 text-slate-600" : isOpen ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-blue-50 text-blue-700" }`}
              >
                {completed ? "Completed" : isOpen ? "Open for Registration" : status}
              </span>

              {daysLeft !== null && daysLeft >= 0 && isOpen && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                  <Clock className="w-3 h-3" />
                  {daysLeft === 0 ? "Starts Today!" : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} to go`}
                </span>
              )}
            </div>

            {tournament.communityName && (
              <div className="mt-1 text-xs font-medium text-slate-500">{tournament.communityName}</div>
            )}

            {/* Tournament Meta Badges Row */}
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-600">
              {startDate && (
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {format(startDate, "MMM d, yyyy")}
                    {endDate && ` - ${format(endDate, "MMM d, yyyy")}`}
                  </span>
                </span>
              )}

              {eventCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <Award className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{eventCount} {eventCount === 1 ? "Category Group" : "Category Groups"}</span>
                </span>
              )}

              {totalRegistered > 0 && (
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{totalRegistered} Registered Players</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons on the card */}
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:self-start">
          <button
            onClick={onViewDetails}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 sm:flex-none"
          >
            <Info className="h-3.5 w-3.5 text-slate-500" />
            <span>Details</span>
          </button>

          {isOpen && onRegister && (
            <button
              onClick={onRegister}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] sm:flex-none"
            >
              <span>Register</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}

          {isOpen && onRegisterOthers && (
            <button
              onClick={onRegisterOthers}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-xs font-bold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100 active:scale-[0.98] sm:flex-none"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Register Others</span>
            </button>
          )}

          <button
            onClick={onViewSchedule}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
            title="View Match Schedule"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Child Sports Category Groups Preview Chips */}
      {tournament.events && tournament.events.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3.5">
          <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Events:</span>
          {tournament.events.slice(0, 5).map(ev => {
            const emoji = getSportEmoji(ev.sportName);
            return (
              <span
                key={ev.id}
                onClick={onViewDetails}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <span>{emoji}</span>
                <span>{ev.categoryName || ev.name}</span>
                {ev.registeredCount != null && (
                  <span className="text-[10px] text-slate-400">({ev.registeredCount})</span>
                )}
              </span>
            );
          })}
          {tournament.events.length > 5 && (
            <button
              onClick={onViewDetails}
              className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              +{tournament.events.length - 5} more groups →
            </button>
          )}
        </div>
      )}

      {/* Standings Toggle */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <button
          onClick={() => setShowStandings(!showStandings)}
          className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-all ${
            showStandings
              ? "bg-amber-50 text-amber-800 border-amber-200"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <TrendingUp size={12} className={showStandings ? "text-amber-600" : "text-slate-400"} />
          <span>Tournament Standings</span>
          <ChevronDown
            size={12}
            className={`transition-transform duration-200 ${showStandings ? "rotate-180" : ""}`}
          />
        </button>

        <button
          onClick={onViewSchedule}
          className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
        >
          <span>Match Schedule</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {showStandings && (
        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          {configIds.length > 0 ? (
            <SportsTournamentStandings configId={configIds[0]} inline />
          ) : (
            <div className="text-xs text-slate-500 py-2 text-center font-medium">
              No standings table currently generated for this tournament.
            </div>
          )}
        </div>
      )}
    </article>
  );
}

// ─── My Tournament Card Component ─────────────────────────────────────────────

function MyTournamentCard({
  event,
  onViewDetails,
  onViewSchedule,
}: {
  event: SportsEvent;
  onViewDetails: () => void;
  onViewSchedule: () => void;
}) {
  const emoji = getSportEmoji(event.sportName);
  const startDate = event.eventDateStart ? new Date(event.eventDateStart) : null;

  return (
    <article className="group rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <div
            className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-amber-50 text-base ring-1 ring-amber-100"
            onClick={onViewDetails}
          >
            <span>{emoji}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                onClick={onViewDetails}
                className="m-0 max-w-full cursor-pointer truncate text-base font-extrabold tracking-tight text-slate-900 transition-colors hover:text-amber-700"
              >
                {event.name}
              </h3>
              {event.registrationStatus && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                  {event.registrationStatus}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 sm:gap-4 mt-1.5 flex-wrap text-xs text-slate-500 font-medium">
              {event.sportName && (
                <span className="inline-flex items-center gap-1">
                  <Trophy size={14} className="text-amber-500" />
                  <span>{event.sportName}</span>
                </span>
              )}
              {startDate && (
                <span className="inline-flex items-center gap-1">
                  <Calendar size={14} className="text-slate-400" />
                  <span>{format(startDate, "MMM d, yyyy")}</span>
                </span>
              )}
              {event.venueName && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} className="text-slate-400" />
                  <span>{event.venueName}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
          <button
            onClick={onViewDetails}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 sm:flex-none"
          >
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Details</span>
          </button>
          <button
            onClick={onViewSchedule}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
            title="View Match Schedule"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-14 text-center text-slate-500 shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-400">
        <Trophy size={28} />
      </div>
      <div className="mt-4 text-sm font-bold text-slate-800">{message}</div>
      <div className="mt-1 text-xs text-slate-500">Try another tab or sport filter, or check back later.</div>
    </div>
  );
}
