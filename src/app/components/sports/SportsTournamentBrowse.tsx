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
  UserCheck,
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
import { detectSportName } from "./admin/ScheduleExportModal";

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

export function resolveSportName(
  item: {
    sportName?: string | null;
    sport?: { name?: string | null } | null;
    name?: string | null;
    title?: string | null;
  } | null | undefined
): string | undefined {
  if (!item) return undefined;
  const direct = item.sportName || item.sport?.name || (item as any).sport_name;
  if (direct && String(direct).trim()) {
    const trimmed = String(direct).trim();
    const detected = detectSportName(trimmed);
    return detected || trimmed;
  }
  return detectSportName(item.name || item.title || "");
}

export function tournamentMatchesSport(
  t: DashboardTournamentCard,
  filter: string
): boolean {
  if (!filter || filter === "All") return true;
  const target = filter.trim().toLowerCase();

  // 1. Direct tournament sport
  const tSport = resolveSportName(t);
  if (tSport && (
    tSport.toLowerCase() === target ||
    tSport.toLowerCase().includes(target) ||
    target.includes(tSport.toLowerCase())
  )) {
    return true;
  }

  // 2. Child events in t.events
  if (t.events && t.events.length > 0) {
    const hasMatchingEvent = t.events.some(ev => {
      const evSport = resolveSportName(ev);
      if (evSport && (
        evSport.toLowerCase() === target ||
        evSport.toLowerCase().includes(target) ||
        target.includes(evSport.toLowerCase())
      )) {
        return true;
      }
      const evName = (ev.name || "").toLowerCase();
      return evName.includes(target);
    });
    if (hasMatchingEvent) return true;
  }

  // 3. Fallback: tournament name contains target sport
  const tName = (t.name || "").toLowerCase();
  return tName.includes(target);
}

export function eventMatchesSport(
  ev: SportsEvent,
  filter: string
): boolean {
  if (!filter || filter === "All") return true;
  const target = filter.trim().toLowerCase();

  // 1. Direct event sport
  const evSport = resolveSportName(ev);
  if (evSport && (
    evSport.toLowerCase() === target ||
    evSport.toLowerCase().includes(target) ||
    target.includes(evSport.toLowerCase())
  )) {
    return true;
  }

  // 2. Parent tournament sport
  if (ev.tournament) {
    const parentSport = resolveSportName(ev.tournament);
    if (parentSport && (
      parentSport.toLowerCase() === target ||
      parentSport.toLowerCase().includes(target) ||
      target.includes(parentSport.toLowerCase())
    )) {
      return true;
    }
  }

  // 3. Fallback: event name contains target sport
  const evName = (ev.name || "").toLowerCase();
  return evName.includes(target);
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

  const allSports = useMemo(() => {
    const sports = new Set<string>();

    const addSport = (s?: string) => {
      if (!s) return;
      const trimmed = s.trim();
      if (!trimmed) return;
      const lower = trimmed.toLowerCase();
      if (lower === "all" || lower === "sport" || lower === "sports" || lower === "tournament" || lower === "tournaments") return;

      const detected = detectSportName(trimmed);
      const standardName = detected || (trimmed.charAt(0).toUpperCase() + trimmed.slice(1));
      sports.add(standardName);
    };

    for (const t of [...openTournaments, ...closedTournaments, ...completedTournaments]) {
      addSport(resolveSportName(t));
      for (const ev of t.events || []) {
        addSport(resolveSportName(ev));
      }
    }

    for (const ev of myRegistrations) {
      addSport(resolveSportName(ev));
      if (ev.tournament) {
        addSport(resolveSportName(ev.tournament));
      }
    }

    return ["All", ...Array.from(sports).sort((a, b) => a.localeCompare(b))];
  }, [openTournaments, closedTournaments, completedTournaments, myRegistrations]);

  const filteredOpen = useMemo(() => {
    if (sportFilter === "All") return openTournaments;
    return openTournaments.filter(t => tournamentMatchesSport(t, sportFilter));
  }, [openTournaments, sportFilter]);

  const filteredClosed = useMemo(() => {
    if (sportFilter === "All") return closedTournaments;
    return closedTournaments.filter(t => tournamentMatchesSport(t, sportFilter));
  }, [closedTournaments, sportFilter]);

  const filteredCompleted = useMemo(() => {
    if (sportFilter === "All") return completedTournaments;
    return completedTournaments.filter(t => tournamentMatchesSport(t, sportFilter));
  }, [completedTournaments, sportFilter]);

  const myRegistrationsBySport = useMemo(() => {
    if (sportFilter === "All") return myRegistrations;
    return myRegistrations.filter(ev => eventMatchesSport(ev, sportFilter));
  }, [myRegistrations, sportFilter]);

  const myCounts = useMemo(() => {
    let openCount = 0;
    let closedCount = 0;
    for (const ev of myRegistrationsBySport) {
      const { isClosed } = getEventEffectiveStatus(ev);
      if (isClosed) closedCount++;
      else openCount++;
    }
    return { total: myRegistrationsBySport.length, openCount, closedCount };
  }, [myRegistrationsBySport]);

  const filteredMy = useMemo(() => {
    let list = myRegistrationsBySport;
    if (myStatusFilter === "open") {
      list = list.filter(ev => !getEventEffectiveStatus(ev).isClosed);
    } else if (myStatusFilter === "closed") {
      list = list.filter(ev => getEventEffectiveStatus(ev).isClosed);
    }
    return list;
  }, [myRegistrationsBySport, myStatusFilter]);

  const tabs: { key: BrowseTab; label: string; icon: typeof Trophy; count: number }[] = [
    { key: "open", label: "Open Tournaments", icon: Trophy, count: filteredOpen.length },
    { key: "my", label: "My Tournaments", icon: Medal, count: filteredMy.length },
    { key: "closed", label: "Closed Tournaments", icon: Lock, count: filteredClosed.length },
    { key: "completed", label: "Completed", icon: Calendar, count: filteredCompleted.length },
  ];

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
      {allSports.length > 1 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="m-0 text-sm font-bold text-slate-900">Browse by sport</h2>
            <p className="mt-0.5 text-xs text-slate-500">Narrow the tournament list to a sport</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="relative block w-full sm:w-64">
              <span className="sr-only">Filter tournaments by sport</span>
              <select
                value={sportFilter}
                onChange={e => setSportFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-10 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
              >
                {allSports.map(sport => <option key={sport} value={sport}>{sport === "All" ? "All sports" : sport}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </label>
            {sportFilter !== "All" && (
              <button
                type="button"
                onClick={() => setSportFilter("All")}
                className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                title="Reset sport filter"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* Open Tournaments List */}
      {activeTab === "open" && (
      <div className="space-y-4">
          {filteredOpen.length === 0 ? (
            <EmptyState message={sportFilter !== "All" ? `No open tournaments found for ${sportFilter}` : "No tournaments are open for registration right now"} />
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
              Showing {filteredMy.length} of {myRegistrationsBySport.length} registrations
            </div>
          </div>

          {filteredMy.length === 0 ? (
            <EmptyState
              message={
                sportFilter !== "All"
                  ? `No registrations found for ${sportFilter}${myStatusFilter !== "all" ? ` (${myStatusFilter})` : ""}`
                  : myStatusFilter === "closed"
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
                const rEvId = (r as any).eventId ?? r.event?.id ?? (r as any).sportsEventId;
                return rEvId != null && ev.id != null && Number(rEvId) === Number(ev.id);
              });

              const matchingAuctionTeam = myAuctionTeams.find(t => {
                return t.eventId != null && ev.id != null && Number(t.eventId) === Number(ev.id);
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
            <EmptyState message={sportFilter !== "All" ? `No closed tournaments found for ${sportFilter}` : "No closed tournaments found"} />
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
            <EmptyState message={sportFilter !== "All" ? `No completed tournaments found for ${sportFilter}` : "No completed tournaments found"} />
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
  const { user, isAdmin, isSportsAdmin, isSuperAdmin } = useAuth();
  const canAdminRegister = canAdminRegisterProp ?? Boolean(isAdmin || isSportsAdmin || isSuperAdmin);
  const [showStandings, setShowStandings] = useState(false);
  const [showEntryDetails, setShowEntryDetails] = useState(false);
  const [configIds, setConfigIds] = useState<number[]>([]);

  const emoji = getSportEmoji(event.sportName || event.sport?.name);
  const rawStart = event.eventDateStart || matchedTournament?.eventDateStart;
  const rawEnd = event.eventDateEnd || matchedTournament?.eventDateEnd;
  const startDate = rawStart ? new Date(rawStart) : null;
  const endDate = rawEnd ? new Date(rawEnd) : null;

  const { status, isOpen, isClosed, isCompleted, isLive } = getEventEffectiveStatus(event);

  // Resolve format, category, team, partner, and player details strictly for this event
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

  // Single, neat entry summary chip for the compact card view
  const primaryEntrySummary = useMemo(() => {
    if (teamInfo) {
      return {
        icon: Shield,
        colorClass: "border-indigo-200 bg-indigo-50/90 text-indigo-900",
        iconColorClass: "text-indigo-600",
        label: `Team: ${teamInfo.name}`,
        badge: teamInfo.role,
        badgeColorClass: "bg-indigo-200/90 text-indigo-950",
      };
    }
    if (partnerList.length > 0) {
      const p = partnerList[0];
      const isConfirmed = p.status?.toUpperCase() === "CONFIRMED" || p.status?.toUpperCase() === "ACCEPTED";
      return {
        icon: Users,
        colorClass: "border-sky-200 bg-sky-50/90 text-sky-900",
        iconColorClass: "text-sky-600",
        label: `Partner: ${p.name}${p.flat ? ` (${p.flat})` : ""}`,
        badge: isConfirmed ? "Confirmed" : (p.status || "Pending"),
        badgeColorClass: isConfirmed ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-100 text-amber-800 border-amber-300",
      };
    }
    if (isOpenPool) {
      return {
        icon: Users,
        colorClass: "border-amber-200 bg-amber-50/90 text-amber-900",
        iconColorClass: "text-amber-600",
        label: "Open Pool",
        badge: "Seeking Partner",
        badgeColorClass: "bg-amber-200/90 text-amber-950",
      };
    }
    if (familyPlayerList.length > 0) {
      const fp = familyPlayerList[0];
      return {
        icon: User,
        colorClass: "border-violet-200 bg-violet-50/90 text-violet-900",
        iconColorClass: "text-violet-600",
        label: `Player: ${fp.name}`,
        badge: fp.relation || "Family",
        badgeColorClass: "bg-violet-100 text-violet-800 border-violet-300",
      };
    }
    return {
      icon: UserCheck,
      colorClass: "border-emerald-200 bg-emerald-50/90 text-emerald-900",
      iconColorClass: "text-emerald-600",
      label: `Registered: ${user?.fullName || "Self"}`,
      badge: "Confirmed",
      badgeColorClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    };
  }, [teamInfo, partnerList, isOpenPool, familyPlayerList, user?.fullName]);

  useEffect(() => {
    if (showStandings && configIds.length === 0) {
      tournamentService
        .getConfigs()
        .then(configs => {
          const exactConfig = configs.find(c => c.eventId === event.id);
          if (exactConfig) {
            setConfigIds([exactConfig.id]);
          } else {
            const ids = configs
              .filter(c => matchedTournament?.events?.some(e => e.id === c.eventId))
              .map(c => c.id);
            setConfigIds(ids);
          }
        })
        .catch(() => setConfigIds([]));
    }
  }, [showStandings, event.id, matchedTournament, configIds.length]);

  const parentTournamentName = event.tournament?.name;
  const isPartOfNamedTournament = Boolean(parentTournamentName && parentTournamentName.toLowerCase() !== event.name.toLowerCase());

  const EntryIcon = primaryEntrySummary.icon;

  return (
    <article
      className={`group rounded-2xl border bg-white p-4 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 sm:p-5 ${
        isCompleted
          ? "border-slate-200/90 hover:border-slate-300 hover:shadow-md"
          : isClosed
          ? "border-amber-200/90 hover:border-amber-300 hover:shadow-md"
          : "border-slate-200/80 hover:border-indigo-200 hover:shadow-md"
      }`}
    >
      {/* ── Top Header Row ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          {/* Sport Emoji Icon Avatar */}
          <div
            className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl text-base ring-1 transition ${
              isCompleted
                ? "bg-slate-100 ring-slate-200 text-slate-600"
                : isClosed
                ? "bg-amber-50 ring-amber-200 text-amber-700"
                : "bg-emerald-50 ring-emerald-200 text-emerald-700"
            }`}
            onClick={onViewDetails}
            title="Click to view event details and rules"
          >
            <span>{emoji}</span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Title & Core Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                onClick={onViewDetails}
                className="m-0 cursor-pointer truncate text-base font-extrabold tracking-tight text-slate-900 transition-colors hover:text-indigo-700 sm:text-lg"
              >
                {event.name}
              </h3>

              {/* Status Badge */}
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  <CheckCircle2 className="w-3 h-3 text-slate-500" />
                  <span>Completed</span>
                </span>
              ) : isClosed ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span>Closed</span>
                </span>
              ) : isLive ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                  <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                  <span>Live / Ongoing</span>
                </span>
              ) : isOpen ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                  <span>Open</span>
                </span>
              ) : status ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  {status}
                </span>
              ) : null}

              {/* Format Badges */}
              {formatBadges.map(fmt => {
                if (fmt === "SINGLES") {
                  return (
                    <span
                      key="SINGLES"
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700"
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
                      className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700"
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
                      className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700"
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
                      className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700"
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
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  <Award className="w-3 h-3 text-slate-500" />
                  <span>{categoryBadge}</span>
                </span>
              )}
            </div>

            {/* Compact Info Row: Dates, Venue, Parent Tournament & Entry Chip */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
              {startDate && (
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {format(startDate, "MMM d, yyyy")}
                    {endDate && ` - ${format(endDate, "MMM d, yyyy")}`}
                  </span>
                </span>
              )}

              {(event.venueName || event.venue?.name) && (
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{event.venueName || event.venue?.name}</span>
                </span>
              )}

              {isPartOfNamedTournament && (
                <span className="inline-flex items-center gap-1 text-indigo-700 font-medium">
                  <Trophy className="w-3 h-3 text-indigo-500" />
                  <span>Part of {parentTournamentName}</span>
                </span>
              )}

              {/* Clean Single Entry Summary Chip */}
              <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-2xs ${primaryEntrySummary.colorClass}`}>
                <EntryIcon className={`w-3.5 h-3.5 ${primaryEntrySummary.iconColorClass}`} />
                <span>{primaryEntrySummary.label}</span>
                {primaryEntrySummary.badge && (
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border ${primaryEntrySummary.badgeColorClass || "bg-white/80 border-slate-200 text-slate-800"}`}>
                    {primaryEntrySummary.badge}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Prominent CTA on desktop: Match Schedule */}
        <div className="hidden sm:flex shrink-0 items-center">
          <button
            type="button"
            onClick={onViewSchedule}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-200/90 px-3.5 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-2xs active:scale-[0.98]"
            title="View visual bracket and fixtures schedule"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Match Schedule</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Action Toolbar: Dedicated Buttons for Extra Info ────────── */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Button 1: Entry Details Toggle */}
          <button
            type="button"
            onClick={() => setShowEntryDetails(prev => !prev)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all shadow-2xs ${
              showEntryDetails
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            }`}
            title="View player, partner, flat and registration details"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Entry Details</span>
            {registrations && registrations.length > 0 && (
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${showEntryDetails ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-800"}`}>
                {registrations.length}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showEntryDetails ? "rotate-180" : ""}`} />
          </button>

          {/* Button 2: Rules & Details */}
          <button
            type="button"
            onClick={onViewDetails}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
            title="View rules and event description"
          >
            <Info className="h-3.5 w-3.5 text-slate-500" />
            <span>Rules & Info</span>
          </button>

          {/* Button 3: Payment Contacts */}
          {onOpenPaymentContacts && (
            <button
              type="button"
              onClick={() => onOpenPaymentContacts(resolvedTournamentCard)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
              title="View tournament fee payment coordinators & contact details"
            >
              <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
              <span>Payment Contacts</span>
            </button>
          )}

          {/* Button 4: Standings Toggle */}
          <button
            type="button"
            onClick={() => setShowStandings(prev => !prev)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all shadow-2xs ${
              showStandings
                ? "bg-amber-50 text-amber-800 border-amber-300 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            }`}
            title="View points table and standings"
          >
            <TrendingUp className={`w-3.5 h-3.5 ${showStandings ? "text-amber-600" : "text-slate-400"}`} />
            <span>Standings</span>
            <ChevronDown
              size={12}
              className={`transition-transform duration-200 ${showStandings ? "rotate-180" : ""}`}
            />
          </button>

          {/* Sports Admin Options */}
          {canAdminRegister && onRegister && (
            <button
              type="button"
              onClick={onRegister}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-indigo-700"
            >
              <span>Register</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}

          {canAdminRegister && onRegisterOthers && (
            <button
              type="button"
              onClick={onRegisterOthers}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Register Others</span>
            </button>
          )}
        </div>

        {/* Mobile Match Schedule button */}
        <div className="sm:hidden w-full pt-1">
          <button
            type="button"
            onClick={onViewSchedule}
            className="w-full inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-600 hover:text-white"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>View Match Schedule</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Expandable Section: Exact Entry & Participant Details ───── */}
      {showEntryDetails && (
        <div className="mt-3.5 rounded-xl border border-indigo-100/90 bg-slate-50/70 p-3.5 text-xs text-slate-700">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-3">
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <h4 className="font-bold uppercase tracking-wider text-slate-800 text-xs">
                Your Entry Details
              </h4>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              Event #{event.id}
            </span>
          </div>

          {registrations && registrations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {registrations.map((reg, idx) => {
                const pName = reg.playerName || (reg.user?.fullName ?? (user?.fullName || "Self"));
                const rel = reg.relation || (reg.playerName && reg.playerName !== user?.fullName ? "Family Member" : "Self");
                const flat = reg.flatNumber || (reg as any).flatNo || reg.user?.flatNo || (user as any)?.flatNo;
                const partnerName = reg.partnerName || reg.partner?.fullName || reg.partner?.name || reg.partnerFamilyMember?.name;
                const partnerFlat = reg.partnerFlatNumber || reg.partner?.flatNo || (reg.partner as any)?.flatNumber || reg.partnerFamilyMember?.user?.flatNo;
                const partnerStatus = reg.partnerConfirmationStatus || reg.partnerStatus;
                const isPartnerConfirmed = partnerStatus?.toUpperCase() === "CONFIRMED" || partnerStatus?.toUpperCase() === "ACCEPTED";
                const cat = reg.category?.name || (reg as any).categoryName || categoryBadge;
                const fmt = reg.matchFormat || reg.matchType || (reg as any).format || formatBadges[0];
                const team = reg.proposedTeamName || (reg as any).teamName || teamInfo?.name;

                return (
                  <div key={reg.id || idx} className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs space-y-2.5">
                    {/* Participant Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{pName}</span>
                          {rel && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                              {rel}
                            </span>
                          )}
                        </div>
                        {flat && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Flat / Unit: <strong className="font-semibold text-slate-700">{flat}</strong>
                          </div>
                        )}
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border ${
                        reg.status === "CONFIRMED" || reg.status === "REGISTERED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : reg.status === "PENDING"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}>
                        {reg.status || "Registered"}
                      </span>
                    </div>

                    {/* Format & Category */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      {fmt && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          Format: <strong className="font-semibold">{fmt}</strong>
                        </span>
                      )}
                      {cat && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          Category: <strong className="font-semibold">{cat}</strong>
                        </span>
                      )}
                    </div>

                    {/* Partner Info */}
                    {partnerName ? (
                      <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-2 text-[11px]">
                        <div className="font-bold text-sky-950 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-sky-600" />
                            Partner: {partnerName} {partnerFlat ? `(${partnerFlat})` : ""}
                          </span>
                          {partnerStatus && (
                            <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                              isPartnerConfirmed
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : "bg-amber-100 text-amber-800 border-amber-300"
                            }`}>
                              {isPartnerConfirmed ? "Confirmed" : partnerStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (isOpenPool || fmt === "DOUBLES" || fmt === "MIXED_DOUBLES") ? (
                      <div className="rounded-lg border border-amber-100 bg-amber-50/70 p-2 text-[11px] text-amber-900 flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-amber-600" />
                        <span>Open Pool: Looking for partner assignment</span>
                      </div>
                    ) : null}

                    {/* Team Info */}
                    {team && (
                      <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-2 text-[11px] text-indigo-950 flex items-center justify-between">
                        <span className="flex items-center gap-1 font-bold">
                          <Shield className="w-3 h-3 text-indigo-600" />
                          Team: {team}
                        </span>
                        {teamInfo?.role && (
                          <span className="bg-indigo-200/90 text-indigo-950 font-extrabold text-[10px] uppercase px-1.5 py-0.5 rounded">
                            {teamInfo.role}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Registration Footer */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>Reg #{reg.id}</span>
                      {reg.registeredAt && (
                        <span>{format(new Date(reg.registeredAt), "PPp")}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{user?.fullName || "Registered Participant"}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                    Self
                  </span>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Confirmed
                </span>
              </div>
              {teamInfo && (
                <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Team: <strong className="font-semibold text-slate-800">{teamInfo.name}</strong></span>
                  {teamInfo.role && (
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {teamInfo.role}
                    </span>
                  )}
                </div>
              )}
              <div className="text-[11px] text-slate-500 pt-1">
                Event: <strong className="font-medium text-slate-700">{event.name}</strong>
                {categoryBadge && ` · Category: ${categoryBadge}`}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Expandable Section: Live Standings ───────────────────────── */}
      {showStandings && (
        <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          {configIds.length > 0 ? (
            <SportsTournamentStandings configId={configIds[0]} inline />
          ) : (
            <div className="text-xs text-slate-500 py-2.5 text-center font-medium">
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
