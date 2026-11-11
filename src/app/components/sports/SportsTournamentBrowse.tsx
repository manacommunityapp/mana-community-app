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
  CreditCard,
  Download,
  Lock,
  CheckCircle2,
  Radio,
  Shield,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { sportsDashboardService, type DashboardTournamentCard } from "../../../services/sports/sportsDashboardService";
import { sportsService } from "../../../services/sports/sportsService";
import { tournamentService } from "../../../services/sports/tournamentService";
import { auctionService } from "../../../services/sports/auctionService";
import { isTeamSport } from "./utils/sportsConstants";
import type { SportsEvent, SportsTournament, EventRegistration, AuctionTeam } from "../../../types/api";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";
import { SportsTournamentStandings } from "./SportsTournamentStandings";
import { TournamentDetailsModal } from "./TournamentDetailsModal";
import { TournamentPlayersPaymentModal } from "./TournamentPlayersPaymentModal";
import { TournamentPaymentContactsModal } from "./TournamentPaymentContactsModal";
import { tournamentPaymentService } from "../../../services/sports/tournamentPaymentService";
import { exportTournamentPaymentsToExcel } from "../../../utils/sportsExportUtils";

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

export function getEventEffectiveStatus(event: SportsEvent | DashboardTournamentCard): {
  status: string;
  isOpen: boolean;
  isClosed: boolean;
  isCompleted: boolean;
  isLive: boolean;
} {
  const raw = ((event as any).registrationStatus || (event as any).status || (event as any).tournament?.registrationStatus || "").toUpperCase();
  const isCompleted = raw === "COMPLETED";
  const isRegistrationClosed = raw === "REGISTRATION_CLOSED" || raw === "CLOSED";
  const isClosed = isCompleted || isRegistrationClosed;
  const isLive = raw === "LIVE" || raw === "IN_PROGRESS";
  const isOpen = (raw === "OPEN" || raw === "REGISTRATION_OPEN") && !isClosed;
  return {
    status: raw || (isCompleted ? "COMPLETED" : "REGISTRATION_OPEN"),
    isOpen,
    isClosed,
    isCompleted,
    isLive,
  };
}

type BrowseTab = "open" | "my" | "closed" | "completed";

export function SportsTournamentBrowse() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  const { isAdmin, isSportsAdmin, isSuperAdmin } = useAuth();
  const isSportsAdminUser = Boolean(isAdmin || isSportsAdmin || isSuperAdmin);
  const [activeTab, setActiveTab] = useState<BrowseTab>("open");
  const [myStatusFilter, setMyStatusFilter] = useState<"all" | "open" | "closed">("all");
  const [openTournaments, setOpenTournaments] = useState<DashboardTournamentCard[]>([]);
  const [closedTournaments, setClosedTournaments] = useState<DashboardTournamentCard[]>([]);
  const [completedTournaments, setCompletedTournaments] = useState<DashboardTournamentCard[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<SportsEvent[]>([]);
  const [myEventRegistrations, setMyEventRegistrations] = useState<EventRegistration[]>([]);
  const [myAuctionTeams, setMyAuctionTeams] = useState<AuctionTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState<string>("All");

  // Selected tournament for details modal
  const [selectedTournament, setSelectedTournament] = useState<DashboardTournamentCard | SportsEvent | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Selected tournament for players payment modal
  const [selectedTournamentForPayment, setSelectedTournamentForPayment] = useState<DashboardTournamentCard | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Selected tournament for payment contact details modal
  const [selectedTournamentForContacts, setSelectedTournamentForContacts] = useState<DashboardTournamentCard | SportsTournament | null>(null);
  const [isPaymentContactsModalOpen, setIsPaymentContactsModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      sportsDashboardService.getOpenTournaments().catch(() => []),
      sportsDashboardService.getClosedTournaments().catch(() => []),
      sportsDashboardService.getCompletedTournaments().catch(() => []),
      sportsService.getMyTournaments().catch(() => []),
      sportsService.getMyRegistrations().catch(() => []),
      sportsDashboardService.getMyRegistrations().catch(() => []),
      auctionService.getCaptainRegistration().catch(() => []),
    ]).then(([open, closed, completed, my, apiRegs, dashRegs, captainTeams]) => {
      const nonDraftOpen = open
        .filter(t => String(t.registrationStatus || (t as any).status || "").toUpperCase().trim() !== "DRAFT")
        .map(t => ({
          ...t,
          events: (t.events || []).filter(e => String(e.registrationStatus || (e as any).status || "").toUpperCase().trim() !== "DRAFT"),
        }))
        .filter(t => t.events.length > 0);
      setOpenTournaments(nonDraftOpen);
      setClosedTournaments(closed);
      setCompletedTournaments(completed);
      setMyRegistrations(my);

      // Merge registrations from sportsService and sportsDashboardService
      const mergedMap = new Map<number | string, any>();
      (dashRegs || []).forEach((r: any) => {
        if (r && r.id != null) mergedMap.set(r.id, r);
      });
      (apiRegs || []).forEach((r: any) => {
        if (r && r.id != null) {
          const existing = mergedMap.get(r.id) || {};
          mergedMap.set(r.id, { ...existing, ...r });
        }
      });
      setMyEventRegistrations(Array.from(mergedMap.values()));
      setMyAuctionTeams(captainTeams || []);
    }).finally(() => setLoading(false));
  }, []);

  const tabs: { key: BrowseTab; label: string; icon: typeof Trophy; count: number }[] = [
    { key: "open", label: "Open Tournaments", icon: Trophy, count: openTournaments.length },
    { key: "my", label: "My Tournaments", icon: Medal, count: myRegistrations.length },
    { key: "closed", label: "Closed Tournaments", icon: Lock, count: closedTournaments.length },
    { key: "completed", label: "Completed", icon: Calendar, count: completedTournaments.length },
  ];

  const allSports = useMemo(() => {
    const sports = new Set<string>();
    for (const t of [...openTournaments, ...closedTournaments, ...completedTournaments]) {
      for (const ev of t.events || []) {
        if (ev.sportName) sports.add(ev.sportName);
      }
    }
    for (const ev of myRegistrations) {
      if (ev.sportName) sports.add(ev.sportName);
    }
    return ["All", ...Array.from(sports).sort()];
  }, [openTournaments, closedTournaments, completedTournaments, myRegistrations]);

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

  const filteredCompleted = useMemo(() => {
    let list = completedTournaments;
    if (sportFilter !== "All") list = list.filter(matchesSportFilter);
    return list;
  }, [completedTournaments, sportFilter, matchesSportFilter]);

  const myCounts = useMemo(() => {
    let openCount = 0;
    let closedCount = 0;
    for (const ev of myRegistrations) {
      const { isClosed } = getEventEffectiveStatus(ev);
      if (isClosed) closedCount++;
      else openCount++;
    }
    return { total: myRegistrations.length, openCount, closedCount };
  }, [myRegistrations]);

  const filteredMy = useMemo(() => {
    let list = myRegistrations;
    if (sportFilter !== "All") list = list.filter(ev => ev.sportName === sportFilter);
    if (myStatusFilter === "open") {
      list = list.filter(ev => !getEventEffectiveStatus(ev).isClosed);
    } else if (myStatusFilter === "closed") {
      list = list.filter(ev => getEventEffectiveStatus(ev).isClosed);
    }
    return list;
  }, [myRegistrations, sportFilter, myStatusFilter]);

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
                onOpenPayments={() => {
                  setSelectedTournamentForPayment(t);
                  setIsPaymentModalOpen(true);
                }}
                onOpenPaymentContacts={() => {
                  setSelectedTournamentForContacts(t);
                  setIsPaymentContactsModalOpen(true);
                }}
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
          {/* Sub-filter tabs inside My Tournaments */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm sm:px-5">
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
              <button
                type="button"
                onClick={() => setMyStatusFilter("all")}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  myStatusFilter === "all"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                All Tournaments ({myCounts.total})
              </button>
              <button
                type="button"
                onClick={() => setMyStatusFilter("open")}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  myStatusFilter === "open"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                Active / Open ({myCounts.openCount})
              </button>
              <button
                type="button"
                onClick={() => setMyStatusFilter("closed")}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  myStatusFilter === "closed"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100/80"
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>Closed Tournaments ({myCounts.closedCount})</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing {filteredMy.length} of {myRegistrations.length} registrations
            </div>
          </div>

          {filteredMy.length === 0 ? (
            <EmptyState
              message={
                myStatusFilter === "closed"
                  ? "No closed or completed tournaments found among your registrations"
                  : myStatusFilter === "open"
                  ? "No active tournaments open for registration found"
                  : "You haven't joined any tournaments yet"
              }
            />
          ) : (
            filteredMy.map(ev => {
              const matchedTournament =
                [...openTournaments, ...closedTournaments, ...completedTournaments].find(
                  t => t.id === ev.tournament?.id || t.events?.some(e => e.id === ev.id)
                ) || null;

              const matchingRegs = myEventRegistrations.filter(r => {
                const rEvId = (r as any).eventId || r.event?.id;
                if (rEvId === ev.id) return true;
                if (ev.id && rEvId && Number(rEvId) === Number(ev.id)) return true;
                if (matchedTournament && matchedTournament.events?.some(e => Number(e.id) === Number(rEvId))) return true;
                return false;
              });

              const matchingAuctionTeam = myAuctionTeams.find(t => {
                if (Number(t.eventId) === Number(ev.id)) return true;
                if (ev.tournament?.id && Number(t.eventId) === Number(ev.tournament.id)) return true;
                if (matchedTournament && (Number(t.eventId) === Number(matchedTournament.id) || matchedTournament.events?.some(e => Number(e.id) === Number(t.eventId)))) return true;
                return false;
              }) || null;

              return (
                <MyTournamentCard
                  key={ev.id}
                  event={ev}
                  matchedTournament={matchedTournament}
                  registrations={matchingRegs}
                  auctionTeam={matchingAuctionTeam}
                  canAdminRegister={isSportsAdminUser}
                  onViewDetails={() => handleOpenDetails(ev)}
                  onViewSchedule={() => { void navigate(`/sports/schedule/${ev.id}`); }}
                  onOpenPaymentContacts={(tCard: DashboardTournamentCard | SportsTournament) => {
                    setSelectedTournamentForContacts(tCard);
                    setIsPaymentContactsModalOpen(true);
                  }}
                  onRegister={isSportsAdminUser ? () => navigate(`/sports/register-tournament/${matchedTournament?.id || ev.tournament?.id || ev.id}`, { state: { returnTo } }) : undefined}
                  onRegisterOthers={isSportsAdminUser ? () => navigate(`/sports/register-tournament/${matchedTournament?.id || ev.tournament?.id || ev.id}?for=community`, { state: { returnTo } }) : undefined}
                />
              );
            })
          )}
        </div>
      )}

      {/* Closed Tournaments */}
      {activeTab === "closed" && (
        <div className="space-y-4">
          {filteredClosed.length === 0 ? (
            <EmptyState message="No closed tournaments found" />
          ) : (
            filteredClosed.map(t => (
              <TournamentCard
                key={t.id}
                tournament={t}
                canAdminRegister={isSportsAdminUser}
                onViewDetails={() => handleOpenDetails(t)}
                onViewSchedule={() => navigate(`/sports/schedule/${t.id}`)}
                onOpenPayments={() => {
                  setSelectedTournamentForPayment(t);
                  setIsPaymentModalOpen(true);
                }}
                onOpenPaymentContacts={() => {
                  setSelectedTournamentForContacts(t);
                  setIsPaymentContactsModalOpen(true);
                }}
                onRegister={isSportsAdminUser ? () => navigate(`/sports/register-tournament/${t.id}`, { state: { returnTo } }) : undefined}
                onRegisterOthers={isSportsAdminUser ? () => navigate(`/sports/register-tournament/${t.id}?for=community`, { state: { returnTo } }) : undefined}
              />
            ))
          )}
        </div>
      )}

      {/* Completed Tournaments */}
      {activeTab === "completed" && (
        <div className="space-y-4">
          {filteredCompleted.length === 0 ? (
            <EmptyState message="No completed tournaments found" />
          ) : (
            filteredCompleted.map(t => (
              <TournamentCard
                key={t.id}
                tournament={t}
                completed
                canAdminRegister={isSportsAdminUser}
                onViewDetails={() => handleOpenDetails(t)}
                onViewSchedule={() => navigate(`/sports/schedule/${t.id}`)}
                onOpenPayments={() => {
                  setSelectedTournamentForPayment(t);
                  setIsPaymentModalOpen(true);
                }}
                onOpenPaymentContacts={() => {
                  setSelectedTournamentForContacts(t);
                  setIsPaymentContactsModalOpen(true);
                }}
                onRegister={isSportsAdminUser ? () => navigate(`/sports/register-tournament/${t.id}`, { state: { returnTo } }) : undefined}
                onRegisterOthers={isSportsAdminUser ? () => navigate(`/sports/register-tournament/${t.id}?for=community`, { state: { returnTo } }) : undefined}
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

      {/* Tournament Players Payment & Audit Modal */}
      <TournamentPlayersPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedTournamentForPayment(null);
        }}
        tournament={selectedTournamentForPayment}
      />

      {/* Tournament Payment Contacts & Coordinators Modal */}
      <TournamentPaymentContactsModal
        isOpen={isPaymentContactsModalOpen}
        onClose={() => {
          setIsPaymentContactsModalOpen(false);
          setSelectedTournamentForContacts(null);
        }}
        tournament={selectedTournamentForContacts}
        onOpenFeeModal={(t) => {
          setSelectedTournamentForPayment(t);
          setIsPaymentModalOpen(true);
        }}
        onTournamentUpdated={(updated) => {
          setOpenTournaments((prev) =>
            prev.map((t) => (t.id === updated.id ? { ...t, otherContacts: updated.otherContacts } : t))
          );
          setClosedTournaments((prev) =>
            prev.map((t) => (t.id === updated.id ? { ...t, otherContacts: updated.otherContacts } : t))
          );
          setCompletedTournaments((prev) =>
            prev.map((t) => (t.id === updated.id ? { ...t, otherContacts: updated.otherContacts } : t))
          );
        }}
      />
    </div>
  );
}

// ─── Tournament Card Component ────────────────────────────────────────────────

interface TournamentCardProps {
  tournament: DashboardTournamentCard;
  completed?: boolean;
  canAdminRegister?: boolean;
  onViewDetails: () => void;
  onViewSchedule: () => void;
  onOpenPayments?: () => void;
  onOpenPaymentContacts?: () => void;
  onRegister?: () => void;
  onRegisterOthers?: () => void;
}

function TournamentCard({
  tournament,
  completed,
  canAdminRegister: canAdminRegisterProp,
  onViewDetails,
  onViewSchedule,
  onOpenPayments,
  onOpenPaymentContacts,
  onRegister,
  onRegisterOthers,
}: TournamentCardProps) {
  const { isAdmin, isSportsAdmin, isSuperAdmin } = useAuth();
  const canAdminRegister = canAdminRegisterProp ?? Boolean(isAdmin || isSportsAdmin || isSuperAdmin);
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

  // Total registered sports events count (events that have registered players)
  const registeredEventsCount = (tournament.events || []).filter(
    (ev) => (ev.registeredCount ?? 0) > 0
  ).length;
  const totalEventsCount = tournament.events?.length ?? 0;
  const sportsEventsDisplayCount = registeredEventsCount > 0 ? registeredEventsCount : totalEventsCount;

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
                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  completed
                    ? "border-slate-200 bg-slate-100 text-slate-600"
                    : isOpen
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : status === "REGISTRATION_CLOSED" || status === "CLOSED"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : status === "LIVE" || status === "MATCHES_RUNNING"
                    ? "border-rose-200 bg-rose-50 text-rose-700 animate-pulse"
                    : "border-blue-200 bg-blue-50 text-blue-700"
                }`}
              >
                {completed
                  ? "Completed"
                  : isOpen
                  ? "Open for Registration"
                  : status === "REGISTRATION_CLOSED" || status === "CLOSED"
                  ? "Registration Closed"
                  : status === "LIVE" || status === "MATCHES_RUNNING"
                  ? "Matches Running"
                  : status === "UPCOMING"
                  ? "Upcoming"
                  : status}
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
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-600">
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

              {/* Registered Players & Sports Events Count Action Button */}
              {onOpenPayments ? (
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onOpenPayments}
                    onMouseEnter={() => tournamentPaymentService.prefetchTournamentData(tournament)}
                    onFocus={() => tournamentPaymentService.prefetchTournamentData(tournament)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs transition-all hover:border-indigo-300 hover:bg-indigo-50/70 hover:text-indigo-700 hover:shadow-xs active:scale-[0.98] cursor-pointer group/btn"
                    title={`View ${totalRegistered} registered players across ${sportsEventsDisplayCount} sports events & payment status`}
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-500 group-hover/btn:scale-110 transition-transform" />
                    <span className="font-bold text-slate-900 group-hover/btn:text-indigo-700">
                      {totalRegistered} Registered
                    </span>
                    <span className="text-slate-300 font-normal">/</span>
                    <span className="text-slate-600 group-hover/btn:text-indigo-600 font-medium">
                      {sportsEventsDisplayCount} {sportsEventsDisplayCount === 1 ? "Sports Event" : "Sports Events"}
                    </span>
                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover/btn:text-indigo-500 group-hover/btn:translate-x-0.5 transition-all" />
                  </button>

                  {totalRegistered > 0 && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          toast.info("Preparing tournament export...");
                          const players = await tournamentPaymentService.loadTournamentPlayers(tournament);
                          exportTournamentPaymentsToExcel(players, tournament.name);
                          toast.success(`Exported ${players.length} players to Excel`);
                        } catch {
                          toast.error("Failed to export tournament details");
                        }
                      }}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200/90 bg-white text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/70 shadow-2xs transition-all active:scale-95 cursor-pointer group/btn"
                      title="Download Excel spreadsheet of registered players & payment details"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-500 group-hover/btn:scale-110 transition-transform" />
                    </button>
                  )}
                </div>
              ) : totalRegistered > 0 ? (
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-bold text-slate-900">{totalRegistered} Registered</span>
                  <span className="text-slate-300 font-normal">/</span>
                  <span className="text-slate-600 font-medium">
                    {sportsEventsDisplayCount} {sportsEventsDisplayCount === 1 ? "Sports Event" : "Sports Events"}
                  </span>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Action Buttons on the card */}
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:self-start">
          <button
            type="button"
            onClick={onViewDetails}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 sm:flex-none"
          >
            <Info className="h-3.5 w-3.5 text-slate-500" />
            <span>Details</span>
          </button>

          {onOpenPaymentContacts && (
            <button
              type="button"
              onClick={onOpenPaymentContacts}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-indigo-200/90 bg-indigo-50/60 hover:bg-indigo-100/80 px-3 py-2.5 text-xs font-bold text-indigo-700 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] sm:flex-none"
              title="View tournament fee payment coordinators & contact details"
            >
              <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
              <span>Payment Contacts</span>
            </button>
          )}

          {(isOpen || canAdminRegister) && onRegister && (
            <button
              onClick={onRegister}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] sm:flex-none"
            >
              <span>Register</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}

          {(isOpen || canAdminRegister) && onRegisterOthers && (
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

interface MyTournamentCardProps {
  event: SportsEvent;
  matchedTournament?: DashboardTournamentCard | null;
  registrations?: EventRegistration[];
  auctionTeam?: AuctionTeam | null;
  canAdminRegister?: boolean;
  onViewDetails: () => void;
  onViewSchedule: () => void;
  onOpenPayments?: (tournament: DashboardTournamentCard) => void;
  onOpenPaymentContacts: (tournament: DashboardTournamentCard | SportsTournament) => void;
  onRegister?: () => void;
  onRegisterOthers?: () => void;
}

function MyTournamentCard({
  event,
  matchedTournament,
  registrations = [],
  auctionTeam,
  canAdminRegister: canAdminRegisterProp,
  onViewDetails,
  onViewSchedule,
  onOpenPayments,
  onOpenPaymentContacts,
  onRegister,
  onRegisterOthers,
}: MyTournamentCardProps) {
  const { isAdmin, isSportsAdmin, isSuperAdmin } = useAuth();
  const canAdminRegister = canAdminRegisterProp ?? Boolean(isAdmin || isSportsAdmin || isSuperAdmin);
  const [showStandings, setShowStandings] = useState(false);
  const [configIds, setConfigIds] = useState<number[]>([]);

  const emoji = getSportEmoji(event.sportName || event.sport?.name);
  const rawStart = event.eventDateStart || matchedTournament?.eventDateStart;
  const rawEnd = event.eventDateEnd || matchedTournament?.eventDateEnd;
  const startDate = rawStart ? new Date(rawStart) : null;
  const endDate = rawEnd ? new Date(rawEnd) : null;

  const { status, isOpen, isClosed, isCompleted, isLive } = getEventEffectiveStatus(event);

  // Resolve format, category, team, partner, and player details
  const {
    formatBadges,
    categoryBadge,
    teamInfo,
    partnerList,
    isOpenPool,
    familyPlayerList,
  } = useMemo(() => {
    // 1. Format Badges
    const detectedFormats = new Set<"SINGLES" | "DOUBLES" | "MIXED_DOUBLES" | "TEAM">();

    (registrations || []).forEach(r => {
      const raw = String(r.matchType || r.matchFormat || ((r as any).format ? (Array.isArray((r as any).format) ? (r as any).format.join(" ") : (r as any).format) : "")).toUpperCase();
      if (raw.includes("MIXED")) {
        detectedFormats.add("MIXED_DOUBLES");
      } else if (raw.includes("DOUBLE")) {
        detectedFormats.add("DOUBLES");
      } else if (raw.includes("SINGLE")) {
        detectedFormats.add("SINGLES");
      } else if (raw.includes("TEAM")) {
        detectedFormats.add("TEAM");
      } else if (r.partnerName || r.partnerUserId || r.partner || r.partnerFamilyMember) {
        detectedFormats.add("DOUBLES");
      }
    });

    // Fallback if not detected from registrations
    if (detectedFormats.size === 0) {
      const name = (event.name || "").toLowerCase();
      const sportName = (event.sportName || event.sport?.name || "").toLowerCase();
      const rawFormat = String(event.format || "").toUpperCase();

      if (rawFormat.includes("MIXED") || name.includes("mixed doubles") || name.includes("mixed")) {
        detectedFormats.add("MIXED_DOUBLES");
      } else if (rawFormat.includes("DOUBLE") || name.includes("doubles")) {
        detectedFormats.add("DOUBLES");
      } else if (rawFormat.includes("SINGLE") || name.includes("singles")) {
        detectedFormats.add("SINGLES");
      } else if (rawFormat.includes("TEAM") || isTeamSport(sportName || name)) {
        detectedFormats.add("TEAM");
      } else if (isTeamSport(sportName)) {
        detectedFormats.add("TEAM");
      } else {
        detectedFormats.add("SINGLES");
      }
    }

    // 2. Category Badge
    let cat = event.categoryName || (event as any).category?.name || "";
    if (!cat && registrations && registrations.length > 0) {
      cat = registrations[0].category?.name || (registrations[0] as any).categoryName || "";
    }
    if (!cat && event.name && event.name.includes("—")) {
      const parts = event.name.split("—");
      if (parts.length > 1) {
        cat = parts[1].trim();
      }
    }
    const categoryBadge = cat && cat.toLowerCase() !== "all" && cat.toLowerCase() !== "general" ? cat : null;

    // 3. Team Info
    let teamName = "";
    let isCaptain = false;
    let isNominated = false;

    if (auctionTeam) {
      teamName = auctionTeam.teamName || auctionTeam.name || "";
      isCaptain = Boolean(auctionTeam.captainConfirmation);
      isNominated = Boolean(auctionTeam.captainNomination && !isCaptain);
    }
    (registrations || []).forEach(r => {
      if (!teamName && (r.proposedTeamName || (r as any).teamName)) {
        teamName = r.proposedTeamName || (r as any).teamName;
      }
      if (r.captainConfirmation) isCaptain = true;
      if (r.captainNomination && !r.captainConfirmation) isNominated = true;
    });

    const teamInfo = teamName ? {
      name: teamName,
      role: isCaptain ? "Captain" : isNominated ? "Nominated Captain" : null,
    } : null;

    // 4. Partner details
    const partnerList: Array<{ name: string; flat?: string | null; status?: string | null }> = [];
    let isOpenPool = false;

    (registrations || []).forEach(r => {
      const pName = r.partnerName || r.partner?.fullName || r.partner?.name || r.partnerFamilyMember?.name || null;
      const pFlat = r.partnerFlatNumber || r.partner?.flatNo || (r.partner as any)?.flatNumber || r.partnerFamilyMember?.user?.flatNo || null;
      const pStatus = r.partnerConfirmationStatus || r.partnerStatus || null;
      if (pName) {
        if (!partnerList.some(p => p.name.toLowerCase() === pName.toLowerCase())) {
          partnerList.push({ name: pName, flat: pFlat, status: pStatus });
        }
      } else if ((r as any).openPool || (detectedFormats.has("DOUBLES") || detectedFormats.has("MIXED_DOUBLES"))) {
        isOpenPool = true;
      }
    });

    // 5. Family member player list
    const familyPlayerList: Array<{ name: string; relation?: string | null }> = [];
    (registrations || []).forEach(r => {
      const pName = r.playerName;
      const rel = r.relation;
      if (pName && rel && rel.toUpperCase() !== "SELF") {
        if (!familyPlayerList.some(fp => fp.name.toLowerCase() === pName.toLowerCase())) {
          familyPlayerList.push({ name: pName, relation: rel });
        }
      }
    });

    return {
      formatBadges: Array.from(detectedFormats),
      categoryBadge,
      teamInfo,
      partnerList,
      isOpenPool,
      familyPlayerList,
    };
  }, [registrations, auctionTeam, event]);

  // Construct a fallback tournament card if no matched parent tournament card is available
  const resolvedTournamentCard = useMemo<DashboardTournamentCard>(() => {
    if (matchedTournament) return matchedTournament;
    return {
      id: event.tournament?.id || event.id,
      name: event.tournament?.name || event.name,
      bannerImage: event.bannerImage || null,
      eventDateStart: event.eventDateStart || null,
      eventDateEnd: event.eventDateEnd || null,
      registrationStatus: status,
      communityId: event.community?.id || null,
      communityName: event.community?.name || null,
      venueName: event.venueName || event.venue?.name || null,
      sportName: event.sportName || event.sport?.name || null,
      otherContacts: event.otherContacts,
      sponsors: event.sponsors,
      events: [
        {
          id: event.id,
          uuid: event.uuid || null,
          name: event.name,
          eventDateStart: event.eventDateStart || null,
          eventDateEnd: event.eventDateEnd || null,
          sportName: event.sportName || event.sport?.name || null,
          categoryName: event.categoryName || null,
          venueName: event.venueName || event.venue?.name || null,
          maxParticipants: event.maxParticipants || null,
          registeredCount: event.registeredCount || null,
          registrationStatus: status,
          auctionStatus: event.auctionStatus || null,
          teamSport: false,
          myRegistrationId: null,
          myRegistrationStatus: null,
        },
      ],
    };
  }, [matchedTournament, event, status]);


  useEffect(() => {
    if (showStandings && configIds.length === 0) {
      tournamentService
        .getConfigs()
        .then(configs => {
          const ids = configs
            .filter(c => c.eventId === event.id || matchedTournament?.events?.some(e => e.id === c.eventId))
            .map(c => c.id);
          setConfigIds(ids);
        })
        .catch(() => setConfigIds([]));
    }
  }, [showStandings, event.id, matchedTournament, configIds.length]);

  const parentTournamentName = event.tournament?.name;
  const isPartOfNamedTournament = Boolean(parentTournamentName && parentTournamentName.toLowerCase() !== event.name.toLowerCase());

  return (
    <article
      className={`group rounded-2xl border bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 sm:p-5 ${
        isCompleted
          ? "border-slate-200/90 hover:border-slate-300 hover:shadow-md"
          : isClosed
          ? "border-amber-200/90 hover:border-amber-300 hover:shadow-md"
          : "border-slate-200/80 hover:border-indigo-200 hover:shadow-md"
      }`}
    >
      {/* Top Details Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <div
            className={`flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl text-base ring-1 transition ${
              isCompleted
                ? "bg-slate-100 ring-slate-200 text-slate-600"
                : isClosed
                ? "bg-amber-50 ring-amber-200 text-amber-700"
                : "bg-emerald-50 ring-emerald-200 text-emerald-700"
            }`}
            onClick={onViewDetails}
          >
            <span>{emoji}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                onClick={onViewDetails}
                className="m-0 cursor-pointer truncate text-base font-extrabold tracking-tight text-slate-900 transition-colors hover:text-indigo-700 sm:text-lg"
              >
                {event.name}
              </h3>

              {/* Status Badge */}
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  <CheckCircle2 className="w-3 h-3 text-slate-500" />
                  <span>Completed</span>
                </span>
              ) : isClosed ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span>Closed (Registration Ended)</span>
                </span>
              ) : isLive ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                  <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                  <span>Live / Ongoing</span>
                </span>
              ) : isOpen ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                  <span>Open for Registration</span>
                </span>
              ) : status ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  {status}
                </span>
              ) : null}

              {/* Format Badges */}
              {formatBadges.map(fmt => {
                if (fmt === "SINGLES") {
                  return (
                    <span
                      key="SINGLES"
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700"
                    >
                      <User className="w-3 h-3 text-emerald-600" />
                      <span>Singles</span>
                    </span>
                  );
                }
                if (fmt === "DOUBLES") {
                  return (
                    <span
                      key="DOUBLES"
                      className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700"
                    >
                      <Users className="w-3 h-3 text-sky-600" />
                      <span>Doubles</span>
                    </span>
                  );
                }
                if (fmt === "MIXED_DOUBLES") {
                  return (
                    <span
                      key="MIXED_DOUBLES"
                      className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-700"
                    >
                      <Users className="w-3 h-3 text-purple-600" />
                      <span>Mixed Doubles</span>
                    </span>
                  );
                }
                if (fmt === "TEAM") {
                  return (
                    <span
                      key="TEAM"
                      className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700"
                    >
                      <Shield className="w-3 h-3 text-indigo-600" />
                      <span>Team</span>
                    </span>
                  );
                }
                return null;
              })}

              {/* Category Badge */}
              {categoryBadge && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  <Award className="w-3 h-3 text-slate-500" />
                  <span>{categoryBadge}</span>
                </span>
              )}
            </div>

            {/* Registered Details: Selected Team, Partner, or Family Member Player */}
            {(teamInfo || partnerList.length > 0 || (isOpenPool && partnerList.length === 0) || familyPlayerList.length > 0) && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {teamInfo && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/90 px-2.5 py-1 text-xs font-semibold text-indigo-900 shadow-2xs">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Team: <strong className="font-bold">{teamInfo.name}</strong></span>
                    {teamInfo.role && (
                      <span className="rounded bg-indigo-200/90 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-indigo-950">
                        {teamInfo.role}
                      </span>
                    )}
                  </span>
                )}

                {partnerList.map((p, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50/90 px-2.5 py-1 text-xs font-semibold text-sky-900 shadow-2xs">
                    <Users className="w-3.5 h-3.5 text-sky-600" />
                    <span>Partner: <strong className="font-bold">{p.name}</strong>{p.flat ? ` (${p.flat})` : ""}</span>
                    {p.status && (
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                        p.status.toUpperCase() === "CONFIRMED" || p.status.toUpperCase() === "ACCEPTED"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : p.status.toUpperCase() === "PENDING"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-slate-100 text-slate-700 border border-slate-300"
                      }`}>
                        {p.status.toUpperCase() === "CONFIRMED" || p.status.toUpperCase() === "ACCEPTED" ? "Confirmed" : p.status.toUpperCase() === "PENDING" ? "Pending" : p.status}
                      </span>
                    )}
                  </span>
                ))}

                {isOpenPool && partnerList.length === 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/90 px-2.5 py-1 text-xs font-semibold text-amber-900 shadow-2xs">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    <span>Open Pool <em className="text-amber-700 font-normal">(Seeking Partner)</em></span>
                  </span>
                )}

                {familyPlayerList.map((fp, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50/90 px-2.5 py-1 text-xs font-semibold text-violet-900 shadow-2xs">
                    <User className="w-3.5 h-3.5 text-violet-600" />
                    <span>Player: <strong className="font-bold">{fp.name}</strong> ({fp.relation})</span>
                  </span>
                ))}
              </div>
            )}

            {/* Parent Tournament Link/Badge */}
            {isPartOfNamedTournament && (
              <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
                <Trophy className="w-3 h-3 text-indigo-500" />
                <span>Part of {parentTournamentName}</span>
              </div>
            )}

            {/* Community Name */}
            {event.community?.name && (
              <div className="mt-1 text-xs font-medium text-slate-500">{event.community.name}</div>
            )}

            {/* Tournament Meta Badges Row */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-600">
              {startDate && (
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {format(startDate, "MMM d, yyyy")}
                    {endDate && ` - ${format(endDate, "MMM d, yyyy")}`}
                  </span>
                </span>
              )}

              {event.sportName && (
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>{event.sportName}</span>
                </span>
              )}

              {(event.venueName || event.venue?.name) && (
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{event.venueName || event.venue?.name}</span>
                </span>
              )}

              {event.categoryName && !categoryBadge && (
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <Award className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{event.categoryName}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:self-start">
          <button
            type="button"
            onClick={onViewDetails}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 sm:flex-none"
          >
            <Info className="h-3.5 w-3.5 text-slate-500" />
            <span>Details</span>
          </button>

          {onOpenPaymentContacts && (
            <button
              type="button"
              onClick={() => onOpenPaymentContacts(resolvedTournamentCard)}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-indigo-200/90 bg-indigo-50/60 hover:bg-indigo-100/80 px-3 py-2.5 text-xs font-bold text-indigo-700 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] sm:flex-none"
              title="View tournament fee payment coordinators & contact details"
            >
              <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
              <span>Payment Contacts</span>
            </button>
          )}

          {canAdminRegister && onRegister && (
            <button
              type="button"
              onClick={onRegister}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] sm:flex-none"
            >
              <span>Register</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}

          {canAdminRegister && onRegisterOthers && (
            <button
              type="button"
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
