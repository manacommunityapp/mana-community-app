import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Trophy,
  Calendar,
  Users,
  MapPin,
  Loader2,
  ChevronRight,
  Search,
  Medal,
  TrendingUp,
  ChevronDown,
  ArrowUpRight,
  Info,
  Clock,
  Sparkles,
  Award,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { sportsDashboardService, type DashboardTournamentCard } from "../../../services/sports/sportsDashboardService";
import { sportsService } from "../../../services/sports/sportsService";
import { tournamentService } from "../../../services/sports/tournamentService";
import type { SportsEvent } from "../../../types/api";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router";
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<BrowseTab>("open");
  const [openTournaments, setOpenTournaments] = useState<DashboardTournamentCard[]>([]);
  const [closedTournaments, setClosedTournaments] = useState<DashboardTournamentCard[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<SportsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(t => t.name.toLowerCase().includes(q) || (t.communityName && t.communityName.toLowerCase().includes(q)));
  }, [openTournaments, search, sportFilter, matchesSportFilter]);

  const filteredClosed = useMemo(() => {
    let list = closedTournaments;
    if (sportFilter !== "All") list = list.filter(matchesSportFilter);
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(t => t.name.toLowerCase().includes(q) || (t.communityName && t.communityName.toLowerCase().includes(q)));
  }, [closedTournaments, search, sportFilter, matchesSportFilter]);

  const filteredMy = useMemo(() => {
    let list = myRegistrations;
    if (sportFilter !== "All") list = list.filter(ev => ev.sportName === sportFilter);
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(t => t.name.toLowerCase().includes(q) || (t.venueName && t.venueName.toLowerCase().includes(q)));
  }, [myRegistrations, search, sportFilter]);

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
    <div className="space-y-4 text-left">
      {/* Top Banner / Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-sm">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 leading-tight m-0 mb-0">Community Tournaments</h3>
            <p className="text-xs text-slate-500 font-medium m-0">Browse active championships, view tournament details, and register sports groups</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tournaments, sports, venues..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
        {tabs.map(tab => {
          const active = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                active
                  ? "bg-white text-indigo-600 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/40"
              }`}
            >
              <Icon size={14} className={active ? "text-indigo-600" : "text-slate-400"} />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${ active ? "bg-indigo-50 text-indigo-700" : "bg-slate-200/70 text-slate-600" }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sport Filter Chips */}
      {allSports.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          {allSports.map(sport => {
            const active = sportFilter === sport;
            const emoji = sport === "All" ? "🏅" : getSportEmoji(sport);
            return (
              <button
                key={sport}
                onClick={() => setSportFilter(sport)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span>{emoji}</span>
                <span>{sport}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Open Tournaments List */}
      {activeTab === "open" && (
        <div className="space-y-3.5">
          {filteredOpen.length === 0 ? (
            <EmptyState message="No tournaments are open for registration right now" />
          ) : (
            filteredOpen.map(t => (
              <TournamentCard
                key={t.id}
                tournament={t}
                onViewDetails={() => handleOpenDetails(t)}
                onViewSchedule={() => navigate(`/sports/schedule/${t.id}`)}
                onRegister={() => navigate(`/sports/register-tournament/${t.id}`)}
              />
            ))
          )}
        </div>
      )}

      {/* My Tournaments */}
      {activeTab === "my" && (
        <div className="space-y-3.5">
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
        <div className="space-y-3.5">
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
        tournament={selectedTournament as any}
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
}

function TournamentCard({
  tournament,
  completed,
  onViewDetails,
  onViewSchedule,
  onRegister,
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
            .filter((c: any) => tournament.events?.some(e => e.id === c.eventId))
            .map((c: any) => c.id);
          setConfigIds(ids);
        })
        .catch(() => setConfigIds([]));
    }
  }, [showStandings, tournament.events, configIds.length]);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-300 hover:shadow-md transition-all duration-200 text-left group">
      {/* Top Details Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm cursor-pointer"
            onClick={onViewDetails}
          >
            <Trophy className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                onClick={onViewDetails}
                className="text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer truncate"
              >
                {tournament.name}
              </h3>

              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${ completed ? "bg-slate-100 text-slate-600 border border-slate-200" : isOpen ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-blue-700 border border-blue-200" }`}
              >
                {completed ? "Completed" : isOpen ? "Open for Registration" : status}
              </span>

              {daysLeft !== null && daysLeft >= 0 && isOpen && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {daysLeft === 0 ? "Starts Today!" : `${daysLeft}d left`}
                </span>
              )}
            </div>

            {tournament.communityName && (
              <div className="text-xs text-slate-500 font-medium mt-0.5">{tournament.communityName}</div>
            )}

            {/* Tournament Meta Badges Row */}
            <div className="flex items-center gap-3 sm:gap-4 mt-2.5 flex-wrap text-xs text-slate-600 font-medium">
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
        <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
          <button
            onClick={onViewDetails}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Tournament Details</span>
          </button>

          {isOpen && onRegister && (
            <button
              onClick={onRegister}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <span>Register</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onViewSchedule}
            className="p-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
            title="View Match Schedule"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Child Sports Category Groups Preview Chips */}
      {tournament.events && tournament.events.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mr-1">Groups:</span>
          {tournament.events.slice(0, 5).map(ev => {
            const emoji = getSportEmoji(ev.sportName);
            return (
              <span
                key={ev.id}
                onClick={onViewDetails}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100/80 text-slate-700 border border-slate-200/60 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors cursor-pointer inline-flex items-center gap-1"
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
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={() => setShowStandings(!showStandings)}
          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
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
    </div>
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
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200/80 hover:border-amber-400 hover:shadow-md transition-all text-left group">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-sm cursor-pointer"
            onClick={onViewDetails}
          >
            <span className="text-[10px]">{emoji}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                onClick={onViewDetails}
                className="text-xs font-sans font-bold text-slate-900 hover:text-amber-700 transition-colors cursor-pointer truncate max-w-full"
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
                  <Trophy size={12} className="text-amber-500" />
                  <span>{event.sportName}</span>
                </span>
              )}
              {startDate && (
                <span className="inline-flex items-center gap-1">
                  <Calendar size={12} className="text-slate-400" />
                  <span>{format(startDate, "MMM d, yyyy")}</span>
                </span>
              )}
              {event.venueName && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} className="text-slate-400" />
                  <span>{event.venueName}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onViewDetails}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Details</span>
          </button>
          <button
            onClick={onViewSchedule}
            className="p-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
            title="View Match Schedule"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-500">
      <Trophy size={36} className="mx-auto mb-2 text-slate-300" />
      <div className="text-sm font-semibold text-slate-700">{message}</div>
      <div className="text-xs text-slate-400 mt-1">Check back later or explore other sports tabs above.</div>
    </div>
  );
}
